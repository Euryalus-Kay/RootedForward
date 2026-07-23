import { NextResponse } from "next/server";
import { HYDE_PARK_WALK } from "@/lib/tours/hyde-park-walk";
import { WALK_INTRO } from "@/components/tours/walk/WalkIntro";
import { WALK_GEOMETRY } from "@/lib/tours/walk-utils";

/* ------------------------------------------------------------------ */
/*  GET /api/walk                                                      */
/*  The full Walk Hyde Park tour as one JSON document. Read by the     */
/*  Rooted Forward iOS app, which bundles a snapshot of this payload   */
/*  and refreshes from here so site edits reach the app without an     */
/*  app update. Media paths are site-relative; clients join them onto  */
/*  mediaBase. The version string changes whenever the content does.   */
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

const BODY = {
  intro: WALK_INTRO,
  tour: HYDE_PARK_WALK,
  geometry: WALK_GEOMETRY,
};

const PAYLOAD = {
  version: contentVersion(BODY),
  mediaBase: MEDIA_BASE,
  ...BODY,
};

export async function GET() {
  return NextResponse.json(PAYLOAD, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
