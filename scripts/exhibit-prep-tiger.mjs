#!/usr/bin/env node
// ------------------------------------------------------------------
// R11 geography prep. Parses the cached Census TIGER/Line 2023
// shapefiles (public domain) for Cook County roads and area water
// plus Illinois places, filters them to the exhibit's frames, and
// writes compact JSON caches under data/exhibit-src:
//   tiger-roads.json   { arterials: [...lines], locals: [...lines] }
//   tiger-water.json   { polys: [{name, rings}] }
//   tiger-places.json  { polys: [{name, rings}] }
// Coordinates stay lat/lng (5 decimals, ~1m); projection happens in
// exhibit-ground-prep.mjs like every other layer. Re-run:
//   node scripts/exhibit-prep-tiger.mjs
// Source: U.S. Census Bureau TIGER/Line 2023 (tl_2023_17031_roads,
// tl_2023_17031_areawater, tl_2023_17_place).
// ------------------------------------------------------------------
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SRC = "data/exhibit-src";

// the exhibit's outermost useful extent, the citywide frame plus air
// (lat/lng box derived from the 2560x1440 z11.2 frame at 41.845/-87.675)
const BOUNDS = { latMin: 41.44, latMax: 42.25, lngMin: -88.15, lngMax: -87.2 };

function unzip(base) {
  if (!existsSync(`${SRC}/${base}.shp`)) {
    execSync(`unzip -o ${SRC}/${base}.zip -d ${SRC} >/dev/null`);
  }
}

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
          line.push([Math.round(x * 1e5) / 1e5, Math.round(y * 1e5) / 1e5]); // [lng, lat]
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

function inBounds(line) {
  return line.some(
    ([lng, lat]) =>
      lat >= BOUNDS.latMin && lat <= BOUNDS.latMax && lng >= BOUNDS.lngMin && lng <= BOUNDS.lngMax
  );
}

/** thin a polyline by keeping every nth point (TIGER roads are dense;
 *  display simplification happens later in frame units) */
function thin(line, n) {
  if (line.length <= 2) return line;
  const out = [];
  for (let i = 0; i < line.length; i += n) out.push(line[i]);
  if (out[out.length - 1] !== line[line.length - 1]) out.push(line[line.length - 1]);
  return out;
}

// ---- roads ----
unzip("tl_2023_17031_roads");
const roadShapes = readShp(`${SRC}/tl_2023_17031_roads.shp`);
const roadRows = readDbf(`${SRC}/tl_2023_17031_roads.dbf`);
const arterials = [];
const locals = [];
let dropped = 0;
roadRows.forEach((row, i) => {
  const shape = roadShapes[i];
  if (!shape) return;
  const cls = row.MTFCC;
  for (const line of shape) {
    if (!inBounds(line)) {
      dropped++;
      continue;
    }
    if (cls === "S1100" || cls === "S1200") arterials.push(thin(line, 2));
    else if (cls === "S1400") locals.push(thin(line, 3));
  }
});
writeFileSync(
  `${SRC}/tiger-roads.json`,
  JSON.stringify({
    source: "U.S. Census Bureau TIGER/Line 2023, tl_2023_17031_roads (public domain)",
    arterials,
    locals,
  })
);
console.log(`roads: ${arterials.length} arterial lines, ${locals.length} local lines (dropped ${dropped} out of bounds)`);

// ---- area water ----
unzip("tl_2023_17031_areawater");
const waterShapes = readShp(`${SRC}/tl_2023_17031_areawater.shp`);
const waterRows = readDbf(`${SRC}/tl_2023_17031_areawater.dbf`);
const waterPolys = [];
waterRows.forEach((row, i) => {
  const shape = waterShapes[i];
  if (!shape) return;
  const awater = Number(row.AWATER ?? 0);
  // keep named water and anything larger than ~4 hectares; unnamed
  // slivers are retention ponds that read as noise at map scale
  if (!row.FULLNAME && awater < 40000) return;
  const rings = shape.filter(inBounds);
  if (!rings.length) return;
  waterPolys.push({ name: row.FULLNAME || "", rings: rings.map((r) => thin(r, 2)) });
});
writeFileSync(
  `${SRC}/tiger-water.json`,
  JSON.stringify({
    source: "U.S. Census Bureau TIGER/Line 2023, tl_2023_17031_areawater (public domain)",
    polys: waterPolys,
  })
);
console.log(`water: ${waterPolys.length} polys (${waterPolys.filter((w) => /chicago riv/i.test(w.name)).length} river pieces, ${waterPolys.filter((w) => /lake mich/i.test(w.name)).length} lake pieces)`);

// ---- places (municipal landmass; Chicago's neighbors give the map
//      its suburban ground) ----
unzip("tl_2023_17_place");
const placeShapes = readShp(`${SRC}/tl_2023_17_place.shp`);
const placeRows = readDbf(`${SRC}/tl_2023_17_place.dbf`);
const placePolys = [];
placeRows.forEach((row, i) => {
  const shape = placeShapes[i];
  if (!shape) return;
  const rings = shape.filter(inBounds);
  if (!rings.length) return;
  placePolys.push({ name: row.NAME, rings: rings.map((r) => thin(r, 2)) });
});
writeFileSync(
  `${SRC}/tiger-places.json`,
  JSON.stringify({
    source: "U.S. Census Bureau TIGER/Line 2023, tl_2023_17_place (public domain)",
    polys: placePolys,
  })
);
console.log(`places: ${placePolys.length} municipal polys in frame`);
