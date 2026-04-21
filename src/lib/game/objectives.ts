/**
 * Optional objectives. A player can opt into one or more at the start
 * of a run. Completing an objective awards bonus points at end-of-game
 * and unlocks a harder objective next run. Skipping objectives is
 * always fine, the game plays the same either way.
 */

import type { GameState } from "./types";
import { OBJECTIVES_EXPANSION } from "./objectives-expansion";

export interface Objective {
  id: string;
  name: string;
  description: string;
  reward: number;
  /** Returns true if this run satisfied the objective. Called at game end. */
  test: (state: GameState) => boolean;
  /** Icon glyph */
  icon: string;
  /** Difficulty band affects color */
  difficulty: "easy" | "medium" | "hard";
}

const OBJECTIVES_CORE: Objective[] = [
  {
    id: "no-tower",
    name: "Tower-Free Century",
    description: "Finish the game without ever building a CHA tower.",
    reward: 60,
    test: (s) => !s.flags.has("tower-built"),
    icon: "shield",
    difficulty: "medium",
  },
  {
    id: "no-expressway",
    name: "Held the Line",
    description: "Refuse the expressway whenever it is offered.",
    reward: 50,
    test: (s) => !s.flags.has("expressway-built"),
    icon: "stop",
    difficulty: "easy",
  },
  {
    id: "land-trust-30",
    name: "Thirty to the Trust",
    description: "Hold 30 parcels in a community land trust at year 2040.",
    reward: 100,
    test: (s) => s.parcels.filter((p) => p.type === "land-trust").length >= 30,
    icon: "handshake",
    difficulty: "hard",
  },
  {
    id: "protected-50",
    name: "Half the Ward",
    description: "Have 50 of 70 parcels permanently protected.",
    reward: 90,
    test: (s) => s.parcels.filter((p) => p.protected).length >= 50,
    icon: "lock",
    difficulty: "hard",
  },
  {
    id: "all-notes",
    name: "Read Everything",
    description: "Read every glossary entry during one run.",
    reward: 40,
    test: (s) => s.notesRead.size >= 30,
    icon: "book",
    difficulty: "medium",
  },
  {
    id: "high-equity",
    name: "Equity at Seventy",
    description: "Finish with Equity score at or above 70.",
    reward: 80,
    test: (s) => s.scores.equity >= 70,
    icon: "scale",
    difficulty: "hard",
  },
  {
    id: "rle-with-overlay",
    name: "Got the Overlays In First",
    description: "Lock preservation overlays before accepting the Red Line Extension.",
    reward: 70,
    test: (s) => s.flags.has("transit-extension") && s.flags.has("preservation-overlay"),
    icon: "rail",
    difficulty: "medium",
  },
  {
    id: "no-speculators",
    name: "No Absentee Capital",
    description: "Finish with no parcels owned by speculators.",
    reward: 50,
    test: (s) => s.parcels.filter((p) => p.owner === "speculator").length === 0,
    icon: "ban",
    difficulty: "medium",
  },
  {
    id: "heritage-60",
    name: "Memory Keeper",
    description: "Finish with Heritage score at or above 60.",
    reward: 60,
    test: (s) => s.scores.heritage >= 60,
    icon: "monument",
    difficulty: "medium",
  },
  {
    id: "fifty-cards",
    name: "Fifty Decisions",
    description: "Play at least 50 cards in one run.",
    reward: 40,
    test: (s) => s.playedCards.length >= 50,
    icon: "deck",
    difficulty: "easy",
  },
  {
    id: "balanced-finish",
    name: "Balanced Scorecard",
    description: "End with all four sub-scores at or above 30.",
    reward: 80,
    test: (s) =>
      s.scores.equity >= 30 &&
      s.scores.heritage >= 30 &&
      s.scores.growth >= 30 &&
      s.scores.sustainability >= 30,
    icon: "balance",
    difficulty: "hard",
  },
  {
    id: "thirty-events",
    name: "Crisis Veteran",
    description: "Resolve at least 30 random events.",
    reward: 50,
    test: (s) => s.resolvedEvents.length >= 30,
    icon: "warning",
    difficulty: "medium",
  },
];

/** Full objective list combining the core objectives with the expansion
 *  pack. Expansion objectives add era-specific and archetype-specific
 *  challenges to encourage replayability. */
export const OBJECTIVES: Objective[] = [...OBJECTIVES_CORE, ...OBJECTIVES_EXPANSION];

export const OBJECTIVES_BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]));

/** Check which objectives were completed in this run */
export function completedObjectives(state: GameState, chosen: string[]): Objective[] {
  return OBJECTIVES.filter((o) => chosen.includes(o.id) && o.test(state));
}

/** Total bonus reward */
export function totalObjectiveReward(state: GameState, chosen: string[]): number {
  return completedObjectives(state, chosen).reduce((sum, o) => sum + o.reward, 0);
}
