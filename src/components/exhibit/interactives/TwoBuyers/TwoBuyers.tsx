"use client";
/* ------------------------------------------------------------------ */
/*  Two Buyers, One House, the CH9 pause point. One shared years       */
/*  slider drives two columns on the same desk. The conventional       */
/*  buyer's share of the house grows with every payment; the contract  */
/*  buyer's money climbs past a fair price while the owned share       */
/*  stays at zero until the last payment. Every figure derives from    */
/*  data/exhibit/models.json through TWO_BUYERS; this file holds no    */
/*  math literals. LIFE HAPPENS fires once per session (firedOnce      */
/*  "twobuyers-eviction"); the eviction is a quiet paper notice with   */
/*  an ink stamp, never a replayable toy. Reduced motion snaps the     */
/*  bars and the notice.                                               */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motionMs } from "@/lib/exhibit/debug";
import { TWO_BUYERS } from "@/lib/exhibit/models";
import { useInteractive } from "../InteractiveContext";
import PaperCard from "../../shared/PaperCard";
import Stamp from "../../shared/Stamp";
import FactValue from "../../shared/FactValue";
import SourceSup from "../../shared/SourceSup";
import VoiceCard from "../../shared/VoiceCard";

const FIRED_KEY = "twobuyers-eviction";

/* Teaching-beat pacing threshold, five simulated years on the slider.
   A dwell heuristic for onComplete, not a study figure. */
const COMPLETION_MONTHS = 60;

/* ---------------- copy (kept out of JSX so apostrophes stay easy) --- */
const FRAMING =
  "Modeled on the documented averages of Chicago's contract-sale decades, in the study's dollars.";
const IDLE_CAPTION = "The same house, sold two ways";
const RELIST_CAPTION = "Back on the market. The next family starts at month zero";
const LEFT_TITLE = "The mortgage buyer";
const LEFT_SUB = "a bank loan, federally insured";
const LEFT_LINE = "Pays the fair price. Owns a growing share of the house from day one.";
const LEFT_BAR_LABEL = "Share of the house owned";
const RIGHT_TITLE = "The contract buyer";
const RIGHT_SUB = "an installment contract, no deed until the end";
const RIGHT_LINE = "Pays more for the same house. The seller keeps the deed until the last payment.";
const RIGHT_COUNTER_LABEL = "Paid beyond a fair price";
const RIGHT_BAR_LABEL = "Share of the house owned";
const TICK_LABEL = "The track runs until the buyer's extra payments reach the study's average, $71,000";

/** the miss-a-payment hint tells the truth at every slider position */
function lifeHint(months: number): string {
  if (months === 0) return "From the very first payment, one miss forfeits everything";
  const yr = Math.floor(months / 12);
  if (yr === 0) return "Even after months of flawless payments, one miss forfeits everything";
  return `Even after ${yr} year${yr === 1 ? "" : "s"} of flawless payments, one miss forfeits everything`;
}
const SOLD_LINE = "Can sell or refinance at any point and walk away with the share built.";
const NOTICE_BODY =
  "One missed payment ends the contract. Everything paid stays with the seller. The family leaves.";
const KEPT_LABEL = "Kept by the seller";
const KEPT_FALLBACK = "every payment made";
const EXIT_LINE =
  "Average loss per contract-buying family, about seventy-one thousand dollars in the study's dollars, across roughly 60,100 homes bought on contract.";
const TAKEAWAY_START = "Both families start today. Drag the years forward.";
const TAKEAWAY_AFTER_MISS =
  "The next family's clock starts at zero. The evicted family's payments stayed with the seller. The mortgage buyer's equity was theirs to keep.";

