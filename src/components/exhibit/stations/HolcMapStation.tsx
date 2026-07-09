"use client";
/* ------------------------------------------------------------------ */
/*  The HOLC map station, used in ch0 and again in ch6 (framing        */
/*  prop). The real citywide 1940 map; click or tab to any graded      */
/*  area and its real surveyor sheet opens (verbatim excerpt from      */
/*  holc-descriptions.json behind the period-language chip). The       */
/*  hold-to-look loans overlay from the old Lens survives as a         */
/*  labeled control. No stamp game, no tap counter, no completion.     */
/* ------------------------------------------------------------------ */
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { useHolcFrames, type HolcArea } from "@/lib/exhibit/map/useExhibitMapData";
import MapStage, { VIEW_H, VIEW_W } from "@/components/exhibit/map/MapStage";
import HolcLayer from "@/components/exhibit/map/layers/HolcLayer";
import { useInteractive } from "../interactives/InteractiveContext";
import PaperCard from "../shared/PaperCard";
import FactValue from "../shared/FactValue";

/* ------- runtime-fetched surveyor descriptions, module cached ------- */

const DESCRIPTIONS_URL = "/exhibit-data/holc-descriptions.json";

interface DescArea {
  areaId: number | string;
  grade: string;
  name?: string | null;
  excerpt: string;
  excerptField?: string;
  excerptLabel?: string;
}

interface DescDoc {
  attribution?: string;
  areas: DescArea[];
}

interface DescCache {
  promise: Promise<void>;
  data: DescDoc | null;
  error: string | null;
  done: boolean;
}

let descCache: DescCache | null = null;

