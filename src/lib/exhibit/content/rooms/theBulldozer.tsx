"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M2, THE BULLDOZER (urban renewal). Entered through    */
/*  the door at the tail of chapter eight. The instrument is a         */
/*  document panel: the plan's own condemnation checklist read         */
/*  against three described building types from dossiers.json (each    */
/*  labeled a described composite; the commission and law-test         */
/*  benches were retired with the reader rebuild). The still-running   */
/*  station is the renamed lamp; no Harper Court figure is             */
/*  registered, so the present-day reading stands on the registered    */
/*  TIF siting fact and the Woodlawn record.                           */
/* ------------------------------------------------------------------ */
import dossiersJson from "../../../../../data/exhibit/dossiers.json";
import { MonoNumbers } from "@/components/exhibit/hud/BrassLamp";
import FactValue from "@/components/exhibit/shared/FactValue";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import VoiceCard from "@/components/exhibit/shared/VoiceCard";
import { machineOf } from "@/lib/exhibit/machines";
import { CardGrid, FactCard, PairCard, STATION_EYEBROWS, type RoomStation } from "./shared";

const BULLDOZER = machineOf("bulldozer");

interface DossierParcel {
  parcelId: string;
  title: string;
  described: string;
  checklist: Record<string, boolean>;
  typeNote: string;
}

const DOSSIERS = dossiersJson as unknown as {
  checklistFactRef: string;
  planFactRefs: string[];
  parcels: DossierParcel[];
  verdict: { lesson: string };
};

const CHECK_LABELS: Record<string, string> = {
  age: "Age",
  density: "Density",
  mixedUse: "Mixed use",
  obsolescence: "Obsolescence",
};

/* The dossiers as documents. The checklist prints the way the plan
 * scored it; there is nothing to approve and nothing to protect. */
function TheDossiers() {
  return (
    <div data-testid="room-dossier-panel" className="space-y-4">
      <PaperCard tone="deep" className="p-4 sm:p-5">
        <p className="exh-plat text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
          The plan&rsquo;s checklist
        </p>
        <p className="mt-2 text-sm leading-relaxed text-exh-ink">
          The renewal surveys scored a building on its age, its density, its mix of uses, and its
          so-called obsolescence. Upkeep was not on the form. Anything old, dense, or mixed could
          be condemned.
        </p>
        <div className="mt-2">
          <FactValue id={DOSSIERS.checklistFactRef} size="sm" />
        </div>
      </PaperCard>
      {DOSSIERS.parcels.map((p) => (
        <PaperCard key={p.parcelId} data-testid={`room-dossier-${p.parcelId}`} className="p-4 sm:p-5">
          <p className="font-display text-lg text-exh-ink">{p.title}</p>
          <span className="exh-plat mt-1 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[11px] md:text-[9px] uppercase leading-snug tracking-[0.12em] text-exh-ink-soft">
            {p.typeNote}
          </span>
          <p className="mt-2.5 text-sm leading-relaxed text-exh-ink">{p.described}</p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-exh-ink/15 pt-2.5">
            {Object.entries(p.checklist).map(([key, hit]) => (
              <div key={key} className="flex items-baseline gap-1.5">
                <dt className="exh-plat text-[11px] md:text-[9px] font-semibold uppercase tracking-[0.16em] text-exh-ink-soft">
                  {CHECK_LABELS[key] ?? key}
                </dt>
                <dd className="exh-mono text-xs text-exh-ink">{hit ? "checked" : "clear"}</dd>
              </div>
            ))}
          </dl>
        </PaperCard>
      ))}
      <PaperCard tone="deep" className="p-4 sm:p-5">
        <p className="exh-plat text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
          What the checklist was for
        </p>
        <p className="mt-2 text-sm leading-relaxed text-exh-ink">{DOSSIERS.verdict.lesson}</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {DOSSIERS.planFactRefs.map((id) => (
            <FactValue key={id} id={id} size="sm" />
          ))}
        </div>
      </PaperCard>
    </div>
  );
}

function RenamedPlate() {
  if (!BULLDOZER?.renamedTo || !BULLDOZER.renamedNote) return null;
  return (
    <PaperCard tone="deep" data-testid="room-renamed-plate" className="p-4 sm:p-5">
      <p className="exh-plat text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
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
    lead: "The plan's condemnation checklist, read against three buildings of the kinds it scored.",
    body: <TheDossiers />,
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
          Count the sites against the 1939 to 1940 grades. The steering power moved to a new name and kept
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
