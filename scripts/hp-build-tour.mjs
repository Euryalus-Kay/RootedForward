#!/usr/bin/env node
// ------------------------------------------------------------------
// Hyde Park tour builder.
//
// Turns three inputs into the finished immersive tour:
//   data/hp-research.json          verified scripts per chapter
//   public/media/hyde-park/vo/durations.json   real VO clip lengths
//   public/media/hyde-park/credits.json         downloaded image provenance
//
// Emits:
//   src/lib/immersive/tours/hyde-park.ts   the ImmersiveTour object
//   supabase/migrations/007_hyde_park_tour.sql   the seed row
//   docs/HYDE-PARK-TOUR-PRODUCTION.md       the owner's shot list
//
// The timeline math here keeps each chapter's sequence a touch longer
// than its voiceover so narration always finishes, and times the
// subtitles to the real audio length. Archival images get a sepia
// grade and a Ken Burns move, with an on-screen source credit pulled
// from the Commons provenance. Placeholder slates (host, present-day,
// 360) carry no grade so they read as modern and clearly swappable.
// ------------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RESEARCH = path.join(ROOT, "data/hp-research.json");
const DURS = path.join(ROOT, "public/media/hyde-park/vo/durations.json");
const CREDITS = path.join(ROOT, "public/media/hyde-park/credits.json");

const research = JSON.parse(readFileSync(RESEARCH, "utf8")).chapters;
const durations = existsSync(DURS) ? JSON.parse(readFileSync(DURS, "utf8")) : {};
const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, "utf8")) : {};

/* ----------------------------- palette --------------------------- */

const ARCHIVAL = { brightness: 1.02, contrast: 0.95, saturate: 0.7, hueDeg: 0, blur: 0, grayscale: 0, sepia: 0.35 };
const MONO = { brightness: 1, contrast: 1.1, saturate: 1, hueDeg: 0, blur: 0, grayscale: 1, sepia: 0 };
const WARM = { brightness: 1.04, contrast: 1.02, saturate: 1.1, hueDeg: 8, blur: 0, grayscale: 0, sepia: 0.12 };

const KB = {
  pushIn: { fromScale: 1.0, toScale: 1.12, fromX: -0.18, fromY: -0.08, toX: 0.18, toY: 0.08 },
  pushOut: { fromScale: 1.12, toScale: 1.0, fromX: 0.18, fromY: 0.1, toX: -0.18, toY: -0.08 },
  panRight: { fromScale: 1.08, toScale: 1.1, fromX: -0.4, fromY: 0, toX: 0.4, toY: 0 },
  panLeft: { fromScale: 1.1, toScale: 1.08, fromX: 0.4, fromY: 0, toX: -0.4, toY: 0 },
  driftUp: { fromScale: 1.05, toScale: 1.14, fromX: 0, fromY: 0.3, toX: 0, toY: -0.3 },
};
const KB_CYCLE = [KB.pushIn, KB.panRight, KB.pushOut, KB.panLeft, KB.driftUp];

const TRANSITIONS = [
  { type: "crossfade", durationSec: 0.9 },
  { type: "dip-black", durationSec: 0.6 },
  { type: "slide-left", durationSec: 0.8 },
  { type: "crossfade", durationSec: 0.9 },
  { type: "wipe", durationSec: 0.9 },
  { type: "crossfade", durationSec: 0.9 },
  { type: "zoom", durationSec: 0.8 },
  { type: "dip-black", durationSec: 0.7 },
];

/* --------------------------- house style ------------------------- */

// Strip em/en dashes from user-visible copy and warn on sentence colons.
const warnings = [];
function clean(s, where) {
  if (s == null) return s;
  let out = String(s).replace(/\s*[—–]\s*/g, ", ");
  if (/[—–]/.test(out)) warnings.push(`dash left in ${where}: ${out}`);
  // crude sentence-colon check: a colon with a space after and a lowercase
  // word, not a time or a "Place: Publisher" citation.
  if (/[a-z]\s*:\s+[a-z]/.test(out)) warnings.push(`possible sentence colon in ${where}: ${out}`);
  return out;
}

// Overlay copy never uses a label colon. Turn "Source: X" into "Source. X"
// and any other "label: value" into "label, value", then run clean().
function ovText(s, where) {
  if (s == null) return s;
  let out = String(s)
    .replace(/^\s*(Sources?)\s*:\s*/i, "$1. ")
    .replace(/:\s+/g, ", ");
  return clean(out, where);
}

