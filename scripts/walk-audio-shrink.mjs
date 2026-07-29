#!/usr/bin/env node
// ------------------------------------------------------------------
// Re-encode the walk narration for delivery.
//
// The text-to-speech service returns 128 kbps mono at 48 kHz, which is
// music settings applied to one synthetic voice. Spoken word is well
// served by 64 kbps mono at 32 kHz, the setting podcasts have used for
// twenty years, and it halves every file. That matters twice over:
// the app bundles both walks, and everyone who streams a stop on the
// site downloads it.
//
// Duration is unchanged, so audioSeconds and durations.json stay
// correct and nothing needs re-measuring.
//
// Usage:
//   node scripts/walk-audio-shrink.mjs            both walks
//   node scripts/walk-audio-shrink.mjs --check    report, change nothing
// ------------------------------------------------------------------
import { readdirSync, statSync, renameSync, unlinkSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const WALKS = ["hyde-park-walk", "harlem-walk"];
const BITRATE = "64k";
const RATE = "32000";
const CHECK = process.argv.includes("--check");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(err.slice(-400)))
    );
  });
}

function probe(file) {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration:stream=bit_rate",
      "-of", "default=nw=1:nk=1",
      file,
    ]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => {
      const [bitRate, duration] = out.trim().split("\n");
      resolve({ bitRate: Number(bitRate), duration: Number(duration) });
    });
  });
}

let before = 0;
let after = 0;
let touched = 0;
let skipped = 0;

for (const walk of WALKS) {
  const dir = path.join("public/media", walk, "audio");
  const files = readdirSync(dir).filter((f) => f.endsWith(".mp3"));
  for (const name of files) {
    const file = path.join(dir, name);
    const size = statSync(file).size;
    const info = await probe(file);
    before += size;

    // already down at delivery bitrate, leave it alone
    if (info.bitRate && info.bitRate <= 80000) {
      after += size;
      skipped++;
      continue;
    }
    if (CHECK) {
      console.log(
        `  would shrink ${walk}/${name}  ${Math.round(info.bitRate / 1000)}k`
      );
      after += Math.round(size / 2);
      touched++;
      continue;
    }

    const tmp = file + ".tmp.mp3";
    await run("ffmpeg", [
      "-y", "-v", "error",
      "-i", file,
      "-c:a", "libmp3lame",
      "-b:a", BITRATE,
      "-ac", "1",
      "-ar", RATE,
      tmp,
    ]);

    // a re-encode that moved the duration means something went wrong,
    // and audioSeconds on the page would start lying
    const fresh = await probe(tmp);
    if (Math.abs(fresh.duration - info.duration) > 0.5) {
      unlinkSync(tmp);
      throw new Error(
        `${name} changed length, ${info.duration}s to ${fresh.duration}s`
      );
    }
    renameSync(tmp, file);
    after += statSync(file).size;
    touched++;
  }
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(
  `${CHECK ? "would re-encode" : "re-encoded"} ${touched} file(s), ` +
    `${skipped} already small, ${mb(before)} MB -> ${mb(after)} MB`
);
if (!CHECK && touched) {
  console.log("run ios/prep-media.sh to carry it into the app bundle");
}
