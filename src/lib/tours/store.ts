/* ------------------------------------------------------------------ */
/*  Where a walking tour actually comes from.                          */
/*                                                                     */
/*  registry.ts still holds the compiled walks and still owns the      */
/*  types. This module is the layer above it, and it is the only       */
/*  thing /api/walk and the tour pages should read. A walk edited in   */
/*  the browser lands in the walk_tours table (migration 010), a walk  */
/*  that has never been edited is still the constant in registry.ts,   */
/*  and callers cannot tell the difference. Same Supabase-first,       */
/*  TypeScript-constant-as-fallback pattern as the research entries,   */
/*  the petitions and the immersive tours.                             */
/*                                                                     */
/*  The fallback is not a nicety here. /api/walk is what the iPhone    */
/*  app refetches on every launch and every foreground, and a walker   */
/*  standing on 53rd Street with the app open is the person who pays   */
/*  for an outage. So nothing in this file throws, and a database      */
/*  that is unreachable, unconfigured or missing migration 010 gets    */
/*  the compiled walks served in its place.                            */
/* ------------------------------------------------------------------ */

import { getWalkTour, WALK_TOURS, type WalkTourBundle } from "./registry";

/** the columns the public read needs. `live` is a filter, not a
 *  payload, so it never comes back over the wire. */
const ROW_COLUMNS = "slug, sort_order, bundle";

interface WalkTourRow {
  slug: string;
  sort_order: number;
  bundle: unknown;
}

/* ------------------------------------------------------------------ */
/*  Quiet failure                                                      */
/* ------------------------------------------------------------------ */

/** Once per process, not once per request. This runs on every walk
 *  payload, and a database that is down would otherwise fill the
 *  logs with the same line thousands of times and bury whatever
 *  else went wrong. */
let warnedAboutDatabase = false;
/* Row problems latch per slug, because "the database is down" and
   "the walk you just saved is malformed" are different news and the
   second must not be silenced by the first. */
const warnedRows = new Set<string>();

function warnOnce(reason: string): void {
  if (warnedAboutDatabase) return;
  warnedAboutDatabase = true;
  console.warn(
    `[walk-tours] serving the compiled walks, the database read did not work. ${reason}`
  );
}

