#!/usr/bin/env node
// ------------------------------------------------------------------
// Apply a proofreading pass exported from the app.
//
// The app's beta build (ios/Sources/Beta, switch in BetaEditing.swift)
// writes a Markdown document holding every retyped paragraph, every
// note, and the exact text each change replaces. This reads that
// document, finds each piece of shipped text in the tour source, and
// either reports on it or swaps it.
//
// Nothing is guessed. A change is applied only when its "was" text is
// found exactly once in the file its key points at, so a document that
// has gone stale against a rewritten tour fails loudly instead of
// half-landing.
//
// Usage:
//   node scripts/walk-apply-edits.mjs ~/Downloads/rooted-forward-edits-*.md
//   node scripts/walk-apply-edits.mjs <file> --apply
//
// Keys map to files like this:
//   <slug>/intro/...   the intro component for that walk
//   <slug>/...         src/lib/tours/<slug>-walk.ts
// ------------------------------------------------------------------
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const FILE = process.argv.slice(2).find((a) => !a.startsWith("--"));

if (!FILE) {
  console.error("usage: node scripts/walk-apply-edits.mjs <exported.md> [--apply]");
  process.exit(2);
}
if (!existsSync(FILE)) {
  console.error(`no such file: ${FILE}`);
  process.exit(2);
}

// The intro is a component, not tour data, so it needs naming.
const INTRO_FILES = {
  "hyde-park": "src/components/tours/walk/WalkIntro.tsx",
  harlem: "src/components/tours/walk/HarlemIntro.tsx",
};

/** Which source file a key belongs to. */
function fileFor(key) {
  const [slug, section] = key.split("/");
  if (section === "intro") {
    return INTRO_FILES[slug] ?? null;
  }
  return `src/lib/tours/${slug}-walk.ts`;
}

/** A string as it is written inside a double-quoted TypeScript literal. */
function asLiteral(text) {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

// ------------------------------------------------------------------
// Read the document
// ------------------------------------------------------------------

const raw = readFileSync(FILE, "utf8");

function parseEdits(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  // The document repeats the whole list as JSON at its foot, which is
  // the copy worth trusting; the prose above it is for reading.
  const fences = [...text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)];
  if (!fences.length) {
    throw new Error(
      "no json block found. Export from the app rather than pasting the prose."
    );
  }
  return JSON.parse(fences[fences.length - 1][1]);
}

let parsed;
try {
  parsed = parseEdits(raw);
} catch (err) {
  console.error(`could not read ${FILE}: ${err.message}`);
  process.exit(2);
}

const edits = Array.isArray(parsed) ? parsed : parsed.edits ?? [];
if (!edits.length) {
  console.log("The document holds no edits.");
  process.exit(0);
}

console.log(
  `${path.basename(FILE)}: ${edits.length} entr${edits.length === 1 ? "y" : "ies"}` +
    (parsed.app ? `, from app ${parsed.app}` : "") +
    (parsed.exported ? `, exported ${parsed.exported}` : "")
);
console.log(APPLY ? "Applying." : "Reporting only. Add --apply to write.\n");

// ------------------------------------------------------------------
// Locate every change
// ------------------------------------------------------------------

const changes = edits.filter(
  (e) => typeof e.replacement === "string" && e.replacement !== e.original
);
const notes = edits.filter((e) => e.note && e.note.trim());

/** File contents, read once and written once. */
const buffers = new Map();
function buffer(relative) {
  if (!buffers.has(relative)) {
    const full = path.join(ROOT, relative);
    buffers.set(relative, existsSync(full) ? readFileSync(full, "utf8") : null);
  }
  return buffers.get(relative);
}

let applied = 0;
const problems = [];

for (const edit of changes) {
  const relative = fileFor(edit.key);
  if (!relative) {
    problems.push([edit, "no source file is registered for that walk"]);
    continue;
  }
  let text = buffer(relative);
  if (text == null) {
    problems.push([edit, `${relative} does not exist`]);
    continue;
  }

  const was = asLiteral(edit.original);
  const now = asLiteral(edit.replacement);
  const hits = countOccurrences(text, was);

  if (hits === 0) {
    problems.push([
      edit,
      `the shipped text is not in ${relative} any more, so the document is out of date here`,
    ]);
    continue;
  }
  if (hits > 1) {
    problems.push([edit, `the shipped text appears ${hits} times in ${relative}`]);
    continue;
  }

  console.log(`  ok   ${edit.key}`);
  console.log(`       ${relative}`);
  if (APPLY) {
    buffers.set(relative, text.replace(was, now));
    applied++;
  }
}

if (APPLY && applied) {
  for (const [relative, text] of buffers) {
    if (text == null) continue;
    writeFileSync(path.join(ROOT, relative), text);
  }
  console.log(`\nWrote ${applied} change${applied === 1 ? "" : "s"}.`);
}

// ------------------------------------------------------------------
// What a person still has to do
// ------------------------------------------------------------------

if (problems.length) {
  console.log(`\nCould not place ${problems.length}:`);
  for (const [edit, why] of problems) {
    console.log(`  ${edit.key}`);
    console.log(`    ${why}`);
    console.log(`    was: ${edit.original.slice(0, 90)}${edit.original.length > 90 ? "..." : ""}`);
  }
}

if (notes.length) {
  console.log(`\nNotes to read (${notes.length}):`);
  for (const edit of notes) {
    console.log(`  ${edit.place}, ${edit.field.toLowerCase()}`);
    console.log(`    ${edit.note.replace(/\n/g, "\n    ")}`);
    console.log(`    key: ${edit.key}`);
  }
}

// Narration is recorded from these strings, so a spoken change that is
// applied and not re-recorded leaves the audio saying the old words.
const narration = [
  ...new Set(
    changes
      .filter((e) => e.narrated && e.stopID)
      .map((e) => `${e.slug} ${e.stopID}`)
  ),
];
if (narration.length) {
  console.log(`\nNarration to regenerate (${narration.length} stop(s)):`);
  for (const line of narration) {
    const [slug, stopID] = line.split(" ");
    console.log(
      `  OPENAI_API_KEY=... node scripts/walk-tts.mjs --tour ${slug} --only ${stopID} --patch`
    );
  }
}

process.exit(problems.length ? 1 : 0);
