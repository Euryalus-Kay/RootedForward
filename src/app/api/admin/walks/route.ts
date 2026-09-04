/* ------------------------------------------------------------------ */
/*  GET  /api/admin/walks    every walk row, drafts included           */
/*  POST /api/admin/walks    create one                                */
/*                                                                     */
/*  Admin only, both verbs. The list is deliberately light. A whole    */
/*  bundle carries its geometry, which for Hyde Park alone is a        */
/*  hundred kilobytes of road centerlines, so the index answers with   */
/*  what a table of walks needs and the detail route hands over the    */
/*  bundle when the owner opens one. Flipping a walk live from the     */
/*  list is a PATCH for the same reason, since a trimmed row sent      */
/*  back as if it were a whole bundle would round trip as a wipe.      */
/*                                                                     */
/*  The list also names the walks that exist only in the build. The    */
/*  public store reads a row first and falls back to the compiled      */
/*  constant, the same way research and policy already work, so a      */
/*  compiled walk with no row is what the site is serving right now    */
/*  and simply is not editable yet. POST with from set to code copies  */
/*  that compiled bundle into a row, which is how Hyde Park becomes    */
/*  editable in a browser without anyone retyping thirteen stops.      */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_WALK_SLUG,
  WALK_TABLE,
  checkBundle,
  compiledBundle,
  compiledSummaries,
  invalidBundleResponse,
  isMissingTable,
  isObject,
  migrationPendingResponse,
  requireAdmin,
} from "./_shared";

interface WalkListRow {
  slug: string;
  live: boolean;
  sort_order: number;
  updated_at: string;
  bundle: unknown;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(WALK_TABLE)
    .select("slug, live, sort_order, updated_at, bundle")
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });

  if (error) {
    if (isMissingTable(error)) return migrationPendingResponse();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as WalkListRow[];

  /* one line per walk, enough to draw a table and no more */
  const summaries = rows.map((row) => {
    const bundle: Record<string, unknown> = isObject(row.bundle)
      ? row.bundle
      : {};
    const tour: Record<string, unknown> = isObject(bundle.tour)
      ? bundle.tour
      : {};
    const stops = Array.isArray(tour.stops) ? tour.stops : [];
    return {
      slug: row.slug,
      live: row.live,
      sort_order: row.sort_order,
      updated_at: row.updated_at,
      title: typeof tour.title === "string" ? tour.title : "",
      stopCount: stops.length,
      isDefault: row.slug === DEFAULT_WALK_SLUG,
    };
  });

  const haveRows = new Set(rows.map((row) => row.slug));

  return NextResponse.json({
    data: summaries,
    /* the walks compiled into the build. hasRow false means this walk
       is still being served out of TypeScript and can be imported. */
    compiled: compiledSummaries().map((walk) => ({
      ...walk,
      hasRow: haveRows.has(walk.slug),
    })),
    defaultSlug: DEFAULT_WALK_SLUG,
  });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  /* from code copies a walk that already exists in the build */
  const fromCode = payload.from === "code";
  const askedSlug =
    typeof payload.slug === "string" ? payload.slug.trim() : "";

  let rawBundle: unknown;
  if (fromCode) {
    if (!askedSlug) {
      return NextResponse.json(
        { error: "Importing from code needs a slug." },
        { status: 400 }
      );
    }
    const compiled = compiledBundle(askedSlug);
    if (!compiled) {
      return NextResponse.json(
        {
          error: `There is no walk named "${askedSlug}" in the build. Only ${compiledSummaries()
            .map((w) => w.slug)
            .join(", ")} can be imported.`,
        },
        { status: 404 }
      );
    }
    rawBundle = compiled;
  } else {
    rawBundle = payload.bundle;
    if (rawBundle === undefined) {
      return NextResponse.json(
        { error: "Missing bundle. Send the whole walk under a bundle key." },
        { status: 400 }
      );
    }
  }

  /* the row key and the key inside the bundle are the same key. The
     store and /api/walk both look a walk up by it, so a mismatch would
     hand the app a payload that names a walk it did not ask for. */
  const bundleObject = isObject(rawBundle) ? rawBundle : null;
  const bundleSlug =
    bundleObject && typeof bundleObject.slug === "string"
      ? bundleObject.slug.trim()
      : "";
  if (askedSlug && bundleSlug && askedSlug !== bundleSlug) {
    return NextResponse.json(
      {
        error: `The slug "${askedSlug}" does not match bundle.slug "${bundleSlug}". They have to be the same.`,
      },
      { status: 400 }
    );
  }
  const slug = bundleSlug || askedSlug;
  if (bundleObject && slug) rawBundle = { ...bundleObject, slug };

  /* Hyde Park is what a shipped iPhone asks for by name, so a row for
     it is live or it is not written at all */
  const isDefault = slug === DEFAULT_WALK_SLUG;
  if (isDefault && payload.live === false) {
    return NextResponse.json(
      {
        error: "default-walk-protected",
        message: `The ${DEFAULT_WALK_SLUG} walk has to stay on the site. Save it live, or leave live unset and it will be published.`,
      },
      { status: 409 }
    );
  }
  const live = isDefault ? true : payload.live === true;

  const check = checkBundle(rawBundle, { complete: live });
  if (!check.ok || !check.bundle) {
    return invalidBundleResponse(check.problems);
  }

  const sortOrder =
    typeof payload.sort_order === "number" &&
    Number.isFinite(payload.sort_order)
      ? Math.trunc(payload.sort_order)
      : 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(WALK_TABLE)
    .insert({
      slug: check.bundle.slug,
      live,
      sort_order: sortOrder,
      bundle: check.bundle,
    })
    /* the row's own columns and no bundle, since the caller is still
       holding the thing it just sent */
    .select("slug, live, sort_order, updated_at")
    .single();

  if (error) {
    if (isMissingTable(error)) return migrationPendingResponse();
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: `A walk named "${check.bundle.slug}" already exists. Open it and save over it instead.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
