"use client";
/* ------------------------------------------------------------------ */
/*  The Ledger Rail, a thin fixed band at the bottom edge posting the  */
/*  11 dated dollars-and-people entries as the story reaches them.     */
/*  Rust because rust means now; tabular figures; the finale scene     */
/*  renders the full account column in the flow, this rail only ever   */
/*  shows the latest posted line and the running count.                */
/* ------------------------------------------------------------------ */
import ledgerData from "../../../../../data/exhibit/ledger.json";
import { useGround } from "../engine/GroundProvider";

interface LedgerEntry {
  entryId: string;
  year: number;
  label: string;
  sign: "debit" | "credit" | "note";
}
const ENTRIES: LedgerEntry[] = (ledgerData as { entries: LedgerEntry[] }).entries;
const TOTAL = ENTRIES.length;

export default function LedgerRail() {
  const { posted } = useGround();
  const postedSet = new Set(posted);
  const postedEntries = ENTRIES.filter((e) => postedSet.has(e.entryId));
  const latest = postedEntries[postedEntries.length - 1] ?? null;

  return (
    <div
      className="ground-ledger-rail"
      data-testid="ground-ledger-rail"
      data-populated={latest ? "on" : "off"}
      role="status"
      aria-live="off"
    >
      {latest ? (
        <>
          <span className="glr-year exh-mono">{latest.year}</span>
          <span className="glr-label" data-sign={latest.sign}>
            {latest.label}
          </span>
          <span className="glr-count exh-mono">
            {postedEntries.length} of {TOTAL}
          </span>
        </>
      ) : (
        <span className="glr-label glr-empty">The ledger this exhibit keeps. Entries post as the story reaches them.</span>
      )}
    </div>
  );
}
