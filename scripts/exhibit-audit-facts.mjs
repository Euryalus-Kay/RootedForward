#!/usr/bin/env node
// ------------------------------------------------------------------
// Exhibit fact audit, the provenance half of the hard gate.
// Static invariants (always):
//   A. facts.json integrity: every fact has id/value/display/tier and a
//      source with a title plus at least one of url/locator
//   B. every factRef anywhere in data/exhibit/*.json resolves to a fact
//      (factRef, factRefs, and machines.json evidenceFactRefs;
//      facts-archive.json is retired storage and is skipped)
//   C. claims gate: every factRef in the reader's text (walltext.json)
//      has a factcheck verdict of verified or corrected
//      (narration.json was deleted with the reader rebuild; its facts
//      and claims live on in walltext or in facts-archive.json)
//   D. ledger entries carry factRefs, never independent values; a display
//      override must equal the fact's display
//   E. tier gating: facts with tier "attributed" may only be referenced by
//      components declared attribution-framed in data/exhibit/components.json;
//      never by walltext
//   (the old F, mp3/cue audio integrity, was removed with the reader
//   rebuild; the exhibit no longer plays audio)
//   G. style lint (delegates to exhibit-lint-copy.mjs)
//   H. writes usedBy back into facts.json (unless --no-write)
//   I. bibliography hygiene: the same work must be listed one way only.
//      Sources sharing a normalized title must agree on author and year,
//      and a title that extends another title by the same author is a
//      variant listing (e.g. "Family Properties" vs "Family Properties,
//      Race, Real Estate, ...") and fails.
//   J. no internal filenames (.json/.ts/.tsx/.mjs paths, repo dirs) in
//      visitor-visible citation fields (source title/author/locator/url
//      and secondarySources); notes are exempt.
// Warnings (do not fail): dead facts (empty usedBy), facts missing factcheckId.
// Flags: --stage pre-tts (only A,B,C,G) · --no-write · --quiet
// Exit 1 on any error.
// ------------------------------------------------------------------
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data/exhibit");
const stage = process.argv.includes("--stage")
  ? process.argv[process.argv.indexOf("--stage") + 1]
  : "full";
const noWrite = process.argv.includes("--no-write");

const errors = [];
const warns = [];
const load = (f) => JSON.parse(readFileSync(path.join(DATA, f), "utf8"));

if (!existsSync(path.join(DATA, "facts.json"))) {
  console.error("exhibit-audit: data/exhibit/facts.json missing");
  process.exit(1);
}
const factsDoc = load("facts.json");
const facts = new Map((factsDoc.facts || []).map((f) => [f.id, f]));

// ---- A. registry integrity ----
for (const f of factsDoc.facts || []) {
  if (!f.id) errors.push(`fact missing id: ${JSON.stringify(f).slice(0, 80)}`);
  if (f.value === undefined || f.value === null) errors.push(`fact ${f.id} has no value`);
  if (!f.display) errors.push(`fact ${f.id} has no display string`);
  if (!["documented", "reported", "attributed"].includes(f.tier)) {
    errors.push(`fact ${f.id} has invalid tier "${f.tier}"`);
  }
  const s = f.source;
  if (!s || !s.title || (!s.url && !s.locator)) {
    errors.push(`fact ${f.id} lacks a usable source (title + url|locator)`);
  }
  if (!f.factcheckId) warns.push(`fact ${f.id} has no factcheckId`);
}

// ---- B. factRef resolution across all data files + usedBy collection ----
const usedBy = new Map(); // factId -> Set(where)
function collectRefs(node, where) {
  if (node == null) return;
  if (Array.isArray(node)) return node.forEach((v, i) => collectRefs(v, `${where}[${i}]`));
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "factRef" && typeof v === "string") checkRef(v, where);
      else if ((k === "factRefs" || k === "evidenceFactRefs") && Array.isArray(v)) {
        v.forEach((r) => checkRef(r, where));
      } else collectRefs(v, `${where}.${k}`);
    }
  }
}
function checkRef(id, where) {
  if (!facts.has(id)) errors.push(`unresolved factRef "${id}" at ${where}`);
  else {
    if (!usedBy.has(id)) usedBy.set(id, new Set());
    usedBy.get(id).add(where.split(".")[0]);
  }
}
for (const f of readdirSync(DATA).filter(
  (f) => f.endsWith(".json") && f !== "facts.json" && f !== "facts-archive.json"
)) {
  try {
    collectRefs(JSON.parse(readFileSync(path.join(DATA, f), "utf8")), f);
  } catch (e) {
    errors.push(`${f} is not valid JSON (${e.message.slice(0, 80)})`);
  }
}

