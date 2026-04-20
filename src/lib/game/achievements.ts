/**
 * Achievements are unlocked at runtime based on game state. They give the
 * player something to discover across replays. Hidden achievements are
 * not shown until earned, encouraging exploration.
 */

import type { Achievement, GameState } from "./types";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-card",
    name: "First Decision",
    description: "Play your first card.",
    icon: "card",
  },
  {
    id: "complete-game",
    name: "A Century in Twenty Minutes",
    description: "Reach 2040.",
    icon: "calendar",
  },
  {
    id: "no-tower",
    name: "Tower-Free",
    description: "Reach 1980 without building a CHA tower.",
    icon: "shield",
    hidden: true,
  },
  {
    id: "no-expressway",
    name: "Held the Line",
    description: "Refuse the expressway.",
    icon: "shield",
    hidden: true,
  },
  {
    id: "all-blocks-protected",
    name: "Six for Six",
    description: "Have at least one protected parcel in every block.",
    icon: "lock",
    hidden: true,
  },
  {
    id: "land-trust-25",
    name: "Land Bank",
    description: "Hold 25 parcels in a community land trust.",
    icon: "trust",
    hidden: true,
  },
  {
    id: "ten-notes-read",
    name: "Curious Mind",
    description: "Read 10 glossary notes.",
    icon: "book",
  },
  {
    id: "twenty-notes-read",
    name: "Local Historian",
    description: "Read 20 glossary notes.",
    icon: "book",
  },
  {
    id: "all-notes-read",
    name: "Cited Source",
    description: "Read every glossary entry.",
    icon: "book",
    hidden: true,
  },
  {
    id: "high-equity",
    name: "The Reformer's Path",
    description: "Finish with equity score above 60.",
    icon: "scale",
  },
  {
    id: "high-heritage",
    name: "Memory Keeper",
    description: "Finish with heritage score above 60.",
    icon: "monument",
  },
  {
    id: "high-growth",
    name: "Builder",
    description: "Finish with growth score above 60.",
    icon: "construction",
  },
  {
    id: "balanced",
    name: "Balanced Scorecard",
    description: "Finish with all four sub-scores above 30.",
    icon: "balance",
  },
  {
    id: "reformer-archetype",
    name: "Reformer",
    description: "End the game as the Reformer archetype.",
    icon: "torch",
  },
  {
    id: "organizer-archetype",
    name: "Organizer",
    description: "End the game as the Organizer archetype.",
    icon: "raised-fist",
  },
  {
    id: "developer-archetype",
    name: "Developer",
    description: "End the game as the Developer archetype.",
    icon: "tower",
  },
  {
    id: "speculator-archetype",
    name: "Speculator",
    description: "End the game as the Speculator archetype.",
    icon: "money",
    hidden: true,
  },
  {
    id: "caretaker-archetype",
    name: "Caretaker",
    description: "End the game as the Caretaker archetype.",
    icon: "tree",
  },
  {
    id: "technocrat-archetype",
    name: "Technocrat",
    description: "End the game as the Technocrat archetype.",
    icon: "data",
    hidden: true,
  },
  {
    id: "leaderboard-top10",
    name: "Top Ten",
    description: "Place in the top 10 on the leaderboard.",
    icon: "trophy",
  },
  {
    id: "play-twenty-cards",
    name: "Heavy Hand",
    description: "Play 20 cards in a single run.",
    icon: "deck",
  },
  {
    id: "play-fifty-cards",
    name: "Fifty Decisions",
    description: "Play 50 cards in a single run.",
    icon: "deck",
    hidden: true,
  },
  {
    id: "no-displacement",
    name: "Held Together",
    description: "Finish with no parcel having displacement events above 1.",
    icon: "home",
    hidden: true,
  },
  {
    id: "preserve-everything",
    name: "Conservator",
    description: "Have over 30 protected parcels.",
    icon: "lock",
    hidden: true,
  },
  {
    id: "max-knowledge",
    name: "Knowledge Cap",
    description: "Reach 20 Knowledge.",
    icon: "owl",
  },
  {
    id: "first-event",
    name: "First Crisis",
    description: "Resolve your first random event.",
    icon: "warning",
  },
  {
    id: "ten-events",
    name: "Crisis Manager",
    description: "Resolve 10 random events.",
    icon: "warning",
  },
  {
    id: "rle-with-overlay",
    name: "Got the Overlays In First",
    description: "Lock preservation overlays before accepting the Red Line Extension.",
    icon: "rail",
    hidden: true,
  },
];

export const ACHIEVEMENT_BY_ID: Map<string, Achievement> = new Map(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

/** Check what achievements should be unlocked from current state */
export function checkNewAchievements(state: GameState): string[] {
  const earned: string[] = [];
  const has = (id: string) => state.achievements.has(id);

  if (state.playedCards.length >= 1 && !has("first-card")) earned.push("first-card");
  if (state.playedCards.length >= 20 && !has("play-twenty-cards")) earned.push("play-twenty-cards");
  if (state.playedCards.length >= 50 && !has("play-fifty-cards")) earned.push("play-fifty-cards");

  if (state.resolvedEvents.length >= 1 && !has("first-event")) earned.push("first-event");
  if (state.resolvedEvents.length >= 10 && !has("ten-events")) earned.push("ten-events");

  if (state.notesRead.size >= 10 && !has("ten-notes-read")) earned.push("ten-notes-read");
  if (state.notesRead.size >= 20 && !has("twenty-notes-read")) earned.push("twenty-notes-read");

  // tower-free: reached 1980 with no tower
  if (state.year >= 1980 && !state.flags.has("tower-built") && !has("no-tower")) {
    earned.push("no-tower");
  }
  // no expressway
  if (state.year >= 1965 && !state.flags.has("expressway-built") && !has("no-expressway")) {
    earned.push("no-expressway");
  }
  // all blocks protected
  const protectedBlocks = new Set(state.parcels.filter((p) => p.protected).map((p) => p.block));
  if (protectedBlocks.size === 6 && !has("all-blocks-protected")) earned.push("all-blocks-protected");

  // land trust 25
  const ltCount = state.parcels.filter((p) => p.type === "land-trust").length;
  if (ltCount >= 25 && !has("land-trust-25")) earned.push("land-trust-25");

  // 30 protected parcels
  const protectedCount = state.parcels.filter((p) => p.protected).length;
  if (protectedCount >= 30 && !has("preserve-everything")) earned.push("preserve-everything");

  // knowledge cap
  if (state.resources.knowledge >= 20 && !has("max-knowledge")) earned.push("max-knowledge");

  if (state.year >= 2040 && !has("complete-game")) earned.push("complete-game");

  // RLE with overlay
  if (state.flags.has("transit-extension") && state.flags.has("preservation-overlay") && !has("rle-with-overlay")) {
    earned.push("rle-with-overlay");
  }

  return earned;
}
