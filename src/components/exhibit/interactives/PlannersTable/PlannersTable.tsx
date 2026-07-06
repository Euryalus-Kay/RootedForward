"use client";
/* ------------------------------------------------------------------ */
/*  The Planner's Table, the CH8 pause point. The hydePark plat stage  */
/*  laid out as the commission's renewal map. A two-position switch    */
/*  reads the same ground in the plan's vocabulary and then in human   */
/*  terms; both overlays are stylized washes and say so, never fake    */
/*  parcels. A year slider (1952 to 1962) paces three counters whose   */
/*  totals come from the fact registry, and as it crosses 1955 the     */
/*  departure dots from departures.json fade in, then drain south off  */
/*  the frame between 1958 and 1962 on deterministic seeded paths.     */
/*  The departure is witnessed, not played; dots only follow the       */
/*  year, and under reduced motion they thin in place with no          */
/*  scatter. Two envelopes carry the relocation record. Baldwin        */
/*  lands after 1962. Completes when the switch was used and the       */
/*  slider reached 1962.                                               */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { getFact, hasFact } from "@/lib/exhibit/facts";
import MapStage, { VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import Stamp from "../../shared/Stamp";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import VoiceCard from "../../shared/VoiceCard";

/* ---------------- the years the record gives us ---------------- */
/* 1952 the commission (renewal.secc_1952), 1955 the first demolition
   (renewal.first_demolition_1955), 1958 approval (renewal.approved_1958),
   1962 where the program's counted totals land in this exhibit. */
const YEAR_MIN = 1952;
const YEAR_MAX = 1962;
const ARRIVE_YEAR = 1955; /* dots present as the first building falls */
const DRAIN_START = 1958;
const TICK_YEARS = [1952, 1955, 1958, 1962];

/* drain geometry: south exit lanes and travel time in slider years */
const LANES = [880, 1060, 1260];
const TRAVEL_YEARS = 0.6;
const OFF_FRAME_Y = VIEW_H + 90;
const DRAIN_SPREAD = 3.4; /* departures start across [1958, 1961.4] */
const EASE_YEARS_PER_SEC = 1.8;

const DEPARTURES_URL = "/exhibit-data/departures.json";
const NOTE_FALLBACK =
  "Dot positions are random within the Hyde Park-Kenwood community areas; they represent counts, not addresses.";
const MOBILE_DOTS = 1000;

interface DeparturesDoc {
  note?: string;
  seed?: number;
  count?: number;
  points?: [number, number][];
}

/* fetch-once cache, same resilience policy as useExhibitMapData */
let departuresPromise: Promise<DeparturesDoc | null> | null = null;
function loadDepartures(): Promise<DeparturesDoc | null> {
  if (!departuresPromise) {
    departuresPromise = fetch(DEPARTURES_URL)
      .then((r) => (r.ok ? (r.json() as Promise<DeparturesDoc>) : null))
      .catch(() => null);
  }
  return departuresPromise;
}

/* mulberry32, seeded from the dataset's own seed so paths are
   deterministic for every visitor and every run */
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (p: number) => p * p * (3 - 2 * p);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* per-dot precomputed params, packed flat */
interface DotField {
  n: number;
  x: Float32Array;
  y: Float32Array;
  stagger: Float32Array; /* arrival fade offset, 0..0.6 years */
  depart: Float32Array; /* drain start year */
  toX: Float32Array; /* lane target with jitter */
}

function buildField(points: [number, number][], seed: number, max: number): DotField {
  const n = Math.min(points.length, max);
  const f: DotField = {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    stagger: new Float32Array(n),
    depart: new Float32Array(n),
    toX: new Float32Array(n),
  };
  for (let i = 0; i < n; i++) {
    const rng = mulberry32((seed + i * 1013904223) >>> 0);
    f.x[i] = points[i][0];
    f.y[i] = points[i][1];
    f.stagger[i] = rng() * 0.6;
    f.depart[i] = DRAIN_START + rng() * DRAIN_SPREAD;
    const lane = LANES[Math.floor(rng() * LANES.length) % LANES.length];
    f.toX[i] = lane + (rng() - 0.5) * 90;
  }
  return f;
}

/* ---------------- the stylized washes (not parcels) ---------------- */

const WASHES = [
  "M850 120 L1150 100 L1240 240 L1160 380 L900 400 L790 260 Z",
  "M760 470 L1240 440 L1360 560 L1300 680 L920 700 L730 590 Z",
  "M950 740 L1290 720 L1390 830 L1250 900 L990 880 Z",
];

interface ChipSpot {
  x: number;
  y: number;
  text: string;
}

const PLAN_CHIPS: ChipSpot[] = [
  { x: 1010, y: 260, text: "overcrowded" },
  { x: 1050, y: 575, text: "deteriorating" },
  { x: 1170, y: 815, text: "obsolete" },
];

const HUMAN_CHIPS: ChipSpot[] = [
  { x: 1010, y: 260, text: "homes" },
  { x: 830, y: 480, text: "churches" },
  { x: 1050, y: 575, text: "corner stores" },
  { x: 1140, y: 815, text: "the artist colony at Fifty-Seventh Street" },
];

function MapChip({ x, y, text }: ChipSpot) {
  const fs = 34;
  const w = text.length * fs * 0.62 + 44;
  const h = 60;
  return (
    <g transform={`translate(${x - w / 2} ${y - h / 2})`}>
      <rect
        width={w}
        height={h}
        rx={3}
        style={{ fill: "var(--color-exh-linen)" }}
        fillOpacity={0.94}
        stroke="var(--color-exh-ink)"
        strokeOpacity={0.55}
        strokeWidth={1.5}
      />
      <text
        x={w / 2}
        y={h / 2 + fs * 0.36}
        textAnchor="middle"
        className="exh-plat"
        fontSize={fs}
        letterSpacing={3}
        style={{ fill: "var(--color-exh-ink)" }}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
}

/* ---------------- counters ---------------- */

const COUNTERS = [
  { id: "renewal.buildings_638", key: "buildings", label: "Buildings marked", usd: false },
  { id: "renewal.families_displaced", key: "families", label: "Families displaced", usd: false },
  { id: "renewal.university_29m", key: "dollars", label: "University dollars", usd: true },
] as const;

function factNumber(id: string): number {
  if (!hasFact(id)) return 0;
  const v = getFact(id).value;
  return typeof v === "number" ? v : 0;
}

/* ---------------- envelopes ---------------- */

interface EnvelopeProps {
  testid: string;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function Envelope({ testid, label, open, onToggle, children }: EnvelopeProps) {
  return (
    <PaperCard className="overflow-hidden">
      <button
        type="button"
        data-testid={testid}
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-12 w-full cursor-pointer items-center gap-3 p-3 text-left hover:bg-exh-ink/5"
      >
        <svg viewBox="0 0 46 32" width={46} height={32} aria-hidden="true" className="shrink-0">
          <rect
            x={1.5}
            y={6}
            width={43}
            height={24.5}
            rx={1.5}
            style={{ fill: "var(--color-exh-linen-deep)" }}
            stroke="var(--color-exh-ink)"
            strokeOpacity={0.6}
            strokeWidth={1.4}
          />
          {open ? (
            <path
              d="M1.5 6 L23 1 L44.5 6"
              fill="none"
              stroke="var(--color-exh-ink)"
              strokeOpacity={0.6}
              strokeWidth={1.4}
            />
          ) : (
            <path
              d="M1.5 6 L23 20 L44.5 6"
              fill="none"
              stroke="var(--color-exh-ink)"
              strokeOpacity={0.6}
              strokeWidth={1.4}
            />
          )}
        </svg>
        <span className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink">
          {label}
        </span>
        <span className="exh-plat ml-auto shrink-0 text-[10px] uppercase tracking-[0.15em] text-exh-ink-soft">
          {open ? "close" : "open"}
        </span>
      </button>
      {open && <div className="border-t border-exh-ink/15 p-3">{children}</div>}
    </PaperCard>
  );
}

/* ---------------- slider chrome ---------------- */

const RANGE_CSS = `
.pt-year-range { appearance: none; -webkit-appearance: none; display: block; width: 100%; height: 56px; background: transparent; cursor: pointer; }
.pt-year-range:focus-visible { outline: 2px solid var(--color-exh-blue); outline-offset: 2px; }
.pt-year-range::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: color-mix(in oklab, var(--color-exh-ink) 35%, transparent); }
.pt-year-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -22px; height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: radial-gradient(circle at 35% 30%, var(--color-exh-linen), var(--color-exh-linen-deep)); box-shadow: 0 1px 2px rgba(28, 26, 23, 0.35); }
.pt-year-range::-moz-range-track { height: 4px; border-radius: 2px; background: color-mix(in oklab, var(--color-exh-ink) 35%, transparent); }
.pt-year-range::-moz-range-thumb { height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: var(--color-exh-linen); box-shadow: 0 1px 2px rgba(28, 26, 23, 0.35); }
`;

type SwitchPos = "plan" | "there";

export default function PlannersTable() {
  const api = useInteractive();

  const [pos, setPos] = useState<SwitchPos>("plan");
  const [year, setYear] = useState(YEAR_MIN);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const [depNote, setDepNote] = useState<string | null>(null);
  const [openEnv, setOpenEnv] = useState<{ renter: boolean; owner: boolean }>({
    renter: false,
    owner: false,
  });

  /* phone-sized screens carry a quarter of the dots, honestly relabeled */
  const [compact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<DotField | null>(null);
  const yearRef = useRef(YEAR_MIN);
  const renderYearRef = useRef<number>(YEAR_MIN);
  const animRef = useRef<number | null>(null);
  const countRef = useRef(-1);
  const toggledRef = useRef(false);
  const reachedRef = useRef(false);
  const doneRef = useRef(false);
  const reducedRef = useRef(api.reducedMotion);
  useEffect(() => {
    reducedRef.current = api.reducedMotion;
  }, [api.reducedMotion]);

  const complete = useCallback(() => {
    if (doneRef.current || !toggledRef.current || !reachedRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  /* ---------------- canvas drawing ---------------- */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const field = fieldRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let visible = 0;
    if (field) {
      ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
      const yr = renderYearRef.current;
      const reduced = reducedRef.current;
      const ink = getComputedStyle(canvas).getPropertyValue("--color-exh-ink") || "#1C1A17";
      const r = 4;
      /* alpha-bucketed batch draw, one path per bucket, no per-dot DOM */
      const BUCKETS = 5;
      const paths: Path2D[] = [];
      for (let b = 0; b < BUCKETS; b++) paths[b] = new Path2D();
      for (let i = 0; i < field.n; i++) {
        let px = field.x[i];
        let py = field.y[i];
        let alpha: number;
        if (reduced) {
          /* no scatter under reduced motion: dots simply thin in place */
          if (yr < ARRIVE_YEAR || yr >= field.depart[i]) continue;
          alpha = 0.55;
        } else {
          const aIn = clamp01((yr - (ARRIVE_YEAR - 1) - field.stagger[i]) / 0.4);
          if (aIn <= 0) continue;
          const p = clamp01((yr - field.depart[i]) / TRAVEL_YEARS);
          if (p >= 1) continue;
          if (p > 0) {
            px += (field.toX[i] - px) * 0.6 * smooth(p);
            py += (OFF_FRAME_Y - py) * p * p;
          }
          const fade = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
          alpha = 0.55 * aIn * fade;
          if (alpha <= 0.02) continue;
        }
        if (py > VIEW_H + r) continue; /* clipped, off the frame edge */
        visible++;
        const bucket = Math.min(BUCKETS - 1, Math.floor((alpha / 0.55) * BUCKETS));
        paths[bucket].moveTo(px + r, py);
        paths[bucket].arc(px, py, r, 0, Math.PI * 2);
      }
      ctx.fillStyle = ink.trim() || "#1C1A17";
      for (let b = 0; b < BUCKETS; b++) {
        ctx.globalAlpha = ((b + 1) / BUCKETS) * 0.55;
        ctx.fill(paths[b]);
      }
      ctx.globalAlpha = 1;
    }
    if (countRef.current !== visible) {
      countRef.current = visible;
      setDotCount(visible);
    }
  }, []);

  /* ease the drawn year toward the slider year so a drag between 1958
     and 1962 plays as slow southward streams; instant when motion is off */
  const kick = useCallback(() => {
    if (animRef.current != null) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = yearRef.current;
      const cur = renderYearRef.current;
      const instant = reducedRef.current || motionMs(1000) <= 1;
      let next: number;
      if (instant) {
        next = target;
      } else {
        const d = target - cur;
        next = cur + Math.sign(d) * Math.min(Math.abs(d), EASE_YEARS_PER_SEC * dt);
      }
      renderYearRef.current = next;
      draw();
      if (next !== target) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(
    () => () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    },
    []
  );

  /* dot data load */
  useEffect(() => {
    let alive = true;
    loadDepartures().then((doc) => {
      if (!alive || !doc?.points?.length) return;
      const max = compact ? MOBILE_DOTS : doc.points.length;
      fieldRef.current = buildField(doc.points, doc.seed ?? 1, max);
      if (typeof doc.note === "string" && doc.note.trim()) setDepNote(doc.note);
      draw();
    });
    return () => {
      alive = false;
    };
  }, [compact, draw]);

  /* canvas backing store follows the stage box */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const fit = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.width * (VIEW_H / VIEW_W) * dpr);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  /* redraw instantly when motion preference flips */
  useEffect(() => {
    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [api.reducedMotion, draw]);

  /* ---------------- control handlers ---------------- */

  const selectPos = (next: SwitchPos) => {
    api.onInteraction();
    if (next !== pos) {
      toggledRef.current = true;
      setPos(next);
      complete();
    }
  };

  const selectYear = useCallback(
    (v: number) => {
      const next = Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.round(v)));
      api.onInteraction();
      yearRef.current = next;
      setYear(next);
      kick();
      if (next >= YEAR_MAX && !reachedRef.current) {
        reachedRef.current = true;
        setReachedEnd(true);
        complete();
      }
    },
    [api, kick, complete]
  );

  const toggleEnv = (which: "renter" | "owner") => {
    api.onInteraction();
    setOpenEnv((prev) => ({ ...prev, [which]: !prev[which] }));
  };

  /* ---------------- derived display ---------------- */

  const t = (year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
  const atEnd = year >= YEAR_MAX;
  const fadeMs = api.reducedMotion ? 0 : motionMs(360);
  const overlayStyle = (on: boolean) => ({
    opacity: on ? 1 : 0,
    transition: fadeMs ? `opacity ${fadeMs}ms ease` : "none",
    pointerEvents: "none" as const,
  });

  const counters = useMemo(
    () =>
      COUNTERS.map((c) => ({
        ...c,
        total: factNumber(c.id),
      })),
    []
  );

  const unitLine = compact ? "1 dot, 4 families." : "1 dot, 1 family.";

  return (
    <div className="w-full" data-testid="planners-table" data-year={year}>
      <style>{RANGE_CSS}</style>

      {/* ---------------- header + honesty chip ---------------- */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Set the switch, then advance the years.
        </p>
        <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-none tracking-[0.15em] text-exh-ink-soft">
          illustration of the plan&rsquo;s language, not a parcel map
        </span>
      </div>

      {/* ---------------- the two-position switch ---------------- */}
      <div
        data-testid="pt-switch"
        data-position={pos}
        role="group"
        aria-label="Read the same ground two ways"
        className="mb-3 inline-flex overflow-hidden rounded-sm border border-exh-ink/40"
      >
        {(
          [
            ["plan", "What the plan called it"],
            ["there", "What was there"],
          ] as [SwitchPos, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={pos === value}
            onClick={() => selectPos(value)}
            className={`exh-plat min-h-12 cursor-pointer px-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
              pos === value
                ? "bg-exh-ink text-exh-linen"
                : "bg-transparent text-exh-ink hover:bg-exh-ink/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ---------------- the desk ---------------- */}
      <PaperCard tone="deep" className="p-2 sm:p-3">
        <div ref={wrapRef} className="relative">
          <MapStage frame="hydePark">
            <defs>
              <pattern
                id="pt-blight-hatch"
                width={14}
                height={14}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(-45)"
              >
                <rect width={14} height={14} style={{ fill: "var(--color-exh-red)" }} fillOpacity={0.1} />
                <line
                  x1={0}
                  y1={0}
                  x2={14}
                  y2={0}
                  style={{ stroke: "var(--color-exh-red)" }}
                  strokeOpacity={0.45}
                  strokeWidth={3}
                />
              </pattern>
              <pattern id="pt-there-weave" width={22} height={22} patternUnits="userSpaceOnUse">
                <rect width={22} height={22} style={{ fill: "var(--color-exh-ink)" }} fillOpacity={0.05} />
                <circle cx={6} cy={6} r={1.6} style={{ fill: "var(--color-exh-ink)" }} fillOpacity={0.3} />
                <circle cx={17} cy={17} r={1.6} style={{ fill: "var(--color-exh-ink)" }} fillOpacity={0.3} />
              </pattern>
            </defs>

            {/* position A, the survey wash in the plan's vocabulary */}
            <g style={overlayStyle(pos === "plan")} aria-hidden={pos !== "plan"}>
              {WASHES.map((d) => (
                <path
                  key={d}
                  d={d}
                  fill="url(#pt-blight-hatch)"
                  style={{ stroke: "var(--color-exh-red)" }}
                  strokeOpacity={0.5}
                  strokeWidth={2.5}
                  strokeDasharray="10 7"
                />
              ))}
              <text
                x={815}
                y={665}
                transform="rotate(-8 815 665)"
                className="exh-plat"
                fontSize={44}
                letterSpacing={8}
                fontWeight={700}
                style={{ fill: "var(--color-exh-red)" }}
                fillOpacity={0.85}
              >
                BLIGHTED
              </text>
              {PLAN_CHIPS.map((c) => (
                <MapChip key={c.text} {...c} />
              ))}
            </g>

            {/* position B, the same ground in human terms */}
            <g style={overlayStyle(pos === "there")} aria-hidden={pos !== "there"}>
              {WASHES.map((d) => (
                <path
                  key={d}
                  d={d}
                  fill="url(#pt-there-weave)"
                  style={{ stroke: "var(--color-exh-ink)" }}
                  strokeOpacity={0.45}
                  strokeWidth={2}
                />
              ))}
              {HUMAN_CHIPS.map((c) => (
                <MapChip key={c.text} {...c} />
              ))}
            </g>
          </MapStage>

          {/* the departure, drawn in one canvas layer over the stage */}
          <canvas
            ref={canvasRef}
            data-testid="pt-dots"
            data-count={dotCount}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        </div>

        {/* caption strip under the map */}
        <div className="px-1 pt-2 pb-1" aria-live="polite">
          {pos === "plan" ? (
            <p className="text-sm leading-snug text-exh-ink-soft">
              The wash is the survey&rsquo;s verdict, in the plan&rsquo;s own words.
              <SourceSup factId="renewal.kimpton_framing" />
            </p>
          ) : (
            <p className="exh-serif text-base leading-snug text-exh-ink">
              The gap between the labels is the argument.
            </p>
          )}
          {year >= ARRIVE_YEAR && (
            <div className="mt-2 border-t border-exh-ink/15 pt-2">
              <p className="text-xs leading-relaxed text-exh-ink-soft">
                {depNote ?? NOTE_FALLBACK} {unitLine}
              </p>
              <div className="mt-1">
                <FactValue id="renewal.black_pop_drop_40pct" size="sm" />
              </div>
            </div>
          )}
        </div>
      </PaperCard>

      {/* ---------------- the year slider ---------------- */}
      <div className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="exh-mono text-2xl font-medium text-exh-ink">{year}</p>
          <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-none tracking-[0.15em] text-exh-ink-soft">
            paced to the slider, totals from the record
          </span>
        </div>
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={year}
          onChange={(e) => selectYear(Number(e.target.value))}
          aria-label="Year, 1952 to 1962"
          aria-valuetext={String(year)}
          className="pt-year-range"
        />
        <div className="flex items-start justify-between">
          {TICK_YEARS.map((y, i) => (
            <button
              key={y}
              type="button"
              onClick={() => selectYear(y)}
              aria-label={`Go to ${y}`}
              aria-current={year === y ? "true" : undefined}
              className={`exh-mono min-h-12 min-w-12 px-1 text-[11px] ${
                year >= y ? "font-semibold text-exh-ink" : "text-exh-ink/50"
              } ${i === 0 ? "text-left" : i === TICK_YEARS.length - 1 ? "text-right" : "text-center"}`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- the counters ---------------- */}
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {counters.map((c) => (
          <PaperCard key={c.id} className="p-3" data-testid={`pt-counter-${c.key}`}>
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              {c.label}
            </p>
            {atEnd ? (
              <div className="mt-1">
                <FactValue id={c.id} size="lg" />
              </div>
            ) : (
              <p className="exh-mono mt-0.5 text-xl font-medium text-exh-ink md:text-2xl">
                {c.usd
                  ? `$${Math.round(c.total * t).toLocaleString("en-US")}`
                  : Math.round(c.total * t).toLocaleString("en-US")}
              </p>
            )}
          </PaperCard>
        ))}
      </div>

      {/* ---------------- Baldwin lands after 1962 ---------------- */}
      {reachedEnd && (
        <div className={`mt-4 flex justify-center ${api.reducedMotion ? "" : "exh-ledger-in"}`}>
          <VoiceCard personId="james-baldwin" size="md" />
        </div>
      )}

      {/* ---------------- two envelopes under the desk ---------------- */}
      <div className="mt-4">
        <p className="exh-plat mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Two envelopes. Tap each one.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Envelope
            testid="pt-envelope-renter"
            label="A displaced renter"
            open={openEnv.renter}
            onToggle={() => toggleEnv("renter")}
          >
            <PaperCard tone="deep" className="p-3">
              <p className="exh-serif text-base leading-snug text-exh-ink">
                A relocation program existed for households.
              </p>
            </PaperCard>
          </Envelope>
          <Envelope
            testid="pt-envelope-owner"
            label="A displaced business owner"
            open={openEnv.owner}
            onToggle={() => toggleEnv("owner")}
          >
            <div className="flex min-h-16 items-center justify-center rounded-sm border border-dashed border-exh-ink/35 p-3">
              <Stamp text="Empty" tone="ink" size="sm" />
            </div>
            <p className="mt-2 text-sm leading-snug text-exh-ink-soft">
              Relocation help went to households. The shops and churches started over on their own.
              <SourceSup factId="renewal.families_displaced" />
            </p>
          </Envelope>
        </div>
      </div>
    </div>
  );
}
