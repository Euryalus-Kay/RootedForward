"use client";
/* ------------------------------------------------------------------ */
/*  The step column. Renders every act's steps as cards that scroll    */
/*  past the sticky Stage; each card registers itself with the         */
/*  engine's IntersectionObserver. Scene steps mount from the scene    */
/*  registry (unregistered scenes render nothing so acts can land in   */
/*  waves without placeholders). Chapter heads carry the stable        */
/*  anchor ids the rest of the site links to.                          */
/* ------------------------------------------------------------------ */
import { useCallback } from "react";
import { GROUND_COPY, RESOLVED_STEPS, CHAPTER_NUMBERS, CHAPTER_COUNT } from "@/lib/exhibit/ground/copy";
import type { ResolvedStep } from "@/lib/exhibit/ground/types";
import { useGround } from "./engine/GroundProvider";
import { renderRichText } from "../shared/richText";
import { SourceSupGroup } from "../shared/SourceSup";
import { GROUND_SCENES } from "./scenes/registry";

function StepCard({ step }: { step: ResolvedStep }) {
  const { registerStep } = useGround();
  const refCb = useCallback(
    (el: HTMLElement | null) => registerStep(step.index, el),
    [registerStep, step.index]
  );

  if (step.role === "scene" || (step.role === "quote" && step.scene)) {
    const Scene = step.scene ? GROUND_SCENES[step.scene] : undefined;
    if (!Scene) return null;
    return (
      <div ref={refCb} id={step.id} data-testid={`gstep-${step.id}`} className="ground-scene-slot">
        <Scene stepId={step.id} />
      </div>
    );
  }

  if (step.role === "chapterHead") {
    const n = CHAPTER_NUMBERS[step.id];
    return (
      <header ref={refCb} id={step.id} data-testid={`gstep-${step.id}`} className="ground-chapterhead">
        <p className="gch-count exh-plat">
          Chapter {n} of {CHAPTER_COUNT}
          {step.years ? <span className="gch-years exh-mono"> · {step.years}</span> : null}
        </p>
        <h2 className="gch-title">{step.title}</h2>
      </header>
    );
  }

  if (step.role === "takeaway") {
    /* div, not p: the citation popover mounts block elements inline */
    return (
      <div ref={refCb} id={step.id} data-testid={`gstep-${step.id}`} className="ground-takeaway">
        {renderRichText(step.text ?? "")}
        <SourceSupGroup factIds={step.factRefs ?? []} />
      </div>
    );
  }

  return (
    <div
      ref={refCb}
      id={step.id}
      data-testid={`gstep-${step.id}`}
      className={step.role === "charge" ? "ground-charge" : "ground-step"}
    >
      <div className="gstep-text">
        {renderRichText(step.text ?? "")}
        <SourceSupGroup factIds={step.factRefs ?? []} />
      </div>
    </div>
  );
}

export default function GroundFlow() {
  return (
    <div className="ground-flow" data-testid="ground-flow">
      {GROUND_COPY.acts.map((act) => {
        const steps = RESOLVED_STEPS.filter((s) => s.actId === act.id);
        return (
          <section key={act.id} id={act.id} data-testid={`ground-${act.id}`} className="ground-act">
            {steps.map((s) => (
              <StepCard key={s.id} step={s} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
