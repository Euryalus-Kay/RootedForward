"use client";
/* ------------------------------------------------------------------ */
/*  THE COUNTER-MACHINE, the sixth room, entered through the door at   */
/*  the tail of chapter ten. It has no machines.json entry, no lamp,   */
/*  and no thesis wall, because it is not a machine; it is the record  */
/*  of what beat them. Four stations: THE ANSWER KEY (the matching     */
/*  board; its pairing data lives here so the cards station reads the  */
/*  same map), THE GEAR TRAIN (locked until all five machine rooms     */
/*  are visited), THE CARDS (the collectible set, derived from         */
/*  visitedRooms), and the honest COLLECTION IN PROGRESS plate for     */
/*  the rebuilding stories whose records are not gathered yet.         */
/* ------------------------------------------------------------------ */
import AnswerKey, { type CounterMoveDef } from "@/components/exhibit/rooms/AnswerKey";
import GearTrain from "@/components/exhibit/rooms/GearTrain";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import { machineTitle } from "@/components/exhibit/hud/BrassLamp";
import { allMachines, COUNTER_ROOM_ID } from "@/lib/exhibit/machines";
import type { MachineId } from "@/lib/exhibit/types";
import { useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import type { RoomStation } from "./shared";

/* ---- the room's nameplate; machines.json has no entry for this door */
export const COUNTER_ROOM = {
  roomId: COUNTER_ROOM_ID,
  /** rendered in uppercase plat contexts as THE COUNTER-MACHINE */
  title: "The Counter-Machine",
  plainName: "What beat them",
  definition:
    "Five machines ran against the neighborhood. None of them switched off on its own. This room holds what did the switching.",
} as const;

/* ---- THE ANSWER KEY data map --------------------------------------- */
/* One entry per machine. The bulldozer's pairing is accepted but       */
/* returns STILL CONTESTED, because that machine has no off year.       */
export const ANSWER_KEY: CounterMoveDef[] = [
  {
    machineId: "deed",
    counterName: "Litigation",
    counterLine: "Carry the clause to the Supreme Court until no court will enforce it.",
    factIds: ["cases.hansberry_1940", "cases.shelley_1948"],
  },
  {
    machineId: "map",
    counterName: "Movement and law",
    counterLine: "Organize until lending discrimination is outlawed, then make the statute work.",
    factIds: ["redlining.fair_housing_1968"],
  },
  {
    machineId: "code",
    counterName: "Exposure and the long apology",
    counterLine: "The explicit words come out of the code. The apology takes far longer.",
    factIds: ["code.deleted_1950", "code.apology_2020"],
  },
  {
    machineId: "contract",
    counterName: "The collective escrow strike",
    counterLine: "Hold every payment in escrow until the contracts are renegotiated.",
    factIds: ["cbl.strike_500", "cbl.renegotiated_155_by_1971"],
  },
  {
    machineId: "bulldozer",
    counterName: "Organized neighbors, holding a line",
    counterLine: "Draw the line at 61st Street, then write the next one into city law.",
    factIds: ["renewal.woodlawn_61st_1964", "present.woodlawn_ordinance_2020"],
    contested: true,
  },
];

/* fixed scramble for the right column; no row faces its own machine */
const COUNTER_ORDER: MachineId[] = ["map", "contract", "deed", "bulldozer", "code"];

const BOARD_CAPTION =
  "Every machine that stopped was stopped by organized neighbors holding a legal lever. The one without a full stop is the one that still needs hands.";

const counterMoveOf = (id: MachineId) => ANSWER_KEY.find((p) => p.machineId === id);

/* ---- THE CARDS, the collectible set --------------------------------- */
/* Collection is derived state: visiting a machine room collects that   */
/* machine's card. No new state, no new action.                         */
function MachineCardsStation() {
  const state = useExhibitState();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {allMachines().map((m) => {
        const collected = state.visitedRooms.includes(m.machineId);
        const move = counterMoveOf(m.machineId);
        if (!collected) {
          return (
            <div
              key={m.machineId}
              data-testid={`machine-card-${m.machineId}`}
              data-collected="false"
              className="rounded-sm border border-dashed border-exh-ink/35 bg-exh-linen-deep/30 p-4 sm:p-5"
            >
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                Machine card
              </p>
              <p className="mt-2 font-display text-xl text-exh-ink-soft">{machineTitle(m)}</p>
              <p className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
                Visit the machine room to collect this card.
              </p>
            </div>
          );
        }
        return (
          <PaperCard
            key={m.machineId}
            tone="deep"
            data-testid={`machine-card-${m.machineId}`}
            data-collected="true"
            className="p-4 sm:p-5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                Machine card
              </p>
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-exh-gold" />
            </div>
            <p className="mt-2 font-display text-xl text-exh-ink">{machineTitle(m)}</p>
            <p className="exh-plat mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
              {m.plainName}
            </p>
            <p className="exh-mono mt-3 text-xs text-exh-ink">
              On {m.onYear} <span className="text-exh-ink-soft">&middot;</span> Off{" "}
              {m.offYear !== null ? m.offYear : "never"}
            </p>
            {move ? (
              <>
                <p className="exh-plat mt-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
                  {move.contested ? "Still contested" : "The counter-move"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-exh-ink">{move.counterName}</p>
              </>
            ) : null}
          </PaperCard>
        );
      })}
    </div>
  );
}

/* ---- COLLECTION IN PROGRESS, the honest closing plate --------------- */
function CollectionInProgress() {
  return (
    <PaperCard data-testid="room-collection-plate" className="p-5 text-center sm:p-6">
      <p className="font-display text-lg leading-relaxed text-exh-ink">
        The neighborhood also built back. Kimbark Plaza, Harper Court, a community savings and
        loan. Those stories join this room as their records are gathered.
      </p>
    </PaperCard>
  );
}

export const COUNTER_STATIONS: RoomStation[] = [
  {
    id: "answer-key",
    eyebrow: "The Answer Key",
    lead: "Five machines, five counter-moves. Match each machine to what beat it, and let the record correct you.",
    body: <AnswerKey pairs={ANSWER_KEY} counterOrder={COUNTER_ORDER} caption={BOARD_CAPTION} />,
  },
  {
    id: "gear-train",
    eyebrow: "The Gear Train",
    lead: "Five gears, one train. Turn any of them and read the mesh points.",
    body: <GearTrain />,
  },
  {
    id: "cards",
    eyebrow: "The Cards",
    lead: "One card per machine room. The set is your receipt for the tour.",
    body: <MachineCardsStation />,
  },
  {
    id: "collection",
    eyebrow: "Collection in Progress",
    body: <CollectionInProgress />,
  },
];
