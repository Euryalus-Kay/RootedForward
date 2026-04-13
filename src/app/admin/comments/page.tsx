"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import {
  Check,
  Trash2,
  Loader2,
  MessageSquare,
  CheckCheck,
  Clock,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

type TabFilter = "pending" | "approved" | "all";

interface CommentRow {
  id: string;
  content: string;
  approved: boolean;
  created_at: string;
  stop_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  stop_title: string | null;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  /* ---- Fetch all comments ---- */
  const fetchComments = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          approved,
          created_at,
          stop_id,
          user_id,
          users ( full_name, email ),
          tour_stops ( title )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: CommentRow[] = (data ?? []).map((row: Record<string, unknown>) => {
        const usersData = row.users as { full_name: string | null; email: string } | null;
        const stopData = row.tour_stops as { title: string } | null;
        return {
          id: row.id as string,
          content: row.content as string,
          approved: row.approved as boolean,
          created_at: row.created_at as string,
          stop_id: row.stop_id as string,
          user_id: row.user_id as string,
          user_name: usersData?.full_name ?? null,
          user_email: usersData?.email ?? null,
          stop_title: stopData?.title ?? null,
        };
      });

      setComments(mapped);
    } catch {
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /* ---- Filter ---- */
  const filteredComments = comments.filter((c) => {
    if (activeTab === "pending") return !c.approved;
    if (activeTab === "approved") return c.approved;
    return true;
  });

  const pendingCount = comments.filter((c) => !c.approved).length;
  const approvedCount = comments.filter((c) => c.approved).length;

  /* ---- Approve single ---- */
  const handleApprove = async (commentId: string) => {
    setProcessingIds((prev) => new Set(prev).add(commentId));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .update({ approved: true })
        .eq("id", commentId);

      if (error) throw error;

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, approved: true } : c))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      toast.success("Comment approved");
    } catch {
      toast.error("Failed to approve comment");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  /* ---- Delete single ---- */
  const handleDelete = async (commentId: string) => {
    setProcessingIds((prev) => new Set(prev).add(commentId));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  /* ---- Batch approve ---- */
  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    ids.forEach((id) =>
      setProcessingIds((prev) => new Set(prev).add(id))
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .update({ approved: true })
        .in("id", ids);

      if (error) throw error;

      setComments((prev) =>
        prev.map((c) =>
          ids.includes(c.id) ? { ...c, approved: true } : c
        )
      );
      setSelectedIds(new Set());
      toast.success(`${ids.length} comment${ids.length !== 1 ? "s" : ""} approved`);
    } catch {
      toast.error("Failed to batch approve comments");
    } finally {
      setProcessingIds(new Set());
    }
  };

  /* ---- Selection helpers ---- */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllPending = () => {
    const pendingIds = filteredComments
      .filter((c) => !c.approved)
      .map((c) => c.id);
    setSelectedIds(new Set(pendingIds));
  };

  /* ---- Tab config ---- */
  const tabs: { key: TabFilter; label: string; count: number; icon: React.ReactNode }[] = [
    {
      key: "pending",
      label: "Pending Review",
      count: pendingCount,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      key: "approved",
      label: "Approved",
      count: approvedCount,
      icon: <CheckCheck className="h-4 w-4" />,
    },
    {
      key: "all",
      label: "All",
      count: comments.length,
      icon: <Filter className="h-4 w-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            Comment Moderation
          </h1>
          <p className="text-sm text-warm-gray">
            Review, approve, or remove user comments
          </p>
        </div>

        {activeTab === "pending" && selectedIds.size > 0 && (
          <button
            onClick={handleBatchApprove}
            className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
          >
            <CheckCheck className="h-4 w-4" />
            Approve Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-cream-dark p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSelectedIds(new Set());
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-ink shadow-sm"
                : "text-warm-gray hover:text-ink"
            )}
          >
            {tab.icon}
            {tab.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs",
                activeTab === tab.key
                  ? "bg-forest/10 text-forest"
                  : "bg-warm-gray-light/30 text-warm-gray"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Select All for pending */}
      {activeTab === "pending" && pendingCount > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={selectAllPending}
            className="font-body text-xs font-semibold uppercase tracking-wider text-forest transition-colors hover:text-forest-light"
          >
            Select All Pending
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setSelectedIds(new Set())}
              className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray transition-colors hover:text-ink"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-warm-gray-light" />
          <p className="mt-3 text-warm-gray">
            No {activeTab === "all" ? "" : activeTab + " "}comments found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => {
            const isProcessing = processingIds.has(comment.id);
            const isSelected = selectedIds.has(comment.id);

            return (
              <div
                key={comment.id}
                className={cn(
                  "rounded-xl border bg-white/60 p-5 transition-colors",
                  isSelected ? "border-forest bg-forest/5" : "border-border",
                  isProcessing && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Selection checkbox (pending tab only) */}
                  {activeTab === "pending" && !comment.approved && (
                    <label className="mt-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(comment.id)}
                        disabled={isProcessing}
                        className="h-4 w-4 rounded border-border text-forest focus:ring-forest"
                      />
                    </label>
                  )}

                  {/* Comment body */}
                  <div className="min-w-0 flex-1">
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-body text-sm font-semibold text-ink">
                        {comment.user_name || "Anonymous"}
                      </span>
                      {comment.user_email && (
                        <span className="font-body text-xs text-warm-gray">
                          {comment.user_email}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          comment.approved
                            ? "bg-forest/10 text-forest"
                            : "bg-rust/10 text-rust"
                        )}
                      >
                        {comment.approved ? "Approved" : "Pending"}
                      </span>
                    </div>

                    {/* Stop reference */}
                    {comment.stop_title && (
                      <p className="mt-1 font-body text-xs text-warm-gray">
                        on{" "}
                        <span className="font-medium text-ink-light">
                          {comment.stop_title}
                        </span>
                      </p>
                    )}

                    {/* Content */}
                    <p className="mt-3 font-body text-sm leading-relaxed text-ink-light">
                      {comment.content}
                    </p>

                    {/* Timestamp */}
                    <p className="mt-2 font-body text-xs text-warm-gray-light">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {!comment.approved && (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        disabled={isProcessing}
                        title="Approve"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-forest transition-colors hover:bg-forest/10 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={isProcessing}
                      title="Delete"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-rust transition-colors hover:bg-rust/10 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
