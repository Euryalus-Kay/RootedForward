"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import PageTransition from "@/components/layout/PageTransition";
import { useParams } from "next/navigation";

interface DraftReview {
  id: string;
  guide_slug: string;
  guide_title: string;
  draft_body: string;
  status: string;
  created_at: string;
}

interface DraftComment {
  id: string;
  body: string;
  is_admin: boolean;
  created_at: string;
  users: { full_name: string | null; role: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for review",
  in_review: "Being reviewed",
  reviewed: "Feedback ready",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warm-gray/15 text-warm-gray",
  in_review: "bg-rust/15 text-rust",
  reviewed: "bg-forest/15 text-forest",
  closed: "bg-warm-gray/10 text-warm-gray",
};

export default function DraftDetailPage() {
  const params = useParams();
  const draftId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<DraftReview | null>(null);
  const [comments, setComments] = useState<DraftComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const fetchDraft = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("draft_reviews" as never)
        .select("*")
        .eq("id", draftId)
        .single();
      if (error) throw error;
      setDraft(data as DraftReview);
    } catch {
      // Draft not found or no access
    }
  }, [draftId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/policy/drafts/${draftId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // ignore
    }
  }, [draftId]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchDraft(), fetchComments()]);
      setLoading(false);
    }
    load();
  }, [fetchDraft, fetchComments]);

  async function handleSubmitComment() {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/policy/drafts/${draftId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      setNewComment("");
      toast.success("Comment added");
      fetchComments();
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <PageTransition>
        <section className="bg-cream py-28 md:py-36">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-body text-sm text-warm-gray">Loading...</p>
          </div>
        </section>
      </PageTransition>
    );
  }

  if (!draft) {
    return (
      <PageTransition>
        <section className="bg-cream py-28 md:py-36">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="font-display text-2xl text-forest">
              Draft not found
            </h1>
            <p className="mt-4 font-body text-base text-ink/70">
              This draft may have been removed, or you may not have access to
              view it. Sign in to see your submitted drafts.
            </p>
            <Link
              href="/policy"
              className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
            >
              Back to Policy
            </Link>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="bg-cream pb-20 pt-28 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-3xl px-6">
          {/* Breadcrumb */}
          <nav className="font-body text-xs text-warm-gray">
            <Link href="/policy" className="hover:text-forest">
              Policy
            </Link>
            {" / "}
            <span className="text-ink/50">Draft Review</span>
          </nav>

          {/* Header */}
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl text-forest md:text-3xl">
                Your Draft
              </h1>
              <p className="mt-1 font-body text-sm text-warm-gray">
                For: {draft.guide_title}
              </p>
              <p className="mt-0.5 font-body text-xs text-warm-gray">
                Submitted {formatDate(draft.created_at)}
              </p>
            </div>
            <span
              className={`flex-shrink-0 rounded-full px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[draft.status] ?? STATUS_COLORS.pending}`}
            >
              {STATUS_LABELS[draft.status] ?? draft.status}
            </span>
          </div>

          <hr className="my-8 border-border" />

          {/* Draft content */}
          <div className="rounded-sm border border-border bg-cream-dark p-6">
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Your draft
            </p>
            <div className="mt-3 whitespace-pre-wrap font-body text-sm leading-relaxed text-ink/80">
              {draft.draft_body}
            </div>
          </div>

          {/* Comments / feedback thread */}
          <div className="mt-10">
            <h2 className="font-display text-xl text-forest">
              Feedback
            </h2>

            {comments.length === 0 ? (
              <p className="mt-4 font-body text-sm text-warm-gray">
                No feedback yet. A Rooted Forward team member will review your
                draft and leave comments here.
              </p>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-sm border p-5 ${
                      comment.is_admin
                        ? "border-forest/20 bg-forest/[0.03]"
                        : "border-border bg-cream-dark"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-body text-sm font-medium text-ink">
                        {comment.users?.full_name ?? "Anonymous"}
                      </span>
                      {comment.is_admin && (
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-forest">
                          Reviewer
                        </span>
                      )}
                      <span className="font-body text-xs text-warm-gray">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply form */}
            {user && (
              <div className="mt-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm leading-relaxed text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
                  placeholder="Add a reply or question..."
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || sending}
                  className="mt-3 rounded-sm bg-forest px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Post Reply"}
                </button>
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="mt-12">
            <Link
              href={`/policy/guides/${draft.guide_slug}`}
              className="font-body text-sm font-semibold uppercase tracking-widest text-rust"
            >
              Back to guide
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
