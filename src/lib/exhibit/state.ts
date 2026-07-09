/* ------------------------------------------------------------------ */
/*  Exhibit reducer. The reader-paced exhibit keeps almost nothing on  */
/*  the clock: the scroll-derived chapter index (rail highlight), the  */
/*  open document room, the rooms already visited this session, the    */
/*  reduced-motion mirror, and the once-per-session latches.           */
/* ------------------------------------------------------------------ */
import { CHAPTER_ORDER, type ExhibitAction, type ExhibitState } from "./types";

export function initialExhibitState(): ExhibitState {
  return {
    chapterIndex: 0,
    openRoom: null,
    visitedRooms: [],
    reducedMotion: false,
    firedOnce: [],
  };
}

export function exhibitReducer(state: ExhibitState, action: ExhibitAction): ExhibitState {
  switch (action.type) {
    case "SET_CHAPTER": {
      const target = Math.max(0, Math.min(action.chapterIndex, CHAPTER_ORDER.length - 1));
      return target === state.chapterIndex ? state : { ...state, chapterIndex: target };
    }

    case "OPEN_ROOM":
      return {
        ...state,
        openRoom: action.roomId,
        visitedRooms: state.visitedRooms.includes(action.roomId)
          ? state.visitedRooms
          : [...state.visitedRooms, action.roomId],
      };

    case "CLOSE_ROOM":
      return state.openRoom === null ? state : { ...state, openRoom: null };

    case "MARK_FIRED":
      return state.firedOnce.includes(action.key)
        ? state
        : { ...state, firedOnce: [...state.firedOnce, action.key] };

    case "SET_REDUCED_MOTION":
      return state.reducedMotion === action.value ? state : { ...state, reducedMotion: action.value };

    default:
      return state;
  }
}
