#!/usr/bin/env node
// ------------------------------------------------------------------
// R9 Stage geometry builder. Reads the pre-projected HOLC frames,
// the Hyde Park base layers, the bombing incidents, and the sheet
// filing dates, and writes src/lib/exhibit/ground/geometry.json,
// the single static asset behind the R9 Stage (server-rendered
// inline SVG). Re-run after any upstream data change:
//   node scripts/exhibit-ground-prep.mjs
// Budget (design.md): the whole asset must stay under ~80KB gzipped.
// The script fails loudly if it drifts past that.
// ------------------------------------------------------------------
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";

const frames = JSON.parse(readFileSync("public/exhibit-data/holc-frames.json", "utf8"));
const hpLayers = JSON.parse(readFileSync("public/exhibit-data/hp-frame-layers.json", "utf8"));
const bombings = JSON.parse(readFileSync("public/exhibit-data/bombings.json", "utf8"));
const descriptions = JSON.parse(readFileSync("public/exhibit-data/holc-descriptions.json", "utf8"));
// R10 ground plane sources (both City of Chicago Data Portal exports,
// cached under data/exhibit-src; see the attribution block in `out`)
const communityAreas = JSON.parse(readFileSync("data/exhibit-src/community-areas.geojson", "utf8"));
const parksCpd = JSON.parse(readFileSync("data/exhibit-src/parks-cpd.geojson", "utf8"));

const VIEW_W = 2560;
const VIEW_H = 1440;
const PAD = 140; // cull margin in viewBox units

// --- Web Mercator helpers (mirrors src/lib/exhibit/map/projection.ts) ---
const TILE = 256;
function worldPx(lat, lng, zoom) {
  const n = TILE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return [x, y];
}
function projector(frame) {
  const [cx, cy] = worldPx(frame.centerLat, frame.centerLng, frame.zoom);
  const ox = cx - frame.width / 2;
  const oy = cy - frame.height / 2;
  return (lat, lng) => {
    const [x, y] = worldPx(lat, lng, frame.zoom);
    return [x - ox, y - oy];
  };
}
const CITYWIDE_FRAME = bombings.citywideFrame; // {zoom:11.2, centerLat:41.845, centerLng:-87.675, 2560x1440}
const projectCitywide = projector(CITYWIDE_FRAME);

// --- geometry utils ---
function ringInFrame(ring) {
  return ring.some(
    ([x, y]) => x >= -PAD && x <= VIEW_W + PAD && y >= -PAD && y <= VIEW_H + PAD
  );
}
/** integer-quantize a ring and drop consecutive duplicates */
function quantize(ring) {
  const out = [];
  for (const [x, y] of ring) {
    const qx = Math.round(x);
    const qy = Math.round(y);
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== qx || prev[1] !== qy) out.push([qx, qy]);
  }
  // drop closing dup
  if (out.length > 1) {
    const [fx, fy] = out[0];
    const [lx, ly] = out[out.length - 1];
    if (fx === lx && fy === ly) out.pop();
  }
  return out;
}
/** perpendicular-distance simplification (iterative Douglas-Peucker) */
function simplify(ring, epsilon) {
  if (ring.length <= 4 || epsilon <= 0) return ring;
  const keep = new Uint8Array(ring.length);
  keep[0] = 1;
  keep[ring.length - 1] = 1;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const [ax, ay] = ring[a];
    const [bx, by] = ring[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = -1;
    let maxI = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = ring[i];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > maxD) {
        maxD = d;
        maxI = i;
      }
    }
    if (maxD > epsilon) {
      keep[maxI] = 1;
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return ring.filter((_, i) => keep[i]);
}
function ringToD(ring) {
  if (!ring.length) return "";
  let d = `M${ring[0][0]} ${ring[0][1]}`;
  for (let i = 1; i < ring.length; i++) d += `L${ring[i][0]} ${ring[i][1]}`;
  return d + "Z";
}
function ringsToD(rings, epsilon) {
  return rings
    .map((r) => ringToD(simplify(quantize(r), epsilon)))
    .filter(Boolean)
    .join("");
}

