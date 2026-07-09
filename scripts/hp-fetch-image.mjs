#!/usr/bin/env node
// ------------------------------------------------------------------
// Hyde Park tour: fetch a real, public-domain / CC archival image from
// Wikimedia Commons for a given subject query, download a sized JPEG
// into public/media/hyde-park/img, and record provenance in a manifest.
//
// Usage:
//   node scripts/hp-fetch-image.mjs --id worlds-fair-court --query "World's Columbian Exposition Court of Honor 1893" [--width 1600]
//
// Only files whose license reads as public domain or a permissive
// Creative Commons license are accepted. Anything else is skipped so
// nothing unlicensed lands on the site. Provenance is written to
// public/media/hyde-park/credits.json keyed by id.
// ------------------------------------------------------------------

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, "public/media/hyde-park/img");
const MANIFEST = path.join(ROOT, "public/media/hyde-park/credits.json");
const UA =
  "RootedForwardTourBot/1.0 (https://rooted-forward.org; zaidichicago@gmail.com)";

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const id = arg("id");
const query = arg("query");
const width = parseInt(arg("width", "1600"), 10);
const minWidth = parseInt(arg("minwidth", "0"), 10);
if (!id || !query) {
  console.error("Need --id and --query");
  process.exit(1);
}

const stripHtml = (s) =>
  (s || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

function licenseOk(meta) {
  const short = (meta?.LicenseShortName?.value || "").toLowerCase();
  const usage = (meta?.UsageTerms?.value || "").toLowerCase();
  const hay = `${short} ${usage}`;
  if (/fair use|non-?free|all rights reserved|copyright/.test(hay)) return false;
  return /public domain|pd-|cc0|cc by|cc-by|creative commons|no known copyright/.test(
    hay
  );
}

async function api(params) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({ format: "json", ...params }).toString();
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  return res.json();
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  const data = await api({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: "16",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: String(width),
  });
  const pages = Object.values(data?.query?.pages || {}).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0)
  );
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const mime = info.mime || "";
    if (!/image\/(jpeg|png|tiff)/.test(mime)) continue;
    const meta = info.extmetadata || {};
    if (!licenseOk(meta)) continue;
    // resolution gate: skip soft, low-res originals
    if (minWidth && info.width && info.width < minWidth) continue;
    const thumb = info.thumburl;
    if (!thumb) continue;
    try {
      const r = await fetch(thumb, { headers: { "User-Agent": UA } });
      if (!r.ok) continue;
      const ct = r.headers.get("content-type") || "";
      if (!/image\//.test(ct)) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 8000) continue; // too small, probably an error page
      const ext = ct.includes("png") ? "png" : "jpg";
      const file = `${id}.${ext}`;
      await writeFile(path.join(IMG_DIR, file), buf);

      const record = {
        id,
        query,
        file: `/media/hyde-park/img/${file}`,
        commonsTitle: page.title,
        descriptionUrl: info.descriptionurl || info.descriptionshorturl || "",
        license: stripHtml(meta.LicenseShortName?.value) || "see source",
        artist: stripHtml(meta.Artist?.value) || "Unknown",
        credit: stripHtml(meta.Credit?.value).slice(0, 160) || "",
        date: stripHtml(meta.DateTimeOriginal?.value) || "",
        bytes: buf.length,
      };

      let manifest = {};
      if (existsSync(MANIFEST)) {
        try {
          manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
        } catch {
          manifest = {};
        }
      }
      manifest[id] = record;
      await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
      console.log(
        `OK ${id} <- ${page.title}\n   ${record.license} | ${record.artist}\n   ${record.file} (${(buf.length / 1024) | 0} KB)`
      );
      return;
    } catch {
      // try the next candidate
    }
  }
  console.log(`MISS ${id} :: no usable public-domain file for "${query}"`);
  process.exitCode = 2;
}

main().catch((e) => {
  console.error(`ERR ${id}: ${e.message}`);
  process.exit(1);
});
