/* ------------------------------------------------------------------ */
/*  GET    /api/admin/walks/[slug]   the whole bundle, for the editor  */
/*  PUT    /api/admin/walks/[slug]   replace the bundle                */
/*  PATCH  /api/admin/walks/[slug]   live and sort order only          */
/*  DELETE /api/admin/walks/[slug]   remove the row                    */
/*                                                                     */
/*  Admin only, every verb.                                            */
/*                                                                     */
/*  Publishing is the moment that matters. A draft can be as           */
/*  unfinished as the owner likes, but the instant a row goes live it  */
/*  is what /api/walk hands to every iPhone holding the app, and the   */
/*  Swift decoder treats nearly every field as required. So both the   */
/*  verb that writes a live bundle and the verb that flips live on run */
/*  the full check first, and say what is missing rather than          */
/*  publishing something that decodes to a blank screen on a sidewalk. */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_WALK_SLUG,
  WALK_TABLE,
  checkBundle,
  compiledBundle,
  guardDefaultWalk,
  invalidBundleResponse,
  isMissingTable,
  isObject,
  migrationPendingResponse,
  requireAdmin,
  type WalkTourRow,
} from "../_shared";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

const ROW_COLUMNS = "slug, live, sort_order, bundle, updated_at";

/** how many stops the table currently holds for this walk */
function storedStopCount(row: unknown): number {
  if (!isObject(row) || !isObject(row.bundle)) return 0;
  const tour = isObject(row.bundle.tour) ? row.bundle.tour : null;
  return tour && Array.isArray(tour.stops) ? tour.stops.length : 0;
}

/* ------------------------------------------------------------------ */
/*  GET                                                                */
/* ------------------------------------------------------------------ */

export async function GET(_: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(WALK_TABLE)
    .select(ROW_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error && !isMissingTable(error)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json({ data: data as WalkTourRow, source: "database" });
  }

  /* No row. If the build carries this walk it is still the one the
     site serves, so hand it back for editing rather than a 404. Saving
     it with POST is what turns it into a row. */
  const compiled = compiledBundle(slug);
  if (compiled) {
    return NextResponse.json({
      data: {
        slug: compiled.slug,
        live: true,
        sort_order: 0,
        bundle: compiled,
        updated_at: null,
      },
      source: "code",
    });
  }

  if (error && isMissingTable(error)) return migrationPendingResponse();
  return NextResponse.json({ error: "No walk by that name." }, { status: 404 });
}

/* ------------------------------------------------------------------ */
/*  PUT                                                                */
/* ------------------------------------------------------------------ */

