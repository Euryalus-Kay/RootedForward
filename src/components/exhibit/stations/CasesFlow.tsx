"use client";
/* ------------------------------------------------------------------ */
/*  The four covenant cases drawn as one route of exclusion (ch7).     */
/*  A single red current runs down two lanes, public law and private   */
/*  paper. Buchanan (1917) bars the public lane and the current bends  */
/*  right; Corrigan (1926) and Hansberry (1940) sit on the private     */
/*  run; Shelley (1948) bars it and the current bends again, out       */
/*  toward sales on contract. Tapping a junction opens that ruling     */
/*  below. Content ships from data/exhibit/cases.json unchanged.       */
/* ------------------------------------------------------------------ */
import { useState } from "react";
import casesJson from "../../../../data/exhibit/cases.json";
import FactValue from "../shared/FactValue";
import PaperCard from "../shared/PaperCard";
import { cn } from "@/lib/utils";

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
const byId = new Map(CASES.map((c) => [c.caseId, c]));

/* viewBox geometry; the DOM hit targets are placed by these numbers */
const VB_W = 360;
const VB_H = 478;
const JUNCTIONS: Record<string, { x: number; y: number; blurb: string }> = {
  buchanan: { x: 100, y: 106, blurb: "Racial zoning struck down" },
  corrigan: { x: 260, y: 220, blurb: "Challenge dismissed, covenants spread" },
  hansberry: { x: 260, y: 282, blurb: "A Chicago family dents the armor" },
  shelley: { x: 260, y: 348, blurb: "Courts may not enforce the clauses" },
};

