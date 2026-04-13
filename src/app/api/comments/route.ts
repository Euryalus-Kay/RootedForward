import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  GET /api/comments                                                  */
/*  Fetch approved comments for a tour stop. ?stop_id= is required.    */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const stopId = searchParams.get("stop_id");

    if (!stopId) {
      return NextResponse.json(
        { error: "Missing required parameter: stop_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        approved,
        created_at,
        stop_id,
        user_id,
        users ( full_name, email )
      `
      )
      .eq("stop_id", stopId)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Map data to a cleaner shape
    const comments = (data ?? []).map((row: Record<string, unknown>) => {
      const userData = row.users as { full_name: string | null; email: string } | null;
      return {
        id: row.id,
        content: row.content,
        created_at: row.created_at,
        stop_id: row.stop_id,
        user_name: userData?.full_name ?? "Anonymous",
      };
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/comments                                                 */
/*  Create a new comment (authenticated users only).                   */
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

    const body = await request.json();

    // Validate required fields
    if (!body.stop_id || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: stop_id, content" },
        { status: 400 }
      );
    }

    // Validate content length
    const content = body.content.trim();
    if (content.length < 2 || content.length > 2000) {
      return NextResponse.json(
        { error: "Comment must be between 2 and 2000 characters" },
        { status: 400 }
      );
    }

    // Verify the stop exists
    const { data: stop } = await supabase
      .from("tour_stops")
      .select("id")
      .eq("id", body.stop_id)
      .single();

    if (!stop) {
      return NextResponse.json(
        { error: "Tour stop not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        stop_id: body.stop_id,
        user_id: user.id,
        content,
        approved: false, // Comments require moderation
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { comment: data, message: "Comment submitted for review" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
