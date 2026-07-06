"use client";
/* ------------------------------------------------------------------ */
/*  The Ledger, the exhibit's account book. Entries post as chapters   */
/*  conclude (state.ledgerPosted, in stamp order) and every value on   */
/*  a row resolves through FactValue, so the book never holds numbers  */
/*  of its own. Sign styling is semantic: debits carry the red left    */
/*  rule, notes stay ink, and the single credit (the Contract Buyers   */
/*  League) is the one green in the whole exhibit, marked with a       */
/*  reversed underline sweep. The running strip is a museum ledger,    */
/*  not math: an entry count, and the closing figure only once ch11    */
/*  posts. Desktop shows the book top-right; mobile collapses to      */
/*  LedgerChip, which opens LedgerSheet.                               */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ledgerJson from "../../../../data/exhibit/ledger.json";
import type { LedgerEntryDef } from "@/lib/exhibit/types";
import { useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { motionMs } from "@/lib/exhibit/debug";
import { cn } from "@/lib/utils";
import { FactValue } from "../shared/FactValue";
import { PaperCard } from "../shared/PaperCard";
import { exhAnnounce } from "./HudFrame";
import { LedgerSheet } from "./LedgerSheet";

const DOC = ledgerJson as unknown as { entries: LedgerEntryDef[] };
const BY_ID = new Map<string, LedgerEntryDef>(DOC.entries.map((e) => [e.entryId, e]));

/** the entry id whose posting closes the book (ch11) */
const CLOSING_ENTRY_ID = "closing-totals";
/** the headline closing figure shown on the strip once ch11 posts */
const CLOSING_FACT_ID = "contracts.extraction_3_4b";

export function ledgerEntry(entryId: string): LedgerEntryDef | undefined {
  return BY_ID.get(entryId);
}

export function refsOf(entry: LedgerEntryDef): string[] {
  return entry.factRefs ?? (entry.factRef ? [entry.factRef] : []);
}

/** Posted entries in stamp order, resolved against ledger.json. */
export function usePostedEntries(): LedgerEntryDef[] {
  const state = useExhibitState();
  return state.ledgerPosted
    .map((id) => BY_ID.get(id))
    .filter((e): e is LedgerEntryDef => Boolean(e));
}

/* ---- one account row, shared by the book and the mobile sheet ---- */

export function LedgerEntryRow({ entry, fresh = false }: { entry: LedgerEntryDef; fresh?: boolean }) {
  const credit = entry.sign === "credit";
  return (
    <li
      data-testid={`ledger-${entry.entryId}`}
      data-sign={entry.sign}
      className={cn(
        "relative border-l-2 py-2 pl-2.5 pr-1",
        entry.sign === "debit" && "border-exh-red",
        entry.sign === "note" && "border-exh-ink/30",
        credit && "border-exh-green",
        fresh && "exh-ledger-in"
      )}
    >
      {/* brief gold stamp flash on a live post */}
      {fresh && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-exh-gold"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          transition={{ duration: motionMs(700) / 1000, times: [0, 0.3, 1], ease: "easeOut" }}
        />
      )}
      <div className="flex items-baseline gap-2">
        <span className="exh-mono text-[11px] text-exh-ink-soft">{entry.year}</span>
        <span className="text-xs leading-snug text-exh-ink">{entry.label}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 pl-0.5">
        {refsOf(entry).map((ref) => (
          <FactValue key={ref} id={ref} size="sm" />
        ))}
      </div>
      {/* the one green in the exhibit: the CBL credit, underlined right to left */}
      {credit && (
        <motion.span
          aria-hidden="true"
          className="absolute bottom-0.5 left-2.5 right-1 h-px bg-exh-green"
          initial={fresh ? { scaleX: 0 } : false}
          animate={{ scaleX: 1 }}
          style={{ originX: 1 }}
          transition={{ duration: fresh ? motionMs(600) / 1000 : 0, ease: "easeOut" }}
        />
      )}
    </li>
  );
}

