"use client";
/* ------------------------------------------------------------------ */
/*  Build the Boom, the CH2 pause point. The Hyde Park plat with one   */
/*  pulsing target at Jackson Park. One tap raises the White City (a   */
/*  cluster of plaster forms over the fairgrounds), then the           */
/*  neighborhood densifies on its own along the documented logic:      */
/*  hotel blocks east of the Illinois Central tracks, cottage rows     */
/*  sweeping westward. Every rectangle is an illustrative building     */
/*  form, counted as such and never claimed as a statistic; the real   */
/*  facts arrive through FactValue in the caption card. A pinned       */
/*  Midway card carries the Wells and Douglass pamphlet beat and the   */
/*  ida-b-wells voice medallion. Geometry is seeded (makeRng), so      */
/*  debug runs are deterministic; reduced motion snaps every state.    */
/* ------------------------------------------------------------------ */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { makeRng, motionMs } from "@/lib/exhibit/debug";
import MapStage from "@/components/exhibit/map/MapStage";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";
import VoiceCard from "../../shared/VoiceCard";

/* ---------------- copy (kept in consts so entities stay simple) ---------------- */

const PROMPT_IDLE = "Tap the fairgrounds at Jackson Park. Raise the fair.";
const PROMPT_RISING = "The fair rises. The neighborhood follows.";
const PROMPT_SETTLED = "Six months of crowds, and the buildings stayed.";
const COUNTER_LABEL = "building forms, illustrative";
const TARGET_LABEL = "raise the fair";
const MIDWAY_TITLE = "The fair ranked people too";
const MIDWAY_BODY =
  "From the gates of the White City, Ida B. Wells and Frederick Douglass handed visitors a pamphlet, The Reason Why the Colored American Is Not in the World's Columbian Exposition. It answered the fair's exclusion of Black Americans point by point.";
const CLOSING_LINE =
  "Remember these hotels and big apartments. In fifty years, they become the battleground.";

/* ---------------- seeded geometry (2560 x 1440 hydePark frame) ---------------- */

type FormKind = "fair" | "hotel" | "cottage";

interface BoomRect {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: FormKind;
  delay: number;
}

/** the raised Illinois Central line, hugging the lakefront */
const TRACK_TOP: [number, number] = [1232, 120];
const TRACK_BOTTOM: [number, number] = [1268, 795];
const trackXAt = (y: number) =>
  TRACK_TOP[0] +
  ((y - TRACK_TOP[1]) / (TRACK_BOTTOM[1] - TRACK_TOP[1])) * (TRACK_BOTTOM[0] - TRACK_TOP[0]);

/** label boxes from hp-frame-layers.json the cottage fill keeps clear of */
const LABEL_KEEPOUT = [
  { x0: 1040, x1: 1380, y0: 585, y1: 650 } /* HYDE PARK */,
  { x0: 1050, x1: 1380, y0: 1090, y1: 1155 } /* WOODLAWN */,
];

function generateForms(rng: () => number): BoomRect[] {
  const rects: BoomRect[] = [];

  // the White City, plaster forms over Jackson Park's land and lagoon band
  for (let i = 0; i < 16; i++) {
    rects.push({
      x: 1200 + rng() * 280,
      y: 810 + rng() * 350,
      w: 26 + rng() * 34,
      h: 16 + rng() * 18,
      kind: "fair",
      delay: i * 18 + rng() * 12,
    });
  }

  // hotel blocks blooming east of the IC tracks
  const hotelYs = [180, 250, 320, 390, 460, 530, 600, 670, 740];
  hotelYs.forEach((baseY, i) => {
    const y = baseY + rng() * 14 - 7;
    const w = 18 + rng() * 8;
    const x = Math.min(trackXAt(y) + 12 + rng() * 8, 1306 - w);
    rects.push({ x, y, w, h: 14 + rng() * 6, kind: "hotel", delay: 700 + i * 70 + rng() * 40 });
  });

  // cottage rows filling westward (delay grows as x shrinks)
  const zones = [
    { x0: 740, x1: 1190, y0: 190, y1: 680, stepX: 62, stepY: 55 },
    { x0: 740, x1: 1120, y0: 790, y1: 1130, stepX: 70, stepY: 68 },
  ];
  for (const z of zones) {
    for (let gy = z.y0; gy <= z.y1; gy += z.stepY) {
      for (let gx = z.x0; gx <= z.x1; gx += z.stepX) {
        if (rng() > 0.72) continue;
        const x = gx + rng() * 20 - 10;
        const y = gy + rng() * 16 - 8;
        if (LABEL_KEEPOUT.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1)) continue;
        const norm = (x - 740) / (1190 - 740);
        rects.push({
          x,
          y,
          w: 12 + rng() * 8,
          h: 8 + rng() * 5,
          kind: "cottage",
          delay: 1050 + (1 - norm) * 2300 + rng() * 180,
        });
      }
    }
  }

  rects.sort((a, b) => a.delay - b.delay);
  return rects;
}

