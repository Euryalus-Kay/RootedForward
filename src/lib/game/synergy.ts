/**
 * Synergy combinations. End-of-game bonus logic that rewards coherent
 * strategic arcs across decades, not just one-off card plays.
 *
 * Each synergy is a combination of flags (or flag-absence) that, when
 * satisfied, awards a bonus to the final score. They are:
 *   - identifiable only in hindsight (some only at year 2040)
 *   - tuned so a "balanced" run might hit 3-5; a specialist 5-8
 *   - all positive (they reward strategy, not punish)
 *
 * The combo bonuses are additive to the existing score math in
 * scoring.ts (which already handles base scores and parcel bonuses).
 * Each combo is worth 20 to 80 points — meaningful but not dominant
 * versus the 300-500 baseline a good run already produces.
 */

import type { GameState } from "./types";

export interface SynergyCombo {
  id: string;
  name: string;
  /** Short explanation of what made this combo fire */
  description: string;
  /** Bonus points awarded when combo hits */
  bonus: number;
  /** Returns true when the run qualifies for this combo */
  test: (state: GameState) => boolean;
  /** Category tag for UI grouping */
  category: "reform" | "preservation" | "climate" | "anti-displacement" | "avoidance" | "historical" | "mixed";
}

const hasAll = (flags: Set<string>, ...needed: string[]) => needed.every((f) => flags.has(f));
const hasNone = (flags: Set<string>, ...forbidden: string[]) => forbidden.every((f) => !flags.has(f));
const hasAny = (flags: Set<string>, ...options: string[]) => options.some((f) => flags.has(f));

