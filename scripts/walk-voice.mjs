#!/usr/bin/env node
// ------------------------------------------------------------------
// Switch the live Jackson Park tour narration between voices that
// have already been generated, without touching the ElevenLabs API.
//
//   node scripts/walk-voice.mjs narrator   -> original narrator voice
//   node scripts/walk-voice.mjs zain       -> owner's own voice
//
// Copies public/media/jackson-park-walk/audio/voices/<name>/*.mp3
// over the live audio files, refreshes the live durations.json, and
// rewrites audioSeconds in src/lib/tours/jackson-park-walk.ts so the
// on-page listening times match. Commit + deploy afterwards.
// ------------------------------------------------------------------
import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "src/lib/tours/jackson-park-walk.ts");
const LIVE = path.join(ROOT, "public/media/jackson-park-walk/audio");

const name = process.argv[2];
const dir = name && path.join(LIVE, "voices", name);
if (!name || !existsSync(dir)) {
  const voicesDir = path.join(LIVE, "voices");
  const have = existsSync(voicesDir) ? await readdir(voicesDir) : [];
  console.error(`Usage: node scripts/walk-voice.mjs <voice>`);
  console.error(`Available voices: ${have.join(", ") || "(none generated yet)"}`);
  process.exit(1);
}

const durations = JSON.parse(await readFile(path.join(dir, "durations.json"), "utf8"));
let src = await readFile(DATA, "utf8");
for (const [id, seconds] of Object.entries(durations)) {
  await copyFile(path.join(dir, `${id}.mp3`), path.join(LIVE, `${id}.mp3`));
  const re = new RegExp(`(audio/${id}\\.mp3\`,\\n\\s*audioSeconds: )\\d+`);
  src = src.replace(re, `$1${seconds}`);
  console.log(`${id}.mp3  ${seconds}s`);
}
await writeFile(DATA, src);
await writeFile(path.join(LIVE, "durations.json"), JSON.stringify(durations, null, 2));
console.log(`\nlive narration is now "${name}". Rebuild/commit/deploy to ship it.`);
