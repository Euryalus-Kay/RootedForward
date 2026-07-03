/* ------------------------------------------------------------------ */
/*  sessionStorage persistence so a reload offers "resume where you    */
/*  left off". Only the durable slice of state is saved; transient     */
/*  play state always restores paused at the block boundary.           */
/* ------------------------------------------------------------------ */
import type { ExhibitState } from "./types";

const KEY = "rf-exhibit-hp-v1";

type Saved = Pick<
  ExhibitState,
  | "mode"
  | "chapterIndex"
  | "blockIndex"
  | "completedInteractives"
  | "ledgerPosted"
  | "machines"
  | "voicesFound"
  | "visitedRooms"
  | "advisoryAccepted"
  | "muted"
  | "captionsOn"
  | "firedOnce"
>;

export function saveExhibitState(state: ExhibitState) {
  if (typeof window === "undefined") return;
  try {
    const slice: Saved = {
      mode: state.mode,
      chapterIndex: state.chapterIndex,
      blockIndex: state.blockIndex,
      completedInteractives: state.completedInteractives,
      ledgerPosted: state.ledgerPosted,
      machines: state.machines,
      voicesFound: state.voicesFound,
      visitedRooms: state.visitedRooms,
      advisoryAccepted: state.advisoryAccepted,
      muted: state.muted,
      captionsOn: state.captionsOn,
      firedOnce: state.firedOnce,
    };
    window.sessionStorage.setItem(KEY, JSON.stringify(slice));
  } catch {
    /* storage full or blocked: resume is a nicety, never an error */
  }
}

export function loadExhibitState(): Partial<ExhibitState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    if (typeof parsed.chapterIndex !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearExhibitState() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