/* ---------------- the svg layer (memoized; per-frame counter renders skip it) ---------------- */

const FORM_STYLE: Record<FormKind, { fill: string; fillOpacity?: number; stroke?: string; strokeOpacity?: number }> = {
  fair: { fill: "#F7F3E9", fillOpacity: 0.95, stroke: "var(--color-exh-ink)", strokeOpacity: 0.5 },
  hotel: { fill: "url(#exh-boom-hatch)", stroke: "var(--color-exh-ink)", strokeOpacity: 0.55 },
  cottage: { fill: "var(--color-exh-ink)", fillOpacity: 0.3 },
};

const BoomForms = memo(function BoomForms({
  rects,
  on,
  reducedMotion,
}: {
  rects: BoomRect[];
  on: boolean;
  reducedMotion: boolean;
}) {
  return (
    <g aria-hidden="true">
      <defs>
        <pattern
          id="exh-boom-hatch"
          width={10}
          height={10}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={10} height={10} style={{ fill: "var(--color-exh-ink)" }} fillOpacity={0.14} />
          <line
            x1={0}
            y1={0}
            x2={10}
            y2={0}
            style={{ stroke: "var(--color-exh-ink)" }}
            strokeOpacity={0.55}
            strokeWidth={2}
          />
        </pattern>
      </defs>

      {/* the Illinois Central line, the boom's sorting edge */}
      <line
        x1={TRACK_TOP[0]}
        y1={TRACK_TOP[1]}
        x2={TRACK_BOTTOM[0]}
        y2={TRACK_BOTTOM[1]}
        style={{ stroke: "var(--color-exh-ink)" }}
        strokeOpacity={0.55}
        strokeWidth={3}
        strokeDasharray="14 10"
      />
      <line
        x1={TRACK_TOP[0] + 8}
        y1={TRACK_TOP[1]}
        x2={TRACK_BOTTOM[0] + 8}
        y2={TRACK_BOTTOM[1]}
        style={{ stroke: "var(--color-exh-ink)" }}
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeDasharray="14 10"
      />
      <text
        x={1214}
        y={430}
        transform="rotate(87 1214 430)"
        className="exh-plat"
        fontSize={20}
        letterSpacing={4}
        style={{ fill: "var(--color-exh-ink-soft)" }}
        fillOpacity={0.8}
      >
        IC TRACKS
      </text>

      {rects.map((r, i) => {
        const s = FORM_STYLE[r.kind];
        return (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={s.fill}
            fillOpacity={s.fillOpacity}
            stroke={s.stroke}
            strokeOpacity={s.strokeOpacity}
            strokeWidth={r.kind === "cottage" ? 0 : 1.5}
            style={{
              opacity: on ? 1 : 0,
              transition: reducedMotion
                ? "none"
                : `opacity ${motionMs(260)}ms ease-out ${motionMs(r.delay)}ms`,
            }}
          />
        );
      })}
    </g>
  );
});

/* ---------------- the interactive ---------------- */

type Phase = "idle" | "rising" | "settled";

