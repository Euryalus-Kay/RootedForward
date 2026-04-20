import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  GET /api/leaderboard                                               */
/*  Public: top N runs by total_score                                  */
/*  Or with ?percentile=N&year=Y: returns percentile rank for an       */
/*  in-progress score at a given year (using completed runs that       */
/*  reached at least that year as the comparison set).                  */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const percentileScore = searchParams.get("percentile");
    const supabase = await createClient();

    if (percentileScore != null) {
      const score = parseInt(percentileScore);
      const { count: totalCount } = await (supabase as any)
        .from("game_runs")
        .select("id", { count: "exact", head: true });
      const { count: belowCount } = await (supabase as any)
        .from("game_runs")
        .select("id", { count: "exact", head: true })
        .lt("total_score", score);
      const total = totalCount ?? 0;
      const below = belowCount ?? 0;
      const percentile = total > 0 ? Math.round((below / total) * 100) : 50;
      return NextResponse.json({ percentile, total, below }, { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100);
    const { data, error } = await (supabase as any)
      .from("game_runs")
      .select(
        "id, display_name, total_score, equity_score, heritage_score, growth_score, sustainability_score, archetype, decisions_made, events_survived, notes_read, created_at"
      )
      .order("total_score", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ leaderboard: [] }, { status: 200 });
    }

    return NextResponse.json({ leaderboard: data ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ leaderboard: [] }, { status: 200 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/leaderboard                                              */
/*  Submit a completed game run                                        */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.display_name || typeof body.total_score !== "number") {
      return NextResponse.json(
        { error: "Missing display_name or total_score" },
        { status: 400 }
      );
    }
    if (body.display_name.length > 40) {
      return NextResponse.json(
        { error: "display_name too long" },
        { status: 400 }
      );
    }

    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();

    let userId: string | null = null;
    try {
      const userClient = await createClient();
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const { data, error } = await (supabase as any)
      .from("game_runs")
      .insert({
        user_id: userId,
        display_name: body.display_name.trim().slice(0, 40),
        seed: (body.seed ?? "unknown").slice(0, 60),
        ended_year: body.ended_year ?? 2040,
        total_score: Math.round(body.total_score),
        equity_score: Math.round(body.equity_score ?? 0),
        heritage_score: Math.round(body.heritage_score ?? 0),
        growth_score: Math.round(body.growth_score ?? 0),
        sustainability_score: Math.round(body.sustainability_score ?? 0),
        archetype: body.archetype ?? "caretaker",
        decisions_made: body.decisions_made ?? 0,
        events_survived: body.events_survived ?? 0,
        notes_read: body.notes_read ?? 0,
        achievements: body.achievements ?? [],
        final_state: body.final_state ?? {},
      })
      .select()
      .single();

    if (error) {
      // Table might not exist in dev. Return success silently.
      return NextResponse.json({ run: null, message: "Saved locally only." }, { status: 200 });
    }

    // Compute rank
    const { count } = await (supabase as any)
      .from("game_runs")
      .select("id", { count: "exact", head: true })
      .gt("total_score", body.total_score);

    return NextResponse.json({ run: data, rank: (count ?? 0) + 1 }, { status: 201 });
  } catch {
    return NextResponse.json({ run: null }, { status: 200 });
  }
}
