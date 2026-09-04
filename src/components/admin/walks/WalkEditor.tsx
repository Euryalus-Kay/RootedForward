"use client";

/* ------------------------------------------------------------------ */
/*  One walking tour, edited whole.                                    */
/*                                                                     */
/*  Every edit is held in a local draft and written in a single save,  */
/*  because the row stores the bundle as one JSON document and a       */
/*  half-written tour reaching /api/walk would reach phones with it.   */
/*                                                                     */
/*  The fields here are the ones the owner changes. Geometry, the map  */
/*  furniture, the page frame and the route line are generated work    */
/*  and are given honest raw editors at the bottom instead of a form   */
/*  pretending to understand them.                                     */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn, slugify } from "@/lib/utils";
import type { WalkTourBundle } from "@/lib/tours/registry";
import type { WalkStop, WalkTour } from "@/lib/tours/walk-types";
import {
  WalkApiError,
  deleteWalk,
  emptyStop,
  persistWalk,
  restoreFromCode,
  type AdminWalkRecord,
} from "./api";
import JsonPanel from "./JsonPanel";
import MediaUploader from "./MediaUploader";
import StopEditor from "./StopEditor";
import {
  Field,
  SectionCard,
  TextArea,
  btnGhost,
  btnPrimary,
  btnQuiet,
  eyebrowCls,
  iconBtn,
  paragraphsToText,
  textToParagraphs,
} from "./ui";