export default function BuildTheBoom() {
  const api = useInteractive();

  const [phase, setPhase] = useState<Phase>("idle");
  const [counted, setCounted] = useState(0);
  const [midwayOpen, setMidwayOpen] = useState(false);
  const [midwaySeen, setMidwaySeen] = useState(false);

  const doneRef = useRef(false);
  const startRef = useRef(0);
  // seeded once per mount; deterministic under ?debug=1
  const [rects] = useState<BoomRect[]>(() => generateForms(makeRng()));

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  const raise = () => {
    if (phase !== "idle") return;
    api.onInteraction();
    if (api.reducedMotion) {
      setCounted(rects.length);
      setPhase("settled");
      return;
    }
    startRef.current = performance.now();
    setPhase("rising");
  };

  // counter loop: counts forms as their (motion-scaled) delays elapse
  useEffect(() => {
    if (phase !== "rising") return;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      let n = 0;
      for (const r of rects) {
        if (motionMs(r.delay) <= elapsed) n += 1;
        else break; // rects are sorted by delay
      }
      setCounted(n);
      if (n >= rects.length) {
        setPhase("settled");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, rects]);

  // teaching beat lands when the boom has run and the Midway card was
  // opened, or eight seconds after the boom regardless
  useEffect(() => {
    if (phase !== "settled") return;
    if (midwaySeen) {
      complete();
      return;
    }
    const t = setTimeout(complete, motionMs(8000));
    return () => clearTimeout(t);
  }, [phase, midwaySeen, complete]);

  const toggleMidway = () => {
    api.onInteraction();
    setMidwaySeen(true);
    setMidwayOpen((o) => !o);
  };

  const prompt = phase === "idle" ? PROMPT_IDLE : phase === "rising" ? PROMPT_RISING : PROMPT_SETTLED;

  return (
    <div className="w-full" onPointerDownCapture={api.onInteraction}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          {prompt}
        </p>
        <p data-testid="boom-counter" data-count={counted} className="text-right">
          <span className="exh-mono text-sm text-exh-ink">{counted}</span>{" "}
          <span className="exh-plat text-[9px] uppercase tracking-[0.15em] text-exh-ink-soft">
            {COUNTER_LABEL}
          </span>
        </p>
      </div>

      <div className="relative">
        <MapStage frame="hydePark">
          <BoomForms rects={rects} on={phase !== "idle"} reducedMotion={api.reducedMotion} />
        </MapStage>

        {phase === "idle" && (
          <>
            <button
              type="button"
              data-testid="boom-target"
              onClick={raise}
              aria-label="Raise the fair at Jackson Park"
              className="absolute z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 border-exh-ink/70 bg-exh-gold/30"
              style={{ left: "53.1%", top: "69.4%" }}
            >
              <span aria-hidden="true" className="exh-lamp-armed block h-6 w-6 rounded-full bg-exh-gold" />
            </button>
            <p
              aria-hidden="true"
              className="exh-plat pointer-events-none absolute z-10 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink"
              style={{ left: "53.1%", top: "76.5%" }}
            >
              {TARGET_LABEL}
            </p>
          </>
        )}

        {phase !== "idle" && (
          <button
            type="button"
            data-testid="boom-midway-card"
            aria-expanded={midwayOpen}
            onClick={toggleMidway}
            className={`absolute z-10 min-h-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer border bg-exh-linen px-3 py-2 shadow-[0_1px_3px_rgba(28,26,23,0.25)] ${
              midwayOpen ? "border-exh-blue" : "border-exh-ink/50 hover:border-exh-ink"
            }`}
            style={{ left: "34.5%", top: "50.6%" }}
          >
            <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.15em] text-exh-ink">
              {MIDWAY_TITLE}
            </span>
          </button>
        )}
      </div>

      {midwayOpen && (
        <PaperCard
          tone="deep"
          data-testid="boom-midway-panel"
          role="region"
          aria-label={MIDWAY_TITLE}
          className="exh-ledger-in mt-3 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink">
              {MIDWAY_TITLE}
            </p>
            <button
              type="button"
              onClick={toggleMidway}
              aria-label="Close the Midway card"
              className="exh-plat min-h-12 cursor-pointer border border-exh-ink/35 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink hover:border-exh-ink"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-exh-ink">{MIDWAY_BODY}</p>
          <div className="mt-2">
            <FactValue id="fair.reason_why_10000" />
          </div>
          <div className="mt-4 flex justify-center">
            <VoiceCard personId="ida-b-wells" size="sm" />
          </div>
        </PaperCard>
      )}

      {phase === "settled" && (
        <div className="exh-ledger-in mt-3 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-1.5">
            <FactValue id="fair.attendance_27m" label="the crowd" />
            <FactValue id="fair.building_boom" label="the boom" />
          </div>
          <p className="exh-serif mt-3 text-base leading-snug text-exh-ink sm:text-lg">{CLOSING_LINE}</p>
        </div>
      )}
    </div>
  );
}