export async function PUT(request: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await ctx.params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from(WALK_TABLE)
    .select("slug, live, sort_order, bundle")
    .eq("slug", slug)
    .maybeSingle();

  if (readError) {
    if (isMissingTable(readError)) return migrationPendingResponse();
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json(
      {
        error: `There is no walk row named "${slug}" yet. Create it first.`,
      },
      { status: 404 }
    );
  }

  /* from code puts the compiled version back, which is the way out of
     an edit that went wrong. Deleting the row is not available for the
     default walk, so this is how it gets restored. */
  let rawBundle: unknown;
  if (payload.from === "code") {
    const compiled = compiledBundle(slug);
    if (!compiled) {
      return NextResponse.json(
        { error: `There is no walk named "${slug}" in the build to restore.` },
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

  const bundleSlug =
    isObject(rawBundle) && typeof rawBundle.slug === "string"
      ? rawBundle.slug.trim()
      : "";
  if (bundleSlug && bundleSlug !== slug) {
    return NextResponse.json(
      {
        error: `This row is "${slug}" and the bundle says "${bundleSlug}". A walk cannot be renamed by saving over it. Create the new slug and remove the old row.`,
      },
      { status: 400 }
    );
  }
  if (isObject(rawBundle)) rawBundle = { ...rawBundle, slug };

  if (payload.live === false) {
    const guard = guardDefaultWalk(slug, "unpublish");
    if (guard) return guard;
  }
  /* a walk that says nothing about live keeps the state it had, and
     the default walk is live whether or not the caller mentioned it */
  const live =
    typeof payload.live === "boolean"
      ? payload.live
      : (existing as { live: boolean }).live || slug === DEFAULT_WALK_SLUG;

  const check = checkBundle(rawBundle, { complete: live });
  if (!check.ok || !check.bundle) {
    return invalidBundleResponse(check.problems);
  }

  /* A save that empties a walk that had stops is almost always a
     stale copy being written back rather than someone deleting a
     year of work on purpose, so it stops here and says so. Anyone who
     means it sends allowEmptyStops. */
  const storedStops = storedStopCount(existing);
  if (
    storedStops > 0 &&
    check.bundle.tour.stops.length === 0 &&
    payload.allowEmptyStops !== true
  ) {
    return NextResponse.json(
      {
        error: "would-empty-walk",
        message: `This save has no stops and the stored ${slug} walk has ${storedStops}. Reload the walk and save again. Send allowEmptyStops if you really mean to clear it.`,
      },
      { status: 409 }
    );
  }

  const update: Record<string, unknown> = {
    bundle: check.bundle,
    live,
    updated_at: new Date().toISOString(),
  };
  if (
    typeof payload.sort_order === "number" &&
    Number.isFinite(payload.sort_order)
  ) {
    update.sort_order = Math.trunc(payload.sort_order);
  }

  const { data, error } = await supabase
    .from(WALK_TABLE)
    .update(update)
    .eq("slug", slug)
    .select("slug, live, sort_order, updated_at")
    .single();

  if (error) {
    if (isMissingTable(error)) return migrationPendingResponse();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/* ------------------------------------------------------------------ */
/*  PATCH                                                              */
/* ------------------------------------------------------------------ */

export async function PATCH(request: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await ctx.params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const wantsLive = typeof payload.live === "boolean";
  const wantsOrder =
    typeof payload.sort_order === "number" &&
    Number.isFinite(payload.sort_order);

  if (!wantsLive && !wantsOrder) {
    return NextResponse.json(
      { error: "Send live or sort_order. Nothing else changes here." },
      { status: 400 }
    );
  }

  if (wantsLive && payload.live === false) {
    const guard = guardDefaultWalk(slug, "unpublish");
    if (guard) return guard;
  }

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from(WALK_TABLE)
    .select("slug, live, bundle")
    .eq("slug", slug)
    .maybeSingle();

  if (readError) {
    if (isMissingTable(readError)) return migrationPendingResponse();
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json(
      { error: `There is no walk row named "${slug}".` },
      { status: 404 }
    );
  }

  /* going live is the same commitment as saving a live bundle, so it
     gets the same check. Otherwise a half written draft reaches the
     app through a toggle nobody thought of as a publish. */
  if (wantsLive && payload.live === true) {
    const check = checkBundle((existing as { bundle: unknown }).bundle, {
      complete: true,
    });
    if (!check.ok) {
      return invalidBundleResponse(check.problems);
    }
  }

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (wantsLive) update.live = payload.live;
  if (wantsOrder) update.sort_order = Math.trunc(payload.sort_order as number);

  const { data, error } = await supabase
    .from(WALK_TABLE)
    .update(update)
    .eq("slug", slug)
    .select("slug, live, sort_order, updated_at")
    .single();

  if (error) {
    if (isMissingTable(error)) return migrationPendingResponse();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/* ------------------------------------------------------------------ */
/*  DELETE                                                             */
/* ------------------------------------------------------------------ */

export async function DELETE(_: Request, ctx: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { slug } = await ctx.params;

  const guard = guardDefaultWalk(slug, "delete");
  if (guard) return guard;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(WALK_TABLE)
    .delete()
    .eq("slug", slug)
    .select("slug");

  if (error) {
    if (isMissingTable(error)) return migrationPendingResponse();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: `There is no walk row named "${slug}".` },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, slug });
}