// Component-level consumers (the R9 ground scenes reference facts
// straight from TSX through <FactValue id>, <SourceSup factId>, and
// SourceSupGroup factIds arrays), so the usedBy ledger and the dead-
// fact warnings stay truthful for the whole page, not just the data
// files. Ids are only counted when they resolve in the registry.
{
  const SRC_ROOTS = ["src/components/exhibit", "src/lib/exhibit"];
  const ID_PATTERNS = [
    /<FactValue\s+id="([a-z0-9_]+\.[a-z0-9_]+)"/g,
    /factId="([a-z0-9_]+\.[a-z0-9_]+)"/g,
    /factId=\{"([a-z0-9_]+\.[a-z0-9_]+)"\}/g,
    /"([a-z0-9_]+\.[a-z0-9_]+)"/g, // inside factIds={[...]} lines only, filtered below
  ];
  const walkSrc = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const p = path.join(dir, entry);
      if (statSync(p).isDirectory()) {
        walkSrc(p);
        continue;
      }
      if (!/\.(tsx|ts)$/.test(entry)) continue;
      const src = readFileSync(p, "utf8");
      const where = path.relative(process.cwd(), p);
      for (const line of src.split("\n")) {
        const scanWholeLine =
          /<FactValue|factId=|factIds=|factRefs?[:=]/.test(line);
        if (!scanWholeLine) continue;
        for (const re of ID_PATTERNS) {
          re.lastIndex = 0;
          let m;
          while ((m = re.exec(line))) {
            const id = m[1];
            if (facts.has(id)) {
              if (!usedBy.has(id)) usedBy.set(id, new Set());
              usedBy.get(id).add(where);
            }
          }
        }
      }
    }
  };
  SRC_ROOTS.forEach(walkSrc);
}

// ---- C. claims gate for the reader's text ----
let factcheck = { domains: [] };
if (existsSync(path.join(DATA, "factcheck.json"))) factcheck = load("factcheck.json");
const verdictOf = new Map();
for (const d of factcheck.domains || []) {
  for (const c of d.claims || []) if (c.factId) verdictOf.set(c.factId, c.verdict);
}
function gateClaim(where, ref) {
  const v = verdictOf.get(ref);
  if (v === undefined) {
    errors.push(`${where}: factRef ${ref} has no factcheck claim (publication blocked)`);
  } else if (!["verified", "corrected"].includes(v)) {
    errors.push(`${where}: factRef ${ref} verdict "${v}" (publication blocked)`);
  }
}
// walltext.json is the live content spine; every section, context intro,
// opening paragraph, and station intro must carry gated claims
if (existsSync(path.join(DATA, "walltext.json"))) {
  const walltext = load("walltext.json");
  for (const p of walltext.opening?.plainWords || []) {
    for (const ref of p.factRefs || []) gateClaim(`walltext opening ${p.id}`, ref);
  }
  for (const ch of walltext.chapters || []) {
    for (const ref of ch.contextIntro?.factRefs || []) {
      gateClaim(`walltext ${ch.id} contextIntro`, ref);
    }
    for (const s of ch.sections || []) {
      for (const ref of s.factRefs || []) gateClaim(`walltext ${s.id}`, ref);
    }
    for (const [stationId, intro] of Object.entries(ch.stationIntros || {})) {
      for (const ref of intro.factRefs || []) {
        gateClaim(`walltext ${ch.id} stationIntro ${stationId}`, ref);
      }
    }
  }
}
// narration.json (the old audio-tour script) was deleted; if it ever
// reappears in the data dir its claims must be gated again
if (existsSync(path.join(DATA, "narration.json"))) {
  errors.push(
    "narration.json has reappeared in data/exhibit; it was retired and deleted. " +
      "Either remove it or restore its claims gate in this script."
  );
}

// ---- D. ledger integrity ----
if (stage === "full" && existsSync(path.join(DATA, "ledger.json"))) {
  const ledger = load("ledger.json");
  for (const e of ledger.entries || []) {
    if (typeof e.value === "number" || typeof e.amount === "number") {
      errors.push(`ledger entry ${e.entryId} carries an independent numeric value; use factRef`);
    }
    if (e.factRef && e.display && facts.get(e.factRef)?.display !== e.display) {
      errors.push(`ledger entry ${e.entryId} display "${e.display}" != fact display "${facts.get(e.factRef)?.display}"`);
    }
  }
}

// ---- E. tier gating for attributed facts ----
if (stage === "full") {
  const framed = existsSync(path.join(DATA, "components.json"))
    ? new Set(load("components.json").attributionFramed || [])
    : new Set();
  for (const [id, sites] of usedBy) {
    const f = facts.get(id);
    if (f?.tier === "attributed") {
      for (const site of sites) {
        if (site === "walltext.json") {
          errors.push(`attributed fact ${id} used in ${site} (never allowed)`);
        } else if (!framed.has(site)) {
          errors.push(`attributed fact ${id} used by ${site} which is not attribution-framed`);
        }
      }
    }
  }
}

