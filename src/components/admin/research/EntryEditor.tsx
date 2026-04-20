"use client";

/* ------------------------------------------------------------------ */
/*  EntryEditor                                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  The shared research entry editor used by both                      */
/*  /admin/research/entries/new and /admin/research/entries/[id].     */
/*                                                                     */
/*  Full-page form because the markdown body and citations editor     */
/*  together are too much content to cram into a modal.               */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Save, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import CitationsEditor from "@/components/admin/research/CitationsEditor";
import ChipInput from "@/components/admin/research/ChipInput";
import PdfUploader from "@/components/admin/research/PdfUploader";
import CoverImageUploader from "@/components/admin/research/CoverImageUploader";
import {
  RESEARCH_CITIES,
  RESEARCH_FORMATS,
  RESEARCH_TOPICS,
  normalizeCitations,
} from "@/lib/research-constants";
import type {
  Citation,
  ResearchEntry,
  ResearchFormat,
  ResearchStatus,
} from "@/lib/types/database";
import { slugify } from "@/lib/utils";

interface EntryEditorProps {
  /** Omit for "new" mode; pass the entry row for "edit" mode. */
  initial?: ResearchEntry;
}

interface EditorState {
  id?: string;
  slug: string;
  title: string;
  abstract: string;
  full_content_markdown: string;
  topic: string;
  city: string;
  format: ResearchFormat;
  authors: string[];
  reviewers: string[];
  citations: Citation[];
  pdf_url: string | null;
  cover_image_url: string | null;
  published_date: string;
  status: ResearchStatus;
  related_campaign_ids: string[];
  related_tour_slugs: string[];
  /** Admin flag to not auto-sync slug with title once manually edited. */
  slug_is_manual: boolean;
}

interface CampaignLite {
  id: string;
  slug: string;
  title: string;
  category: string;
}

function emptyState(): EditorState {
  return {
    slug: "",
    title: "",
    abstract: "",
    full_content_markdown: "",
    topic: RESEARCH_TOPICS[0].value,
    city: RESEARCH_CITIES[0].value,
    format: "brief",
    authors: [],
    reviewers: [],
    citations: [],
    pdf_url: null,
    cover_image_url: null,
    published_date: new Date().toISOString().split("T")[0],
    status: "draft",
    related_campaign_ids: [],
    related_tour_slugs: [],
    slug_is_manual: false,
  };
}

function fromEntry(entry: ResearchEntry): EditorState {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    abstract: entry.abstract,
    full_content_markdown: entry.full_content_markdown ?? "",
    topic: entry.topic,
    city: entry.city,
    format: entry.format,
    authors: entry.authors ?? [],
    reviewers: entry.reviewers ?? [],
    citations: normalizeCitations(entry.citations),
    pdf_url: entry.pdf_url,
    cover_image_url: entry.cover_image_url,
    published_date: entry.published_date,
    status: entry.status,
    related_campaign_ids: entry.related_campaign_ids ?? [],
    related_tour_slugs: entry.related_tour_slugs ?? [],
    slug_is_manual: true,
  };
}

