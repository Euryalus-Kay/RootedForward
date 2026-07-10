"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "twoBuyers". Two Buyers, One House on the page's single   */
/*  native range slider. Two columns share one money axis, dollars     */
/*  paid beyond a fair price in the study's 2019 dollars; the          */
/*  mortgage column holds at zero by definition while the contract     */
/*  column climbs $587 a month, so the hatched column IS the color     */
/*  tax. The rest state is the verdict: the slider mounts at the       */
/*  final month with the $71,000 average and its source fully          */
/*  rendered, and scrubbing back replays the years. Every figure       */
/*  derives from TWO_BUYERS (data/exhibit/models.json) or renders      */
/*  through FactValue; this file holds no dollar literals. The fair    */
/*  buyer's own payment schedule is NOT in the study's data, so no     */
/*  second climbing column is drawn; the flat baseline states the      */
/*  truth the data supports. No animation anywhere, the input drives   */
/*  the bars directly.                                                 */
/* ------------------------------------------------------------------ */
import { useId, useState } from "react";
import { TWO_BUYERS } from "@/lib/exhibit/models";
import FactValue from "../../shared/FactValue";
import PaperCard from "../../shared/PaperCard";
import { SourceSupGroup } from "../../shared/SourceSup";
import type { SceneProps } from "./registry";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/* the plain sentence of meaning under the columns; model numbers only */
function takeaway(months: number, extra: number): string {
  if (months === 0) {
    return "Both families start today. Drag the years forward and the gap opens again.";
  }
  const yr = Math.floor(months / 12);
  const mo = months % 12;
  const time =
    yr === 0
      ? `After ${mo} month${mo === 1 ? "" : "s"}`
      : mo === 0
        ? `After ${yr} year${yr === 1 ? "" : "s"}`
        : `After ${yr} year${yr === 1 ? "" : "s"} and ${mo} month${mo === 1 ? "" : "s"}`;
  return `${time}, the mortgage buyer has paid nothing beyond a fair price. The contract buyer has paid ${usd(
    extra
  )} more for the same house.`;
}

/* 48px thumb on a hairline track, the exhibit's slider recipe */
const GTB_CSS = `
.gtb-range { appearance: none; -webkit-appearance: none; display: block; width: 100%; height: 56px; background: transparent; cursor: ew-resize; }
.gtb-range:focus-visible { outline: 2px solid var(--color-exh-blue); outline-offset: 2px; }
.gtb-range::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--color-exh-ink) 35%, transparent); }
.gtb-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; margin-top: -22px; height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: radial-gradient(circle at 35% 30%, var(--color-exh-linen), var(--color-exh-linen-deep)); }
.gtb-range::-moz-range-track { height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--color-exh-ink) 35%, transparent); }
.gtb-range::-moz-range-thumb { height: 48px; width: 48px; border-radius: 9999px; border: 2px solid var(--color-exh-ink); background: var(--color-exh-linen); }
.gtb-hatch { background-color: color-mix(in srgb, var(--color-exh-ink) 7%, transparent); background-image: repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-exh-ink) 50%, transparent) 0 1.5px, transparent 1.5px 7px); }
`;

