import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

/* ------------------------------------------------------------------ */
/*  Helper: verify the current user has admin or editor role           */
/* ------------------------------------------------------------------ */
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin =
    profile?.role === "admin" || profile?.role === "editor";

  return { user, isAdmin };
}

/* ------------------------------------------------------------------ */
/*  GET /api/stops/[id]                                                */
/*  Fetch a single tour stop by ID.                                    */
/* ------------------------------------------------------------------ */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tour_stops")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Tour stop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stop: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/stops/[id]                                              */
/*  Update a tour stop (admin/editor only).                            */
/* ------------------------------------------------------------------ */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, isAdmin } = await verifyAdmin(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Build update payload — only include fields that were sent
    type StopUpdate = Database["public"]["Tables"]["tour_stops"]["Update"];
    const updateData: StopUpdate = {};
    const allowedFields = [
      "city",
      "title",
      "slug",
      "lat",
      "lng",
      "description",
      "video_url",
      "images",
      "sources",
      "published",
    ] as const;

    for (const key of allowedFields) {
      if (key in body) {
        (updateData as Record<string, unknown>)[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tour_stops")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update stop" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Tour stop not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stop: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/stops/[id]                                             */
/*  Delete a tour stop (admin/editor only).                            */
/* ------------------------------------------------------------------ */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { user, isAdmin } = await verifyAdmin(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("tour_stops")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete stop" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Tour stop deleted" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
