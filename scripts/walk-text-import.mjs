#!/usr/bin/env node
// ------------------------------------------------------------------
// Put an edited walk text file back into the code. The file is the
// one scripts/walk-text-export.mjs writes; an editor changes the
// words and keeps the headings, labels and stop ids, and this script
// rewrites exactly those strings in the tour's .ts and intro .tsx,
// leaving captions, credits, sources, coordinates and everything
// else untouched.
//
// Usage:
//   node scripts/walk-text-import.mjs --tour west-harlem [--file x.md] [--check]
//
// --check reports what would change and writes nothing. After a real
// import: re-record any stop whose narration changed
// (node scripts/walk-tts.mjs --tour <slug> --only <id,id> --patch),
// run scripts/walk-audio-shrink.mjs, then tsc, lint, build.
// ------------------------------------------------------------------
import { readFileSync, writeFileSync } from "node:fs";
import { TOURS } from "./walk-text-export.mjs";

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def;
}
const slug = arg("tour", "west-harlem");
const cfg = TOURS[slug];
if (!cfg) {
  console.error(`unknown tour ${slug}; one of ${Object.keys(TOURS).join(", ")}`);
  process.exit(1);
}
const file = arg("file", cfg.out);
const CHECK = process.argv.includes("--check");
const warnings = [];
const warn = (m) => warnings.push(m);

/* ---------------- parse the Markdown ---------------- */
const FIELD = /^\*\*(Title|Dek|Start|Byline|Map label|Where to stand):\*\*\s*(.*)$/;
const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");

