"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { sequenceDuration } from "@/lib/immersive/studio-client";
import type {
  SequenceDoc,
  SequenceOverlay,
  SequenceSegment,
  StudioMediaItem,
  TransitionType,
} from "@/lib/immersive/types";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TimelineEditor: manual control over the sequence the agents        */
/*  produced. Segment strip on top, inspector for the selected         */
/*  segment below. Every change flows up via onChange.                 */
/* ------------------------------------------------------------------ */

const TRANSITIONS: { value: TransitionType; label: string }[] = [
  { value: "cut", label: "Cut" },
  { value: "crossfade", label: "Crossfade" },
  { value: "dip-black", label: "Dip to black" },
  { value: "slide-left", label: "Slide" },
  { value: "ripple", label: "Ripple" },
];

const KEN_BURNS_PRESETS: {
  label: string;
  value: SequenceSegment["kenBurns"];
}[] = [
  { label: "None", value: null },
  {
    label: "Slow push in",
    value: { fromScale: 1, toScale: 1.1, fromX: 0, fromY: 0, toX: 0, toY: 0 },
  },
  {
    label: "Pull back",
    value: { fromScale: 1.12, toScale: 1, fromX: 0, fromY: 0, toX: 0, toY: 0 },
  },
  {
    label: "Drift right",
    value: {
      fromScale: 1.08,
      toScale: 1.08,
      fromX: -0.5,
      fromY: 0,
      toX: 0.5,
      toY: 0,
    },
  },
  {
    label: "Drift down",
    value: {
      fromScale: 1.08,
      toScale: 1.08,
      fromX: 0,
      fromY: -0.5,
      toX: 0,
      toY: 0.5,
    },
  },
];

interface TimelineEditorProps {
  doc: SequenceDoc;
  media: StudioMediaItem[];
  onChange: (doc: SequenceDoc) => void;
}

