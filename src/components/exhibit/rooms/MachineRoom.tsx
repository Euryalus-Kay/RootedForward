"use client";
/* ------------------------------------------------------------------ */
/*  MachineRoom, the six-station floor plan every machine room         */
/*  follows. Station one is the THESIS WALL, rendered here straight    */
/*  from machines.json (what it was, when it ran, who ran it) with     */
/*  the machine's lamp state live from exhibit state. The remaining    */
/*  five stations (THE INSTRUMENT, THE PAPER, THE PEOPLE, THE FIGHT,   */
/*  STILL RUNNING?) come from the room's content module in             */
/*  src/lib/exhibit/content/rooms. Rooms are the exhibit's deep        */
/*  material; the text runs denser than the tour but stays museum      */
/*  quiet.                                                             */
/* ------------------------------------------------------------------ */
import { useMemo, type ReactNode } from "react";
import type { LampState } from "@/lib/exhibit/types";
import { COUNTER_ROOM_ID, machineOf, type RoomId } from "@/lib/exhibit/machines";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { COUNTER_ROOM, ROOM_STATIONS, type RoomStation } from "@/lib/exhibit/content/rooms";
import { InteractiveContext, type InteractiveApi } from "../interactives/InteractiveContext";
import { LampDisc, MonoNumbers, machineTitle, stateSentence } from "../hud/BrassLamp";
import PaperCard from "../shared/PaperCard";

export interface MachineRoomProps {
  roomId: RoomId;
}

/* Room stations read the same InteractiveContext contract the flow's
 * station blocks provide. A room station is always live; completion
 * and interaction pings are no-ops, while firedOnce/markFired keep
 * once-per-session moments honest. */
function RoomInstrumentScope({ children }: { children: ReactNode }) {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const firedOnceList = state.firedOnce;
  const reducedMotion = state.reducedMotion;
  const api = useMemo<InteractiveApi>(
    () => ({
      active: true,
      isPausePoint: false,
      reducedMotion,
      onInteraction: () => undefined,
      onComplete: () => undefined,
      firedOnce: (key: string) => firedOnceList.includes(key),
      markFired: (key: string) => dispatch({ type: "MARK_FIRED", key }),
    }),
    [reducedMotion, firedOnceList, dispatch]
  );
  return <InteractiveContext.Provider value={api}>{children}</InteractiveContext.Provider>;
}

function StationSection({ station }: { station: RoomStation }) {
  return (
    <section data-testid={`room-station-${station.id}`} className="scroll-mt-24">
      <header>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-exh-ink/25" />
          <h3 className="exh-plat shrink-0 text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink">
            {station.eyebrow}
          </h3>
          <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-exh-ink/25" />
        </div>
        {station.lead ? (
          <p className="mx-auto mt-4 max-w-xl text-center font-display text-lg leading-relaxed text-exh-ink">
            {station.lead}
          </p>
        ) : null}
      </header>
      <div className="mt-7">
        <RoomInstrumentScope>{station.body}</RoomInstrumentScope>
      </div>
    </section>
  );
}

/* The counter room's wall: the module nameplate, the invitation, and
 * deliberately no lamp and no armed/on/off ledger, because there is
 * no machine behind this door. */
function CounterWall() {
  return (
    <header data-testid="room-station-thesis" data-counter-wall="">
      <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
        Machine room
      </p>
      <h2 className="mt-3 font-display text-3xl text-exh-ink md:text-4xl">{COUNTER_ROOM.title}</h2>
      <p className="exh-plat mt-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
        {COUNTER_ROOM.plainName}
      </p>
      <p className="mt-6 border-b border-exh-ink/15 pb-8 font-display text-xl leading-relaxed text-exh-ink md:text-2xl">
        {COUNTER_ROOM.definition}
      </p>
    </header>
  );
}

export default function MachineRoom({ roomId }: MachineRoomProps) {
  const isCounter = roomId === COUNTER_ROOM_ID;
  const machine = isCounter ? undefined : machineOf(roomId);
  const stations = ROOM_STATIONS[roomId];

  if (isCounter) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-10 sm:px-8 md:pt-14">
        <CounterWall />
        {stations ? (
          <div className="mt-16 space-y-16 md:mt-20 md:space-y-20">
            {stations.map((station) => (
              <StationSection key={station.id} station={station} />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!machine) return null;
  /* the lamp reads the machine's documented end state; there is no
     playback clock to track any more */
  const lamp: LampState = machine.renamedTo
    ? "renamed"
    : machine.offYear !== null
      ? "off_residue"
      : "on";
  const title = machineTitle(machine);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-10 sm:px-8 md:pt-14">
      {/* ---------------- the thesis wall ---------------- */}
      <header data-testid="room-station-thesis">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
          Machine room
        </p>
        <h2 className="mt-3 font-display text-3xl text-exh-ink md:text-4xl">{title}</h2>
        <p className="exh-plat mt-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
          {machine.plainName}
        </p>
        <p className="mt-6 font-display text-xl leading-relaxed text-exh-ink md:text-2xl">
          {machine.definition}
        </p>

        <dl className="mt-8 space-y-4 border-y border-exh-ink/15 py-6">
          <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
            <dt className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              Armed <span className="exh-mono normal-case tracking-normal">{machine.armedYear}</span>
            </dt>
            <dd className="text-sm leading-relaxed text-exh-ink">
              <MonoNumbers text={machine.armedBy} />
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
            <dt className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              Switched on <span className="exh-mono normal-case tracking-normal">{machine.onYear}</span>
            </dt>
            <dd className="text-sm leading-relaxed text-exh-ink">
              <MonoNumbers text={machine.onBy} />
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
            <dt className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              Switched off{" "}
              {machine.offYear !== null ? (
                <span className="exh-mono normal-case tracking-normal">{machine.offYear}</span>
              ) : null}
            </dt>
            <dd className="text-sm leading-relaxed text-exh-ink">
              {machine.offYear !== null && machine.offBy ? (
                <MonoNumbers text={machine.offBy} />
              ) : (
                "Never."
              )}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
            <dt className="exh-plat text-[11px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              The residue
            </dt>
            <dd className="text-sm leading-relaxed text-exh-ink">
              <MonoNumbers text={machine.residue} />
            </dd>
          </div>
        </dl>

        {/* the machine's lamp, live from exhibit state */}
        <PaperCard
          tone="deep"
          data-testid="room-lamp"
          data-lamp-state={lamp}
          className="mt-6 flex items-start gap-3 p-3.5"
        >
          <LampDisc lampState={lamp} />
          <div className="min-w-0">
            <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
              The lamp, where the record leaves it
            </p>
            <p className="mt-1 text-xs leading-relaxed text-exh-ink">
              {stateSentence(machine, lamp)}
            </p>
          </div>
        </PaperCard>
      </header>

      {/* ---------------- the five stations ---------------- */}
      {stations ? (
        <div className="mt-16 space-y-16 md:mt-20 md:space-y-20">
          {stations.map((station) => (
            <StationSection key={station.id} station={station} />
          ))}
        </div>
      ) : (
        <PaperCard className="mt-16 p-6 text-center">
          <p className="font-display text-lg leading-relaxed text-exh-ink">
            This room is being built.
          </p>
          <p className="exh-plat mt-3 text-xs uppercase tracking-[0.2em] text-exh-ink-soft">
            The tour continues outside
          </p>
        </PaperCard>
      )}
    </div>
  );
}
