"use client";

/* ------------------------------------------------------------------ */
/*  Moderation queue for exhibit visitor submissions (the answer wall  */
/*  now; memorial and oral-history stations later). Same shape as the  */
/*  comments queue: tabs by status, bulk select, per-row processing    */
/*  spinners, toasts. Everything a visitor writes lands here as        */
/*  pending or flagged and appears on the wall only after Approve.     */
/*  If migration 008 has not been applied yet, the page says so and    */
/*  points at the file instead of erroring.                            */
/* ------------------------------------------------------------------ */

import { useEffect, useState, useCallback } from "react";
import { createClient, isSupabaseConfiguredClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Loader2,
  Landmark,
  CheckCheck,
  Clock,
  Flag,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";

type Status = "pending" | "flagged" | "approved" | "rejected";
type KindFilter = "all" | "answer_wall" | "memorial" | "oral_history";

interface SubmissionRow {
  id: string;
  exhibit_slug: string;
  kind: string;
  prompt_id: string;
  body: string;
  display_name: string | null;
  status: Status;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

const STATUS_TABS: { key: Status; label: string; icon: React.ReactNode }[] = [
  { key: "pending", label: "Pending", icon: <Clock className="h-4 w-4" /> },
  { key: "flagged", label: "Flagged", icon: <Flag className="h-4 w-4" /> },
  { key: "approved", label: "Approved", icon: <CheckCheck className="h-4 w-4" /> },
  { key: "rejected", label: "Rejected", icon: <Archive className="h-4 w-4" /> },
];

const KIND_LABELS: Record<string, string> = {
  answer_wall: "Answer wall",
  memorial: "Memorial",
  oral_history: "Oral history",
};

const KIND_CHIPS: { key: KindFilter; label: string }[] = [
  { key: "all", label: "All kinds" },
  { key: "answer_wall", label: "Answer wall" },
  { key: "memorial", label: "Memorial" },
  { key: "oral_history", label: "Oral history" },
];

/** compact age. "3m", "2h", "5d", then a date */
function age(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** migration 008 not applied yet */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("exhibit_submissions") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

export default function AdminExhibitPage() {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  /* ---- Load the queue ---- */
  const fetchRows = useCallback(async () => {
    if (!isSupabaseConfiguredClient()) {
      setTableMissing(true);
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exhibit_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (isMissingTable(error)) {
          setTableMissing(true);
          return;
        }
        throw error;
      }
      setRows((data ?? []) as SubmissionRow[]);
    } catch {
      toast.error("Failed to load exhibit submissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!isSupabaseConfiguredClient()) return;
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
      .catch(() => setUserId(null));
  }, []);

  /* ---- Filters ---- */
  const filtered = rows.filter(
    (r) => r.status === activeTab && (kindFilter === "all" || r.kind === kindFilter)
  );
  const countOf = (s: Status) =>
    rows.filter((r) => r.status === s && (kindFilter === "all" || r.kind === kindFilter)).length;

  /* ---- Moderate (single or bulk) ---- */
  const moderate = async (ids: string[], status: "approved" | "rejected") => {
    if (ids.length === 0) return;
    setProcessingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("exhibit_submissions")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .in("id", ids);

      if (error) throw error;

      setRows((prev) =>
        prev.map((r) =>
          ids.includes(r.id)
            ? { ...r, status, reviewed_at: new Date().toISOString(), reviewed_by: userId }
            : r
        )
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(
        `${ids.length} ${ids.length === 1 ? "entry" : "entries"} ${status}`
      );
    } catch {
      toast.error(`Failed to mark ${status}`);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  /* ---- Selection ---- */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllVisible = () => setSelectedIds(new Set(filtered.map((r) => r.id)));

  const inQueue = activeTab === "pending" || activeTab === "flagged";

  /* ---- Migration not applied yet ---- */
  if (!loading && tableMissing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">Exhibit Wall</h1>
          <p className="text-sm text-warm-gray">
            Visitor submissions from The Ground Keeps Moving
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white/60 p-10 text-center">
          <Landmark className="mx-auto h-10 w-10 text-warm-gray-light" />
          <h2 className="mt-4 font-display text-lg font-semibold text-forest">
            The collection table is not installed yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-warm-gray">
            Visitor answers will land here for review once the exhibit_submissions table
            exists. Run the migration below in the Supabase SQL editor, the same way
            migration 006 was applied, then reload this page.
          </p>
          <code className="mt-4 inline-block rounded bg-cream-dark px-3 py-1.5 text-xs text-ink">
            supabase/migrations/008_exhibit.sql
          </code>
        </div>
      </div>
    );
  }

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
          <h1 className="font-display text-2xl font-bold text-forest">Exhibit Wall</h1>
          <p className="text-sm text-warm-gray">
            Review visitor answers before they join the wall
          </p>
        </div>

        {inQueue && selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => moderate(Array.from(selectedIds), "approved")}
              className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
            >
              <CheckCheck className="h-4 w-4" />
              Approve ({selectedIds.size})
            </button>
            <button
              onClick={() => moderate(Array.from(selectedIds), "rejected")}
              className="flex items-center gap-2 rounded-lg border border-rust px-4 py-2.5 text-sm font-medium text-rust transition-colors hover:bg-rust/10"
            >
              <X className="h-4 w-4" />
              Reject ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-lg bg-cream-dark p-1">
        {STATUS_TABS.map((tab) => (
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
              {countOf(tab.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Kind filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {KIND_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => {
              setKindFilter(chip.key);
              setSelectedIds(new Set());
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              kindFilter === chip.key
                ? "border-forest bg-forest/10 text-forest"
                : "border-border text-warm-gray hover:text-ink"
            )}
          >
            {chip.label}
          </button>
        ))}
        {inQueue && filtered.length > 0 && (
          <button
            onClick={selectAllVisible}
            className="ml-auto font-body text-xs font-semibold uppercase tracking-wider text-forest transition-colors hover:text-forest-light"
          >
            Select All
          </button>
        )}
        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray transition-colors hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <Landmark className="mx-auto h-10 w-10 text-warm-gray-light" />
          <p className="mt-3 text-warm-gray">No {activeTab} entries.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const isProcessing = processingIds.has(row.id);
            const isSelected = selectedIds.has(row.id);
            return (
              <div
                key={row.id}
                className={cn(
                  "rounded-xl border bg-white/60 p-5 transition-colors",
                  isSelected ? "border-forest bg-forest/5" : "border-border",
                  isProcessing && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  {inQueue && (
                    <label className="mt-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(row.id)}
                        disabled={isProcessing}
                        className="h-4 w-4 rounded border-border text-forest focus:ring-forest"
                      />
                    </label>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-body text-sm font-semibold text-ink">
                        {row.display_name || "Anonymous"}
                      </span>
                      <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs font-medium text-warm-gray">
                        {KIND_LABELS[row.kind] ?? row.kind}
                      </span>
                      {row.status === "flagged" && (
                        <span className="flex items-center gap-1 rounded-full bg-rust/10 px-2 py-0.5 text-xs font-medium text-rust">
                          <Flag className="h-3 w-3" />
                          Flagged by the screen
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-body text-xs text-warm-gray">
                      on <span className="font-medium text-ink-light">{row.prompt_id}</span>
                    </p>

                    <p className="mt-3 font-body text-sm leading-relaxed text-ink-light">
                      {row.body}
                    </p>

                    <p className="mt-2 font-body text-xs text-warm-gray-light">
                      {age(row.created_at)} ago
                      {row.reviewed_at ? ` · reviewed ${age(row.reviewed_at)} ago` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {row.status !== "approved" && (
                      <button
                        onClick={() => moderate([row.id], "approved")}
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
                    {row.status !== "rejected" && (
                      <button
                        onClick={() => moderate([row.id], "rejected")}
                        disabled={isProcessing}
                        title="Reject"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-rust transition-colors hover:bg-rust/10 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    )}
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
