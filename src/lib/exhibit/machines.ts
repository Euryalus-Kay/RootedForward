/* ------------------------------------------------------------------ */
/*  Machine registry accessor, the same shape as facts.ts and          */
/*  voices.ts. The five machines live in data/exhibit/machines.json;   */
/*  the status board, the doorway cards, and the machine rooms all     */
/*  resolve them through here so the id check has one home.            */
/* ------------------------------------------------------------------ */
import machinesJson from "../../../data/exhibit/machines.json";
import type { MachineDef, MachineId } from "./types";

const doc = machinesJson as unknown as { machines: MachineDef[] };

const REGISTRY = new Map<MachineId, MachineDef>(doc.machines.map((m) => [m.machineId, m]));

export function machineOf(id: string): MachineDef | undefined {
  return REGISTRY.get(id as MachineId);
}

export function isMachineId(id: string): id is MachineId {
  return REGISTRY.has(id as MachineId);
}

export function allMachines(): MachineDef[] {
  return doc.machines;
}
