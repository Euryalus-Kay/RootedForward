#!/usr/bin/env node
// ------------------------------------------------------------------
// Exhibit copy linter, the style half of the exhibit's hard gate.
// Scans every user-visible string in data/exhibit/*.json (and, with
// --src, string literals in src/components/exhibit + src/lib/exhibit)
// for the site's hard style rules:
//   1. no em-dashes anywhere in user-visible text
//   2. no colons inside sentences or in titles/headings
//      (URLs, "9:30" times, and objects flagged historical:true are exempt)
//   3. a small AI-tell phrase list
//   4. straight apostrophes (U+0027) are an ERROR in the visitor strings
//      of data/exhibit/ground-copy.json and data/exhibit/ledger.json
//      (ids, code fields, and other files are exempt); use U+2019
// Tell-pattern rules run as WARNINGS (printed, never fail the gate):
//   W1. negative parallelism ("not x; it y", "did not stop")
//   W2. paired anaphora ("each one ..., each one ...")
//   W3. the "N X, M Y" numeric heading formula in title/heading/kicker
// The scan already covers every data/exhibit/*.json file, so ledger.json
// and cases.json are gated; shortLabel is a visible key.
// Exit 1 on any error. Used standalone and from exhibit-audit-facts.mjs.
// ------------------------------------------------------------------
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data/exhibit");
const PUB_DIR = path.join(ROOT, "public/exhibit-data");

// Fields whose values are user-visible copy. Anything else (ids, urls,
// locators, notes, source titles) is exempt.
const VISIBLE_KEYS = new Set([
  "text", "display", "label", "title", "kicker", "blurb", "dek", "heading",
  "body", "caption", "question", "prompt", "answer", "line", "stampText",
  "excerptShown", "shortLabel", "buttonLabel", "aria", "era", "name",
  // R9 ground-copy.json fields
  "years", "mapCaption", "howTo", "colophonLine",
  // R10: screen-reader resolved-state sentences are visitor copy too
  "sr",
]);
// Keys that hold verbatim historical material (allowed to violate, they
// are quotes of period documents) when a sibling `historical: true` exists.
const EXEMPT_WITH_FLAG = new Set(["excerpt", "quote", "text"]);

// Heading-register keys checked against the numeric-pair formula (W3).
const HEADING_KEYS = new Set(["title", "heading", "kicker"]);

// Files whose visitor strings must use typographic apostrophes (U+2019).
const APOSTROPHE_FILES = new Set(["ground-copy.json", "ledger.json"]);

const AI_TELLS = [
  /\bdelve\b/i, /\btapestry\b/i, /a testament to/i, /\bboasts\b/i,
  /stark reminder/i, /rich history/i, /nestled\b/i, /\bvibrant\b/i,
  /not just [a-z]+, but/i, /it'?s important to note/i, /\bshowcasing\b/i,
];

// Rhythm-level tell patterns. Warnings, not errors: they flag drafts for
// a human pass without blocking a legitimate sentence.
const TELL_WARNINGS = [
  { rule: "negative-parallelism", re: /\bnot\b[^.;:!?]{0,60};\s*(it|its|they|their|he|she|we|the)\b/i },
  { rule: "negative-parallelism", re: /\bdid not stop\b/i },
  { rule: "paired-anaphora", re: /\b(each one|every one)\b[^.!?]{0,80}\b\1\b/i },
];
// "N X, M Y" heading formula, e.g. "58 bombings, 2 dead"
const HEADING_FORMULA = /\b\d[\d,.]*\s+[a-z]+,\s+\d[\d,.]*\s+[a-z]+/i;

const problems = [];
const warnings = [];

function checkString(str, where, historical, key, fileBase) {
  if (typeof str !== "string" || !str.trim()) return;
  // 1. em-dash (and spaced en-dash used as one)
  if (str.includes("—") || / – /.test(str)) {
    problems.push({ where, rule: "em-dash", sample: str.slice(0, 90) });
  }
  if (historical) return; // period documents keep their own punctuation
  // 2. colons. Allow URLs and clock times; everything else in visible copy fails.
  const stripped = str.replace(/https?:\/\/\S+/g, "").replace(/\b\d{1,2}:\d{2}\b/g, "");
  if (stripped.includes(":")) {
    problems.push({ where, rule: "colon", sample: str.slice(0, 90) });
  }
  // 3. AI tells
  for (const re of AI_TELLS) {
    if (re.test(str)) {
      problems.push({ where, rule: `ai-tell ${re.source}`, sample: str.slice(0, 90) });
    }
  }
  // 4. straight apostrophes in the strict files
  if (fileBase && APOSTROPHE_FILES.has(fileBase) && str.includes("'")) {
    problems.push({ where, rule: "straight-apostrophe (use U+2019)", sample: str.slice(0, 90) });
  }
  // W1/W2. rhythm tells
  for (const { rule, re } of TELL_WARNINGS) {
    if (re.test(str)) {
      warnings.push({ where, rule, sample: str.slice(0, 90) });
    }
  }
  // W3. numeric-pair heading formula
  if (key && HEADING_KEYS.has(key) && HEADING_FORMULA.test(str)) {
    warnings.push({ where, rule: "heading-formula N-X-M-Y", sample: str.slice(0, 90) });
  }
}