// --- build one frame's layers ---
function buildFrame(frameId, { epsilon, withAreas }) {
  const gradeFills = { A: "", B: "", C: "", D: "", U: "" };
  const areas = [];
  let culled = 0;
  for (const area of frames.areas) {
    const rings = area.rings[frameId];
    if (!rings || !rings.length) continue;
    const visible = rings.filter(ringInFrame);
    if (!visible.length) {
      culled++;
      continue;
    }
    const d = ringsToD(visible, epsilon);
    if (!d) continue;
    const g = ["A", "B", "C", "D"].includes(area.grade) ? area.grade : "U";
    gradeFills[g] += d;
    if (withAreas) areas.push({ id: area.id, g, d });
  }
  return { gradeFills, areas, culled };
}

const citywide = buildFrame("citywide", { epsilon: 1.2, withAreas: true });
const hydePark = buildFrame("hydePark", { epsilon: 0, withAreas: false });

// --- tight default crop around the city's polygon mass so the map,
//     not linen margin, fills the Stage pane ---
let cbx = Infinity, cby = Infinity, cbX = -Infinity, cbY = -Infinity;
for (const area of frames.areas) {
  const rings = area.rings.citywide;
  if (!rings) continue;
  for (const ring of rings) {
    if (!ringInFrame(ring)) continue;
    for (const [x, y] of ring) {
      if (x < cbx) cbx = x;
      if (y < cby) cby = y;
      if (x > cbX) cbX = x;
      if (y > cbY) cbY = y;
    }
  }
}
const CROP_PAD = 70;
const cityCrop = {
  x: Math.round(cbx - CROP_PAD),
  y: Math.round(cby - CROP_PAD),
  w: Math.round(cbX - cbx + CROP_PAD * 2 + 60), // extra east margin for the lake label
  h: Math.round(cbY - cby + CROP_PAD * 2),
};
const cityViewBox = `${cityCrop.x} ${cityCrop.y} ${cityCrop.w} ${cityCrop.h}`;

// ------------------------------------------------------------------
// R10 ground plane. Real geometry only:
//   land + neighborhood fabric  <- the 77 community areas (they tile
//                                  the city, so their concatenated
//                                  rings render as the landmass)
//   lake                        <- everything east of the landmass's
//                                  own eastern edge (scanline hull of
//                                  the same polygons; the shoreline is
//                                  the city's own recorded boundary,
//                                  not drawn by hand)
//   parks                       <- Chicago Park District boundaries
// ------------------------------------------------------------------
function geoRings(feature) {
  const g = feature.geometry;
  if (!g) return [];
  if (g.type === "Polygon") return g.coordinates;
  if (g.type === "MultiPolygon") return g.coordinates.flat();
  return [];
}
function projectRings(feature, project) {
  return geoRings(feature).map((ring) => ring.map(([lng, lat]) => project(lat, lng)));
}

// land + fabric in the citywide frame
const caRingsCity = communityAreas.features
  .flatMap((f) => projectRings(f, projectCitywide))
  .filter(ringInFrame);
const cityLand = ringsToD(caRingsCity, 2.0);

// shoreline by scanline: the easternmost land x for each row of the
// citywide crop, walked top to bottom, closed against the frame's
// east edge. Derived, not drawn.
function easternHull(rings, y0, y1, step) {
  const shore = [];
  for (let y = y0; y <= y1; y += step) {
    let maxX = -Infinity;
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[(i + 1) % ring.length];
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          const t = (y - ay) / (by - ay);
          const x = ax + t * (bx - ax);
          if (x > maxX) maxX = x;
        }
      }
    }
    if (maxX > -Infinity) shore.push([Math.round(maxX), y]);
  }
  return shore;
}

// parks in the citywide frame; tiny pocket parks are sub-pixel at this
// zoom and only cost bytes, so keep parks over ~15 acres
const cityParkRings = parksCpd.features
  .filter((f) => Number(f.properties?.acres ?? 0) >= 15)
  .flatMap((f) => projectRings(f, projectCitywide))
  .filter(ringInFrame);
const cityParks = ringsToD(cityParkRings, 1.6);

