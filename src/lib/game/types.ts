/**
 * Build the Block - core type system
 *
 * The game models a fictional Chicago ward (Parkhaven) over 100 years
 * (1940 to 2040). On each turn the player advances 1 year. They draw
 * policy cards from era-appropriate decks and play cards by spending
 * resources. Random events fire based on era and prior decisions. Each
 * parcel evolves based on player decisions, neighbor effects, and city
 * background pressures (white flight, gentrification, disinvestment).
 *
 * The educational layer is embedded in the data, not the dialogue.
 * Every card and event carries a lore note that references real Chicago
 * history; players read them only if they want to. Glossary terms are
 * inline-popoverable.
 */

/* ------------------------------------------------------------------ */
/*  Resources                                                          */
/* ------------------------------------------------------------------ */

export type ResourceKey = "capital" | "power" | "trust" | "knowledge";

export interface Resources {
  /** Dollars (in $1000 units) the player can spend on cards */
  capital: number;
  /** Political capital. Spent on cards that fight powerful interests. */
  power: number;
  /** Community trust. Spent on cards that ask for resident buy-in. */
  trust: number;
  /** Knowledge. Earned by reading glossary notes; unlocks deeper cards. */
  knowledge: number;
}

/* ------------------------------------------------------------------ */
/*  Hidden score axes                                                  */
/* ------------------------------------------------------------------ */

export type ScoreKey =
  | "equity"
  | "heritage"
  | "growth"
  | "sustainability";

export interface Scores {
  /** Reduces the gap between best-off and worst-off residents */
  equity: number;
  /** How much of the original neighborhood character remains */
  heritage: number;
  /** New construction, jobs, tax base */
  growth: number;
  /** Long-term resilience: green space, transit, mixed use */
  sustainability: number;
}

/* ------------------------------------------------------------------ */
/*  Parcels                                                            */
/* ------------------------------------------------------------------ */

export type HOLCGrade = "A" | "B" | "C" | "D" | "ungraded";

export type ParcelType =
  | "vacant"
  | "single-family"
  | "two-flat"
  | "three-flat"
  | "courtyard"
  | "tower"
  | "rehab-tower"
  | "commercial"
  | "industrial"
  | "school"
  | "church"
  | "park"
  | "transit"
  | "expressway"
  | "land-trust"
  | "demolished"
  | "mural"
  | "community-garden"
  | "library"
  | "clinic";

export type ParcelOwner =
  | "resident"
  | "absentee"
  | "speculator"
  | "land-trust"
  | "city"
  | "cha"
  | "university"
  | "developer"
  | "vacant";

export interface Parcel {
  /** 0..69, position in the 7x10 grid */
  id: number;
  /** Column 0..9, where 9 is on the lake (east) */
  col: number;
  /** Row 0..6, where 0 is north */
  row: number;
  /** Block grouping for adjacency calculations */
  block: number;
  /** What stands here */
  type: ParcelType;
  /** Who holds the deed or contract */
  owner: ParcelOwner;
  /** HOLC grade assigned in 1940. Persists. */
  holc: HOLCGrade;
  /** 0..100. How well kept the structure is. */
  condition: number;
  /** 0..100. Land value index, drives gentrification pressure. */
  value: number;
  /** 0..100. How rooted the current residents are. Reset on displacement. */
  memory: number;
  /** Resident count */
  residents: number;
  /** True if the parcel has been protected by community land trust or
   *  preservation overlay. */
  protected: boolean;
  /** Tracks displacement events that hit this parcel. */
  displacementEvents: number;
}

/* ------------------------------------------------------------------ */
/*  Cards                                                              */
/* ------------------------------------------------------------------ */

export type CardCategory =
  | "zoning"
  | "finance"
  | "infrastructure"
  | "housing"
  | "schools"
  | "organizing"
  | "research"
  | "transit"
  | "preservation"
  | "commerce"
  | "environment"
  | "culture";