/* ---- the desktop book ---- */

export function Ledger() {
  const state = useExhibitState();
  const posted = usePostedEntries();
  const prevRef = useRef<string[] | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [freshIds, setFreshIds] = useState<string[]>([]);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state.ledgerPosted;
    if (prev === null) return; // mount or session restore, no ceremony
    const added = state.ledgerPosted.filter((id) => !prev.includes(id));
    if (added.length === 0) return;

    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;

    if (state.silentEffects) {
      // jump fast-forward: one quiet summary, no animation
      exhAnnounce(
        added.length === 1
          ? `Posted to the ledger. ${BY_ID.get(added[0])?.label ?? ""}.`
          : `${added.length} entries posted to the ledger.`
      );
      return;
    }
    for (const id of added) {
      const entry = BY_ID.get(id);
      if (entry) exhAnnounce(`Posted to the ledger. ${entry.label}.`);
    }
    if (!state.reducedMotion) {
      setFreshIds(added);
      const t = window.setTimeout(() => setFreshIds([]), Math.max(motionMs(900), 1));
      return () => window.clearTimeout(t);
    }
  }, [state.ledgerPosted, state.silentEffects, state.reducedMotion]);

  const closingPosted = state.ledgerPosted.includes(CLOSING_ENTRY_ID);

  return (
    <PaperCard
      data-testid="ledger"
      // top-32 mount + this max height keep the book clear of the caption
      // band above the spine (same clearance as the old top-24 mount)
      className="flex max-h-[calc(100dvh-17rem)] w-72 flex-col"
      aria-label="The ledger"
    >
      <header className="px-3 pb-1.5 pt-2.5">
        <h2 className="exh-plat text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink">
          The Ledger
        </h2>
        <div className="mt-1.5 border-b-[3px] border-double border-exh-ink/35" />
      </header>

      {posted.length === 0 ? (
        <p className="px-3 pb-3 pt-1 text-xs italic text-exh-ink-soft/80">
          The account opens in <span className="exh-mono not-italic">1833</span>.
        </p>
      ) : (
        <ul ref={listRef} className="min-h-0 flex-1 divide-y divide-exh-ink/10 overflow-y-auto px-2.5 pb-1">
          {posted.map((entry) => (
            <LedgerEntryRow key={entry.entryId} entry={entry} fresh={freshIds.includes(entry.entryId)} />
          ))}
        </ul>
      )}

      {posted.length > 0 && (
        <footer className="border-t-[3px] border-double border-exh-ink/35 px-3 py-2">
          <div className="flex items-baseline justify-between">
            <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
              Entries
            </span>
            <span className="exh-mono text-xs text-exh-ink">{posted.length}</span>
          </div>
          {closingPosted && (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
                Closing
              </span>
              <FactValue id={CLOSING_FACT_ID} size="sm" />
            </div>
          )}
        </footer>
      )}
    </PaperCard>
  );
}

/* ---- the mobile chip (running count + latest year, opens the sheet) ---- */

export function LedgerChip() {
  const posted = usePostedEntries();
  const [open, setOpen] = useState(false);
  const latest = posted[posted.length - 1];

  return (
    <>
      <button
        type="button"
        data-testid="ledger-chip"
        aria-label="Open the ledger"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex min-h-12 items-center gap-2 rounded-sm border border-exh-ink/15 bg-exh-linen px-2.5 shadow-[0_1px_3px_rgba(28,26,23,0.12)]"
      >
        <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
          Ledger
        </span>
        <span className="exh-mono text-xs text-exh-ink">{posted.length}</span>
        {/* the latest year yields below 420px so the strip's second row
            (five 48px lamps plus this chip) can never collide */}
        {latest && (
          <span className="exh-mono hidden text-[10px] text-exh-ink-soft min-[420px]:inline">
            {latest.year}
          </span>
        )}
      </button>
      <LedgerSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

export default Ledger;
