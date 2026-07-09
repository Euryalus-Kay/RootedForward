// ------------------------------------------------------------------
// Exhibit verify scenarios for the reader-paced rebuild. The whole
// file is the regression suite. Each scenario:
// { id, milestone, tags[], route, run(page, t, helpers) } where t is
// the assertion collector from exhibit-lib and route is appended to
// RF_BASE. All scenarios run under ?debug=1 (deterministic mode)
// unless the route says otherwise. The old guided/explore, pause-
// point, HUD, and rigged-instrument scenarios were retired with the
// rebuild; do not resurrect them.
// ------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { dispatchClick, exhibitGoto, exhibitState, waitReady } from "./exhibit-lib.mjs";

const EX = "/tours/chicago/hyde-park";
const DEBUG = `${EX}?debug=1`;

const WALLTEXT = JSON.parse(readFileSync("data/exhibit/walltext.json", "utf8"));

/** the render order the page uses (overture after ch2) */
const FLOW = ["ch0", "ch1", "ch2", "ch0_5", "ch3", "ch4", "ch5", "ch6", "ch7", "ch8", "ch9", "ch10", "ch11"];

export const scenarios = [
  {
    id: "boot",
    milestone: "R1",
    tags: ["smoke", "core"],
    route: DEBUG,
    async run(page, t, { consoleErrors }) {
      await waitReady(page);
      t.assert("exhibit root renders", await page.$('[data-testid="exhibit-root"]'));
      const title = await page.$eval('[data-testid="exhibit-header"] h1', (el) => el.textContent);
      t.assert("title on the opening wall", title === "The Ground Keeps Moving", title);
      const words = await page.$$eval('[data-testid="opening-plainwords"] p', (els) => els.length);
      t.assert("three plain-words paragraphs", words === 3, `paragraphs=${words}`);
      t.assert("how-to-read line", await page.$('[data-testid="how-to-read"]'));
      const begin = await page.$eval('[data-testid="begin-link"]', (el) => el.getAttribute("href"));
      t.assert("begin anchor points at ch0", begin === "#ch0", begin);
      t.assert("no mode gate", !(await page.$('[data-testid="mode-guided"]')));
      t.assert("debug api mounted", await page.evaluate(() => !!window.__exhibit));
      t.assert("stations() lists the flow's stations", await page.evaluate(() => {
        const s = window.__exhibit?.stations() ?? [];
        return ["holc-map", "layer-slider", "two-buyers", "gap-at-scale", "answer-wall"].every((id) =>
          s.includes(id)
        );
      }));
      t.assert("zero console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
    },
  },
  {
    id: "reading-flow",
    milestone: "R1",
    tags: ["smoke", "core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page, { scroll: true });
      const sections = await page.$$eval("[data-chapter-section]", (els) =>
        els.map((el) => ({
          id: el.getAttribute("data-chapter-section"),
          era: el.getAttribute("data-era"),
        }))
      );
      t.assert(
        "all flow chapters render in order",
        JSON.stringify(sections.map((s) => s.id)) === JSON.stringify(FLOW),
        JSON.stringify(sections.map((s) => s.id))
      );
      // every chapter present in walltext.json shows its own era plate and text
      for (const ch of WALLTEXT.chapters) {
        const sec = sections.find((s) => s.id === ch.id);
        t.assert(`${ch.id} era plate correct`, sec?.era === ch.era, `${sec?.era} != ${ch.era}`);
        const hasIntro = await page.evaluate(
          (id) => !!document.querySelector(`#${id} [data-section-id="${id}-ctx"]`),
          ch.id
        );
        t.assert(`${ch.id} context intro renders`, hasIntro);
      }
      // chapters not yet written render the honest pending note, never a gap
      const pendingIds = FLOW.filter((id) => !WALLTEXT.chapters.some((c) => c.id === id) && id !== "ch0_5");
      for (const id of pendingIds.slice(0, 2)) {
        t.assert(
          `${id} pending note while walltext lands`,
          await page.$(`[data-testid="chapter-pending-${id}"]`)
        );
      }
      // the overture always carries the five-instruments table
      const rows = await page.$$eval('[data-testid="machines-panel"] tbody tr', (els) => els.length);
      t.assert("five instruments in the overture table", rows === 5, `rows=${rows}`);
      // goto contract works against anchors
      await exhibitGoto(page, "ch2");
      const s = await exhibitState(page);
      t.assert("goto updates the chapter index", s?.chapterIndex >= 0);
    },
  },
  {
    id: "holc-map-station",
    milestone: "R1",
    tags: ["core"],
    route: `${DEBUG}&ch=ch0`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForSelector('#ch0 [data-station="holc-map"] [role="button"]', { timeout: 30000 });
      // the station intro panel (what / when / why) sits above the frame
      t.assert("station intro present", await page.$('#ch0 [data-testid="station-intro-holc-map"]'));
      // click areas until one with a surviving sheet opens (most have one)
      const opened = await page.evaluate(async () => {
        const areas = document.querySelectorAll('#ch0 [data-station="holc-map"] [role="button"]');
        for (const a of Array.from(areas).slice(0, 12)) {
          a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 250));
          const readout = document.querySelector('#ch0 [data-testid="holc-map-readout"]');
          if (readout && /period document/.test(readout.textContent || "") && readout.querySelector("blockquote")) {
            return readout.textContent || "";
          }
        }
        return null;
      });
      t.assert("area sheet opens with the period-language chip", !!opened, String(opened).slice(0, 120));
      const excerptLen = await page.$eval(
        '#ch0 [data-testid="holc-map-readout"] blockquote',
        (el) => (el.textContent || "").length
      );
      t.assert("real excerpt text renders", excerptLen > 40, `len=${excerptLen}`);
      t.assert("no DECLINED stamps", !(await page.$('#ch0 [data-testid="stamp"]')));
      // the hold-to-look control reveals the loans caption
      await page.evaluate(() => {
        const el = document.querySelector('#ch0 [data-testid="holc-map-hold"]');
        el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 5, isPrimary: true }));
        el?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 5, isPrimary: true }));
      });
      await new Promise((r) => setTimeout(r, 300));
      t.assert("loans overlay caption", await page.$('#ch0 [data-testid="holc-map-hold-caption"]'));
      // the same station serves ch6 with its own framing
      const ch6framing = await page
        .$eval('#ch6 [data-testid="holc-map-station"]', (el) => el.getAttribute("data-framing"))
        .catch(() => null);
      t.assert("ch6 mounts the station with ch6 framing", ch6framing === "ch6", String(ch6framing));
    },
  },
  {
    id: "advisory-inline",
    milestone: "R1",
    tags: ["core", "sensitivity"],
    route: `${DEBUG}&ch=ch4`,
    async run(page, t) {
      await waitReady(page);
      t.assert("advisory plate inside ch4", await page.$('#ch4 [data-testid="advisory-plate"]'));
      const skip = await page.$eval('[data-testid="advisory-skip"]', (el) => el.getAttribute("href"));
      t.assert("skip anchor points at ch5", skip === "#ch5", String(skip));
      t.assert("no modal dialog", !(await page.$('[role="alertdialog"]')));
      t.assert("ch4 wall stays readable behind the plate", await page.$("#ch4[data-chapter-section]"));
      const motion = await page.$eval("#ch4", (el) => el.getAttribute("data-motion"));
      t.assert("ch4 holds no-motion", motion === "off", String(motion));
    },
  },
  {
    id: "records",
    milestone: "R1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page, { scroll: true });
      // chapter-end record lines with resolved FactValues
      for (const ch of ["ch1", "ch2", "ch9"]) {
        const rec = await page.$(`[data-testid="record-${ch}"]`);
        t.assert(`${ch} record line renders`, !!rec);
        if (rec) {
          const stats = await page.$$eval(`[data-testid="record-${ch}"] [data-stat]`, (els) => els.length);
          t.assert(`${ch} record carries figures`, stats >= 1, `stats=${stats}`);
        }
      }
      const missing = await page.$$eval("[data-fact-missing]", (els) => els.length);
      t.assert("zero unresolved facts on the page", missing === 0, `missing=${missing}`);
      // ch7 renders the four cases as static annotated documents
      const cases = await page.$$eval('#ch7 [data-testid^="case-"]', (els) =>
        els.filter((el) => /^case-(buchanan|corrigan|hansberry|shelley)$/.test(el.getAttribute("data-testid") || "")).length
      );
      t.assert("four case documents in ch7", cases === 4, `cases=${cases}`);
      t.assert("no case stamping controls", !(await page.$('[data-testid="case-stamp-button"]')));
      // ch11 renders the full table before the gap station
      const rows = await page.$$eval('[data-testid="ledger-table"] tbody tr', (els) => els.length);
      t.assert("full record table renders all entries", rows === 11, `rows=${rows}`);
      const order = await page.evaluate(() => {
        const tail = document.querySelector("#ch11");
        if (!tail) return null;
        const table = tail.querySelector('[data-testid="ledger-table"]');
        const gap = tail.querySelector('[data-station="gap-at-scale"]');
        if (!table || !gap) return null;
        return table.compareDocumentPosition(gap) & Node.DOCUMENT_POSITION_FOLLOWING ? "table-first" : "gap-first";
      });
      t.assert("table sits before gap-at-scale", order === "table-first", String(order));
    },
  },
  {
    id: "two-buyers",
    milestone: "R1",
    tags: ["core"],
    route: `${DEBUG}&ch=ch9`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForSelector('[data-testid="twobuyers-slider"]', { timeout: 30000 });
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
      let s = await exhibitState(page);
      t.assert("eviction fired once", s?.firedOnce.filter((k) => k === "twobuyers-eviction").length === 1);
      t.assert("notice renders", await page.$('[data-testid="twobuyers-evicted"]'));
      t.assert(
        "kept figure transferred",
        (await page.$eval('[data-testid="twobuyers-kept"]', (e) => e.dataset.usd)) === "35220"
      );
      await dispatchClick(page, '[data-testid="twobuyers-life"]');
      await new Promise((r) => setTimeout(r, 300));
      s = await exhibitState(page);
      t.assert("second click is a no-op", s?.firedOnce.filter((k) => k === "twobuyers-eviction").length === 1);
      // completion-free interaction: no completion state, no Continue
      t.assert("no completion tracking in state", !("completedInteractives" in (s ?? {})));
      t.assert("no continue button anywhere", !(await page.$('[data-testid="continue-button"]')));
    },
  },
  {
    id: "gap-at-scale",
    milestone: "R1",
    tags: ["core"],
    route: `${DEBUG}&ch=ch11`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForSelector('[data-testid="gap-scroll"]', { timeout: 30000 });
      t.assert("station renders", await page.$('[data-testid="gap-at-scale"]'));
      await page.waitForFunction(
        () => {
          const w = document.querySelector('[data-testid="gap-bar-white"]');
          const b = document.querySelector('[data-testid="gap-bar-black"]');
          return w && b && b.getBoundingClientRect().height > 0;
        },
        { timeout: 15000 }
      );
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
      t.assert("top reached", (await at(1)) >= 90);
      // completion-free: nothing in state tracks the climb
      const s = await exhibitState(page);
      t.assert("no completion tracking in state", !("completedInteractives" in (s ?? {})));
    },
  },
  {
    id: "rooms-documents",
    milestone: "R1",
    tags: ["core", "rooms"],
    route: `${DEBUG}&ch=ch6`,
    async run(page, t) {
      await waitReady(page);
      await page.$eval('[data-testid="door-map"]', (el) => el.scrollIntoView({ block: "center" })).catch(() => {});
      t.assert("map door present", await page.$('[data-testid="door-map"]'));
      await dispatchClick(page, '[data-testid="door-enter-map"]');
      await new Promise((r) => setTimeout(r, 900));
      const room = await page.$eval('[data-testid="room-overlay"]', (el) => el.getAttribute("data-room"));
      t.assert("map room opens", room === "map", `room=${room}`);
      // the instrument is a document panel now, not a rigged form
      t.assert("1939 form document panel", await page.$('[data-testid="room-form-1939"]'));
      t.assert("area sheet record card", await page.$('[data-testid="room-record-card"]'));
      t.assert("no rigged form", !(await page.$('[data-testid="rigged-grade-your-block"]')));
      t.assert("no game selects", !(await page.$('[data-testid^="rigged-field-"]')));
      const missing = await page.$$eval('[data-testid="room-overlay"] [data-fact-missing]', (els) => els.length);
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
    id: "about-bibliography",
    milestone: "R1",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      await page.evaluate(() => document.getElementById("about")?.scrollIntoView());
      await new Promise((r) => setTimeout(r, 400));
      t.assert("about panel renders", await page.$('[data-testid="about-panel"]'));
      const text = await page.$eval('[data-testid="about-panel"]', (el) => el.textContent || "");
      t.assert("who made it", text.includes("Rooted Forward"));
      t.assert("method states the registry rule", text.includes("fact registry"));
      const entries = await page.$$eval('[data-testid="bib-entry"]', (els) => els.length);
      t.assert("more than 40 unique sources", entries > 40, `entries=${entries}`);
      const links = await page.$$eval('[data-testid="bib-entry"] a[href^="http"]', (els) => els.length);
      t.assert("sources link out", links > 20, `links=${links}`);
      t.assert("timeline offers the about anchor", await page.$('[data-testid="spine-about"]'));
    },
  },
  {
    id: "answer-wall",
    milestone: "R1",
    tags: ["core"],
    route: `${DEBUG}&ch=ch11`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForSelector('[data-testid="aw-input"]', { timeout: 30000 });
      t.assert("answer wall renders at the chapter's end", await page.$('[data-testid="answer-wall"]'));
      await page.$eval('[data-testid="answer-wall"]', (el) => el.scrollIntoView({ block: "center" }));
      await page.type('[data-testid="aw-input"]', "Everyone who calls it home.");
      await dispatchClick(page, '[data-testid="aw-submit"]');
      await new Promise((r) => setTimeout(r, 1200));
      t.assert("own answer chip held for review", await page.$('[data-testid="aw-own"]'));
      const state = await page.$eval('[data-testid="answer-wall"]', (el) => el.getAttribute("data-submit-state"));
      t.assert(
        "submit lands held or migration-pending",
        state === "held" || state === "migrationPending",
        String(state)
      );
    },
  },
];
