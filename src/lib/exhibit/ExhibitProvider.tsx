"use client";
/* ------------------------------------------------------------------ */
/*  Exhibit context. One small reducer, split state/dispatch contexts  */
/*  so action-only consumers never re-render, a reduced-motion         */
/*  mirror, and the window.__exhibit testability contract under        */
/*  ?debug=1: state(), goto(chapterId) scrolls to the chapter anchor,  */
/*  stations() lists the station ids rendered on the page.             */
/* ------------------------------------------------------------------ */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { CHAPTER_ORDER, type ExhibitAction, type ExhibitState } from "./types";
import { exhibitReducer, initialExhibitState } from "./state";
import { initDebug } from "./debug";

const StateCtx = createContext<ExhibitState | null>(null);
const DispatchCtx = createContext<Dispatch<ExhibitAction> | null>(null);

declare global {
  interface Window {
    __exhibit?: {
      state: () => ExhibitState;
      goto: (chapterId: string) => void;
      stations: () => string[];
    };
  }
}

/** Scroll a chapter (or the about section) into view by its anchor id. */
export function scrollToAnchor(anchorId: string, behavior: ScrollBehavior = "smooth") {
  document.getElementById(anchorId)?.scrollIntoView({ behavior, block: "start" });
}

export function ExhibitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(exhibitReducer, undefined, initialExhibitState);
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

  // testability contract
  useEffect(() => {
    const flags = initDebug();
    if (!flags.enabled && process.env.NODE_ENV === "production") return;
    const api = {
      state: () => stateRef.current,
      goto: (chapterId: string) => {
        const idx = CHAPTER_ORDER.indexOf(chapterId as (typeof CHAPTER_ORDER)[number]);
        if (idx >= 0) dispatch({ type: "SET_CHAPTER", chapterIndex: idx });
        scrollToAnchor(chapterId, "auto");
      },
      stations: () =>
        Array.from(document.querySelectorAll("[data-station]")).map(
          (el) => el.getAttribute("data-station") ?? ""
        ),
    };
    window.__exhibit = api;
    return () => {
      if (window.__exhibit === api) delete window.__exhibit;
    };
  }, []);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
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
