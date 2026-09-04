"use client";

/* ------------------------------------------------------------------ */
/*  One stop, edited in full.                                          */
/*                                                                     */
/*  A stop is the unit the phone actually plays, so everything a       */
/*  walker hears or reads at one corner is on this one sheet. The      */
/*  edits are held in the tour until the owner saves the walk, which   */
/*  is why nothing here talks to the network except the uploader.      */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { slugify } from "@/lib/utils";
import type { WalkImage, WalkStop } from "@/lib/tours/walk-types";
import MediaUploader from "./MediaUploader";
import JsonPanel from "./JsonPanel";
import {
  Field,
  TextArea,
  Toggle,
  btnGhost,
  btnPrimary,
  btnQuiet,
  eyebrowCls,
  iconBtn,
  inputCls,
  labelCls,
  paragraphsToText,
  textToParagraphs,
} from "./ui";

/** Latitude and longitude are typed a character at a time, so a plain
 *  number input fights the person using it. The text is local and the
 *  parsed value goes up on every keystroke that parses. */
function NumberField({
  label,
  initial,
  onChange,
  hint,
  placeholder,
  className,
}: {
  label: string;
  initial: number | undefined;
  onChange: (next: number) => void;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(
    initial === undefined || initial === null ? "" : String(initial)
  );
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <input
        className={inputCls}
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = Number(e.target.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
      {hint && <p className="mt-1 font-body text-xs text-warm-gray">{hint}</p>}
    </div>
  );
}

function blankImage(): WalkImage {
  return { src: "", alt: "", credit: "" };
}

function ImageFields({
  image,
  onChange,
  onRemove,
  showAfter,
}: {
  image: WalkImage;
  onChange: (next: WalkImage) => void;
  onRemove?: () => void;
  showAfter?: boolean;
}) {
  const set = (patch: Partial<WalkImage>) => onChange({ ...image, ...patch });
  return (
    <div className="rounded-sm border border-border bg-cream p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field
          label="Image path"
          value={image.src}
          onChange={(v) => set({ src: v })}
          placeholder="/media/hyde-park-walk/name.jpg"
          className="md:col-span-2"
        />
        <Field
          label="Alt text"
          value={image.alt}
          onChange={(v) => set({ alt: v })}
          className="md:col-span-2"
        />
        <Field
          label="Credit"
          value={image.credit}
          onChange={(v) => set({ credit: v })}
          hint="Printed under the plate, so name the archive and the terms"
          className="md:col-span-2"
        />
        <Field
          label="Small tag"
          value={image.label ?? ""}
          onChange={(v) => set({ label: v || undefined })}
          placeholder="1893"
        />
        {showAfter && (
          <Field
            label="Set after paragraph"
            value={image.after ?? ""}
            onChange={(v) =>
              set({ after: v === "" ? undefined : Number(v) })
            }
            type="number"
            hint="Leave empty to stack it at the top of the stop"
          />
        )}
      </div>
      {image.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.src}
          alt=""
          className="mt-3 h-28 w-auto rounded-sm border border-border object-cover"
        />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-3 flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove this image
        </button>
      )}
    </div>
  );
}

