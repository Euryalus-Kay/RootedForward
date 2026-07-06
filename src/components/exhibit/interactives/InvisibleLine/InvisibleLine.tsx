"use client";
/* ------------------------------------------------------------------ */
/*  The Invisible Line, CH4 pause point 2, the exhibit's quietest      */
/*  interaction. A wide water field drawn in SVG (layered bands of     */
/*  exh-blue on linen, a thin horizon, the shore at the left edge).    */
/*  The visitor drags a handle rightward across the water; the only    */
/*  motion on this stage is that handle following their own hand.      */
/*  Past the midpoint a thin white line sets in where no line ever     */
/*  physically existed, and the story appears as quiet text below.     */
/*  Once revealed the line stays revealed for the session (firedOnce)  */
/*  and the handle is gone. Nothing here is repeatable or playable:    */
/*  no sound, no score, no success state, no replay.                   */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useInteractive } from "../InteractiveContext";
import FactValue from "../../shared/FactValue";

const FIRED_KEY = "invisible-line-revealed";

/* water field geometry, in viewBox units */
const VIEW_W = 1200;
const VIEW_H = 560;
const HORIZON_Y = 112;
const LINE_Y = 358;
const SHORE_EDGE_X = 88;

/* handle travel, percent of field width */
const MIN_PCT = 4;
const MAX_PCT = 96;
const START_PCT = 9;
const REVEAL_PCT = 50;
const KEY_STEP = 3;

const WATER_BANDS = [
  { y: 112, h: 64, o: 0.08 },
  { y: 176, h: 64, o: 0.11 },
  { y: 240, h: 64, o: 0.14 },
  { y: 304, h: 64, o: 0.17 },
  { y: 368, h: 64, o: 0.2 },
  { y: 432, h: 64, o: 0.23 },
  { y: 496, h: 64, o: 0.26 },
];

const STORY_TEXT =
  "Seventeen-year-old Eugene Williams drifted past an invisible line between the customary white and Black stretches of water. White bathers threw stones. He drowned. The officer at the beach refused to arrest the man witnesses pointed to.";

export default function InvisibleLine() {
  const api = useInteractive();

  const [revealed, setRevealed] = useState<boolean>(() => api.firedOnce(FIRED_KEY));
  const [pct, setPct] = useState(START_PCT);

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const revealedRef = useRef(revealed);
  const justRevealedRef = useRef(false);

  const reveal = useCallback(() => {
    if (revealedRef.current) return;
    revealedRef.current = true;
    justRevealedRef.current = true;
    setRevealed(true);
    api.markFired(FIRED_KEY);
    api.onComplete();
  }, [api]);

  /* keyboard users lose the handle at the moment of reveal; settle
     focus on the story so nothing is dropped */
  useEffect(() => {
    if (revealed && justRevealedRef.current) {
      justRevealedRef.current = false;
      storyRef.current?.focus({ preventScroll: false });
    }
  }, [revealed]);

  const moveTo = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_PCT, Math.max(MIN_PCT, next));
      setPct(clamped);
      if (clamped >= REVEAL_PCT) reveal();
    },
    [reveal]
  );

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    api.onInteraction();
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    moveTo(((e.clientX - rect.left) / rect.width) * 100);
  };

  const endDrag = (e: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = pct + KEY_STEP;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = pct - KEY_STEP;
    else if (e.key === "Home") next = MIN_PCT;
    else if (e.key === "End") next = MAX_PCT;
    if (next == null) return;
    e.preventDefault();
    api.onInteraction();
    moveTo(next);
  };

  return (
    <div className="w-full" data-testid="invisible-line" data-revealed={String(revealed)}>
      <div
        ref={fieldRef}
        className="exh-paper relative w-full overflow-hidden rounded-sm border border-exh-ink/25"
        role="img"
        aria-label="A quiet field of lake water drawn as pale blue bands, with the shore along the left edge"
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block h-auto w-full select-none" aria-hidden="true">
          {/* horizon */}
          <line
            x1={0}
            y1={HORIZON_Y}
            x2={VIEW_W}
            y2={HORIZON_Y}
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.3}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* the water, layered bands deepening toward the foreground */}
          {WATER_BANDS.map((b) => (
            <rect
              key={b.y}
              x={0}
              y={b.y}
              width={VIEW_W}
              height={b.h}
              style={{ fill: "var(--color-exh-blue)" }}
              fillOpacity={b.o}
            />
          ))}
          {/* two faint wave lines */}
          <line
            x1={SHORE_EDGE_X + 60}
            y1={232}
            x2={VIEW_W - 32}
            y2={232}
            style={{ stroke: "var(--color-exh-blue)" }}
            strokeOpacity={0.3}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={SHORE_EDGE_X + 24}
            y1={452}
            x2={VIEW_W - 64}
            y2={452}
            style={{ stroke: "var(--color-exh-blue)" }}
            strokeOpacity={0.3}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* the shore at the left edge */}
          <path
            d="M0 112 L86 112 C72 210 94 300 76 380 C64 452 80 506 62 560 L0 560 Z"
            style={{ fill: "var(--color-exh-linen-deep)" }}
          />
          <path
            d="M86 112 C72 210 94 300 76 380 C64 452 80 506 62 560"
            fill="none"
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.25}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* the line that was never there. White, thin, and permanent
              once revealed. The transition is suppressed wherever the
              chapter holds data-motion off. */}
          <line
            x1={SHORE_EDGE_X}
            y1={LINE_Y}
            x2={VIEW_W - 24}
            y2={LINE_Y}
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeOpacity={revealed ? 0.95 : 0}
            vectorEffect="non-scaling-stroke"
            className="transition-opacity duration-500 ease-out [[data-motion=off]_&]:transition-none"
          />
        </svg>

        <p className="exh-plat pointer-events-none absolute left-3 top-2.5 text-[10px] uppercase tracking-[0.22em] text-exh-ink/70">
          Lake Michigan at Twenty-Ninth Street, July 27, 1919
        </p>

        {!revealed && (
          <>
            {/* the reveal hairline, riding with the handle */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 w-px -translate-x-1/2 bg-exh-ink/40"
              style={{ left: `${pct}%`, top: `${(HORIZON_Y / VIEW_H) * 100}%` }}
            />
            <button
              type="button"
              role="slider"
              aria-label="Trace the line across the water"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKeyDown}
              className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border border-exh-ink/60 bg-exh-linen shadow-[0_1px_4px_rgba(28,26,23,0.25)]"
              style={{ left: `${pct}%`, top: `${(LINE_Y / VIEW_H) * 100}%` }}
            >
              <span aria-hidden="true" className="mx-auto block h-6 w-px bg-exh-ink/70" />
            </button>
          </>
        )}
      </div>

      <div className="mt-3 min-h-12">
        {revealed ? (
          <div ref={storyRef} tabIndex={-1} className="outline-none">
            <p className="font-display text-base leading-relaxed text-exh-ink md:text-lg">
              {STORY_TEXT}
            </p>
            <div className="mt-2">
              <FactValue id="bombings.williams_drowned_1919" />
            </div>
          </div>
        ) : (
          <p className="exh-plat text-[11px] uppercase tracking-[0.22em] text-exh-ink-soft">
            Drag the handle across the water
          </p>
        )}
      </div>
    </div>
  );
}
