/* ------------------------------------------------------------------ */
/*  R9 ground exhibit types. The page is a flat ordered list of steps  */
/*  grouped into acts; each step may set a new Stage state. States     */
/*  are discrete and resolved (reduced motion, keyboard, and phone     */
/*  all step the identical states). See data/exhibit/design/R9/.       */
/* ------------------------------------------------------------------ */

export type StageFrame = "citywide" | "hydePark" | "blackBelt";
export type GradeState = "full" | "none" | "flood";

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
  /** a single named annotation pinned on the stage */
  note?: { text: string; anchor: "hydePark" | "lawndale" | "woodlawn" | "square" } | null;
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
