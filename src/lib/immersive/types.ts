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
  | "ripple";

export interface SequenceTransition {
  type: TransitionType;
  durationSec: number;
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

export interface SequenceOverlay {
  kind: OverlayKind;
  text: string;
  /** Seconds relative to the segment start */
  startSec: number;
  endSec: number;
  position?: "center" | "lower" | "upper";
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
}

/** Resolved media for a clipId so a SequenceDoc plays standalone */
export interface SequenceAsset {
  url: string;
  kind: "video" | "image";
  is360: boolean;
  poster?: string | null;
}

export interface SequenceDoc {
  version: 1;
  title: string;
  /** Director's note describing the cut */
  notes?: string;
  segments: SequenceSegment[];
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
  kind: "video" | "image";
  /** Object URL (session only) or storage public URL */
  url: string;
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

export interface AnalyzeRequest {
  action: "analyze";
  clipName: string;
  durationSec: number;
  width: number;
  height: number;
  /** Data URLs of frames sampled across the clip, small JPEGs */
  frames: string[];
}

export interface DirectRequest {
  action: "direct";
  brief: string;
  clips: Array<
    Pick<StudioMediaItem, "id" | "name" | "kind" | "durationSec" | "is360"> & {
      analysis?: StudioClipAnalysis | null;
    }
  >;
}

export interface CritiqueRequest {
  action: "critique";
  brief: string;
  sequence: SequenceDoc;
  clips: DirectRequest["clips"];
}

export interface ReviseRequest {
  action: "revise";
  instruction: string;
  brief: string;
  sequence: SequenceDoc;
  clips: DirectRequest["clips"];
}

export type StudioAgentRequest =
  | AnalyzeRequest
  | DirectRequest
  | CritiqueRequest
  | ReviseRequest;

export interface CritiqueResult {
  verdict: "approve" | "revise";
  issues: string[];
  pacingNotes: string;
  revisedSequence?: SequenceDoc | null;
}
