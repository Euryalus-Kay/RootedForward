#!/usr/bin/env node
// Emits docs/HYDE-PARK-TOUR-SCRIPT.md: a clean, complete script and
// shot list for the owner, built from the verified research, the
// generated tour, the VO durations, and the image provenance.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const research = JSON.parse(readFileSync(path.join(ROOT, "data/hp-research.json"), "utf8")).chapters;
const tour = JSON.parse(
  readFileSync(path.join(ROOT, "src/lib/immersive/tours/hyde-park.ts"), "utf8").match(/=\s*([\s\S]*);\s*$/)[1]
);
const durP = path.join(ROOT, "public/media/hyde-park/vo/durations.json");
const durations = existsSync(durP) ? JSON.parse(readFileSync(durP, "utf8")) : {};
const credits = JSON.parse(readFileSync(path.join(ROOT, "public/media/hyde-park/credits.json"), "utf8"));

const PANO = {
  "pano-hyde-park": "57th Street Beach, facing the skyline across the lakefront",
  "pano-jackson-park": "Jackson Park, by the Museum of Science and Industry and the Wooded Island",
  "pano-main-quad": "The center of the University of Chicago Main Quadrangles",
  "pano-55th-street": "55th Street, or the University Park townhouses, the rebuilt ground",
  "pano-obama-center": "The Obama Presidential Center site in Jackson Park",
};

const fmt = (s) => {
  const m = Math.floor(s / 60), ss = Math.round(s % 60);
  return m ? `${m} min ${ss} s` : `${ss} s`;
};
const num = (n) => String(n).padStart(2, "0");
const byId = (id) => research.find((c) => c.chapterId === id);
const imagesFor = (id) =>
  Object.keys(credits).filter((k) => k === id || k.startsWith(id + "-")).sort();

function clipsOf(stop) {
  const out = [];
  const seen = new Set();
  for (const seg of stop.sequence.segments) {
    const c = seg.clipId;
    if (seen.has(c)) continue;
    if (/^host-/.test(c)) { seen.add(c); out.push({ c, type: "host" }); }
    else if (/^pano-/.test(c)) { seen.add(c); out.push({ c, type: "pano" }); }
    else if (/^present-/.test(c)) { seen.add(c); out.push({ c, type: "present" }); }
  }
  if (stop.media) {
    const id = path.basename(stop.media.src, ".jpg");
    out.push({ c: id, type: "pano-module" });
  }
  return out;
}

function clipLine(k) {
  if (k.type === "host")
    return `**Film yourself on camera** (\`${k.c}\`). Your piece to camera. The lines are under "Say this on camera" below.`;
  if (k.type === "pano")
    return `**360 capture with your 3D camera** (\`${k.c}\`). ${PANO[k.c] || ""} This plays in the video as a slow look-around.`;
  if (k.type === "pano-module")
    return `**360 capture, look-around module** (\`${k.c}\`). ${PANO[k.c] || ""} This is the big drag-to-look viewer on the page.`;
  return `**Present-day clip** (\`${k.c}\`). Real footage of the locations in the direction note below.`;
}

let d = "";
d += `# Hyde Park, Built and Rebuilt\n## Full script and shot list\n\n`;
d += `This is the complete narration and the list of everything you film for the tour at \`/tours/chicago/hyde-park\`.\n\n`;
d += `It already plays end to end right now with labeled placeholders, so you can watch the cut before you shoot anything. The archival photos are real public-domain images and stay. The narration you hear is a scratch machine voice. You re-record it from the scripts below, in your own voice. Then you film the host pieces, the 360 look-arounds, and the present-day b-roll and swap them in for the placeholders.\n\n`;
const totalVO = research.reduce((a, c) => a + (durations["vo-" + c.chapterId] || 0), 0);
d += `Seven chapters. About ${fmt(totalVO)} of voiceover. Played through with the look-arounds it runs close to ten minutes.\n\n`;

d += `## How to swap a placeholder for your footage\n\n`;
d += `Upload your clip in \`/admin/studio\` or \`/admin/immersive\`, then point the matching id at your new file. Host and present-day clips are video ids. The 360s are the look-around ids. Each id is listed in its chapter below.\n\n`;

// Master checklist
d += `## Everything you need to film, in one place\n\n`;
d += `### Your pieces to camera (2)\n`;
for (const ch of research) {
  const s = (ch.script.hostScript || "").trim();
  if (s) d += `- Chapter ${num(research.indexOf(ch) + 1)}, ${ch.working}. See "Say this on camera" in that chapter.\n`;
}
d += `\n### 360 captures with your 3D camera\n`;
const seenP = new Set();
for (const ch of research) {
  const stop = tour.stops.find((s) => s.id === ch.chapterId);
  for (const k of clipsOf(stop)) {
    if ((k.type === "pano" || k.type === "pano-module") && !seenP.has(k.c)) {
      seenP.add(k.c);
      d += `- \`${k.c}\` . ${PANO[k.c] || ""}\n`;
    }
  }
}
d += `\n### Present-day b-roll\n`;
for (const ch of research) {
  const stop = tour.stops.find((s) => s.id === ch.chapterId);
  for (const k of clipsOf(stop))
    if (k.type === "present")
      d += `- \`${k.c}\` . Chapter ${num(research.indexOf(ch) + 1)}, ${ch.working}\n`;
}
d += `\n---\n\n`;

// Per-chapter
research.forEach((ch, i) => {
  const stop = tour.stops.find((s) => s.id === ch.chapterId);
  const dur = durations["vo-" + ch.chapterId] || 0;
  d += `## Chapter ${num(i + 1)}. ${ch.working}\n`;
  d += `**${ch.era}**  .  voiceover about ${fmt(dur)}  .  voiceover id \`vo-${ch.chapterId}\`\n\n`;

  const host = (ch.script.hostScript || "").trim();
  if (host) {
    d += `### Say this on camera\n\n> ${host}\n\n`;
  }
  d += `### Record this voiceover\n\n> ${ch.script.voiceover.trim()}\n\n`;

  const clips = clipsOf(stop);
  if (clips.length) {
    d += `### Shots to film for this chapter\n\n`;
    clips.forEach((k, j) => { d += `${j + 1}. ${clipLine(k)}\n`; });
    d += `\n`;
  }
  if (ch.script.shotNotes && ch.script.shotNotes.trim())
    d += `**Direction.** ${ch.script.shotNotes.trim()}\n\n`;

  const imgs = imagesFor(ch.chapterId);
  if (imgs.length) {
    d += `### Archival photos already in the cut (real, do not need filming)\n\n`;
    for (const im of imgs) {
      const c = credits[im];
      d += `- ${c.commonsTitle.replace(/^File:/, "").replace(/\.(jpg|jpeg|png|tiff)$/i, "")} . ${c.license}, ${c.artist}. [source](${c.descriptionUrl})\n`;
    }
    d += `\n`;
  }
  d += `---\n\n`;
});

d += `When you have the real clips and your recorded voiceover, swap each id above and the cut updates in place. Nothing else needs to change.\n`;

writeFileSync(path.join(ROOT, "docs/HYDE-PARK-TOUR-SCRIPT.md"), d);
console.log("Wrote docs/HYDE-PARK-TOUR-SCRIPT.md");
console.log("chapters:", research.length, "| total VO:", fmt(totalVO));
