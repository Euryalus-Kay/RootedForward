"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createClient,
  isSupabaseConfiguredClient,
} from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import PanoViewer from "@/components/immersive/PanoViewer";
import TimelinePlayer from "@/components/immersive/TimelinePlayer";
import { PLACEHOLDER_IMMERSIVE_TOURS } from "@/lib/immersive/constants";
import { DEMO_SEQUENCE } from "@/lib/immersive/demo";
import { uploadTourMedia } from "@/lib/immersive/studio-client";
import type {
  ImmersiveStop,
  ImmersiveTour,
  Media360,
} from "@/lib/immersive/types";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Waves,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Admin / Immersive: manage 2D/3D hybrid tours, upload and assign    */
/*  360 media to stops, and test the player with built-in assets.      */
/* ------------------------------------------------------------------ */

type DbStatus = "loading" | "ok" | "unavailable";

interface TourRow extends ImmersiveTour {
  dbId?: string;
}

const BUILTIN_PHOTO = "/media/360/test-pano.jpg";
const BUILTIN_VIDEO = "/media/360/test-pano.mp4";
const BUILTIN_POSTER = "/media/360/test-pano-poster.jpg";

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust";
const labelCls = "mb-1 block text-sm font-medium text-ink";
const btnPrimary =
  "flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50";
const btnGhost =
  "rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream-dark";

function emptyStop(): ImmersiveStop {
  return {
    id: "",
    title: "",
    kicker: "",
    depthLabel: "",
    lat: 41.8781,
    lng: -87.6298,
    body: "",
    facts: [],
    sources: [],
    media: null,
    sequence: null,
  };
}