// parks in the Hyde Park frame (already projected by the hp prep)
const hpParks = (hpLayers.parks ?? [])
  .map((p) => ringToD(simplify(quantize(p.ring ?? p), 0)))
  .join("");

// the citywide lake fill: shoreline hull closed against a far east
// edge, with vertical overshoot so camera moves never reveal a seam
const LAKE_OVER = 400;
// hull input includes the HOLC polygons so the shoreline follows the
// surveyed suburbs (Evanston to the north) where the city limits stop
const holcRingsCity = frames.areas
  .flatMap((a) => a.rings.citywide ?? [])
  .filter(ringInFrame);
const shoreline = easternHull(
  caRingsCity.concat(holcRingsCity),
  cityCrop.y - LAKE_OVER,
  cityCrop.y + cityCrop.h + LAKE_OVER,
  6
);
let cityLake = "";
if (shoreline.length > 2) {
  const first = shoreline[0];
  const last = shoreline[shoreline.length - 1];
  const eastEdge = cityCrop.x + cityCrop.w + LAKE_OVER;
  const lakeRing = [
    [first[0], cityCrop.y - LAKE_OVER],
    ...shoreline,
    [last[0], cityCrop.y + cityCrop.h + LAKE_OVER],
    [eastEdge, cityCrop.y + cityCrop.h + LAKE_OVER],
    [eastEdge, cityCrop.y - LAKE_OVER],
  ];
  cityLake = ringToD(simplify(quantize(lakeRing), 1.2));
}

// --- Hyde Park base layers (already in the hydePark frame) ---
const hpLake = ringToD(simplify(quantize(hpLayers.lake), 0));
const hpBoundary = ringToD(simplify(quantize(hpLayers.boundary), 0));

// the township boundary reprojected into the citywide frame (both are
// Web Mercator crops of one plane, so the transform is exact), for the
// finale sum state's ghost of where the walk began
const HP_FRAME = hpLayers.frame; // {zoom:15, center 41.7908,-87.5815, 2560x1440}
const [hpCx, hpCy] = worldPx(HP_FRAME.centerLat, HP_FRAME.centerLng, HP_FRAME.zoom);
const hpOx = hpCx - HP_FRAME.width / 2;
const hpOy = hpCy - HP_FRAME.height / 2;
const [cwCx, cwCy] = worldPx(CITYWIDE_FRAME.centerLat, CITYWIDE_FRAME.centerLng, CITYWIDE_FRAME.zoom);
const cwOx = cwCx - CITYWIDE_FRAME.width / 2;
const cwOy = cwCy - CITYWIDE_FRAME.height / 2;
const zScale = Math.pow(2, CITYWIDE_FRAME.zoom - HP_FRAME.zoom);
const hpToCity = ([x, y]) => [(x + hpOx) * zScale - cwOx, (y + hpOy) * zScale - cwOy];
const cityBoundary = ringToD(simplify(quantize(hpLayers.boundary.map(hpToCity)), 0.8));

// the one present-day mark sits at its true geography, East Woodlawn
// beside the Obama Center site, not at a label's typographic anchor
const [twX, twY] = projectCitywide(41.7801, -87.5958);
const todayAnchor = { x: Math.round(twX), y: Math.round(twY) };

// crop the hydePark framing to the township boundary plus air
let hbx = Infinity, hby = Infinity, hbX = -Infinity, hbY = -Infinity;
for (const [x, y] of hpLayers.boundary) {
  if (x < hbx) hbx = x;
  if (y < hby) hby = y;
  if (x > hbX) hbX = x;
  if (y > hbY) hbY = y;
}
const HP_PAD = 120;
const hpViewBox = `${Math.round(hbx - HP_PAD)} ${Math.round(hby - HP_PAD)} ${Math.round(hbX - hbx + HP_PAD * 2 + 160)} ${Math.round(hbY - hby + HP_PAD * 2)}`;
const hpLabels = hpLayers.labels.map((l) => ({
  t: l.t,
  x: Math.round(l.xy[0]),
  y: Math.round(l.xy[1]),
  role: l.role,
}));

