#!/usr/bin/env node
/* ------------------------------------------------------------------ */
/*  build-kiosk-phone.mjs                                              */
/*                                                                     */
/*  The phone copy of the map kiosk. The owner wants the software on   */
/*  the museum's wall, unchanged, to be what a phone opens too, with   */
/*  the exhibit's words on a page of their own. This takes the built   */
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
].join("");

const phoneBlock = `${PHONE_MARK}
<script>
(function () {
  var inApp = /[?&]app=1(&|$)/.test(location.search);
  var CSS = ${JSON.stringify(css)};
  var HTML = '<div class="marks"><img src="/logo.svg" alt="Rooted Forward"><span class="amp">&amp;</span><img src="/media/look-closer/cmm-logo.png" alt="Chicago Maritime Museum"></div>'
    + '<h1>Look Closer</h1>'
    + '<p class="sub">An Illustrated Map of Chicago, 1931, on view at the Chicago Maritime Museum</p>'
    + '<div class="phone" aria-hidden="true"></div>'
    + '<p class="ask">Turn your phone sideways to open the map.</p>'
    + '<p class="note">The map is wider than it is tall, and every joke on it is small. It only opens the long way round.</p>'
    + (inApp ? '' : '<a href="/look-closer">Back to Look Closer</a>');
  function ensure() {
    try {
      if (document.getElementById("rf-rotate")) return;
      var st = document.createElement("style");
      st.id = "rf-rotate-style";
      st.textContent = CSS;
      var d = document.createElement("div");
      d.id = "rf-rotate";
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
  if (window.MutationObserver) {
    new MutationObserver(function () { ensure(); }).observe(document, { childList: true, subtree: false });
  }
})();
</script>`;

html = html.slice(0, at) + phoneBlock + html.slice(scriptEnd + "</script>".length);
writeFileSync(OUT, html);
console.log(`${OUT}: ${(html.length / 1e6).toFixed(2)} MB, removed the wall's block (${kioskBlock.length} chars), added the phone's`);
