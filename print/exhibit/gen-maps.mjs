/* ------------------------------------------------------------------ */
/*  Map plates for The Ground Keeps Moving exhibition panels.          */
/*                                                                     */
/*  Two SVGs, both redrawn from data already in this repo rather       */
/*  than screenshotted from anything:                                  */
/*                                                                     */
/*    holc-map.svg   all 703 HOLC areas of the 1940 Chicago survey,    */
/*                   from public/exhibit-data/holc-chicago.geojson     */
/*                   (Mapping Inequality polygons, underlying HOLC     */
/*                   records public domain), over TIGER street         */
/*                   geometry, with the lake from TIGER water.         */
/*                                                                     */
/*    route-map.svg  the Walk Hyde Park route, stops numbered to       */
/*                   match the current tour document, over the same    */
/*                   TIGER street grid.                                */
/*                                                                     */
/*  Both are drawn in abstract units of 100 per inch at their          */
/*  intended print width, and placed by the panel layouts at that      */
/*  width or smaller, so strokes are chosen for print, not screen.     */
/*                                                                     */
/*    node print/exhibit/gen-maps.mjs                                  */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const OUT = join(HERE, "assets");
mkdirSync(OUT, { recursive: true });

/* ---------- palette (the exhibit tokens from globals.css) ---------- */
const LINEN = "#EDE6D6";
const LINEN_DEEP = "#E2D8C2";
const CARBON = "#1C1A17";
const CARBON_SOFT = "#4A453D";
const RED = "#B0322B"; // semantic only: the D grade, the harm
const RUST = "#C45D3E"; // the organization's own hand: the route
const CREAM = "#F5F0E8";
/* The four HOLC grades in archival tints. D keeps the semantic red. */
const GRADE = { A: "#83987B", B: "#7E93A8", C: "#D2AE4A", D: "#B0322B" };
const WATER = "#CBD2CA";

/* ---------- data ---------- */
const roads = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/tiger-roads.json")));
const water = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/tiger-water.json")));
const holc = JSON.parse(readFileSync(join(SITE, "public/exhibit-data/holc-chicago.geojson")));
const areas = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/community-areas.geojson")));
const parks = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/parks-cpd.geojson")));

/* ---------- projection helpers ---------- */
function makeProj(frame, widthUnits) {
  const midLat = (frame.latMin + frame.latMax) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const spanX = (frame.lngMax - frame.lngMin) * kx;
  const spanY = frame.latMax - frame.latMin;
  const s = widthUnits / spanX;
  const heightUnits = spanY * s;
  const pt = ([lng, lat]) => [
    +(((lng - frame.lngMin) * kx) * s).toFixed(2),
    +(((frame.latMax - lat)) * s).toFixed(2),
  ];
  return { pt, W: widthUnits, H: +heightUnits.toFixed(2), s, kx };
}
const inFrame = (f, m) => ([lng, lat]) =>
  lng >= f.lngMin - m && lng <= f.lngMax + m && lat >= f.latMin - m && lat <= f.latMax + m;

function polyline(points, proj) {
  return points.map((p) => proj.pt(p).join(",")).join(" ");
}
function ringPath(rings, proj) {
  return rings
    .map((ring) => "M" + ring.map((p) => proj.pt(p).join(" ")).join("L") + "Z")
    .join("");
}
/* Split a long line into the runs that touch the frame, so nothing is
   drawn right across the sheet when a road leaves and re-enters. */
function clipRuns(line, inside) {
  const runs = [];
  let cur = [];
  for (const p of line) {
    if (inside(p)) cur.push(p);
    else if (cur.length) { runs.push(cur); cur = []; }
  }
  if (cur.length) runs.push(cur);
  return runs.filter((r) => r.length > 1);
}
const bboxTouches = (ring, f) => {
  let x0 = 999, x1 = -999, y0 = 999, y1 = -999;
  for (const [lng, lat] of ring) {
    if (lng < x0) x0 = lng; if (lng > x1) x1 = lng;
    if (lat < y0) y0 = lat; if (lat > y1) y1 = lat;
  }
  return !(x1 < f.lngMin || x0 > f.lngMax || y1 < f.latMin || y0 > f.latMax);
};

