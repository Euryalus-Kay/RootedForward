import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

/* ------------------------------------------------------------------ */
/*  GET /api/user/profile                                              */
/*  Get the currently authenticated user's profile.                    */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/user/profile                                            */
/*  Update the current user's profile.                                 */
/*  Allowed fields: full_name, saved_stops, visited_stops              */
/* ------------------------------------------------------------------ */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Only allow specific fields to be updated
    type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
    const updateData: UserUpdate = {};
    const allowedFields = ["full_name", "saved_stops", "visited_stops"] as const;

    for (const key of allowedFields) {
      if (key in body) {
        (updateData as Record<string, unknown>)[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update. Allowed: full_name, saved_stops, visited_stops" },
        { status: 400 }
      );
    }

    // Validate array fields
    if (
      "saved_stops" in updateData &&
      !Array.isArray(updateData.saved_stops)
    ) {
      return NextResponse.json(
        { error: "saved_stops must be an array" },
        { status: 400 }
      );
    }

    if (
      "visited_stops" in updateData &&
      !Array.isArray(updateData.visited_stops)
    ) {
      return NextResponse.json(
        { error: "visited_stops must be an array" },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
