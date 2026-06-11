"use client";

import { useState } from "react";
import type { ApprovedComment } from "@/lib/policy-constants";

interface CommentsFeedProps {
  comments: ApprovedComment[];
}

export default function CommentsFeed({ comments: initial }: CommentsFeedProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [visibleCount, setVisibleCount] = useState(5);

  const sorted = [...initial].sort((a, b) => {
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? db - da : da - db;
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  function formatDate(dateString: string): string {
    const d = new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (initial.length === 0) {
    return (
      <div className="py-8">
        <p className="font-body text-sm text-warm-gray">
          No public comments yet. Be the first to submit one.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-baseline gap-5 border-b border-border pb-4">
        <span className="ledger text-warm-gray">Sort</span>
        <button
          onClick={() => setSortOrder("newest")}
          className={`ledger transition-colors ${
            sortOrder === "newest"
              ? "text-rust"
              : "text-warm-gray hover:text-ink"
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setSortOrder("oldest")}
          className={`ledger transition-colors ${
            sortOrder === "oldest"
              ? "text-rust"
              : "text-warm-gray hover:text-ink"
          }`}
        >
          Oldest
        </button>
      </div>

      {/* Comments */}
      <div className="flex flex-col">
        {visible.map((comment) => (
          <div key={comment.id} className="border-b border-border py-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-body text-sm font-medium text-ink">
                {comment.user_name}
              </span>
              {comment.neighborhood && (
                <span className="ledger text-rust">
                  {comment.neighborhood}
                </span>
              )}
              <span className="ledger text-warm-gray-light">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <blockquote className="mt-3 max-w-[62ch] font-body text-sm leading-relaxed text-ink/75">
              {comment.comment_body}
            </blockquote>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + 5)}
          className="group mt-7 inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
        >
          Load more comments
          <span aria-hidden="true" className="arrow-nudge">&darr;</span>
        </button>
      )}
    </div>
  );
}
