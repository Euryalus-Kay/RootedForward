/* ------------------------------------------------------------------ */
/*  Stage the exhibition's images into print/exhibit/assets/img.       */
/*                                                                     */
/*  Each target lists sources in order of preference. The first one    */
/*  that exists wins. High-resolution originals fetched from the       */
/*  archives land in the session scratchpad; the repo's web-res        */
/*  copies are the fallback so the layout always renders.              */
/*                                                                     */
/*  Everything is normalized to JPEG quality 92, capped at 5400px on   */
/*  the long edge (18in at 300dpi), which is larger than any placed    */
/*  size on the sheets.                                                */
/*                                                                     */
/*    node print/exhibit/prep-images.mjs                               */
/* ------------------------------------------------------------------ */

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");
const SCRATCH = "/private/tmp/claude-501/-Users-zainzaidi-Desktop-Rooted-Forward/9ea056d3-49ee-4671-9bda-e503ff52c638/scratchpad/exhibit/archive";
const MEDIA = join(SITE, "public/media");
const OUT = join(HERE, "assets/img");
mkdirSync(OUT, { recursive: true });

const TARGETS = {
  "p1-fair-burning.jpg": [join(SCRATCH, "white-city-fire-aftermath-1894.jpg"), join(MEDIA, "hyde-park-walk/white-city-burning-1894.jpg")],
  "strip-ferris.jpg": [join(SCRATCH, "ferris-wheel-1893.jpg")],
  "strip-midway.jpg": [join(SCRATCH, "midway-1893.jpg")],
  "strip-fire.jpg": [join(SCRATCH, "white-city-fire-aftermath-1894.jpg")],
  "strip-delprado.jpg": [join(SCRATCH, "del-prado-postcard.jpg")],
  "strip-drexel.jpg": [join(SCRATCH, "drexel-1907.jpg")],
  "strip-sisson.jpg": [join(SCRATCH, "sisson-hotel-1920.jpg")],
  "strip-carlton.jpg": [join(SCRATCH, "cooper-carlton-postcard.jpg")],
  "strip-quads.jpg": [join(SCRATCH, "lawrence-quads-1907.jpg")],
  "strip-doorway.jpg": [join(SCRATCH, "kitchenette-doorway-1941.jpg")],
  "strip-63rd.jpg": [join(SCRATCH, "sixty-third-1973.jpg")],
  "strip-63bus.jpg": [join(SCRATCH, "sixty-third-bus-1973.jpg")],
  "strip-univapts.jpg": [join(SCRATCH, "university-apartments-today.jpg")],
  "strip-55th.jpg": [join(SCRATCH, "fifty-fifth-today.jpg")],
  "strip-republic.jpg": [join(SCRATCH, "statue-republic.jpg")],
  "strip-midway-today.jpg": [join(MEDIA, "hyde-park-walk/midway-today.jpg")],
  "strip-metra.jpg": [join(MEDIA, "hyde-park-walk/metra-53rd-today.jpg")],
  "p1-hero-court-night.jpg": [
    join(SCRATCH, "court-night-1893.jpg"),
    join(MEDIA, "hyde-park-walk/court-night-1893.jpg"),
  ],
  "p1-olmsted-plan.jpg": [
    join(SCRATCH, "olmsted-plan-1871.jpg"),
    join(MEDIA, "hyde-park-walk/olmsted-plan-1871.jpg"),
  ],
  "p1-hp-aerial-1928.jpg": [
    join(SCRATCH, "hp-aerial-1928.jpg"),
    join(MEDIA, "hyde-park/img/urban-renewal-1.jpg"),
    join(MEDIA, "hyde-park-walk/hyde-park-aerial-1927.jpg"),
  ],
  "p1-reason-why.jpg": [
    join(SCRATCH, "reason-why-1893.jpg"),
    join(SCRATCH, "reason-why-1893.png"),
  ],
  "p2-bombing-map.jpg": [
    join(SCRATCH, "ccrr-bombing-map-1922.jpg"),
  ],
  "p3-kitchenette.jpg": [
    join(SCRATCH, "kitchenette-1941.jpg"),
    join(MEDIA, "hyde-park-walk/kitchenette-1941.jpg"),
  ],
  "p3-hansberry-house.jpg": [
    join(SCRATCH, "hansberry-house.jpg"),
    join(MEDIA, "hyde-park-walk/hansberry-house-today.jpg"),
  ],
  "p3-university-apartments.jpg": [
    join(SCRATCH, "university-apartments-today.jpg"),
    join(MEDIA, "hyde-park-walk/university-apartments-today.jpg"),
  ],
  "p4-opc.jpg": [
    join(SCRATCH, "opc-opening-2026.jpg"),
    join(MEDIA, "hyde-park-walk/opc-opening-2026.jpg"),
  ],
  "p4-harper-court.jpg": [
    join(SCRATCH, "harper-court-2025.jpg"),
    join(MEDIA, "hyde-park-walk/harper-court-today.jpg"),
  ],
  "p4-sixty-third-1973.jpg": [
    join(SCRATCH, "sixty-third-1973.jpg"),
    join(MEDIA, "hyde-park-walk/sixty-third-1973.jpg"),
  ],
};

const report = [];
for (const [target, sources] of Object.entries(TARGETS)) {
  const src = sources.find((s) => existsSync(s));
  if (!src) {
    /* a labeled placeholder frame, never a broken image on a proof */
    const ph = `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="1100"><rect width="820" height="1100" fill="#E2D8C2"/><rect x="14" y="14" width="792" height="1072" fill="none" stroke="#4A453D" stroke-width="3"/><text x="410" y="530" text-anchor="middle" font-family="Arial Narrow, sans-serif" font-size="46" fill="#4A453D" letter-spacing="6">SCAN TO COME</text><text x="410" y="590" text-anchor="middle" font-family="Arial Narrow, sans-serif" font-size="30" fill="#4A453D" letter-spacing="3">${target.replace(".jpg", "").toUpperCase()}</text></svg>`;
    await sharp(Buffer.from(ph)).jpeg({ quality: 88 }).toFile(join(OUT, target));
    report.push({ target, source: "placeholder" });
    console.warn("PLACEHOLDER written for", target);
    continue;
  }
  const img = sharp(src, { limitInputPixels: 900_000_000 });
  const meta = await img.metadata();
  const long = Math.max(meta.width, meta.height);
  let pipe = img.rotate(); // respect EXIF
  if (long > 5400) pipe = pipe.resize({ width: meta.width >= meta.height ? 5400 : null, height: meta.height > meta.width ? 5400 : null });
  await pipe.jpeg({ quality: 92, mozjpeg: true }).toFile(join(OUT, target));
  const out = await sharp(join(OUT, target)).metadata();
  report.push({ target, source: src.includes("scratchpad") ? "archive" : "repo", px: [out.width, out.height] });
  console.log(target.padEnd(32), (src.includes("scratchpad") ? "archive" : "repo   "), out.width + "x" + out.height);
}

/* the mark, straight from the site */
copyFileSync(join(SITE, "public/logo.svg"), join(OUT, "rf-logo.svg"));

writeFileSync(join(HERE, "assets/img-report.json"), JSON.stringify(report, null, 1));
console.log("logo copied; report written");
