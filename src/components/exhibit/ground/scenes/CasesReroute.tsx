"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "casesReroute" (#a3-cases). The four covenant cases as    */
/*  one vertical route of exclusion, rebuilt for 390px from the R7     */
/*  CasesFlow station. Time runs down the page. Two lanes, public law  */
/*  and private paper; the red current is the practice of exclusion.   */
/*  Buchanan (1917) bars the public lane and the current bends into    */
/*  the private one; Corrigan (1926) leaves that lane open; Hansberry  */
/*  (1940) cracks the gate (a split bar the current threads); Shelley  */
/*  (1948) bars enforcement and the current bends out toward sales on  */
/*  contract. Tapping a gate opens that ruling below. Content ships    */
/*  from data/exhibit/cases.json unchanged, Justia links included.     */
/* ------------------------------------------------------------------ */
import { useState } from "react";
import casesJson from "../../../../../data/exhibit/cases.json";
import type { SceneProps } from "./registry";
import FactValue from "../../shared/FactValue";
import PaperCard from "../../shared/PaperCard";
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
const VB_H = 600;
const PUBLIC_X = 96;
const PRIVATE_X = 252;
const GATES: Record<string, { x: number; y: number; blurb: string }> = {
  buchanan: { x: PUBLIC_X, y: 116, blurb: "Racial zoning struck down" },
  corrigan: { x: PRIVATE_X, y: 258, blurb: "Challenge dismissed, covenants spread" },
  hansberry: { x: PRIVATE_X, y: 352, blurb: "A Chicago family cracks the gate" },
  shelley: { x: PRIVATE_X, y: 456, blurb: "Courts may not enforce the clauses" },
};

