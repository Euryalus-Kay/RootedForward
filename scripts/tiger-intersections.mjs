#!/usr/bin/env node
// ------------------------------------------------------------------
// Find street intersections in Census TIGER/Line road data.
//
// Written for Walk Harlem. Geocoding services put an intersection
// wherever their address interpolation lands, which is often mid
// block, and the tour map is drawn from TIGER geometry. Reading the
// corner out of the same shapefile the map uses means every stop pin
// sits exactly on the drawn street rather than a few metres off it.
//
// Usage:
//   node scripts/tiger-intersections.mjs <county-fips> <<'JSON'
//   [{"id":"hotel-theresa","a":"W 125th St","b":"Adam Clayton Powell Jr Blvd"}]
//   JSON
//
// Street names are matched case-insensitively as substrings of
// TIGER's FULLNAME, so "125th" matches "W 125th St". Prints JSON.
// ------------------------------------------------------------------
import { readFileSync } from "node:fs";

const SRC = "data/exhibit-src";
const county = process.argv[2] || "36061";

/* ---- minimal DBF reader (fixed-width ASCII records) ---- */
function readDbf(path) {
  const buf = readFileSync(path);
  const recordCount = buf.readUInt32LE(4);
  const headerSize = buf.readUInt16LE(8);
  const recordSize = buf.readUInt16LE(10);
  const fields = [];
  for (let off = 32; off < headerSize - 1; off += 32) {
    if (buf[off] === 0x0d) break;
    fields.push({
      name: buf.toString("ascii", off, off + 11).replace(/\0.*$/, ""),
      len: buf[off + 16],
    });
  }
  const rows = [];
  for (let r = 0; r < recordCount; r++) {
    let pos = headerSize + r * recordSize + 1;
    const row = {};
    for (const f of fields) {
      row[f.name] = buf.toString("ascii", pos, pos + f.len).trim();
      pos += f.len;
    }
    rows.push(row);
  }
  return rows;
}

/* ---- minimal SHP reader (type 3 polyline) ---- */
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
      for (let p = 0; p < numParts; p++)
        parts.push(buf.readInt32LE(off + 52 + p * 4));
      parts.push(numPoints);
      const ptBase = off + 52 + numParts * 4;
      const partLines = [];
      for (let p = 0; p < numParts; p++) {
        const line = [];
        for (let i = parts[p]; i < parts[p + 1]; i++) {
          line.push([
            buf.readDoubleLE(ptBase + i * 16),
            buf.readDoubleLE(ptBase + i * 16 + 8),
          ]);
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

const shapes = readShp(`${SRC}/tl_2023_${county}_roads.shp`);
const rows = readDbf(`${SRC}/tl_2023_${county}_roads.dbf`);

/** every segment belonging to streets whose FULLNAME contains `name` */
function segmentsFor(name) {
  const needle = name.toLowerCase();
  const segs = [];
  rows.forEach((row, i) => {
    if (!row.FULLNAME || !row.FULLNAME.toLowerCase().includes(needle)) return;
    const shape = shapes[i];
    if (!shape) return;
    for (const line of shape) {
      for (let k = 0; k < line.length - 1; k++) {
        segs.push([line[k], line[k + 1]]);
      }
    }
  });
  return segs;
}

/** true crossing point of two segments, or null */
function cross(p1, p2, p3, p4) {
  const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
  if (Math.abs(d) < 1e-14) return null;
  const t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
  const u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
}

/** closest approach between two segments, as a fallback when TIGER
 *  splits a corner into two nodes that do not quite touch */
function nearest(a, b) {
  let best = null;
  for (const pa of a) {
    for (const pb of b) {
      const dx = pa[0] - pb[0];
      const dy = pa[1] - pb[1];
      const d2 = dx * dx + dy * dy;
      if (!best || d2 < best.d2) {
        best = { d2, pt: [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2] };
      }
    }
  }
  return best;
}

const input = JSON.parse(readFileSync(0, "utf8"));
const out = [];

for (const want of input) {
  const A = segmentsFor(want.a);
  const B = segmentsFor(want.b);
  if (!A.length || !B.length) {
    out.push({
      ...want,
      error: `no segments for ${!A.length ? want.a : want.b}`,
    });
    continue;
  }
  const hits = [];
  for (const [a1, a2] of A) {
    for (const [b1, b2] of B) {
      const p = cross(a1, a2, b1, b2);
      if (p) hits.push(p);
    }
  }
  if (hits.length) {
    // several TIGER segments can meet at one corner; average them
    const lng = hits.reduce((s, p) => s + p[0], 0) / hits.length;
    const lat = hits.reduce((s, p) => s + p[1], 0) / hits.length;
    out.push({ id: want.id, lat: +lat.toFixed(6), lng: +lng.toFixed(6), how: "crossing", hits: hits.length });
  } else {
    const n = nearest(A.flat(), B.flat());
    const gapMeters = Math.round(Math.sqrt(n.d2) * 111320);
    out.push({
      id: want.id,
      lat: +n.pt[1].toFixed(6),
      lng: +n.pt[0].toFixed(6),
      how: "nearest",
      gapMeters,
    });
  }
}

console.log(JSON.stringify(out, null, 1));
