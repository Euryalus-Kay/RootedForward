import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

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
    if (!body.campaign_id) {
      return NextResponse.json(
        { error: "Missing campaign_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("signatures")
      .insert({
        campaign_id: body.campaign_id,
        user_id: user.id,
        is_public: body.is_public ?? true,
        digital_signature_svg: body.signature_svg ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already signed this campaign" },
          { status: 409 }
        );
      }
      throw error;
    }

    await notifyAdmin({
      subject: "New Campaign Signature",
      body: `Someone signed a campaign.`,
      link: "/admin/policy/signatures",
    });

    return NextResponse.json(
      { signature: data, message: "Signature added" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to add signature" },
      { status: 500 }
    );
  }
}