// ---- I. bibliography hygiene: one canonical listing per work ----
// Collects every citation object (primary source plus object-typed
// secondarySources). Within a normalized-title group, author and year
// must agree when the author strings overlap; across groups, a longer
// title that extends a shorter one by an overlapping author is a
// variant listing of the same work.
if (stage === "full") {
  const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const overlaps = (a, b) => a && b && (a.includes(b) || b.includes(a));
  const entries = [];
  for (const f of factsDoc.facts || []) {
    const cites = [f.source, ...(f.secondarySources || []).filter((s) => s && typeof s === "object")];
    for (const s of cites) {
      if (!s?.title) continue;
      entries.push({ factId: f.id, title: s.title, author: s.author ?? "", year: s.year ?? "" });
    }
  }
  const byTitle = new Map();
  for (const e of entries) {
    const k = norm(e.title);
    if (!byTitle.has(k)) byTitle.set(k, []);
    byTitle.get(k).push(e);
  }
  const flagged = new Set();
  for (const [k, group] of byTitle) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i], b = group[j];
        if (norm(a.author) === norm(b.author) && String(a.year) === String(b.year)) continue;
        if (overlaps(norm(a.author), norm(b.author))) {
          const key = `${k}|${norm(a.author)}|${norm(b.author)}|${a.year}|${b.year}`;
          if (!flagged.has(key)) {
            flagged.add(key);
            errors.push(
              `bibliography: "${a.title}" listed two ways ` +
                `(${a.author || "no author"}, ${a.year || "n.d."} in ${a.factId} vs ` +
                `${b.author || "no author"}, ${b.year || "n.d."} in ${b.factId}); pick one canonical listing`
            );
          }
        }
      }
    }
  }
  const titles = [...byTitle.keys()].sort();
  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      if (!titles[j].startsWith(titles[i])) break;
      if (titles[i].length < 14) continue; // short names legitimately prefix longer ones
      const a = byTitle.get(titles[i])[0];
      const b = byTitle.get(titles[j])[0];
      if (overlaps(norm(a.author), norm(b.author))) {
        errors.push(
          `bibliography: "${a.title}" (${a.factId}) and "${b.title}" (${b.factId}) ` +
            `look like variant listings of the same work; use one canonical title`
        );
      }
    }
  }
}

// ---- J. no internal filenames in visitor-visible citation fields ----
{
  const INTERNAL = /\.(json|tsx?|mjs|py)\b|(^|[\s(])(data|src|scripts|public)\//;
  const checkField = (factId, field, value) => {
    if (typeof value === "string" && INTERNAL.test(value)) {
      errors.push(`fact ${factId}: internal file reference leaks in ${field}: ${JSON.stringify(value.slice(0, 80))}`);
    }
  };
  for (const f of factsDoc.facts || []) {
    for (const key of ["title", "author", "locator"]) checkField(f.id, `source.${key}`, f.source?.[key]);
    (f.secondarySources || []).forEach((s, i) => {
      if (typeof s === "string") checkField(f.id, `secondarySources[${i}]`, s);
      else if (s && typeof s === "object") {
        for (const key of ["title", "author", "locator"]) checkField(f.id, `secondarySources[${i}].${key}`, s[key]);
      }
    });
  }
}

// ---- G. style lint ----
try {
  execSync("node scripts/exhibit-lint-copy.mjs", { cwd: ROOT, stdio: "pipe" });
} catch (e) {
  errors.push("exhibit-lint-copy failed:\n" + e.stdout?.toString().slice(0, 2000));
}

// ---- H. usedBy write-back + dead facts ----
for (const f of factsDoc.facts || []) {
  const sites = usedBy.get(f.id);
  f.usedBy = sites ? [...sites].sort() : [];
  if (!sites && stage === "full") warns.push(`fact ${f.id} is unused`);
}
if (!noWrite && !errors.length) {
  writeFileSync(path.join(DATA, "facts.json"), JSON.stringify(factsDoc, null, 2) + "\n");
}

// ---- report ----
if (!process.argv.includes("--quiet")) {
  for (const w of warns) console.log(`  warn: ${w}`);
}
if (errors.length) {
  console.error(`\nexhibit-audit-facts FAILED (stage=${stage}) with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ERROR: ${e}`);
  process.exit(1);
}
console.log(`exhibit-audit-facts PASSED (stage=${stage}, ${facts.size} facts, ${warns.length} warnings)`);
