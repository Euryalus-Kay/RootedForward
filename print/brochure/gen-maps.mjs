/* ------------------------------------------------------------------ */
/*  Maps for the tri-fold brochure.                                    */
/*                                                                     */
/*  Two SVGs, both drawn from data already in this repo, in the same   */
/*  way print/exhibit/gen-maps.mjs draws the exhibition plates.        */
/*                                                                     */
/*    cover-map.svg  the Home Owners' Loan Corporation grades for      */
/*                   Chicago, 1940, from                               */
/*                   public/exhibit-data/holc-chicago.geojson, over    */
/*                   TIGER arterials, with the lake from TIGER water.  */
/*                   No labels. It fades into the paper at the top so  */
/*                   the name and the mission can sit above it.        */
/*                                                                     */
/*    route-map.svg  the Walk Hyde Park route. The route, the detour   */
/*                   and every stop are read straight out of           */
/*                   src/lib/tours/hyde-park-walk.ts, so the numbers   */
/*                   on the brochure cannot drift from the tour. (The  */
/*                   exhibition's route plate hard-codes them and is   */
/*                   one renumbering behind.)                          */
/*                                                                     */
/*  Both are drawn at 100 units to the inch at their printed size, so  */
/*  a stroke of 0.35 is a quarter-point hairline on paper. Land is     */
/*  the brochure's own cream, which means the maps have no edge of     */
/*  their own and sit in the page instead of on it.                    */
/*                                                                     */
/*    node print/brochure/gen-maps.mjs                                 */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const OUT = join(HERE, "assets");
mkdirSync(OUT, { recursive: true });

/* ---------- palette ---------- */
const CREAM = "#F5F0E8";
const CREAM_DARK = "#EDE6D8";
const INK = "#1A1A1A";
const INK_LIGHT = "#3A3A3A";
const RUST = "#C45D3E";
/* The four grades in the exhibit's archival tints (g-a to g-d). They
   color the map and nothing else. */
const GRADE = { A: "#83987B", B: "#7E93A8", C: "#D2AE4A", D: "#B0322B" };
const WATER = "#CBD2CA";

/* Every tone is mixed to a solid here rather than drawn with opacity,
   so the print file carries no transparency for a press to flatten. */
function mix(a, b, t) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [A, B] = [h(a), h(b)];
  return "#" + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
}

/* ---------- data ---------- */
const roads = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/tiger-roads.json")));
const water = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/tiger-water.json")));
const holc = JSON.parse(readFileSync(join(SITE, "public/exhibit-data/holc-chicago.geojson")));
const parks = JSON.parse(readFileSync(join(SITE, "data/exhibit-src/parks-cpd.geojson")));

/* ---------- projection ---------- */
/* A frame is its top-left corner, a printed size in inches, and how
   many inches one degree of latitude gets. Longitude is squeezed by
   the cosine of the middle latitude, which is all a city needs. */
function makeProj({ lngMin, latMax, widthIn, heightIn, inPerLat }) {
  const latMin = latMax - heightIn / inPerLat;
  const kx = Math.cos((((latMax + latMin) / 2) * Math.PI) / 180);
  const inPerLng = inPerLat * kx;
  const lngMax = lngMin + widthIn / inPerLng;
  const pt = ([lng, lat]) => [
    +((lng - lngMin) * inPerLng * 100).toFixed(2),
    +((latMax - lat) * inPerLat * 100).toFixed(2),
  ];
  return { pt, W: +(widthIn * 100).toFixed(2), H: +(heightIn * 100).toFixed(2), frame: { lngMin, lngMax, latMin, latMax }, inPerLat, inPerLng };
}
const frame0 = (proj) => proj.frame;
const inFrame = (f, m) => ([lng, lat]) =>
  lng >= f.lngMin - m && lng <= f.lngMax + m && lat >= f.latMin - m && lat <= f.latMax + m;
