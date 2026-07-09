"use client";
/* ------------------------------------------------------------------ */
/*  Read the Deed, the CH5 flagship pause point. A restrictive         */
/*  covenant read the way a buyer read it. We do not yet hold a scan   */
/*  of a Chicago covenant, so this is the deed ANNOTATED, never a      */
/*  fake facsimile: three plain-language clause rows the visitor       */
/*  expands, a signature-block tap zone that opens the 1928 chain      */
/*  armor beat, and below it a hydePark map where the covenant         */
/*  template tiles outward block by block (labeled illustration,      */
/*  sparing parks and lake). Completes when all three clauses have     */
/*  been expanded.                                                     */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeRng, motionMs } from "@/lib/exhibit/debug";
import type { RingPoints } from "@/lib/exhibit/map/projection";
import { useFrameLayers } from "@/lib/exhibit/map/useExhibitMapData";
import MapStage, { VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import FactValue from "../../shared/FactValue";

interface ClauseDef {
  id: string;
  kicker: string;
  summary: string;
  detail: string;
  factId: string;
}

const CLAUSES: ClauseDef[] = [
  {
    id: "barred",
    kicker: "Who is barred",
    summary: "The clause barred sale or rental to anyone who was not white.",
    detail:
      "One printed form did this work on street after street. The real estate boards distributed a model covenant so any block could adopt the same clause.",
    factId: "covenants.macchesney_template",
  },
  {
    id: "duration",
    kicker: "How long it runs",
    summary:
      "The restriction bound the land itself, carrying to every future owner, typically for decades.",
    detail:
      "Selling the house did not clear it. The clause traveled with the deed, binding buyers who had never signed anything.",
    factId: "covenants.macchesney_template",
  },
  {
    id: "stick",
    kicker: "What made it stick",
    summary:
      "Sign-up campaigns sealed whole blocks at once; a covenant could take force when a set share of frontage signed.",
    detail:
      "A covenant could claim force once owners of a set share of a street's frontage had signed on. When the Hansberry family's lawyers went counting in Washington Park, the signatures fell far short of the share the covenant claimed.",
    factId: "covenants.hansberry_frontage_54pct",
  },
];

/* ---------------- chain mail lattice over the hydePark frame ------- */

const TILE_STEP_X = 96;
const TILE_STEP_Y = 48;
const TILE_R = 34;
/** seed block, roughly the university blocks west of the lakefront */
const SEED_X = 980;
const SEED_Y = 760;
const SPREAD_TOTAL_MS = 2200;
const TILE_FADE_MS = 420;

/** even-odd point-in-rings test (handles holes) */
function pointInRings(x: number, y: number, rings: RingPoints[]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/** tolerate the layers file shipping a single ring or a ring list */
function asRingList(geom: RingPoints | RingPoints[] | undefined | null): RingPoints[] {
  if (!geom || !geom.length) return [];
  const first = geom[0] as unknown;
  if (Array.isArray(first) && typeof (first as unknown[])[0] === "number") {
    return [geom as RingPoints];
  }
  return geom as RingPoints[];
}

interface Tile {
  x: number;
  y: number;
  /** 0..1 share of the spread duration before this tile fades in */
  t: number;
}

export default function ReadTheDeed() {
  const api = useInteractive();
  const layers = useFrameLayers().data;

  /** clause ids currently open */
  const [open, setOpen] = useState<string[]>([]);
  /** clause ids ever opened; completion tracks this */
  const [visited, setVisited] = useState<string[]>([]);
  const [chainOpen, setChainOpen] = useState(false);
  const [spread, setSpread] = useState(false);

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  useEffect(() => {
    if (visited.length === CLAUSES.length) complete();
  }, [visited, complete]);

  const toggleClause = (id: string) => {
    api.onInteraction();
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const toggleChain = () => {
    api.onInteraction();
    setChainOpen((v) => !v);
  };

  const startSpread = () => {
    if (spread) return;
    api.onInteraction();
    setSpread(true);
  };

  /* Lattice of interlocking diamond outlines across the residential
     ground, sparing the lake and the parks. Purely illustrative and
     labeled as such; computed once per layers load. */
  const tiles = useMemo<Tile[]>(() => {
    const lakeRings = asRingList(layers?.lake);
    const parkRings = (layers?.parks ?? []).map((p) => p.ring).filter((r) => r?.length >= 3);
    const rng = makeRng();
    const raw: { x: number; y: number; d: number; j: number }[] = [];
    let row = 0;
    for (let y = 40; y <= VIEW_H - 28; y += TILE_STEP_Y, row++) {
      const offset = row % 2 === 1 ? TILE_STEP_X / 2 : 0;
      for (let x = 48 + offset; x <= VIEW_W - 40; x += TILE_STEP_X) {
        if (lakeRings.length && pointInRings(x, y, lakeRings)) continue;
        if (parkRings.some((r) => pointInRings(x, y, [r]))) continue;
        raw.push({ x, y, d: Math.hypot(x - SEED_X, y - SEED_Y), j: rng() });
      }
    }
    let maxD = 1;
    for (const t of raw) if (t.d > maxD) maxD = t.d;
    return raw.map(({ x, y, d, j }) => ({ x, y, t: (d / maxD) * 0.85 + j * 0.15 }));
  }, [layers]);

  const spreadTotal = motionMs(SPREAD_TOTAL_MS);
  const expandedCount = visited.length;
  const allExpanded = expandedCount === CLAUSES.length;

  return (
    <div className="w-full">
      {/* ---------------- the deed, annotated ---------------- */}
      <PaperCard className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            <h4 className="exh-serif text-lg leading-snug text-exh-ink sm:text-xl">
              A racially restrictive covenant, standard Chicago form
            </h4>
            <p className="mt-1 text-xs leading-snug text-exh-ink-soft">
              Three clauses, in plain language. Tap each one to read what it did.
            </p>
          </div>
          <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-snug tracking-[0.15em] text-exh-ink-soft">
            described from the record; facsimile pending archival scan
          </span>
        </div>

        <div data-testid="deed-clauses" data-expanded={expandedCount} className="mt-4 space-y-2">
          {CLAUSES.map((clause, i) => {
            const isOpen = open.includes(clause.id);
            const seen = visited.includes(clause.id);
            return (
              <div key={clause.id} className="rounded-sm border border-exh-ink/20 bg-exh-linen-deep/40">
                <button
                  type="button"
                  data-testid={`deed-clause-${clause.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`deed-clause-panel-${clause.id}`}
                  onClick={() => toggleClause(clause.id)}
                  className="flex min-h-12 w-full items-baseline gap-3 px-3 py-2.5 text-left"
                >
                  <span className="exh-mono shrink-0 text-xs text-exh-ink/70">{i + 1}.</span>
                  <span className="min-w-0 flex-1">
                    <span className="exh-plat block text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                      {clause.kicker}
                    </span>
                    <span className="exh-serif mt-0.5 block text-sm leading-snug text-exh-ink sm:text-base">
                      {clause.summary}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`exh-mono shrink-0 self-center text-sm ${seen ? "text-exh-ink" : "text-exh-ink/70"}`}
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`deed-clause-panel-${clause.id}`}
                    className={`border-t border-exh-ink/15 px-3 py-3 pl-9 ${api.reducedMotion ? "" : "exh-ledger-in"}`}
                  >
                    <p className="text-sm leading-snug text-exh-ink-soft">{clause.detail}</p>
                    <div className="mt-2">
                      <FactValue id={clause.factId} size="sm" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---------------- the signature block tap zone ---------------- */}
        <div className="mt-3 rounded-sm border border-exh-ink/20 bg-exh-linen-deep/40">
          <button
            type="button"
            data-testid="deed-signatures"
            aria-expanded={chainOpen}
            aria-controls="deed-chain-panel"
            onClick={toggleChain}
            className="flex min-h-12 w-full items-center gap-3 px-3 py-2.5 text-left"
          >
            <svg
              viewBox="0 0 96 44"
              aria-hidden="true"
              className="h-10 w-20 shrink-0 text-exh-ink/70"
            >
              {[0, 1, 2].map((row) => (
                <g key={row} transform={`translate(0 ${6 + row * 14})`}>
                  <path
                    d={`M4 8 q7 ${row % 2 ? -7 : -5} 14 -1 t 16 -1 t 14 2`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                  />
                  <line x1={2} y1={10.5} x2={92} y2={10.5} stroke="currentColor" strokeWidth={0.8} strokeOpacity={0.6} />
                </g>
              ))}
            </svg>
            <span className="min-w-0 flex-1">
              <span className="exh-plat block text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                The signature block
              </span>
              <span className="exh-serif mt-0.5 block text-sm leading-snug text-exh-ink sm:text-base">
                Your neighbors signed this about you.
              </span>
            </span>
            <span aria-hidden="true" className="exh-mono shrink-0 self-center text-sm text-exh-ink/70">
              {chainOpen ? "−" : "+"}
            </span>
          </button>
          {chainOpen && (
            <div
              id="deed-chain-panel"
              data-testid="deed-chain-quote"
              className={`border-t border-exh-ink/15 px-3 py-3 ${api.reducedMotion ? "" : "exh-ledger-in"}`}
            >
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                as the period press told it
              </p>
              {/* characterization, not quotation: the famous armor phrasing is
                  displayed without quote marks until the archival clipping is
                  on file (C2 fact-lens correction) */}
              <p className="exh-serif mt-1.5 text-base leading-snug text-exh-ink sm:text-lg">
                The neighborhood press praised the covenants as a chain of armor laced around the
                blocks.
              </p>
              <div className="mt-1.5">
                <FactValue id="covenants.chain_armor_quote" size="sm" />
              </div>
              <p className="mt-3 text-sm leading-snug text-exh-ink-soft">
                The university was not a bystander.
              </p>
              <div className="mt-1">
                <FactValue id="covenants.uchicago_defense_83597" size="sm" />
              </div>
            </div>
          )}
        </div>

        {allExpanded && (
          <p
            data-testid="deed-endline"
            className={`exh-serif mt-4 text-base leading-snug text-exh-ink sm:text-lg ${api.reducedMotion ? "" : "exh-ledger-in"}`}
          >
            Terror needs bombers. Paper only needs signatures.
          </p>
        )}
      </PaperCard>

      {/* ---------------- the chain mail spread ---------------- */}
      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <button
            type="button"
            data-testid="deed-spread-button"
            onClick={startSpread}
            disabled={spread}
            className={`exh-plat min-h-12 rounded-sm border px-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
              spread
                ? "border-exh-ink/25 text-exh-ink/70"
                : "cursor-pointer border-exh-ink bg-exh-linen text-exh-ink hover:bg-exh-linen-deep"
            }`}
          >
            {spread ? "The template spread" : "Spread the template"}
          </button>
          <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-1 text-[9px] uppercase leading-none tracking-[0.15em] text-exh-ink-soft">
            illustration of the mechanism, not a parcel map
          </span>
        </div>

        <MapStage frame="hydePark" showPlaceholder={!layers && !spread}>
          <g data-testid="deed-spread-tiles" data-tiles={spread ? tiles.length : 0}>
            {tiles.map((tile, i) => (
              <path
                key={i}
                d={`M${tile.x} ${tile.y - TILE_R} L${tile.x + TILE_R} ${tile.y} L${tile.x} ${tile.y + TILE_R} L${tile.x - TILE_R} ${tile.y} Z`}
                fill="none"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                opacity={spread ? 1 : 0}
                style={{
                  stroke: "var(--color-exh-ink)",
                  strokeOpacity: 0.3,
                  transition: api.reducedMotion
                    ? "none"
                    : `opacity ${motionMs(TILE_FADE_MS)}ms ease ${Math.round(tile.t * spreadTotal)}ms`,
                }}
              />
            ))}
          </g>
        </MapStage>

        {spread && (
          <div className={`mt-2 ${api.reducedMotion ? "" : "exh-ledger-in"}`}>
            <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
              block by block, by signature
            </p>
            <div className="mt-1">
              <FactValue id="covenants.coverage_claim" size="sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
