"use client";

/* ------------------------------------------------------------------ */
/*  /admin/research/directors                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  CRUD for industry directors. Single-page experience:              */
/*  - Sortable table view.                                             */
/*  - Drag-to-reorder changes display_order in place.                 */
/*  - Edit in a side panel, add in a modal dialog.                   */
/*  - Archive toggle to soft-hide an entry without deleting.          */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import ChipInput from "@/components/admin/research/ChipInput";
import DirectorPhotoUploader from "@/components/admin/research/DirectorPhotoUploader";
import type { IndustryDirector } from "@/lib/types/database";
import { slugify } from "@/lib/utils";

interface EditorState {
  id?: string;
  slug: string;
  full_name: string;
  title: string;
  affiliation: string;
  bio: string;
  photo_url: string | null;
  website_url: string;
  institutional_url: string;
  linkedin_url: string;
  focus_areas: string[];
  display_order: number;
  is_active: boolean;
  slug_is_manual: boolean;
}

function emptyEditor(order: number): EditorState {
  return {
    slug: "",
    full_name: "",
    title: "",
    affiliation: "",
    bio: "",
    photo_url: null,
    website_url: "",
    institutional_url: "",
    linkedin_url: "",
    focus_areas: [],
    display_order: order,
    is_active: true,
    slug_is_manual: false,
  };
}

function fromDirector(d: IndustryDirector): EditorState {
  return {
    id: d.id,
    slug: d.slug,
    full_name: d.full_name,
    title: d.title,
    affiliation: d.affiliation,
    bio: d.bio,
    photo_url: d.photo_url,
    website_url: d.website_url ?? "",
    institutional_url: d.institutional_url ?? "",
    linkedin_url: d.linkedin_url ?? "",
    focus_areas: d.focus_areas ?? [],
    display_order: d.display_order,
    is_active: d.is_active,
    slug_is_manual: true,
  };
}

type Tab = "active" | "archived";

