import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  GET /api/podcasts                                                  */
/*  Fetch published podcasts. Optional ?search= filter.                */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query = supabase
      .from("podcasts")
      .select("*")
      .eq("published", true)
      .order("episode_number", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch podcasts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ podcasts: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/podcasts                                                 */
/*  Create a new podcast episode (admin only).                         */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.episode_number || !body.publish_date) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, episode_number, publish_date",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("podcasts")
      .insert({
        title: body.title,
        description: body.description,
        embed_url: body.embed_url || null,
        episode_number: body.episode_number,
        publish_date: body.publish_date,
        guests: body.guests ?? [],
        published: body.published ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create podcast" },
        { status: 500 }
      );
    }

    return NextResponse.json({ podcast: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
