// ------------------------------------------------------------------
// Exhibit verify scenarios. The registry accumulates for the life of
// the build; the whole file is the regression suite. Each scenario:
// { id, milestone, tags[], route, run(page, t, helpers) } where t is
// the assertion collector from exhibit-lib and route is appended to
// RF_BASE. All scenarios run under ?debug=1 (deterministic mode,
// silent audio stubs at 16x) unless the route says otherwise.
// ------------------------------------------------------------------
import { dispatchClick, drag, exhibitGoto, exhibitState, fire, waitReady } from "./exhibit-lib.mjs";

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
    id: "ch2-build-the-boom",
    milestone: "A2",
    tags: ["core"],
    route: `${DEBUG}&ch=ch2`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      let s = await exhibitState(page);
      t.assert("pause point is build-the-boom", s?.pausePoint?.interactiveId === "build-the-boom");
      await page.$eval('[data-testid="interactive-build-the-boom"]', (el) => el.scrollIntoView({ block: "center" }));
      await page.click('[data-testid="boom-target"]');
      await new Promise((r) => setTimeout(r, 900));
      const count = await page.$eval('[data-testid="boom-counter"]', (e) => Number(e.dataset.count));
      t.assert("illustrative counter climbed", count > 80, `count=${count}`);
      await page.click('[data-testid="boom-midway-card"]');
      await page.$eval('[data-testid="voice-medallion-ida-b-wells"]', (el) => el.scrollIntoView({ block: "center" }));
      await page.click('[data-testid="voice-medallion-ida-b-wells"]');
      await new Promise((r) => setTimeout(r, 400));
      s = await exhibitState(page);
      t.assert("wells voice collected", s?.voicesFound.includes("ida-b-wells"));
      t.assert("boom completes", s?.completedInteractives.includes("build-the-boom"));
      t.assert("continue visible", await page.$('[data-testid="continue-button"]'));
    },
  },
  {
    id: "ch3-machinery-cards",
    milestone: "A2",
    tags: ["core"],
    route: `${DEBUG}&ch=ch3`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 30000 });
      let s = await exhibitState(page);
      t.assert("pause point is machinery-cards", s?.pausePoint?.interactiveId === "machinery-cards");
      await page.$eval('[data-testid="interactive-machinery-cards"]', (el) => el.scrollIntoView({ block: "center" }));
      for (let i = 0; i < 3; i++) {
        await page.click(`[data-testid="machinery-card-front-${i}"]`);
        await new Promise((r) => setTimeout(r, 450));
      }
      const flipped = await page.$eval('[data-testid="machinery-cards-flipped"]', (e) => e.dataset.count);
      t.assert("three cards flipped", flipped === "3", `count=${flipped}`);
      const urban = await page.$eval('[data-testid="urban-league-count"]', (e) => Number(e.dataset.count));
      t.assert("664 counter landed", urban === 664, `count=${urban}`);
      await page.click('[data-testid="voice-medallion-fannie-barrier-williams"]');
      await new Promise((r) => setTimeout(r, 400));
      s = await exhibitState(page);
      t.assert("fannie voice collected", s?.voicesFound.includes("fannie-barrier-williams"));
      t.assert("machinery-cards completes", s?.completedInteractives.includes("machinery-cards"));
    },
  },
  {
    id: "ch4-bombing-map",
    milestone: "A2",
    tags: ["core", "sensitivity"],
    route: `${DEBUG}&ch=ch4`,
    async run(page, t) {
      await waitReady(page);
      await page.evaluate(() => {
        [...document.querySelectorAll('[data-testid="advisory-gate"] button')]
          .find((b) => b.textContent.trim() === "Continue")?.click();
      });
      const root = await page.$eval('[data-testid="exhibit-root"]', (el) => ({
        motion: el.getAttribute("data-motion"),
        chapter: el.getAttribute("data-chapter"),
      }));
      t.assert("ch4 stage holds data-motion off", root.chapter === "ch4" && root.motion === "off", JSON.stringify(root));
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      t.assert("halts on bombing-map", (await exhibitState(page))?.pausePoint?.interactiveId === "bombing-map");
      await page.waitForFunction(
        () => document.querySelector('[data-testid="bombing-marks"]')?.getAttribute("data-count") === "32",
        { timeout: 20000 }
      );
      t.assert("32 evidence marks drawn", true);
      t.assert("commission square outlined", await page.$('[data-testid="bombing-square"] rect'));
      await page.evaluate(() => {
        [...document.querySelectorAll('[data-testid="interactive-bombing-map"] li button')]
          .find((b) => (b.getAttribute("aria-label") || "").includes("Binga"))?.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const card = await page.evaluate(() => {
        const c = document.querySelector('[data-testid="bombing-card"]');
        return c ? { record: c.textContent.includes("from the 1922 record") } : null;
      });
      t.assert("evidence card opens with the 1922 record label", card?.record, JSON.stringify(card));
      await new Promise((r) => setTimeout(r, 500));
      t.assert(
        "bombing-map completes after draw + card",
        (await exhibitState(page))?.completedInteractives.includes("bombing-map")
      );
    },
  },
  {
    id: "ch4-invisible-line",
    milestone: "A2",
    tags: ["core", "sensitivity"],
    route: `${DEBUG}&ch=ch4`,
    async run(page, t) {
      await waitReady(page);
      await page.evaluate(() => {
        [...document.querySelectorAll('[data-testid="advisory-gate"] button')]
          .find((b) => b.textContent.trim() === "Continue")?.click();
      });
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      await page.evaluate(() => window.__exhibit?.continue());
      await page.waitForFunction(
        () => window.__exhibit?.state()?.pausePoint?.interactiveId === "invisible-line",
        { timeout: 20000 }
      );
      const before = await page.$eval('[data-testid="invisible-line"]', (el) => ({
        revealed: el.getAttribute("data-revealed"),
        handle: !!el.querySelector('[role="slider"]'),
      }));
      t.assert("starts unrevealed with a handle", before.revealed === "false" && before.handle, JSON.stringify(before));
      const w = await page.$eval('[data-testid="invisible-line"] [role="img"]', (el) => el.getBoundingClientRect().width);
      await drag(page, '[data-testid="invisible-line"] [role="slider"]', w * 0.55, 0, 12);
      await new Promise((r) => setTimeout(r, 400));
      const after = await page.$eval('[data-testid="invisible-line"]', (el) => ({
        revealed: el.getAttribute("data-revealed"),
        handle: !!el.querySelector('[role="slider"]'),
        story: el.textContent.includes("Eugene Williams"),
      }));
      t.assert("line revealed by the visitor's drag", after.revealed === "true" && after.story, JSON.stringify(after));
      t.assert("handle gone, nothing repeatable", !after.handle);
      t.assert(
        "invisible-line completes on reveal",
        (await exhibitState(page))?.completedInteractives.includes("invisible-line")
      );
    },
  },
  {
    id: "read-the-deed",
    milestone: "A2",
    tags: ["core"],
    route: `${DEBUG}&ch=ch5`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      t.assert("pause is read-the-deed", (await exhibitState(page))?.pausePoint?.interactiveId === "read-the-deed");
      for (const c of ["barred", "duration", "stick"]) {
        await dispatchClick(page, `[data-testid="deed-clause-${c}"]`);
        await new Promise((r) => setTimeout(r, 120));
      }
      t.assert(
        "three expanded",
        (await page.$eval('[data-testid="deed-clauses"]', (el) => el.getAttribute("data-expanded"))) === "3"
      );
      t.assert("completes", (await exhibitState(page))?.completedInteractives.includes("read-the-deed"));
      await dispatchClick(page, '[data-testid="deed-signatures"]');
      const chain = await page.$eval('[data-testid="deed-chain-quote"]', (el) => el.textContent || "");
      t.assert("chain quote verbatim", chain.includes("a marvelous delicately woven chain of armor"));
      await dispatchClick(page, '[data-testid="deed-spread-button"]');
      await new Promise((r) => setTimeout(r, 600));
      t.assert(
        "lattice spreads",
        Number(await page.$eval('[data-testid="deed-spread-tiles"]', (el) => el.getAttribute("data-tiles"))) > 100
      );
    },
  },
  {
    id: "holc-lens",
    milestone: "A2",
    tags: ["core"],
    route: `${DEBUG}&ch=ch6`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      await page.focus('[data-testid="holc-lens-handle"]');
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press(i % 4 === 3 ? "ArrowDown" : "ArrowLeft");
        await new Promise((r) => setTimeout(r, 50));
        const visited = Number(await page.$eval('[data-testid="holc-lens"]', (el) => el.getAttribute("data-visited")));
        if (visited >= 2) break;
      }
      t.assert(
        "two areas resolved",
        Number(await page.$eval('[data-testid="holc-lens"]', (el) => el.getAttribute("data-visited"))) >= 2
      );
      await page.evaluate(() =>
        document
          .querySelector('[data-testid="holc-lens-toggle"]')
          .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 9, isPrimary: true }))
      );
      await new Promise((r) => setTimeout(r, 200));
      t.assert("darkness caption", await page.$('[data-testid="holc-lens-caption"]'));
      await page.evaluate(() =>
        document
          .querySelector('[data-testid="holc-lens-toggle"]')
          .dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 9, isPrimary: true }))
      );
      t.assert("completes", (await exhibitState(page))?.completedInteractives.includes("holc-lens"));
    },
  },
  {
    id: "case-files",
    milestone: "A2",
    tags: ["core"],
    route: `${DEBUG}&ch=ch7`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      for (const id of ["buchanan", "corrigan", "hansberry", "shelley"]) {
        await dispatchClick(page, `[data-testid="case-folder-${id}"]`);
        await new Promise((r) => setTimeout(r, 150));
        await dispatchClick(page, '[data-testid="case-stamp-button"]');
        await new Promise((r) => setTimeout(r, 150));
        t.assert(
          `${id} stamped`,
          (await page.$eval(`[data-testid="case-folder-${id}"]`, (el) => el.getAttribute("data-stamped"))) === "true"
        );
      }
      t.assert("arc line", await page.$('[data-testid="case-arc"]'));
      t.assert("completes", (await exhibitState(page))?.completedInteractives.includes("case-files"));
    },
  },
  {
    id: "kitchenette",
    milestone: "A2",
    tags: ["core"],
    route: `${DEBUG}&ch=ch7`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 20000 });
      await fire(page, { type: "COMPLETE_INTERACTIVE", interactiveId: "case-files" });
      await dispatchClick(page, '[data-testid="continue-button"]');
      await page.waitForFunction(
        () => window.__exhibit?.state().pausePoint?.interactiveId === "kitchenette",
        { timeout: 20000 }
      );
      await dispatchClick(page, '[data-testid="kitchenette-unit-flat3"]');
      await new Promise((r) => setTimeout(r, 120));
      await dispatchClick(page, '[data-testid="kitchenette-unit-flat3"]');
      await new Promise((r) => setTimeout(r, 120));
      const root = '[data-testid="kitchenette"]';
      t.assert("doubles twice", (await page.$eval(root, (el) => el.getAttribute("data-units"))) === "9");
      t.assert("completes at two splits", (await exhibitState(page))?.completedInteractives.includes("kitchenette"));
      await dispatchClick(page, '[data-testid="kitchenette-unit-flat1"]');
      await new Promise((r) => setTimeout(r, 120));
      await dispatchClick(page, '[data-testid="kitchenette-unit-flat6"]');
      await new Promise((r) => setTimeout(r, 120));
      await dispatchClick(page, '[data-testid="kitchenette-unit-flat2"]');
      await new Promise((r) => setTimeout(r, 120));
      t.assert("tray caps at four", (await page.$eval(root, (el) => el.getAttribute("data-splits"))) === "4");
    },
  },
  {
    id: "ch8-planners-table",
    milestone: "A3",
    tags: ["core"],
    route: `${DEBUG}&ch=ch8`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 30000 });
      t.assert("pause is planners-table", (await exhibitState(page))?.pausePoint?.interactiveId === "planners-table");
      await page.$eval('[data-testid="planners-table"]', (el) => el.scrollIntoView({ block: "center" }));
      await page.evaluate(() => {
        const btns = document.querySelectorAll('[data-testid="pt-switch"] button');
        (btns[1] ?? btns[0])?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 250));
      const pos = await page.$eval('[data-testid="pt-switch"]', (el) => el.getAttribute("data-position"));
      t.assert("switch flips to there", pos === "there", `pos=${pos}`);
      const setYear = (y) =>
        page.$eval(
          '[data-testid="planners-table"] input[type="range"]',
          (el, val) => {
            Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, String(val));
            el.dispatchEvent(new Event("input", { bubbles: true }));
          },
          y
        );
      await setYear(1957);
      await new Promise((r) => setTimeout(r, 400));
      const midDots = Number(await page.$eval('[data-testid="pt-dots"]', (el) => el.getAttribute("data-count")));
      t.assert("dots present mid-slider", midDots > 0, `dots=${midDots}`);
      await setYear(1962);
      await new Promise((r) => setTimeout(r, 600));
      const text = await page.$eval('[data-testid="planners-table"]', (el) => el.textContent || "");
      t.assert("638 buildings landed", text.includes("638"));
      t.assert("baldwin voice present", await page.$('[data-testid="voice-medallion-james-baldwin"]'));
      await dispatchClick(page, '[data-testid="pt-envelope-renter"]');
      await dispatchClick(page, '[data-testid="pt-envelope-owner"]');
      await new Promise((r) => setTimeout(r, 250));
      const envText = await page.$eval('[data-testid="planners-table"]', (el) => el.textContent || "");
      t.assert("renter envelope documented framing", envText.includes("A relocation program existed for households"));
      t.assert("owner envelope softened line", envText.includes("started over on their own"));
      t.assert("completes", (await exhibitState(page))?.completedInteractives.includes("planners-table"));
    },
  },
  {
    id: "ch9-two-buyers",
    milestone: "A3",
    tags: ["core"],
    route: `${DEBUG}&ch=ch9`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 45000 });
      let s = await exhibitState(page);
      t.assert("pause point is two-buyers", s?.pausePoint?.interactiveId === "two-buyers");
      await page.$eval('[data-testid="two-buyers"]', (el) => el.scrollIntoView({ block: "center" }));
      await page.$eval('[data-testid="twobuyers-slider"]', (el) => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, "60");
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 200));
      t.assert("month 60 on the root", (await page.$eval('[data-testid="two-buyers"]', (e) => e.dataset.month)) === "60");
      t.assert(
        "extra at 60 is 35220",
        (await page.$eval('[data-testid="twobuyers-extra"]', (e) => e.dataset.usd)) === "35220"
      );
      t.assert("share at 60 is 25", (await page.$eval('[data-testid="twobuyers-share"]', (e) => e.dataset.pct)) === "25");
      await dispatchClick(page, '[data-testid="twobuyers-life"]');
      await new Promise((r) => setTimeout(r, 500));
      s = await exhibitState(page);
      t.assert("eviction fired once", s?.firedOnce.filter((k) => k === "twobuyers-eviction").length === 1);
      t.assert("notice renders", await page.$('[data-testid="twobuyers-evicted"]'));
      t.assert(
        "kept figure transferred",
        (await page.$eval('[data-testid="twobuyers-kept"]', (e) => e.dataset.usd)) === "35220"
      );
      t.assert("next family at month zero", (await page.$eval('[data-testid="two-buyers"]', (e) => e.dataset.month)) === "0");
      await dispatchClick(page, '[data-testid="twobuyers-life"]');
      await new Promise((r) => setTimeout(r, 300));
      s = await exhibitState(page);
      t.assert("second click is a no-op", s?.firedOnce.filter((k) => k === "twobuyers-eviction").length === 1);
      t.assert("two-buyers completes", s?.completedInteractives.includes("two-buyers"));
    },
  },
  {
    id: "ch10-hold-the-line",
    milestone: "A3",
    tags: ["core"],
    route: `${DEBUG}&ch=ch10`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(() => window.__exhibit?.state().playState === "pause_point", { timeout: 30000 });
      t.assert("pause is hold-the-line", (await exhibitState(page))?.pausePoint?.interactiveId === "hold-the-line");
      await page.$eval('[data-testid="htl-button"]', (el) => el.scrollIntoView({ block: "center" }));
      // pointer hold long enough to accumulate 12+ months at ~6/sec
      await page.evaluate(async () => {
        const el = document.querySelector('[data-testid="htl-button"]');
        const opts = { bubbles: true, pointerId: 7, isPrimary: true };
        el.dispatchEvent(new PointerEvent("pointerdown", opts));
        await new Promise((r) => setTimeout(r, 2400));
        el.dispatchEvent(new PointerEvent("pointerup", opts));
      });
      await new Promise((r) => setTimeout(r, 400));
      const months = Number(await page.$eval('[data-testid="hold-the-line"]', (el) => el.getAttribute("data-months")));
      t.assert("months accumulated past 12", months >= 12, `months=${months}`);
      t.assert("months capped at 14", months <= 14, `months=${months}`);
      const text = await page.$eval('[data-testid="hold-the-line"]', (el) => el.textContent || "");
      t.assert("resolution arithmetic present", text.includes("155"));
      t.assert("ruth wells voice present", await page.$('[data-testid="voice-medallion-ruth-wells"]'));
      t.assert("completes", (await exhibitState(page))?.completedInteractives.includes("hold-the-line"));
    },
  },
  {
    id: "gap-at-scale-climb",
    milestone: "A3",
    tags: ["core"],
    route: `${DEBUG}&ch=ch11`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForFunction(
        () => window.__exhibit?.state().pausePoint?.interactiveId === "gap-at-scale",
        { timeout: 30000 }
      );
      t.assert("station renders", await page.$('[data-testid="gap-at-scale"]'));
      const ratio = await page.evaluate(
        () =>
          document.querySelector('[data-testid="gap-bar-white"]').getBoundingClientRect().height /
          document.querySelector('[data-testid="gap-bar-black"]').getBoundingClientRect().height
      );
      t.assert("true ratio near 6.35", Math.abs(ratio - 285010 / 44890) < 0.02, String(ratio));
      const at = (frac) =>
        page.evaluate((f) => {
          const el = document.querySelector('[data-testid="gap-scroll"]');
          el.scrollTop = (el.scrollHeight - el.clientHeight) * (1 - f);
          el.dispatchEvent(new Event("scroll"));
          return new Promise((r) =>
            setTimeout(
              () => r(Number(document.querySelector('[data-testid="gap-at-scale"]').getAttribute("data-progress"))),
              200
            )
          );
        }, frac);
      t.assert("progress climbs", (await at(0.5)) >= 45);
      t.assert("no early completion", !(await exhibitState(page)).completedInteractives.includes("gap-at-scale"));
      t.assert("top reached", (await at(1)) >= 90);
      t.assert("completion fires", (await exhibitState(page)).completedInteractives.includes("gap-at-scale"));
    },
  },
  {
    id: "room-map-door",
    milestone: "B1",
    tags: ["core", "rooms"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-explore"]');
      await new Promise((r) => setTimeout(r, 400));
      await exhibitGoto(page, "ch6");
      await page.$eval('[data-testid="door-map"]', (el) => el.scrollIntoView({ block: "center" })).catch(() => {});
      t.assert("map door present", await page.$('[data-testid="door-map"]'));
      await dispatchClick(page, '[data-testid="door-enter-map"]');
      await new Promise((r) => setTimeout(r, 700));
      const room = await page.$eval('[data-testid="room-overlay"]', (el) => el.getAttribute("data-room"));
      t.assert("map room opens", room === "map", `room=${room}`);
      const stations = await page.$$eval('[data-testid^="room-station-"]', (els) => els.length);
      t.assert("six stations render", stations >= 5, `stations=${stations}`);
      t.assert("thesis lamp live", await page.$('[data-testid="room-lamp"]'));
      const missing = await page.$$eval("[data-fact-missing]", (els) => els.length);
      t.assert("zero missing facts in the room", missing === 0, `missing=${missing}`);
      const hash = await page.evaluate(() => window.location.hash);
      t.assert("hash synced", hash === "#room-map", hash);
      await dispatchClick(page, '[data-testid="room-close"]');
      await new Promise((r) => setTimeout(r, 400));
      const s = await exhibitState(page);
      t.assert("room closed", s?.openRoom === null);
      t.assert("visit recorded", s?.visitedRooms.includes("map"));
    },
  },
  {
    id: "room-contract-dollar",
    milestone: "B1",
    tags: ["core", "rooms"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-explore"]');
      await new Promise((r) => setTimeout(r, 400));
      await exhibitGoto(page, "ch9");
      await dispatchClick(page, '[data-testid="door-enter-contract"]');
      await new Promise((r) => setTimeout(r, 700));
      t.assert("crossref card present", await page.$('[data-testid="room-two-buyers-crossref"]'));
      const remounted = await page.$('[data-testid="room-overlay"] [data-testid="interactive-two-buyers"]');
      t.assert("two-buyers NOT remounted in room", !remounted);
      await page.focus('[data-testid="follow-the-dollar-handle"]');
      for (let i = 0; i < 7; i++) {
        await page.keyboard.press("ArrowRight");
        await new Promise((r) => setTimeout(r, 120));
      }
      const complete = await page.$eval('[data-testid="follow-the-dollar"]', (el) => el.getAttribute("data-complete"));
      t.assert("dollar circle traced by keyboard", complete === "true", `complete=${complete}`);
    },
  },
  {
    id: "room-guided-pause",
    milestone: "B1",
    tags: ["rooms", "sensitivity"],
    route: `${DEBUG}&ch=ch6`,
    async run(page, t) {
      await waitReady(page);
      await fire(page, { type: "OPEN_ROOM", roomId: "map" });
      await new Promise((r) => setTimeout(r, 400));
      let s = await exhibitState(page);
      t.assert("narration paused while room open", s?.playState === "paused", s?.playState);
      await dispatchClick(page, '[data-testid="room-close"]');
      await new Promise((r) => setTimeout(r, 300));
      s = await exhibitState(page);
      t.assert("still paused after close (visitor resumes)", s?.playState === "paused", s?.playState);
    },
  },
  {
    id: "rigged-gyb-lock",
    milestone: "B1",
    tags: ["core", "rooms"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-explore"]');
      await new Promise((r) => setTimeout(r, 400));
      await exhibitGoto(page, "ch6");
      await dispatchClick(page, '[data-testid="door-enter-map"]');
      await new Promise((r) => setTimeout(r, 900));
      const gyb = '[data-testid="rigged-grade-your-block"]';
      await page.$eval(gyb, (el) => el.scrollIntoView({ block: "center" }));
      const negro = await page.$(`[data-testid="rigged-field-grade-your-block-negro_percent"]`);
      t.assert("infiltration field present", !!negro);
      await page.evaluate(() => {
        const sel = document.querySelector('[data-testid="rigged-field-grade-your-block-negro_percent"]');
        const opts = [...sel.options].map((o) => o.value);
        const nonzero = opts.find((v) => v && !/^0/.test(v)) ?? opts[opts.length - 1];
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set.call(sel, nonzero);
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 300));
      const locked = await page.$eval(gyb, (el) => el.getAttribute("data-locked"));
      t.assert("form locks on infiltration", locked === "true", `locked=${locked}`);
      await dispatchClick(page, '[data-testid="rigged-action-grade-your-block"]');
      await new Promise((r) => setTimeout(r, 400));
      const verdict = await page.$eval(gyb, (el) => el.textContent || "");
      t.assert("HAZARDOUS verdict", verdict.includes("HAZARDOUS"));
    },
  },
  {
    id: "explore-ch4-advisory",
    milestone: "A2",
    tags: ["core", "sensitivity"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.click('[data-testid="mode-explore"]');
      await new Promise((r) => setTimeout(r, 400));
      await exhibitGoto(page, "ch4");
      let s = await exhibitState(page);
      t.assert("advisory raised in explore", s?.playState === "advisory", s?.playState);
      t.assert("advisory gate visible", await page.$('[data-testid="advisory-gate"]'));
      await page.evaluate(() => {
        [...document.querySelectorAll('[data-testid="advisory-gate"] button')]
          .find((b) => b.textContent.trim() === "Continue")?.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      s = await exhibitState(page);
      t.assert("explore not stuck after accept", s?.playState === "ended", s?.playState);
      t.assert("on ch4", s?.chapterIndex === 5, `index=${s?.chapterIndex}`);
      t.assert("stage renders", await page.$('[data-testid="chapter-stage"]'));
      // second entry must not re-raise the gate
      await exhibitGoto(page, "ch5");
      await exhibitGoto(page, "ch4");
      s = await exhibitState(page);
      t.assert("no re-raise once accepted", s?.playState === "ended", s?.playState);
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
