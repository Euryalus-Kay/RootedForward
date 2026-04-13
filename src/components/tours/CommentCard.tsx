"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_name: string | null;
    user_id: string;
  };
  currentUserId?: string;
  onDelete: (id: string) => void;
}

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
}

export default function CommentCard({
  comment,
  currentUserId,
  onDelete,
}: CommentCardProps) {
  const displayName = comment.user_name || "Anonymous";
  const firstLetter = displayName.charAt(0).toUpperCase();
  const isOwner = currentUserId === comment.user_id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="group rounded-lg border border-border bg-white/60 p-5 transition-colors hover:bg-white/80"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-cream font-display text-sm font-semibold"
          aria-hidden="true"
        >
          {firstLetter}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-body text-sm font-semibold text-ink">
                {displayName}
              </span>
              <span className="font-body text-xs text-warm-gray">
                {getRelativeTime(comment.created_at)}
              </span>
            </div>

            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                aria-label="Delete your comment"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-warm-gray transition-colors",
                  "opacity-0 group-hover:opacity-100 hover:bg-rust/10 hover:text-rust"
                )}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="mt-2 font-body text-sm leading-relaxed text-ink-light">
            {comment.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
