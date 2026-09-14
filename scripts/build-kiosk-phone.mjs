#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  build-kiosk-phone.mjs                                              */
/*                                                                     */
/*  The map kiosk for the site and the app. The owner wants the       */
/*  software on the museum's wall, unchanged, to be what opens from   */
/*  the site and the app, with the exhibit's words on a page of their  */
/*  own. On the site a phone is turned away: the stage is built for a  */
/*  big screen, so a phone in a browser gets a notice to view it on a  */
/*  desktop or in the app. The app opens it sideways. This takes the built   */
/*  kiosk (public/kiosk/map-kiosk.html), removes the wall's behaviour   */
/*  that makes no sense in a hand, the four-minute idle reset, the     */
/*  fullscreen grab, the service worker and the nightly update pull,   */
/*  and adds the one thing a phone needs: a screen in portrait asking   */
/*  for the phone to be turned, because the stage is 16:9 and in        */
/*  portrait it would be a postage stamp. In landscape the kiosk runs  */
/*  exactly as it does on the wall, scaled to the screen; the phone's  */
/*  own pinch zoom is left on so the map can be read up close.          */
/*                                                                     */
/*  The bundle boots by replacing the whole document, so the overlay   */
/*  is put back whenever it disappears, for the first ten seconds and  */
/*  on every change of the document's children after that.            */
/*                                                                     */
/*  Usage: node scripts/build-kiosk-phone.mjs                          */
/*  Reads public/kiosk/map-kiosk.html, writes public/kiosk/map-phone.html */
/* ------------------------------------------------------------------ */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "public/kiosk/map-kiosk.html";
const OUT = "public/kiosk/map-phone.html";
const KIOSK_MARK = "<!-- rooted-forward-kiosk -->";
const PHONE_MARK = "<!-- rooted-forward-phone -->";

let html = readFileSync(SRC, "utf8");
const at = html.indexOf(KIOSK_MARK);
if (at < 0) {
  console.error(`${SRC} carries no ${KIOSK_MARK}; build the kiosk first`);
  process.exit(1);
}
const scriptEnd = html.indexOf("</script>", at);
if (scriptEnd < 0) {
  console.error("the kiosk block has no end");
  process.exit(1);
}
const kioskBlock = html.slice(at, scriptEnd + "</script>".length);

const css = [
  "#rf-rotate{position:fixed;inset:0;z-index:2147483000;background:#F3EEE3;color:#1E1D1B;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;-webkit-user-select:none;user-select:none}",
  "@media (orientation:portrait) and (pointer:coarse){#rf-rotate{display:flex}}",
  "#rf-rotate .marks{display:flex;gap:14px;align-items:center}",
  "#rf-rotate .marks img{width:56px;height:56px;border-radius:50%;display:block}",
  "#rf-rotate .amp{font:300 22px/1 Georgia,'Times New Roman',serif;color:#6B675D}",
  "#rf-rotate h1{font:600 40px/1 Georgia,'Times New Roman',serif;color:#1B3A2D;margin:24px 0 0}",
  "#rf-rotate .sub{font:italic 400 16px/1.4 Georgia,'Times New Roman',serif;color:#6B675D;margin:8px 0 0}",
  "#rf-rotate .phone{width:46px;height:78px;margin:38px auto 0;border:3px solid #1E1D1B;border-radius:9px;position:relative;animation:rfturn 2.6s ease-in-out infinite}",
  "#rf-rotate .phone:after{content:'';position:absolute;left:50%;bottom:5px;width:14px;height:3px;margin-left:-7px;border-radius:2px;background:#1E1D1B}",
  "@keyframes rfturn{0%,25%{transform:rotate(0)}55%,85%{transform:rotate(-90deg)}100%{transform:rotate(0)}}",
  "@media (prefers-reduced-motion:reduce){#rf-rotate .phone{animation:none;transform:rotate(-90deg)}}",
  "#rf-rotate .ask{font-weight:600;font-size:17px;line-height:1.3;color:#1E1D1B;margin:32px 0 0}",
  "#rf-rotate .note{font-size:13px;line-height:1.45;color:#6B675D;margin:10px 0 0;max-width:34ch}",
  "#rf-rotate a{position:absolute;bottom:max(18px,env(safe-area-inset-bottom));left:0;right:0;color:#B04E31;font-weight:600;text-decoration:none;font-size:14px}",
  "#rf-rotate.deny{display:flex}",
  "#rf-rotate .desk{width:64px;height:44px;margin:34px auto 0;border:3px solid #1E1D1B;border-radius:6px;position:relative}",
  "#rf-rotate .desk:after{content:'';position:absolute;left:50%;bottom:-14px;width:28px;height:11px;margin-left:-14px;border:3px solid #1E1D1B;border-top:0;border-radius:0 0 4px 4px}",
  "#rf-rotate .links{position:absolute;bottom:max(18px,env(safe-area-inset-bottom));left:0;right:0;display:flex;justify-content:center;gap:22px}",
  "#rf-rotate .links a{position:static}",
  // a phone on its side is short, so everything closes up and the
  // links come into the flow instead of pinning to the bottom
  "@media (max-height:520px){#rf-rotate{padding:14px 24px;justify-content:center}#rf-rotate .marks img{width:36px;height:36px}#rf-rotate .amp{font-size:16px}#rf-rotate h1{font-size:26px;margin-top:8px}#rf-rotate .sub{font-size:12.5px;margin-top:4px}#rf-rotate .phone{width:30px;height:50px;margin-top:12px;border-width:2.5px}#rf-rotate .desk{width:48px;height:32px;margin-top:12px}#rf-rotate .desk:after{bottom:-11px;width:20px;height:8px;margin-left:-10px}#rf-rotate .ask{font-size:14px;margin-top:14px}#rf-rotate .note{font-size:12px;margin-top:4px;max-width:44ch}#rf-rotate .links,#rf-rotate>a{position:static;margin-top:10px;display:flex;justify-content:center;gap:22px}}",
].join("");

