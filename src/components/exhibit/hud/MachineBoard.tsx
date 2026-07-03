"use client";
/* ------------------------------------------------------------------ */
/*  MachineBoard, the five-lamp status board. One responsive instance  */
/*  (so testids stay unique): a 5-lamp row on mobile, a fixed left     */
/*  column on md+ that expands from discs (w-16) to nameplates (w-52)  */
/*  on hover, focus, or while a plaque's card is open. Lamps sit in    */
/*  chronological order by the year each machine was armed. State      */
/*  changes announce to #exh-live unless the change arrived silently   */
/*  through a jump fast-forward.                                       */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, useState } from "react";
import machinesJson from "../../../../data/exhibit/machines.json";
import type { LampState, MachineDef, MachineId } from "@/lib/exhibit/types";
import { useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { cn } from "@/lib/utils";
import { BrassLamp, machineTitle } from "./BrassLamp";
import { exhAnnounce } from "./HudFrame";

const DOC = machinesJson as unknown as { machines: MachineDef[] };
const BY_ID = new Map<MachineId, MachineDef>(DOC.machines.map((m) => [m.machineId, m]));

/** chronological by armedYear: 1908, 1926, 1933, 1948, 1949 */
export const MACHINE_ORDER: MachineId[] = ["code", "deed", "map", "contract", "bulldozer"];

function changeSentence(machine: MachineDef, lampState: LampState): string {
  const title = machineTitle(machine);
  switch (lampState) {
    case "armed":
      return `${title} is armed.`;
    case "on":
      return `${title} switches on.`;
    case "off_residue":
      return `${title} switches off. The residue stays.`;
    case "renamed":
      return machine.renamedTo ? `${title} is renamed ${machine.renamedTo}.` : `${title} is renamed.`;
    case "dark":
      return `${title} goes dark.`;
  }
}

export function MachineBoard() {
  const state = useExhibitState();
  const [openId, setOpenId] = useState<MachineId | null>(null);
  const prevRef = useRef<Record<MachineId, LampState> | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state.machines;
    if (prev === null || state.silentEffects) return; // mount, restore, or jump: stay quiet
    for (const id of MACHINE_ORDER) {
      const next = state.machines[id];
      if (prev[id] !== next) {
        const machine = BY_ID.get(id);
        if (machine) exhAnnounce(changeSentence(machine, next));
      }
    }
  }, [state.machines, state.silentEffects]);

  return (
    <div
      data-testid="machine-board"
      aria-label="Machine status board"
      className={cn(
        "group flex flex-row items-start gap-1",
        "md:w-16 md:flex-col md:gap-1.5 md:transition-[width] md:duration-300 md:ease-out",
        "md:hover:w-52 md:focus-within:w-52",
        "[[data-motion=off]_&]:transition-none",
        openId !== null && "md:w-52"
      )}
    >
      {MACHINE_ORDER.map((id) => {
        const machine = BY_ID.get(id);
        if (!machine) return null;
        return (
          <BrassLamp
            key={id}
            machine={machine}
            lampState={state.machines[id]}
            open={openId === id}
            onToggle={() => setOpenId(openId === id ? null : id)}
            onClose={() => setOpenId(null)}
          />
        );
      })}
    </div>
  );
}

export default MachineBoard;
