"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface CommentRow {
  id: string;
  comment_body: string;
  is_approved: boolean;
  is_public: boolean;
  submitted_to_target: boolean;
  created_at: string;
  users: { full_name: string | null } | null;
}

type Tab = "pending" | "approved" | "submitted";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");

  useEffect(() => {
    fetchComments();
  }, [tab]);

  async function fetchComments() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("public_comments")
        .select("id, comment_body, is_approved, is_public, submitted_to_target, created_at, users(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (tab === "pending") {
        query = query.eq("is_approved", false);
      } else if (tab === "approved") {
        query = query.eq("is_approved", true).eq("submitted_to_target", false);
      } else {
        query = query.eq("submitted_to_target", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      setComments((data as unknown as CommentRow[]) ?? []);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("Delete this comment permanently?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("public_comments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      fetchComments();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function approveComment(id: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("public_comments")
        .update({ is_approved: true, approved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Comment approved");
      fetchComments();
    } catch {
      toast.error("Failed to approve");
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "submitted", label: "Submitted" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">
        Policy Comments
      </h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 font-body text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-rust text-rust"
                : "text-warm-gray hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 font-body text-sm text-warm-gray">Loading&hellip;</p>
      ) : comments.length === 0 ? (
        <p className="mt-8 font-body text-sm text-warm-gray">
          No comments in this category.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-border bg-cream p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-body text-sm font-medium text-ink">
                  {c.users?.full_name ?? "Anonymous"}
                </p>
                <p className="font-body text-xs text-warm-gray">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
                {c.comment_body}
              </p>
              {tab === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => approveComment(c.id)}
                    className="rounded bg-forest/10 px-3 py-1 font-body text-xs font-medium text-forest transition-colors hover:bg-forest/20"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="rounded bg-rust/10 px-3 py-1 font-body text-xs font-medium text-rust transition-colors hover:bg-rust/20"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
