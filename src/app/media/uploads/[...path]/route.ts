import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  GET /media/uploads/<name>                                          */
/*                                                                     */
/*  An uploaded plate or recording, served off this origin as if it    */
/*  had been committed to public/media. The file itself lives in the   */
/*  Supabase storage bucket "walk-media", which is what lets the owner */
/*  add a stop with a new photograph from a browser. The app is told   */
/*  nothing new. It joins a site-relative path onto mediaBase exactly  */
/*  as it always has, so a brand new tour's media reaches an installed */
/*  build with no App Store release.                                   */
/*                                                                     */
/*  Everything already under public/media is untouched and still       */
/*  served statically by Next. This route only owns the uploads        */
/*  folder, which has no static counterpart.                           */
/*                                                                     */
/*  Range requests are passed straight through to storage, because a   */
/*  browser scrubbing a twelve minute narration asks for byte ranges   */
/*  and a handler that answers every one of them with the whole file   */
/*  makes seeking unusable.                                            */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "walk-media";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

/** Content types for what an editor can actually attach to a stop.
 *  Storage records a type on upload, but a file put there by any other
 *  route can arrive as application/octet-stream, and Safari will not
 *  play an mp3 it has been told is a binary blob. */
const TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  /* SVG is deliberately absent. An SVG served from our own origin is
     an active document, it can carry script, and it would run with
     rooted-forward.org's cookies. The uploader refuses it too; this is
     the second lock, in case a file ever reaches the bucket another
     way. Anything not in this table is served as an attachment. */
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  vtt: "text/vtt; charset=utf-8",
  json: "application/json; charset=utf-8",
  pdf: "application/pdf",
};

/* What an unrecognised extension gets. Served as a download rather
   than rendered, so nothing unexpected executes on our origin. */
const FALLBACK_TYPE = "application/octet-stream";

function typeFor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return TYPES[ext] ?? FALLBACK_TYPE;
}

function missing() {
  return NextResponse.json(
    { error: "not_found", message: "No uploaded file by that name." },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const segments = path ?? [];

  // Nothing empty, nothing that climbs out of the bucket, nothing with
  // a control character in it. Storage would reject most of these on
  // its own, but a 404 from here is cheaper and clearer.
  const bad = segments.some(
    (s) => !s || s === "." || s === ".." || /[\u0000-\u001f]/.test(s)
  );
  if (segments.length === 0 || bad) return missing();

  if (!SUPABASE_URL) return missing();

  const objectPath = segments.map(encodeURIComponent).join("/");

  // With the service role we read through the authenticated endpoint,
  // which works whether or not the bucket is public. Without it we can
  // still serve a public bucket, which is how a preview deploy with
  // only the anon key keeps working.
  const upstream = SERVICE_KEY
    ? `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`
    : `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;

  const headers: Record<string, string> = {};
  if (SERVICE_KEY) {
    headers.apikey = SERVICE_KEY;
    headers.Authorization = `Bearer ${SERVICE_KEY}`;
  }
  // Conditional and partial reads belong to storage, not to us.
  for (const h of ["range", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(h);
    if (value) headers[h] = value;
  }

  let res: Response;
  try {
    res = await fetch(upstream, { headers, cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "upstream_unreachable", message: "Storage did not answer." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (res.status === 304) {
    // A conditional revalidation is still a cross-origin request from
    // the app, so it needs the same CORS header the 200 path sets, and
    // an empty ETag is worse than none at all.
    const notModified = new Headers({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    });
    const tag = res.headers.get("etag");
    if (tag) notModified.set("ETag", tag);
    return new NextResponse(null, { status: 304, headers: notModified });
  }
  // 200 and 206 both carry bytes. Anything else is a miss.
  if (!res.ok) return missing();

  const out = new Headers();
  const guessed = typeFor(segments[segments.length - 1]);
  /* The extension decides, not the upstream header. Storage will
     happily report whatever was set at upload time, and this endpoint
     serves from our own origin, so an object claiming to be
     text/html or image/svg+xml would run as a document on
     rooted-forward.org. Anything whose extension we do not recognise
     is sent as a download rather than rendered. */
  const known = guessed !== FALLBACK_TYPE;
  out.set("Content-Type", guessed);
  out.set("X-Content-Type-Options", "nosniff");
  if (!known) out.set("Content-Disposition", "attachment");
  for (const h of [
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ]) {
    const value = res.headers.get(h);
    if (value) out.set(h, value);
  }
  if (!out.has("accept-ranges")) out.set("Accept-Ranges", "bytes");
  // An uploaded file is immutable once it has a name. Replacing a
  // photograph means uploading it under a new name and pointing the
  // stop at that, which is what the admin uploader does, so a year is
  // safe and keeps repeat listens off the network entirely.
  out.set("Cache-Control", "public, max-age=31536000, immutable");
  out.set("Access-Control-Allow-Origin", "*");

  return new NextResponse(res.body, { status: res.status, headers: out });
}
