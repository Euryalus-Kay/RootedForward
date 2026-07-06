"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M2, THE BULLDOZER (urban renewal). Entered through    */
/*  the door at the tail of chapter eight. The instrument runs two     */
/*  benches, the commission seat and then the law test. The still-     */
/*  running station is the renamed lamp; no Harper Court figure is     */
/*  registered, so the present-day reading stands on the registered    */
/*  TIF siting fact and the Woodlawn record.                           */
/* ------------------------------------------------------------------ */
import { TestTheLaw, YouAreTheCommission } from "@/components/exhibit/rigged";
import { MonoNumbers } from "@/components/exhibit/hud/BrassLamp";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import VoiceCard from "@/components/exhibit/shared/VoiceCard";
import { machineOf } from "@/lib/exhibit/machines";
import { CardGrid, FactCard, PairCard, STATION_EYEBROWS, type RoomStation } from "./shared";

const BULLDOZER = machineOf("bulldozer");

function RenamedPlate() {
  if (!BULLDOZER?.renamedTo || !BULLDOZER.renamedNote) return null;
  return (
    <PaperCard tone="deep" data-testid="room-renamed-plate" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        Renamed
      </p>
      <p className="mt-2 font-display text-2xl text-exh-ink">{BULLDOZER.renamedTo}</p>
      <p className="mt-2 text-sm leading-relaxed text-exh-ink">
        <MonoNumbers text={BULLDOZER.renamedNote} />
      </p>
    </PaperCard>
  );
}

export const THE_BULLDOZER_STATIONS: RoomStation[] = [
  {
    id: "instrument",
    eyebrow: STATION_EYEBROWS.instrument,
    lead: "Two benches. Take the commission's seat first, then test the law it worked with.",
    body: (
      <div className="space-y-10">
        <YouAreTheCommission />
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-exh-ink/20" />
            <h4 className="exh-plat shrink-0 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
              A second bench. Test the law
            </h4>
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-exh-ink/20" />
          </div>
          <TestTheLaw />
        </div>
      </div>
    ),
  },
  {
    id: "paper",
    eyebrow: STATION_EYEBROWS.paper,
    lead: "The plan on paper, and the sentence its chancellor used for it.",
    body: (
      <div className="space-y-4">
        <CardGrid>
          <FactCard id="renewal.plan_856_acres" label="The plan" />
          <FactCard id="renewal.buildings_638" label="Marked to come down" />
        </CardGrid>
        <FactCard id="renewal.university_29m" label="The university's own money">
          Chancellor Kimpton&rsquo;s accounting of what the university committed to buy, control,
          and rebuild the neighborhood.
        </FactCard>
        <FactCard id="renewal.kimpton_framing" label="The stated goal">
          What the chancellor said the clearance was for is preserved in the record. The citation
          carries his words.
        </FactCard>
      </div>
    ),
  },
  {
    id: "people",
    eyebrow: STATION_EYEBROWS.people,
    lead: "A writer gave the machine its plain name. The return counts did the arithmetic.",
    body: (
      <div className="space-y-6">
        <div className="flex justify-center">
          <VoiceCard personId="james-baldwin" />
        </div>
        <PairCard
          label="Who came back"
          aId="renewal.white_return_46pct"
          bId="renewal.black_return_17pct"
          footer="Counted in the first projects, Hyde Park A and B. Who returned was a choice, made in the plan."
        />
      </div>
    ),
  },
  {
    id: "fight",
    eyebrow: STATION_EYEBROWS.fight,
    lead: "South of the Midway, Woodlawn organized before the blade reached them.",
    body: (
      <FactCard id="renewal.woodlawn_61st_1964" label="The 61st Street line">
        Organizing against the university&rsquo;s South Campus expansion won a commitment that it
        would not build past 61st Street.
      </FactCard>
    ),
  },
  {
    id: "still-running",
    eyebrow: STATION_EYEBROWS["still-running"],
    lead: "This lamp never switched off. Read the nameplate.",
    body: (
      <div className="space-y-4">
        <RenamedPlate />
        <FactCard id="present.holc_subsidy_siting" label="Where TIF lands today" dated>
          Count the sites against the 1938 grades. The steering power moved to a new name and kept
          its geography.
        </FactCard>
        <CardGrid>
          <FactCard id="present.woodlawn_ordinance_2020" label="The counterweight" dated>
            Woodlawn organized again, this time before the pressure arrived.
          </FactCard>
          <FactCard id="present.audit_2026" label="Five years on" dated />
        </CardGrid>
      </div>
    ),
  },
];