/* ================================================================== */
/*  1. The HOLC sheet                                                  */
/* ================================================================== */
{
  const frame = { lngMin: -87.805, lngMax: -87.508, latMin: 41.685, latMax: 41.995 };
  const proj = makeProj(frame, 1750); // 17.5in wide at 100u/in
  const inside = inFrame(frame, 0.01);

  let streets = "";
  for (const line of roads.arterials) {
    for (const run of clipRuns(line, inside)) {
      streets += `<polyline points="${polyline(run, proj)}"/>`;
    }
  }

  /* The lake is rebuilt rather than drawn from raw rings, because the
     TIGER water polygons run far past the frame and would close with a
     straight chord across the visible sheet. Shoreline points inside
     the frame, north to south, closed around the frame's right edge. */
  /* Bucket by latitude and keep the westernmost lake point in each
     band. The TIGER lake polygons carry their own eastern tile edges
     and pier outlines, and sorting those by latitude alone draws
     zigzags across the water. The westernmost point per band IS the
     shoreline, minus piers nobody misses at city scale. */
  const bands = new Map();
  for (const poly of water.polys) {
    if (!/^Lk Michigan$/.test(poly.name || "")) continue;
    for (const ring of poly.rings) {
      for (const [lng, lat] of ring) {
        if (lng < frame.lngMin || lat < frame.latMin - 0.02 || lat > frame.latMax + 0.02) continue;
        const key = Math.round(lat / 0.0012);
        if (!bands.has(key) || lng < bands.get(key)[0]) bands.set(key, [lng, lat]);
      }
    }
  }
  const shore = [...bands.values()].sort((a, b) => b[1] - a[1]);
  const shorePts = shore.map((p) => proj.pt(p));
  const lakePath =
    `M${proj.W + 20} -20 L${shorePts[0][0]} -20 ` +
    shorePts.map(([x, y]) => `L${x} ${y}`).join(" ") +
    ` L${shorePts[shorePts.length - 1][0]} ${proj.H + 20} L${proj.W + 20} ${proj.H + 20} Z`;
  let lake = `<path d="${lakePath}"/>`;
  /* inland water fully inside the frame (Lake Calumet and friends) */
  for (const poly of water.polys) {
    if (/^Lk Michigan/.test(poly.name || "")) continue;
    const rings = poly.rings.filter((r) => r.length > 120 &&
      r.every(([lng, lat]) => lng > frame.lngMin && lng < frame.lngMax && lat > frame.latMin && lat < frame.latMax));
    if (!rings.length) continue;
    lake += `<path d="${ringPath(rings, proj)}"/>`;
  }

  const byGrade = { A: "", B: "", C: "", D: "", u: "" };
  for (const f of holc.features) {
    const g = f.properties.grade;
    const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of rings) {
      const d = ringPath(poly, proj);
      if (byGrade[g] !== undefined) byGrade[g] += `<path d="${d}"/>`;
      else byGrade.u += `<path d="${d}"/>`;
    }
  }

  /* Hyde Park ring: around the Hyde Park + Kenwood community areas */
  const hpk = areas.features.filter((f) =>
    ["HYDE PARK", "KENWOOD"].includes(f.properties.community));
  let hx0 = 999, hx1 = -999, hy0 = 999, hy1 = -999;
  for (const f of hpk) {
    const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of rings) for (const ring of poly) for (const [lng, lat] of ring) {
      if (lng < hx0) hx0 = lng; if (lng > hx1) hx1 = lng;
      if (lat < hy0) hy0 = lat; if (lat > hy1) hy1 = lat;
    }
  }
  const [rx0, ry0] = proj.pt([hx0, hy1]);
  const [rx1, ry1] = proj.pt([hx1, hy0]);

  /* half-mile scale bar */
  const halfMile = (0.5 / 69.05) * proj.s;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${proj.W} ${proj.H}" preserveAspectRatio="xMidYMid meet">
  <style>
    .lbl { font-family: "RF Narrow", "Archivo Narrow", sans-serif; fill: ${CARBON}; letter-spacing: 0.18em; }
    .lbl-w { font-family: "RF Narrow", "Archivo Narrow", sans-serif; fill: ${CARBON_SOFT}; letter-spacing: 0.3em; }
  </style>
  <rect width="${proj.W}" height="${proj.H}" fill="${LINEN}"/>
  <g stroke="${CARBON}" stroke-opacity="0.13" stroke-width="1.1" fill="none" stroke-linecap="round">${streets}</g>
  <g fill-opacity="0.92" fill-rule="evenodd">
    <g fill="${GRADE.A}">${byGrade.A}</g>
    <g fill="${GRADE.B}">${byGrade.B}</g>
    <g fill="${GRADE.C}">${byGrade.C}</g>
    <g fill="${GRADE.D}">${byGrade.D}</g>
  </g>
  <g fill="none" stroke="${CARBON}" stroke-opacity="0.35" stroke-width="0.5">${byGrade.A}${byGrade.B}${byGrade.C}${byGrade.D}</g>
  <g fill="${WATER}">${lake}</g>
  <g fill="none" stroke="${CARBON_SOFT}" stroke-width="1.4" stroke-opacity="0.8">${lake}</g>

  <rect x="${rx0 - 14}" y="${ry0 - 14}" width="${rx1 - rx0 + 28}" height="${ry1 - ry0 + 28}" fill="none" stroke="${CARBON}" stroke-width="6"/>
  <text class="lbl" x="${rx1 + 14}" y="${ry0 - 34}" text-anchor="end" font-size="36" font-weight="700" letter-spacing="0.22em">HYDE PARK</text>

  <text class="lbl-w" x="${proj.pt([-87.61, 41.975])[0]}" y="${proj.pt([-87.61, 41.975])[1]}" font-size="34">LAKE MICHIGAN</text>
  <text class="lbl" x="${proj.pt([-87.655, 41.879])[0]}" y="${proj.pt([-87.655, 41.879])[1]}" font-size="26">THE LOOP</text>
  <g transform="translate(${proj.pt([-87.648, 41.816])[0]} ${proj.pt([-87.648, 41.816])[1]}) rotate(90)">
    <text class="lbl" font-size="28" font-weight="700" letter-spacing="0.32em" paint-order="stroke" stroke="${LINEN}" stroke-width="10" stroke-linejoin="round">THE BLACK BELT</text>
  </g>

  <g stroke="${CARBON}" stroke-width="2.5">
    <line x1="70" y1="${proj.H - 170}" x2="${70 + halfMile}" y2="${proj.H - 170}"/>
    <line x1="70" y1="${proj.H - 182}" x2="70" y2="${proj.H - 158}"/>
    <line x1="${70 + halfMile}" y1="${proj.H - 182}" x2="${70 + halfMile}" y2="${proj.H - 158}"/>
  </g>
  <text class="lbl" x="${70 + halfMile / 2}" y="${proj.H - 194}" font-size="24" text-anchor="middle">HALF MILE</text>
