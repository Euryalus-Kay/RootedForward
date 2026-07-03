/* ------------------------------------------------------------------ */
/*  Exhibit reducer. All exhibit state transitions live here so the    */
/*  verify harness can replay them and the HUD stays declarative.      */
/*  React dispatches happen only at block / pause / chapter            */
/*  boundaries; continuous time lives on the playhead bus instead.     */
/* ------------------------------------------------------------------ */
import {
  CHAPTER_ORDER,
  type ChapterMeta,
  type ExhibitAction,
  type ExhibitState,
  type LampState,
  type MachineId,
} from "./types";

export const INITIAL_MACHINES: Record<MachineId, LampState> = {
  map: "dark",
  bulldozer: "dark",
  contract: "dark",
  deed: "dark",
  code: "dark",
};

export function initialExhibitState(): ExhibitState {
  return {
    mode: null,
    chapterIndex: 0,
    blockIndex: 0,
    playState: "gate",
    pausePoint: null,
    completedInteractives: [],
    ledgerPosted: [],
    machines: { ...INITIAL_MACHINES },
    voicesFound: [],
    visitedRooms: [],
    openRoom: null,
    advisoryAccepted: false,
    muted: false,
    captionsOn: true,
    transcriptOpen: false,
    reducedMotion: false,
    firedOnce: [],
    silentEffects: false,
  };
}

/** Chapter metadata is injected so the reducer stays a pure module. */
export interface ReducerContext {
  chapterMeta: ChapterMeta[];
  blockCounts: Record<string, number>; // chapterId -> narration block count
}

function applyChapterEffects(state: ExhibitState, meta: ChapterMeta | undefined, silent: boolean): ExhibitState {
  if (!meta) return state;
  const { effects } = meta;
  const ledgerPosted = [...state.ledgerPosted];
  for (const id of effects.ledgerEntryIds ?? []) {
    if (!ledgerPosted.includes(id)) ledgerPosted.push(id);
  }
  const machines = { ...state.machines };
  for (const [mid, lamp] of Object.entries(effects.machineChanges ?? {})) {
    machines[mid as MachineId] = lamp as LampState;
  }
  return { ...state, ledgerPosted, machines, silentEffects: silent };
}

