/* ------------------------------------------------------------------ */
/*  Shared guards and bundle checks for the walk admin routes.         */
/*                                                                     */
/*  Not a route. Next only builds a handler out of route.ts, so this   */
/*  file is just the piece the three walk endpoints have in common.    */
/*                                                                     */
/*  Two things live here because getting either one wrong is loud.     */
/*                                                                     */
/*  The first is the auth check. /admin checks the admin role in the   */
/*  browser, deliberately, because cookies and RLS never agreed        */
/*  across deploy environments. That check is a convenience for the    */
/*  person clicking, not a wall. These routes are the wall, so they    */
/*  read the caller's own row and refuse anyone who is not an admin.   */
/*                                                                     */
/*  The second is the bundle check. A walk bundle is decoded by the    */
/*  iPhone app with a Codable mirror in which almost every field is    */
/*  non-optional, so one missing key on one stop fails the decode of   */
/*  the whole payload and leaves a walker on a sidewalk with a blank   */
/*  screen. A draft can be as unfinished as the owner likes. A row     */
/*  that is live has to survive that decoder, and the only place to    */
/*  find that out safely is here, before the write.                    */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  DEFAULT_WALK_SLUG,
  WALK_TOURS,
  type WalkTourBundle,
} from "@/lib/tours/registry";

export const WALK_TABLE = "walk_tours";

/** Uploaded media lands in this bucket and is read back out under the
 *  site's own origin, so payload paths stay site-relative and the app
 *  that is already with Apple needs no change. */
export const WALK_MEDIA_BUCKET = "walk-media";

/** The URL prefix the serving route answers on. An object's key in the
 *  bucket is exactly the last segment of this path, with no folder in
 *  between, so /media/uploads/harper-court.jpg is walk-media/harper-
 *  court.jpg and nothing has to agree about a prefix twice. */
export const UPLOAD_URL_PREFIX = "/media/uploads";

export interface WalkTourRow {
  slug: string;
  live: boolean;
  sort_order: number;
  bundle: WalkTourBundle;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

/** Returns a response to send back, or null when the caller may write.
 *  Shaped like the studio upload guard so the two read the same way. */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  /* admin or editor, matching migration 010's grants on walk_tours and
     on the walk-media bucket. Requiring admin here while the database
     allows editors would let an editor upload a photograph and then
     fail to save the stop that uses it. */
  const role = (profile as { role?: string } | null)?.role;
  if (!profile || (role !== "admin" && role !== "editor")) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Migration 010 not applied yet                                      */
/* ------------------------------------------------------------------ */

/** Undefined table, or a PostgREST schema cache that has not seen it.
 *  Same detection the exhibit and petition screens use. */
export function isMissingTable(
  error: { code?: string; message?: string } | null
): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes(WALK_TABLE) &&
      (message.includes("does not exist") ||
        message.includes("schema cache")))
  );
}

export function migrationPendingResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "migration-pending",
      message:
        "The walk_tours table does not exist yet. Run migration 010 in the Supabase SQL editor.",
      migrationPending: true,
    },
    { status: 503 }
  );
}

/* ------------------------------------------------------------------ */
/*  The compiled walks                                                 */
/* ------------------------------------------------------------------ */

export { DEFAULT_WALK_SLUG };

/** The bundle compiled into the build, when there is one for this
 *  slug. It is the fallback the public API serves with no row, and it
 *  is what "import from code" copies, so Hyde Park can be edited in a
 *  browser without anyone retyping thirteen stops. */
export function compiledBundle(slug: string): WalkTourBundle | undefined {
  return WALK_TOURS.find((t) => t.slug === slug);
}

export function compiledSummaries() {
  return WALK_TOURS.map((t) => ({
    slug: t.slug,
    title: t.tour.title,
    stopCount: t.tour.stops.length,
  }));
}

/* ------------------------------------------------------------------ */
/*  Bundle shape                                                       */
/* ------------------------------------------------------------------ */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Enough problems to fix a form in one pass, not so many that the
 *  message is unreadable. */
const MAX_PROBLEMS = 25;

export function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" && value !== null && !Array.isArray(value)
  );
}

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export interface BundleCheck {
  ok: boolean;
  problems: string[];
  /** present when ok, with the derived defaults already filled in */
  bundle?: WalkTourBundle;
}

/** Fills the two structural fields the site routes on when they are
 *  absent, following the same shape every walk in the registry uses.
 *  A bundle without them would not break the app, it would quietly
 *  404 on the web, which is worse than failing loudly. */
function withDerivedPaths(
  raw: Record<string, unknown>,
  slug: string
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw, slug };
  if (!isFilledString(out.path)) out.path = `/tours/${slug}-walk`;
  if (!isFilledString(out.mediaDir)) out.mediaDir = `/media/${slug}-walk`;
  return out;
}

