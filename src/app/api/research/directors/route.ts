/* ------------------------------------------------------------------ */
/*  GET  /api/research/directors                                       */
/*  POST /api/research/directors (admin-only)                          */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { PLACEHOLDER_INDUSTRY_DIRECTORS } from "@/lib/research-constants";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!data || (data as { role?: string }).role !== "admin") {
    return { ok: false as const, status: 403 };
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("include_archived") === "true";

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      data: PLACEHOLDER_INDUSTRY_DIRECTORS.filter(
        (d) => includeArchived || d.is_active
      ),
    });
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("industry_directors")
      .select("*")
      .order("display_order", { ascending: true });

    if (!includeArchived) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return NextResponse.json({
        data: PLACEHOLDER_INDUSTRY_DIRECTORS.filter(
          (d) => includeArchived || d.is_active
        ),
      });
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({
      data: PLACEHOLDER_INDUSTRY_DIRECTORS.filter(
        (d) => includeArchived || d.is_active
      ),
    });
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requiredFields = ["slug", "full_name", "title", "affiliation", "bio"];
  for (const field of requiredFields) {
    if (!payload[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 422 }
      );
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("industry_directors")
      .insert({
        slug: String(payload.slug),
        full_name: String(payload.full_name),
        title: String(payload.title),
        affiliation: String(payload.affiliation),
        bio: String(payload.bio),
        photo_url:
          typeof payload.photo_url === "string" ? payload.photo_url : null,
        website_url:
          typeof payload.website_url === "string"
            ? payload.website_url
            : null,
        institutional_url:
          typeof payload.institutional_url === "string"
            ? payload.institutional_url
            : null,
        linkedin_url:
          typeof payload.linkedin_url === "string"
            ? payload.linkedin_url
            : null,
        focus_areas: Array.isArray(payload.focus_areas)
          ? (payload.focus_areas as string[])
          : [],
        display_order:
          typeof payload.display_order === "number"
            ? payload.display_order
            : 0,
        is_active: payload.is_active !== false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
