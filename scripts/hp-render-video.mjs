#!/usr/bin/env node
// ------------------------------------------------------------------
// Render the Hyde Park tour SequenceDocs to an actual watchable MP4.
//
// The live site plays the edit in the browser with no render step and
// the 360s are drag-to-look. This script bakes a flat video so the
// owner can watch the whole thing as a file: Ken Burns on the stills,
// the archival sepia grade, titles / source credits / data callouts,
// burned subtitles, and the scratch voiceover. The 360 look-arounds
// become slow auto-pans across the equirectangular frame.
//
// Output: public/media/hyde-park/video/<chapter>.mp4 and the full
// hyde-park-tour.mp4. Run after scripts/hp-build-tour.mjs.
// ------------------------------------------------------------------

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/media/hyde-park/video");
const TMP = path.join(ROOT, ".hp-render-tmp");
const SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf";
const SANS = "/System/Library/Fonts/Supplemental/Arial.ttf";
const W = 1920;
const H = 1080;
const FPS = 30;

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const tour = JSON.parse(
  readFileSync(path.join(ROOT, "src/lib/immersive/tours/hyde-park.ts"), "utf8")
    .match(/=\s*([\s\S]*);\s*$/)[1]
);

const COLOR = { cream: "0xF5F0E8", white: "0xFFFFFF", rust: "0xC45D3E", ink: "0x161616" };

function ff(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", ["-y", "-loglevel", "error", ...args]);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(err.slice(-600)))));
  });
}

