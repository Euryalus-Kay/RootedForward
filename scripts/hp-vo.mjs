#!/usr/bin/env node
// ------------------------------------------------------------------
// Hyde Park tour: generate the SCRATCH voiceover for each chapter with
// the macOS `say` engine, convert to mp3, and report the real duration
// of each clip so subtitles can be timed to the audio.
//
// This is a placeholder narration track. The owner records the real
// voiceover and swaps these files. Reads a JSON file of
// [{ id, text }, ...] and writes public/media/hyde-park/vo/<id>.mp3
// plus public/media/hyde-park/vo/durations.json.
//
// Usage: node scripts/hp-vo.mjs --in /tmp/hp-vo.json [--voice Samantha] [--rate 168]
// ------------------------------------------------------------------

import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/media/hyde-park/vo");

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const inFile = arg("in");
const voice = arg("voice", "Samantha");
const rate = arg("rate", "168");
if (!inFile) {
  console.error("Need --in <json>");
  process.exit(1);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(err.slice(-300)))
    );
  });
}

function probe(file) {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      file,
    ]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => resolve(Math.round(parseFloat(out.trim()) * 10) / 10 || 0));
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const items = JSON.parse(await readFile(inFile, "utf8"));
  const durations = {};
  // Warmth chain to take the edge off the machine voice: trim rumble,
  // add a little body and presence, gentle compression, normalize.
  const AF =
    "highpass=f=85,equalizer=f=120:t=q:w=1.2:g=2,equalizer=f=330:t=q:w=1:g=-2," +
    "equalizer=f=3200:t=q:w=1.5:g=2.2,acompressor=threshold=-18dB:ratio=3:attack=8:release=180," +
    "loudnorm=I=-18:TP=-2:LRA=11";
  for (const { id, text } of items) {
    const aiff = path.join("/tmp", `hp_vo_${id}.aiff`);
    // the renderer and tour builder read vo-<id>.mp3, write that exact name
    const mp3 = path.join(OUT, `vo-${id}.mp3`);
    // Breathing room between sentences so it reads as narration, not a list.
    const paced = text.replace(/([.!?])\s+/g, "$1 [[slnc 260]] ");
    await run("say", ["-v", voice, "-r", rate, "-o", aiff, paced]);
    await run("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      aiff,
      "-af",
      AF,
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "160k",
      mp3,
    ]);
    await rm(aiff, { force: true });
    const dur = await probe(mp3);
    durations[id] = dur;
    durations[`vo-${id}`] = dur;
    console.log(`vo-${id}.mp3  ${dur}s`);
  }
  await writeFile(
    path.join(OUT, "durations.json"),
    JSON.stringify(durations, null, 2)
  );
  console.log("voice:", voice, "rate:", rate);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
