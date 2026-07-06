"use client";
/* ------------------------------------------------------------------ */
/*  FOLLOW THE DOLLAR, the contract room's own instrument. One modest  */
/*  SVG circle, six nodes. The visitor drags the dollar around the     */
/*  ring without lifting (pointer capture, node-to-node hit tests) or  */
/*  steps it with the arrow keys; each leg of the circuit inks in as   */
/*  it is traced. Family payment, speculator, investors' returns, the  */
/*  institutions that refused the loan, the contract that refusal      */
/*  forced, and back to the payment. No score, no replay theater;      */
/*  the only reward is watching the circle close. Completion persists  */
/*  for the session through firedOnce.                                 */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { announce } from "@/lib/exhibit/focus";
import FactValue from "../shared/FactValue";

const FIRED_KEY = "room-follow-dollar-traced";

/* ring geometry, in viewBox units */
const VIEW = 560;
const CX = 280;
const CY = 260;
const R = 150;
const NODE_R = 24;
const HIT_R = 52;
const STEPS = 6;

interface NodeDef {
  /** label lines drawn in the SVG */
  lines: string[];
  anchor: "start" | "middle" | "end";
  lx: number;
  ly: number;
}

const angleOf = (i: number) => ((i * 60 - 90) * Math.PI) / 180;
const nodeX = (i: number) => CX + R * Math.cos(angleOf(i));
const nodeY = (i: number) => CY + R * Math.sin(angleOf(i));

const NODES: NodeDef[] = [
  { lines: ["The family’s payment"], anchor: "middle", lx: CX, ly: 66 },
  { lines: ["The speculator"], anchor: "start", lx: nodeX(1) + 34, ly: nodeY(1) + 4 },
  { lines: ["The investors’", "returns"], anchor: "start", lx: nodeX(2) + 34, ly: nodeY(2) - 4 },
  { lines: ["The institutions that", "refused the loan"], anchor: "middle", lx: CX, ly: nodeY(3) + NODE_R + 26 },
  { lines: ["The contract the", "refusal forced"], anchor: "end", lx: nodeX(4) - 34, ly: nodeY(4) - 4 },
  { lines: ["Back to", "the payment"], anchor: "end", lx: nodeX(5) - 34, ly: nodeY(5) - 4 },
];

const VALUE_TEXT = [
  "The family’s payment, the start of the circle",
  "The speculator",
  "The investors’ returns",
  "The institutions that refused the loan",
  "The contract the refusal forced",
  "Back to the payment",
  "The circle is closed",
];