export default function TimelineEditor({
  doc,
  media,
  onChange,
}: TimelineEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    doc.segments[0]?.id ?? null
  );

  const mediaById = new Map(media.map((m) => [m.id, m]));
  const selected = doc.segments.find((s) => s.id === selectedId) ?? null;
  const total = sequenceDuration(doc);

  const updateSegment = (id: string, patch: Partial<SequenceSegment>) => {
    onChange({
      ...doc,
      segments: doc.segments.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const moveSegment = (id: string, dir: -1 | 1) => {
    const idx = doc.segments.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= doc.segments.length) return;
    const next = [...doc.segments];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...doc, segments: next });
  };

  const removeSegment = (id: string) => {
    onChange({ ...doc, segments: doc.segments.filter((s) => s.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const updateOverlay = (
    segId: string,
    index: number,
    patch: Partial<SequenceOverlay>
  ) => {
    const seg = doc.segments.find((s) => s.id === segId);
    if (!seg) return;
    const overlays = (seg.overlays ?? []).map((o, i) =>
      i === index ? { ...o, ...patch } : o
    );
    updateSegment(segId, { overlays });
  };

  const numInput =
    "w-20 rounded-md border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust";
  const selectInput =
    "rounded-md border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust";
  const fieldLabel = "block text-[10px] font-semibold uppercase tracking-wider text-warm-gray";

  return (
    <div className="rounded-xl border border-border bg-white/60 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="font-display text-base font-semibold text-forest">
            Timeline
          </h2>
          <p className="text-xs text-warm-gray">
            {doc.segments.length} segment{doc.segments.length === 1 ? "" : "s"}{" "}
            &middot; {total}s total
          </p>
        </div>
        <p className="max-w-xs text-right text-[11px] leading-snug text-warm-gray">
          Click a segment to edit it, or ask the Director in chat.
        </p>
      </div>

      {/* Segment strip */}
      <div className="overflow-x-auto px-5 py-4">
        {doc.segments.length === 0 ? (
          <p className="py-4 text-center text-sm text-warm-gray">
            No segments yet. Generate a cut or add clips from the media bin.
          </p>
        ) : (
          <div className="flex min-w-max items-stretch gap-1">
            {doc.segments.map((seg, i) => {
              const len = Math.max(0.2, seg.outSec - seg.inSec);
              const clip = mediaById.get(seg.clipId);
              const widthPx = Math.max(84, Math.min(260, len * 26));
              const activeSel = seg.id === selectedId;
              return (
                <div key={seg.id} className="flex items-stretch gap-1">
                  {i > 0 && (
                    <div
                      className="flex w-7 shrink-0 flex-col items-center justify-center"
                      title={`${seg.transitionIn.type} ${seg.transitionIn.durationSec}s`}
                    >
                      <span className="font-mono text-[9px] uppercase leading-tight text-warm-gray">
                        {seg.transitionIn.type === "crossfade"
                          ? "xf"
                          : seg.transitionIn.type === "dip-black"
                            ? "dip"
                            : seg.transitionIn.type === "slide-left"
                              ? "sld"
                              : seg.transitionIn.type === "ripple"
                                ? "rpl"
                                : "cut"}
                      </span>
                      <span className="mt-0.5 h-px w-full bg-border" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedId(seg.id)}
                    style={{ width: widthPx }}
                    className={cn(
                      "group relative flex shrink-0 flex-col justify-between overflow-hidden rounded-md border p-2 text-left transition-colors",
                      activeSel
                        ? "border-rust bg-rust/10"
                        : "border-border bg-white hover:border-rust/50",
                      seg.mode === "pano360" && "border-dashed"
                    )}
                  >
                    <span className="truncate text-[11px] font-semibold text-ink">
                      {clip?.name ?? seg.clipId}
                    </span>
                    <span className="mt-2 flex items-center justify-between">
                      <span
                        className={cn(
                          "rounded-sm px-1 py-0.5 font-mono text-[9px] uppercase",
                          seg.mode === "pano360"
                            ? "bg-rust/15 text-rust"
                            : "bg-forest/10 text-forest"
                        )}
                      >
                        {seg.mode === "pano360" ? "360" : "2D"}
                      </span>
                      <span className="font-mono text-[10px] text-warm-gray">
                        {len.toFixed(1)}s
                      </span>
                    </span>
                    {(seg.overlays?.length ?? 0) > 0 && (
                      <span
                        className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rust"
                        title="Has overlays"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspector */}
      {selected && (
        <div className="border-t border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Segment {doc.segments.findIndex((s) => s.id === selected.id) + 1}{" "}
              &middot; {mediaById.get(selected.clipId)?.name ?? selected.clipId}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveSegment(selected.id, -1)}
                className="rounded-md p-1.5 text-warm-gray hover:bg-cream-dark hover:text-ink"
                title="Move earlier"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveSegment(selected.id, 1)}
                className="rounded-md p-1.5 text-warm-gray hover:bg-cream-dark hover:text-ink"
                title="Move later"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeSegment(selected.id)}
                className="rounded-md p-1.5 text-warm-gray hover:bg-red-50 hover:text-red-600"
                title="Remove segment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
            <div>
              <label className={fieldLabel}>In (s)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={selected.inSec}
                onChange={(e) =>
                  updateSegment(selected.id, {
                    inSec: parseFloat(e.target.value) || 0,
                  })
                }
                className={numInput}
              />
            </div>
            <div>
              <label className={fieldLabel}>Out (s)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={selected.outSec}
                onChange={(e) =>
                  updateSegment(selected.id, {
                    outSec: parseFloat(e.target.value) || 0,
                  })
                }
                className={numInput}
              />
            </div>
            <div>
              <label className={fieldLabel}>Transition in</label>
              <select
                value={selected.transitionIn.type}
                onChange={(e) =>
                  updateSegment(selected.id, {
                    transitionIn: {
                      ...selected.transitionIn,
                      type: e.target.value as TransitionType,
                      durationSec:
                        e.target.value === "cut"
                          ? 0
                          : selected.transitionIn.durationSec || 0.9,
                    },
                  })
                }
                className={selectInput}
              >
                {TRANSITIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {selected.transitionIn.type !== "cut" && (
              <div>
                <label className={fieldLabel}>Trans. (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="3"
                  value={selected.transitionIn.durationSec}
                  onChange={(e) =>
                    updateSegment(selected.id, {
                      transitionIn: {
                        ...selected.transitionIn,
                        durationSec: parseFloat(e.target.value) || 0.9,
                      },
                    })
                  }
                  className={numInput}
                />
              </div>
            )}
            {mediaById.get(selected.clipId)?.is360 && (
              <div>
                <label className={fieldLabel}>Mode</label>
                <select
                  value={selected.mode}
                  onChange={(e) =>
                    updateSegment(selected.id, {
                      mode: e.target.value as "2d" | "pano360",
                    })
                  }
                  className={selectInput}
                >
                  <option value="pano360">360 look-around</option>
                  <option value="2d">Flat</option>
                </select>
              </div>
            )}
            {selected.mode === "2d" ? (
              <div>
                <label className={fieldLabel}>Ken Burns</label>
                <select
                  value={KEN_BURNS_PRESETS.findIndex(
                    (p) =>
                      JSON.stringify(p.value) ===
                      JSON.stringify(selected.kenBurns ?? null)
                  )}
                  onChange={(e) =>
                    updateSegment(selected.id, {
                      kenBurns:
                        KEN_BURNS_PRESETS[parseInt(e.target.value, 10)]
                          ?.value ?? null,
                    })
                  }
                  className={selectInput}
                >
                  {KEN_BURNS_PRESETS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label}
                    </option>
                  ))}
                  <option value={-1}>Custom (from Director)</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className={fieldLabel}>Yaw from (deg)</label>
                  <input
                    type="number"
                    value={selected.panoMotion?.fromYawDeg ?? 0}
                    onChange={(e) =>
                      updateSegment(selected.id, {
                        panoMotion: {
                          fromYawDeg: parseFloat(e.target.value) || 0,
                          toYawDeg: selected.panoMotion?.toYawDeg ?? 90,
                          pitchDeg: selected.panoMotion?.pitchDeg ?? 0,
                        },
                      })
                    }
                    className={numInput}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>Yaw to (deg)</label>
                  <input
                    type="number"
                    value={selected.panoMotion?.toYawDeg ?? 90}
                    onChange={(e) =>
                      updateSegment(selected.id, {
                        panoMotion: {
                          fromYawDeg: selected.panoMotion?.fromYawDeg ?? 0,
                          toYawDeg: parseFloat(e.target.value) || 0,
                          pitchDeg: selected.panoMotion?.pitchDeg ?? 0,
                        },
                      })
                    }
                    className={numInput}
                  />
                </div>
              </>
            )}
          </div>

          {/* Overlays */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className={fieldLabel}>Overlays</p>
              <button
                onClick={() =>
                  updateSegment(selected.id, {
                    overlays: [
                      ...(selected.overlays ?? []),
                      {
                        kind: "caption",
                        text: "",
                        startSec: 0.5,
                        endSec: Math.max(
                          1.5,
                          selected.outSec - selected.inSec - 0.5
                        ),
                        position: "lower",
                      },
                    ],
                  })
                }
                className="text-[11px] font-semibold text-rust hover:text-rust-dark"
              >
                + Add overlay
              </button>
            </div>
            {(selected.overlays ?? []).length === 0 ? (
              <p className="mt-1 text-xs text-warm-gray">None</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {(selected.overlays ?? []).map((o, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-md border border-border/70 bg-white px-3 py-2"
                  >
                    <select
                      value={o.kind}
                      onChange={(e) =>
                        updateOverlay(selected.id, i, {
                          kind: e.target.value as SequenceOverlay["kind"],
                        })
                      }
                      className={selectInput}
                    >
                      <option value="title">Title</option>
                      <option value="lower-third">Lower third</option>
                      <option value="caption">Caption</option>
                    </select>
                    <input
                      type="text"
                      value={o.text}
                      placeholder="Overlay text"
                      onChange={(e) =>
                        updateOverlay(selected.id, i, { text: e.target.value })
                      }
                      className="min-w-44 flex-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust"
                    />
                    <div>
                      <label className={fieldLabel}>Start</label>
                      <input
                        type="number"
                        step="0.1"
                        value={o.startSec}
                        onChange={(e) =>
                          updateOverlay(selected.id, i, {
                            startSec: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={cn(numInput, "w-16")}
                      />
                    </div>
                    <div>
                      <label className={fieldLabel}>End</label>
                      <input
                        type="number"
                        step="0.1"
                        value={o.endSec}
                        onChange={(e) =>
                          updateOverlay(selected.id, i, {
                            endSec: parseFloat(e.target.value) || 0,
                          })
                        }
                        className={cn(numInput, "w-16")}
                      />
                    </div>
                    <button
                      onClick={() =>
                        updateSegment(selected.id, {
                          overlays: (selected.overlays ?? []).filter(
                            (_, oi) => oi !== i
                          ),
                        })
                      }
                      className="rounded-md p-1 text-warm-gray hover:bg-red-50 hover:text-red-600"
                      title="Remove overlay"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Collapse hint */}
          <button
            onClick={() => setSelectedId(null)}
            className="mt-3 flex items-center gap-1 text-[11px] font-medium text-warm-gray hover:text-ink"
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Close inspector
          </button>
          <ChevronDown className="hidden" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
