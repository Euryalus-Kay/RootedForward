import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("draft_comments")
      .select("*, users(full_name, role)")
      .eq("draft_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ comments: data ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.body?.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();

    const { data, error } = await supabase
      .from("draft_comments")
      .insert({
        draft_id: id,
        author_id: user.id,
        is_admin: profile?.role === "admin",
        body: body.body.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ comment: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