export default function EntryEditor({ initial }: EntryEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<EditorState>(() =>
    initial ? fromEntry(initial) : emptyState()
  );
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignLite[]>([]);
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);

  /* ---- Campaign picker options ---- */
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("campaigns")
          .select("id, slug, title, category")
          .order("title", { ascending: true });
        setCampaigns((data as CampaignLite[]) ?? []);
      } catch {
        setCampaigns([]);
      } finally {
        setCampaignsLoaded(true);
      }
    })();
  }, []);

  /* ---- Derived values ---- */
  const abstractLength = form.abstract.length;
  const bodyLength = form.full_content_markdown.length;
  const titleMissing = !form.title.trim();
  const abstractMissing = !form.abstract.trim();
  const cannotSave = saving || titleMissing || abstractMissing;
  const isEditing = !!initial;

  const slugPreview = useMemo(() => {
    return form.slug || slugify(form.title || "new-entry");
  }, [form.slug, form.title]);

  /* ---- Handlers ---- */

  const updateForm = useCallback(
    <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateTitle = useCallback((title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug_is_manual ? prev.slug : slugify(title),
    }));
  }, []);

  const updateSlug = useCallback((slug: string) => {
    setForm((prev) => ({
      ...prev,
      slug: slugify(slug),
      slug_is_manual: true,
    }));
  }, []);

  const toggleCampaign = useCallback((campaignId: string) => {
    setForm((prev) => {
      const exists = prev.related_campaign_ids.includes(campaignId);
      return {
        ...prev,
        related_campaign_ids: exists
          ? prev.related_campaign_ids.filter((id) => id !== campaignId)
          : [...prev.related_campaign_ids, campaignId],
      };
    });
  }, []);

  const save = useCallback(
    async (options?: { publish?: boolean }) => {
      if (cannotSave) return;
      setSaving(true);
      try {
        const supabase = createClient();
        const payload = {
          slug: slugPreview,
          title: form.title.trim(),
          abstract: form.abstract.trim(),
          full_content_markdown: form.full_content_markdown || null,
          topic: form.topic,
          city: form.city,
          format: form.format,
          authors: form.authors,
          reviewers: form.reviewers,
          citations: form.citations,
          pdf_url: form.pdf_url,
          cover_image_url: form.cover_image_url,
          published_date: form.published_date,
          status: options?.publish ? ("published" as const) : form.status,
          related_campaign_ids: form.related_campaign_ids,
          related_tour_slugs: form.related_tour_slugs,
        };

        if (form.id) {
          const { error } = await supabase
            .from("research_entries")
            .update(payload)
            .eq("id", form.id);
          if (error) throw error;
          toast.success(
            options?.publish ? "Published" : "Changes saved"
          );
          if (options?.publish) {
            setForm((prev) => ({ ...prev, status: "published" }));
          }
        } else {
          const { data, error } = await supabase
            .from("research_entries")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw error;
          toast.success(options?.publish ? "Published" : "Draft saved");
          router.push(
            `/admin/research/entries/${(data as { id: string }).id}`
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to save entry";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [cannotSave, form, router, slugPreview]
  );

  /* ---- Render ---- */

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-cream/95 px-4 py-3 backdrop-blur-sm lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/research/entries"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-body text-sm text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              All entries
            </Link>
            <div className="h-5 w-px bg-border" aria-hidden="true" />
            <p className="font-body text-sm text-ink-light">
              {isEditing ? "Editing" : "New entry"}
              {form.title && (
                <span className="ml-1.5 text-ink">&middot; {form.title}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && form.status === "published" && (
              <Link
                href={`/research/${slugPreview}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                <Eye className="h-4 w-4" />
                View
              </Link>
            )}
            <button
              type="button"
              onClick={() => save()}
              disabled={cannotSave}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => save({ publish: true })}
              disabled={cannotSave}
              className="inline-flex items-center gap-1.5 rounded-md bg-forest px-4 py-1.5 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save &amp; publish
            </button>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
        {/* LEFT COLUMN — title, abstract, body, citations */}
        <div className="space-y-6">
          <Field
            label="Title"
            required
            hint="Goes in the archive list, the detail page, and browser tabs."
          >
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateTitle(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 font-display text-lg text-ink focus:border-forest focus:outline-none"
              placeholder="The Geography of Disinvestment on Chicago's West Side"
            />
            {titleMissing && (
              <p className="mt-1 font-body text-xs text-rust">
                Title is required.
              </p>
            )}
          </Field>

          <Field
            label="Slug"
            hint="Used in the URL. Auto-generated from title unless you edit it."
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-warm-gray">
                /research/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateSlug(e.target.value)}
                className="flex-1 rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-ink focus:border-forest focus:outline-none"
                placeholder={slugify(form.title || "new-entry")}
              />
            </div>
          </Field>

          <Field
            label="Abstract"
            required
            hint="2–3 sentences. Shown in the archive list and as the share preview."
          >
            <textarea
              value={form.abstract}
              onChange={(e) =>
                updateForm("abstract", e.target.value)
              }
              rows={4}
              className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm leading-relaxed text-ink focus:border-forest focus:outline-none"
              placeholder="An analysis of Home Owners' Loan Corporation grading maps and their correlation with present-day vacancy rates…"
            />
            <p className="mt-1 text-right font-body text-xs text-warm-gray">
              {abstractLength} characters
              {abstractMissing && (
                <span className="ml-2 text-rust">Required</span>
              )}
            </p>
          </Field>

          <Field
            label="Full content (markdown)"
            hint="Long-form body. Use [^N] or [cite:N] to reference citation N."
          >
            <MarkdownEditor
              value={form.full_content_markdown}
              onChange={(v) => updateForm("full_content_markdown", v)}
              placeholder="## Introduction&#10;&#10;Start writing the full body here. Use standard markdown; footnote citations use [^1] syntax."
            />
            <p className="mt-1 text-right font-body text-xs text-warm-gray">
              {bodyLength.toLocaleString()} characters
            </p>
          </Field>

          <div className="rounded-lg border border-border bg-white/60 p-5">
            <CitationsEditor
              citations={form.citations}
              onChange={(next) => updateForm("citations", next)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN — metadata, people, media, related */}
        <div className="space-y-6">
          <div className="space-y-5 rounded-lg border border-border bg-white/60 p-5">
            <h3 className="font-display text-[16px] font-semibold text-forest">
              Metadata
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Field compact label="Topic">
                <select
                  value={form.topic}
                  onChange={(e) => updateForm("topic", e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
                >
                  {RESEARCH_TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field compact label="City">
                <select
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
                >
                  {RESEARCH_CITIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field compact label="Format">
              <select
                value={form.format}
                onChange={(e) =>
                  updateForm("format", e.target.value as ResearchFormat)
                }
                className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
              >
                {RESEARCH_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 font-body text-[12px] text-warm-gray">
                {
                  RESEARCH_FORMATS.find((f) => f.value === form.format)
                    ?.description
                }
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field compact label="Published date">
                <input
                  type="date"
                  value={form.published_date}
                  onChange={(e) =>
                    updateForm("published_date", e.target.value)
                  }
                  className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
                />
              </Field>
              <Field compact label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    updateForm("status", e.target.value as ResearchStatus)
                  }
                  className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 font-body text-sm focus:border-forest focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>
          </div>

          {/* People */}
          <div className="space-y-5 rounded-lg border border-border bg-white/60 p-5">
            <h3 className="font-display text-[16px] font-semibold text-forest">
              People
            </h3>

            <Field compact label="Authors">
              <ChipInput
                value={form.authors}
                onChange={(v) => updateForm("authors", v)}
                placeholder="Sarah Chen"
              />
            </Field>

            <Field compact label="Reviewers">
              <ChipInput
                value={form.reviewers}
                onChange={(v) => updateForm("reviewers", v)}
                placeholder="Dr. Amina Khatri"
              />
            </Field>
          </div>

          {/* Media */}
          <div className="space-y-5 rounded-lg border border-border bg-white/60 p-5">
            <h3 className="font-display text-[16px] font-semibold text-forest">
              Media
            </h3>

            <Field compact label="PDF">
              <PdfUploader
                value={form.pdf_url}
                onChange={(v) => updateForm("pdf_url", v)}
                entryId={form.id}
              />
            </Field>

            <Field compact label="Cover image">
              <CoverImageUploader
                value={form.cover_image_url}
                onChange={(v) => updateForm("cover_image_url", v)}
              />
            </Field>
          </div>

          {/* Related */}
          <div className="space-y-5 rounded-lg border border-border bg-white/60 p-5">
            <h3 className="font-display text-[16px] font-semibold text-forest">
              Related content
            </h3>

            <Field
              compact
              label="Linked campaigns"
              hint="Briefs linked to an active campaign surface on the /policy page."
            >
              {!campaignsLoaded ? (
                <p className="font-body text-xs text-warm-gray">
                  Loading campaigns…
                </p>
              ) : campaigns.length === 0 ? (
                <p className="font-body text-xs text-warm-gray">
                  No campaigns found.
                </p>
              ) : (
                <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border bg-white px-2 py-2">
                  {campaigns.map((c) => {
                    const checked = form.related_campaign_ids.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-start gap-2 rounded-sm px-1.5 py-1 transition-colors hover:bg-cream-dark/40"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCampaign(c.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-body text-sm text-ink">
                            {c.title}
                          </p>
                          <p className="truncate font-body text-[11px] text-warm-gray">
                            {c.category} &middot; {c.slug}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Field>

            <Field
              compact
              label="Related tour slugs"
              hint="Enter tour stop slugs (e.g. pilsen-anti-displacement-murals)."
            >
              <ChipInput
                value={form.related_tour_slugs}
                onChange={(v) => updateForm("related_tour_slugs", v)}
                placeholder="pilsen-anti-displacement-murals"
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small form field wrapper                                           */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}

function Field({ label, hint, required, compact, children }: FieldProps) {
  return (
    <div className={compact ? "" : "space-y-2"}>
      <div className="flex items-baseline justify-between gap-2">
        <label
          className={`block font-body font-semibold text-ink ${
            compact ? "text-[11px] uppercase tracking-wider" : "text-sm"
          }`}
        >
          {label}
          {required && <span className="ml-1 text-rust">*</span>}
        </label>
      </div>
      <div className={compact ? "mt-1" : undefined}>{children}</div>
      {hint && (
        <p className="mt-1 font-body text-[12px] leading-relaxed text-warm-gray">
          {hint}
        </p>
      )}
    </div>
  );
}
