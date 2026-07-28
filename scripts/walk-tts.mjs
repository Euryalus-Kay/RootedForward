#!/usr/bin/env node
// ------------------------------------------------------------------
// Generate the Jackson Park walking tour narration with OpenAI
// text-to-speech, one mp3 per stop, loudness-normalized. Reads the
// transcripts straight out of src/lib/tours/jackson-park-walk.ts so
// the audio can never drift from the on-page text. Writes:
//   public/media/jackson-park-walk/audio/<stop-id>.mp3
//   public/media/jackson-park-walk/audio/durations.json
// After running, copy the printed audioSeconds values into
// jackson-park-walk.ts (or run with --patch to do it in place).
//
// Usage:
//   OPENAI_API_KEY=sk-... node scripts/walk-tts.mjs [--voice ash]
//       [--model gpt-4o-mini-tts] [--only harper-court] [--patch]
//
// The key is read from the environment only and never written to disk.
// ------------------------------------------------------------------
import { writeFile, mkdir, rm } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
// two tours share this pipeline; pick with --tour (default hyde-park)
const TOURS = {
  "hyde-park": {
    data: "src/lib/tours/hyde-park-walk.ts",
    out: "public/media/hyde-park-walk/audio",
  },
  "jackson-park": {
    data: "src/lib/tours/jackson-park-walk.ts",
    out: "public/media/jackson-park-walk/audio",
  },
  harlem: {
    data: "src/lib/tours/harlem-walk.ts",
    out: "public/media/harlem-walk/audio",
  },
};
function argEarly(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : def;
}
const tourName = argEarly("tour", "hyde-park");
if (!TOURS[tourName]) {
  console.error(`unknown --tour "${tourName}" (use ${Object.keys(TOURS).join(" | ")})`);
  process.exit(1);
}
const DATA = path.join(ROOT, TOURS[tourName].data);
const OUT = path.join(ROOT, TOURS[tourName].out);
const DURS = path.join(OUT, "durations.json");

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : def;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);
const voice = arg("voice", "ash");
const model = arg("model", "gpt-4o-mini-tts");
// --only takes one stop id or a comma-separated list, so an edit
// touching six stops is one run instead of six.
const only = arg("only");
const onlySet = only ? new Set(only.split(",").map((s) => s.trim())) : null;
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY must be set in the environment");
  process.exit(1);
}

// A guide walking beside you, not a documentary narrator.
const BASE_INSTRUCTIONS =
  "You are a friendly, knowledgeable local guide leading a self-paced walking tour of a Chicago neighborhood, speaking to one listener through their headphones. " +
  "Warm, unhurried, conversational, like showing a friend around a place you love. Natural pauses between sentences; a slightly longer, easy breath between paragraphs. " +
  "Serious and quiet on the painful history, never solemn or theatrical. Never chirpy, never robotic, never salesy. Plain American English; pronounce Chicago names naturally. " +
  "Numbers and years read out clearly and calmly. ";

