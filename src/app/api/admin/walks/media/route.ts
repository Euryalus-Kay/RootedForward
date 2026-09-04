/* ------------------------------------------------------------------ */
/*  POST /api/admin/walks/media                                        */
/*                                                                     */
/*  One photograph or one narration file at a time, from a file picker */
/*  in the browser into the walk-media bucket. The answer is the       */
/*  site-relative path the owner pastes into a stop.                   */
/*                                                                     */
/*  Site-relative is the whole point. The iPhone app joins every media */
/*  path onto mediaBase, so anything served from rooted-forward.org    */
/*  reaches a phone with no App Store release. The bucket is read back */
/*  out under /media/uploads by a route of its own, which keeps the    */
/*  origin the same as the plates already sitting in public/media.     */
/*                                                                     */
/*  The service role does the upload, following the studio uploader,   */
/*  so this works before the bucket's storage policies are applied and */
/*  does not depend on a cookie surviving a multipart request.         */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  UPLOAD_URL_PREFIX,
  WALK_MEDIA_BUCKET,
  requireAdmin,
} from "../_shared";

/* Vercel refuses a serverless request body over about four and a half
   megabytes, and it refuses it above this code, so a larger file
   never arrives here to be rejected politely.

   Do not lower this below the bucket. Four megabytes was tried and
   was wrong: white-city.mp3, already shipped in this walk, is 4.1MB,
   so the cap refused a file the tour itself contains. Match the
   bucket and let the bucket be the single ceiling. */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/* What a stop can actually hold. The extension comes from this table
   rather than from the uploaded name, so a file called cover.jpg.html
   cannot land on our origin as markup. SVG is not here on purpose,
   since an SVG served from our own domain can carry script, and gif
   is not here because the walk-media bucket in migration 010 does not
   allow it, so accepting one would only fail later and less clearly. */
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "image/heic": "heic",
};

/* Some browsers hand over an m4a with no content type at all, so the
   name is allowed to settle it when the type says nothing useful. */
const EXTENSION_BY_SUFFIX: Record<string, string> = {
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
  mp3: "mp3",
  m4a: "m4a",
};

const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
};

/** lowercase letters, numbers and single hyphens, and never empty */
function slugSafeName(raw: string): string {
  const base = raw
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "walk-media";
}

function suffixOf(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  const projectUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  if (!serviceKey || !projectUrl) {
    return NextResponse.json(
      { error: "The service role key is not configured." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error:
          "Send the file as multipart form data under a field named file.",
      },
      { status: 400 }
    );
  }

  const picked = form.get("file") ?? form.get("media");
  if (!picked || typeof picked === "string") {
    return NextResponse.json(
      { error: "No file was attached under the field named file." },
      { status: 400 }
    );
  }
  const file = picked as File;

  if (file.size === 0) {
    return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `That file is ${(file.size / 1024 / 1024).toFixed(
          1
        )} MB. Uploads through this form stop at 4 MB. Compress the audio or resize the photograph and try again.`,
      },
      { status: 413 }
    );
  }

  const declaredType = (file.type || "").toLowerCase().split(";")[0].trim();
  const originalName = typeof file.name === "string" ? file.name : "";
  const extension =
    EXTENSION_BY_TYPE[declaredType] ??
    EXTENSION_BY_SUFFIX[suffixOf(originalName)] ??
    "";

  if (!extension) {
    return NextResponse.json(
      {
        error:
          "Only photographs and narration files belong here. Send a jpg, png, webp or avif image, or an mp3 or m4a audio file.",
        received: declaredType || originalName || "an unnamed file",
      },
      { status: 415 }
    );
  }

  /* the name the owner asked for, when they typed one, otherwise the
     name the file already had. The editor sends filename, so both
     spellings are read rather than one of them silently doing nothing. */
  const askedName = form.get("name") ?? form.get("filename");
  const stem = slugSafeName(
    typeof askedName === "string" && askedName.trim()
      ? askedName
      : originalName || extension
  );
  const contentType = TYPE_BY_EXTENSION[extension] ?? declaredType;

  const service = createServiceClient(projectUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const body = new Uint8Array(await file.arrayBuffer());

  /* The first upload keeps the clean name. Storage refuses a duplicate
     key rather than overwriting, which is what we want, since two
     different photographs called cover.jpg would otherwise replace one
     another inside a published walk. A short suffix settles it. */
  let objectKey = `${stem}.${extension}`;
  let lastMessage = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) {
      const suffix = Math.random().toString(36).slice(2, 7);
      objectKey = `${stem}-${suffix}.${extension}`;
    }

    const { error } = await service.storage
      .from(WALK_MEDIA_BUCKET)
      .upload(objectKey, body, {
        contentType,
        upsert: false,
        cacheControl: "31536000",
      });

    if (!error) {
      return NextResponse.json(
        {
          /* paste this into a stop */
          path: `${UPLOAD_URL_PREFIX}/${objectKey}`,
          name: objectKey,
          contentType,
          bytes: file.size,
        },
        { status: 201 }
      );
    }

    lastMessage = error.message ?? "";
    const taken =
      /exists|duplicate|conflict/i.test(lastMessage) ||
      (error as { statusCode?: string }).statusCode === "409";
    if (taken) continue;

    if (/bucket/i.test(lastMessage)) {
      return NextResponse.json(
        {
          error: "missing-bucket",
          message: `The ${WALK_MEDIA_BUCKET} bucket does not exist. Run migration 010 in the Supabase SQL editor.`,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "upload-failed", message: lastMessage },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: "upload-failed",
      message: `Could not find a free name for ${stem}.${extension}. Rename the file and try again.`,
      detail: lastMessage,
    },
    { status: 409 }
  );
}
