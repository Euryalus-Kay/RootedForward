/* Round-four live verification for the Studio.
   Drives /admin/studio headless against the local dev server:
   1. loads the demo project and reads the autosaved snapshot
   2. asks the chat a question (expects an answer with NO timeline change)
   3. asks for an edit (expects title change WITH subtitles preserved)
   4. runs the Polish pass (Critic on opus-4-8 under the default preset)
   5. switches the orchestration preset and checks the stage chips
   Saves screenshots to /tmp/rf-round4. */
import puppeteer from "puppeteer";
import fs from "fs";

const BASE = "http://localhost:3000";
const OUT = "/tmp/rf-round4";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const ok = (name, pass, note = "") => {
  results.push({ name, pass, note });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? `  (${note})` : ""}`);
};

// Chrome 146's new headless mode never reveals Next dev's streamed
// suspense content; the shell headless mode renders it fine.
const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--use-gl=angle", "--enable-unsafe-swiftshader", "--mute-audio"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1700, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 200)));

const clickByText = async (text, tag = "button") => {
  const clicked = await page.evaluate(
    (t, tg) => {
      const el = [...document.querySelectorAll(tg)].find((b) =>
        b.textContent.trim().includes(t)
      );
      if (el) {
        el.click();
        return true;
      }
      return false;
    },
    text,
    tag
  );
  if (!clicked) throw new Error(`No ${tag} with text "${text}"`);
};

const readSnapshot = () =>
  page.evaluate(() => {
    const id = localStorage.getItem("rf-studio-active-project");
    const raw = id && localStorage.getItem("rf-studio-project:" + id);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      title: p.sequence?.title ?? null,
      segs: p.sequence?.segments?.length ?? 0,
      subs: p.sequence?.subtitles?.length ?? 0,
      voiceover: Boolean(p.sequence?.voiceover),
    };
  });

const chatCount = () =>
  page.evaluate(
    () => document.querySelectorAll('[class*="max-w-[92%]"]').length
  );

const lastChat = () =>
  page.evaluate(() => {
    const all = document.querySelectorAll('[class*="max-w-[92%]"]');
    return all.length ? all[all.length - 1].textContent.trim() : "";
  });

const sendChat = async (text) => {
  const before = await chatCount();
  await page.evaluate((t) => {
    const ta = [...document.querySelectorAll("textarea")].find((el) =>
      el.placeholder.startsWith("Direct a change")
    );
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    ).set;
    setter.call(ta, t);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
  await page.keyboard.press("Tab"); // blur nothing; keep focus handling simple
  await page.evaluate(() => {
    const ta = [...document.querySelectorAll("textarea")].find((el) =>
      el.placeholder.startsWith("Direct a change")
    );
    ta.focus();
  });
  await page.keyboard.press("Enter");
  // user bubble + assistant bubble
  await page.waitForFunction(
    (n) => document.querySelectorAll('[class*="max-w-[92%]"]').length >= n + 2,
    { timeout: 120000 },
    before
  );
};

const criticChip = () =>
  page.evaluate(() => {
    const li = [...document.querySelectorAll("li")].find((el) =>
      el.textContent.includes("Critic")
    );
    const chip = li?.querySelector("span");
    return chip ? chip.textContent.trim() : null;
  });

try {
  await page.goto(`${BASE}/admin/studio`, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  /* 1. demo project + autosave status */
  await clickByText("Load demo project");
  await page.waitForFunction(
    () => document.body.textContent.includes("Autosaved in this browser"),
    { timeout: 20000 }
  );
  await new Promise((r) => setTimeout(r, 1500));
  const base = await readSnapshot();
  ok(
    "demo loads and autosave status shows",
    Boolean(base && base.segs > 0),
    `title "${base?.title}", ${base?.segs} segments, ${base?.subs} subtitles`
  );

  /* model chips under the default preset */
  const chipBefore = await criticChip();
  ok(
    "Critic runs on Opus under the default preset",
    chipBefore === "opus-4-8",
    `chip reads "${chipBefore}"`
  );

  /* 2. ask-mode question */
  await sendChat(
    "How long is the cut and which segment plays in 360? Do not change anything."
  );
  const afterAsk = await readSnapshot();
  const askReply = await lastChat();
  ok(
    "chat answers a question without touching the timeline",
    afterAsk.title === base.title &&
      afterAsk.segs === base.segs &&
      afterAsk.subs === base.subs,
    askReply.slice(0, 140)
  );

  /* 3. real edit preserves subtitles */
  await sendChat("Retitle the cut Beneath the Line.");
  await new Promise((r) => setTimeout(r, 1200));
  const afterEdit = await readSnapshot();
  ok(
    "an edit lands and subtitles survive the new schema",
    afterEdit.title === "Beneath the Line" && afterEdit.subs === base.subs,
    `title "${afterEdit.title}", ${afterEdit.subs}/${base.subs} subtitles`
  );

  /* 4. polish pass (Critic, opus-4-8) */
  const beforePolish = await chatCount();
  await clickByText("Polish pass");
  await page.waitForFunction(
    (n) => document.querySelectorAll('[class*="max-w-[92%]"]').length > n,
    { timeout: 120000 },
    beforePolish
  );
  const polishMsg = await lastChat();
  ok(
    "polish pass returns a Critic verdict",
    /approved|Polish pass applied/i.test(polishMsg),
    polishMsg.slice(0, 140)
  );
  const criticTimed = await page.evaluate(() => {
    const li = [...document.querySelectorAll("li")].find((el) =>
      el.textContent.includes("Critic")
    );
    return /\d+\.\ds/.test(li?.textContent ?? "");
  });
  ok("Critic stage shows a live timing trace", criticTimed);

  await page.screenshot({ path: `${OUT}/studio-round4.png`, fullPage: false });

  /* 5. orchestration switch */
  await page.select("#studio-orchestration", "fable");
  await new Promise((r) => setTimeout(r, 400));
  const chipAfter = await criticChip();
  ok(
    "switching the preset reroutes the Critic",
    chipAfter === "fable-5",
    `chip reads "${chipAfter}"`
  );
  const persisted = await page.evaluate(() =>
    localStorage.getItem("rf-studio-orchestration")
  );
  ok("preset choice persists", persisted === "fable");
  await page.select("#studio-orchestration", "blend");

  /* agent panel close-up */
  const panel = await page.$('h2 ::-p-text(Agent pipeline)');
  if (panel) {
    const box = await page.evaluate(() => {
      const h = [...document.querySelectorAll("h2")].find((el) =>
        el.textContent.includes("Agent pipeline")
      );
      const r = h.closest("div.flex.h-full").getBoundingClientRect();
      return { x: r.x, y: Math.max(0, r.y), width: r.width, height: Math.min(r.height, 1500) };
    });
    await page.screenshot({ path: `${OUT}/agent-panel-round4.png`, clip: box });
  }
} catch (e) {
  ok("script completed", false, String(e).slice(0, 300));
}

console.log("---");
const failed = results.filter((r) => !r.pass);
console.log(
  failed.length === 0
    ? `ALL ${results.length} CHECKS PASSED`
    : `${failed.length}/${results.length} CHECKS FAILED`
);
await browser.close();
process.exit(failed.length === 0 ? 0 : 1);
