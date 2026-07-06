"use client";
/* ------------------------------------------------------------------ */
/*  DoorCard, the live doorway into a machine room, rendered by        */
/*  BlockRenderer for "door" stage blocks at the tail of a machine's   */
/*  home chapter. A nameplate, the machine's one-line definition as    */
/*  the invitation, and a 48px Enter control that dispatches           */
/*  OPEN_ROOM. A quiet gold ember marks doors already visited this     */
/*  session. Machines whose rooms are not built yet (M4 deed, M5       */
/*  code, next milestone) keep the honest in-production wording.       */
/* ------------------------------------------------------------------ */
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { machineOf } from "@/lib/exhibit/machines";
import { ROOM_STATIONS } from "@/lib/exhibit/content/rooms";
import type { MachineId } from "@/lib/exhibit/types";
import PaperCard from "../shared/PaperCard";
import { machineTitle } from "../hud/BrassLamp";

export interface DoorCardProps {
  roomId: string;
  /** fallback nameplate from the stage block */
  label: string;
}

export default function DoorCard({ roomId, label }: DoorCardProps) {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();

  const machine = machineOf(roomId);
  const built = !!ROOM_STATIONS[roomId as MachineId];
  const visited = state.visitedRooms.includes(roomId);

  /* an unknown or not-yet-built room keeps the honest closed door */
  if (!machine || !built) {
    return (
      <div
        data-room-id={roomId}
        data-testid={`door-${roomId}`}
        className="border border-dashed border-exh-ink/35 bg-exh-linen-deep/30 px-5 py-6"
      >
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Machine room
        </p>
        <p className="mt-2 font-display text-lg text-exh-ink">{machine ? machineTitle(machine) : label}</p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="exh-plat mt-4 min-h-12 cursor-not-allowed border border-exh-ink/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink-soft"
        >
          Opening in the next phase
        </button>
      </div>
    );
  }

  const title = machineTitle(machine);

  return (
    <PaperCard
      tone="deep"
      data-room-id={roomId}
      data-testid={`door-${roomId}`}
      data-visited={String(visited)}
      className="px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
          Machine room
        </p>
        {visited ? (
          <span className="exh-plat inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-exh-gold" />
            Visited
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl text-exh-ink md:text-3xl">{title}</p>
      <p className="exh-plat mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
        {machine.plainName}
      </p>
      <p className="mt-4 max-w-prose text-sm leading-relaxed text-exh-ink">{machine.definition}</p>
      <button
        type="button"
        data-testid={`door-enter-${roomId}`}
        aria-label={`Enter the machine room, ${title}, ${machine.plainName}`}
        onClick={() => dispatch({ type: "OPEN_ROOM", roomId })}
        className="exh-plat mt-6 inline-flex min-h-12 cursor-pointer items-center border border-exh-ink bg-exh-ink px-6 text-xs font-semibold uppercase tracking-[0.2em] text-exh-linen transition-colors duration-200 hover:bg-exh-linen hover:text-exh-ink"
      >
        Enter the room
      </button>
    </PaperCard>
  );
}
