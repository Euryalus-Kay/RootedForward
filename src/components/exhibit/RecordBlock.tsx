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
        Added to the record
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

/* the span the bottom rail prints as "the machinery at full power" */
const MACHINE_SPAN = { start: 1921, end: 1968 };

export function LedgerTable() {
  const entries = [...LEDGER].sort((a, b) => a.year - b.year);
  return (
    <div data-testid="ledger-table">
      <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.3em] text-exh-ink-soft md:text-[10px]">
        The record, in full
      </p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-exh-ink-soft">
        Every entry the chapters above posted, in one line from the treaty to today. Each figure
        carries its citation. <span className="text-exh-red">Red years</span> fall inside 1921 to
        1968, when the machinery ran at full power.
      </p>

      <ol className="mt-6 border-l-2 border-exh-ink/25 pl-0">
        {entries.map((e, i) => {
          const hot = e.year >= MACHINE_SPAN.start && e.year <= MACHINE_SPAN.end;
          return (
            <li
              key={e.entryId}
              data-entry-year={e.year}
              data-testid={`ledger-entry-${e.entryId}`}
              className={i === entries.length - 1 ? "relative pb-1 pl-6 sm:pl-8" : "relative pb-8 pl-6 sm:pl-8"}
            >
              <span
                aria-hidden="true"
                className={
                  hot
                    ? "absolute -left-[7px] top-[7px] h-3 w-3 rounded-full border-2 border-exh-red bg-exh-linen"
                    : "absolute -left-[7px] top-[7px] h-3 w-3 rounded-full border-2 border-exh-ink/70 bg-exh-linen"
                }
              />
              <p
                className={
                  hot
                    ? "exh-mono text-lg font-semibold leading-none text-exh-red"
                    : "exh-mono text-lg font-semibold leading-none text-exh-ink"
                }
              >
                {e.year}
              </p>
              <p className="mt-1.5 max-w-[52ch] font-display text-base leading-snug text-exh-ink md:text-lg">
                {e.label}
              </p>
              <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                {refsOf(e).map((ref) => (
                  <FactValue key={ref} id={ref} size="sm" />
                ))}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
