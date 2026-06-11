/* Round-seven verification: timeline interaction surface.
   No AI calls; pure pointer/keyboard/wheel simulation against the
   demo project. Covers: pointer-based clip moving, click-to-select,
   drag from the media bin onto the timeline, ctrl+wheel zoom, wheel
   pan, Delete key, audio-lane offset drag, trim regression, empty-
   strip click-to-seek, and playhead follow. */
import puppeteer from "puppeteer";

const BASE = "http://localhost:3000";
const results = [];
const ok = (name, pass, note = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? `  (${String(note).slice(0, 130)})` : ""}`);
};

const browser = await puppeteer.launch({ headless: "shell", args: ["--mute-audio"] });
const page = await browser.newPage();
await page.setViewport({ width: 1512, height: 945 });
await page.goto(`${BASE}/admin/studio`, { waitUntil: "networkidle2", timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle2" });
await page.waitForFunction(() => document.body.innerText.includes("Load demo project"), { timeout: 30000 });
await page.evaluate(() => {
  Element.prototype.setPointerCapture = () => {};
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Load demo project")).click();
});
await new Promise((r) => setTimeout(r, 3000));

const readSeq = () =>
  page.evaluate(() => {
    const id = localStorage.getItem("rf-studio-active-project");
    const raw = id && localStorage.getItem("rf-studio-project:" + id);
    return raw ? JSON.parse(raw).sequence : null;
  });

const blocks = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('div[role="button"]')]
      .filter((el) => el.style.left !== "")
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })
  );

const pointerSeq = (el, steps) =>
  page.evaluate(
    (sel, idx, list) => {
      const target = [...document.querySelectorAll(sel)].filter(
        (e) => e.style.left !== "" || !sel.includes("role")
      )[idx];
      if (!target) return "missing target";
      for (const [type, x, y] of list) {
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            isPrimary: true,
            button: 0,
            clientX: x,
            clientY: y,
          })
        );
      }
      return "ok";
    },
    el.sel,
    el.idx,
    steps
  );

try {
  /* 1. Pointer-based clip move: drag block 0 past block 1 */
  {
    const before = await readSeq();
    const bs = await blocks();
    const from = { x: bs[0].x + bs[0].w / 2, y: bs[0].y + bs[0].h / 2 };
    const to = { x: bs[1].x + bs[1].w * 0.8, y: from.y };
    const res = await pointerSeq({ sel: 'div[role="button"]', idx: 0 }, [
      ["pointerdown", from.x, from.y],
      ["pointermove", from.x + 8, from.y],
      ["pointermove", to.x, to.y],
      ["pointerup", to.x, to.y],
    ]);
    await new Promise((r) => setTimeout(r, 700));
    const after = await readSeq();
    ok(
      "drag a clip along the timeline to move it",
      res === "ok" && after.segments[1].id === before.segments[0].id && after.segments[0].id === before.segments[1].id,
      `${before.segments.map((s) => s.id).join(",")} -> ${after.segments.map((s) => s.id).join(",")}`
    );
    // put it back
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.title === "Undo (Ctrl+Z)")?.click();
    });
    await new Promise((r) => setTimeout(r, 500));
  }

  /* 2. Plain click still selects (no accidental move) */
  {
    const bs = await blocks();
    const c = { x: bs[2].x + bs[2].w / 2, y: bs[2].y + bs[2].h / 2 };
    await pointerSeq({ sel: 'div[role="button"]', idx: 2 }, [
      ["pointerdown", c.x, c.y],
      ["pointerup", c.x, c.y],
    ]);
    await page.evaluate((pt) => {
      const el = document.elementFromPoint(pt.x, pt.y);
      el?.closest('div[role="button"]')?.click();
    }, c);
    await new Promise((r) => setTimeout(r, 400));
    const selected = await page.evaluate(() =>
      [...document.querySelectorAll('div[role="button"]')]
        .filter((el) => el.style.left !== "")
        .map((el) => /(^|\s)border-rust(\s|$)/.test(el.className))
    );
    ok("plain click selects without moving", selected[2] === true && selected.filter(Boolean).length === 1, JSON.stringify(selected));
  }

  /* 3. Drag a clip from the media bin onto the timeline */
  {
    const before = await readSeq();
    const res = await page.evaluate(() => {
      const seq = JSON.parse(
        localStorage.getItem(
          "rf-studio-project:" + localStorage.getItem("rf-studio-active-project")
        )
      );
      const usedFirst = seq.media.find((m) => m.kind !== "audio");
      if (!usedFirst) return "no clip";
      const strip = document.querySelector(".overflow-x-auto.px-4.pt-2");
      if (!strip) return "no strip";
      const blocks = [...strip.querySelectorAll('div[role="button"]')].filter((el) => el.style.left !== "");
      const r1 = blocks[1].getBoundingClientRect();
      const dt = new DataTransfer();
      dt.setData("application/x-rf-clip", usedFirst.id);
      const opts = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r1.x + 2, clientY: r1.y + 10 };
      strip.dispatchEvent(new DragEvent("dragover", opts));
      strip.dispatchEvent(new DragEvent("drop", opts));
      return "dropped " + usedFirst.id;
    });
    await new Promise((r) => setTimeout(r, 700));
    const after = await readSeq();
    ok(
      "drag from the media bin inserts a clip at the drop point",
      res.startsWith("dropped") && after.segments.length === before.segments.length + 1,
      `${before.segments.length} -> ${after.segments.length} (${res})`
    );
  }

  /* 4. Ctrl+wheel zooms around the cursor */
  {
    const wBefore = (await blocks())[0].w;
    await page.evaluate(() => {
      const strip = document.querySelector(".overflow-x-auto.px-4.pt-2");
      const r = strip.getBoundingClientRect();
      strip.dispatchEvent(
        new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -120, clientX: r.x + 200, clientY: r.y + 40 })
      );
    });
    await new Promise((r) => setTimeout(r, 400));
    const wAfter = (await blocks())[0].w;
    ok("ctrl+wheel zooms the timeline", wAfter > wBefore, `block width ${Math.round(wBefore)} -> ${Math.round(wAfter)}`);
  }

  /* 5. Plain wheel pans horizontally */
  {
    // zoom in further so the strip overflows
    await page.evaluate(() => {
      const strip = document.querySelector(".overflow-x-auto.px-4.pt-2");
      const r = strip.getBoundingClientRect();
      for (let i = 0; i < 8; i++) {
        strip.dispatchEvent(
          new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -120, clientX: r.x + 200, clientY: r.y + 40 })
        );
      }
    });
    await new Promise((r) => setTimeout(r, 500));
    const scrolled = await page.evaluate(() => {
      const strip = document.querySelector(".overflow-x-auto.px-4.pt-2");
      strip.scrollLeft = 0;
      strip.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 240, clientX: 600, clientY: strip.getBoundingClientRect().y + 40 }));
      return strip.scrollLeft;
    });
    ok("plain wheel pans the timeline", scrolled > 0, `scrollLeft ${scrolled}`);
    await page.evaluate(() => {
      const strip = document.querySelector(".overflow-x-auto.px-4.pt-2");
      strip.scrollLeft = 0;
    });
  }

  /* 6. Empty-strip click parks the playhead */
  {
    const before = await page.evaluate(() => document.body.innerText.match(/(\d+:\d+\.\d)/)?.[1]);
    await page.evaluate(() => {
      const row = document.querySelector(".relative.flex.h-\\[74px\\]");
      const r = row.getBoundingClientRect();
      row.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 2, clientX: r.x + r.width - 8, clientY: r.y + 60 })
      );
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 2 }));
    });
    await new Promise((r) => setTimeout(r, 500));
    const after = await page.evaluate(() => document.body.innerText.match(/(\d+:\d+\.\d)/)?.[1]);
    ok("clicking empty timeline seeks the playhead", before === "0:00.0" && after !== "0:00.0", `${before} -> ${after}`);
  }

  /* 7. Audio lane drag shifts the music offset */
  {
    const before = await readSeq();
    const res = await page.evaluate(() => {
      const lane = document.querySelector('[title="Music bed. Drag to change when it starts."]');
      if (!lane) return "no lane";
      const r = lane.getBoundingClientRect();
      const o = (x) => ({ bubbles: true, cancelable: true, pointerId: 3, isPrimary: true, clientX: x, clientY: r.y + 8 });
      lane.dispatchEvent(new PointerEvent("pointerdown", o(r.x + 60)));
      lane.dispatchEvent(new PointerEvent("pointermove", o(r.x + 200)));
      lane.dispatchEvent(new PointerEvent("pointerup", o(r.x + 200)));
      return "ok";
    });
    await new Promise((r) => setTimeout(r, 600));
    const after = await readSeq();
    ok(
      "dragging the music lane sets its start offset",
      res === "ok" && (after.music?.offsetSec ?? 0) > (before.music?.offsetSec ?? 0),
      `offset ${before.music?.offsetSec ?? 0} -> ${after.music?.offsetSec ?? 0}`
    );
    await page.evaluate(() => {
      [...document.querySelectorAll("button")].find((b) => b.title === "Undo (Ctrl+Z)")?.click();
    });
  }

  /* 8. Trim handles still work */
  {
    const before = await readSeq();
    const res = await page.evaluate(() => {
      const block = [...document.querySelectorAll('div[role="button"]')].filter((el) => el.style.left !== "")[0];
      const handle = block.querySelectorAll("[data-trim]")[1];
      if (!handle) return "no handle";
      const r = handle.getBoundingClientRect();
      const o = (x) => ({ bubbles: true, cancelable: true, pointerId: 4, isPrimary: true, clientX: x, clientY: r.y + 20 });
      handle.dispatchEvent(new PointerEvent("pointerdown", o(r.x + 1)));
      // moves are handled by the scroller's onPointerMove via bubbling
      handle.dispatchEvent(new PointerEvent("pointermove", o(r.x - 60)));
      handle.dispatchEvent(new PointerEvent("pointerup", o(r.x - 60)));
      return "ok";
    });
    await new Promise((r) => setTimeout(r, 600));
    const after = await readSeq();
    ok(
      "trim handles still trim",
      res === "ok" && after.segments[0].outSec < before.segments[0].outSec,
      `out ${before.segments[0].outSec} -> ${after.segments[0].outSec}`
    );
  }

  /* 9. Delete key removes the selected segment */
  {
    const before = await readSeq();
    await page.evaluate(() => {
      const block = [...document.querySelectorAll('div[role="button"]')].filter((el) => el.style.left !== "")[1];
      block.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.keyboard.press("Delete");
    await new Promise((r) => setTimeout(r, 600));
    const after = await readSeq();
    ok("Delete removes the selected clip", after.segments.length === before.segments.length - 1, `${before.segments.length} -> ${after.segments.length}`);
  }

  /* 10. Playhead follow during playback */
  {
    const followed = await page.evaluate(async () => {
      const strip = document.querySelector(".overflow-x-auto.px-4.pt-2");
      // park the playhead at 0 first (an earlier test left it at the end)
      const ruler = strip.querySelector(".relative.h-6.cursor-pointer");
      const rr = ruler.getBoundingClientRect();
      ruler.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 9, clientX: rr.x + 1, clientY: rr.y + 3 })
      );
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 9 }));
      await new Promise((r) => setTimeout(r, 300));
      strip.scrollLeft = strip.scrollWidth; // playhead now far left of view
      const start = strip.scrollLeft;
      if (start === 0) return "no overflow";
      // press space via keyboard event on window (play)
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      await new Promise((r) => setTimeout(r, 1200));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      return { start, end: strip.scrollLeft };
    });
    ok(
      "view follows the playhead during playback",
      typeof followed === "object" && followed.end < followed.start,
      JSON.stringify(followed)
    );
  }

  await page.screenshot({ path: "/tmp/rf-round7-final.png" });
} catch (e) {
  ok("suite completed", false, String(e).slice(0, 250));
}

console.log("---");
const failed = results.filter((r) => !r.pass);
console.log(failed.length === 0 ? `ALL ${results.length} CHECKS PASSED` : `${failed.length}/${results.length} CHECKS FAILED`);
await browser.close();
process.exit(failed.length === 0 ? 0 : 1);