const polyline = (points, proj) => points.map((p) => proj.pt(p).join(",")).join(" ");
const ringPath = (rings, proj) =>
  rings.map((ring) => "M" + ring.map((p) => proj.pt(p).join(" ")).join("L") + "Z").join("");
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
/*  1. The cover                                                       */
/* ================================================================== */
export const COVER_MAP = { widthIn: 3.8125, heightIn: 4.7 };
{
  const proj = makeProj({ lngMin: -87.782, latMax: 41.9525, ...COVER_MAP, inPerLat: 19.4 });
  const frame = proj.frame;
  const inside = inFrame(frame, 0.01);

  let streets = "";
  for (const line of roads.arterials) {
    for (const run of clipRuns(line, inside)) streets += `<polyline points="${polyline(run, proj)}"/>`;
  }

  /* The lake, rebuilt from the westernmost shoreline point in each
     band of latitude and closed around the right edge of the frame.
     See the same passage in print/exhibit/gen-maps.mjs for why. */
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
  const shorePts = [...bands.values()].sort((a, b) => b[1] - a[1]).map((p) => proj.pt(p));
  const lake =
    `<path d="M${proj.W + 5} -5 L${shorePts[0][0]} -5 ` +
    shorePts.map(([x, y]) => `L${x} ${y}`).join(" ") +
    ` L${shorePts[shorePts.length - 1][0]} ${proj.H + 5} L${proj.W + 5} ${proj.H + 5} Z"/>`;

  const byGrade = { A: "", B: "", C: "", D: "" };
  let drawn = 0;
  for (const f of holc.features) {
    const g = f.properties.grade;
    if (!byGrade.hasOwnProperty(g)) continue;
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      if (!poly.some((r) => bboxTouches(r, frame))) continue;
      byGrade[g] += `<path d="${ringPath(poly, proj)}"/>`;
      drawn++;
    }
  }

  /* The fade. Solid paper down to the first stop, because the last
     lines of the mission sit over that strip, then clear by the
     second, so the north end of the city dissolves into the page. */
  const FADE_SOLID = 0.13;
  const FADE_TO = 0.4;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${proj.W} ${proj.H}" width="${proj.W}" height="${proj.H}">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${CREAM}" stop-opacity="1"/>
      <stop offset="${FADE_SOLID}" stop-color="${CREAM}" stop-opacity="1"/>
      <stop offset="${((FADE_SOLID + FADE_TO) / 2).toFixed(3)}" stop-color="${CREAM}" stop-opacity="0.6"/>
      <stop offset="${FADE_TO}" stop-color="${CREAM}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${proj.W}" height="${proj.H}" fill="${CREAM}"/>
  <g stroke="${mix(INK, CREAM, 0.2)}" stroke-width="0.4" fill="none" stroke-linecap="round">${streets}</g>
  <g fill-rule="evenodd" stroke="${CREAM}" stroke-width="0.4" stroke-linejoin="round">
    <g fill="${GRADE.A}">${byGrade.A}</g>
    <g fill="${GRADE.B}">${byGrade.B}</g>
    <g fill="${GRADE.C}">${byGrade.C}</g>
    <g fill="${GRADE.D}">${byGrade.D}</g>
  </g>
  <g fill="${WATER}" stroke="${mix(INK_LIGHT, WATER, 0.45)}" stroke-width="0.5">${lake}</g>
  <rect width="${proj.W}" height="${proj.H}" fill="url(#fade)"/>
