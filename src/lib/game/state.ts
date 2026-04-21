/**
 * Game state machine. The state is held by useReducer in the GameRoot
 * component. Every action goes through the reducer here. The reducer
 * is pure - it derives the next state from the current state and an
 * action. All side effects (API calls, timers) live in the components.
 */

import { availableCards, CARD_BY_ID, CARDS, effectiveCost } from "./cards";
import { eligibleEvents, checkCrisisTriggers, EVENT_BY_ID, EVENTS } from "./events";
import { generateInitialParcels, applyTransforms, simulateYear } from "./parcels";
import { GLOSSARY } from "./glossary";
import { checkNewAchievements, ACHIEVEMENT_BY_ID } from "./achievements";
import { computeFinalScore } from "./scoring";
import { RNG, generateSeed } from "./rng";
import { ROLES, applyRoleBonus, type RoleKey } from "./roles";
import { FACTION_LIST } from "./factions";
import type {
  GameAction,
  GameEvent,
  GameState,
  Resources,
  ToastMessage,
} from "./types";

const STARTING_RESOURCES: Resources = {
  capital: 12,
  power: 8,
  trust: 6,
  knowledge: 3,
};

const STARTING_HAND_SIZE = 5;
const DRAW_PER_YEAR = 3;
const MAX_HAND = 7;
/** End-of-year trim target: hand is auto-trimmed (oldest discarded) to
 *  this size before the new draws come in. Prevents un-affordable cards
 *  from piling up indefinitely. */
const END_TURN_TRIM_TO = 4;
export const YEAR_STEP = 5;
export const END_YEAR_FINAL = 2040;

/** Lasting per-turn drift on scores from flags set by earlier decisions.
 *  Returned as labeled lines so the UI can show the player exactly what
 *  is happening to their scores each turn. */
export interface DriftLine {
  flag: string;
  description: string;
  equity: number;
  heritage: number;
  growth: number;
  sustainability: number;
}

export function computeDrift(state: { flags: Set<string> }): DriftLine[] {
  const out: DriftLine[] = [];
  if (state.flags.has("expressway-built")) {
    out.push({ flag: "expressway-built", description: "Expressway you approved is still polluting", equity: 0, heritage: -1, growth: 0, sustainability: -1 });
  }
  if (state.flags.has("tower-built")) {
    out.push({ flag: "tower-built", description: "CHA towers you built keep deteriorating", equity: 0, heritage: -0.5, growth: 0, sustainability: 0 });
  }
  if (state.flags.has("tax-abatement-active")) {
    out.push({ flag: "tax-abatement-active", description: "Tax abatement is starving the school fund", equity: -0.5, heritage: 0, growth: 0, sustainability: 0 });
  }
  if (state.flags.has("fast-track-permits")) {
    out.push({ flag: "fast-track-permits", description: "Fast-track luxury permits are pushing rents up", equity: -1, heritage: 0, growth: 0, sustainability: 0 });
  }
  if (state.flags.has("policing-heavy")) {
    out.push({ flag: "policing-heavy", description: "Heavy policing is eroding community trust", equity: -0.5, heritage: 0, growth: 0, sustainability: 0 });
  }
  if (state.flags.has("tif-active") && !state.flags.has("tif-affordable")) {
    out.push({ flag: "tif-active", description: "TIF without affordable allocation", equity: -0.5, heritage: 0, growth: 0, sustainability: 0 });
  }
  if (state.flags.has("preservation-overlay")) {
    out.push({ flag: "preservation-overlay", description: "Preservation overlays still working", equity: 0, heritage: 1, growth: 0, sustainability: 0 });
  }
  if (state.flags.has("transit-extension") && !state.flags.has("preservation-overlay")) {
    out.push({ flag: "transit-extension", description: "Transit station displacing residents", equity: -1, heritage: 0, growth: 0, sustainability: 0 });
  }
  return out;
}

export function freshState(): GameState {
  const initFactions: Record<string, number> = {};
  for (const f of FACTION_LIST) initFactions[f.key] = 50;
  return {
    phase: "menu",
    year: 1940,
    seed: "",
    displayName: "",
    roleKey: "alderman",
    objectives: [],
    resources: { ...STARTING_RESOURCES },
    scores: { equity: 0, heritage: 0, growth: 0, sustainability: 0 },
    parcels: [],
    hand: [],
    drawnCards: [],
    playedCards: [],
    resolvedEvents: [],
    factions: initFactions,
    flags: new Set(),
    currentEvent: null,
    achievements: new Set(),
    notesRead: new Set(),
    selectedCard: null,
    drawPerYear: DRAW_PER_YEAR,
    handSize: MAX_HAND,
    tutorialStep: -1,
    messages: [],
    yearAdvanced: false,
    redrawsThisTurn: 0,
    startedAt: 0,
    hintsDismissed: new Set(),
  };
}