export type CardRarity = "common" | "uncommon" | "rare" | "legendary";

export interface CardCost {
  capital?: number;
  power?: number;
  trust?: number;
  knowledge?: number;
}

export interface CardEffect {
  /** Score deltas */
  equity?: number;
  heritage?: number;
  growth?: number;
  sustainability?: number;
  /** Resource deltas (e.g., a card might generate trust) */
  capital?: number;
  power?: number;
  trust?: number;
  knowledge?: number;
  /** Parcel transformations */
  transformParcels?: ParcelTransform[];
  /** Set a flag the rest of the game can read */
  setFlag?: string;
  /** Triggers a follow-up event next turn */
  triggerEvent?: string;
  /** Display message on play */
  message?: string;
}

export interface ParcelTransform {
  /** How to pick parcels: 'all', 'random:N', 'holc:D', 'block:N',
   *  'type:vacant', 'adjacent-to:transit', etc. */
  selector: string;
  /** What to set on matching parcels */
  set?: Partial<Parcel>;
  /** Numeric deltas to apply to matching parcels */
  delta?: Partial<Pick<Parcel, "condition" | "value" | "memory" | "residents">>;
}

export interface Card {
  id: string;
  /** Short title displayed on the card */
  name: string;
  /** Period-appropriate framing of what the card represents */
  flavor: string;
  /** What the card does, in plain English */
  description: string;
  /** Educational note about the real-world referent */
  lore: string;
  /** Source citation */
  source: string;
  category: CardCategory;
  rarity: CardRarity;
  cost: CardCost;
  /** Earliest year the card can appear in the deck */
  fromYear?: number;
  /** Last year the card is in the deck */
  toYear?: number;
  /** Required flag (e.g., a card unlocks only after a certain event) */
  requiresFlag?: string;
  /** Effects when the player plays the card */
  effect: CardEffect;
  /** Glossary terms relevant to this card */
  glossary?: string[];
}

/* ------------------------------------------------------------------ */
/*  Events                                                             */
/* ------------------------------------------------------------------ */

export interface EventOption {
  label: string;
  /** What the player chose, in past tense */
  outcome: string;
  effect: CardEffect;
}

export interface GameEvent {
  id: string;
  year: number | { from: number; to: number };
  /** Title of the event */
  title: string;
  /** The headline framing as it appears in the game */
  headline: string;
  /** Body of the event explanation */
  body: string;
  /** Educational note about what really happened in Chicago */
  lore: string;
  source: string;
  /** Required flags for this event to fire */
  requires?: string[];
  /** Forbidden flags - if any are set, event is skipped */
  blockedBy?: string[];
  /** Probability weight for random selection (default 1) */
  weight?: number;
  /** Options the player can choose between */
  options: EventOption[];
  /** Glossary terms */
  glossary?: string[];
}

/* ------------------------------------------------------------------ */
/*  Achievements                                                       */
/* ------------------------------------------------------------------ */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Hidden until earned */
  hidden?: boolean;
  /** Icon glyph */
  icon: string;
}

/* ------------------------------------------------------------------ */
/*  Era                                                                */
/* ------------------------------------------------------------------ */

export interface Era {
  key: "depression" | "postwar" | "renewal" | "modern";
  name: string;
  fromYear: number;
  toYear: number;
  /** Background pressure each turn during this era */
  backgroundEffects: {
    description: string;
    apply: (resources: Resources, scores: Scores) => Partial<Resources & Scores>;
  };
}

/* ------------------------------------------------------------------ */
/*  Game state                                                         */
/* ------------------------------------------------------------------ */

export type GamePhase =
  | "menu"
  | "intro"
  | "tutorial"
  | "playing"
  | "event"
  | "year-summary"
  | "era-transition"
  | "ended"
  | "leaderboard";

export interface PlayedCard {
  cardId: string;
  year: number;
}

