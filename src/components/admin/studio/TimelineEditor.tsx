"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FILTER_PRESETS,
  layoutDoc,
  segmentLenSec,
  segmentSpeed,
} from "@/lib/immersive/timeline";
import { uid } from "@/lib/immersive/studio-client";
import type { PlayerControls } from "@/components/immersive/TimelinePlayer";
import type {
  AudioTrack,
  SequenceDoc,
  SequenceOverlay,
  SequenceSegment,
  StudioMediaItem,
  SubtitleCue,
  TransitionType,
} from "@/lib/immersive/types";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Mic,
  Music,
  Pause,
  Play,
  Redo2,
  Repeat,
  Scissors,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  TimelineEditor: the editing surface. Ruler with a draggable        */
/*  playhead, zoomable segment strip with trim handles and drag        */
/*  reorder, split and duplicate, music and voiceover lanes, a         */
/*  subtitle editor, and a deep inspector (trim, speed, transition,    */
/*  motion, look, frame, audio, text, stickers).                       */
/* ------------------------------------------------------------------ */

const TRANSITIONS: { value: TransitionType; label: string }[] = [
  { value: "cut", label: "Cut" },
  { value: "crossfade", label: "Crossfade" },
  { value: "dip-black", label: "Dip to black" },
  { value: "slide-left", label: "Slide" },
  { value: "ripple", label: "Ripple" },
  { value: "wipe", label: "Wipe" },
  { value: "zoom", label: "Zoom" },
  { value: "blur", label: "Blur" },
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

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
}

const numInput =
  "w-20 rounded-md border border-white/10 bg-[#141312] px-2 py-1 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-rust";
const selectInput =
  "rounded-md border border-white/10 bg-[#141312] px-2 py-1 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-rust";
const fieldLabel =
  "block text-[10px] font-semibold uppercase tracking-wider text-warm-gray";
const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-md text-warm-gray transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-30";
const ghostBtn =
  "flex h-7 items-center rounded-md border border-white/10 px-2 text-[10px] font-semibold text-cream/70 transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-40";

interface TimelineEditorProps {
  doc: SequenceDoc;
  media: StudioMediaItem[];
  onChange: (doc: SequenceDoc) => void;
  playerTime: number;
  controls: React.MutableRefObject<PlayerControls | null>;
  playing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  loop: boolean;
  onToggleLoop: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onSplit: () => void;
  /** Insert a bin clip at a timeline index (drag-and-drop from the bin) */
  onInsertClip: (clipId: string, index: number) => void;
  onSegmentAI: (segmentId: string, instruction: string) => void;
  aiBusy: boolean;
}

/** Cached waveform peaks (and decoded duration) per audio URL */
const waveformCache = new Map<string, { peaks: number[]; durSec: number }>();

function WaveformLane({
  url,
  offsetSec,
  pxPerSec,
  totalSec,
  durationSec,
  loop,
  label = "Music bed",
  tint = "rgba(245,240,232,0.45)",
}: {
  url: string;
  offsetSec: number;
  pxPerSec: number;
  totalSec: number;
  durationSec: number;
  loop: boolean;
  label?: string;
  tint?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let entry = waveformCache.get(url);
      if (!entry) {
        try {
          const buf = await fetch(url).then((r) => r.arrayBuffer());
          const actx = new AudioContext();
          const audio = await actx.decodeAudioData(buf);
          actx.close().catch(() => undefined);
          const ch = audio.getChannelData(0);
          const buckets = 480;
          const per = Math.max(1, Math.floor(ch.length / buckets));
          entry = {
            durSec: audio.duration,
            peaks: Array.from({ length: buckets }, (_, i) => {
              let max = 0;
              for (let j = i * per; j < (i + 1) * per && j < ch.length; j += 40) {
                const v = Math.abs(ch[j]);
                if (v > max) max = v;
              }
              return max;
            }),
          };
          waveformCache.set(url, entry);
        } catch {
          entry = { peaks: [], durSec: 0 };
        }
      }
      if (cancelled) return;
      const canvas = canvasRef.current;
      const peaks = entry.peaks;
      const realDur = durationSec > 0 ? durationSec : entry.durSec;
      if (!canvas || peaks.length === 0) return;
      const w = Math.max(10, Math.round((totalSec - offsetSec) * pxPerSec));
      canvas.width = w;
      canvas.height = 20;
      const c = canvas.getContext("2d");
      if (!c) return;
      c.clearRect(0, 0, w, 20);
      c.fillStyle = tint;
      const span = loop
        ? totalSec - offsetSec
        : Math.min(realDur || totalSec, totalSec - offsetSec);
      const spanPx = span * pxPerSec;
      for (let x = 0; x < spanPx; x += 2) {
        const tSec = (x / pxPerSec) % Math.max(0.01, realDur || 1);
        const idx = Math.min(
          peaks.length - 1,
          Math.floor((tSec / Math.max(0.01, realDur || 1)) * peaks.length)
        );
        const h = Math.max(1, peaks[idx] * 18);
        c.fillRect(x, 10 - h / 2, 1.4, h);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, offsetSec, pxPerSec, totalSec, durationSec, loop, tint]);

  return (
    <canvas
      ref={canvasRef}
      className="h-5"
      style={{ marginLeft: offsetSec * pxPerSec }}
      title={label}
    />
  );
}

