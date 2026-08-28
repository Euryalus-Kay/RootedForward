/* ------------------------------------------------------------------ */
/*  Rooted Forward outreach banner, 6ft x 2ft vinyl.                   */
/*                                                                     */
/*  This is the banner that hangs at the table at the Obama            */
/*  Presidential Center and at neighborhood farmers' markets, so it    */
/*  is designed to be read while somebody walks past it at twenty      */
/*  feet, not while they stand in front of it. Three things and no     */
/*  more. Who we are, what is on offer, and a code to scan.            */
/*                                                                     */
/*  Everything is laid out in real inches. CSS `in` units are exact    */
/*  in Chrome, and the PDF is written at the true 72x24 trim size, so  */
/*  what is in this file is what arrives on the vinyl.                 */
/*                                                                     */
/*  The QR code encodes rooted-forward.org/go/banner, which is our     */
/*  own redirect. Where it lands is decided at scan time by            */
/*  src/lib/qr-links.ts, so this banner can be re-pointed for as long  */
/*  as the domain is ours, without reprinting it.                      */
/*                                                                     */
/*    npm install --no-save qrcode jsqr                                */
/*    node print/build-banner.mjs                                      */
/*                                                                     */
/*  Those two are not site dependencies and are deliberately kept out  */
/*  of package.json. qrcode draws the code, jsqr reads it back off the */
/*  rendered pixels so a banner that will not scan fails the build     */
/*  here rather than at the print shop.                                */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";
import puppeteer from "/Users/zainzaidi/Desktop/Rooted Forward/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js";
import sharp from "sharp";
import jsQR from "jsqr";

const SITE = "/Users/zainzaidi/Desktop/Rooted Forward";
const OUT = join(SITE, "print");
mkdirSync(OUT, { recursive: true });

/* ---------- geometry, in inches ---------- */
const W = 72;
const H = 24;
/* Grommets punch through the outer inch and the hem folds over about
   an inch more, so nothing that has to survive goes near the edge. */
const PAD_X = 3.25;
const PAD_Y = 2.5;
const BLEED = 0.25;

/* ---------- palette ---------- */
/* Site tokens. rust-light is used instead of rust wherever a shape is
   thin, because rust on forest loses too much contrast at small sizes
   (noted in the logo kit's brand notes). */
const FOREST = "#1B3A2D";
const FOREST_LIGHT = "#2A5440";
const CREAM = "#F5F0E8";
const LOGO_CREAM = "#E8DCC8";
const RUST = "#C45D3E";
const RUST_LIGHT = "#D4765C";

/* ---------- fonts ---------- */
/* The site's own faces, embedded so the PDF carries them and no printer
   has to substitute anything. Both are variable, so one file covers
   every weight used here.

   These are copies kept in print/fonts rather than reads out of
   .next/static/media, because Next re-hashes those filenames on every
   build and this script would quietly stop finding them. They were
   lifted from the built stylesheet's @font-face rules, so they are the
   same bytes the website serves. */
const b64 = (p) => readFileSync(join(SITE, p)).toString("base64");
const SERIF = b64("print/fonts/source-serif-4-latin-var.woff2");
const SANS = b64("print/fonts/dm-sans-latin-var.woff2");

/* ---------- QR ---------- */
const QR_URL = "https://rooted-forward.org/go/banner";
/* Error correction Q recovers 25% of the code. A banner gets rolled,
   creased at the fold, and rained on, and a lost corner should not end
   its life. margin 0 because the quiet zone is the cream tile's own
   padding, which is far wider than the four modules the spec asks for. */
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

/* ---------- the mark ---------- */
/* public/logo.svg exactly as drawn, with one addition. The logo's own
   field is forest and so is the banner, so the disc would dissolve
   into the ground. A thin cream ring gives it its edge back without
   touching a single one of the logo's colours. */
