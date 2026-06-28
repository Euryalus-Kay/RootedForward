#!/usr/bin/env node
// ------------------------------------------------------------------
// Generate the Hyde Park scratch voiceover with OpenAI text-to-speech
// (a natural, non-robotic voice), one mp3 per chapter. Writes the files
// the renderer actually reads (vo-<id>.mp3) and a durations.json keyed
// both ways so the renderer and the tour builder agree.
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/hp-vo-openai.mjs --in /tmp/hp-vo.json \
//       [--voice ash] [--model gpt-4o-mini-tts]
//
// The key is read from the environment only and never written to disk.
// ------------------------------------------------------------------
import { writeFile, mkdir, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/media/hyde-park/vo");
const DURS = path.join(OUT, "durations.json");

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const inFile = arg("in");
const voice = arg("voice", "ash");
const model = arg("model", "gpt-4o-mini-tts");
const speed = parseFloat(arg("speed", "1.0"));
const key = process.env.OPENAI_API_KEY;
if (!inFile || !key) {
  console.error("Need --in <json> and OPENAI_API_KEY in the environment");
  process.exit(1);
}

// How the narrator should sound. gpt-4o-mini-tts follows these instructions.
const INSTRUCTIONS =
  "You are the narrator of a serious, warm documentary about a Chicago neighborhood and the people displaced from it. " +
  "Read in a calm, grounded, human voice at a steady, natural documentary pace, moving forward, not dragging. " +
  "A normal breath between sentences is enough; do not over-pause. Clear and measured, with quiet empathy. " +
  "Never chirpy, never robotic, never sing-song. Plain, clear American English. Pronounce proper names and places naturally.";

// Encourage real pauses: paragraph breaks between sentences and a soft pause
// after long mid-sentence clauses. The captions come from elsewhere, so this
// only shapes the spoken pacing.
function paceText(text) {
  return text.replace(/([.!?])\s+/g, "$1\n");
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(err.slice(-300)))));
  });
}
function probe(file) {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", file]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => resolve(Math.round(parseFloat(out.trim()) * 10) / 10 || 0));
  });
}

async function tts(text) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      voice,
      input: paceText(text),
      instructions: INSTRUCTIONS,
      response_format: "mp3",
      speed,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const items = JSON.parse(readFileSync(inFile, "utf8"));
  const durations = existsSync(DURS) ? JSON.parse(readFileSync(DURS, "utf8")) : {};
  for (const { id, text } of items) {
    const raw = path.join("/tmp", `oai_${id}.mp3`);
    const out = path.join(OUT, `vo-${id}.mp3`);
    const buf = await tts(text);
    await writeFile(raw, buf);
    // light normalization so every chapter sits at the same loudness
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
      "-af", "loudnorm=I=-18:TP=-2:LRA=11", "-codec:a", "libmp3lame", "-b:a", "192k", out]);
    await rm(raw, { force: true });
    const dur = await probe(out);
    durations[id] = dur;
    durations[`vo-${id}`] = dur;
    console.log(`vo-${id}.mp3  ${dur}s  (${voice})`);
  }
  await writeFile(DURS, JSON.stringify(durations, null, 2));
  console.log(`\ndone. ${items.length} chapters, voice "${voice}", model "${model}"`);
}
main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
