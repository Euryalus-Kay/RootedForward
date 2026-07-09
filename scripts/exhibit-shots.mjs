#!/usr/bin/env node
// ------------------------------------------------------------------
// Exhibit screenshot harness: state-driven captures at desktop
// (1440x900) and mobile (390x844 @2x), console errors flagged.
//   node scripts/exhibit-shots.mjs               all states
//   node scripts/exhibit-shots.mjs --states top,ch0-map
//   node scripts/exhibit-shots.mjs --base https://rooted-forward.org
// Output: /tmp/exhibit-shots/<state>--desktop.png / --mobile.png
// ------------------------------------------------------------------
import { mkdirSync } from "node:fs";
import { BASE, launch, trackConsoleErrors, waitReady } from "./exhibit-lib.mjs";

const OUT = "/tmp/exhibit-shots";
mkdirSync(OUT, { recursive: true });

const EX = "/tours/chicago/hyde-park";
const DEBUG = `${EX}?debug=1`;

/** viewport-height shot at an anchor */
const atAnchor = (anchor) => async (page) => {
  await page.evaluate((a) => document.getElementById(a)?.scrollIntoView(), anchor);
  await new Promise((r) => setTimeout(r, 600));
};

/** Each state: route + optional setup(page); fullPage captures the
 *  whole document, others frame the anchored section. */
const STATES = [
  { id: "top", route: DEBUG },
  {
    id: "ch0-map",
    route: `${DEBUG}&ch=ch0`,
    async setup(page) {
      // open one area sheet and frame the station itself
      await page
        .waitForSelector('#ch0 [data-station="holc-map"] [role="button"]', { timeout: 20000 })
        .catch(() => {});
      await page.evaluate(() => {
        const a = document.querySelector('#ch0 [data-station="holc-map"] [role="button"]');
        a?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        document.querySelector('#ch0 [data-station="holc-map"]')?.scrollIntoView();
      });
      await new Promise((r) => setTimeout(r, 600));
    },
  },
  { id: "ch1-first-taking", route: `${DEBUG}&ch=ch1` },
  { id: "ch2-fair", route: `${DEBUG}&ch=ch2` },
  { id: "overture-machines", route: `${DEBUG}&ch=ch0_5` },
  { id: "ch4-advisory", route: `${DEBUG}&ch=ch4` },
  { id: "ch6-map-again", route: `${DEBUG}&ch=ch6` },
  { id: "ch9-two-buyers", route: `${DEBUG}&ch=ch9` },
  {
    id: "ch11-ledger",
    route: `${DEBUG}&ch=ch11`,
    async setup(page) {
      await page.evaluate(() =>
        document.querySelector('[data-testid="ledger-table"]')?.scrollIntoView()
      );
      await new Promise((r) => setTimeout(r, 600));
    },
  },
  { id: "about", route: DEBUG, setup: atAnchor("about") },
];

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}
const onlyStates = arg("states")?.split(",").map((s) => s.trim());
const base = arg("base") || BASE;
const list = onlyStates ? STATES.filter((s) => onlyStates.includes(s.id)) : STATES;

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2 },
];

const browser = await launch();
let errorsTotal = 0;

for (const state of list) {
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport(vp);
    const errs = trackConsoleErrors(page);
    try {
      await page.goto(base + state.route, { waitUntil: "networkidle2", timeout: 60000 });
      await waitReady(page);
      if (state.setup) await state.setup(page);
      await new Promise((r) => setTimeout(r, 400));
      const file = `${OUT}/${state.id}--${vp.name}.png`;
      await page.screenshot({ path: file });
      const flag = errs.length ? `  [${errs.length} console error(s)!]` : "";
      console.log(`shot ${file}${flag}`);
      if (errs.length) {
        errorsTotal += errs.length;
        for (const e of errs.slice(0, 3)) console.log(`     err: ${e.slice(0, 160)}`);
      }
    } catch (e) {
      console.error(`FAILED ${state.id} ${vp.name}: ${e.message.slice(0, 160)}`);
      errorsTotal++;
    } finally {
      await page.close();
    }
  }
}

await browser.close();
console.log(errorsTotal ? `\ndone with ${errorsTotal} flagged error(s)` : "\ndone, no console errors");
