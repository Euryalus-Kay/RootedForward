#!/usr/bin/env node
// ------------------------------------------------------------------
// Generate the Jackson Park walking tour narration with ElevenLabs,
// one mp3 per stop, loudness-normalized. Reads the transcripts out of
// src/lib/tours/jackson-park-walk.ts so audio never drifts from the
// on-page text.
//
// Each named voice keeps its own archive under
//   public/media/jackson-park-walk/audio/voices/<name>/
// and --patch promotes that archive to the live audio the site serves
// (audio/stop-XX.mp3) and rewrites audioSeconds in the data file.
// To switch the live narration between already-generated voices
// without calling the API, use scripts/walk-voice.mjs instead.
//
// Usage:
//   ELEVENLABS_API_KEY=... node scripts/walk-tts-eleven.mjs
//       [--voice zain|narrator|<raw ElevenLabs id>]
//       [--model eleven_multilingual_v2] [--only stop-03] [--patch]
//
// The key is read from the environment only and never written to disk.
// ------------------------------------------------------------------
import { writeFile, mkdir, rm, copyFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
// two tours share this pipeline; pick with --tour (default hyde-park)
const TOURS = {
  "hyde-park": {
    data: "src/lib/tours/hyde-park-walk.ts",
    live: "public/media/hyde-park-walk/audio",
  },
  "jackson-park": {
    data: "src/lib/tours/jackson-park-walk.ts",
    live: "public/media/jackson-park-walk/audio",
  },
};

// Named voices. "narrator" is the original professional ElevenLabs
// narrator the tour launched with; "zain" is the owner's own cloned
// voice ("zain voice long"). Switch back any time with
//   node scripts/walk-voice.mjs narrator
export const VOICES = {
  narrator: "JBFqnCBsd6RMkjVDRZzb",
  zain: "ZojE61ZitQ5HMBcqdLsZ",
};

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : def;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);
const tourName = arg("tour", "hyde-park");
if (!TOURS[tourName]) {
  console.error(`unknown --tour "${tourName}" (use ${Object.keys(TOURS).join(" | ")})`);
  process.exit(1);
}
const DATA = path.join(ROOT, TOURS[tourName].data);
const LIVE = path.join(ROOT, TOURS[tourName].live);
const voiceName = arg("voice", "zain");
const voice = VOICES[voiceName] ?? voiceName;
const archiveName = VOICES[voiceName] ? voiceName : `id-${voiceName.slice(0, 8)}`;
const OUT = path.join(LIVE, "voices", archiveName);
const DURS = path.join(OUT, "durations.json");
const model = arg("model", "eleven_multilingual_v2");
const only = arg("only");
const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("ELEVENLABS_API_KEY must be set in the environment");
  process.exit(1);
}

// Settings tuned for a steady, warm tour narration: high similarity
// keeps the voice consistent across stops, moderate stability leaves
// room for natural inflection, a little style for storytelling.
const VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.8,
  style: 0.25,
  use_speaker_boost: true,
};

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
      strings.push(JSON.parse(`"${s[1]}"`).replace(/\*\*/g, ""));
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
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: VOICE_SETTINGS,
      }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${t.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const stops = loadStops();
  if (!stops.length) {
    console.error(`No transcripts found in ${DATA}`);
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
    console.log(`${id}.mp3  ${dur}s  (${text.split(/\s+/).length} words, elevenlabs)`);
  }
  await writeFile(DURS, JSON.stringify(durations, null, 2));

  if (hasFlag("patch")) {
    // promote this voice's archive to the live audio the site serves
    let src = readFileSync(DATA, "utf8");
    for (const { number } of stops) {
      const id = `stop-${String(number).padStart(2, "0")}`;
      if (!(id in durations)) continue;
      await copyFile(path.join(OUT, `${id}.mp3`), path.join(LIVE, `${id}.mp3`));
      const re = new RegExp(`(audio/${id}\\.mp3\`,\\n\\s*audioSeconds: )\\d+`);
      src = src.replace(re, `$1${durations[id]}`);
    }
    await writeFile(DATA, src);
    await writeFile(path.join(LIVE, "durations.json"), JSON.stringify(durations, null, 2));
    console.log(`promoted "${archiveName}" to live audio + patched audioSeconds`);
  }
  console.log(`\ndone. voice "${archiveName}" (${voice}), model "${model}"`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
