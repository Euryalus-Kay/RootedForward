import { NextRequest, NextResponse } from "next/server";
import {
  createClient,
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

/* ------------------------------------------------------------------ */
/*  POST /api/user/delete                                              */
/*  Permanently delete the calling user's account. Works with the      */
/*  site's cookie session or with an Authorization: Bearer access      */
/*  token (used by the iOS app). Removes the profile row and the auth  */
/*  user. Required so accounts created on the site can be deleted      */
/*  from inside the app, per App Store guideline 5.1.1(v).             */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Accounts are not enabled" },
        { status: 503 }
      );
    }

    const admin = await createAdminClient();

    // Identify the caller, bearer token first, cookie session second.
    let userId: string | null = null;
    const authHeader = request.headers.get("authorization") || "";
    const bearer = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;

    if (bearer) {
      const { data, error } = await admin.auth.getUser(bearer);
      if (!error && data.user) userId = data.user.id;
    } else {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove the profile row first, then the auth user. Content rows
    // that reference the user cascade or go orphan-safe via RLS.
    await admin.from("users").delete().eq("id", userId);

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
