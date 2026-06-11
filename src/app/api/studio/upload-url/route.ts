import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  Signed upload URLs for the tour-media bucket.                      */
/*                                                                     */
/*  The browser uploads large 360 files directly to Supabase storage,  */
/*  far beyond the serverless body limit. The service role signs the   */
/*  upload here (admin/editor only), so uploads work even before the   */
/*  storage RLS policies from migration 006 are applied.               */
/* ------------------------------------------------------------------ */

async function checkAccess(): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 }
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await checkAccess();
  if (denied) return denied;

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: "Service role key is not configured" },
      { status: 503 }
    );
  }

  let body: { path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const path = (body.path ?? "").replace(/^\/+/, "");
  if (!path || path.includes("..") || !/^(360|studio)\//.test(path)) {
    return NextResponse.json(
      { error: "path must live under 360/ or studio/" },
      { status: 400 }
    );
  }

  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await service.storage
    .from("tour-media")
    .createSignedUploadUrl(path);

  if (error || !data) {
    const message = error?.message ?? "Could not sign the upload";
    const status = /bucket/i.test(message) ? 404 : 500;
    return NextResponse.json(
      {
        error: "sign-failed",
        message: /bucket/i.test(message)
          ? "The tour-media bucket does not exist. Run migration 006 in Supabase."
          : message,
      },
      { status }
    );
  }

  const { data: pub } = service.storage.from("tour-media").getPublicUrl(path);
  return NextResponse.json({
    path: data.path,
    token: data.token,
    publicUrl: pub.publicUrl,
  });
}
