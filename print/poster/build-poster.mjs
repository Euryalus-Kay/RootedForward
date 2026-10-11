/* ------------------------------------------------------------------ */
/*  Rooted Forward poster for the outreach table, 20 x 30 inches.      */
/*                                                                     */
/*  It stands on an easel beside the table and gets photographed, so   */
/*  it says very little, in type large enough to read from across the  */
/*  table. The name, the mission, five short labels for what we do,    */
/*  and a code to scan with the words "Scan to learn more". The same   */
/*  map as the brochure's cover runs behind the lower half.            */
/*                                                                     */
/*  Sized for a Walgreens same-day print. Their satin poster comes in  */
/*  24 x 36 and their rigid board print in 20 x 30, and both are 2:3,  */
/*  so one file serves either. It goes up as a JPEG, since that is     */
/*  what a photo counter takes. A photo lab can trim a little off any  */
/*  edge, so nothing that matters sits within an inch of one and the   */
/*  grounds run all the way out.                                       */
/*                                                                     */
/*  The mission is the brochure's wording ("raises awareness of"),     */
/*  which the owner chose over the site's "educates people about" in   */
/*  October 2026. The labels are the brochure's, shortened, without    */
/*  museum partnerships, which he asked to leave off this piece. The   */
/*  line about where we are active is his wording for the poster.      */
/*                                                                     */
/*  The QR code encodes rooted-forward.org/go/poster, our own          */
/*  redirect, so the poster can be re-pointed without reprinting       */
/*  (src/lib/qr-links.ts).                                             */
/*                                                                     */
/*    npm install --no-save qrcode jsqr                                */
/*    node print/brochure/gen-maps.mjs      (draws poster-map.svg)     */
/*    node print/poster/build-poster.mjs                               */
/*                                                                     */
/*  Needs poppler and librsvg on PATH.                                 */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import sharp from "sharp";
import jsQR from "jsqr";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const MAPS = join(SITE, "print/brochure/assets");
const OUT = join(SITE, "print");

/* ---------- geometry, in inches ---------- */
const W = 20;
const H = 30;
const PAD = 1.3; // side margin, and more than a lab will trim
const TOP = 1.1;
const FOOT = 5.1; // the forest band at the bottom
const PPI = 200; // 4000 x 6000 pixels, enough for either print size

