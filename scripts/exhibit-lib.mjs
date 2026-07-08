// ------------------------------------------------------------------
// Shared puppeteer helpers for the exhibit verify harness.
// Conventions proven in round4/6/7-verify.mjs: headless "shell"
// (Chrome's new headless never reveals Next dev streamed suspense),
// muted audio, PointerEvent dispatch with pointer capture stubbed.
// ------------------------------------------------------------------
import puppeteer from "puppeteer";

export const BASE = process.env.RF_BASE || "http://localhost:3000";

export async function launch() {
  return puppeteer.launch({
    headless: "shell",
    args: [
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=angle",
      "--enable-unsafe-swiftshader",
      "--window-size=1440,900",
    ],
    defaultViewport: { width: 1440, height: 900 },
  });
}

/** settle a freshly navigated exhibit page. A debug page is not "ready"
 * until the testability contract has hydrated; a fixed sleep loses races
 * to first-load hydration under suite load (found at the go-live gate). */
export async function waitReady(page, { scroll = false } = {}) {
  await new Promise((r) => setTimeout(r, 1200));
  if (/[?&]debug=1/.test(page.url())) {
    await page
      .waitForFunction(() => !!window.__exhibit, { timeout: 20000 })
      .catch(() => {}); // scenarios assert the contract themselves and report properly
  }
  if (scroll) {
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.7;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 400));
  }
}

/** read the exhibit state via the debug contract */
export async function exhibitState(page) {
  return page.evaluate(() => window.__exhibit?.state() ?? null);
}

export async function exhibitGoto(page, chapterId) {
  await page.evaluate((id) => window.__exhibit?.goto(id), chapterId);
  await new Promise((r) => setTimeout(r, 250));
}

export async function fire(page, action) {
  await page.evaluate((a) => window.__exhibit?.fire(a), action);
  await new Promise((r) => setTimeout(r, 120));
}

/** PointerEvent drag with capture stubbed (round7 pattern) */
export async function drag(page, selector, dx, dy, steps = 8) {
  await page.evaluate(
    async ({ selector, dx, dy, steps }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`drag target not found ${selector}`);
      if (!el.hasPointerCapture) el.hasPointerCapture = () => false;
      el.setPointerCapture = () => {};
      el.releasePointerCapture = () => {};
      const r = el.getBoundingClientRect();
      const sx = r.left + r.width / 2;
      const sy = r.top + r.height / 2;
      const fireEvt = (type, x, y) =>
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            buttons: type === "pointerup" ? 0 : 1,
          })
        );
      fireEvt("pointerdown", sx, sy);
      for (let i = 1; i <= steps; i++) {
        fireEvt("pointermove", sx + (dx * i) / steps, sy + (dy * i) / steps);
        await new Promise((r2) => setTimeout(r2, 16));
      }
      fireEvt("pointerup", sx + dx, sy + dy);
    },
    { selector, dx, dy, steps }
  );
  await new Promise((r) => setTimeout(r, 150));
}

/** synthetic dispatch click: required for controls under the fixed caption
 * bar / spine overlay where real-mouse page.click misses (bottom ~220px) */
export async function dispatchClick(page, selector) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return !!el;
  }, selector);
}

/** collect console errors, filtered of known dev noise */
export function trackConsoleErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("favicon")) return;
    if (text.includes("Download the React DevTools")) return;
    errors.push(text);
  });
  page.on("pageerror", (err) => errors.push(`pageerror ${err.message}`));
  return errors;
}

/** tiny assertion collector shared by scenarios */
export function makeT(scenarioId, results) {
  return {
    assert(name, cond, note = "") {
      const pass = !!cond;
      results.push({ scenario: scenarioId, name, pass, note });
      const mark = pass ? "  ok " : "  FAIL";
      console.log(`${mark} ${scenarioId} :: ${name}${note && !pass ? ` (${note})` : ""}`);
      return pass;
    },
  };
}
