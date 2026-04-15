import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("draft_reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ drafts: data ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    if (!body.draft_body?.trim() || !body.guide_title?.trim()) {
      return NextResponse.json(
        { error: "Draft body and guide title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("draft_reviews")
      .insert({
        user_id: user?.id ?? null,
        guide_slug: body.guide_slug ?? "",
        guide_title: body.guide_title.trim(),
        draft_body: body.draft_body.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    await notifyAdmin({
      subject: "New Draft Review Requested",
      body: `Someone requested a review of their draft for: "${body.guide_title}"`,
      link: "/admin/policy/drafts",
    });

    return NextResponse.json(
      { draft: data, message: "Draft submitted for review" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit draft" },
      { status: 500 }
    );
  }
}
