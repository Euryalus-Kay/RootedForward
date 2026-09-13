/* ------------------------------------------------------------------ */
/*  Kiosk service worker                                               */
/*                                                                     */
/*  The kiosk is one self-contained file with no external requests, so */
/*  precaching it is the whole job. After the first visit the screen   */
/*  opens from disk and keeps working with the network unplugged,      */
/*  which is the point on a machine sitting in a museum.               */
/*                                                                     */
/*  Do NOT bump CACHE on every deploy. The page carries a build id and */
/*  the nightly check compares the server against the build it is       */
/*  actually running, then writes the new bundle into this same cache.  */
/*  Bumping forces a reinstall, which re-precaches and quietly puts the */
/*  new build in the cache while the wall still shows the old one.      */
/*  Bump it only when this worker's own logic changes.                  */
/* ------------------------------------------------------------------ */

const CACHE = "rf-kiosk-v4";
const ASSETS = ["/kiosk/map", "/kiosk/map-kiosk.html"];

/* Precache with cache:"reload" rather than addAll. addAll goes through the
   browser's own HTTP cache, so a returning machine could install a brand new
   service worker and then fill it with the PREVIOUS bundle, which is the one
   failure that looks exactly like a deploy that did not happen. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) =>
        Promise.all(
          ASSETS.map((u) =>
            fetch(u, { cache: "reload" }).then((r) => (r.ok ? c.put(u, r) : null))
          )
        )
      )
      .then(() => self.skipWaiting())
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

  /* The nightly update check asks for the server copy on purpose. Without
     this door the page can never see a new build, because the matching
     below ignores the query string and would keep handing back the cached
     bundle forever. Falls back to the cache so a failed check is harmless. */
  if (url.searchParams.has("rf-fresh")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match(event.request, { ignoreSearch: true })
          .then((hit) => {
            // respondWith(undefined) is itself an error, so a miss with the
            // network already down has to answer with something real.
            if (!hit) return new Response("", { status: 504 });
            // Say plainly that this came from the cupboard. Otherwise the
            // page compares the cache against itself, concludes nothing has
            // changed, and marks the day's check done, so a kiosk that was
            // offline at midnight would wait a whole day to try again.
            return hit.blob().then((body) => {
              const headers = new Headers(hit.headers);
              headers.set("X-RF-From-Cache", "1");
              return new Response(body, { status: 200, headers });
            });
          })
      )
    );
    return;
  }

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