export default function CasesReroute(_props: SceneProps) {
  /* the chapter's own protagonist opens the reading */
  const [selected, setSelected] = useState<string>("hansberry");
  const active = byId.get(selected) ?? CASES[0];

  return (
    <div data-testid="scene-casesReroute">
      <div className="flex items-center gap-3">
        <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
        <h3 className="exh-plat min-w-0 text-center text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
          One route, four rulings
        </h3>
        <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
      </div>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-exh-ink-soft">
        The red line is the practice of exclusion. Where a ruling barred one lane, the
        practice turned into the next.
      </p>
      <p className="exh-plat mx-auto mt-2 max-w-xl text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
        Open any ruling below
      </p>

      <div className="relative mx-auto mt-5 max-w-[24rem]">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={`Diagram of exclusion rerouting around four Supreme Court rulings, read top to bottom. The route runs down a public-law lane, is barred by Buchanan in ${byId.get("buchanan")?.decided}, turns into a private-paper lane, passes Corrigan in ${byId.get("corrigan")?.decided}, threads the gate Hansberry cracked in ${byId.get("hansberry")?.decided}, is barred by Shelley in ${byId.get("shelley")?.decided}, and turns out toward sales on contract.`}
          className="block h-auto w-full"
        >
          {/* lane guides */}
          <line x1={PUBLIC_X} y1={44} x2={PUBLIC_X} y2={560} stroke="#1C1A17" strokeOpacity={0.14} strokeDasharray="2 6" />
          <line x1={PRIVATE_X} y1={44} x2={PRIVATE_X} y2={560} stroke="#1C1A17" strokeOpacity={0.14} strokeDasharray="2 6" />
          <text x={PUBLIC_X} y={20} textAnchor="middle" className="exh-plat" fontSize={11} letterSpacing={2} fill="#4A453D">
            PUBLIC LAW
          </text>
          <text x={PRIVATE_X} y={20} textAnchor="middle" className="exh-plat" fontSize={11} letterSpacing={2} fill="#4A453D">
            PRIVATE PAPER
          </text>
          <text x={14} y={38} textAnchor="start" fontSize={11} fontStyle="italic" fill="#4A453D">
            city ordinances draw the line
          </text>
          <text x={346} y={56} textAnchor="end" fontSize={11} fontStyle="italic" fill="#4A453D">
            deeds and covenants draw it next
          </text>

          {/* the current: down the public lane, barred, into the private
              lane, through the cracked gate, barred again, out toward
              sales on contract */}
          <path
            d="M96 44 V88 C96 122 120 142 160 146 L188 149 C226 153 252 174 252 208 V424 C252 448 234 462 206 468 L196 470 C168 476 148 492 148 518 V548"
            fill="none"
            stroke="var(--color-exh-red, #B0322B)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* arrowhead out */}
          <path d="M148 556 l-7 -12 h14 Z" fill="var(--color-exh-red, #B0322B)" />

          {/* Buchanan bars the public lane */}
          <rect x={60} y={112} width={72} height={7} rx={2} fill="#1C1A17" />

          {/* Corrigan leaves the private lane open */}
          <circle cx={PRIVATE_X} cy={258} r={8} fill="#EDE6D6" stroke="#1C1A17" strokeWidth={2.5} />

          {/* Hansberry cracks the gate: a split bar the current threads */}
          <rect x={214} y={348} width={28} height={7} rx={2} fill="#1C1A17" />
          <rect x={262} y={348} width={28} height={7} rx={2} fill="#1C1A17" />
          <circle cx={PRIVATE_X} cy={352} r={8} fill="#EDE6D6" stroke="#1C1A17" strokeWidth={2.5} />

          {/* Shelley bars enforcement */}
          <rect x={208} y={452} width={88} height={7} rx={2} fill="#1C1A17" />

          {/* labels, chronological down the page */}
          <g className="exh-plat" fontSize={12} fontWeight={600} fill="#1C1A17">
            <text x={14} y={166}>{byId.get("buchanan")?.decided} &middot; Buchanan v. Warley</text>
            <text x={228} y={262} textAnchor="end">{byId.get("corrigan")?.decided} &middot; Corrigan v. Buckley</text>
            <text x={204} y={330} textAnchor="end">{byId.get("hansberry")?.decided} &middot; Hansberry v. Lee</text>
            <text x={346} y={484} textAnchor="end">{byId.get("shelley")?.decided} &middot; Shelley v. Kraemer</text>
          </g>
          <g fontSize={11} fontStyle="italic" fill="#4A453D">
            <text x={14} y={181}>{GATES.buchanan.blurb}</text>
            <text x={228} y={277} textAnchor="end">{GATES.corrigan.blurb}</text>
            <text x={204} y={345} textAnchor="end">{GATES.hansberry.blurb}</text>
            <text x={346} y={499} textAnchor="end">{GATES.shelley.blurb}</text>
            <text x={164} y={534}>the route turns again,</text>
            <text x={164} y={548}>to sales on contract</text>
          </g>

          {/* selected gate ring, a double ink ring; never grade pigment */}
          {selected in GATES && (
            <g data-testid="cases-reroute-ring">
              <circle
                cx={GATES[selected].x}
                cy={GATES[selected].y}
                r={18}
                fill="none"
                stroke="#1C1A17"
                strokeWidth={1.25}
              />
              <circle
                cx={GATES[selected].x}
                cy={GATES[selected].y}
                r={14}
                fill="none"
                stroke="#1C1A17"
                strokeWidth={2.5}
              />
            </g>
          )}
        </svg>

        {/* hit targets over the gates, placed by viewBox fractions */}
        {CASES.map((c) => {
          const g = GATES[c.caseId];
          if (!g) return null;
          const current = c.caseId === selected;
          return (
            <button
              key={c.caseId}
              type="button"
              data-testid={`case-${c.caseId}`}
              aria-pressed={current}
              aria-controls="cases-ruling-card"
              aria-label={`${c.name}, ${c.decided}. ${g.blurb}. Opens the ruling below.`}
              onClick={() => setSelected(c.caseId)}
              className={cn(
                "absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-exh-blue"
              )}
              style={{ left: `${(g.x / VB_W) * 100}%`, top: `${(g.y / VB_H) * 100}%` }}
            />
          );
        })}
      </div>

      <p className="mx-auto mt-1 max-w-[24rem] text-center text-[11px] italic leading-snug text-exh-ink-soft">
        Solid bars mark rulings that closed a lane. The split bar marks the crack.
      </p>
      <p className="exh-plat mx-auto mt-1 max-w-[24rem] text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
        Open any ruling below
      </p>

      {/* the selected ruling, one card instead of four */}
      <PaperCard id="cases-ruling-card" data-testid="case-detail" className="mt-4 p-4 sm:p-5">
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