</svg>`;
  writeFileSync(join(OUT, "cover-map.svg"), svg);
  console.log("cover-map.svg  ", proj.W, "x", proj.H, "units,", drawn, "graded areas in frame",
    `(${frame.lngMin.toFixed(3)} to ${frame.lngMax.toFixed(3)}, ${frame.latMin.toFixed(3)} to ${frame.latMax.toFixed(3)})`);
}

/* ================================================================== */
/*  2. The route                                                       */
/* ================================================================== */
export const ROUTE_MAP = { widthIn: 7.0875, heightIn: 4.175 };
{
  /* The frame is chosen for the fold. The brochure creases 3.3375in
     from this map's left edge, and at this scale and offset that is
     longitude -87.5805, on the lakefront east of stops 1 and 2, where
     it crosses parkland and shore and no stop, route or label. */
  const proj = makeProj({ lngMin: -87.6172, latMax: 41.8086, ...ROUTE_MAP, inPerLat: 122 });
  const FOLD_IN = 3.3375;
  const foldLng = frame0(proj).lngMin + FOLD_IN / proj.inPerLng;
  const frame = proj.frame;
  const inside = inFrame(frame, 0.004);

  /* ---------- the tour, read from its own file ---------- */
  const src = readFileSync(join(SITE, "src/lib/tours/hyde-park-walk.ts"), "utf8");
  const pairs = (block) =>
    [...block.matchAll(/\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/g)].map((m) => [+m[2], +m[1]]);
  const routeBlock = src.match(/\n  route: \[([\s\S]*?)\n  \],/);
  const detourBlock = src.match(/\n  detourRoutes: \[([\s\S]*?)\n  \],/);
  if (!routeBlock || !detourBlock) throw new Error("could not find route or detourRoutes in hyde-park-walk.ts");
  const route = pairs(routeBlock[1]);
  const detour = pairs(detourBlock[1]);

  const stops = [];
  const stopRe = /\n      number: (\d+),\n      title: "([^"]+)",[\s\S]*?\n      lat: (-?\d+\.\d+),\n      lng: (-?\d+\.\d+),\n(      optional: true,\n)?/g;
  for (const m of src.matchAll(stopRe)) {
    stops.push({ number: +m[1], title: m[2], lat: +m[3], lng: +m[4], optional: Boolean(m[5]) });
  }
  if (stops.length !== 16 || stops.some((s, i) => s.number !== i + 1)) {
    throw new Error(`expected stops 1 to 16 in order, read ${stops.map((s) => s.number).join(",")}`);
  }
  if (route.length < 10 || detour.length < 10) throw new Error("route geometry looks wrong");

  let locals = "";
  for (const line of roads.locals) {
    for (const run of clipRuns(line, inside)) locals += `<polyline points="${polyline(run, proj)}"/>`;
  }
  let arterials = "";
  for (const line of roads.arterials) {
    for (const run of clipRuns(line, inside)) arterials += `<polyline points="${polyline(run, proj)}"/>`;
  }
  let parkFill = "";
  for (const f of parks.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      if (!poly.some((r) => bboxTouches(r, frame))) continue;
      parkFill += `<path d="${ringPath(poly, proj)}"/>`;
    }
  }
  let lake = "";
  for (const poly of water.polys) {
    const rings = poly.rings.filter((r) => bboxTouches(r, frame));
    if (rings.length) lake += `<path d="${ringPath(rings, proj)}"/>`;
  }

  /* the Illinois Central embankment, along its alignment */
  const rail = [
    [41.8100,-87.5905],[41.8082,-87.5902],[41.8030,-87.5893],[41.7995,-87.5878],[41.7960,-87.5872],
    [41.7930,-87.5869],[41.7900,-87.5867],[41.7870,-87.5866],[41.7838,-87.5872],
    [41.7800,-87.5893],[41.7762,-87.5915],[41.7738,-87.5929],
  ].map(([lat, lng]) => [lng, lat]);
  let ticks = "";
  for (let i = 0; i < rail.length - 1; i++) {
    const [x0, y0] = proj.pt(rail[i]);
    const [x1, y1] = proj.pt(rail[i + 1]);
    const seg = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.floor(seg / 5.2);
    for (let j = 1; j <= n; j++) {
      const t = j / (n + 1);
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      const dx = (y1 - y0) / seg, dy = -(x1 - x0) / seg;
      ticks += `<line x1="${(x - dx * 1.5).toFixed(2)}" y1="${(y - dy * 1.5).toFixed(2)}" x2="${(x + dx * 1.5).toFixed(2)}" y2="${(y + dy * 1.5).toFixed(2)}"/>`;
    }
  }

  /* Four stops sit closer together on the ground than two markers can
     at this scale, so each is moved a few hundredths of an inch off
     its true spot, away from its neighbour. Units are 1/100 inch. */
  const NUDGE = { 1: [2.5, -4.6], 2: [2.5, 4.6], 3: [5.4, 3.2], 16: [-5.4, -3.2] };
  const R = 7.4;
  let stopMarks = "";
  for (const s of stops) {
    const [px, py] = proj.pt([s.lng, s.lat]);
    const [nx, ny] = NUDGE[s.number] || [0, 0];
    const x = +(px + nx).toFixed(2), y = +(py + ny).toFixed(2);
    const two = s.number > 9;
    const text = `<text x="${x}" y="${(y + 3.05).toFixed(2)}" text-anchor="middle" font-size="${two ? 8.2 : 8.8}" font-weight="700" ${two ? 'letter-spacing="-0.3"' : ""} class="num"`;
    if (s.optional) {
      stopMarks += `<circle cx="${x}" cy="${y}" r="${R - 0.55}" fill="${CREAM}" stroke="${RUST}" stroke-width="1.1"/>${text} fill="${RUST}">${s.number}</text>`;
    } else {
      stopMarks += `<circle cx="${x}" cy="${y}" r="${R}" fill="${RUST}" stroke="${CREAM}" stroke-width="0.7"/>${text} fill="#FFFFFF">${s.number}</text>`;
    }
  }

  /* The spur is walked out and back along some of the same streets.
     Drawn as one polyline those legs lay their dashes over each other
     and read as a solid line, so each leg is drawn once. */
  const seen = new Set();
  let detourLegs = "";
  for (let i = 0; i < detour.length - 1; i++) {
    const [a, b] = [detour[i], detour[i + 1]];
    const key = [a.join(), b.join()].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const [x0, y0] = proj.pt(a), [x1, y1] = proj.pt(b);
    detourLegs += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
  }

  const foldX = FOLD_IN * 100;
  for (const st of stops) {
    const [px] = proj.pt([st.lng, st.lat]);
    const x = px + (NUDGE[st.number]?.[0] ?? 0);
    if (Math.abs(x - foldX) < R + 10) throw new Error(`stop ${st.number} is ${((x - foldX) / 100).toFixed(2)}in from the fold`);
  }
  for (const [lng] of [...route, ...detour]) {
    if (lng > foldLng - 0.0008) throw new Error("the route reaches the fold");
  }

  const LBL = mix(INK, CREAM, 0.62);
  const label = (lng, lat, txt, size, opts = "") => {
    const [x, y] = proj.pt([lng, lat]);
    return `<text class="lbl" x="${x}" y="${y}" font-size="${size}" ${opts}>${txt}</text>`;
  };
  const vlabel = (lng, lat, txt, size, opts = "") => {
    const [x, y] = proj.pt([lng, lat]);
    return `<text class="lbl" transform="translate(${x} ${y}) rotate(-90)" font-size="${size}" text-anchor="middle" ${opts}>${txt}</text>`;
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${proj.W} ${proj.H}" width="${proj.W}" height="${proj.H}">
  <style>
    .lbl { font-family: "RF Narrow", "Archivo Narrow", "Arial Narrow", sans-serif; fill: ${LBL}; letter-spacing: 0.14em; font-weight: 500; }
    .num { font-family: "RF Sans", "DM Sans", Helvetica, Arial, sans-serif; }
  </style>
  <rect width="${proj.W}" height="${proj.H}" fill="${CREAM}"/>
  <g fill="${CREAM_DARK}">${parkFill}</g>
  <g stroke="${mix(INK, CREAM, 0.13)}" stroke-width="0.32" fill="none" stroke-linecap="round">${locals}</g>
  <g stroke="${mix(INK, CREAM, 0.3)}" stroke-width="0.55" fill="none" stroke-linecap="round">${arterials}</g>
  <g fill="${WATER}" stroke="${mix(INK_LIGHT, WATER, 0.45)}" stroke-width="0.5">${lake}</g>

  <polyline points="${polyline(rail, proj)}" fill="none" stroke="${mix(INK, CREAM, 0.5)}" stroke-width="0.8"/>
  <g stroke="${mix(INK, CREAM, 0.5)}" stroke-width="0.5">${ticks}</g>

  ${label(-87.6005, 41.8052, "KENWOOD", 7.6)}
  ${label(-87.5961, 41.7973, "HYDE PARK", 9.6, 'font-weight="700" letter-spacing="0.2em" fill="' + mix(INK, CREAM, 0.8) + '"')}
  ${label(-87.5958, 41.7782, "WOODLAWN", 7.6)}
  ${label(-87.6150, 41.7986, "WASHINGTON", 7.6)}
  ${label(-87.6150, 41.79782, "PARK", 7.6)}
  ${label(-87.5793, 41.7812, "JACKSON PARK", 7.6)}
  ${label(-87.5998, 41.78617, "MIDWAY PLAISANCE", 6.6)}
  ${label(-87.5997, 41.7909, "UNIVERSITY OF CHICAGO", 6.6)}
  ${label(-87.6044, 41.79972, "E 53RD ST", 6.4)}
  ${label(-87.6002, 41.78082, "E 63RD ST", 6.4)}
  ${vlabel(-87.6074, 41.7905, "COTTAGE GROVE AVE", 6.4)}
  ${vlabel(-87.5869, 41.7806, "STONY ISLAND AVE", 6.4)}

  <g fill="none" stroke="${RUST}" stroke-width="1.35" stroke-dasharray="3.6 2.8" stroke-linecap="round">${detourLegs}</g>
  <polyline points="${polyline(route, proj)}" fill="none" stroke="${RUST}" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round"/>
  ${stopMarks}
</svg>`;
  writeFileSync(join(OUT, "route-map.svg"), svg);
  writeFileSync(join(OUT, "stops.json"), JSON.stringify(stops.map(({ number, title, optional }) => ({ number, title, optional })), null, 2) + "\n");

  /* where the brochure's fold and its lake text land, for the layout */
  const halfMileIn = (0.5 / 69.05) * proj.inPerLat;
  writeFileSync(join(OUT, "route-map.json"), JSON.stringify({ ...ROUTE_MAP, frame, halfMileIn: +halfMileIn.toFixed(4) }, null, 2) + "\n");
  console.log("route-map.svg  ", proj.W, "x", proj.H, "units,", stops.length, "stops,",
    stops.filter((s) => s.optional).map((s) => s.number).join(" ") + " optional,", "half mile =", halfMileIn.toFixed(3) + "in");
}
