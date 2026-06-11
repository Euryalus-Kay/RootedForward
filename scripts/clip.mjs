/* Viewport-sized clips at chosen scroll fractions for close review. */
import puppeteer from "puppeteer";
import fs from "fs";
const BASE = "http://localhost:3000";
const OUT = "/tmp/rf-shots";
const path = process.argv[2] || "/";
const fractions = (process.argv[3] || "0,0.25,0.5,0.75,1").split(",").map(Number);
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width, height });
await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
await new Promise((r) => setTimeout(r, 1500));
const slug = path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "_");
for (const f of fractions) {
  await page.evaluate(async (frac) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * frac, behavior: "instant" });
  }, f);
  await new Promise((r) => setTimeout(r, 1400));
  await page.screenshot({ path: `${OUT}/${slug}--clip-${f}.png` });
  console.log(`clip ${f} done`);
}
await browser.close();
