"use client";
/* ------------------------------------------------------------------ */
/*  LedgerSheet, the mobile bottom sheet holding the full account      */
/*  book. Same rows as the desktop ledger (LedgerEntryRow), no post    */
/*  ceremony inside the sheet. Rendered without a Radix portal so it   */
/*  stays inside .exhibit-root and keeps the scoped utility classes.   */
/* ------------------------------------------------------------------ */
import * as Dialog from "@radix-ui/react-dialog";
import { useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { FactValue } from "../shared/FactValue";
import { LedgerEntryRow, ledgerEntry } from "./Ledger";

export interface LedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LedgerSheet({ open, onOpenChange }: LedgerSheetProps) {
  const state = useExhibitState();
  const posted = state.ledgerPosted
    .map((id) => ledgerEntry(id))
    .filter((e): e is NonNullable<ReturnType<typeof ledgerEntry>> => Boolean(e));
  const closingPosted = state.ledgerPosted.includes("closing-totals");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-exh-ink/40" />
      <Dialog.Content
        aria-describedby={undefined}
        data-testid="ledger-sheet"
        className="exh-paper fixed inset-x-0 bottom-0 z-50 flex max-h-[80dvh] flex-col rounded-t-md border-t border-exh-ink/20 shadow-[0_-4px_16px_rgba(28,26,23,0.2)]"
      >
        <div className="flex items-center justify-between border-b-[3px] border-double border-exh-ink/35 py-1 pl-4 pr-1">
          <Dialog.Title className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
            The Ledger
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close the ledger"
              className="flex h-12 w-12 items-center justify-center text-lg text-exh-ink"
            >
              ✕
            </button>
          </Dialog.Close>
        </div>

        {posted.length === 0 ? (
          <p className="px-4 py-4 text-xs italic text-exh-ink-soft/80">
            The account opens in <span className="exh-mono not-italic">1833</span>.
          </p>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-exh-ink/10 overflow-y-auto px-3 pb-2 pt-1">
              {posted.map((entry) => (
                <LedgerEntryRow key={entry.entryId} entry={entry} />
              ))}
            </ul>
            <footer className="border-t-[3px] border-double border-exh-ink/35 px-4 py-2.5">
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
                  <FactValue id="contracts.extraction_3_4b" size="sm" />
                </div>
              )}
            </footer>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default LedgerSheet;
