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
import type {
  GameAction,
  GameEvent,
  GameState,
  Resources,
  ToastMessage,
} from "./types";

const STARTING_RESOURCES: Resources = {
  capital: 8,
  power: 6,
  trust: 4,
  knowledge: 2,
};

const STARTING_HAND_SIZE = 5;
const DRAW_PER_YEAR = 2;
const MAX_HAND = 8;

export function freshState(): GameState {
  return {
    phase: "menu",
    year: 1940,
    seed: "",
    displayName: "",
    resources: { ...STARTING_RESOURCES },
    scores: { equity: 0, heritage: 0, growth: 0, sustainability: 0 },
    parcels: [],
    hand: [],
    drawnCards: [],
    playedCards: [],
    resolvedEvents: [],
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
  const available = availableCards(state.year, state.flags).map((c) => c.id);
  const candidates = available.filter((id) => !state.hand.includes(id));
  if (candidates.length === 0) return state;
  // Weight by rarity
  const weighted = candidates.flatMap((id) => {
    const c = CARD_BY_ID.get(id);
    if (!c) return [];
    const w = c.rarity === "common" ? 8 : c.rarity === "uncommon" ? 4 : c.rarity === "rare" ? 2 : 1;
    return Array(w).fill(id);
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
  // Roll for an event with chance based on era weight
  if (!rng.chance(0.45)) return state;
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
      let next: GameState = {
        ...freshState(),
        phase: "intro",
        seed,
        displayName: action.displayName,
        parcels,
        startedAt: Date.now(),
      };
      next = drawCards(next, STARTING_HAND_SIZE, new RNG(seed + ":draw"));
      return next;
    }

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

    case "SELECT_CARD": {
      return { ...state, selectedCard: action.cardId };
    }

    case "END_YEAR": {
      if (state.phase === "event") return state; // can't advance with active event
      let next = { ...state, year: state.year + 1, yearAdvanced: true };

      // End-of-year effects: simulate parcels
      const simRng = new RNG(state.seed + ":sim:" + state.year);
      next.parcels = simulateYear(next.parcels, next.year, simRng);

      // Era-based passive resource trickle
      const eraTrickle = next.year < 1955 ? { capital: 1, power: 1 }
        : next.year < 1975 ? { capital: 1, power: 2 }
        : next.year < 1995 ? { capital: 2, power: 2 }
        : next.year < 2015 ? { capital: 2, power: 2, trust: 1 }
        : { capital: 3, power: 2, trust: 1 };
      next.resources = {
        capital: next.resources.capital + (eraTrickle.capital ?? 0),
        power: next.resources.power + (eraTrickle.power ?? 0),
        trust: next.resources.trust + (eraTrickle.trust ?? 0),
        knowledge: next.resources.knowledge,
      };

      // Draw new cards
      const drawRng = new RNG(state.seed + ":draw:" + state.year);
      next = drawCards(next, state.drawPerYear, drawRng);

      // Maybe roll an event
      const eventRng = new RNG(state.seed + ":event:" + state.year);
      next = maybeQueueEvent(next, eventRng);

      // Check end of game
      if (next.year > 2040) {
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
      const next: GameState = {
        ...state,
        notesRead: new Set([...state.notesRead, action.term]),
        resources: { ...state.resources, knowledge: state.resources.knowledge + 1 },
      };
      return unlockAchievements(pushMessage(next, "good", `+1 Knowledge (${term.term})`));
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