let messageCounter = 0;
function nextMessageId() { messageCounter++; return `msg-${messageCounter}-${Date.now()}`; }

function pushMessage(state: GameState, kind: ToastMessage["kind"], text: string): GameState {
  return {
    ...state,
    messages: [
      ...state.messages,
      { id: nextMessageId(), kind, text, ttl: 4000 },
    ].slice(-6),
  };
}

function drawCards(state: GameState, n: number, rng: RNG): GameState {
  if (state.hand.length >= state.handSize) return state;
  const available = availableCards(state.year, state.flags);
  // Don't redraw cards already in hand OR already played this run
  const playedIds = new Set(state.playedCards.map((p) => p.cardId));
  const candidates = available.filter((c) => !state.hand.includes(c.id) && !playedIds.has(c.id));
  if (candidates.length === 0) return state;

  // Lookup the player's role to apply category weighting
  const role = ROLES[state.roleKey as RoleKey] ?? ROLES.alderman;
  const favored = new Set(role.favors);
  const avoided = new Set(role.avoids ?? []);

  // Filter cards explicitly excluded for this role, and cards
  // restricted to other roles
  const eligible = candidates.filter((c) => {
    if (c.excludeRoles && c.excludeRoles.includes(state.roleKey)) return false;
    if (c.onlyRoles && c.onlyRoles.length > 0 && !c.onlyRoles.includes(state.roleKey)) return false;
    return true;
  });
  if (eligible.length === 0) return state;

  // Weight by rarity * role-affinity
  const weighted = eligible.flatMap((c) => {
    let w = c.rarity === "common" ? 8
          : c.rarity === "uncommon" ? 4
          : c.rarity === "rare" ? 2
          : 1;
    if (favored.has(c.category)) w *= 3;
    if (avoided.has(c.category)) w = Math.max(1, Math.floor(w / 4));
    return Array(w).fill(c.id);
  });

  // Try to draw `n` unique cards. If `rng.pick` returns a duplicate, retry
  // up to a generous cap before giving up. This fixes a subtle bug where
  // the loop previously exited after `n` attempts regardless of success,
  // producing undersized hands when the weighted pool had many duplicates.
  const drawn: string[] = [];
  let attempts = 0;
  const maxAttempts = Math.max(32, n * 8);
  while (drawn.length < n && state.hand.length + drawn.length < state.handSize && attempts < maxAttempts) {
    attempts++;
    const id = rng.pick(weighted);
    if (!id) break;
    if (drawn.includes(id)) continue;
    if (state.hand.includes(id)) continue;
    drawn.push(id);
  }
  return {
    ...state,
    hand: [...state.hand, ...drawn],
    drawnCards: [...state.drawnCards, ...drawn],
  };
}

function applyEffect(state: GameState, effect: import("./types").CardEffect, rng: RNG): GameState {
  let next = { ...state };

  // Score deltas
  next.scores = {
    equity: state.scores.equity + (effect.equity ?? 0),
    heritage: state.scores.heritage + (effect.heritage ?? 0),
    growth: state.scores.growth + (effect.growth ?? 0),
    sustainability: state.scores.sustainability + (effect.sustainability ?? 0),
  };

  // Resource deltas
  next.resources = {
    capital: state.resources.capital + (effect.capital ?? 0),
    power: state.resources.power + (effect.power ?? 0),
    trust: state.resources.trust + (effect.trust ?? 0),
    knowledge: state.resources.knowledge + (effect.knowledge ?? 0),
  };

  // Parcel transforms
  if (effect.transformParcels) {
    next.parcels = applyTransforms(state.parcels, effect.transformParcels, rng);
  }

  // Flag
  if (effect.setFlag) {
    next.flags = new Set(state.flags);
    next.flags.add(effect.setFlag);
  }

  // Toast
  if (effect.message) {
    next = pushMessage(next, "info", effect.message);
  }

  return next;
}