const logo = readFileSync(join(SITE, "public/logo.svg"), "utf8");
const MARK = logo
  .replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="mark">')
  .replace("</svg>", `<circle cx="200" cy="200" r="188" fill="none" stroke="${CREAM}" stroke-width="7"/></svg>`);

/* ------------------------------------------------------------------ */
/*  The sheet                                                          */
/* ------------------------------------------------------------------ */

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "RF Serif";
    src: url(data:font/woff2;base64,${SERIF}) format("woff2");
    font-weight: 200 900;
  }
  @font-face {
    font-family: "RF Sans";
    src: url(data:font/woff2;base64,${SANS}) format("woff2");
    font-weight: 100 1000;
  }

  @page { size: ${W + BLEED * 2}in ${H + BLEED * 2}in; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: ${FOREST}; }

  /* The sheet is drawn at trim size and sits inside a bleed frame of
     the same forest, so the same document works whether the printer
     wants bleed or not. Trim marks are never drawn, because a vinyl
     shop cuts to the sewn hem, not to a crop mark. */
  .bleed {
    width: ${W + BLEED * 2}in;
    height: ${H + BLEED * 2}in;
    padding: ${BLEED}in;
    background: ${FOREST};
  }
  .banner {
    position: relative;
    width: ${W}in;
    height: ${H}in;
    background: ${FOREST};
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 3.25in;
    padding: ${PAD_Y}in ${PAD_X}in;
    font-kerning: normal;
    -webkit-font-smoothing: antialiased;
  }

  /* ---- left, the identity ---- */
  .left { flex: 1 1 auto; min-width: 0; }

  .idrow { display: flex; align-items: center; gap: 1.5in; }
  .mark { width: 8.6in; height: 8.6in; display: block; flex: none; }

  .wordmark {
    font-family: "RF Serif", Georgia, serif;
    font-weight: 600;
    font-size: 5.55in;
    line-height: 0.95;
    letter-spacing: -0.02em;
    color: ${CREAM};
    white-space: nowrap;
  }

  .rule {
    width: 7.5in;
    height: 0.2in;
    background: ${RUST_LIGHT};
    margin: 1.5in 0 1.35in;
  }

  .tagline {
    font-family: "RF Sans", Helvetica, Arial, sans-serif;
    font-weight: 500;
    font-size: 2.45in;
    line-height: 1.18;
    letter-spacing: -0.005em;
    color: ${CREAM};
    max-width: 46in;
  }

  .who {
    margin-top: 1.15in;
    font-family: "RF Sans", Helvetica, Arial, sans-serif;
    font-weight: 600;
    font-size: 1.02in;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${RUST_LIGHT};
  }

  /* ---- right, the code ---- */
  /* A QR has to be dark on light. Printed light on dark it fails on a
     good share of phone cameras, so the code sits on its own cream
     tile rather than being knocked out of the forest. */
  .tile {
    flex: none;
    width: 17.5in;
    height: ${H - PAD_Y * 2}in;
    background: ${CREAM};
    border-radius: 0.5in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.9in 1.9in 1.7in;
  }
  .qr { width: 13.7in; height: 13.7in; display: block; }
  .qr path, .qr rect { shape-rendering: crispEdges; }

  .cap {
    margin-top: 1.05in;
    font-family: "RF Sans", Helvetica, Arial, sans-serif;
    font-weight: 700;
    font-size: 1.42in;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${FOREST};
    text-align: center;
    line-height: 1.08;
  }
  .url {
    margin-top: 0.5in;
    font-family: "RF Sans", Helvetica, Arial, sans-serif;
    font-weight: 500;
    font-size: 1.02in;
    letter-spacing: 0.01em;
    color: ${FOREST};
    opacity: 0.72;
  }
</style>

