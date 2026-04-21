/**
 * Expansion pack of optional objectives.
 *
 * Players may pick up to three objectives at the start of a run. The
 * expansion provides additional goal variety — historical, archetypal,
 * and composed challenges — so that repeated plays explore different
 * constraints.
 */

import type { Objective } from "./objectives";

export const OBJECTIVES_EXPANSION: Objective[] = [
  {
    id: "exp-tower-free-2040",
    name: "Century Without Towers",
    description: "Never build a CHA tower, across the whole run.",
    reward: 70,
    test: (s) => !s.flags.has("tower-built"),
    icon: "shield",
    difficulty: "medium",
  },
  {
    id: "exp-no-expressway-ever",
    name: "No Expressway",
    description: "The expressway flag is never set during this run.",
    reward: 60,
    test: (s) => !s.flags.has("expressway-built"),
    icon: "stop",
    difficulty: "easy",
  },
  {
    id: "exp-covenants-challenge",
    name: "Challenge the Covenants",
    description: "Play the Shelley v. Kraemer amicus card.",
    reward: 40,
    test: (s) => s.flags.has("covenants-challenged"),
    icon: "scale",
    difficulty: "easy",
  },
  {
    id: "exp-summit-enforced",
    name: "Enforce the Summit",
    description: "Insist the 1966 Summit Agreement has enforcement teeth.",
    reward: 60,
    test: (s) => s.flags.has("summit-enforced"),
    icon: "balance",
    difficulty: "medium",
  },
  {
    id: "exp-taylor-opposed",
    name: "Opposed the State Street Vertical",
    description: "Publicly oppose the Robert Taylor siting.",
    reward: 50,
    test: (s) => s.flags.has("taylor-opposed"),
    icon: "stop",
    difficulty: "medium",
  },
  {
    id: "exp-gautreaux-backed",
    name: "Backed Gautreaux",
    description: "Resource the Gautreaux lawsuit from the ward office.",
    reward: 50,
    test: (s) => s.flags.has("gautreaux-backed"),
    icon: "scale",
    difficulty: "medium",
  },
  {
    id: "exp-rle-locked-affordability",
    name: "Locked RLE Affordability",
    description: "Lock station-area affordability before the RLE opens.",
    reward: 80,
    test: (s) => s.flags.has("rle-affordability-locked"),
    icon: "rail",
    difficulty: "hard",
  },
  {
    id: "exp-tif-affordable",
    name: "TIF Did Its Job",
    description: "Run a TIF, but with real affordable-housing allocation attached.",
    reward: 50,
    test: (s) => s.flags.has("tif-active") && s.flags.has("tif-affordable"),
    icon: "balance",
    difficulty: "medium",
  },
  {
    id: "exp-fifty-landtrust",
    name: "Half the Ward in Trust",
    description: "Finish with 50 parcels in a community land trust.",
    reward: 140,
    test: (s) => s.parcels.filter((p) => p.type === "land-trust").length >= 50,
    icon: "handshake",
    difficulty: "hard",
  },
  {
    id: "exp-forty-murals",
    name: "Forty Murals",
    description: "Finish with at least 8 mural parcels and 30+ total murals painted across the run.",
    reward: 60,
    test: (s) => s.parcels.filter((p) => p.type === "mural").length >= 8,
    icon: "monument",
    difficulty: "medium",
  },
  {
    id: "exp-zero-displacement",
    name: "Not One Family",
    description: "Finish with zero parcels having any displacement events.",
    reward: 110,
    test: (s) => s.parcels.every((p) => p.displacementEvents === 0),
    icon: "home",
    difficulty: "hard",
  },
  {
    id: "exp-all-four-80",
    name: "All Four Above 80",
    description: "Finish with every sub-score at 80 or higher.",
    reward: 200,
    test: (s) =>
      s.scores.equity >= 80 &&
      s.scores.heritage >= 80 &&
      s.scores.growth >= 80 &&
      s.scores.sustainability >= 80,
    icon: "trophy",
    difficulty: "hard",
  },
  {
    id: "exp-zero-towers",
    name: "No Towers Standing",
    description: "Finish with zero tower parcels remaining.",
    reward: 50,
    test: (s) => s.parcels.filter((p) => p.type === "tower").length === 0,
    icon: "shield",
    difficulty: "medium",
  },
  {
    id: "exp-resident-growth",
    name: "Population Thriving",
    description: "Finish with more total residents than you started with.",
    reward: 70,
    test: (s) => {
      const total = s.parcels.reduce((sum, p) => sum + p.residents, 0);
      return total >= 500; // starting is about 350; 500+ means healthy growth
    },
    icon: "home",
    difficulty: "medium",
  },
  {
    id: "exp-all-clinics",
    name: "Public Health",
    description: "Build at least 3 clinic parcels.",
    reward: 50,
    test: (s) => s.parcels.filter((p) => p.type === "clinic").length >= 3,
    icon: "home",
    difficulty: "medium",
  },
  {
    id: "exp-libraries-and-schools",
    name: "Learning Infrastructure",
    description: "Finish with at least 2 libraries and 4 schools in good condition.",
    reward: 60,
    test: (s) => {
      const libraries = s.parcels.filter((p) => p.type === "library").length;
      const schools = s.parcels.filter((p) => p.type === "school" && p.condition >= 60).length;
      return libraries >= 2 && schools >= 4;
    },
    icon: "book",
    difficulty: "medium",
  },
  {
    id: "exp-read-everything",
    name: "Comprehensive Reader",
    description: "Read at least 50 glossary entries.",
    reward: 60,
    test: (s) => s.notesRead.size >= 50,
    icon: "book",
    difficulty: "medium",
  },
  {
    id: "exp-hundred-cards",
    name: "A Hundred Cards",
    description: "Play at least 100 cards in one run.",
    reward: 80,
    test: (s) => s.playedCards.length >= 100,
    icon: "deck",
    difficulty: "hard",
  },
  {
    id: "exp-score-350",
    name: "Rank S",
    description: "Finish with a total score of at least 350.",
    reward: 100,
    test: (s) => !!s.finalScore && s.finalScore.total >= 350,
    icon: "trophy",
    difficulty: "hard",
  },
  {
    id: "exp-fifty-events-resolved",
    name: "Crisis Marathon",
    description: "Resolve at least 50 events in a single run.",
    reward: 80,
    test: (s) => s.resolvedEvents.length >= 50,
    icon: "warning",
    difficulty: "hard",
  },
];