// --- citywide labels, projected fresh (place anchors, not decoration) ---
const cityLabelDefs = [
  { t: "THE LOOP", lat: 41.8836, lng: -87.6297, role: "nbr" },
  { t: "HYDE PARK", lat: 41.7943, lng: -87.5629, role: "hero" },
  { t: "LAKE MICHIGAN", lat: 41.94, lng: -87.54, role: "water" },
  { t: "NORTH LAWNDALE", lat: 41.858, lng: -87.75, role: "nbr" },
  { t: "WOODLAWN", lat: 41.7765, lng: -87.65, role: "nbr" },
];
const cityLabels = cityLabelDefs.map((l) => {
  const [x, y] = projectCitywide(l.lat, l.lng);
  return { t: l.t, x: Math.round(x), y: Math.round(y), role: l.role };
});

// --- bombing marks (32 placeable incidents, citywide frame px).
//     Repeat attacks at one address would overplot to a single dot and
//     erase the record's core truth (the same families bombed again
//     and again), so co-located incidents fan out on a small
//     deterministic ring, well inside the documented 250m block
//     precision (~6 SVG units at this zoom). ---
const rawMarks = bombings.incidents
  .filter((i) => i.geo && i.geo.frame)
  .map((i) => ({
    id: i.id,
    x: Math.round(i.geo.frame.x * 10) / 10,
    y: Math.round(i.geo.frame.y * 10) / 10,
    precision: i.precision,
  }));
const byLoc = new Map();
for (const m of rawMarks) {
  const key = `${m.x},${m.y}`;
  const list = byLoc.get(key) ?? [];
  list.push(m);
  byLoc.set(key, list);
}
const RING_R = 5.5;
const marks = [];
for (const list of byLoc.values()) {
  if (list.length === 1) {
    marks.push({ ...list[0], siblings: 1 });
    continue;
  }
  list.forEach((m, i) => {
    const angle = (2 * Math.PI * i) / list.length - Math.PI / 2;
    marks.push({
      ...m,
      x: Math.round((m.x + RING_R * Math.cos(angle)) * 10) / 10,
      y: Math.round((m.y + RING_R * Math.sin(angle)) * 10) / 10,
      siblings: list.length,
    });
  });
}

// --- the commission's square (41st/60th/Cottage Grove/State), if we can place it ---
// State St ~ -87.6270, Cottage Grove ~ -87.6063, 41st ~ 41.8216, 60th ~ 41.7857
const sq1 = projectCitywide(41.8216, -87.627);
const sq2 = projectCitywide(41.7857, -87.6063);
const square = {
  x: Math.round(Math.min(sq1[0], sq2[0])),
  y: Math.round(Math.min(sq1[1], sq2[1])),
  w: Math.round(Math.abs(sq2[0] - sq1[0])),
  h: Math.round(Math.abs(sq2[1] - sq1[1])),
};