// Per-stop coloring on top of the base read. Keyed by tour, then stop.
const TONE_SETS = {
  "hyde-park": {
    1: "The welcome. Settled and a little conspiratorial, letting the listener in on a story most neighbors never heard. The housekeeping paragraphs are gone, so this opens on the boulder and goes straight into Cornell. Enjoy Cornell the operator without admiring him. Turn cool and level for the Sisson paragraph at the end; read the whites-only record plainly and let it sit.",
    2: "Nostalgic storyteller at the grand hotel, painting summer crowds you can almost hear. Let the lobby paragraph glow a little. Then cool and steady for the final paragraph about who was on the porch, ending on a quiet, pointed handoff.",
    3: "Start matter-of-fact about the trains, then open up with respect and weight for the Great Migration paragraph; that one is the heart of this stop, read it unhurried. Wry but gentle on the saloon strip as the back of the stage set. Firm and clear on the closing pattern.",
    4: "Big canvas, the longest stop. Easy storyteller for Cornell's park crusade and the drawings burned in the fire, then real wonder for the White City and the electric nights, without turning into a commercial. Level and unflinching from Nancy Green onward; read the pamphlet's full title slowly and clearly. Quiet on the fire ending, then land the closing question simply.",
    5: "Quiet awe at the tower and at Juneteenth, then generous and glad for what the Center gives the neighborhood. Shift register completely for the housing paragraph; that is a reporter reading a report, calm and exact, no editorial in the voice. Read the renter's quote plainly, as her words. The where-will-we-be paragraph is direct and open, a question rather than a verdict. End with easy momentum back into the past.",
    6: "A quieter stop between the big ones. Gentle porch nostalgia for the verandah and the fair summer, then even and thoughtful as the university absorbs the ground. Read the closing irony plainly, no wink, and send the listener up the Midway with ease.",
    7: "Carnival color for the Ferris wheel paragraph, and real delight at the foundations found under the ice rink. Drop all brightness for the villages paragraph; level, unflinching, with a beat after 'sold tickets to it all summer.' Cartographer's calm for the canal. Grave and steady from 'The Midway became a border' to the end.",
    8: "Let the chapel's scale register, unhurried. Read Rockefeller's wish as reported speech. Cool and precise from the construction photograph onward; the chain of later demolitions is steady, a record, not an accusation. End pointed but quiet on the scale of the power.",
    9: "Affection for the strange brilliant house, a storyteller enjoying Wright and Robie. Real interest in the rescue twist and the Zeckendorf irony. Then lean in hard for the last two paragraphs. 'How do you keep a wealthy Hyde Park white' is the question the whole tour turns on; ask it plainly, no sneer, and let the silence after it do the work.",
    10: "Campus-tour warmth with an edge of amusement at the instant-ancestry Gothic. Read the Douglas plantation sentence plainly and let it sit. The William Allison Davis paragraph is level and unhurried, and the paragraph after it, about the document filed in the Loop, is cold and exact. End with easy momentum toward the stadium.",
    11: "Relish the football spectacle, then measured and frank for the Hutchins collapse, the cost laid out plainly. Genuine awe, hushed and precise, for the pile paragraph; slow right down for the date and the twenty-eight minutes. The closing pivot back to the neighborhood is quiet and pointed.",
    12: "The most personal stop. Quiet, close, unhurried throughout. The mob and the window are read with restraint, no drama added. The complicated-Carl paragraph gets absolute evenhandedness. Warm a little for Lorraine and Broadway.",
    13: "Off duty, almost. Straight history for John Daley and the Greek families, warm respect for the street and for Ali at the counter. End with honest appetite and an easy pointer onward.",
    14: "A whole century in one street. Open with a guide who is glad you came the extra mile. Genuine pleasure in the fountain, the chateau and the flower beds, never plummy. Then flatten out completely for the paragraphs on 1948, the kitchenettes and the contracts; that is a con being explained step by step, anger held in check. Real warmth returns for the Sutherland and the musicians. End easy and practical.",
    15: "The longest and hardest stop, and the one the whole walk has been building to. Level, controlled and unhurried throughout; the two-halves paragraph is the con explained one move at a time. Warmth for the block clubs and for the bars and the Compass Players. Then cool right down for Kimpton, Levi and the 1953 law; that stretch is a record being read out, not an accusation. Read the four thousand families and Baldwin's line plainly, no flourish. Real regret, quietly, for the businesses that never reopened, and let the shopping carts land as the small good thing it is. Read the Nichols Park paragraph slowly and let the Japanese American sentence sit without any push. End flat and certain.",
    16: "The finale, and after the weight of the last stop this one lifts. Let real affection in for the concession stands and the painters who took them over; that stretch is the warmest thing in the tour. Give the two-things-are-true paragraph room, evenhanded and unhurried. Slow for 'run the whole line once' and read that list with weight, one clean beat between each. End warm on the thanks.",
  },
  harlem: {
    0: "The day trip, and it sits outside the walk. Read it as a footnote that turns out to matter, calm and explanatory, a researcher telling you where the missing half of the story went. Plain and exact on the two court cases. Warm for Basie and Louis and Ella on those streets. End practical and quiet on the advice about walking a neighbourhood where people live.",
    1: "The welcome, and the whole tour's frame. Settled and glad the listener came, letting them in on a history most visitors to this corner never hear. Enjoy the Theresa's glamour when it arrives, Joe Louis and Castro and the forty suites. Drop all the warmth for the twenty-seven years of refusing Black guests, and read the Ebony quote about dim hallways plainly, as the magazine's own words. The Love B. Woods correction is a researcher being straight with you, not a gotcha. End pointed and quiet looking east toward 5 West 125th.",
    2: "Four fights on two hundred yards, so this one has momentum. Real energy for the Blumstein's picket and the sign that says We Won't Shop Where We Can't Work. Slow right down for Lino Rivera and the penknife; that paragraph is a chain of small accidents and each link needs its own beat. Level and unflinching for the three dead, and read Lloyd Hobbs's name and age without any push. Lift again for the Apollo reopening. End on the pattern, quietly.",
    3: "The optional stop, and the voice can be a little cooler and more explanatory here, a guide who has walked you off the route on purpose. Real contempt held in check for the basement entrance and fifteen percent of the facilities; say Gym Crow the way the protesters said it. Wonder at the waterfall standing in the hole. End by pointing back toward the main walk.",
    4: "The oldest row, and the prettiest thing on the tour. Genuine affection for the porches and the turned columns and the front yards, a guide who likes this block. Then flatten out completely for the Astors keeping it white by simply not selling; that is the quiet point of the stop and it needs no emphasis at all. Read the Claude McKay line with warmth. End level on what a covenant law cannot reach.",
    5: "The shortest stop and the coldest. No warmth and no drama. Read the covenant's own wording slowly and let the fractions of ancestry sit; the words do the work. The YWCA sentence is a fact, not an outrage. The last paragraph, about a covenant costing money even when it fails, is the argument of the whole tour, so read it plainly and let it land.",
    6: "Payton is the most enjoyable person on this walk, so let some admiration in for the nerve of it. Storyteller pace through the evictions and the counter-move. Then drop right down for the premium; that stretch is a mechanism being explained, one step at a time, anger held well back. Read the 1915 study's title as the title it is.",
    7: "The block where Black Harlem began, and the tone should register that as an arrival rather than a landmark. Steady and warm. The subway correction is offhand, a researcher tidying up. Cool for the improvement corporation's fourth item and the phrase a proper environment.",
    8: "The one unambiguously good thing on the route, and it is still here. Warm and unhurried throughout, real pleasure in Schomburg being told as a boy that Black people had no history and spending his life answering it. Let the closing sentence about the collection still being on this corner rest.",
    9: "The churches that bought Harlem. Respect without reverence. Tandy and Foster's names get weight. Real relish for Mother AME Zion using an intermediary and paying less than half; that is the one moment on this tour where the mechanism runs the other way. The St. Philip's figure is attributed out loud to James Weldon Johnson, so read that attribution as an attribution.",
    10: "Beauty first, unhurried, McKim Mead and White and the brown brick and the alleys. Then flat and exact for the sales policy; the correction that these houses carried no racial covenant matters, and it is more damning rather than less, so read it as a finding. End on the twenty-five years of appreciation that went somewhere else.",
    11: "The heaviest numbers on the walk. Abyssinian gets warmth and scale. The Commission's findings are read the way you read a report, level and precise, no editorial in the voice at all, and slow for the density figures. Roberts and Frazier get their correct roles. End quiet.",
    12: "Cold and controlled. Metropolitan Life built this after refusing to let Black tenants into Stuyvesant Town, and that sentence should be delivered without any lift. Read Ecker's line as reported speech. The defeated amendment is a fact of record. Let the closing sit without commentary.",
    13: "Short, and about a thing that is gone. Let the Savoy be fun for a moment, the dancing and the two bandstands, because the loss only means something if the place does. Then flat for the clearance arithmetic. End on the plaque in the sidewalk, quiet, no swell.",
    14: "The emotional centre of the tour and the one to hold steadiest. Genuine warmth for what Dunbar was, the garden, Du Bois and Robeson and Matthew Henson at the same address. Then absolute evenness for the foreclosure. Read the Landmarks Commission's wording exactly, the equity returned and the tenants placed on a rental basis, and let the sentence about five hundred families changing from owners to renters in one day stand entirely alone. No anger in the voice. It does not need any.",
    15: "After Dunbar this one lifts, and it should. Real pleasure that the first federally built housing for Black tenants is good architecture with trees and courtyards. John Louis Wilson Jr. gets his name said properly. Careful and plain on the application figures and on naming which source gives which number. End warm.",
    16: "Sugar Hill, so open with the view and the height and who lived here. Then the appraiser: read the form's own words, good condition and trend of desirability static to down, in a flat clerk's register, because the gap between what he saw and what he wrote is the whole point. Lift at the end for the tenants who own the building now.",
    17: "The present tense, and the tour ends on a question rather than a verdict. Steady and careful with the population figures, including the caution about survey variation. The hearse down Lenox Avenue is described, not dramatised. Read the two June 2026 events side by side and let the listener decide. End open, and thank them.",
  },
  "jackson-park": {
    1: "This is the welcome. Bright but settled, glad the listener showed up. Let the last paragraph slow slightly as the history opens up.",
    2: "Storyteller mode, enjoying the spectacle of the Ferris wheel. Drop the brightness completely for the sentence about people being put on display; read it level and unflinching, with a beat of silence after 'That happened on this lawn too.' Warm again for the playground.",
    3: "Quiet and close, like talking at a graveside bench about two people you admire. Gentle lift at the invitation to sit.",
    4: "Start with easy wonder looking across the water. Turn steady and respectful for Rosenwald, letting the schoolhouse sentence land without any swell.",
    5: "Affectionate and a little wry; you love this broken old bridge. Tender on the ashes and the wreaths. The last line dry, not sad.",
    6: "Gentle and unhurried, garden-quiet. Grave and plain on the 1946 arson. Softly hopeful from Sky Landing onward, ending with an easy send-off down the path.",
    7: "Hushed, as if not to scare the birds. Slow, with space around the sentences. The last line is a quiet promise of what is ahead.",
    8: "Open with scale and awe at the golden statue and the vanished fair. Shift to a firm, clear, unhurried register for Ida B. Wells and Frederick Douglass; this is the heart of the tour, read it with respect and no melodrama.",
    9: "The finale. Direct and honest, one neighbor leveling with another. Read the Obama quote as reported speech, matter of fact. Slow down for the final three sentences and let 'That is the park you just walked' close gently, almost quietly.",
  },
};
const TONES = TONE_SETS[tourName];

