#!/usr/bin/env node
/**
 * exhibit-prep-holc.mjs
 * HOLC (redlining) data pipeline for the museum-exhibit page. Zero dependencies.
 *
 * INPUTS
 *   public/data/redlining-urban-heat-tree-canopy/holc-chicago-1938-zones.geojson
 *     703 features (city_id 45, the Chicago metro Security Map), grades A/B/C/D,
 *     ~20 null grades (non-residential), a couple of grades with stray trailing
 *     spaces ("A ", "C ").
 *   https://github.com/americanpanorama/HOLC_Area_Description_Data
 *     ad_data.json (37MB, regularized area descriptions; Chicago = city_id 45,
 *     576 entries, surveyed Oct 1939 - Mar 1940) plus City_Form_Codebook.csv and
 *     Form_Schema/City_Form_ids.csv. Both codebook files say Chicago used the
 *     "1939" form (scanned as Form_Schema/AD-Form-4.png); the form_id field
 *     inside ad_data.json mislabels Chicago as 19371001, but the Chicago key set
 *     (1935/1937 Price Bracket, Overhang, Total Tax Rate, Predominating/Other
 *     Type columns) matches AD-Form-4 exactly. Historical field labels below are
 *     transcribed verbatim from that scan.
 *
 * OUTPUTS
 *   public/exhibit-data/holc-chicago.geojson   simplified polygons, < 300KB
 *   public/exhibit-data/holc-frames.json       rings projected into both frames
 *   data/exhibit-src/ad-data-chicago.json      raw verbatim Chicago ad subset
 *   data/exhibit-src/City_Form_Codebook.csv    cached codebook (provenance)
 *   data/exhibit-src/City_Form_ids.csv         cached form-id map (provenance)
 *   data/exhibit/holc_descriptions.json        verbatim surveyor excerpts
 *   data/exhibit/grade_your_block.json         1939-40 form fields + lock rule
 *
 * PROJECTION FRAMES (Web Mercator, replicating scripts/hp-map-real.py exactly:
 * n = 256 * 2^z world pixels; x = (lon+180)/360 * n;
 * y = (1 - ln(tan(lat) + sec(lat)) / pi) / 2 * n; canvas origin at
 * worldPx(center) - canvas/2; toCanvas = worldPx - origin)
 *
 *   hydePark  zoom 15     center 41.7908, -87.5815   canvas 2560x1440
 *             (identical constants to hp-map-real.py)
 *   citywide  zoom 10.65  center 41.8722, -87.8030   canvas 2560x1440
 *             Chosen so the bbox of ALL 703 Chicago HOLC polygons
 *             (lng -88.08152..-87.5245, lat 41.4587..42.28303) PLUS the
 *             exhibit square bounded by 41st St (41.8225), 60th St (41.7855),
 *             Cottage Grove (-87.6063), State St (-87.6270) fits with margin:
 *             zoom = floor(min(log2(2560*0.88/(256*dxMercFrac)),
 *                              log2(1440*0.88/(256*dyMercFrac))) * 20) / 20,
 *             center = inverse-Mercator midpoint of that bbox. At z 10.65 the
 *             bbox projects to 636.5 x 1264.9 px, minimum margin 87.5 px.
 *             Fractional zoom is exact in the formula; raster tiles (if ever
 *             wanted underneath) would need scaling by 2^0.65 from z10.
 *
 * USAGE
 *   node scripts/exhibit-prep-holc.mjs            (uses cached data/exhibit-src/)
 *   node scripts/exhibit-prep-holc.mjs --refresh  (refetches remote sources)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC_GEOJSON = path.join(
  ROOT, "public", "data", "redlining-urban-heat-tree-canopy", "holc-chicago-1938-zones.geojson"
);
const SRC_DIR = path.join(ROOT, "data", "exhibit-src");
const OUT_DATA_DIR = path.join(ROOT, "data", "exhibit");
const OUT_PUBLIC_DIR = path.join(ROOT, "public", "exhibit-data");
const AD_CHICAGO_CACHE = path.join(SRC_DIR, "ad-data-chicago.json");

const REPO = "americanpanorama/HOLC_Area_Description_Data";
const RAW = (branch, file) => `https://raw.githubusercontent.com/${REPO}/${branch}/${file}`;
const BRANCHES = ["main", "master"]; // main 404s today; master is live. Try both.

const ATTRIBUTION =
  "Polygons and area descriptions from Mapping Inequality (Robert K. Nelson, " +
  "LaDale Winling, et al., University of Richmond Digital Scholarship Lab), " +
  "CC BY-NC 4.0. Underlying HOLC records are public domain.";
const LICENSE = "CC BY-NC 4.0";

const CANVAS_W = 2560;
const CANVAS_H = 1440;
const FRAMES = {
  hydePark: { zoom: 15, centerLat: 41.7908, centerLng: -87.5815, width: CANVAS_W, height: CANVAS_H },
  // Tightened at integration: the exhibit cold open needs the CITY prominent,
  // not the whole metro. Suburban HOLC areas intentionally clip off-canvas
  // (SVG simply does not paint them); the exhibit square check below still holds.
  citywide: { zoom: 11.2, centerLat: 41.8450, centerLng: -87.6750, width: CANVAS_W, height: CANVAS_H },
};
// The exhibit square that must fit in the citywide frame (41st/60th/Cottage Grove/State)
const EXHIBIT_SQUARE = { minLat: 41.7855, maxLat: 41.8225, minLng: -87.627, maxLng: -87.6063 };

const GEOJSON_BYTE_CAP = 300 * 1024;
const FRAMES_BYTE_CAP = 900 * 1024;
const EXCERPT_MAX = 320;
const CHICAGO_CITY_ID = 45;

const REFRESH = process.argv.includes("--refresh");

/* ------------------------------------------------------------------ */
/* Web Mercator projection (exact replica of hp-map-real.py)           */
/* ------------------------------------------------------------------ */

