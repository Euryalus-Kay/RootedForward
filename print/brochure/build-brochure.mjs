/* ------------------------------------------------------------------ */
/*  Rooted Forward tri-fold brochure, US Letter, letter fold.          */
/*                                                                     */
/*  The piece that sits on the table at the Obama Presidential Center  */
/*  and at neighborhood markets next to the banner. It says who we     */
/*  are on the front, why on the first panel a reader opens, what we   */
/*  do and where the Hyde Park tour goes on the inside, and how to     */
/*  reach us on the back.                                              */
/*                                                                     */
/*  A flat sheet is 11 x 8.5 inches, printed both sides and folded     */
/*  twice. The panel that tucks inside is 1/16 inch narrower than the  */
/*  other two so it lies flat, which puts the folds here:              */
/*                                                                     */
/*    OUTSIDE   | flap 3.625 | back 3.6875 | cover 3.6875 |            */
/*    INSIDE    | A 3.6875   | B 3.6875    | C 3.625      |            */
/*                                                                     */
/*  Nothing that has to be read crosses a fold, and every block of     */
/*  type keeps 0.35 inch from each fold and each trimmed edge, so a    */
/*  shop that folds in equal thirds instead (3.667) still clears it.   */
/*                                                                     */
/*  The copy is the site's own. The mission, the founder's account,    */
/*  the four things we do and the museum paragraph are lifted from     */
/*  src/app/about/page.tsx, src/lib/tours/catalog.ts and               */
/*  src/lib/look-closer.ts, and the build stops if any of those        */
/*  sentences has since changed there, so the paper cannot quietly     */
/*  disagree with the website. The route map and the list of stops     */
/*  are read from the tour file itself (see gen-maps.mjs).             */
/*                                                                     */
/*  The QR code encodes rooted-forward.org/go/brochure, our own        */
/*  redirect, so a printed brochure can be re-pointed for as long as   */
/*  the domain is ours (src/lib/qr-links.ts).                          */
/*                                                                     */
/*    npm install --no-save qrcode jsqr                                */
/*    node print/brochure/gen-maps.mjs                                 */
/*    node print/brochure/build-brochure.mjs                           */
/*                                                                     */
/*  Needs poppler and librsvg on PATH (pdftocairo, pdfunite, pdftoppm, */
/*  pdffonts, rsvg-convert).                                           */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import sharp from "sharp";
import jsQR from "jsqr";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const ASSETS = join(HERE, "assets");
const OUT = join(SITE, "print");
const PROOF = join(HERE, "proof");
mkdirSync(PROOF, { recursive: true });

/* ---------- geometry, in inches ---------- */
const W = 11;
const H = 8.5;
const BLEED = 0.125;
const TUCK = 3.625; // the panel that folds in
const FULL = 3.6875; // the other two
const OUT_F1 = TUCK; // outside folds, measured from the left trim edge
const OUT_F2 = TUCK + FULL;
const IN_F1 = FULL; // inside folds
const IN_F2 = FULL * 2;
const M = 0.35; // type stays this far from every fold and trim edge
const TOP = 0.5;
const BOTTOM = 0.42;

/* ---------- palette (site tokens) ---------- */
const CREAM = "#F5F0E8";
const FOREST = "#1B3A2D";
const INK = "#1A1A1A";
const RUST = "#C45D3E";
const RUST_DARK = "#A8462A";
const BORDER = "#DDD6C8";
const WATER = "#CBD2CA";

/* Opacity is mixed down to a solid here, so "ink at 78 percent" is one
   flat color in the file and there is no transparency for a press to
   flatten. */
function mix(a, b, t) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [A, B] = [h(a), h(b)];
  return "#" + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
}
const BODY = mix(INK, CREAM, 0.8);
const CREDIT = mix(INK, CREAM, 0.64);
const ON_FOREST = mix(CREAM, FOREST, 0.82);
const ON_FOREST_SOFT = mix(CREAM, FOREST, 0.62);
const ON_WATER = mix(INK, WATER, 0.84);
const ON_WATER_SOFT = mix(INK, WATER, 0.66);

/* ---------- fonts ---------- */
/* The site's own files, kept in print/fonts. See build-banner.mjs. */
const b64 = (p) => readFileSync(join(SITE, p)).toString("base64");
const SERIF = b64("print/fonts/source-serif-4-latin-var.woff2");
const SANS = b64("print/fonts/dm-sans-latin-var.woff2");
const NARROW = b64("print/fonts/archivo-narrow-latin-var.woff2");

/* ------------------------------------------------------------------ */
/*  Copy. Every sentence below is on the site already. `said` checks   */
/*  that it still is.                                                  */
/* ------------------------------------------------------------------ */

