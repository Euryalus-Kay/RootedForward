import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  GET /api/stops                                                     */
/*  Fetch published stops. Optional ?city= and ?search= filters.      */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const search = searchParams.get("search");

    let query = supabase
      .from("tour_stops")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (city) {
      query = query.ilike("city", city);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch stops" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stops: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/stops                                                    */
/*  Create a new tour stop (admin only).                               */
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

    if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.city || !body.slug || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields: title, city, slug, description" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tour_stops")
      .insert({
        city: body.city,
        title: body.title,
        slug: body.slug,
        lat: body.lat ?? 0,
        lng: body.lng ?? 0,
        description: body.description,
        video_url: body.video_url || null,
        images: body.images ?? [],
        sources: body.sources ?? [],
        published: body.published ?? false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create stop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stop: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