export const SYNERGIES: SynergyCombo[] = [
  /* ================ Reform stack ================================ */
  {
    id: "full-reform-stack",
    name: "Full reform stack",
    description:
      "Reparations, baby bonds, guaranteed income, right to counsel, and good-cause eviction all in place.",
    bonus: 80,
    category: "reform",
    test: (s) =>
      hasAll(
        s.flags,
        "reparations-passed",
        "baby-bonds-active",
        "gi-pilot-active",
        "rtc-active",
        "good-cause-active"
      ),
  },
  {
    id: "tenant-protection-core",
    name: "Tenant protection core",
    description: "Right to counsel plus good-cause eviction — the two levers that most reduce displacement.",
    bonus: 30,
    category: "anti-displacement",
    test: (s) => hasAll(s.flags, "rtc-active", "good-cause-active"),
  },
  {
    id: "wealth-floor",
    name: "Wealth floor established",
    description: "Baby bonds plus guaranteed income gives every resident some starting wealth and floor income.",
    bonus: 40,
    category: "reform",
    test: (s) => hasAll(s.flags, "baby-bonds-active", "gi-pilot-active"),
  },

  /* ================ Climate stack =============================== */
  {
    id: "climate-resilience-stack",
    name: "Climate resilience stack",
    description:
      "Climate plan, heat-island mitigation, green infrastructure, and solar co-op — a comprehensive adaptation arc.",
    bonus: 60,
    category: "climate",
    test: (s) =>
      hasAll(
        s.flags,
        "climate-plan-active",
        "heat-mitigation-active",
        "green-infrastructure",
        "solar-coop-active"
      ),
  },
  {
    id: "climate-plus-equity",
    name: "Just transition",
    description: "Climate adaptation layered with guaranteed income and energy co-op ensures the transition is equitable.",
    bonus: 30,
    category: "climate",
    test: (s) =>
      hasAll(s.flags, "climate-plan-active", "gi-pilot-active", "solar-coop-active"),
  },

  /* ================ Anti-displacement =========================== */
  {
    id: "anti-displacement-complete",
    name: "Anti-displacement complete",
    description:
      "RLE affordability locked + 606-style mitigation + right-to-counsel + good-cause eviction — displacement pressure on every axis contained.",
    bonus: 60,
    category: "anti-displacement",
    test: (s) =>
      hasAll(
        s.flags,
        "rle-affordability-locked",
        "606-mitigated",
        "rtc-active",
        "good-cause-active"
      ),
  },
  {
    id: "transit-without-displacement",
    name: "Transit without displacement",
    description: "Transit extended AND affordability locked before the station opened. The hard version of the trade-off.",
    bonus: 40,
    category: "anti-displacement",
    test: (s) => hasAll(s.flags, "transit-extension", "rle-affordability-locked"),
  },

  /* ================ Preservation ================================ */
  {
    id: "preservation-stack",
    name: "Preservation stack",
    description: "Preservation overlay plus cultural-district designation protects both buildings and the culture inside them.",
    bonus: 35,
    category: "preservation",
    test: (s) => hasAll(s.flags, "preservation-overlay", "cultural-district"),
  },
  {
    id: "land-stewardship",
    name: "Community land stewardship",
    description: "Active land bank with meaningful land-trust parcel count.",
    bonus: 30,
    category: "preservation",
    test: (s) =>
      s.flags.has("land-bank-active") &&
      s.parcels.filter((p) => p.type === "land-trust" || p.owner === "land-trust").length >= 15,
  },

  /* ================ Historical arcs ============================= */
  {
    id: "fair-housing-arc",
    name: "Fair-housing arc",
    description:
      "Covenants challenged (1948), Summit enforced (1966), Gautreaux backed (1966-76). Three decades of fair-housing work connected.",
    bonus: 50,
    category: "historical",
    test: (s) => hasAll(s.flags, "covenants-challenged", "summit-enforced", "gautreaux-backed"),
  },
  {
    id: "public-housing-alternative",
    name: "Public housing done right",
    description:
      "Opposed the Robert Taylor siting AND rehabbed (not demolished) the towers that did get built. The road not taken.",
    bonus: 50,
    category: "historical",
    test: (s) => hasAll(s.flags, "taylor-opposed", "tower-rehabbed"),
  },
  {
    id: "industrial-transition-complete",
    name: "Industrial transition completed",
    description: "Pre-planned the 1970s layoffs, then backed municipal lending — growth without displacement.",
    bonus: 35,
    category: "historical",
    test: (s) => hasAll(s.flags, "industrial-transition-plan", "municipal-lending"),
  },

  /* ================ Avoidance bonuses =========================== */
  {
    id: "tower-free-century",
    name: "Tower-free century",
    description: "Reached 2040 without ever agreeing to a CHA tower.",
    bonus: 50,
    category: "avoidance",
    test: (s) => s.year >= 2040 && hasNone(s.flags, "tower-built"),
  },
  {
    id: "expressway-refused",
    name: "Expressway refused",
    description: "The expressway never ran through your ward.",
    bonus: 40,
    category: "avoidance",
    test: (s) => s.year >= 2000 && hasNone(s.flags, "expressway-built"),
  },
  {
    id: "no-heavy-policing",
    name: "Never turned on heavy policing",
    description: "You refused the easy law-and-order lever across the whole run.",
    bonus: 25,
    category: "avoidance",
    test: (s) => s.year >= 2000 && hasNone(s.flags, "policing-heavy"),
  },
  {
    id: "no-speculator-capture",
    name: "No speculator capture",
    description: "Reached 2040 with zero speculator-owned parcels.",
    bonus: 30,
    category: "avoidance",
    test: (s) => s.year >= 2040 && s.parcels.filter((p) => p.owner === "speculator").length === 0,
  },

  /* ================ Mixed / advanced ============================ */
  {
    id: "equity-tools-quintuple",
    name: "Five equity tools in place",
    description: "Five or more of: reparations, baby bonds, GI, RTC, good-cause, participatory budgeting, community schools.",
    bonus: 40,
    category: "reform",
    test: (s) => {
      const equityFlags = [
        "reparations-passed",
        "baby-bonds-active",
        "gi-pilot-active",
        "rtc-active",
        "good-cause-active",
        "pb-active",
        "community-schools-active",
      ];
      return equityFlags.filter((f) => s.flags.has(f)).length >= 5;
    },
  },
  {
    id: "balanced-run",
    name: "Balanced ward",
    description: "Every sub-score above 30 and no negative drift flags active.",
    bonus: 35,
    category: "mixed",
    test: (s) =>
      s.scores.equity >= 30 &&
      s.scores.heritage >= 30 &&
      s.scores.growth >= 30 &&
      s.scores.sustainability >= 30 &&
      hasNone(
        s.flags,
        "expressway-built",
        "fast-track-permits",
        "tax-abatement-active",
        "policing-heavy"
      ),
  },
  {
    id: "cra-pay-off",
    name: "CRA office pays off",
    description: "Your CRA office in 1977 plus municipal lending from 1940s — capital flows where it was refused.",
    bonus: 30,
    category: "historical",
    test: (s) => hasAll(s.flags, "cra-office", "municipal-lending"),
  },
  {
    id: "read-every-era",
    name: "Local historian",
    description: "Read 30+ glossary entries across the run.",
    bonus: 20,
    category: "mixed",
    test: (s) => s.notesRead.size >= 30,
  },
  {
    id: "strategic-tif",
    name: "Strategic TIF",
    description: "TIF used, but with affordability allocation — growth engine that wasn't just extraction.",
    bonus: 25,
    category: "reform",
    test: (s) => hasAll(s.flags, "tif-active", "tif-affordable"),
  },
  {
    id: "cultural-anchor",
    name: "Cultural anchor",
    description: "Cultural district plus at least 5 mural parcels and 3 protected blocks.",
    bonus: 25,
    category: "preservation",
    test: (s) => {
      const murals = s.parcels.filter((p) => p.type === "mural").length;
      const protectedBlocks = new Set(s.parcels.filter((p) => p.protected).map((p) => p.block)).size;
      return s.flags.has("cultural-district") && murals >= 5 && protectedBlocks >= 3;
    },
  },
];

/** Compute which synergies fire and the total bonus. */
export function checkSynergies(state: GameState): {
  fired: SynergyCombo[];
  totalBonus: number;
} {
  const fired = SYNERGIES.filter((s) => s.test(state));
  const totalBonus = fired.reduce((sum, s) => sum + s.bonus, 0);
  return { fired, totalBonus };
}
