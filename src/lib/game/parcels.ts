/**
 * Parcel system. Parkhaven is a 7x10 grid of parcels (70 total). Each
 * parcel starts with a procedurally generated state in 1940, modeled
 * after a real Chicago South Side composite. Cards and events transform
 * parcels by applying selectors.
 */

import type { Parcel, ParcelTransform, HOLCGrade } from "./types";
import { RNG } from "./rng";
export { RNG };

export const COLS = 10;
export const ROWS = 7;
export const TOTAL = COLS * ROWS;

/** Block grouping. Roughly 6 blocks across the ward. */
function blockOf(row: number, col: number): number {
  if (row < 2) return col < 5 ? 0 : 1; // North
  if (row < 4) return col < 5 ? 2 : 3; // Central
  return col < 5 ? 4 : 5; // South
}

/** Generate the starting parcel layout. Different seeds yield different
 *  initial owner mixes, conditions, and HOLC grades. */
export function generateInitialParcels(rng: RNG): Parcel[] {
  const parcels: Parcel[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const id = row * COLS + col;
      const block = blockOf(row, col);

      // HOLC grade is largely determined by block in 1940
      let holc: HOLCGrade;
      if (block === 0 || block === 1) {
        holc = rng.chance(0.7) ? "B" : (rng.chance(0.5) ? "A" : "C");
      } else if (block === 2 || block === 3) {
        holc = rng.chance(0.6) ? "C" : (rng.chance(0.5) ? "B" : "D");
      } else {
        holc = rng.chance(0.7) ? "D" : "C";
      }

      // Initial type
      const r = rng.next();
      let type: Parcel["type"];
      if (col === 0 && row === 0) type = "school";
      else if (col === 9 && row === 6) type = "park";
      else if (col === 4 && row === 3) type = "commercial";
      else if (col === 9 && row === 0) type = "church";
      else if (r < 0.04) type = "vacant";
      else if (r < 0.30) type = "single-family";
      else if (r < 0.60) type = "two-flat";
      else if (r < 0.85) type = "three-flat";
      else if (r < 0.92) type = "commercial";
      else type = "industrial";

      // Owner
      let owner: Parcel["owner"];
      if (type === "vacant") owner = "vacant";
      else if (holc === "D" && rng.chance(0.4)) owner = "absentee";
      else owner = rng.chance(0.85) ? "resident" : "absentee";

      const condition = holc === "A" ? rng.intBetween(70, 95)
        : holc === "B" ? rng.intBetween(55, 85)
        : holc === "C" ? rng.intBetween(40, 70)
        : rng.intBetween(25, 55);

      const value = holc === "A" ? rng.intBetween(70, 95)
        : holc === "B" ? rng.intBetween(50, 80)
        : holc === "C" ? rng.intBetween(30, 60)
        : rng.intBetween(15, 45);

      const memory = rng.intBetween(50, 80);

      const residents = type === "vacant" ? 0
        : type === "single-family" ? rng.intBetween(2, 5)
        : type === "two-flat" ? rng.intBetween(4, 8)
        : type === "three-flat" ? rng.intBetween(6, 12)
        : type === "commercial" ? rng.intBetween(0, 3)
        : type === "industrial" ? 0
        : rng.intBetween(2, 6);

      parcels.push({
        id,
        row,
        col,
        block,
        type,
        owner,
        holc,
        condition,
        value,
        memory,
        residents,
        protected: false,
        displacementEvents: 0,
      });
    }
  }
  return parcels;
}

/** Apply a transform's selector to a parcel array, returning matched ids */
export function selectParcels(
  parcels: Parcel[],
  selector: string,
  rng: RNG
): number[] {
  const sel = selector.trim();
  if (sel === "all") return parcels.map((p) => p.id);

  // random:N
  const random = sel.match(/^random:(\d+)$/);
  if (random) {
    const n = parseInt(random[1]);
    return rng.sample(parcels.map((p) => p.id), Math.min(n, parcels.length));
  }

  // first-vacant:south, first-vacant:north, first-vacant
  const firstVacant = sel.match(/^first-vacant(?::(north|south|central|west|east))?$/);
  if (firstVacant) {
    const region = firstVacant[1];
    const eligible = parcels.filter((p) => {
      if (p.type !== "vacant") return false;
      if (!region) return true;
      if (region === "north") return p.row < 2;
      if (region === "south") return p.row > 4;
      if (region === "central") return p.row >= 2 && p.row <= 4;
      if (region === "west") return p.col < 3;
      if (region === "east") return p.col > 6;
      return true;
    });
    return eligible.length > 0 ? [eligible[0].id] : [];
  }

  // first-of-type:vacant, first-of-type:single-family
  const firstOfType = sel.match(/^first-of-type:(.+)$/);
  if (firstOfType) {
    const t = firstOfType[1];
    const found = parcels.find((p) => p.type === t);
    return found ? [found.id] : [];
  }

  // type:vacant, type:tower, etc.
  const typeMatch = sel.match(/^type:(.+)$/);
  if (typeMatch) {
    const t = typeMatch[1];
    return parcels.filter((p) => p.type === t).map((p) => p.id);
  }

  // holc:D, holc:A
  const holcMatch = sel.match(/^holc:([ABCD])$/);
  if (holcMatch) {
    const g = holcMatch[1];
    return parcels.filter((p) => p.holc === g).map((p) => p.id);
  }

  // block:N
  const blockMatch = sel.match(/^block:(\d+)$/);
  if (blockMatch) {
    const b = parseInt(blockMatch[1]);
    return parcels.filter((p) => p.block === b).map((p) => p.id);
  }

  // adjacent-to:transit, adjacent-to:expressway
  const adjacent = sel.match(/^adjacent-to:(.+)$/);
  if (adjacent) {
    const t = adjacent[1];
    const targetIds = parcels.filter((p) => p.type === t).map((p) => p.id);
    const targets = new Set(targetIds);
    const adjacent4 = (id: number): number[] => {
      const r = Math.floor(id / COLS);
      const c = id % COLS;
      const out: number[] = [];
      if (r > 0) out.push((r - 1) * COLS + c);
      if (r < ROWS - 1) out.push((r + 1) * COLS + c);
      if (c > 0) out.push(r * COLS + c - 1);
      if (c < COLS - 1) out.push(r * COLS + c + 1);
      return out;
    };
    const result = new Set<number>();
    for (const tid of targetIds) for (const aid of adjacent4(tid)) if (!targets.has(aid)) result.add(aid);
    return Array.from(result);
  }

  // expressway-line: pre-defined corridor ids
  if (sel === "expressway-line") {
    return [4, 14, 24, 34, 44, 54, 64];
  }

  // owner:absentee, owner:speculator
  const ownerMatch = sel.match(/^owner:(.+)$/);
  if (ownerMatch) {
    const o = ownerMatch[1];
    return parcels.filter((p) => p.owner === o).map((p) => p.id);
  }

  // protected:true / protected:false
  if (sel === "protected") return parcels.filter((p) => p.protected).map((p) => p.id);
  if (sel === "unprotected") return parcels.filter((p) => !p.protected).map((p) => p.id);

  return [];
}

