/**
 * Starting roles. Each run, the player picks a role. Different roles
 * begin with different resource mixes and have a signature card that
 * enters the deck immediately. Roles radically change the early-game
 * strategy.
 *
 * The role labels are intentionally plain-language because many players
 * will not have prior context on Chicago neighborhood politics.
 */

import type { Resources, CardCategory } from "./types";

export type RoleKey =
  | "alderman"
  | "organizer"
  | "developer"
  | "scholar"
  | "preacher"
  | "journalist";

export interface Role {
  key: RoleKey;
  name: string;
  /** One-line plain-English pitch */
  tagline: string;
  /** Longer explanation of strengths and trade-offs */
  description: string;
  /** Starting resource adjustments relative to the default */
  bonus: Partial<Resources>;
  /** Cards guaranteed in starting hand */
  startingCards: string[];
  /** Passive: extra cards drawn per year */
  extraDraw?: number;
  /** Passive: knowledge gained per note read */
  noteBonus?: number;
  /** Small narrative detail */
  mottoLine: string;
  /** Categories the role's deck favors when drawing. Cards in these
   *  categories are weighted ~3x heavier in the random draw. */
  favors: CardCategory[];
  /** Categories the role's deck never naturally draws. (Player can still
   *  see them via signature starting cards.) */
  avoids?: CardCategory[];
}

export const ROLES: Record<RoleKey, Role> = {
  alderman: {
    key: "alderman",
    name: "The Alderman",
    tagline: "Balanced tools. Political operator first.",
    description:
      "You hold the ward's city-council seat. Medium capital, medium political power, modest community trust. Your strength is versatility. You start nowhere special and end up with room to move.",
    bonus: {},
    startingCards: [],
    favors: ["zoning", "finance", "infrastructure"],
    mottoLine: "Every decision runs through your desk.",
  },
  organizer: {
    key: "organizer",
    name: "The Organizer",
    tagline: "Trust and unions. Few dollars, many friends.",
    description:
      "You run door-to-door. Your hand fills with organizing and tenant-union plays. Plus three Trust and one extra card drawn each turn, but you start with lean capital. You rarely see big-finance or commercial cards.",
    bonus: { trust: 3, capital: -2 },
    startingCards: ["tenant-union", "block-club-revival"],
    extraDraw: 1,
    favors: ["organizing", "housing", "preservation"],
    avoids: ["finance", "commerce"],
    mottoLine: "Power does not come from city hall. It comes from the sidewalk.",
  },
  developer: {
    key: "developer",
    name: "The Developer",
    tagline: "Capital stacks deep. Reputation will come.",
    description:
      "You run a real-estate firm and you just got elected. Plus six Capital and one Power but minus three Trust. Your hand skews commercial, finance, and housing construction. Few organizing cards arrive.",
    bonus: { capital: 6, power: 1, trust: -3 },
    startingCards: ["luxury-tower-deal", "upzone-transit"],
    favors: ["housing", "finance", "commerce", "infrastructure"],
    avoids: ["organizing"],
    mottoLine: "If we do not build here, someone else will build worse.",
  },
  scholar: {
    key: "scholar",
    name: "The Scholar",
    tagline: "Data first. Lessons learned every step.",
    description:
      "You came from a research shop. Plus four Knowledge at the start, plus every glossary note you read gives plus two Knowledge instead of plus one. Your hand leans research and disclosure.",
    bonus: { knowledge: 4, capital: -1 },
    startingCards: ["publish-disparity-study", "document-history"],
    noteBonus: 1,
    favors: ["research", "preservation", "environment"],
    mottoLine: "Show me the data and I will write you a policy.",
  },
  preacher: {
    key: "preacher",
    name: "The Preacher",
    tagline: "Moral authority. Pulpit and pews.",
    description:
      "You have a Sunday congregation and a Monday city council. Plus two Trust, plus two Power. Your hand skews community, cultural, and schools. Capital is thin; you do not fundraise like the other roles.",
    bonus: { trust: 2, power: 2, capital: -2 },
    startingCards: ["neighborhood-mural", "mutual-aid-network"],
    favors: ["culture", "schools", "organizing"],
    mottoLine: "Prayer first. Policy second. Both Sunday.",
  },
  journalist: {
    key: "journalist",
    name: "The Journalist",
    tagline: "Reporting changes minds faster than ordinances.",
    description:
      "You worked at the paper for twenty years. Plus two Knowledge, plus two Power. Your disclosure cards hit harder. Hand favors research and accountability.",
    bonus: { knowledge: 2, power: 2 },
    startingCards: ["redlining-investigation", "challenge-tax-assessment"],
    favors: ["research", "organizing", "preservation"],
    mottoLine: "Facts are leverage. I have a few.",
  },
};

export const ROLE_LIST: Role[] = Object.values(ROLES);

/** Apply a role's bonus to base resources */
export function applyRoleBonus(base: Resources, role: Role): Resources {
  return {
    capital: Math.max(0, base.capital + (role.bonus.capital ?? 0)),
    power: Math.max(0, base.power + (role.bonus.power ?? 0)),
    trust: Math.max(0, base.trust + (role.bonus.trust ?? 0)),
    knowledge: Math.max(0, base.knowledge + (role.bonus.knowledge ?? 0)),
  };
}
