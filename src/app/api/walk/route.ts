import { NextResponse } from "next/server";
import {
  DEFAULT_WALK_SLUG,
  WALK_TOURS,
  type WalkTourBundle,
} from "@/lib/tours/registry";

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
/* ------------------------------------------------------------------ */

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
const TOUR_INDEX = WALK_TOURS.map((t) => ({
  slug: t.slug,
  title: t.tour.title,
  dek: t.tour.dek,
  startLabel: t.tour.startLabel,
  stopCount: t.tour.stops.filter((s) => !s.optional).length,
  detourCount: t.tour.stops.filter((s) => s.optional).length,
  distanceMiles: t.tour.distanceMiles,
  listenMinutes: t.tour.listenMinutes,
}));

function buildPayload(bundle: WalkTourBundle) {
  const body = {
    slug: bundle.slug,
    intro: bundle.intro,
    tour: bundle.tour,
    geometry: bundle.geometry,
    map: bundle.map,
  };
  return {
    version: contentVersion(body),
    mediaBase: MEDIA_BASE,
    tours: TOUR_INDEX,
    ...body,
  };
}

const PAYLOADS = new Map(
  WALK_TOURS.map((t) => [t.slug, buildPayload(t)] as const)
);

/** exported so the iOS snapshot exporter writes the same bytes the
 *  network would return */
export function walkPayload(slug: string) {
  return PAYLOADS.get(slug);
}

export async function GET(request: Request) {
  const slug =
    new URL(request.url).searchParams.get("tour") ?? DEFAULT_WALK_SLUG;
  const payload = PAYLOADS.get(slug);
  if (!payload) {
    return NextResponse.json(
      { error: "unknown tour", available: WALK_TOURS.map((t) => t.slug) },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