// Encourage real pauses: newline after sentence enders shapes spoken
// pacing without changing the on-page transcript.
function paceText(text) {
  return text.replace(/([.!?])\s+/g, "$1\n");
}

/** Remove the page's markup so it is never spoken. `**bold**` carries
 *  the history for readers and `*italic*` sets publication titles;
 *  neither should change a syllable of the narration. */
function stripMarkup(text) {
  return text
    .replace(/\*\*(.+?)\*\*/gs, "$1")
    .replace(/\*(.+?)\*/gs, "$1")
    .replace(/\*/g, "");
}

// ---- pull { number, transcript[] } for each stop out of the TS file ----
function loadStops() {
  const src = readFileSync(DATA, "utf8");
  const stops = [];
  const stopRe = /id:\s*"([^"]+)",\s*\n\s*number:\s*(\d+),[\s\S]*?transcript:\s*\[([\s\S]*?)\n\s*\],/g;
  let m;
  while ((m = stopRe.exec(src)) !== null) {
    const slug = m[1];
    const number = parseInt(m[2], 10);
    const body = m[3];
    const strings = [];
    const strRe = /"((?:[^"\\]|\\.)*)"/g;
    let s;
    while ((s = strRe.exec(body)) !== null) {
      strings.push(stripMarkup(JSON.parse(`"${s[1]}"`)));
    }
    if (strings.length) stops.push({ slug, number, text: strings.join("\n\n") });
  }

  // Harlem carries a day trip with its own audio, outside the numbered
  // stops. Same treatment, so one run records the whole tour.
  const dayTrip = /dayTrip:\s*\{[\s\S]*?body:\s*\[([\s\S]*?)\n\s*\],/.exec(src);
  const audioSrc = /dayTrip:\s*\{[\s\S]*?audioSrc:\s*`\$\{MEDIA\}\/audio\/([a-z0-9-]+)\.mp3`/.exec(src);
  if (dayTrip && audioSrc) {
    const strings = [];
    const strRe = /"((?:[^"\\]|\\.)*)"/g;
    let s2;
    while ((s2 = strRe.exec(dayTrip[1])) !== null) {
      strings.push(stripMarkup(JSON.parse(`"${s2[1]}"`)));
    }
    if (strings.length) {
      stops.push({
        slug: audioSrc[1],
        number: 0,
        text: strings.join("\n\n"),
      });
    }
  }
  return stops;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (c) => (c === 0 ? resolve() : reject(new Error(err.slice(-300)))));
  });
}

