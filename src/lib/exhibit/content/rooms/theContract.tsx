"use client";
/* ------------------------------------------------------------------ */
/*  Machine room M3, THE CONTRACT (contract selling). Entered through  */
/*  the door at the tail of chapter nine. The machine's bench, Two     */
/*  Buyers One House, stays at its pause point in the tour; rooms      */
/*  never remount pause-point interactives, so the instrument here is  */
/*  a cross-reference card plus the room's own circuit, FOLLOW THE     */
/*  DOLLAR. The still-running station is the machines.json residue     */
/*  line sourced to the machine's registered evidence, exactly and     */
/*  only what the record supports.                                     */
/* ------------------------------------------------------------------ */
import FollowTheDollar from "@/components/exhibit/rooms/FollowTheDollar";
import FactValue from "@/components/exhibit/shared/FactValue";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import VoiceCard from "@/components/exhibit/shared/VoiceCard";
import { machineOf } from "@/lib/exhibit/machines";
import { CardGrid, FactCard, STATION_EYEBROWS, type RoomStation } from "./shared";

const CONTRACT = machineOf("contract");

function TwoBuyersCrossReference() {
  return (
    <PaperCard tone="deep" data-testid="room-two-buyers-crossref" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        Worked at the bench
      </p>
      <p className="mt-2 font-display text-xl text-exh-ink">Two Buyers, One House</p>
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        You slide the years and watch two families pay for the same house. The bench sits at its
        pause point in chapter nine, The Color Tax, just outside this door. It stays in the tour
        so your work there is never disturbed.
      </p>
    </PaperCard>
  );
}

function ResidueCard() {
  if (!CONTRACT) return null;
  return (
    <PaperCard tone="deep" data-testid="room-residue-card" className="p-4 sm:p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        The residue
      </p>
      <p className="mt-2 font-display text-xl leading-relaxed text-exh-ink">{CONTRACT.residue}</p>
      <p className="exh-plat mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        The record behind this lamp
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        {CONTRACT.evidenceFactRefs.map((id) => (
          <FactValue key={id} id={id} size="sm" />
        ))}
      </div>
    </PaperCard>
  );
}

export const THE_CONTRACT_STATIONS: RoomStation[] = [
  {
    id: "instrument",
    eyebrow: STATION_EYEBROWS.instrument,
    lead: "The bench for this machine is in the tour itself. This room adds the circle the money traveled.",
    body: (
      <div className="space-y-10">
        <TwoBuyersCrossReference />
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-exh-ink/20" />
            <h4 className="exh-plat shrink-0 text-[11px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
              Follow the dollar
            </h4>
            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-exh-ink/20" />
          </div>
          <FollowTheDollar />
        </div>
      </div>
    ),
  },
  {
    id: "paper",
    eyebrow: STATION_EYEBROWS.paper,
    lead: "What the trade charged, in the study that finally counted it.",
    body: (
      <div className="space-y-4">
        <FactCard id="contracts.share_75_95" label="How much of the market" />
        <CardGrid>
          <FactCard id="contracts.markup_84pct" label="The markup" />
          <FactCard id="contracts.extra_monthly_587" label="Every month" />
        </CardGrid>
      </div>
    ),
  },
  {
    id: "people",
    eyebrow: STATION_EYEBROWS.people,
    lead: "Two buyers who stood up in the church basement and read out what they had paid.",
    body: (
      <div className="flex flex-wrap items-start justify-center gap-10">
        <VoiceCard personId="clyde-ross" />
        <VoiceCard personId="ruth-wells" />
      </div>
    ),
  },
  {
    id: "fight",
    eyebrow: STATION_EYEBROWS.fight,
    lead: "The Contract Buyers League held the payments in escrow until the contracts changed.",
    body: (
      <div className="space-y-4">
        <CardGrid>
          <FactCard id="cbl.strike_500" label="The strike" />
          <FactCard id="cbl.renegotiated_155_by_1971" label="Renegotiated" />
        </CardGrid>
        <CardGrid>
          <FactCard id="cbl.savings" label="What renegotiation returned" />
          <FactCard id="cbl.evicted_70" label="The price">
            The strike had casualties. These families never got their homes back.
          </FactCard>
        </CardGrid>
      </div>
    ),
  },
  {
    id: "still-running",
    eyebrow: STATION_EYEBROWS["still-running"],
    lead: "The lamp reads off with residue. The residue has a date.",
    body: <ResidueCard />,
  },
];
