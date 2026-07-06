"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M4, THE DEED (restrictive covenants). Entered through */
/*  a door at the tail of chapter five. The machine's bench, Read the  */
/*  Deed, stays at its ch5 pause point; rooms never remount pause-     */
/*  point interactives, so the instrument here is a cross-reference    */
/*  card plus STRIKE THE CLAUSE, a static primary-text panel. The      */
/*  panel is deliberately paper only (the honest deferral): Shelley's  */
/*  holding, the residue line from machines.json, and the registered   */
/*  Illinois removal-process fact, with a provenance chip noting that  */
/*  the removal walkthrough ships after counsel review. No interactive */
/*  legal tool is mounted here.                                        */
/* ------------------------------------------------------------------ */
import FactValue from "@/components/exhibit/shared/FactValue";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import VoiceCard from "@/components/exhibit/shared/VoiceCard";
import { MonoNumbers } from "@/components/exhibit/hud/BrassLamp";
import { machineOf } from "@/lib/exhibit/machines";
import {
  CardGrid,
  FactCard,
  RecordCard,
  STATION_EYEBROWS,
  type RoomStation,
} from "./shared";

const DEED = machineOf("deed");

function ReadTheDeedCrossReference() {
  return (
    <PaperCard tone="deep" data-testid="room-read-deed-crossref" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        Worked at the bench
      </p>
      <p className="mt-2 font-display text-xl text-exh-ink">Read the Deed</p>
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        You open the covenant clause by clause and watch the template tile across the map. The
        bench sits at its pause point in chapter five, Racism Goes Professional, just outside this
        door. It stays in the tour so your work there is never disturbed.
      </p>
    </PaperCard>
  );
}

/* STRIKE THE CLAUSE. Static by design; the room states what the law
 * did, what stayed on paper, and what Illinois built, and defers the
 * how-to until counsel has reviewed it. */
function StrikeTheClause() {
  return (
    <PaperCard tone="deep" data-testid="room-strike-clause" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        The holding
      </p>
      <p className="mt-2 font-display text-xl leading-relaxed text-exh-ink">
        Judicial enforcement of racially restrictive covenants is state action barred by the
        Fourteenth Amendment.
      </p>
      <div className="mt-2">
        <FactValue id="cases.shelley_1948" />
      </div>

      <p className="exh-plat mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        What the ruling left on paper
      </p>
      {DEED ? (
        <p className="mt-2 text-sm leading-relaxed text-exh-ink">
          <MonoNumbers text={DEED.residue} />
        </p>
      ) : null}

      <p className="exh-plat mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        Striking it today
      </p>
      <div className="mt-2">
        <FactValue id="redlining.illinois_removal_2022" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        This panel is paper only. The exhibit does not walk you through a legal filing.
      </p>
      <span className="exh-plat mt-3 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
        the removal walkthrough ships after counsel review
      </span>
    </PaperCard>
  );
}

export const THE_DEED_STATIONS: RoomStation[] = [
  {
    id: "instrument",
    eyebrow: STATION_EYEBROWS.instrument,
    lead: "The bench for this machine is in the tour itself. The panel here is the part that is still paperwork today.",
    body: (
      <div className="space-y-10">
        <ReadTheDeedCrossReference />
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-exh-ink/20" />
            <h4 className="exh-plat shrink-0 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
              Strike the clause
            </h4>
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-exh-ink/20" />
          </div>
          <StrikeTheClause />
        </div>
      </div>
    ),
  },
  {
    id: "paper",
    eyebrow: STATION_EYEBROWS.paper,
    lead: "The template, the boast, the budget, and the signature count that finally mattered.",
    body: (
      <div className="space-y-4">
        <FactCard id="covenants.macchesney_template" label="The template">
          One printed form, drafted the year after Corrigan, let any block adopt the clause at
          once.
        </FactCard>
        <FactCard id="covenants.chain_armor_quote" label="The boast">
          The neighborhood press praised the covenants as a chain of armor around the blocks. The
          famous wording awaits its archival clipping, so the wall carries the characterization,
          not the quotation.
        </FactCard>
        <CardGrid>
          <FactCard id="covenants.uchicago_defense_83597" label="The budget">
            University subsidies to the neighborhood associations that ran the covenant defense,
            counted in Arnold Hirsch&rsquo;s study.
          </FactCard>
          <FactCard id="covenants.hansberry_frontage_54pct" label="The signature count">
            The Washington Park covenant took effect only if enough frontage owners signed. They
            never had the names they claimed.
          </FactCard>
        </CardGrid>
      </div>
    ),
  },
  {
    id: "people",
    eyebrow: STATION_EYEBROWS.people,
    lead: "A neighbor the campaign tried to purge, and the child whose family cracked the armor.",
    body: (
      <div className="flex flex-wrap items-start justify-center gap-10">
        <VoiceCard personId="fannie-barrier-williams" />
        <VoiceCard personId="lorraine-hansberry" />
      </div>
    ),
  },
  {
    id: "fight",
    eyebrow: STATION_EYEBROWS.fight,
    lead: "Four cases. The court closed the public door in 1917, left the private one open, then shut enforcement down in 1948.",
    body: (
      <div className="space-y-4">
        <FactCard id="cases.buchanan_1917" label="First, the ordinance falls">
          City ordinances zoning blocks by race violate the Fourteenth Amendment. Segregation
          moved into private deeds, which the ruling did not touch.
        </FactCard>
        <FactCard id="cases.corrigan_1926" label="The covenant stands">
          A challenge to a private covenant was dismissed. The industry read the dismissal as a
          green light, and the clauses spread.
        </FactCard>
        <FactCard id="cases.hansberry_1940" label="The crack">
          The old judgment upholding the Washington Park covenant could not bind the Hansberrys.
          The family kept the house. The clauses themselves still stood.
        </FactCard>
        <FactCard id="cases.shelley_1948" label="Enforcement ends">
          No court may enforce a racial covenant. The armor failed where it had always done its
          work, at the courthouse.
        </FactCard>
      </div>
    ),
  },
  {
    id: "still-running",
    eyebrow: STATION_EYEBROWS["still-running"],
    lead: "The lamp reads off with residue. The residue is in the county record.",
    body: (
      <div className="space-y-4">
        {DEED ? (
          <PaperCard tone="deep" data-testid="room-residue-card" className="p-4 sm:p-5">
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              The residue
            </p>
            <p className="mt-2 font-display text-xl leading-relaxed text-exh-ink">{DEED.residue}</p>
            <p className="exh-plat mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              The record behind this lamp
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {DEED.evidenceFactRefs.map((id) => (
                <FactValue key={id} id={id} size="sm" />
              ))}
            </div>
          </PaperCard>
        ) : null}
        <FactCard id="redlining.illinois_removal_2022" label="The paper trail" dated>
          The formal way to strike the dead language from a deed arrived decades after enforcement
          ended.
        </FactCard>
      </div>
    ),
  },
];
