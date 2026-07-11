"use client";
/* ------------------------------------------------------------------ */
/*  Act 6, the full account column. The eleven ledger entries from     */
/*  data/exhibit/ledger.json render chronologically as a real table,   */
/*  year + label + source markers, tabular figures. The column head    */
/*  states the dollar convention; the single credit entry (the CBL)    */
/*  is the only green on the page. Dollar amounts render only where    */
/*  the entry's own facts carry one; nothing sums, nothing deflates.   */
/*                                                                     */
/*  This file also owns the R10 deed-stack towers. While the active    */
/*  step is one of act6's money beats they portal into the sheet's     */
/*  .ground-towers layer and stand perpendicular off the leaned map    */
/*  at their true anchors, North Lawndale (the contract color tax)     */
/*  and East Woodlawn (the present-day price). Only geographically     */
/*  local dollars may stand on geography; the national SCF medians     */
/*  stay inside the climb chart by council ruling (R10 verdict,        */
/*  killed list, the Loop-anchored citywide-gap tower).                */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SceneProps } from "./registry";
import ledgerJson from "../../../../../data/exhibit/ledger.json";
import { useGround } from "../engine/GroundProvider";
import { getFact } from "@/lib/exhibit/facts";
import { FactValue } from "../../shared/FactValue";
import { SourceSup, SourceSupGroup } from "../../shared/SourceSup";
import { cn } from "@/lib/utils";

interface LedgerEntry {
  entryId: string;
  chapter: string;
  year: number;
  label: string;
  factRef?: string;
  factRefs?: string[];
  sign: "debit" | "credit" | "note";
}

const ENTRIES: LedgerEntry[] = [...(ledgerJson as { entries: LedgerEntry[] }).entries].sort(
  (a, b) => a.year - b.year
);

/* Figures for the value column. Every figure here resolves to the
   fact cited beside it; entries without a clean fact for the column
   keep the cell empty, per the column-head convention. The figure
   line never wraps mid-figure; units and second counts get their own
   line beneath, like the dollar-year tags. */
interface AmountLine {
  fig: string;
  sub?: string;
  tag?: string;
  factIds: string[];
}
const AMOUNTS: Record<string, AmountLine[]> = {
  "red-summer": [
    {
      fig: "38 dead",
      sub: "about 1,000 burned out",
      factIds: ["bombings.riot_1919_dead", "bombings.riot_homeless_1000"],
    },
  ],
  "color-tax": [
    {
      fig: "$71,000",
      sub: "per family",
      tag: "2019 dollars",
      factIds: ["contracts.avg_overpayment_71000"],
    },
  ],
  "cbl-credit": [{ fig: "$14,000", sub: "per contract", factIds: ["cbl.savings"] }],
  "closing-totals": [
    { fig: "$3.2 to $4", sub: "billion", tag: "2019 dollars", factIds: ["contracts.extraction_3_4b"] },
    {
      fig: "$285,010",
      sub: "against $44,890",
      tag: "2022 national medians",
      factIds: ["present.scf_white_285000", "present.scf_black_44900"],
    },
  ],
};

/* ---- the deed-stack towers (R10 verdict sections 2 and 6) --------- */

/** act6's money beats; the towers stand only while one is active */
const MONEY_STEPS = new Set(["a6-bridge", "a6-ledger", "a6-climb"]);

const LAWNDALE_ID = "contracts.avg_overpayment_71000";
const WOODLAWN_ID = "present.woodlawn_prices";

/* dollar values straight from the registry, so the drawn heights can
   never disagree with the citation */
const LAWNDALE_USD = Number(getFact(LAWNDALE_ID).value);
const WOODLAWN_USD = Number(getFact(WOODLAWN_ID).value);

/* ONE disclosed linear scale for both towers. A sliver of paper is
   $10,000 and draws 3px tall, so the taller stack stands about 130px
   on desktop. The legend chip states the sliver value; each plate
   states its own dollar-year because the two figures' years differ. */
const SLIVER_USD = 10000;
const SLIVER_PX = 3;
const towerPx = (usd: number) => Math.round((usd / SLIVER_USD) * SLIVER_PX * 10) / 10;

/* countable paper slivers, linen and ink only; the gradient runs from
   the base up so the partial sliver honestly sits at the top */
