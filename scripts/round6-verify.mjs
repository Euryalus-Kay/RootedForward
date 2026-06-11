/* Round-six verification: the AI-Premiere fixes.
   Part A hits /api/studio/agent directly so every action's structured-
   output schema is proven to compile (the grammar-size cliff is real).
   Part B drives the UI headless: clickability at laptop sizes (the
   buried "3 variations" button), ask-mode chat, a STRUCTURAL edit that
   adds a bin clip to the timeline, the Design-titles patch pass, a
   simulated title drag on the monitor, and the dock mute control. */
import puppeteer from "puppeteer";

const BASE = "http://localhost:3000";
const results = [];
const ok = (name, pass, note = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? `  (${String(note).slice(0, 150)})` : ""}`);
};

/* ----------------------------- Part A ----------------------------- */

const seq = {
  version: 1, title: "T", notes: "", aspect: "16:9", music: null,
  voiceover: null,
  subtitles: [{ id: "cue-1", startSec: 0, endSec: 2, text: "hello" }],
  segments: [{
    id: "seg-1", clipId: "c1", mode: "2d", inSec: 0, outSec: 4, speed: 1,
    transitionIn: { type: "cut", durationSec: 0 }, kenBurns: null,
    panoMotion: null, filter: null, audio: null,
    overlays: [{ kind: "title", text: "Hi", startSec: 0.5, endSec: 3, position: "center", style: { size: "lg", color: "cream", background: false }, anim: "slide-up" }],
    muted: true,
    transform: { scale: 1.1, xPct: 2, yPct: 0, rotateDeg: 0, fit: "cover" },
  }],
};
const clips = [
  { id: "c1", name: "clip.mp4", kind: "video", durationSec: 8, is360: false, analysis: null },
  { id: "c2", name: "extra.mp4", kind: "video", durationSec: 6, is360: false, analysis: null },
];

const call = async (body) => {
  const r = await fetch(`${BASE}/api/studio/agent`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

console.log("--- Part A: schema compile + behavior smoke ---");
{
  const r = await call({ action: "direct", brief: "One short test cut.", clips });
  ok("direct compiles and returns a cut", r.status === 200 && r.json.result?.segments?.length > 0, r.json.message);
}
{
  const r = await call({ action: "revise", instruction: "How many segments? Change nothing.", brief: "t", sequence: seq, clips, chatContext: [] });
  ok("revise ask-mode compiles (sequence null)", r.status === 200 && r.json.result?.sequence === null, r.json.message ?? r.json.result?.reply);
}
{
  const r = await call({ action: "revise", instruction: "Add the extra.mp4 clip as a new 3 second segment at the end.", brief: "t", sequence: seq, clips, chatContext: [] });
  const s2 = r.json.result?.sequence;
  const added = s2?.segments?.length === 2 && s2.segments.some((g) => g.clipId === "c2");
  const preserved = s2?.segments?.[0]?.transform?.scale === 1.1;
  ok("revise adds a bin clip structurally", r.status === 200 && added, r.json.message ?? `segs=${s2?.segments?.length}`);
  ok("manual transform survives the AI pass", Boolean(preserved), JSON.stringify(s2?.segments?.[0]?.transform ?? null));
}
{
  const r = await call({ action: "critique", brief: "t", sequence: seq, clips });
  ok("critique compiles", r.status === 200 && ["approve", "revise"].includes(r.json.result?.verdict), r.json.message ?? r.json.result?.verdict);
}
{
  const r = await call({ action: "revise-segment", instruction: "Slow to 0.75.", brief: "t", segmentId: "seg-1", sequence: seq, clips });
  const kept = r.json.result?.segment?.transform?.scale === 1.1;
  ok("revise-segment compiles and keeps transform", r.status === 200 && kept, r.json.message ?? JSON.stringify(r.json.result?.segment?.transform));
}
{
  const r = await call({ action: "overlays", brief: "Underwater teaser", sequence: seq, clips });
  const items = r.json.result?.items;
  const hasCoords = items?.[0]?.overlays?.every((o) => typeof o.xPct === "number");
  ok("overlays patch action compiles with coordinates", r.status === 200 && Array.isArray(items) && (items.length === 0 || hasCoords), r.json.message ?? `items=${items?.length}`);
}
{
  const r = await call({ action: "script", brief: "t", sequence: seq, clips });
  ok("script compiles", r.status === 200 && typeof r.json.result?.narration === "string", r.json.message);
}

/* ----------------------------- Part B ----------------------------- */

console.log("--- Part B: UI ---");
const browser = await puppeteer.launch({
  headless: "shell",
  args: ["--mute-audio"],
});

const clickable = async (page, text) =>
  page.evaluate(async (t) => {
    const el = [...document.querySelectorAll("button")].find((b) =>
      b.textContent.trim().toLowerCase().includes(t.toLowerCase())
    );
    if (!el) return "missing";
    // Reachable means: scrollable into view AND hit-testable there.
    el.scrollIntoView({ block: "nearest" });
    await new Promise((r) => setTimeout(r, 120));
    const r2 = el.getBoundingClientRect();
    if (r2.width === 0 || r2.bottom > window.innerHeight || r2.top < 0)
      return "offscreen";
    const hit = document.elementFromPoint(r2.x + r2.width / 2, r2.y + r2.height / 2);
    return el === hit || el.contains(hit) || hit?.contains(el)
      ? "clickable"
      : `covered by ${hit?.tagName}.${(hit?.className || "").toString().slice(0, 40)}`;
  }, text);

const loadDemo = async (page) => {
  await page.goto(`${BASE}/admin/studio`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await page.waitForFunction(() => document.body.innerText.includes("Load demo project"), { timeout: 30000 });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Load demo project")).click();
  });
  await new Promise((r) => setTimeout(r, 3000));
};

try {
  /* Clickability at laptop sizes (the round-five bug) */
  for (const [w, h] of [[1280, 700], [1280, 800], [1440, 900]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h });
    await loadDemo(page);
    const states = {};
    for (const label of ["3 VARIATIONS", "Polish pass", "Design titles", "REGENERATE"]) {
      states[label] = await clickable(page, label);
    }
    const chatReachable = await page.evaluate(() => {
      const ta = [...document.querySelectorAll("textarea")].find((el) =>
        el.placeholder.startsWith("Direct a change")
      );
      if (!ta) return false;
      ta.scrollIntoView({ block: "nearest" });
      const r = ta.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return ta === hit || ta.contains(hit);
    });
    const allOk = Object.values(states).every((v) => v === "clickable");
    ok(`every AI control reachable at ${w}x${h}`, allOk && chatReachable, JSON.stringify(states));
    await page.close();
  }

  /* Live UI flows at full size */
  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 945 });
  await loadDemo(page);

  const readDoc = () =>
    page.evaluate(() => {
      const id = localStorage.getItem("rf-studio-active-project");
      const raw = id && localStorage.getItem("rf-studio-project:" + id);
      return raw ? JSON.parse(raw).sequence : null;
    });

  /* Dock mute control present and wired */
  {
    const before = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        (x.title || "").includes("ute the monitor")
      );
      return b ? b.title : null;
    });
    await page.evaluate(() => {
      [...document.querySelectorAll("button")]
        .find((x) => (x.title || "").includes("ute the monitor"))
        ?.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const after = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        (x.title || "").includes("ute the monitor")
      );
      return b ? b.title : null;
    });
    ok("dock mute button exists and toggles (sound on by default)", before === "Mute the monitor" && after === "Unmute the monitor", `${before} -> ${after}`);
    await page.evaluate(() => {
      [...document.querySelectorAll("button")]
        .find((x) => (x.title || "").includes("ute the monitor"))
        ?.click();
    });
  }

  /* Title drag on the monitor */
  {
    await page.evaluate(() => {
      Element.prototype.setPointerCapture = () => {};
      const seekBtn = null;
      void seekBtn;
    });
    const before = await readDoc();
    const startOverlay = before.segments[0].overlays?.[0] ?? null;
    // The demo title appears shortly after 0s; nudge the playhead so
    // the overlay is on screen, then grab it.
    await page.keyboard.press("ArrowRight");
    await new Promise((r) => setTimeout(r, 600));
    const dragged = await page.evaluate(() => {
      const handle = document.querySelector('[title="Drag to position"]');
      if (!handle) return "no handle";
      const r = handle.getBoundingClientRect();
      const opts = (x, y) => ({
        bubbles: true, cancelable: true, pointerId: 1,
        clientX: x, clientY: y, isPrimary: true,
      });
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      handle.dispatchEvent(new PointerEvent("pointerdown", opts(cx, cy)));
      handle.dispatchEvent(new PointerEvent("pointermove", opts(cx + 120, cy + 80)));
      handle.dispatchEvent(new PointerEvent("pointerup", opts(cx + 120, cy + 80)));
      return "dragged";
    });
    await new Promise((r) => setTimeout(r, 800));
    if (dragged !== "dragged") console.log("   drag handle state:", dragged);
    const after = await readDoc();
    const moved = after.segments.some((s) =>
      (s.overlays ?? []).some((o) => typeof o.xPct === "number" && typeof o.yPct === "number")
    );
    ok("dragging a title writes free coordinates into the doc", dragged === "dragged" && moved && Boolean(startOverlay), JSON.stringify(after.segments[0].overlays?.[0] && { x: after.segments[0].overlays[0].xPct, y: after.segments[0].overlays[0].yPct }));
  }

  /* Design titles pass (live AI) */
  {
    const chatBefore = await page.evaluate(() => document.querySelectorAll('[class*="max-w-[92%]"]').length);
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Design titles").click();
    });
    await page.waitForFunction(
      (n) => document.querySelectorAll('[class*="max-w-[92%]"]').length > n,
      { timeout: 150000 },
      chatBefore
    );
    const doc = await readDoc();
    const anyCoords = doc.segments.some((s) => (s.overlays ?? []).some((o) => typeof o.xPct === "number"));
    ok("Design titles pass applies a text layer", anyCoords, `overlay sets: ${doc.segments.map((s) => (s.overlays ?? []).length).join(",")}`);
  }

  /* Structural edit via chat (live AI) */
  {
    const before = await readDoc();
    const chatBefore = await page.evaluate(() => document.querySelectorAll('[class*="max-w-[92%]"]').length);
    await page.evaluate(() => {
      const ta = [...document.querySelectorAll("textarea")].find((el) => el.placeholder.startsWith("Direct a change"));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
      setter.call(ta, "Add the lakebed test clip again at the very end as a 3 second closing shot.");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
      ta.focus();
    });
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (n) => document.querySelectorAll('[class*="max-w-[92%]"]').length >= n + 2,
      { timeout: 180000 },
      chatBefore
    );
    await new Promise((r) => setTimeout(r, 1000));
    const after = await readDoc();
    ok("chat adds a clip to the timeline (AI structural edit)", after.segments.length === before.segments.length + 1, `${before.segments.length} -> ${after.segments.length}`);
  }

  await page.screenshot({ path: "/tmp/rf-round6-final.png" });
  await page.close();
} catch (e) {
  ok("UI part completed", false, String(e).slice(0, 250));
}

console.log("---");
const failed = results.filter((r) => !r.pass);
console.log(failed.length === 0 ? `ALL ${results.length} CHECKS PASSED` : `${failed.length}/${results.length} CHECKS FAILED`);
await browser.close();
process.exit(failed.length === 0 ? 0 : 1);