/** arc of the ring from node i to node i+1, clockwise */
function segmentPath(i: number): string {
  const x1 = nodeX(i);
  const y1 = nodeY(i);
  const x2 = nodeX((i + 1) % STEPS);
  const y2 = nodeY((i + 1) % STEPS);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export default function FollowTheDollar() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();

  const [step, setStep] = useState<number>(() => (state.firedOnce.includes(FIRED_KEY) ? STEPS : 0));
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const stepRef = useRef(step);

  /* handlers read the ref so a single pointermove can advance several
     legs; the effect keeps it honest across keyboard updates too */
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const complete = step >= STEPS;

  const moveTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(STEPS, next));
      if (clamped === stepRef.current) return;
      stepRef.current = clamped;
      setStep(clamped);
      if (clamped >= STEPS && !state.firedOnce.includes(FIRED_KEY)) {
        dispatch({ type: "MARK_FIRED", key: FIRED_KEY });
        announce("The circle closes where it began, at the payment.");
      }
    },
    [dispatch, state.firedOnce]
  );

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current || stepRef.current >= STEPS) return;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const vx = ((e.clientX - rect.left) / rect.width) * VIEW;
    const vy = ((e.clientY - rect.top) / rect.height) * VIEW;
    /* advance while the pointer sits on the next node in sequence */
    let s = stepRef.current;
    while (s < STEPS) {
      const target = (s + 1) % STEPS;
      const dx = vx - nodeX(target);
      const dy = vy - nodeY(target);
      if (Math.hypot(dx, dy) > HIT_R) break;
      s += 1;
    }
    if (s !== stepRef.current) moveTo(s);
  };

  const endDrag = (e: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = step + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = step - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = STEPS;
    if (next == null) return;
    e.preventDefault();
    moveTo(next);
  };

  const handleNode = step % STEPS;
  const hx = (nodeX(handleNode) / VIEW) * 100;
  const hy = (nodeY(handleNode) / VIEW) * 100;

  return (
    <div data-testid="follow-the-dollar" data-step={step} data-complete={String(complete)}>
      <div ref={fieldRef} className="relative mx-auto w-full max-w-[500px]">
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="block h-auto w-full select-none" aria-hidden="true">
          {/* the six legs of the circuit: faint base, inked once traced */}
          {Array.from({ length: STEPS }, (_, i) => (
            <g key={i}>
              <path
                d={segmentPath(i)}
                fill="none"
                style={{ stroke: "var(--color-exh-ink)" }}
                strokeOpacity={0.18}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={segmentPath(i)}
                fill="none"
                style={{ stroke: "var(--color-exh-ink)" }}
                strokeOpacity={step > i ? 0.85 : 0}
                strokeWidth={2.5}
                vectorEffect="non-scaling-stroke"
                className="transition-opacity duration-300 [[data-motion=off]_&]:transition-none"
              />
              {/* direction chevron at the leg's midpoint */}
              <polygon
                points="7,0 -4,4.5 -4,-4.5"
                style={{ fill: "var(--color-exh-ink)" }}
                fillOpacity={step > i ? 0.7 : 0.25}
                transform={`translate(${(CX + R * Math.cos(((i * 60 - 60) * Math.PI) / 180)).toFixed(1)} ${(
                  CY + R * Math.sin(((i * 60 - 60) * Math.PI) / 180)
                ).toFixed(1)}) rotate(${i * 60 + 30})`}
              />
            </g>
          ))}

          {/* nodes over the ring */}
          {NODES.map((n, i) => {
            const reached = step > i || i === 0 || complete;
            return (
              <g key={i}>
                <circle
                  cx={nodeX(i)}
                  cy={nodeY(i)}
                  r={NODE_R}
                  style={{ fill: "var(--color-exh-linen-deep)", stroke: "var(--color-exh-ink)" }}
                  strokeOpacity={reached ? 0.85 : 0.35}
                  strokeWidth={reached ? 2 : 1.25}
                  vectorEffect="non-scaling-stroke"
                />
                {reached ? (
                  <circle cx={nodeX(i)} cy={nodeY(i)} r={4} style={{ fill: "var(--color-exh-ink)" }} fillOpacity={0.8} />
                ) : null}
                <text
                  textAnchor={n.anchor}
                  className="exh-plat"
                  style={{ fill: "var(--color-exh-ink)" }}
                  fillOpacity={reached ? 0.95 : 0.6}
                  fontSize={14}
                  letterSpacing={0.5}
                >
                  {n.lines.map((line, li) => (
                    <tspan key={li} x={n.lx} y={n.ly + li * 17}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}

          {/* center plate */}
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            className="exh-plat"
            style={{ fill: "var(--color-exh-ink)" }}
            fillOpacity={0.55}
            fontSize={12}
            letterSpacing={2.5}
          >
            FOLLOW
          </text>
          <text
            x={CX}
            y={CY + 14}
            textAnchor="middle"
            className="exh-plat"
            style={{ fill: "var(--color-exh-ink)" }}
            fillOpacity={0.55}
            fontSize={12}
            letterSpacing={2.5}
          >
            THE DOLLAR
          </text>
        </svg>

        {/* the dollar itself, riding the ring */}
        <button
          type="button"
          role="slider"
          data-testid="follow-the-dollar-handle"
          aria-label="Follow the dollar around the circle"
          aria-valuemin={0}
          aria-valuemax={STEPS}
          aria-valuenow={step}
          aria-valuetext={VALUE_TEXT[step]}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full border-2 border-exh-ink/70 bg-exh-linen shadow-[0_1px_5px_rgba(28,26,23,0.3)] active:cursor-grabbing"
          style={{ left: `${hx}%`, top: `${hy}%` }}
        >
          <span aria-hidden="true" className="exh-mono text-base font-medium text-exh-ink">
            $
          </span>
        </button>
      </div>

      <p className="exh-plat mt-2 text-center text-[11px] uppercase tracking-[0.22em] text-exh-ink-soft">
        {complete
          ? "Traced. The circuit is closed."
          : "Drag the dollar around the circle without lifting, or step it with the arrow keys"}
      </p>

      <div className="mt-5 border-t border-exh-ink/15 pt-4 text-center">
        <p className="font-display text-lg italic leading-relaxed text-exh-ink">
          The same dollars, moving in a circle.
        </p>
        <div className="mt-3 flex flex-col items-center gap-2">
          <FactValue id="contracts.lenders_241_1" />
          <FactValue id="contracts.extraction_3_4b" />
        </div>
      </div>
    </div>
  );
}
