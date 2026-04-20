/* ------------------------------------------------------------------ */
/*  GET    /api/research/directors/[id]                                */
/*  PATCH  /api/research/directors/[id] (admin-only)                   */
/*  DELETE /api/research/directors/[id] (admin-only)                   */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { PLACEHOLDER_INDUSTRY_DIRECTORS } from "@/lib/research-constants";

interface RouteContext {
  params: Promise<{ id: string }>;
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
  const { id } = await ctx.params;

  if (!isSupabaseConfigured()) {
    const fallback = PLACEHOLDER_INDUSTRY_DIRECTORS.find(
      (d) => d.id === id || d.slug === id
    );
    if (!fallback) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: fallback });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("industry_directors")
      .select("*")
      .or(`id.eq.${id},slug.eq.${id}`)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: guard.status });
  }

  const { id } = await ctx.params;

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("industry_directors")
      .update(payload)
      .eq("id", id)
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
  const { id } = await ctx.params;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("industry_directors")
      .delete()
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
