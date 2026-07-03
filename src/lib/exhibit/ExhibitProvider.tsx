"use client";
/* ------------------------------------------------------------------ */
/*  Exhibit context. One reducer, split state/dispatch contexts so     */
/*  action-only consumers never re-render, a playhead bus for          */
/*  continuous time, sessionStorage persistence, reduced-motion        */
/*  mirroring, and the window.__exhibit testability contract under     */
/*  ?debug=1.                                                          */
/* ------------------------------------------------------------------ */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { CHAPTER_ORDER, type ExhibitAction, type ExhibitState, type InteractiveId } from "./types";
import { initialExhibitState, makeExhibitReducer } from "./state";
import { BLOCK_COUNTS, CHAPTER_META } from "./content";
import { createPlayheadBus, type PlayheadBus } from "./playhead";
import { saveExhibitState } from "./persist";
import { debugFlags, initDebug } from "./debug";

const StateCtx = createContext<ExhibitState | null>(null);
const DispatchCtx = createContext<Dispatch<ExhibitAction> | null>(null);
const PlayheadCtx = createContext<PlayheadBus | null>(null);

declare global {
  interface Window {
    __exhibit?: {
      state: () => ExhibitState;
      goto: (chapterId: string) => void;
      fire: (action: ExhibitAction) => void;
      continue: () => void;
      completeInteractive: (id: InteractiveId) => void;
      setAudioStub: (on: boolean) => void;
      playhead: () => ReturnType<PlayheadBus["getSnapshot"]>;
    };
  }
}

export function ExhibitProvider({ children }: { children: ReactNode }) {
  const reducer = useMemo(
    () => makeExhibitReducer({ chapterMeta: CHAPTER_META, blockCounts: BLOCK_COUNTS }),
    []
  );
  const [state, dispatch] = useReducer(reducer, undefined, initialExhibitState);
  const [bus] = useState<PlayheadBus>(() => createPlayheadBus());
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // reduced-motion mirror (once + on change)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => dispatch({ type: "SET_REDUCED_MOTION", value: mq.matches });
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // persistence on durable-state change
  useEffect(() => {
    if (state.mode) saveExhibitState(state);
  }, [state]);

  // testability contract
  useEffect(() => {
    const flags = initDebug();
    if (!flags.enabled && process.env.NODE_ENV === "production") return;
    const api = {
      state: () => stateRef.current,
      goto: (chapterId: string) => {
        const idx = CHAPTER_ORDER.indexOf(chapterId as (typeof CHAPTER_ORDER)[number]);
        if (idx >= 0) dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex: idx });
      },
      fire: (action: ExhibitAction) => dispatch(action),
      continue: () => dispatch({ type: "CONTINUE" }),
      completeInteractive: (id: InteractiveId) => dispatch({ type: "COMPLETE_INTERACTIVE", interactiveId: id }),
      setAudioStub: (on: boolean) => {
        debugFlags.audioStub = on;
      },
      playhead: () => bus.getSnapshot(),
    };
    window.__exhibit = api;
    return () => {
      if (window.__exhibit === api) delete window.__exhibit;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        <PlayheadCtx.Provider value={bus}>{children}</PlayheadCtx.Provider>
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useExhibitState(): ExhibitState {
  const v = useContext(StateCtx);
  if (!v) throw new Error("useExhibitState outside ExhibitProvider");
  return v;
}

export function useExhibitDispatch(): Dispatch<ExhibitAction> {
  const v = useContext(DispatchCtx);
  if (!v) throw new Error("useExhibitDispatch outside ExhibitProvider");
  return v;
}

export function usePlayheadBus(): PlayheadBus {
  const v = useContext(PlayheadCtx);
  if (!v) throw new Error("usePlayheadBus outside ExhibitProvider");
  return v;
}
