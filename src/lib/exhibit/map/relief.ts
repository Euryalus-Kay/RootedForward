/* ------------------------------------------------------------------ */
/*  Geometry for the relief view of the 1940 map. The citywide frame's */
/*  polygons are rotated about the map center, tilted back, and        */
/*  extruded by a quantized step per grade, A highest to D lowest,     */
/*  ungraded a thin slab. Heights are ranks, not measurements; the     */
/*  legend says so on the station. Everything here is pure math over   */
/*  the frame data the flat map already ships; painter's order back    */
/*  to front replaces a depth buffer.                                  */
/* ------------------------------------------------------------------ */
import type { HolcArea } from "./useExhibitMapData";

export const TILT = 0.55;
const UNIT = 9;
const PLINTH = 5;
const GRADE_STEP: Record<string, number> = { A: 4, B: 3, C: 2, D: 1 };
const UNGRADED_STEP = 0.15;

/** the turn handle's stops, in degrees; index 3 is the resting view */
export const TURN_STOPS = [-53, -38, -23, -8, 7, 22, 37] as const;
export const TURN_DEFAULT_INDEX = 3;

const LINEN: Rgb = [0xed, 0xe6, 0xd6];
const INK: Rgb = [0x1c, 0x1a, 0x17];
const GRADE_RGB: Record<string, Rgb> = {
  A: [0x7a, 0x8b, 0x6f],
  B: [0x4a, 0x6b, 0x8a],
  C: [0xc9, 0xa2, 0x27],
  D: [0xb0, 0x32, 0x2b],
};
const UNGRADED_RGB: Rgb = [0xa7, 0x9b, 0x85];

type Rgb = [number, number, number];
type Pt = [number, number];

function mix(a: Rgb, b: Rgb, t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function heightOf(area: Pick<HolcArea, "grade">): number {
  const step = GRADE_STEP[area.grade] ?? UNGRADED_STEP;
  return PLINTH + step * UNIT;
}

export function colorsOf(area: Pick<HolcArea, "grade">): {
  top: string;
  side: string;
  edge: string;
} {
  const base = GRADE_RGB[area.grade] ?? UNGRADED_RGB;
  return {
    top: mix(base, LINEN, 0.3),
    side: mix(base, INK, 0.42),
    edge: mix(base, INK, 0.62),
  };
}

export interface ReliefPrism {
  area: HolcArea;
  /** top faces, every ring, evenodd */
  topD: string;
  /** front-facing side walls */
  sideD: string;
  top: string;
  side: string;
  edge: string;
  graded: boolean;
  /** projected top-face centroid, for markers */
  cx: number;
  cy: number;
}

export interface ReliefScene {
  prisms: ReliefPrism[];
  viewBox: { x: number; y: number; w: number; h: number };
}

interface Projector {
  rot: (x: number, y: number) => Pt;
  proj: (x: number, y: number, z: number) => Pt;
}

function projector(areas: HolcArea[], turnDeg: number): Projector {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const a of areas) {
    for (const ring of a.rings?.citywide ?? []) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const th = (turnDeg * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  const rot = (x: number, y: number): Pt => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  };
  const proj = (x: number, y: number, z: number): Pt => {
    const [rx, ry] = rot(x, y);
    return [rx, ry * TILT - z];
  };
  return { rot, proj };
}

/** project a raw citywide-frame point at a given height, scene coords */
export function projectPoint(
  areas: HolcArea[],
  turnDeg: number,
  x: number,
  y: number,
  z: number
): Pt {
  return projector(areas, turnDeg).proj(x, y, z);
}

export function buildRelief(areas: HolcArea[], turnDeg: number): ReliefScene {
  const { rot, proj } = projector(areas, turnDeg);

  const usable = areas.filter((a) => a.rings?.citywide?.length);

  /* painter's order, far rows first */
  const depth = new Map<HolcArea["id"], number>();
  for (const a of usable) {
    const pts = a.rings!.citywide!.flat();
    let s = 0;
    for (const [x, y] of pts) s += rot(x, y)[1];
    depth.set(a.id, s / pts.length);
  }
  const ordered = [...usable].sort((a, b) => depth.get(a.id)! - depth.get(b.id)!);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const seen = (p: Pt) => {
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  };

  const prisms: ReliefPrism[] = ordered.map((area) => {
    const rings = area.rings!.citywide!;
    const z = heightOf(area);
    const { top, side, edge } = colorsOf(area);

    const tops: string[] = [];
    let cxSum = 0;
    let cySum = 0;
    let cN = 0;
    for (const ring of rings) {
      const pts = ring.map(([x, y]) => {
        const p = proj(x, y, z);
        seen(p);
        seen(proj(x, y, 0));
        return p;
      });
      tops.push("M" + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L") + "Z");
      for (const p of pts) {
        cxSum += p[0];
        cySum += p[1];
        cN += 1;
      }
    }

    /* front-facing walls of the outer ring only */
    const outer = rings[0];
    const scr = outer.map(([x, y]) => rot(x, y));
    let ccx = 0;
    let ccy = 0;
    for (const p of scr) {
      ccx += p[0];
      ccy += p[1];
    }
    ccx /= scr.length;
    ccy /= scr.length;
    const walls: string[] = [];
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      const [e1x, e1y] = scr[i];
      const [e2x, e2y] = scr[j];
      let nx = e2y - e1y;
      let ny = -(e2x - e1x);
      const mx = (e1x + e2x) / 2 - ccx;
      const my = (e1y + e2y) / 2 - ccy;
      if (nx * mx + ny * my < 0) {
        nx = -nx;
        ny = -ny;
      }
      if (ny <= 0) continue;
      const b1 = proj(outer[i][0], outer[i][1], 0);
      const b2 = proj(outer[j][0], outer[j][1], 0);
      const t1 = proj(outer[i][0], outer[i][1], z);
      const t2 = proj(outer[j][0], outer[j][1], z);
      walls.push(
        `M${b1[0].toFixed(1)},${b1[1].toFixed(1)}L${b2[0].toFixed(1)},${b2[1].toFixed(1)}L${t2[0].toFixed(1)},${t2[1].toFixed(1)}L${t1[0].toFixed(1)},${t1[1].toFixed(1)}Z`
      );
    }

    return {
      area,
      topD: tops.join(" "),
      sideD: walls.join(" "),
      top,
      side,
      edge,
      graded: area.grade in GRADE_STEP,
      cx: cN ? cxSum / cN : 0,
      cy: cN ? cySum / cN : 0,
    };
  });

  const pad = 26;
  return {
    prisms,
    viewBox: {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    },
  };
}

