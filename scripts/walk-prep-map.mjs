#!/usr/bin/env node
// ------------------------------------------------------------------
// Jackson Park walking-tour map prep. Parses the cached Census
// TIGER/Line 2023 shapefiles (public domain, already in
// data/exhibit-src) down to a Jackson Park frame, projects every
// feature onto a metrically-true local plane, clips it to the frame,
// and writes one compact JSON the map component imports directly:
//   src/lib/tours/walk-geometry.json
//     { frame, viewBox, water: [...],
//       roads: {arterials, locals, alleys}, rails: [...] }
// Client-side projection of live lat/lng (user location, stops) is
//   x = (lng - frame.lngMin) / (frame.lngMax - frame.lngMin) * viewBox.w
//   y = (frame.latMax - lat) / (frame.latMax - frame.latMin) * viewBox.h
// which is metrically correct because viewBox.h is derived with the
// cos(latMid) correction below. Re-run: node scripts/walk-prep-map.mjs
// Source: U.S. Census Bureau TIGER/Line 2023 (tl_2023_17031_roads,
// tl_2023_17031_areawater, tl_2023_us_rails).
// ------------------------------------------------------------------
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "data/exhibit-src";
const OUT = "src/lib/tours/walk-geometry.json";

// Hyde Park proper for the racial-history walk: 51st St down past
// the Midway, Washington Park's edge to the lake. (The old Jackson
// Park frame was latMin 41.7705, latMax 41.801, lngMin -87.605,
// lngMax -87.568; restore it and re-run to bring that map back.)
const F = { latMin: 41.7815, latMax: 41.8045, lngMin: -87.612, lngMax: -87.572 };
const LAT_MID = (F.latMin + F.latMax) / 2;
const COS = Math.cos((LAT_MID * Math.PI) / 180);
const W = 1000;
const H = Math.round((W * (F.latMax - F.latMin)) / ((F.lngMax - F.lngMin) * COS));

const px = (lng) => ((lng - F.lngMin) / (F.lngMax - F.lngMin)) * W;
const py = (lat) => ((F.latMax - lat) / (F.latMax - F.latMin)) * H;
const rnd = (v) => Math.round(v * 100) / 100;

// padded clip window in projected units so strokes don't end visibly
// at the frame edge
const PAD = 40;
const CLIP = { x0: -PAD, y0: -PAD, x1: W + PAD, y1: H + PAD };

// --- minimal DBF reader (fixed-width ASCII records) ---
function readDbf(path) {
  const buf = readFileSync(path);
  const recordCount = buf.readUInt32LE(4);
  const headerSize = buf.readUInt16LE(8);
  const recordSize = buf.readUInt16LE(10);
  const fields = [];
  for (let off = 32; off < headerSize - 1; off += 32) {
    if (buf[off] === 0x0d) break;
    const name = buf.toString("ascii", off, off + 11).replace(/\0.*$/, "");
    const len = buf[off + 16];
    fields.push({ name, len });
  }
  const rows = [];
  for (let r = 0; r < recordCount; r++) {
    const base = headerSize + r * recordSize;
    let pos = base + 1; // deletion flag
    const row = {};
    for (const f of fields) {
      row[f.name] = buf.toString("ascii", pos, pos + f.len).trim();
      pos += f.len;
    }
    rows.push(row);
  }
  return rows;
}

// --- minimal SHP reader (types 3 polyline and 5 polygon) ---
function readShp(path) {
  const buf = readFileSync(path);
  const shapes = [];
  let off = 100;
  while (off < buf.length) {
    const contentLen = buf.readUInt32BE(off + 4) * 2;
    const type = buf.readInt32LE(off + 8);
    if (type === 3 || type === 5) {
      const numParts = buf.readInt32LE(off + 44);
      const numPoints = buf.readInt32LE(off + 48);
      const parts = [];
      for (let p = 0; p < numParts; p++) parts.push(buf.readInt32LE(off + 52 + p * 4));
      parts.push(numPoints);
      const ptBase = off + 52 + numParts * 4;
      const partLines = [];
      for (let p = 0; p < numParts; p++) {
        const line = [];
        for (let i = parts[p]; i < parts[p + 1]; i++) {
          const x = buf.readDoubleLE(ptBase + i * 16);
          const y = buf.readDoubleLE(ptBase + i * 16 + 8);
          line.push([x, y]); // [lng, lat]
        }
        partLines.push(line);
      }
      shapes.push(partLines);
    } else {
      shapes.push(null);
    }
    off += 8 + contentLen;
  }
  return shapes;
}

const project = (line) => line.map(([lng, lat]) => [rnd(px(lng)), rnd(py(lat))]);

const inClip = ([x, y]) => x >= CLIP.x0 && x <= CLIP.x1 && y >= CLIP.y0 && y <= CLIP.y1;

/** split a projected polyline into the pieces inside the clip window,
 *  keeping one outside point at each end so strokes exit the frame */
