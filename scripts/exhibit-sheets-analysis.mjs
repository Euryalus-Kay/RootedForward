#!/usr/bin/env node
// ------------------------------------------------------------------
// Corpus analysis of the 576 digitized HOLC area description sheets
// for metropolitan Chicago (data/exhibit-src/ad-data-chicago.json,
// transcribed by Mapping Inequality). Writes the computed findings to
// data/exhibit/sheets-analysis.json. Every number the exhibit shows
// from this analysis must be reproducible by re-running this script;
// the fact registry entries cite it as their locator.
//   node scripts/exhibit-sheets-analysis.mjs
// ------------------------------------------------------------------
import { readFileSync, writeFileSync } from "node:fs";

const raw = JSON.parse(readFileSync("data/exhibit-src/ad-data-chicago.json", "utf8"));

const pct = (v) => {
  const m = String(v ?? "").match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};

const grades = { A: 0, B: 0, C: 0, D: 0 };
const raceParseable = { A: 0, B: 0, C: 0, D: 0 };
const raceRecorded = { A: 0, B: 0, C: 0, D: 0 };
const infilNegro = { A: 0, B: 0, C: 0, D: 0 };
const blighted = { A: 0, B: 0, C: 0, D: 0 };
const funds = {
  A: { ample: 0, limited: 0, other: 0 },
  B: { ample: 0, limited: 0, other: 0 },
  C: { ample: 0, limited: 0, other: 0 },
  D: { ample: 0, limited: 0, other: 0 },
};

for (const a of raw) {
  const g = a.grade;
  if (!(g in grades)) continue;
  grades[g] += 1;

  const p = pct(a.negro_percent);
  if (p !== null) {
    raceParseable[g] += 1;
    if (p > 0) raceRecorded[g] += 1;
  }

  if (/negro|colored/i.test(String(a.infiltration_of ?? ""))) infilNegro[g] += 1;

  if (/blight/i.test(String(a.clarifying_remarks ?? ""))) blighted[g] += 1;

  const mf = String(a.mortagage_funds ?? a.mortgage_funds ?? "").trim().toLowerCase();
  if (mf) {
    if (/ample|good|plenti/.test(mf)) funds[g].ample += 1;
    else if (/limit|none|no |scarce|nil|difficult|lack/.test(mf)) funds[g].limited += 1;
    else funds[g].other += 1;
  }
}

/* two sheets quoted verbatim on the patterns panel; kept here so the
 * analysis records exactly which records carry them */
const byId = new Map(raw.map((a) => [a.area_id, a]));
const a11 = byId.get(1097);
const d106 = byId.get(1635);
const quoteOf = (rec, re) => {
  const m = String(rec?.clarifying_remarks ?? "").match(re);
  return m ? m[0].trim() : null;
};

const out = {
  generatedBy: "scripts/exhibit-sheets-analysis.mjs",
  source:
    "HOLC area description sheets for metropolitan Chicago, surveyed 1939 to 1940, transcribed by Mapping Inequality (University of Richmond Digital Scholarship Lab), 576 digitized sheets",
  sheetsByGrade: grades,
  raceEntryParseableByGrade: raceParseable,
  sheetsRecordingBlackResidentsByGrade: raceRecorded,
  infiltrationNamingNegroOrColoredByGrade: infilNegro,
  blightedInRemarksByGrade: blighted,
  mortgageFundsByGrade: funds,
  quotedSheets: {
    "1097": { label: a11?.label, grade: a11?.grade, quote: quoteOf(a11, /[^.]*restricted against[^.]*\./i) },
    "1635": { label: d106?.label, grade: d106?.grade, quote: quoteOf(d106, /[^.]*not restricted[^.]*\./i) },
  },
};

writeFileSync("data/exhibit/sheets-analysis.json", JSON.stringify(out, null, 2) + "\n");
console.log("sheets-analysis written:");
console.log(JSON.stringify(out, null, 1));
