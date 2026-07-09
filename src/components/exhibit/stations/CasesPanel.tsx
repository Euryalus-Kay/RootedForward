"use client";
/* ------------------------------------------------------------------ */
/*  The four covenant cases as a static annotated documents panel      */
/*  (ch7). Straight from data/exhibit/cases.json: name, citation,      */
/*  year decided, the holding, and the consequence, each carrying      */
/*  its registered fact. No folders, no stamping.                      */
/* ------------------------------------------------------------------ */
import casesJson from "../../../../data/exhibit/cases.json";
import FactValue from "../shared/FactValue";
import PaperCard from "../shared/PaperCard";

interface CaseDef {
  caseId: string;
  name: string;
  citation: string;
  decided: number;
  factRef: string;
  holding: string;
  consequence: string;
  url?: string;
}

const CASES = (casesJson as unknown as { cases: CaseDef[] }).cases;

export default function CasesPanel() {
  return (
    <div data-testid="cases-panel">
      <div className="flex items-center gap-3">
        <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
        <h3 className="exh-plat min-w-0 text-center text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
          The Case Files
        </h3>
        <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
      </div>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-exh-ink-soft">
        Four decisions, in order. The court closed the public door in 1917, left the private one
        open, then shut enforcement down in 1948.
      </p>
      <div className="mt-5 space-y-4">
        {CASES.map((c) => (
          <PaperCard key={c.caseId} data-testid={`case-${c.caseId}`} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-display text-lg text-exh-ink">{c.name}</p>
              <p className="exh-mono text-xs text-exh-ink-soft">
                {c.citation} &middot; {c.decided}
              </p>
            </div>
            <p className="exh-plat mt-3 text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              The holding
            </p>
            <p className="mt-1 text-sm leading-relaxed text-exh-ink">{c.holding}</p>
            <p className="exh-plat mt-3 text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              The consequence
            </p>
            <p className="mt-1 text-sm leading-relaxed text-exh-ink">{c.consequence}</p>
            <div className="mt-3 border-t border-exh-ink/15 pt-2.5">
              <FactValue id={c.factRef} size="sm" />
            </div>
          </PaperCard>
        ))}
      </div>
    </div>
  );
}
