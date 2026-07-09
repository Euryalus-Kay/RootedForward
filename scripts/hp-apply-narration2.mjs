// Apply the owner's rewritten intro voiceover and present-day host close,
// adjusted only to keep house style (no colons inside sentences, no em-dashes).
import { readFileSync, writeFileSync } from "node:fs";

const r = JSON.parse(readFileSync("data/hp-research.json", "utf8"));
const by = Object.fromEntries(r.chapters.map((c) => [c.chapterId, c]));

const INTRO_VO =
  "Hyde Park sits about seven miles south of downtown Chicago, along the shore of Lake Michigan. " +
  "At first glance, it feels timeless. The greystones, tree-lined streets, and Gothic buildings look as " +
  "though they've always belonged here. But almost every part of this neighborhood exists because someone " +
  "with money and influence decided it should. Over the past 170 years, Hyde Park has been built, demolished, " +
  "and rebuilt over and over again. Railroads, universities, and government agencies reshaped the landscape, " +
  "while the people who already lived here often had little say in what happened next. It started with a railroad " +
  "crossing open prairie, followed by a university and a World's Fair. Then, in the 1950s, federal urban renewal " +
  "displaced more than 15,000 residents. The neighborhood has never really stopped changing.";

const PRESENT_HOST =
  "I'm standing in Jackson Park, and behind me is the Obama Presidential Center. People waited more than a decade " +
  "for this to become reality, and for many, it's a major investment in the South Side. But there's another side of " +
  "the story that didn't make it into the ribbon-cutting. As the Center was being built, Woodlawn, the neighborhood " +
  "that worked for years to bring it here, became far more expensive. On the blocks closest to the project, home " +
  "prices doubled. So I keep coming back to one question. When investment transforms a neighborhood, who gets to " +
  "stay and be part of what they helped create?";

by["intro"].script.voiceover = INTRO_VO;
by["present"].script.hostScript = PRESENT_HOST;

// regenerate caption lines for the intro (the chapter whose spoken VO changed)
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
by["intro"].script.lines = toLines(INTRO_VO);

writeFileSync("data/hp-research.json", JSON.stringify(r, null, 2));
console.log("updated intro voiceover (", INTRO_VO.split(/\s+/).length, "words ) and present host close (", PRESENT_HOST.split(/\s+/).length, "words )");
