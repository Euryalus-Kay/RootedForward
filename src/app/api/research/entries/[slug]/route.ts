/* ------------------------------------------------------------------ */
/*  GET    /api/research/entries/[slug]                                */
/*  PATCH  /api/research/entries/[slug]  (admin-only)                  */
/*  DELETE /api/research/entries/[slug]  (admin-only)                  */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  normalizeCitations,
} from "@/lib/research-constants";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

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

export async function GET(_: Request, ctx: RouteContext) {
  const { slug } = await ctx.params;

  if (!isSupabaseConfigured()) {
    const fallback = PLACEHOLDER_RESEARCH_ENTRIES.find((e) => e.slug === slug);
    if (!fallback) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: fallback });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_entries")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) {
      const fallback = PLACEHOLDER_RESEARCH_ENTRIES.find(
        (e) => e.slug === slug
      );
      if (fallback) return NextResponse.json({ data: fallback });
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      data: {
        ...data,
        authors: data.authors ?? [],
        reviewers: data.reviewers ?? [],
        citations: normalizeCitations(data.citations),
        related_campaign_ids: data.related_campaign_ids ?? [],
        related_tour_slugs: data.related_tour_slugs ?? [],
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  }
  const { slug } = await ctx.params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_entries")
      .update(payload)
      .eq("slug", slug)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_: Request, ctx: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  }
  const { slug } = await ctx.params;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("research_entries")
      .delete()
      .eq("slug", slug);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
