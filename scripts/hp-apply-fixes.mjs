// Apply the fact-check corrections, regenerate caption lines for the
// changed chapters, and reorder chapters to true chronological order.
import { readFileSync, writeFileSync } from "node:fs";

const r = JSON.parse(readFileSync("data/hp-research.json", "utf8"));
const by = Object.fromEntries(r.chapters.map((c) => [c.chapterId, c]));

function fix(cid, re, to) {
  const c = by[cid];
  if (!re.test(c.script.voiceover)) {
    console.log(`!! pattern not found in ${cid}: ${re}`);
    return;
  }
  c.script.voiceover = c.script.voiceover.replace(re, to);
  console.log(`fixed ${cid}`);
}

// 1. intro: the university came before the world's fair
fix("intro", /then a world.s fair, then a university\./,
  "then a university, then a world’s fair.");
// 2. urban-renewal: the ~4,000 families was the plan's total over years
fix("urban-renewal",
  /The City Council made it official in 1958\. By then about four thousand families were already being pushed out\./,
  "The City Council made it official in 1958, though demolition had started three years earlier. All told, the plan would push out about four thousand families.");
// 3. present: the Jackson Park site was chosen in 2016
fix("present", /The site was picked around 2015\./, "The site was picked in 2016.");

// regenerate caption lines for the changed chapters
const MAX = 46;
function toLines(vo) {
  const clauses = vo.replace(/\s+/g, " ").trim().split(/(?<=[.?!])\s+|(?<=,)\s+/);
  const lines = [];
  for (let cl of clauses) {
    cl = cl.replace(/,$/, "").trim();
    if (!cl) continue;
    if (cl.length <= MAX) { lines.push(cl); continue; }
    const words = cl.split(" "); let cur = "";
    for (const w of words) {
      if ((cur ? cur + " " + w : w).length <= MAX) cur = cur ? cur + " " + w : w;
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
  }
  return lines.filter(Boolean);
}
for (const cid of ["intro", "urban-renewal", "present"]) by[cid].script.lines = toLines(by[cid].script.voiceover);

// reorder to chronological: the University (1890) before the World's Fair (1893)
const ORDER = ["intro", "formation", "university", "worlds-fair", "color-line", "urban-renewal", "present"];
r.chapters.sort((a, b) => ORDER.indexOf(a.chapterId) - ORDER.indexOf(b.chapterId));

writeFileSync("data/hp-research.json", JSON.stringify(r, null, 2));
console.log("order:", r.chapters.map((c) => c.chapterId).join(", "));