/**
 * `complete` is the difference between a draft and a walk the app will
 * try to decode. Drafts only have to carry enough to be editable.
 */
export function checkBundle(
  value: unknown,
  opts: { complete: boolean }
): BundleCheck {
  const problems: string[] = [];
  const add = (message: string) => {
    if (problems.length < MAX_PROBLEMS) problems.push(message);
  };

  if (!isObject(value)) {
    return { ok: false, problems: ["The bundle must be a JSON object."] };
  }

  /* ---- the minimum, always ---- */

  const slug = typeof value.slug === "string" ? value.slug.trim() : "";
  if (!slug) {
    add("bundle.slug is missing. It is the key the app asks for by name.");
  } else if (!SLUG_RE.test(slug)) {
    add(
      `bundle.slug "${slug}" must be lowercase letters and numbers joined by single hyphens.`
    );
  }

  const tour = isObject(value.tour) ? value.tour : null;
  if (!tour) {
    add("bundle.tour is missing. It holds the title, the stops and the route.");
  } else {
    if (!isFilledString(tour.title)) add("bundle.tour.title is missing.");
    if (!Array.isArray(tour.stops)) {
      add("bundle.tour.stops must be an array of stops.");
    }
  }

  const intro = isObject(value.intro) ? value.intro : null;
  if (!intro) {
    add(
      "bundle.intro is missing. It is what a walker reads before the first stop."
    );
  }

  /* ---- everything the iPhone decoder treats as non-optional ---- */

  if (opts.complete) {
    checkForLive(value, tour, intro, add);
  }

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    problems: [],
    bundle: withDerivedPaths(value, slug) as unknown as WalkTourBundle,
  };
}

