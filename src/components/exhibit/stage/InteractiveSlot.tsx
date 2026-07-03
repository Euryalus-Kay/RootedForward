"use client";
/* ------------------------------------------------------------------ */
/*  Framed exhibit plinth around one interactive station. Looks the    */
/*  interactive up in the registry, provides the InteractiveContext    */
/*  contract, renders an honest in-production card for stations not    */
/*  built yet (auto-completing them when they are the live pause       */
/*  point so the tour never dead-ends), and mounts the Continue        */
/*  affordance under the active pause point.                           */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, type ComponentType } from "react";
import type { InteractiveId } from "@/lib/exhibit/types";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { INTERACTIVE_REGISTRY } from "../interactives/registry";
import { InteractiveContext, type InteractiveApi } from "../interactives/InteractiveContext";
import ContinueButton from "./ContinueButton";

/* Module-level interaction emitter. Interactives report meaningful
   actions here through the context's onInteraction; ContinueButton
   subscribes and resets its idle-continue countdown. */
type InteractionListener = () => void;
const interactionListeners = new Set<InteractionListener>();

export function subscribeInteraction(cb: InteractionListener): () => void {
  interactionListeners.add(cb);
  return () => {
    interactionListeners.delete(cb);
  };
}

export function notifyInteraction(): void {
  for (const cb of interactionListeners) cb();
}

export interface InteractiveSlotProps {
  id: InteractiveId;
  /** extra props defined on the stage block */
  componentProps?: Record<string, unknown>;
  /** chapter-level no-motion (ch4 sensitivity), folded in by ChapterStage */
  chapterNoMotion?: boolean;
}

export default function InteractiveSlot({
  id,
  componentProps,
  chapterNoMotion = false,
}: InteractiveSlotProps) {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const entry = INTERACTIVE_REGISTRY[id];

  const isPausePoint = state.pausePoint?.interactiveId === id;
  const completed = state.completedInteractives.includes(id);
  const active = state.mode === "explore" || isPausePoint || completed;
  const reducedMotion = state.reducedMotion || chapterNoMotion;
  const firedOnceList = state.firedOnce;
  const hasComponent = !!entry?.Component;

  const api = useMemo<InteractiveApi>(
    () => ({
      active,
      isPausePoint,
      reducedMotion,
      onInteraction: notifyInteraction,
      onComplete: () => dispatch({ type: "COMPLETE_INTERACTIVE", interactiveId: id }),
      firedOnce: (key: string) => firedOnceList.includes(key),
      markFired: (key: string) => dispatch({ type: "MARK_FIRED", key }),
    }),
    [active, isPausePoint, reducedMotion, dispatch, id, firedOnceList]
  );

  /* A station that is not built yet still counts as seen the moment the
     tour halts on it, so progress and the Continue flow stay honest. */
  useEffect(() => {
    if (!hasComponent && isPausePoint) {
      dispatch({ type: "COMPLETE_INTERACTIVE", interactiveId: id });
    }
  }, [hasComponent, isPausePoint, dispatch, id]);

  if (!entry) return null;
  const Component = entry.Component as ComponentType<Record<string, unknown>> | null;

  return (
    <div
      data-testid={`interactive-${id}`}
      data-pausepoint={isPausePoint ? id : undefined}
      className="scroll-mt-24"
    >
      <div
        className={`border bg-exh-linen-deep/40 transition-opacity duration-300 ${
          isPausePoint ? "border-exh-blue" : "border-exh-ink/30"
        } ${active ? "opacity-100" : "opacity-70"}`}
      >
        <div className="flex items-center gap-3 border-b border-exh-ink/20 px-4 py-3 sm:px-6">
          <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
          <h3 className="exh-plat shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
            {entry.title}
          </h3>
          <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
        </div>
        {Component ? (
          <div className="p-4 sm:p-6">
            <InteractiveContext.Provider value={api}>
              <Component {...(componentProps ?? {})} />
            </InteractiveContext.Provider>
          </div>
        ) : (
          <div className="px-4 py-10 text-center sm:px-6">
            <p className="font-display text-lg leading-relaxed text-exh-ink">{entry.blurb}</p>
            <p className="exh-plat mt-4 text-xs uppercase tracking-[0.2em] text-exh-ink-soft">
              This station is being built. The tour continues.
            </p>
          </div>
        )}
      </div>
      {isPausePoint && <ContinueButton />}
    </div>
  );
}