// Period images (public domain, or dated before 1945) get the archival
// grade. Modern Creative Commons photos stay neutral so they do not read
// as fake-aged. Returns the SegmentFilter or null.
function gradeForImage(id, oldest) {
  const c = credits[id] || {};
  const year = (c.date || "").match(/\b(1[5-9]\d\d|20\d\d)\b/);
  const period = /public domain/i.test(c.license || "") || (year && +year[1] < 1945);
  if (!period) return null;
  return oldest ? MONO : ARCHIVAL;
}

/* ------------------------- chapter layout ------------------------ */

// Per chapter: the non-image shots and where the look-around lives.
// images are pulled from the credits manifest by id prefix.
const PLAN = {
  intro: { openHost: "host-intro", inVideoPano: "pano-hyde-park", present: true, grade: ARCHIVAL },
  land: { grade: ARCHIVAL, oldest: true },
  redlining: { grade: ARCHIVAL },
  formation: { present: true, grade: ARCHIVAL, oldest: true },
  "worlds-fair": { stopPano: "pano-jackson-park", grade: ARCHIVAL },
  university: { stopPano: "pano-main-quad", grade: ARCHIVAL },
  "color-line": { stopPano: null, grade: ARCHIVAL },
  "urban-renewal": { stopPano: "pano-55th-street", grade: ARCHIVAL },
  present: { closeHost: "host-close", inVideoPano: "pano-obama-center", present: true },
};

// Geo for the depth rail / map markers (approximate, real coordinates).
const GEO = {
  intro: { lat: 41.7943, lng: -87.5907, kicker: "Today / 57th Street", depth: "Street level" },
  land: { lat: 41.8000, lng: -87.5850, kicker: "Before 1853 / The lakefront", depth: "The land" },
  redlining: { lat: 41.7886, lng: -87.5987, kicker: "1930s / The campus", depth: "Redlining" },
  formation: { lat: 41.8005, lng: -87.5905, kicker: "1853 / Lakefront", depth: "Founding" },
  "worlds-fair": { lat: 41.7903, lng: -87.5829, kicker: "1893 / Jackson Park", depth: "The fair" },
  university: { lat: 41.7886, lng: -87.5987, kicker: "1890 / Main Quadrangles", depth: "The university" },
  "color-line": { lat: 41.8027, lng: -87.5953, kicker: "1920s / Hyde Park and Kenwood", depth: "The color line" },
  "urban-renewal": { lat: 41.7995, lng: -87.5934, kicker: "1958 / 55th Street", depth: "Urban renewal" },
  present: { lat: 41.7843, lng: -87.5872, kicker: "Today / Jackson Park", depth: "Now" },
};

const PANO_LABEL = {
  "pano-hyde-park": "57th Street and the lakefront, today",
  "pano-jackson-park": "Jackson Park today, where the fair stood",
  "pano-main-quad": "The Main Quadrangles today",
  "pano-55th-street": "55th Street today, rebuilt ground",
  "pano-obama-center": "Jackson Park today, the Obama Center site",
};

const PLACEHOLDER_NOTE =
  "Placeholder capture. A labeled slate stands in until the owner uploads real 360 footage of this spot.";

/* ------------------------- subtitle timing ----------------------- */

function subtitleCues(lines, dur, idPrefix) {
  const clamped = (lines || []).map((l) => clean(l, `subtitle ${idPrefix}`)).filter(Boolean);
  if (clamped.length === 0 || dur <= 0) return [];
  const weights = clamped.map((l) => Math.max(6, l.length));
  const tot = weights.reduce((a, b) => a + b, 0);
  const span = Math.max(0, dur - 0.3);
  let cursor = 0.15;
  return clamped.map((text, i) => {
    const len = (weights[i] / tot) * span;
    const startSec = Math.round(cursor * 10) / 10;
    const endSec = Math.round((cursor + Math.max(1.1, len)) * 10) / 10;
    cursor += len;
    return { id: `${idPrefix}-c${i + 1}`, startSec, endSec, text };
  });
}

/* ----------------------------- assets ---------------------------- */

