import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const body = await request.json();

    if (
      !body.proposal_title?.trim() ||
      !body.problem_description?.trim() ||
      !body.proposed_solution?.trim()
    ) {
      return NextResponse.json(
        { error: "Title, problem description, and proposed solution are required" },
        { status: 400 }
      );
    }

    // Check if user is logged in (optional for proposals)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("proposal_submissions")
      .insert({
        user_id: user?.id ?? null,
        submitter_name: body.name?.trim() || null,
        submitter_email: body.email?.trim()?.toLowerCase() || null,
        neighborhood: body.neighborhood?.trim() || null,
        proposal_title: body.proposal_title.trim(),
        problem_description: body.problem_description.trim(),
        proposed_solution: body.proposed_solution.trim(),
        evidence_sources: body.evidence_sources?.trim() || null,
        wants_to_collaborate: body.wants_to_collaborate ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    await notifyAdmin({
      subject: "New Policy Proposal Submitted",
      body: `${body.name || "Anonymous"} submitted a policy proposal: "${body.proposal_title}"\n\nNeighborhood: ${body.neighborhood || "Not specified"}\nEmail: ${body.email || "Not provided"}`,
      link: "/admin/policy/proposals",
    });

    return NextResponse.json(
      { proposal: data, message: "Proposal submitted" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit proposal" },
      { status: 500 }
    );
  }
}
