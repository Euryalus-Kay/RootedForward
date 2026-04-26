/* ------------------------------------------------------------------ */
/*  /api/research/data/zip                                             */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Build a ZIP containing every available file for a dataset, plus   */
/*  a README.md with the contents, license, public sources, and       */
/*  citation. Authenticated users get the ZIP and an audit row in     */
/*  dataset_downloads. Anonymous users are redirected to login when   */
/*  Supabase is configured; in local dev with placeholder Supabase   */
/*  the ZIP streams without auth.                                      */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import JSZip from "jszip";
import { RESEARCH_DATASETS, formatBytes } from "@/lib/research-datasets";
import { PLACEHOLDER_RESEARCH_ENTRIES } from "@/lib/research-constants";

export const runtime = "nodejs";

const DATA_ROOT = path.join(process.cwd(), "public", "data");
const SAFE_SLUG = /^[A-Za-z0-9._-]+$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug || !SAFE_SLUG.test(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const meta = RESEARCH_DATASETS[slug];
  if (!meta) {
    return NextResponse.json({ error: "dataset not found" }, { status: 404 });
  }

  const availableFiles = meta.files.filter((f) => f.available);
  if (availableFiles.length === 0) {
    return NextResponse.json(
      { error: "no files available" },
      { status: 404 }
    );
  }

  // ---- Auth + audit ----
  let userEmail: string | null = null;
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
      userEmail = user.email ?? null;

      const { data: roleRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = (roleRow as { role?: string } | null)?.role ?? "user";

      const admin = await createAdminClient();
      await admin.from("dataset_downloads").insert({
        dataset_slug: slug,
        user_id: user.id,
        user_email: userEmail,
        user_role: role,
        ip_address:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent") ?? null,
      });
    }
  } catch {
    // Best-effort audit; continue serving in dev.
  }

  // ---- Build the ZIP ----
  const zip = new JSZip();

  const entry = PLACEHOLDER_RESEARCH_ENTRIES.find((e) => e.slug === slug);
  const paperTitle = entry?.title ?? slug;

  const readme = [
    `# ${paperTitle}`,
    "",
    `Replication-data archive · ${slug}`,
    `Built ${new Date().toISOString()}`,
    "",
    "## Contents",
    "",
    meta.contents,
    "",
    "## License",
    "",
    meta.license,
    "",
    "## Files in this archive",
    "",
    ...availableFiles.map(
      (f) => `- \`${f.name}\` (${formatBytes(f.bytes)}) · ${f.description}${
        f.provenance ? ` · Source: ${f.provenance}` : ""
      }`
    ),
    "",
    "## Public sources",
    "",
    ...meta.upstream_sources.map((s) =>
      s.note ? `- ${s.label} · ${s.url} · ${s.note}` : `- ${s.label} · ${s.url}`
    ),
    "",
    "## Citation",
    "",
    `Rooted Forward (2026). ${paperTitle}. https://rooted-forward.org/research/${slug}`,
    "",
    "## Contact",
    "",
    "research@rooted-forward.org",
    userEmail ? `\nDownloaded by: ${userEmail}` : "",
  ].join("\n");

  zip.file("README.md", readme);

  for (const f of availableFiles) {
    const fullPath = path.join(DATA_ROOT, slug, f.name);
    if (!fullPath.startsWith(DATA_ROOT + path.sep)) continue;
    try {
      const buf = await fs.readFile(fullPath);
      zip.file(f.name, buf);
    } catch {
      // Skip files missing on disk; the README will still mention them.
    }
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const body = new Uint8Array(buffer);
  const filename = `rooted-forward-${slug}.zip`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