function imgAsset(id) {
  return { url: credits[id].file, kind: "image", is360: false, poster: null };
}
function slateAsset(id, is360) {
  return {
    url: `/media/hyde-park/slates/${id}.jpg`,
    kind: "image",
    is360: !!is360,
    poster: is360 ? `/media/hyde-park/slates/${id}.jpg` : null,
  };
}
function voAsset(id) {
  return { url: `/media/hyde-park/vo/${id}.mp3`, kind: "audio", is360: false, poster: null };
}

function artistShort(raw) {
  let a = clean(raw || "Unknown", "artist");
  a = a
    .replace(/\(\d{3,4}[-–]\d{0,4}\)/g, "")
    .replace(/,?\s*\d{3,4}[-–]\d{0,4},?/g, " ")
    .replace(/,?\s*(photographer|publisher|artist|painter|lithographer|compiling.*)\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*,\s*$/, "")
    .replace(/^,\s*/, "")
    .trim();
  return a || "Unknown";
}
function licShort(c) {
  return (c.license || "Public domain").replace(/\s*:.*$/, "");
}
function creditLine(id) {
  const c = credits[id];
  if (!c) return null;
  const who = artistShort(c.artist).slice(0, 44);
  const yr = (c.date || "").match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return `Source. ${who}${yr ? ", " + yr[1] : ""}. ${licShort(c)}.`;
}
function imageSourceLine(id) {
  const c = credits[id];
  if (!c) return null;
  const title = (c.commonsTitle || "")
    .replace(/^File:/, "")
    .replace(/\.(jpg|jpeg|png|tiff)$/i, "");
  return clean(`Image. ${title}, by ${artistShort(c.artist)}. ${licShort(c)}, Wikimedia Commons.`, `imgsrc ${id}`);
}

/* ------------------------- build one chapter --------------------- */

function imagesFor(id) {
  return Object.keys(credits)
    .filter((k) => k === id || k.startsWith(id + "-"))
    .sort((a, b) => {
      const na = parseInt(a.split("-").pop(), 10);
      const nb = parseInt(b.split("-").pop(), 10);
      return (Number.isNaN(na) ? 0 : na) - (Number.isNaN(nb) ? 0 : nb);
    });
}

