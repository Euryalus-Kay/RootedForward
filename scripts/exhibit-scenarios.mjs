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
// R9 construction slug; the swap commit points this at EX and retires the pre-R9 scenarios
const GROUND = "/tours/chicago/hyde-park-exhibit";
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
      t.assert("big idea line on the opening wall", await page.$('[data-testid="big-idea"]'));
      const words = await page.$$eval('[data-testid="opening-plainwords"] p', (els) => els.length);
      t.assert("one tight plain-words paragraph", words === 1, `paragraphs=${words}`);
      t.assert("how-to-read line", await page.$('[data-testid="how-to-read"]'));
      const begin = await page.$eval('[data-testid="begin-link"]', (el) => el.getAttribute("href"));
      t.assert("begin anchor points at ch0", begin === "#ch0", begin);
      const ground = await page.$eval('[data-testid="find-ground-link"]', (el) => el.getAttribute("href"));
      t.assert("find-ground link points at the locate control", ground === "#find-your-ground", String(ground));
      t.assert("locate anchor exists on the page", await page.$("#find-your-ground"));
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
      // the sheet readout offers the way into the Surveyor's Files
      t.assert("open-in-files control", await page.$('#ch0 [data-testid="holc-map-open-files"]'));
      // the ground-under-you lookup is offered with its privacy note
      t.assert("locate control", await page.$('#ch0 [data-testid="holc-map-locate"]'));
      const locNote = await page.$eval('#ch0 [data-testid="holc-map-locate-result"]', (e) => e.textContent || "");
      t.assert("locate privacy note", /Nothing leaves this page/.test(locNote), locNote.slice(0, 60));
      // the loans overlay is a plain toggle: on shows the caption, off restores the map
      await dispatchClick(page, '#ch0 [data-testid="holc-map-hold"]');
      await new Promise((r) => setTimeout(r, 300));
      const pressed = await page.$eval('#ch0 [data-testid="holc-map-hold"]', (el) => el.getAttribute("aria-pressed"));
      t.assert("overlay toggles on", pressed === "true", `aria-pressed=${pressed}`);
      t.assert("loans overlay caption", await page.$('#ch0 [data-testid="holc-map-hold-caption"]'));
      await dispatchClick(page, '#ch0 [data-testid="holc-map-hold"]');
      await new Promise((r) => setTimeout(r, 300));
      const released = await page.$eval('#ch0 [data-testid="holc-map-hold"]', (el) => el.getAttribute("aria-pressed"));
      t.assert("overlay toggles back off", released === "false", `aria-pressed=${released}`);
      // the same station serves ch6 with its own framing
      const ch6framing = await page
        .$eval('#ch6 [data-testid="holc-map-station"]', (el) => el.getAttribute("data-framing"))
        .catch(() => null);
      t.assert("ch6 mounts the station with ch6 framing", ch6framing === "ch6", String(ch6framing));
    },
  },
  {
    id: "holc-relief",
    milestone: "R7",
    tags: ["core"],
    route: `${DEBUG}&ch=ch0`,
    async run(page, t) {
      await waitReady(page);
      await page.waitForSelector('#ch0 [data-testid="holc-relief"]', { timeout: 30000 });
      const reliefPressed = await page.$eval(
        '#ch0 [data-testid="holc-map-view-relief"]',
        (el) => el.getAttribute("aria-pressed")
      );
      t.assert("relief is ch0's resting view", reliefPressed === "true", String(reliefPressed));
      const buttons = await page.$$eval(
        '#ch0 [data-testid="holc-relief"] [role="button"]',
        (els) => els.length
      );
      t.assert("all graded areas tappable in relief", buttons >= 600, `buttons=${buttons}`);
      t.assert(
        "rank disclosure under the relief",
        await page.$('#ch0 [data-testid="holc-relief-ranknote"]')
      );
      // the turn handle recomputes the scene
      const dBefore = await page.$eval(
        '#ch0 [data-testid="holc-relief"] [data-relief-area] path',
        (el) => el.getAttribute("d")
      );
      await page.$eval('#ch0 [data-testid="holc-relief-turn"]', (el) => {
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(el, "1");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 400));
      const dAfter = await page.$eval(
        '#ch0 [data-testid="holc-relief"] [data-relief-area] path',
        (el) => el.getAttribute("d")
      );
      t.assert("turn handle recomputes the relief", dBefore !== dAfter);
      // roving tab stop: one stop, arrows move between areas
      await page.evaluate(() => {
        const first = document.querySelector('#ch0 [data-testid="holc-relief"] [role="button"]');
        if (first instanceof SVGElement) first.focus();
      });
      const beforeFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
      await page.keyboard.press("ArrowRight");
      const afterFocus = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
      t.assert(
        "arrow keys walk the relief areas",
        beforeFocus !== "" && afterFocus !== "" && beforeFocus !== afterFocus,
        `${beforeFocus} -> ${afterFocus}`
      );
      // the flat study map stays one tap away, and back
      await dispatchClick(page, '#ch0 [data-testid="holc-map-view-flat"]');
      await new Promise((r) => setTimeout(r, 500));
      t.assert("relief stows on flat view", !(await page.$('#ch0 [data-testid="holc-relief"]')));
      const flatButtons = await page.$$eval(
        '#ch0 [data-station="holc-map"] [role="button"]',
        (els) => els.length
      );
      t.assert("flat map is fully tappable", flatButtons >= 600, `buttons=${flatButtons}`);
      await dispatchClick(page, '#ch0 [data-testid="holc-map-view-relief"]');
      await new Promise((r) => setTimeout(r, 500));
      t.assert("relief returns", await page.$('#ch0 [data-testid="holc-relief"]'));
      // ch6, the rereading, rests on the flat study map
      const ch6flat = await page
        .$eval('#ch6 [data-testid="holc-map-view-flat"]', (el) => el.getAttribute("aria-pressed"))
        .catch(() => null);
      t.assert("ch6 rests on the flat map", ch6flat === "true", String(ch6flat));
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
      // ch11 renders the full record timeline before the gap station
      const rows = await page.$$eval('[data-testid="ledger-table"] [data-entry-year]', (els) => els.length);
      t.assert("full record timeline renders all entries", rows === 11, `rows=${rows}`);
      const yearsInOrder = await page.$$eval('[data-testid="ledger-table"] [data-entry-year]', (els) =>
        els.map((el) => Number(el.getAttribute("data-entry-year")))
      );
      t.assert(
        "record timeline runs oldest to newest",
        yearsInOrder.every((y, i) => i === 0 || y >= yearsInOrder[i - 1]),
        yearsInOrder.join(",")
      );
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
    id: "surveyors-files",
    milestone: "R3",
    tags: ["core", "rooms"],
    route: `${DEBUG}&ch=ch6`,
    async run(page, t) {
      await waitReady(page);
      // the reading-room door sits at the ch6 tail
      t.assert("files door present", await page.$('[data-testid="door-files"]'));
      const eyebrow = await page.$eval('[data-testid="door-files"] p', (el) => el.textContent || "");
      t.assert("door reads as a reading room", /reading room/i.test(eyebrow), eyebrow);
      await dispatchClick(page, '[data-testid="door-enter-files"]');
      await new Promise((r) => setTimeout(r, 900));
      const room = await page.$eval('[data-testid="room-overlay"]', (el) => el.getAttribute("data-room"));
      t.assert("files room opens", room === "files", `room=${room}`);
      // the archive loads with its grade drawer
      await page.waitForSelector('[data-testid="files-list"] li', { timeout: 20000 });
      const rows = await page.$$eval('[data-testid="files-list"] li', (els) => els.length);
      t.assert("sheet drawer renders rows", rows > 20, `rows=${rows}`);
      const allLabel = await page.$eval('[data-testid="files-grade-all"]', (el) => el.textContent || "");
      t.assert("the full digitized count shows on the filter", /576/.test(allLabel), allLabel);
      // filter to grade D
      await dispatchClick(page, '[data-testid="files-grade-D"]');
      await new Promise((r) => setTimeout(r, 300));
      const dRows = await page.$$eval('[data-testid="files-list"] li button span:first-child', (els) =>
        els.map((e) => (e.textContent || "").trim())
      );
      t.assert("grade filter narrows to D sheets", dRows.length > 0 && dRows.every((x) => x.startsWith("D")), dRows.slice(0, 3).join(","));
      // open a sheet: form fields, permalink hash, copy control
      await dispatchClick(page, '[data-testid="files-list"] li button');
      await new Promise((r) => setTimeout(r, 400));
      t.assert("sheet opens", await page.$('[data-testid="files-sheet"]'));
      const dts = await page.$$eval('[data-testid="files-sheet"] dt', (els) => els.map((e) => e.textContent || ""));
      t.assert("form entries render", dts.length >= 4, `fields=${dts.length}`);
      t.assert("the race question is on the form", dts.some((x) => /negro|infiltration/i.test(x)), dts.join("|"));
      const hash = await page.evaluate(() => window.location.hash);
      t.assert("sheet permalink in the hash", /^#room-files:.+/.test(hash), hash);
      t.assert("copy-link control", await page.$('[data-testid="files-permalink"]'));
      // attribution is mandatory (CC BY-NC)
      const attr = await page.evaluate(() => document.body.textContent || "");
      t.assert("Mapping Inequality attribution", /Mapping Inequality/.test(attr));
      // the patterns panel computes from the corpus and opens its quoted sheets
      t.assert("patterns panel present", await page.$('[data-testid="files-patterns"]'));
      const missingPat = await page.$$eval('[data-testid="files-patterns"] [data-fact-missing]', (els) => els.length);
      t.assert("patterns facts all resolve", missingPat === 0, `missing=${missingPat}`);
      await dispatchClick(page, '[data-testid="files-pattern-open-1097"]');
      await new Promise((r) => setTimeout(r, 400));
      const patHash = await page.evaluate(() => window.location.hash);
      t.assert("quoted sheet opens from the panel", patHash === "#room-files:1097", patHash);
      // deep link: a fresh arrival at the permalink lands on the sheet
      const deepHash = hash;
      await page.goto(`${page.url().split("#")[0]}${""}`.replace(/\?.*$/, "") + `?debug=1${deepHash}`, { waitUntil: "networkidle2" });
      await waitReady(page);
      await page.waitForSelector('[data-testid="files-sheet"]', { timeout: 20000 });
      const room2 = await page.$eval('[data-testid="room-overlay"]', (el) => el.getAttribute("data-room"));
      t.assert("deep link opens the room on its sheet", room2 === "files", `room=${room2}`);
      const hash2 = await page.evaluate(() => window.location.hash);
      t.assert("deep-linked hash preserved", hash2 === deepHash, `${hash2} vs ${deepHash}`);
    },
  },
  {
    id: "files-cross-link",
    milestone: "R3",
    tags: ["rooms"],
    route: `${DEBUG}&ch=ch6`,
    async run(page, t) {
      await waitReady(page);
      // open an area sheet on the ch6 map, then follow it into the archive
      await page.waitForSelector('#ch6 [data-station="holc-map"] [role="button"]', { timeout: 30000 });
      await page.evaluate(async () => {
        const areas = document.querySelectorAll('#ch6 [data-station="holc-map"] [role="button"]');
        for (const a of Array.from(areas).slice(0, 12)) {
          a.dispatchEvent(new MouseEvent("click", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 250));
          if (document.querySelector('#ch6 [data-testid="holc-map-open-files"]')) return;
        }
      });
      const link = await page.$('#ch6 [data-testid="holc-map-open-files"]');
      t.assert("map readout offers the full sheet", !!link);
      if (!link) return;
      await dispatchClick(page, '#ch6 [data-testid="holc-map-open-files"]');
      await new Promise((r) => setTimeout(r, 900));
      const room = await page.$eval('[data-testid="room-overlay"]', (el) => el.getAttribute("data-room")).catch(() => null);
      t.assert("archive opens from the map", room === "files", `room=${room}`);
      await page.waitForSelector('[data-testid="files-sheet"]', { timeout: 20000 });
      t.assert("it opens on the chosen sheet", await page.$('[data-testid="files-sheet"]'));
      const hash = await page.evaluate(() => window.location.hash);
      t.assert("sheet hash carried through", /^#room-files:.+/.test(hash), hash);
      // Back exits the room in one step
      await page.goBack();
      await new Promise((r) => setTimeout(r, 600));
      const s = await exhibitState(page);
      t.assert("back closes the archive", s?.openRoom === null, `openRoom=${s?.openRoom}`);
    },
  },
  {
    id: "mobile-overflow",
    milestone: "R4",
    tags: ["core"],
    route: DEBUG,
    async run(page, t) {
      // phone viewport; every chapter must lay out inside it
      await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.reload({ waitUntil: "networkidle2" });
      await waitReady(page, { scroll: true }); // the scroll mounts every lazy station
      const chapters = await page.$$eval("[data-chapter-section]", (els) =>
        els.map((el) => el.getAttribute("data-chapter-section"))
      );
      t.assert("all flow chapters render at 375px", chapters.length === FLOW.length, chapters.join(","));
      for (const ch of chapters) {
        await exhibitGoto(page, ch);
        await new Promise((r) => setTimeout(r, 300));
        const m = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        t.assert(
          `${ch} no horizontal overflow at 375px`,
          m.scrollWidth === m.innerWidth,
          `scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`
        );
      }
    },
  },
  {
    id: "r4-chrome",
    milestone: "R4",
    tags: ["core", "a11y"],
    route: DEBUG,
    async run(page, t) {
      await waitReady(page);
      // reduced motion: root flag + suppressed entrance animation
      const cdp = await page.createCDPSession();
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      });
      await page.reload({ waitUntil: "networkidle2" });
      await waitReady(page);
      const flag = await page.$eval('[data-testid="exhibit-root"]', (el) => el.getAttribute("data-motion"));
      t.assert("reduced-motion root flag", flag === "off", `data-motion=${flag}`);
      await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "" }] });
      await page.reload({ waitUntil: "networkidle2" });
      await waitReady(page);
      const flag2 = await page.$eval('[data-testid="exhibit-root"]', (el) => el.getAttribute("data-motion"));
      t.assert("flag absent without the preference", flag2 === null, `data-motion=${flag2}`);
      // grouped daggers: no wall paragraph renders 4+ consecutive individual daggers
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((r) => setTimeout(r, 800));
      const runs = await page.$$eval("[data-section-id]", (els) =>
        els.filter((p) => p.querySelectorAll('[data-testid="source-sup"]').length >= 4).length
      );
      t.assert("no 4+ dagger runs on wall paragraphs", runs === 0, `paragraphs=${runs}`);
      // escape scoping: a voice card open on the page must not eat the room's escape
      await page.evaluate(() => window.__exhibit.goto("ch6"));
      await new Promise((r) => setTimeout(r, 600));
      await dispatchClick(page, '[data-testid="door-enter-files"]');
      await new Promise((r) => setTimeout(r, 900));
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 500));
      const s1 = await exhibitState(page);
      t.assert("escape closes the room first press", s1?.openRoom === null, `openRoom=${s1?.openRoom}`);
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

  // ================================================================
  // R9 ground scenarios (The Same Map). These run against the
  // construction slug until the swap commit flips GROUND to the live
  // path and retires the pre-R9 scenarios above.
  // ================================================================
  {
    id: "ground-boot",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t, { consoleErrors }) {
      await page.waitForSelector('[data-testid="ground-root"]', { timeout: 30000 });
      t.assert("ground root renders", await page.$('[data-testid="ground-root"]'));
      t.assert("map svg in the document", await page.$("[data-ground-svg]"));
      const areas = await page.$$eval("[data-aid]", (els) => els.length);
      t.assert("all areas server-rendered", areas >= 690, `areas=${areas}`);
      const heads = await page.$$eval(".ground-chapterhead", (els) => els.length);
      t.assert("thirteen chapter heads", heads === 13, `heads=${heads}`);
      const title = await page.$eval('[data-testid="ground-intro"] h1', (el) => el.textContent);
      t.assert("title on the intro", title === "The Ground Keeps Moving", String(title));
      t.assert("the charge card", await page.$("#a0-charge"));
      t.assert("register docked", await page.$('[data-testid="ground-register"]'));
      t.assert("ledger rail", await page.$('[data-testid="ground-ledger-rail"]'));
      t.assert("spine", await page.$('[data-testid="ground-spine"]'));
      t.assert("locate anchor", await page.$("#find-your-ground"));
      t.assert("zero console errors", consoleErrors.length === 0, consoleErrors.join(" | ").slice(0, 300));
    },
  },
  {
    id: "ground-states",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-stage"]', { timeout: 30000 });
      const stageAt = async (sel) => {
        await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center", behavior: "instant" }), sel);
        await new Promise((r) => setTimeout(r, 650));
        return page.evaluate(() => {
          const st = document.querySelector('[data-testid="ground-stage"]');
          return {
            frame: st?.dataset.frame,
            grades: st?.dataset.grades,
            dim: st?.dataset.dim,
            marks: st?.dataset.marks,
            era: document.querySelector('[data-testid="ground-era"]')?.textContent ?? "",
            inked: document.querySelectorAll(".ga.inked").length,
          };
        });
      };
      const top = await stageAt("#ch0");
      t.assert("opens on the full 1940 map", top.frame === "citywide" && top.grades === "full" && top.era === "1940", JSON.stringify(top));
      const r1 = await stageAt("#a0-r1");
      t.assert("first rewind drains the grades", r1.grades === "none", JSON.stringify(r1));
      const r3 = await stageAt("#a0-r3");
      t.assert("rewind lands on 1832", r3.era === "1832", JSON.stringify(r3));
      const act1 = await stageAt("#ch1");
      t.assert("act 1 cuts to the township", act1.frame === "hydePark", JSON.stringify(act1));
      const ch4 = await stageAt("#ch4");
      t.assert("bombing chapter crops, dims, marks", ch4.frame === "blackBelt" && ch4.dim === "on" && ch4.marks === "on", JSON.stringify(ch4));
      const f2 = await stageAt("#a3-f2");
      t.assert("flood inks part of the map in filing order", f2.grades === "flood" && f2.inked > 100 && f2.inked < 694, JSON.stringify(f2));
      const s2 = await stageAt("#a3-s2");
      t.assert("the map returns whole", s2.grades === "full", JSON.stringify(s2));
      const today = await stageAt("#ch11");
      t.assert("the finale holds the marked map in 2026", today.era === "2026" && today.marks === "on", JSON.stringify(today));
    },
  },
  {
    id: "ground-ledger",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-ledger-rail"]', { timeout: 30000 });
      const railAt = async (sel) => {
        await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center", behavior: "instant" }), sel);
        await new Promise((r) => setTimeout(r, 650));
        return page.$eval('[data-testid="ground-ledger-rail"]', (el) => el.textContent ?? "");
      };
      const top = await railAt("#ch0");
      t.assert("rail starts unposted", top.includes("Entries post as the story reaches them"), top.slice(0, 60));
      const act1 = await railAt("#a1-s1");
      t.assert("the treaty posts first", act1.includes("1833"), act1.slice(0, 60));
      const fin = await railAt("#a6-ledger");
      t.assert("all eleven entries posted by the ledger wall", fin.includes("11 of 11"), fin.slice(0, 80));
    },
  },
  {
    id: "ground-locate",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-locate-button"]', { timeout: 30000 });
      await page.evaluate(() => document.querySelector("#a0-locate")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 400));
      const privacy = await page.$eval(".gl-privacy", (el) => el.textContent ?? "");
      t.assert(
        "privacy line verbatim",
        privacy.includes("Uses your device location once, with your permission. Nothing leaves this page."),
        privacy
      );
      await dispatchClick(page, '[data-testid="ground-locate-button"]');
      await new Promise((r) => setTimeout(r, 2500));
      const result = await page.$eval('[data-testid="ground-locate-result"]', (el) => el.textContent ?? "");
      t.assert("headless denial lands the graceful card", result.includes("No position was shared"), result.slice(0, 60));
    },
  },
  {
    id: "ground-mobile",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    viewport: { width: 390, height: 844 },
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-root"]', { timeout: 30000 });
      const anchors = ["#ch0", "#a0-charge", "#ch4", "#a3-f2", "#ch11"];
      for (const a of anchors) {
        await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center", behavior: "instant" }), a);
        await new Promise((r) => setTimeout(r, 500));
        const overflow = await page.evaluate(
          () => document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth
        );
        t.assert(`no horizontal overflow at ${a}`, overflow <= 1, `overflow=${overflow}px`);
      }
      const pane = await page.$eval('[data-testid="ground-stage-pane"]', (el) => getComputedStyle(el).position);
      t.assert("stage pane is sticky on phones", pane === "sticky", pane);
    },
  },
  {
    id: "ground-motion",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.reload({ waitUntil: "networkidle0" });
      await page.waitForSelector('[data-testid="ground-root"]', { timeout: 30000 });
      const off = await page.$('[data-motion="off"]');
      t.assert("reduced motion flips the page to resolved states", off);
      await page.evaluate(() => document.querySelector("#a3-f2")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 500));
      const inked = await page.evaluate(() => document.querySelectorAll(".ga.inked").length);
      t.assert("flood states resolve identically without motion", inked > 100, `inked=${inked}`);
    },
  },
];
