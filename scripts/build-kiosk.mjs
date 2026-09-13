#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  build-kiosk.mjs                                                    */
/*                                                                     */
/*  Takes the exported Map Kiosk bundle and bakes the kiosk behaviour  */
/*  into it, so one file is both the page the site serves and the      */
/*  offline copy that runs by double-clicking it on any machine.       */
/*                                                                     */
/*  Three things get added and nothing else is touched.                */
/*                                                                     */
/*  1. A four minute inactivity reset. The bundle ships its own idle   */
/*     timer, but it does not fire once the page is deployed, checked  */
/*     on production with a real click and an awake tab. Rather than   */
/*     keep guessing at its prop plumbing, this drives the app's own   */
/*     "Start over" control, which lands on the attract screen.        */
/*                                                                     */
/*  2. Fullscreen on the first touch. No browser grants fullscreen     */
/*     without a gesture, so this is as close to "always fullscreen"   */
/*     as a page can get on its own.                                   */
/*                                                                     */
/*  3. A nightly update pull just after midnight. The service worker    */
/*     answers from cache so the wall keeps working with the network    */
/*     unplugged, which also means a new deploy would never reach it    */
/*     on its own. This asks the server for a fresh copy and takes it   */
/*     only if it really arrived and really differs, then shows it at   */
/*     the next idle reset rather than under a visitor's hand.          */
/*                                                                     */
/*  The listeners live on window because the bundle boots by replacing */
/*  documentElement, which throws away anything bound to the old tree. */
/*  window survives that, and the document is queried fresh each time. */
/*                                                                     */
/*  Usage: node scripts/build-kiosk.mjs <source.html> [outfile]        */
/* ------------------------------------------------------------------ */

import { readFileSync, writeFileSync } from "node:fs";

/* Four minutes. It was 20 seconds, which is fine for a demo and much too
   short for a wall panel with this much reading on it, since a visitor part
   way through a paragraph was getting sent back to the start. */
const IDLE_SECONDS = 240;

/* Just after midnight the kiosk asks the server whether a newer build exists
   and takes it. Nothing happens if the network is down or nothing changed. */
