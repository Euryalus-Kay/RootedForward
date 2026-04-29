import { CARD_BY_ID } from "./cards";
import { RNG } from "./rng";
import type { GameState, Parcel, Resources, Scores, ToastMessage } from "./types";

type Tone = "good" | "warn" | "danger" | "neutral";

export interface PressureMeter {
  key: "marketHeat" | "residentShield" | "coalition" | "fiscalStress";
  label: string;
  value: number;
  tone: Tone;
  description: string;
}

export interface StrategyPressureReport {
  marketHeat: number;
  residentShield: number;
  coalition: number;
  fiscalStress: number;
  vulnerableParcels: number;
  speculatorParcels: number;
  displacementParcels: number;
  protectedParcels: number;
  meters: PressureMeter[];
}

export interface StrategyPressureOutcome {
  parcels: Parcel[];
  scoreDelta: Partial<Scores>;
  resourceDelta: Partial<Resources>;
  messages: Array<{ kind: ToastMessage["kind"]; text: string }>;
  affectedParcelIds: number[];
}

const housingTypes = new Set<Parcel["type"]>([
  "single-family",
  "two-flat",
  "three-flat",
  "courtyard",
  "tower",
  "rehab-tower",
  "land-trust",
]);

const civicTypes = new Set<Parcel["type"]>([
  "school",
  "church",
  "library",
  "clinic",
  "park",
  "community-garden",
  "mural",
]);

const heatFlags = [
  "tif-active",
  "transit-extension",
  "tod-upzoning",
  "fast-track-permits",
  "tax-abatement-active",
  "market-rate-tower",
];

const shieldFlags = [
  "preservation-overlay",
  "tif-affordable",
  "tif-sunset",
  "rtc-active",
  "good-cause-active",
  "topa-active",
  "anti-flip-tax",
  "cba-active",
  "coalition-active",
  "rle-affordability-locked",
  "606-mitigated",
];

const coalitionFlags = [
  "tenant-union-active",
  "topa-active",
  "cba-active",
  "coalition-active",
  "pb-active",
  "community-schools-active",
  "violence-interrupters-active",
];

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function hasAny(flags: Set<string>, values: string[]): boolean {
  return values.some((v) => flags.has(v));
}

function flagCount(flags: Set<string>, values: string[]): number {
  return values.filter((v) => flags.has(v)).length;
}

function recentCards(state: GameState, years = 15) {
  return state.playedCards
    .filter((p) => state.year - p.year <= years)
    .map((p) => CARD_BY_ID.get(p.cardId))
    .filter(Boolean);
}

function meterTone(key: PressureMeter["key"], value: number): Tone {
  if (key === "marketHeat" || key === "fiscalStress") {
    if (value >= 70) return "danger";
    if (value >= 45) return "warn";
    return "good";
  }
  if (value >= 65) return "good";
  if (value >= 35) return "neutral";
  return "warn";
}

function vulnerable(p: Parcel): boolean {
  if (p.protected) return false;
  if (!housingTypes.has(p.type)) return false;
  if (p.residents <= 0) return false;
  if (p.owner === "land-trust" || p.owner === "city" || p.owner === "cha") return false;
  return p.owner === "absentee" || p.value >= 55 || p.condition <= 42 || p.memory <= 45;
}

export function computeStrategyPressure(state: GameState): StrategyPressureReport {
  const parcels = state.parcels;
  const total = Math.max(1, parcels.length);
  const avgValue = parcels.reduce((sum, p) => sum + p.value, 0) / total;
  const protectedParcels = parcels.filter((p) => p.protected || p.owner === "land-trust" || p.type === "land-trust").length;
  const landTrustParcels = parcels.filter((p) => p.owner === "land-trust" || p.type === "land-trust").length;
  const speculatorParcels = parcels.filter((p) => p.owner === "speculator").length;
  const displacementParcels = parcels.filter((p) => p.displacementEvents > 0).length;
  const civicAnchors = parcels.filter((p) => civicTypes.has(p.type)).length;
  const vulnerableParcels = parcels.filter(vulnerable).length;

  const recent = recentCards(state);
  const recentGrowth = recent.reduce((sum, card) => sum + Math.max(0, card?.effect.growth ?? 0), 0);
  const recentOrganizing = recent.filter((card) => card?.category === "organizing" || card?.category === "preservation").length;
  const recentHeatCards = recent.filter((card) =>
    card &&
    (card.category === "finance" ||
      card.category === "housing" ||
      card.category === "zoning" ||
      card.category === "transit" ||
      card.category === "infrastructure") &&
    (card.effect.growth ?? 0) > 0
  ).length;

  const heat = clamp(
    avgValue * 0.42 +
      speculatorParcels * 5 +
      displacementParcels * 2.5 +
      vulnerableParcels * 0.55 +
      recentGrowth * 3.2 +
      recentHeatCards * 5 +
      flagCount(state.flags, heatFlags) * 9 -
      flagCount(state.flags, ["tif-affordable", "tif-sunset", "rle-affordability-locked", "606-mitigated"]) * 8
  );

  const shield = clamp(
    state.resources.trust * 4.8 +
      protectedParcels * 4.8 +
      landTrustParcels * 5.5 +
      civicAnchors * 1.8 +
      flagCount(state.flags, shieldFlags) * 8 +
      recentOrganizing * 4
  );

  const coalition = clamp(
    state.resources.trust * 6 +
      state.resources.power * 2.4 +
      recentOrganizing * 7 +
      flagCount(state.flags, coalitionFlags) * 9 -
      (state.flags.has("policing-heavy") ? 16 : 0)
  );

  const fiscalStress = clamp(
    56 -
      state.resources.capital * 4.5 -
      state.resources.power * 1.2 +
      (state.flags.has("tif-active") && !hasAny(state.flags, ["tif-affordable", "tif-sunset"]) ? 14 : 0) +
      (state.flags.has("tax-abatement-active") ? 16 : 0) +
      (state.flags.has("ada-deferred") ? 8 : 0)
  );

  const meters: PressureMeter[] = [
    {
      key: "marketHeat",
      label: "Market heat",
      value: Math.round(heat),
      tone: meterTone("marketHeat", heat),
      description: heat > shield
        ? "Unprotected blocks are attractive to speculators."
        : "Growth pressure is contained for now.",
    },
    {
      key: "residentShield",
      label: "Resident shield",
      value: Math.round(shield),
      tone: meterTone("residentShield", shield),
      description: shield >= heat
        ? "Tenant protections and community ownership are absorbing pressure."
        : "The ward needs stronger protections before the next growth push.",
    },
    {
      key: "coalition",
      label: "Coalition",
      value: Math.round(coalition),
      tone: meterTone("coalition", coalition),
      description: coalition >= 45
        ? "You have enough organized power to survive harder fights."
        : "Low trust makes expensive reforms easier to block.",
    },
    {
      key: "fiscalStress",
      label: "Budget strain",
      value: Math.round(fiscalStress),
      tone: meterTone("fiscalStress", fiscalStress),
      description: fiscalStress >= 55
        ? "The budget is tight enough to make risky money tempting."
        : "You can fund choices without leaning on extractive shortcuts.",
    },
  ];

  return {
    marketHeat: Math.round(heat),
    residentShield: Math.round(shield),
    coalition: Math.round(coalition),
    fiscalStress: Math.round(fiscalStress),
    vulnerableParcels,
    speculatorParcels,
    displacementParcels,
    protectedParcels,
    meters,
  };
}

