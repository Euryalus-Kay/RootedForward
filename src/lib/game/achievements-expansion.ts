/**
 * Expansion pack of achievements.
 *
 * These are the long-tail rewards. A full run can unlock roughly half
 * of them; unlocking all requires specialized runs that deliberately
 * pursue the harder or weirder conditions.
 */

import type { Achievement, GameState } from "./types";

export const ACHIEVEMENTS_EXPANSION: Achievement[] = [
  {
    id: "exp-historian",
    name: "Historian",
    description: "Read every glossary entry in a single run.",
    icon: "book",
    hidden: true,
  },
  {
    id: "exp-two-runs",
    name: "Second Pass",
    description: "Complete the game twice.",
    icon: "calendar",
  },
  {
    id: "exp-five-runs",
    name: "Veteran Alderman",
    description: "Complete the game five times.",
    icon: "calendar",
  },
  {
    id: "exp-role-all",
    name: "Six Identities",
    description: "Complete the game as every role at least once.",
    icon: "scale",
  },
  {
    id: "exp-score-400",
    name: "Flawless Ward",
    description: "Finish with a final score above 400.",
    icon: "trophy",
  },
  {
    id: "exp-score-500",
    name: "Legendary Run",
    description: "Finish with a final score above 500.",
    icon: "trophy",
    hidden: true,
  },
  {
    id: "exp-no-speculators-ever",
    name: "Clean Deed",
    description: "Finish with zero parcels owned by speculators.",
    icon: "shield",
  },
  {
    id: "exp-twenty-landtrust",
    name: "Land Trust Steward",
    description: "Finish with at least 20 land-trust parcels.",
    icon: "handshake",
  },
  {
    id: "exp-forty-landtrust",
    name: "Land Trust Architect",
    description: "Finish with at least 40 land-trust parcels.",
    icon: "handshake",
    hidden: true,
  },
  {
    id: "exp-five-murals",
    name: "Wall Stories",
    description: "Finish with at least 5 mural parcels.",
    icon: "monument",
  },
  {
    id: "exp-ten-murals",
    name: "Neighborhood Muralist",
    description: "Finish with at least 10 mural parcels.",
    icon: "monument",
    hidden: true,
  },
  {
    id: "exp-all-blocks-residents",
    name: "Every Block, Every Life",
    description: "Finish with at least 30 residents in every block.",
    icon: "home",
  },
  {
    id: "exp-no-demolitions",
    name: "Nothing Down",
    description: "Finish with zero demolished parcels.",
    icon: "shield",
    hidden: true,
  },
  {
    id: "exp-hundred-cards",
    name: "Century of Play",
    description: "Play 100 cards in a single run.",
    icon: "deck",
    hidden: true,
  },
  {
    id: "exp-fifty-notes",
    name: "Footnote Master",
    description: "Read 50 glossary notes in a single run.",
    icon: "book",
    hidden: true,
  },
  {
    id: "exp-all-objectives",
    name: "All Three",
    description: "Complete all three selected objectives in one run.",
    icon: "balance",
  },
  {
    id: "exp-preservation-early",
    name: "Got There First",
    description: "Pass preservation overlays before 1975.",
    icon: "lock",
    hidden: true,
  },
  {
    id: "exp-no-expressway-run",
    name: "Highway Refuser",
    description: "Finish without the expressway flag ever being set.",
    icon: "stop",
  },
  {
    id: "exp-covenants-challenged",
    name: "Deed Contested",
    description: "Play the Shelley v. Kraemer amicus card.",
    icon: "scale",
    hidden: true,
  },
  {
    id: "exp-rainbow-run",
    name: "Rainbow Coalition",
    description: "Play the Rainbow Coalition card.",
    icon: "raised-fist",
    hidden: true,
  },
  {
    id: "exp-heat-response",
    name: "Cooling Centers",
    description: "Resolve the 1995 heat wave event with the mobilization option.",
    icon: "tree",
    hidden: true,
  },
  {
    id: "exp-covid-mobilize",
    name: "Pandemic Mobilizer",
    description: "Respond to the COVID event with ward-mobilization option.",
    icon: "shield",
    hidden: true,
  },
  {
    id: "exp-rle-locked",
    name: "Locked the Rents",
    description: "Lock RLE affordability before the station opens.",
    icon: "rail",
    hidden: true,
  },
  {
    id: "exp-baby-bonds-era",
    name: "Cradle Wealth",
    description: "Play the local baby-bond program.",
    icon: "scale",
    hidden: true,
  },
  {
    id: "exp-reparations-pass",
    name: "Reparations Passed",
    description: "Play the local reparations ordinance.",
    icon: "balance",
    hidden: true,
  },
  {
    id: "exp-co-op-path",
    name: "Co-op Path",
    description: "Convert at least 3 parcels into tenant or land-trust cooperatives.",
    icon: "handshake",
  },
  {
    id: "exp-equity-plus-80",
    name: "Equity at Eighty",
    description: "Finish with equity score above 80.",
    icon: "scale",
    hidden: true,
  },
  {
    id: "exp-heritage-plus-80",
    name: "Heritage at Eighty",
    description: "Finish with heritage score above 80.",
    icon: "monument",
    hidden: true,
  },
  {
    id: "exp-sustain-plus-80",
    name: "Sustainability at Eighty",
    description: "Finish with sustainability score above 80.",
    icon: "tree",
    hidden: true,
  },
  {
    id: "exp-growth-plus-80",
    name: "Growth at Eighty",
    description: "Finish with growth score above 80.",
    icon: "construction",
    hidden: true,
  },
  {
    id: "exp-five-event-resolves",
    name: "Cool Under Fire",
    description: "Resolve 5 events in a single turn span.",
    icon: "warning",
  },
  {
    id: "exp-skip-all-objectives",
    name: "No Promises",
    description: "Complete a run without picking any objectives.",
    icon: "ban",
    hidden: true,
  },
  {
    id: "exp-three-protected-1975",
    name: "Three Before Seventy-Five",
    description: "Have at least 3 protected parcels before 1975.",
    icon: "lock",
    hidden: true,
  },
  {
    id: "exp-library-and-clinic",
    name: "Public Goods",
    description: "Build at least one library and one clinic in a single run.",
    icon: "book",
    hidden: true,
  },
  {
    id: "exp-high-trust",
    name: "High Trust",
    description: "Reach 30 Trust in a single run.",
    icon: "handshake",
  },
  {
    id: "exp-high-knowledge",
    name: "Forty Knowledge",
    description: "Reach 40 Knowledge in a single run.",
    icon: "owl",
    hidden: true,
  },
  {
    id: "exp-capital-hoard",
    name: "Capital Stack",
    description: "Reach 50 Capital in a single run.",
    icon: "money",
    hidden: true,
  },
  {
    id: "exp-political-muscle",
    name: "Political Muscle",
    description: "Reach 30 Power in a single run.",
    icon: "raised-fist",
  },
  {
    id: "exp-dominant-axis",
    name: "Dominant Axis",
    description: "Finish with one score at 60+ and every other at 30+.",
    icon: "scale",
  },
  {
    id: "exp-no-lose-parcels",
    name: "Kept the Block",
    description: "Finish the game without losing a parcel to demolition or displacement.",
    icon: "shield",
    hidden: true,
  },
];

