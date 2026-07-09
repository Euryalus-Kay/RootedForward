#!/usr/bin/env node
// ------------------------------------------------------------------
// Hyde Park tour: generate clearly-labeled PLACEHOLDER media so the
// edit plays end to end before the owner films real footage. Two kinds.
//
//   1. Equirectangular 2:1 "pano" slates (4096x2048) that the PanoViewer
//      maps onto a sphere, so the drag-to-look mechanic works. Each one
//      names the exact spot to go shoot a real 360.
//   2. Flat 16:9 slates (1920x1080) for host-on-camera and present-day
//      b-roll slots.
//
// On-screen text avoids em-dashes and sentence colons to match house
// style. Output goes to public/media/hyde-park/slates.
// ------------------------------------------------------------------

import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/media/hyde-park/slates");
const SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf";
const SANS = "/System/Library/Fonts/Supplemental/Arial.ttf";

const CREAM = "0xF5F0E8";
const RUST = "0xC45D3E";
const FOREST = "0x16271E";
const INK = "0x161616";

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

async function tf(name, text) {
  const f = path.join("/tmp", `hp_slate_${name}.txt`);
  await writeFile(f, text, "utf8");
  return f;
}

function dt(fontfile, textfile, color, size, yexpr) {
  return [
    "drawtext=fontfile='" + fontfile + "'",
    "textfile='" + textfile + "'",
    "fontcolor=" + color,
    "fontsize=" + size,
    "line_spacing=14",
    "text_align=C",
    "x=(w-text_w)/2",
    "y=" + yexpr,
  ].join(":");
}

async function slate({ id, w, h, bg, grid, kicker, title, sub }) {
  const kf = await tf(id + "_k", kicker);
  const tfp = await tf(id + "_t", title);
  const sf = await tf(id + "_s", sub);
  const big = Math.round(h * 0.072);
  const small = Math.round(h * 0.026);
  const subS = Math.round(h * 0.03);
  const filters = [];
  if (grid) {
    const step = Math.round(w / 16);
    filters.push(
      `drawgrid=width=${step}:height=${step}:thickness=2:color=0xFFFFFF@0.06`
    );
  }
  // kicker above center, title at center, sub below
  filters.push(dt(SANS, kf, RUST, small, `h/2 - ${Math.round(h * 0.16)}`));
  filters.push(dt(SERIF, tfp, CREAM, big, `(h-text_h)/2`));
  filters.push(dt(SANS, sf, CREAM + "@0.72", subS, `h/2 + ${Math.round(h * 0.12)}`));
  const out = path.join(OUT, `${id}.jpg`);
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "lavfi",
    "-i",
    `color=c=${bg}:s=${w}x${h}`,
    "-vf",
    filters.join(","),
    "-frames:v",
    "1",
    "-q:v",
    "3",
    out,
  ]);
  console.log(`slate ${out}`);
}

// 360 look-around placeholders. Each names the exact capture to shoot.
const PANOS = [
  {
    id: "pano-hyde-park",
    kicker: "PLACEHOLDER 360 . FILM THIS",
    title: "57th Street and the lakefront",
    sub: "Stand at 57th Street Beach facing the skyline. Record a full 360 with your 3D camera, then upload it to replace this sphere.",
  },
  {
    id: "pano-jackson-park",
    kicker: "PLACEHOLDER 360 . FILM THIS",
    title: "Jackson Park, where the White City stood",
    sub: "Capture a 360 near the Museum of Science and Industry and the Wooded Island, on the ground the 1893 fair once covered.",
  },
  {
    id: "pano-main-quad",
    kicker: "PLACEHOLDER 360 . FILM THIS",
    title: "The Main Quadrangles",
    sub: "Record a 360 inside the University of Chicago quads, surrounded by the Gothic limestone, then upload to replace this sphere.",
  },
  {
    id: "pano-55th-street",
    kicker: "PLACEHOLDER 360 . FILM THIS",
    title: "55th Street, rebuilt block",
    sub: "Capture a 360 along 55th Street or the University Park townhouses, the ground cleared and rebuilt by urban renewal.",
  },
  {
    id: "pano-obama-center",
    kicker: "PLACEHOLDER 360 . FILM THIS",
    title: "Jackson Park, the Obama Center site",
    sub: "Record a 360 at the Obama Presidential Center construction site in Jackson Park, then upload to replace this sphere.",
  },
];

// Flat host / b-roll placeholders.
const FLATS = [
  {
    id: "host-intro",
    kicker: "PLACEHOLDER . FILM THIS",
    title: "Host on camera, open",
    sub: "Replace with your filmed intro. The scratch voiceover and the on-screen script tell you what to say.",
  },
  {
    id: "host-close",
    kicker: "PLACEHOLDER . FILM THIS",
    title: "Host on camera, close",
    sub: "Replace with your filmed closing piece to camera. Script is in the shot list.",
  },
  {
    id: "present-broll",
    kicker: "PLACEHOLDER . FILM THIS",
    title: "Present-day shot",
    sub: "Drop in a present-day clip of the location named in the shot list for this beat.",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const p of PANOS)
    await slate({ ...p, w: 4096, h: 2048, bg: FOREST, grid: true });
  for (const f of FLATS)
    await slate({ ...f, w: 1920, h: 1080, bg: INK, grid: false });
  console.log("done");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
