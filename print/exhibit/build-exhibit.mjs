/* ------------------------------------------------------------------ */
/*  Render the exhibition sheets.                                      */
/*                                                                     */
/*    node print/exhibit/build-exhibit.mjs                 all sheets  */
/*    node print/exhibit/build-exhibit.mjs board-1         one sheet   */
/*    node print/exhibit/build-exhibit.mjs --final         + PDFs,     */
/*                                           bleed variants, outlined  */
/*                                           type, QR read-back        */
/*                                                                     */
/*  Fast mode renders a screen-resolution PNG per sheet for design     */
/*  review. Final mode writes vector PDFs at true size (trim and       */
/*  bleed), outlines the type the way build-banner.mjs does, and       */
/*  verifies the QR on sheet 4 by decoding the rendered pixels.        */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import puppeteer from "../../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js";
import sharp from "sharp";
import jsQR from "jsqr";

const HERE = dirname(fileURLToPath(import.meta.url));
const PANELS = join(HERE, "panels");
const OUT = join(HERE, "out");
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const FINAL = args.includes("--final");
const only = args.filter((a) => !a.startsWith("--"));

/* sheet geometry by prefix */
const GEOM = {
  board: { w: 48, h: 36, bleed: 0.25 },
  banner: { w: 33, h: 81, bleed: 0.25, extendBottom: 7 }, // 33x88 variant
};

const files = readdirSync(PANELS)
  .filter((f) => f.endsWith(".html"))
  .filter((f) => (only.length ? only.some((o) => f.startsWith(o)) : true))
  .sort();
if (!files.length) { console.error("no panels matched"); process.exit(1); }

const browser = await puppeteer.launch({
  headless: true,
  args: ["--font-render-hinting=none", "--allow-file-access-from-files"],
});

/* Chrome writes its text as Type3 fonts, which print-shop preflight
   reads as un-embedded. pdftocairo turns every glyph into a plain
   path in an SVG; on sheets this large the base64 image attributes
   run past what rsvg-convert's XML parser accepts, so Chromium
   itself prints the outlined SVG back to PDF. The result carries no
   fonts at all and stays fully vector. */
async function outline(pdfPath, browser) {
  const svgPath = pdfPath.replace(/\.pdf$/, ".outline.svg");
  execFileSync("pdftocairo", ["-svg", pdfPath, svgPath], { maxBuffer: 1024 * 1024 * 512 });
  const head = readFileSync(svgPath, { encoding: "utf8", flag: "r" }).slice(0, 600);
  const wm = head.match(/width="([\d.]+)pt"/);
  const hm = head.match(/height="([\d.]+)pt"/);
  if (!wm || !hm) throw new Error(`no pt size on ${svgPath}`);
  const p = await browser.newPage();
  await p.goto("file://" + svgPath, { waitUntil: "networkidle0" });
  await p.pdf({
    path: pdfPath,
    printBackground: true,
    width: `${(parseFloat(wm[1]) / 72).toFixed(4)}in`,
    height: `${(parseFloat(hm[1]) / 72).toFixed(4)}in`,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    pageRanges: "1",
  });
  await p.close();
  unlinkSync(svgPath);
  const bytes = readFileSync(pdfPath);
  for (const marker of ["/BaseFont", "/FontFile", "/Type3"]) {
    if (bytes.includes(marker)) throw new Error(`${pdfPath} still contains ${marker} after outlining`);
  }
}