/** Check for expansion-specific achievements in addition to the core set. */
export function checkExpansionAchievements(state: GameState): string[] {
  const earned: string[] = [];
  const has = (id: string) => state.achievements.has(id);

  if (state.phase === "ended") {
    const fs = state.finalScore;
    if (fs && fs.total >= 400 && !has("exp-score-400")) earned.push("exp-score-400");
    if (fs && fs.total >= 500 && !has("exp-score-500")) earned.push("exp-score-500");

    if (state.parcels.filter((p) => p.owner === "speculator").length === 0 && !has("exp-no-speculators-ever")) {
      earned.push("exp-no-speculators-ever");
    }

    const ltCount = state.parcels.filter((p) => p.type === "land-trust").length;
    if (ltCount >= 20 && !has("exp-twenty-landtrust")) earned.push("exp-twenty-landtrust");
    if (ltCount >= 40 && !has("exp-forty-landtrust")) earned.push("exp-forty-landtrust");

    const muralCount = state.parcels.filter((p) => p.type === "mural").length;
    if (muralCount >= 5 && !has("exp-five-murals")) earned.push("exp-five-murals");
    if (muralCount >= 10 && !has("exp-ten-murals")) earned.push("exp-ten-murals");

    const demolishedCount = state.parcels.filter((p) => p.type === "demolished").length;
    if (demolishedCount === 0 && !has("exp-no-demolitions")) earned.push("exp-no-demolitions");

    // One score at 60+, every other at 30+
    const { equity, heritage, growth, sustainability } = state.scores;
    const scores = [equity, heritage, growth, sustainability];
    const hasDominant = scores.some((s) => s >= 60);
    const allModest = scores.every((s) => s >= 30);
    if (hasDominant && allModest && !has("exp-dominant-axis")) {
      earned.push("exp-dominant-axis");
    }

    if (equity >= 80 && !has("exp-equity-plus-80")) earned.push("exp-equity-plus-80");
    if (heritage >= 80 && !has("exp-heritage-plus-80")) earned.push("exp-heritage-plus-80");
    if (sustainability >= 80 && !has("exp-sustain-plus-80")) earned.push("exp-sustain-plus-80");
    if (growth >= 80 && !has("exp-growth-plus-80")) earned.push("exp-growth-plus-80");

    if (state.objectives.length === 0 && !has("exp-skip-all-objectives")) {
      earned.push("exp-skip-all-objectives");
    }
  }

  if (state.playedCards.length >= 100 && !has("exp-hundred-cards")) earned.push("exp-hundred-cards");
  if (state.notesRead.size >= 50 && !has("exp-fifty-notes")) earned.push("exp-fifty-notes");

  if (!state.flags.has("expressway-built") && !has("exp-no-expressway-run") && state.year >= 1980) {
    earned.push("exp-no-expressway-run");
  }

  if (state.flags.has("covenants-challenged") && !has("exp-covenants-challenged")) {
    earned.push("exp-covenants-challenged");
  }

  if (state.flags.has("rle-affordability-locked") && !has("exp-rle-locked")) {
    earned.push("exp-rle-locked");
  }

  if (state.year >= 1975) {
    const protectedCount = state.parcels.filter((p) => p.protected).length;
    if (protectedCount >= 3 && !has("exp-three-protected-1975")) {
      // Only award if we haven't already passed this threshold before 1975
      earned.push("exp-three-protected-1975");
    }
  }

  const hasLibrary = state.parcels.some((p) => p.type === "library");
  const hasClinic = state.parcels.some((p) => p.type === "clinic");
  if (hasLibrary && hasClinic && !has("exp-library-and-clinic")) {
    earned.push("exp-library-and-clinic");
  }

  if (state.resources.trust >= 30 && !has("exp-high-trust")) earned.push("exp-high-trust");
  if (state.resources.knowledge >= 40 && !has("exp-high-knowledge")) earned.push("exp-high-knowledge");
  if (state.resources.capital >= 50 && !has("exp-capital-hoard")) earned.push("exp-capital-hoard");
  if (state.resources.power >= 30 && !has("exp-political-muscle")) earned.push("exp-political-muscle");

  return earned;
}
