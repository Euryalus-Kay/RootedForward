import type {
  AudioTrack,
  SegmentFilter,
  SequenceAspect,
  SequenceDoc,
  SequenceSegment,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Shared timeline math for the live player, the editor, and the      */
/*  export renderer. One source of truth so all three agree on where   */
/*  every segment sits.                                                */
/* ------------------------------------------------------------------ */

export interface TimedSegment {
  seg: SequenceSegment;
  startSec: number;
  lenSec: number;
}

export function segmentSpeed(seg: SequenceSegment): number {
  const s = seg.speed ?? 1;
  return Number.isFinite(s) && s >= 0.25 && s <= 4 ? s : 1;
}

/** Timeline length of a segment after its playback rate. */
export function segmentLenSec(seg: SequenceSegment): number {
  return Math.max(0.2, (seg.outSec - seg.inSec) / segmentSpeed(seg));
}

/** How far a segment overlaps the previous one during its transition. */
export function overlapFor(seg: SequenceSegment): number {
  const t = seg.transitionIn;
  if (!t || t.type === "cut" || t.type === "dip-black") return 0;
  return Math.max(0, Math.min(t.durationSec, 3));
}

export function layoutDoc(doc: SequenceDoc): {
  timed: TimedSegment[];
  total: number;
} {
  const timed: TimedSegment[] = [];
  let cursor = 0;
  for (const seg of doc.segments) {
    const lenSec = segmentLenSec(seg);
    const start = timed.length === 0 ? 0 : cursor - overlapFor(seg);
    timed.push({ seg, startSec: Math.max(0, start), lenSec });
    cursor = Math.max(0, start) + lenSec;
  }
  return { timed, total: cursor };
}

/** Clip-local media time for a timeline position inside a segment. */
export function mediaTimeAt(seg: SequenceSegment, sinceStartSec: number): number {
  const local = seg.inSec + sinceStartSec * segmentSpeed(seg);
  return Math.min(seg.outSec, Math.max(seg.inSec, local));
}

/* --------------------------- transitions ------------------------- */

/** Numeric visual state of a segment at time t, renderer-agnostic. */
export interface SegmentVisual {
  visible: boolean;
  opacity: number;
  /** Horizontal slide as a fraction of the frame width, +1 = fully right */
  slideX: number;
  scale: number;
  /** Wipe reveal progress 0..1 (1 = fully revealed) */
  wipeP: number;
  extraBlurPx: number;
  /** Ripple displacement strength 0..1 */
  rippleP: number;
}

export function transitionVisual(
  timed: TimedSegment[],
  idx: number,
  t: number
): SegmentVisual {
  const { seg, startSec, lenSec } = timed[idx];
  const out: SegmentVisual = {
    visible: true,
    opacity: 1,
    slideX: 0,
    scale: 1,
    wipeP: 1,
    extraBlurPx: 0,
    rippleP: 0,
  };
  if (t < startSec || t > startSec + lenSec) {
    out.visible = false;
    out.opacity = 0;
    return out;
  }
  const sinceStart = t - startSec;
  const untilEnd = startSec + lenSec - t;
  const tr = seg.transitionIn;
  const d = Math.max(0.2, tr?.durationSec ?? 0);

  if (idx > 0 && tr && sinceStart < d) {
    const p = sinceStart / d;
    const ease = 1 - Math.pow(1 - p, 3);
    switch (tr.type) {
      case "crossfade":
        out.opacity = p;
        break;
      case "ripple":
        out.opacity = Math.min(1, sinceStart / (d * 0.6));
        out.rippleP = Math.sin(p * Math.PI);
        break;
      case "slide-left":
        out.slideX = 1 - ease;
        break;
      case "dip-black":
        if (sinceStart < d * 0.5) out.opacity = sinceStart / (d * 0.5);
        break;
      case "wipe":
        out.wipeP = ease;
        break;
      case "zoom":
        out.opacity = p;
        out.scale = 1.18 - 0.18 * ease;
        break;
      case "blur":
        out.opacity = p;
        out.extraBlurPx = (1 - p) * 14;
        break;
      default:
        break;
    }
  }

  const next = timed[idx + 1];
  if (next) {
    const nt = next.seg.transitionIn;
    const nd = Math.max(0.2, nt?.durationSec ?? 0);
    const into = nd - Math.max(0, untilEnd);
    if (nt?.type === "dip-black" && untilEnd < nd * 0.5) {
      out.opacity = Math.min(out.opacity, Math.max(0, untilEnd / (nd * 0.5)));
    } else if (nt?.type === "slide-left" && into > 0) {
      const p = Math.min(1, into / nd);
      out.slideX = -(1 - Math.pow(1 - p, 3)) * 0.28;
    } else if (nt?.type === "zoom" && into > 0) {
      out.scale = 1 - 0.06 * Math.min(1, into / nd);
    } else if (nt?.type === "blur" && into > 0) {
      out.extraBlurPx = Math.max(
        out.extraBlurPx,
        Math.min(1, into / nd) * 10
      );
    }
  }

  return out;
}

/* ----------------------------- filters --------------------------- */

export function filterToCss(
  f?: SegmentFilter | null,
  extraBlurPx = 0
): string {
  const parts: string[] = [];
  if (f) {
    if (f.brightness !== 1) parts.push(`brightness(${f.brightness})`);
    if (f.contrast !== 1) parts.push(`contrast(${f.contrast})`);
    if (f.saturate !== 1) parts.push(`saturate(${f.saturate})`);
    if (f.hueDeg !== 0) parts.push(`hue-rotate(${f.hueDeg}deg)`);
    if (f.grayscale !== 0) parts.push(`grayscale(${f.grayscale})`);
    if (f.sepia !== 0) parts.push(`sepia(${f.sepia})`);
    const blur = (f.blur ?? 0) + extraBlurPx;
    if (blur > 0) parts.push(`blur(${blur.toFixed(1)}px)`);
  } else if (extraBlurPx > 0) {
    parts.push(`blur(${extraBlurPx.toFixed(1)}px)`);
  }
  return parts.length > 0 ? parts.join(" ") : "none";
}

export const FILTER_PRESETS: { name: string; value: SegmentFilter | null }[] = [
  { name: "None", value: null },
  {
    name: "Underwater",
    value: {
      brightness: 0.96,
      contrast: 1.05,
      saturate: 1.15,
      hueDeg: -12,
      blur: 0,
      grayscale: 0,
      sepia: 0,
    },
  },
  {
    name: "Archival",
    value: {
      brightness: 1.02,
      contrast: 0.95,
      saturate: 0.7,
      hueDeg: 0,
      blur: 0,
      grayscale: 0,
      sepia: 0.35,
    },
  },
  {
    name: "Mono",
    value: {
      brightness: 1,
      contrast: 1.08,
      saturate: 1,
      hueDeg: 0,
      blur: 0,
      grayscale: 1,
      sepia: 0,
    },
  },
  {
    name: "Warm",
    value: {
      brightness: 1.04,
      contrast: 1.02,
      saturate: 1.1,
      hueDeg: 8,
      blur: 0,
      grayscale: 0,
      sepia: 0.12,
    },
  },
  {
    name: "Cold depth",
    value: {
      brightness: 0.9,
      contrast: 1.1,
      saturate: 0.85,
      hueDeg: -18,
      blur: 0,
      grayscale: 0,
      sepia: 0,
    },
  },
];

/* ------------------------------ audio ---------------------------- */

/** 0..1 envelope with fades inside a [0, durSec] window. */
export function fadeGain(
  t: number,
  durSec: number,
  fadeInSec: number,
  fadeOutSec: number
): number {
  if (t < 0 || t > durSec) return 0;
  let g = 1;
  if (fadeInSec > 0) g = Math.min(g, t / fadeInSec);
  if (fadeOutSec > 0) g = Math.min(g, (durSec - t) / fadeOutSec);
  return Math.max(0, Math.min(1, g));
}

/** Gain for a doc-level track at timeline time t. */
export function trackGainAt(
  track: AudioTrack,
  t: number,
  totalSec: number
): number {
  const local = t - (track.offsetSec ?? 0);
  const window = totalSec - (track.offsetSec ?? 0);
  if (local < 0 || window <= 0) return 0;
  return (
    Math.max(0, Math.min(1, track.volume)) *
    fadeGain(local, window, track.fadeInSec, track.fadeOutSec)
  );
}

/** How much the music ducks while a voiceover is audible. */
export const MUSIC_DUCK = 0.25;

/* ------------------------------ aspect --------------------------- */

export const ASPECTS: Record<SequenceAspect, { w: number; h: number; label: string }> = {
  "16:9": { w: 16, h: 9, label: "Widescreen 16:9" },
  "9:16": { w: 9, h: 16, label: "Vertical 9:16" },
  "1:1": { w: 1, h: 1, label: "Square 1:1" },
};

export function aspectOf(doc: SequenceDoc): SequenceAspect {
  return doc.aspect ?? "16:9";
}
