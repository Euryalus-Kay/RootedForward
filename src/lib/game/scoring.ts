/**
 * Scoring. Final score is a weighted composite of the four hidden axes
 * plus bonuses for parcel state, achievements, and notes read. The
 * archetype is chosen from the score profile.
 */

import type {
  Archetype,
  ArchetypeKey,
  FinalScore,
  GameState,
  ScoreRank,
} from "./types";
import { completedObjectives, totalObjectiveReward } from "./objectives";

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  reformer: {
    key: "reformer",
    name: "The Reformer",
    blurb:
      "You used the tools you had to bend the system. Not all the way, the tools were designed inside constraints you could not escape, but Parkhaven came out with more options than you started with.",
    resident:
      "My grandmother's block is still her block. The land trust on 22nd holds the bakery, and the bakery still sells the same croissant. I can name three murals from memory. The expressway noise is the loudest thing about my morning.",
    icon: "torch",
  },
  organizer: {
    key: "organizer",
    name: "The Organizer",
    blurb:
      "You built power in the buildings, on the blocks, in the union halls. The Daley people called you difficult. The grandmothers called you Sunday afternoon to ask what you were doing for the next campaign.",
    resident:
      "I went to my first protest when I was nine. My mom said it was the same march her mom had been on, just with different signs. The block club still meets on Sunday. Three of the four candidates running for alderman this year came up through us.",
    icon: "raised-fist",
  },
  caretaker: {
    key: "caretaker",
    name: "The Caretaker",
    blurb:
      "You held the line. Few new arrivals, few departures. The institutions that existed in 1990 mostly still exist. The neighborhood is recognizable to a person born here in 1965.",
    resident:
      "Not much has changed since I was a kid. That cuts both ways. The school is the same school. The corner store is the same corner store. The asthma rates are the same too.",
    icon: "tree",
  },
  developer: {
    key: "developer",
    name: "The Developer",
    blurb:
      "You picked growth. The skyline changed. The tax base grew. Most of the people who lived here when you started are not here now, but the ones who arrived have a Parkhaven that looks nothing like 1940.",
    resident:
      "I moved here in 2027 because of the train and the new architecture. My building has a gym. I have never met anyone who lived here before me. I am told that is part of the cost.",
    icon: "tower",
  },
  speculator: {
    key: "speculator",
    name: "The Speculator",
    blurb:
      "You let the market decide. The market decided what it usually decides. The Cook Center will write a paper about Parkhaven's wealth extraction in 2042.",
    resident:
      "My family moved here in 1958. We do not live here anymore. I drive through sometimes to look at the building. Someone else lives in it now and they do not know my grandmother's name.",
    icon: "money",
  },
  technocrat: {
    key: "technocrat",
    name: "The Technocrat",
    blurb:
      "You knew every tool. You used the right one. Your spreadsheet is in the file at City Hall. The neighborhood is fine. It does not love you, but the next person to inherit it will be glad you were there.",
    resident:
      "I do not know who built half of these buildings, but they work. The CTA station is on time. The library has internet that works. The guy who used to be alderman left a binder full of notes when he retired. People still cite the binder.",
    icon: "data",
  },
};

/** Decide an archetype from a score profile */
export function chooseArchetype(state: GameState): ArchetypeKey {
  const { equity, heritage, growth, sustainability } = state.scores;
  const total = equity + heritage + growth + sustainability;

  // Speculator: high growth, low equity, low heritage
  if (growth > 25 && equity < -10 && heritage < 0) return "speculator";

  // Developer: high growth, moderate everything else, displacement evident
  const displaced = state.parcels.filter((p) => p.displacementEvents > 0).length;
  if (growth > 25 && displaced > 15) return "developer";

  // Reformer: high equity, moderate-high heritage, moderate growth
  if (equity > 20 && heritage > 10 && growth > 0) return "reformer";

  // Organizer: high trust accumulated, high equity, moderate heritage
  if (state.resources.trust > 8 && equity > 10 && state.resolvedEvents.length > 8) return "organizer";

  // Technocrat: high knowledge, high sustainability
  if (state.resources.knowledge > 15 && sustainability > 20) return "technocrat";

  // Caretaker: low displacement, moderate scores across the board
  if (displaced < 5 && Math.abs(equity) < 15 && Math.abs(heritage) < 15) return "caretaker";

  // Fallback: pick the dominant axis
  if (equity >= heritage && equity >= growth && equity >= sustainability) return "reformer";
  if (heritage >= growth && heritage >= sustainability) return "caretaker";
  if (growth >= sustainability) return "developer";
  return "technocrat";
}

/** Compute the score rank from total */
export function computeRank(total: number): ScoreRank {
  if (total >= 350) return "S";
  if (total >= 250) return "A";
  if (total >= 150) return "B";
  if (total >= 50) return "C";
  return "D";
}

/** Compute a live running score during play. Same math as the final
 *  score minus the archetype summary. Useful for the HUD. */
