"use client";

/* ------------------------------------------------------------------ */
/*  ContactForm                                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Submits to /api/submissions, which tries to save to the database */
/*  and send an admin notification email. The endpoint returns 2xx    */
/*  if either channel succeeded.                                        */
/*                                                                     */
/*  If both channels fail (i.e. the server is misconfigured) the      */
/*  endpoint returns 502 with a fallback_email field. We surface that */
/*  to the user as a clickable mailto link that opens their email     */
/*  client with the name, email, and message prefilled, so the user   */
/*  can always deliver their message regardless of server state.       */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";

const FALLBACK_EMAIL = "contact@rooted-forward.org";

interface SubmissionResponse {
  message?: string;
  saved?: boolean;
  emailed?: boolean;
  error?: string;
  hint?: string;
  fallback_email?: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [failureMode, setFailureMode] = useState<null | {
    hint: string;
    mailto: string;
  }>(null);

  function buildMailto(): string {
    const subject = encodeURIComponent(
      `Message from ${formData.name || "a site visitor"}`
    );
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    );
    return `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFailureMode(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      const payload: SubmissionResponse = await res
        .json()
        .catch(() => ({} as SubmissionResponse));

      if (res.ok) {
        toast.success("Message sent. We will get back to you soon.");
        setFormData({ name: "", email: "", message: "" });
        return;
      }

      if (res.status === 400) {
        toast.error(payload.error ?? "Please check the form and try again.");
        return;
      }

      // 502 or other: channel failure. Offer a mailto fallback.
      setFailureMode({
        hint:
          payload.hint ??
          "We could not deliver your message from the server. You can still send it by email.",
        mailto: buildMailto(),
      });
      toast.error(
        "Server delivery failed. Use the email link below to send your message directly."
      );
    } catch {
      // Network error or JSON parse error on a truly broken response.
      setFailureMode({
        hint:
          "Could not reach the server. You can still send your message by email.",
        mailto: buildMailto(),
      });
      toast.error(
        "Could not reach the server. Use the email link below to send your message directly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label
          htmlFor="contact-name"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Name <span className="text-rust">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Email <span className="text-rust">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Message <span className="text-rust">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={6}
          required
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="How can we help? Ask a question, share feedback, or just say hello..."
          className="w-full resize-y rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>

      {/* Mailto fallback surfaced after a delivery failure */}
      {failureMode && (
        <div
          role="alert"
          className="mt-2 rounded-sm border border-rust/40 bg-rust/5 p-4"
        >
          <p className="font-body text-sm leading-relaxed text-ink">
            {failureMode.hint}
          </p>
          <a
            href={failureMode.mailto}
            className="mt-3 inline-flex items-center gap-2 font-body text-sm font-semibold text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
          >
            Open email client and send to {FALLBACK_EMAIL} &rarr;
          </a>
          <p className="mt-2 font-body text-xs text-warm-gray">
            This will open your default mail app with your message prefilled.
          </p>
        </div>
      )}
    </form>
  );
}
