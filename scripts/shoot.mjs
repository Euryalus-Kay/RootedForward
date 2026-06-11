/* Screenshot harness for the Rooted Forward redesign review.
   Scrolls each page end-to-end first so viewport-triggered reveals
   fire, then captures a full-page shot. Desktop and mobile. */
import puppeteer from "puppeteer";
import fs from "fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/rf-shots";
const pages = process.argv[2]
  ? process.argv[2].split(",")
  : ["/"];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: "new" });

for (const path of pages) {
  for (const [name, vp] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 300));
    });
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((r) => setTimeout(r, 1800));
      // Walk the page so in-view reveals fire (once:true keeps them visible)
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.7;
        const max = document.body.scrollHeight;
        for (let y = 0; y <= max; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 130));
        }
        window.scrollTo(0, 0);
      });
      await new Promise((r) => setTimeout(r, 1200));
      const slug = path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "_");
      await page.screenshot({ path: `${OUT}/${slug}--${name}.png`, fullPage: true });
      console.log(`OK ${path} [${name}]${errors.length ? "  CONSOLE-ERRORS: " + errors.join(" | ") : ""}`);
    } catch (e) {
      console.log(`FAIL ${path} [${name}]: ${String(e).slice(0, 200)}`);
    }
    await page.close();
  }
}

await browser.close();
