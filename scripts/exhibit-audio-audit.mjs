#!/usr/bin/env node
// ------------------------------------------------------------------
// RETIRED (July 2026). The exhibit was rebuilt as one reader-paced
// document with no audio, so this audit is no longer part of any
// gate. The script and the vo/ mp3s stay in the repo in case the
// narration is ever rewired; run it manually if that day comes.
// ------------------------------------------------------------------
// Exhibit audio audit. Mechanical checks over the generated VO:
//   1. every narration block has vo-ex-<blockId>.mp3 with duration > 0
//   2. duration sanity: within [words/220wpm, words/110wpm] bounds
//   3. cue-durations.json matches durations.json exactly
//   4. no orphan mp3s (files without a narration block)
//   5. when public/exhibit-data/narration_cues.json exists, every block
//      with audio has aligned caption cues, cues run forward without
//      overlap, and the last cue end sits within 1.5s of the duration
// Writes the owner's spot-check playlist to
// /tmp/exhibit-audio/playlist.html (5-8 stratified blocks, always ch4).
// Exit 1 on any error.
// ------------------------------------------------------------------
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const VO = path.join(ROOT, "public/media/hyde-park/vo/exhibit");
const OUT = "/tmp/exhibit-audio";
mkdirSync(OUT, { recursive: true });

const narration = JSON.parse(readFileSync(path.join(ROOT, "data/exhibit/narration.json"), "utf8"));
const durations = existsSync(path.join(VO, "durations.json"))
  ? JSON.parse(readFileSync(path.join(VO, "durations.json"), "utf8"))
  : {};
const cueDurations = JSON.parse(
  readFileSync(path.join(ROOT, "src/lib/exhibit/content/cue-durations.json"), "utf8")
);

const errors = [];
const blocks = [];
for (const ch of narration.chapters) for (const b of ch.blocks) blocks.push({ ...b, chapter: ch.id });

for (const b of blocks) {
  const file = path.join(VO, `vo-ex-${b.id}.mp3`);
  const dur = durations[`ex-${b.id}`];
  if (!existsSync(file)) {
    errors.push(`missing audio ${b.id}`);
    continue;
  }
  if (!(dur > 0)) errors.push(`no duration for ${b.id}`);
  const words = b.text.split(/\s+/).length;
  const min = (words / 220) * 60;
  const max = (words / 100) * 60;
  if (dur < min || dur > max) {
    errors.push(`duration ${dur}s for ${b.id} outside sanity [${min.toFixed(1)}, ${max.toFixed(1)}] (${words} words)`);
  }
  const cue = cueDurations[b.id];
  if (cue !== dur) errors.push(`cue-durations mismatch for ${b.id} (${cue} vs ${dur}); run exhibit-sync-cues`);
}

// orphans
for (const f of readdirSync(VO)) {
  if (!f.endsWith(".mp3")) continue;
  const id = f.replace(/^vo-ex-/, "").replace(/\.mp3$/, "");
  if (!blocks.find((b) => b.id === id)) errors.push(`orphan audio file ${f}`);
}

// Whisper-aligned caption cues (written by scripts/exhibit-align-cues.py)
const cuesPath = path.join(ROOT, "public/exhibit-data/narration_cues.json");
if (existsSync(cuesPath)) {
  const cueBlocks = JSON.parse(readFileSync(cuesPath, "utf8")).blocks ?? {};
  for (const b of blocks) {
    if (!existsSync(path.join(VO, `vo-ex-${b.id}.mp3`))) continue;
    const cues = cueBlocks[b.id];
    if (!Array.isArray(cues) || cues.length === 0) {
      errors.push(`narration_cues missing block ${b.id}; run exhibit-align-cues.py`);
      continue;
    }
    for (let i = 0; i < cues.length; i++) {
      const c = cues[i];
      if (!(typeof c.startSec === "number" && typeof c.endSec === "number" && c.endSec > c.startSec)) {
        errors.push(`narration_cues ${b.id}[${i}] does not run forward (${c.startSec} to ${c.endSec})`);
      }
      if (i > 0 && !(c.startSec >= cues[i - 1].endSec)) {
        errors.push(`narration_cues ${b.id}[${i}] overlaps previous (ends ${cues[i - 1].endSec}, starts ${c.startSec})`);
      }
    }
    const dur = durations[`ex-${b.id}`];
    const lastEnd = cues[cues.length - 1].endSec;
    if (!(dur > 0) || Math.abs(lastEnd - dur) > 1.5) {
      errors.push(`narration_cues ${b.id} last cue ends ${lastEnd}s but audio runs ${dur}s; realign`);
    }
  }
}

// ---- playlist for the owner's ears ----
const sample = new Map();
for (const pick of ["ch0-b1", "ch4-b1", "ch4-b2", "ch5-b3", "ch8-b4", "ch9-b3", "ch10-b2", "ch11-b3"]) {
  const b = blocks.find((x) => x.id === pick);
  if (b) sample.set(pick, b);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const rows = [...sample.values()]
  .map((b) => {
    const src = `vo-ex-${b.id}.mp3`;
    copyFileSync(path.join(VO, src), path.join(OUT, src));
    return `<tr><td class="id">${b.id}<br/><span class="dur">${durations[`ex-${b.id}`] ?? "?"}s</span></td>
    <td><audio controls preload="none" src="${src}"></audio><p>${esc(b.text)}</p></td></tr>`;
  })
  .join("\n");
writeFileSync(
  path.join(OUT, "playlist.html"),
  `<!doctype html><meta charset="utf-8"><title>Exhibit VO spot check</title>
<style>body{font:14px/1.5 -apple-system,sans-serif;background:#EDE6D6;color:#1C1A17;padding:24px;max-width:860px;margin:auto}
td{padding:10px;border-bottom:1px solid #1c1a1733;vertical-align:top}.id{font-family:ui-monospace;white-space:nowrap}
.dur{color:#4A453D}audio{width:320px}</style>
<h1>Narration spot check (${sample.size} of ${blocks.length} blocks, voice ash)</h1><table>${rows}</table>`
);

if (errors.length) {
  console.error(`exhibit-audio-audit FAILED with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ERROR: ${e}`);
  process.exit(1);
}
console.log(
  `exhibit-audio-audit PASSED (${blocks.length} blocks, ${(Object.values(cueDurations).filter((v) => typeof v === "number").reduce((a, b) => a + b, 0) / 60).toFixed(1)} min). Playlist: ${OUT}/playlist.html`
);
