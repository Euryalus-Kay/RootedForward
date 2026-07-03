"use client";
/* ------------------------------------------------------------------ */
/*  Contract between InteractiveSlot and every exhibit interactive.    */
/*  Interactives never import exhibit state directly; the slot hands   */
/*  them exactly this. onInteraction feeds the pause-point idle        */
/*  timer; markFired/firedOnce implement once-per-session moments      */
/*  (the TwoBuyers eviction, the spine's red-span reveal).             */
/* ------------------------------------------------------------------ */
import { createContext, useContext } from "react";

export interface InteractiveApi {
  /** the slot's interactive is live (its pause point reached, or Explore mode) */
  active: boolean;
  /** true when the tour is halted on this interactive right now */
  isPausePoint: boolean;
  reducedMotion: boolean;
  /** the visitor did something meaningful; resets the idle-continue timer */
  onInteraction: () => void;
  /** the interactive's teaching beat has landed; Continue may highlight */
  onComplete: () => void;
  firedOnce: (key: string) => boolean;
  markFired: (key: string) => void;
}

export const InteractiveContext = createContext<InteractiveApi | null>(null);

export function useInteractive(): InteractiveApi {
  const v = useContext(InteractiveContext);
  if (!v) throw new Error("useInteractive outside an InteractiveSlot");
  return v;
}
