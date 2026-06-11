/* ------------------------------------------------------------------ */
/*  Immersive tours: shared types for the 2D/3D hybrid tour system    */
/*  and the admin Studio editor.                                       */
/*                                                                     */
/*  An ImmersiveTour is a narrative route of mostly-2D stops. Stops    */
/*  can carry a Media360 (a look-around photo or video sphere) and/or  */
/*  a SequenceDoc (an edited hybrid sequence produced in the Studio).  */
/* ------------------------------------------------------------------ */

export type Media360Kind = "video360" | "photo360";

export interface Media360 {
  kind: Media360Kind;
  /** Public URL or a /media/... path under public/ */
  src: string;
  /** Flat preview image shown before the viewer initializes */
  poster?: string | null;
  /** Compass heading the view opens facing, degrees */
  initialYawDeg?: number;
  /** Provenance label rendered in the UI, e.g. a test-capture notice */
  note?: string | null;
}

export interface ImmersiveStop {
  /** Stable slug-like id, unique within the tour */
  id: string;
  title: string;
  /** Short ledger label, e.g. "Main Stem / Michigan Avenue" */
  kicker?: string;
  /** Underwater depth gauge label, e.g. "Surface to 20 ft" */
  depthLabel?: string;
  lat: number;
  lng: number;
  /** The 2D narrative for this stop */
  body: string;
  /** Short ledger facts. Real, verifiable statements only. */
  facts?: string[];
  sources: string[];
  /** Optional look-around moment */
  media?: Media360 | null;
  /** Optional Studio-edited hybrid sequence */
  sequence?: SequenceDoc | null;
}

export type ImmersiveMedium = "underwater" | "street" | "aerial";

export interface ImmersiveTour {
  /** City slug from CITIES, e.g. "chicago" */
  city: string;
  slug: string;
  title: string;
  dek: string;
  medium: ImmersiveMedium;
  /** Honesty note about media provenance, shown near the banner */
  heroNote?: string;
  stops: ImmersiveStop[];
  published: boolean;
}

/* ------------------------------------------------------------------ */
/*  SequenceDoc: the edit decision list the Studio agents produce and  */
/*  the TimelinePlayer renders live in the browser.                    */
/* ------------------------------------------------------------------ */

export type TransitionType =
  | "cut"
  | "crossfade"
  | "dip-black"
  | "slide-left"
  | "ripple"
  | "wipe"
  | "zoom"
  | "blur";

export interface SequenceTransition {
  type: TransitionType;
  durationSec: number;
}