function worldPx(lat, lng, z) {
  const n = 256 * 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return [x, y];
}

function makeProjector(frame) {
  const [cx, cy] = worldPx(frame.centerLat, frame.centerLng, frame.zoom);
  const ox = cx - frame.width / 2;
  const oy = cy - frame.height / 2;
  return (lat, lng) => {
    const [x, y] = worldPx(lat, lng, frame.zoom);
    return [x - ox, y - oy];
  };
}

const round1 = (v) => Math.round(v * 10) / 10;
const round5 = (v) => Math.round(v * 1e5) / 1e5;

/* ------------------------------------------------------------------ */
/* Douglas-Peucker in a plain 2D space                                 */
/* ------------------------------------------------------------------ */

function perpDist2(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const ex = p[0] - a[0], ey = p[1] - a[1];
    return ex * ex + ey * ey;
  }
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = a[0] + t * dx, py = a[1] + t * dy;
  const ex = p[0] - px, ey = p[1] - py;
  return ex * ex + ey * ey;
}

// Open polyline DP, keeps endpoints. Iterative stack to avoid recursion limits.
function dpOpen(points, tol) {
  const n = points.length;
  if (n <= 2) return points.slice();
  const tol2 = tol * tol;
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    let maxD = -1, maxK = -1;
    for (let k = i + 1; k < j; k++) {
      const d = perpDist2(points[k], points[i], points[j]);
      if (d > maxD) { maxD = d; maxK = k; }
    }
    if (maxD > tol2 && maxK > 0) {
      keep[maxK] = 1;
      stack.push([i, maxK], [maxK, j]);
    }
  }
  const out = [];
  for (let k = 0; k < n; k++) if (keep[k]) out.push(points[k]);
  return out;
}

function dedupeConsecutive(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = out[out.length - 1];
    if (points[i][0] !== prev[0] || points[i][1] !== prev[1]) out.push(points[i]);
  }
  return out;
}

// Simplify a closed ring (first == last). Splits at the vertex farthest from
// point 0 so DP has two real anchors, then rejoins and re-closes. Guarantees
// >= 4 positions (triangle + closing point) by retrying with smaller tolerance
// and finally falling back to the unsimplified ring.
function simplifyRing(ring, tol) {
  let open = ring.slice();
  if (open.length > 1) {
    const first = open[0], last = open[open.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) open = open.slice(0, -1);
  }
  open = dedupeConsecutive(open);
  if (open.length < 3) return null; // degenerate in source; caller keeps original
  if (open.length === 3) return [...open, open[0]];

  let t = tol;
  for (let attempt = 0; attempt < 8; attempt++) {
    let far = 1, farD = -1;
    for (let i = 1; i < open.length; i++) {
      const dx = open[i][0] - open[0][0], dy = open[i][1] - open[0][1];
      const d = dx * dx + dy * dy;
      if (d > farD) { farD = d; far = i; }
    }
    const a = dpOpen(open.slice(0, far + 1), t);
    const b = dpOpen([...open.slice(far), open[0]], t);
    const merged = dedupeConsecutive([...a.slice(0, -1), ...b.slice(0, -1)]);
    if (merged.length >= 3) return [...merged, merged[0]];
    t /= 2;
  }
  return [...open, open[0]];
}

