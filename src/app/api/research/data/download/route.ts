/* ------------------------------------------------------------------ */
/*  /api/research/data/download                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Auth-gated dataset download.                                       */
/*                                                                     */
/*  REAL DATA POLICY                                                   */
/*  This endpoint refuses to ship anything that is not the genuine    */
/*  cleaned archive uploaded by an admin. We never generate            */
/*  placeholder content. If a dataset's archive_status is              */
/*  "in_preparation" — i.e., the cleaned archive has not been          */
/*  uploaded yet — we return 404 with a JSON body pointing the user   */
/*  at the public upstream sources.                                    */
/*                                                                     */
/*  Flow when archive_status === "live":                               */
/*    1. Verify the requester has a Supabase session.                  */
/*    2. Insert a dataset_downloads audit row (admin-tracked).        */
/*    3. Mint a 60-second signed URL from the private storage         */
/*       bucket research-datasets and 302-redirect to it.             */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { RESEARCH_DATASETS } from "@/lib/research-datasets";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const meta = RESEARCH_DATASETS[slug];
  if (!meta) {
    return NextResponse.json({ error: "dataset not found" }, { status: 404 });
  }

  // The cleaned Rooted Forward archive does not yet exist.
  // Surface the real upstream sources so the user can still get
  // genuine raw data, but refuse to ship anything fabricated.
  if (meta.archive_status !== "live" || !meta.storage_path) {
    return NextResponse.json(
      {
        error: "archive_in_preparation",
        message:
          "The cleaned Rooted Forward archive for this paper has not been uploaded yet. Use one of the upstream public sources to access the underlying raw data.",
        upstream_sources: meta.upstream_sources,
      },
      { status: 404 }
    );
  }

  // ---- Auth + audit + signed-URL mint ----
  let userId: string | null = null;
  let email: string | null = null;
  let role: string | null = null;

  try {
    const { isSupabaseConfigured, createClient, createAdminClient } =
      await import("@/lib/supabase/server");

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "supabase_unavailable" },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = new URL(
        `/auth/login?next=${encodeURIComponent(`/research/data/${slug}`)}`,
        req.url
      );
      return NextResponse.redirect(loginUrl, { status: 302 });
    }
    userId = user.id;
    email = user.email ?? null;

    const { data: roleRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = (roleRow as { role?: string } | null)?.role ?? "user";

    // Audit row + signed URL via the service-role client.
    const admin = await createAdminClient();
    await admin.from("dataset_downloads").insert({
      dataset_slug: slug,
      user_id: userId,
      user_email: email,
      user_role: role,
      ip_address:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: req.headers.get("user-agent") ?? null,
    });

    const { data: signed, error: signError } = await admin.storage
      .from("research-datasets")
      .createSignedUrl(meta.storage_path, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        {
          error: "signed_url_failed",
          message:
            "Could not mint a signed URL for the archive. Please try again or contact research@rooted-forward.org.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "internal",
        message: err instanceof Error ? err.message : "Unknown error.",
      },
      { status: 500 }
    );
  }
}
