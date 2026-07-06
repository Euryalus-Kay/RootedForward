/* ------------------------------------------------------------------ */
/*  Machine-room content registry. MachineRoom looks its stations up   */
/*  here by room id. All five machine rooms are built, plus the sixth  */
/*  room, THE COUNTER-MACHINE (id "counter", not a MachineId; it has   */
/*  no machines.json entry, so its nameplate ships from its module).   */
/*  MachineRoom still renders an honest in-production plate for any    */
/*  room without an entry, the same policy as the interactive          */
/*  registry.                                                          */
/* ------------------------------------------------------------------ */
import type { RoomId } from "../../machines";
import type { RoomStation } from "./shared";
import { THE_MAP_STATIONS } from "./theMap";
import { THE_BULLDOZER_STATIONS } from "./theBulldozer";
import { THE_CONTRACT_STATIONS } from "./theContract";
import { THE_DEED_STATIONS } from "./theDeed";
import { THE_CODE_STATIONS } from "./theCode";
import { COUNTER_STATIONS } from "./counterMachine";

export const ROOM_STATIONS: Partial<Record<RoomId, RoomStation[]>> = {
  map: THE_MAP_STATIONS,
  bulldozer: THE_BULLDOZER_STATIONS,
  contract: THE_CONTRACT_STATIONS,
  deed: THE_DEED_STATIONS,
  code: THE_CODE_STATIONS,
  counter: COUNTER_STATIONS,
};

export { COUNTER_ROOM } from "./counterMachine";
export type { RoomStation, RoomStationId } from "./shared";
