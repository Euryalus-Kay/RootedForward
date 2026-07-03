#!/usr/bin/env node
/**
 * exhibit-prep-maps.mjs
 *
 * Museum-exhibit map layers for the Hyde Park frame.
 *
 * Inputs:
 *   data/hp-map-real.json        real Hyde Park boundary polygon + labels, projected onto
 *                                the 2560x1440 Web Mercator z=15 frame built by
 *                                scripts/hp-map-real.py (center 41.7908, -87.5815)
 *   data/geo/pk.geojson          Chicago Park District park boundaries (617 features).
 *                                NOTE: the copy in the repo has had all geometries
 *                                stripped (geometry: null on every feature). When that is
 *                                the case this script falls back to a cached re-fetch of
 *                                the same public dataset (City of Chicago data portal,
 *                                dataset ejsh-fztr) at data/exhibit-src/parks-cpd.geojson.
 *   data/geo/ca.geojson          community areas (for the Hyde Park + Kenwood union)
 *
 * Outputs:
 *   public/exhibit-data/hp-frame-layers.json
 *     { frame, attribution, lake, parks, boundary, labels }
 *     - lake: closed polygon derived from the eastern (shoreline) chain of the Hyde Park
 *       boundary, extended to the canvas top/bottom edges and the top-right/bottom-right
 *       corners. It is frame dressing derived from the real boundary, not an independent
 *       shoreline survey.
 *     - parks: park outer rings projected to the frame, lightly simplified (quantized to
 *       0.1 px, consecutive duplicates dropped, rings under 8 px^2 or outside the canvas
 *       + 50 px margin dropped). Holes are dropped and counted.
 *   public/exhibit-data/departures.json
 *     4,000 deterministic dots (mulberry32, seed 19580101) uniform inside the union of
 *     the HYDE PARK and KENWOOD community areas projected to the frame. They represent
 *     displaced-family counts at neighborhood granularity, NOT addresses; the note and
 *     seed are embedded in the file.
 *
 * Deterministic: same inputs => byte-identical outputs.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const HP_MAP_PATH = path.join(ROOT, "data", "hp-map-real.json");
const PK_PATH = path.join(ROOT, "data", "geo", "pk.geojson");
const PK_CACHE_PATH = path.join(ROOT, "data", "exhibit-src", "parks-cpd.geojson");
const PK_URL = "https://data.cityofchicago.org/api/geospatial/ejsh-fztr?method=export&format=GeoJSON";
const CA_PATH = path.join(ROOT, "data", "geo", "ca.geojson");
const OUT_DIR = path.join(ROOT, "public", "exhibit-data");
const LAYERS_OUT = path.join(OUT_DIR, "hp-frame-layers.json");
const DEPARTURES_OUT = path.join(OUT_DIR, "departures.json");

// Frame constants replicated from scripts/hp-map-real.py
const FRAME = { zoom: 15, centerLat: 41.7908, centerLng: -87.5815, width: 2560, height: 1440 };
const SEED = 19580101;
const DOTS = 4000;

// ---------------------------------------------------------------------------
// projection (Web Mercator, matching hp-map-real.py exactly)
// ---------------------------------------------------------------------------

const N = 256 * 2 ** FRAME.zoom;
const worldX = (lng) => ((lng + 180) / 360) * N;
const worldY = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * N;
};
const OX = worldX(FRAME.centerLng) - FRAME.width / 2;
const OY = worldY(FRAME.centerLat) - FRAME.height / 2;
const project = ([lng, lat]) => [worldX(lng) - OX, worldY(lat) - OY];
const q = (v) => Math.round(v * 10) / 10;

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(a / 2);
}

function pointInRings(x, y, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// 1. lake polygon from the eastern (shoreline) chain of hp_polygon
// ---------------------------------------------------------------------------

function buildLake(hpPolygon) {
  // drop closing duplicate vertex if present
  let ring = hpPolygon;
  const first = ring[0], last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) ring = ring.slice(0, -1);

  const ys = ring.map((p) => p[1]);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const nearTop = ring.map((p, i) => ({ p, i })).filter(({ p }) => p[1] < minY + 12);
  const nearBot = ring.map((p, i) => ({ p, i })).filter(({ p }) => p[1] > maxY - 12);
  const iNE = nearTop.reduce((a, b) => (b.p[0] > a.p[0] ? b : a)).i; // northeast corner
  const iSE = nearBot.reduce((a, b) => (b.p[0] > a.p[0] ? b : a)).i; // southeast corner

  const walk = (from, to, step) => {
    const out = [];
    for (let i = from; ; i = (i + step + ring.length) % ring.length) {
      out.push(ring[i]);
      if (i === to) break;
      if (out.length > ring.length) throw new Error("lake chain walk failed");
    }
    return out;
  };
  const fwd = walk(iNE, iSE, +1);
  const bwd = walk(iNE, iSE, -1);
  const meanX = (c) => c.reduce((s, p) => s + p[0], 0) / c.length;
  const chain = meanX(fwd) >= meanX(bwd) ? fwd : bwd; // the eastern path = the shoreline

  const lake = [
    [q(chain[0][0]), 0],
    ...chain.map(([x, y]) => [q(x), q(y)]),
    [q(chain[chain.length - 1][0]), FRAME.height],
    [FRAME.width, FRAME.height],
    [FRAME.width, 0],
  ];
  console.log(`[lake] shoreline chain ${chain.length} pts (NE idx ${iNE} at ${ring[iNE]}, SE idx ${iSE} at ${ring[iSE]}), lake polygon ${lake.length} pts`);
  return lake;
}

// ---------------------------------------------------------------------------
// 2. parks
// ---------------------------------------------------------------------------

async function loadParksGeo() {
  const usable = (g) => g && Array.isArray(g.features) && g.features.some((f) => f.geometry);
  try {
    const g = JSON.parse(fs.readFileSync(PK_PATH, "utf8"));
    if (usable(g)) {
      console.log(`[parks] using data/geo/pk.geojson (${g.features.length} features)`);
      return { geo: g, source: "data/geo/pk.geojson" };
    }
    console.warn(`[parks] data/geo/pk.geojson has ${g.features.length} features but every geometry is null (stripped copy); falling back to the cached Chicago Park District dataset`);
  } catch (err) {
    console.warn(`[parks] data/geo/pk.geojson unreadable (${err.message}); falling back`);
  }
  if (!fs.existsSync(PK_CACHE_PATH)) {
    console.log(`[parks] fetching ${PK_URL}`);
    try {
      const res = await fetch(PK_URL, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      JSON.parse(body); // validate before caching
      fs.mkdirSync(path.dirname(PK_CACHE_PATH), { recursive: true });
      fs.writeFileSync(PK_CACHE_PATH, body);
    } catch (err) {
      console.warn(`[parks] fetch failed (${err.message}); parks layer will be empty`);
      return { geo: null, source: null };
    }
  }
  const g = JSON.parse(fs.readFileSync(PK_CACHE_PATH, "utf8"));
  if (!usable(g)) {
    console.warn("[parks] cached dataset unusable; parks layer will be empty");
    return { geo: null, source: null };
  }
  console.log(`[parks] using cached ${path.relative(ROOT, PK_CACHE_PATH)} (${g.features.length} features)`);
  return { geo: g, source: "Chicago Park District park boundaries, City of Chicago Data Portal dataset ejsh-fztr (cached at data/exhibit-src/parks-cpd.geojson; data/geo/pk.geojson copy of the same dataset is geometry-stripped)" };
}

function buildParks(geo) {
  if (!geo) return { parks: [], stats: { features: 0, ringsKept: 0, ringsDropped: 0, holesDropped: 0 } };
  const MARGIN = 50;
  const parks = [];
  let ringsDropped = 0, holesDropped = 0;
  for (const f of geo.features) {
    if (!f.geometry) continue;
    const name = (f.properties?.label || f.properties?.park || "").trim();
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
    for (const poly of polys) {
      holesDropped += Math.max(0, poly.length - 1);
      const outer = poly[0];
      if (!outer || outer.length < 4) { ringsDropped++; continue; }
      let ring = outer.map((c) => project(c).map(q));
      // drop consecutive duplicates after quantization
      ring = ring.filter((p, i) => i === 0 || p[0] !== ring[i - 1][0] || p[1] !== ring[i - 1][1]);
      if (ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring = ring.slice(0, -1);
      if (ring.length < 3) { ringsDropped++; continue; }
      const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
      const inCanvas = Math.max(...xs) >= -MARGIN && Math.min(...xs) <= FRAME.width + MARGIN && Math.max(...ys) >= -MARGIN && Math.min(...ys) <= FRAME.height + MARGIN;
      if (!inCanvas || ringArea(ring) < 8) { ringsDropped++; continue; }
      parks.push(name ? { name, ring } : { ring });
    }
  }
  return { parks, stats: { features: geo.features.length, ringsKept: parks.length, ringsDropped, holesDropped } };
}

// ---------------------------------------------------------------------------
// 3. departure dots
// ---------------------------------------------------------------------------

function buildDepartures(caGeo) {
  const featureRings = (geom) => (geom.type === "Polygon" ? geom.coordinates : geom.coordinates.flat());
  const proj = (name) => {
    const f = caGeo.features.find((f) => f.properties.community === name);
    if (!f) throw new Error(`community area ${name} not found in ca.geojson`);
    return featureRings(f.geometry).map((ring) => ring.map((c) => project(c)));
  };
  const hp = proj("HYDE PARK");
  const kw = proj("KENWOOD");
  const inUnion = (x, y) => pointInRings(x, y, hp) || pointInRings(x, y, kw);

  const all = [...hp, ...kw].flat();
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const bbox = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  console.log(`[dots] union bbox px [${bbox.map((v) => v.toFixed(1)).join(", ")}] (canvas ${FRAME.width}x${FRAME.height}; Kenwood extends above the frame top)`);

  const rand = mulberry32(SEED);
  const points = [];
  let attempts = 0, inHp = 0;
  while (points.length < DOTS) {
    attempts++;
    if (attempts > DOTS * 400) throw new Error("rejection sampling did not converge");
    const x = bbox[0] + rand() * (bbox[2] - bbox[0]);
    const y = bbox[1] + rand() * (bbox[3] - bbox[1]);
    if (!inUnion(x, y)) continue;
    if (pointInRings(x, y, hp)) inHp++;
    points.push([q(x), q(y)]);
  }
  console.log(`[dots] ${points.length} dots after ${attempts} samples (acceptance ${((points.length / attempts) * 100).toFixed(1)}%), ${inHp} in Hyde Park / ${points.length - inHp} in Kenwood`);

  // verification pass: every emitted dot must still test inside the union
  const outside = points.filter(([x, y]) => !inUnion(x, y)).length;
  console.log(`[dots] re-verification: ${points.length - outside}/${points.length} inside the union polygon${outside ? ` (${outside} OUTSIDE, quantization drift)` : ""}`);

  return { points, inHp };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const hpMap = JSON.parse(fs.readFileSync(HP_MAP_PATH, "utf8"));
  if (hpMap.size[0] !== FRAME.width || hpMap.size[1] !== FRAME.height) {
    throw new Error(`frame size mismatch: hp-map-real.json is ${hpMap.size}, script expects ${FRAME.width}x${FRAME.height}`);
  }
  // projection self-check: reproject the Hyde Park boundary from ca.geojson and compare
  // with the first hp_polygon vertex written by hp-map-real.py
  const caGeo = JSON.parse(fs.readFileSync(CA_PATH, "utf8"));
  {
    const f = caGeo.features.find((f) => f.properties.community === "HYDE PARK");
    const rings = f.geometry.type === "Polygon" ? f.geometry.coordinates : f.geometry.coordinates.flat();
    const outer = rings.reduce((a, b) => (b.length > a.length ? b : a));
    const [x, y] = project(outer[0]);
    const [ex, ey] = hpMap.hp_polygon[0];
    const d = Math.hypot(x - ex, y - ey);
    console.log(`[frame] projection self-check vs hp-map-real.json first vertex: ${d.toFixed(2)} px drift`);
    if (d > 1) throw new Error("projection does not reproduce hp-map-real.py output; check frame constants");
  }

  const lake = buildLake(hpMap.hp_polygon);
  const { geo: parksGeo, source: parksSource } = await loadParksGeo();
  const { parks, stats } = buildParks(parksGeo);
  console.log(`[parks] kept ${stats.ringsKept} rings in frame (of ${stats.features} park features citywide), dropped ${stats.ringsDropped} rings (off-canvas/small), ${stats.holesDropped} interior holes not carried`);
  const named = parks.filter((p) => p.name);
  console.log(`[parks] ${named.length} rings carry names, e.g. ${[...new Set(named.map((p) => p.name))].slice(0, 8).join(", ")}`);

  const layers = {
    frame: FRAME,
    attribution: hpMap.attribution,
    sources: {
      boundaryAndLabels: "data/hp-map-real.json (real Hyde Park community-area boundary and label anchors projected by scripts/hp-map-real.py)",
      parks: parksSource || "unavailable at build time",
      lake: "derived from the eastern (shoreline) chain of the Hyde Park boundary polygon, extended to the canvas edges; frame dressing, not an independent shoreline survey",
    },
    lake,
    parks,
    boundary: hpMap.hp_polygon,
    labels: hpMap.labels,
  };
  fs.writeFileSync(LAYERS_OUT, JSON.stringify(layers) + "\n");

  const { points, inHp } = buildDepartures(caGeo);
  const departures = {
    note: "Dot positions are random within the Hyde Park-Kenwood community areas; they represent counts, not addresses.",
    seed: SEED,
    prng: "mulberry32",
    count: points.length,
    frame: FRAME,
    breakdown: { hydePark: inHp, kenwood: points.length - inHp },
    source: "Union of the HYDE PARK and KENWOOD community-area polygons from data/geo/ca.geojson, projected to the frame; uniform rejection sampling in frame space.",
    points,
  };
  fs.writeFileSync(DEPARTURES_OUT, JSON.stringify(departures) + "\n");

  for (const p of [LAYERS_OUT, DEPARTURES_OUT]) {
    console.log(`[out] wrote ${path.relative(ROOT, p)} (${(fs.statSync(p).size / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