/** Color grade for a segment. Neutral is 1,1,1,0,0,0,0. */
export interface SegmentFilter {
  brightness: number;
  contrast: number;
  saturate: number;
  hueDeg: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

export const NEUTRAL_FILTER: SegmentFilter = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  hueDeg: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

/** Static framing for a segment, applied under any Ken Burns move. */
export interface SegmentTransform {
  scale: number;
  /** Pan offsets as a percentage of the frame, -50..50 */
  xPct: number;
  yPct: number;
  rotateDeg: number;
  fit: "cover" | "contain";
}

/** Per-segment soundtrack handling for the clip's own audio. */
export interface SegmentAudio {
  /** 0..1 */
  volume: number;
  fadeInSec: number;
  fadeOutSec: number;
}

/** An image pinned over a segment, CapCut-sticker style. */
export interface SegmentSticker {
  id: string;
  /** References an image asset / media item */
  assetId: string;
  /** Center position as a percentage of the frame */
  xPct: number;
  yPct: number;
  widthPct: number;
  rotateDeg: number;
  opacity: number;
  /** Seconds relative to the segment start */
  startSec: number;
  endSec: number;
}

/** Ken Burns move for 2D segments. x/y are pan offsets in -1..1 of overflow. */
export interface KenBurns {
  fromScale: number;
  toScale: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

/** Camera drift for 360 segments */
export interface PanoMotion {
  fromYawDeg: number;
  toYawDeg: number;
  pitchDeg?: number;
}

export type OverlayKind = "title" | "lower-third" | "caption";

export type OverlayAnim = "fade" | "slide-up" | "pop" | "none";

export interface OverlayStyle {
  size: "sm" | "md" | "lg";
  color: "cream" | "white" | "rust" | "ink";
  /** Draw a dark backing plate behind the text */
  background: boolean;
}

export interface SequenceOverlay {
  kind: OverlayKind;
  text: string;
  /** Seconds relative to the segment start */
  startSec: number;
  endSec: number;
  position?: "center" | "lower" | "upper";
  style?: OverlayStyle;
  anim?: OverlayAnim;
}

export interface SequenceSegment {
  id: string;
  /** References a StudioMediaItem id */
  clipId: string;
  mode: "2d" | "pano360";
  inSec: number;
  outSec: number;
  transitionIn: SequenceTransition;
  kenBurns?: KenBurns | null;
  panoMotion?: PanoMotion | null;
  overlays?: SequenceOverlay[];
  muted?: boolean;
  /** Playback rate, 0.25..4. Timeline length is (out - in) / speed. */
  speed?: number;
  filter?: SegmentFilter | null;
  transform?: SegmentTransform | null;
  audio?: SegmentAudio | null;
  stickers?: SegmentSticker[];
}

/** A music or voiceover bed under the whole sequence. */
export interface AudioTrack {
  /** References an audio asset / media item */
  clipId: string;
  /** 0..1 */
  volume: number;
  fadeInSec: number;
  fadeOutSec: number;
  loop: boolean;
  /** Seconds into the timeline where the track starts */
  offsetSec: number;
}

export interface SubtitleCue {
  id: string;
  /** Absolute timeline seconds */
  startSec: number;
  endSec: number;
  text: string;
}

export type SequenceAspect = "16:9" | "9:16" | "1:1";

/** Resolved media for a clipId so a SequenceDoc plays standalone */
export interface SequenceAsset {
  url: string;
  kind: "video" | "image" | "audio";
  is360: boolean;
  poster?: string | null;
}

export interface SequenceDoc {
  version: 1;
  title: string;
  /** Director's note describing the cut */
  notes?: string;
  segments: SequenceSegment[];
  aspect?: SequenceAspect;
  music?: AudioTrack | null;
  /** Narration bed. While it plays, music ducks automatically. */
  voiceover?: AudioTrack | null;
  subtitles?: SubtitleCue[];
  /**
   * clipId to media map. Filled when a sequence is exported or attached
   * to a tour stop, so the player needs no studio context. Session-only
   * object URLs are never written here.
   */
  assets?: Record<string, SequenceAsset>;
}

/* ------------------------------------------------------------------ */
/*  Studio: media bin, projects, agent pipeline                        */
/* ------------------------------------------------------------------ */

export interface StudioClipAnalysis {
  summary: string;
  subjects: string[];
  motion: string;
  quality: string;
  /** Whether frames read as an equirectangular 360 source */
  looksEquirect: boolean;
  suggestedInSec: number;
  suggestedOutSec: number;
  bestMoments: { atSec: number; why: string }[];
}

export interface StudioMediaItem {
  id: string;
  name: string;
  kind: "video" | "image" | "audio";
  /** Object URL (session only) or storage public URL */
  url: string;
  /** Small JPEG data URL used as the filmstrip thumbnail */
  thumb?: string;
  storagePath?: string | null;
  durationSec?: number;
  width?: number;
  height?: number;
  is360: boolean;
  /** false means a session-only object URL that will not survive reload */
  persisted: boolean;
  analysis?: StudioClipAnalysis | null;
}

export interface StudioChatMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface StudioProject {
  id: string;
  name: string;
  brief: string;
  media: StudioMediaItem[];
  sequence: SequenceDoc | null;
  chat: StudioChatMessage[];
  updatedAt: string;
}

export type AgentName = "analyst" | "director" | "critic";

export interface AgentTraceEntry {
  agent: AgentName;
  model: string;
  ms: number;
  note?: string;
}

/* ------------------------------------------------------------------ */
/*  Agent API payloads (POST /api/studio/agent)                        */
/* ------------------------------------------------------------------ */

export type StudioAgentAction =
  | "analyze"
  | "direct"
  | "critique"
  | "revise"
  | "revise-segment"
  | "script";

/** Models the agent endpoint will accept for a role. */
export const STUDIO_MODELS = [
  "claude-fable-5",
  "claude-opus-4-8",
  "claude-sonnet-4-6",
] as const;

export type StudioModel = (typeof STUDIO_MODELS)[number];

/** A named per-role model assignment for the agent pipeline. */
export interface OrchestrationPreset {
  key: string;
  label: string;
  blurb: string;
  models: Record<StudioAgentAction, StudioModel>;
}

/**
 * The default puts Fable 5 on the creative and visual roles (watching
 * footage, directing, motion, narration) and Opus 4.8 on the surgical
 * ones (trims, segment edits, review), where rule-checking matters
 * more than invention. Sonnet 4.6 is the cheap fast lane for drafts.
 * The first preset is the server-side default.
 */
export const ORCHESTRATION_PRESETS: OrchestrationPreset[] = [
  {
    key: "blend",
    label: "Fable directs, Opus cuts",
    blurb:
      "Fable 5 watches footage and builds the cut, Opus 4.8 reviews and makes surgical edits",
    models: {
      analyze: "claude-fable-5",
      direct: "claude-fable-5",
      revise: "claude-fable-5",
      script: "claude-fable-5",
      critique: "claude-opus-4-8",
      "revise-segment": "claude-opus-4-8",
    },
  },
  {
    key: "fable",
    label: "All Fable 5",
    blurb: "Every role on the flagship model",
    models: {
      analyze: "claude-fable-5",
      direct: "claude-fable-5",
      revise: "claude-fable-5",
      script: "claude-fable-5",
      critique: "claude-fable-5",
      "revise-segment": "claude-fable-5",
    },
  },
  {
    key: "fast",
    label: "Fast drafts",
    blurb: "Sonnet 4.6 everywhere, quicker and cheaper for rough passes",
    models: {
      analyze: "claude-sonnet-4-6",
      direct: "claude-sonnet-4-6",
      revise: "claude-sonnet-4-6",
      script: "claude-sonnet-4-6",
      critique: "claude-sonnet-4-6",
      "revise-segment": "claude-sonnet-4-6",
    },
  },
];

export interface AnalyzeRequest {
  action: "analyze";
  /** Model override for this call; the server validates and falls back */
  model?: StudioModel;
  clipName: string;
  durationSec: number;
  width: number;
  height: number;
  /** Data URLs of frames sampled across the clip, small JPEGs */
  frames: string[];
}

export interface DirectRequest {
  action: "direct";
  model?: StudioModel;
  brief: string;
  /** Optional creative direction for this attempt, used for variations */
  styleHint?: string;
  clips: Array<
    Pick<StudioMediaItem, "id" | "name" | "kind" | "durationSec" | "is360"> & {
      analysis?: StudioClipAnalysis | null;
    }
  >;
}

export interface CritiqueRequest {
  action: "critique";
  model?: StudioModel;
  brief: string;
  sequence: SequenceDoc;
  clips: DirectRequest["clips"];
}

export interface ReviseRequest {
  action: "revise";
  model?: StudioModel;
  instruction: string;
  brief: string;
  sequence: SequenceDoc;
  clips: DirectRequest["clips"];
  /** Recent conversation turns so follow-ups read in context */
  chatContext?: { role: "user" | "assistant"; text: string }[];
}

export interface ReviseSegmentRequest {
  action: "revise-segment";
  model?: StudioModel;
  instruction: string;
  brief: string;
  segmentId: string;
  sequence: SequenceDoc;
  clips: DirectRequest["clips"];
}

export interface ScriptRequest {
  action: "script";
  model?: StudioModel;
  brief: string;
  sequence: SequenceDoc;
  clips: DirectRequest["clips"];
}

export interface ScriptResult {
  /** Narration script the editor can record as a voiceover */
  narration: string;
  subtitles: SubtitleCue[];
  notes: string;
}

export type StudioAgentRequest =
  | AnalyzeRequest
  | DirectRequest
  | CritiqueRequest
  | ReviseRequest
  | ReviseSegmentRequest
  | ScriptRequest;

export interface CritiqueResult {
  verdict: "approve" | "revise";
  issues: string[];
  pacingNotes: string;
  revisedSequence?: SequenceDoc | null;
}