export default function TwoBuyersGround(_props: SceneProps) {
  const sliderId = useId();
  /* the rest state is the verdict; scrubbing back replays the years */
  const [months, setMonths] = useState<number>(TWO_BUYERS.monthsToAverage);

  const extra = TWO_BUYERS.extraPaid(months);
  const axisMax = TWO_BUYERS.extraPaid(TWO_BUYERS.monthsToAverage);
  const barPct = axisMax > 0 ? (extra / axisMax) * 100 : 0;
  const yr = Math.floor(months / 12);
  const mo = months % 12;

  return (
    <section
      data-testid="scene-twoBuyers"
      data-month={months}
      aria-label="Two buyers, one house"
      className="max-w-xl"
    >
      <style>{GTB_CSS}</style>

      <h3 className="font-display text-2xl leading-tight text-exh-ink">Two buyers, one house</h3>
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        Both families buy the same house on the same day. One carries a federally insured
        mortgage. One signs a land contract. The columns count what each pays beyond a fair
        price, in the study&apos;s 2019 dollars.
      </p>
      <div className="mt-2 border-b border-exh-ink/15 pb-3">
        <FactValue id="contracts.extra_monthly_587" size="sm" />
      </div>

      {/* ---------------- the shared money axis ---------------- */}
      <div className="relative mt-6 h-52" aria-hidden="true">
        {/* the study-average rule the contract column climbs toward */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-exh-ink/50">
          <span className="exh-plat absolute left-0 top-1 text-[10px] uppercase tracking-[0.18em] text-exh-ink-soft">
            the study&apos;s average
          </span>
        </div>
        <div className="flex h-full items-end justify-center gap-10 border-b-2 border-exh-ink/60 px-2 sm:gap-16">
          {/* the mortgage buyer, nothing beyond a fair price */}
          <div className="flex h-full w-28 flex-col items-center justify-end sm:w-32">
            <div data-testid="gtb-bar-mortgage" className="h-0.5 w-full bg-exh-ink/70" />
          </div>
          {/* the contract buyer; the hatched column is the color tax */}
          <div className="flex h-full w-28 flex-col items-center justify-end sm:w-32">
            <div
              data-testid="gtb-bar-contract"
              className="gtb-hatch relative w-full border border-b-0 border-exh-ink/50"
              style={{ height: `${barPct}%` }}
            >
              {barPct >= 22 && (
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-exh-linen px-1.5 py-0.5">
                  <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
                    the color tax
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* the counters under their columns */}
      <div className="mt-2 flex justify-center gap-10 sm:gap-16">
        <div className="flex w-28 flex-col text-center sm:w-32">
          <p className="flex min-h-10 items-end justify-center font-display text-base leading-tight text-exh-ink">
            The mortgage buyer
          </p>
          <p className="exh-mono mt-1 text-lg text-exh-ink">$0</p>
          <p className="text-[11px] leading-snug text-exh-ink-soft">beyond a fair price</p>
        </div>
        <div className="flex w-28 flex-col text-center sm:w-32">
          <p className="flex min-h-10 items-end justify-center font-display text-base leading-tight text-exh-ink">
            The contract buyer
          </p>
          <p data-testid="gtb-extra" data-usd={extra} className="exh-mono mt-1 text-lg text-exh-ink">
            {usd(extra)}
          </p>
          <p className="text-[11px] leading-snug text-exh-ink-soft">beyond a fair price</p>
        </div>
      </div>

      {/* the plain sentence of meaning, updated by the slider */}
      <p
        data-testid="gtb-takeaway"
        aria-live="polite"
        className="exh-serif mt-5 border-t border-exh-ink/15 pt-3 text-base leading-snug text-exh-ink sm:text-lg"
      >
        {takeaway(months, extra)}
        <SourceSupGroup factIds={TWO_BUYERS.basisFactRefs} />
      </p>

      {/* ---------------- the page's one slider ---------------- */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={sliderId} className="text-xs font-semibold text-exh-ink-soft">
            Years of payments
          </label>
          <span className="exh-mono text-sm text-exh-ink">
            {yr} yr {mo} mo
          </span>
        </div>
        <input
          id={sliderId}
          data-testid="gtb-slider"
          type="range"
          min={0}
          max={TWO_BUYERS.monthsToAverage}
          step={1}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          aria-valuetext={`${yr} years and ${mo} months of payments`}
          className="gtb-range"
        />
        <p className="text-right text-xs leading-snug text-exh-ink-soft">
          The track ends where the extra payments reach the study&apos;s average.
        </p>
      </div>

      {/* ---------------- the verdict, rendered whole on arrival ---------------- */}
      <div className="mt-5 border-t border-exh-ink/15 pt-4">
        <FactValue id="contracts.avg_overpayment_71000" size="lg" />
        <p className="mt-2 text-sm leading-relaxed text-exh-ink">
          The figure is the study&apos;s average loss per contract-buying family, in 2019
          dollars. The study found <FactValue id="contracts.markup_84pct" size="sm" /> over what
          sellers had just paid for the same houses.
        </p>
      </div>

      {/* ---------------- the worked example ---------------- */}
      <PaperCard tone="deep" className="mt-5 p-4">
        <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
          The worked example
        </p>
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
          More than double what the seller had paid, months apart, for the same house. His case
          ran worse than the study&apos;s average.
        </p>
      </PaperCard>
    </section>
  );
}