</svg>`;
  writeFileSync(join(OUT, "holc-map.svg"), svg);
  console.log("holc-map.svg", proj.W, "x", proj.H, "units,", holc.features.length, "areas");
}

/* ================================================================== */
/*  2. The route plate                                                 */
/* ================================================================== */
{
  const frame = { lngMin: -87.6205, lngMax: -87.5615, latMin: 41.7738, latMax: 41.8082 };
  const proj = makeProj(frame, 2100); // 21in wide at 100u/in
  const inside = inFrame(frame, 0.004);

  /* the walk, straight out of src/lib/tours/hyde-park-walk.ts */
  const route = [
    [41.79991,-87.58295],[41.79955,-87.583],[41.7995,-87.5833],[41.799,-87.5833],
    [41.7995,-87.5833],[41.7996,-87.5852],[41.79946,-87.58734],[41.7975,-87.5876],
    [41.7952,-87.5876],[41.7933,-87.5876],[41.7933,-87.5845],[41.7908,-87.5845],
    [41.7891,-87.5849],[41.7879,-87.5854],[41.7877,-87.5866],[41.7859,-87.5866],
    [41.7859,-87.5857],[41.7859,-87.5866],[41.7877,-87.5866],[41.7877,-87.5917],
    [41.7878,-87.5937],[41.7878,-87.5966],[41.78852,-87.59697],[41.7898,-87.59606],
    [41.78985,-87.599],[41.78875,-87.60035],[41.78875,-87.6011],[41.7907,-87.6011],
    [41.7925,-87.6011],[41.795,-87.6011],[41.795,-87.5962],[41.79495,-87.5918],
    [41.7951,-87.5884],[41.79945,-87.58845],
  ].map(([lat, lng]) => [lng, lat]);
  const detour = [
    [41.7925,-87.6011],[41.7888,-87.6011],[41.7855,-87.6011],[41.7838,-87.6011],
    [41.7838,-87.6058],[41.7838,-87.6123],[41.7827,-87.6123],[41.7838,-87.6123],
    [41.7838,-87.6058],[41.78058,-87.6056],[41.7838,-87.6058],[41.79,-87.606],
    [41.795,-87.6063],[41.8019,-87.6066],[41.80189,-87.60446],[41.8019,-87.6013],
    [41.8019,-87.5968],[41.7995,-87.5968],[41.79495,-87.5968],[41.79495,-87.5918],
  ].map(([lat, lng]) => [lng, lat]);

  /* numbering follows the current tour document: detours are 12, 13, 15 */
  const stops = [
    [1,  false, 41.79991, -87.58295],
    [2,  false, 41.799,   -87.5833],
    [3,  false, 41.79946, -87.58734],
    [4,  false, 41.7891,  -87.5849],
    [5,  false, 41.7859,  -87.5857],
    [6,  false, 41.7877,  -87.5917],
    [7,  false, 41.7878,  -87.5937],
    [8,  false, 41.78852, -87.59697],
    [9,  false, 41.7898,  -87.59606],
    [10, false, 41.78875, -87.60035],
    [11, false, 41.7925,  -87.6011],
    [12, true,  41.7827,  -87.6123],
    [13, true,  41.78058, -87.6056],
    [14, false, 41.79495, -87.5918],
    [15, true,  41.80189, -87.60446],
    [16, false, 41.79945, -87.58845],
  ];

  let locals = "";
  for (const line of roads.locals) {
    for (const run of clipRuns(line, inside)) {
      locals += `<polyline points="${polyline(run, proj)}"/>`;
    }
  }
  let arterials = "";
  for (const line of roads.arterials) {
    for (const run of clipRuns(line, inside)) {
      arterials += `<polyline points="${polyline(run, proj)}"/>`;
    }
  }

  let parkFill = "";
  for (const f of parks.features) {
    const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of rings) {
      if (!poly.some((r) => bboxTouches(r, frame))) continue;
      parkFill += `<path d="${ringPath(poly, proj)}"/>`;
    }
  }

  let lake = "";
  for (const poly of water.polys) {
    const rings = poly.rings.filter((r) => bboxTouches(r, frame));
    if (!rings.length) continue;
    lake += `<path d="${ringPath(rings, proj)}"/>`;
  }

  /* the IC embankment, drawn by hand along its alignment */
  const rail = [
    [41.8082,-87.5902],[41.8030,-87.5893],[41.7995,-87.5878],[41.7960,-87.5872],
    [41.7930,-87.5869],[41.7900,-87.5867],[41.7870,-87.5866],[41.7838,-87.5872],
    [41.7800,-87.5893],[41.7762,-87.5915],[41.7738,-87.5929],
  ].map(([lat, lng]) => [lng, lat]);
  let ticks = "";
  for (let i = 0; i < rail.length - 1; i++) {
    const [x0, y0] = proj.pt(rail[i]);
    const [x1, y1] = proj.pt(rail[i + 1]);
    const seg = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.floor(seg / 26);
    for (let j = 1; j <= n; j++) {
      const t = j / (n + 1);
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const dx = (y1 - y0) / seg, dy = -(x1 - x0) / seg;
      ticks += `<line x1="${(x - dx * 7).toFixed(1)}" y1="${(y - dy * 7).toFixed(1)}" x2="${(x + dx * 7).toFixed(1)}" y2="${(y + dy * 7).toFixed(1)}"/>`;
    }
  }

  let stopMarks = "";
  for (const [n, optional, lat, lng] of stops) {
    const [x, y] = proj.pt([lng, lat]);
    const r = 24;
    if (optional) {
      stopMarks += `<circle cx="${x}" cy="${y}" r="${r}" fill="${LINEN}" stroke="${RUST}" stroke-width="5"/>` +
        `<text x="${x}" y="${y + 10}" text-anchor="middle" font-size="30" font-weight="700" fill="${RUST}" font-family="RF Narrow, Archivo Narrow, sans-serif">${n}</text>`;
    } else {
      stopMarks += `<circle cx="${x}" cy="${y}" r="${r}" fill="${RUST}"/>` +
        `<text x="${x}" y="${y + 10}" text-anchor="middle" font-size="30" font-weight="700" fill="${CREAM}" font-family="RF Narrow, Archivo Narrow, sans-serif">${n}</text>`;
    }
  }

  const label = (lng, lat, txt, size, opts = "") =>
    `<text class="lbl" x="${proj.pt([lng, lat])[0]}" y="${proj.pt([lng, lat])[1]}" font-size="${size}" ${opts}>${txt}</text>`;
  const vlabel = (lng, lat, txt, size, opts = "") => {
    const [x, y] = proj.pt([lng, lat]);
    return `<text class="lbl" transform="translate(${x} ${y}) rotate(-90)" font-size="${size}" text-anchor="middle" ${opts}>${txt}</text>`;
  };

  const halfMile = (0.5 / 69.05) * proj.s;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${proj.W} ${proj.H}" preserveAspectRatio="xMidYMid meet">
  <style>
    .lbl { font-family: "RF Narrow", "Archivo Narrow", sans-serif; fill: ${CARBON_SOFT}; letter-spacing: 0.14em; }
  </style>
  <rect width="${proj.W}" height="${proj.H}" fill="${LINEN}"/>
  <g fill="${LINEN_DEEP}">${parkFill}</g>
  <g stroke="${CARBON}" stroke-opacity="0.14" stroke-width="1" fill="none" stroke-linecap="round">${locals}</g>
  <g stroke="${CARBON}" stroke-opacity="0.30" stroke-width="1.8" fill="none" stroke-linecap="round">${arterials}</g>
  <g fill="${WATER}">${lake}</g>
  <g fill="none" stroke="${CARBON_SOFT}" stroke-width="1.6" stroke-opacity="0.7">${lake}</g>

  <polyline points="${polyline(rail, proj)}" fill="none" stroke="${CARBON_SOFT}" stroke-width="3.2"/>
  <g stroke="${CARBON_SOFT}" stroke-width="2">${ticks}</g>

  <polyline points="${polyline(detour, proj)}" fill="none" stroke="${RUST}" stroke-width="5.5" stroke-dasharray="16 13" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>
  <polyline points="${polyline(route, proj)}" fill="none" stroke="${RUST}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
  ${stopMarks}

  ${label(-87.5723, 41.8008, "LAKE MICHIGAN", 34, 'letter-spacing="0.3em" fill="' + CARBON_SOFT + '"')}
  ${label(-87.5838, 41.7862, "JACKSON PARK", 27)}
  ${label(-87.6178, 41.7912, "WASHINGTON", 27)}
  ${label(-87.6178, 41.7892, "PARK", 27)}
  ${label(-87.6008, 41.78685, "MIDWAY PLAISANCE", 23)}
  ${label(-87.6045, 41.7962, "HYDE PARK", 34, 'font-weight="700" letter-spacing="0.24em"')}
  ${label(-87.6045, 41.7799, "WOODLAWN", 27)}
  ${label(-87.6125, 41.8042, "KENWOOD", 27)}
  ${label(-87.60115, 41.79135, "UNIVERSITY OF CHICAGO", 21)}
  ${label(-87.5975, 41.80115, "E 53RD ST", 22)}
  ${label(-87.5998, 41.79585, "E 55TH ST", 22)}
  ${label(-87.5935, 41.79225, "E 57TH ST", 22)}
  ${label(-87.6008, 41.78465, "E 60TH ST", 22)}
  ${label(-87.5995, 41.78075, "E 63RD ST", 22)}
  ${vlabel(-87.6068, 41.7858, "COTTAGE GROVE AVE", 22)}
  ${vlabel(-87.59485, 41.78475, "WOODLAWN AVE", 22)}
  ${vlabel(-87.58755, 41.80425, "LAKE PARK AVE", 22)}
  ${vlabel(-87.58635, 41.7841, "STONY ISLAND AVE", 22)}
  ${vlabel(-87.6089, 41.7985, "DREXEL BLVD", 22)}

  <g stroke="${CARBON}" stroke-width="2.5">
    <line x1="80" y1="${proj.H - 80}" x2="${80 + halfMile}" y2="${proj.H - 80}"/>
    <line x1="80" y1="${proj.H - 92}" x2="80" y2="${proj.H - 68}"/>
    <line x1="${80 + halfMile}" y1="${proj.H - 92}" x2="${80 + halfMile}" y2="${proj.H - 68}"/>
  </g>
  <text class="lbl" x="${80 + halfMile / 2}" y="${proj.H - 102}" font-size="22" text-anchor="middle">HALF MILE</text>
  <g transform="translate(${proj.W - 100}, ${proj.H - 150})">
    <line x1="0" y1="60" x2="0" y2="-10" stroke="${CARBON}" stroke-width="3"/>
    <path d="M0 -22 L11 2 L0 -6 L-11 2 Z" fill="${CARBON}"/>
    <text class="lbl" y="90" text-anchor="middle" font-size="24" font-weight="700">N</text>
  </g>
</svg>`;
  writeFileSync(join(OUT, "route-map.svg"), svg);
  console.log("route-map.svg", proj.W, "x", proj.H, "units,", stops.length, "stops");
}
