import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { screen } from "@/lib/exhibit/moderation";
import { notifyAdmin } from "@/lib/notify";

/* ------------------------------------------------------------------ */
/*  /api/exhibit/submissions                                           */
/*                                                                     */
/*  Visitor input for The Ground Keeps Moving exhibit (the ch11        */
/*  answer wall now; memorial and oral-history stations later).        */
/*                                                                     */
/*  POST validates, screens (src/lib/exhibit/moderation.ts), and       */
/*  inserts via the admin client with status 'pending' or 'flagged'.   */
/*  Nothing publishes until an admin approves it at /admin/exhibit.    */
/*  A filled honeypot field returns the same success shape and drops   */
/*  the row silently. Memorial submissions additionally email the      */
/*  admin via Resend, following the submissions route's pattern.       */
/*                                                                     */
/*  GET returns approved rows only, read through the ANON client so    */
/*  row level security is the enforcement, not this code.              */
/*                                                                     */
/*  Until migration 008 is applied the table does not exist. Both      */
/*  verbs detect that and answer honestly with migrationPending        */
/*  instead of a 500, so the wall can tell visitors the truth.         */
/* ------------------------------------------------------------------ */

const KINDS = ["answer_wall", "memorial", "oral_history"] as const;
type Kind = (typeof KINDS)[number];

/* the table enforces 280 for every kind; the wall is tighter here */
const BODY_CAPS: Record<Kind, number> = {
  answer_wall: 140,
  memorial: 280,
  oral_history: 280,
};
const NAME_CAP = 40;
const PROMPT_ID_RE = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
const LIST_CAP = 100;

function isKind(v: string): v is Kind {
  return (KINDS as readonly string[]).includes(v);
}

/** migration 008 not applied yet (undefined table / PostgREST schema-cache miss) */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("exhibit_submissions") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

/* ------------------------------------------------------------------ */
/*  GET ?kind=answer_wall&prompt=<promptId>                            */
/*  Approved rows only, newest first, capped at 100.                   */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") ?? "";
  const prompt = searchParams.get("prompt") ?? "";

  if (!isKind(kind)) {
    return NextResponse.json(
      { error: "kind must be one of answer_wall, memorial, oral_history" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ answers: [], migrationPending: true }, { status: 200 });
  }

  try {
    // anon client on purpose; the approved-only SELECT policy does the filtering
    const supabase = await createClient();
    let query = supabase
      .from("exhibit_submissions")
      .select("body, display_name, created_at")
      .eq("kind", kind)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(LIST_CAP);
    if (prompt) query = query.eq("prompt_id", prompt);

    const { data, error } = await query;

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ answers: [], migrationPending: true }, { status: 200 });
      }
      console.error("[exhibit-submissions] GET failed:", error.message);
      return NextResponse.json({ error: "Failed to load answers" }, { status: 500 });
    }

    const answers = (data ?? []).map((row) => ({
      body: row.body as string,
      displayName: (row.display_name as string | null) ?? null,
      createdAt: row.created_at as string,
    }));
    return NextResponse.json({ answers }, { status: 200 });
  } catch (err) {
    console.error("[exhibit-submissions] GET exception:", err);
    return NextResponse.json({ error: "Failed to load answers" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST {kind, promptId, body, displayName?, website?}                */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON." },
      { status: 400 }
    );
  }

  const kind = typeof payload.kind === "string" ? payload.kind : "";
  const promptId = typeof payload.promptId === "string" ? payload.promptId.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const displayName =
    typeof payload.displayName === "string" ? payload.displayName.trim() : "";
  const honeypot = typeof payload.website === "string" ? payload.website.trim() : "";

  if (!isKind(kind)) {
    return NextResponse.json(
      { error: "kind must be one of answer_wall, memorial, oral_history" },
      { status: 400 }
    );
  }
  if (!promptId || !PROMPT_ID_RE.test(promptId)) {
    return NextResponse.json({ error: "Missing or invalid promptId" }, { status: 400 });
  }
  if (!body) {
    return NextResponse.json({ error: "Write something first" }, { status: 400 });
  }
  const cap = BODY_CAPS[kind];
  if (body.length > cap) {
    return NextResponse.json(
      { error: `Answers for this station are capped at ${cap} characters` },
      { status: 400 }
    );
  }
  if (displayName.length > NAME_CAP) {
    return NextResponse.json(
      { error: `Names are capped at ${NAME_CAP} characters` },
      { status: 400 }
    );
  }

  // Honeypot filled means a bot found the invisible field. Answer with
  // the normal success shape and write nothing anywhere.
  if (honeypot) {
    return NextResponse.json({ held: true }, { status: 200 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ migrationPending: true }, { status: 503 });
  }

  // Screen the body and the display name; either one can flag the row.
  // The verdict only picks the review-queue lane, never a rejection.
  const bodyScreen = screen(body);
  const nameScreen = displayName ? screen(displayName) : { verdict: "pending" as const };
  const status = bodyScreen.verdict === "flagged" || nameScreen.verdict === "flagged"
    ? "flagged"
    : "pending";

  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { error } = await supabase.from("exhibit_submissions").insert({
      kind,
      prompt_id: promptId,
      body,
      display_name: displayName || null,
      status,
    });

    if (error) {
      if (isMissingTable(error)) {
        return NextResponse.json({ migrationPending: true }, { status: 503 });
      }
      console.error("[exhibit-submissions] insert failed:", error.message);
      return NextResponse.json(
        { error: "The wall could not take your answer just now" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[exhibit-submissions] insert exception:", err);
    return NextResponse.json(
      { error: "The wall could not take your answer just now" },
      { status: 502 }
    );
  }

  // Memorial entries are personal enough to warrant an email to the
  // admin inbox. Best effort, same as the submissions route.
  if (kind === "memorial") {
    await notifyAdmin({
      subject: "New memorial submission for the exhibit",
      body: [
        `A visitor left a memorial entry on the exhibit (status ${status}).`,
        "",
        displayName ? `Name: ${displayName}` : "Name: not given",
        `Prompt: ${promptId}`,
        "",
        body,
      ].join("\n"),
      link: "/admin/exhibit",
    });
  }

  return NextResponse.json({ held: true }, { status: 200 });
}
