import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { notifyAdmin, notificationsConfigured } from "@/lib/notify";

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
/*                                                                     */
/*  Public form submission endpoint used by the contact form, the     */
/*  volunteer form, and the curriculum request form.                   */
/*                                                                     */
/*  The endpoint tries two things in parallel and succeeds if either  */
/*  works:                                                             */
/*                                                                     */
/*    1. Save the submission to the submissions table via the admin  */
/*       Supabase client.                                              */
/*    2. Email the admin via Resend, with the user's address set as   */
/*       reply-to so the admin can reply directly from their inbox.   */
/*                                                                     */
/*  The request returns 2xx if at least one channel succeeded; the   */
/*  response includes flags telling the client which channels landed. */
/*  Only if BOTH channels fail do we return a 502, with a clear error */
/*  body the client can use to show a mailto fallback.                 */
/*                                                                     */
/*  This design makes the form robust to partial misconfiguration:   */
/*  a new deploy with only Resend keys set will still email, a deploy */
/*  with only Supabase set will still save.                            */
/*                                                                     */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  // --- Validation (shared across both save and notify paths) --- //
  const type = typeof body.type === "string" ? body.type : "";
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  const phone =
    typeof body.phone === "string" ? body.phone.trim() : "";
  const chapter =
    typeof body.chapter === "string" ? body.chapter.trim() : "";

  if (!type || !name || !email) {
    return NextResponse.json(
      { error: "Missing required fields: type, name, email" },
      { status: 400 }
    );
  }

  if (type !== "volunteer" && type !== "contact") {
    return NextResponse.json(
      { error: "Type must be 'volunteer' or 'contact'" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  // --- Save to database (best effort) --- //
  let savedId: string | null = null;
  let dbError: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const supabase = await createAdminClient();
      const { data, error } = await supabase
        .from("submissions")
        .insert({
          type,
          name,
          email,
          message: message || null,
          phone: phone || null,
          chapter: chapter || null,
        })
        .select("id")
        .single();
      if (error) {
        dbError = error.message;
        console.error("[submissions] DB insert failed:", error.message);
      } else {
        savedId = (data as { id: string }).id;
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
      console.error("[submissions] DB exception:", dbError);
    }
  } else {
    dbError = "Supabase not configured";
  }

  // --- Send email notification (best effort) --- //
  const isCurriculum =
    type === "contact" &&
    (chapter === "Curriculum Request" || message.includes("[CURRICULUM REQUEST]"));
  const subject = isCurriculum
    ? "New Curriculum Request"
    : type === "volunteer"
      ? "New Volunteer Application"
      : "New Contact Form Submission";

  const emailBody = [
    `${name} (${email}) submitted a ${isCurriculum ? "curriculum request" : `${type} form`} via rooted-forward.org.`,
    "",
    chapter ? `Chapter: ${chapter}` : "",
    phone ? `Phone: ${phone}` : "",
    message ? `\nMessage:\n${message}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const notify = await notifyAdmin({
    subject,
    body: emailBody,
    link: "/admin/submissions",
    replyTo: email,
  });

  // --- Decide the response --- //
  const savedOk = !!savedId;
  const emailedOk = notify.ok;

  if (savedOk || emailedOk) {
    return NextResponse.json(
      {
        message: "Submission received",
        saved: savedOk,
        emailed: emailedOk,
        submission_id: savedId,
      },
      { status: 201 }
    );
  }

  // Both channels failed. Return a detailed error body the client can
  // use to surface the contact email address.
  const hint = !notificationsConfigured() && !isSupabaseConfigured()
    ? "This server has neither a database nor an email provider configured. Set RESEND_API_KEY or configure Supabase to enable form submissions."
    : !emailedOk && !savedOk
      ? "The submission could not be saved or emailed. Please try again in a moment, or email us directly."
      : "Submission failed.";

  return NextResponse.json(
    {
      error: "Failed to deliver submission",
      hint,
      fallback_email: "contact@rooted-forward.org",
      detail: { dbError, emailError: notify.error },
    },
    { status: 502 }
  );
}
