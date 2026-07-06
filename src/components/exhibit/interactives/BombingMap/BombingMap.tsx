"use client";
/* ------------------------------------------------------------------ */
/*  The Bombing Map, CH4 pause point 1. The commission's evidence      */
/*  map. A fixed South Side window of the citywide frame (a static     */
/*  reprojection; the pins keep their precomputed citywide-frame       */
/*  coordinates) over the HOLC ground dimmed to near-monochrome.       */
/*  The 32 geocoded incidents appear as silent ink marks in record     */
/*  order, one at a time; under reduced motion they render at once.    */
/*  Marks are witnessed, never played: no pulses, no ripples, no       */
/*  sound, no success state. Tapping a mark or a docket row opens a    */
/*  quiet evidence card with the verbatim CCRR excerpt under a "from   */
/*  the 1922 record" label. The eight incidents recorded without an    */
/*  address are listed in a drawer so nothing documented is hidden.    */
/*  exh-red appears exactly once, as the commission's square.          */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { getFact, hasFact } from "@/lib/exhibit/facts";
import {
  makeFrameProjector,
  makeFrameReprojector,
  type MapFrame,
  type RingPoints,
} from "@/lib/exhibit/map/projection";
import { useFrameLayers, useHolcFrames } from "@/lib/exhibit/map/useExhibitMapData";
import MapStage, { VIEW_W } from "@/components/exhibit/map/MapStage";
import HolcLayer from "@/components/exhibit/map/layers/HolcLayer";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import VoiceCard from "../../shared/VoiceCard";

/* ---------------- data (fetched once, module cache) ---------------- */

const BOMBINGS_URL = "/exhibit-data/bombings.json";

interface BombingGeo {
  lat?: number;
  lng?: number;
  frame?: { x?: number; y?: number; citywide?: [number, number] } | null;
  method?: string;
  precisionMeters?: number;
}

interface BombingIncident {
  id: string;
  date: string | null;
  dateApproximate?: boolean;
  address: string | null;
  target: string;
  targetType?: string;
  precision?: string;
  excerpt: string;
  locator: string;
  geo?: BombingGeo | null;
}

interface BombingsDoc {
  source?: { title?: string; author?: string; year?: number; url?: string };
  aggregates?: {
    total?: number;
    insideSquare?: number;
    deaths?: number;
    arrests?: number;
    convictions?: number;
    square?: { north?: string; south?: string; east?: string; west?: string };
  };
  citywideFrame?: MapFrame;
  incidents?: BombingIncident[];
}

interface BombingsCacheEntry {
  promise: Promise<void> | null;
  data: BombingsDoc | null;
  done: boolean;
}

const bombingsCache: BombingsCacheEntry = { promise: null, data: null, done: false };