function mapRings(geometry, fn) {
  if (geometry.type === "Polygon") {
    return { type: "Polygon", coordinates: geometry.coordinates.map(fn) };
  }
  return {
    type: "MultiPolygon",
    coordinates: geometry.coordinates.map((poly) => poly.map(fn)),
  };
}

function eachRing(geometry, fn) {
  if (geometry.type === "Polygon") geometry.coordinates.forEach(fn);
  else geometry.coordinates.forEach((poly) => poly.forEach(fn));
}

function polygonCount(geometry) {
  return geometry.type === "Polygon" ? 1 : geometry.coordinates.length;
}

/* ------------------------------------------------------------------ */
/* Fetch helpers                                                       */
/* ------------------------------------------------------------------ */

async function fetchToFile(urls, dest, { timeoutMs = 180000, attempts = 2 } = {}) {
  let lastErr = null;
  for (const url of urls) {
    for (let i = 0; i < attempts; i++) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(dest));
        clearTimeout(timer);
        return url;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        console.warn(`  fetch failed (${url}, attempt ${i + 1}): ${err.message}`);
      }
    }
  }
  throw lastErr ?? new Error("fetch failed");
}

async function fetchTextCached(file, dest, { force = false } = {}) {
  if (!force && fs.existsSync(dest)) return "cache";
  const urls = BRANCHES.map((b) => RAW(b, file));
  const used = await fetchToFile(urls, dest, { timeoutMs: 30000 });
  return used;
}

/* ------------------------------------------------------------------ */
/* Step 1+2: load, clean, simplify, write holc-chicago.geojson         */
/* ------------------------------------------------------------------ */

function loadCleanFeatures() {
  const gj = JSON.parse(fs.readFileSync(SRC_GEOJSON, "utf8"));
  return gj.features.map((f) => {
    const rawGrade = f.properties.grade;
    const grade = typeof rawGrade === "string" && rawGrade.trim() ? rawGrade.trim() : "ungraded";
    const name = typeof f.properties.name === "string" && f.properties.name.trim()
      ? f.properties.name.trim()
      : null;
    return {
      areaId: f.properties.area_id,
      grade,
      label: typeof f.properties.label === "string" ? f.properties.label.trim() : f.properties.label,
      name,
      residential: f.properties.residential === true,
      labelCoords: Array.isArray(f.properties.label_coords) && f.properties.label_coords.length === 2
        ? f.properties.label_coords
        : null,
      geometry: f.geometry,
    };
  });
}

function quantizeGeometry(geometry) {
  return mapRings(geometry, (ring) => {
    const q = dedupeConsecutive(ring.map(([lng, lat]) => [round5(lng), round5(lat)]));
    const first = q[0], last = q[q.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) q.push([first[0], first[1]]);
    return q;
  });
}

function simplifyGeometry(geometry, tol) {
  return mapRings(geometry, (ring) => {
    const s = simplifyRing(ring, tol);
    if (!s) return ring; // keep degenerate source ring untouched
    return s.map(([x, y]) => [round5(x), round5(y)]);
  });
}

function gradeCounts(features) {
  const counts = {};
  for (const f of features) counts[f.grade] = (counts[f.grade] || 0) + 1;
  return counts;
}

function buildGeojson(features) {
  return {
    type: "FeatureCollection",
    license: LICENSE,
    attribution: ATTRIBUTION,
    features: features.map((f) => ({
      type: "Feature",
      properties: {
        area_id: f.areaId,
        grade: f.grade,
        label: f.label,
        name: f.name,
        residential: f.residential,
      },
      geometry: f.geometry,
    })),
  };
}

function validateFeatures(features, refCounts, refPolyCount, stage) {
  const counts = gradeCounts(features);
  for (const g of new Set([...Object.keys(counts), ...Object.keys(refCounts)])) {
    if (counts[g] !== refCounts[g]) {
      throw new Error(`${stage}: grade count changed for ${g}: ${refCounts[g]} -> ${counts[g]}`);
    }
  }
  let polys = 0;
  let minRing = Infinity;
  for (const f of features) {
    polys += polygonCount(f.geometry);
    eachRing(f.geometry, (ring) => {
      if (ring.length < 4) throw new Error(`${stage}: ring with ${ring.length} points on area ${f.areaId}`);
      const first = ring[0], last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        throw new Error(`${stage}: unclosed ring on area ${f.areaId}`);
      }
      minRing = Math.min(minRing, ring.length);
    });
  }
  if (polys !== refPolyCount) {
    throw new Error(`${stage}: polygon count changed ${refPolyCount} -> ${polys}`);
  }
  return { counts, polys, minRing };
}

