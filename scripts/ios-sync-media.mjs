#!/usr/bin/env node
// ------------------------------------------------------------------
// Copy the walk's media out of public/ and into the iOS app's bundle
// folder, so the app ships the same photographs and narration the
// site serves.
//
//   node scripts/ios-sync-media.mjs [--check]
//
// The site is the source of truth. Regenerating narration writes to
// public/media/hyde-park-walk/audio, and without this step the app
// keeps bundling whatever it had, which is how it ended up shipping
// the old recordings under the rewritten text. --check reports drift
// and exits non-zero instead of copying, which is what CI wants.
// ------------------------------------------------------------------
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WALK = path.join(ROOT, "public/media/hyde-park-walk");
const DEST = path.join(ROOT, "ios/Resources/Media");
const checkOnly = process.argv.includes("--check");

// Where each kind of file lives on both sides. The app flattens the
// walk's top-level photographs into Media/images, because
// ContentStore.localMediaURL looks them up by basename.
const GROUPS = [
  { from: WALK, to: path.join(DEST, "images"), recurse: false, exts: [".jpg", ".jpeg", ".png"] },
  { from: path.join(WALK, "thumbs"), to: path.join(DEST, "thumbs"), recurse: false, exts: [".jpg", ".jpeg", ".png"] },
  { from: path.join(WALK, "audio"), to: path.join(DEST, "audio"), recurse: false, exts: [".mp3"] },
];

// Chrome the app draws itself, which has no place in the tour data.
const EXTRA = [
  { from: path.join(ROOT, "public/media/site/holc-chicago-1940.jpg"), to: path.join(DEST, "images/holc-chicago-1940.jpg") },
];

let copied = 0;
let same = 0;
const drift = [];

function sync(src, dst) {
  if (!existsSync(src)) return;
  const a = readFileSync(src);
  const b = existsSync(dst) ? readFileSync(dst) : null;
  if (b && a.equals(b)) {
    same += 1;
    return;
  }
  drift.push(path.relative(DEST, dst));
  if (checkOnly) return;
  mkdirSync(path.dirname(dst), { recursive: true });
  writeFileSync(dst, a);
  copied += 1;
}

for (const g of GROUPS) {
  if (!existsSync(g.from)) continue;
  for (const name of readdirSync(g.from)) {
    const src = path.join(g.from, name);
    if (!statSync(src).isFile()) continue;
    if (!g.exts.includes(path.extname(name).toLowerCase())) continue;
    sync(src, path.join(g.to, name));
  }
}
for (const e of EXTRA) sync(e.from, e.to);

if (checkOnly) {
  if (drift.length) {
    console.error(`ios media is ${drift.length} file(s) behind the site:`);
    for (const f of drift.slice(0, 20)) console.error("  " + f);
    if (drift.length > 20) console.error(`  ... and ${drift.length - 20} more`);
    console.error("\nrun: node scripts/ios-sync-media.mjs");
    process.exit(1);
  }
  console.log(`ios media is in step with the site (${same} files)`);
} else {
  console.log(`copied ${copied}, already current ${same}`);
  for (const f of drift.slice(0, 30)) console.log("  updated " + f);
}
