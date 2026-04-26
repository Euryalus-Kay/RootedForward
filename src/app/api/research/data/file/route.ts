/* ------------------------------------------------------------------ */
/*  /api/research/data/file                                            */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Serves real hosted dataset files from public/data/<slug>/.        */
/*                                                                     */
/*  Two modes:                                                         */
/*    ?preview=1      — public, no auth, no audit. Used by the        */
/*                       in-site spreadsheet viewer to render rows.   */
/*                       Streams the file with Content-Type text/csv  */
/*                       (or application/json for .geojson / .json).  */
/*    (no preview)    — full download. Requires Supabase session.     */
/*                       Inserts a row in dataset_downloads. Returns  */
/*                       the file with attachment Content-Disposition.*/
/*                                                                     */
/*  We never serve files from outside public/data/, and slug + file   */
/*  are scrubbed for traversal characters before any path join.       */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { promises as fs, createReadStream } from "node:fs";
import { Readable } from "node:stream";

export const runtime = "nodejs";

const DATA_ROOT = path.join(process.cwd(), "public", "data");

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

function contentTypeFor(file: string): string {
  if (file.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".geojson")) return "application/geo+json; charset=utf-8";
  if (file.endsWith(".tsv")) return "text/tab-separated-values; charset=utf-8";
  if (file.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const file = searchParams.get("file");
  const isPreview = searchParams.get("preview") === "1";

  if (!slug || !file) {
    return NextResponse.json(
      { error: "slug and file required" },
      { status: 400 }
    );
  }
  if (!SAFE_SEGMENT.test(slug) || !SAFE_SEGMENT.test(file)) {
    return NextResponse.json(
      { error: "invalid slug or file name" },
      { status: 400 }
    );
  }

  const fullPath = path.join(DATA_ROOT, slug, file);
  // Defense-in-depth: ensure the resolved path is still inside DATA_ROOT.
  if (!fullPath.startsWith(DATA_ROOT + path.sep)) {
    return NextResponse.json({ error: "path traversal" }, { status: 400 });
  }

  let stat;
  try {
    stat = await fs.stat(fullPath);
  } catch {
    return NextResponse.json(
      {
        error: "file_not_found",
        message:
          "This dataset file is not yet hosted on Rooted Forward. The cleaned archive is in preparation; check the upstream sources on the dataset page.",
      },
      { status: 404 }
    );
  }
  if (!stat.isFile()) {
    return NextResponse.json({ error: "not_a_file" }, { status: 400 });
  }

  // ---- Auth + audit when this is a real download (not a preview) ----
  if (!isPreview) {
    try {
      const { isSupabaseConfigured, createClient, createAdminClient } =
        await import("@/lib/supabase/server");
      if (isSupabaseConfigured()) {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          const loginUrl = new URL(
            `/auth/login?next=${encodeURIComponent(
              `/research/data/${slug}`
            )}`,
            req.url
          );
          return NextResponse.redirect(loginUrl, { status: 302 });
        }

        const { data: roleRow } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const role =
          (roleRow as { role?: string } | null)?.role ?? "user";

        const admin = await createAdminClient();
        await admin.from("dataset_downloads").insert({
          dataset_slug: slug,
          user_id: user.id,
          user_email: user.email ?? null,
          user_role: role,
          ip_address:
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            null,
          user_agent: req.headers.get("user-agent") ?? null,
        });
      }
    } catch {
      // Best-effort audit. If Supabase is unreachable in dev, still
      // serve the file.
    }
  }

  // Stream the file.
  const nodeStream = createReadStream(fullPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(file),
      "Content-Length": String(stat.size),
      ...(isPreview
        ? { "Cache-Control": "public, max-age=300" }
        : {
            "Content-Disposition": `attachment; filename="${file}"`,
            "Cache-Control": "private, no-store",
          }),
    },
  });
}