export default function TimelineEditor({
  doc,
  media,
  onChange,
  playerTime,
  controls,
  playing,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  loop,
  onToggleLoop,
  muted,
  onToggleMute,
  onSplit,
  onInsertClip,
  onSegmentAI,
  aiBusy,
}: TimelineEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    doc.segments[0]?.id ?? null
  );
  const [pxPerSec, setPxPerSec] = useState(34);
  const [inspectorTab, setInspectorTab] = useState<
    "trim" | "look" | "frame" | "audio" | "text" | "stickers"
  >("trim");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [trimReadout, setTrimReadout] = useState<string | null>(null);
  const [styleClipboard, setStyleClipboard] = useState<Pick<
    SequenceSegment,
    "filter" | "transitionIn"
  > | null>(null);
  const [aiDraft, setAiDraft] = useState("");
  const stripRef = useRef<HTMLDivElement>(null);
  const pxPerSecRef = useRef(34);
  // Pointer-based clip moving: the block follows the cursor and an
  // insertion bar marks where it will land. HTML5 drag-and-drop is
  // only used for drops coming FROM the media bin.
  const moveRef = useRef<{
    idx: number;
    startX: number;
    moved: boolean;
    curInsert: number;
  } | null>(null);
  const [movePreview, setMovePreview] = useState<{
    idx: number;
    dx: number;
    insertAt: number;
  } | null>(null);
  const [binDropAt, setBinDropAt] = useState<number | null>(null);
  const suppressClickRef = useRef(false);
  const laneDragRef = useRef<{
    key: "music" | "voiceover";
    startX: number;
    orig: number;
  } | null>(null);
  const trimRef = useRef<{
    segId: string;
    edge: "in" | "out";
    startX: number;
    origIn: number;
    origOut: number;
  } | null>(null);

  const mediaById = new Map(media.map((m) => [m.id, m]));
  const audioMedia = media.filter((m) => m.kind === "audio");
  const imageMedia = media.filter((m) => m.kind === "image");
  const { timed, total } = layoutDoc(doc);
  const selected = doc.segments.find((s) => s.id === selectedId) ?? null;
  const selectedTimed = timed.find((e) => e.seg.id === selectedId) ?? null;

  /* --------------------------- mutations --------------------------- */

  const updateSegment = useCallback(
    (id: string, patch: Partial<SequenceSegment>) => {
      onChange({
        ...doc,
        segments: doc.segments.map((s) =>
          s.id === id ? { ...s, ...patch } : s
        ),
      });
    },
    [doc, onChange]
  );

  const moveSegment = (id: string, dir: -1 | 1) => {
    const idx = doc.segments.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= doc.segments.length) return;
    const next = [...doc.segments];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ ...doc, segments: next });
  };

  const reorderSegment = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const next = [...doc.segments];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ ...doc, segments: next });
  };

  const removeSegment = (id: string) => {
    onChange({ ...doc, segments: doc.segments.filter((s) => s.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateSegment = (id: string) => {
    const idx = doc.segments.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const copy: SequenceSegment = JSON.parse(
      JSON.stringify(doc.segments[idx])
    );
    copy.id = uid("seg");
    copy.stickers = (copy.stickers ?? []).map((st) => ({
      ...st,
      id: uid("st"),
    }));
    const next = [...doc.segments];
    next.splice(idx + 1, 0, copy);
    onChange({ ...doc, segments: next });
    setSelectedId(copy.id);
  };

  /* ---------------------------- trimming --------------------------- */

  const onTrimPointerDown = (
    e: React.PointerEvent,
    seg: SequenceSegment,
    edge: "in" | "out"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    trimRef.current = {
      segId: seg.id,
      edge,
      startX: e.clientX,
      origIn: seg.inSec,
      origOut: seg.outSec,
    };
  };

  const onTrimPointerMove = (e: React.PointerEvent) => {
    const trim = trimRef.current;
    if (!trim) return;
    const seg = doc.segments.find((s) => s.id === trim.segId);
    if (!seg) return;
    const clip = mediaById.get(seg.clipId);
    const maxOut = clip?.durationSec ?? Number.POSITIVE_INFINITY;
    const speed = segmentSpeed(seg);
    const deltaMedia = ((e.clientX - trim.startX) / pxPerSec) * speed;
    if (trim.edge === "in") {
      const nextIn = Math.max(
        0,
        Math.min(trim.origIn + deltaMedia, seg.outSec - 0.2 * speed)
      );
      updateSegment(seg.id, { inSec: Math.round(nextIn * 10) / 10 });
      setTrimReadout(`in ${(Math.round(nextIn * 10) / 10).toFixed(1)}s`);
    } else {
      const nextOut = Math.min(
        maxOut,
        Math.max(trim.origOut + deltaMedia, seg.inSec + 0.2 * speed)
      );
      updateSegment(seg.id, { outSec: Math.round(nextOut * 10) / 10 });
      setTrimReadout(`out ${(Math.round(nextOut * 10) / 10).toFixed(1)}s`);
    }
  };

  const onTrimPointerUp = () => {
    trimRef.current = null;
    setTrimReadout(null);
  };

  /* ----------------------- wheel + follow -------------------------- */

  useEffect(() => {
    pxPerSecRef.current = pxPerSec;
  }, [pxPerSec]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    // Editor-style wheel: plain wheel pans the timeline, ctrl/cmd
    // wheel zooms around the cursor. Needs a non-passive listener.
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const within = e.clientX - rect.left;
        const tAt = (within + el.scrollLeft) / pxPerSecRef.current;
        const next = Math.min(
          90,
          Math.max(10, pxPerSecRef.current * (e.deltaY < 0 ? 1.12 : 0.9))
        );
        // Write the ref synchronously so fast consecutive wheel ticks
        // compound instead of all reading the pre-zoom value.
        pxPerSecRef.current = next;
        setPxPerSec(next);
        requestAnimationFrame(() => {
          el.scrollLeft = Math.max(0, tAt * next - within);
        });
      } else if (
        Math.abs(e.deltaY) > Math.abs(e.deltaX) &&
        el.scrollWidth > el.clientWidth
      ) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    // Keep the playhead in view while playing
    if (!playing) return;
    const el = stripRef.current;
    if (!el) return;
    const x = Math.min(playerTime, total) * pxPerSec;
    if (x < el.scrollLeft + 30 || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollLeft = Math.max(0, x - 100);
    }
  }, [playerTime, playing, pxPerSec, total]);

  useEffect(() => {
    // Delete / Backspace removes the selected segment
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeSegment(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, doc]);

  /* ------------------------ clip moving ---------------------------- */

  /** Insertion index for a pointer position over the strip. */
  const insertIndexAt = (clientX: number): number => {
    const strip = stripRef.current;
    if (!strip) return doc.segments.length;
    const rect = strip.getBoundingClientRect();
    const t = (clientX - rect.left + strip.scrollLeft) / pxPerSec;
    for (let k = 0; k < timed.length; k++) {
      if (t < timed[k].startSec + timed[k].lenSec / 2) return k;
    }
    return timed.length;
  };

  const onBlockPointerDown = (e: React.PointerEvent, i: number) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-trim]")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moveRef.current = {
      idx: i,
      startX: e.clientX,
      moved: false,
      curInsert: i,
    };
  };

  const onBlockPointerMove = (e: React.PointerEvent) => {
    const m = moveRef.current;
    if (!m) return;
    const dx = e.clientX - m.startX;
    // A small threshold keeps plain clicks selecting instead of moving
    if (!m.moved && Math.abs(dx) < 5) return;
    m.moved = true;
    const strip = stripRef.current;
    if (strip) {
      const r = strip.getBoundingClientRect();
      if (e.clientX > r.right - 48) strip.scrollLeft += 14;
      else if (e.clientX < r.left + 48) strip.scrollLeft -= 14;
    }
    m.curInsert = insertIndexAt(e.clientX);
    setMovePreview({ idx: m.idx, dx, insertAt: m.curInsert });
  };

  const onBlockPointerUp = () => {
    const m = moveRef.current;
    moveRef.current = null;
    if (m && m.moved) {
      suppressClickRef.current = true;
      // The browser's synthesized click lands within this task; clear
      // the flag right after so an unrelated later click never eats it.
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      let to = m.curInsert;
      if (to > m.idx) to -= 1;
      if (to !== m.idx) reorderSegment(m.idx, to);
    }
    setMovePreview(null);
  };

  /* -------------------- audio lane offset drag ---------------------- */

  const onLanePointerDown = (
    e: React.PointerEvent,
    key: "music" | "voiceover",
    offset: number
  ) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    laneDragRef.current = { key, startX: e.clientX, orig: offset };
  };

  const onLanePointerMove = (e: React.PointerEvent) => {
    const d = laneDragRef.current;
    if (!d) return;
    const track = d.key === "music" ? doc.music : doc.voiceover;
    if (!track) return;
    const next =
      Math.round(
        Math.max(0, d.orig + (e.clientX - d.startX) / pxPerSec) * 10
      ) / 10;
    if (next !== (track.offsetSec ?? 0)) {
      setTrack(d.key, { ...track, offsetSec: next });
    }
  };

  const onLanePointerUp = () => {
    laneDragRef.current = null;
  };

  /* ------------------------- ruler seeking ------------------------- */

  const seekFromRuler = (e: React.PointerEvent) => {
    const strip = stripRef.current;
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const x = e.clientX - rect.left + strip.scrollLeft;
    let t = Math.max(0, Math.min(total, x / pxPerSec));
    // Snap to segment boundaries within ~7px
    for (const { startSec, lenSec } of timed) {
      for (const b of [startSec, startSec + lenSec]) {
        if (Math.abs(b - t) * pxPerSec < 7) {
          t = b;
          break;
        }
      }
    }
    controls.current?.seek(t);
  };

  /* -------------------------- doc helpers -------------------------- */

  const setTrack = (key: "music" | "voiceover", track: AudioTrack | null) => {
    onChange({ ...doc, [key]: track });
  };

  const updateCue = (id: string, patch: Partial<SubtitleCue>) => {
    onChange({
      ...doc,
      subtitles: (doc.subtitles ?? []).map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  };

  /* ------------------------------ render --------------------------- */

  const playheadX = Math.min(playerTime, total) * pxPerSec;
  const tickEvery = pxPerSec >= 24 ? 1 : pxPerSec >= 12 ? 5 : 10;
  const ticks: number[] = [];
  for (let s = 0; s <= Math.ceil(total); s += tickEvery) ticks.push(s);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1B1A18]">
      {/* Header / toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => controls.current?.toggle()}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-rust text-cream transition-colors hover:bg-rust-light"
            title="Play / pause (space)"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <span className="ml-1 font-mono text-xs text-cream/90">
            {fmt(Math.min(playerTime, total))}{" "}
            <span className="text-warm-gray">/ {fmt(total)}</span>
          </span>
          {trimReadout && (
            <span className="ml-2 rounded-sm bg-rust/15 px-2 py-0.5 font-mono text-[10px] text-rust-light">
              {trimReadout}
            </span>
          )}
          <button
            onClick={onToggleMute}
            className={cn(iconBtn, muted && "bg-amber-400/15 text-amber-300")}
            title={muted ? "Unmute the monitor" : "Mute the monitor"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onToggleLoop}
            className={cn(iconBtn, loop && "bg-rust/15 text-rust-light")}
            title="Loop playback"
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={iconBtn}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={iconBtn}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button
            onClick={onSplit}
            className={iconBtn}
            title="Split at playhead (S)"
          >
            <Scissors className="h-4 w-4" />
          </button>
          <button
            onClick={() => selected && duplicateSegment(selected.id)}
            disabled={!selected}
            className={iconBtn}
            title="Duplicate segment"
          >
            <Copy className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button
            onClick={() => setPxPerSec((v) => Math.max(10, v - 8))}
            className={iconBtn}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPxPerSec((v) => Math.min(90, v + 8))}
            className={iconBtn}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      {/* Ruler + strip */}
      <div
        ref={stripRef}
        className="overflow-x-auto px-4 pt-2"
        onPointerMove={onTrimPointerMove}
        onPointerUp={onTrimPointerUp}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("application/x-rf-clip")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setBinDropAt(insertIndexAt(e.clientX));
          }
        }}
        onDragLeave={() => setBinDropAt(null)}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes("application/x-rf-clip")) return;
          e.preventDefault();
          const clipId = e.dataTransfer.getData("application/x-rf-clip");
          const at = insertIndexAt(e.clientX);
          setBinDropAt(null);
          if (clipId) onInsertClip(clipId, at);
        }}
      >
        <div
          className="relative min-w-full"
          style={{ width: Math.max(total * pxPerSec + 60, 300) }}
        >
          {/* Ruler */}
          <div
            className="relative h-6 cursor-pointer select-none border-b border-white/15"
            onPointerDown={(e) => {
              seekFromRuler(e);
              const move = (ev: PointerEvent) =>
                seekFromRuler(ev as unknown as React.PointerEvent);
              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
          >
            {ticks.map((s) => (
              <div
                key={s}
                className="absolute bottom-0 h-2 border-l border-warm-gray/40"
                style={{ left: s * pxPerSec }}
              >
                <span className="absolute -top-4 left-0.5 font-mono text-[9px] text-warm-gray">
                  {s % 5 === 0 || tickEvery > 1 ? `${s}s` : ""}
                </span>
              </div>
            ))}
          </div>

          {/* Segment strip */}
          <div
            className="relative flex h-[74px] items-stretch py-2"
            onPointerDown={(e) => {
              // Clicking empty timeline parks the playhead there
              if (e.target === e.currentTarget) seekFromRuler(e);
            }}
          >
            {(movePreview || binDropAt !== null) &&
              (() => {
                const at = movePreview ? movePreview.insertAt : binDropAt!;
                const x =
                  at >= timed.length
                    ? timed.length
                      ? timed[timed.length - 1].startSec +
                        timed[timed.length - 1].lenSec
                      : 0
                    : timed[at].startSec;
                return (
                  <div
                    className="pointer-events-none absolute bottom-1 top-1 z-20 w-0.5 rounded bg-rust"
                    style={{ left: x * pxPerSec }}
                  />
                );
              })()}
            {doc.segments.length === 0 && (
              <p className="self-center px-2 text-sm text-warm-gray">
                No segments yet. Generate a cut or add clips from the media
                bin.
              </p>
            )}
            {timed.map((entry, i) => {
              const { seg, startSec, lenSec } = entry;
              const clip = mediaById.get(seg.clipId);
              const activeSel = seg.id === selectedId;
              return (
                <div
                  key={seg.id}
                  className={cn(
                    "group absolute top-2 flex h-[58px] flex-col justify-between overflow-hidden rounded-md border p-1.5 text-left transition-colors",
                    activeSel
                      ? "z-10 border-rust bg-rust/20"
                      : "border-white/15 bg-[#26241F] hover:border-rust/60",
                    seg.mode === "pano360" && "border-dashed",
                    movePreview && movePreview.idx === i
                      ? "z-30 cursor-grabbing opacity-80 shadow-xl ring-1 ring-rust"
                      : "cursor-grab"
                  )}
                  style={{
                    left:
                      startSec * pxPerSec +
                      (movePreview && movePreview.idx === i
                        ? movePreview.dx
                        : 0),
                    width: Math.max(34, lenSec * pxPerSec),
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => onBlockPointerDown(e, i)}
                  onPointerMove={onBlockPointerMove}
                  onPointerUp={onBlockPointerUp}
                  onPointerCancel={onBlockPointerUp}
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    setSelectedId(seg.id);
                  }}
                  onDoubleClick={() => controls.current?.seek(startSec + 0.01)}
                  role="button"
                  tabIndex={0}
                >
                  {clip?.thumb && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45"
                      style={{ backgroundImage: `url(${clip.thumb})` }}
                    />
                  )}
                  {clip?.thumb && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/70"
                    />
                  )}
                  <span className="pointer-events-none relative truncate text-[10px] font-semibold text-cream">
                    {clip?.name ?? seg.clipId}
                  </span>
                  <span className="pointer-events-none relative flex items-center gap-1">
                    <span
                      className={cn(
                        "rounded-sm px-1 font-mono text-[8px] uppercase",
                        seg.mode === "pano360"
                          ? "bg-rust/30 text-rust-light"
                          : "bg-emerald-400/15 text-emerald-300"
                      )}
                    >
                      {seg.mode === "pano360" ? "360" : "2D"}
                    </span>
                    {(seg.speed ?? 1) !== 1 && (
                      <span className="rounded-sm bg-amber-400/20 px-1 font-mono text-[8px] text-amber-300">
                        {seg.speed}x
                      </span>
                    )}
                    {seg.filter && (
                      <span className="rounded-sm bg-emerald-400/15 px-1 font-mono text-[8px] text-emerald-300">
                        fx
                      </span>
                    )}
                    {(seg.overlays?.length ?? 0) > 0 && (
                      <span className="rounded-sm bg-rust/30 px-1 font-mono text-[8px] text-rust-light">
                        T
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[9px] text-warm-gray-light">
                      {lenSec.toFixed(1)}s
                    </span>
                  </span>
                  {i > 0 && seg.transitionIn.type !== "cut" && (
                    <span className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-rust/50" />
                  )}

                  {/* Trim handles */}
                  <div
                    data-trim
                    draggable={false}
                    className="absolute left-0 top-0 h-full w-2 cursor-ew-resize touch-none opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "rgba(196,93,62,0.5)" }}
                    onPointerDown={(e) => onTrimPointerDown(e, seg, "in")}
                    title="Drag to trim in"
                  />
                  <div
                    data-trim
                    draggable={false}
                    className="absolute right-0 top-0 h-full w-2 cursor-ew-resize touch-none opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "rgba(196,93,62,0.5)" }}
                    onPointerDown={(e) => onTrimPointerDown(e, seg, "out")}
                    title="Drag to trim out"
                  />
                </div>
              );
            })}
          </div>

          {/* Audio lanes (drag horizontally to set the start offset) */}
          {doc.music && mediaById.get(doc.music.clipId) && (
            <div
              className={cn(
                "flex h-5 touch-none items-center",
                laneDragRef.current?.key === "music"
                  ? "cursor-grabbing"
                  : "cursor-ew-resize",
                doc.music.muted && "opacity-30"
              )}
              title="Music bed. Drag to change when it starts."
              onPointerDown={(e) =>
                onLanePointerDown(e, "music", doc.music?.offsetSec ?? 0)
              }
              onPointerMove={onLanePointerMove}
              onPointerUp={onLanePointerUp}
              onPointerCancel={onLanePointerUp}
            >
              <WaveformLane
                url={mediaById.get(doc.music.clipId)!.url}
                offsetSec={doc.music.offsetSec ?? 0}
                pxPerSec={pxPerSec}
                totalSec={total}
                durationSec={mediaById.get(doc.music.clipId)!.durationSec ?? 0}
                loop={doc.music.loop}
                label="Music bed"
              />
            </div>
          )}
          {doc.voiceover && mediaById.get(doc.voiceover.clipId) && (
            <div
              className={cn(
                "flex h-5 touch-none items-center",
                laneDragRef.current?.key === "voiceover"
                  ? "cursor-grabbing"
                  : "cursor-ew-resize",
                doc.voiceover.muted && "opacity-30"
              )}
              title="Voiceover. Drag to change when it starts."
              onPointerDown={(e) =>
                onLanePointerDown(e, "voiceover", doc.voiceover?.offsetSec ?? 0)
              }
              onPointerMove={onLanePointerMove}
              onPointerUp={onLanePointerUp}
              onPointerCancel={onLanePointerUp}
            >
              <WaveformLane
                url={mediaById.get(doc.voiceover.clipId)!.url}
                offsetSec={doc.voiceover.offsetSec ?? 0}
                pxPerSec={pxPerSec}
                totalSec={total}
                durationSec={
                  mediaById.get(doc.voiceover.clipId)!.durationSec ?? 0
                }
                loop={doc.voiceover.loop}
                label="Voiceover"
                tint="rgba(212,118,92,0.55)"
              />
            </div>
          )}

          {/* Playhead */}
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-rust"
            style={{ left: playheadX }}
          >
            <div className="absolute -left-[5px] top-0 h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-rust" />
          </div>
        </div>
      </div>

      {/* Track lanes */}
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-2">
        <TrackChip
          icon={<Music className="h-3.5 w-3.5" />}
          label="Music"
          track={doc.music ?? null}
          mediaById={mediaById}
          audioMedia={audioMedia}
          onSet={(t) => setTrack("music", t)}
        />
        <TrackChip
          icon={<Mic className="h-3.5 w-3.5" />}
          label="Voiceover"
          track={doc.voiceover ?? null}
          mediaById={mediaById}
          audioMedia={audioMedia}
          onSet={(t) => setTrack("voiceover", t)}
        />
        <button
          onClick={() => setShowSubtitles((v) => !v)}
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
            showSubtitles
              ? "border-rust bg-rust/15 text-rust-light"
              : "border-white/10 text-cream/60 hover:text-cream"
          )}
        >
          Subtitles ({doc.subtitles?.length ?? 0})
        </button>
        <span className="ml-auto text-[10px] text-warm-gray">
          Space play &middot; S split &middot; Del removes &middot; drag clips to
          move them &middot; wheel pans, Ctrl+wheel zooms
        </span>
      </div>

      {/* Subtitle editor */}
      {showSubtitles && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className={fieldLabel}>Subtitles (absolute timeline seconds)</p>
            <button
              onClick={() =>
                onChange({
                  ...doc,
                  subtitles: [
                    ...(doc.subtitles ?? []),
                    {
                      id: uid("cue"),
                      startSec:
                        Math.round(
                          (controls.current?.getTime() ?? 0) * 10
                        ) / 10,
                      endSec:
                        Math.round(
                          ((controls.current?.getTime() ?? 0) + 2.5) * 10
                        ) / 10,
                      text: "",
                    },
                  ],
                })
              }
              className="text-[11px] font-semibold text-rust-light hover:text-rust"
            >
              + Add cue at playhead
            </button>
          </div>
          {(doc.subtitles ?? []).length === 0 ? (
            <p className="mt-1 text-xs text-warm-gray">
              None yet. Ask the Director to write narration, or add cues by
              hand.
            </p>
          ) : (
            <ul className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {(doc.subtitles ?? [])
                .slice()
                .sort((a, b) => a.startSec - b.startSec)
                .map((cue) => (
                  <li key={cue.id} className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={cue.startSec}
                      onChange={(e) =>
                        updateCue(cue.id, {
                          startSec: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={cn(numInput, "w-16")}
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={cue.endSec}
                      onChange={(e) =>
                        updateCue(cue.id, {
                          endSec: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={cn(numInput, "w-16")}
                    />
                    <input
                      value={cue.text}
                      placeholder="Cue text"
                      onChange={(e) =>
                        updateCue(cue.id, { text: e.target.value })
                      }
                      className="min-w-40 flex-1 rounded-md border border-white/10 bg-[#141312] px-2 py-1 text-xs text-cream placeholder:text-warm-gray"
                    />
                    <button
                      onClick={() =>
                        onChange({
                          ...doc,
                          subtitles: (doc.subtitles ?? []).filter(
                            (c) => c.id !== cue.id
                          ),
                        })
                      }
                      className="rounded-md p-1 text-warm-gray hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {/* Inspector */}
      {selected && selectedTimed && (
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  ["trim", "Trim"],
                  ["look", "Look"],
                  ["frame", "Frame"],
                  ["audio", "Audio"],
                  ["text", "Text"],
                  ["stickers", "Stickers"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setInspectorTab(key)}
                  className={cn(
                    "flex h-7 items-center rounded-md px-2.5 text-[11px] font-semibold transition-colors",
                    inspectorTab === key
                      ? "bg-rust text-cream"
                      : "text-cream/50 hover:text-cream"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setStyleClipboard({
                    filter: selected.filter
                      ? { ...selected.filter }
                      : null,
                    transitionIn: { ...selected.transitionIn },
                  });
                  toast.success("Style copied (grade + transition)");
                }}
                className={ghostBtn}
                title="Copy this segment's grade and transition"
              >
                Copy style
              </button>
              <button
                onClick={() => {
                  if (!styleClipboard) return;
                  updateSegment(selected.id, {
                    filter: styleClipboard.filter
                      ? { ...styleClipboard.filter }
                      : null,
                    transitionIn: { ...styleClipboard.transitionIn },
                  });
                }}
                disabled={!styleClipboard}
                className={ghostBtn}
                title="Paste the copied style onto this segment"
              >
                Paste
              </button>
              <button
                onClick={() => {
                  const src = styleClipboard ?? {
                    filter: selected.filter ? { ...selected.filter } : null,
                    transitionIn: { ...selected.transitionIn },
                  };
                  onChange({
                    ...doc,
                    segments: doc.segments.map((s, i) => ({
                      ...s,
                      filter: src.filter ? { ...src.filter } : null,
                      transitionIn:
                        i === 0
                          ? s.transitionIn
                          : { ...src.transitionIn },
                    })),
                  });
                  toast.success("Style applied to every segment");
                }}
                className={ghostBtn}
                title="Apply this grade and transition to the whole cut"
              >
                Apply to all
              </button>
              <span className="mx-1 h-5 w-px bg-white/10" />
              <button
                onClick={() => moveSegment(selected.id, -1)}
                className={iconBtn}
                title="Move earlier"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveSegment(selected.id, 1)}
                className={iconBtn}
                title="Move later"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeSegment(selected.id)}
                className="rounded-md p-1.5 text-warm-gray hover:bg-red-500/10 hover:text-red-400"
                title="Remove segment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            {inspectorTab === "trim" && (
              <TrimPanel
                seg={selected}
                clip={mediaById.get(selected.clipId)}
                update={(p) => updateSegment(selected.id, p)}
              />
            )}
            {inspectorTab === "look" && (
              <LookPanel
                seg={selected}
                update={(p) => updateSegment(selected.id, p)}
              />
            )}
            {inspectorTab === "frame" && (
              <FramePanel
                seg={selected}
                update={(p) => updateSegment(selected.id, p)}
              />
            )}
            {inspectorTab === "audio" && (
              <AudioPanel
                seg={selected}
                update={(p) => updateSegment(selected.id, p)}
              />
            )}
            {inspectorTab === "text" && (
              <TextPanel
                seg={selected}
                update={(p) => updateSegment(selected.id, p)}
              />
            )}
            {inspectorTab === "stickers" && (
              <StickerPanel
                seg={selected}
                imageMedia={imageMedia}
                update={(p) => updateSegment(selected.id, p)}
              />
            )}
          </div>

          {/* Segment-scoped AI */}
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <input
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && aiDraft.trim() && !aiBusy) {
                  onSegmentAI(selected.id, aiDraft.trim());
                  setAiDraft("");
                }
                e.stopPropagation();
              }}
              placeholder='Direct the AI at this segment, e.g. "slow it down and grade it colder"'
              disabled={aiBusy}
              className="flex-1 rounded-md border border-white/10 bg-[#141312] px-3 py-1.5 text-xs text-cream placeholder:text-warm-gray focus:outline-none focus:ring-1 focus:ring-rust disabled:opacity-60"
            />
            <button
              onClick={() => {
                if (aiDraft.trim()) {
                  onSegmentAI(selected.id, aiDraft.trim());
                  setAiDraft("");
                }
              }}
              disabled={aiBusy || !aiDraft.trim()}
              className="rounded-md bg-rust px-3 py-1.5 text-[11px] font-semibold text-cream transition-colors hover:bg-rust-light disabled:opacity-50"
            >
              {aiBusy ? "Working" : "AI edit"}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Track chip (music / voiceover)                                     */
/* ================================================================== */

function TrackChip({
  icon,
  label,
  track,
  mediaById,
  audioMedia,
  onSet,
}: {
  icon: React.ReactNode;
  label: string;
  track: AudioTrack | null;
  mediaById: Map<string, StudioMediaItem>;
  audioMedia: StudioMediaItem[];
  onSet: (t: AudioTrack | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const clip = track ? mediaById.get(track.clipId) : null;

  // Close when clicking anywhere else
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
          track
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "border-white/10 text-cream/60 hover:text-cream"
        )}
      >
        {icon}
        {label}
        {track && (
          <span className="max-w-28 truncate font-normal text-emerald-300/80">
            {clip?.name ?? "missing clip"}
          </span>
        )}
        {track?.muted && (
          <span className="rounded-sm bg-amber-400/20 px-1 font-mono text-[9px] text-amber-300">
            muted
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-[300px] w-72 overflow-y-auto rounded-lg border border-white/10 bg-[#26241F] p-3 shadow-2xl">
          <p className={fieldLabel}>{label} track</p>
          {audioMedia.length === 0 ? (
            <p className="mt-1 text-xs text-warm-gray">
              Add an audio file or record a voiceover in the media bin
              first.
            </p>
          ) : (
            <>
              <select
                value={track?.clipId ?? ""}
                onChange={(e) => {
                  const clipId = e.target.value;
                  if (!clipId) {
                    onSet(null);
                  } else {
                    onSet({
                      clipId,
                      volume: track?.volume ?? (label === "Music" ? 0.5 : 1),
                      fadeInSec: track?.fadeInSec ?? 1,
                      fadeOutSec: track?.fadeOutSec ?? 1.5,
                      loop: track?.loop ?? label === "Music",
                      offsetSec: track?.offsetSec ?? 0,
                    });
                  }
                }}
                className={cn(selectInput, "mt-2 w-full")}
              >
                <option value="">None</option>
                {audioMedia.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {track && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[10px] text-warm-gray">
                    Volume{" "}
                    <span className="font-mono text-cream/70">
                      {Math.round(track.volume * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) =>
                        onSet({ ...track, volume: parseFloat(e.target.value) })
                      }
                      className="w-full accent-rust"
                    />
                  </label>
                  <label className="text-[10px] text-warm-gray">
                    Start at (s)
                    <input
                      type="number"
                      step="0.5"
                      value={track.offsetSec}
                      onChange={(e) =>
                        onSet({
                          ...track,
                          offsetSec: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={cn(numInput, "w-full")}
                    />
                  </label>
                  <label className="text-[10px] text-warm-gray">
                    Fade in (s)
                    <input
                      type="number"
                      step="0.5"
                      value={track.fadeInSec}
                      onChange={(e) =>
                        onSet({
                          ...track,
                          fadeInSec: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={cn(numInput, "w-full")}
                    />
                  </label>
                  <label className="text-[10px] text-warm-gray">
                    Fade out (s)
                    <input
                      type="number"
                      step="0.5"
                      value={track.fadeOutSec}
                      onChange={(e) =>
                        onSet({
                          ...track,
                          fadeOutSec: parseFloat(e.target.value) || 0,
                        })
                      }
                      className={cn(numInput, "w-full")}
                    />
                  </label>
                  <label className="col-span-2 flex items-center gap-2 text-[11px] text-cream/70">
                    <input
                      type="checkbox"
                      checked={track.loop}
                      onChange={(e) =>
                        onSet({ ...track, loop: e.target.checked })
                      }
                      className="accent-rust"
                    />
                    Loop until the end
                  </label>
                </div>
              )}
            </>
          )}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {track && (
                <>
                  <button
                    onClick={() => onSet({ ...track, muted: !track.muted })}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11px] transition-colors",
                      track.muted
                        ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                        : "border-white/10 text-cream/70 hover:bg-white/10"
                    )}
                  >
                    {track.muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    onClick={() => {
                      onSet(null);
                      setOpen(false);
                    }}
                    className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-red-300/80 hover:bg-red-500/10 hover:text-red-300"
                  >
                    Remove track
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-cream hover:bg-white/10"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Inspector panels                                                   */
/* ================================================================== */

function TrimPanel({
  seg,
  clip,
  update,
}: {
  seg: SequenceSegment;
  clip?: StudioMediaItem;
  update: (p: Partial<SequenceSegment>) => void;
}) {
  const bestMoment = clip?.analysis?.bestMoments?.[0];
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      {bestMoment && (
        <button
          onClick={() => {
            const maxOut = clip?.durationSec ?? seg.outSec;
            const inSec = Math.max(0, bestMoment.atSec - 2);
            const outSec = Math.min(maxOut, bestMoment.atSec + 2.5);
            if (outSec - inSec >= 0.5) update({ inSec, outSec });
            toast.success(
              `Trimmed to the Analyst's best moment (${bestMoment.atSec}s)`
            );
          }}
          className="rounded-md border border-emerald-400/30 bg-emerald-400/5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/10"
          title={bestMoment.why}
        >
          Smart trim
        </button>
      )}
      <div>
        <label className={fieldLabel}>In (s)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={seg.inSec}
          onChange={(e) =>
            update({ inSec: parseFloat(e.target.value) || 0 })
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
          value={seg.outSec}
          onChange={(e) =>
            update({ outSec: parseFloat(e.target.value) || 0 })
          }
          className={numInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>Speed</label>
        <select
          value={seg.speed ?? 1}
          onChange={(e) => update({ speed: parseFloat(e.target.value) })}
          className={selectInput}
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={fieldLabel}>Transition in</label>
        <select
          value={seg.transitionIn.type}
          onChange={(e) =>
            update({
              transitionIn: {
                type: e.target.value as TransitionType,
                durationSec:
                  e.target.value === "cut"
                    ? 0
                    : seg.transitionIn.durationSec || 0.9,
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
      {seg.transitionIn.type !== "cut" && (
        <div>
          <label className={fieldLabel}>Trans. (s)</label>
          <input
            type="number"
            step="0.1"
            min="0.2"
            max="3"
            value={seg.transitionIn.durationSec}
            onChange={(e) =>
              update({
                transitionIn: {
                  ...seg.transitionIn,
                  durationSec: parseFloat(e.target.value) || 0.9,
                },
              })
            }
            className={numInput}
          />
        </div>
      )}
      {clip?.is360 && (
        <div>
          <label className={fieldLabel}>Mode</label>
          <select
            value={seg.mode}
            onChange={(e) =>
              update({ mode: e.target.value as "2d" | "pano360" })
            }
            className={selectInput}
          >
            <option value="pano360">360 look-around</option>
            <option value="2d">Flat</option>
          </select>
        </div>
      )}
      {seg.mode === "2d" ? (
        <div>
          <label className={fieldLabel}>Ken Burns</label>
          <select
            value={KEN_BURNS_PRESETS.findIndex(
              (p) =>
                JSON.stringify(p.value) ===
                JSON.stringify(seg.kenBurns ?? null)
            )}
            onChange={(e) =>
              update({
                kenBurns:
                  KEN_BURNS_PRESETS[parseInt(e.target.value, 10)]?.value ??
                  null,
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
            <label className={fieldLabel}>Yaw from</label>
            <input
              type="number"
              value={seg.panoMotion?.fromYawDeg ?? 0}
              onChange={(e) =>
                update({
                  panoMotion: {
                    fromYawDeg: parseFloat(e.target.value) || 0,
                    toYawDeg: seg.panoMotion?.toYawDeg ?? 90,
                    pitchDeg: seg.panoMotion?.pitchDeg ?? 0,
                  },
                })
              }
              className={numInput}
            />
          </div>
          <div>
            <label className={fieldLabel}>Yaw to</label>
            <input
              type="number"
              value={seg.panoMotion?.toYawDeg ?? 90}
              onChange={(e) =>
                update({
                  panoMotion: {
                    fromYawDeg: seg.panoMotion?.fromYawDeg ?? 0,
                    toYawDeg: parseFloat(e.target.value) || 0,
                    pitchDeg: seg.panoMotion?.pitchDeg ?? 0,
                  },
                })
              }
              className={numInput}
            />
          </div>
        </>
      )}
    </div>
  );
}

function LookPanel({
  seg,
  update,
}: {
  seg: SequenceSegment;
  update: (p: Partial<SequenceSegment>) => void;
}) {
  const f = seg.filter;
  const presetIdx = FILTER_PRESETS.findIndex(
    (p) => JSON.stringify(p.value) === JSON.stringify(f ?? null)
  );
  const sliders: {
    key: "brightness" | "contrast" | "saturate" | "hueDeg" | "blur";
    label: string;
    min: number;
    max: number;
    step: number;
    neutral: number;
  }[] = [
    { key: "brightness", label: "Brightness", min: 0.4, max: 1.6, step: 0.02, neutral: 1 },
    { key: "contrast", label: "Contrast", min: 0.4, max: 1.6, step: 0.02, neutral: 1 },
    { key: "saturate", label: "Saturation", min: 0, max: 2, step: 0.05, neutral: 1 },
    { key: "hueDeg", label: "Hue", min: -180, max: 180, step: 1, neutral: 0 },
    { key: "blur", label: "Blur", min: 0, max: 10, step: 0.5, neutral: 0 },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_PRESETS.map((p, i) => (
          <button
            key={p.name}
            onClick={() =>
              update({ filter: p.value ? { ...p.value } : null })
            }
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
              presetIdx === i
                ? "border-rust bg-rust/15 text-rust-light"
                : "border-white/10 text-cream/60 hover:text-cream"
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
        {sliders.map((s) => (
          <label key={s.key} className="text-[10px] text-warm-gray">
            {s.label}{" "}
            <span className="font-mono">
              {(f?.[s.key] ?? s.neutral).toFixed(s.step < 1 ? 2 : 0)}
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={f?.[s.key] ?? s.neutral}
              onChange={(e) =>
                update({
                  filter: {
                    brightness: f?.brightness ?? 1,
                    contrast: f?.contrast ?? 1,
                    saturate: f?.saturate ?? 1,
                    hueDeg: f?.hueDeg ?? 0,
                    blur: f?.blur ?? 0,
                    grayscale: f?.grayscale ?? 0,
                    sepia: f?.sepia ?? 0,
                    [s.key]: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full accent-rust"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function FramePanel({
  seg,
  update,
}: {
  seg: SequenceSegment;
  update: (p: Partial<SequenceSegment>) => void;
}) {
  const tr = seg.transform ?? {
    scale: 1,
    xPct: 0,
    yPct: 0,
    rotateDeg: 0,
    fit: "cover" as const,
  };
  const set = (patch: Partial<typeof tr>) =>
    update({ transform: { ...tr, ...patch } });
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
      <div>
        <label className={fieldLabel}>Fit</label>
        <select
          value={tr.fit}
          onChange={(e) => set({ fit: e.target.value as "cover" | "contain" })}
          className={selectInput}
        >
          <option value="cover">Fill the frame</option>
          <option value="contain">Fit inside</option>
        </select>
      </div>
      <div>
        <label className={fieldLabel}>Scale</label>
        <input
          type="number"
          step="0.05"
          min="0.2"
          max="3"
          value={tr.scale}
          onChange={(e) => set({ scale: parseFloat(e.target.value) || 1 })}
          className={numInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>X (%)</label>
        <input
          type="number"
          step="1"
          min="-50"
          max="50"
          value={tr.xPct}
          onChange={(e) => set({ xPct: parseFloat(e.target.value) || 0 })}
          className={numInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>Y (%)</label>
        <input
          type="number"
          step="1"
          min="-50"
          max="50"
          value={tr.yPct}
          onChange={(e) => set({ yPct: parseFloat(e.target.value) || 0 })}
          className={numInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>Rotate (deg)</label>
        <input
          type="number"
          step="1"
          value={tr.rotateDeg}
          onChange={(e) => set({ rotateDeg: parseFloat(e.target.value) || 0 })}
          className={numInput}
        />
      </div>
      <button
        onClick={() => update({ transform: null })}
        className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-cream hover:bg-white/10"
      >
        Reset frame
      </button>
    </div>
  );
}

function AudioPanel({
  seg,
  update,
}: {
  seg: SequenceSegment;
  update: (p: Partial<SequenceSegment>) => void;
}) {
  const a = seg.audio;
  const effective = a ? a.volume : (seg.muted ?? true) ? 0 : 1;
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <label className="text-[10px] text-warm-gray">
        Clip volume <span className="font-mono">{effective.toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={effective}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            update({
              audio: {
                volume: v,
                fadeInSec: a?.fadeInSec ?? 0,
                fadeOutSec: a?.fadeOutSec ?? 0,
              },
              muted: v <= 0.001,
            });
          }}
          className="w-44 accent-rust"
        />
      </label>
      <div>
        <label className={fieldLabel}>Fade in (s)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={a?.fadeInSec ?? 0}
          onChange={(e) =>
            update({
              audio: {
                volume: a?.volume ?? effective,
                fadeInSec: parseFloat(e.target.value) || 0,
                fadeOutSec: a?.fadeOutSec ?? 0,
              },
            })
          }
          className={numInput}
        />
      </div>
      <div>
        <label className={fieldLabel}>Fade out (s)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={a?.fadeOutSec ?? 0}
          onChange={(e) =>
            update({
              audio: {
                volume: a?.volume ?? effective,
                fadeInSec: a?.fadeInSec ?? 0,
                fadeOutSec: parseFloat(e.target.value) || 0,
              },
            })
          }
          className={numInput}
        />
      </div>
      <p className="text-[11px] leading-snug text-warm-gray">
        {seg.mode === "pano360"
          ? "360 clips play silent in the monitor and the export. Use the music or voiceover track for sound under this segment."
          : "Music ducks automatically while a voiceover plays."}
      </p>
    </div>
  );
}

function TextPanel({
  seg,
  update,
}: {
  seg: SequenceSegment;
  update: (p: Partial<SequenceSegment>) => void;
}) {
  const overlays = seg.overlays ?? [];
  const setOverlay = (i: number, patch: Partial<SequenceOverlay>) =>
    update({
      overlays: overlays.map((o, oi) => (oi === i ? { ...o, ...patch } : o)),
    });
  const len = segmentLenSec(seg);
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className={fieldLabel}>Text overlays</p>
        <button
          onClick={() =>
            update({
              overlays: [
                ...overlays,
                {
                  kind: "caption",
                  text: "",
                  startSec: 0.5,
                  endSec: Math.max(1.5, len - 0.5),
                  position: "lower",
                  style: { size: "md", color: "cream", background: true },
                  anim: "fade",
                },
              ],
            })
          }
          className="text-[11px] font-semibold text-rust-light hover:text-rust"
        >
          + Add text
        </button>
      </div>
      {overlays.length === 0 ? (
        <p className="mt-1 text-xs text-warm-gray">None</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {overlays.map((o, i) => (
            <li
              key={i}
              className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-md border border-white/10 bg-[#211F1C] px-3 py-2"
            >
              <select
                value={o.kind}
                onChange={(e) =>
                  setOverlay(i, {
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
                onChange={(e) => setOverlay(i, { text: e.target.value })}
                className="min-w-40 flex-1 rounded-md border border-white/10 bg-[#141312] px-2 py-1 text-xs text-cream placeholder:text-warm-gray"
              />
              <div>
                <label className={fieldLabel}>Start</label>
                <input
                  type="number"
                  step="0.1"
                  value={o.startSec}
                  onChange={(e) =>
                    setOverlay(i, {
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
                    setOverlay(i, { endSec: parseFloat(e.target.value) || 0 })
                  }
                  className={cn(numInput, "w-16")}
                />
              </div>
              <select
                value={o.position ?? (o.kind === "title" ? "center" : "lower")}
                onChange={(e) =>
                  setOverlay(i, {
                    position: e.target.value as "center" | "lower" | "upper",
                  })
                }
                className={cn(selectInput, o.xPct != null && "opacity-50")}
                title={
                  o.xPct != null
                    ? "Ignored while a custom X/Y position is set"
                    : "Slot position"
                }
              >
                <option value="center">Center</option>
                <option value="lower">Lower</option>
                <option value="upper">Upper</option>
              </select>
              <div>
                <label className={fieldLabel}>X %</label>
                <input
                  type="number"
                  min={2}
                  max={98}
                  step={1}
                  placeholder="auto"
                  value={o.xPct ?? ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setOverlay(i, { xPct: undefined, yPct: undefined });
                      return;
                    }
                    const v = Math.min(
                      98,
                      Math.max(2, parseFloat(e.target.value) || 50)
                    );
                    const pos =
                      o.position ?? (o.kind === "title" ? "center" : "lower");
                    const defaultY =
                      pos === "upper" ? 12 : pos === "lower" ? 84 : 50;
                    setOverlay(i, { xPct: v, yPct: o.yPct ?? defaultY });
                  }}
                  className={cn(numInput, "w-14")}
                  title="Center of the text, percent of frame width. Drag the text on the monitor to set it visually."
                />
              </div>
              <div>
                <label className={fieldLabel}>Y %</label>
                <input
                  type="number"
                  min={2}
                  max={98}
                  step={1}
                  placeholder="auto"
                  value={o.yPct ?? ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setOverlay(i, { xPct: undefined, yPct: undefined });
                      return;
                    }
                    const v = Math.min(
                      98,
                      Math.max(2, parseFloat(e.target.value) || 50)
                    );
                    setOverlay(i, { yPct: v, xPct: o.xPct ?? 50 });
                  }}
                  className={cn(numInput, "w-14")}
                  title="Center of the text, percent of frame height"
                />
              </div>
              {o.xPct != null && (
                <button
                  onClick={() =>
                    setOverlay(i, { xPct: undefined, yPct: undefined })
                  }
                  className="text-[10px] font-semibold text-rust-light hover:text-rust"
                  title="Back to slot positioning"
                >
                  Reset pos
                </button>
              )}
              <select
                value={o.style?.size ?? "md"}
                onChange={(e) =>
                  setOverlay(i, {
                    style: {
                      size: e.target.value as "sm" | "md" | "lg",
                      color: o.style?.color ?? "cream",
                      background: o.style?.background ?? o.kind !== "title",
                    },
                  })
                }
                className={selectInput}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
              <select
                value={o.style?.color ?? "cream"}
                onChange={(e) =>
                  setOverlay(i, {
                    style: {
                      size: o.style?.size ?? "md",
                      color: e.target.value as
                        | "cream"
                        | "white"
                        | "rust"
                        | "ink",
                      background: o.style?.background ?? o.kind !== "title",
                    },
                  })
                }
                className={selectInput}
              >
                <option value="cream">Cream</option>
                <option value="white">White</option>
                <option value="rust">Rust</option>
                <option value="ink">Ink</option>
              </select>
              <select
                value={o.anim ?? "fade"}
                onChange={(e) =>
                  setOverlay(i, {
                    anim: e.target.value as SequenceOverlay["anim"],
                  })
                }
                className={selectInput}
              >
                <option value="fade">Fade</option>
                <option value="slide-up">Slide up</option>
                <option value="pop">Pop</option>
                <option value="none">None</option>
              </select>
              <label className="flex items-center gap-1 text-[10px] text-warm-gray">
                <input
                  type="checkbox"
                  checked={o.style?.background ?? o.kind !== "title"}
                  onChange={(e) =>
                    setOverlay(i, {
                      style: {
                        size: o.style?.size ?? "md",
                        color: o.style?.color ?? "cream",
                        background: e.target.checked,
                      },
                    })
                  }
                  className="accent-rust"
                />
                Plate
              </label>
              <button
                onClick={() =>
                  update({ overlays: overlays.filter((_, oi) => oi !== i) })
                }
                className="rounded-md p-1 text-warm-gray hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StickerPanel({
  seg,
  imageMedia,
  update,
}: {
  seg: SequenceSegment;
  imageMedia: StudioMediaItem[];
  update: (p: Partial<SequenceSegment>) => void;
}) {
  const stickers = seg.stickers ?? [];
  const len = segmentLenSec(seg);
  const setSticker = (
    id: string,
    patch: Partial<(typeof stickers)[number]>
  ) =>
    update({
      stickers: stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className={fieldLabel}>Image stickers</p>
        <button
          onClick={() => {
            if (imageMedia.length === 0) {
              toast("Add an image to the media bin first");
              return;
            }
            update({
              stickers: [
                ...stickers,
                {
                  id: uid("st"),
                  assetId: imageMedia[0].id,
                  xPct: 80,
                  yPct: 18,
                  widthPct: 18,
                  rotateDeg: 0,
                  opacity: 1,
                  startSec: 0,
                  endSec: len,
                },
              ],
            });
          }}
          className="text-[11px] font-semibold text-rust-light hover:text-rust"
        >
          + Add sticker
        </button>
      </div>
      {stickers.length === 0 ? (
        <p className="mt-1 text-xs text-warm-gray">
          None. Stickers pin an image (a logo, an arrow, a label plate) over
          this segment.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {stickers.map((st) => (
            <li
              key={st.id}
              className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-md border border-white/10 bg-[#211F1C] px-3 py-2"
            >
              <select
                value={st.assetId}
                onChange={(e) => setSticker(st.id, { assetId: e.target.value })}
                className={cn(selectInput, "max-w-40")}
              >
                {imageMedia.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {(
                [
                  ["xPct", "X %", 0, 100],
                  ["yPct", "Y %", 0, 100],
                  ["widthPct", "Width %", 2, 80],
                  ["rotateDeg", "Rotate", -180, 180],
                ] as const
              ).map(([key, label, min, max]) => (
                <div key={key}>
                  <label className={fieldLabel}>{label}</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={st[key]}
                    onChange={(e) =>
                      setSticker(st.id, {
                        [key]: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={cn(numInput, "w-16")}
                  />
                </div>
              ))}
              <div>
                <label className={fieldLabel}>Start</label>
                <input
                  type="number"
                  step="0.1"
                  value={st.startSec}
                  onChange={(e) =>
                    setSticker(st.id, {
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
                  value={st.endSec}
                  onChange={(e) =>
                    setSticker(st.id, {
                      endSec: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={cn(numInput, "w-16")}
                />
              </div>
              <button
                onClick={() =>
                  update({
                    stickers: stickers.filter((s) => s.id !== st.id),
                  })
                }
                className="rounded-md p-1 text-warm-gray hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