function buildChapter(ch) {
  const id = ch.chapterId;
  const plan = PLAN[id] || {};
  const geo = GEO[id];
  const sc = ch.script || {};
  const vfy = ch.verify || {};
  const voId = `vo-${id}`;
  const dur = durations[voId] || Math.max(8, (sc.voiceover || "").split(/\s+/).length / 2.7);

  // Build the ordered shot list.
  const shots = [];
  if (plan.openHost) shots.push({ kind: "slate2d", ref: plan.openHost, weight: 1.4 });
  if (plan.inVideoPano && id === "intro")
    shots.push({ kind: "pano", ref: plan.inVideoPano, weight: 1.8 });
  for (const imgId of imagesFor(id))
    shots.push({ kind: "image", ref: imgId, weight: 1 });
  if (plan.present) shots.push({ kind: "present", ref: `present-${id}`, weight: 1.1 });
  if (plan.inVideoPano && id === "present")
    shots.push({ kind: "pano", ref: plan.inVideoPano, weight: 1.8 });
  if (plan.closeHost) shots.push({ kind: "slate2d", ref: plan.closeHost, weight: 1.6 });

  if (shots.length === 0) shots.push({ kind: "present", ref: "present-broll", weight: 1 });

  // Distribute the voiceover length (plus a small tail) across shots.
  const tail = 1.2;
  const totalWeight = shots.reduce((a, s) => a + s.weight, 0);
  const budget = dur + tail;
  shots.forEach((s) => {
    let len = (budget * s.weight) / totalWeight;
    len = Math.max(s.kind === "pano" ? 7 : 3.6, Math.min(s.kind === "pano" ? 13 : 8.5, len));
    s.len = Math.round(len * 10) / 10;
  });

  // Guarantee the timeline outlasts the voiceover. Per-shot caps plus a
  // small shot count can otherwise end a chapter before its narration.
  // Transitions overlap, so the live total is sum(len) minus overlaps;
  // scale every shot up uniformly until that clears the VO length.
  const overlapOf = (i) => {
    if (i === 0) return 0;
    const tr = TRANSITIONS[(i - 1) % TRANSITIONS.length];
    return tr.type === "dip-black" ? 0 : Math.min(tr.durationSec, 3);
  };
  const sumOverlap = shots.reduce((a, _s, i) => a + overlapOf(i), 0);
  const sumLen = shots.reduce((a, s) => a + s.len, 0);
  const need = dur + 0.8;
  if (sumLen - sumOverlap < need) {
    const scale = (need + sumOverlap) / sumLen;
    shots.forEach((s) => (s.len = Math.round(s.len * scale * 10) / 10));
  }

  // Assemble segments, assets, overlays.
  const assets = {};
  assets[voId] = voAsset(voId);
  const segments = [];
  const usedOverlayTexts = new Set();

  // chapter title + data callouts come from the script overlays
  const titleOverlay = (sc.overlays || []).find((o) => o.kind === "title" || o.role === "chapter-title");
  const dataCallouts = (sc.overlays || []).filter(
    (o) => /data/.test(o.role || "") || (o.kind === "lower-third" && o !== titleOverlay)
  );

  shots.forEach((s, i) => {
    const segId = `${id}-s${i + 1}`;
    const first = i === 0;
    let mode = "2d";
    let filter = null;
    let kenBurns = null;
    let panoMotion = null;
    const overlays = [];

    if (s.kind === "image") {
      assets[s.ref] = imgAsset(s.ref);
      filter = gradeForImage(s.ref, plan.oldest && i < 1);
      kenBurns = KB_CYCLE[i % KB_CYCLE.length];
      const credit = creditLine(s.ref);
      if (credit)
        overlays.push({
          kind: "caption", text: credit, startSec: 0.6,
          endSec: Math.min(s.len - 0.4, 4.2), position: "upper",
          style: { size: "sm", color: "cream", background: true }, anim: "fade",
        });
    } else if (s.kind === "pano") {
      assets[s.ref] = slateAsset(s.ref, true);
      mode = "pano360";
      panoMotion = { fromYawDeg: -35, toYawDeg: 75 };
      overlays.push({
        kind: "lower-third", text: PANO_LABEL[s.ref] || "Look around", startSec: 1,
        endSec: Math.min(s.len - 0.5, 5), position: "lower",
        style: { size: "md", color: "cream", background: true }, anim: "slide-up",
      });
    } else if (s.kind === "present") {
      // distinct clipId per chapter, all showing the one present-day slate
      // until the owner swaps in chapter-specific footage
      assets[s.ref] = { url: "/media/hyde-park/slates/present-broll.jpg", kind: "image", is360: false, poster: null };
      filter = WARM;
      kenBurns = KB.pushIn;
    } else {
      // host slate
      assets[s.ref] = slateAsset(s.ref, false);
      kenBurns = KB.pushIn;
    }

    // chapter title on the first shot
    if (first && titleOverlay) {
      overlays.unshift({
        kind: "title", text: ovText(titleOverlay.text, `title ${id}`),
        startSec: 0.5, endSec: 3.8, position: "center",
        style: { size: "lg", color: "cream", background: false }, anim: "slide-up",
      });
    }
    // a data callout on a middle image shot
    if (s.kind === "image" && dataCallouts.length && i >= 1) {
      const cb = dataCallouts.shift();
      const txt = ovText(cb.text, `callout ${id}`);
      if (txt && !usedOverlayTexts.has(txt)) {
        usedOverlayTexts.add(txt);
        overlays.push({
          kind: "lower-third", text: txt, startSec: Math.min(2, s.len * 0.3),
          endSec: Math.max(3, s.len - 0.4), position: "lower",
          style: { size: "md", color: "rust", background: true }, anim: "slide-up",
        });
      }
    }

    segments.push({
      id: segId,
      clipId: s.ref,
      mode,
      inSec: 0,
      outSec: s.len,
      transitionIn: first ? { type: "cut", durationSec: 0 } : TRANSITIONS[(i - 1) % TRANSITIONS.length],
      ...(kenBurns ? { kenBurns } : {}),
      ...(panoMotion ? { panoMotion } : {}),
      ...(overlays.length ? { overlays } : {}),
      muted: true,
    });
  });

  const sequence = {
    version: 1,
    title: clean(ch.working, `seq-title ${id}`),
    notes: clean(sc.shotNotes || "", `notes ${id}`),
    aspect: "16:9",
    voiceover: { clipId: voId, volume: 1, fadeInSec: 0.4, fadeOutSec: 0.8, loop: false, offsetSec: 0, muted: false },
    subtitles: subtitleCues(sc.lines, dur, id),
    segments,
    assets,
  };

  // Facts and sources from the verified pass.
  const facts = (vfy.verifiedFacts || []).slice(0, 5).map((f) => clean(f, `fact ${id}`));
  const baseSources = Array.from(
    new Set([...(vfy.sources || []), ...((ch.research && ch.research.sources) || [])])
  )
    .slice(0, 5)
    .map((s) => clean(s, `source ${id}`));
  const imgSources = imagesFor(id).map(imageSourceLine).filter(Boolean);
  const sources = [...baseSources, ...imgSources];

  const stop = {
    id,
    title: clean(ch.working, `stop-title ${id}`),
    kicker: geo.kicker,
    depthLabel: geo.depth,
    lat: geo.lat,
    lng: geo.lng,
    body: clean(sc.voiceover, `body ${id}`),
    facts,
    sources,
    media: plan.stopPano
      ? {
          kind: "photo360",
          src: `/media/hyde-park/slates/${plan.stopPano}.jpg`,
          poster: `/media/hyde-park/slates/${plan.stopPano}.jpg`,
          initialYawDeg: 0,
          note: PLACEHOLDER_NOTE,
        }
      : null,
    sequence,
  };
  return { stop, ch, shots, dur };
}