function checkForLive(
  value: Record<string, unknown>,
  tour: Record<string, unknown> | null,
  intro: Record<string, unknown> | null,
  add: (message: string) => void
) {
  if (tour) {
    if (!isFilledString(tour.dek)) add("bundle.tour.dek is missing.");
    if (!isFilledString(tour.startLabel))
      add("bundle.tour.startLabel is missing.");
    if (!isFiniteNumber(tour.walkMinutes))
      add("bundle.tour.walkMinutes must be a number.");
    if (!isFiniteNumber(tour.listenMinutes))
      add("bundle.tour.listenMinutes must be a number.");
    if (!isFiniteNumber(tour.distanceMiles))
      add("bundle.tour.distanceMiles must be a number.");
    if (!Array.isArray(tour.route))
      add("bundle.tour.route must be an array of lat and lng pairs.");
    if (!Array.isArray(tour.practical)) {
      add("bundle.tour.practical must be an array of good to know cards.");
    } else {
      tour.practical.forEach((card, i) => {
        if (!isObject(card) || !isFilledString(card.title) || !isFilledString(card.text)) {
          add(`bundle.tour.practical[${i}] needs a title and a text.`);
        }
      });
    }

    const stops = Array.isArray(tour.stops) ? tour.stops : [];
    if (stops.length === 0) {
      add("bundle.tour.stops is empty. A live walk needs at least one stop.");
    }

    const seenIds = new Set<string>();
    stops.forEach((raw, i) => {
      const at = `bundle.tour.stops[${i}]`;
      if (!isObject(raw)) {
        add(`${at} must be an object.`);
        return;
      }
      const stop = raw;
      if (!isFilledString(stop.id)) add(`${at}.id is missing.`);
      else if (seenIds.has(stop.id)) {
        add(
          `${at}.id "${stop.id}" is used by an earlier stop. Stop ids have to be unique.`
        );
      } else {
        seenIds.add(stop.id);
      }
      if (!isFiniteNumber(stop.number)) add(`${at}.number must be a number.`);
      if (!isFilledString(stop.title)) add(`${at}.title is missing.`);
      if (typeof stop.dek !== "string") add(`${at}.dek must be a string.`);
      if (!isFiniteNumber(stop.lat)) add(`${at}.lat must be a number.`);
      if (!isFiniteNumber(stop.lng)) add(`${at}.lng must be a number.`);
      if (!isFilledString(stop.audioSrc)) add(`${at}.audioSrc is missing.`);
      if (!isFiniteNumber(stop.audioSeconds))
        add(`${at}.audioSeconds must be a number, measured from the file.`);
      if (!isStringArray(stop.transcript))
        add(`${at}.transcript must be an array of paragraphs.`);
      if (!Array.isArray(stop.images))
        add(`${at}.images must be an array, empty when the stop has no plates.`);
      if (!isFilledString(stop.mapLabel))
        add(`${at}.mapLabel is missing. It is the short name printed on the map.`);
    });
  }

  if (intro) {
    if (!isFilledString(intro.title)) add("bundle.intro.title is missing.");
    if (!isStringArray(intro.paragraphs))
      add("bundle.intro.paragraphs must be an array of paragraphs.");
    if (typeof intro.byline !== "string")
      add("bundle.intro.byline must be a string.");
  }

  /* the drawn map. The app projects stops onto this frame, so a bad
     geometry puts every marker in the wrong place rather than failing */
  const geometry = isObject(value.geometry) ? value.geometry : null;
  if (!geometry) {
    add(
      "bundle.geometry is missing. Generate it with scripts/walk-prep-map.mjs."
    );
  } else {
    const frame = isObject(geometry.frame) ? geometry.frame : null;
    if (!frame) add("bundle.geometry.frame is missing.");
    else {
      for (const key of ["latMin", "latMax", "lngMin", "lngMax"]) {
        if (!isFiniteNumber(frame[key]))
          add(`bundle.geometry.frame.${key} must be a number.`);
      }
    }
    const viewBox = isObject(geometry.viewBox) ? geometry.viewBox : null;
    if (!viewBox || !isFiniteNumber(viewBox.w) || !isFiniteNumber(viewBox.h)) {
      add("bundle.geometry.viewBox needs a numeric w and h.");
    }
    if (!Array.isArray(geometry.water))
      add("bundle.geometry.water must be an array.");
    if (!isObject(geometry.roads))
      add("bundle.geometry.roads must be an object of arterials, locals and alleys.");
    if (!Array.isArray(geometry.rails))
      add("bundle.geometry.rails must be an array.");
  }

  const map = isObject(value.map) ? value.map : null;
  if (!map) {
    add("bundle.map is missing. It is how the walk's map is dressed.");
  } else {
    if (!isFilledString(map.baseMapSrc))
      add("bundle.map.baseMapSrc is missing.");
    if (!isFilledString(map.areaName)) add("bundle.map.areaName is missing.");
    for (const key of [
      "placeLabels",
      "streetLabels",
      "parkAreas",
      "campusAreas",
    ]) {
      if (!Array.isArray(map[key])) add(`bundle.map.${key} must be an array.`);
    }
    if (!isObject(map.stopLabelSide))
      add("bundle.map.stopLabelSide must be an object keyed by stop id.");
  }

  /* the web page. The app ignores these, the site cannot render without them */
  const page = isObject(value.page) ? value.page : null;
  if (!page) {
    add("bundle.page is missing. It carries the page title and the wash.");
  } else {
    if (!isFilledString(page.metaTitle)) add("bundle.page.metaTitle is missing.");
    if (!isFilledString(page.metaDescription))
      add("bundle.page.metaDescription is missing.");
    if (!isFilledString(page.terrain))
      add("bundle.page.terrain is missing. Three or four words about the ground.");
    const wash = isObject(page.wash) ? page.wash : null;
    if (!wash || !isFilledString(wash.src) || typeof wash.alt !== "string") {
      add("bundle.page.wash needs a src and an alt.");
    }
  }

  if (typeof value.path !== "string" || !value.path.startsWith("/")) {
    add("bundle.path must be a site path starting with a slash.");
  }
  if (typeof value.mediaDir !== "string" || !value.mediaDir.startsWith("/")) {
    add("bundle.mediaDir must be a site path starting with a slash.");
  }
}

export function invalidBundleResponse(problems: string[]): NextResponse {
  return NextResponse.json(
    {
      error: "invalid-bundle",
      message:
        problems.length === 1
          ? problems[0]
          : `The bundle has ${problems.length} problems. Fix them and save again.`,
      problems,
    },
    { status: 400 }
  );
}

/* ------------------------------------------------------------------ */
/*  The default walk                                                   */
/* ------------------------------------------------------------------ */

/** The build already in Apple's hands asks for /api/walk with no
 *  parameter and gets Hyde Park. Nothing an admin does in a browser is
 *  allowed to take that away, so unpublishing it, deleting it, or
 *  renaming it out from under itself all stop here. */
export function guardDefaultWalk(
  slug: string,
  action: "unpublish" | "delete"
): NextResponse | null {
  if (slug !== DEFAULT_WALK_SLUG) return null;
  const verb =
    action === "delete" ? "cannot be deleted" : "cannot be taken off the site";
  return NextResponse.json(
    {
      error: "default-walk-protected",
      message: `The ${DEFAULT_WALK_SLUG} walk ${verb}. Every iPhone that already has the app asks for it by name and would be left with nothing. Edit it instead, or publish another walk alongside it.`,
    },
    { status: 409 }
  );
}
