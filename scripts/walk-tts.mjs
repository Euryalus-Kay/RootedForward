#!/usr/bin/env node
// ------------------------------------------------------------------
// Generate the Jackson Park walking tour narration with OpenAI
// text-to-speech, one mp3 per stop, loudness-normalized. Reads the
// transcripts straight out of src/lib/tours/jackson-park-walk.ts so
// the audio can never drift from the on-page text. Writes:
//   public/media/jackson-park-walk/audio/stop-XX.mp3
//   public/media/jackson-park-walk/audio/durations.json
// After running, copy the printed audioSeconds values into
// jackson-park-walk.ts (or run with --patch to do it in place).
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/walk-tts.mjs [--voice ash]
//       [--model gpt-4o-mini-tts] [--only stop-03] [--patch]
//
// The key is read from the environment only and never written to disk.
// ------------------------------------------------------------------
import { writeFile, mkdir, rm } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "src/lib/tours/jackson-park-walk.ts");
const OUT = path.join(ROOT, "public/media/jackson-park-walk/audio");
const DURS = path.join(OUT, "durations.json");

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : def;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);
const voice = arg("voice", "ash");
const model = arg("model", "gpt-4o-mini-tts");
const only = arg("only");
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY must be set in the environment");
  process.exit(1);
}

// A guide walking beside you, not a documentary narrator.
const INSTRUCTIONS =
  "You are a friendly, knowledgeable local guide leading a self-paced walking tour of a Chicago park, speaking to one listener through their headphones. " +
  "Warm, unhurried, conversational, like showing a friend around a place you love. Natural pauses between sentences; a slightly longer breath between paragraphs. " +
  "Serious and quiet on the painful history, never solemn or theatrical. Never chirpy, never robotic. Plain American English; pronounce Chicago names naturally. " +
  "Numbers and years read out clearly and calmly.";

// ---- pull { number, transcript[] } for each stop out of the TS file ----
function loadStops() {
  const src = readFileSync(DATA, "utf8");
  const stops = [];
  const stopRe = /number:\s*(\d+),[\s\S]*?transcript:\s*\[([\s\S]*?)\n\s*\],/g;
  let m;
  while ((m = stopRe.exec(src)) !== null) {
    const number = parseInt(m[1], 10);
    const body = m[2];
    const strings = [];
    const strRe = /"((?:[^"\\]|\\.)*)"/g;
    let s;
    while ((s = strRe.exec(body)) !== null) {
      strings.push(JSON.parse(`"${s[1]}"`));
    }
    if (strings.length) stops.push({ number, text: strings.join("\n\n") });
  }
  return stops;
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
    p.on("close", () => resolve(Math.round(parseFloat(out.trim())) || 0));
  });
}

async function tts(text) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      instructions: INSTRUCTIONS,
      response_format: "mp3",
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
  const stops = loadStops();
  if (!stops.length) {
    console.error("No transcripts found in jackson-park-walk.ts");
    process.exit(1);
  }
  const durations = existsSync(DURS) ? JSON.parse(readFileSync(DURS, "utf8")) : {};
  for (const { number, text } of stops) {
    const id = `stop-${String(number).padStart(2, "0")}`;
    if (only && only !== id) continue;
    const raw = path.join(OUT, `raw-${id}.mp3`);
    const out = path.join(OUT, `${id}.mp3`);
    const buf = await tts(text);
    await writeFile(raw, buf);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
      "-af", "loudnorm=I=-18:TP=-2:LRA=11", "-codec:a", "libmp3lame", "-b:a", "128k", out]);
    await rm(raw, { force: true });
    const dur = await probe(out);
    durations[id] = dur;
    console.log(`${id}.mp3  ${dur}s  (${text.split(/\s+/).length} words, ${voice})`);
  }
  await writeFile(DURS, JSON.stringify(durations, null, 2));

  if (hasFlag("patch")) {
    let src = readFileSync(DATA, "utf8");
    for (const { number } of stops) {
      const id = `stop-${String(number).padStart(2, "0")}`;
      if (!(id in durations)) continue;
      const re = new RegExp(`(audio/${id}\\.mp3\`,\\n\\s*audioSeconds: )\\d+`);
      src = src.replace(re, `$1${durations[id]}`);
    }
    await writeFile(DATA, src);
    console.log("patched audioSeconds in jackson-park-walk.ts");
  }
  console.log(`\ndone. voice "${voice}", model "${model}"`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