/* ------------------------------ tour ----------------------------- */

const built = research.map(buildChapter);

const TOUR = {
  city: "chicago",
  slug: "hyde-park",
  title: "Hyde Park, Built and Rebuilt",
  dek: clean(
    "A South Side neighborhood that powerful institutions kept reshaping. From Paul Cornell's 1853 lakefront subdivision through the 1893 World's Fair, the founding of the University of Chicago, and the urban renewal the university drove in the 1950s, this route follows the history that kept moving the ground under Hyde Park's residents.",
    "dek"
  ),
  medium: "street",
  heroNote: clean(
    "The host clips and the look-around scenes are labeled placeholders the owner will film and replace. The archival images are public-domain originals, credited on screen. The narration is a scratch machine voiceover that will be replaced with a recorded read.",
    "heroNote"
  ),
  published: true,
  stops: built.map((b) => b.stop),
};

/* ----------------------------- emit TS --------------------------- */

const tsPath = path.join(ROOT, "src/lib/immersive/tours/hyde-park.ts");
const ts =
  `import type { ImmersiveTour } from "../types";\n\n` +
  `/* ------------------------------------------------------------------ */\n` +
  `/*  Hyde Park, Built and Rebuilt.                                      */\n` +
  `/*                                                                     */\n` +
  `/*  Generated by scripts/hp-build-tour.mjs from verified, web-sourced  */\n` +
  `/*  research, public-domain archival images (credited on screen), and  */\n` +
  `/*  a scratch machine voiceover. Host clips and 360 look-arounds are    */\n` +
  `/*  labeled placeholder slates until real footage is uploaded. Re-run   */\n` +
  `/*  the builder to regenerate. Keep in sync with the 007 SQL seed.      */\n` +
  `/* ------------------------------------------------------------------ */\n\n` +
  `export const HYDE_PARK_TOUR: ImmersiveTour = ${JSON.stringify(TOUR, null, 2)};\n`;
writeFileSync(tsPath, ts);

/* ----------------------------- emit SQL -------------------------- */

