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

/* Lazy content above a jump target can shift layout mid-scroll, so a
   first-visit rail jump lands short with the wrong node lit. After the
   scroll settles (scrollend where the browser has it, a position poll
   elsewhere) the target is measured again and re-anchored once if it
   drifted, capped so a stubborn layout never loops. Any newer jump or
   reader input cancels a pending settle check. */
const SETTLE_TOLERANCE_PX = 200;
const MAX_REANCHORS = 2;
const SETTLE_TIMEOUT_MS = 1500;

let settleToken = 0;

function reAnchorWhenSettled(anchorId: string, retriesLeft: number) {
  if (typeof window === "undefined") return;
  const token = ++settleToken;
  let pollId: number | undefined;

  const cleanup = () => {
    document.removeEventListener("scrollend", finish);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    if (pollId !== undefined) window.clearInterval(pollId);
  };

  const cancel = () => {
    if (token === settleToken) settleToken += 1;
    cleanup();
  };

  const finish = () => {
    cleanup();
    if (token !== settleToken) return;
    const el = document.getElementById(anchorId);
    if (!el) return;
    const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    if (Math.abs(el.getBoundingClientRect().top - marginTop) > SETTLE_TOLERANCE_PX && retriesLeft > 0) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      reAnchorWhenSettled(anchorId, retriesLeft - 1);
    }
  };

  // the reader taking over mid-settle wins; never yank them back
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });

  // kept out of the if-condition so TS does not narrow window to never
  const supportsScrollEnd = "onscrollend" in window;
  if (supportsScrollEnd) {
    document.addEventListener("scrollend", finish);
    // a jump that needs no scrolling never fires scrollend; time out
    let waited = 0;
    pollId = window.setInterval(() => {
      waited += 250;
      if (waited >= SETTLE_TIMEOUT_MS) finish();
    }, 250);
  } else {
    let lastY = window.scrollY;
    let stable = 0;
    let waited = 0;
    pollId = window.setInterval(() => {
      waited += 120;
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 2) stable += 1;
      else stable = 0;
      lastY = y;
      if (stable >= 2 || waited >= SETTLE_TIMEOUT_MS) finish();
    }, 120);
  }
}

/** Scroll a chapter (or the about section) into view by its anchor id. */
export function scrollToAnchor(anchorId: string, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(anchorId);
  if (!el) return;
  el.scrollIntoView({ behavior, block: "start" });
  reAnchorWhenSettled(anchorId, MAX_REANCHORS);
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
