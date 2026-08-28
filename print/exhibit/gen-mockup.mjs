/* ------------------------------------------------------------------ */
/*  Installation elevation. Both systems drawn to scale on a wall     */
/*  with a 5'7" figure, from the rendered previews.                   */
/*    node print/exhibit/gen-mockup.mjs                               */
/* ------------------------------------------------------------------ */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "out");

/* scale: 8 px per inch */
const S = 8;
const px = (inches) => `${inches * S}px`;

/* a plain standing figure, 67in tall, drawn as a flat silhouette */
const FIGURE = (h) => `<svg viewBox="0 0 26 96" style="height:${px(h)};display:block;" xmlns="http://www.w3.org/2000/svg">
  <circle cx="13" cy="7.5" r="6.2" fill="#3a362f"/>
  <path d="M13 14 C6.5 14 4.5 20 4.5 27 L4.5 51 L8 51 L8 32 L9.4 32 L9.4 92 L12.2 92 L12.6 60 L13.4 60 L13.8 92 L16.6 92 L16.6 32 L18 32 L18 51 L21.5 51 L21.5 27 C21.5 20 19.5 14 13 14 Z" fill="#3a362f"/>
</svg>`;

function boardOnStand(img) {
  return `<div style="position:relative; width:${px(48)};">
    <div style="position:absolute; left:${px(5)}; bottom:0; width:${px(2.2)}; height:${px(31)}; background:#191919;"></div>
    <div style="position:absolute; right:${px(5)}; bottom:0; width:${px(2.2)}; height:${px(31)}; background:#191919;"></div>
    <div style="position:absolute; left:${px(2)}; bottom:0; width:${px(8)}; height:${px(1.4)}; background:#191919;"></div>
    <div style="position:absolute; right:${px(2)}; bottom:0; width:${px(8)}; height:${px(1.4)}; background:#191919;"></div>
    <div style="position:relative; margin-bottom:${px(30)}; border:${px(0.45)} solid #191919; box-shadow: 0 ${px(0.8)} ${px(2)} rgba(0,0,0,0.28);">
      <img src="${img}" style="display:block; width:100%;">
    </div>
  </div>`;
}
function bannerOnCassette(img) {
  return `<div style="position:relative; width:${px(33)};">
    <div style="box-shadow: 0 ${px(0.6)} ${px(1.8)} rgba(0,0,0,0.22);">
      <img src="${img}" style="display:block; width:100%;">
    </div>
    <div style="width:${px(35)}; margin-left:${px(-1)}; height:${px(3.4)}; background:#161616; border-radius:${px(1.6)} ${px(1.6)} ${px(0.6)} ${px(0.6)};"></div>
  </div>`;
}

const html = `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; background:#8A8578; font-family: Arial, sans-serif; }
  .room { position:relative; padding:${px(6)} ${px(8)} 0; }
  .wall { position:absolute; inset:0; bottom:${px(6)}; background:linear-gradient(#CFC9BC,#C7C1B3); }
  .floor { position:absolute; left:0; right:0; bottom:0; height:${px(6)}; background:#A9A294; border-top:2px solid #8f8a7d; }
  .lineup { position:relative; display:flex; align-items:flex-end; gap:${px(14)}; }
  .tag { position:absolute; top:${px(2)}; left:${px(8)}; color:#3a362f; font-size:${px(2.6)}; letter-spacing:0.24em; }
</style>
<div class="room" style="height:${px(96)};">
  <div class="wall"></div><div class="floor"></div>
  <div class="tag">VERSION A · FOUR 36 × 48 BOARDS ON FLOOR STANDS</div>
  <div class="lineup" style="padding-top:${px(12)};">
    ${boardOnStand("board-1-preview.png")}
    ${boardOnStand("board-2-preview.png")}
    ${boardOnStand("board-3-preview.png")}
    ${boardOnStand("board-4-preview.png")}
    <div style="margin-left:${px(4)};">${FIGURE(67)}</div>
  </div>
</div>
<div class="room" style="height:${px(100)};">
  <div class="wall"></div><div class="floor"></div>
  <div class="tag">VERSION B · FOUR 33 × 81 RETRACTABLE BANNERS</div>
  <div class="lineup" style="padding-top:${px(8)};">
    ${bannerOnCassette("banner-1-preview.png")}
    ${bannerOnCassette("banner-2-preview.png")}
    ${bannerOnCassette("banner-3-preview.png")}
    ${bannerOnCassette("banner-4-preview.png")}
    <div style="margin-left:${px(4)};">${FIGURE(67)}</div>
  </div>
</div>`;

writeFileSync(join(OUT, "installation.html"), html);
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
const W = Math.ceil((8 + 48 * 4 + 14 * 3 + 14 + 8 + 10) * S);
await page.setViewport({ width: W, height: Math.ceil(200 * S), deviceScaleFactor: 1 });
await page.goto("file://" + join(OUT, "installation.html"), { waitUntil: "networkidle0" });
const body = await page.$("body");
await body.screenshot({ path: join(OUT, "installation.png") });
await browser.close();
console.log("installation.png written");
