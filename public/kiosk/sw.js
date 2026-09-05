/* ------------------------------------------------------------------ */
/*  Kiosk service worker                                               */
/*                                                                     */
/*  The kiosk is one self-contained file with no external requests, so */
/*  precaching it is the whole job. After the first visit the screen   */
/*  opens from disk and keeps working with the network unplugged,      */
/*  which is the point on a machine sitting in a museum.               */
/*                                                                     */
/*  Bump CACHE when the bundle changes, or the old copy is served      */
/*  forever.                                                           */
/* ------------------------------------------------------------------ */

const CACHE = "rf-kiosk-v1";
const ASSETS = ["/kiosk/map", "/kiosk/map-kiosk.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* Cache first. The bundle is immutable between deploys and the whole
   point is that it never waits on a network. */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/kiosk/")) return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      });
    })
  );
});
