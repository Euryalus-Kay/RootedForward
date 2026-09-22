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
import { createHash } from "node:crypto";

/* Four minutes. It was 20 seconds, which is fine for a demo and much too
   short for a wall panel with this much reading on it, since a visitor part
   way through a paragraph was getting sent back to the start. */
const IDLE_SECONDS = 240;

/* Just after midnight the kiosk asks the server whether a newer build exists
   and takes it. Nothing happens if the network is down or nothing changed. */
const UPDATE_CHECK_MINUTES = 5;

/* Usage data. A heartbeat every few minutes is what uptime is measured from,
   so this interval is also the resolution of the uptime figure. The queue cap
   is generous, since each event is a couple of hundred bytes and a gallery
   with no network for a week should still lose nothing that matters. */
const HEARTBEAT_MINUTES = 5;
const FLUSH_SECONDS = 60;
/* A day of granular events is roughly a thousand rows, so the queue has to
   hold more than a day of them to survive a gallery weekend with no wifi. */
const QUEUE_CAP = 2500;
/* How often the recorder looks at which screen is showing. This is the time
   resolution of a replay, so it is a trade against row count. */
const SCREEN_POLL_MS = 400;

const src = process.argv[2];
const out = process.argv[3] ?? "public/kiosk/map-kiosk.html";
if (!src) {
  console.error("usage: node scripts/build-kiosk.mjs <source.html> [outfile]");
  process.exit(1);
}

const MARKER = "<!-- rooted-forward-kiosk -->";

/* A short fingerprint of what went into this build, so the screen on the
   wall can say which one it is running. Taken over the source export and
   the settings rather than the finished file, because the finished file
   contains this value and hashing it would chase its own tail. Identical
   inputs give an identical id, so a rebuild that changed nothing does not
   look like a new build to the nightly update check. */
const BUILD = createHash("sha256")
  .update(readFileSync(src))
  .update(String(IDLE_SECONDS))
  .update(String(UPDATE_CHECK_MINUTES))
  // This file too, so changing the injected behaviour changes the id. Without
  // it a rewrite of the kiosk script would ship a different bundle under the
  // old id, and the update check would decide nothing had changed.
  .update(readFileSync(new URL(import.meta.url)))
  .digest("hex")
  .slice(0, 8);

