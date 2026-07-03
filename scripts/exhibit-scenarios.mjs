// ------------------------------------------------------------------
// Exhibit verify scenarios. The registry accumulates for the life of
// the build; the whole file is the regression suite. Each scenario:
// { id, milestone, tags[], route, run(page, t, helpers) } where t is
// the assertion collector from exhibit-lib and route is appended to
// RF_BASE. All scenarios run under ?debug=1 (deterministic mode,
// silent audio stubs at 16x) unless the route says otherwise.
// ------------------------------------------------------------------
import { exhibitGoto, exhibitState, fire, waitReady } from "./exhibit-lib.mjs";

const EX = "/tours/chicago/hyde-park-exhibit";
const DEBUG = `${EX}?debug=1`;

export const scenarios = [
  {
    id: "boot",
    milestone: "A1",
    tags: ["smoke", "core"],
    route: DEBUG,
    async run(page, t, { consoleErrors }) {
      await waitReady(page);
      t.assert("exhibit root renders", await page.$('[data-testid="exhibit-root"]'));
      t.assert("mode gate shows first", await page.$('[data-testid="mode-guided"]'));
      t.assert("debug api mounted", await page.evaluate(() => !!window.__exhibit));
      t.assert("zero console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
    },
  },
  {
    id: "mode-gate-guided",
    milestone: "A1",
    tags: ["smoke", "core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-guided"]');
      await new Promise((r) => setTimeout(r, 400));
      const s = await exhibitState(page);
      t.assert("mode set", s?.mode === "guided");
      t.assert("playing", s?.playState === "playing");
      t.assert("stage visible", await page.$('[data-testid="chapter-stage"]'));
      t.assert("hud spine visible", await page.$('[data-testid="timeline-spine"]'));
    },
  },
  {
    id: "ch0-pause-point",
    milestone: "A1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-guided"]');
      // ch0 has one short block; under audio stub it ends within ~1s and
      // must land on the declined-map pause point
      await page.waitForFunction(
        () => window.__exhibit?.state().playState === "pause_point",
        { timeout: 15000 }
      );
      const s = await exhibitState(page);
      t.assert("pause point is declined-map", s?.pausePoint?.interactiveId === "declined-map");
      t.assert("interactive slot present", await page.$('[data-testid="interactive-declined-map"]'));
      t.assert("continue visible", await page.$('[data-testid="continue-button"]'));
    },
  },
  {
    id: "declined-map-interaction",
    milestone: "A1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-guided"]');
      await page.waitForFunction(
        () => window.__exhibit?.state().playState === "pause_point",
        { timeout: 15000 }
      );
      // tap three HOLC areas (they are role=button paths)
      const tapped = await page.evaluate(() => {
        const areas = document.querySelectorAll('[data-testid="interactive-declined-map"] [role="button"]');
        let n = 0;
        for (const a of Array.from(areas).slice(0, 3)) {
          a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          n++;
        }
        return n;
      });
      t.assert("three areas tappable", tapped === 3, `tapped=${tapped}`);
      await new Promise((r) => setTimeout(r, 600));
      const s = await exhibitState(page);
      t.assert(
        "declined-map completes after taps",
        s?.completedInteractives.includes("declined-map"),
        JSON.stringify(s?.completedInteractives)
      );
      const stamps = await page.$$eval('[data-testid="interactive-declined-map"] [data-testid="stamp"]', (els) => els.length);
      t.assert("DECLINED stamps rendered", stamps >= 1, `stamps=${stamps}`);
    },
  },
  {
    id: "continue-resumes",
    milestone: "A1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-guided"]');
      await page.waitForFunction(
        () => window.__exhibit?.state().playState === "pause_point",
        { timeout: 15000 }
      );
      await page.click('[data-testid="continue-button"]');
      await new Promise((r) => setTimeout(r, 500));
      const s = await exhibitState(page);
      t.assert("resumed playing", s?.playState === "playing" || s?.playState === "pause_point");
      t.assert(
        "advanced past ch0",
        s?.chapterIndex >= 1 || s?.blockIndex > 0,
        `ch=${s?.chapterIndex} b=${s?.blockIndex}`
      );
    },
  },
  {
    id: "deep-link-chapter",
    milestone: "A1",
    tags: ["smoke", "core"],
    route: `${DEBUG}&ch=ch1`,
    async run(page, t) {
      await waitReady(page);
      // deep link should skip the gate into the requested chapter (guided default)
      const s = await exhibitState(page);
      t.assert("landed on ch1", s?.chapterIndex === 2, `index=${s?.chapterIndex}`);
      t.assert("mode defaulted", s?.mode !== null);
    },
  },
  {
    id: "jump-fast-forward-effects",
    milestone: "A1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-guided"]');
      await new Promise((r) => setTimeout(r, 300));
      await exhibitGoto(page, "ch5");
      const s = await exhibitState(page);
      t.assert("on ch5", s?.chapterIndex === 6, `index=${s?.chapterIndex}`);
      t.assert(
        "skipped ledger entries posted",
        ["land-taken", "fair-stock", "club-organizes"].every((id) => s?.ledgerPosted.includes(id)),
        JSON.stringify(s?.ledgerPosted)
      );
      t.assert("code machine armed by ch3 effects", s?.machines.code === "armed", s?.machines.code);
    },
  },
  {
    id: "reduced-motion",
    milestone: "A1",
    tags: ["a11y"],
    route: DEBUG,
    async run(page, t) {
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.reload({ waitUntil: "networkidle2" });
      await waitReady(page);
      await page.click('[data-testid="mode-guided"]');
      await new Promise((r) => setTimeout(r, 400));
      const motion = await page.$eval('[data-testid="exhibit-root"]', (el) => el.getAttribute("data-motion"));
      t.assert("data-motion off under reduced motion", motion === "off", `motion=${motion}`);
      const s = await exhibitState(page);
      t.assert("state mirrors reduced motion", s?.reducedMotion === true);
    },
  },
  {
    id: "explore-mode",
    milestone: "A1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-explore"]');
      await new Promise((r) => setTimeout(r, 400));
      const s = await exhibitState(page);
      t.assert("explore mode set", s?.mode === "explore");
      const stage = await page.$('[data-testid="chapter-stage"]');
      t.assert("stage renders in explore", !!stage);
      // interactives are live without pause points in explore
      const slot = await page.$('[data-testid="interactive-declined-map"]');
      t.assert("interactive present in explore", !!slot);
    },
  },
];