const UPDATE_CHECK_MINUTES = 5;

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
  var api = (window.__rfKiosk = {
    ran: true,
    idleMs: IDLE_MS,
    resets: 0,
    armedAt: 0,
    updates: 0,
    lastCheck: 0,
    lastOutcome: null
  });
  var timer = null;
  var lastFullscreenTry = 0;
  // Set when a newer build has been pulled and cached but not yet shown.
  // It is applied at the next natural break rather than under someone's hand.
  var pendingUpdate = false;

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
    // A new build is already sitting in the cache. The screen has just gone
    // idle, so this is the moment to swap to it without cutting anyone off.
    if (pendingUpdate) {
      pendingUpdate = false;
      location.reload();
      return;
    }
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

  // Asked for on every touch that finds the page out of fullscreen, not
  // only the first one. A reload drops the fullscreen state, and since no
  // browser grants fullscreen without a gesture, the next touch is the only
  // chance to take it back. Chrome launched with --kiosk, which is how the
  // museum machine runs, is fullscreen at the window level and never loses
  // it here; this is the safety net for every other way of opening the page.
  window.addEventListener(
    "pointerdown",
    function () {
      if (document.fullscreenElement) return;
      var now = Date.now();
      if (now - lastFullscreenTry < 3000) return; // do not hammer a refusal
      lastFullscreenTry = now;
      var el = document.documentElement;
      if (el && el.requestFullscreen) {
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

  // ------------------------------------------------------------------
  // Nightly update pull.
  //
  // The service worker answers from its cache so the exhibit survives a
  // dead network, which also means a new deploy would never reach the wall
  // on its own. Just after midnight the page asks the server for a fresh
  // copy. It is written into the cache and shown only if it really arrived
  // and really differs.
  //
  // Every path here fails closed. No network, a captive portal, a short or
  // broken response, an exception, all leave the working copy untouched.
  // A kiosk showing last week's build beats a kiosk showing nothing.
  // ------------------------------------------------------------------
  var KIOSK_PATH = "/kiosk/map";
  var MIN_CHARS = 1000000; // a short read is an error page, not the bundle

  function kioskCache() {
    if (!window.caches) return Promise.resolve(null);
    return caches
      .keys()
      .then(function (keys) {
        var name = null;
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].indexOf("rf-kiosk") === 0) name = keys[i];
        }
        return name ? caches.open(name) : null;
      })
      .catch(function () {
        return null;
      });
  }

  function pullUpdate() {
    // The double-click copy has no server behind it and nothing to pull.
    if (location.protocol.indexOf("http") !== 0) return Promise.resolve("offline-copy");
    // Cheap early out. Saves reading and comparing seven megabytes out of
    // the cache every time the check runs with the cable unplugged.
    if (navigator.onLine === false) return Promise.resolve("unreachable");
    api.lastCheck = Date.now();

    // A captive portal can accept the connection and then never answer.
    // Without this the check would hang forever and never retry.
    var abort = null;
    var timer = null;
    try {
      abort = new AbortController();
      timer = setTimeout(function () {
        abort.abort();
      }, 30000);
    } catch (e) {}

    // rf-fresh is the door in the service worker that reaches the network.
    // Without it the worker answers from cache and the check is worthless.
    return fetch(KIOSK_PATH + "?rf-fresh=" + Date.now(), {
      cache: "reload",
      signal: abort ? abort.signal : undefined
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res || !res.ok) return "unreachable";
        // The worker sets this when the network failed and it answered from
        // the cache instead. Comparing that against the cache would always
        // say "unchanged" and wrongly count as a completed check.
        if (res.headers && res.headers.get("X-RF-From-Cache")) return "unreachable";
        return res.text().then(function (fresh) {
          if (!fresh || fresh.length < MIN_CHARS) return "bad-response";
          return kioskCache().then(function (c) {
            if (!c) return "no-cache";
            return c.match(KIOSK_PATH, { ignoreSearch: true }).then(function (hit) {
              if (!hit) return "no-cache";
              return hit.text().then(function (current) {
                if (current === fresh) return "unchanged";
                var body = function () {
                  return new Response(fresh, {
                    headers: { "Content-Type": "text/html; charset=utf-8" }
                  });
                };
                return Promise.all([
                  c.put(KIOSK_PATH, body()),
                  c.put("/kiosk/map-kiosk.html", body())
                ]).then(function () {
                  api.updates++;
                  return "updated";
                });
              });
            });
          });
        });
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        return "unreachable";
      });
  }

  function checkForUpdate() {
    // Pick up a changed worker too, not only a changed bundle.
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker
          .getRegistrations()
          .then(function (regs) {
            regs.forEach(function (r) {
              try {
                r.update();
              } catch (e) {}
            });
          })
          .catch(function () {});
      }
    } catch (e) {}

    return pullUpdate()
      .then(function (outcome) {
        if (outcome === "updated") {
          // Nobody is using it, so swap now. Otherwise leave it for the
          // idle reset, which is a natural break rather than an interruption.
          if (onAttract()) location.reload();
          else pendingUpdate = true;
        }
        api.lastOutcome = outcome;
        return outcome;
      })
      .catch(function () {
        api.lastOutcome = "error";
        return "error";
      });
  }
  api.checkForUpdate = checkForUpdate;

  // Polled on an interval rather than armed with one long timeout, so the
  // check still lands after a reboot, a clock change or a throttled tab.
  //
  // A check that never reached the server leaves the day still owed, so an
  // exhibit that was offline at midnight tries again every few minutes and
  // again the moment the network comes back, instead of waiting a whole
  // day. Nothing else is affected by being offline. The worker is already
  // answering from the cache, so the map, the twelve details, the idle
  // reset and fullscreen all carry on exactly as they do online.
  var lastSeenDay = new Date().toDateString();
  var updateOwed = false;
  var checking = false;

  function tick() {
    var today = new Date().toDateString();
    if (today !== lastSeenDay) {
      lastSeenDay = today;
      updateOwed = true;
    }
    if (!updateOwed || checking) return;
    checking = true;
    checkForUpdate().then(function (outcome) {
      checking = false;
      // Only an answer that actually came from the server settles the day.
      // "no-cache" counts because without a cache the page is being served
      // live anyway, so there is nothing left for this to do.
      if (
        outcome === "updated" ||
        outcome === "unchanged" ||
        outcome === "offline-copy" ||
        outcome === "no-cache"
      ) {
        updateOwed = false;
      }
    });
  }
  api.tick = tick;
  api.updateOwed = function () {
    return updateOwed;
  };

  setInterval(tick, ${UPDATE_CHECK_MINUTES} * 60 * 1000);
  // Reconnecting is the obvious moment to retry a check that could not run.
  window.addEventListener("online", tick);
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
console.log(`  idle reset ${IDLE_SECONDS}s (${(IDLE_SECONDS / 60).toFixed(0)} min), fullscreen on first touch`);
console.log(`  nightly update pull, polled every ${UPDATE_CHECK_MINUTES} min`);