<div class="bleed">
  <div class="banner">
    <div class="left">
      <div class="idrow">
        ${MARK}
        <div class="wordmark">Rooted&nbsp;Forward</div>
      </div>
      <div class="rule"></div>
      <div class="tagline">Free self-guided audio tours<br>of the neighborhoods we research.</div>
      <div class="who">A student-run nonprofit</div>
    </div>

    <div class="tile">
      <svg class="qr" viewBox="${qrViewBox}" xmlns="http://www.w3.org/2000/svg">${qrInner}</svg>
      <div class="cap">Scan for the<br>free app</div>
      <div class="url">rooted-forward.org</div>
    </div>
  </div>
</div>`;

const htmlPath = join(OUT, "banner-72x24.html");
writeFileSync(htmlPath, html);

/* ------------------------------------------------------------------ */
/*  Render                                                             */
/* ------------------------------------------------------------------ */

const browser = await puppeteer.launch({ headless: true, args: ["--font-render-hinting=none"] });
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 600, deviceScaleFactor: 1 });
await page.goto("file://" + htmlPath, { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");

/* Vector PDF at true size. preferCSSPageSize honours the @page rule
   above, so the page really is 72.5 x 24.5 inches with the artwork
   centred inside it and a quarter inch of forest to trim into. */
const pdf = await page.pdf({
  path: join(OUT, "rooted-forward-banner-72x24-bleed.pdf"),
  printBackground: true,
  preferCSSPageSize: true,
  pageRanges: "1",
});

/* And the same artwork with no bleed, for shops that want exact trim. */
await page.addStyleTag({
  content: `@page { size: ${W}in ${H}in; margin: 0; } .bleed { padding: 0; width: ${W}in; height: ${H}in; }`,
});
await page.pdf({
  path: join(OUT, "rooted-forward-banner-72x24.pdf"),
  printBackground: true,
  preferCSSPageSize: true,
  pageRanges: "1",
});

/* A raster copy for uploaders that will not take a PDF. 150 pixels to
   the inch is well past what a banner viewed from any distance needs. */
const DPI = 150;
await page.setViewport({
  width: W * 96,
  height: H * 96,
  deviceScaleFactor: DPI / 96,
});
await page.evaluateHandle("document.fonts.ready");
const el = await page.$(".banner");
const PNG = join(OUT, "rooted-forward-banner-72x24-150dpi.png");
await el.screenshot({ path: PNG, type: "png" });

/* ---------- prove the code scans ---------- */
/* A QR that does not decode is the one mistake on this banner that
   costs money to find out about, so it gets read back off the actual
   rendered pixels rather than trusted because the encoder ran. */
const box = await page.evaluate(() => {
  const q = document.querySelector(".qr").getBoundingClientRect();
  const b = document.querySelector(".banner").getBoundingClientRect();
  return { x: q.x - b.x, y: q.y - b.y, w: q.width, h: q.height };
});
await browser.close();

const scale = DPI / 96;
/* A generous crop so the decoder sees the quiet zone too. */
const pad = 40;
const crop = {
  left: Math.round(box.x * scale) - pad,
  top: Math.round(box.y * scale) - pad,
  width: Math.round(box.w * scale) + pad * 2,
  height: Math.round(box.h * scale) + pad * 2,
};
const { data, info } = await sharp(PNG)
  .extract(crop)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const decoded = jsQR(new Uint8ClampedArray(data), info.width, info.height);

if (!decoded) {
  throw new Error("The rendered QR code did not decode. Do not print this.");
}
if (decoded.data !== QR_URL) {
  throw new Error(`QR decoded to ${decoded.data}, expected ${QR_URL}`);
}
console.log("QR read back    ", decoded.data, "(scans)");

console.log("QR encodes      ", QR_URL);
console.log("QR modules      ", qrModules, "x", qrModules);
console.log("QR printed size ", "13.7in ->", (13.7 / qrModules).toFixed(3), "in per module");
console.log("wrote           ", "print/rooted-forward-banner-72x24.pdf");
console.log("                ", "print/rooted-forward-banner-72x24-bleed.pdf");
console.log("                ", "print/rooted-forward-banner-72x24-150dpi.png");
