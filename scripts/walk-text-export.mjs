#!/usr/bin/env node
// ------------------------------------------------------------------
// Write a walk's words out as one Markdown file that an editor, human
// or AI, can rewrite and hand back. scripts/walk-text-import.mjs
// reads the same file and puts the words back into the TypeScript.
//
// Only what a walker reads or hears goes out: the tour title and dek,
// the introduction, the practical cards, and for every stop its title,
// dek, map label, where to stand, narration, red plates and the
// directions to the next stop. Captions, credits and the source lists
// stay in the code, because they carry rights statements that should
// not be edited casually.
//
// Usage:
//   node scripts/walk-text-export.mjs --tour west-harlem
//   node scripts/walk-text-export.mjs --tour hyde-park --out some.md
//
// Reads the .ts data straight through Node's type stripping (Node 22+).
// ------------------------------------------------------------------
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

export const TOURS = {
  "hyde-park": {
    data: "src/lib/tours/hyde-park-walk.ts",
    tourExport: "HYDE_PARK_WALK",
    intro: "src/components/tours/walk/WalkIntro.tsx",
    introExport: "WALK_INTRO",
    out: "docs/tour-text/hyde-park-walk.md",
  },
  harlem: {
    data: "src/lib/tours/harlem-walk.ts",
    tourExport: "HARLEM_WALK",
    intro: "src/components/tours/walk/HarlemIntro.tsx",
    introExport: "HARLEM_INTRO",
    out: "docs/tour-text/harlem-walk.md",
  },
  "west-harlem": {
    data: "src/lib/tours/west-harlem-walk.ts",
    tourExport: "WEST_HARLEM_WALK",
    intro: "src/components/tours/walk/WestHarlemIntro.tsx",
    introExport: "WEST_HARLEM_INTRO",
    out: "docs/tour-text/west-harlem-walk.md",
  },
};

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

/** the intro lives in a .tsx file with no JSX in it; Node will not
 *  load that extension, so it is copied to a temporary .mjs first */
export async function loadWalk(cfg) {
  const tourMod = await import(pathToFileURL(path.resolve(cfg.data)).href);
  const tour = tourMod[cfg.tourExport];
  const tmp = path.join(tmpdir(), `walk-intro-${Date.now()}.mjs`);
  writeFileSync(tmp, readFileSync(cfg.intro, "utf8"));
  const introMod = await import(pathToFileURL(tmp).href);
  const intro = introMod[cfg.introExport];
  return { tour, intro };
}

export function render(slug, tour, intro) {
  const L = [];
  const field = (label, value) => L.push(`**${label}:** ${value}`);
  L.push(`# ${tour.title}`);
  L.push("");
  L.push(
    `> Working text for the walk at /tours/${slug}-walk. Everything in this file is something a walker reads on the page or hears in the narration. Edit the words freely. Keep every heading, every bold label and every stop id in the headings exactly as they are, because they are how the edits get back into the site. Bold stays as **bold**. House rules for the words: no em-dashes, no colons inside a sentence, no colons in titles, real facts only, nothing invented. Photograph captions, credits and the source lists are not in this file. Blank lines separate paragraphs; one paragraph of narration is one spoken paragraph.`
  );
  L.push("");
  L.push("## Tour");
  L.push("");
  field("Title", tour.title);
  field("Dek", tour.dek);
  field("Start", tour.startLabel);
  L.push("");
  L.push("## Why this tour");
  L.push("");
  field("Title", intro.title);
  L.push("");
  for (const p of intro.paragraphs) {
    L.push(p);
    L.push("");
  }
  field("Byline", intro.byline);
  L.push("");
  L.push("## Good to know");
  L.push("");
  for (const card of tour.practical) {
    L.push(`### ${card.title}`);
    L.push("");
    L.push(card.text);
    L.push("");
  }
  const stops = tour.stops;
  stops.forEach((stop, i) => {
    L.push(`## Stop ${stop.number} (${stop.id})`);
    L.push("");
    field("Title", stop.title);
    field("Dek", stop.dek);
    field("Map label", stop.mapLabel);
    if (stop.lookFor) field("Where to stand", stop.lookFor);
    L.push("");
    L.push("### Narration");
    L.push("");
    for (const p of stop.transcript) {
      L.push(p);
      L.push("");
    }
    L.push("### Red plates");
    L.push("");
    const plates = stop.interrupts ?? [];
    if (!plates.length) {
      L.push("(none)");
      L.push("");
    }
    for (const plate of plates) {
      L.push(`#### ${plate.title}`);
      L.push("");
      for (const p of plate.body) {
        L.push(p);
        L.push("");
      }
    }
    if (stop.toNext) {
      const next = stops[i + 1];
      L.push(`### Directions to stop ${next ? next.number : stop.number + 1}`);
      L.push("");
      L.push(stop.toNext.text);
      L.push("");
    }
  });
  return L.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const slug = arg("tour", "west-harlem");
  const cfg = TOURS[slug];
  if (!cfg) {
    console.error(`unknown tour ${slug}; one of ${Object.keys(TOURS).join(", ")}`);
    process.exit(1);
  }
  const out = arg("out", cfg.out);
  const { tour, intro } = await loadWalk(cfg);
  const md = render(slug, tour, intro);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, md);
  console.log(`${out}  ${tour.stops.length} stops, ${md.split(/\s+/).length} words`);
}
