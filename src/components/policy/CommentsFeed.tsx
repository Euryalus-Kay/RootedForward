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
      <div className="flex items-center gap-3">
        <span className="font-body text-xs text-warm-gray">Sort by:</span>
        <button
          onClick={() => setSortOrder("newest")}
          className={`font-body text-xs transition-colors ${
            sortOrder === "newest"
              ? "font-semibold text-forest"
              : "text-warm-gray hover:text-ink"
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setSortOrder("oldest")}
          className={`font-body text-xs transition-colors ${
            sortOrder === "oldest"
              ? "font-semibold text-forest"
              : "text-warm-gray hover:text-ink"
          }`}
        >
          Oldest
        </button>
      </div>

      {/* Comments */}
      <div className="mt-6 flex flex-col">
        {visible.map((comment, i) => (
          <div key={comment.id}>
            {i > 0 && <hr className="my-6 border-border" />}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-body text-sm font-medium text-ink">
                  {comment.user_name}
                </span>
                <span className="font-body text-xs text-warm-gray">
                  {comment.neighborhood}
                </span>
              </div>
              <p className="mt-0.5 font-body text-xs text-warm-gray-light">
                {formatDate(comment.created_at)}
              </p>
              <blockquote className="mt-3 font-body text-sm leading-relaxed text-ink/75">
                {comment.comment_body}
              </blockquote>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + 5)}
          className="mt-8 font-body text-sm font-medium text-rust transition-colors hover:text-rust-dark"
        >
          Load more comments
        </button>
      )}
    </div>
  );
}
