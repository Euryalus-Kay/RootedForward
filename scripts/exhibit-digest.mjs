#!/usr/bin/env node
// ------------------------------------------------------------------
// Owner review digest for a milestone gate. Assembles the screenshots
// from /tmp/exhibit-shots, the change list since the last gate tag,
// verify results, and open recommendations into one local HTML page.
//   node scripts/exhibit-digest.mjs --milestone A1
// Output: /tmp/exhibit-digest/<milestone>/index.html
// ------------------------------------------------------------------
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SHOTS = "/tmp/exhibit-shots";

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const milestone = arg("milestone", "A1");
const OUT = `/tmp/exhibit-digest/${milestone}`;
mkdirSync(OUT, { recursive: true });

// change list since the previous gate tag (or the exhibit's first commit)
let changes = "";
try {
  const tags = execSync("git tag -l 'exhibit-gate-*'", { cwd: ROOT }).toString().trim().split("\n").filter(Boolean);
  const range = tags.length ? `${tags[tags.length - 1]}..HEAD` : "HEAD~20..HEAD";
  changes = execSync(`git log --oneline ${range} -- src/components/exhibit src/lib/exhibit data/exhibit scripts public/exhibit-data 2>/dev/null || git log --oneline -12`, { cwd: ROOT }).toString().trim();
} catch {
  changes = "(git log unavailable)";
}

// review report if the panel has run for this milestone
let review = null;
const reviewPath = path.join(ROOT, `data/exhibit/reviews/${milestone}.json`);
if (existsSync(reviewPath)) {
  try {
    review = JSON.parse(readFileSync(reviewPath, "utf8"));
  } catch {
    review = null;
  }
}

// copy shots next to the html so the digest is portable
const shots = existsSync(SHOTS) ? readdirSync(SHOTS).filter((f) => f.endsWith(".png")) : [];
for (const f of shots) copyFileSync(path.join(SHOTS, f), path.join(OUT, f));
const states = [...new Set(shots.map((f) => f.replace(/--(desktop|mobile)\.png$/, "")))].sort();

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const shotRows = states
  .map((state) => {
    const d = `${state}--desktop.png`;
    const m = `${state}--mobile.png`;
    return `<section class="state">
      <h3>${esc(state)}</h3>
      <div class="pair">
        ${shots.includes(d) ? `<figure><img src="${d}" loading="lazy"/><figcaption>desktop 1440</figcaption></figure>` : ""}
        ${shots.includes(m) ? `<figure class="mob"><img src="${m}" loading="lazy"/><figcaption>mobile 390</figcaption></figure>` : ""}
      </div>
    </section>`;
  })
  .join("\n");

const punchRows = review?.chair?.punchList?.length
  ? review.chair.punchList
      .map(
        (p) =>
          `<li class="p${p.p}"><span class="sev">P${p.p}</span> <strong>${esc(p.title)}</strong> <em>${esc(p.lens ?? "")}</em> ${esc(p.where ?? "")}<br/>${esc(p.fix ?? "")}</li>`
      )
      .join("\n")
  : "<li>No panel run for this milestone (mechanical gates only).</li>";

const recRows = review?.chair?.recommendations?.length
  ? review.chair.recommendations
      .map((r) => `<li><span class="tag">${esc(r.tag)}</span> <strong>${esc(r.title)}</strong><br/>${esc(r.rationale ?? "")}</li>`)
      .join("\n")
  : "<li>None recorded.</li>";

const html = `<!doctype html><meta charset="utf-8">
<title>Exhibit gate ${esc(milestone)}</title>
<style>
  body{font:14px/1.5 -apple-system,sans-serif;margin:0;background:#EDE6D6;color:#1C1A17;padding:32px}
  h1{font-size:22px} h2{margin-top:36px;border-bottom:2px solid #1C1A17;padding-bottom:4px}
  .pair{display:flex;gap:16px;align-items:flex-start}
  figure{margin:0;flex:1;border:1px solid #1c1a1733;background:#fff}
  figure.mob{max-width:240px}
  img{width:100%;display:block}
  figcaption{font-size:11px;padding:4px 6px;color:#4A453D}
  pre{background:#fff;border:1px solid #1c1a1733;padding:12px;overflow:auto}
  .sev{font-weight:700;padding:1px 6px;border:1px solid}
  .p1 .sev{color:#B0322B;border-color:#B0322B}
  .p2 .sev{color:#C9A227;border-color:#C9A227}
  .p3 .sev{color:#4A6B8A;border-color:#4A6B8A}
  .tag{font-size:11px;border:1px solid #1C1A17;padding:1px 6px}
  li{margin-bottom:10px}
</style>
<h1>The Ground Keeps Moving, gate ${esc(milestone)}</h1>
<p>Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} · states ${states.length} · shots ${shots.length}</p>
<h2>What changed</h2>
<pre>${esc(changes)}</pre>
<h2>Punch list</h2>
<ol>${punchRows}</ol>
<h2>Recommendations</h2>
<ul>${recRows}</ul>
<h2>Screens</h2>
${shotRows}
`;

writeFileSync(path.join(OUT, "index.html"), html);
console.log(`digest written to ${OUT}/index.html (${states.length} states, ${shots.length} shots)`);
