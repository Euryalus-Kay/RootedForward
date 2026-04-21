/**
 * Difficulty modes.
 *
 * Tune starting resources, event frequency, drift magnitude, and hand
 * refresh rates to produce a coherent set of difficulty modes:
 *
 *   - Story:     forgiving, great for a first play.
 *   - Standard:  the default. What the rules reward.
 *   - Challenge: tighter resources, faster drift, more events.
 *   - Iron:      unforgiving. Limited redraws, no save scumming.
 *   - Scenario:  curated opening conditions (below).
 *
 * Scenarios are specific curated starting states: the 1940 Bronzeville
 * snapshot, the 1968 post-King-assassination snapshot, the 1995 heat
 * wave, the 2008 foreclosure crisis, etc. These are built by copying
 * the fresh state and overlaying scenario-specific flags and resources.
 */

import type { Resources } from "./types";

export type DifficultyKey = "story" | "standard" | "challenge" | "iron" | "scenario";

export interface DifficultyProfile {
  key: DifficultyKey;
  name: string;
  /** Plain-language summary */
  tagline: string;
  /** Long description of what changes */
  description: string;
  /** Flat adjustment to starting resources */
  resourceBonus: Partial<Resources>;
  /** Multiplier on event probability per year (default 1.0) */
  eventFrequencyMultiplier: number;
  /** Multiplier on drift magnitude (default 1.0) */
  driftMultiplier: number;
  /** Extra cards drawn per year */
  extraDraw: number;
  /** Maximum redraws per turn */
  maxRedraws: number;
  /** Card-cost multiplier (e.g., 0.8 = cheaper cards) */
  costMultiplier: number;
  /** Whether mid-run manual saves are allowed */
  allowManualSave: boolean;
  /** Leaderboard multiplier for final score */
  scoreMultiplier: number;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyProfile> = {
  story: {
    key: "story",
    name: "Story",
    tagline: "Learn the game. See the history.",
    description:
      "Forgiving mode. Extra starting resources, extra card draws, softened drift from past decisions. Events happen but rarely cascade. Great for a first run, or if you want to explore the card library without the score pressure.",
    resourceBonus: { capital: 6, power: 3, trust: 2, knowledge: 2 },
    eventFrequencyMultiplier: 0.6,
    driftMultiplier: 0.5,
    extraDraw: 1,
    maxRedraws: 5,
    costMultiplier: 0.8,
    allowManualSave: true,
    scoreMultiplier: 0.85,
  },
  standard: {
    key: "standard",
    name: "Standard",
    tagline: "The game as designed.",
    description:
      "Default difficulty. The rules that the system is tuned for. This is what scores compare against on the leaderboard.",
    resourceBonus: {},
    eventFrequencyMultiplier: 1.0,
    driftMultiplier: 1.0,
    extraDraw: 0,
    maxRedraws: 3,
    costMultiplier: 1.0,
    allowManualSave: true,
    scoreMultiplier: 1.0,
  },
  challenge: {
    key: "challenge",
    name: "Challenge",
    tagline: "Tight resources. More events. Drift bites.",
    description:
      "Hard mode. Tighter starting resources, more events per turn, stronger drift from earlier decisions. The archetypes that emerge tend to be sharper — there's less room to balance multiple axes.",
    resourceBonus: { capital: -3, power: -2, trust: -1 },
    eventFrequencyMultiplier: 1.4,
    driftMultiplier: 1.5,
    extraDraw: 0,
    maxRedraws: 2,
    costMultiplier: 1.1,
    allowManualSave: true,
    scoreMultiplier: 1.25,
  },
  iron: {
    key: "iron",
    name: "Iron",
    tagline: "Unforgiving. No save scumming.",
    description:
      "Hardest mode. All of Challenge, plus: only one redraw per turn, manual saves disabled (autosave still runs so you can resume a run, but you can't back up and retry). Every choice sticks.",
    resourceBonus: { capital: -5, power: -3, trust: -2 },
    eventFrequencyMultiplier: 1.6,
    driftMultiplier: 2.0,
    extraDraw: 0,
    maxRedraws: 1,
    costMultiplier: 1.2,
    allowManualSave: false,
    scoreMultiplier: 1.5,
  },
  scenario: {
    key: "scenario",
    name: "Scenario",
    tagline: "Curated opening. Specific historical moment.",
    description:
      "Scenario mode starts you in a specific historical moment (see Scenarios). Resources and starting flags are tuned to that moment. Good for history-first players; leaderboard scores are separate.",
    resourceBonus: {},
    eventFrequencyMultiplier: 1.0,
    driftMultiplier: 1.0,
    extraDraw: 0,
    maxRedraws: 3,
    costMultiplier: 1.0,
    allowManualSave: true,
    scoreMultiplier: 1.0,
  },
};

export const DIFFICULTY_LIST: DifficultyProfile[] = [
  DIFFICULTIES.story,
  DIFFICULTIES.standard,
  DIFFICULTIES.challenge,
  DIFFICULTIES.iron,
];

/* ============================================================== *
 *  Scenarios                                                      *
 * ============================================================== */

export interface Scenario {
  key: string;
  title: string;
  year: number;
  /** One-line tease */
  teaser: string;
  /** Long summary */
  body: string;
  /** Starting flag overlays */
  startingFlags: string[];
  /** Starting resource overlays */
  resources?: Partial<Resources>;
  /** Suggested role for this scenario */
  suggestedRole?: string;
  /** Historical ERAs the scenario spans */
  startEra: string;
  source: string;
}

export const SCENARIOS: Scenario[] = [
  {
    key: "scenario-bronzeville-1940",
    title: "Bronzeville 1940",
    year: 1940,
    teaser: "The Great Migration is mid-arrival. The HOLC map is still wet.",
    body:
      "You begin in 1940 Bronzeville. The Great Migration is in its second wave. The HOLC redlining map has just been finalized; the red lines run three blocks north of your office. The Dan Ryan Expressway does not yet exist. The CHA has not yet built a tower. Every choice you make in the next 20 years will echo through the following 80. Baseline difficulty.",
    startingFlags: [],
    startEra: "Lines on a Map",
    source: "Drake and Cayton, Black Metropolis (1945)",
  },
  {
    key: "scenario-1968-aftermath",
    title: "Aftermath of 1968",
    year: 1969,
    teaser: "Dr. King is dead. Fred Hampton is alive. The West Side is recovering.",
    body:
      "You inherit the ward on January 1, 1969. Dr. King was killed nine months ago; the West Side uprisings burned four square miles. Fred Hampton has just been elected chairman of the Illinois Black Panther Party; he has 11 months to live. The Dan Ryan has been open six years. Gautreaux is in federal court. You begin with flags set for the expressway and covenants challenge; your equity score starts low, your knowledge elevated. Your capital is tight.",
    startingFlags: ["expressway-built", "covenants-challenged", "summit-enforced"],
    resources: { capital: -4, knowledge: 3 },
    startEra: "Contracts and Covenants",
    source: "Hirsch, Making the Second Ghetto (1983); Haas, The Assassination of Fred Hampton (2010)",
  },
  {
    key: "scenario-1995-heat",
    title: "The 1995 Heat Wave",
    year: 1995,
    teaser: "The thermometer reads 106°F. Klinenberg has not written the book yet.",
    body:
      "You arrive in the ward the week before the five-day heat wave that will kill 739 Chicagoans. The first pressures are visible: the cooling centers are underfunded, block clubs in the disinvested areas have thinned, the corner stores that used to distribute ice have closed. Your immediate decisions will determine how your ward fares. Starting resources are normal; the crisis-event frequency is elevated for the first three turns.",
    startingFlags: ["tif-active"],
    resources: { knowledge: 2 },
    startEra: "Towers and Renewal",
    source: "Klinenberg, Heat Wave (2002)",
  },
  {
    key: "scenario-2008-foreclosure",
    title: "The Foreclosure Crisis",
    year: 2008,
    teaser: "Lehman is about to fall. Your ward's subprime volume is 40% above the city average.",
    body:
      "You inherit the ward in September 2008. The subprime crisis has just broken wide. Your ward's blocks have been targeted by subprime lenders for a decade; 300 foreclosures are filed in the first quarter alone. Speculators are already circling. Starting resources are tight; starting flags include a TIF and a tower. Your capital is drained from the outset.",
    startingFlags: ["tif-active", "tower-built", "expressway-built"],
    resources: { capital: -6, trust: -1 },
    startEra: "Modern Toolkit",
    source: "Federal Reserve Bank of Chicago subprime crisis reports",
  },
  {
    key: "scenario-2020-covid",
    title: "Pandemic Governance",
    year: 2020,
    teaser: "March 2020. The schools have just closed. Your ward's essential workers are on the L.",
    body:
      "You begin in March 2020 as COVID-19 lockdowns take hold. Your ward's essential workers are disproportionately riding public transit to and from meatpacking and hospitality jobs. Rental assistance is about to flow; your ward's infrastructure determines how much of it actually reaches tenants. Starting resources: slightly elevated capital (federal ERAP flows), tight trust, low power. Difficult to score highly if you don't mobilize fast.",
    startingFlags: ["tif-active", "tower-built", "fast-track-permits"],
    resources: { capital: 4, trust: -2, power: -2 },
    startEra: "Modern Toolkit",
    source: "CDPH COVID-19 response reports; City of Chicago ERAP summary",
  },
  {
    key: "scenario-2035-rle",
    title: "Red Line Extended",
    year: 2035,
    teaser: "The RLE opened two years ago. Rents are up 40% within a half mile. What now?",
    body:
      "You arrive in the ward in 2035, two years after the Red Line Extension station opened. Land values within a half-mile radius are up 40%. Three of your parcels are already in dispute. Pre-station affordability covenants were not locked in; you inherit the consequences. Starting resources are normal; starting flags include expressway, tower, TIF, transit-extension. The score pressure is high.",
    startingFlags: ["tif-active", "tower-built", "expressway-built", "transit-extension", "fast-track-permits"],
    resources: { power: -2 },
    startEra: "Modern Toolkit",
    source: "FTA Red Line Extension records; CTA RLE EIS",
  },
];

export const SCENARIO_BY_KEY: Map<string, Scenario> = new Map(
  SCENARIOS.map((s) => [s.key, s])
);