function walk(node, where, parentHistorical = false, fileBase = "") {
  if (node == null) return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${where}[${i}]`, parentHistorical, fileBase));
    return;
  }
  if (typeof node === "object") {
    const historical = node.historical === true || parentHistorical;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string" && (VISIBLE_KEYS.has(k) || (historical && EXEMPT_WITH_FLAG.has(k)))) {
        checkString(v, `${where}.${k}`, historical && EXEMPT_WITH_FLAG.has(k), k, fileBase);
      } else if (typeof v === "object") {
        walk(v, `${where}.${k}`, historical, fileBase);
      }
    }
  }
}

function lintJsonFile(file) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    problems.push({ where: file, rule: "invalid-json", sample: e.message.slice(0, 120) });
    return;
  }
  walk(data, path.relative(ROOT, file), false, path.basename(file));
}

// --- data/exhibit + public/exhibit-data JSON ---
for (const dir of [DATA_DIR, PUB_DIR]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".json")) lintJsonFile(path.join(dir, f));
  }
}

// --- optional: string literals in exhibit source (--src) ---
if (process.argv.includes("--src")) {
  const srcDirs = [
    path.join(ROOT, "src/components/exhibit"),
    path.join(ROOT, "src/lib/exhibit"),
  ];
  const walkSrc = (d) => {
    if (!existsSync(d)) return;
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) walkSrc(p);
      else if (/\.(tsx?|mjs)$/.test(f)) {
        const src = readFileSync(p, "utf8");
        // JSX text nodes with an em-dash, and visible-string colons in JSX text
        src.split("\n").forEach((line, i) => {
          if (line.includes("—") && !line.trimStart().startsWith("//")) {
            problems.push({ where: `${path.relative(ROOT, p)}:${i + 1}`, rule: "em-dash", sample: line.trim().slice(0, 90) });
          }
        });
      }
    }
  };
  srcDirs.forEach(walkSrc);
}

// ------------------------------------------------------------------
// R10 arrive-early gate (design/R10/design.md): no camera, frame, or
// dim change may land ON a solemn beat. The memorial (ch4) and the
// press beat (a3-s2) must inherit those fields from their predecessor.
// ------------------------------------------------------------------
{
  const groundCopy = JSON.parse(readFileSync(path.join(ROOT, "data/exhibit/ground-copy.json"), "utf8"));
  const steps = [];
  for (const act of groundCopy.acts) for (const s of act.steps) steps.push(s);
  let stage = { frame: "citywide", cam: "wide", dim: false };
  const resolved = steps.map((s) => {
    if (s.stage) {
      stage = {
        frame: s.stage.frame ?? stage.frame,
        cam: s.stage.cam ?? stage.cam,
        dim: s.stage.dim ?? false,
      };
    }
    return { id: s.id, ...stage };
  });
  const SOLEMN = ["ch4", "a3-s2"];
  for (const id of SOLEMN) {
    const i = resolved.findIndex((r) => r.id === id);
    if (i <= 0) continue;
    const here = resolved[i];
    const before = resolved[i - 1];
    for (const field of ["frame", "cam"]) {
      if (here[field] !== before[field]) {
        problems.push({ where: `ground-copy.json:${id}`, rule: "arrive-early", sample: `${field} changes ${before[field]} -> ${here[field]} ON the solemn beat` });
      }
    }
    if (id === "ch4" && here.dim !== before.dim) {
      problems.push({ where: "ground-copy.json:ch4", rule: "arrive-early", sample: "the dim cut lands ON the memorial" });
    }
  }
}

if (warnings.length) {
  console.log(`exhibit-lint-copy: ${warnings.length} warning(s) (tell patterns, non-blocking)`);
  for (const w of warnings) console.log(`  warn [${w.rule}] ${w.where}\n      ${JSON.stringify(w.sample)}`);
}
if (problems.length) {
  console.error(`exhibit-lint-copy FAILED with ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  [${p.rule}] ${p.where}\n      ${JSON.stringify(p.sample)}`);
  process.exit(1);
}
console.log("exhibit-lint-copy PASSED (all user-visible strings clean)");
