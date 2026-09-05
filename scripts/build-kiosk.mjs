#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  build-kiosk.mjs                                                    */
/*                                                                     */
/*  Takes the exported Map Kiosk bundle and bakes the kiosk behaviour  */
/*  into it, so one file is both the page the site serves and the      */
/*  offline copy that runs by double-clicking it on any machine.       */
/*                                                                     */
/*  Two things get added and nothing else is touched.                  */
/*                                                                     */
/*  1. A 20 second inactivity reset. The bundle ships its own idle     */
/*     timer, but it does not fire once the page is deployed, checked  */
/*     on production with a real click and an awake tab. Rather than   */
/*     keep guessing at its prop plumbing, this drives the app's own   */
/*     "Start over" control, which lands on the attract screen.        */
/*                                                                     */
/*  2. Fullscreen on the first touch. No browser grants fullscreen     */
/*     without a gesture, so this is as close to "always fullscreen"   */
/*     as a page can get on its own.                                   */
/*                                                                     */
/*  The listeners live on window because the bundle boots by replacing */
/*  documentElement, which throws away anything bound to the old tree. */
/*  window survives that, and the document is queried fresh each time. */
/*                                                                     */
/*  Usage: node scripts/build-kiosk.mjs <source.html> [outfile]        */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync } from "node:fs";

const IDLE_SECONDS = 20;

const src = process.argv[2];
const out = process.argv[3] ?? "public/kiosk/map-kiosk.html";
if (!src) {
  console.error("usage: node scripts/build-kiosk.mjs <source.html> [outfile]");
  process.exit(1);
}

const MARKER = "<!-- rooted-forward-kiosk -->";

const injected = `${MARKER}
<script>
(function () {
  var IDLE_MS = ${IDLE_SECONDS} * 1000;
  // Exposed so the reset can be inspected from a console instead of
  // guessed at. This file is a kiosk, not a public app surface.
  var api = (window.__rfKiosk = { ran: true, idleMs: IDLE_MS, resets: 0, armedAt: 0 });
  var timer = null;
  var wentFullscreen = false;

  function startOver() {
    // The app's own control. Returns to the attract screen with no
    // reload, which matters when this is served over the network.
    try {
      var buttons = document.querySelectorAll("button");
      for (var i = 0; i < buttons.length; i++) {
        if (/start over/i.test(buttons[i].textContent || "")) {
          buttons[i].click();
          return true;
        }
      }
    } catch (e) {}
    return false;
  }

  function onAttract() {
    // The attract screen is the rest state. Nothing to reset from, and
    // it carries no "Start over" control, so without this guard the
    // reload fallback below could loop forever on an idle screen.
    try {
      return /Touch anywhere to begin/i.test(document.body.innerText || "");
    } catch (e) {
      return false;
    }
  }

  function reset() {
    api.resets++;
    api.lastReset = Date.now();
    if (onAttract()) return;
    if (!startOver()) location.reload();
  }

  function arm() {
    clearTimeout(timer);
    api.armedAt = Date.now();
    timer = setTimeout(reset, IDLE_MS);
  }
  api.reset = reset;
  api.arm = arm;

  // Real interactions only. Pointer movement is left out on purpose so
  // a drifting cursor or a noisy touchscreen cannot hold the screen open.
  ["pointerdown", "keydown", "touchstart", "wheel"].forEach(function (ev) {
    window.addEventListener(ev, arm, true);
  });

  window.addEventListener(
    "pointerdown",
    function () {
      if (wentFullscreen) return;
      wentFullscreen = true;
      var el = document.documentElement;
      if (!document.fullscreenElement && el && el.requestFullscreen) {
        el.requestFullscreen().catch(function () {});
      }
    },
    true
  );

  arm();

  // Offline. Only over http(s); the double-click copy is already local
  // and service workers are not available on file:// anyway.
  if (
    "serviceWorker" in navigator &&
    location.protocol.indexOf("http") === 0
  ) {
    navigator.serviceWorker.register("/kiosk/sw.js").catch(function () {});
  }
})();
</script>
`;

let html = readFileSync(src, "utf8");

if (html.includes(MARKER)) {
  console.error("source already carries the kiosk script; pass the original export");
  process.exit(1);
}

const at = html.indexOf("</head>");
if (at === -1) {
  console.error("no </head> in the source");
  process.exit(1);
}

html = html.slice(0, at) + injected + html.slice(at);
writeFileSync(out, html);

console.log(`wrote ${out}`);
console.log(`  ${(html.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`  idle reset ${IDLE_SECONDS}s, fullscreen on first touch`);
