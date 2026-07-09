/* ------------------------------------------------------------------ */
/*  The Ground Keeps Moving: shared types for the Hyde Park exhibit.   */
/*  These are the contracts every exhibit component builds against.    */
/*  The exhibit is one reader-paced document: no modes, no play        */
/*  state, no audio. Wall text lives in data/exhibit/walltext.json.    */
/* ------------------------------------------------------------------ */

export type MachineId = "map" | "bulldozer" | "contract" | "deed" | "code";

export type LampState = "dark" | "armed" | "on" | "off_residue" | "renamed";

/** Chapter ids in canonical order. ch0_5 is the overture position
 *  (the five-instruments reference panel) between ch2 and ch3 in the
 *  rendered flow; see EXHIBIT_FLOW in content/index.ts. */
export const CHAPTER_ORDER = [
  "ch0",
  "ch0_5",
  "ch1",
  "ch2",
  "ch3",
  "ch4",
  "ch5",
  "ch6",
  "ch7",
  "ch8",
  "ch9",
  "ch10",
  "ch11",
] as const;
export type ChapterId = (typeof CHAPTER_ORDER)[number];

/** The surviving evidence stations. Every id here matches a walltext
 *  stationIntros key and a registry entry. */
export type StationId =
  | "holc-map"
  | "layer-slider"
  | "bombing-map"
  | "two-buyers"
  | "gap-at-scale"
  | "answer-wall";

/** kept as an alias for older station modules */
export type InteractiveId = StationId;

/* ---------------- wall text ---------------- */

export interface WallSection {
  id: string; // "ch2-s1"
  text: string;
  factRefs: string[];
}

export interface StationIntroDef {
  what: string;
  when: string;
  why: string;
  factRefs?: string[];
}

export interface WallChapterData {
  id: ChapterId;
  title: string;
  era: string;
  contextIntro: WallSection;
  sections: WallSection[];
  stationIntros: Record<string, StationIntroDef>;
}

export interface WallOpeningData {
  kicker: string;
  title: string;
  plainWords: WallSection[];
  howToRead: string;
}

/* ---------------- chapter flow content ---------------- */

/** One extra element interleaved with a chapter's wall-text sections. */
export type FlowBlock =
  | {
      kind: "figure";
      src: string;
      alt: string;
      creditKey?: string; /* looks up public/media/hyde-park/credits.json */
      caption?: string;
    }
  | { kind: "station"; station: StationId; props?: Record<string, unknown> }
  | { kind: "quote"; voiceId: string }
  | { kind: "door"; roomId: string; label: string }
  | { kind: "cases" } /* the ch7 static case-files documents panel */
  | { kind: "ledger-table" }; /* the ch11 full-record table */

export interface ChapterEffects {
  ledgerEntryIds?: string[]; /* ledger.json entries recorded at chapter end */
  machineChanges?: Partial<Record<MachineId, LampState>>;
  spineNodeIds?: string[];
}

export interface ChapterMeta {
  id: ChapterId;
  index: number;
  title: string; /* fallback; display prefers the walltext title */
  era: string;
  spineYear: number; /* where the chapter's node sits on the rail */
  effects: ChapterEffects;
  sensitivity?: "no-motion";
  advisoryBefore?: boolean; /* inline content-advisory plate at the top */
}

/* ---------------- facts ---------------- */

export type FactTier = "documented" | "reported" | "attributed";

export interface FactSource {
  title: string;
  author?: string;
  year?: number;
  url?: string;
  locator?: string;
}

export interface Fact {
  id: string;
  value: number | string | { min: number; max: number };
  display: string;
  unit?: string;
  asOf?: string;
  tier: FactTier;
  source: FactSource;
  secondarySources?: FactSource[];
  factcheckId?: string;
  usedBy?: string[];
  notes?: string;
}

/* ---------------- registry data ---------------- */

export interface LedgerEntryDef {
  entryId: string;
  chapter: ChapterId;
  year: number;
  label: string;
  factRef?: string;
  factRefs?: string[];
  sign: "debit" | "credit" | "note";
}

export interface MachineDef {
  machineId: MachineId;
  name: string;
  plainName: string;
  definition: string;
  armedYear: number;
  armedBy: string;
  onYear: number;
  onBy: string;
  offYear: number | null;
  offBy: string | null;
  renamedTo?: string;
  renamedNote?: string;
  residue: string;
  evidenceFactRefs: string[];
  homeChapter: ChapterId;
  cardIcon: string;
}

export interface TimelineNodeDef {
  id: string;
  year: number;
  title: string;
  chapterId: ChapterId;
  factRef?: string;
  machineIds?: MachineId[];
}

export interface VoiceDef {
  personId: string;
  name: string;
  years: string;
  role: string;
  portrait?: string;
  quote?: { text: string; source: string };
  paraphrase?: { text: string; source: string };
  quoteStatus: "verbatim-documented" | "verbatim-reported" | "paraphrase";
  chapter: ChapterId;
  factRef?: string | null;
}

/* ---------------- exhibit state ---------------- */

export interface ExhibitState {
  /** index into CHAPTER_ORDER, derived from scroll position; drives the
   *  timeline rail highlight and nothing else */
  chapterIndex: number;
  openRoom: string | null;
  visitedRooms: string[];
  reducedMotion: boolean;
  firedOnce: string[]; /* once-per-session moments, e.g. "twobuyers-eviction" */
}

export type ExhibitAction =
  | { type: "SET_CHAPTER"; chapterIndex: number }
  | { type: "OPEN_ROOM"; roomId: string }
  | { type: "CLOSE_ROOM" }
  | { type: "MARK_FIRED"; key: string }
  | { type: "SET_REDUCED_MOTION"; value: boolean };
