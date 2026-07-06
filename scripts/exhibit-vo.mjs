#!/usr/bin/env node
// ------------------------------------------------------------------
// Exhibit narration TTS. Reads data/exhibit/narration.json, refuses
// to run unless the pre-TTS fact gate passes, then renders one mp3
// per narration block with OpenAI TTS (same voice/instructions
// conventions as scripts/hp-vo-openai.mjs, which produced the film's
// track) into public/media/hyde-park/vo/exhibit/.
//
// Usage:
//   OPENAI_API_KEY=... node scripts/exhibit-vo.mjs [--voice ash]
//     [--model gpt-4o-mini-tts] [--speed 1.0] [--only ch0,ch1] [--force]
//
// Skips blocks whose mp3 already exists unless --force. The key is
// read from the environment only and never written to disk.
// ------------------------------------------------------------------
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/media/hyde-park/vo/exhibit");
const DURS = path.join(OUT, "durations.json");

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const voice = arg("voice", "ash");
const model = arg("model", "gpt-4o-mini-tts");
const speed = parseFloat(arg("speed", "1.0"));
const only = arg("only")?.split(",").map((s) => s.trim());
const force = process.argv.includes("--force");
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Need OPENAI_API_KEY in the environment (.env.local is not auto-loaded; export it)");
  process.exit(1);
}

// hard gate: no unverified claim gets a voice
try {
  execSync("node scripts/exhibit-audit-facts.mjs --stage pre-tts --no-write --quiet", {
    cwd: ROOT,
    stdio: "pipe",
  });
  console.log("pre-TTS fact gate passed");
} catch (e) {
  console.error("pre-TTS fact gate FAILED; refusing to generate audio\n");
  console.error(e.stdout?.toString() || e.message);
  process.exit(1);
}

// Same narrator brief as the film's scratch VO (hp-vo-openai.mjs)
const INSTRUCTIONS =
  "You are the narrator of a serious, warm documentary about a Chicago neighborhood and the people displaced from it. " +
  "Read in a calm, grounded, human voice at a steady, natural documentary pace, moving forward, not dragging. " +
  "A normal breath between sentences is enough; do not over-pause. Clear and measured, with quiet empathy. " +
  "Never chirpy, never robotic, never sing-song. Plain, clear American English. Pronounce proper names and places naturally.";

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
    p.on("close", () => resolve(Math.round(parseFloat(out.trim()) * 100) / 100 || 0));
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
  const narration = JSON.parse(readFileSync(path.join(ROOT, "data/exhibit/narration.json"), "utf8"));
  const durations = existsSync(DURS) ? JSON.parse(readFileSync(DURS, "utf8")) : {};

  const blocks = [];
  for (const ch of narration.chapters) {
    if (only && !only.includes(ch.id)) continue;
    for (const b of ch.blocks) blocks.push(b);
  }
  console.log(`${blocks.length} block(s), voice "${voice}", model "${model}"\n`);

  let made = 0;
  for (const block of blocks) {
    const id = `ex-${block.id}`;
    const out = path.join(OUT, `vo-${id}.mp3`);
    if (existsSync(out) && !force) {
      if (!(durations[id] > 0)) {
        const dur = await probe(out);
        durations[id] = dur;
        durations[`vo-${id}`] = dur;
      }
      continue;
    }
    const raw = path.join("/tmp", `oai_${id}.mp3`);
    const buf = await tts(block.text);
    await writeFile(raw, buf);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
      "-af", "loudnorm=I=-18:TP=-2:LRA=11", "-codec:a", "libmp3lame", "-b:a", "80k", "-ac", "1", out]);
    await rm(raw, { force: true });
    const dur = await probe(out);
    durations[id] = dur;
    durations[`vo-${id}`] = dur;
    made++;
    console.log(`vo-${id}.mp3  ${dur}s`);
  }

  await writeFile(DURS, JSON.stringify(durations, null, 2));
  console.log(`\ndone. ${made} generated, ${blocks.length - made} already present.`);
  console.log("next: node scripts/exhibit-sync-cues.mjs");
}
main().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
