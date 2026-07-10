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

// --- Hyde Park base layers (already in the hydePark frame) ---
const hpLake = ringToD(simplify(quantize(hpLayers.lake), 0));
const hpBoundary = ringToD(simplify(quantize(hpLayers.boundary), 0));

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
const MARGIN = 60;
let bx = Math.min(...xs) - MARGIN;
let by = Math.min(...ys) - MARGIN;
let bw = Math.max(...xs) + MARGIN - bx;
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
  },
  hydePark: {
    viewBox: hpViewBox,
    gradeFills: hydePark.gradeFills,
    lake: hpLake,
    boundary: hpBoundary,
    labels: hpLabels,
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
