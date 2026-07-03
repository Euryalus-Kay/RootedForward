/* ------------------------------------------------------------------ */
/*  Web Mercator projection for the exhibit's vector map stage.        */
/*  This is a TypeScript port of the projection in                     */
/*  scripts/hp-map-real.py (world_px / to_canvas). That script is the  */
/*  source of truth for the constants. Its frame is z=15, center       */
/*  41.7908,-87.5815, canvas 2560x1440, mirrored here as               */
/*  HYDE_PARK_FRAME. The exhibit-data JSONs are pre-projected with     */
/*  the same math; these helpers exist for extra annotations (station  */
/*  dots, track lines) and for moving pixels between frames.           */
/* ------------------------------------------------------------------ */

export interface MapFrame {
  zoom: number;
  centerLat: number;
  centerLng: number;
  width: number;
  height: number;
}

export const TILE_SIZE = 256;

/** Mirrors Z / BW / BH / CTR_LAT / CTR_LON in scripts/hp-map-real.py. */
export const HYDE_PARK_FRAME: MapFrame = {
  zoom: 15,
  centerLat: 41.7908,
  centerLng: -87.5815,
  width: 2560,
  height: 1440,
};

/** Global Web Mercator pixel coordinates at a zoom (world_px in the script). */
export function worldPx(lat: number, lng: number, zoom: number): [number, number] {
  const n = TILE_SIZE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return [x, y];
}

export interface FrameProjector {
  frame: MapFrame;
  /** lat/lng to canvas pixels for this frame (to_canvas in the script). */
  project: (lat: number, lng: number) => [number, number];
}

export function makeFrameProjector(frame: MapFrame): FrameProjector {
  const [cx, cy] = worldPx(frame.centerLat, frame.centerLng, frame.zoom);
  const ox = cx - frame.width / 2;
  const oy = cy - frame.height / 2;
  return {
    frame,
    project(lat: number, lng: number): [number, number] {
      const [x, y] = worldPx(lat, lng, frame.zoom);
      return [x - ox, y - oy];
    },
  };
}

/**
 * Canvas pixels in one frame to canvas pixels in another. Both frames are
 * Web Mercator, so this is a pure scale-and-shift through world pixels.
 * Used to draw the Hyde Park boundary as a locator on the citywide frame.
 */
export function makeFrameReprojector(
  from: MapFrame,
  to: MapFrame
): (xy: [number, number]) => [number, number] {
  const [fcx, fcy] = worldPx(from.centerLat, from.centerLng, from.zoom);
  const fox = fcx - from.width / 2;
  const foy = fcy - from.height / 2;
  const [tcx, tcy] = worldPx(to.centerLat, to.centerLng, to.zoom);
  const tox = tcx - to.width / 2;
  const toy = tcy - to.height / 2;
  const s = Math.pow(2, to.zoom - from.zoom);
  return ([x, y]) => [(x + fox) * s - tox, (y + foy) * s - toy];
}

/* ------- small SVG geometry helpers shared by the map layers ------- */

export type RingPoints = [number, number][];

const f = (n: number) => Math.round(n * 10) / 10;

/** One closed ring to an SVG path segment ("M...L...Z"). */
export function ringToPath(ring: RingPoints | undefined | null): string {
  if (!ring || ring.length < 3) return "";
  let d = `M${f(ring[0][0])} ${f(ring[0][1])}`;
  for (let i = 1; i < ring.length; i++) d += `L${f(ring[i][0])} ${f(ring[i][1])}`;
  return d + "Z";
}

/** Many rings (outer boundaries plus holes) to one path string. */
export function ringsToPath(rings: RingPoints[] | undefined | null): string {
  if (!rings?.length) return "";
  return rings.map(ringToPath).filter(Boolean).join(" ");
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function ringsBBox(rings: RingPoints[]): BBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY };
}
