/* ------------------------------------------------------------------ */
/*  Mirror the eight exhibition sheets onto a Claude Design canvas.    */
/*                                                                     */
/*  The print sources in panels/ stay the single source of truth for   */
/*  the PDFs; this script converts each sheet into a .dc.html          */
/*  artboard (fonts via Google Fonts, images downsampled for the       */
/*  canvas, maps rasterized) and writes canvas/ plus canvas.json.      */
/*                                                                     */
/*    node print/exhibit/gen-canvas.mjs                                */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const PANELS = join(HERE, "panels");
const ASSETS = join(HERE, "assets");
const OUT = join(HERE, "canvas");
mkdirSync(OUT, { recursive: true });

/* ---------- shared css, converted ---------- */
let css = readFileSync(join(PANELS, "system.css"), "utf8");
css = css.replace(/@font-face\s*{[^}]*}/g, "");
css = css
  .replaceAll('"RF Serif"', '"Source Serif 4"')
  .replaceAll('"RF Narrow"', '"Archivo Narrow"')
  .replaceAll('"RF Mono"', '"IBM Plex Mono"')
  .replaceAll('"RF Sans"', '"DM Sans"');

const FONTS =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Archivo+Narrow:ital,wght@0,400..700;1,400..700&family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:opsz,wght@9..40,100..1000&display=swap">';

/* ---------- images ---------- */
async function photo(name) {
  const src = join(ASSETS, "img", name);
  const meta = await sharp(src).metadata();
  const w = Math.min(1050, meta.width);
  await sharp(src).resize({ width: w }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, name));
}
const PHOTOS = [
  "p1-hero-court-night.jpg", "p1-olmsted-plan.jpg",
  "p1-reason-why.jpg", "p2-bombing-map.jpg",
  "p3-kitchenette.jpg", "p3-hansberry-house.jpg", "p4-opc.jpg", "p4-harper-court.jpg", "p1-fair-burning.jpg",
  "strip-ferris.jpg", "strip-midway.jpg", "strip-delprado.jpg", "strip-fire.jpg",
  "strip-carlton.jpg", "strip-drexel.jpg", "strip-quads.jpg", "strip-sisson.jpg",
  "strip-doorway.jpg", "strip-63rd.jpg", "strip-63bus.jpg", "strip-univapts.jpg",
  "strip-55th.jpg", "strip-republic.jpg", "strip-midway-today.jpg", "strip-metra.jpg",
];
for (const p of PHOTOS) await photo(p);


/* maps and marks */
execFileSync("rsvg-convert", ["-w", "1500", join(ASSETS, "holc-map.svg"), "-o", "/tmp/holc-canvas.png"]);
await sharp("/tmp/holc-canvas.png").flatten({ background: "#EDE6D6" }).jpeg({ quality: 86 }).toFile(join(OUT, "holc-map.jpg"));
execFileSync("rsvg-convert", ["-w", "1800", join(ASSETS, "route-map.svg"), "-o", "/tmp/route-canvas.png"]);
await sharp("/tmp/route-canvas.png").flatten({ background: "#EDE6D6" }).jpeg({ quality: 86 }).toFile(join(OUT, "route-map.jpg"));
writeFileSync(join(OUT, "rf-logo.svg"), readFileSync(join(ASSETS, "img", "rf-logo.svg")));
writeFileSync(join(OUT, "qr-exhibit.svg"), readFileSync(join(ASSETS, "qr-exhibit.svg")));

/* ---------- panel -> artboard ---------- */
function convert(panelFile, dcName) {
  const html = readFileSync(join(PANELS, panelFile), "utf8");
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  let body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  body = body
    .replaceAll("../assets/img/", "")
    .replaceAll("../assets/holc-map.svg", "holc-map.jpg")
    .replaceAll("../assets/route-map.svg", "route-map.jpg")
    .replaceAll("../assets/qr-exhibit.svg", "qr-exhibit.svg");

  const dc = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  ${FONTS}
  <style>
${css}
${style}
  a { color: #C45D3E; } a:hover { color: #A8462A; }
  </style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;
  writeFileSync(join(OUT, dcName), dc);
}

convert("board-1.html", "Main.dc.html");
convert("board-2.html", "Board2.dc.html");
convert("board-3.html", "Board3.dc.html");
convert("board-4.html", "Board4.dc.html");
convert("banner-1.html", "Banner1.dc.html");
convert("banner-2.html", "Banner2.dc.html");
convert("banner-3.html", "Banner3.dc.html");
convert("banner-4.html", "Banner4.dc.html");

/* ---------- layout ---------- */
const BW = 36 * 96, BH = 48 * 96;      // 3456 x 4608
const NW = 33 * 96, NH = 81 * 96;      // 3168 x 7776
const GAP = 220;
const canvas = {
  artboards: [
    { file: "Main.dc.html",    x: 0,                y: 0, w: BW, h: BH, title: "Board 1 · 36×48 in" },
    { file: "Board2.dc.html",  x: (BW + GAP),       y: 0, w: BW, h: BH, title: "Board 2 · 36×48 in" },
    { file: "Board3.dc.html",  x: (BW + GAP) * 2,   y: 0, w: BW, h: BH, title: "Board 3 · 36×48 in" },
    { file: "Board4.dc.html",  x: (BW + GAP) * 3,   y: 0, w: BW, h: BH, title: "Board 4 · 36×48 in" },
    { file: "Banner1.dc.html", x: 0,                y: BH + 400, w: NW, h: NH, title: "Banner 1 · 33×81 in" },
    { file: "Banner2.dc.html", x: (BW + GAP),       y: BH + 400, w: NW, h: NH, title: "Banner 2 · 33×81 in" },
    { file: "Banner3.dc.html", x: (BW + GAP) * 2,   y: BH + 400, w: NW, h: NH, title: "Banner 3 · 33×81 in" },
    { file: "Banner4.dc.html", x: (BW + GAP) * 3,   y: BH + 400, w: NW, h: NH, title: "Banner 4 · 33×81 in" },
  ],
  annotations: [
    {
      id: "print-note",
      x: 0, y: -420, w: 1400,
      text: "Who Could Live in Hyde Park. Four 36x48 boards (top row) and four 33x81 retractable banners (bottom row).\nEdit text right on the sheets; the print PDFs are rebuilt from these layouts at print/exhibit/ in the repo.\nOn the banners, nothing that must be read sits in the bottom 17 inches; that zone is the plinth and the cassette allowance.",
    },
  ],
  launch: { view: "canvas" },
};
writeFileSync(join(OUT, "canvas.json"), JSON.stringify(canvas, null, 1));
console.log("canvas/ written:", canvas.artboards.length, "artboards");
