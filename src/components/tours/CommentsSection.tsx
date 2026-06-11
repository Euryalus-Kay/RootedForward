"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import CommentCard from "./CommentCard";
import type { User } from "@supabase/supabase-js";

interface CommentWithUser {
  id: string;
  content: string;
  created_at: string;
  user_name: string | null;
  user_id: string;
}

interface CommentsSectionProps {
  stopId: string;
}

const MAX_CHARS = 500;

export default function CommentsSection({ stopId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [user, setUser] = useState<User | null>(null);

  /* ---- Auth state ---- */
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ---- Fetch approved comments ---- */
  const fetchComments = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          users ( full_name )
        `
        )
        .eq("stop_id", stopId)
        .eq("approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: CommentWithUser[] = (data ?? []).map((row: Record<string, unknown>) => {
        const usersData = row.users as { full_name: string | null } | null;
        return {
          id: row.id as string,
          content: row.content as string,
          created_at: row.created_at as string,
          user_id: row.user_id as string,
          user_name: usersData?.full_name ?? null,
        };
      });

      setComments(mapped);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [stopId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /* ---- Submit comment ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = content.trim();
    if (!trimmed) {
      toast.error("Please enter a comment");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      toast.error(`Comment must be under ${MAX_CHARS} characters`);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("comments").insert({
        stop_id: stopId,
        user_id: user.id,
        content: trimmed,
      });

      if (error) throw error;

      setContent("");
      toast.success("Your comment is pending review");
    } catch {
      toast.error("Failed to submit comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Delete comment ---- */
  const handleDelete = async (commentId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id ?? "");

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isNearLimit = charCount > MAX_CHARS * 0.9;

  return (
    <section className="mt-14 border-t border-border pt-10">
      <div className="flex items-center gap-3 mb-8">
        <MessageCircle className="h-6 w-6 text-forest" />
        <h2 className="font-display text-2xl text-forest">Comments</h2>
        {comments.length > 0 && (
          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 font-body text-xs font-semibold text-forest">
            {comments.length}
          </span>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="mb-10 rounded-lg border border-border bg-white/60 p-6">
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="comment-input" className="sr-only">
              Add a comment
            </label>
            <div className="relative">
              <textarea
                id="comment-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts or reflections on this stop..."
                rows={4}
                maxLength={MAX_CHARS + 50}
                disabled={submitting}
                className={cn(
                  "w-full resize-none rounded-lg border bg-cream px-4 py-3 font-body text-sm text-ink placeholder:text-warm-gray",
                  "transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isOverLimit ? "border-rust" : "border-border"
                )}
              />
              {/* Character counter */}
              <div className="absolute bottom-3 right-3">
                <span
                  className={cn(
                    "font-body text-xs tabular-nums",
                    isOverLimit
                      ? "text-rust font-semibold"
                      : isNearLimit
                        ? "text-rust-light"
                        : "text-warm-gray-light"
                  )}
                >
                  {charCount}/{MAX_CHARS}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || isOverLimit || !content.trim()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-rust px-5 py-2.5 font-body text-sm font-medium text-white",
                  "transition-colors hover:bg-rust/90 active:bg-rust/80",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Comment
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MessageCircle className="h-8 w-8 text-warm-gray-light" />
            <p className="font-body text-sm text-warm-gray">
              Want to share your thoughts?
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
            >
              Sign in to leave a comment
            </Link>
          </div>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-forest" />
        </div>
      ) : comments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-border bg-white/40 p-10 text-center"
        >
          <MessageCircle className="mx-auto h-10 w-10 text-warm-gray-light" />
          <p className="mt-3 font-body text-warm-gray">
            No comments yet. Be the first to share your thoughts.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={user?.id}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
