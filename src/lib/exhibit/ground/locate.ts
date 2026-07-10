/* ------------------------------------------------------------------ */
/*  Find the ground under the visitor. Everything runs client side:    */
/*  the browser's own permission dialog gates the position, the 1940   */
/*  boundaries are the geojson the exhibit already ships, and nothing  */
/*  is sent anywhere. The result is kept in sessionStorage only, so    */
/*  the Act 6 receipt can reprise it without a second prompt.          */
/* ------------------------------------------------------------------ */

export interface GroundHit {
  areaId: string;
  grade: string | null;
}

export type LocateResult =
  | { state: "hit"; hit: GroundHit }
  | { state: "miss" }
  | { state: "denied" };

const STORE_KEY = "rf-ground-grade-v1";

function inRing(ring: number[][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export async function locateGround(): Promise<LocateResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return { state: "denied" };
  }
  const pos = await new Promise<GeolocationPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => resolve(null),
      { timeout: 8000, maximumAge: 300000 }
    );
  });
  if (!pos) return { state: "denied" };
  try {
    const res = await fetch("/exhibit-data/holc-chicago.geojson");
    const gj = (await res.json()) as {
      features: Array<{
        properties: { area_id: number | string; grade?: string };
        geometry: { type: string; coordinates: number[][][] | number[][][][] };
      }>;
    };
    const x = pos.coords.longitude;
    const y = pos.coords.latitude;
    const inFeature = (f: (typeof gj.features)[number]) => {
      const g = f.geometry;
      if (g.type === "Polygon") {
        const rings = g.coordinates as number[][][];
        return inRing(rings[0], x, y) && rings.slice(1).every((r) => !inRing(r, x, y));
      }
      if (g.type === "MultiPolygon") {
        return (g.coordinates as number[][][][]).some(
          (rings) => inRing(rings[0], x, y) && rings.slice(1).every((r) => !inRing(r, x, y))
        );
      }
      return false;
    };
    const hitFeature = gj.features.find(inFeature);
    if (!hitFeature) return { state: "miss" };
    const hit: GroundHit = {
      areaId: String(hitFeature.properties.area_id),
      grade: String(hitFeature.properties.grade ?? "").trim() || null,
    };
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(hit));
    } catch {
      /* storage may be unavailable; the receipt simply re-offers the lookup */
    }
    return { state: "hit", hit };
  } catch {
    return { state: "miss" };
  }
}

export function storedGround(): GroundHit | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as GroundHit) : null;
  } catch {
    return null;
  }
}
