"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";

const CHAPTERS = ["Chicago", "New York", "Dallas", "San Francisco", "Other"];
const FALLBACK_EMAIL = "contact@rooted-forward.org";

interface SubmissionResponse {
  message?: string;
  saved?: boolean;
  emailed?: boolean;
  error?: string;
  hint?: string;
}

export default function VolunteerForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    chapter: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [failureMode, setFailureMode] = useState<null | {
    hint: string;
    mailto: string;
  }>(null);

  function buildMailto(): string {
    const subject = encodeURIComponent(
      `Volunteer application from ${formData.name || "a site visitor"}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        formData.phone && `Phone: ${formData.phone}`,
        formData.chapter && `Chapter: ${formData.chapter}`,
        "",
        formData.message,
      ]
        .filter(Boolean)
        .join("\n")
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
          type: "volunteer",
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          chapter: formData.chapter || null,
          message: formData.message || null,
        }),
      });

      const payload: SubmissionResponse = await res
        .json()
        .catch(() => ({} as SubmissionResponse));

      if (res.ok) {
        toast.success("Thank you. We will be in touch soon.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          chapter: "",
          message: "",
        });
        return;
      }

      if (res.status === 400) {
        toast.error(payload.error ?? "Please check the form and try again.");
        return;
      }

      setFailureMode({
        hint:
          payload.hint ??
          "We could not deliver your application from the server. You can still send it by email.",
        mailto: buildMailto(),
      });
      toast.error(
        "Server delivery failed. Use the email link below to send your application directly."
      );
    } catch {
      setFailureMode({
        hint:
          "Could not reach the server. You can still send your application by email.",
        mailto: buildMailto(),
      });
      toast.error(
        "Could not reach the server. Use the email link below to send your application directly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Full Name */}
      <div>
        <label
          htmlFor="volunteer-name"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Full Name <span className="text-rust">*</span>
        </label>
        <input
          id="volunteer-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your full name"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="volunteer-email"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Email <span className="text-rust">*</span>
        </label>
        <input
          id="volunteer-email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="volunteer-phone"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Phone <span className="font-normal text-warm-gray">(optional)</span>
        </label>
        <input
          id="volunteer-phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(555) 123-4567"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Chapter Interest */}
      <div>
        <label
          htmlFor="volunteer-chapter"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Chapter Interest <span className="text-rust">*</span>
        </label>
        <select
          id="volunteer-chapter"
          required
          value={formData.chapter}
          onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        >
          <option value="" disabled>
            Select a chapter
          </option>
          {CHAPTERS.map((chapter) => (
            <option key={chapter} value={chapter}>
              {chapter}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="volunteer-message"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Why do you want to volunteer?
        </label>
        <textarea
          id="volunteer-message"
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Tell us a bit about yourself and what draws you to this work..."
          className="w-full resize-y rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Application"}
      </button>

      {/* Mailto fallback on delivery failure */}
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
            This will open your default mail app with your application prefilled.
          </p>
        </div>
      )}
    </form>
  );
}
