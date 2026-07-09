"use client";
/* ------------------------------------------------------------------ */
/*  THE COUNTER-MACHINE, the sixth room, entered through the door at   */
/*  the tail of chapter ten. It has no machines.json entry, no lamp,   */
/*  and no thesis wall, because it is not a machine; it is the record  */
/*  of what beat them. The matching game and the gear train were       */
/*  retired with the reader rebuild; the room now reads as documents:  */
/*  THE ANSWER KEY (each machine beside the counter-move that stopped  */
/*  it, every pairing sourced) and the honest COLLECTION IN PROGRESS   */
/*  plate for the rebuilding stories whose records are not gathered    */
/*  yet.                                                               */
/* ------------------------------------------------------------------ */
import FactValue from "@/components/exhibit/shared/FactValue";
import PaperCard from "@/components/exhibit/shared/PaperCard";
import { machineTitle } from "@/components/exhibit/hud/BrassLamp";
import { COUNTER_ROOM_ID, machineOf } from "@/lib/exhibit/machines";
import type { MachineId } from "@/lib/exhibit/types";
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

/* ---- THE ANSWER KEY, as a document ---------------------------------- */
/* One entry per machine. The bulldozer's row reads STILL CONTESTED,     */
/* because that machine has no off year.                                 */

export interface CounterMoveDef {
  machineId: MachineId;
  counterName: string;
  counterLine: string;
  factIds: string[];
  contested?: boolean;
}

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

const BOARD_CAPTION =
  "Every machine that stopped was stopped by organized neighbors holding a legal lever. The one without a full stop is the one that still needs hands.";

function AnswerKeyPanel() {
  return (
    <div data-testid="room-answer-key" className="space-y-4">
      {ANSWER_KEY.map((move) => {
        const machine = machineOf(move.machineId);
        if (!machine) return null;
        return (
          <PaperCard
            key={move.machineId}
            data-testid={`answer-row-${move.machineId}`}
            className="p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-display text-lg text-exh-ink">{machineTitle(machine)}</p>
              <p className="exh-mono text-xs text-exh-ink-soft">
                On {machine.onYear} &middot; Off{" "}
                {machine.offYear !== null ? machine.offYear : "never"}
              </p>
            </div>
            <p className="exh-plat mt-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
              {move.contested ? "Still contested" : "What stopped it"}
            </p>
            {move.contested ? (
              <span
                data-testid="answer-still-contested"
                className="exh-plat mt-1 inline-block rounded-[2px] border-2 border-exh-ink px-1.5 py-0.5 text-[9px] font-bold uppercase leading-snug tracking-[0.12em] text-exh-ink"
              >
                no off year in the record
              </span>
            ) : null}
            <p className="mt-1.5 text-sm leading-relaxed text-exh-ink">
              <span className="font-semibold">{move.counterName}.</span> {move.counterLine}
            </p>
            <div className="mt-2 flex flex-col gap-1.5 border-t border-exh-ink/15 pt-2.5">
              {move.factIds.map((id) => (
                <FactValue key={id} id={id} size="sm" />
              ))}
            </div>
          </PaperCard>
        );
      })}
      <p className="max-w-prose text-sm leading-relaxed text-exh-ink-soft">{BOARD_CAPTION}</p>
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
    lead: "Five machines, five counter-moves, each pairing carried by its record.",
    body: <AnswerKeyPanel />,
  },
  {
    id: "collection",
    eyebrow: "Collection in Progress",
    body: <CollectionInProgress />,
  },
];
