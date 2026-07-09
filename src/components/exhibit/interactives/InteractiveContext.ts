"use client";
/* ------------------------------------------------------------------ */
/*  Contract between StationBlock (and the document rooms) and every   */
/*  exhibit station. Stations never import exhibit state directly;     */
/*  the block hands them exactly this. In the reader-paced exhibit     */
/*  there are no pause points and no completion tracking: active is    */
/*  always true, isPausePoint is always false, and onComplete is a     */
/*  no-op. The three legacy fields stay on the contract so archived    */
/*  station modules (kept in the codebase, unmounted) still compile.   */
/*  firedOnce/markFired implement once-per-session moments (the        */
/*  TwoBuyers eviction, the bombing-map draw).                         */
/* ------------------------------------------------------------------ */
import { createContext, useContext } from "react";

export interface InteractiveApi {
  /** always true; every station on the page is live */
  active: boolean;
  /** always false; pause points no longer exist */
  isPausePoint: boolean;
  reducedMotion: boolean;
  /** analytics stub; the visitor did something meaningful */
  onInteraction: () => void;
  /** legacy no-op; completion tracking left with the guided tour */
  onComplete: () => void;
  firedOnce: (key: string) => boolean;
  markFired: (key: string) => void;
}

export const InteractiveContext = createContext<InteractiveApi | null>(null);

export function useInteractive(): InteractiveApi {
  const v = useContext(InteractiveContext);
  if (!v) throw new Error("useInteractive outside a station scope");
  return v;
}