function maybeQueueEvent(state: GameState, rng: RNG): GameState {
  const resolvedSet = new Set(state.resolvedEvents.map((e) => e.eventId));
  const candidates = eligibleEvents(state.year, state.flags, resolvedSet);
  if (candidates.length === 0) return state;
  // 35% per year. Across a 5-year turn that's roughly 85% chance of at least one event.
  if (!rng.chance(0.35)) return state;
  const ev = rng.pickWeighted(candidates);
  if (!ev) return state;
  return { ...state, currentEvent: ev, phase: "event" };
}

function unlockAchievements(state: GameState): GameState {
  const newOnes = checkNewAchievements(state);
  if (newOnes.length === 0) return state;
  let next = { ...state, achievements: new Set([...state.achievements, ...newOnes]) };
  for (const id of newOnes) {
    const a = ACHIEVEMENT_BY_ID.get(id);
    if (a) next = pushMessage(next, "achievement", `Achievement: ${a.name}`);
  }
  return next;
}

export function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      const seed = action.seed || generateSeed();
      const rng = new RNG(seed);
      const parcels = generateInitialParcels(rng);
      const roleKey = (action.roleKey ?? "alderman") as RoleKey;
      const role = ROLES[roleKey] ?? ROLES.alderman;
      const resources = applyRoleBonus(STARTING_RESOURCES, role);
      let next: GameState = {
        ...freshState(),
        phase: "intro",
        seed,
        displayName: action.displayName,
        roleKey,
        objectives: action.objectives ?? [],
        resources,
        parcels,
        drawPerYear: DRAW_PER_YEAR + (role.extraDraw ?? 0),
        startedAt: Date.now(),
        hand: [...role.startingCards],
        drawnCards: [...role.startingCards],
      };
      // Fill out to starting hand size from the era-available pool
      next = drawCards(next, Math.max(0, STARTING_HAND_SIZE - next.hand.length), new RNG(seed + ":draw"));
      return next;
    }

    case "RESTORE_STATE": {
      let restored = { ...action.state, messages: [] };
      // Defensive: if the save somehow has no parcels (corruption,
      // schema mismatch from an older version), regenerate from seed
      // so the player still has a playable ward.
      if (!restored.parcels || restored.parcels.length === 0) {
        const seed = restored.seed || generateSeed();
        restored = {
          ...restored,
          seed,
          parcels: generateInitialParcels(new RNG(seed)),
        };
      }
      return restored;
    }

    case "RESTART_GAME":
      return freshState();

    case "DISMISS_HINT":
      return { ...state, hintsDismissed: new Set([...state.hintsDismissed, action.hintId]) };

    case "START_TUTORIAL": {
      return { ...state, phase: "tutorial", tutorialStep: 0 };
    }
    case "ADVANCE_TUTORIAL": {
      // Special case: if we are in 'intro' phase, this button moves us to play
      if (state.phase === "intro") {
        return { ...state, phase: "playing" };
      }
      return { ...state, tutorialStep: state.tutorialStep + 1 };
    }
    case "SKIP_TUTORIAL": {
      return { ...state, phase: "playing", tutorialStep: -1 };
    }

    case "PLAY_CARD": {
      const card = CARD_BY_ID.get(action.cardId);
      if (!card) return state;
      // Apply inflation: card cost grows over time
      const cost = effectiveCost(card, state.year);
      if ((cost.capital ?? 0) > state.resources.capital) {
        return pushMessage(state, "warn", "Not enough capital.");
      }
      if ((cost.power ?? 0) > state.resources.power) {
        return pushMessage(state, "warn", "Not enough political power.");
      }
      if ((cost.trust ?? 0) > state.resources.trust) {
        return pushMessage(state, "warn", "Not enough community trust.");
      }
      if ((cost.knowledge ?? 0) > state.resources.knowledge) {
        return pushMessage(state, "warn", "Not enough knowledge.");
      }
      // Pay cost
      let next = {
        ...state,
        resources: {
          capital: state.resources.capital - (cost.capital ?? 0),
          power: state.resources.power - (cost.power ?? 0),
          trust: state.resources.trust - (cost.trust ?? 0),
          knowledge: state.resources.knowledge - (cost.knowledge ?? 0),
        },
        hand: state.hand.filter((id) => id !== action.cardId),
        playedCards: [...state.playedCards, { cardId: action.cardId, year: state.year }],
        selectedCard: null,
      };
      // Apply effect
      const rng = new RNG(state.seed + ":card:" + state.playedCards.length);
      next = applyEffect(next, card.effect, rng);
      next = pushMessage(next, "good", `Played: ${card.name}`);
      next = unlockAchievements(next);
      return next;
    }

    case "DISCARD_CARD": {
      return {
        ...state,
        hand: state.hand.filter((id) => id !== action.cardId),
        selectedCard: null,
      };
    }

    case "REDRAW_HAND": {
      // Cost scales: 1, 2, 3 Power per use this turn (max 3 uses).
      const cost = state.redrawsThisTurn + 1;
      if (state.redrawsThisTurn >= 3) {
        return pushMessage(state, "warn", "Already redrawn 3 times this turn.");
      }
      if (state.resources.power < cost) {
        return pushMessage(state, "warn", `Need ${cost} Power to redraw (this turn's cost).`);
      }
      let next: GameState = {
        ...state,
        hand: [],
        resources: { ...state.resources, power: state.resources.power - cost },
        redrawsThisTurn: state.redrawsThisTurn + 1,
        selectedCard: null,
      };
      // Draw exactly 3 fresh cards, not refill to full hand
      const rng = new RNG(state.seed + ":redraw:" + state.year + ":" + state.redrawsThisTurn);
      next = drawCards(next, 3, rng);
      return pushMessage(next, "good", `Drew 3 new cards. -${cost} Power.`);
    }

    case "SELECT_CARD": {
      return { ...state, selectedCard: action.cardId };
    }

    case "END_YEAR": {
      if (state.phase === "event") return state; // can't advance with active event
      const newYear = state.year + YEAR_STEP;
      let next: GameState = { ...state, year: newYear, yearAdvanced: true, redrawsThisTurn: 0 };

      // End-of-turn effects: simulate parcels for each year that passed
      for (let y = state.year + 1; y <= newYear; y++) {
        const simRng = new RNG(state.seed + ":sim:" + y);
        next.parcels = simulateYear(next.parcels, y, simRng);
      }

      // Sweep cards from hand that no longer fit the new era window
      next.hand = next.hand.filter((id) => {
        const card = CARD_BY_ID.get(id);
        if (!card) return false;
        if (card.fromYear !== undefined && newYear < card.fromYear) return true; // not yet available is OK
        if (card.toYear !== undefined && newYear > card.toYear) return false; // expired
        return true;
      });

      // Era-based passive resource trickle. Tighter than v1 so the
      // player actually has to choose what to play and what to skip.
      const eraTrickle = newYear < 1955 ? { capital: 2, power: 2 }
        : newYear < 1975 ? { capital: 2, power: 3 }
        : newYear < 1995 ? { capital: 3, power: 3, trust: 1 }
        : newYear < 2015 ? { capital: 3, power: 3, trust: 1 }
        : { capital: 4, power: 3, trust: 1 };

      // Persistent score drift from flags set earlier. Early decisions
      // bite throughout the rest of the run.
      let driftEquity = 0;
      let driftHeritage = 0;
      let driftSustainability = 0;
      let driftGrowth = 0;
      if (next.flags.has("expressway-built")) {
        driftHeritage -= 1;
        driftSustainability -= 1;
      }
      if (next.flags.has("tower-built")) {
        driftHeritage -= 0.5;
      }
      if (next.flags.has("tax-abatement-active")) {
        driftEquity -= 0.5;
      }
      if (next.flags.has("fast-track-permits")) {
        driftEquity -= 1;
      }
      if (next.flags.has("policing-heavy")) {
        driftEquity -= 0.5;
      }
      if (next.flags.has("tif-active")) {
        // TIF starves general fund; modest equity drag UNLESS player has
        // explicitly used it for affordable housing (a separate flag).
        if (!next.flags.has("tif-affordable")) driftEquity -= 0.5;
      }
      if (next.flags.has("preservation-overlay")) {
        driftHeritage += 1;
      }
      if (next.flags.has("transit-extension") && !next.flags.has("preservation-overlay")) {
        driftEquity -= 1; // displacement pressure without overlays
      }
      next.scores = {
        equity: next.scores.equity + driftEquity,
        heritage: next.scores.heritage + driftHeritage,
        growth: next.scores.growth + driftGrowth,
        sustainability: next.scores.sustainability + driftSustainability,
      };
      next.resources = {
        capital: next.resources.capital + (eraTrickle.capital ?? 0),
        power: next.resources.power + (eraTrickle.power ?? 0),
        trust: next.resources.trust + (eraTrickle.trust ?? 0),
        knowledge: next.resources.knowledge,
      };

      // Auto-trim hand to make room for new draws. The OLDEST cards
      // (front of hand) are discarded, leaving the most recent in hand.
      // Prevents un-affordable cards from piling up across turns.
      if (next.hand.length > END_TURN_TRIM_TO) {
        const trimmed = next.hand.slice(-END_TURN_TRIM_TO);
        const dropped = next.hand.length - trimmed.length;
        next = { ...next, hand: trimmed };
        if (dropped > 0) {
          next = pushMessage(next, "info", `Discarded ${dropped} unplayed card${dropped === 1 ? "" : "s"} from earlier turns.`);
        }
      }

      // Draw new cards
      const drawRng = new RNG(state.seed + ":draw:" + newYear);
      next = drawCards(next, state.drawPerYear, drawRng);

      // Priority 1: crisis events triggered by current state.
      // These fire before random-pool events because they matter more.
      const crises = checkCrisisTriggers(next);
      if (crises.length > 0 && !next.currentEvent) {
        const crisisRng = new RNG(state.seed + ":crisis:" + newYear);
        const chosen = crisisRng.pick(crises);
        next = { ...next, currentEvent: chosen, phase: "event" };
      }

      // Priority 2: roll for regular events at every year that passed
      // (each year independently, so a 5-year jump can fire 0-1 events
      // if no crisis already fired)
      if (!next.currentEvent) {
        for (let y = state.year + 1; y <= newYear; y++) {
          if (next.currentEvent) break;
          const yearForRoll = y;
          const tempState = { ...next, year: yearForRoll };
          const eventRng = new RNG(state.seed + ":event:" + y);
          const rolled = maybeQueueEvent(tempState, eventRng);
          if (rolled.currentEvent) {
            next = { ...next, currentEvent: rolled.currentEvent, phase: "event" };
          }
        }
      }

      // Check end of game
      if (newYear > END_YEAR_FINAL) {
        next = { ...next, phase: "ended", finalScore: computeFinalScore(next) };
      }

      next = unlockAchievements(next);
      return next;
    }

    case "RESOLVE_EVENT": {
      if (!state.currentEvent) return state;
      const opt = state.currentEvent.options[action.optionIndex];
      if (!opt) return state;

      // If option is stochastic, roll a random result
      let resolvedOutcome = opt.outcome;
      let resolvedEffect = opt.effect;
      if (opt.stochastic && opt.stochastic.length > 0) {
        const rollRng = new RNG(state.seed + ":stoch:" + state.resolvedEvents.length);
        const totalWeight = opt.stochastic.reduce((s, r) => s + r.weight, 0);
        let target = rollRng.next() * totalWeight;
        let picked = opt.stochastic[0];
        for (const r of opt.stochastic) {
          target -= r.weight;
          if (target <= 0) { picked = r; break; }
        }
        resolvedOutcome = `${opt.outcome}. ${picked.outcome}`;
        resolvedEffect = picked.effect;
      }

      let next: GameState = {
        ...state,
        currentEvent: null,
        phase: "playing",
        resolvedEvents: [
          ...state.resolvedEvents,
          {
            eventId: state.currentEvent.id,
            year: state.year,
            optionIndex: action.optionIndex,
            outcome: resolvedOutcome,
          },
        ],
      };
      const rng = new RNG(state.seed + ":evopt:" + state.resolvedEvents.length);
      next = applyEffect(next, resolvedEffect, rng);
      next = pushMessage(next, "info", `You ${resolvedOutcome}.`);
      next = unlockAchievements(next);
      return next;
    }

    case "READ_NOTE": {
      if (state.notesRead.has(action.term)) return state;
      const term = GLOSSARY[action.term];
      if (!term) return state;
      const role = ROLES[state.roleKey as RoleKey] ?? ROLES.alderman;
      const gain = 1 + (role.noteBonus ?? 0);
      const next: GameState = {
        ...state,
        notesRead: new Set([...state.notesRead, action.term]),
        resources: { ...state.resources, knowledge: state.resources.knowledge + gain },
      };
      return unlockAchievements(pushMessage(next, "good", `+${gain} Knowledge (${term.term})`));
    }

    case "DISMISS_TOAST": {
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.id),
      };
    }

    case "RETURN_TO_MENU":
      return freshState();

    case "VIEW_LEADERBOARD":
      return { ...state, phase: "leaderboard" };

    default:
      return state;
  }
}
