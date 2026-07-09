// Apply the creative-review narration changes: keep the displacement thesis
// visible through the middle chapters, sharpen the color-line hinge, trim the
// overstuffed renewal chapter, and tighten a few lines toward a human voice.
// Every change stays strictly inside the already-verified facts.
import { readFileSync, writeFileSync } from "node:fs";

const r = JSON.parse(readFileSync("data/hp-research.json", "utf8"));
const by = Object.fromEntries(r.chapters.map((c) => [c.chapterId, c]));

// Build a regex from a literal, tolerant of straight/curly apostrophes and of
// any whitespace run, so matches survive encoding differences.
function rx(lit) {
  const esc = lit
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/['’]/g, "['’]")
    .replace(/\s+/g, "\\s+");
  return new RegExp(esc);
}
function sub(cid, field, from, to, optional = false) {
  const c = by[cid];
  const t = c.script?.[field];
  if (t == null) {
    if (!optional) console.log(`!! no field ${cid}.${field}`);
    return;
  }
  const re = rx(from);
  if (!re.test(t)) {
    if (!optional) console.log(`!! not found [${cid}.${field}]: ${from.slice(0, 46)}`);
    return;
  }
  c.script[field] = t.replace(re, to);
  console.log(`ok ${cid}.${field}`);
}

// 1. intro: plainer, more human, and lands the human cost
sub("intro", "voiceover",
  "This neighborhood got built and torn down and rebuilt, and the people swinging the wrecking ball were institutions, not the families on the block.",
  "This neighborhood got built and torn down and rebuilt, again and again. The people deciding were institutions with money. The ones who got pushed out lived here.");

// 2. formation: keep the thesis visible, close on Cornell's selective pitch
sub("formation", "voiceover",
  "and that year the voters chose to join Chicago for the water and the sewers.",
  "and that year the voters chose to join Chicago for the water and the sewers. From the start, Cornell sold the place as selective, a retreat for people with means, a clean distance from the city’s crowds.");

// 3. university: foreshadow the institution's later reach over the neighborhood
sub("university", "voiceover",
  "Henry Ives Cobb laid out the gray Gothic quads you still walk through.",
  "Henry Ives Cobb laid out the gray Gothic quads you still walk through. The same institution that built them would later decide who got to live around them.");

// 4. world's fair: plainer light line, and hand the thread forward
sub("worlds-fair", "voiceover",
  "white plaster halls that glowed at night under electric light.",
  "white plaster halls, lit up at night by electricity.");
sub("worlds-fair", "voiceover",
  "Almost none of it was built to last. One building was. The old Palace of Fine Arts reopened in 1933 as the Museum of Science and Industry.",
  "Almost none of it was built to last. The Palace of Fine Arts was the exception. It reopened in 1933 as the Museum of Science and Industry. The fair made this lakefront valuable ground. The fight over who it belonged to was still ahead.");

// 5. color line: give the university's role its own beat, get Shelley exactly right
sub("color-line", "voiceover",
  "Hyde Park and Woodlawn leaned on these covenants, and the University of Chicago put quiet money behind defending them in court.",
  "Hyde Park and Woodlawn leaned on these covenants. And the University of Chicago was not a bystander. It put money behind defending them in court, to keep the blocks around its campus white.");
sub("color-line", "voiceover",
  "The covenants didn’t lose their teeth until 1948, in Shelley v. Kraemer.",
  "Not until 1948 did the Supreme Court take their force away, in Shelley v. Kraemer. The clauses stayed in the deeds. Courts just couldn’t enforce them anymore.");

// 6. urban renewal: cut the redundant clause so the human payoff arrives sooner
sub("urban-renewal", "voiceover",
  "The City Council made it official in 1958, though demolition had started three years earlier.",
  "The City Council made it official in 1958.");

// 7. present: tighten the Protect Our Parks line and the closing question
sub("present", "voiceover",
  "A group called Protect Our Parks sued over and over to stop it, and lost every time.",
  "A group called Protect Our Parks sued over and over to stop it. Every suit failed.");
sub("present", "hostScript",
  "So the question I keep landing on is who gets to stay near the thing they fought for.",
  "So the question I keep coming back to is simple. Who gets to stay in the neighborhood that fought to bring this here.", true);

// regenerate caption lines for every chapter, on cleaner break points
const MAX = 50;
function toLines(vo) {
  const clauses = vo.replace(/\s+/g, " ").trim().split(/(?<=[.?!])\s+|(?<=,)\s+/);
  const lines = [];
  for (let cl of clauses) {
    cl = cl.replace(/,$/, "").trim();
    if (!cl) continue;
    if (cl.length <= MAX) { lines.push(cl); continue; }
    const words = cl.split(" ");
    let cur = "";
    for (const w of words) {
      if ((cur ? cur + " " + w : w).length <= MAX) cur = cur ? cur + " " + w : w;
      else { if (cur) lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
  }
  return lines.filter(Boolean);
}
for (const c of r.chapters) c.script.lines = toLines(c.script.voiceover);

writeFileSync("data/hp-research.json", JSON.stringify(r, null, 2));
console.log("\nrewrote narration + captions for", r.chapters.length, "chapters");
