#!/usr/bin/env node
// ------------------------------------------------------------------
// Exhibit screenshot harness: state-driven captures at desktop
// (1440x900) and mobile (390x844 @2x), console errors flagged.
//   node scripts/exhibit-shots.mjs               all states
//   node scripts/exhibit-shots.mjs --states gate,ch0-pause
//   node scripts/exhibit-shots.mjs --base https://rooted-forward.org
// Output: /tmp/exhibit-shots/<state>--desktop.png / --mobile.png
// ------------------------------------------------------------------
import { mkdirSync } from "node:fs";
import { BASE, launch, trackConsoleErrors, waitReady } from "./exhibit-lib.mjs";

const OUT = "/tmp/exhibit-shots";
mkdirSync(OUT, { recursive: true });

const EX = "/tours/chicago/hyde-park-exhibit";
const DEBUG = `${EX}?debug=1`;

/** Each state: route + optional setup(page) to drive the UI there. */
const STATES = [
  { id: "gate", route: DEBUG },
  {
    id: "ch0-cold-open",
    route: DEBUG,
    async setup(page) {
      await page.click('[data-testid="mode-guided"]');
      await new Promise((r) => setTimeout(r, 700));
    },
  },
  {
    id: "ch0-pause-declined",
    route: DEBUG,
    async setup(page) {
      await page.click('[data-testid="mode-guided"]');
      await page
        .waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 15000 })
        .catch(() => {});
      // stamp a couple of declines so the shot shows the interaction
      await page.evaluate(() => {
        const areas = document.querySelectorAll('[data-testid="interactive-declined-map"] [role="button"]');
        for (const a of Array.from(areas).slice(0, 2)) a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 500));
    },
  },
  { id: "ch1-first-taking", route: `${DEBUG}&ch=ch1` },
  { id: "ch2-fair-boom", route: `${DEBUG}&ch=ch2` },
  { id: "ch3-machinery", route: `${DEBUG}&ch=ch3` },
  {
    id: "ch4-witness",
    route: `${DEBUG}&ch=ch4`,
    async setup(page) {
      await page.evaluate(() => {
        [...document.querySelectorAll('[data-testid="advisory-gate"] button')]
          .find((b) => b.textContent.trim() === "Continue")?.click();
      });
      await page
        .waitForFunction(
          () => document.querySelector('[data-testid="bombing-marks"]')?.getAttribute("data-count") === "32",
          { timeout: 20000 }
        )
        .catch(() => {});
    },
  },
  { id: "ch5-hud-lamps", route: `${DEBUG}&ch=ch5` },
  { id: "ch6-lens", route: `${DEBUG}&ch=ch6` },
  { id: "ch7-walls-crack", route: `${DEBUG}&ch=ch7` },
  { id: "ch8-mid-tour-hud", route: `${DEBUG}&ch=ch8` },
  { id: "ch9-two-buyers", route: `${DEBUG}&ch=ch9` },
  { id: "ch10-hold-line", route: `${DEBUG}&ch=ch10` },
  { id: "ch11-closing", route: `${DEBUG}&ch=ch11` },
  {
    id: "explore-mode",
    route: DEBUG,
    async setup(page) {
      await page.click('[data-testid="mode-explore"]');
      await new Promise((r) => setTimeout(r, 700));
    },
  },
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
      await page.screenshot({ path: file, fullPage: vp.name === "desktop" });
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