/* ---------- palette (site tokens) ---------- */
const CREAM = "#F5F0E8";
const FOREST = "#1B3A2D";
const INK = "#1A1A1A";
const RUST = "#C45D3E";
function mix(a, b, t) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const [A, B] = [h(a), h(b)];
  return "#" + A.map((v, i) => Math.round(v * t + B[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
}
const ON_FOREST = mix(CREAM, FOREST, 0.82);

/* ---------- fonts ---------- */
const b64 = (p) => readFileSync(join(SITE, p)).toString("base64");
const SERIF = b64("print/fonts/source-serif-4-latin-var.woff2");
const SANS = b64("print/fonts/dm-sans-latin-var.woff2");

/* ---------- copy ---------- */
const MISSION_WHO = "A student-run nonprofit started in Chicago.";
const MISSION_WHAT = "Rooted Forward raises awareness of racial inequality in cities across the United States, and works to address it through education and political advocacy.";
/* Checked against the brochure, so the two printed pieces cannot
   disagree about what the organization is. */
const brochure = readFileSync(join(SITE, "print/brochure/build-brochure.mjs"), "utf8");
if (!brochure.includes(MISSION_WHAT)) throw new Error(`The brochure no longer says: ${MISSION_WHAT}`);
/* Owner's wording for the poster (October 2026). Not three cities and
   a full stop, but major cities, with the three as examples. */
const ACTIVE = "We are active in major U.S. cities, including Chicago, New\u00a0York, and Washington,\u00a0DC.";
const SCAN = "Scan to learn more";

/* Heroicons outline, as on the home page and the brochure. */
const ICONS = {
  map: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z",
  clipboard: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z",
  scale: "M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z",
  school: "M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5",
  museum: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z",
  archive: "m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z",
};
/* Five of the brochure's six, each cut to two words. Ordered so the
   three short ones fill the first row and the two long ones the
   second. */
const WORK = [
  ["map", "Walking tours"],
  ["school", "School visits"],
  ["scale", "Policy advocacy"],
  ["clipboard", "Community outreach"],
  ["archive", "Archival research"],
];
for (const [, label] of WORK) {
  const last = label.split(" ").pop();
  if (!brochure.toLowerCase().includes(last.toLowerCase())) throw new Error(`The brochure has no item matching "${label}"`);
}

/* ---------- QR ---------- */
const QR_URL = "https://rooted-forward.org/go/poster";
const qrSvg = await QRCode.toString(QR_URL, { type: "svg", errorCorrectionLevel: "Q", margin: 0, color: { dark: FOREST, light: "#0000" } });
const qrViewBox = qrSvg.match(/viewBox="([^"]+)"/)[1];
const qrInner = qrSvg.replace(/<\?xml[^>]*\?>/, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "").replace(/<rect[^>]*fill="#0000"[^>]*\/>/, "");
const qrModules = Number(qrViewBox.split(" ")[2]);
const QR_IN = 3.1;

/* ---------- the mark and the map ---------- */
const logo = readFileSync(join(SITE, "public/logo.svg"), "utf8");
const MARK = logo.replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="mark">');

const mapMeta = JSON.parse(readFileSync(join(MAPS, "poster-map.json"), "utf8"));
if (mapMeta.widthIn !== W) throw new Error("poster-map.svg is not the width of the poster. Rerun gen-maps.mjs.");
const mapPng = join(HERE, "poster-map.png");
execFileSync("rsvg-convert", ["-w", String(W * PPI), "-b", CREAM, "-o", mapPng, join(MAPS, "poster-map.svg")]);
const MAP = (await sharp(mapPng).flatten({ background: CREAM }).png({ compressionLevel: 9 }).toBuffer()).toString("base64");
unlinkSync(mapPng);
const MAP_TOP = H - FOOT - mapMeta.heightIn;

const icon = (name) =>
  `<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="${RUST}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name]}"/></svg></span>`;

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Rooted Forward poster</title>
<style>
  @font-face { font-family: "RF Serif"; src: url(data:font/woff2;base64,${SERIF}) format("woff2"); font-weight: 200 900; }
  @font-face { font-family: "RF Sans"; src: url(data:font/woff2;base64,${SANS}) format("woff2"); font-weight: 100 1000; }
  @page { size: ${W}in ${H}in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: ${CREAM}; }
  body { font-family: "RF Sans", Helvetica, Arial, sans-serif; color: ${INK}; font-kerning: normal; -webkit-font-smoothing: antialiased; }
  .sheet { position: relative; width: ${W}in; height: ${H}in; overflow: hidden; background: ${CREAM}; }
  .sheet > * { position: absolute; }

  .map { left: 0; top: ${MAP_TOP}in; width: ${W}in; height: ${mapMeta.heightIn}in; display: block; }

  .top { left: ${PAD}in; right: ${PAD}in; top: ${TOP}in; }
  .mark { width: 1.3in; height: 1.3in; display: block; }
  h1 {
    margin-top: 0.42in;
    font-family: "RF Serif", Georgia, serif; font-weight: 600; font-size: 3.6in; line-height: 0.92; letter-spacing: -0.026em;
    color: ${FOREST};
  }
  .mission {
    margin-top: 0.55in; max-width: 17.2in;
    font-family: "RF Serif", Georgia, serif; font-size: 0.8in; line-height: 1.21; letter-spacing: -0.01em;
    color: ${INK}; text-wrap: balance;
  }
  .mission .who { color: ${RUST}; }
  .work {
    margin-top: 0.7in;
    list-style: none;
    display: flex; flex-wrap: wrap; column-gap: 0.95in; row-gap: 0.3in;
  }
  .work li { display: flex; align-items: center; gap: 0.28in; font-family: "RF Serif", Georgia, serif; font-size: 0.6in; letter-spacing: -0.006em; color: ${INK}; white-space: nowrap; }
  .ico {
    flex: none; width: 1.08in; height: 1.08in; border-radius: 50%;
    border: 1.6pt solid ${mix(RUST, CREAM, 0.5)}; background: ${CREAM};
    display: flex; align-items: center; justify-content: center;
  }
  .ico svg { width: 0.62in; height: 0.62in; display: block; }

  .foot { left: 0; top: ${H - FOOT}in; width: ${W}in; height: ${FOOT}in; background: ${FOREST}; }
  .tile {
    left: ${PAD}in; top: ${H - FOOT + (FOOT - QR_IN - 0.5) / 2}in;
    width: ${QR_IN + 0.5}in; height: ${QR_IN + 0.5}in;
    background: ${CREAM}; border-radius: 0.07in; padding: 0.25in;
  }
  .tile svg { width: 100%; height: 100%; display: block; }
  .tile path, .tile rect { shape-rendering: crispEdges; }
  .go { left: ${PAD + QR_IN + 0.5 + 0.7}in; right: ${PAD}in; top: ${H - FOOT}in; height: ${FOOT}in; display: flex; flex-direction: column; justify-content: center; }
  .scan { font-family: "RF Serif", Georgia, serif; font-size: 1.12in; line-height: 1; letter-spacing: -0.018em; color: ${CREAM}; white-space: nowrap; }
  .url { margin-top: 0.3in; font-size: 0.62in; font-weight: 500; line-height: 1; letter-spacing: -0.005em; color: ${CREAM}; white-space: nowrap; }
  .active { margin-top: 0.42in; font-size: 0.43in; line-height: 1.32; color: ${ON_FOREST}; max-width: 12in; text-wrap: balance; }
</style>
<body>
<div class="sheet" id="sheet">
  <img class="map" alt="" src="data:image/png;base64,${MAP}">
  <div class="top" id="top">
    ${MARK}
    <h1>Rooted<br>Forward</h1>
    <p class="mission"><span class="who">${MISSION_WHO}</span> ${MISSION_WHAT}</p>
    <ul class="work">${WORK.map(([ic, label]) => `<li>${icon(ic)}${label}</li>`).join("")}</ul>
  </div>
  <div class="foot"></div>
  <div class="tile" id="qr"><svg viewBox="${qrViewBox}" xmlns="http://www.w3.org/2000/svg">${qrInner}</svg></div>
  <div class="go">
    <div class="scan">${SCAN}</div>
    <div class="url">rooted-forward.org</div>
    <p class="active">${ACTIVE}</p>
  </div>
</div>
</body>
</html>`;

const visible = html.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ");
if (/[—–]/.test(visible)) throw new Error("There is a dash in the copy.");
if (/[A-Za-z][^.?!]{0,40}:(?!\/\/)/.test(visible)) throw new Error("There is a colon in the copy.");

const htmlPath = join(HERE, "poster.html");
writeFileSync(htmlPath, html);

/* ---------- render ---------- */
const browser = await puppeteer.launch({ headless: true, args: ["--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport({ width: W * 96, height: H * 96, deviceScaleFactor: PPI / 96 });
await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");

/* The words have to end before the map shows through. The map is solid
   paper for its first half inch and fades in below that. */
const fit = await page.evaluate(() => {
  const top = document.querySelector("#top").getBoundingClientRect();
  const widest = Math.max(...[...document.querySelectorAll("#top *")].map((e) => e.getBoundingClientRect().right));
  return { bottom: top.bottom / 96, right: widest / 96 };
});
const limit = MAP_TOP + 0.5;
console.log(`words end at ${fit.bottom.toFixed(2)}in, the map shows from ${limit.toFixed(2)}in`);
if (fit.bottom > limit || fit.right > W - PAD + 0.01) {
  if (!process.env.DRAFT) { await browser.close(); throw new Error("The words run into the map or past the margin. Nothing was written."); }
  console.log("DOES NOT FIT");
}

const JPG = join(OUT, "rooted-forward-poster-20x30.jpg");
const PDF = join(OUT, "rooted-forward-poster-20x30.pdf");
await (await page.$("#sheet")).screenshot({ path: JPG, type: "jpeg", quality: 94 });
await page.pdf({ path: PDF, printBackground: true, preferCSSPageSize: true });
const qrBox = await page.evaluate(() => { const q = document.querySelector("#qr").getBoundingClientRect(); return { x: q.x, y: q.y, w: q.width, h: q.height }; });
await browser.close();

/* The photo counter reads the pixel size and the color space. sRGB,
   and the 200 pixels to the inch written into the file. */
const jpg = await sharp(JPG).withMetadata({ density: PPI }).toColourspace("srgb").jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toBuffer();
writeFileSync(JPG, jpg);
const meta = await sharp(JPG).metadata();
if (meta.width !== W * PPI || meta.height !== H * PPI) throw new Error(`the JPEG is ${meta.width} x ${meta.height}, expected ${W * PPI} x ${H * PPI}`);

/* ---------- prove the code scans, off the file that gets printed ---------- */
const s = PPI / 96;
const { data, info } = await sharp(JPG)
  .extract({ left: Math.round(qrBox.x * s), top: Math.round(qrBox.y * s), width: Math.round(qrBox.w * s), height: Math.round(qrBox.h * s) })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const seen = jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
if (seen !== QR_URL) throw new Error(`The poster's QR reads ${seen ?? "nothing"}, expected ${QR_URL}. Do not print this.`);

/* ---------- outline the type in the PDF ---------- */
const svg = PDF.replace(/\.pdf$/, ".outline.svg");
execFileSync("pdftocairo", ["-svg", "-f", "1", "-l", "1", PDF, svg]);
execFileSync("rsvg-convert", ["-f", "pdf", "-o", PDF, svg]);
unlinkSync(svg);
const fonts = execFileSync("pdffonts", [PDF]).toString().trim().split("\n").slice(2);
if (fonts.length) throw new Error("the PDF still carries fonts after outlining");

console.log("QR              ", QR_URL, `(${qrModules} modules, ${(QR_IN / qrModules * 25.4).toFixed(1)}mm each, scans from the JPEG)`);
console.log("wrote           ", `print/rooted-forward-poster-20x30.jpg  ${meta.width} x ${meta.height} px, ${(jpg.length / 1e6).toFixed(1)} MB`);
console.log("                ", "print/rooted-forward-poster-20x30.pdf  vector, type outlined");