const injected = `${MARKER}
<script>
(function () {
  var IDLE_MS = ${IDLE_SECONDS} * 1000;
  // Exposed so the reset can be inspected from a console instead of
  // guessed at. This file is a kiosk, not a public app surface.
  var api = (window.__rfKiosk = {
    ran: true,
    build: "${BUILD}",
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

  // ------------------------------------------------------------------
  // Usage data, detailed enough to replay a day.
  //
  // Every timestamped thing that happens goes into one ordered stream.
  // Screen changes, taps with the point on the screen they landed on,
  // details opened and closed, idle resets, heartbeats. A day of that
  // stream is enough to play the screen back as it happened.
  //
  // Anonymous by construction. A session is one visitor's turn, measured
  // as the time the exhibit spends away from its attract screen, and its
  // id is random and never reused or joined to another. No IP address, no
  // user agent, no cookie, nothing about a person. deviceId is a random
  // label this screen invents for itself so two screens can be told apart.
  // A tap coordinate is a place on a museum wall.
  //
  // Everything queues in localStorage and posts in batches, so a gallery
  // with no network loses nothing. The queue survives reloads, and when it
  // fills it drops heartbeats first, then the oldest taps, because those
  // are the cheapest things to lose from a replay.
  // ------------------------------------------------------------------
  var STATS_ON = location.protocol.indexOf("http") === 0;
  var ENDPOINT = "/api/kiosk/events";
  var DEVICE_KEY = "rf-kiosk-device";
  var QUEUE_KEY = "rf-kiosk-queue";
  var QUEUE_CAP = ${QUEUE_CAP};
  var bootAt = Date.now();
  var queue = [];
  var flushing = false;
  var holdUntil = 0;
  var session = null;
  var lastScreen = null;
  var lastInteractionAt = 0;
  var pendingDetails = [];
  var seenResets = 0;
  var pendingDetailLabel = null;
  var pendingDetailAt = 0;
  var lastDetail = null;

  function readStore(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function writeStore(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
  function newId() {
    return (
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 6)
    );
  }

  var deviceId = readStore(DEVICE_KEY);
  if (!deviceId) {
    // Invented here, not derived from anything about the machine or the
    // people using it. It only has to differ from the next screen's.
    deviceId = "k-" + newId();
    writeStore(DEVICE_KEY, deviceId);
  }
  api.deviceId = deviceId;

  try {
    var savedQueue = JSON.parse(readStore(QUEUE_KEY) || "[]");
    queue = Array.isArray(savedQueue) ? savedQueue : [];
  } catch (e) {
    queue = [];
  }

  function saveQueue() {
    try {
      writeStore(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {}
    api.queued = queue.length;
  }

  function trim() {
    if (queue.length <= QUEUE_CAP) return;
    // Heartbeats first, then taps. Losing a heartbeat costs a little uptime
    // resolution, losing a tap costs one dot in a replay, and losing a
    // session or a screen change would cost the shape of the day.
    var order = ["heartbeat", "tap"];
    for (var pass = 0; pass < order.length && queue.length > QUEUE_CAP; pass++) {
      var over = queue.length - QUEUE_CAP;
      var kept = [];
      for (var i = 0; i < queue.length; i++) {
        if (over > 0 && queue[i].type === order[pass]) {
          over--;
          continue;
        }
        kept.push(queue[i]);
      }
      queue = kept;
    }
    if (queue.length > QUEUE_CAP) queue = queue.slice(-QUEUE_CAP);
  }

  function record(type, fields) {
    if (!STATS_ON) return;
    var ev = fields || {};
    ev.type = type;
    if (!ev.at) ev.at = new Date().toISOString();
    ev.build = api.build;
    if (session) {
      ev.sessionId = session.id;
      ev.seq = session.seq++;
    }
    queue.push(ev);
    trim();
    saveQueue();
  }

  function flush() {
    if (!STATS_ON || flushing || !queue.length) return Promise.resolve("idle");
    if (navigator.onLine === false) return Promise.resolve("offline");
    // The tables do not exist yet. Hold everything rather than throw it
    // away, so the day the migration is run the backlog goes in with it.
    if (Date.now() < holdUntil) return Promise.resolve("holding");
    flushing = true;
    var batch = queue.slice(0, 100);
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: deviceId, surface: "wall", events: batch }),
      keepalive: true
    })
      .then(function (res) {
        flushing = false;
        if (!res || !res.ok) return "failed";
        return res
          .json()
          .then(function (body) {
            if (body && body.migrationPending) {
              // Nothing was stored and nothing will be until somebody runs
              // the SQL. Keep the batch and stop asking for half an hour.
              holdUntil = Date.now() + 30 * 60 * 1000;
              api.holding = true;
              return "pending";
            }
            api.holding = false;
            // Drop only what was actually handed over, so a partial night
            // of network still ends with the right number of sessions.
            queue = queue.slice(batch.length);
            saveQueue();
            api.lastFlush = Date.now();
            return "sent";
          })
          .catch(function () {
            // It took the batch but answered with something unreadable.
            // Treat that as delivered rather than risk counting every
            // session twice on the next try.
            queue = queue.slice(batch.length);
            saveQueue();
            api.lastFlush = Date.now();
            return "sent";
          });
      })
      .catch(function () {
        flushing = false;
        return "failed";
      });
  }
  api.flush = flush;

  function currentScreen() {
    try {
      // These elements are conditionally rendered, so presence is the
      // reliable test. Reading body text finds the same words sitting in
      // hidden panels on every other screen.
      if (document.querySelector('[data-screen-label="Attract screen"]')) {
        return "Attract screen";
      }
      var panel = document.querySelector('[data-screen-label="Detail panel"]');
      if (panel) {
        var shown = parseFloat(getComputedStyle(panel).opacity || "0");
        if (shown > 0.5) return "Detail panel";
      }
      if (document.querySelector('[data-screen-label="About this map"]')) {
        return "About this map";
      }
      if (document.querySelector('[data-screen-label="Detail list"]')) {
        return "The map";
      }
      return "Loading";
    } catch (e) {
      return null;
    }
  }

  function startSession() {
    if (session) return;
    session = {
      id: newId(),
      startedAt: lastInteractionAt || Date.now(),
      details: pendingDetails.slice(0, 60),
      taps: 0,
      seq: 0
    };
    pendingDetails = [];
    api.sessionActive = true;
    api.sessionId = session.id;
    record("session_start", { at: new Date(session.startedAt).toISOString() });
  }

  function endSession(reason) {
    if (!session) return;
    var closing = session;
    var endedAt = Date.now();
    var duration = endedAt - closing.startedAt;
    record("session_end", { label: reason, meta: { durationMs: duration } });
    session = null;
    api.sessionActive = false;
    api.sessionId = null;
    // Under a second is a stray touch. Over two hours is a stuck screen
    // rather than a visitor, and either would quietly ruin an average.
    if (duration < 1000 || duration > 7200000) return;
    api.sessionsSeen = (api.sessionsSeen || 0) + 1;
    // The rollup row, alongside the events. The figures on /kiosk/data read
    // this rather than re-reading a month of raw events to count anything.
    queue.push({
      type: "session",
      at: new Date(endedAt).toISOString(),
      sessionId: closing.id,
      build: api.build,
      startedAt: new Date(closing.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationMs: duration,
      detailOpens: closing.details.length,
      taps: closing.taps,
      details: closing.details.slice(0, 60),
      endReason: reason
    });
    trim();
    saveQueue();
  }
  api.endSession = endSession;

  window.addEventListener(
    "pointerdown",
    function (e) {
      lastInteractionAt = Date.now();
      if (!STATS_ON) return;
      try {
        var w = window.innerWidth || 1;
        var h = window.innerHeight || 1;
        var x = Math.max(0, Math.min(1, (e.clientX || 0) / w));
        var y = Math.max(0, Math.min(1, (e.clientY || 0) / h));
        if (session) session.taps++;
        record("tap", {
          x: Math.round(x * 1000) / 1000,
          y: Math.round(y * 1000) / 1000
        });
      } catch (err) {}
    },
    true
  );
  ["keydown", "touchstart", "wheel"].forEach(function (ev) {
    window.addEventListener(
      ev,
      function () {
        lastInteractionAt = Date.now();
      },
      true
    );
  });

  // Which of the twelve map details were opened. The hotspots carry their
  // own aria-label, so this reads the exhibit's own words rather than
  // guessing from positions that would move with any redesign.
  window.addEventListener(
    "click",
    function (e) {
      try {
        var target = e.target;
        var button =
          target && target.closest
            ? target.closest("[data-hs] button[aria-label]")
            : null;
        if (!button) return;
        var label = (button.getAttribute("aria-label") || "").slice(0, 80);
        if (!label) return;
        // Only remembered here. It is recorded when the panel actually
        // opens, which the recorder below sees, so a tap the exhibit
        // ignored, one that landed mid-drag say, is not counted as a
        // detail opened.
        pendingDetailLabel = label;
        pendingDetailAt = Date.now();
      } catch (err) {}
    },
    true
  );

  function detailLabel() {
    // The panel says which one it is showing, "3 OF 12", and the hotspots
    // are labelled "Detail 3: ...", so the number is the join. That names a
    // detail reached by paging inside the panel, which never touches a
    // hotspot. The tap's own label is the fallback if the wording changes.
    try {
      var panel = document.querySelector('[data-screen-label="Detail panel"]');
      // No backslash escapes of any kind on purpose, not even in this
      // comment. This sits inside a template literal in the build script,
      // which strips an unknown escape such as backslash-d so the regex
      // silently matches nothing, and turns backslash-n into a real
      // newline, which is a syntax error that takes the whole injected
      // script down with it. That second one has already happened once.
      var m = panel
        ? (panel.innerText || "").match(/([0-9]+)[^0-9]+OF[^0-9]+[0-9]+/i)
        : null;
      if (m) {
        var want = "Detail " + m[1] + ":";
        var hs = document.querySelectorAll("[data-hs] button[aria-label]");
        for (var i = 0; i < hs.length; i++) {
          var aria = hs[i].getAttribute("aria-label") || "";
          if (aria.indexOf(want) === 0) {
            pendingDetailLabel = null;
            return aria.slice(0, 80);
          }
        }
      }
    } catch (e) {}
    if (pendingDetailLabel && Date.now() - pendingDetailAt < 3000) {
      var label = pendingDetailLabel;
      pendingDetailLabel = null;
      return label;
    }
    return null;
  }

  // The recorder. A session is exactly the time spent away from the attract
  // screen, which is also the honest answer to how long someone stays.
  // Watching the screen change catches every way back, including a visitor
  // pressing "Start over" themselves, without touching the reset logic.
  lastScreen = currentScreen();
  setInterval(function () {
    if (!STATS_ON) return;
    if (api.resets > seenResets) {
      seenResets = api.resets;
      record("idle_reset", {});
    }
    var now = currentScreen();

    // Which detail is up, checked every tick rather than only on a screen
    // change, because paging from one detail to the next inside the panel
    // never changes the screen. Ground truth: the panel is on screen.
    if (now === "Detail panel") {
      var d = detailLabel() || lastDetail || "Detail";
      if (d !== lastDetail) {
        lastDetail = d;
        if (session) session.details.push(d);
        else if (pendingDetails.length < 60) pendingDetails.push(d);
        record("detail_open", { label: d });
      }
    } else if (lastDetail) {
      lastDetail = null;
    }

    if (now === lastScreen) return;
    var was = lastScreen;
    lastScreen = now;

    // Open the turn first, so the screen change that begins it is already
    // filed under the new session.
    if (was === "Attract screen" && now !== "Attract screen") startSession();
    if (was === "Detail panel" && now !== "Detail panel") {
      record("detail_close", { label: was });
    }
    record("screen", { label: now });
    if (was !== "Attract screen" && now === "Attract screen") {
      var byTimer = api.lastReset && Date.now() - api.lastReset < 4000;
      endSession(byTimer ? "idle" : "start_over");
    }
  }, ${SCREEN_POLL_MS});

  record("boot", { meta: { pageUptimeMs: 0 } });
  setInterval(function () {
    record("heartbeat", { meta: { pageUptimeMs: Date.now() - bootAt } });
  }, ${HEARTBEAT_MINUTES} * 60 * 1000);

  setInterval(flush, ${FLUSH_SECONDS} * 1000);
  window.addEventListener("online", flush);
  setTimeout(flush, 5000);

  window.addEventListener("pagehide", function () {
    endSession("hidden");
    try {
      if (queue.length && navigator.sendBeacon) {
        var tail = queue.slice(0, 100);
        var body = JSON.stringify({
          deviceId: deviceId,
          surface: "wall",
          events: tail
        });
        var ok = navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: "application/json" })
        );
        // Dropping on a queued beacon risks losing a batch if the network
        // is down. Keeping it risks counting every session twice on the
        // next flush, which is the worse of the two for a usage figure.
        if (ok) {
          queue = queue.slice(tail.length);
          saveQueue();
        }
      }
    } catch (e) {}
  });

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

          // Compare the server's build id against the one THIS PAGE is
          // running, not against whatever is in the cache. The cache can be
          // refreshed underneath a long-running page by any service worker
          // reinstall, and comparing against it would then report "unchanged"
          // while the wall is still showing the old build.
          var found = fresh.match(/build: "([a-f0-9]{8})"/);
          var serverBuild = found ? found[1] : null;
          if (!serverBuild) return "unknown-build"; // nothing safe to conclude
          if (serverBuild === api.build) return "unchanged";

          api.serverBuild = serverBuild;
          return kioskCache().then(function (c) {
            if (!c) return "no-cache";
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
          record("update", {
            meta: {
              from: api.build,
              to: api.serverBuild || null,
              pageUptimeMs: Date.now() - bootAt
            }
          });
          // Send it before the reload rather than leaving it in the queue,
          // so an update that arrives and then wedges still leaves a trace.
          flush();
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
        outcome === "no-cache" ||
        outcome === "unknown-build"
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
console.log(`  build ${BUILD}`);
