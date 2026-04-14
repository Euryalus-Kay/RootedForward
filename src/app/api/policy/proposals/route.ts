import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
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