/** one flat list of blocks per "## " section */
const sections = [];
let cur = null;
let para = [];
let field = null;
const flush = () => {
  if (!cur) return;
  if (field) {
    cur.blocks.push({ type: "field", label: field.label, value: field.parts.join(" ").trim() });
    field = null;
  }
  if (para.length) {
    cur.blocks.push({ type: "para", text: para.join(" ").trim() });
    para = [];
  }
};
for (const raw of lines) {
  const line = raw.replace(/\s+$/, "");
  if (/^# /.test(line) || /^> /.test(line)) continue;
  const h2 = line.match(/^## (.*)$/);
  if (h2) {
    flush();
    cur = { heading: h2[1].trim(), blocks: [] };
    sections.push(cur);
    continue;
  }
  if (!cur) continue;
  const h3 = line.match(/^### (.*)$/);
  const h4 = line.match(/^#### (.*)$/);
  if (h3 || h4) {
    flush();
    cur.blocks.push({ type: h3 ? "h3" : "h4", text: (h3 || h4)[1].trim() });
    continue;
  }
  const f = line.match(FIELD);
  if (f) {
    flush();
    field = { label: f[1], parts: [f[2]] };
    continue;
  }
  if (line.trim() === "") {
    flush();
    continue;
  }
  if (field) field.parts.push(line.trim());
  else para.push(line.trim());
}
flush();

const section = (name) => sections.find((s) => s.heading === name);
const fields = (s) => Object.fromEntries(s.blocks.filter((b) => b.type === "field").map((b) => [b.label, b.value]));
const parasUntilHeading = (blocks, from) => {
  const out = [];
  for (let i = from; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "h3" || b.type === "h4") break;
    if (b.type === "para") out.push(b.text);
  }
  return out;
};

const tourSec = section("Tour");
const introSec = section("Why this tour");
const cardsSec = section("Good to know");
if (!tourSec || !introSec || !cardsSec) {
  console.error("the file needs the sections Tour, Why this tour and Good to know");
  process.exit(1);
}

const tourFields = fields(tourSec);
const introFields = fields(introSec);
const introParas = introSec.blocks.filter((b) => b.type === "para").map((b) => b.text);

const cards = [];
cardsSec.blocks.forEach((b, i) => {
  if (b.type === "h3") cards.push({ title: b.text, text: parasUntilHeading(cardsSec.blocks, i + 1).join(" ") });
});

const stops = [];
for (const s of sections) {
  const m = s.heading.match(/^Stop (\d+) \(([a-z0-9-]+)\)$/);
  if (!m) continue;
  const st = { number: Number(m[1]), id: m[2], fields: fields(s), transcript: [], plates: [], directions: null };
  s.blocks.forEach((b, i) => {
    if (b.type !== "h3") return;
    if (b.text === "Narration") st.transcript = parasUntilHeading(s.blocks, i + 1);
    else if (b.text === "Red plates") {
      for (let j = i + 1; j < s.blocks.length; j++) {
        const c = s.blocks[j];
        if (c.type === "h3") break;
        if (c.type === "h4") st.plates.push({ title: c.text, body: parasUntilHeading(s.blocks, j + 1) });
      }
    } else if (/^Directions/.test(b.text)) st.directions = parasUntilHeading(s.blocks, i + 1).join(" ");
  });
  stops.push(st);
}
if (!stops.length) {
  console.error("no stop sections found; headings must read like '## Stop 1 (furnald-hall)'");
  process.exit(1);
}

/* ---------------- house rules, reported not enforced ---------------- */
const prose = [
  ...Object.values(tourFields), ...introParas, introFields.Byline ?? "",
  ...cards.flatMap((c) => [c.title, c.text]),
  ...stops.flatMap((s) => [...Object.values(s.fields), ...s.transcript, ...s.plates.flatMap((p) => [p.title, ...p.body]), s.directions ?? ""]),
];
for (const t of prose) {
  if (/—|–/.test(t)) warn(`em-dash: ${t.slice(0, 80)}`);
  if (/[a-z\)]: [A-Za-z]/.test(t)) warn(`colon inside a sentence: ${t.slice(0, 80)}`);
}
for (const s of stops) for (const key of ["Title", "Dek"]) if ((s.fields[key] ?? "").includes(":")) warn(`colon in ${s.id} ${key}`);

/* ---------------- rewrite the TypeScript ---------------- */
const J = (s) => JSON.stringify(s);
const STR = `"(?:[^"\\\\]|\\\\.)*"`;
let changes = 0;
function replaceFirst(src, re, build, what) {
  const m = src.match(re);
  if (!m) {
    warn(`could not find ${what}`);
    return src;
  }
  const next = build(m);
  if (next === m[0]) return src;
  changes++;
  return src.slice(0, m.index) + next + src.slice(m.index + m[0].length);
}

let ts = readFileSync(cfg.data, "utf8");
const original = ts;
ts = replaceFirst(ts, new RegExp(`^  title: ${STR},$`, "m"), () => `  title: ${J(tourFields.Title)},`, "tour title");
ts = replaceFirst(ts, new RegExp(`^  dek: ${STR},$`, "m"), () => `  dek: ${J(tourFields.Dek)},`, "tour dek");
if (tourFields.Start) ts = replaceFirst(ts, new RegExp(`^  startLabel: ${STR},$`, "m"), () => `  startLabel: ${J(tourFields.Start)},`, "start label");

// practical cards, by position
{
  const start = ts.indexOf("  practical: [");
  const end = ts.indexOf("\n  ],", start);
  if (start < 0 || end < 0) warn("could not find the practical cards");
  else {
    let block = ts.slice(start, end);
    let i = 0;
    const re = new RegExp(`(\\n {6}title: )(${STR})(,\\n {6}text: )(${STR})`, "g");
    const before = block;
    block = block.replace(re, (all, a, t, b, x) => {
      const card = cards[i++];
      if (!card) return all;
      return `${a}${J(card.title)}${b}${J(card.text)}`;
    });
    if (i !== cards.length) warn(`the code has ${i} practical cards, the file has ${cards.length}; extra ones in the file were ignored`);
    if (block !== before) {
      changes++;
      ts = ts.slice(0, start) + block + ts.slice(end);
    }
  }
}

// stops, by id
for (const st of stops) {
  const marker = `      id: ${J(st.id)},`;
  const start = ts.indexOf(marker);
  if (start < 0) {
    warn(`no stop with id ${st.id} in the code; its section was ignored`);
    continue;
  }
  let end = ts.indexOf("\n    {\n      id: ", start + marker.length);
  if (end < 0) end = ts.indexOf("\n  ],\n};", start);
  let block = ts.slice(start, end);
  const before = block;
  const f = st.fields;
  const one = (label, key, what) => {
    if (f[label] === undefined) return;
    block = replaceFirst(block, new RegExp(`^      ${key}: ${STR},$`, "m"), () => `      ${key}: ${J(f[label])},`, `${what} of ${st.id}`);
  };
  one("Title", "title", "title");
  one("Dek", "dek", "dek");
  one("Map label", "mapLabel", "map label");
  one("Where to stand", "lookFor", "lookFor");
  if (st.transcript.length) {
    const oldCount = (block.match(/^      transcript: \[\n([\s\S]*?)\n      \],$/m) || ["", ""])[1].split("\n").filter((l) => /^ {8}"/.test(l)).length;
    if (oldCount && oldCount !== st.transcript.length) warn(`${st.id}: narration went from ${oldCount} to ${st.transcript.length} paragraphs; check the 'after' positions of its plates and photographs`);
    block = replaceFirst(block, /^      transcript: \[\n[\s\S]*?\n      \],$/m, () => `      transcript: [\n${st.transcript.map((p) => `        ${J(p)},`).join("\n")}\n      ],`, `narration of ${st.id}`);
  }
  const hasPlates = /^      interrupts: \[/m.test(block);
  const afters = hasPlates ? [...block.match(/^      interrupts: \[\n[\s\S]*?\n      \],$/m)[0].matchAll(/^          after: (\d+),$/gm)].map((m) => Number(m[1])) : [];
  const platesSrc = st.plates.length
    ? `      interrupts: [\n${st.plates.map((p, i) => `        {\n          title: ${J(p.title)},\n          body: [\n${p.body.map((b) => `            ${J(b)},`).join("\n")}\n          ],${afters[i] !== undefined ? `\n          after: ${afters[i]},` : ""}\n        },`).join("\n")}\n      ],`
    : null;
  if (hasPlates && platesSrc) block = replaceFirst(block, /^      interrupts: \[\n[\s\S]*?\n      \],$/m, () => platesSrc, `plates of ${st.id}`);
  else if (hasPlates && !platesSrc) {
    warn(`${st.id}: the file has no red plates, so the stop's plates were removed`);
    block = block.replace(/^      interrupts: \[\n[\s\S]*?\n      \],\n/m, "");
    changes++;
  } else if (!hasPlates && platesSrc) {
    const anchor = block.match(/^      (toNext|sources): /m);
    if (anchor) {
      block = block.slice(0, anchor.index) + platesSrc + "\n" + block.slice(anchor.index);
      changes++;
    } else warn(`${st.id}: could not place new plates`);
  }
  if (st.directions) block = replaceFirst(block, new RegExp(`^        text: ${STR},$`, "m"), () => `        text: ${J(st.directions)},`, `directions of ${st.id}`);
  if (block !== before) ts = ts.slice(0, start) + block + ts.slice(end);
}
const codeIds = [...original.matchAll(/^      id: "([a-z0-9-]+)",$/gm)].map((m) => m[1]);
for (const id of codeIds) if (!stops.find((s) => s.id === id)) warn(`the file has no section for stop ${id}; that stop was left as it is`);

// the introduction
let tsx = readFileSync(cfg.intro, "utf8");
const originalTsx = tsx;
if (introFields.Title) tsx = replaceFirst(tsx, new RegExp(`^  title: ${STR},$`, "m"), () => `  title: ${J(introFields.Title)},`, "intro title");
if (introParas.length) tsx = replaceFirst(tsx, /^  paragraphs: \[\n[\s\S]*?\n  \],$/m, () => `  paragraphs: [\n${introParas.map((p) => `    ${J(p)},`).join("\n")}\n  ],`, "intro paragraphs");
if (introFields.Byline) tsx = replaceFirst(tsx, new RegExp(`^  byline:\\n    ${STR},$`, "m"), () => `  byline:\n    ${J(introFields.Byline)},`, "byline");

/* ---------------- report and write ---------------- */
for (const w of warnings) console.log(`note: ${w}`);
const tsChanged = ts !== original;
const tsxChanged = tsx !== originalTsx;
if (!tsChanged && !tsxChanged) {
  console.log("nothing to change; the file matches the code");
  process.exit(0);
}
if (CHECK) {
  console.log(`--check: would rewrite ${[tsChanged && cfg.data, tsxChanged && cfg.intro].filter(Boolean).join(" and ")} (${changes} edits)`);
  process.exit(0);
}
if (tsChanged) writeFileSync(cfg.data, ts);
if (tsxChanged) writeFileSync(cfg.intro, tsx);
console.log(`rewrote ${[tsChanged && cfg.data, tsxChanged && cfg.intro].filter(Boolean).join(" and ")} (${changes} edits). Re-record any stop whose narration changed, then tsc, lint, build.`);