const SLIVER_STACK = `repeating-linear-gradient(to top, color-mix(in srgb, var(--color-exh-ink) 10%, var(--color-exh-linen)) 0px ${SLIVER_PX - 0.8}px, color-mix(in srgb, var(--color-exh-ink) 55%, var(--color-exh-linen)) ${SLIVER_PX - 0.8}px ${SLIVER_PX}px)`;

function DeedTower({
  factId,
  place,
  qualifier,
  yearTag,
  pos,
  height,
  reducedMotion,
  presentCap = false,
  plateShift,
}: {
  factId: string;
  place: string;
  /** two or three plain words naming what the figure is */
  qualifier: string;
  yearTag: string;
  pos: { left: number; top: number };
  height: number;
  reducedMotion: boolean;
  /** rust means present day only; a 3px cap on the Woodlawn stack */
  presentCap?: boolean;
  /** shift the plate off its column's centerline (the Lawndale plate
   *  hangs west so the two plates never collide mid-sheet) */
  plateShift?: string;
}) {
  return (
    <div
      className="gtower"
      data-testid={`gtower-${place.toLowerCase().replace(/ /g, "-")}`}
      style={{
        left: `calc(var(--gsv-left, 0px) + var(--gsv-w, 100%) * ${pos.left / 100})`,
        top: `calc(var(--gsv-top, 0px) + var(--gsv-h, 100%) * ${pos.top / 100})`,
      }}
    >
      <div className="flex flex-col items-center">
        {/* the label plate posts at once, the big figure first; the
            figure is the registry value itself (never a literal), the
            fact's full sentence stays one dagger-tap away */}
        <div
          className="pointer-events-auto border border-exh-ink/40 bg-exh-linen/95 px-2 py-1 text-center leading-tight shadow-sm"
          /* the 2px z-lift keeps the plate clear of the sheet plane
             under preserve-3d (without it the plate's far half sinks
             beneath the tilted map and is z-buffered away) */
          style={{
            transform: `${plateShift ? `translateX(${plateShift}) ` : ""}translateZ(2px)`,
          }}
        >
          <span className="exh-mono block whitespace-nowrap text-sm font-semibold text-exh-ink" data-stat="" data-fact-id={factId}>
            ${Number(getFact(factId).value).toLocaleString("en-US")}
            <SourceSup factId={factId} />
          </span>
          <span className="exh-plat block whitespace-nowrap text-[8px] uppercase tracking-[0.14em] text-exh-ink-soft">
            {qualifier}, {yearTag}
          </span>
          <span className="exh-plat block text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink">
            {place}
          </span>
        </div>
        {/* the stack rises off the sheet in one 450ms build (a pure
            CSS animation, so the resolved height is never state) */}
        <div
          aria-hidden="true"
          className="relative mt-0.5 w-[18px] border border-exh-ink/60 md:w-[26px]"
          style={{
            height,
            background: SLIVER_STACK,
            animation: reducedMotion
              ? undefined
              : "gtower-rise 450ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {presentCap ? (
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: "var(--exh-rust, #A8502F)" }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DollarTowers() {
  const { activeStep, towersSlot, anchorsPct, reducedMotion } = useGround();
  const show = MONEY_STEPS.has(activeStep.id);
  /* phones get the same towers at reduced height so the Woodlawn cap
     plate resolves inside the shorter stage frame (audit
     mobile-finale-clip); the sliver VALUE never changes, only its
     drawn height */
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const hScale = narrow ? 0.5 : 1;

  const slot = towersSlot.current;
  const lawndale = anchorsPct.lawndale;
  const today = anchorsPct.today;
  if (!show || !slot || !lawndale || !today) return null;

  return createPortal(
    <>
      <DeedTower
        factId={LAWNDALE_ID}
        place="North Lawndale"
        qualifier="more paid per home"
        yearTag="2019 dollars"
        pos={lawndale}
        height={towerPx(LAWNDALE_USD) * hScale}
        reducedMotion={reducedMotion}
        plateShift="-44%"
      />
      <DeedTower
        factId={WOODLAWN_ID}
        place="Woodlawn"
        qualifier="median price now"
        yearTag="2025 dollars"
        pos={today}
        height={towerPx(WOODLAWN_USD) * hScale}
        reducedMotion={reducedMotion}
        presentCap
      />
      {/* the disclosed scale, sheet furniture at the lower right */}
      <p
        data-testid="ground-towers-legend"
        className="exh-plat absolute bottom-3 right-3.5 m-0 border border-exh-ink/40 bg-exh-linen/95 px-2 py-1 text-[9px] tracking-[0.06em] text-exh-ink-soft max-lg:bottom-12 max-lg:right-2"
        style={{
          transform: "rotateX(calc(-1 * var(--gtilt, 0deg)))",
          transformOrigin: "50% 100%",
        }}
      >
        One sliver is ${SLIVER_USD.toLocaleString("en-US")}, dollars as noted
      </p>
      {/* non-visual parity for what stands where */}
      <p className="sr-only">
        Two dollar columns stand on the map, the color tax per
        contract-buying family at North Lawndale and the present-day
        Woodlawn price at East Woodlawn.
      </p>
    </>,
    slot
  );
}

function refsFor(e: LedgerEntry): string[] {
  const all = e.factRefs ?? (e.factRef ? [e.factRef] : []);
  const inAmount = new Set((AMOUNTS[e.entryId] ?? []).flatMap((a) => a.factIds));
  const remaining = all.filter((id) => !inAmount.has(id));
  // an entry whose only facts moved into the amount cell keeps one
  // marker on the label so the row never reads unsourced at a glance
  return remaining.length > 0 ? remaining : all.slice(0, 1);
}

export default function LedgerColumn(_props: SceneProps) {
  const first = ENTRIES[0]?.year;
  const last = ENTRIES[ENTRIES.length - 1]?.year;
  return (
    <section data-testid="scene-ledgerColumn" className="max-w-[34rem]">
      {/* the deed-stack towers ride the sheet across all three money
          beats; this scene stays mounted for the whole page, so it is
          the towers' one owner */}
      <DollarTowers />
      <header>
        <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          The account <span className="exh-mono normal-case tracking-normal">· {first} to {last}</span>
        </p>
        <p className="mt-2 max-w-[30rem] text-sm leading-relaxed text-exh-ink">
          Dollars of their year. Entries do not sum.
        </p>
      </header>

      <table className="mt-5 w-full border-collapse text-left">
        <caption className="sr-only">
          The exhibit&rsquo;s account column, eleven dated entries in
          chronological order, each with its sources
        </caption>
        <thead>
          <tr className="border-b border-exh-ink/40">
            <th scope="col" className="exh-plat py-1.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              Year
            </th>
            <th scope="col" className="exh-plat py-1.5 pr-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              Entry
            </th>
            <th scope="col" className="exh-plat py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {ENTRIES.map((e) => {
            const credit = e.sign === "credit";
            const amounts = AMOUNTS[e.entryId];
            return (
              <tr
                key={e.entryId}
                data-testid={`ledger-row-${e.entryId}`}
                data-sign={e.sign}
                className={cn(
                  "border-b border-exh-ink/15 align-top",
                  // the color-tax row is the stub carried in from Act 5
                  e.entryId === "color-tax" &&
                    "border-y border-dashed border-exh-ink/40 bg-exh-linen-deep/40"
                )}
              >
                <td className="exh-mono w-[3.4em] py-2.5 pr-3 text-sm text-exh-ink">{e.year}</td>
                <td className="py-2.5 pr-3 text-sm leading-snug text-exh-ink">
                  {e.label}
                  <SourceSupGroup factIds={refsFor(e)} />
                  {credit && (
                    <span className="exh-plat ml-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-green">
                      credit
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "exh-mono py-2.5 text-right text-sm leading-snug",
                    credit ? "text-exh-green" : "text-exh-ink"
                  )}
                >
                  {amounts
                    ? amounts.map((a) => (
                        <span key={a.fig} className="block [&+span]:mt-1.5">
                          {/* big number first; the figure leads at a
                              step up from its supporting lines */}
                          <span className="whitespace-nowrap text-base font-semibold">{a.fig}</span>
                          <SourceSupGroup factIds={a.factIds} />
                          {a.sub && (
                            <span className="block whitespace-nowrap text-xs text-exh-ink-soft">
                              {a.sub}
                            </span>
                          )}
                          {a.tag && (
                            <span className="exh-plat block text-[10px] uppercase tracking-[0.14em] text-exh-ink-soft">
                              {a.tag}
                            </span>
                          )}
                        </span>
                      ))
                    : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
