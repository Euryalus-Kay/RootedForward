/* ------------------------------------------------------------------ */
/*  R9 server shell. Builds the tiny client props from geometry.json   */
/*  (flood batches, viewBoxes, note anchors) and composes the server-  */
/*  rendered StageBase into the client GroundExhibit, so the 1940 map  */
/*  is in the initial HTML while the client bundle stays lean.         */
/* ------------------------------------------------------------------ */
import geometry from "@/lib/exhibit/ground/geometry.json";
import GroundExhibit from "./GroundExhibit";
import StageBase from "./StageBase";
import type { StageClientProps } from "./StageController";

export const GROUND_TITLE = "The Ground Keeps Moving";
export const GROUND_DEK =
  "Hyde Park, Chicago, 1832 to 2026. One map, five instruments, and the bill.";

function buildClientProps(): StageClientProps {
  const { dated, undated, sheetless } = geometry.floodOrder as {
    dated: [number, number][];
    undated: number[];
    sheetless: number[];
  };
  // one batch per filing month, then the undated and sheetless remainder
  const byMonth = new Map<number, number[]>();
  for (const [id, ym] of dated) {
    const list = byMonth.get(ym) ?? [];
    list.push(id);
    byMonth.set(ym, list);
  }
  const floodBatches = [...byMonth.keys()].sort((a, b) => a - b).map((k) => byMonth.get(k)!);
  floodBatches.push([...undated, ...sheetless]);

  const anchors: StageClientProps["anchors"] = {};
  for (const l of geometry.citywide.labels as Array<{ t: string; x: number; y: number }>) {
    if (l.t === "NORTH LAWNDALE") anchors.lawndale = { x: l.x, y: l.y };
    if (l.t === "WOODLAWN") anchors.woodlawn = { x: l.x, y: l.y };
  }
  for (const l of geometry.hydePark.labels as Array<{ t: string; x: number; y: number }>) {
    if (l.t === "HYDE PARK") anchors.hydePark = { x: l.x, y: l.y };
    if (l.t === "JACKSON PARK") {
      /* the fairgrounds note belongs at Jackson Park. The label's own
         anchor sits just south of the township crop, so clamp it into
         the frame (the park runs well north of its centroid); the note
         then reads at the park's in-frame portion, the lake edge south */
      const [vx, vy, vw, vh] = (geometry.hydePark.viewBox as string).split(" ").map(Number);
      anchors.jacksonPark = {
        x: Math.min(Math.max(l.x, vx + vw * 0.08), vx + vw * 0.92),
        y: Math.min(Math.max(l.y, vy + vh * 0.1), vy + vh * 0.88),
      };
    }
  }
  const sq = geometry.citywide.square as { x: number; y: number; w: number; h: number };
  anchors.square = { x: sq.x + sq.w / 2, y: sq.y + sq.h / 2 };

  return {
    viewBox: geometry.citywide.viewBox as string,
    blackBeltViewBox: geometry.citywide.blackBeltViewBox as string,
    hpViewBox: geometry.hydePark.viewBox as string,
    floodBatches,
    anchors,
  };
}

export default function GroundShell() {
  return (
    <div className="exhibit-root ground-root" data-testid="ground-root">
      <GroundExhibit stageBase={<StageBase />} clientProps={buildClientProps()} />
    </div>
  );
}
