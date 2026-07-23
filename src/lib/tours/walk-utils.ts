// ------------------------------------------------------------------
// Shared helpers for the walking tour map and location features.
// The projection matches scripts/walk-prep-map.mjs exactly; the
// geometry JSON's viewBox height already carries the cos(latMid)
// correction, so both axes stay metrically true.
// ------------------------------------------------------------------
import geometry from "./walk-geometry.json";

export interface WalkFrame {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export interface WalkGeometry {
  source: string;
  frame: WalkFrame;
  viewBox: { w: number; h: number };
  water: { name: string; ring: number[][] }[];
  roads: { arterials: number[][][]; locals: number[][][]; alleys: number[][][] };
  rails: number[][][];
}

export const WALK_GEOMETRY = geometry as WalkGeometry;

const F = WALK_GEOMETRY.frame;
const VB = WALK_GEOMETRY.viewBox;

/** meters per viewBox unit (both axes, thanks to the corrected aspect) */
export const METERS_PER_UNIT =
  ((F.lngMax - F.lngMin) *
    111320 *
    Math.cos((((F.latMin + F.latMax) / 2) * Math.PI) / 180)) /
  VB.w;

export function projectPoint(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - F.lngMin) / (F.lngMax - F.lngMin)) * VB.w,
    y: ((F.latMax - lat) / (F.latMax - F.latMin)) * VB.h,
  };
}

export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** "250 ft" under a fifth of a mile, otherwise "0.4 mi" */
export function formatWalkDistance(meters: number): string {
  const feet = meters * 3.28084;
  if (feet < 1000) return `${Math.max(10, Math.round(feet / 10) * 10)} ft`;
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** true when a point sits within `padMeters` of the tour frame */
export function isNearFrame(lat: number, lng: number, padMeters = 2500): boolean {
  const padLat = padMeters / 111320;
  const padLng =
    padMeters /
    (111320 * Math.cos((((F.latMin + F.latMax) / 2) * Math.PI) / 180));
  return (
    lat >= F.latMin - padLat &&
    lat <= F.latMax + padLat &&
    lng >= F.lngMin - padLng &&
    lng <= F.lngMax + padLng
  );
}
