/**
 * Game state machine. The state is held by useReducer in the GameRoot
 * component. Every action goes through the reducer here. The reducer
 * is pure - it derives the next state from the current state and an
 * action. All side effects (API calls, timers) live in the components.
 */

import { availableCards, CARD_BY_ID, CARDS } from "./cards";
import { eligibleEvents, EVENT_BY_ID, EVENTS } from "./events";
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

const STARTING_HAND_SIZE = 6;
const DRAW_PER_YEAR = 3;
const MAX_HAND = 10;
export const YEAR_STEP = 5;
export const END_YEAR_FINAL = 2040;

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

  // Weight by rarity * role-affinity
  const weighted = candidates.flatMap((c) => {
    let w = c.rarity === "common" ? 8
          : c.rarity === "uncommon" ? 4
          : c.rarity === "rare" ? 2
          : 1;
    if (favored.has(c.category)) w *= 3;
    if (avoided.has(c.category)) w = Math.max(1, Math.floor(w / 4));
    return Array(w).fill(c.id);
  });

  const drawn: string[] = [];
  for (let i = 0; i < n && state.hand.length + drawn.length < state.handSize && weighted.length > 0; i++) {
    const id = rng.pick(weighted);
    if (!drawn.includes(id) && !state.hand.includes(id)) drawn.push(id);
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
      // Check resources
      const cost = card.cost;
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
      // Cost: 1 Power. Discard entire hand and redraw fresh.
      if (state.resources.power < 1) {
        return pushMessage(state, "warn", "Need 1 Power to redraw the hand.");
      }
      let next: GameState = {
        ...state,
        hand: [],
        resources: { ...state.resources, power: state.resources.power - 1 },
        selectedCard: null,
      };
      const rng = new RNG(state.seed + ":redraw:" + state.year + ":" + state.playedCards.length);
      next = drawCards(next, state.handSize, rng);
      return pushMessage(next, "good", "Redrew your hand. -1 Power.");
    }

    case "SELECT_CARD": {
      return { ...state, selectedCard: action.cardId };
    }

    case "END_YEAR": {
      if (state.phase === "event") return state; // can't advance with active event
      const newYear = state.year + YEAR_STEP;
      let next: GameState = { ...state, year: newYear, yearAdvanced: true };

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

      // Era-based passive resource trickle (multiplied for the 5-year step)
      const eraTrickle = newYear < 1955 ? { capital: 4, power: 4 }
        : newYear < 1975 ? { capital: 5, power: 6 }
        : newYear < 1995 ? { capital: 6, power: 6, trust: 1 }
        : newYear < 2015 ? { capital: 7, power: 6, trust: 2 }
        : { capital: 9, power: 7, trust: 2 };
      next.resources = {
        capital: next.resources.capital + (eraTrickle.capital ?? 0),
        power: next.resources.power + (eraTrickle.power ?? 0),
        trust: next.resources.trust + (eraTrickle.trust ?? 0),
        knowledge: next.resources.knowledge,
      };

      // Draw new cards
      const drawRng = new RNG(state.seed + ":draw:" + newYear);
      next = drawCards(next, state.drawPerYear, drawRng);

      // Roll for events at every year that passed in this jump
      // (each year independently, so a 5-year jump can fire 0-2 events)
      for (let y = state.year + 1; y <= newYear; y++) {
        if (next.currentEvent) break; // already queued
        const yearForRoll = y;
        const tempState = { ...next, year: yearForRoll };
        const eventRng = new RNG(state.seed + ":event:" + y);
        const rolled = maybeQueueEvent(tempState, eventRng);
        if (rolled.currentEvent) {
          next = { ...next, currentEvent: rolled.currentEvent, phase: "event" };
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
            outcome: opt.outcome,
          },
        ],
      };
      const rng = new RNG(state.seed + ":evopt:" + state.resolvedEvents.length);
      next = applyEffect(next, opt.effect, rng);
      next = pushMessage(next, "info", `You ${opt.outcome}.`);
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
