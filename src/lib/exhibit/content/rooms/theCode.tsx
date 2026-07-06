"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M5, THE CODE (the realtors' rule). Entered through a  */
/*  door at the tail of chapter five, beside the deed room's. The      */
/*  instrument is the Ethics Exam rigged bench; the room mounts it     */
/*  fresh because the code has no pause-point bench in the tour. The   */
/*  fight station is deliberately spare: this machine's record holds   */
/*  no march and no lawsuit, only a deletion that followed the courts, */
/*  so the station says exactly that. The still-running station ends   */
/*  on THE COUNTER, a plain subtraction between two registered dates,  */
/*  labeled as arithmetic and nothing more.                            */
/* ------------------------------------------------------------------ */
import { EthicsExam } from "@/components/exhibit/rigged";
import FactValue from "@/components/exhibit/shared/FactValue";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import VoiceCard from "@/components/exhibit/shared/VoiceCard";
import { machineOf } from "@/lib/exhibit/machines";
import { CardGrid, FactCard, STATION_EYEBROWS, type RoomStation } from "./shared";

const CODE = machineOf("code");

/* THE COUNTER. 2020 minus 1924 is arithmetic, not a source; both
 * dates ride their registered facts beside the subtraction. */
function TheCounter() {
  return (
    <PaperCard tone="deep" data-testid="room-code-counter" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        The counter
      </p>
      <p className="exh-mono mt-3 text-2xl text-exh-ink md:text-3xl">2020 - 1924 = 96</p>
      <p className="mt-2 font-display text-lg leading-relaxed text-exh-ink">
        96 years between the rule and the apology.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
        The subtraction is ours. The two dates are the record&rsquo;s.
      </p>
      <div className="mt-3 flex flex-col gap-1.5 border-t border-exh-ink/15 pt-3">
        <FactValue id="code.nareb_article34_1924" size="sm" />
        <FactValue id="code.apology_2020" size="sm" />
      </div>
    </PaperCard>
  );
}

export const THE_CODE_STATIONS: RoomStation[] = [
  {
    id: "instrument",
    eyebrow: STATION_EYEBROWS.instrument,
    lead: "Sit the exam the code set for every member. Answer the way a decent person would and read the marking.",
    body: <EthicsExam />,
  },
  {
    id: "paper",
    eyebrow: STATION_EYEBROWS.paper,
    lead: "The board's vote, the article that took it national, and the year the words came out.",
    body: (
      <div className="space-y-4">
        <FactCard id="code.cireb_expulsion_1921" label="The board votes">
          Unanimous. Selling to a Black buyer on an all-white block cost a member the
          board&rsquo;s listings and standing.
        </FactCard>
        <CardGrid>
          <FactCard id="code.nareb_article34_1924" label="The article">
            Steering became professional ethics nationwide. The exam above holds the article&rsquo;s
            own words.
          </FactCard>
          <FactCard id="code.deleted_1950" label="The deletion">
            The words race and nationality came out. Vaguer language about incompatible occupancy
            stayed behind.
          </FactCard>
        </CardGrid>
      </div>
    ),
  },
  {
    id: "people",
    eyebrow: STATION_EYEBROWS.people,
    lead: "The banker who bought across the line the code defended. His story runs through more than one room of this exhibit.",
    body: (
      <div className="space-y-6">
        <div className="flex justify-center">
          <VoiceCard personId="jesse-binga" />
        </div>
        <FactCard id="bombings.binga_target" label="The price of crossing">
          The 1922 commission report gives the attacks on his realty office and his home their own
          case study.
        </FactCard>
      </div>
    ),
  },
  {
    id: "fight",
    eyebrow: STATION_EYEBROWS.fight,
    lead: CODE?.offBy ?? "The explicit racial language comes out of the code in 1950.",
    body: (
      <FactCard id="code.deleted_1950" label="What actually changed">
        Two years after Shelley versus Kraemer, the explicit words came out of the code. This wall
        holds no march and no lawsuit for this machine. The deletion followed the courts, and
        industry practice changed far more slowly than the text.
      </FactCard>
    ),
  },
  {
    id: "still-running",
    eyebrow: STATION_EYEBROWS["still-running"],
    lead: "The lamp reads off with residue. Read the counter before you go.",
    body: (
      <div className="space-y-4">
        <FactCard id="code.apology_2020" label="The apology" dated>
          The association&rsquo;s first formal apology for the era this room documents.
        </FactCard>
        <TheCounter />
      </div>
    ),
  },
];
