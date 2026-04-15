"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface DraftRow {
  id: string;
  guide_title: string;
  guide_slug: string;
  draft_body: string;
  status: string;
  created_at: string;
  users: { full_name: string | null; email: string } | null;
}

type Tab = "pending" | "in_review" | "reviewed" | "closed";

const STATUS_OPTIONS = ["pending", "in_review", "reviewed", "closed"];

export default function AdminDraftsPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, [tab]);

  async function fetchDrafts() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("draft_reviews")
        .select("*, users(full_name, email)")
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setDrafts((data as unknown as DraftRow[]) ?? []);
    } catch {
      toast.error("Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("draft_reviews")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Status updated to ${status.replace("_", " ")}`);
      fetchDrafts();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function sendReply(draftId: string) {
    const body = replyText[draftId]?.trim();
    if (!body) return;
    setReplying(draftId);
    try {
      const res = await fetch(`/api/policy/drafts/${draftId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed");
      setReplyText((prev) => ({ ...prev, [draftId]: "" }));
      toast.success("Feedback sent");
      // Also set status to in_review if currently pending
      const draft = drafts.find((d) => d.id === draftId);
      if (draft?.status === "pending") {
        updateStatus(draftId, "in_review");
      }
    } catch {
      toast.error("Failed to send feedback");
    } finally {
      setReplying(null);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "in_review", label: "In Review" },
    { key: "reviewed", label: "Reviewed" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">
        Draft Reviews
      </h1>
      <p className="mt-1 font-body text-sm text-warm-gray">
        Review drafts submitted by users from the Learning Zone guides.
      </p>

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
        <p className="mt-8 font-body text-sm text-warm-gray">Loading...</p>
      ) : drafts.length === 0 ? (
        <p className="mt-8 font-body text-sm text-warm-gray">
          No drafts in this category.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-lg border border-border bg-cream"
            >
              {/* Header row */}
              <div
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() =>
                  setExpanded(expanded === draft.id ? null : draft.id)
                }
              >
                <div className="flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {draft.guide_title}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-warm-gray">
                    {draft.users?.full_name ?? draft.users?.email ?? "Anonymous"}{" "}
                    &middot;{" "}
                    {new Date(draft.created_at).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={draft.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStatus(draft.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border border-border bg-cream px-2 py-1 font-body text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust/30"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expanded detail */}
              {expanded === draft.id && (
                <div className="border-t border-border px-5 py-4">
                  {/* Draft content */}
                  <div className="rounded border border-border bg-cream-dark p-4">
                    <p className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                      User&rsquo;s draft
                    </p>
                    <div className="mt-2 whitespace-pre-wrap font-body text-sm leading-relaxed text-ink/80">
                      {draft.draft_body}
                    </div>
                  </div>

                  {/* Reply area */}
                  <div className="mt-4">
                    <textarea
                      value={replyText[draft.id] ?? ""}
                      onChange={(e) =>
                        setReplyText((prev) => ({
                          ...prev,
                          [draft.id]: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full resize-y rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                      placeholder="Write feedback for the user..."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => sendReply(draft.id)}
                        disabled={
                          !replyText[draft.id]?.trim() ||
                          replying === draft.id
                        }
                        className="rounded bg-forest px-4 py-2 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-40"
                      >
                        {replying === draft.id
                          ? "Sending..."
                          : "Send Feedback"}
                      </button>
                      <button
                        onClick={() => updateStatus(draft.id, "reviewed")}
                        className="rounded border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
                      >
                        Mark as Reviewed
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