function loadBombings(): BombingsCacheEntry {
  if (bombingsCache.promise) return bombingsCache;
  bombingsCache.promise = fetch(BOMBINGS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${BOMBINGS_URL}`);
      return res.json() as Promise<BombingsDoc>;
    })
    .then((json) => {
      bombingsCache.data = json;
    })
    .catch(() => {
      bombingsCache.data = null;
    })
    .finally(() => {
      bombingsCache.done = true;
    });
  return bombingsCache;
}

function useBombings(): { data: BombingsDoc | null; done: boolean } {
  const [state, setState] = useState(() => {
    if (typeof window !== "undefined" && bombingsCache.done) {
      return { data: bombingsCache.data, done: true };
    }
    return { data: null, done: false };
  });
  useEffect(() => {
    let alive = true;
    const entry = loadBombings();
    const publish = () => {
      if (alive) setState({ data: entry.data, done: true });
    };
    if (entry.done) publish();
    else entry.promise?.then(publish);
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/* ---------------- geometry ---------------- */

/**
 * The stage shows a fixed window of the citywide frame so the
 * commission's square reads at evidence size. Pure scale and shift;
 * every plotted point keeps its precomputed citywide coordinates.
 */
const WINDOW = { x: 1130, y: 702, w: 440 } as const;
const S = VIEW_W / WINDOW.w;

function toView(x: number, y: number): [number, number] {
  return [(x - WINDOW.x) * S, (y - WINDOW.y) * S];
}

/**
 * The commission's square, "bounded by Forty-first and Sixtieth
 * streets, Cottage Grove Avenue and State Street." Corner coordinates
 * come from the same ca.geojson street-grid calibration that
 * scripts/exhibit-prep-bombings.mjs used to geocode the incidents
 * (39th/51st St edges of Grand Boulevard, measured Cottage Grove
 * edge). Cross-check: projecting 4724 S State St with these constants
 * reproduces the plotted Binga office mark at (1361.9, 801.1) exactly.
 */
const SQUARE_GEO = {
  northLat: 41.82016, // 41st St
  southLat: 41.78579, // 60th St
  westLng: -87.62602, // State St
  eastLng: -87.60661, // Cottage Grove Ave
} as const;

/** tolerate a single ring or a list of rings, like MapStage does */
function asRings(geom: RingPoints | RingPoints[] | undefined | null): RingPoints[] {
  if (!geom || !geom.length) return [];
  const first = geom[0] as unknown;
  if (Array.isArray(first) && typeof (first as unknown[])[0] === "number") {
    return [geom as RingPoints];
  }
  return geom as RingPoints[];
}

/* ---------------- copy helpers ---------------- */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function dateLong(inc: BombingIncident): string {
  if (!inc.date) return "Before 1919";
  const [y, m, d] = inc.date.split("-");
  const month = m ? MONTHS[Number(m) - 1] : null;
  if (!month) return y;
  return d ? `${month} ${Number(d)}, ${y}` : `${month} ${y}`;
}

function dateShort(inc: BombingIncident): string {
  if (!inc.date) return "pre-1919";
  const [y, m, d] = inc.date.split("-");
  const month = m ? MONTHS[Number(m) - 1]?.slice(0, 3) : null;
  if (!month) return y;
  return d ? `${month} ${Number(d)}, ${y}` : `${month} ${y}`;
}

function rowLabel(inc: BombingIncident): string {
  const place = inc.address ? `${inc.target}, ${inc.address}` : inc.target;
  return `Bombing record, ${dateLong(inc)}, ${place}`;
}

/* ---------------- constants ---------------- */

const FIRED_KEY = "bombing-map-drawn";
const DRAW_STEP_MS = 180;
const COMPLETE_DWELL_MS = 15000;
const HIT_R = 30; // invisible tap halo around each mark, in stage units
const CAPTION_TAIL = "recorded bombings fell inside this square";

interface Mark {
  incident: BombingIncident;
  x: number;
  y: number;
  binga: boolean;
}

export default function BombingMap() {
  const api = useInteractive();
  const bombings = useBombings();
  const holc = useHolcFrames();
  const layers = useFrameLayers();
  const doc = bombings.data;

  const [drawn, setDrawn] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const startedRef = useRef(false);
  const drawDoneRef = useRef(false);
  const cardOpenedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dwellRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- derived geometry ---- */

  const marks = useMemo<Mark[]>(() => {
    const out: Mark[] = [];
    for (const inc of doc?.incidents ?? []) {
      const f = inc.geo?.frame;
      const fx = typeof f?.x === "number" ? f.x : Array.isArray(f?.citywide) ? f.citywide[0] : null;
      const fy = typeof f?.y === "number" ? f.y : Array.isArray(f?.citywide) ? f.citywide[1] : null;
      if (fx == null || fy == null) continue;
      const [x, y] = toView(fx, fy);
      out.push({ incident: inc, x, y, binga: inc.id.includes("binga") });
    }
    return out;
  }, [doc]);

  const noGeo = useMemo(
    () => (doc?.incidents ?? []).filter((inc) => {
      const f = inc.geo?.frame;
      const fx = typeof f?.x === "number" ? f.x : Array.isArray(f?.citywide) ? f.citywide[0] : null;
      return fx == null;
    }),
    [doc]
  );

  const cityFrame: MapFrame | null = doc?.citywideFrame ?? holc.data?.frames?.citywide ?? null;

  const square = useMemo(() => {
    if (!cityFrame) return null;
    const proj = makeFrameProjector(cityFrame);
    const nw = proj.project(SQUARE_GEO.northLat, SQUARE_GEO.westLng);
    const se = proj.project(SQUARE_GEO.southLat, SQUARE_GEO.eastLng);
    const [x1, y1] = toView(nw[0], nw[1]);
    const [x2, y2] = toView(se[0], se[1]);
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }, [cityFrame]);

  const hydePark = useMemo(() => {
    const boundary = layers.data?.boundary;
    if (!boundary || !cityFrame) return null;
    const from = layers.data?.frame ?? holc.data?.frames?.hydePark;
    if (!from) return null;
    const re = makeFrameReprojector(from, cityFrame);
    const rings = asRings(boundary).map((ring) =>
      ring.map((pt) => {
        const [cx, cy] = re(pt);
        return toView(cx, cy);
      })
    );
    let d = "";
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (const ring of rings) {
      if (ring.length < 3) continue;
      d += `M${ring[0][0].toFixed(1)} ${ring[0][1].toFixed(1)}`;
      for (let i = 1; i < ring.length; i++) {
        d += `L${ring[i][0].toFixed(1)} ${ring[i][1].toFixed(1)}`;
        sx += ring[i][0];
        sy += ring[i][1];
        n++;
      }
      d += "Z";
    }
    if (!d || !n) return null;
    return { d, cx: sx / n, cy: sy / n };
  }, [layers.data, holc.data, cityFrame]);

  const selected = useMemo(
    () => (doc?.incidents ?? []).find((inc) => inc.id === selectedId) ?? null,
    [doc, selectedId]
  );

  /* ---- completion plumbing ---- */

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    api.onComplete();
  }, [api]);

  const finishDraw = useCallback(() => {
    if (drawDoneRef.current) return;
    drawDoneRef.current = true;
    if (!api.firedOnce(FIRED_KEY)) api.markFired(FIRED_KEY);
    if (cardOpenedRef.current) complete();
    else if (!dwellRef.current) dwellRef.current = setTimeout(complete, COMPLETE_DWELL_MS);
  }, [api, complete]);

  /* the record draws itself once the tour halts here (or in Explore).
     Silent ink dots, one per attack, in the record's order; a visitor
     who prefers reduced motion, or who has already seen the sequence,
     gets the complete record at once. No tweens either way. */
  useEffect(() => {
    if (!api.active || !doc || startedRef.current) return;
    startedRef.current = true;
    const n = marks.length;
    if (n === 0) {
      finishDraw();
      return;
    }
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const instant = prefersReduced || api.firedOnce(FIRED_KEY);
    let i = instant ? n - 1 : 0;
    intervalRef.current = setInterval(() => {
      i += 1;
      setDrawn(i);
      if (i >= n) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        finishDraw();
      }
    }, instant ? 0 : motionMs(DRAW_STEP_MS));
  }, [api, doc, marks, finishDraw]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (dwellRef.current) clearTimeout(dwellRef.current);
    };
  }, []);

  const openIncident = useCallback(
    (id: string) => {
      api.onInteraction();
      setSelectedId(id);
      cardOpenedRef.current = true;
      if (drawDoneRef.current) complete();
    },
    [api, complete]
  );

  const closeCard = useCallback(() => {
    api.onInteraction();
    setSelectedId(null);
  }, [api]);

  /* ---- caption values come from the fact registry, never literals ---- */
  const squareCount = hasFact("bombings.square_32") ? getFact("bombings.square_32").value : null;
  const totalCount = hasFact("bombings.total_58") ? getFact("bombings.total_58").value : null;

  /* ---- resilient path: the dataset is not there ---- */
  if (bombings.done && !doc) {
    return (
      <button
        type="button"
        onClick={() => {
          api.onInteraction();
          complete();
        }}
        aria-label="Continue the tour"
        className="block w-full cursor-pointer"
        data-testid="bombing-marks"
        data-count="0"
      >
        <div className="border border-exh-ink/25 bg-exh-linen-deep/40 px-6 py-12 text-center">
          <p className="exh-plat text-xs uppercase tracking-[0.25em] text-exh-ink/60">
            The evidence is being prepared
          </p>
          <p className="exh-plat mt-3 text-[10px] uppercase tracking-[0.2em] text-exh-ink/45">
            Tap to continue
          </p>
        </div>
      </button>
    );
  }

  const squareStreets = doc?.aggregates?.square;
  const arrests = doc?.aggregates?.arrests;

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          The 1922 commission record, mapped
        </p>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5" data-testid="bombing-counts">
          <FactValue id="bombings.total_58" size="sm" />
          <FactValue id="bombings.deaths_2" size="sm" />
          {typeof arrests === "number" && doc?.source && (
            <span className="inline-flex items-baseline gap-x-1.5">
              <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
                arrests
              </span>
              <span className="exh-mono text-xs font-medium text-exh-ink">{arrests}</span>
              <SourceSup
                source={{
                  title: doc.source.title ?? "The Negro in Chicago",
                  author: doc.source.author,
                  year: doc.source.year,
                  url: doc.source.url,
                }}
              />
            </span>
          )}
          <FactValue id="bombings.convictions_0" size="sm" />
        </div>
      </div>

      <MapStage frame="citywide" showBase={false} showPlaceholder={!doc}>
        {/* dimmed HOLC ground: quiet near-monochrome, not the loud grades */}
        <g transform={`translate(${-WINDOW.x * S} ${-WINDOW.y * S}) scale(${S})`}>
          <g opacity={0.25} style={{ filter: "saturate(0.3)" }}>
            <HolcLayer frame="citywide" />
          </g>
        </g>

        {/* open water reads as plat paper; the label keeps the geography honest */}
        <text
          x={2210}
          y={560}
          className="exh-plat"
          fontSize={30}
          letterSpacing={6}
          textAnchor="middle"
          style={{ fill: "var(--color-exh-ink-soft)" }}
          fillOpacity={0.45}
        >
          LAKE MICHIGAN
        </text>

        {hydePark && (
          <g>
            <path
              d={hydePark.d}
              fill="none"
              style={{ stroke: "var(--color-exh-ink)" }}
              strokeOpacity={0.55}
              strokeWidth={1.5}
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={hydePark.cx}
              y={hydePark.cy}
              className="exh-plat"
              fontSize={26}
              letterSpacing={4}
              textAnchor="middle"
              style={{ fill: "var(--color-exh-ink-soft)" }}
              fillOpacity={0.6}
            >
              HYDE PARK
            </text>
          </g>
        )}

        {/* the commission's square. The one red mark in this room. */}
        {square && (
          <g data-testid="bombing-square">
            <rect
              x={square.x}
              y={square.y}
              width={square.w}
              height={square.h}
              fill="none"
              style={{ stroke: "var(--color-exh-red)" }}
              strokeOpacity={0.9}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {squareStreets?.north && (
              <text
                x={square.x + square.w / 2}
                y={square.y - 12}
                className="exh-plat"
                fontSize={22}
                letterSpacing={2}
                textAnchor="middle"
                style={{ fill: "var(--color-exh-ink-soft)" }}
                fillOpacity={0.75}
              >
                {squareStreets.north.toUpperCase()}
              </text>
            )}
            {squareStreets?.south && (
              <text
                x={square.x + square.w / 2}
                y={square.y + square.h + 26}
                className="exh-plat"
                fontSize={22}
                letterSpacing={2}
                textAnchor="middle"
                style={{ fill: "var(--color-exh-ink-soft)" }}
                fillOpacity={0.75}
              >
                {squareStreets.south.toUpperCase()}
              </text>
            )}
            {squareStreets?.west && (
              <text
                x={square.x - 12}
                y={square.y + square.h / 2}
                className="exh-plat"
                fontSize={22}
                letterSpacing={2}
                textAnchor="middle"
                transform={`rotate(-90 ${square.x - 12} ${square.y + square.h / 2})`}
                style={{ fill: "var(--color-exh-ink-soft)" }}
                fillOpacity={0.75}
              >
                {squareStreets.west.toUpperCase()}
              </text>
            )}
            {squareStreets?.east && (
              <text
                x={square.x + square.w + 12}
                y={square.y + square.h / 2}
                className="exh-plat"
                fontSize={22}
                letterSpacing={2}
                textAnchor="middle"
                transform={`rotate(90 ${square.x + square.w + 12} ${square.y + square.h / 2})`}
                style={{ fill: "var(--color-exh-ink-soft)" }}
                fillOpacity={0.75}
              >
                {squareStreets.east.toUpperCase()}
              </text>
            )}
          </g>
        )}

        {/* the evidence pins: silent ink, one per recorded attack */}
        <g data-testid="bombing-marks" data-count={String(Math.min(drawn, marks.length))}>
          {marks.slice(0, drawn).map((m) => {
            const isSelected = selectedId === m.incident.id;
            const isFocused = focusedId === m.incident.id;
            return (
              <g
                key={m.incident.id}
                role="button"
                tabIndex={0}
                aria-label={rowLabel(m.incident)}
                data-incident={m.incident.id}
                onClick={() => openIncident(m.incident.id)}
                onKeyDown={(e: KeyboardEvent<SVGGElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openIncident(m.incident.id);
                  }
                }}
                onFocus={() => setFocusedId(m.incident.id)}
                onBlur={() => setFocusedId((cur) => (cur === m.incident.id ? null : cur))}
                className="cursor-pointer"
              >
                <circle cx={m.x} cy={m.y} r={HIT_R} fill="transparent" />
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={m.binga ? 18 : 12}
                  fill="none"
                  style={{ stroke: "var(--color-exh-ink)" }}
                  strokeOpacity={0.8}
                  strokeWidth={0.9}
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={7}
                  style={{ fill: "var(--color-exh-ink)" }}
                  fillOpacity={0.92}
                />
                {isSelected && (
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={26}
                    fill="none"
                    style={{ stroke: "var(--color-exh-ink)" }}
                    strokeOpacity={0.9}
                    strokeWidth={1.6}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {isFocused && !isSelected && (
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={26}
                    fill="none"
                    style={{ stroke: "var(--color-exh-blue)" }}
                    strokeOpacity={0.9}
                    strokeWidth={1.4}
                    strokeDasharray="4 3"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}
        </g>
      </MapStage>

      {squareCount != null && totalCount != null && (
        <p
          data-stat=""
          data-fact-id="bombings.square_32"
          className="mt-2 font-display text-sm leading-snug text-exh-ink"
        >
          {`${squareCount} of the ${totalCount} ${CAPTION_TAIL}`}
          <SourceSup factId="bombings.square_32" />
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2 md:items-start">
        <div>
          {marks.length > 0 && (
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              {`The docket, ${marks.length} records plotted`}
            </p>
          )}
          <ul className="mt-2 max-h-72 divide-y divide-exh-ink/10 overflow-y-auto border border-exh-ink/20 bg-exh-linen-deep/30">
            {marks.map((m) => (
              <li key={m.incident.id}>
                <button
                  type="button"
                  onClick={() => openIncident(m.incident.id)}
                  aria-pressed={selectedId === m.incident.id}
                  aria-label={rowLabel(m.incident)}
                  className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-exh-linen-deep/70 ${
                    selectedId === m.incident.id ? "bg-exh-linen-deep" : ""
                  }`}
                >
                  <span className="exh-mono w-24 shrink-0 text-[11px] text-exh-ink/75">
                    {dateShort(m.incident)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-exh-ink">
                    {m.incident.address
                      ? `${m.incident.target}, ${m.incident.address}`
                      : m.incident.target}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {noGeo.length > 0 && (
            <details className="mt-2 border border-exh-ink/20 bg-exh-linen-deep/30">
              <summary className="exh-plat flex min-h-12 cursor-pointer items-center px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                {`Recorded without an address (${noGeo.length})`}
              </summary>
              <ul className="divide-y divide-exh-ink/10 border-t border-exh-ink/15">
                {noGeo.map((inc) => (
                  <li key={inc.id}>
                    <button
                      type="button"
                      onClick={() => openIncident(inc.id)}
                      aria-pressed={selectedId === inc.id}
                      aria-label={rowLabel(inc)}
                      className={`flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-exh-linen-deep/70 ${
                        selectedId === inc.id ? "bg-exh-linen-deep" : ""
                      }`}
                    >
                      <span className="exh-mono w-24 shrink-0 text-[11px] text-exh-ink/75">
                        {dateShort(inc)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs text-exh-ink">
                        {inc.target}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>

        {selected ? (
          <PaperCard
            className="p-4"
            role="region"
            aria-label={`Evidence record, ${dateLong(selected)}`}
            data-testid="bombing-card"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="exh-mono text-sm font-medium text-exh-ink">{dateLong(selected)}</p>
              <button
                type="button"
                onClick={closeCard}
                aria-label="Close the record"
                className="-mr-2 -mt-2 flex h-12 w-12 items-center justify-center text-exh-ink-soft hover:text-exh-ink"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <p className="font-display text-base leading-snug text-exh-ink">{selected.target}</p>
            {selected.address && (
              <p className="exh-mono mt-0.5 text-xs text-exh-ink/70">{selected.address}</p>
            )}
            <div className="mt-3 border-l-2 border-exh-ink/25 pl-3">
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                from the 1922 record
              </p>
              <p className="mt-1.5 font-display text-sm italic leading-relaxed text-exh-ink">
                {selected.excerpt}
              </p>
            </div>
            <p className="exh-plat mt-3 text-[10px] leading-snug text-exh-ink/55">
              {selected.locator}
            </p>
            <p className="exh-plat mt-1 text-[10px] leading-snug text-exh-ink/55">
              {selected.geo?.precisionMeters
                ? `Plotted to the ${selected.precision === "block" ? "block" : "address"}, within about ${selected.geo.precisionMeters} meters`
                : "No street address appears in the record"}
            </p>
            {selected.id.includes("binga") && (
              <div className="mt-3 border-t border-exh-ink/15 pt-3">
                <VoiceCard personId="jesse-binga" size="sm" />
              </div>
            )}
          </PaperCard>
        ) : (
          <div className="flex min-h-24 items-center justify-center border border-dashed border-exh-ink/30 px-4 py-6">
            <p className="exh-plat text-center text-[11px] uppercase tracking-[0.2em] text-exh-ink/50">
              Select a mark or a docket entry to read the record
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