export function computeLiveScore(state: GameState): { total: number; equity: number; heritage: number; growth: number; sustainability: number; bonus: number } {
  const { equity, heritage, growth, sustainability } = state.scores;

  const baseEquity = Math.round(equity * 4 + 50);
  const baseHeritage = Math.round(heritage * 4 + 50);
  const baseGrowth = Math.round(growth * 4 + 50);
  const baseSustainability = Math.round(sustainability * 4 + 50);

  const ltCount = state.parcels.filter((p) => p.type === "land-trust").length;
  const protectedCount = state.parcels.filter((p) => p.protected).length;
  const muralCount = state.parcels.filter((p) => p.type === "mural").length;
  const transitCount = state.parcels.filter((p) => p.type === "transit").length;
  const speculatorCount = state.parcels.filter((p) => p.owner === "speculator").length;
  const towerCount = state.parcels.filter((p) => p.type === "tower").length;

  let bonus = 0;
  bonus += ltCount * 3;
  bonus += protectedCount * 2;
  bonus += muralCount * 4;
  bonus += transitCount * 5;
  bonus -= speculatorCount * 3;
  bonus -= towerCount * 2;
  bonus += state.notesRead.size * 1;
  bonus += state.achievements.size * 4;

  const total = baseEquity + baseHeritage + baseGrowth + baseSustainability + bonus;

  return {
    total,
    equity: baseEquity,
    heritage: baseHeritage,
    growth: baseGrowth,
    sustainability: baseSustainability,
    bonus,
  };
}

/** Compute final score with all bonuses */
export function computeFinalScore(state: GameState): FinalScore {
  const { equity, heritage, growth, sustainability } = state.scores;

  // Base from sub-scores
  const baseEquity = Math.round(equity * 4 + 50);
  const baseHeritage = Math.round(heritage * 4 + 50);
  const baseGrowth = Math.round(growth * 4 + 50);
  const baseSustainability = Math.round(sustainability * 4 + 50);

  // Bonuses
  const ltCount = state.parcels.filter((p) => p.type === "land-trust").length;
  const protectedCount = state.parcels.filter((p) => p.protected).length;
  const muralCount = state.parcels.filter((p) => p.type === "mural").length;
  const transitCount = state.parcels.filter((p) => p.type === "transit").length;
  const speculatorCount = state.parcels.filter((p) => p.owner === "speculator").length;
  const towerCount = state.parcels.filter((p) => p.type === "tower").length;

  let bonus = 0;
  bonus += ltCount * 3;
  bonus += protectedCount * 2;
  bonus += muralCount * 4;
  bonus += transitCount * 5;
  bonus -= speculatorCount * 3;
  bonus -= towerCount * 2;
  bonus += state.notesRead.size * 1;
  bonus += state.achievements.size * 4;

  // Objectives chosen at start grant their reward if completed
  const objReward = totalObjectiveReward(state, state.objectives);
  bonus += objReward;

  const total = baseEquity + baseHeritage + baseGrowth + baseSustainability + bonus;

  const archetype = chooseArchetype(state);
  const arch = ARCHETYPES[archetype];

  const summary = buildSummary(state, archetype);

  return {
    total,
    equity: baseEquity,
    heritage: baseHeritage,
    growth: baseGrowth,
    sustainability: baseSustainability,
    bonus,
    archetype,
    rank: computeRank(total),
    resident: arch.resident,
    summary,
  };
}

function buildSummary(state: GameState, archetype: ArchetypeKey): string {
  const ltCount = state.parcels.filter((p) => p.type === "land-trust").length;
  const towerCount = state.parcels.filter((p) => p.type === "tower").length;
  const transitCount = state.parcels.filter((p) => p.type === "transit").length;
  const speculatorCount = state.parcels.filter((p) => p.owner === "speculator").length;
  const protectedCount = state.parcels.filter((p) => p.protected).length;
  const totalResidents = state.parcels.reduce((s, p) => s + p.residents, 0);

  const parts: string[] = [];

  parts.push(`Parkhaven in 2040 has ${totalResidents.toLocaleString()} residents across ${state.parcels.length} parcels.`);

  if (protectedCount > 0) parts.push(`${protectedCount} parcels are permanently protected.`);
  if (ltCount > 0) parts.push(`${ltCount} are held in a community land trust.`);
  if (transitCount > 0) parts.push(`${transitCount} sit on the new transit corridor.`);
  if (towerCount > 0) parts.push(`${towerCount} are still public-housing towers.`);
  if (speculatorCount > 0) parts.push(`${speculatorCount} are owned by absentee speculators.`);

  parts.push(`You played ${state.playedCards.length} cards and resolved ${state.resolvedEvents.length} events across ${2040 - 1940} years.`);

  if (state.notesRead.size > 0) {
    parts.push(`You read ${state.notesRead.size} glossary entries during the run.`);
  }

  if (archetype === "reformer") {
    parts.push("The next person to inherit the ward will inherit it with more options than you did.");
  } else if (archetype === "organizer") {
    parts.push("The political infrastructure you built outlasts you. The block clubs meet next week.");
  } else if (archetype === "developer") {
    parts.push("The skyline you built will be on postcards by 2050. The people who walked it in 1940 are not.");
  } else if (archetype === "caretaker") {
    parts.push("You did not change much. That is what kept Parkhaven recognizable to its grandparents.");
  } else if (archetype === "speculator") {
    parts.push("The Cook Center will publish on Parkhaven in 2043. You will not like the conclusion.");
  } else if (archetype === "technocrat") {
    parts.push("Your binder is in the file at City Hall. People still cite it.");
  }

  return parts.join(" ");
}
