"use client";
/* ------------------------------------------------------------------ */
/*  R9 engine. One IntersectionObserver over the step cards decides    */
/*  the active step (the highest card inside the middle band of the    */
/*  viewport). Everything else, the Stage, the Register cursor, the    */
/*  Ledger Rail, derives from that one integer, so deep links,         */
/*  refreshes, and the back button always reconstruct a coherent       */
/*  scene. No per-pixel scroll handlers live here.                     */
/* ------------------------------------------------------------------ */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RESOLVED_STEPS, CURSOR_YEARS } from "@/lib/exhibit/ground/copy";
import type { ResolvedStep, StageState } from "@/lib/exhibit/ground/types";

interface GroundApi {
  activeIndex: number;
  activeStep: ResolvedStep;
  stage: StageState;
  cursorYear: number;
  posted: string[];
  reducedMotion: boolean;
  /** step cards call this to enter the observer */
  registerStep: (index: number, el: HTMLElement | null) => void;
  /** an act scene (grade flood) can register a tap handler for map areas */
  setAreaTap: (fn: ((areaId: number) => void) | null) => void;
  areaTapRef: { current: ((areaId: number) => void) | null };
}

const GroundContext = createContext<GroundApi | null>(null);

export function useGround(): GroundApi {
  const ctx = useContext(GroundContext);
  if (!ctx) throw new Error("useGround outside GroundProvider");
  return ctx;
}

export default function GroundProvider({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const elements = useRef(new Map<number, HTMLElement>());
  const inBand = useRef(new Set<number>());
  const observer = useRef<IntersectionObserver | null>(null);
  const areaTapRef = useRef<((areaId: number) => void) | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.groundIndex);
          if (Number.isNaN(idx)) continue;
          if (entry.isIntersecting) inBand.current.add(idx);
          else inBand.current.delete(idx);
        }
        if (inBand.current.size > 0) {
          setActiveIndex(Math.max(...inBand.current));
        }
      },
      // the middle band: a card becomes active as it crosses the center
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    );
    observer.current = io;
    for (const el of elements.current.values()) io.observe(el);
    return () => io.disconnect();
  }, []);

  const registerStep = useCallback((index: number, el: HTMLElement | null) => {
    const prev = elements.current.get(index);
    if (prev && observer.current) observer.current.unobserve(prev);
    if (el) {
      el.dataset.groundIndex = String(index);
      elements.current.set(index, el);
      observer.current?.observe(el);
    } else {
      elements.current.delete(index);
      inBand.current.delete(index);
    }
  }, []);

  const setAreaTap = useCallback((fn: ((areaId: number) => void) | null) => {
    areaTapRef.current = fn;
  }, []);

  /* Deep links. The browser's native hash scroll fires before the
     scenes hydrate and expand the document, so a #anchor URL lands at
     the top. After load, re-scroll to the hash once layout settles
     (double rAF, then a short retry loop while offsets keep moving),
     and stand down the moment the visitor scrolls on their own. */
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = decodeURIComponent(hash.slice(1));
    /* the reading-room permalink contract (#room-files:<areaId>) has
       its own handler; leave it alone */
    if (id.includes(":")) return;
    let cancelled = false;
    let timer = 0;
    const cancel = () => {
      cancelled = true;
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancel);
    const attempt = (triesLeft: number) => {
      if (cancelled) return;
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: "start", behavior: "auto" });
      if (triesLeft > 0) {
        timer = window.setTimeout(() => attempt(triesLeft - 1), 300);
      }
    };
    /* double rAF so the first pass runs after hydration paints */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => attempt(6));
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancel);
    };
  }, []);

  const activeStep = RESOLVED_STEPS[Math.min(activeIndex, RESOLVED_STEPS.length - 1)];

  const value = useMemo<GroundApi>(() => {
    const step = RESOLVED_STEPS[Math.min(activeIndex, RESOLVED_STEPS.length - 1)];
    return {
      activeIndex,
      activeStep: step,
      stage: step.resolvedStage,
      cursorYear: CURSOR_YEARS[step.index],
      posted: step.postedThrough,
      reducedMotion,
      registerStep,
      setAreaTap,
      areaTapRef,
    };
  }, [activeIndex, reducedMotion, registerStep, setAreaTap]);

  return (
    <GroundContext.Provider value={value}>
      {/* data-ground-warm extends the basement chapter's designed warm
          value to the page column, not just the stage (a cut, no tween) */}
      <div
        data-motion={reducedMotion ? "off" : "on"}
        data-ground-warm={activeStep.resolvedStage.warm ? "on" : "off"}
      >
        {children}
      </div>
    </GroundContext.Provider>
  );
}