for (const f of files) {
  const name = basename(f, ".html");
  const kind = name.startsWith("banner") ? "banner" : "board";
  const g = GEOM[kind];
  const page = await browser.newPage();
  await page.goto("file://" + join(PANELS, f), { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");

  /* overflow guard: anything escaping the sheet is a layout bug */
  const overflow = await page.evaluate(() => {
    const s = document.querySelector(".sheet");
    const sr = s.getBoundingClientRect();
    const bad = [];
    const clipped = (el) => {
      for (let a = el.parentElement; a && a !== s; a = a.parentElement) {
        if (getComputedStyle(a).overflow === "hidden") return true;
      }
      return false;
    };
    for (const el of s.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (clipped(el)) continue;
      if (r.right > sr.right + 2 || r.bottom > sr.bottom + 2 || r.left < sr.left - 2 || r.top < sr.top - 2) {
        bad.push(`${el.className || el.tagName} right=${((r.right - sr.right) / 96).toFixed(2)}in bottom=${((r.bottom - sr.bottom) / 96).toFixed(2)}in`);
      }
    }
    return bad.slice(0, 12);
  });
  if (overflow.length) console.warn(`  OVERFLOW on ${name}:`, overflow);

  /* screen-res preview PNG */
  const previewScale = kind === "board" ? 1500 / (g.w * 96) : 900 / (g.w * 96);
  await page.setViewport({
    width: Math.ceil(g.w * 96),
    height: Math.ceil(g.h * 96),
    deviceScaleFactor: previewScale,
  });
  await page.evaluateHandle("document.fonts.ready");
  const el = await page.$(".sheet");
  await el.screenshot({ path: join(OUT, `${name}-preview.png`) });
  console.log(name, "preview written", overflow.length ? "(WITH OVERFLOW)" : "");

  if (FINAL) {
    /* effective resolution of every placed image at print size */
    const dpiAudit = await page.evaluate(() => {
      const out = [];
      for (const img of document.querySelectorAll("img")) {
        const r = img.getBoundingClientRect();
        if (!img.naturalWidth || r.width < 5) continue;
        const src = (img.getAttribute("src") || "").split("/").pop();
        if (src.endsWith(".svg")) continue; // vector
        let scale = 1;
        const t = getComputedStyle(img).transform;
        const m = t && t.match(/matrix\(([-\d.]+)/);
        if (m) scale = Math.abs(parseFloat(m[1]));
        const dpi = Math.round(img.naturalWidth / ((r.width * scale) / 96));
        out.push({ src, placedIn: +(r.width / 96).toFixed(1), dpi });
      }
      return out;
    });
    for (const a of dpiAudit) {
      const flag = a.dpi < 150 ? "  <-- UPGRADE SOURCE" : a.dpi < 200 ? "  (acceptable, not ideal)" : "";
      console.log(`  ${name} ${a.src.padEnd(30)} ${String(a.placedIn).padStart(5)}in wide  ${String(a.dpi).padStart(4)}dpi${flag}`);
    }

    /* trim-size vector PDF */
    await page.addStyleTag({ content: `@page { size: ${g.w}in ${g.h}in; margin: 0; } html,body{margin:0}` });
    await page.pdf({
      path: join(OUT, `${name}.pdf`),
      printBackground: true,
      preferCSSPageSize: true,
      pageRanges: "1",
    });

    /* bleed variant: sheet centered on a larger page, background
       linen carries into the bleed */
    const bw = g.w + g.bleed * 2;
    const bh = g.h + g.bleed * 2 + (g.extendBottom ?? 0);
    await page.addStyleTag({
      content: `@page { size: ${bw}in ${bh}in; margin: 0; }
        body { padding: ${g.bleed}in ${g.bleed}in ${g.bleed + (g.extendBottom ?? 0)}in; background: #EDE6D6; }`,
    });
    await page.pdf({
      path: join(OUT, `${name}-bleed.pdf`),
      printBackground: true,
      preferCSSPageSize: true,
      pageRanges: "1",
    });

    await outline(join(OUT, `${name}.pdf`), browser);
    await outline(join(OUT, `${name}-bleed.pdf`), browser);
    console.log(name, "PDFs written and outlined");
  }

  await page.close();
}

/* ---------- QR verification on sheet 4 (final mode) ---------- */
if (FINAL && files.some((f) => f.includes("4"))) {
  for (const f of files.filter((x) => x.includes("4"))) {
    const name = basename(f, ".html");
    const pdf = join(OUT, `${name}.pdf`);
    if (!existsSync(pdf)) continue;
    const probe = join(OUT, ".qr-probe");
    execFileSync("pdftoppm", ["-png", "-r", "72", pdf, probe]);
    const probePng = `${probe}-1.png`;
    const shot = await sharp(probePng).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const decoded = jsQR(new Uint8ClampedArray(shot.data), shot.info.width, shot.info.height);
    unlinkSync(probePng);
    if (!decoded) throw new Error(`${name}: QR did not decode off the outlined PDF. Do not print.`);
    if (decoded.data !== "https://rooted-forward.org/go/exhibit")
      throw new Error(`${name}: QR decoded to ${decoded.data}`);
    console.log(name, "QR reads back", decoded.data);
  }
}

await browser.close();
console.log("done");
