"use client";

/* ------------------------------------------------------------------ */
/*  VolunteerForm                                                      */
/*                                                                     */
/*  Submits to /api/submissions with the volunteer payload. Same      */
/*  delivery semantics as ContactForm, including the mailto fallback  */
/*  when both server channels fail.                                     */
/*                                                                     */
/*  Styling follows the v2 input language: monospace ledger labels    */
/*  over bottom-hairline fields, matching the footer newsletter.      */
/* ------------------------------------------------------------------ */

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";

const CHAPTERS = ["Chicago", "New York", "Dallas", "San Francisco", "Other"];
const FALLBACK_EMAIL = "contact@rooted-forward.org";

const FIELD =
  "w-full border-b border-ink/25 bg-transparent px-0 py-2.5 font-body text-base text-ink placeholder:text-warm-gray-light transition-colors focus:border-rust focus:outline-none";
const LABEL = "ledger block text-ink/55";

interface SubmissionResponse {
  message?: string;
  saved?: boolean;
  emailed?: boolean;
  error?: string;
  hint?: string;
}

function SelectChevron() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-warm-gray"
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="volunteer-name" className={LABEL}>
            Full name <span className="text-rust">*</span>
          </label>
          <input
            id="volunteer-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="Your full name"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="volunteer-email" className={LABEL}>
            Email <span className="text-rust">*</span>
          </label>
          <input
            id="volunteer-email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="you@example.com"
            className={FIELD}
          />
        </div>
      </div>

      {/* Phone + Chapter */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="volunteer-phone" className={LABEL}>
            Phone <span className="normal-case text-warm-gray">(optional)</span>
          </label>
          <input
            id="volunteer-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="(555) 123-4567"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="volunteer-chapter" className={LABEL}>
            Chapter interest <span className="text-rust">*</span>
          </label>
          <div className="relative">
            <select
              id="volunteer-chapter"
              required
              value={formData.chapter}
              onChange={(e) =>
                setFormData({ ...formData, chapter: e.target.value })
              }
              className={`${FIELD} cursor-pointer appearance-none pr-8`}
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
            <SelectChevron />
          </div>
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="volunteer-message" className={LABEL}>
          Why do you want to volunteer?
        </label>
        <textarea
          id="volunteer-message"
          rows={4}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="Tell us a bit about yourself and what draws you to this work."
          className={`${FIELD} resize-y`}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="group mt-1 inline-flex items-center justify-center gap-2 self-start rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit application"}
        <span aria-hidden="true" className="arrow-nudge">
          &rarr;
        </span>
      </button>

      {/* Mailto fallback on delivery failure */}
      {failureMode && (
        <div
          role="alert"
          className="rounded-sm border border-rust/40 bg-rust/5 p-5"
        >
          <p className="font-body text-sm leading-relaxed text-ink">
            {failureMode.hint}
          </p>
          <a
            href={failureMode.mailto}
            className="group mt-3 inline-flex items-center gap-2 font-body text-sm font-semibold text-rust underline decoration-rust/40 underline-offset-2 transition-colors hover:decoration-rust"
          >
            Open email client and send to {FALLBACK_EMAIL}
            <span aria-hidden="true" className="arrow-nudge">
              &rarr;
            </span>
          </a>
          <p className="mt-2 font-body text-xs text-warm-gray">
            This will open your default mail app with your application prefilled.
          </p>
        </div>
      )}
    </form>
  );
}