export default function CasesFlow() {
  /* the chapter's own protagonist opens the reading */
  const [selected, setSelected] = useState<string>("hansberry");
  const active = byId.get(selected) ?? CASES[0];

  return (
    <div data-testid="cases-flow">
      <div className="flex items-center gap-3">
        <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
        <h3 className="exh-plat min-w-0 text-center text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
          One route, four rulings
        </h3>
        <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
      </div>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-exh-ink-soft">
        The red line is the practice of exclusion. Each ruling closed one route. The line did not
        stop; it turned.
      </p>

      <div className="relative mx-auto mt-5 max-w-[26rem]">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label="Diagram of exclusion rerouting around four Supreme Court rulings. The route runs down a public-law lane, is barred in 1917, turns into a private-paper lane past 1926 and 1940, is barred again in 1948, and turns out toward sales on contract."
          className="block h-auto w-full"
        >
          {/* lane guides */}
          <line x1={100} y1={44} x2={100} y2={452} stroke="#1C1A17" strokeOpacity={0.14} strokeDasharray="2 6" />
          <line x1={260} y1={44} x2={260} y2={452} stroke="#1C1A17" strokeOpacity={0.14} strokeDasharray="2 6" />
          <text x={100} y={20} textAnchor="middle" className="exh-plat" fontSize={11} letterSpacing={2} fill="#4A453D">
            PUBLIC LAW
          </text>
          <text x={260} y={20} textAnchor="middle" className="exh-plat" fontSize={11} letterSpacing={2} fill="#4A453D">
            PRIVATE PAPER
          </text>
          <text x={14} y={38} textAnchor="start" fontSize={11} fontStyle="italic" fill="#4A453D">
            city ordinances draw the line
          </text>
          <text x={346} y={52} textAnchor="end" fontSize={11} fontStyle="italic" fill="#4A453D">
            deeds and covenants draw it next
          </text>

          {/* the current: down the public lane, bend right, down, bend out */}
          <path
            d="M100 44 V78 C100 106 118 122 150 126 L216 130 C242 133 260 150 260 176 V318 C260 348 244 366 212 372 L200 374 C174 379 160 394 160 420 V446"
            fill="none"
            stroke="#B0322B"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* arrowhead out */}
          <path d="M160 446 l-7 -12 h14 Z" fill="#B0322B" />

          {/* barriers: the rulings that closed a lane */}
          <rect x={60} y={102} width={68} height={7} rx={2} fill="#1C1A17" />
          <rect x={216} y={344} width={88} height={7} rx={2} fill="#1C1A17" />

          {/* junction nodes on the private run */}
          <circle cx={260} cy={220} r={8} fill="#EDE6D6" stroke="#1C1A17" strokeWidth={2.5} />
          <circle cx={260} cy={282} r={8} fill="#EDE6D6" stroke="#1C1A17" strokeWidth={2.5} />

          {/* labels */}
          <g className="exh-plat" fontSize={12} fontWeight={600} fill="#1C1A17">
            <text x={14} y={136}>1917 &middot; Buchanan v. Warley</text>
            <text x={238} y={224} textAnchor="end">1926 &middot; Corrigan v. Buckley</text>
            <text x={238} y={286} textAnchor="end">1940 &middot; Hansberry v. Lee</text>
            <text x={346} y={400} textAnchor="end">1948 &middot; Shelley v. Kraemer</text>
          </g>
          <g fontSize={11} fontStyle="italic" fill="#4A453D">
            <text x={14} y={151}>{JUNCTIONS.buchanan.blurb}</text>
            <text x={238} y={239} textAnchor="end">{JUNCTIONS.corrigan.blurb}</text>
            <text x={238} y={301} textAnchor="end">{JUNCTIONS.hansberry.blurb}</text>
            <text x={346} y={415} textAnchor="end">{JUNCTIONS.shelley.blurb}</text>
            <text x={176} y={442}>the route turns again,</text>
            <text x={176} y={456}>to sales on contract</text>
          </g>

          {/* selected junction ring */}
          {selected in JUNCTIONS && (
            <circle
              cx={JUNCTIONS[selected].x}
              cy={JUNCTIONS[selected].y}
              r={15}
              fill="none"
              stroke="#C9A227"
              strokeWidth={3}
              data-testid="cases-flow-ring"
            />
          )}
        </svg>

        {/* hit targets over the junctions, placed by viewBox fractions */}
        {CASES.map((c) => {
          const j = JUNCTIONS[c.caseId];
          if (!j) return null;
          const current = c.caseId === selected;
          return (
            <button
              key={c.caseId}
              type="button"
              data-testid={`case-${c.caseId}`}
              aria-pressed={current}
              aria-label={`${c.name}, ${c.decided}. ${j.blurb}. Opens the ruling below.`}
              onClick={() => setSelected(c.caseId)}
              className={cn(
                "absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-exh-blue"
              )}
              style={{ left: `${(j.x / VB_W) * 100}%`, top: `${(j.y / VB_H) * 100}%` }}
            />
          );
        })}
      </div>

      <p className="mx-auto mt-1 max-w-[26rem] text-center text-[11px] italic leading-snug text-exh-ink-soft">
        The bars mark rulings that closed a lane.
      </p>

      {/* the selected ruling, one card instead of four */}
      <PaperCard data-testid="case-detail" className="mt-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-display text-lg text-exh-ink">{active.name}</p>
          <p className="exh-mono text-xs text-exh-ink-soft">
            {active.citation} &middot; {active.decided}
          </p>
        </div>
        <p className="exh-plat mt-3 text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
          The holding
        </p>
        <p className="mt-1 text-sm leading-relaxed text-exh-ink">{active.holding}</p>
        <p className="exh-plat mt-3 text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
          The consequence
        </p>
        <p className="mt-1 text-sm leading-relaxed text-exh-ink">{active.consequence}</p>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-exh-ink/15 pt-2.5">
          <FactValue id={active.factRef} size="sm" />
          {active.url && (
            <a
              href={active.url}
              target="_blank"
              rel="noreferrer"
              className="exh-plat text-[11px] font-semibold uppercase tracking-[0.16em] text-exh-ink-soft underline decoration-exh-ink/30 underline-offset-2 hover:text-exh-ink"
            >
              The opinion, at Justia
            </a>
          )}
        </div>
      </PaperCard>
    </div>
  );
}
