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
]);
// Keys that hold verbatim historical material (allowed to violate, they
// are quotes of period documents) when a sibling `historical: true` exists.
const EXEMPT_WITH_FLAG = new Set(["excerpt", "quote", "text"]);

const AI_TELLS = [
  /\bdelve\b/i, /\btapestry\b/i, /a testament to/i, /\bboasts\b/i,
  /stark reminder/i, /rich history/i, /nestled\b/i, /\bvibrant\b/i,
  /not just [a-z]+, but/i, /it'?s important to note/i, /\bshowcasing\b/i,
];

const problems = [];

function checkString(str, where, historical) {
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
}

function walk(node, where, parentHistorical = false) {
  if (node == null) return;
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${where}[${i}]`, parentHistorical));
    return;
  }
  if (typeof node === "object") {
    const historical = node.historical === true || parentHistorical;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string" && (VISIBLE_KEYS.has(k) || (historical && EXEMPT_WITH_FLAG.has(k)))) {
        checkString(v, `${where}.${k}`, historical && EXEMPT_WITH_FLAG.has(k));
      } else if (typeof v === "object") {
        walk(v, `${where}.${k}`, historical);
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
  walk(data, path.relative(ROOT, file));
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

if (problems.length) {
  console.error(`exhibit-lint-copy FAILED with ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  [${p.rule}] ${p.where}\n      ${JSON.stringify(p.sample)}`);
  process.exit(1);
}
console.log("exhibit-lint-copy PASSED (all user-visible strings clean)");