const sources = {
  about: readFileSync(join(SITE, "src/app/about/page.tsx"), "utf8"),
  catalog: readFileSync(join(SITE, "src/lib/tours/catalog.ts"), "utf8"),
  museum: readFileSync(join(SITE, "src/lib/look-closer.ts"), "utf8"),
  appStore: readFileSync(join(SITE, "src/lib/app-store.ts"), "utf8"),
};
/* JSX wraps lines and writes apostrophes as entities, so both sides
   are flattened before comparing. */
const flat = (s) =>
  s.replace(/&rsquo;|\\u2019|’/g, "'").replace(/\\u201[cd]|[“”]/g, '"').replace(/\s+/g, " ");
const flatSources = Object.fromEntries(Object.entries(sources).map(([k, v]) => [k, flat(v)]));
function said(where, text) {
  if (!flatSources[where].includes(flat(text))) {
    throw new Error(`The site no longer says this (${where}):\n  ${text}\nUpdate the brochure to match before printing.`);
  }
  return text.replace(/'/g, "’");
}

const MISSION_WHO = said("about", "A student-run nonprofit started in Chicago.");
const MISSION_WHAT = said("about", "Rooted Forward educates people about racial inequality in cities across the United States, and works to address it through education, awareness, and political advocacy.");

const STORY = [
  said("about", "Rooted Forward was started by Zain Zaidi, a student who lives on the Near South Side and goes to school in Hyde Park. Going between the two every day, he kept running into the bubble around the University of Chicago, and how completely the city changed from one block to the next."),
  said("about", "He went looking for why, and found redlining, restrictive covenants, and the urban renewal campaigns that cleared and rearranged these blocks on purpose."),
  said("about", "He ran a survey at the Obama Presidential Center and talked with more than 140 people about what they had lived through and what they had been taught. The gap was far wider than he expected, including among lifelong Chicagoans and especially among young people."),
  said("about", "So he built this. Students in three cities do the archival work and run the outreach now, and what comes out of it gets published free."),
];
const STAT = said("about", "Residents surveyed at the Obama Presidential Center about what they knew of this history.");

const PLACES = [
  ["Chicago", said("about", "Starting location"), true],
  ["New York", said("about", "Research in progress"), false],
  ["Washington, DC", said("about", "Research in progress"), false],
];

/* Heroicons outline, the same four the home page draws. */
const ICONS = {
  map: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z",
  clipboard: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z",
  mic: "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
  scale: "M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z",
};

const WORK = [
  ["map", said("about", "Self-guided walking tours"), said("about", "Students research one neighborhood at a time and build a tour out of what they find. It lives on the Rooted Forward app, free to walk or to read at home.")],
  ["clipboard", said("about", "Community outreach"), said("about", "We set up where people already are, like the Obama Presidential Center and neighborhood markets, and we survey and interview residents about their own block.")],
  ["mic", said("about", "The podcast"), said("about", "We record long conversations with people who have lived through what we research, and those conversations decide what we work on next.")],
  ["scale", said("about", "Policy advocacy"), said("about", "We run petitions on Chicago bills that are already introduced and stuck in a committee, then hand the signatures to that committee.")],
];

const HELP_HEAD = said("about", "We could use your help");
const HELP_BODY = said("about", "If you can dig through an archive, run a survey table at a market, or edit audio, there is work here for you. You do not need experience to start.");

/* The tour's own listing on /tours. */
said("catalog", "Walk Hyde Park"); // set by hand on two lines in the title block
const TOUR_BLURB = said("catalog", "The tour goes through the Chicago neighborhood of Hyde Park, stopping at sites that reflect its deep racial history and the inequality that still shapes the neighborhood today. It starts at Paul Cornell's stone by 53rd Street and ends at Harper Court.");
const hydePark = sources.catalog.slice(sources.catalog.indexOf('slug: "hyde-park"'), sources.catalog.indexOf('slug: "harlem"'));
const FACTS = [...hydePark.matchAll(/\{ label: "([^"]+)", value: "([^"]+)" \}/g)].map((m) => [m[1], m[2]]);
if (FACTS.length !== 4) throw new Error(`expected four tour facts in catalog.ts, read ${FACTS.length}`);
if (!/APP_STORE_URL: string \| null =\s*"https:\/\/apps\.apple\.com/.test(sources.appStore)) {
  throw new Error("The app is no longer marked live in src/lib/app-store.ts. The brochure says it is on the App Store.");
}
if (!/slug: "hyde-park"[\s\S]*?offerBrowser: true/.test(hydePark)) {
  throw new Error("catalog.ts no longer offers the Hyde Park walk in a browser. The brochure says it does.");
}
const STOPS = JSON.parse(readFileSync(join(ASSETS, "stops.json"), "utf8"));
const optional = STOPS.filter((s) => s.optional).map((s) => s.number);
const DETOUR_NOTE = `Stops ${optional.slice(0, -1).join(", ")} and ${optional.at(-1)} are optional detours.`;

const EXHIBIT_TITLE = said("museum", "An Illustrated Map of Chicago");
const EXHIBIT_BODY = [
  said("museum", "Rooted Forward and the Chicago Maritime Museum created this exhibit to explore the history behind a 1931 illustrated map of Chicago."),
  said("museum", "Visit the museum in Bridgeport to see the map and explore it on the touchscreen beside it"),
];
const EXHIBIT_CAPTION = said("museum", "The map and its touch screen on the museum's wall in Bridgeport, September 2026. Photograph by Rooted Forward.");
const MUSEUM_NAME = said("museum", "Chicago Maritime Museum");
const MUSEUM_STREET = said("museum", "1200 West 35th Street, Chicago");

/* ---------- QR ---------- */
const QR_URL = "https://rooted-forward.org/go/brochure";
const qrSvg = await QRCode.toString(QR_URL, {
  type: "svg",
  errorCorrectionLevel: "Q",
  margin: 0,
  color: { dark: FOREST, light: "#0000" },
});
const qrViewBox = qrSvg.match(/viewBox="([^"]+)"/)[1];
const qrInner = qrSvg
  .replace(/<\?xml[^>]*\?>/, "")
  .replace(/<svg[^>]*>/, "")
  .replace(/<\/svg>/, "")
  .replace(/<rect[^>]*fill="#0000"[^>]*\/>/, "");
