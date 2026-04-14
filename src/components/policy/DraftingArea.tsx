"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface DraftingAreaProps {
  guideTitle: string;
  /** Optional starter template text */
  template?: string;
}

export default function DraftingArea({ guideTitle, template }: DraftingAreaProps) {
  const [draft, setDraft] = useState(template ?? "");
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy — try selecting the text manually");
    }
  }

  async function handleRequestReview() {
    if (!draft.trim()) {
      toast.error("Write your draft first before requesting a review.");
      return;
    }
    setSending(true);
    try {
      // Submit as a proposal-style submission for admin review
      const res = await fetch("/api/policy/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_title: `Draft review request: ${guideTitle}`,
          problem_description: draft,
          proposed_solution: "User is requesting a review of their draft from a Rooted Forward team member.",
          evidence_sources: "",
          wants_to_collaborate: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setRequestSent(true);
      toast.success("Review request sent. We'll get back to you.");
    } catch {
      toast.error("Failed to send request. Try copying your draft and emailing us instead.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-16 rounded-sm border-2 border-border bg-cream-dark p-6 md:p-8">
      <h2 className="font-display text-xl text-forest">
        Draft It Here
      </h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
        Use the space below to write your draft. When you&rsquo;re done, copy
        it to send yourself or request a Rooted Forward member to review it
        before you submit.
      </p>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={10}
        className="mt-4 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm leading-relaxed text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
        placeholder="Start writing your draft here..."
      />

      <div className="mt-2 flex items-center justify-between">
        <p className="font-body text-xs text-warm-gray">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          disabled={!draft.trim()}
          className="inline-flex items-center rounded-sm border-2 border-forest px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-forest"
        >
          {copied ? "Copied" : "Copy to Clipboard"}
        </button>

        {requestSent ? (
          <span className="inline-flex items-center px-5 py-2.5 font-body text-sm text-warm-gray">
            Review requested &mdash; we&rsquo;ll be in touch
          </span>
        ) : (
          <button
            onClick={handleRequestReview}
            disabled={!draft.trim() || sending}
            className="inline-flex items-center rounded-sm bg-rust px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-40"
          >
            {sending ? "Sending\u2026" : "Request a Review"}
          </button>
        )}
      </div>

      <p className="mt-4 font-body text-xs leading-relaxed text-ink/50">
        &ldquo;Request a Review&rdquo; sends your draft to a Rooted Forward
        team member who can give feedback before you submit it officially. You
        can also copy your draft and email it to{" "}
        <a
          href="mailto:policy@rootedforward.org"
          className="text-rust underline underline-offset-2"
        >
          policy@rootedforward.org
        </a>
        .
      </p>
    </div>
  );
}