export function makeExhibitReducer(ctx: ReducerContext) {
  const metaOf = (index: number) => ctx.chapterMeta[index];
  const blocksIn = (index: number) => ctx.blockCounts[CHAPTER_ORDER[index]] ?? 0;

  return function exhibitReducer(state: ExhibitState, action: ExhibitAction): ExhibitState {
    switch (action.type) {
      case "SET_MODE":
        return { ...state, mode: action.mode };

      case "BEGIN":
        return { ...state, playState: state.mode === "explore" ? "ended" : "playing", chapterIndex: 0, blockIndex: 0 };

      case "PAUSE":
        return state.playState === "playing" ? { ...state, playState: "paused" } : state;

      case "RESUME":
        return state.playState === "paused" ? { ...state, playState: "playing" } : state;

      case "BLOCK_ENDED": {
        const next = state.blockIndex + 1;
        if (next < blocksIn(state.chapterIndex)) {
          return { ...state, blockIndex: next, silentEffects: false };
        }
        // last block finished with no pause point: chapter is done
        return exhibitReducer(state, { type: "CHAPTER_DONE" });
      }

      case "ENTER_PAUSE_POINT":
        return {
          ...state,
          playState: "pause_point",
          pausePoint: { interactiveId: action.interactiveId, enteredAt: Date.now() },
        };

      case "COMPLETE_INTERACTIVE":
        return state.completedInteractives.includes(action.interactiveId)
          ? state
          : { ...state, completedInteractives: [...state.completedInteractives, action.interactiveId] };

      case "CONTINUE": {
        if (state.playState !== "pause_point") return state;
        const done = state.pausePoint
          ? exhibitReducer(state, { type: "COMPLETE_INTERACTIVE", interactiveId: state.pausePoint.interactiveId })
          : state;
        const next = done.blockIndex + 1;
        if (next < blocksIn(done.chapterIndex)) {
          return { ...done, playState: "playing", pausePoint: null, blockIndex: next };
        }
        return exhibitReducer({ ...done, playState: "playing", pausePoint: null }, { type: "CHAPTER_DONE" });
      }

      case "CHAPTER_DONE": {
        const withEffects = applyChapterEffects(state, metaOf(state.chapterIndex), false);
        const nextIndex = state.chapterIndex + 1;
        if (nextIndex >= CHAPTER_ORDER.length) {
          return { ...withEffects, playState: "ended" };
        }
        const nextMeta = metaOf(nextIndex);
        const needsAdvisory = !!nextMeta?.advisoryBefore && !state.advisoryAccepted;
        return {
          ...withEffects,
          chapterIndex: nextIndex,
          blockIndex: 0,
          pausePoint: null,
          playState: needsAdvisory ? "advisory" : state.mode === "explore" ? state.playState : "playing",
        };
      }

      case "JUMP_TO_CHAPTER": {
        const target = Math.max(0, Math.min(action.chapterIndex, CHAPTER_ORDER.length - 1));
        let s = state;
        // fast-forward: fold in effects of every chapter before the target
        if (target > state.chapterIndex) {
          for (let i = state.chapterIndex; i < target; i++) {
            s = applyChapterEffects(s, metaOf(i), true);
          }
        }
        const meta = metaOf(target);
        const needsAdvisory = !!meta?.advisoryBefore && !s.advisoryAccepted && state.mode === "guided";
        return {
          ...s,
          chapterIndex: target,
          blockIndex: 0,
          pausePoint: null,
          playState: needsAdvisory ? "advisory" : state.mode === "explore" ? s.playState : "playing",
        };
      }

      case "OPEN_ROOM":
        return {
          ...state,
          openRoom: action.roomId,
          visitedRooms: state.visitedRooms.includes(action.roomId)
            ? state.visitedRooms
            : [...state.visitedRooms, action.roomId],
          playState: state.playState === "playing" ? "paused" : state.playState,
        };

      case "CLOSE_ROOM":
        return { ...state, openRoom: null };

      case "COLLECT_VOICE":
        return state.voicesFound.includes(action.personId)
          ? state
          : { ...state, voicesFound: [...state.voicesFound, action.personId] };

      case "SHOW_ADVISORY":
        return { ...state, playState: "advisory" };

      case "ACCEPT_ADVISORY":
        return { ...state, advisoryAccepted: true, playState: state.mode === "guided" ? "playing" : state.playState };

      case "SKIP_ADVISORY_CHAPTER": {
        // advisory offers Continue or Skip to ch5 (index of "ch5" in CHAPTER_ORDER)
        const ch5 = CHAPTER_ORDER.indexOf("ch5");
        let s = { ...state, advisoryAccepted: true };
        for (let i = s.chapterIndex; i < ch5; i++) s = applyChapterEffects(s, metaOf(i), true);
        return { ...s, chapterIndex: ch5, blockIndex: 0, pausePoint: null, playState: "playing" };
      }

      case "TOGGLE_MUTE":
        return { ...state, muted: !state.muted };

      case "TOGGLE_CAPTIONS":
        return { ...state, captionsOn: !state.captionsOn };

      case "TOGGLE_TRANSCRIPT":
        return { ...state, transcriptOpen: !state.transcriptOpen };

      case "MARK_FIRED":
        return state.firedOnce.includes(action.key) ? state : { ...state, firedOnce: [...state.firedOnce, action.key] };

      case "SET_REDUCED_MOTION":
        return state.reducedMotion === action.value ? state : { ...state, reducedMotion: action.value };

      case "END_TOUR":
        return { ...state, playState: "ended" };

      case "RESTORE":
        return { ...initialExhibitState(), ...action.state, silentEffects: true };

      default:
        return state;
    }
  };
}
