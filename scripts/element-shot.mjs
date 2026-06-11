/* Screenshot a specific element (first match of a selector) on a page. */
import puppeteer from "puppeteer";
const [path, selector, out, nth] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1100 });
await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle2", timeout: 45000 });
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
});
const els = await page.$$(selector);
const el = els[Number(nth || 0)];
if (!el) { console.log("NOT FOUND"); process.exit(1); }
await el.scrollIntoView();
await new Promise((r) => setTimeout(r, 800));
await el.screenshot({ path: out });
console.log("saved " + out);
await browser.close();