export interface ResolvedEvent {
  eventId: string;
  year: number;
  optionIndex: number;
  outcome: string;
}

export interface GameState {
  phase: GamePhase;
  /** Current year. Starts at 1940. */
  year: number;
  /** RNG seed used to generate this run */
  seed: string;
  /** The display name the player will appear under on the leaderboard */
  displayName: string;
  /** Starting role (alderman, organizer, developer, etc.) */
  roleKey: string;
  /** Objectives chosen at game start */
  objectives: string[];
  /** Current resource levels */
  resources: Resources;
  /** Hidden scores */
  scores: Scores;
  /** All 70 parcels */
  parcels: Parcel[];
  /** Cards currently in the player's hand */
  hand: string[];
  /** Cards drawn so far */
  drawnCards: string[];
  /** Cards played and when */
  playedCards: PlayedCard[];
  /** Events resolved so far */
  resolvedEvents: ResolvedEvent[];
  /** Faction activity (0-100 each) */
  factions: Record<string, number>;
  /** Active flags */
  flags: Set<string>;
  /** Currently active event waiting for player choice */
  currentEvent: GameEvent | null;
  /** Achievements earned */
  achievements: Set<string>;
  /** Glossary terms the player has read */
  notesRead: Set<string>;
  /** Selected card preview */
  selectedCard: string | null;
  /** Number of cards the player can draw at end of year */
  drawPerYear: number;
  /** Max hand size */
  handSize: number;
  /** Tutorial step (-1 = not in tutorial) */
  tutorialStep: number;
  /** Toast messages stacked at the bottom */
  messages: ToastMessage[];
  /** Whether the player has hit "end turn" once on the current year */
  yearAdvanced: boolean;
  /** Number of times REDRAW has been used this turn. Reset on END_YEAR.
   *  Each successive redraw costs more Power. */
  redrawsThisTurn: number;
  /** Final score breakdown, only set when phase === 'ended' */
  finalScore?: FinalScore;
  /** When the game started (ms since epoch) */
  startedAt: number;
  /** First-time hints dismissed */
  hintsDismissed: Set<string>;
}

export interface ToastMessage {
  id: string;
  kind: "info" | "good" | "warn" | "achievement";
  text: string;
  ttl: number;
}

export interface FinalScore {
  total: number;
  equity: number;
  heritage: number;
  growth: number;
  sustainability: number;
  bonus: number;
  archetype: ArchetypeKey;
  rank: ScoreRank;
  resident: string;
  summary: string;
}

export type ArchetypeKey =
  | "reformer"
  | "caretaker"
  | "developer"
  | "speculator"
  | "organizer"
  | "technocrat";

export interface Archetype {
  key: ArchetypeKey;
  name: string;
  blurb: string;
  resident: string;
  icon: string;
}

export type ScoreRank =
  | "S"
  | "A"
  | "B"
  | "C"
  | "D";

/* ------------------------------------------------------------------ */
/*  Action types for the reducer                                       */
/* ------------------------------------------------------------------ */

export type GameAction =
  | { type: "START_GAME"; displayName: string; seed?: string; roleKey?: string; objectives?: string[] }
  | { type: "START_TUTORIAL" }
  | { type: "ADVANCE_TUTORIAL" }
  | { type: "SKIP_TUTORIAL" }
  | { type: "PLAY_CARD"; cardId: string; targetParcel?: number }
  | { type: "DISCARD_CARD"; cardId: string }
  | { type: "REDRAW_HAND" }
  | { type: "SELECT_CARD"; cardId: string | null }
  | { type: "END_YEAR" }
  | { type: "RESOLVE_EVENT"; optionIndex: number }
  | { type: "READ_NOTE"; term: string }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "DISMISS_HINT"; hintId: string }
  | { type: "RESTORE_STATE"; state: GameState }
  | { type: "RESTART_GAME" }
  | { type: "RETURN_TO_MENU" }
  | { type: "VIEW_LEADERBOARD" };