// --- flood order from sheet filing dates ---
const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
function parseFilingDate(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  const mMatch = s.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/);
  const yMatch = s.match(/(?:'|19)(\d{2})/);
  if (!yMatch) return null;
  const year = 1900 + parseInt(yMatch[1], 10);
  const month = mMatch ? MONTHS[mMatch[0]] : 6;
  // the survey ran 1939 to 1940; anything else is a transcription slip
  if (year < 1939 || year > 1940) return null;
  return year * 100 + month;
}
const dated = [];
const undated = [];
const described = new Set();
for (const key of Object.keys(descriptions.areas)) {
  const a = descriptions.areas[key];
  described.add(a.areaId);
  const parsed = parseFilingDate(a.security_grade_fields && a.security_grade_fields.date);
  if (parsed) dated.push([a.areaId, parsed]);
  else undated.push(a.areaId);
}
dated.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
undated.sort((a, b) => a - b);
const sheetless = frames.areas
  .map((a) => a.id)
  .filter((id) => !described.has(id))
  .sort((a, b) => a - b);
const dateSpread = {};
for (const [, ym] of dated) dateSpread[ym] = (dateSpread[ym] || 0) + 1;

// --- Black Belt crop for the docket scene: marks + square + margin,
//     held to the frame aspect so the viewBox swap is a pure crop ---
const xs = marks.map((m) => m.x).concat([square.x, square.x + square.w]);
const ys = marks.map((m) => m.y).concat([square.y, square.y + square.h]);
// R10 recomposition: wider, with extra east reach so the shoreline
// anchors the memorial frame and the marks sit off-center with air
const MARGIN = 84;
const EAST_EXTRA = 120;
let bx = Math.min(...xs) - MARGIN;
let by = Math.min(...ys) - MARGIN;
let bw = Math.max(...xs) + MARGIN + EAST_EXTRA - bx;
let bh = Math.max(...ys) + MARGIN - by;
const aspect = VIEW_W / VIEW_H;
if (bw / bh > aspect) {
  const nh = bw / aspect;
  by -= (nh - bh) / 2;
  bh = nh;
} else {
  const nw = bh * aspect;
  bx -= (nw - bw) / 2;
  bw = nw;
}
const blackBeltViewBox = `${Math.round(bx)} ${Math.round(by)} ${Math.round(bw)} ${Math.round(bh)}`;

// ------------------------------------------------------------------
// R10 one-plane detail (BUILT, then RULED OUT by the R10 council:
// cross-frame changes stay cuts staged as a second sheet on the desk;
// see design/R10/council-verdict.md section 1). The reprojection code
// below is kept working but its output is no longer emitted.
// ------------------------------------------------------------------
function ringToD1(ring) {
  // 0.1px precision variant of ringToD for deep-zoom geometry
  if (!ring.length) return "";
  const q = (v) => Math.round(v * 10) / 10;
  let d = `M${q(ring[0][0])} ${q(ring[0][1])}`;
  for (let i = 1; i < ring.length; i++) d += `L${q(ring[i][0])} ${q(ring[i][1])}`;
  return d + "Z";
}
/** drop a closing duplicate without quantizing; simplify() degenerates
 *  on closed rings (the chord becomes a point) */
function openRing(ring) {
  if (ring.length > 1) {
    const [fx, fy] = ring[0];
    const [lx, ly] = ring[ring.length - 1];
    if (Math.abs(fx - lx) < 1e-6 && Math.abs(fy - ly) < 1e-6) return ring.slice(0, -1);
  }
  return ring;
}
const townBBoxRaw = (() => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of hpLayers.boundary.map(hpToCity)) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
})();
const DETAIL_PAD = 30; // citywide px of air around the township
function ringNearTownship(ring) {
  return ring.some(
    ([x, y]) =>
      x >= townBBoxRaw.x0 - DETAIL_PAD &&
      x <= townBBoxRaw.x1 + DETAIL_PAD &&
      y >= townBBoxRaw.y0 - DETAIL_PAD &&
      y <= townBBoxRaw.y1 + DETAIL_PAD
  );
}
// fine per-grade fills near the township, from the hp frame's own
// higher-zoom rings carried through the exact affine
const detailFills = { A: "", B: "", C: "", D: "", U: "" };
let detailAreas = 0;
for (const area of frames.areas) {
  const rings = area.rings.hydePark;
  if (!rings || !rings.length) continue;
  const cityRings = rings.map((r) => r.map(hpToCity)).filter(ringNearTownship);
  if (!cityRings.length) continue;
  const d = cityRings.map((r) => ringToD1(simplify(openRing(r), 0.15))).join("");
  if (!d) continue;
  const g = ["A", "B", "C", "D"].includes(area.grade) ? area.grade : "U";
  detailFills[g] += d;
  detailAreas++;
}
const detail = {
  fills: detailFills,
  lake: ringToD1(simplify(openRing(hpLayers.lake.map(hpToCity)), 0.15)),
  boundary: ringToD1(simplify(openRing(hpLayers.boundary.map(hpToCity)), 0.15)),
  parks: (hpLayers.parks ?? [])
    .map((p) => ringToD1(simplify(openRing((p.ring ?? p).map(hpToCity)), 0.15)))
    .join(""),
  labels: hpLayers.labels.map((l) => {
    const [x, y] = hpToCity(l.xy);
    return { t: l.t, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, role: l.role };
  }),
};

