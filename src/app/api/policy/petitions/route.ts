import { NextRequest, NextResponse } from "next/server";
import { PETITIONS, getPetition } from "@/lib/petitions";
import { notifyAdmin } from "@/lib/notify";

/* ------------------------------------------------------------------ */
/*  /api/policy/petitions                                              */
/*                                                                     */
/*  Signing a petition takes no account. The row carries the signer's  */
/*  own name and email, so the insert runs through the service role    */
/*  and the rows are never readable from the browser.                  */
/*                                                                     */
/*  GET ?slug=<slug> returns the public signature count only.          */
/*  POST signs. A filled honeypot returns the normal success shape     */
/*  and writes nothing. Signing twice with the same email is not an    */
/*  error, it just does not add a second row.                          */
/*                                                                     */
/*  Until migration 009 is applied the table does not exist. Both      */
/*  verbs detect that and answer with migrationPending instead of a    */
/*  500, so the page can tell a visitor the truth.                     */
/* ------------------------------------------------------------------ */

const NAME_CAP = 80;
const ZIP_RE = /^[0-9]{5}(-[0-9]{4})?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* Mirrors RESIDENCY_OPTIONS in PetitionForm and the table's CHECK. */
const RESIDENCY = ["resident", "work_or_school", "nearby", "supporter"];

/** migration 009 not applied yet (undefined table / PostgREST schema-cache miss) */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("petition") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

function isKnownSlug(slug: string): boolean {
  return PETITIONS.some((p) => p.slug === slug);
}

/* ------------------------------------------------------------------ */
/*  GET ?slug=<slug>                                                   */
/* ------------------------------------------------------------------ */
export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!isKnownSlug(slug)) {
    return NextResponse.json({ error: "Unknown petition" }, { status: 404 });
  }

  const { countSignatures } = await import("@/lib/petition-signatures");
  const result = await countSignatures(slug);
  return NextResponse.json(result, { status: 200 });
}

/* ------------------------------------------------------------------ */
/*  POST {slug, name, email, zip?, isPublic?, website?}                */
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

  const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const zip = typeof payload.zip === "string" ? payload.zip.trim() : "";
  const residency =
    typeof payload.residency === "string" ? payload.residency.trim() : "resident";
  const isPublic = payload.isPublic !== false;
  const honeypot = typeof payload.website === "string" ? payload.website.trim() : "";

  const petition = getPetition(slug);
  if (!petition) {
    return NextResponse.json({ error: "Unknown petition" }, { status: 404 });
  }
  if (petition.status !== "open") {
    return NextResponse.json(
      { error: "This petition is closed" },
      { status: 409 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Add your name" }, { status: 400 });
  }
  if (name.length > NAME_CAP) {
    return NextResponse.json(
      { error: `Names are capped at ${NAME_CAP} characters` },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Add an email address we can reach you at" },
      { status: 400 }
    );
  }
  if (zip && !ZIP_RE.test(zip)) {
    return NextResponse.json(
      { error: "That does not look like a ZIP code" },
      { status: 400 }
    );
  }
  if (!RESIDENCY.includes(residency)) {
    return NextResponse.json(
      { error: "Pick one of the options for where you live" },
      { status: 400 }
    );
  }

  // Honeypot filled means a bot found the invisible field. Answer with
  // the normal success shape and write nothing anywhere.
  if (honeypot) {
    return NextResponse.json({ signed: true, count: null }, { status: 200 });
  }

  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ migrationPending: true }, { status: 503 });
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { error } = await supabase.from("petition_signatures").insert({
      petition_slug: slug,
      signer_name: name,
      email,
      zip: zip || null,
      residency,
      is_public: isPublic,
    });

    if (error) {
      if (isMissingTable(error)) {
        // Migration 009 is not applied yet. Park the signature in the
        // submissions table instead of dropping it on the floor.
        const { fallbackChapter } = await import("@/lib/petition-signatures");
        // submissions has no unique index, so dedupe by hand the way the
        // real table's (petition_slug, email) constraint would.
        const { data: already } = await supabase
          .from("submissions")
          .select("id")
          .eq("chapter", fallbackChapter(slug))
          .eq("email", email)
          .limit(1);
        if (already && already.length > 0) {
          const { countSignatures } = await import("@/lib/petition-signatures");
          const { count: dupCount } = await countSignatures(slug);
          return NextResponse.json({ signed: true, count: dupCount }, { status: 200 });
        }
        const { error: fbError } = await supabase.from("submissions").insert({
          type: "contact",
          name,
          email,
          chapter: fallbackChapter(slug),
          message: [
            `Petition signature for ${petition.billName} (${petition.city}).`,
            `slug=${slug}`,
            `residency=${residency}`,
            `zip=${zip || "none"}`,
            `public=${isPublic ? "yes" : "no"}`,
            "",
            "Recorded before migration 009 was applied, so it lives here",
            "rather than in petition_signatures.",
          ].join("\n"),
        });
        if (fbError) {
          console.error("[petitions] fallback insert failed:", fbError.message);
          return NextResponse.json(
            { error: "We could not record your signature just now" },
            { status: 502 }
          );
        }
      } else if (error.code !== "23505") {
        // 23505 is the (petition_slug, email) unique index. Signing twice
        // is not a mistake worth an error page.
        console.error("[petitions] insert failed:", error.message);
        return NextResponse.json(
          { error: "We could not record your signature just now" },
          { status: 502 }
        );
      }
    }
  } catch (err) {
    console.error("[petitions] insert exception:", err);
    return NextResponse.json(
      { error: "We could not record your signature just now" },
      { status: 502 }
    );
  }

  const { countSignatures } = await import("@/lib/petition-signatures");
  const { count } = await countSignatures(slug);

  await notifyAdmin({
    subject: `New signature on ${petition.billName}`,
    body: [
      `Someone signed the petition for ${petition.billName}.`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      zip ? `ZIP: ${zip}` : "ZIP: not given",
      `Lives in ${petition.city}: ${residency}`,
      `Shows name publicly: ${isPublic ? "yes" : "no"}`,
      "",
      count === null ? "" : `Total signatures now ${count}.`,
    ].join("\n"),
    replyTo: email,
    link: `/policy/petitions/${slug}`,
  });

  return NextResponse.json({ signed: true, count }, { status: 201 });
}