/* ------------------------------------------------------------------ */
/* Step 3: project into frames                                         */
/* ------------------------------------------------------------------ */

function ringCentroid(ring) {
  // shoelace centroid over [lng, lat]; falls back to vertex mean when area ~ 0
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(a) < 1e-12) {
    let sx = 0, sy = 0;
    for (const [x, y] of ring) { sx += x; sy += y; }
    return [sx / ring.length, sy / ring.length];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

function largestOuterRing(geometry) {
  let best = null, bestA = -1;
  const outers = geometry.type === "Polygon"
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map((p) => p[0]);
  for (const ring of outers) {
    let a = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    a = Math.abs(a);
    if (a > bestA) { bestA = a; best = ring; }
  }
  return best;
}

function flattenRings(geometry) {
  const rings = [];
  eachRing(geometry, (r) => rings.push(r));
  return rings;
}

function projectRing(ring, project) {
  const projected = ring.map(([lng, lat]) => {
    const [x, y] = project(lat, lng);
    return [round1(x), round1(y)];
  });
  const deduped = dedupeConsecutive(projected.slice(0, -1));
  if (deduped.length >= 3) return [...deduped, deduped[0]];
  return projected; // keep even if pixel-collapsed rather than dropping the ring
}

function buildFrames(features, projectors) {
  const areas = features.map((f) => {
    const [clat, clng] = f.labelCoords ?? (() => {
      const [lng, lat] = ringCentroid(largestOuterRing(f.geometry));
      return [lat, lng];
    })();
    const rings = flattenRings(f.geometry);
    const entry = {
      id: f.areaId,
      grade: f.grade,
      label: f.label,
      name: f.name,
      centroid: {},
      rings: {},
    };
    for (const [frameName, project] of Object.entries(projectors)) {
      entry.centroid[frameName] = project(clat, clng).map(round1);
      entry.rings[frameName] = rings.map((r) => projectRing(r, project));
    }
    return entry;
  });
  return { attribution: ATTRIBUTION, frames: FRAMES, areas };
}

function coarsenCitywide(framesDoc, tolPx) {
  for (const area of framesDoc.areas) {
    area.rings.citywide = area.rings.citywide.map((ring) => {
      const s = simplifyRing(ring, tolPx);
      if (!s) return ring;
      return s.map(([x, y]) => [round1(x), round1(y)]);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Step 4: area descriptions                                           */
/* ------------------------------------------------------------------ */

async function loadChicagoAd() {
  if (!REFRESH && fs.existsSync(AD_CHICAGO_CACHE)) {
    console.log("ad data: using cached " + path.relative(ROOT, AD_CHICAGO_CACHE));
    return JSON.parse(fs.readFileSync(AD_CHICAGO_CACHE, "utf8"));
  }
  const tmp = path.join(os.tmpdir(), `holc-ad-data-${process.pid}.json`);
  try {
    console.log("ad data: fetching ad_data.json (37MB)...");
    const used = await fetchToFile(BRANCHES.map((b) => RAW(b, "ad_data.json")), tmp, {
      timeoutMs: 300000,
      attempts: 2,
    });
    console.log("ad data: fetched from " + used);
    const all = JSON.parse(fs.readFileSync(tmp, "utf8"));
    const chicago = all.filter((e) => e.city_id === CHICAGO_CITY_ID);
    if (!chicago.length) throw new Error("no Chicago (city_id 45) entries found in ad_data.json");
    fs.writeFileSync(AD_CHICAGO_CACHE, JSON.stringify(chicago));
    console.log(`ad data: saved ${chicago.length} raw Chicago entries to ${path.relative(ROOT, AD_CHICAGO_CACHE)}`);
    return chicago;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const TELLING = /negro|colored|foreign|infiltrat|racial|race\b|white|italian|polish|jew|mexican|greek|bohemian|lithuanian|undesirable|encroach|blight|slum|restrict/i;

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=["(A-Z0-9])/)
    .filter(Boolean);
}

function truncateAtWord(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const atWord = cut.slice(0, cut.lastIndexOf(" "));
  return (atWord.length > 40 ? atWord : cut).replace(/[\s,;]+$/, "") + "…";
}

// Pick a verbatim contiguous excerpt from the remarks, preferring the first
// sentence run that contains the racial/ethnic language the exhibit documents.
function pickExcerpt(entry) {
  const remarks = (entry.clarifying_remarks || "").trim();
  if (remarks) {
    const sentences = splitSentences(remarks);
    let start = sentences.findIndex((s) => TELLING.test(s));
    if (start === -1) start = 0;
    let excerpt = "";
    for (let i = start; i < sentences.length; i++) {
      const next = excerpt ? excerpt + " " + sentences[i] : sentences[i];
      if (next.length > EXCERPT_MAX) break;
      excerpt = next;
    }
    if (!excerpt) excerpt = truncateAtWord(sentences[start], EXCERPT_MAX);
    return {
      excerpt,
      excerptField: "clarifying_remarks",
      excerptLabel: "8. Description and Characteristics of Area",
    };
  }
  const fallbacks = [
    ["occupation_or_type", "1b. Class and Occupation"],
    ["infiltration_of", "1e. Shifting or Infiltration"],
    ["foreign_born_nationality", "1c. Foreign Families: Nationalities"],
  ];
  for (const [field, label] of fallbacks) {
    const v = (entry[field] || "").trim();
    if (v) return { excerpt: truncateAtWord(v, EXCERPT_MAX), excerptField: field, excerptLabel: label };
  }
  return null;
}

const RAW_USEFUL_FIELDS = [
  "security_grade",
  "area_number",
  "location",
  "date",
  "occupation_or_type",
  "foreign_born_percent",
  "foreign_born_nationality",
  "negro_percent",
  "infiltration_of",
  "population.increasing",
  "population.decreasing",
  "population.static",
  "mortagage_funds",
];

// A chunk of the upstream transcription was mangled by Excel: values like a
// "95-100" percentage or an area number "D-74" were parsed as dates and now
// read "December 30, 1899" / "March 14, 1900" (about 116-127 of the 576
// Chicago entries per affected column). Those values are meaningless, so the
// curated output omits them and lists the affected keys per area instead.
// The raw cache (ad-data-chicago.json) keeps them verbatim. The `date` field
// legitimately holds dates and is exempt.
const EXCEL_DATE_MANGLE =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+(18|19)\d\d$/;

// Further transcription damage found in review (July 2026):
//   - one row (security_grade "C-57") has every population column shifted
//     one field over, so percentages sit in text fields and vice versa;
//   - one A-area's location column duplicates the sheet date ("Nov'39"),
//     which then rendered as the area's display name;
//   - one date column holds a raw Excel serial number ("14702").
// Those values are omitted, listed under corruptedFields so the reading
// room's disclaimer fires, and never used as a display name.
const DATE_SHAPED =
  /^(Jan|Feb|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s*'?\s*(\d{2}|(18|19)\d\d)$/i;
const EXCEL_SERIAL = /^\d{4,6}$/;
const PERCENT_SHAPED = /^\d+(?:[./-]\d+)?\s*%$/;
const TRANSCRIBER_NOTE = /^\*.*\*$/;
// an area number ("C-57") sitting in the security_grade column marks a
// whole row whose population columns are offset
const GRADE_HOLDS_AREA_NUMBER = /^[A-D]\s*-?\s*\d+$/i;
const SHIFTED_ROW_FIELDS = [
  "security_grade", "area_number", "location", "occupation_or_type",
  "foreign_born_percent", "foreign_born_nationality", "negro_percent",
  "infiltration_of",
];

function usableName(candidate) {
  const v = (candidate || "").trim();
  if (!v) return null;
  if (DATE_SHAPED.test(v) || PERCENT_SHAPED.test(v) || EXCEL_SERIAL.test(v)) return null;
  if (TRANSCRIBER_NOTE.test(v)) return null;
  return v;
}

function buildDescriptions(chicagoAd, featureById) {
  const areas = [];
  let corruptedValues = 0;
  for (const entry of chicagoAd) {
    const feature = featureById.get(entry.area_id);
    if (!feature) continue;
    const picked = pickExcerpt(entry);
    if (!picked) continue;
    const shiftedRow = GRADE_HOLDS_AREA_NUMBER.test((entry.security_grade || "").trim());
    const rawFields = {};
    const corrupted = [];
    for (const k of RAW_USEFUL_FIELDS) {
      const v = typeof entry[k] === "string" ? entry[k].trim() : entry[k];
      if (v === undefined || v === null || v === "") continue;
      const mangled =
        (k !== "date" && typeof v === "string" && EXCEL_DATE_MANGLE.test(v)) ||
        (k === "date" && typeof v === "string" && EXCEL_SERIAL.test(v)) ||
        (k === "location" && typeof v === "string" && DATE_SHAPED.test(v)) ||
        (shiftedRow && SHIFTED_ROW_FIELDS.includes(k));
      if (mangled) {
        corrupted.push(k);
        corruptedValues++;
        continue;
      }
      rawFields[k] = entry[k];
    }
    const area = {
      areaId: entry.area_id,
      grade: feature.grade,
      name: shiftedRow ? null : (feature.name ?? usableName(entry.location)),
      excerpt: picked.excerpt,
      excerptField: picked.excerptField,
      excerptLabel: picked.excerptLabel,
      security_grade_fields: rawFields,
    };
    if (corrupted.length) area.corruptedFields = corrupted;
    areas.push(area);
  }
  areas.sort((a, b) => String(a.grade).localeCompare(String(b.grade)) ||
    String(a.name ?? "").localeCompare(String(b.name ?? "")) || a.areaId - b.areaId);
  console.log(`descriptions: omitted ${corruptedValues} mangled field values (keys listed per area under corruptedFields)`);
  return {
    attribution: ATTRIBUTION,
    note:
      "Chicago was surveyed September 1939 to April 1940 and the map issued " +
      "in 1940. Some fields in the source transcription were mangled in " +
      "transit through Excel (a percentage stored as 'December 30, 1899', a " +
      "date stored as a serial number, one row's columns shifted). Those " +
      "values are omitted from security_grade_fields and their keys listed " +
      "under corruptedFields; mis-parsed location values are never used as " +
      "display names. The raw verbatim source is " +
      "data/exhibit-src/ad-data-chicago.json.",
    areas,
  };
}

/* ------------------------------------------------------------------ */
/* Step 5: grade_your_block.json                                       */
/* ------------------------------------------------------------------ */

// Historical labels transcribed verbatim from Form_Schema/AD-Form-4.png (the
// 1939 form; Chicago sheets were filled out Oct 1939 - Mar 1940 on this form).
// fieldId = the regularized ad_data.json key so the exhibit can look up the
// real value for any area; formItem = the schema id printed on the scan.
const FORM_FIELDS = [
  { fieldId: "occupation_or_type", formItem: "1-B", section: "1. POPULATION", historicalLabel: "Class and Occupation", type: "text" },
  { fieldId: "foreign_born_percent", formItem: "1-C-1", section: "1. POPULATION", historicalLabel: "Foreign Families ____ %", type: "percent" },
  { fieldId: "foreign_born_nationality", formItem: "1-C-2", section: "1. POPULATION", historicalLabel: "Nationalities", type: "text" },
  { fieldId: "negro_percent", formItem: "1-D", section: "1. POPULATION", historicalLabel: "Negro ____ %", type: "percent" },
  { fieldId: "infiltration_of", formItem: "1-E", section: "1. POPULATION", historicalLabel: "Shifting or Infiltration", type: "text" },
  { fieldId: "buildings_type", formItem: "2-A-1", section: "2. BUILDINGS (Predominating)", historicalLabel: "Type and Size", type: "text" },
  { fieldId: "construction", formItem: "2-B-1", section: "2. BUILDINGS (Predominating)", historicalLabel: "Construction", type: "select" },
  { fieldId: "average_age", formItem: "2-C-1", section: "2. BUILDINGS (Predominating)", historicalLabel: "Average Age", type: "text" },
  { fieldId: "repair", formItem: "2-D-1", section: "2. BUILDINGS (Predominating)", historicalLabel: "Repair", type: "select" },
  { fieldId: "home_ownership", formItem: "2-F-1", section: "2. BUILDINGS (Predominating)", historicalLabel: "Owner-occupied", type: "percent" },
  { fieldId: "predicted_price_trend", formItem: "2-K-1", section: "2. BUILDINGS (Predominating)", historicalLabel: "Predicted Price Trend (next 6-12 months)", type: "select" },
  { fieldId: "mortagage_funds", formItem: "6", section: "6. MORTGAGE FUNDS", historicalLabel: "Mortgage Funds", type: "select" },
];

function deriveOptions(chicagoAd, fieldId, max = 6) {
  const freq = new Map();
  for (const e of chicagoAd) {
    const raw = typeof e[fieldId] === "string" ? e[fieldId].trim() : "";
    if (!raw) continue;
    const key = raw.toLowerCase();
    const cur = freq.get(key);
    if (cur) cur.n++;
    else freq.set(key, { n: 1, value: raw });
  }
  return [...freq.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, max)
    .map((o) => o.value);
}

function scoreSample(entry) {
  const remarks = entry.clarifying_remarks || "";
  let score = Math.min(remarks.length, 900) / 100;
  if (TELLING.test(remarks)) score += 6;
  if ((entry.negro_percent || "").trim() && !/^0%?$/.test(entry.negro_percent.trim())) score += 2;
  if ((entry.infiltration_of || "").trim()) score += 1;
  return score;
}

function pickSampleAreas(chicagoAd, descById) {
  const MUST = [1499, 1500, 1488]; // C214 + C215 (Hyde Park/Kenwood), D74 (the 41st-60th, State-Cottage Grove square)
  const usable = chicagoAd.filter((e) => descById.has(e.area_id));
  const byId = new Map(usable.map((e) => [e.area_id, e]));
  for (const id of MUST) {
    if (!byId.has(id)) throw new Error(`sample area ${id} (Hyde Park/Kenwood/Black Belt) has no description`);
  }
  const chosen = [...MUST];
  const wantGrades = ["A", "B", "C", "D", "D"];
  const ranked = usable
    .filter((e) => !chosen.includes(e.area_id))
    .sort((a, b) => scoreSample(b) - scoreSample(a));
  for (const g of wantGrades) {
    const pick = ranked.find((e) => e.grade === g && !chosen.includes(e.area_id));
    if (pick) chosen.push(pick.area_id);
    if (chosen.length >= 8) break;
  }
  return chosen.slice(0, 8);
}

function buildGradeYourBlock(chicagoAd, descById) {
  const fields = FORM_FIELDS.map((f) => {
    const out = { ...f };
    if (f.type === "select") out.options = deriveOptions(chicagoAd, f.fieldId);
    return out;
  });
  return {
    source: {
      title: "HOLC Area Description form, Chicago 1939-40",
      via: "Mapping Inequality / HOLC_Area_Description_Data",
      url: `https://github.com/${REPO}`,
      formImage: RAW("master", "Form_Schema/AD-Form-4.png"),
    },
    attribution: ATTRIBUTION,
    fields,
    lockRule: {
      fieldId: "negro_percent",
      note: "any nonzero entry locks grade to D",
    },
    sampleAreas: pickSampleAreas(chicagoAd, descById),
  };
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */

function writeJson(file, doc, { pretty = false } = {}) {
  const body = pretty ? JSON.stringify(doc, null, 2) : JSON.stringify(doc);
  fs.writeFileSync(file, body);
  return Buffer.byteLength(body);
}

const kb = (bytes) => (bytes / 1024).toFixed(1) + "KB";

async function main() {
  for (const dir of [SRC_DIR, OUT_DATA_DIR, OUT_PUBLIC_DIR]) fs.mkdirSync(dir, { recursive: true });

  /* --- geometry --- */
  const features = loadCleanFeatures();
  const refCounts = gradeCounts(features);
  let refPolys = 0;
  for (const f of features) refPolys += polygonCount(f.geometry);

  for (const f of features) f.geometry = quantizeGeometry(f.geometry);

  let tol = 0.0002;
  let simplified = null;
  let geojsonBytes = Infinity;
  for (let i = 0; i < 24; i++) {
    simplified = features.map((f) => ({ ...f, geometry: simplifyGeometry(f.geometry, tol) }));
    geojsonBytes = Buffer.byteLength(JSON.stringify(buildGeojson(simplified)));
    if (geojsonBytes < GEOJSON_BYTE_CAP) break;
    tol *= 1.4;
  }
  if (geojsonBytes >= GEOJSON_BYTE_CAP) throw new Error("could not simplify geojson under 300KB");
  const geoCheck = validateFeatures(simplified, refCounts, refPolys, "geojson");
  const geojsonPath = path.join(OUT_PUBLIC_DIR, "holc-chicago.geojson");
  writeJson(geojsonPath, buildGeojson(simplified));

  /* --- frames --- */
  const projectors = Object.fromEntries(
    Object.entries(FRAMES).map(([name, frame]) => [name, makeProjector(frame)])
  );
  // sanity: the exhibit square (and downtown anchor) must fit; suburban polygons may clip
  {
    const p = projectors.citywide;
    const pts = [
      [EXHIBIT_SQUARE.minLat, EXHIBIT_SQUARE.minLng],
      [EXHIBIT_SQUARE.minLat, EXHIBIT_SQUARE.maxLng],
      [EXHIBIT_SQUARE.maxLat, EXHIBIT_SQUARE.minLng],
      [EXHIBIT_SQUARE.maxLat, EXHIBIT_SQUARE.maxLng],
      [41.8781, -87.6298], // the Loop stays comfortably on canvas
    ];
    for (const [lat, lng] of pts) {
      const [x, y] = p(lat, lng);
      if (x < 120 || x > CANVAS_W - 120 || y < 120 || y > CANVAS_H - 120) {
        throw new Error(`citywide frame margin fails at (${lat}, ${lng}) -> (${x.toFixed(1)}, ${y.toFixed(1)})`);
      }
    }
  }

  const framesDoc = buildFrames(simplified, projectors);
  let framesBytes = Buffer.byteLength(JSON.stringify(framesDoc));
  let citywideTol = 0;
  if (framesBytes > FRAMES_BYTE_CAP) {
    citywideTol = 2;
    for (let i = 0; i < 10 && framesBytes > FRAMES_BYTE_CAP; i++) {
      coarsenCitywide(framesDoc, citywideTol);
      framesBytes = Buffer.byteLength(JSON.stringify(framesDoc));
      citywideTol *= 1.5;
    }
  }
  const framesPath = path.join(OUT_PUBLIC_DIR, "holc-frames.json");
  framesBytes = writeJson(framesPath, framesDoc);

  /* --- descriptions --- */
  const featureById = new Map(simplified.map((f) => [f.areaId, f]));
  let chicagoAd = null;
  let adError = null;
  try {
    chicagoAd = await loadChicagoAd();
  } catch (err) {
    adError = err;
    console.error("ad data unreachable: " + err.message);
  }
  try {
    const cb1 = await fetchTextCached("City_Form_Codebook.csv", path.join(SRC_DIR, "City_Form_Codebook.csv"), { force: REFRESH });
    const cb2 = await fetchTextCached("Form_Schema/City_Form_ids.csv", path.join(SRC_DIR, "City_Form_ids.csv"), { force: REFRESH });
    console.log(`codebook: City_Form_Codebook.csv (${cb1}), City_Form_ids.csv (${cb2})`);
  } catch (err) {
    console.warn("codebook fetch failed (labels are transcribed from the AD-Form-4 scan anyway): " + err.message);
  }

  const descPath = path.join(OUT_DATA_DIR, "holc_descriptions.json");
  const gybPath = path.join(OUT_DATA_DIR, "grade_your_block.json");
  let descDoc;
  let descBytes;
  let gybBytes = 0;
  if (chicagoAd) {
    descDoc = buildDescriptions(chicagoAd, featureById);
    descBytes = writeJson(descPath, descDoc, { pretty: true });
    const descById = new Map(descDoc.areas.map((a) => [a.areaId, a]));
    gybBytes = writeJson(gybPath, buildGradeYourBlock(chicagoAd, descById), { pretty: true });
  } else {
    descDoc = { attribution: ATTRIBUTION, status: "descriptions-unavailable", areas: [] };
    descBytes = writeJson(descPath, descDoc, { pretty: true });
    console.error("WROTE EMPTY holc_descriptions.json (status: descriptions-unavailable); grade_your_block.json NOT written");
  }

  /* --- validation report --- */
  const rel = (p) => path.relative(ROOT, p);
  console.log("\n=== exhibit-prep-holc validation ===");
  console.log(`geojson  ${rel(geojsonPath)}  ${kb(Buffer.byteLength(JSON.stringify(buildGeojson(simplified))))}  tol=${tol.toFixed(5)} deg`);
  console.log(`frames   ${rel(framesPath)}  ${kb(framesBytes)}  citywide extra tol=${citywideTol ? citywideTol / 1.5 + "px" : "none"}`);
  console.log(`desc     ${rel(descPath)}  ${kb(descBytes)}  areas=${descDoc.areas.length}${descDoc.status ? "  status=" + descDoc.status : ""}`);
  if (gybBytes) console.log(`gyb      ${rel(gybPath)}  ${kb(gybBytes)}`);
  console.log("grade counts (in == out):", JSON.stringify(geoCheck.counts));
  console.log(`polygons: ${geoCheck.polys} (source ${refPolys})  min ring points: ${geoCheck.minRing}`);
  console.log("citywide frame:", JSON.stringify(FRAMES.citywide));
  if (chicagoAd) {
    const joined = chicagoAd.filter((e) => featureById.has(e.area_id)).length;
    console.log(`ad join: ${joined}/${chicagoAd.length} ad entries matched to polygons`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