function clipLine(line) {
  const pieces = [];
  let cur = null; // null = currently outside
  let prevOutside = null;
  for (const pt of line) {
    if (inClip(pt)) {
      if (!cur) cur = prevOutside ? [prevOutside] : [];
      cur.push(pt);
      prevOutside = null;
    } else {
      if (cur) {
        cur.push(pt);
        if (cur.length > 1) pieces.push(cur);
        cur = null;
      }
      prevOutside = pt;
    }
  }
  if (cur && cur.length > 1) pieces.push(cur);
  return pieces;
}

/** Sutherland-Hodgman clip of a projected polygon ring to the window */
function clipRing(ring) {
  const edges = [
    (p) => p[0] >= CLIP.x0,
    (p) => p[0] <= CLIP.x1,
    (p) => p[1] >= CLIP.y0,
    (p) => p[1] <= CLIP.y1,
  ];
  const cross = [
    (a, b) => [CLIP.x0, a[1] + ((b[1] - a[1]) * (CLIP.x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [CLIP.x1, a[1] + ((b[1] - a[1]) * (CLIP.x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (CLIP.y0 - a[1])) / (b[1] - a[1]), CLIP.y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (CLIP.y1 - a[1])) / (b[1] - a[1]), CLIP.y1],
  ];
  let poly = ring;
  for (let e = 0; e < 4; e++) {
    const inside = edges[e];
    const inter = cross[e];
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const aIn = inside(a);
      const bIn = inside(b);
      if (aIn) {
        next.push(a);
        if (!bIn) next.push(inter(a, b));
      } else if (bIn) {
        next.push(inter(a, b));
      }
    }
    poly = next;
    if (!poly.length) return null;
  }
  return poly.map(([x, y]) => [rnd(x), rnd(y)]);
}

function thin(line, n) {
  if (line.length <= 2 || n <= 1) return line;
  const out = [];
  for (let i = 0; i < line.length; i += n) out.push(line[i]);
  if (out[out.length - 1] !== line[line.length - 1]) out.push(line[line.length - 1]);
  return out;
}

const touchesFrame = (line) =>
  line.some(
    ([lng, lat]) => lat >= F.latMin && lat <= F.latMax && lng >= F.lngMin && lng <= F.lngMax
  );

// ---- roads ----
const roadShapes = readShp(`${SRC}/tl_2023_17031_roads.shp`);
const roadRows = readDbf(`${SRC}/tl_2023_17031_roads.dbf`);
const arterials = [];
const locals = [];
const alleys = [];
roadRows.forEach((row, i) => {
  const shape = roadShapes[i];
  if (!shape) return;
  const cls = row.MTFCC;
  // S1100/S1200 highways + arterials, S1400 locals, S1730 alleys as
  // the finest hairline texture of the engraved plat
  if (cls !== "S1100" && cls !== "S1200" && cls !== "S1400" && cls !== "S1730") return;
  for (const line of shape) {
    if (!touchesFrame(line)) continue;
    const pieces = clipLine(project(thin(line, 1)));
    for (const p of pieces) {
      if (cls === "S1730") alleys.push(p);
      else if (cls === "S1400") locals.push(p);
      else arterials.push(p);
    }
  }
});

// ---- rails (the IC embankment carries this tour's whole story) ----
const rails = [];
if (existsSync(`${SRC}/tl_2023_us_rails.shp`)) {
  const railShapes = readShp(`${SRC}/tl_2023_us_rails.shp`);
  for (const shape of railShapes) {
    if (!shape) continue;
    for (const line of shape) {
      if (!touchesFrame(line)) continue;
      const pieces = clipLine(project(thin(line, 1)));
      rails.push(...pieces);
    }
  }
} else {
  console.warn("rails source missing (tl_2023_us_rails.shp); map ships without rail lines");
}

// ---- water (the lagoons carry the whole map) ----
const waterShapes = readShp(`${SRC}/tl_2023_17031_areawater.shp`);
const waterRows = readDbf(`${SRC}/tl_2023_17031_areawater.dbf`);
const water = [];
waterRows.forEach((row, i) => {
  const shape = waterShapes[i];
  if (!shape) return;
  for (const ring of shape) {
    if (!touchesFrame(ring)) continue;
    const clipped = clipRing(project(ring));
    if (clipped && clipped.length > 3) {
      water.push({ name: row.FULLNAME || "", ring: clipped });
    }
  }
});

const out = {
  source:
    "U.S. Census Bureau TIGER/Line 2023, tl_2023_17031_roads, tl_2023_17031_areawater, and tl_2023_us_rails (public domain)",
  frame: F,
  viewBox: { w: W, h: H },
  water,
  roads: { arterials, locals, alleys },
  rails,
};
writeFileSync(OUT, JSON.stringify(out));
const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024);
console.log(
  `walk-geometry: ${water.length} water rings, ${arterials.length} arterials, ${locals.length} locals, ${alleys.length} alleys, ${rails.length} rail pieces, viewBox ${W}x${H}, ${kb} KB`
);
