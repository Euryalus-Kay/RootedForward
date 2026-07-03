#!/usr/bin/env node
// ------------------------------------------------------------------
// Sync generated VO durations into the bundle. Reads
// public/media/hyde-park/vo/exhibit/durations.json and rewrites
// src/lib/exhibit/content/cue-durations.json keyed by narration block
// id (seconds). NarrationController reads that file, so audio timing
// never drifts from the actual files. Run after exhibit-vo.mjs.
// ------------------------------------------------------------------
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DURS = path.join(ROOT, "public/media/hyde-park/vo/exhibit/durations.json");
const OUT = path.join(ROOT, "src/lib/exhibit/content/cue-durations.json");
const NARR = path.join(ROOT, "data/exhibit/narration.json");

if (!existsSync(DURS)) {
  console.error("no durations yet; run scripts/exhibit-vo.mjs first");
  process.exit(1);
}
const durations = JSON.parse(readFileSync(DURS, "utf8"));
const narration = JSON.parse(readFileSync(NARR, "utf8"));

const out = {
  _note:
    "Written by scripts/exhibit-sync-cues.mjs from the generated VO durations. Keys are narration block ids (ch0-b1), values are seconds. Empty until the TTS pass runs; NarrationController falls back to a words-per-minute estimate when a block is missing.",
};
let synced = 0;
const missing = [];
for (const ch of narration.chapters) {
  for (const b of ch.blocks) {
    const dur = durations[`ex-${b.id}`] ?? durations[`vo-ex-${b.id}`];
    if (dur > 0) {
      out[b.id] = dur;
      synced++;
    } else {
      missing.push(b.id);
    }
  }
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`synced ${synced} block duration(s) into ${path.relative(ROOT, OUT)}`);
if (missing.length) console.log(`missing audio for: ${missing.join(", ")}`);