export default function WalkEditor({
  record,
  isNew,
  isDefault,
  canRestoreFromCode,
  onBack,
  onSaved,
  onDeleted,
}: {
  record: AdminWalkRecord;
  isNew: boolean;
  /** the walk a shipped iPhone asks for by name. It cannot be taken
   *  off the site or deleted, so the controls that would try are not
   *  offered rather than refused after the click. */
  isDefault: boolean;
  canRestoreFromCode: boolean;
  onBack: () => void;
  onSaved: (next: AdminWalkRecord) => void;
  onDeleted: (slug: string) => void;
}) {
  const [draft, setDraft] = useState<AdminWalkRecord>(record);
  const [dirty, setDirty] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [stopModal, setStopModal] = useState<{ index: number | null } | null>(null);

  const bundle = draft.bundle;
  const tour = bundle.tour;

  /* ---- writing into the draft ---- */

  const patchRecord = (patch: Partial<AdminWalkRecord>) => {
    setDraft((p) => ({ ...p, ...patch }));
    setDirty(true);
  };

  const patchBundle = (patch: Partial<WalkTourBundle>) => {
    setDraft((p) => ({ ...p, bundle: { ...p.bundle, ...patch } }));
    setDirty(true);
  };

  const patchTour = (patch: Partial<WalkTour>) => {
    setDraft((p) => ({ ...p, bundle: { ...p.bundle, tour: { ...p.bundle.tour, ...patch } } }));
    setDirty(true);
  };

  const patchIntro = (patch: Partial<WalkTourBundle["intro"]>) => {
    setDraft((p) => ({
      ...p,
      bundle: { ...p.bundle, intro: { ...p.bundle.intro, ...patch } },
    }));
    setDirty(true);
  };

  const setStops = (stops: WalkStop[]) => patchTour({ stops });

  const moveStop = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= tour.stops.length) return;
    const next = [...tour.stops];
    [next[index], next[target]] = [next[target], next[index]];
    setStops(next);
  };

  const deleteStop = (index: number) => {
    const stop = tour.stops[index];
    if (!window.confirm(`Delete "${stop.title || "this stop"}" from the walk?`)) return;
    setStops(tour.stops.filter((_, i) => i !== index));
  };

  /** The numbers are what a walker reads off the map, so after a
   *  reorder they have to be renumbered on purpose rather than
   *  silently, since detours are numbered too and the owner may have
   *  a reason for a gap. */
  const renumber = () => {
    setStops(tour.stops.map((s, i) => ({ ...s, number: i + 1 })));
    toast.success("Stops renumbered in their current order");
  };

  /* ---- practical cards ---- */

  const patchPractical = (index: number, patch: Partial<{ title: string; text: string }>) =>
    patchTour({
      practical: tour.practical.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    });

  /* ---- saving ---- */

  const handleSave = async () => {
    const slug = draft.slug.trim();
    if (!slug) {
      toast.error("A walk needs a slug");
      return;
    }
    if (!tour.title.trim()) {
      toast.error("A walk needs a title");
      return;
    }
    if (draft.live && tour.stops.length === 0) {
      toast.error("A walk with no stops cannot go live");
      return;
    }
    setSaving(true);
    setProblems([]);
    try {
      const payload: AdminWalkRecord = {
        ...draft,
        slug,
        bundle: { ...draft.bundle, slug },
      };
      const saved = await persistWalk(payload, isNew);
      setDraft(saved);
      setDirty(false);
      onSaved(saved);
      toast.success(
        saved.live
          ? "Saved and live. Phones pick it up on their next launch."
          : "Saved. It stays off the site and off phones until you set it live."
      );
    } catch (err) {
      if (err instanceof WalkApiError && err.problems.length > 0) {
        setProblems(err.problems);
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "The save failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete the ${draft.slug} row? If this walk also exists in the code, the site falls back to that version.`
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteWalk(draft.slug);
      toast.success("Row deleted");
      onDeleted(draft.slug);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (
      !window.confirm(
        `Put the version compiled into the build back over ${draft.slug}? Everything saved here since is lost.`
      )
    )
      return;
    setRestoring(true);
    try {
      await restoreFromCode(draft.slug);
      toast.success("Restored from the code. Reopen the walk to see it.");
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The restore failed");
    } finally {
      setRestoring(false);
    }
  };

  const stopCount = tour.stops.filter((s) => !s.optional).length;
  const detourCount = tour.stops.length - stopCount;

  return (
    <div className="space-y-6 pb-16">
      {/* ---- Header and the save action ---- */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-cream/95 px-4 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <button type="button" onClick={onBack} className={btnQuiet}>
              <ArrowLeft className="h-4 w-4" />
              All walks
            </button>
            <h1 className="mt-2 truncate font-display text-3xl text-forest">
              {tour.title || "Untitled walk"}
            </h1>
            <p className="mt-1 font-body text-xs text-warm-gray">
              {draft.slug || "no slug yet"} · {stopCount} stops
              {detourCount > 0 ? ` and ${detourCount} detours` : ""}
              {dirty ? " · unsaved changes" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {bundle.path && (
              <a
                href={bundle.path}
                target="_blank"
                rel="noopener noreferrer"
                className={btnGhost}
              >
                <ExternalLink className="h-4 w-4" />
                View
              </a>
            )}
            <button
              type="button"
              onClick={() => patchRecord({ live: !draft.live })}
              disabled={isDefault && draft.live}
              title={
                isDefault && draft.live
                  ? "This walk stays on the site. Every iPhone that already has the app asks for it by name."
                  : undefined
              }
              className={cn(
                "rounded-sm border px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                draft.live
                  ? "border-forest bg-forest text-cream hover:bg-forest-light"
                  : "border-border bg-white text-warm-gray hover:bg-cream-dark"
              )}
            >
              {draft.live ? "Live" : "Not live"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={btnPrimary}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>

      {/* ---- What the save refused, field by field ---- */}
      {problems.length > 0 && (
        <div className="rounded-sm border border-rust/40 bg-rust/5 px-5 py-4">
          <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            <AlertTriangle className="h-4 w-4" />
            Not saved yet
          </p>
          <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink">
            A live walk has to survive the decoder inside the app, where nearly every
            field is required, so the site checked it before writing. Fix these and save
            again. Setting the walk not live saves it as a draft with the gaps still in
            it.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 font-mono text-xs leading-relaxed text-ink">
            {problems.map((problem, i) => (
              <li key={i}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- What saving actually does ---- */}
      <div className="rounded-sm border border-forest/30 bg-forest/5 px-5 py-4">
        <p className={eyebrowCls}>What saving does</p>
        <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink">
          Saving writes the walk straight to the live site. The iPhone app asks the site
          for its walks every time it opens and every time it comes back to the front,
          then downloads any photograph or audio file it does not already hold. A change
          you save now is on phones the next time somebody opens the app. There is no App
          Store release, no build, and nothing to wait for.
        </p>
      </div>

      {draft.source === "code" && (
        <div className="rounded-sm border border-rust/40 bg-rust/5 px-5 py-4">
          <p className={eyebrowCls}>This walk still lives in the code</p>
          <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink">
            It is being served from src/lib/tours/registry.ts, which is why it has no
            saved date. Saving copies it into the database, and from that moment the
            saved version is the one the site and the app read. The code version stays
            where it is as the fallback.
          </p>
        </div>
      )}

      {/* ---- The walk ---- */}
      <SectionCard
        title="The walk"
        note="The name and the numbers printed at the top of the tour page and on the app's cover."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Title"
            value={tour.title}
            onChange={(v) => patchTour({ title: v })}
            className="md:col-span-2"
          />
          <TextArea
            label="Dek"
            value={tour.dek}
            onChange={(v) => patchTour({ dek: v })}
            rows={4}
            hint="The paragraph under the title, on the page and in the app's tour list"
            className="md:col-span-2"
          />
          <Field
            label="Start label"
            value={tour.startLabel}
            onChange={(v) => patchTour({ startLabel: v })}
            hint="Where a walker actually stands to begin"
            className="md:col-span-2"
          />
          <Field
            label="Distance in miles"
            value={tour.distanceMiles}
            onChange={(v) => patchTour({ distanceMiles: Number(v) || 0 })}
            type="number"
          />
          <Field
            label="Walking minutes"
            value={tour.walkMinutes}
            onChange={(v) => patchTour({ walkMinutes: Number(v) || 0 })}
            type="number"
            hint="Time between stops, not counting the listening"
          />
          <Field
            label="Listening minutes"
            value={tour.listenMinutes}
            onChange={(v) => patchTour({ listenMinutes: Number(v) || 0 })}
            type="number"
          />
          <Field
            label="Slug"
            value={draft.slug}
            onChange={(v) => patchRecord({ slug: slugify(v) })}
            disabled={!isNew}
            hint={
              isNew
                ? "The key the app asks for, so keep it short and permanent"
                : "Set once and fixed. A saved walk cannot be renamed, since phones hold saved progress against this key."
            }
          />
          <Field
            label="Page path"
            value={bundle.path}
            onChange={(v) => patchBundle({ path: v })}
            placeholder="/tours/hyde-park-walk"
          />
          <Field
            label="Media folder"
            value={bundle.mediaDir}
            onChange={(v) => patchBundle({ mediaDir: v })}
            placeholder="/media/hyde-park-walk"
          />
          <Field
            label="Order in the list"
            value={draft.sortOrder}
            onChange={(v) => patchRecord({ sortOrder: Number(v) || 0 })}
            type="number"
            hint="Lowest first"
          />
        </div>
      </SectionCard>

      {/* ---- Practical notes ---- */}
      <SectionCard
        title="Good to know"
        note="The cards under the tour covering getting there, the ground underfoot, and anything a walker should know before setting out."
      >
        <div className="space-y-4">
          {tour.practical.map((card, i) => (
            <div key={i} className="rounded-sm border border-border bg-cream p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <Field
                    label="Card title"
                    value={card.title}
                    onChange={(v) => patchPractical(i, { title: v })}
                  />
                  <TextArea
                    label="Card text"
                    value={card.text}
                    onChange={(v) => patchPractical(i, { text: v })}
                    rows={5}
                  />
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      patchTour({
                        practical: tour.practical.filter((_, j) => j !== i),
                      })
                    }
                    className={iconBtn}
                    aria-label="Remove this card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchTour({ practical: [...tour.practical, { title: "", text: "" }] })
            }
            className={btnQuiet}
          >
            <Plus className="h-4 w-4" />
            Add a card
          </button>

          <TextArea
            label="Detour notice"
            value={tour.detourNotice ?? ""}
            onChange={(v) => patchTour({ detourNotice: v || undefined })}
            rows={4}
            hint="Shown once in the app when somebody opens their first optional stop. Leave it empty on a walk with no detours."
          />
        </div>
      </SectionCard>

      {/* ---- The opening ---- */}
      <SectionCard
        title="The opening"
        note="What a walker reads or watches before the first stop."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Opening title"
            value={bundle.intro.title}
            onChange={(v) => patchIntro({ title: v })}
          />
          <Field
            label="Byline"
            value={bundle.intro.byline}
            onChange={(v) => patchIntro({ byline: v })}
          />
          <TextArea
            label="Opening paragraphs"
            value={paragraphsToText(bundle.intro.paragraphs)}
            onChange={(v) => patchIntro({ paragraphs: textToParagraphs(v) })}
            rows={10}
            hint="One paragraph per block, separated by a blank line. When the opening has a film these stay as the written version and the app falls back to them."
            className="md:col-span-2"
          />
          {bundle.intro.video ? (
            <>
              <Field
                label="Opening film YouTube id"
                value={bundle.intro.video.youtubeId}
                onChange={(v) =>
                  patchIntro({ video: { ...bundle.intro.video!, youtubeId: v.trim() } })
                }
              />
              <Field
                label="Play control name"
                value={bundle.intro.video.title}
                onChange={(v) =>
                  patchIntro({ video: { ...bundle.intro.video!, title: v } })
                }
              />
              <Field
                label="Poster path"
                value={bundle.intro.video.poster}
                onChange={(v) =>
                  patchIntro({ video: { ...bundle.intro.video!, poster: v } })
                }
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => patchIntro({ video: undefined })}
                  className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove the opening film
                </button>
              </div>
            </>
          ) : (
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() =>
                  patchIntro({ video: { youtubeId: "", title: "", poster: "" } })
                }
                className={btnQuiet}
              >
                <Plus className="h-4 w-4" />
                Add an opening film
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ---- Stops ---- */}
      <SectionCard
        title="Stops"
        note="The order here is the order a walker hears. Reordering does not renumber, so set the numbers when you mean to."
        right={
          <div className="flex items-center gap-3">
            <button type="button" onClick={renumber} className={btnGhost}>
              Renumber
            </button>
            <button
              type="button"
              onClick={() => setStopModal({ index: null })}
              className={btnQuiet}
            >
              <Plus className="h-4 w-4" />
              Add a stop
            </button>
          </div>
        }
      >
        {tour.stops.length === 0 ? (
          <p className="font-body text-sm text-warm-gray">
            No stops yet. Add the first one and it becomes stop number one.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {tour.stops.map((stop, i) => (
              <li
                key={stop.id || i}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="w-8 shrink-0 font-mono text-xs text-warm-gray">
                  {String(stop.number).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-semibold text-ink">
                    {stop.title || "Untitled stop"}
                  </p>
                  <p className="truncate font-body text-xs text-warm-gray">
                    {stop.dek || stop.mapLabel || " "}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  {stop.optional && (
                    <span className="rounded-sm bg-forest/10 px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-widest text-forest">
                      Detour
                    </span>
                  )}
                  {stop.video && (
                    <span className="rounded-sm bg-rust/10 px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-widest text-rust">
                      Film
                    </span>
                  )}
                  {stop.images.length > 0 && (
                    <span className="rounded-sm bg-cream-dark px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                      {stop.images.length} photo{stop.images.length === 1 ? "" : "s"}
                    </span>
                  )}
                  {!stop.audioSrc && (
                    <span className="rounded-sm bg-cream-dark px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                      No audio
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStop(i, -1)}
                    disabled={i === 0}
                    className={iconBtn}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStop(i, 1)}
                    disabled={i === tour.stops.length - 1}
                    className={iconBtn}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStopModal({ index: i })}
                    className={iconBtn}
                    aria-label="Edit this stop"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStop(i)}
                    className={cn(iconBtn, "hover:text-rust")}
                    aria-label="Delete this stop"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* ---- Files ---- */}
      <SectionCard
        title="Files"
        note="Photographs and audio for this walk. Uploading gives you a path to paste into a stop, an opening film poster, or the wash behind the title."
      >
        <MediaUploader />
      </SectionCard>

      {/* ---- The generated parts ---- */}
      <div className="space-y-3">
        <div>
          <h2 className={eyebrowCls}>The drawn parts</h2>
          <p className="mt-1 max-w-3xl font-body text-sm leading-relaxed text-warm-gray">
            These four are generated or measured rather than written, so they are edited
            as raw JSON. Nothing you type reaches the walk until it parses. If a map looks
            wrong after an edit here, set the walk not live and say so, since the app will
            already have taken the change.
          </p>
        </div>

        <JsonPanel
          title="Route line"
          note="The walking line drawn on the map, as latitude and longitude pairs in walk order."
          warning="This is the line, not the stops. Moving a stop does not move it."
          value={tour.route}
          onChange={(next) =>
            patchTour({ route: Array.isArray(next) ? (next as WalkTour["route"]) : [] })
          }
          rows={12}
        />
        <JsonPanel
          title="Detour spurs"
          note="The dashed lines out to the optional stops, one array of pairs per spur."
          value={tour.detourRoutes ?? []}
          onChange={(next) =>
            patchTour({
              detourRoutes: Array.isArray(next)
                ? (next as WalkTour["detourRoutes"])
                : undefined,
            })
          }
          rows={10}
        />
        <JsonPanel
          title="Map furniture"
          note="The survey sheet behind the map, the street and place names set on it, and the tinted park and campus ground."
          warning="Label positions are measured against this walk's own drawing. Copying them from another city puts every name in the wrong place."
          value={bundle.map}
          onChange={(next) => patchBundle({ map: next as WalkTourBundle["map"] })}
          rows={18}
        />
        <JsonPanel
          title="Geometry"
          note="The traced streets, water and rails the map is drawn from, written by scripts/walk-prep-map.mjs."
          warning="Generated work, thousands of coordinates long. Regenerate it with the script rather than editing it by hand."
          value={bundle.geometry}
          onChange={(next) =>
            patchBundle({ geometry: next as WalkTourBundle["geometry"] })
          }
          rows={16}
        />
        <JsonPanel
          title="Page frame"
          note="The browser title, the search description, the ground description under the distance, the wash behind the title, and the closing links."
          value={bundle.page}
          onChange={(next) => patchBundle({ page: next as WalkTourBundle["page"] })}
          rows={16}
        />
      </div>

      {/* ---- Undoing ---- */}
      {!isNew && draft.source === "database" && (
        <div className="rounded-sm border border-border bg-white/60 px-5 py-4">
          <p className={eyebrowCls}>Undoing this walk</p>
          <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-warm-gray">
            Setting a walk not live is the reversible way to take it down.
            {canRestoreFromCode &&
              " Restoring from the code puts back the version compiled into the build, which is the way out of an edit that went wrong."}
            {isDefault
              ? " This walk cannot be deleted, since every iPhone that already has the app asks for it by name."
              : " Deleting the row takes the walk off the site and off the app, and if the build still carries the same slug the site falls back to that version rather than losing it."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            {canRestoreFromCode && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust disabled:opacity-50"
              >
                {restoring ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Restore the version in the code
              </button>
            )}
            {!isDefault && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete this row
              </button>
            )}
          </div>
        </div>
      )}

      {stopModal && (
        <StopEditor
          stop={
            stopModal.index === null
              ? emptyStop(tour.stops.length + 1)
              : tour.stops[stopModal.index]
          }
          isNew={stopModal.index === null}
          onClose={() => setStopModal(null)}
          onSave={(next) => {
            setStops(
              stopModal.index === null
                ? [...tour.stops, next]
                : tour.stops.map((s, i) => (i === stopModal.index ? next : s))
            );
            setStopModal(null);
          }}
        />
      )}
    </div>
  );
}
