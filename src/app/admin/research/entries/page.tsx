"use client";

/* ------------------------------------------------------------------ */
/*  /admin/research/entries                                            */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Admin list + CRUD actions for every research entry.               */
/*                                                                     */
/*  Columns: title, topic, city, format, status, published date,     */
/*           citation count, actions.                                   */
/*  Filter bar: status, topic, city.                                   */
/*  Row actions: edit, duplicate, archive, delete.                     */
/*  "New Entry" button links to /admin/research/entries/new.          */
/*                                                                     */
/*  Editing happens on a dedicated full-page form at                 */
/*  /admin/research/entries/[id] — too much content (long markdown   */
/*  body + citations editor) for a modal.                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Copy,
  Archive,
  Trash2,
  Undo2,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  RESEARCH_CITIES,
  RESEARCH_TOPICS,
  formatLabel,
  cityLabel,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry, ResearchStatus } from "@/lib/types/database";

const STATUS_OPTIONS: { value: ResearchStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

function formatDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadgeClass(status: ResearchStatus): string {
  switch (status) {
    case "published":
      return "bg-forest/10 text-forest";
    case "draft":
      return "bg-warm-gray/15 text-warm-gray";
    case "archived":
      return "bg-rust/10 text-rust";
  }
}

export default function AdminResearchEntriesPage() {
  const router = useRouter();

  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ResearchEntry | null>(
    null
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    ResearchStatus | "all"
  >("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [queryFilter, setQueryFilter] = useState<string>("");

  /* ---------------- Fetch ---------------- */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("research_entries")
        .select("*")
        .order("published_date", { ascending: false });
      if (error) throw error;
      setEntries(
        ((data ?? []) as ResearchEntry[]).map((e) => ({
          ...e,
          citations: normalizeCitations(e.citations),
        }))
      );
    } catch {
      toast.error(
        "Failed to load research entries. Database may not be connected."
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* ---------------- Filtered view ---------------- */
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (topicFilter !== "all" && e.topic !== topicFilter) return false;
      if (cityFilter !== "all" && e.city !== cityFilter) return false;
      if (queryFilter.trim()) {
        const q = queryFilter.toLowerCase();
        const inTitle = e.title.toLowerCase().includes(q);
        const inAbstract = e.abstract.toLowerCase().includes(q);
        const inAuthors = e.authors.some((a) =>
          a.toLowerCase().includes(q)
        );
        if (!inTitle && !inAbstract && !inAuthors) return false;
      }
      return true;
    });
  }, [entries, statusFilter, topicFilter, cityFilter, queryFilter]);

  /* ---------------- Row actions ---------------- */

  const duplicateEntry = useCallback(
    async (entry: ResearchEntry) => {
      setBusyId(entry.id);
      try {
        const supabase = createClient();
        const newSlug = `${entry.slug}-copy-${Math.floor(Date.now() / 1000)}`;
        const { error } = await supabase.from("research_entries").insert({
          slug: newSlug,
          title: `${entry.title} (Copy)`,
          abstract: entry.abstract,
          full_content_markdown: entry.full_content_markdown,
          topic: entry.topic,
          city: entry.city,
          format: entry.format,
          authors: entry.authors,
          reviewers: entry.reviewers,
          citations: entry.citations,
          pdf_url: entry.pdf_url,
          cover_image_url: entry.cover_image_url,
          published_date: entry.published_date,
          status: "draft",
          related_campaign_ids: entry.related_campaign_ids,
          related_tour_slugs: entry.related_tour_slugs,
        });
        if (error) throw error;
        toast.success("Entry duplicated as a draft");
        fetchEntries();
      } catch {
        toast.error("Failed to duplicate entry");
      } finally {
        setBusyId(null);
      }
    },
    [fetchEntries]
  );

  const archiveEntry = useCallback(
    async (entry: ResearchEntry) => {
      const nextStatus: ResearchStatus =
        entry.status === "archived" ? "draft" : "archived";
      setBusyId(entry.id);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("research_entries")
          .update({ status: nextStatus })
          .eq("id", entry.id);
        if (error) throw error;
        toast.success(
          nextStatus === "archived" ? "Entry archived" : "Entry restored"
        );
        fetchEntries();
      } catch {
        toast.error("Failed to update status");
      } finally {
        setBusyId(null);
      }
    },
    [fetchEntries]
  );

  const deleteEntry = useCallback(
    async (entry: ResearchEntry) => {
      setBusyId(entry.id);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("research_entries")
          .delete()
          .eq("id", entry.id);
        if (error) throw error;
        toast.success("Entry deleted");
        setDeleteConfirm(null);
        fetchEntries();
      } catch {
        toast.error("Failed to delete entry");
      } finally {
        setBusyId(null);
      }
    },
    [fetchEntries]
  );

  /* ---------------- Render ---------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            Research Entries
          </h1>
          <p className="mt-1 font-body text-sm text-warm-gray">
            Manage briefs, reports, primary sources, data analyses, and oral
            histories.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/research/entries/new")}
          className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white/60 px-4 py-3">
        <input
          type="text"
          value={queryFilter}
          onChange={(e) => setQueryFilter(e.target.value)}
          placeholder="Search title, abstract, authors…"
          className="min-w-[220px] flex-1 rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ResearchStatus | "all")
          }
          className="rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
        >
          <option value="all">All topics</option>
          {RESEARCH_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
        >
          <option value="all">All cities</option>
          {RESEARCH_CITIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <p className="ml-auto font-body text-xs text-warm-gray">
          {filtered.length} of {entries.length}
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-forest" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <p className="font-body text-sm text-warm-gray">
            {entries.length === 0
              ? "No research entries yet. Create your first one."
              : "No entries match those filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white/60 shadow-sm">
          <div className="hidden grid-cols-[minmax(0,2fr)_100px_90px_120px_100px_100px_70px_140px] gap-4 border-b border-border bg-cream-dark/40 px-5 py-3 md:grid">
            {[
              "Title",
              "Topic",
              "City",
              "Format",
              "Status",
              "Published",
              "Cites",
              "",
            ].map((h) => (
              <span
                key={h}
                className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray"
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.map((entry) => {
            const isBusy = busyId === entry.id;
            return (
              <div
                key={entry.id}
                className="flex flex-col gap-2 border-b border-border/50 px-5 py-4 last:border-b-0 md:grid md:grid-cols-[minmax(0,2fr)_100px_90px_120px_100px_100px_70px_140px] md:items-center md:gap-4"
              >
                {/* Title */}
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-medium text-forest">
                    {entry.title}
                  </p>
                  <p className="mt-0.5 truncate font-body text-[12.5px] text-warm-gray">
                    {entry.authors.length > 0
                      ? entry.authors.join(", ")
                      : "No authors listed"}
                  </p>
                </div>

                <span className="font-body text-[13px] text-ink/75">
                  {entry.topic}
                </span>

                <span className="font-body text-[13px] text-ink/75">
                  {cityLabel(entry.city)}
                </span>

                <span className="font-body text-[13px] text-ink/75">
                  {formatLabel(entry.format)}
                </span>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-wider ${statusBadgeClass(
                    entry.status
                  )}`}
                >
                  {entry.status}
                </span>

                <span className="font-body text-[12.5px] text-warm-gray">
                  {formatDate(entry.published_date)}
                </span>

                <span className="font-body text-[12.5px] text-warm-gray">
                  {entry.citations?.length ?? 0}
                </span>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-1 md:justify-end">
                  <Link
                    href={`/admin/research/entries/${entry.id}`}
                    aria-label="Edit"
                    className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => duplicateEntry(entry)}
                    disabled={isBusy}
                    aria-label="Duplicate"
                    className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveEntry(entry)}
                    disabled={isBusy}
                    aria-label={
                      entry.status === "archived" ? "Restore" : "Archive"
                    }
                    className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-50"
                  >
                    {entry.status === "archived" ? (
                      <Undo2 className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(entry)}
                    disabled={isBusy}
                    aria-label="Delete"
                    className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-rust/10 hover:text-rust disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-cream p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-forest">
              Delete this research entry?
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink-light">
              You are about to permanently delete{" "}
              <span className="font-medium text-ink">
                {deleteConfirm.title}
              </span>
              . This cannot be undone. If you need to hide it temporarily,
              use Archive instead.
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteEntry(deleteConfirm)}
                disabled={busyId === deleteConfirm.id}
                className="inline-flex items-center gap-2 rounded-md bg-rust px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
              >
                {busyId === deleteConfirm.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Delete entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
