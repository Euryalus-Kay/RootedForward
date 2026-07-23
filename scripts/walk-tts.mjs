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
// two tours share this pipeline; pick with --tour (default hyde-park)
const TOURS = {
  "hyde-park": {
    data: "src/lib/tours/hyde-park-walk.ts",
    out: "public/media/hyde-park-walk/audio",
  },
  "jackson-park": {
    data: "src/lib/tours/jackson-park-walk.ts",
    out: "public/media/jackson-park-walk/audio",
  },
};
function argEarly(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : def;
}
const tourName = argEarly("tour", "hyde-park");
if (!TOURS[tourName]) {
  console.error(`unknown --tour "${tourName}" (use ${Object.keys(TOURS).join(" | ")})`);
  process.exit(1);
}
const DATA = path.join(ROOT, TOURS[tourName].data);
const OUT = path.join(ROOT, TOURS[tourName].out);
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
const BASE_INSTRUCTIONS =
  "You are a friendly, knowledgeable local guide leading a self-paced walking tour of a Chicago neighborhood, speaking to one listener through their headphones. " +
  "Warm, unhurried, conversational, like showing a friend around a place you love. Natural pauses between sentences; a slightly longer, easy breath between paragraphs. " +
  "Serious and quiet on the painful history, never solemn or theatrical. Never chirpy, never robotic, never salesy. Plain American English; pronounce Chicago names naturally. " +
  "Numbers and years read out clearly and calmly. ";

// Per-stop coloring on top of the base read. Keyed by tour, then stop.
const TONE_SETS = {
  "hyde-park": {
    1: "The welcome. Settled and a little conspiratorial, letting the listener in on a story most neighbors never heard. Enjoy Cornell the operator without admiring him. Slow slightly on the last paragraph and land 'designed to choose its neighbors' plainly.",
    2: "Nostalgic storyteller at the grand hotel, painting summer crowds you can almost hear. Let the lobby paragraph glow a little. Then cool and steady for the final paragraph about who was on the porch, ending on a quiet, pointed handoff.",
    3: "Start matter-of-fact about the trains, then open up with respect and weight for the Great Migration paragraph; that one is the heart of this stop, read it unhurried. Wry but gentle on Lake Park as the back of the stage set. Firm and clear on the closing pattern.",
    4: "Big canvas. Real wonder for the White City and the electric nights, without turning into a commercial. Level and unflinching from Nancy Green onward; read the pamphlet's full title slowly and clearly. End the stop quietly on the question.",
    5: "Affection for the strange brilliant house, a storyteller enjoying Wright and Robie. Shift to thoughtful and pointed in the last paragraph; 'the turn in the whole story' should feel like the guide leaning in.",
    6: "Carnival color for the Ferris wheel paragraph. Drop all brightness for the villages paragraph; level, unflinching, with a beat after 'sold tickets to it all summer.' Cartographer's calm for the canal. Grave and steady from 'The Midway became a border' to the end.",
    7: "Campus-tour warmth with an edge of amusement at the instant-ancestry Gothic. Read the Douglas plantation sentence plainly and let it sit. The gates paragraph turns thoughtful. End with easy momentum toward the stadium.",
    8: "Relish the football spectacle, then genuine awe, hushed and precise, for the pile paragraph; slow right down for the date and the four and a half minutes. The closing pivot back to the neighborhood is quiet and pointed.",
    9: "The hardest stop. Level, controlled, and unhurried throughout; anger held in check, never theatrical. Walk through the blockbusting play step by step like explaining a con. A touch of warmth for the bars and the Compass Players, then cool again for the university's gaze.",
    10: "Measured and direct, a reckoning delivered by a fair witness. Read the displacement numbers slowly. Baldwin's line lands plain, no flourish. Give the two-things-are-true paragraph room; it is the tour's honest center of gravity.",
    11: "The finale. Start with quiet awe at the tower and Juneteenth. Build carefully through the rhyme of history, matter-of-fact on the numbers. Slow for 'run the whole line once' and read that list with weight. The last paragraph is calm, direct, and hopeful without softness; end warm on the thanks and the lunch tip.",
  },
  "jackson-park": {
    1: "This is the welcome. Bright but settled, glad the listener showed up. Let the last paragraph slow slightly as the history opens up.",
    2: "Storyteller mode, enjoying the spectacle of the Ferris wheel. Drop the brightness completely for the sentence about people being put on display; read it level and unflinching, with a beat of silence after 'That happened on this lawn too.' Warm again for the playground.",
    3: "Quiet and close, like talking at a graveside bench about two people you admire. Gentle lift at the invitation to sit.",
    4: "Start with easy wonder looking across the water. Turn steady and respectful for Rosenwald, letting the schoolhouse sentence land without any swell.",
    5: "Affectionate and a little wry; you love this broken old bridge. Tender on the ashes and the wreaths. The last line dry, not sad.",
    6: "Gentle and unhurried, garden-quiet. Grave and plain on the 1946 arson. Softly hopeful from Sky Landing onward, ending with an easy send-off down the path.",
    7: "Hushed, as if not to scare the birds. Slow, with space around the sentences. The last line is a quiet promise of what is ahead.",
    8: "Open with scale and awe at the golden statue and the vanished fair. Shift to a firm, clear, unhurried register for Ida B. Wells and Frederick Douglass; this is the heart of the tour, read it with respect and no melodrama.",
    9: "The finale. Direct and honest, one neighbor leveling with another. Read the Obama quote as reported speech, matter of fact. Slow down for the final three sentences and let 'That is the park you just walked' close gently, almost quietly.",
  },
};
const TONES = TONE_SETS[tourName];

// Encourage real pauses: newline after sentence enders shapes spoken
// pacing without changing the on-page transcript.
function paceText(text) {
  return text.replace(/([.!?])\s+/g, "$1\n");
}

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

async function tts(text, instructions) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      voice,
      input: paceText(text),
      instructions,
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
    console.error(`No transcripts found in ${DATA}`);
    process.exit(1);
  }
  const durations = existsSync(DURS) ? JSON.parse(readFileSync(DURS, "utf8")) : {};
  for (const { number, text } of stops) {
    const id = `stop-${String(number).padStart(2, "0")}`;
    if (only && only !== id) continue;
    const raw = path.join(OUT, `raw-${id}.mp3`);
    const out = path.join(OUT, `${id}.mp3`);
    const buf = await tts(text, BASE_INSTRUCTIONS + (TONES[number] || ""));
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
    console.log(`patched audioSeconds in ${DATA}`);
  }
  console.log(`\ndone. voice "${voice}", model "${model}"`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