/** the plain sentence of meaning under the desk, updated by the slider */
function takeaway(yr: number, mo: number, sharePct: string, extraUsd: string): string {
  const time =
    yr === 0 ? (mo === 0 ? "" : `After ${mo} month${mo === 1 ? "" : "s"}, `) : `After ${yr} year${yr === 1 ? "" : "s"}, `;
  const opener = time ? `${time}the` : "The";
  return `${opener} mortgage buyer owns ${sharePct} percent of this house. The contract buyer owns none of it and has paid ${extraUsd} beyond a fair price.`;
}

/* 48px thumb on a hairline track, same recipe as the era slider; the
   notice slide-in is CSS so [data-motion="off"] disables it with no JS */
const TB_CSS = `
.exh-tb-range { appearance: none; -webkit-appearance: none; display: block; width: 100%; height: 56px; background: transparent; cursor: ew-resize; }
.exh-tb-range:focus-visible { outline: 2px solid var(--color-exh-blue); outline-offset: 2px; }
.exh-tb-range::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: color-mix(in oklab, var(--color-exh-ink) 35%, transparent); }
.exh-tb-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -22px; height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: radial-gradient(circle at 35% 30%, var(--color-exh-linen), var(--color-exh-linen-deep)); box-shadow: 0 1px 2px rgba(28, 26, 23, 0.35); }
.exh-tb-range::-moz-range-track { height: 4px; border-radius: 2px; background: color-mix(in oklab, var(--color-exh-ink) 35%, transparent); }
.exh-tb-range::-moz-range-thumb { height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: var(--color-exh-linen); box-shadow: 0 1px 2px rgba(28, 26, 23, 0.35); }
.exh-tb-notice { animation: exhTbNoticeIn 300ms ease-out both; }
@keyframes exhTbNoticeIn { from { opacity: 0; transform: translateY(-14px) rotate(-1deg); } to { opacity: 1; transform: rotate(-1deg); } }
.exhibit-root[data-motion="off"] .exh-tb-notice { animation: none; transform: rotate(-1deg); }
`;

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** percent with at most one decimal, "25" or "50.4" */
function pctLabel(p: number): string {
  const r = Math.round(p * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/* ---------------- the shared rowhouse ------------------------------ */

function HouseSvg({ fired }: { fired: boolean }) {
  const ink = { stroke: "var(--color-exh-ink)" } as const;
  const linen = { fill: "var(--color-exh-linen)", stroke: "var(--color-exh-ink)" } as const;
  return (
    <svg viewBox="0 0 200 130" className="block h-auto w-40 sm:w-44" aria-hidden="true">
      <line x1={14} y1={124} x2={186} y2={124} style={ink} strokeOpacity={0.5} strokeWidth={2} />
      {/* facade and parapet */}
      <rect
        x={52}
        y={36}
        width={96}
        height={88}
        style={{ fill: "var(--color-exh-linen-deep)", stroke: "var(--color-exh-ink)" }}
        strokeWidth={2.5}
      />
      <rect x={46} y={26} width={108} height={10} style={linen} strokeWidth={2.5} />
      {/* string course between floors */}
      <line x1={52} y1={82} x2={148} y2={82} style={ink} strokeOpacity={0.35} strokeWidth={1.5} />
      {/* door */}
      <rect x={88} y={90} width={24} height={34} style={linen} strokeWidth={2} />
      {/* windows, upper then lower */}
      <rect x={62} y={46} width={20} height={26} style={linen} strokeWidth={2} />
      <rect x={118} y={46} width={20} height={26} style={linen} strokeWidth={2} />
      <line x1={72} y1={46} x2={72} y2={72} style={ink} strokeOpacity={0.4} strokeWidth={1} />
      <line x1={128} y1={46} x2={128} y2={72} style={ink} strokeOpacity={0.4} strokeWidth={1} />
      <rect x={62} y={90} width={20} height={24} style={linen} strokeWidth={2} />
      <rect x={118} y={90} width={20} height={24} style={linen} strokeWidth={2} />
      {fired && (
        /* a paper tag pasted on the facade when the house goes back on the market */
        <g transform="rotate(-4 100 66)">
          <rect x={76} y={58} width={48} height={15} style={linen} strokeWidth={1.5} />
          <text
            x={100}
            y={69}
            textAnchor="middle"
            fontSize={9}
            letterSpacing={1.6}
            style={{ fill: "var(--color-exh-ink)", fontFamily: "var(--font-plat)" }}
          >
            RELISTED
          </text>
        </g>
      )}
    </svg>
  );
}

/* ---------------- the interactive ---------------------------------- */

export default function TwoBuyers() {
  const api = useInteractive();
  const sliderId = useId();
  const fired = api.firedOnce(FIRED_KEY);

  const [months, setMonths] = useState(0);
  /* high-water mark; completion and the exit line latch on it */
  const [maxMonths, setMaxMonths] = useState(0);
  /* frozen at the moment LIFE HAPPENS fires; null if fired before mount */
  const [keptUsd, setKeptUsd] = useState<number | null>(null);
  const [soldSharePct, setSoldSharePct] = useState<number | null>(null);

  const extra = TWO_BUYERS.extraPaid(months);
  const sharePct = TWO_BUYERS.conventionalSharePct(months);
  const atCap = months >= TWO_BUYERS.monthsToAverage;
  const exitShown = fired || maxMonths >= TWO_BUYERS.monthsToAverage;

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  useEffect(() => {
    if (maxMonths >= COMPLETION_MONTHS && (fired || maxMonths >= TWO_BUYERS.monthsToAverage)) {
      complete();
    }
  }, [maxMonths, fired, complete]);

  const onSlide = (value: number) => {
    api.onInteraction();
    setMonths(value);
    setMaxMonths((m) => Math.max(m, value));
  };

  const onLife = () => {
    if (fired) return;
    api.onInteraction();
    setKeptUsd(TWO_BUYERS.extraPaid(months));
    setSoldSharePct(TWO_BUYERS.conventionalSharePct(months));
    /* the house relists; the next family starts at month zero */
    setMonths(0);
    api.markFired(FIRED_KEY);
  };

  const yr = Math.floor(months / 12);
  const mo = months % 12;

  const barStyle = {
    width: `${sharePct}%`,
    transition: api.reducedMotion ? "none" : `width ${motionMs(240)}ms ease-out`,
  };

  return (
    <div data-testid="two-buyers" data-month={months} className="w-full">
      <style>{TB_CSS}</style>

      {/* framing label and the caption rail of averages */}
      <p className="text-sm leading-snug text-exh-ink-soft">{FRAMING}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-b border-exh-ink/15 pb-3">
        <FactValue id="contracts.extra_monthly_587" size="sm" />
        <FactValue id="contracts.avg_overpayment_71000" size="sm" />
      </div>

      {/* ---------------- the desk ---------------- */}
      <PaperCard className="mt-4 p-4 sm:p-5">
        {/* the same house, above both buyers */}
        <div className="flex flex-col items-center">
          <HouseSvg fired={fired} />
          <p
            data-testid="twobuyers-relist"
            data-relisted={fired ? "true" : "false"}
            className="mt-1 text-center text-sm text-exh-ink-soft"
          >
            {fired ? RELIST_CAPTION : IDLE_CAPTION}
          </p>
        </div>

        {/* two columns, stacking under 640px */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* LEFT, the buyer the system backed */}
          <section
            aria-label={LEFT_TITLE}
            className="rounded-sm border border-exh-ink/25 bg-exh-linen p-3"
          >
            <h4 className="font-display text-lg leading-snug text-exh-ink">{LEFT_TITLE}</h4>
            <p className="mt-0.5 text-xs text-exh-ink-soft">{LEFT_SUB}</p>
            <p className="mt-2 min-h-10 text-sm leading-snug text-exh-ink">{LEFT_LINE}</p>

            <div className="mt-3">
              <p className="text-xs font-semibold text-exh-ink-soft">{LEFT_BAR_LABEL}</p>
              <div
                data-testid="twobuyers-share"
                data-pct={pctLabel(sharePct)}
                className="mt-1 h-4 w-full overflow-hidden rounded-[2px] border border-exh-ink/45 bg-exh-linen-deep/40"
              >
                <div className="h-full bg-exh-gold" style={barStyle} />
              </div>
              <p className="exh-mono mt-1 text-sm text-exh-ink">{pctLabel(sharePct)}%</p>
            </div>

            {fired && (
              <PaperCard tone="deep" className="exh-ledger-in mt-3 p-3">
                <p className="text-sm leading-snug text-exh-ink">{SOLD_LINE}</p>
                {soldSharePct != null && (
                  <p className="mt-1.5">
                    <span className="text-xs font-semibold text-exh-ink-soft">share at sale </span>
                    <span className="exh-mono text-sm text-exh-ink">
                      {pctLabel(soldSharePct)}%
                    </span>
                  </p>
                )}
              </PaperCard>
            )}
          </section>

          {/* RIGHT, the buyer on contract */}
          <section
            aria-label={RIGHT_TITLE}
            className="rounded-sm border border-exh-ink/25 bg-exh-linen p-3"
          >
            <h4 className="font-display text-lg leading-snug text-exh-ink">{RIGHT_TITLE}</h4>
            <p className="mt-0.5 text-xs text-exh-ink-soft">{RIGHT_SUB}</p>
            <p className="mt-2 min-h-10 text-sm leading-snug text-exh-ink">{RIGHT_LINE}</p>

            {fired && (
              /* the quiet paper notice, laid over the column */
              <PaperCard
                tone="deep"
                data-testid="twobuyers-evicted"
                role="status"
                className="exh-tb-notice mt-3 border-exh-ink/40 p-3"
              >
                <p className="exh-plat text-[11px] md:text-[10px] font-bold uppercase tracking-[0.22em] text-exh-ink">
                  Notice
                </p>
                <p className="mt-1 text-xs leading-snug text-exh-ink">{NOTICE_BODY}</p>
                <div className="mt-2">
                  <Stamp text="EVICTED" tone="ink" size="md" animate={!api.reducedMotion} />
                </div>
              </PaperCard>
            )}

            <div className="mt-3">
              <p className="text-xs font-semibold text-exh-ink-soft">{RIGHT_COUNTER_LABEL}</p>
              <p
                data-testid="twobuyers-extra"
                data-usd={extra}
                className="exh-mono text-xl font-medium text-exh-red sm:text-2xl"
              >
                {usd(extra)}
              </p>
            </div>

            {fired && (
              <div className="mt-2 border-t border-exh-ink/20 pt-2">
                <p className="text-xs font-semibold text-exh-ink-soft">{KEPT_LABEL}</p>
                {keptUsd != null ? (
                  <p data-testid="twobuyers-kept" data-usd={keptUsd} className="exh-mono text-lg text-exh-red">
                    {usd(keptUsd)}
                  </p>
                ) : (
                  <p data-testid="twobuyers-kept" className="text-sm leading-snug text-exh-ink">
                    {KEPT_FALLBACK}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3">
              <p className="text-xs font-semibold text-exh-ink-soft">{RIGHT_BAR_LABEL}</p>
              <div
                aria-hidden="true"
                className="mt-1 h-4 w-full rounded-[2px] border border-exh-ink/45 bg-transparent"
              />
              <p className="exh-mono mt-1 text-sm text-exh-ink">0%</p>
            </div>
          </section>
        </div>

        {/* the plain sentence of meaning, updated by the slider */}
        <p
          data-testid="twobuyers-takeaway"
          aria-live="polite"
          className="exh-serif mt-4 border-t border-exh-ink/15 pt-3 text-base leading-snug text-exh-ink sm:text-lg"
        >
          {months === 0
            ? fired
              ? TAKEAWAY_AFTER_MISS
              : TAKEAWAY_START
            : takeaway(yr, mo, pctLabel(sharePct), usd(extra))}
        </p>

        {/* ---------------- the one shared slider ---------------- */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={sliderId} className="text-xs font-semibold text-exh-ink-soft">
              Years of payments
            </label>
            <span className="exh-mono text-sm text-exh-ink">
              {yr} yr {mo} mo
            </span>
          </div>
          <div className="relative">
            <input
              id={sliderId}
              data-testid="twobuyers-slider"
              type="range"
              min={0}
              max={TWO_BUYERS.monthsToAverage}
              step={1}
              value={months}
              onChange={(e) => onSlide(Number(e.target.value))}
              aria-label="Years of payments"
              aria-valuetext={`${yr} years and ${mo} months of payments`}
              className="exh-tb-range"
            />
            {/* tick at the study's average, the right end of the rail */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-6 top-4 h-2.5 w-0.5 bg-exh-ink/60"
            />
          </div>
          <p
            className={`text-right text-xs leading-snug ${
              atCap ? "font-semibold text-exh-ink" : "text-exh-ink-soft"
            }`}
          >
            {TICK_LABEL}
          </p>
        </div>

        {/* ---------------- life happens ---------------- */}
        <div className="mt-4 flex flex-col items-center">
          <button
            type="button"
            data-testid="twobuyers-life"
            onClick={onLife}
            disabled={fired}
            className="min-h-12 rounded-sm border-2 border-exh-ink bg-exh-ink px-6 text-sm font-semibold text-exh-linen transition-colors hover:bg-exh-ink/85 disabled:cursor-not-allowed disabled:border-exh-ink/30 disabled:bg-transparent disabled:text-exh-ink-soft"
          >
            {fired ? "one missed payment shown" : "Miss one payment"}
          </button>
          {!fired && (
            <p className="mt-1.5 text-center text-xs text-exh-ink-soft">{lifeHint(months)}</p>
          )}
        </div>

        {/* ---------------- exit line ---------------- */}
        {exitShown && (
          <div
            data-testid="twobuyers-exit"
            className={`mt-4 border-t border-exh-ink/15 pt-3 ${api.reducedMotion ? "" : "exh-ledger-in"}`}
          >
            <p className="exh-serif text-base leading-snug text-exh-ink sm:text-lg">{EXIT_LINE}</p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <FactValue id="contracts.avg_overpayment_71000" size="sm" />
              <FactValue id="contracts.homes_60100" size="sm" />
            </div>
          </div>
        )}
      </PaperCard>

      {/* ---------------- the Ross card, beside the desk ---------------- */}
      <PaperCard tone="deep" className="mt-4 w-full max-w-md p-4 sm:ml-auto sm:-rotate-[0.4deg]">
        <p className="text-xs font-semibold text-exh-ink-soft">The worked example</p>
        <h4 className="exh-serif mt-1 text-lg leading-snug text-exh-ink">
          Clyde Ross, North Lawndale
        </h4>
        <div className="mt-2 space-y-1">
          <div>
            <FactValue id="contracts.ross_contract_27500" size="sm" />
          </div>
          <div>
            <FactValue id="contracts.ross_speculator_12000" size="sm" />
          </div>
        </div>
        <p className="mt-2 text-sm leading-snug text-exh-ink">
          {"That is a "}
          <span className="exh-mono">{Math.round((TWO_BUYERS.ross.priceRatio - 1) * 100)}</span>
          {" percent markup on what the seller had just paid, against the study's "}
          <span className="exh-mono">{TWO_BUYERS.markupAvgPct}</span>
          {" percent average."}
          <SourceSup factId="contracts.markup_84pct" />
        </p>
        <div className="mt-3">
          <VoiceCard personId="clyde-ross" size="sm" />
        </div>
      </PaperCard>
    </div>
  );
}