const qrModules = Number(qrViewBox.split(" ")[2]);
const QR_IN = 1.3;

/* ---------- the mark ---------- */
/* public/logo.svg exactly as drawn. On the forest panel it gets the
   thin cream ring the banner gives it, since the disc is forest too. */
const logo = readFileSync(join(SITE, "public/logo.svg"), "utf8");
const MARK = logo.replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="mark">');
const MARK_RINGED = MARK.replace("</svg>", `<circle cx="200" cy="200" r="188" fill="none" stroke="${CREAM}" stroke-width="9"/></svg>`);

/* ---------- pictures ---------- */
/* The cover map carries a fade, which is transparency, so it is
   rendered to pixels here with the cream already under it. 600 to the
   inch, which is past what the press resolves. */
const coverMeta = { widthIn: 3.8125, heightIn: 4.7 };
const coverPng = join(ASSETS, "cover-map.png");
execFileSync("rsvg-convert", ["-w", String(Math.round(coverMeta.widthIn * 600)), "-b", CREAM, "-o", coverPng, join(ASSETS, "cover-map.svg")]);
const COVER_MAP = (await sharp(coverPng).flatten({ background: CREAM }).png({ compressionLevel: 9 }).toBuffer()).toString("base64");

const routeMeta = JSON.parse(readFileSync(join(ASSETS, "route-map.json"), "utf8"));
const ROUTE_MAP = readFileSync(join(ASSETS, "route-map.svg"), "utf8").replace(/ width="[\d.]+" height="[\d.]+"/, "");

/* The museum photograph, cropped to the two people, the touch screen
   and the map behind them. */
const PHOTO_W = W - IN_F2 - M * 2;
const PHOTO_H = 1.6;
const photoPx = { w: Math.round(PHOTO_W * 400), h: Math.round(PHOTO_H * 400) };
const EXHIBIT_PHOTO = (
  await sharp(join(SITE, "public/media/look-closer/exhibit-wall.jpg"))
    .extract({ left: 0, top: 276, width: 1200, height: Math.round((1200 * PHOTO_H) / PHOTO_W) })
    .resize(photoPx.w, photoPx.h)
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer()
).toString("base64");

/* ------------------------------------------------------------------ */
/*  The sheets                                                         */
/* ------------------------------------------------------------------ */

const inch = (n) => `${+n.toFixed(4)}in`;
const box = (left, width, top = TOP, bottom = BOTTOM) =>
  `left:${inch(left)};width:${inch(width)};top:${inch(top)};height:${inch(H - top - bottom)}`;

const icon = (name) =>
  `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="${RUST}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name]}"/></svg></span>`;

/* The site's SurveyRule, drawn to the map's own scale so it measures
   something. End ticks full height, chain ticks half. */