// ------------------------------------------------------------------
// R10 veil holes: real-geometry cutouts for the spotlight veil, one
// path string each, ready to concatenate after the veil's frame rect
// (fill-rule evenodd punches the hole). Community-area polygons for
// the neighborhoods, the real park footprint for the fair, the
// township chain for the plan area.
// ------------------------------------------------------------------
function caHole(names) {
  const rings = communityAreas.features
    .filter((f) => names.includes(String(f.properties?.community ?? "").toUpperCase()))
    .flatMap((f) => projectRings(f, projectCitywide))
    .filter(ringInFrame);
  return ringsToD(rings, 1.2);
}
const jacksonParkHole = (() => {
  // the largest park ring whose bbox contains the fair label anchor
  // (Jackson Park), from the citywide parks source
  const [jx, jy] = projectCitywide(41.7827, -87.5806);
  const rings = parksCpd.features
    .flatMap((f) => projectRings(f, projectCitywide))
    .filter((ring) => {
      const b = ringsBBox([ring]);
      return b && jx >= b.x && jx <= b.x + b.w && jy >= b.y && jy <= b.y + b.h;
    })
    .sort((a, b) => {
      const ba = ringsBBox([a]);
      const bb = ringsBBox([b]);
      return bb.w * bb.h - ba.w * ba.h;
    });
  return rings.length ? ringsToD([rings[0]], 1.2) : "";
})();
const veilHoles = {
  lawndale: caHole(["NORTH LAWNDALE"]),
  woodlawn: caHole(["WOODLAWN"]),
  jacksonPark: jacksonParkHole,
  township: cityBoundary,
  // the same hole in the Hyde Park frame's own coordinates (the veil
  // works on both sheets; a1-fair lifts the fairgrounds)
  jacksonParkHp: (hpLayers.parks ?? [])
    .filter((p) => /jackson/i.test(p.name ?? ""))
    .map((p) => ringToD(simplify(quantize(p.ring ?? p), 0)))
    .join(""),
};

// ------------------------------------------------------------------
// R10 PLSS mile section grid, 1832-1889 ground only. Chicago's grid
// arithmetic (State/Madison origin, 800 address units to the mile) is
// the same deterministic system exhibit-prep-bombings.mjs documents
// and calibrates; the mile lines are the rectangular survey's own
// instrument, drawn schematically across the frame's land.
// ------------------------------------------------------------------
const MADISON_LAT = 41.8819;
const STATE_LNG = -87.6278;
const DEG_LAT_PER_MILE = 0.014483; // the theory value the bombing prep validates against
const DEG_LNG_PER_MILE = DEG_LAT_PER_MILE / Math.cos((41.85 * Math.PI) / 180);
function sectionGrid(project, x0, y0, x1, y1, step = 1) {
  let d = "";
  for (let m = -30; m <= 30; m += step) {
    const [vx] = project(MADISON_LAT, STATE_LNG + m * DEG_LNG_PER_MILE);
    if (vx >= x0 && vx <= x1) d += `M${Math.round(vx)} ${Math.round(y0)}V${Math.round(y1)}`;
    const [, hy] = project(MADISON_LAT - m * DEG_LAT_PER_MILE, STATE_LNG);
    if (hy >= y0 && hy <= y1) d += `M${Math.round(x0)} ${Math.round(hy)}H${Math.round(x1)}`;
  }
  return d;
}
const cityGrid = sectionGrid(
  projectCitywide,
  cityCrop.x,
  cityCrop.y,
  cityCrop.x + cityCrop.w,
  cityCrop.y + cityCrop.h
);
const projectHp = projector(HP_FRAME);
const hpVb = hpViewBox.split(" ").map(Number);
// the township plat carries section AND half-section lines (the
// quarter-section system the half-mile streets follow)
const hpGrid = sectionGrid(projectHp, hpVb[0], hpVb[1], hpVb[0] + hpVb[2], hpVb[1] + hpVb[3], 0.5);

