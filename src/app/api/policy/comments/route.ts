import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("public_comments")
      .select("id, comment_body, created_at, users(full_name)")
      .eq("campaign_id", campaignId)
      .eq("is_approved", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ comments: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.campaign_id || !body.comment_body?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const commentBody = body.comment_body.trim();
    if (commentBody.length < 10 || commentBody.length > 5000) {
      return NextResponse.json(
        { error: "Comment must be between 10 and 5000 characters" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("public_comments")
      .insert({
        campaign_id: body.campaign_id,
        user_id: user.id,
        comment_body: commentBody,
        is_public: body.is_public ?? true,
        is_approved: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already submitted a comment on this campaign" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { comment: data, message: "Comment submitted for review" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 }
    );
  }
}
