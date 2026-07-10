"use client";
/* ------------------------------------------------------------------ */
/*  Act 6, the full account column. The eleven ledger entries from     */
/*  data/exhibit/ledger.json render chronologically as a real table,   */
/*  year + label + source markers, tabular figures. The column head    */
/*  states the dollar convention; the single credit entry (the CBL)    */
/*  is the only green on the page. Dollar amounts render only where    */
/*  the entry's own facts carry one; nothing sums, nothing deflates.   */
/* ------------------------------------------------------------------ */
import type { SceneProps } from "./registry";
import ledgerJson from "../../../../../data/exhibit/ledger.json";
import { SourceSupGroup } from "../../shared/SourceSup";
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

/* Dollar figures for the amount column. Every string here resolves to
   the fact cited beside it; entries without a clean dollar fact keep
   the amount cell empty, per the column-head convention. */
interface AmountLine {
  text: string;
  tag?: string;
  factIds: string[];
}
const AMOUNTS: Record<string, AmountLine[]> = {
  "color-tax": [
    { text: "$71,000 per family", tag: "2019 dollars", factIds: ["contracts.avg_overpayment_71000"] },
  ],
  "cbl-credit": [{ text: "$14,000 per contract", factIds: ["cbl.savings"] }],
  "closing-totals": [
    { text: "$3.2 to $4 billion", tag: "2019 dollars", factIds: ["contracts.extraction_3_4b"] },
    {
      text: "$285,010 against $44,890",
      tag: "2022 medians",
      factIds: ["present.scf_white_285000", "present.scf_black_44900"],
    },
  ],
};

function refsFor(e: LedgerEntry): string[] {
  const all = e.factRefs ?? (e.factRef ? [e.factRef] : []);
  const inAmount = new Set((AMOUNTS[e.entryId] ?? []).flatMap((a) => a.factIds));
  const remaining = all.filter((id) => !inAmount.has(id));
  // an entry whose only facts moved into the amount cell keeps one
  // marker on the label so the row never reads unsourced at a glance
  return remaining.length > 0 ? remaining : all;
}

export default function LedgerColumn(_props: SceneProps) {
  const first = ENTRIES[0]?.year;
  const last = ENTRIES[ENTRIES.length - 1]?.year;
  return (
    <section data-testid="scene-ledgerColumn" className="max-w-[34rem]">
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
          The exhibit&apos;s account column, eleven dated entries in
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
                        <span key={a.text} className="block">
                          {a.text}
                          <SourceSupGroup factIds={a.factIds} />
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
