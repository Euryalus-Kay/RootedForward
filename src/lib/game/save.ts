/**
 * Save and load system.
 *
 * Games autosave to localStorage on every state change (debounced).
 * Players can also manually save, load, or delete their saves. Saves
 * are keyed by slot (by default 'auto'). The GameState contains Sets,
 * which JSON cannot natively serialize, so we convert them here.
 */

import type { GameState, GamePhase, ToastMessage } from "./types";
import { freshState } from "./state";

const SAVE_KEY = "buildTheBlockSave:v2";
const SAVE_VERSION = 2;

export interface SerializedState {
  version: number;
  savedAt: number;
  state: {
    phase: GamePhase;
    year: number;
    seed: string;
    displayName: string;
    roleKey: string;
    objectives: string[];
    resources: GameState["resources"];
    scores: GameState["scores"];
    parcels: GameState["parcels"];
    hand: string[];
    drawnCards: string[];
    playedCards: GameState["playedCards"];
    resolvedEvents: GameState["resolvedEvents"];
    factions: Record<string, number>;
    flags: string[];
    achievements: string[];
    notesRead: string[];
    messages: ToastMessage[];
    currentEventId: string | null;
    selectedCard: string | null;
    drawPerYear: number;
    handSize: number;
    tutorialStep: number;
    yearAdvanced: boolean;
    startedAt: number;
    finalScore?: GameState["finalScore"];
    hintsDismissed: string[];
  };
}

/** Convert a GameState into a JSON-safe payload */
export function serializeState(state: GameState): SerializedState {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    state: {
      phase: state.phase,
      year: state.year,
      seed: state.seed,
      displayName: state.displayName,
      roleKey: state.roleKey,
      objectives: state.objectives,
      resources: state.resources,
      scores: state.scores,
      parcels: state.parcels,
      hand: state.hand,
      drawnCards: state.drawnCards,
      playedCards: state.playedCards,
      resolvedEvents: state.resolvedEvents,
      factions: state.factions,
      flags: Array.from(state.flags),
      achievements: Array.from(state.achievements),
      notesRead: Array.from(state.notesRead),
      messages: [],
      currentEventId: state.currentEvent?.id ?? null,
      selectedCard: state.selectedCard,
      drawPerYear: state.drawPerYear,
      handSize: state.handSize,
      tutorialStep: state.tutorialStep,
      yearAdvanced: state.yearAdvanced,
      startedAt: state.startedAt,
      finalScore: state.finalScore,
      hintsDismissed: Array.from(state.hintsDismissed),
    },
  };
}

/** Reconstruct a GameState from a serialized payload */
export function deserializeState(payload: SerializedState, lookupEvent: (id: string) => import("./types").GameEvent | undefined): GameState {
  const s = payload.state;
  return {
    phase: s.phase,
    year: s.year,
    seed: s.seed,
    displayName: s.displayName,
    roleKey: s.roleKey,
    objectives: s.objectives,
    resources: s.resources,
    scores: s.scores,
    parcels: s.parcels,
    hand: s.hand,
    drawnCards: s.drawnCards,
    playedCards: s.playedCards,
    resolvedEvents: s.resolvedEvents,
    factions: s.factions,
    flags: new Set(s.flags),
    achievements: new Set(s.achievements),
    notesRead: new Set(s.notesRead),
    messages: [],
    currentEvent: s.currentEventId ? lookupEvent(s.currentEventId) ?? null : null,
    selectedCard: s.selectedCard,
    drawPerYear: s.drawPerYear,
    handSize: s.handSize,
    tutorialStep: s.tutorialStep,
    yearAdvanced: s.yearAdvanced,
    startedAt: s.startedAt,
    finalScore: s.finalScore,
    hintsDismissed: new Set(s.hintsDismissed),
  };
}

/** Save to localStorage */
export function saveToLocal(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    const payload = serializeState(state);
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Save failed:", err);
  }
}

/** Load from localStorage. Returns null if no save exists or save is invalid. */
export function loadFromLocal(lookupEvent: (id: string) => import("./types").GameEvent | undefined): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as SerializedState;
    if (payload.version !== SAVE_VERSION) return null;
    return deserializeState(payload, lookupEvent);
  } catch (err) {
    console.warn("Load failed:", err);
    return null;
  }
}

/** Delete the save */
export function clearSave(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/** Check if a save exists (and return quick summary for the menu) */
export interface SaveSummary {
  exists: boolean;
  displayName: string;
  year: number;
  seed: string;
  savedAt: number;
  phase: GamePhase;
}

export function readSaveSummary(): SaveSummary {
  if (typeof window === "undefined") {
    return { exists: false, displayName: "", year: 1940, seed: "", savedAt: 0, phase: "menu" };
  }
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return { exists: false, displayName: "", year: 1940, seed: "", savedAt: 0, phase: "menu" };
    const payload = JSON.parse(raw) as SerializedState;
    if (payload.version !== SAVE_VERSION) return { exists: false, displayName: "", year: 1940, seed: "", savedAt: 0, phase: "menu" };
    return {
      exists: true,
      displayName: payload.state.displayName || "Anonymous",
      year: payload.state.year,
      seed: payload.state.seed,
      savedAt: payload.savedAt,
      phase: payload.state.phase,
    };
  } catch {
    return { exists: false, displayName: "", year: 1940, seed: "", savedAt: 0, phase: "menu" };
  }
}

// Silence unused import warning - freshState is for consumers
export { freshState };
