"use client";
/* ------------------------------------------------------------------ */
/*  R9 Stage controller. Owns the sticky wrapper around the server-    */
/*  rendered map, translates the active step's StageState into data    */
/*  attributes (CSS steers every layer), swaps the viewBox on frame    */
/*  cuts, runs the grade flood as class toggles on the server-         */
/*  rendered area paths, and hosts the era readout and stage note.     */
/*  It never React-renders the SVG subtree.                            */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, type ReactNode } from "react";
import { useGround } from "./engine/GroundProvider";

export interface StageClientProps {
  /** default citywide viewBox (cropped to the polygon mass) */
  viewBox: string;
  /** crop viewBox for the bombing chapter framing */
  blackBeltViewBox: string;
  /** the Hyde Park township framing's viewBox */
  hpViewBox: string;
  /** area-id batches inked per flood step, in sheet filing order */
  floodBatches: number[][];
  /** label anchor points (stage-note positioning), viewBox units */
  anchors: Record<string, { x: number; y: number }>;
}

export default function StageController({
  stageBase,
  clientProps,
}: {
  stageBase: ReactNode;
  clientProps: StageClientProps;
}) {
  const { stage, areaTapRef } = useGround();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const appliedFlood = useRef(0);

  /* frame cuts are viewBox swaps on the server-rendered svg */
  useEffect(() => {
    const svg = wrapRef.current?.querySelector("[data-ground-svg]");
    if (!svg) return;
    const vb =
      stage.frame === "blackBelt"
        ? clientProps.blackBeltViewBox
        : stage.frame === "hydePark"
          ? clientProps.hpViewBox
          : clientProps.viewBox;
    svg.setAttribute("viewBox", vb);
  }, [stage.frame, clientProps.blackBeltViewBox, clientProps.hpViewBox, clientProps.viewBox]);

  /* the grade flood inks batches of areas in sheet filing order */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const target = stage.grades === "flood" ? (stage.floodStep ?? 0) + 1 : stage.grades === "full" ? clientProps.floodBatches.length : 0;
    const applied = appliedFlood.current;
    if (target === applied) return;
    const lo = Math.min(target, applied);
    const hi = Math.max(target, applied);
    const addMode = target > applied;
    for (let b = lo; b < hi; b++) {
      for (const id of clientProps.floodBatches[b] ?? []) {
        root.querySelector(`[data-aid="${id}"]`)?.classList.toggle("inked", addMode);
      }
    }
    appliedFlood.current = target;
  }, [stage.grades, stage.floodStep, clientProps.floodBatches]);

  /* one delegated tap handler for the whole map */
  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;
    const onClick = (e: Event) => {
      const hit = (e.target as Element).closest("[data-aid]");
      if (hit && areaTapRef.current) {
        const id = Number(hit.getAttribute("data-aid"));
        if (!Number.isNaN(id)) areaTapRef.current(id);
      }
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [areaTapRef]);

  const note = stage.note ?? null;
  const anchor = note ? clientProps.anchors[note.anchor] : null;
  /* anchor position as a percentage of the viewBox for CSS placement */
  const vb = (
    stage.frame === "blackBelt"
      ? clientProps.blackBeltViewBox
      : stage.frame === "hydePark"
        ? clientProps.hpViewBox
        : clientProps.viewBox
  )
    .split(" ")
    .map(Number);
  const notePos =
    note && anchor
      ? {
          left: `${(((anchor.x - vb[0]) / vb[2]) * 100).toFixed(1)}%`,
          top: `${(((anchor.y - vb[1]) / vb[3]) * 100).toFixed(1)}%`,
        }
      : null;

  return (
    <div
      ref={wrapRef}
      className="ground-stage"
      data-testid="ground-stage"
      data-frame={stage.frame}
      data-grades={stage.grades}
      data-linework={stage.linework ? "on" : "off"}
      data-boundary={stage.boundary ? "on" : "off"}
      data-labels={stage.labels ? "on" : "off"}
      data-marks={stage.marks ? "on" : "off"}
      data-dim={stage.dim ? "on" : "off"}
      data-warm={stage.warm ? "on" : "off"}
      data-today={stage.today ? "on" : "off"}
      data-note-anchor={note ? note.anchor : "none"}
    >
      {stageBase}
      {stage.era ? (
        <p className="ground-era exh-plat" data-testid="ground-era" aria-hidden="true">
          {stage.era}
        </p>
      ) : null}
      {note && notePos ? (
        <p className="ground-note exh-plat" style={notePos} data-testid="ground-note">
          {note.text}
        </p>
      ) : null}
    </div>
  );
}
