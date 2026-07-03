#!/usr/bin/env node
// ------------------------------------------------------------------
// Exhibit scenario runner. Runs the accumulated registry in
// exhibit-scenarios.mjs against a dev or prod base URL.
//   node scripts/exhibit-verify.mjs                  all scenarios
//   node scripts/exhibit-verify.mjs --only boot,ch0-pause-point
//   node scripts/exhibit-verify.mjs --milestone A1
//   node scripts/exhibit-verify.mjs --tag smoke --base https://rooted-forward.org
// Failure screenshots land in /tmp/exhibit-verify/. Exit 1 on any fail.
// ------------------------------------------------------------------
import { mkdirSync } from "node:fs";
import { BASE, launch, makeT, trackConsoleErrors, waitReady } from "./exhibit-lib.mjs";
import { scenarios } from "./exhibit-scenarios.mjs";

const OUT = "/tmp/exhibit-verify";
mkdirSync(OUT, { recursive: true });

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}
const only = arg("only")?.split(",").map((s) => s.trim());
const milestone = arg("milestone");
const tag = arg("tag");
const baseOverride = arg("base");
const base = baseOverride || BASE;

let list = scenarios;
if (only) list = list.filter((s) => only.includes(s.id));
if (milestone) list = list.filter((s) => s.milestone === milestone);
if (tag) list = list.filter((s) => s.tags.includes(tag));

if (!list.length) {
  console.error("no scenarios matched the filter");
  process.exit(1);
}

console.log(`exhibit-verify: ${list.length} scenario(s) against ${base}\n`);

const browser = await launch();
const results = [];

for (const scenario of list) {
  const page = await browser.newPage();
  const consoleErrors = trackConsoleErrors(page);
  const t = makeT(scenario.id, results);
  try {
    await page.goto(base + scenario.route, { waitUntil: "networkidle2", timeout: 60000 });
    await scenario.run(page, t, { consoleErrors, waitReady, base });
  } catch (e) {
    results.push({ scenario: scenario.id, name: "scenario threw", pass: false, note: e.message.slice(0, 300) });
    console.log(`  FAIL ${scenario.id} :: scenario threw (${e.message.slice(0, 160)})`);
    try {
      await page.screenshot({ path: `${OUT}/${scenario.id}-fail.png` });
      console.log(`       screenshot ${OUT}/${scenario.id}-fail.png`);
    } catch {
      /* page may be gone */
    }
  } finally {
    await page.close();
  }
}

await browser.close();

const fails = results.filter((r) => !r.pass);
console.log(`\n${results.length - fails.length}/${results.length} checks passed across ${list.length} scenario(s)`);
if (fails.length) {
  console.error(`\nFAILURES (${fails.length}):`);
  for (const f of fails) console.error(`  ${f.scenario} :: ${f.name}${f.note ? ` (${f.note})` : ""}`);
  process.exit(1);
}
console.log("ALL CHECKS PASSED");
