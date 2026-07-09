/* Crawl internal links starting from a seed list and report non-200s. */
import puppeteer from "puppeteer";

const BASE = "http://localhost:3000";
const SEEDS = ["/", "/about", "/education", "/curriculum", "/tours", "/tours/chicago", "/podcasts", "/policy", "/research", "/research/data", "/get-involved", "/contact", "/auth/login", "/auth/signup"];

const browser = await puppeteer.launch({ headless: "new" });
const page = await browser.newPage();
const seen = new Set();
const queue = [...SEEDS];
const results = [];

while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  try {
    const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    const status = res?.status() ?? 0;
    results.push({ path, status });
    if (status === 200 && seen.size < 120) {
      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
      for (let h of hrefs) {
        if (!h || !h.startsWith("/") || h.startsWith("//")) continue;
        h = h.split("#")[0];
        if (!h) continue;
        if (h.match(/^\/(admin|account|api|auth\/callback)/)) continue;
        if (!seen.has(h) && !queue.includes(h)) queue.push(h);
      }
    }
  } catch (e) {
    results.push({ path, status: "ERR " + String(e).slice(0, 80) });
  }
}
await browser.close();

const bad = results.filter((r) => r.status !== 200);
console.log(`checked ${results.length} paths, ${bad.length} problems`);
for (const b of bad) console.log(`${b.status}  ${b.path}`);
