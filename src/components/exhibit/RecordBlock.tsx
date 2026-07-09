"use client";
/* ------------------------------------------------------------------ */
/*  The record, as content. RecordLines renders the quiet chapter-end  */
/*  block (small-caps eyebrow, then each entry's label and its         */
/*  registered figures; no animation, no running HUD). LedgerTable     */
/*  renders the full record at ch11: every entry with its year,        */
/*  label, and values, before the gap-at-scale station.                */
/* ------------------------------------------------------------------ */
import ledgerJson from "../../../data/exhibit/ledger.json";
import type { ChapterId, LedgerEntryDef } from "@/lib/exhibit/types";
import { CHAPTER_META } from "@/lib/exhibit/content";
import FactValue from "./shared/FactValue";

const LEDGER = (ledgerJson as unknown as { entries: LedgerEntryDef[] }).entries;

const entryById = new Map(LEDGER.map((e) => [e.entryId, e]));

function refsOf(entry: LedgerEntryDef): string[] {
  if (entry.factRefs?.length) return entry.factRefs;
  return entry.factRef ? [entry.factRef] : [];
}

/** entries a chapter posts to the record, from CHAPTER_META effects */
export function recordEntriesOf(chapterId: ChapterId): LedgerEntryDef[] {
  const meta = CHAPTER_META.find((m) => m.id === chapterId);
  const ids = meta?.effects.ledgerEntryIds ?? [];
  return ids.map((id) => entryById.get(id)).filter((e): e is LedgerEntryDef => !!e);
}

export function RecordLines({ chapterId }: { chapterId: ChapterId }) {
  const entries = recordEntriesOf(chapterId);
  if (!entries.length) return null;
  return (
    <div
      data-testid={`record-${chapterId}`}
      className="border-t border-exh-ink/20 pt-4"
    >
      <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.3em] text-exh-ink-soft md:text-[10px]">
        The record
      </p>
      <ul className="mt-2 space-y-2.5">
        {entries.map((e) => (
          <li key={e.entryId} data-entry-id={e.entryId}>
            <p className="text-sm leading-relaxed text-exh-ink">
              <span className="exh-mono text-exh-ink-soft">{e.year}</span>
              <span aria-hidden="true"> &middot; </span>
              {e.label}
            </p>
            <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
              {refsOf(e).map((ref) => (
                <FactValue key={ref} id={ref} size="sm" />
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LedgerTable() {
  const entries = [...LEDGER].sort((a, b) => a.year - b.year);
  return (
    <div data-testid="ledger-table">
      <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.3em] text-exh-ink-soft md:text-[10px]">
        The record, in full
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-exh-ink-soft">
        Every entry the chapters above posted, in one place. Each figure carries its citation.
      </p>

      {/* below md, the record reads as stacked entries, no side scroll */}
      <ul className="mt-4 space-y-3 md:hidden">
        {entries.map((e) => (
          <li
            key={e.entryId}
            data-testid={`ledger-card-${e.entryId}`}
            className="border border-exh-ink/25 bg-exh-linen-deep/30 p-3"
          >
            <p className="text-sm leading-snug text-exh-ink">
              <span className="exh-mono text-exh-ink-soft">{e.year}</span>
              <span aria-hidden="true"> &middot; </span>
              {e.label}
            </p>
            <div className="mt-1.5 flex flex-col gap-1">
              {refsOf(e).map((ref) => (
                <FactValue key={ref} id={ref} size="sm" />
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* md and up, the full table */}
      <div className="mt-4 hidden overflow-x-auto border border-exh-ink/25 md:block">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-exh-ink/25 bg-exh-linen-deep/50">
              <th className="exh-plat px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                Year
              </th>
              <th className="exh-plat px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                Entry
              </th>
              <th className="exh-plat px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                Values
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.entryId}
                data-testid={`ledger-row-${e.entryId}`}
                className="border-b border-exh-ink/15 last:border-b-0 align-top"
              >
                <td className="exh-mono px-3 py-2.5 text-sm text-exh-ink">{e.year}</td>
                <td className="px-3 py-2.5 text-sm leading-snug text-exh-ink">{e.label}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    {refsOf(e).map((ref) => (
                      <FactValue key={ref} id={ref} size="sm" />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