function localPath(url) {
  return path.join(ROOT, "public", url.replace(/^\//, ""));
}

let tfN = 0;
function textfile(s) {
  const f = path.join(TMP, `t${tfN++}.txt`);
  writeFileSync(f, s, "utf8");
  return f;
}

// drawtext for one overlay, with local timing inside the segment.
function overlayDraw(o) {
  const tfp = textfile(o.text);
  const color = COLOR[o.style?.color ?? "cream"] || COLOR.cream;
  const font = o.kind === "title" ? SERIF : SANS;
  const size =
    o.kind === "title"
      ? Math.round(H * (o.style?.size === "lg" ? 0.058 : 0.046))
      : o.kind === "lower-third"
        ? Math.round(H * 0.03)
        : Math.round(H * 0.024);
  const pos = o.position ?? (o.kind === "title" ? "center" : "lower");
  let x = "(w-text_w)/2";
  let y = "(h-text_h)/2";
  if (pos === "upper") {
    y = String(Math.round(H * 0.07));
  } else if (pos === "lower") {
    x = String(Math.round(W * 0.05));
    y = "h-" + Math.round(H * 0.16);
  }
  const box =
    o.kind === "title" && o.style?.background === false
      ? ""
      : ":box=1:boxcolor=0x101010@0.5:boxborderw=16";
  const parts = [
    `drawtext=fontfile='${font}'`,
    `textfile='${tfp}'`,
    `fontcolor=${color}`,
    `fontsize=${size}`,
    `x=${x}`,
    `y=${y}`,
    `shadowcolor=black@0.6`,
    `shadowx=2`,
    `shadowy=2`,
    `enable='between(t,${o.startSec},${o.endSec})'`,
  ].join(":");
  return parts + box;
}

function gradeFilter(filter) {
  if (!filter) return null;
  if (filter.grayscale && filter.grayscale >= 0.9) return "hue=s=0,eq=contrast=1.08";
  if (filter.sepia && filter.sepia >= 0.3)
    return "eq=saturation=0.7:contrast=0.96,colorbalance=rm=0.15:gm=0.06:bm=-0.12";
  if (filter.sepia && filter.sepia > 0)
    return "eq=saturation=1.05:contrast=1.0,colorbalance=rm=0.06:bm=-0.05";
  return null;
}

function srtTime(s) {
  const ms = Math.round((s % 1) * 1000);
  const t = Math.floor(s);
  const hh = String(Math.floor(t / 3600)).padStart(2, "0");
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss},${String(ms).padStart(3, "0")}`;
}

async function renderSegment(seg, asset, dur, outFile) {
  const src = localPath(asset.url);
  const overlays = (seg.overlays ?? []).map(overlayDraw);
  let vf;
  if (asset.is360) {
    // pan a 16:9 window across the equirect to fake a look-around
    const panX = `(in_w-${W})*min(t/${dur.toFixed(2)},1)`;
    vf = [
      `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase`,
      `crop=${W}:${H}:x='${panX}':y=(in_h-${H})/2`,
      ...overlays,
      "format=yuv420p",
    ].join(",");
    await ff([
      "-loop", "1", "-t", String(dur), "-i", src,
      "-vf", vf, "-r", String(FPS),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-an",
      outFile,
    ]);
    return;
  }
  // still image with a slow Ken Burns push and the grade
  const grade = gradeFilter(seg.filter);
  const frames = Math.max(2, Math.round(dur * FPS));
  vf = [
    `scale=${Math.round(W * 1.25)}:${Math.round(H * 1.25)}:force_original_aspect_ratio=increase`,
    `crop=${Math.round(W * 1.25)}:${Math.round(H * 1.25)}`,
    `zoompan=z='min(zoom+0.0006,1.14)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`,
    ...(grade ? [grade] : []),
    ...overlays,
    "format=yuv420p",
  ].join(",");
  await ff([
    "-i", src,
    "-vf", vf, "-t", String(dur), "-r", String(FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-an",
    outFile,
  ]);
}

async function concat(files, outFile, copy = true) {
  const list = path.join(TMP, `concat_${tfN++}.txt`);
  writeFileSync(list, files.map((f) => `file '${f}'`).join("\n"));
  const args = ["-f", "concat", "-safe", "0", "-i", list];
  if (copy) args.push("-c", "copy");
  else args.push("-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-c:a", "aac");
  args.push(outFile);
  await ff(args);
}

async function renderChapter(stop) {
  const seq = stop.stop ? stop.stop.sequence : stop.sequence;
  const id = stop.id ?? stop.stop?.id;
  const segFiles = [];
  let cursor = 0;
  for (let i = 0; i < seq.segments.length; i++) {
    const seg = seg2(seq, i);
    const asset = seq.assets[seg.clipId];
    const dur = Math.max(0.6, seg.outSec - seg.inSec);
    const out = path.join(TMP, `${id}_seg${i}.mp4`);
    await renderSegment(seg, asset, dur, out);
    segFiles.push(out);
    cursor += dur;
  }
  // concat segments (video only)
  const chapVid = path.join(TMP, `${id}_vid.mp4`);
  await concat(segFiles, chapVid, true);

  // subtitles SRT (chapter-global, timed to the VO)
  const cues = seq.subtitles ?? [];
  const srt = cues
    .map(
      (c, i) =>
        `${i + 1}\n${srtTime(c.startSec)} --> ${srtTime(c.endSec)}\n${c.text}\n`
    )
    .join("\n");
  const srtFile = path.join(TMP, `${id}.srt`);
  writeFileSync(srtFile, srt);

  // final chapter: burn subtitles + add the VO bed padded to length
  const voUrl = seq.voiceover ? seq.assets[seq.voiceover.clipId]?.url : null;
  const out = path.join(OUT, `${id}.mp4`);
  const style =
    "Fontname=Arial,Fontsize=20,PrimaryColour=&H00E8F0F5,OutlineColour=&H00101010,BorderStyle=1,Outline=2,Shadow=1,Alignment=2,MarginV=46";
  const subFilter = `subtitles='${srtFile}':force_style='${style}'`;
  if (voUrl) {
    // Pad the VO with silence and bound the output with -t (the video
    // length). Using -shortest with an infinite apad stream hangs, so
    // the explicit duration is what stops the encode.
    const tlen = (Math.round(cursor * 100) / 100).toFixed(2);
    await ff([
      "-i", chapVid, "-i", localPath(voUrl),
      "-filter_complex", `[0:v]${subFilter}[v];[1:a]apad[a]`,
      "-map", "[v]", "-map", "[a]",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21",
      "-c:a", "aac", "-b:a", "160k", "-t", tlen, out,
    ]);
  } else {
    await ff([
      "-i", chapVid, "-vf", subFilter,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", out,
    ]);
  }
  return out;
}

function seg2(seq, i) {
  return seq.segments[i];
}

async function main() {
  const chapterFiles = [];
  for (const stop of tour.stops) {
    process.stdout.write(`rendering ${stop.id} ... `);
    const f = await renderChapter(stop);
    chapterFiles.push(f);
    console.log("done");
  }
  const full = path.join(OUT, "hyde-park-tour.mp4");
  // re-encode the final concat so mixed keyframes/audio splice cleanly
  await concat(chapterFiles, full, false);
  rmSync(TMP, { recursive: true, force: true });
  console.log(`\nWrote ${path.relative(ROOT, full)}`);
  for (const f of chapterFiles) console.log("  " + path.relative(ROOT, f));
}

main().catch((e) => {
  console.error("RENDER ERROR:", e.message);
  process.exit(1);
});