export default function StopEditor({
  stop,
  isNew,
  onClose,
  onSave,
}: {
  stop: WalkStop;
  isNew: boolean;
  onClose: () => void;
  onSave: (next: WalkStop) => void;
}) {
  const [form, setForm] = useState<WalkStop>({ ...stop });
  const [transcript, setTranscript] = useState(paragraphsToText(stop.transcript));

  const set = (patch: Partial<WalkStop>) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = () => {
    const title = form.title.trim();
    if (!title) {
      toast.error("A stop needs a title");
      return;
    }
    const paragraphs = textToParagraphs(transcript);
    if (paragraphs.length === 0) {
      toast.error("A stop needs a transcript, since it is what the phone reads and speaks");
      return;
    }
    if (form.lat === 0 || form.lng === 0) {
      toast.error("Set the latitude and longitude, or the stop lands off the map");
      return;
    }
    onSave({
      ...form,
      id: form.id.trim() || slugify(title),
      title,
      dek: form.dek.trim(),
      mapLabel: form.mapLabel.trim() || title,
      transcript: paragraphs,
      images: form.images.filter((img) => img.src.trim()),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
      <div className="my-8 w-full max-w-3xl rounded-sm border border-border bg-cream shadow-xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-cream px-6 py-4">
          <div>
            <p className={eyebrowCls}>{isNew ? "New stop" : `Stop ${form.number}`}</p>
            <h2 className="mt-1 font-display text-2xl text-forest">
              {form.title || "Untitled stop"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} className={btnPrimary}>
              Keep this stop
            </button>
            <button
              type="button"
              onClick={onClose}
              className={iconBtn}
              aria-label="Close without keeping"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="space-y-8 px-6 py-6">
          {/* ---- What it is called ---- */}
          <section>
            <p className={eyebrowCls}>The stop</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Title"
                value={form.title}
                onChange={(v) => set({ title: v })}
                className="md:col-span-2"
              />
              <Field
                label="Dek"
                value={form.dek}
                onChange={(v) => set({ dek: v })}
                hint="One line under the title"
                className="md:col-span-2"
              />
              <Field
                label="Stop id"
                value={form.id}
                onChange={(v) => set({ id: v })}
                hint="Left empty it is made from the title. Changing it on a published walk breaks saved progress on phones."
              />
              <Field
                label="Number"
                value={form.number}
                onChange={(v) => set({ number: Number(v) || 0 })}
                type="number"
                hint="Shown on the map and the cards"
              />
              <Field
                label="Map label"
                value={form.mapLabel}
                onChange={(v) => set({ mapLabel: v })}
                hint="Short enough to sit beside a dot"
              />
              <Field
                label="Look for"
                value={form.lookFor ?? ""}
                onChange={(v) => set({ lookFor: v || undefined })}
                hint="The concrete thing worth seeing here"
              />
              <div className="md:col-span-2">
                <Toggle
                  label="This is an optional detour, off the main route"
                  checked={Boolean(form.optional)}
                  onChange={(v) => set({ optional: v || undefined })}
                />
              </div>
            </div>
          </section>

          {/* ---- Where it is ---- */}
          <section>
            <p className={eyebrowCls}>Where it stands</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberField
                label="Latitude"
                initial={form.lat}
                onChange={(v) => set({ lat: v })}
                placeholder="41.79991"
              />
              <NumberField
                label="Longitude"
                initial={form.lng}
                onChange={(v) => set({ lng: v })}
                placeholder="-87.58295"
              />
            </div>
            <p className="mt-2 font-body text-xs text-warm-gray">
              Right click the spot in Google Maps and the first line of the menu is the
              pair, latitude first.
            </p>
          </section>

          {/* ---- The words ---- */}
          <section>
            <p className={eyebrowCls}>The narration</p>
            <div className="mt-3">
              <TextArea
                label="Transcript"
                value={transcript}
                onChange={setTranscript}
                rows={14}
                hint="One paragraph per block, separated by a blank line. Double asterisks around a phrase set it bold on the page and are stripped before the narration is recorded."
              />
            </div>
          </section>

          {/* ---- Audio ---- */}
          <section>
            <p className={eyebrowCls}>Audio</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Audio path"
                value={form.audioSrc}
                onChange={(v) => set({ audioSrc: v })}
                placeholder="/media/hyde-park-walk/01-stop.mp3"
                className="md:col-span-2"
              />
              <NumberField
                label="Length in seconds"
                initial={form.audioSeconds}
                onChange={(v) => set({ audioSeconds: Math.round(v) })}
                hint="Read off the file itself, since the player draws its bar from this"
              />
            </div>
            <div className="mt-4">
              <MediaUploader />
            </div>
          </section>

          {/* ---- Film ---- */}
          <section>
            <p className={eyebrowCls}>Film</p>
            <p className="mt-1 font-body text-xs text-warm-gray">
              YouTube hosts the film, so this holds the bare video id, never a full
              address. The poster is a still that shows while nobody has pressed play.
            </p>
            {form.video ? (
              <div className="mt-3 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="YouTube id"
                    value={form.video.youtubeId}
                    onChange={(v) =>
                      set({ video: { ...form.video!, youtubeId: v.trim() } })
                    }
                    placeholder="the 11 characters after v="
                  />
                  <Field
                    label="Play control name"
                    value={form.video.title}
                    onChange={(v) => set({ video: { ...form.video!, title: v } })}
                    hint="Read aloud by screen readers"
                  />
                  <Field
                    label="Poster path"
                    value={form.video.poster}
                    onChange={(v) => set({ video: { ...form.video!, poster: v } })}
                    placeholder="/media/hyde-park-walk/film-poster.jpg"
                    className="md:col-span-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set({ video: undefined })}
                  className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove the film
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  set({ video: { youtubeId: "", title: "", poster: "" } })
                }
                className={`${btnQuiet} mt-3`}
              >
                <Plus className="h-4 w-4" />
                Add a film
              </button>
            )}
          </section>

          {/* ---- Photographs ---- */}
          <section>
            <p className={eyebrowCls}>Photographs</p>
            <div className="mt-3 space-y-3">
              {form.images.map((img, i) => (
                <ImageFields
                  key={i}
                  image={img}
                  showAfter
                  onChange={(next) =>
                    set({ images: form.images.map((im, j) => (j === i ? next : im)) })
                  }
                  onRemove={() =>
                    set({ images: form.images.filter((_, j) => j !== i) })
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => set({ images: [...form.images, blankImage()] })}
                className={btnQuiet}
              >
                <Plus className="h-4 w-4" />
                Add a photograph
              </button>
            </div>

            <div className="mt-6">
              <p className={eyebrowCls}>The same place today</p>
              <p className="mt-1 font-body text-xs text-warm-gray">
                Set beside the first archival plate and used as the stop thumbnail in the
                index.
              </p>
              <div className="mt-3">
                {form.nowImage ? (
                  <ImageFields
                    image={form.nowImage}
                    onChange={(next) => set({ nowImage: next })}
                    onRemove={() => set({ nowImage: undefined })}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => set({ nowImage: blankImage() })}
                    className={btnQuiet}
                  >
                    <Plus className="h-4 w-4" />
                    Add a photograph of it today
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ---- Directions ---- */}
          <section>
            <p className={eyebrowCls}>Walking on to the next stop</p>
            {form.toNext ? (
              <div className="mt-3 space-y-4">
                <TextArea
                  label="Directions"
                  value={form.toNext.text}
                  onChange={(v) => set({ toNext: { ...form.toNext!, text: v } })}
                  rows={3}
                  hint="Written the way you would say it out loud on the sidewalk"
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <NumberField
                    label="Distance in meters"
                    initial={form.toNext.distanceMeters}
                    onChange={(v) =>
                      set({ toNext: { ...form.toNext!, distanceMeters: Math.round(v) } })
                    }
                  />
                  <NumberField
                    label="Minutes on foot"
                    initial={form.toNext.minutes}
                    onChange={(v) =>
                      set({ toNext: { ...form.toNext!, minutes: Math.round(v) } })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => set({ toNext: undefined })}
                  className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove the directions, since this is the last stop
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  set({ toNext: { text: "", distanceMeters: 0, minutes: 0 } })
                }
                className={`${btnQuiet} mt-3`}
              >
                <Plus className="h-4 w-4" />
                Add directions to the next stop
              </button>
            )}
          </section>

          {/* ---- The rest ---- */}
          <section className="space-y-3">
            <p className={eyebrowCls}>The rest of this stop</p>
            <JsonPanel
              title="Red plates"
              note="The sidebars naming one mechanism each. Every plate is a title, a list of body paragraphs, and the paragraph it follows."
              value={form.interrupts ?? []}
              onChange={(next) =>
                set({
                  interrupts: Array.isArray(next)
                    ? (next as WalkStop["interrupts"])
                    : [],
                })
              }
              rows={12}
            />
            <JsonPanel
              title="Sources"
              note="Printed in the Sources section under the walk. Each one is a label and a link."
              value={form.sources ?? []}
              onChange={(next) =>
                set({
                  sources: Array.isArray(next) ? (next as WalkStop["sources"]) : [],
                })
              }
              rows={10}
            />
          </section>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} className={btnPrimary}>
            Keep this stop
          </button>
        </footer>
      </div>
    </div>
  );
}
