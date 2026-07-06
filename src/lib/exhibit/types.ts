/* ------------------------------------------------------------------ */
/*  The Ground Keeps Moving: shared types for the Hyde Park exhibit.   */
/*  These are the contracts every exhibit component builds against.    */
/* ------------------------------------------------------------------ */

export type MachineId = "map" | "bulldozer" | "contract" | "deed" | "code";

export type LampState = "dark" | "armed" | "on" | "off_residue" | "renamed";

export type ExhibitMode = "guided" | "explore";

export type PlayState =
  | "gate" /* mode gate showing, nothing started */
  | "playing" /* narration audio advancing */
  | "paused" /* user paused */
  | "pause_point" /* interactive active, narration halted */
  | "advisory" /* content advisory gate before ch4 */
  | "ended"; /* tour complete, closing stage */

/** Chapter ids in tour order. Extended modules m1/m2 are ship-later. */
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

export type InteractiveId =
  | "declined-map"
  | "machine-board"
  | "layer-slider"
  | "build-the-boom"
  | "machinery-cards"
  | "bombing-map"
  | "invisible-line"
  | "read-the-deed"
  | "holc-lens"
  | "case-files"
  | "kitchenette"
  | "planners-table"
  | "two-buyers"
  | "hold-the-line"
  | "gap-at-scale"
  | "answer-wall";

/* ---------------- narration ---------------- */

export interface NarrationBlockData {
  id: string; // "ch3-b2"
  text: string;
  factRefs: string[];
  pausePointAfter?: InteractiveId;
}

export interface NarrationChapterData {
  id: ChapterId;
  title: string;
  sensitivity?: "no-motion";
  blocks: NarrationBlockData[];
}

/* ---------------- chapter stage content ---------------- */

/** One visual element in a chapter's scroll stage, rendered by BlockRenderer. */
export type StageBlock =
  | { kind: "narration"; blockId: string } /* prose card mirroring a VO block */
  | {
      kind: "figure";
      src: string;
      alt: string;
      creditKey?: string; /* looks up public/media/hyde-park/credits.json */
      caption?: string;
    }
  | { kind: "stat"; factId: string; label?: string }
  | { kind: "quote"; voiceId: string }
  | { kind: "interactive"; interactive: InteractiveId; props?: Record<string, unknown> }
  | { kind: "door"; roomId: string; label: string }
  | { kind: "advisory" };

export interface ChapterEffects {
  ledgerEntryIds?: string[]; /* ledger.json entryIds posted at CHAPTER_DONE */
  machineChanges?: Partial<Record<MachineId, LampState>>;
  spineNodeIds?: string[]; /* timeline.json nodes lit at CHAPTER_DONE */
}

export interface ChapterMeta {
  id: ChapterId;
  index: number;
  title: string;
  era: string; /* "1832 to 1893" */
  spineYear: number; /* where the chapter's node sits on the rail */
  effects: ChapterEffects;
  sensitivity?: "no-motion";
  advisoryBefore?: boolean; /* content advisory gate fires before this chapter */
}

export interface ChapterDef {
  meta: ChapterMeta;
  stage: StageBlock[];
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

/* ---------------- HUD data ---------------- */

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
  mode: ExhibitMode | null;
  chapterIndex: number; /* index into CHAPTER_ORDER */
  blockIndex: number; /* narration block within the chapter */
  playState: PlayState;
  pausePoint: { interactiveId: InteractiveId; enteredAt: number } | null;
  completedInteractives: InteractiveId[];
  ledgerPosted: string[]; /* LedgerEntryDef.entryId in stamp order */
  machines: Record<MachineId, LampState>;
  voicesFound: string[];
  visitedRooms: string[];
  openRoom: string | null;
  advisoryAccepted: boolean;
  muted: boolean;
  captionsOn: boolean;
  transcriptOpen: boolean;
  reducedMotion: boolean;
  firedOnce: string[]; /* once-per-session events, e.g. "twobuyers-eviction" */
  /** true briefly while JUMP fast-forward applies effects, so HUD skips animation */
  silentEffects: boolean;
}

export type ExhibitAction =
  | { type: "SET_MODE"; mode: ExhibitMode }
  | { type: "BEGIN" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "BLOCK_ENDED" }
  | { type: "ENTER_PAUSE_POINT"; interactiveId: InteractiveId }
  | { type: "COMPLETE_INTERACTIVE"; interactiveId: InteractiveId }
  | { type: "CONTINUE" }
  | { type: "CHAPTER_DONE" }
  | { type: "JUMP_TO_CHAPTER"; chapterIndex: number }
  | { type: "OPEN_ROOM"; roomId: string }
  | { type: "CLOSE_ROOM" }
  | { type: "COLLECT_VOICE"; personId: string }
  | { type: "SHOW_ADVISORY" }
  | { type: "ACCEPT_ADVISORY" }
  | { type: "SKIP_ADVISORY_CHAPTER" } /* skip to ch5 per the advisory card */
  | { type: "TOGGLE_MUTE" }
  | { type: "TOGGLE_CAPTIONS" }
  | { type: "TOGGLE_TRANSCRIPT" }
  | { type: "MARK_FIRED"; key: string }
  | { type: "SET_REDUCED_MOTION"; value: boolean }
  | { type: "END_TOUR" }
  | { type: "RESTORE"; state: Partial<ExhibitState> };
