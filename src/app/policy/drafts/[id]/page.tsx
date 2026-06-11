"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
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

const STATUS_TONES: Record<string, string> = {
  pending: "text-warm-gray",
  in_review: "text-rust",
  reviewed: "text-grade-a",
  closed: "text-warm-gray",
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
        .from("draft_reviews")
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
        <PageBanner compact eyebrow="Policy / Draft Review" title="Draft Review" />
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <p className="font-body text-sm text-warm-gray">Loading...</p>
          </div>
        </section>
      </PageTransition>
    );
  }

  if (!draft) {
    return (
      <PageTransition>
        <PageBanner compact eyebrow="Policy / Draft Review" title="Draft not found" />
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <p className="font-body text-base leading-relaxed text-ink/70">
              This draft may have been removed, or you may not have access to
              view it. Sign in to see your submitted drafts.
            </p>
            <Link
              href="/policy"
              className="group mt-7 inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust"
            >
              Back to Policy
              <span aria-hidden="true" className="arrow-nudge">&rarr;</span>
            </Link>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageBanner
        compact
        eyebrow="Policy / Draft Review"
        title="Your Draft"
        meta={[
          `For ${draft.guide_title}`,
          `Submitted ${formatDate(draft.created_at)}`,
        ]}
      />

      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Status row */}
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-5">
            <span className="ledger text-warm-gray">Status</span>
            <span
              className={`ledger ${STATUS_TONES[draft.status] ?? STATUS_TONES.pending}`}
            >
              {STATUS_LABELS[draft.status] ?? draft.status}
            </span>
          </div>

          {/* Draft content */}
          <div className="mt-8 border border-border bg-white/40 p-7">
            <p className="ledger text-warm-gray">Your draft</p>
            <div className="mt-4 whitespace-pre-wrap font-body text-sm leading-relaxed text-ink/80">
              {draft.draft_body}
            </div>
          </div>

          {/* Comments / feedback thread */}
          <div className="mt-12">
            <p className="ledger text-warm-gray">Review thread</p>
            <h2 className="mt-2 font-display text-2xl text-forest">
              Feedback
            </h2>

            {comments.length === 0 ? (
              <p className="mt-5 font-body text-sm leading-relaxed text-warm-gray">
                No feedback yet. A Rooted Forward team member will review your
                draft and leave comments here.
              </p>
            ) : (
              <div className="mt-7 border-t border-border">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`border-b border-border py-5 ${
                      comment.is_admin ? "md:pl-4 md:border-l-2 md:border-l-forest/30" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-body text-sm font-medium text-ink">
                        {comment.users?.full_name ?? "Anonymous"}
                      </span>
                      {comment.is_admin && (
                        <span className="ledger text-forest">Reviewer</span>
                      )}
                      <span className="ledger text-warm-gray-light">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-2.5 font-body text-sm leading-relaxed text-ink/75">
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Reply form */}
            {user && (
              <div className="mt-8">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-sm border border-border bg-white/40 px-4 py-3 font-body text-sm leading-relaxed text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
                  placeholder="Add a reply or question..."
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || sending}
                  className="mt-3 rounded-sm bg-forest px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Post Reply"}
                </button>
              </div>
            )}
          </div>

          {/* Back link */}
          <div className="mt-14 border-t border-border pt-8">
            <Link
              href={`/policy/guides/${draft.guide_slug}`}
              className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust"
            >
              Back to guide
              <span aria-hidden="true" className="arrow-nudge">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