const stopsJson = JSON.stringify(TOUR.stops).replace(/'/g, "''");
const esc = (s) => s.replace(/'/g, "''");
const sql =
  `-- ============================================================\n` +
  `-- 007: Hyde Park, Built and Rebuilt (Chicago, street-level hybrid)\n` +
  `-- Mirrors HYDE_PARK_TOUR in src/lib/immersive/tours/hyde-park.ts.\n` +
  `-- Generated by scripts/hp-build-tour.mjs. Keep both in sync by slug.\n` +
  `-- ============================================================\n\n` +
  `INSERT INTO immersive_tours (city, slug, title, dek, medium, hero_note, published, stops)\nVALUES (\n` +
  `  'chicago',\n  'hyde-park',\n  '${esc(TOUR.title)}',\n  '${esc(TOUR.dek)}',\n  'street',\n` +
  `  '${esc(TOUR.heroNote)}',\n  true,\n  '${stopsJson}'::jsonb\n)\n` +
  `ON CONFLICT (city, slug) DO UPDATE\n` +
  `  SET title = EXCLUDED.title, dek = EXCLUDED.dek, medium = EXCLUDED.medium,\n` +
  `      hero_note = EXCLUDED.hero_note, published = EXCLUDED.published, stops = EXCLUDED.stops;\n`;
writeFileSync(path.join(ROOT, "supabase/migrations/007_hyde_park_tour.sql"), sql);

/* --------------------------- emit doc ---------------------------- */

let doc = `# Hyde Park tour, production shot list\n\n`;
doc += `This tour is live at \`/tours/chicago/hyde-park\` with placeholder footage so it plays end to end. `;
doc += `Everything below is what you film and swap in. The archival stills are real public-domain images and stay. `;
doc += `The narration is a scratch machine voice you replace with a recorded read of the same script.\n\n`;
doc += `## How to replace a clip\n\n`;
doc += `Upload your footage in \`/admin/studio\` or \`/admin/immersive\`, then point the matching \`clipId\` (for video) or stop \`media.src\` (for 360) at the new file. The file ids are listed per chapter.\n\n`;
let totalDur = 0;
for (const b of built) {
  const id = b.stop.id;
  const sc = b.ch.script || {};
  totalDur += b.dur;
  doc += `## ${b.stop.title}  (${b.ch.era})\n\n`;
  doc += `Scratch VO length about ${b.dur}s. clipId \`vo-${id}\`.\n\n`;
  if (sc.hostScript && sc.hostScript.trim()) {
    doc += `**Host on camera (say this):** ${clean(sc.hostScript, "host " + id)}\n\n`;
  }
  doc += `**Voiceover script to record:**\n\n> ${clean(sc.voiceover, "vo " + id)}\n\n`;
  if (sc.shotNotes && sc.shotNotes.trim()) doc += `**Shot notes:** ${clean(sc.shotNotes, "notes " + id)}\n\n`;
  const films = b.shots.filter((s) => s.kind !== "image");
  if (films.length) {
    doc += `**Placeholders to replace in this chapter:**\n\n`;
    for (const s of films) {
      if (s.kind === "pano" || (b.stop.media && false))
        doc += `- 360 look-around \`${s.ref}\`. ${PANO_LABEL[s.ref] || ""}\n`;
      else if (s.kind === "present") doc += `- Present-day clip \`${s.ref}\`. See shot notes for the exact location.\n`;
      else doc += `- Host clip \`${s.ref}\`.\n`;
    }
    doc += `\n`;
  }
  if (b.stop.media)
    doc += `- 360 look-around module on this stop, \`${path.basename(b.stop.media.src, ".jpg")}\`. ${PANO_LABEL[path.basename(b.stop.media.src, ".jpg")] || ""}\n\n`;
  const imgs = imagesFor(id);
  if (imgs.length) {
    doc += `**Archival stills used (real, public domain, stay as is):**\n\n`;
    for (const im of imgs) {
      const c = credits[im];
      doc += `- ${c.commonsTitle.replace(/^File:/, "")} (${c.license}, ${c.artist}). [source](${c.descriptionUrl})\n`;
    }
    doc += `\n`;
  }
}
doc = `${doc}\n---\n\nTotal scratch voiceover across ${built.length} chapters is about ${Math.round(totalDur)}s.\n`;
writeFileSync(path.join(ROOT, "docs/HYDE-PARK-TOUR-PRODUCTION.md"), doc);

/* ---------------------------- report ----------------------------- */

console.log(`Built ${built.length} chapters.`);
console.log(`Total scratch VO: ${Math.round(totalDur)}s (~${(totalDur / 60).toFixed(1)} min)`);
for (const b of built)
  console.log(`  ${b.stop.id.padEnd(14)} vo ${String(b.dur).padStart(5)}s  shots ${b.shots.length}  imgs ${imagesFor(b.stop.id).length}`);
console.log(`Wrote ${path.relative(ROOT, tsPath)}`);
if (warnings.length) {
  console.log(`\nSTYLE WARNINGS (${warnings.length}):`);
  for (const w of warnings.slice(0, 40)) console.log("  ! " + w);
}