function reasonOf(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/*                                                                     */
/*  A row is a whole bundle written by the admin editor, so it can be  */
/*  half-finished in ways a compiled constant never is. This check is  */
/*  deliberately shallow. It is looking for a row that would render a  */
/*  broken page or crash the app on parse, not proofreading the walk.  */
/*  A bundle that fails is skipped and the compiled walk of the same   */
/*  slug carries on, which is the whole point of keeping both.         */
/* ------------------------------------------------------------------ */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function looksLikeBundle(value: unknown): value is WalkTourBundle {
  if (!isPlainObject(value)) return false;

  const { slug, path, mediaDir, tour, intro, geometry, map, page } = value;
  if (typeof slug !== "string" || slug.length === 0) return false;
  if (typeof path !== "string" || typeof mediaDir !== "string") return false;

  // a walk with no stops is not a walk
  if (!isPlainObject(tour) || !Array.isArray(tour.stops) || tour.stops.length === 0) {
    return false;
  }
  // the app falls back to the written intro when there is no film,
  // so the paragraphs have to be there even when a video is set
  if (!isPlainObject(intro) || !Array.isArray(intro.paragraphs)) return false;
  // The map cannot draw itself without a frame and a viewBox. The
  // viewBox check is not decoration. walk-utils divides by VB.w and
  // WalkMap reads geo.viewBox.w unguarded, so a bundle carrying a
  // frame and no viewBox would pass here, beat the compiled walk, and
  // then throw while rendering the tour page. Falling back is the
  // whole job of this function.
  if (!isPlainObject(geometry) || !isPlainObject(geometry.frame)) return false;
  if (
    !isPlainObject(geometry.viewBox) ||
    typeof (geometry.viewBox as Record<string, unknown>).w !== "number" ||
    typeof (geometry.viewBox as Record<string, unknown>).h !== "number"
  ) {
    return false;
  }
  if (!isPlainObject(map) || !isPlainObject(page)) return false;

  return true;
}

/** The row's primary key is the address /api/walk answers on, so it
 *  wins over whatever slug the stored document happens to carry. A
 *  bundle copied from another walk and half-renamed would otherwise
 *  answer under two names. */
function withRowSlug(bundle: WalkTourBundle, slug: string): WalkTourBundle {
  return bundle.slug === slug ? bundle : { ...bundle, slug };
}

/* ------------------------------------------------------------------ */
/*  Loading                                                            */
/* ------------------------------------------------------------------ */

/** The Supabase server client reaches for next/headers, which only
 *  exists inside a request. Importing it lazily keeps this module
 *  usable from the build scripts that export the app's bundled
 *  snapshot, where there is no request and the compiled walks are
 *  the right answer anyway. immersive/data.ts does the same. */
async function readLiveRows(
  filterSlug?: string
): Promise<WalkTourRow[] | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) {
      warnOnce("Supabase is not configured in this environment.");
      return null;
    }

    const supabase = await createClient();
    let query = supabase
      .from("walk_tours")
      .select(ROW_COLUMNS)
      .eq("live", true)
      .order("sort_order", { ascending: true });
    if (filterSlug) query = query.eq("slug", filterSlug);

    const { data, error } = await query;
    if (error) {
      // migration 010 not applied yet reads as a missing table here,
      // and it is the same answer as any other failure
      warnOnce(reasonOf(error));
      return null;
    }
    return (data ?? []) as unknown as WalkTourRow[];
  } catch (err) {
    warnOnce(reasonOf(err));
    return null;
  }
}

/**
 * Every walk the site should serve, database rows merged over the
 * compiled ones.
 *
 * The compiled list keeps its order and a row of the same slug
 * replaces its constant in place, so Hyde Park stays where every
 * caller expects to find it. Walks that exist only in the database
 * follow, in the owner's sort_order. Compiled walks with no row are
 * returned untouched, which is why nothing had to be seeded.
 */
export async function loadWalkBundles(): Promise<WalkTourBundle[]> {
  const rows = await readLiveRows();
  if (!rows || rows.length === 0) return [...WALK_TOURS];

  const fromDatabase = new Map<string, WalkTourBundle>();
  for (const row of rows) {
    if (!row || typeof row.slug !== "string") continue;
    if (!looksLikeBundle(row.bundle)) {
      warnOnce(`the stored walk "${row.slug}" is not a complete bundle.`);
      continue;
    }
    fromDatabase.set(row.slug, withRowSlug(row.bundle, row.slug));
  }
  if (fromDatabase.size === 0) return [...WALK_TOURS];

  const merged = WALK_TOURS.map((compiled) => {
    const row = fromDatabase.get(compiled.slug);
    if (row) fromDatabase.delete(compiled.slug);
    return row ?? compiled;
  });

  // whatever is left never had a constant, and the map preserved the
  // sort_order the query came back in
  return [...merged, ...fromDatabase.values()];
}

/**
 * One walk by slug, or undefined when neither the database nor the
 * compiled list has it. Reads the single row rather than the whole
 * table, because a bundle is a large document and /api/walk asks for
 * exactly one of them.
 */
export async function loadWalkBundle(
  slug: string
): Promise<WalkTourBundle | undefined> {
  const compiled = getWalkTour(slug);

  const rows = await readLiveRows(slug);
  if (!rows || rows.length === 0) return compiled;

  const row = rows[0];
  if (!looksLikeBundle(row.bundle)) {
    warnOnce(`the stored walk "${slug}" is not a complete bundle.`);
    return compiled;
  }
  return withRowSlug(row.bundle, slug);
}