function probe(file) {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", file]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => resolve(Math.round(parseFloat(out.trim())) || 0));
  });
}

async function tts(text, instructions) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      voice,
      input: paceText(text),
      instructions,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const stops = loadStops();
  if (!stops.length) {
    console.error(`No transcripts found in ${DATA}`);
    process.exit(1);
  }
  const durations = existsSync(DURS) ? JSON.parse(readFileSync(DURS, "utf8")) : {};
  for (const { slug, number, text } of stops) {
    const id = slug;
    if (onlySet && !onlySet.has(id)) continue;
    const raw = path.join(OUT, `raw-${id}.mp3`);
    const out = path.join(OUT, `${id}.mp3`);
    const buf = await tts(text, BASE_INSTRUCTIONS + (TONES[number] || ""));
    await writeFile(raw, buf);
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", raw,
      "-af", "loudnorm=I=-18:TP=-2:LRA=11", "-codec:a", "libmp3lame", "-b:a", "128k", out]);
    await rm(raw, { force: true });
    const dur = await probe(out);
    durations[id] = dur;
    console.log(`${id}.mp3  ${dur}s  (${text.split(/\s+/).length} words, ${voice})`);
  }
  await writeFile(DURS, JSON.stringify(durations, null, 2));

  if (hasFlag("patch")) {
    let src = readFileSync(DATA, "utf8");
    for (const { slug } of stops) {
      const id = slug;
      if (!(id in durations)) continue;
      const re = new RegExp(`(audio/${id}\\.mp3\`,\\n\\s*audioSeconds: )\\d+`);
      src = src.replace(re, `$1${durations[id]}`);
    }
    await writeFile(DATA, src);
    console.log(`patched audioSeconds in ${DATA}`);
  }
  console.log(`\ndone. voice "${voice}", model "${model}"`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
