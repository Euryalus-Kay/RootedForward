"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

interface CommentFormProps {
  campaignId: string;
  campaignSlug: string;
  commentTemplate?: string | null;
}

export default function CommentForm({
  campaignId,
  campaignSlug,
  commentTemplate,
}: CommentFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [existingComment, setExistingComment] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState(commentTemplate ?? "");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const wordCount = commentBody.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkExisting(session.user.id);
      } else {
        setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkExisting(session.user.id);
      } else {
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [campaignId]);

  async function checkExisting(userId: string) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("public_comments")
        .select("id, comment_body, is_approved")
        .eq("campaign_id", campaignId)
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setExistingComment(data.comment_body);
        setSubmitted(true);
      }
    } catch {
      // Table may not exist
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit() {
    if (!user) return;
    const trimmed = commentBody.trim();
    if (!trimmed) {
      toast.error("Please write your comment before submitting.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/policy/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          comment_body: trimmed,
          is_public: isPublic,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      setSubmitted(true);
      setExistingComment(trimmed);
      toast.success("Your comment has been submitted for review.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit";
      if (message.includes("already")) {
        setSubmitted(true);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div id="comment" className="rounded-sm border border-border bg-cream-dark p-6">
        <p className="font-body text-sm text-warm-gray">Loading&hellip;</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div id="comment" className="rounded-sm border border-border bg-cream-dark p-6">
        <h3 className="font-display text-lg text-forest">Submit Public Comment</h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
          Sign in to submit your comment on this campaign.
        </p>
        <Link
          href={`/auth/login?redirect=/policy/campaigns/${campaignSlug}#comment`}
          className="mt-4 inline-flex items-center rounded-sm bg-rust px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-rust-dark"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div id="comment" className="rounded-sm border border-border bg-cream-dark p-6">
        <h3 className="font-display text-lg text-forest">Comment Submitted</h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
          Your comment is pending review. Once approved, it will appear in the
          public feed below.
        </p>
        {existingComment && (
          <blockquote className="mt-4 border-l-2 border-border pl-4 font-body text-sm italic leading-relaxed text-ink/60">
            {existingComment}
          </blockquote>
        )}
      </div>
    );
  }

  return (
    <div id="comment" className="rounded-sm border border-border bg-cream-dark p-6">
      <h3 className="font-display text-lg text-forest">Submit Public Comment</h3>
      <p className="mt-2 font-body text-sm leading-relaxed text-ink/60">
        Your comment will be reviewed before publication. Approved comments
        are compiled and delivered to the target body.
      </p>
      <textarea
        value={commentBody}
        onChange={(e) => setCommentBody(e.target.value)}
        rows={8}
        className="mt-4 w-full resize-y rounded-sm border border-border bg-cream px-4 py-3 font-body text-sm leading-relaxed text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust/30"
        placeholder="Write your public comment here..."
      />
      <p className="mt-1 font-body text-xs text-warm-gray">
        {wordCount} words &middot; 150&ndash;400 recommended
      </p>
      <label className="mt-3 flex items-center gap-2 font-body text-sm text-ink/75">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
        />
        Share my comment publicly as an example for others
      </label>
      <button
        onClick={handleSubmit}
        disabled={loading || !commentBody.trim()}
        className="mt-5 w-full rounded-sm bg-forest px-5 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
      >
        {loading ? "Submitting\u2026" : "Submit Comment"}
      </button>
    </div>
  );
}
