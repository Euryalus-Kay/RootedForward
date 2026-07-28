// ------------------------------------------------------------------
// Shared helpers for the walking tour maps and location features.
// The projection matches scripts/walk-prep-map.mjs exactly; a
// geometry file's viewBox height already carries the cos(latMid)
// correction, so both axes stay metrically true.
//
// This used to hold one tour's frame as module constants, back when
// Hyde Park was the only walk. Harlem made that impossible, so the
// projection is now built per tour from its own geometry file and the
// maths is unchanged. Each tour imports its geometry and calls
// createProjection once.
// ------------------------------------------------------------------

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

/** the printed plate a tour's map is drawn over, and everything set on
 *  it. Per tour, because each walk has its own survey sheet, its own
 *  neighborhood and street names, and its own parks to tint. These
 *  used to be module constants inside WalkMap.tsx and WalkMapCanvas
 *  .swift; they travel on the API payload now so the app can draw a
 *  second city without an App Store release. */
export interface WalkMapConfig {
  /** path under /public to the cropped, toned survey sheet */
  baseMapSrc: string;
  /** the neighborhood, for the map's accessible description */
  areaName: string;
  /** neighborhood, park and water names */
  placeLabels: { text: string; lat: number; lng: number; size: number }[];
  /** street names, set along their streets like a printed map's fine type */
  streetLabels: {
    text: string;
    lat: number;
    lng: number;
    rotate: number;
    size: number;
  }[];
  /** soft green ground for the parks, as closed lat/lng rings */
  parkAreas: [number, number][][];
  /** warm tint for university and institutional ground */
  campusAreas: [number, number][][];
  /** where a stop's name sits relative to its marker, by stop id.
   *  Anything unlisted sits below. */
  stopLabelSide: Record<string, "below" | "left" | "right">;
  /** the one-line note under the map when the detours are folded away,
   *  naming where they actually go. Omit on a walk with no detours. */
  detourLegend?: string;
}

export interface WalkProjection {
  geometry: WalkGeometry;
  /** meters per viewBox unit, equal on both axes thanks to the
   *  corrected aspect ratio */
  metersPerUnit: number;
  projectPoint(lat: number, lng: number): { x: number; y: number };
  /** true when a point sits within `padMeters` of this tour's frame */
  isNearFrame(lat: number, lng: number, padMeters?: number): boolean;
}

export function createProjection(geometry: WalkGeometry): WalkProjection {
  const F = geometry.frame;
  const VB = geometry.viewBox;
  const latMid = (F.latMin + F.latMax) / 2;
  const cosLat = Math.cos((latMid * Math.PI) / 180);

  const metersPerUnit = ((F.lngMax - F.lngMin) * 111320 * cosLat) / VB.w;

  return {
    geometry,
    metersPerUnit,
    projectPoint(lat, lng) {
      return {
        x: ((lng - F.lngMin) / (F.lngMax - F.lngMin)) * VB.w,
        y: ((F.latMax - lat) / (F.latMax - F.latMin)) * VB.h,
      };
    },
    isNearFrame(lat, lng, padMeters = 2500) {
      const padLat = padMeters / 111320;
      const padLng = padMeters / (111320 * cosLat);
      return (
        lat >= F.latMin - padLat &&
        lat <= F.latMax + padLat &&
        lng >= F.lngMin - padLng &&
        lng <= F.lngMax + padLng
      );
    },
  };
}

/* ---- unit helpers, the same for every tour ---- */

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
