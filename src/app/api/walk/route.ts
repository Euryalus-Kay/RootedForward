import { NextResponse } from "next/server";
import { DEFAULT_WALK_SLUG, type WalkTourBundle } from "@/lib/tours/registry";
import { loadWalkBundles } from "@/lib/tours/store";

/* ------------------------------------------------------------------ */
/*  GET /api/walk                 the default walk (Hyde Park)         */
/*  GET /api/walk?tour=harlem     a named walk                         */
/*                                                                     */
/*  One walk as a single JSON document, read by the Rooted Forward     */
/*  iOS app. The app bundles a snapshot of each payload and refreshes  */
/*  from here, so site edits reach the app without an App Store        */
/*  release. Media paths are site-relative; clients join them onto     */
/*  mediaBase. The version string changes whenever the content does.   */
/*                                                                     */
/*  The no-parameter response must stay Hyde Park and must keep its    */
/*  current shape. The build already in Apple's hands asks for exactly */
/*  this URL and knows nothing about a second city. Adding keys is     */
/*  safe, since Swift ignores what it does not model; removing or      */
/*  renaming one is not. `tours` is such a key, and it is how a newer  */
/*  build discovers Harlem without a second round trip.                */
/*                                                                     */
/*  The walks themselves now come from loadWalkBundles(), which reads  */
/*  the walk_tours table and falls back to the compiled registry when  */
/*  the database is unreachable. That is why the payloads are built    */
/*  per request instead of once at import. A module-level map froze    */
/*  the content to whatever was compiled into the deploy, which is     */
/*  exactly what the owner should no longer have to redeploy to fix.   */
/* ------------------------------------------------------------------ */

/** Supabase reads and a per-request payload, so nothing here can be
 *  rendered once and cached into the build output. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_BASE = "https://rooted-forward.org";

function contentVersion(payload: unknown): string {
  const s = JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return `${s.length.toString(36)}-${h.toString(36)}`;
}

/** The catalogue every payload carries, so the app can list the walks
 *  it is not currently holding and fetch one on demand. */
function tourIndex(bundles: WalkTourBundle[]) {
  return bundles.map((t) => ({
    slug: t.slug,
    title: t.tour.title,
    dek: t.tour.dek,
    startLabel: t.tour.startLabel,
    stopCount: t.tour.stops.filter((s) => !s.optional).length,
    detourCount: t.tour.stops.filter((s) => s.optional).length,
    distanceMiles: t.tour.distanceMiles,
    listenMinutes: t.tour.listenMinutes,
  }));
}

type TourIndex = ReturnType<typeof tourIndex>;

function buildPayload(bundle: WalkTourBundle, tours: TourIndex) {
  const body = {
    slug: bundle.slug,
    intro: bundle.intro,
    tour: bundle.tour,
    geometry: bundle.geometry,
    map: bundle.map,
  };
  return {
    // The version covers the body AND the catalogue, and the second
    // half is the whole point. An installed app only refetches the
    // walk it holds, sees a version it already has, and stops. When
    // the version ignored `tours`, a brand new tour added on the site
    // stayed invisible until the default walk's own words happened to
    // change, which could be never. Hashing the catalogue too means
    // adding a tour moves every walk's version, so the next foreground
    // pulls the new payload and the new tour appears in the list.
    version: contentVersion({ body, tours }),
    mediaBase: MEDIA_BASE,
    tours,
    ...body,
  };
}

/** exported so the iOS snapshot exporter writes the same bytes the
 *  network would return. Async now, because the walks are read from
 *  the database on demand rather than compiled in. */
export async function walkPayload(slug: string) {
  const bundles = await loadWalkBundles();
  const bundle = bundles.find((b) => b.slug === slug);
  if (!bundle) return undefined;
  return buildPayload(bundle, tourIndex(bundles));
}

export async function GET(request: Request) {
  const slug =
    new URL(request.url).searchParams.get("tour") ?? DEFAULT_WALK_SLUG;

  const bundles = await loadWalkBundles();
  const bundle = bundles.find((b) => b.slug === slug);
  if (!bundle) {
    return NextResponse.json(
      { error: "unknown tour", available: bundles.map((b) => b.slug) },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  return NextResponse.json(buildPayload(bundle, tourIndex(bundles)), {
    status: 200,
    headers: {
      // A minute at the edge, because the owner now edits tours in a
      // browser and needs to see the change on a phone while still
      // standing at the stop. The long stale-while-revalidate window
      // keeps the app answered from cache while the edge refetches, so
      // a slow database never becomes a slow launch.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