const phoneBlock = `${PHONE_MARK}
<script>
(function () {
  var inApp = /[?&]app=1(&|$)/.test(location.search);
  // a phone: a touch screen whose longer side is under a tablet's
  var phone = false;
  try { phone = window.matchMedia("(pointer: coarse)").matches && Math.max(screen.width, screen.height) < 960; } catch (e) {}
  var deny = phone && !inApp;
  var CSS = ${JSON.stringify(css)};
  var HEAD = '<div class="marks"><img src="/logo.svg" alt="Rooted Forward"><span class="amp">&amp;</span><img src="/media/look-closer/cmm-logo.png" alt="Chicago Maritime Museum"></div>'
    + '<h1>An Illustrated Map of Chicago</h1>'
    + '<p class="sub">Charles Turzak and Henry T. Chapman, 1931, on view at the Chicago Maritime Museum</p>';
  var HTML = deny
    ? HEAD
      + '<div class="desk" aria-hidden="true"></div>'
      + '<p class="ask">Please view the map on a desktop.</p>'
      + '<p class="note">The interactive map is built for a large screen. On a phone, open it in the Rooted Forward app instead.</p>'
      + '<div class="links"><a href="/">Back to the home page</a><a href="/tours">Get the app</a></div>'
    : HEAD
      + '<div class="phone" aria-hidden="true"></div>'
      + '<p class="ask">Turn your phone sideways to open the map.</p>'
      + '<p class="note">The map is wider than it is tall, and every joke on it is small. It only opens the long way round.</p>'
      + (inApp ? '' : '<a href="/">Back to the home page</a>');
  function ensure() {
    try {
      if (document.getElementById("rf-rotate")) return;
      var st = document.createElement("style");
      st.id = "rf-rotate-style";
      st.textContent = CSS;
      var d = document.createElement("div");
      d.id = "rf-rotate";
      if (deny) d.className = "deny";
      d.innerHTML = HTML;
      (document.head || document.documentElement).appendChild(st);
      (document.body || document.documentElement).appendChild(d);
    } catch (e) {}
  }
  ensure();
  var tries = 0;
  var timer = setInterval(function () {
    ensure();
    if (++tries > 40) clearInterval(timer);
  }, 250);

  // In the app the map opens on the main screen. The attract screen
  // is the wall's rest state, and the app has its own front door, so
  // once the attract screen is up the kiosk's own begin is sent: the
  // bundle begins on Enter while the screen is 'attract', and on a
  // touch of the attract panel. Both go, a few times over a second,
  // because the text can linger in hidden panels and cannot be read
  // back as the screen's state.
  // The attract text stays in the document in hidden panels, so the
  // question is whether it is actually showing: laid out, and not
  // faded out by any ancestor.
  function findByText(re, tag) {
    var all = document.body ? document.body.getElementsByTagName(tag || "*") : [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length === 0 && re.test(el.textContent || "")) return el;
    }
    return null;
  }
  function attractUp() {
    try {
      var el = findByText(/Touch anywhere to begin/i);
      if (!el || el.getClientRects().length === 0) return false;
      var node = el, opacity = 1;
      while (node && node !== document.body) {
        var cs = getComputedStyle(node);
        if (cs.display === "none" || cs.visibility === "hidden") return false;
        opacity *= parseFloat(cs.opacity) || 0;
        node = node.parentElement;
      }
      return opacity > 0.3;
    } catch (e) { return false; }
  }
  function begin() {
    try {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
      var all = document.body.getElementsByTagName("*");
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.children.length === 0 && /Touch anywhere to begin/i.test(el.textContent || "")) {
          (el.closest("[sc-camel-on-click]") || el).click();
          break;
        }
      }
    } catch (e) {}
  }
  // In the app the stage is drawn at about a third of its size, which
  // makes the right column's list unreadable. Each pane in that column
  // is scaled up in place, to a width that keeps its visual size, so
  // the type grows and the pane scrolls inside its own box; the wall's
  // Rooted Forward box in the list is hidden, because this is the
  // Rooted Forward app; and the round buttons grow a little. The
  // bundle re-renders on its own, so the shaping runs again and again.
  var LIST = 1.7, DETAIL = 1.5, BUTTONS = 1.3;
  function scalePane(pane, factor) {
    if (!pane || pane.getAttribute("data-rf-scaled") === String(factor)) return;
    var w = parseFloat(pane.style.width) || 480;
    pane.style.setProperty("transform-origin", "top right", "important");
    pane.style.setProperty("transform", "scale(" + factor + ")", "important");
    pane.style.setProperty("width", Math.round(w / factor) + "px", "important");
    pane.style.setProperty("bottom", "auto", "important");
    pane.style.setProperty("height", Math.round(996 / factor) + "px", "important");
    pane.style.setProperty("overflow-y", "auto", "important");
    pane.style.setProperty("overflow-x", "hidden", "important");
    pane.style.setProperty("-webkit-overflow-scrolling", "touch", "important");
    pane.style.setProperty("padding", "18px 22px", "important");
    for (var i = 0; i < pane.children.length; i++) pane.children[i].style.setProperty("flex-shrink", "0", "important");
    pane.setAttribute("data-rf-scaled", String(factor));
  }
  function scaleGroup(el, factor, origin) {
    if (!el || el.getAttribute("data-rf-scaled")) return;
    el.style.setProperty("transform-origin", origin, "important");
    el.style.setProperty("transform", "scale(" + factor + ")", "important");
    el.setAttribute("data-rf-scaled", "1");
  }
  function adapt() {
    try {
      // the list: its subtitle names it
      var sub = findByText(/Touch a number on the map/i, "div");
      if (sub && sub.parentElement && sub.parentElement.parentElement) {
        var list = sub.parentElement.parentElement;
        scalePane(list, LIST);
        // rows may wrap to two lines in the narrower pane
        var rows = list.getElementsByTagName("button");
        for (var r = 0; r < rows.length; r++) {
          rows[r].style.setProperty("height", "auto", "important");
          rows[r].style.setProperty("min-height", "54px", "important");
          rows[r].style.setProperty("padding", "6px 10px 6px 4px", "important");
        }
      }
      // the Rooted Forward box in the list
      var rf = findByText(/In partnership with the Chicago Maritime Museum/i, "div");
      if (rf && rf.parentElement && rf.parentElement.parentElement) {
        rf.parentElement.parentElement.style.setProperty("display", "none", "important");
      }
      // the detail pane: the way back names it
      var back = findByText(/back to the map/i, "button");
      var column = sub && sub.parentElement && sub.parentElement.parentElement ? sub.parentElement.parentElement.parentElement : null;
      if (back && column) {
        var pane = back;
        while (pane && pane.parentElement && pane.parentElement !== column) pane = pane.parentElement;
        if (pane && pane.parentElement === column && pane !== sub.parentElement.parentElement) scalePane(pane, DETAIL);
      }
      // the buttons
      var about = findByText(/^About this map$/i, "button");
      if (about && about.parentElement) scaleGroup(about.parentElement, BUTTONS, "right center");
      // a bracket class, because a backslash would not survive this template
      var plus = findByText(/^[+]$/, "button");
      if (plus && plus.parentElement) scaleGroup(plus.parentElement, BUTTONS, "bottom left");
    } catch (e) {}
  }
  if (inApp) {
    setInterval(adapt, 400);
  }

  if (inApp) {
    var ticks = 0, sent = 0;
    var starter = setInterval(function () {
      ticks++;
      if (attractUp()) { begin(); sent++; }
      else if (sent > 0) clearInterval(starter);
      if (ticks > 80) clearInterval(starter);
    }, 300);
  }
  if (window.MutationObserver) {
    new MutationObserver(function () { ensure(); }).observe(document, { childList: true, subtree: false });
  }
})();
</script>`;

html = html.slice(0, at) + phoneBlock + html.slice(scriptEnd + "</script>".length);

/* In the app the map opens on the main screen, not on the wall's
   "Touch anywhere to begin". The component has a startInExplore
   setting, off in the wall's build and not reachable from outside;
   the phone copy reads it as on whenever the app's ?app=1 is in the
   address. One line of the bundle changes, at mount, and nothing
   else; the wall's own copy is not touched. */
const MOUNT = "if (this.props.startInExplore) this.setState({ screen: 'explore', hsOn: true });";
if (html.split(MOUNT).length !== 2) {
  console.error("the kiosk's mount line has moved; the app cannot skip the attract screen");
  process.exit(1);
}
html = html.replace(
  MOUNT,
  "if (this.props.startInExplore || location.search.indexOf('app=1') >= 0) this.setState({ screen: 'explore', hsOn: true });",
);
writeFileSync(OUT, html);
console.log(`${OUT}: ${(html.length / 1e6).toFixed(2)} MB, removed the wall's block (${kioskBlock.length} chars), added the phone's`);