const half = routeMeta.halfMileIn * 100;
const scaleBar = `<svg class="bar" viewBox="-0.5 0 ${(half + 1).toFixed(2)} 9" style="width:${inch((half + 1) / 100)}">
  <g stroke="${RUST_DARK}" stroke-width="0.75" fill="none">
    <line x1="0" y1="4.5" x2="${half.toFixed(2)}" y2="4.5"/>
    <line x1="0" y1="0.5" x2="0" y2="8.5"/>
    ${[0.25, 0.5, 0.75].map((t) => `<line x1="${(half * t).toFixed(2)}" y1="2.5" x2="${(half * t).toFixed(2)}" y2="6.5"/>`).join("")}
    <line x1="${half.toFixed(2)}" y1="0.5" x2="${half.toFixed(2)}" y2="8.5"/>
  </g>
</svg>`;

const MAP_LEFT = IN_F1 + M;
const MAP_BOTTOM = routeMeta.heightIn - BLEED;
if (Math.abs(MAP_LEFT + routeMeta.widthIn - (W + BLEED)) > 0.002) {
  throw new Error("route-map width no longer runs from panel B's margin to the right bleed. Rerun gen-maps.mjs.");
}
const CART_LEFT = MAP_LEFT + 5.05;

const stopKey = (s) =>
  `<li><span class="dot${s.optional ? " opt" : ""}">${s.number}</span><span>${s.title.replace(/'/g, "’")}</span></li>`;

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Rooted Forward brochure</title>
<style>
  @font-face { font-family: "RF Serif"; src: url(data:font/woff2;base64,${SERIF}) format("woff2"); font-weight: 200 900; }
  @font-face { font-family: "RF Sans"; src: url(data:font/woff2;base64,${SANS}) format("woff2"); font-weight: 100 1000; }
  @font-face { font-family: "RF Narrow"; src: url(data:font/woff2;base64,${NARROW}) format("woff2"); font-weight: 400 700; }

  @page { size: ${W + BLEED * 2}in ${H + BLEED * 2}in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: ${CREAM}; }
  body {
    font-family: "RF Sans", Helvetica, Arial, sans-serif;
    color: ${INK};
    font-kerning: normal;
    -webkit-font-smoothing: antialiased;
  }

  /* One sheet per page, drawn with its bleed. The trim box inside it is
     the 11 x 8.5 the reader holds, and everything is placed in that. */
  .sheet {
    position: relative;
    width: ${W + BLEED * 2}in;
    height: ${H + BLEED * 2}in;
    overflow: hidden;
    background: ${CREAM};
    break-after: page;
  }
  .sheet:last-of-type { break-after: auto; }
  .trim { position: absolute; left: ${BLEED}in; top: ${BLEED}in; width: ${W}in; height: ${H}in; }
  .trim > * { position: absolute; }
  .panel { display: flex; flex-direction: column; }
  .panel > * { flex: none; }
  .grow { flex: 1 1 auto !important; min-height: 0; }

  /* ---- type ---- */
  h1, h2, h3 { font-family: "RF Serif", Georgia, serif; font-weight: 400; }
  h2 { font-size: 22pt; line-height: 1.08; letter-spacing: -0.014em; color: ${FOREST}; text-wrap: balance; }
  h3 { font-size: 13.5pt; line-height: 1.16; letter-spacing: -0.006em; color: ${INK}; }
  p { font-size: 8.8pt; line-height: 1.5; color: ${BODY}; text-wrap: pretty; }
  .credit { font-size: 6.1pt; line-height: 1.42; color: ${CREDIT}; letter-spacing: 0.005em; }

  /* ================= outside ================= */

  /* ---- flap ---- */
  .story { margin-top: 0.2in; display: flex; flex-direction: column; gap: 0.105in; }
  .stat {
    margin-top: 0.28in;
    border: 1.3pt solid ${mix(INK, CREAM, 0.15)};
    border-radius: 0.025in;
    padding: 0.17in 0.19in;
    display: grid; grid-template-columns: auto 1fr; column-gap: 0.2in; align-items: center;
  }
  .stat .num { font-family: "RF Serif", Georgia, serif; font-size: 38pt; line-height: 0.9; letter-spacing: -0.015em; color: ${RUST}; }
  .stat p { font-size: 8.3pt; line-height: 1.42; }
  .places h3 { font-size: 15pt; color: ${FOREST}; }
  .places ul { list-style: none; margin-top: 0.11in; border-top: 0.6pt solid ${BORDER}; }
  .places li {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 0.075in 0 0.07in;
    border-bottom: 0.6pt solid ${BORDER};
  }
  .places .city { font-family: "RF Serif", Georgia, serif; font-size: 11.5pt; color: ${INK}; }
  .places .status {
    font-size: 5.9pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.17em;
    color: ${mix(INK, CREAM, 0.56)};
  }
  .places .status.live { color: ${RUST_DARK}; }

  /* ---- back ---- */
  .forest { background: ${FOREST}; }
  .back h2 { color: ${CREAM}; }
  .back p { color: ${ON_FOREST}; }
  .back .lead { margin-top: 0.17in; }
  .tile {
    width: ${QR_IN + 0.26}in; height: ${QR_IN + 0.26}in;
    background: ${CREAM};
    border-radius: 0.03in;
    padding: 0.13in;
  }
  .tile svg { width: 100%; height: 100%; display: block; }
  .tile path, .tile rect { shape-rendering: crispEdges; }
  .url {
    margin-top: 0.2in;
    font-family: "RF Serif", Georgia, serif; font-size: 18pt; line-height: 1; letter-spacing: -0.012em;
    color: ${CREAM};
  }
  .mail { margin-top: 0.09in; font-size: 8.8pt; color: ${ON_FOREST}; }
  .lockup { display: flex; align-items: center; gap: 0.1in; }
  .lockup .mark { width: 0.34in; height: 0.34in; display: block; }
  .lockup span {
    font-family: "RF Serif", Georgia, serif; font-weight: 600; font-size: 14pt; letter-spacing: -0.02em;
    color: ${CREAM};
  }
  .back .credit { margin-top: 0.15in; color: ${ON_FOREST_SOFT}; }

  /* ---- cover ---- */
  .covermap { display: block; }
  .cover .mark { width: 0.56in; height: 0.56in; display: block; }
  .cover h1 {
    margin-top: 0.27in;
    font-weight: 600; font-size: 50pt; line-height: 0.93; letter-spacing: -0.024em;
    color: ${FOREST};
  }
  .mission {
    margin-top: 0.25in;
    font-family: "RF Serif", Georgia, serif; font-size: 12.6pt; line-height: 1.27; letter-spacing: -0.008em;
    color: ${INK};
    text-wrap: pretty;
  }
  .mission .who { color: ${RUST}; }
  .covercap {
    background: ${CREAM};
    border-radius: 0.025in;
    padding: 0.075in 0.1in 0.08in;
  }
  .covercap .credit { color: ${mix(INK, CREAM, 0.72)}; }

  /* ================= inside ================= */

  /* ---- A, what we do ---- */
  .work h2 { font-size: 26pt; }
  .rows { margin-top: 0.3in; display: flex; flex-direction: column; border-bottom: 0.6pt solid ${BORDER}; }
  .row {
    flex: 1 1 0;
    display: grid; grid-template-columns: 0.44in 1fr; column-gap: 0.17in;
    align-content: center;
    border-top: 0.6pt solid ${BORDER};
  }
  .ico {
    width: 0.44in; height: 0.44in; border-radius: 50%;
    border: 0.75pt solid ${mix(RUST, CREAM, 0.5)};
    display: flex; align-items: center; justify-content: center;
    margin-top: 0.015in;
  }
  .ico svg { width: 0.25in; height: 0.25in; display: block; }
  .row p { margin-top: 0.055in; }

  /* ---- B and C, the tour ---- */
  .routemap svg { width: 100%; height: 100%; display: block; }
  .cart h2 { font-size: 23pt; line-height: 1.02; }
  .facts { margin-top: 0.2in; border-top: 0.6pt solid ${mix(INK, WATER, 0.26)}; }
  .facts div { padding: 0.062in 0 0.066in; border-bottom: 0.6pt solid ${mix(INK, WATER, 0.26)}; }
  .facts dt { font-size: 6.3pt; line-height: 1.2; color: ${ON_WATER_SOFT}; }
  .facts dd { margin-top: 0.012in; font-family: "RF Serif", Georgia, serif; font-size: 11pt; line-height: 1.15; color: ${ON_WATER}; }
  .scale { margin-top: 0.2in; }
  .scale .bar { display: block; height: 0.09in; }
  .scale span {
    display: block; margin-top: 0.035in;
    font-family: "RF Narrow", "Arial Narrow", sans-serif; font-size: 5.6pt; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.16em; color: ${ON_WATER_SOFT};
  }

  .get { margin-top: 0.1in; }
  .get b { font-weight: 600; color: ${INK}; }
  .key {
    list-style: none;
    display: grid; grid-template-rows: repeat(8, auto); grid-auto-flow: column;
    grid-template-columns: max-content max-content; justify-content: space-between;
    row-gap: 0.052in;
  }
  .key li { display: flex; align-items: center; gap: 0.07in; font-size: 7.7pt; line-height: 1.15; color: ${BODY}; white-space: nowrap; }
  .dot {
    flex: none; width: 0.142in; height: 0.142in; border-radius: 50%;
    background: ${RUST}; color: #fff;
    font-size: 5.7pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1;
    display: flex; align-items: center; justify-content: center;
  }
  .dot.opt { background: ${CREAM}; color: ${RUST_DARK}; border: 0.8pt solid ${RUST}; }
  .keynote { margin-top: 0.09in; }

  .exhibit h3 { font-size: 15pt; color: ${FOREST}; }
  .exhibit img { display: block; margin-top: 0.13in; width: 100%; height: ${PHOTO_H}in; border-radius: 0.025in; }
  .exhibit .credit { margin-top: 0.055in; }
  .exhibit p.say { margin-top: 0.11in; }
  .exhibit p.where { color: ${INK}; }
  .exhibit p.where b { font-weight: 600; }

  /* ---- proof only ---- */
  .guides { display: none; }
  body.proof .guides { display: block; pointer-events: none; }
  body.proof .guides i { position: absolute; top: -${BLEED}in; height: ${H + BLEED * 2}in; border-left: 0.6pt dashed #0A84C8; }
  body.proof .guides b { position: absolute; inset: 0; border: 0.6pt solid #E0338F; }
</style>

<body>

<!-- ============================ OUTSIDE ============================ -->
<div class="sheet" id="outside">
  <div class="trim">
    <div class="forest" style="left:${inch(OUT_F1)};width:${inch(FULL)};top:-${BLEED}in;height:${inch(H + BLEED * 2)}"></div>
    <img class="covermap" alt="" src="data:image/png;base64,${COVER_MAP}"
      style="left:${inch(OUT_F2)};width:${inch(coverMeta.widthIn)};top:${inch(H + BLEED - coverMeta.heightIn)};height:${inch(coverMeta.heightIn)}">

    <!-- flap, the first thing seen when the cover opens -->
    <section class="panel flap" data-fit style="${box(M, TUCK - M * 2)}">
      <h2>How it started</h2>
      <div class="story">${STORY.map((p) => `<p>${p}</p>`).join("")}</div>
      <div class="stat">
        <div class="num">140+</div>
        <p>${STAT}</p>
      </div>
      <div class="grow"></div>
      <div class="places">
        <h3>Where we work</h3>
        <ul>${PLACES.map(([city, status, live]) => `<li><span class="city">${city}</span><span class="status${live ? " live" : ""}">${status}</span></li>`).join("")}</ul>
      </div>
    </section>

    <!-- back -->
    <section class="panel back" data-fit style="${box(OUT_F1 + M, FULL - M * 2)}">
      <h2>${HELP_HEAD}</h2>
      <p class="lead">${HELP_BODY}</p>
      <div class="grow"></div>
      <div class="tile" id="qr"><svg viewBox="${qrViewBox}" xmlns="http://www.w3.org/2000/svg">${qrInner}</svg></div>
      <div class="url">rooted-forward.org</div>
      <div class="mail">contact@rooted-forward.org</div>
      <div class="grow"></div>
      <div class="lockup">${MARK_RINGED}<span>Rooted Forward</span></div>
      <p class="credit">Cover map drawn from Home Owners’ Loan Corporation records, 1940, by way of Mapping Inequality, University of Richmond. Streets and shoreline on both maps from U.S. Census TIGER/Line.</p>
    </section>

    <!-- cover -->
    <section class="panel cover" data-fit style="${box(OUT_F2 + M, FULL - M * 2, TOP, 4.05)}">
      ${MARK}
      <h1>Rooted<br>Forward</h1>
      <p class="mission"><span class="who">${MISSION_WHO}</span> ${MISSION_WHAT}</p>
    </section>
    <div class="covercap" style="left:${inch(OUT_F2 + M)};width:2.2in;bottom:0.32in">
      <p class="credit">The Home Owners’ Loan Corporation’s grades for Chicago, 1940. The neighborhoods shaded red were the ones banks were told to stay out of.</p>
    </div>

    <div class="guides"><b></b><i style="left:${inch(OUT_F1)}"></i><i style="left:${inch(OUT_F2)}"></i></div>
  </div>
</div>

<!-- ============================ INSIDE ============================= -->
<div class="sheet" id="inside">
  <div class="trim">
    <div class="routemap" style="left:${inch(MAP_LEFT)};width:${inch(routeMeta.widthIn)};top:-${BLEED}in;height:${inch(routeMeta.heightIn)}">${ROUTE_MAP}</div>

    <!-- A -->
    <section class="panel work" data-fit style="${box(M, FULL - M * 2)}">
      <h2>Ways we help</h2>
      <div class="rows grow">
        ${WORK.map(([ic, title, line]) => `<div class="row">${icon(ic)}<div><h3>${title}</h3><p>${line}</p></div></div>`).join("\n        ")}
      </div>
    </section>

    <!-- the title block, set on the lake the way a chart sets its own -->
    <div class="cart" id="cart" style="left:${inch(CART_LEFT)};width:${inch(W - M - CART_LEFT)};top:${inch(TOP)}">
      <h2>Walk<br>Hyde Park</h2>
      <dl class="facts">${FACTS.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      <div class="scale">${scaleBar}<span>Half mile</span></div>
    </div>

    <!-- B, under the map -->
    <section class="panel tour" data-fit style="${box(IN_F1 + M, FULL - M * 2, MAP_BOTTOM + 0.27)}">
      <p>${TOUR_BLURB}</p>
      <p class="get">Free in the <b>Rooted Forward</b> app for iPhone, or in any browser at <b>rooted-forward.org/tours</b>.</p>
      <div class="grow"></div>
      <ol class="key">${STOPS.map(stopKey).join("")}</ol>
      <p class="credit keynote">${DETOUR_NOTE}</p>
    </section>

    <!-- C, under the map -->
    <section class="panel exhibit" data-fit style="${box(IN_F2 + M, W - IN_F2 - M * 2, MAP_BOTTOM + 0.27)}">
      <h3>${EXHIBIT_TITLE}</h3>
      <img alt="" src="data:image/jpeg;base64,${EXHIBIT_PHOTO}">
      <p class="credit">${EXHIBIT_CAPTION}</p>
      <p class="say">${EXHIBIT_BODY[0]} ${EXHIBIT_BODY[1]}.</p>
      <div class="grow"></div>
      <p class="where"><b>${MUSEUM_NAME}</b><br>${MUSEUM_STREET}</p>
    </section>

    <div class="guides"><b></b><i style="left:${inch(IN_F1)}"></i><i style="left:${inch(IN_F2)}"></i></div>
  </div>
</div>

</body>
</html>`;

/* House rules, checked on the words a reader sees rather than trusted. */
const visible = html.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
if (/[—–]/.test(visible)) throw new Error("There is a dash in the copy. The site uses none.");
const colon = visible.match(/[A-Za-z][^.?!]{0,40}:(?!\/\/)[^.?!]{0,40}/);
if (colon) throw new Error(`There is a colon in the copy: "${colon[0].trim()}"`);

const htmlPath = join(HERE, "brochure.html");
writeFileSync(htmlPath, html);

/* ------------------------------------------------------------------ */
/*  Render                                                             */
/* ------------------------------------------------------------------ */

const browser = await puppeteer.launch({ headless: true, args: ["--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport({ width: Math.round((W + BLEED * 2) * 96), height: Math.round((H + BLEED * 2) * 96), deviceScaleFactor: 1 });
await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");

/* ---------- does it all fit ---------- */
/* Every panel is a fixed box. Anything taller than its box would be
   pushed off the bottom without a word, so each one is measured. */
const fit = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("[data-fit]")) {
    const box = el.getBoundingClientRect();
    let bottom = 0, right = 0;
    for (const child of el.querySelectorAll("*")) {
      const r = child.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      bottom = Math.max(bottom, r.bottom);
      right = Math.max(right, r.right);
    }
    const grow = [...el.querySelectorAll(":scope > .grow")].map((g) => g.getBoundingClientRect().height / 96);
    out.push({
      panel: el.className.replace("panel ", ""),
      over: +((bottom - box.bottom) / 96).toFixed(3),
      wide: +((right - box.right) / 96).toFixed(3),
      slack: grow.map((g) => +g.toFixed(2)),
    });
  }
  const wrapped = [...document.querySelectorAll(".key li")].filter((li) => li.scrollWidth > li.clientWidth + 1).map((li) => li.textContent);
  return { out, wrapped };
});
let bad = false;
for (const f of fit.out) {
  const ok = f.over <= 0.001 && f.wide <= 0.001;
  if (!ok) bad = true;
  console.log(`${ok ? "fits  " : "SPILLS"}  ${f.panel.padEnd(8)} over ${f.over}in, wide ${f.wide}in, slack ${JSON.stringify(f.slack)}`);
}
if (fit.wrapped.length) { bad = true; console.log("stop names too long for the key:", fit.wrapped); }
/* DRAFT=1 writes the proofs anyway, to see what is spilling. */
if (bad && !process.env.DRAFT) { await browser.close(); throw new Error("The copy does not fit its panels. Nothing was written."); }

/* ---------- the print files ---------- */
const BLEED_PDF = join(OUT, "rooted-forward-brochure-trifold-bleed.pdf");
const TRIM_PDF = join(OUT, "rooted-forward-brochure-trifold.pdf");
await page.pdf({ path: BLEED_PDF, printBackground: true, preferCSSPageSize: true });

/* The same two sheets cut to the trim, for a shop that wants no bleed
   and for printing a proof on a desk printer. */
await page.addStyleTag({
  content: `@page { size: ${W}in ${H}in; margin: 0; }
    .sheet { width: ${W}in; height: ${H}in; }
    .trim { left: 0; top: 0; }`,
});
await page.pdf({ path: TRIM_PDF, printBackground: true, preferCSSPageSize: true });

/* ---------- pictures of both sides ---------- */
const DPI = 200;
await page.setViewport({ width: W * 96, height: H * 96, deviceScaleFactor: DPI / 96 });
for (const proof of [false, true]) {
  await page.evaluate((p) => document.body.classList.toggle("proof", p), proof);
  for (const id of ["outside", "inside"]) {
    const el = await page.$(`#${id}`);
    await el.screenshot({ path: join(PROOF, `${id}${proof ? "-with-folds" : ""}.png`), type: "png" });
  }
}
await page.evaluate(() => document.body.classList.remove("proof"));

/* ---------- prove the code scans ---------- */
const qrBox = await page.evaluate(() => {
  const q = document.querySelector("#qr").getBoundingClientRect();
  const s = document.querySelector("#outside").getBoundingClientRect();
  return { x: q.x - s.x, y: q.y - s.y, w: q.width, h: q.height };
});
await browser.close();

async function readQr(pngPath, crop) {
  let img = sharp(pngPath);
  if (crop) img = img.extract(crop);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
}
const s = DPI / 96;
const seen = await readQr(join(PROOF, "outside.png"), {
  left: Math.round(qrBox.x * s), top: Math.round(qrBox.y * s),
  width: Math.round(qrBox.w * s), height: Math.round(qrBox.h * s),
});
if (seen !== QR_URL) throw new Error(`The rendered QR reads ${seen ?? "nothing"}, expected ${QR_URL}. Do not print this.`);

/* ---------- outline the type ---------- */
/* Chrome writes variable fonts as Type3, which a print shop's
   preflight reads as un-embedded and rejects. Round-tripping each
   page through Cairo turns every glyph into a plain path. The file
   stays vector and carries no fonts at all. See build-banner.mjs. */
function outline(pdfPath) {
  const pages = Number(execFileSync("pdfinfo", [pdfPath]).toString().match(/Pages:\s+(\d+)/)[1]);
  if (pages !== 2) throw new Error(`${pdfPath} has ${pages} pages, expected 2 (outside, inside)`);
  const parts = [];
  for (let n = 1; n <= pages; n++) {
    const svg = pdfPath.replace(/\.pdf$/, `.p${n}.svg`);
    const part = pdfPath.replace(/\.pdf$/, `.p${n}.pdf`);
    execFileSync("pdftocairo", ["-svg", "-f", String(n), "-l", String(n), pdfPath, svg]);
    execFileSync("rsvg-convert", ["-f", "pdf", "-o", part, svg]);
    unlinkSync(svg);
    parts.push(part);
  }
  execFileSync("pdfunite", [...parts, pdfPath]);
  parts.forEach((p) => unlinkSync(p));
  const fonts = execFileSync("pdffonts", [pdfPath]).toString().trim().split("\n").slice(2);
  if (fonts.length) throw new Error(`${pdfPath} still carries fonts after outlining:\n${fonts.join("\n")}`);
  return execFileSync("pdfinfo", [pdfPath]).toString().match(/Page size:\s+([\d.]+) x ([\d.]+)/).slice(1).map((v) => +(v / 72).toFixed(3));
}
const bleedSize = outline(BLEED_PDF);
const trimSize = outline(TRIM_PDF);

/* ---------- read the code back off the real print file ---------- */
const probe = join(PROOF, ".qr-probe");
execFileSync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", "1", "-singlefile", TRIM_PDF, probe]);
const fromPdf = await readQr(`${probe}.png`);
unlinkSync(`${probe}.png`);
if (fromPdf !== QR_URL) throw new Error(`The outlined PDF's QR reads ${fromPdf ?? "nothing"}. Do not print this.`);

console.log("QR              ", QR_URL, `(${qrModules} modules, ${(QR_IN / qrModules * 25.4).toFixed(2)}mm each, scans from the print file)`);
console.log("type            ", "outlined, no fonts in either file");
console.log("wrote           ", `print/rooted-forward-brochure-trifold-bleed.pdf  ${bleedSize.join(" x ")} in`);
console.log("                ", `print/rooted-forward-brochure-trifold.pdf        ${trimSize.join(" x ")} in`);
console.log("                ", "print/brochure/proof/{outside,inside}.png and the same with fold lines");