export function resolveStrategyPressure(state: GameState, rng: RNG): StrategyPressureOutcome {
  const report = computeStrategyPressure(state);
  let parcels = state.parcels;
  const scoreDelta: Partial<Scores> = {};
  const resourceDelta: Partial<Resources> = {};
  const messages: StrategyPressureOutcome["messages"] = [];
  const affectedParcelIds: number[] = [];
  const pressureGap = report.marketHeat - report.residentShield;

  if (pressureGap >= 16) {
    const targets = parcels.filter(vulnerable);
    const count = Math.min(targets.length, Math.max(1, Math.min(3, Math.floor(pressureGap / 18))));
    const selected = rng.sample(targets.map((p) => p.id), count);
    const selectedSet = new Set(selected);

    if (selected.length > 0) {
      parcels = parcels.map((p) => {
        if (!selectedSet.has(p.id)) return p;
        const moved = Math.max(1, Math.round(p.residents * (pressureGap >= 35 ? 0.45 : 0.25)));
        return {
          ...p,
          owner: "speculator",
          value: clamp(p.value + rng.intBetween(6, 13)),
          memory: clamp(p.memory - rng.intBetween(10, 20)),
          residents: Math.max(0, p.residents - moved),
          displacementEvents: p.displacementEvents + 1,
        };
      });
      affectedParcelIds.push(...selected);
      scoreDelta.equity = (scoreDelta.equity ?? 0) - selected.length;
      scoreDelta.heritage = (scoreDelta.heritage ?? 0) - Math.ceil(selected.length / 2);
      scoreDelta.growth = (scoreDelta.growth ?? 0) + 0.5;
      resourceDelta.capital = (resourceDelta.capital ?? 0) + Math.min(2, selected.length);
      messages.push({
        kind: "warn",
        text: `Market heat flipped ${selected.length} unprotected parcel${selected.length === 1 ? "" : "s"} to speculators.`,
      });
    }
  }

  if (report.residentShield >= report.marketHeat + 18 && report.coalition >= 42) {
    const stable = parcels.filter((p) => housingTypes.has(p.type) && p.residents > 0 && p.owner !== "speculator");
    const selected = rng.sample(stable.map((p) => p.id), Math.min(4, stable.length));
    const selectedSet = new Set(selected);
    if (selected.length > 0) {
      parcels = parcels.map((p) => (
        selectedSet.has(p.id)
          ? { ...p, condition: clamp(p.condition + 3), memory: clamp(p.memory + 5) }
          : p
      ));
      scoreDelta.equity = (scoreDelta.equity ?? 0) + 1;
      scoreDelta.heritage = (scoreDelta.heritage ?? 0) + 1;
      resourceDelta.trust = (resourceDelta.trust ?? 0) + 1;
      messages.push({
        kind: "good",
        text: "Resident shield held. Stable blocks gained memory and trust.",
      });
    }
  }

  if (report.coalition < 26 && report.marketHeat >= 55) {
    scoreDelta.equity = (scoreDelta.equity ?? 0) - 1;
    resourceDelta.power = (resourceDelta.power ?? 0) - 1;
    messages.push({
      kind: "warn",
      text: "Coalition power is thin. Real-estate pressure is harder to resist this turn.",
    });
  }

  if (report.fiscalStress >= 70 && !state.flags.has("tif-sunset")) {
    scoreDelta.sustainability = (scoreDelta.sustainability ?? 0) - 0.5;
    messages.push({
      kind: "info",
      text: "Budget strain delayed maintenance across the ward.",
    });
  }

  return { parcels, scoreDelta, resourceDelta, messages, affectedParcelIds };
}
