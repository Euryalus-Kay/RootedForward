// ------------------------------------------------------------------
// Exhibit verify scenarios for The Same Map (the R9 ground rebuild),
// live on /tours/chicago/hyde-park since July 2026. Each scenario:
// { id, milestone, tags[], route, run(page, t, helpers) } where t is
// the assertion collector from exhibit-lib and route is appended to
// RF_BASE. The pre-R9 document-flow scenarios were retired with their
// page at the swap commit; do not resurrect them. The construction
// slug now REDIRECTS, and headless Chrome drops URL fragments across
// that redirect, so every route here must target GROUND directly.
// ------------------------------------------------------------------
import { dispatchClick } from "./exhibit-lib.mjs";

const GROUND = "/tours/chicago/hyde-park";

export const scenarios = [
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
      const doorText = await page.$eval('[data-testid="ground-study-door"]', (el) => (el.textContent ?? "").replace(/\s+/g, " "));
      t.assert("the study-room door renders its space", doorText.includes("576 surveyors"), doorText);
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
      const ch4Boundary = await page.$eval('[data-testid="ground-stage"]', (el) => el.dataset.boundary);
      t.assert("no township ghost intrudes on the memorial crop", ch4Boundary === "off", String(ch4Boundary));
      const f2 = await stageAt("#a3-f2");
      t.assert("flood inks part of the map in filing order", f2.grades === "flood" && f2.inked > 100 && f2.inked < 694, JSON.stringify(f2));
      const s2 = await stageAt("#a3-s2");
      t.assert("the map returns whole", s2.grades === "full", JSON.stringify(s2));
      const today = await stageAt("#ch11");
      t.assert("the finale holds the marked map in 2026", today.era === "2026" && today.marks === "on", JSON.stringify(today));
      const spineAtCh5 = await page.evaluate(() => {
        document.querySelector("#ch5")?.scrollIntoView({ block: "center", behavior: "instant" });
        return new Promise((res) => setTimeout(() => res(document.querySelector('[data-testid="ground-spine"]')?.dataset.red), 700));
      });
      t.assert("spine still ink at the paperwork chapter", spineAtCh5 === "off", String(spineAtCh5));
      const spineAtCh6 = await page.evaluate(() => {
        document.querySelector("#ch6")?.scrollIntoView({ block: "start", behavior: "instant" });
        return new Promise((res) => setTimeout(() => res(document.querySelector('[data-testid="ground-spine"]')?.dataset.red), 700));
      });
      t.assert("spine turns D-red at the federal chapter", spineAtCh6 === "on", String(spineAtCh6));
      const sum = await stageAt("#a6-sum");
      t.assert("the sum state composites the century", sum.marks === "on" && sum.grades === "full", JSON.stringify(sum));
      const sumToday = await page.$eval('[data-testid="ground-stage"]', (el) => el.dataset.today);
      t.assert("the one present-day mark stands at East Woodlawn", sumToday === "on", String(sumToday));
      const sumBoundary = await page.$eval('[data-testid="ground-stage"]', (el) => el.dataset.boundary);
      t.assert("the township ghost returns for the sum", sumBoundary === "on", String(sumBoundary));
      const tag = await page.$eval("[data-today-tag]", (el) => el.textContent ?? "");
      t.assert("the present-day mark carries its name and date", tag.includes("EAST WOODLAWN") && tag.includes("2026"), tag);
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
      /* phones get the R7 rank disclosure too (audit: an entire device
         class was shipped the depth encoding with no disclosure) */
      await page.evaluate(() => document.querySelector("#a3-s2")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 1200));
      const tb = await page.$eval('[data-testid="ground-titleblock"]', (el) => ({
        text: el.textContent ?? "",
        disclosureShown: !!el.querySelector(".gtb-disclosure") && getComputedStyle(el.querySelector(".gtb-disclosure")).display !== "none",
      }));
      t.assert("the rank disclosure prints on phones", tb.disclosureShown && tb.text.includes("Depth shows grade rank"), JSON.stringify(tb).slice(0, 120));
      /* the finale's headline figure must resolve inside the phone
         stage frame (audit mobile-finale-clip) */
      await page.evaluate(() => document.querySelector("#a6-ledger")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 1800));
      const cap = await page.evaluate(() => {
        const tower = document.querySelector('[data-testid="gtower-woodlawn"]');
        const pane = document.querySelector('[data-testid="ground-stage-pane"]');
        if (!tower || !pane) return null;
        const tr = tower.getBoundingClientRect();
        const pr = pane.getBoundingClientRect();
        return { top: tr.top - pr.top, ok: tr.top >= pr.top - 1 };
      });
      t.assert("the Woodlawn plate resolves inside the phone stage frame", !!cap && cap.ok, JSON.stringify(cap));
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

  {
    id: "ground-docket",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="scene-docket"]', { timeout: 30000 });
      const rows = await page.$$eval('[data-testid="scene-docket"] tbody tr', (els) => els.length);
      t.assert("all forty appendix incidents listed", rows === 40, `rows=${rows}`);
      const srs = await page.$$eval('[data-testid="scene-docket"] tbody .sr-only', (els) =>
        els.filter((e) => (e.textContent ?? "").includes("No conviction recorded")).length
      );
      t.assert("every outcome cell announces no conviction recorded", srs === 40, `srs=${srs}`);
      const foot = await page.$eval('[data-testid="scene-docket"] tfoot', (el) => el.textContent ?? "");
      t.assert("totals row carries the three counts", foot.includes("58") && foot.includes("2") && foot.includes("0"), foot.slice(0, 120));
      const factChips = await page.$$eval('[data-testid="scene-docket"] tfoot [data-fact-id]', (els) => els.length);
      t.assert("totals resolve through the registry", factChips >= 3, `chips=${factChips}`);
      const truncated = await page.$$eval('[data-testid="scene-docket"] td', (els) =>
        els.filter((e) => e.className.includes("truncate")).length
      );
      t.assert("addresses never truncate", truncated === 0, `truncate=${truncated}`);
      t.assert("Wells closes the fair chapter, in her own words", await page.$('[data-testid="scene-wellsClose"]'));
      const docketText = await page.$eval('[data-testid="scene-docket"]', (el) => el.textContent ?? "");
      t.assert("the record's line of refusal closes the chapter", docketText.includes("Only two of the forty"), docketText.slice(-200));
      const firstDate = await page.$eval('[data-testid="scene-docket"] tbody tr td', (el) => el.textContent ?? "");
      t.assert("the record's earliest bombing opens the table", firstDate.includes("July 1, 1917"), firstDate);
      const headRow = await page.$eval('[data-testid="scene-docket"] thead', (el) => el.textContent ?? "");
      t.assert("the empty column is named Conviction", headRow.includes("Conviction"), headRow);
      t.assert("the advisory plate stands before the docket", await page.$("#a2-advisory [data-testid=\"scene-advisory\"], #a2-advisory > *"));
    },
  },
  {
    id: "ground-paper",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="scene-article34"]', { timeout: 30000 });
      const art = await page.$eval('[data-testid="scene-article34"]', (el) => el.textContent ?? "");
      t.assert("article 34 speaks of a character of property or occupancy", /character of property|occupancy/i.test(art), art.slice(0, 120));
      await page.evaluate(() => document.querySelector('[data-testid="scene-deedFacsimile"]')?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 500));
      const before = await page.$eval('[data-testid="deed-plain-toggle"]', (el) => el.getAttribute("aria-expanded"));
      await dispatchClick(page, '[data-testid="deed-plain-toggle"]');
      await new Promise((r) => setTimeout(r, 300));
      const after = await page.$eval('[data-testid="deed-plain-toggle"]', (el) => el.getAttribute("aria-expanded"));
      t.assert("plain-terms toggle flips aria-expanded", before === "false" && after === "true", `${before}->${after}`);
      const described = await page.$eval('[data-testid="scene-deedFacsimile"]', (el) => el.textContent ?? "");
      t.assert("deed panel admits it describes, not quotes", /described, not quoted/i.test(described), described.slice(0, 160));
    },
  },
  {
    id: "ground-cases",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="scene-casesReroute"]', { timeout: 30000 });
      await page.evaluate(() => document.querySelector('[data-testid="scene-casesReroute"]')?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 500));
      for (const id of ["buchanan", "corrigan", "hansberry", "shelley"]) {
        t.assert(`case node ${id}`, await page.$(`[data-testid="case-${id}"]`));
      }
      const detail = await page.$eval('[data-testid="case-detail"]', (el) => el.textContent ?? "");
      t.assert("detail card never empty", detail.length > 80, `len=${detail.length}`);
      await dispatchClick(page, '[data-testid="case-buchanan"]');
      await new Promise((r) => setTimeout(r, 300));
      const swapped = await page.$eval('[data-testid="case-detail"]', (el) => el.textContent ?? "");
      t.assert("selecting a case swaps the card", swapped.includes("Buchanan"), swapped.slice(0, 80));
    },
  },
  {
    id: "ground-clearance",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="scene-clearance"]', { timeout: 30000 });
      await page.evaluate(() => document.querySelector('[data-testid="scene-clearance"]')?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 600));
      const pressed = await page.$$eval('[data-testid="scene-clearance"] [aria-pressed]', (els) =>
        els.map((e) => e.getAttribute("aria-pressed"))
      );
      t.assert("before/after control is a real toggle pair", pressed.length === 2 && pressed.includes("true") && pressed.includes("false"), JSON.stringify(pressed));
      const firstCaption = await page.$eval('[data-testid="scene-clearance"] figcaption', (el) => el.textContent ?? "");
      const off = await page.$('[data-testid="scene-clearance"] [aria-pressed="false"]');
      await off.click();
      await new Promise((r) => setTimeout(r, 500));
      const secondCaption = await page.$eval('[data-testid="scene-clearance"] figcaption', (el) => el.textContent ?? "");
      t.assert("toggling swaps the dated state", firstCaption !== secondCaption, secondCaption.slice(0, 80));
      t.assert("one mark one family canvas with a text equivalent", await page.$('[data-testid="scene-clearance"] canvas[role="img"]'));
    },
  },
  {
    id: "ground-twobuyers",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="scene-twoBuyers"]', { timeout: 30000 });
      await page.evaluate(() => document.querySelector('[data-testid="scene-twoBuyers"]')?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 600));
      const slider = await page.$('[data-testid="gtb-slider"]');
      t.assert("the page's one slider is a native range input", slider && (await page.$eval('[data-testid="gtb-slider"]', (el) => el.tagName === "INPUT" && el.type === "range")));
      const restExtra = await page.$eval('[data-testid="gtb-extra"]', (el) => el.textContent ?? "");
      t.assert("rest state already shows the full color tax", /71,0\d\d/.test(restExtra), restExtra);
      const verdictChip = await page.$eval('[data-testid="scene-twoBuyers"]', (el) => !!el.querySelector('[data-fact-id="contracts.avg_overpayment_71000"]'));
      t.assert("the study's average carries its source", verdictChip);
      await page.$eval('[data-testid="gtb-slider"]', (el) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(el, "36");
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await new Promise((r) => setTimeout(r, 400));
      const scrubbed = await page.$eval('[data-testid="gtb-extra"]', (el) => el.textContent ?? "");
      t.assert("scrubbing replays the years", scrubbed !== restExtra, scrubbed);
    },
  },
  {
    id: "ground-finale",
    milestone: "R9",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="scene-bridge"]', { timeout: 30000 });
      for (const row of ["instrument", "grades", "moving"]) {
        t.assert(`bridge row ${row}`, await page.$(`[data-testid="bridge-row-${row}"]`));
      }
      const ledgerRows = await page.$$eval('[data-testid="scene-ledgerColumn"] [data-testid^="ledger-row-"]', (els) => els.length);
      t.assert("eleven entries in the account column", ledgerRows === 11, `rows=${ledgerRows}`);
      const convention = await page.$eval('[data-testid="scene-ledgerColumn"]', (el) => el.textContent ?? "");
      t.assert("dollar convention stated", convention.includes("Dollars of their year"), convention.slice(0, 120));
      const skipHref = await page.$eval('[data-testid="climb-skip"]', (el) => el.getAttribute("href"));
      t.assert("the climb offers a skip", skipHref === "#a6-receipt", String(skipHref));
      const summit = await page.$eval('[data-testid="climb-summit"]', (el) => el.textContent ?? "");
      t.assert("summit holds both figures", summit.includes("285,010") && summit.includes("44,890"), summit.slice(0, 140));
      await page.evaluate(() => document.querySelector('[data-testid="scene-receipt"]')?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 500));
      const receipt = await page.$eval('[data-testid="scene-receipt"]', (el) => el.textContent ?? "");
      t.assert(
        "receipt re-offers the lookup with the privacy line when nothing is stored",
        receipt.includes("Uses your device location once, with your permission. Nothing leaves this page."),
        receipt.slice(0, 160)
      );
      t.assert("study room door", await page.$('[data-testid="ground-study-door"]'));
      const attribution = await page.$eval('[data-testid="colophon-attribution"]', (el) => el.textContent ?? "");
      t.assert("Mapping Inequality attribution verbatim", attribution.includes("Mapping Inequality") && attribution.includes("CC BY-NC 4.0"), attribution.slice(0, 120));
    },
  },
  {
    id: "ground-files-room",
    milestone: "R9",
    tags: ["ground"],
    route: `${GROUND}#room-files:1595`,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-files-room"]', { timeout: 45000 });
      const room = await page.$eval('[data-testid="ground-files-room"]', (el) => el.textContent ?? "");
      t.assert("permalink opens the reading room on the sheet", room.includes("A-35"), room.slice(0, 120));
      await dispatchClick(page, '[data-testid="ground-files-close"]');
      await new Promise((r) => setTimeout(r, 500));
      t.assert("back button closes the room", !(await page.$('[data-testid="ground-files-room"]')));
    },
  },

  {
    id: "ground-pressed-sheet",
    milestone: "R10",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-stage"]', { timeout: 30000 });
      const at = async (sel, settle = 1300) => {
        await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "center", behavior: "instant" }), sel);
        await new Promise((r) => setTimeout(r, settle));
        return page.evaluate(() => {
          const st = document.querySelector('[data-testid="ground-stage"]');
          const svg = document.querySelector("[data-ground-svg]");
          const sheet = document.querySelector('[data-testid="ground-sheet"]');
          return {
            tilt: st?.dataset.tilt,
            press: st?.dataset.press,
            veil: st?.dataset.veil,
            loupeon: st?.getAttribute("data-loupeon"),
            loupekey: st?.getAttribute("data-loupekey"),
            marksmode: st?.dataset.marksmode,
            grid: st?.dataset.gGrid,
            fabric: st?.dataset.gFabric,
            viewW: Number((svg?.getAttribute("viewBox") ?? "0 0 0 0").split(" ")[2]),
            sheetTransform: sheet ? getComputedStyle(sheet).transform : "",
            veilD: (document.querySelector("svg [data-veil]")?.getAttribute("d") ?? "").length,
            title: document.querySelector('[data-testid="ground-titleblock"]')?.textContent ?? "",
            sr: document.querySelector('[data-testid="ground-sr"]')?.textContent ?? "",
            lakeD: (document.querySelector("[data-lake]")?.getAttribute("d") ?? "").length,
            landD: (document.querySelector("[data-land]")?.getAttribute("d") ?? "").length,
          };
        });
      };
      const top = await at("#ch0");
      t.assert("the ground plane ships in the SSR sheet", top.lakeD > 100 && top.landD > 1000, `lake=${top.lakeD} land=${top.landD}`);
      t.assert("first paint is plumb and unpressed", top.tilt === "0" && top.press === "off", JSON.stringify({ tilt: top.tilt, press: top.press }));
      t.assert("the title block names the sheet", top.title.includes("CHICAGO"), top.title.slice(0, 60));
      const plat = await at("#ch1");
      t.assert("the 1833 plat leans and carries the survey grid", plat.tilt === "10" && plat.grid === "on", JSON.stringify({ tilt: plat.tilt, grid: plat.grid }));
      t.assert("the lean is a real transform", plat.sheetTransform !== "none" && plat.sheetTransform !== "", plat.sheetTransform.slice(0, 40));
      const fair = await at("#a1-fair");
      t.assert("the fair's veil lifts Jackson Park", fair.veil === "on" && fair.veilD > 200, `veil=${fair.veil} d=${fair.veilD}`);
      const close = await at("#ch5", 1700);
      t.assert("the paperwork chapter pushes the camera close", close.viewW < 400, `viewW=${close.viewW}`);
      t.assert("marks resolve to readable dots up close", close.marksmode === "dots", close.marksmode);
      const flood = await at("#a3-f1", 1700);
      t.assert("the filing counter reads the first month", flood.title.includes("Sep 1939") && flood.title.includes("of 703"), flood.title.slice(0, 120));
      const press = await at("#a3-s2", 1700);
      t.assert("the press stamps at the underwriting sentence", press.press === "on", press.press);
      t.assert("the rank disclosure prints with the press", press.title.includes("Depth shows grade rank"), press.title.slice(0, 160));
      const pressedFilter = await page.$eval('[data-gfill="D"]', (el) => getComputedStyle(el).filter);
      t.assert("the D fill carries its intaglio filter", pressedFilter.includes("url"), pressedFilter.slice(0, 60));
      const badge = await page.evaluate(() => {
        document.querySelector("#ch6")?.scrollIntoView({ block: "center", behavior: "instant" });
        return new Promise((res) =>
          setTimeout(() => res(document.querySelector('[data-testid="ground-marks-badge"]')?.textContent ?? ""), 1500)
        );
      });
      t.assert("the marks' badge counts the sites at the survey's arrival", badge.includes("32"), badge.slice(0, 60));
      const lawndale = await at("#ch9", 1500);
      t.assert("act five veils to North Lawndale", lawndale.veil === "on" && lawndale.veilD > 100, `veil=${lawndale.veil}`);
      const money = await at("#a6-ledger", 1700);
      t.assert("the finale leans the sheet for the bill", money.tilt === "22", money.tilt);
      const memorial = await at("#ch4", 1500);
      t.assert("the memorial is plumb, unveiled, unpressed in its own moment", memorial.tilt === "0" && memorial.veil === "off", JSON.stringify({ tilt: memorial.tilt, veil: memorial.veil }));
      t.assert("the memorial's stillness is stated for screen readers", memorial.sr.includes("Nothing on the map moves"), memorial.sr.slice(0, 100));
      /* R11 filled ground: the complete geography ships in the sheet */
      const geo = await page.evaluate(() => ({
        suburbs: (document.querySelector("[data-suburbs]")?.getAttribute("d") ?? "").length,
        arterials: (document.querySelector("[data-arterials]")?.getAttribute("d") ?? "").length,
        locals: (document.querySelector("[data-locals]")?.getAttribute("d") ?? "").length,
        hpStreets: (document.querySelector("[data-hp-streets]")?.getAttribute("d") ?? "").length,
        river: (document.querySelector("[data-lake]")?.getAttribute("d") ?? "").length,
      }));
      t.assert(
        "suburb landmass, street fabric, and true water are drawn",
        geo.suburbs > 5000 && geo.arterials > 5000 && geo.locals > 5000 && geo.hpStreets > 3000 && geo.river > 5000,
        JSON.stringify(geo)
      );
      /* R11 lens: the fair and the present-day beats carry the glass */
      const lensFair = await at("#a1-fair", 1500);
      t.assert("the fair's lens is on", lensFair.loupeon === "on", String(lensFair.loupeon));
      const lensToday = await at("#ch11", 1700);
      t.assert("the present-day lens is on with its scene", lensToday.loupeon === "on" && lensToday.loupekey === "today", JSON.stringify({ on: lensToday.loupeon, key: lensToday.loupekey }));
      const lensParts = await page.evaluate(() => ({
        ringR: Number(document.querySelector("[data-loupe-ring]")?.getAttribute("r") ?? 0),
        streets: (document.querySelector('[data-loupe-scene="today"] [data-lp-streets]')?.getAttribute("d") ?? "").length,
        veilLite: (document.querySelector("[data-veil-lite]")?.getAttribute("d") ?? "").length >= 0,
      }));
      t.assert("the lens has geometry inside the glass", lensParts.ringR > 50 && lensParts.streets > 2000, JSON.stringify(lensParts));
    },
  },
  {
    id: "ground-hardening",
    milestone: "R10",
    tags: ["ground"],
    route: GROUND,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-stage"]', { timeout: 30000 });
      /* the intaglio must be a true inner shadow: shape minus its own
         offset blur (the audit caught the raised-plate inversion) */
      const composite = await page.$eval("#ground-press-d feComposite", (el) => ({
        in: el.getAttribute("in"),
        in2: el.getAttribute("in2"),
        op: el.getAttribute("operator"),
      }));
      t.assert(
        "the press filter is an inner shadow, not a raised plate",
        composite.in === "SourceAlpha" && composite.in2 === "blur" && composite.op === "out",
        JSON.stringify(composite)
      );
      /* a camera move must actually fly: the tween flag rises after a
         cam change and settles off, and mid-flight the camera group
         carries a real transform (the whole drawing stays mounted) */
      await page.evaluate(() => document.querySelector("#ch6")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 1200));
      const flight = await page.evaluate(
        () =>
          new Promise((res) => {
            document.querySelector("#ch5")?.scrollIntoView({ block: "center", behavior: "instant" });
            const started = Date.now();
            const sample = () => {
              const stage = document.querySelector('[data-testid="ground-stage"]');
              const g = document.querySelector("[data-camera]");
              if (stage?.dataset.tween === "on") {
                return res({
                  sawTween: true,
                  transform: g ? getComputedStyle(g).transform : "",
                  areasMounted: document.querySelectorAll("[data-aid]").length,
                });
              }
              if (Date.now() - started > 2500) return res({ sawTween: false });
              setTimeout(sample, 40);
            };
            sample();
          })
      );
      t.assert("a cam change takes flight (data-tween rises)", flight.sawTween, JSON.stringify(flight));
      t.assert(
        "mid-flight the camera group is transformed, the city stays mounted",
        flight.sawTween && flight.transform !== "none" && flight.areasMounted >= 690,
        JSON.stringify(flight)
      );
      await new Promise((r) => setTimeout(r, 1400));
      const settled = await page.$eval('[data-testid="ground-stage"]', (el) => el.dataset.tween);
      t.assert("the flight settles", settled === "off", String(settled));
      /* the money beats stand exactly two towers at true anchors with
         the one sanctioned rust cap and the disclosed scale */
      await page.evaluate(() => document.querySelector("#a6-ledger")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 1800));
      t.assert("the Lawndale tower stands", await page.$('[data-testid="gtower-north-lawndale"]'));
      t.assert("the Woodlawn tower stands", await page.$('[data-testid="gtower-woodlawn"]'));
      const towers = await page.$$eval(".gtower", (els) => els.length);
      t.assert("exactly two dollar columns", towers === 2, `towers=${towers}`);
      t.assert("the sliver scale is disclosed", await page.$('[data-testid="ground-towers-legend"]'));
      const plates = await page.$$eval(".gtower [data-fact-id]", (els) => els.map((e) => e.getAttribute("data-fact-id")));
      t.assert(
        "both plates resolve through the registry",
        plates.includes("contracts.avg_overpayment_71000") && plates.includes("present.woodlawn_prices"),
        JSON.stringify(plates)
      );
      /* historical ledger years are ink; rust is the present's alone */
      await page.evaluate(() => document.querySelector("#ch2")?.scrollIntoView({ block: "center", behavior: "instant" }));
      await new Promise((r) => setTimeout(r, 900));
      const yearColor = await page.$eval('[data-testid="ground-ledger-rail"] .glr-year', (el) => getComputedStyle(el).color);
      t.assert(
        "a historical ledger year is not rust",
        !/168,\s*80,\s*47/.test(yearColor),
        yearColor
      );
      /* a pane resize re-derives the content-box vars */
      const before = await page.$eval('[data-testid="ground-stage"]', (el) => el.style.getPropertyValue("--gsv-w"));
      await page.setViewport({ width: 1100, height: 800 });
      await new Promise((r) => setTimeout(r, 700));
      const after = await page.$eval('[data-testid="ground-stage"]', (el) => el.style.getPropertyValue("--gsv-w"));
      t.assert("resize re-derives the drawn content box", before !== after && after !== "", `${before} -> ${after}`);
      await page.setViewport({ width: 1280, height: 800 });
    },
  },
  {
    id: "ground-deeplink",
    milestone: "R9",
    tags: ["ground"],
    route: `${GROUND}#ch6`,
    async run(page, t) {
      await page.waitForSelector('[data-testid="ground-root"]', { timeout: 30000 });
      // wait until the re-scroll settles (document stops growing and
      // the target rests at the viewport top band), up to 14s
      const landed = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const started = Date.now();
            const check = () => {
              const el = document.getElementById("ch6");
              if (el) {
                const top = el.getBoundingClientRect().top;
                if (top > -40 && top < window.innerHeight * 0.6) return resolve({ ok: true, top });
              }
              if (Date.now() - started > 14000) {
                return resolve({ ok: false, top: el ? el.getBoundingClientRect().top : null });
              }
              setTimeout(check, 400);
            };
            check();
          })
      );
      t.assert("a cold #ch6 deep link lands on the federal chapter", landed.ok, JSON.stringify(landed));
      const red = await page.$eval('[data-testid="ground-spine"]', (el) => el.dataset.red);
      t.assert("the spine is red where the deep link lands", red === "on", String(red));
    },
  },
];
