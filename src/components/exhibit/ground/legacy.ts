/* ------------------------------------------------------------------ */
/*  Small helpers carried over from the pre-R9 exhibit so the ground   */
/*  tree has no imports into components scheduled for deletion at the  */
/*  swap (hud/, stations/, rooms/).                                    */
/* ------------------------------------------------------------------ */
import type { MachineDef } from "@/lib/exhibit/types";

/** the short name the chapters use for an instrument ("The Map") */
export function machineTitle(machine: MachineDef): string {
  return machine.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