/** Preview which parcels a list of transforms would touch (ids only).
 *  Uses a deterministic seed so the preview matches what would happen.
 *  We accept a seed string so multiple previews of the same card stay
 *  stable until the player actually plays it. */
export function previewTargets(
  parcels: Parcel[],
  transforms: ParcelTransform[] | undefined,
  seed: string
): number[] {
  if (!transforms || transforms.length === 0) return [];
  const rng = new RNG(seed);
  const out = new Set<number>();
  for (const t of transforms) {
    for (const id of selectParcels(parcels, t.selector, rng)) out.add(id);
  }
  return Array.from(out);
}

/** Apply all transforms in a card or event effect */
export function applyTransforms(
  parcels: Parcel[],
  transforms: ParcelTransform[] | undefined,
  rng: RNG
): Parcel[] {
  if (!transforms || transforms.length === 0) return parcels;
  const next = parcels.map((p) => ({ ...p }));
  for (const t of transforms) {
    const ids = selectParcels(next, t.selector, rng);
    for (const id of ids) {
      const p = next[id];
      if (!p) continue;
      if (t.set) Object.assign(p, t.set);
      if (t.delta) {
        if (typeof t.delta.condition === "number") p.condition = clamp(p.condition + t.delta.condition);
        if (typeof t.delta.value === "number") p.value = clamp(p.value + t.delta.value);
        if (typeof t.delta.memory === "number") p.memory = clamp(p.memory + t.delta.memory);
        if (typeof t.delta.residents === "number") p.residents = Math.max(0, p.residents + t.delta.residents);
      }
    }
  }
  return next;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Background simulation each year. Property values drift, memory decays
 *  for parcels with absentee owners, condition decays without
 *  investment. */
export function simulateYear(parcels: Parcel[], year: number, rng: RNG): Parcel[] {
  const eraGrowth = year < 1955 ? -1
    : year < 1975 ? 0
    : year < 1995 ? -0.5
    : year < 2015 ? 1
    : 1.5;

  return parcels.map((p) => {
    const next = { ...p };
    // Slow value drift
    next.value = clamp(p.value + eraGrowth + rng.intBetween(-1, 2));
    // Condition decay (faster for absentee)
    const decay = p.owner === "absentee" || p.owner === "speculator" ? 1.2 : 0.4;
    next.condition = clamp(p.condition - decay);
    // Memory drift
    if (p.protected) next.memory = clamp(p.memory + 1);
    else if (p.owner === "speculator") next.memory = clamp(p.memory - 2);
    return next;
  });
}

/** Aggregate per-block statistics for the HUD */
export function blockStats(parcels: Parcel[]): {
  avgValue: number;
  avgCondition: number;
  totalResidents: number;
  protectedCount: number;
  speculatorCount: number;
}[] {
  const out = Array.from({ length: 6 }, () => ({
    avgValue: 0, avgCondition: 0, totalResidents: 0, protectedCount: 0, speculatorCount: 0, n: 0,
  }));
  for (const p of parcels) {
    const s = out[p.block];
    s.avgValue += p.value;
    s.avgCondition += p.condition;
    s.totalResidents += p.residents;
    if (p.protected) s.protectedCount++;
    if (p.owner === "speculator") s.speculatorCount++;
    s.n++;
  }
  return out.map((s) => ({
    avgValue: s.n ? Math.round(s.avgValue / s.n) : 0,
    avgCondition: s.n ? Math.round(s.avgCondition / s.n) : 0,
    totalResidents: s.totalResidents,
    protectedCount: s.protectedCount,
    speculatorCount: s.speculatorCount,
  }));
}