export default function ImmersiveAdminPage() {
  const [tab, setTab] = useState<"tours" | "test">("tours");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-forest">
            <Waves className="h-6 w-6 text-rust" />
            Immersive Tours
          </h1>
          <p className="text-sm text-warm-gray">
            2D/3D hybrid routes, 360 media, and the player test bench
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-white/60 p-1">
          {(
            [
              ["tours", "Tours & media"],
              ["test", "Player test"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "bg-forest text-cream"
                  : "text-ink/70 hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "tours" ? <ToursManager /> : <PlayerTestBench />}
    </div>
  );
}

/* ================================================================== */
/*  Tours & media manager                                              */
/* ================================================================== */

function ToursManager() {
  const [tours, setTours] = useState<TourRow[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus>("loading");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [stopModal, setStopModal] = useState<{
    tourIdx: number;
    stopIdx: number | null;
  } | null>(null);
  const [mediaModal, setMediaModal] = useState<{
    tourIdx: number;
    stopIdx: number;
  } | null>(null);

  const readOnly = dbStatus !== "ok";

  const fetchTours = useCallback(async () => {
    try {
      if (!isSupabaseConfiguredClient()) throw new Error("unconfigured");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("immersive_tours")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows: TourRow[] = (data ?? []).map((r) => ({
        dbId: r.id as string,
        city: r.city as string,
        slug: r.slug as string,
        title: r.title as string,
        dek: (r.dek as string) ?? "",
        medium: (r.medium as ImmersiveTour["medium"]) ?? "underwater",
        heroNote: (r.hero_note as string) ?? undefined,
        stops: Array.isArray(r.stops) ? (r.stops as ImmersiveStop[]) : [],
        published: Boolean(r.published),
      }));
      setTours(rows);
      setDbStatus("ok");
    } catch {
      // Table missing or Supabase unconfigured: show the placeholder
      // tours read-only so the structure is still visible.
      setTours(PLACEHOLDER_IMMERSIVE_TOURS.map((t) => ({ ...t })));
      setDbStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const saveTour = useCallback(
    async (tour: TourRow) => {
      if (readOnly) return;
      setSavingSlug(tour.slug);
      try {
        const supabase = createClient();
        const payload = {
          city: tour.city,
          slug: tour.slug,
          title: tour.title,
          dek: tour.dek,
          medium: tour.medium,
          hero_note: tour.heroNote ?? null,
          stops: tour.stops as unknown,
          published: tour.published,
        };
        if (tour.dbId) {
          const { error } = await supabase
            .from("immersive_tours")
            .update(payload)
            .eq("id", tour.dbId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("immersive_tours")
            .insert(payload);
          if (error) throw error;
        }
        toast.success("Tour saved");
        fetchTours();
      } catch {
        toast.error("Failed to save the tour");
      } finally {
        setSavingSlug(null);
      }
    },
    [fetchTours, readOnly]
  );

  const updateTour = (idx: number, patch: Partial<TourRow>) => {
    setTours((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, ...patch } : t))
    );
  };

  const updateStops = (idx: number, stops: ImmersiveStop[]) => {
    updateTour(idx, { stops });
  };

  const moveStop = (tourIdx: number, stopIdx: number, dir: -1 | 1) => {
    const tour = tours[tourIdx];
    const next = [...tour.stops];
    const target = stopIdx + dir;
    if (target < 0 || target >= next.length) return;
    [next[stopIdx], next[target]] = [next[target], next[stopIdx]];
    updateStops(tourIdx, next);
  };

  const deleteStop = (tourIdx: number, stopIdx: number) => {
    const tour = tours[tourIdx];
    updateStops(
      tourIdx,
      tour.stops.filter((_, i) => i !== stopIdx)
    );
  };

  if (dbStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-rust/40 bg-rust/5 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rust" />
          <div className="text-sm leading-relaxed text-ink/80">
            <p className="font-semibold text-ink">
              Editing is disabled on this environment.
            </p>
            <p className="mt-1">
              The immersive_tours table is not reachable. Run
              supabase/migrations/006_immersive_tours.sql in the Supabase SQL
              editor, then reload. The tours below are the read-only built-in
              fallback that the public site serves in the meantime.
            </p>
          </div>
        </div>
      )}

      {tours.map((tour, tourIdx) => (
        <div
          key={`${tour.city}-${tour.slug}`}
          className="overflow-hidden rounded-xl border border-border bg-white/60 shadow-sm"
        >
          {/* Tour header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="truncate font-display text-lg font-semibold text-forest">
                  {tour.title || "Untitled tour"}
                </h3>
                <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium capitalize text-forest">
                  {tour.medium} / {tour.city}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-warm-gray">
                /tours/{tour.city}/{tour.slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/tours/${tour.city}/${tour.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                title="Open the public tour"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() =>
                  updateTour(tourIdx, { published: !tour.published })
                }
                disabled={readOnly}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
                  tour.published
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tour.published ? "Published" : "Draft"}
              </button>
              <button
                onClick={() => saveTour(tour)}
                disabled={readOnly || savingSlug === tour.slug}
                className={btnPrimary}
              >
                {savingSlug === tour.slug && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>

          {/* Tour fields */}
          <div className="grid grid-cols-1 gap-4 border-b border-border/60 px-6 py-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Title</label>
              <input
                className={inputCls}
                value={tour.title}
                disabled={readOnly}
                onChange={(e) =>
                  updateTour(tourIdx, { title: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Provenance note</label>
              <input
                className={inputCls}
                value={tour.heroNote ?? ""}
                disabled={readOnly}
                placeholder="Shown above the tour, e.g. test capture notice"
                onChange={(e) =>
                  updateTour(tourIdx, { heroNote: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Dek</label>
              <textarea
                className={inputCls}
                rows={2}
                value={tour.dek}
                disabled={readOnly}
                onChange={(e) => updateTour(tourIdx, { dek: e.target.value })}
              />
            </div>
          </div>

          {/* Stops */}
          <div>
            {tour.stops.map((stop, stopIdx) => (
              <div
                key={stop.id || stopIdx}
                className="flex items-center justify-between gap-3 border-b border-border/40 px-6 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-xs text-warm-gray">
                    {String(stopIdx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {stop.title || "Untitled stop"}
                    </p>
                    <p className="truncate text-xs text-warm-gray">
                      {stop.depthLabel || stop.kicker || " "}
                    </p>
                  </div>
                  {stop.media ? (
                    <span className="shrink-0 rounded-full bg-rust/10 px-2.5 py-0.5 text-xs font-medium text-rust">
                      {stop.media.kind === "video360"
                        ? "360 video"
                        : "360 photo"}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      2D only
                    </span>
                  )}
                  {stop.sequence && (
                    <span className="shrink-0 rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                      sequence
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => moveStop(tourIdx, stopIdx, -1)}
                    disabled={readOnly || stopIdx === 0}
                    className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveStop(tourIdx, stopIdx, 1)}
                    disabled={readOnly || stopIdx === tour.stops.length - 1}
                    className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setMediaModal({ tourIdx, stopIdx })}
                    disabled={readOnly}
                    className="rounded-md bg-rust/10 px-2.5 py-1.5 text-xs font-semibold text-rust transition-colors hover:bg-rust/20 disabled:opacity-50"
                  >
                    360 media
                  </button>
                  <button
                    onClick={() => setStopModal({ tourIdx, stopIdx })}
                    disabled={readOnly}
                    className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-50"
                    title="Edit stop"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteStop(tourIdx, stopIdx)}
                    disabled={readOnly}
                    className="rounded-md p-2 text-warm-gray transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Remove stop"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="px-6 py-3">
              <button
                onClick={() => setStopModal({ tourIdx, stopIdx: null })}
                disabled={readOnly}
                className="flex items-center gap-2 text-sm font-medium text-forest transition-colors hover:text-rust disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add stop
              </button>
            </div>
          </div>
        </div>
      ))}

      <p className="text-xs leading-relaxed text-warm-gray">
        Stop edits and reordering are held locally until you press Save on
        the tour. The public page reads the database first and falls back to
        the built-in tour by slug.
      </p>

      {stopModal && (
        <StopEditorModal
          stop={
            stopModal.stopIdx === null
              ? emptyStop()
              : tours[stopModal.tourIdx].stops[stopModal.stopIdx]
          }
          isNew={stopModal.stopIdx === null}
          onClose={() => setStopModal(null)}
          onSave={(next) => {
            const { tourIdx, stopIdx } = stopModal;
            const tour = tours[tourIdx];
            const stops =
              stopIdx === null
                ? [...tour.stops, next]
                : tour.stops.map((s, i) => (i === stopIdx ? next : s));
            updateStops(tourIdx, stops);
            setStopModal(null);
          }}
        />
      )}

      {mediaModal && (
        <MediaAssignModal
          stop={tours[mediaModal.tourIdx].stops[mediaModal.stopIdx]}
          onClose={() => setMediaModal(null)}
          onSave={(media) => {
            const { tourIdx, stopIdx } = mediaModal;
            const tour = tours[tourIdx];
            updateStops(
              tourIdx,
              tour.stops.map((s, i) =>
                i === stopIdx ? { ...s, media } : s
              )
            );
            setMediaModal(null);
          }}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Stop editor modal                                                  */
/* ================================================================== */

function StopEditorModal({
  stop,
  isNew,
  onClose,
  onSave,
}: {
  stop: ImmersiveStop;
  isNew: boolean;
  onClose: () => void;
  onSave: (s: ImmersiveStop) => void;
}) {
  const [form, setForm] = useState<ImmersiveStop>({ ...stop });
  const [factsText, setFactsText] = useState((stop.facts ?? []).join("\n"));
  const [sourcesText, setSourcesText] = useState(stop.sources.join("\n"));

  const handleSave = () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    onSave({
      ...form,
      id: form.id.trim() || slugify(form.title),
      facts: factsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      sources: sourcesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-cream p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-forest">
            {isNew ? "Add Stop" : "Edit Stop"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-warm-gray hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Title</label>
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>
                Kicker <span className="text-warm-gray">(ledger label)</span>
              </label>
              <input
                className={inputCls}
                value={form.kicker ?? ""}
                placeholder="Main Stem / Michigan Avenue"
                onChange={(e) =>
                  setForm((p) => ({ ...p, kicker: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Depth label</label>
              <input
                className={inputCls}
                value={form.depthLabel ?? ""}
                placeholder="Surface to 20 ft"
                onChange={(e) =>
                  setForm((p) => ({ ...p, depthLabel: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Latitude</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={form.lat}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    lat: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Longitude</label>
              <input
                type="number"
                step="any"
                className={inputCls}
                value={form.lng}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    lng: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Body</label>
            <textarea
              className={inputCls}
              rows={6}
              value={form.body}
              onChange={(e) =>
                setForm((p) => ({ ...p, body: e.target.value }))
              }
            />
          </div>

          <div>
            <label className={labelCls}>
              Facts <span className="text-warm-gray">(one per line, real and verifiable only)</span>
            </label>
            <textarea
              className={inputCls}
              rows={3}
              value={factsText}
              onChange={(e) => setFactsText(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>
              Sources <span className="text-warm-gray">(one per line)</span>
            </label>
            <textarea
              className={inputCls}
              rows={3}
              value={sourcesText}
              onChange={(e) => setSourcesText(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button onClick={handleSave} className={btnPrimary}>
            {isNew ? "Add Stop" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  360 media assignment modal with upload                             */
/* ================================================================== */

function MediaAssignModal({
  stop,
  onClose,
  onSave,
}: {
  stop: ImmersiveStop;
  onClose: () => void;
  onSave: (m: Media360 | null) => void;
}) {
  const [media, setMedia] = useState<Media360 | null>(
    stop.media ? { ...stop.media } : null
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = (patch: Partial<Media360>) => {
    setMedia((prev) =>
      prev
        ? { ...prev, ...patch }
        : {
            kind: "video360",
            src: "",
            poster: null,
            initialYawDeg: 0,
            note: null,
            ...patch,
          }
    );
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `360/${Date.now()}-${safeName}`;
      const { publicUrl } = await uploadTourMedia(file, path);
      setField({
        src: publicUrl,
        kind: file.type.startsWith("video/") ? "video360" : "photo360",
      });
      toast.success("Uploaded to the tour-media bucket");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed. ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-cream p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-forest">
              360 Media
            </h2>
            <p className="text-sm text-warm-gray">{stop.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-warm-gray hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setField({
                  kind: "video360",
                  src: BUILTIN_VIDEO,
                  poster: BUILTIN_POSTER,
                  note: "Test capture. A labeled synthetic panorama stands in until real footage is uploaded.",
                })
              }
              className={btnGhost}
            >
              Use built-in test video
            </button>
            <button
              onClick={() =>
                setField({
                  kind: "photo360",
                  src: BUILTIN_PHOTO,
                  poster: BUILTIN_POSTER,
                  note: "Test capture. A labeled synthetic panorama stands in until real footage is uploaded.",
                })
              }
              className={btnGhost}
            >
              Use built-in test photo
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cn(btnPrimary, "!py-2")}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload 360 file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            {media && (
              <button
                onClick={() => setMedia(null)}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Remove media
              </button>
            )}
          </div>

          {media && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Kind</label>
                  <select
                    className={inputCls}
                    value={media.kind}
                    onChange={(e) =>
                      setField({ kind: e.target.value as Media360["kind"] })
                    }
                  >
                    <option value="video360">360 video (equirectangular)</option>
                    <option value="photo360">360 photo (equirectangular)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Opening heading (degrees)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={media.initialYawDeg ?? 0}
                    onChange={(e) =>
                      setField({
                        initialYawDeg: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Source URL</label>
                  <input
                    className={inputCls}
                    value={media.src}
                    placeholder="https://... or /media/360/..."
                    onChange={(e) => setField({ src: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>
                    Poster URL <span className="text-warm-gray">(flat preview)</span>
                  </label>
                  <input
                    className={inputCls}
                    value={media.poster ?? ""}
                    onChange={(e) =>
                      setField({ poster: e.target.value || null })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>
                    Provenance note{" "}
                    <span className="text-warm-gray">
                      (shown on the player; keep test captures labeled)
                    </span>
                  </label>
                  <input
                    className={inputCls}
                    value={media.note ?? ""}
                    onChange={(e) => setField({ note: e.target.value || null })}
                  />
                </div>
              </div>

              {media.src && (
                <div>
                  <p className={labelCls}>Preview</p>
                  <PanoViewer
                    media={media}
                    heightClass="h-[300px]"
                    label={stop.title}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (media && !media.src.trim()) {
                toast.error("Set a source URL or remove the media");
                return;
              }
              onSave(media);
            }}
            className={btnPrimary}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Player test bench                                                  */
/* ================================================================== */

function PlayerTestBench() {
  const [source, setSource] = useState<"photo" | "video" | "url" | "file">(
    "video"
  );
  const [customUrl, setCustomUrl] = useState("");
  const [customKind, setCustomKind] = useState<Media360["kind"]>("video360");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<Media360["kind"]>("video360");

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const media: Media360 | null = useMemo(() => {
    switch (source) {
      case "photo":
        return {
          kind: "photo360",
          src: BUILTIN_PHOTO,
          poster: BUILTIN_POSTER,
          note: "Built-in synthetic test panorama",
        };
      case "video":
        return {
          kind: "video360",
          src: BUILTIN_VIDEO,
          poster: BUILTIN_POSTER,
          note: "Built-in synthetic test panorama",
        };
      case "url":
        return customUrl.trim()
          ? { kind: customKind, src: customUrl.trim(), note: "Custom URL" }
          : null;
      case "file":
        return fileUrl
          ? { kind: fileKind, src: fileUrl, note: "Local file (this session only)" }
          : null;
    }
  }, [source, customUrl, customKind, fileUrl, fileKind]);

  return (
    <div className="space-y-8">
      {/* 360 viewer test */}
      <div className="rounded-xl border border-border bg-white/60 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-forest">
          360 viewer test
        </h2>
        <p className="mt-1 text-sm text-warm-gray">
          Drag to look around, arrows on the keyboard work too. The compass
          should read N at the panorama&apos;s North plate. No database
          needed.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(
            [
              ["video", "Built-in 360 video"],
              ["photo", "Built-in 360 photo"],
              ["url", "Custom URL"],
              ["file", "Local file"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSource(key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                source === key
                  ? "bg-forest text-cream"
                  : "border border-border bg-white text-ink/70 hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {source === "url" && (
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              className={cn(inputCls, "max-w-xl flex-1")}
              placeholder="https://...equirectangular.mp4"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <select
              className={cn(inputCls, "w-44")}
              value={customKind}
              onChange={(e) =>
                setCustomKind(e.target.value as Media360["kind"])
              }
            >
              <option value="video360">Video</option>
              <option value="photo360">Photo</option>
            </select>
          </div>
        )}

        {source === "file" && (
          <div className="mt-3">
            <input
              type="file"
              accept="video/*,image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (fileUrl) URL.revokeObjectURL(fileUrl);
                setFileUrl(URL.createObjectURL(f));
                setFileKind(
                  f.type.startsWith("video/") ? "video360" : "photo360"
                );
              }}
              className="text-sm text-ink/70"
            />
          </div>
        )}

        <div className="mt-5">
          {media ? (
            <PanoViewer media={media} label="Player test" />
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-sm border border-dashed border-border">
              <p className="text-sm text-warm-gray">
                Choose a source above to start the viewer
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hybrid sequence test */}
      <div className="rounded-xl border border-border bg-white/60 p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-forest">
          Hybrid sequence test
        </h2>
        <p className="mt-1 text-sm text-warm-gray">
          The reference cut the Studio format produces: 2D clips with Ken
          Burns moves, titles, every transition, and a 360 segment you can
          grab mid-play.
        </p>
        <div className="mt-5">
          <TimelinePlayer doc={DEMO_SEQUENCE} autoPlay loop />
        </div>
      </div>
    </div>
  );
}