export default function AdminResearchDirectorsPage() {
  const [directors, setDirectors] = useState<IndustryDirector[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<IndustryDirector | null>(
    null
  );

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  /* ---------- Fetch ---------- */
  const fetchDirectors = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("industry_directors")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      setDirectors(((data as IndustryDirector[]) ?? []).map((d) => ({
        ...d,
        focus_areas: d.focus_areas ?? [],
      })));
    } catch {
      toast.error("Failed to load directors. Database may not be connected.");
      setDirectors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectors();
  }, [fetchDirectors]);

  const visible = useMemo(
    () =>
      directors.filter((d) => (tab === "active" ? d.is_active : !d.is_active)),
    [directors, tab]
  );

  /* ---------- Editor ---------- */
  const openNew = () => {
    const next =
      (directors.reduce((a, d) => Math.max(a, d.display_order), 0) ?? 0) + 10;
    setEditor(emptyEditor(next));
    setEditorOpen(true);
  };

  const openEdit = (director: IndustryDirector) => {
    setEditor(fromDirector(director));
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditor(null);
  };

  const updateEditor = useCallback(
    <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
      setEditor((prev) => (prev ? { ...prev, [key]: value } : prev));
    },
    []
  );

  const saveDirector = useCallback(async () => {
    if (!editor) return;
    if (
      !editor.full_name.trim() ||
      !editor.title.trim() ||
      !editor.affiliation.trim() ||
      !editor.bio.trim()
    ) {
      toast.error("Name, title, affiliation, and bio are required.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        slug: editor.slug || slugify(editor.full_name),
        full_name: editor.full_name.trim(),
        title: editor.title.trim(),
        affiliation: editor.affiliation.trim(),
        bio: editor.bio.trim(),
        photo_url: editor.photo_url,
        website_url: editor.website_url.trim() || null,
        institutional_url: editor.institutional_url.trim() || null,
        linkedin_url: editor.linkedin_url.trim() || null,
        focus_areas: editor.focus_areas,
        display_order: editor.display_order,
        is_active: editor.is_active,
      };

      if (editor.id) {
        const { error } = await supabase
          .from("industry_directors")
          .update(payload)
          .eq("id", editor.id);
        if (error) throw error;
        toast.success("Director updated");
      } else {
        const { error } = await supabase
          .from("industry_directors")
          .insert(payload);
        if (error) throw error;
        toast.success("Director added");
      }

      closeEditor();
      fetchDirectors();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save director";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [editor, fetchDirectors]);

  const toggleActive = useCallback(
    async (director: IndustryDirector) => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("industry_directors")
          .update({ is_active: !director.is_active })
          .eq("id", director.id);
        if (error) throw error;
        toast.success(
          director.is_active ? "Director archived" : "Director restored"
        );
        fetchDirectors();
      } catch {
        toast.error("Failed to update");
      }
    },
    [fetchDirectors]
  );

  const deleteDirector = useCallback(
    async (director: IndustryDirector) => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("industry_directors")
          .delete()
          .eq("id", director.id);
        if (error) throw error;
        toast.success("Director deleted");
        setDeleteConfirm(null);
        fetchDirectors();
      } catch {
        toast.error("Failed to delete");
      }
    },
    [fetchDirectors]
  );

  /* ---------- Drag reorder (active tab only) ---------- */
  const reorder = useCallback(
    async (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const activeList = directors
        .filter((d) => d.is_active)
        .sort((a, b) => a.display_order - b.display_order);
      const fromIdx = activeList.findIndex((d) => d.id === fromId);
      const toIdx = activeList.findIndex((d) => d.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;

      const next = [...activeList];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);

      // Re-number in 10-unit increments so future inserts are easy.
      const updates = next.map((d, i) => ({
        id: d.id,
        display_order: (i + 1) * 10,
      }));

      // Optimistic local update.
      setDirectors((prev) =>
        prev.map((d) => {
          const update = updates.find((u) => u.id === d.id);
          return update ? { ...d, display_order: update.display_order } : d;
        })
      );

      try {
        const supabase = createClient();
        for (const u of updates) {
          await supabase
            .from("industry_directors")
            .update({ display_order: u.display_order })
            .eq("id", u.id);
        }
        toast.success("Order updated");
      } catch {
        toast.error("Failed to save new order — refreshing.");
        fetchDirectors();
      }
    },
    [directors, fetchDirectors]
  );

  /* ---------- Render ---------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            Industry Directors
          </h1>
          <p className="mt-1 font-body text-sm text-warm-gray">
            Professionals and academics who review and guide Rooted Forward
            research. Shown on the /research page in the order set here.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
        >
          <Plus className="h-4 w-4" />
          Add Director
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "active", label: "Active" },
          { key: "archived", label: "Archived" },
        ] as { key: Tab; label: string }[]).map((t) => (
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
            <span className="ml-1.5 text-xs text-warm-gray/70">
              ({directors.filter((d) =>
                t.key === "active" ? d.is_active : !d.is_active
              ).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-forest" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <p className="font-body text-sm text-warm-gray">
            {tab === "active"
              ? "No directors yet. Add your first above."
              : "No archived directors."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible
            .sort((a, b) => a.display_order - b.display_order)
            .map((director) => {
              const isDragging = dragId === director.id;
              const isOver = overId === director.id && dragId !== null;
              return (
                <div
                  key={director.id}
                  draggable={tab === "active"}
                  onDragStart={() => setDragId(director.id)}
                  onDragEnter={() => setOverId(director.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) reorder(dragId, director.id);
                    setDragId(null);
                    setOverId(null);
                  }}
                  className={`flex items-start gap-4 rounded-lg border bg-white/60 p-4 transition-all ${
                    isDragging
                      ? "border-rust/60 opacity-50"
                      : isOver
                        ? "border-forest"
                        : "border-border"
                  } ${!director.is_active ? "opacity-70" : ""}`}
                >
                  {tab === "active" && (
                    <button
                      type="button"
                      aria-label="Drag to reorder"
                      className="mt-1 cursor-grab rounded-md p-1 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink active:cursor-grabbing"
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  )}

                  {/* Thumb */}
                  <div className="flex-shrink-0">
                    {director.photo_url ? (
                      <img
                        src={director.photo_url}
                        alt={director.full_name}
                        className="h-14 w-14 rounded-sm border border-border object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-14 w-14 items-center justify-center rounded-sm border border-border bg-cream-dark font-display text-sm font-medium text-warm-gray"
                      >
                        {director.full_name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((w) => w[0]?.toUpperCase() ?? "")
                          .join("")}
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-medium text-forest">
                      {director.full_name}
                    </p>
                    <p className="mt-0.5 truncate font-body text-[13px] text-ink/75">
                      {director.title}
                    </p>
                    <p className="truncate font-body text-[12.5px] text-warm-gray">
                      {director.affiliation}
                    </p>
                    {director.focus_areas.length > 0 && (
                      <p className="mt-1 truncate font-body text-[12px] text-warm-gray">
                        {director.focus_areas.join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Order input */}
                  <div className="flex flex-col items-end gap-2">
                    <label className="flex items-center gap-1 font-body text-[11px] text-warm-gray">
                      Order
                      <input
                        type="number"
                        value={director.display_order}
                        onChange={async (e) => {
                          const n = parseInt(e.target.value, 10);
                          if (!Number.isFinite(n)) return;
                          setDirectors((prev) =>
                            prev.map((d) =>
                              d.id === director.id
                                ? { ...d, display_order: n }
                                : d
                            )
                          );
                          try {
                            const supabase = createClient();
                            await supabase
                              .from("industry_directors")
                              .update({ display_order: n })
                              .eq("id", director.id);
                          } catch {
                            toast.error("Failed to save order");
                          }
                        }}
                        className="w-16 rounded border border-border bg-white px-1.5 py-0.5 text-right font-mono text-[12px]"
                      />
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(director)}
                        aria-label="Edit"
                        className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(director)}
                        aria-label={
                          director.is_active ? "Archive" : "Restore"
                        }
                        className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                      >
                        {director.is_active ? (
                          <Archive className="h-4 w-4" />
                        ) : (
                          <Undo2 className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(director)}
                        aria-label="Delete"
                        className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-rust/10 hover:text-rust"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Editor side panel */}
      {editorOpen && editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-cream shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-bold text-forest">
                {editor.id ? "Edit director" : "Add director"}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md p-1 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[140px_1fr] md:items-start">
                <div>
                  <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                    Photo
                  </p>
                  <div className="mt-1">
                    <DirectorPhotoUploader
                      value={editor.photo_url}
                      onChange={(v) => updateEditor("photo_url", v)}
                      directorId={editor.id}
                      slugHint={editor.slug || slugify(editor.full_name)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Field label="Full name" required>
                    <input
                      type="text"
                      value={editor.full_name}
                      onChange={(e) =>
                        setEditor((prev) =>
                          prev
                            ? {
                                ...prev,
                                full_name: e.target.value,
                                slug: prev.slug_is_manual
                                  ? prev.slug
                                  : slugify(e.target.value),
                              }
                            : prev
                        )
                      }
                      className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm focus:border-forest focus:outline-none"
                      placeholder="Dr. Amina Khatri"
                    />
                  </Field>

                  <Field label="Slug">
                    <input
                      type="text"
                      value={editor.slug}
                      onChange={(e) =>
                        setEditor((prev) =>
                          prev
                            ? {
                                ...prev,
                                slug: slugify(e.target.value),
                                slug_is_manual: true,
                              }
                            : prev
                        )
                      }
                      className="w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm focus:border-forest focus:outline-none"
                      placeholder={slugify(editor.full_name || "new-director")}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Title" required>
                  <input
                    type="text"
                    value={editor.title}
                    onChange={(e) => updateEditor("title", e.target.value)}
                    className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm focus:border-forest focus:outline-none"
                    placeholder="Associate Professor of Urban Planning"
                  />
                </Field>
                <Field label="Affiliation" required>
                  <input
                    type="text"
                    value={editor.affiliation}
                    onChange={(e) =>
                      updateEditor("affiliation", e.target.value)
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm focus:border-forest focus:outline-none"
                    placeholder="University of Illinois Chicago"
                  />
                </Field>
              </div>

              <Field
                label="Bio"
                required
                hint="3–4 sentences describing what this director does for Rooted Forward specifically."
              >
                <textarea
                  value={editor.bio}
                  onChange={(e) => updateEditor("bio", e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm leading-relaxed focus:border-forest focus:outline-none"
                />
                <p className="mt-1 text-right font-body text-xs text-warm-gray">
                  {editor.bio.length} characters
                </p>
              </Field>

              <Field label="Focus areas">
                <ChipInput
                  value={editor.focus_areas}
                  onChange={(v) => updateEditor("focus_areas", v)}
                  placeholder="Housing policy"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field label="Website URL">
                  <input
                    type="url"
                    value={editor.website_url}
                    onChange={(e) =>
                      updateEditor("website_url", e.target.value)
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm focus:border-forest focus:outline-none"
                    placeholder="https://"
                  />
                </Field>
                <Field label="Institutional URL">
                  <input
                    type="url"
                    value={editor.institutional_url}
                    onChange={(e) =>
                      updateEditor("institutional_url", e.target.value)
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm focus:border-forest focus:outline-none"
                    placeholder="https://"
                  />
                </Field>
                <Field label="LinkedIn URL">
                  <input
                    type="url"
                    value={editor.linkedin_url}
                    onChange={(e) =>
                      updateEditor("linkedin_url", e.target.value)
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm focus:border-forest focus:outline-none"
                    placeholder="https://www.linkedin.com/in/"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr] md:items-center">
                <Field label="Display order">
                  <input
                    type="number"
                    value={editor.display_order}
                    onChange={(e) =>
                      updateEditor(
                        "display_order",
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 font-mono text-sm focus:border-forest focus:outline-none"
                  />
                </Field>
                <label className="flex items-center gap-3 pt-5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editor.is_active}
                    onClick={() =>
                      updateEditor("is_active", !editor.is_active)
                    }
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      editor.is_active ? "bg-forest" : "bg-warm-gray-light"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        editor.is_active ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                  <span className="font-body text-sm text-ink">
                    {editor.is_active ? "Active (visible on site)" : "Archived"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border bg-cream-dark/40 px-6 py-4">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md border border-border bg-white px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDirector}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editor.id ? "Save changes" : "Add director"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-cream p-6 shadow-xl">
            <h2 className="font-display text-lg font-bold text-forest">
              Delete director?
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-ink-light">
              You are about to permanently delete{" "}
              <span className="font-medium text-ink">
                {deleteConfirm.full_name}
              </span>
              . Archive preserves the record; delete removes it entirely.
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
                onClick={() => deleteDirector(deleteConfirm)}
                className="rounded-md bg-rust px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-rust-dark"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field wrapper                                                      */
/* ------------------------------------------------------------------ */

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, hint, required, children }: FieldProps) {
  return (
    <div>
      <label className="block font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
        {label}
        {required && <span className="ml-1 text-rust">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && (
        <p className="mt-1 font-body text-[12px] leading-relaxed text-warm-gray">
          {hint}
        </p>
      )}
    </div>
  );
}
