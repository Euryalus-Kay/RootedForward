"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "answerWall" (#a6-wall). The moderated visitor answer     */
/*  wall, reusing the shipped AnswerWall station whole so every        */
/*  safeguard rides along: the review-queue POST with its honeypot,    */
/*  the migration-pending truth path, the optimistic own-chip marked   */
/*  "Held for review", and the exact question and empty-state copy.    */
/*  The station speaks its InteractiveContext contract; this wrapper   */
/*  provides it from the ground engine (active flips on approach so    */
/*  the wall fetch fires when the visitor nears it, reduced motion     */
/*  passes through, completion tracking stayed with the guided tour).  */
/*  The R9 page has no HUD frame, so the wall carries the #exh-live    */
/*  polite region its announce() calls speak through.                  */
/* ------------------------------------------------------------------ */
import { useMemo, useRef } from "react";
import type { SceneProps } from "./registry";
import { useGround } from "../engine/GroundProvider";
import { STEP_BY_ID } from "@/lib/exhibit/ground/copy";
import {
  InteractiveContext,
  type InteractiveApi,
} from "../../interactives/InteractiveContext";
import AnswerWall from "../../interactives/AnswerWall/AnswerWall";

/* the wall goes live this many steps before its own card centers */
const APPROACH_STEPS = 2;

export default function AnswerWallGround({ stepId }: SceneProps) {
  const { activeStep, reducedMotion } = useGround();
  const fired = useRef(new Set<string>());

  const myIndex = STEP_BY_ID[stepId]?.index ?? 0;
  const active = activeStep.index >= myIndex - APPROACH_STEPS;

  const api = useMemo<InteractiveApi>(
    () => ({
      active,
      isPausePoint: false,
      reducedMotion,
      onInteraction: () => {},
      onComplete: () => {},
      firedOnce: (key: string) => fired.current.has(key),
      markFired: (key: string) => {
        fired.current.add(key);
      },
    }),
    [active, reducedMotion]
  );

  return (
    <section
      data-testid="scene-answerWall"
      aria-label="The answer wall"
      className="border-t border-exh-ink/25 pt-10"
    >
      <div id="exh-live" aria-live="polite" className="sr-only" />
      <InteractiveContext.Provider value={api}>
        <AnswerWall />
      </InteractiveContext.Provider>
    </section>
  );
}
