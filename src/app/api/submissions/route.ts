import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin } from "@/lib/notify";

/* ------------------------------------------------------------------ */
/*  GET /api/submissions                                               */
/*  List submissions (admin only). Optional ?type= filter.             */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

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

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let query = supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (type && (type === "volunteer" || type === "contact")) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/submissions                                              */
/*  Create a new submission (public — for contact/volunteer forms).     */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.name || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields: type, name, email" },
        { status: 400 }
      );
    }

    // Validate type
    if (body.type !== "volunteer" && body.type !== "contact") {
      return NextResponse.json(
        { error: "Type must be 'volunteer' or 'contact'" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        type: body.type,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        message: body.message?.trim() || null,
        phone: body.phone?.trim() || null,
        chapter: body.chapter?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      );
    }

    const isVolunteer = body.type === "volunteer";
    const isCurriculum =
      body.type === "contact" &&
      (body.chapter === "Curriculum Request" ||
        (body.message ?? "").includes("[CURRICULUM REQUEST]"));
    const subject = isCurriculum
      ? "New Curriculum Request"
      : isVolunteer
        ? "New Volunteer Application"
        : "New Contact Form Submission";
    await notifyAdmin({
      subject,
      body: `${body.name} (${body.email}) submitted a ${isCurriculum ? "curriculum request" : body.type + " form"}.${body.chapter ? `\nChapter: ${body.chapter}` : ""}${body.message ? `\nMessage: ${body.message.substring(0, 400)}` : ""}`,
      link: "/admin/submissions",
    });

    return NextResponse.json(
      { submission: data, message: "Submission received" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
