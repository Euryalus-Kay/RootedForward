/* ------------------------------------------------------------------ */
/*  Machine-room content registry. MachineRoom looks its stations up   */
/*  here by machine id. M4 (deed) and M5 (code) land next milestone;   */
/*  MachineRoom renders an honest in-production plate for any machine  */
/*  without an entry, the same policy as the interactive registry.     */
/* ------------------------------------------------------------------ */
import type { MachineId } from "../../types";
import type { RoomStation } from "./shared";
import { THE_MAP_STATIONS } from "./theMap";
import { THE_BULLDOZER_STATIONS } from "./theBulldozer";
import { THE_CONTRACT_STATIONS } from "./theContract";

export const ROOM_STATIONS: Partial<Record<MachineId, RoomStation[]>> = {
  map: THE_MAP_STATIONS,
  bulldozer: THE_BULLDOZER_STATIONS,
  contract: THE_CONTRACT_STATIONS,
};

export type { RoomStation, RoomStationId } from "./shared";
