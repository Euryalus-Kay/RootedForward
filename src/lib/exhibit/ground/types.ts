/* ------------------------------------------------------------------ */
/*  R9 ground exhibit types. The page is a flat ordered list of steps  */
/*  grouped into acts; each step may set a new Stage state. States     */
/*  are discrete and resolved (reduced motion, keyboard, and phone     */
/*  all step the identical states). See data/exhibit/design/R9/.       */
/* ------------------------------------------------------------------ */

export type StageFrame = "citywide" | "hydePark" | "blackBelt";
export type GradeState = "full" | "none" | "flood";

/** named within-frame camera positions (geometry.json citywide.focus)
 *  plus "wide" for the frame's home crop */
export type CameraTarget =
  | "wide"
  | "lawndale"
  | "woodlawn"
  | "hydeParkKenwood"
  | "bombingField"
  | "southSide"
  | "floodFirst"
  | "southHalf"
  | "today"
  | "township";

/** named veil spotlight holes (geometry.json citywide.veilHoles), plus
 *  "located" for the visitor's own found area (path set at runtime) */
export type VeilTarget =
  | "none"
  | "lawndale"
  | "woodlawn"
  | "jacksonPark"
  | "township"
  | "bingaBlock"
  | "located";

export interface StageState {
  /** which framing of the one map is shown (frame changes are cuts) */
  frame: StageFrame;
  /** the year readout in the stage corner */
  era: string;
  /** grade pigment state; flood re-inks in sheet filing order */
  grades: GradeState;
  /** 0..N batches inked when grades is "flood" */
  floodStep?: number;
  /** area outlines (the survey linework) visible */
  linework?: boolean;
  /** township boundary emphasis (hydePark frame) */
  boundary?: boolean;
  /** neighborhood labels visible */
  labels?: boolean;
  /** bombing marks and the commission square (never erased once on) */
  marks?: boolean;
  /** the exhibit's one dark value, the bombing chapter only */
  dim?: boolean;
  /** warm value shift, the church basement only */
  warm?: boolean;
  /** the exhibit's one present-day map mark (rust ring at East Woodlawn) */
  today?: boolean;
  /** a single named annotation pinned on the stage */
  note?: { text: string; anchor: "hydePark" | "lawndale" | "woodlawn" | "square" } | null;
  /* ---- R10 Pressed Sheet grammar (design/R10/design.md) ---------- */
  /** within-frame camera position; "wide" is the frame's home crop.
   *  Frame changes stay cuts (the second sheet); cam moves tween. */
  cam?: CameraTarget;
  /** sheet lean, quantized; 0 = plumb (testimony), 10 and 22 are the
   *  three examination events. Mobile caps at 8. */
  tilt?: 0 | 10 | 22;
  /** spotlight veil hole over real geometry */
  veil?: VeilTarget;
  /** the intaglio relief; absent until a3-s2 stamps it on, then held */
  press?: boolean;
  /** how the bombing marks read at this camera: a counted badge from
   *  afar, individually readable dots up close */
  marksMode?: "badge" | "dots";
  /** a magnifying lens over a named point of the sheet (R11); an
   *  event field, reset unless restated */
  loupe?: "jacksonPark" | "today" | null;
  /** sr-only resolved-state sentence (non-visual parity for drawn
   *  claims); carried forward like every other field */
  sr?: string;
}

export interface GroundStep {
  /** unique step id; chapter heads use the chapter anchor id (ch0..ch11) */
  id: string;
  role: "step" | "chapterHead" | "charge" | "takeaway" | "quote" | "scene";
  /** visitor text; **bold** marks the quick-read clause; omit for scene mounts */
  text?: string;
  /** attribution line for role quote */
  attribution?: string;
  /** fact registry ids backing every number in text */
  factRefs?: string[];
  /** chapter title for chapterHead steps */
  title?: string;
  /** era line under a chapterHead (years) */
  years?: string;
  /** scene component key for role scene (registered in scenes/registry) */
  scene?: string;
  /** ledger entryIds this step posts to the rail */
  post?: string[];
  /** new stage state; omitted means the previous state holds */
  stage?: StageState;
}

export interface GroundAct {
  id: string;
  /** act number line, e.g. "Act 2 of 6" is derived from position */
  title: string;
  steps: GroundStep[];
}

export interface GroundCopy {
  version: number;
  opening: {
    kicker: string;
    title: string;
    /** the caption under the map at first paint */
    mapCaption: string;
    mapCaptionFactRefs: string[];
    /** how-to line, one sentence */
    howTo: string;
  };
  acts: GroundAct[];
  closing: {
    colophonLine: string;
  };
}

/** a step with its resolved stage (previous state carried forward) */
export interface ResolvedStep extends GroundStep {
  index: number;
  actId: string;
  actIndex: number;
  resolvedStage: StageState;
  /** ledger entryIds posted up to and including this step */
  postedThrough: string[];
}