// ------------------------------------------------------------------
// R10 named focus targets: real bounding boxes (citywide frame px)
// the camera can move to. Each derives from recorded geometry, never
// from a typographic anchor.
// ------------------------------------------------------------------
function ringsBBox(rings) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return x0 === Infinity ? null : { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
}
function caBBox(names) {
  const rings = communityAreas.features
    .filter((f) => names.includes(String(f.properties?.community ?? "").toUpperCase()))
    .flatMap((f) => projectRings(f, projectCitywide));
  return ringsBBox(rings);
}
const marksBBox = ringsBBox([marks.map((m) => [m.x, m.y])]);
const southSideParts = [];
const focus = {
  // the community the contract-selling act studies
  lawndale: caBBox(["NORTH LAWNDALE"]),
  // where the ground is moving in 2026
  woodlawn: caBBox(["WOODLAWN"]),
  // the walk's home ground
  hydeParkKenwood: caBBox(["HYDE PARK", "KENWOOD"]),
  // the commission's square with the marks around it
  bombingField: ringsBBox([[
    [Math.min(square.x, marksBBox.x), Math.min(square.y, marksBBox.y)],
    [Math.max(square.x + square.w, marksBBox.x + marksBBox.w), Math.max(square.y + square.h, marksBBox.y + marksBBox.h)],
  ]]),
  // the 2026 ring at its true geography
  today: { x: todayAnchor.x - 90, y: todayAnchor.y - 90, w: 180, h: 180 },
  // the old township ghost on the citywide frame
  township: ringsBBox([hpLayers.boundary.map(hpToCity)]),
};
// a medium south-side shot for the flood's opening beat, the union of
// the bombing field, the township, and Woodlawn with breathing room
{
  const parts = [focus.bombingField, focus.township, focus.woodlawn, focus.hydeParkKenwood].filter(Boolean);
  const x0 = Math.min(...parts.map((b) => b.x)) - 60;
  const y0 = Math.min(...parts.map((b) => b.y)) - 60;
  const x1 = Math.max(...parts.map((b) => b.x + b.w)) + 60;
  const y1 = Math.max(...parts.map((b) => b.y + b.h)) + 60;
  focus.southSide = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const out = {
  attribution: frames.attribution,
  generatedBy: "scripts/exhibit-ground-prep.mjs",
  citywideFrame: CITYWIDE_FRAME,
  citywide: {
    viewBox: cityViewBox,
    blackBeltViewBox,
    gradeFills: citywide.gradeFills,
    areas: citywide.areas,
    labels: cityLabels,
    marks,
    square,
    boundary: cityBoundary,
    todayAnchor,
    // R10 ground plane. `land` doubles as the neighborhood fabric when
    // stroked. Sources: City of Chicago Data Portal community areas
    // (igwz-8jzy) and Chicago Park District park boundaries.
    ground: {
      land: cityLand,
      lake: cityLake,
      parks: cityParks,
      grid: cityGrid,
    },
    veilHoles,
    focus,
  },
  hydePark: {
    viewBox: hpViewBox,
    gradeFills: hydePark.gradeFills,
    lake: hpLake,
    boundary: hpBoundary,
    labels: hpLabels,
    ground: {
      parks: hpParks,
      grid: hpGrid,
    },
  },
  floodOrder: { dated, undated, sheetless },
};

mkdirSync("src/lib/exhibit/ground", { recursive: true });
const json = JSON.stringify(out);
writeFileSync("src/lib/exhibit/ground/geometry.json", json);

const gz = gzipSync(json).length;
const cityAreasBytes = JSON.stringify(citywide.areas).length;
console.log(`geometry.json  raw ${(json.length / 1024).toFixed(0)}KB  gz ${(gz / 1024).toFixed(0)}KB`);
console.log(`  citywide: ${citywide.areas.length} areas (culled ${citywide.culled}), per-area bytes ${(cityAreasBytes / 1024).toFixed(0)}KB raw`);
console.log(`  hydePark: culled ${hydePark.culled}`);
console.log(`  marks ${marks.length}, square ${JSON.stringify(square)}`);
console.log(`  flood: dated ${dated.length}, undated ${undated.length}, sheetless ${sheetless.length}`);
console.log(`  filing-date spread:`, JSON.stringify(dateSpread));
if (gz > 80 * 1024) {
  console.error(`FAIL: ${(gz / 1024).toFixed(0)}KB gz exceeds the 80KB budget`);
  process.exit(1);
}