function loadDescriptions(): DescCache {
  if (descCache) return descCache;
  const entry: DescCache = { promise: Promise.resolve(), data: null, error: null, done: false };
  entry.promise = fetch(DESCRIPTIONS_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${DESCRIPTIONS_URL}`);
      return res.json();
    })
    .then((json) => {
      entry.data = json as DescDoc;
    })
    .catch((err: unknown) => {
      entry.error = err instanceof Error ? err.message : String(err);
    })
    .finally(() => {
      entry.done = true;
    });
  descCache = entry;
  return entry;
}

function useHolcDescriptions(): { data: DescDoc | null; done: boolean } {
  const [state, setState] = useState<{ data: DescDoc | null; done: boolean }>(() => {
    if (typeof window !== "undefined" && descCache?.done) {
      return { data: descCache.data, done: true };
    }
    return { data: null, done: false };
  });
  useEffect(() => {
    let alive = true;
    const entry = loadDescriptions();
    const publish = () => {
      if (alive) setState({ data: entry.data, done: true });
    };
    if (entry.done) publish();
    else entry.promise.then(publish);
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/* ---------------- grade rendering ---------------- */

/** excerpts this short are digitization junk ("N/A"), not surveyor prose */
const MIN_EXCERPT_CHARS = 12;

const GRADE_WORD: Record<string, string> = {
  A: "Grade A",
  B: "Grade B",
  C: "Grade C",
  D: "Grade D",
};

/** small legend swatch matching the stage's grade encoding */
function GradeSwatch({ grade }: { grade: string }) {
  const size = 18;
  let tint = "var(--color-exh-ink)";
  let tintOpacity = 0.1;
  let marks: ReactNode = null;
  if (grade === "A") {
    tint = "#7A8B6F";
    tintOpacity = 0.25;
    marks = (
      <>
        <circle cx={5} cy={5} r={1.8} fill="#7A8B6F" fillOpacity={0.6} />
        <circle cx={13} cy={13} r={1.8} fill="#7A8B6F" fillOpacity={0.6} />
      </>
    );
  } else if (grade === "B") {
    tint = "var(--color-exh-blue)";
    tintOpacity = 0.25;
    marks = (
      <g stroke="var(--color-exh-blue)" strokeOpacity={0.55} strokeWidth={1.4}>
        <line x1={-4} y1={10} x2={10} y2={-4} />
        <line x1={4} y1={20} x2={20} y2={4} />
      </g>
    );
  } else if (grade === "C") {
    tint = "var(--color-exh-gold)";
    tintOpacity = 0.25;
    marks = (
      <g stroke="var(--color-exh-gold)" strokeOpacity={0.55} strokeWidth={1.4}>
        <line x1={-4} y1={10} x2={10} y2={-4} />
        <line x1={4} y1={20} x2={20} y2={4} />
        <line x1={8} y1={-4} x2={22} y2={10} />
        <line x1={-4} y1={8} x2={10} y2={22} />
      </g>
    );
  } else if (grade === "D") {
    tint = "var(--color-exh-red)";
    tintOpacity = 0.3;
    marks = (
      <g stroke="var(--color-exh-red)" strokeOpacity={0.6} strokeWidth={1.8}>
        <line x1={-4} y1={4} x2={14} y2={22} />
        <line x1={0} y1={-2} x2={20} y2={18} />
        <line x1={6} y1={-4} x2={24} y2={14} />
      </g>
    );
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0 rounded-[2px] border border-exh-ink/40"
    >
      <rect width={size} height={size} fill={tint} fillOpacity={tintOpacity} />
      {marks}
    </svg>
  );
}

/* ---------------- framing copy ---------------- */

export type HolcMapFraming = "ch0" | "ch6";

const FRAMING_COPY: Record<
  HolcMapFraming,
  { lead: string; holdCaption: string }
> = {
  ch0: {
    lead: "Click or tab to any graded area. The sheet the surveyors filed for it opens below.",
    holdCaption:
      "Nothing lights. Every Black neighborhood was graded hazardous or declining.",
  },
  ch6: {
    lead: "The same map, read again now that you know who drew it. Open any area's sheet.",
    holdCaption:
      "Nothing lights. Every Black neighborhood was graded hazardous or declining.",
  },
};

export interface HolcMapStationProps {
  framing?: HolcMapFraming;
}

export default function HolcMapStation({ framing = "ch0" }: HolcMapStationProps) {
  const api = useInteractive();
  const holcState = useHolcFrames();
  const holc = holcState.data;
  const desc = useHolcDescriptions();
  const copy = FRAMING_COPY[framing];

  const [selected, setSelected] = useState<HolcArea | null>(null);
  const [holdOn, setHoldOn] = useState(false);
  const [toggledOnce, setToggledOnce] = useState(false);

  const mapReady = (holc?.areas?.length ?? 0) > 0;

  const descById = useMemo(() => {
    const m = new Map<string, DescArea>();
    for (const a of desc.data?.areas ?? []) m.set(String(a.areaId), a);
    return m;
  }, [desc.data]);

  const selDesc = selected ? descById.get(String(selected.id)) : undefined;
  const excerptUsable = Boolean(
    selDesc && selDesc.excerpt.trim().length >= MIN_EXCERPT_CHARS && selDesc.excerpt.trim() !== "N/A"
  );

  const onAreaTap = (area: HolcArea) => {
    api.onInteraction();
    setSelected(area);
  };

  /* ---------------- the hold-to-look control ---------------- */

  const holdStart = () => {
    api.onInteraction();
    setHoldOn(true);
    setToggledOnce(true);
  };
  const holdEnd = () => setHoldOn(false);
  const onHoldKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      holdStart();
    }
  };
  const onHoldKeyUp = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      holdEnd();
    }
  };

  const grade = selected && GRADE_WORD[selected.grade] ? selected.grade : null;
  const areaName =
    (selDesc?.name && selDesc.name.trim() !== "N/A" && selDesc.name.trim().length > 2
      ? selDesc.name.trim()
      : null) ??
    (selected?.name ? String(selected.name) : null);

  return (
    <div
      className="w-full"
      data-testid="holc-map-station"
      data-framing={framing}
      data-selected={selected ? String(selected.label ?? selected.id) : "none"}
    >
      <p className="exh-plat mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        {copy.lead}
      </p>

      <MapStage frame="citywide" showPlaceholder={!mapReady}>
        {mapReady && (
          <HolcLayer frame="citywide" interactive dimUngraded onAreaTap={onAreaTap} />
        )}
        {/* the darkness: what remains when only lendable areas stay lit */}
        <rect
          x={0}
          y={0}
          width={VIEW_W}
          height={VIEW_H}
          pointerEvents="none"
          style={{
            fill: "var(--color-exh-ink)",
            opacity: holdOn ? 0.93 : 0,
            transition: api.reducedMotion ? "none" : `opacity ${motionMs(320)}ms ease`,
          }}
        />
      </MapStage>

      {/* ---------------- the surveyor sheet ---------------- */}
      <PaperCard
        data-testid="holc-map-readout"
        className="mt-3 w-full p-4"
        aria-live="polite"
      >
        {!selected && (
          <p className="text-sm leading-snug text-exh-ink-soft">
            {mapReady
              ? "No area is open. Click or tab to a graded area to read its file."
              : "Map data is being prepared. The sheets open once it loads."}
          </p>
        )}
        {selected && (
          <div>
            <div className="flex items-center gap-2">
              {grade && <GradeSwatch grade={grade} />}
              <span
                className={`exh-plat text-sm font-bold uppercase tracking-[0.18em] ${
                  grade === "D" ? "text-exh-red" : "text-exh-ink"
                }`}
              >
                {grade ? GRADE_WORD[grade] : "Ungraded"}
              </span>
              <span className="exh-mono ml-auto text-xs text-exh-ink/70">
                {String(selected.label ?? selected.id)}
              </span>
            </div>
            {areaName && (
              <p className="exh-serif mt-1.5 text-base leading-snug text-exh-ink">{areaName}</p>
            )}

            <div className="mt-3 border-t border-exh-ink/15 pt-3">
              {excerptUsable && selDesc ? (
                <div>
                  <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                    from the 1939 to 1940 survey record
                  </p>
                  <span className="exh-plat mt-1 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
                    period document; contains the era&rsquo;s racist language
                  </span>
                  {selDesc.excerptLabel && (
                    <p className="exh-mono mt-2 text-[10px] text-exh-ink/60">{selDesc.excerptLabel}</p>
                  )}
                  <blockquote className="exh-serif mt-1 text-sm leading-snug text-exh-ink italic">
                    &ldquo;{selDesc.excerpt.trim()}&rdquo;
                  </blockquote>
                </div>
              ) : (
                <p className="text-sm leading-snug text-exh-ink-soft">
                  {desc.done
                    ? "No surveyor sheet survives in the digitized record for this area."
                    : "Reading the survey record."}
                </p>
              )}
            </div>
          </div>
        )}
      </PaperCard>

      {/* ---------------- the hold-to-look control ---------------- */}
      <div className="mt-4">
        <button
          type="button"
          data-testid="holc-map-hold"
          aria-pressed={holdOn}
          onPointerDown={holdStart}
          onPointerUp={holdEnd}
          onPointerLeave={holdEnd}
          onPointerCancel={holdEnd}
          onKeyDown={onHoldKeyDown}
          onKeyUp={onHoldKeyUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-sm border px-4 py-2 text-left transition-colors ${
            holdOn ? "border-exh-ink bg-exh-ink/90" : "border-exh-ink/40 bg-exh-linen-deep/50"
          }`}
          style={{ touchAction: "none" }}
        >
          <span
            className={`exh-plat text-xs font-semibold uppercase tracking-[0.18em] ${
              holdOn ? "text-exh-linen" : "text-exh-ink"
            }`}
          >
            Show me where a Black family could get a federally backed loan
          </span>
          <span
            className={`exh-plat shrink-0 text-[10px] uppercase tracking-[0.15em] ${
              holdOn ? "text-exh-linen/80" : "text-exh-ink-soft"
            }`}
          >
            {holdOn ? "looking" : "press and hold"}
          </span>
        </button>

        {toggledOnce && (
          <div
            data-testid="holc-map-hold-caption"
            className={`mt-2 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/60 p-4 ${
              api.reducedMotion ? "" : "exh-ledger-in"
            } ${holdOn ? "" : "opacity-90"}`}
          >
            <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">
              {copy.holdCaption}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              <FactValue id="redlining.holc_survey_chicago" size="sm" />
              <FactValue id="redlining.black_loans_under_2pct" size="sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
