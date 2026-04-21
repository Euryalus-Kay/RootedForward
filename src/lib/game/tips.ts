/**
 * Tips system. A large pool of short, actionable tips shown on loading
 * screens, between turns, and in the Glossary overlay. Each tip is a
 * self-contained sentence that a player can read without context.
 *
 * Tips are grouped by category so the UI can show a tip that's relevant
 * to what the player is doing.
 */

export type TipCategory =
  | "general"
  | "cards"
  | "events"
  | "parcels"
  | "resources"
  | "role"
  | "strategy"
  | "history"
  | "achievement";

export interface Tip {
  id: string;
  category: TipCategory;
  text: string;
  /** Shown only when game year is in this range */
  year?: { from?: number; to?: number };
  /** Shown only for this role */
  role?: string;
}

export const TIPS: Tip[] = [
  /* -------------- General -------------- */
  { id: "t-general-1", category: "general", text: "There is no winning. Only the trade-offs you choose." },
  { id: "t-general-2", category: "general", text: "Pause anytime with Esc. The game stops. Your state stays." },
  { id: "t-general-3", category: "general", text: "The game autosaves after every year. You can close the tab and come back." },
  { id: "t-general-4", category: "general", text: "Every card cites a real Chicago source. Hover the card title to see it." },
  { id: "t-general-5", category: "general", text: "The archetypes describe the pattern your choices form. They are not grades." },
  { id: "t-general-6", category: "general", text: "Six starting roles. Twelve objectives. About a hundred cards and events. Replay differs." },
  { id: "t-general-7", category: "general", text: "Your score is compared only against other runs on the same difficulty." },
  { id: "t-general-8", category: "general", text: "The game covers a century. You hold the ward for all of it." },

  /* -------------- Cards -------------- */
  { id: "t-card-1", category: "cards", text: "Click a card to read it. Click Play to actually play it." },
  { id: "t-card-2", category: "cards", text: "Card costs inflate over time. A 1940 card is cheaper than a 2040 card." },
  { id: "t-card-3", category: "cards", text: "You can draw 3 fresh cards for 1 Power. The next redraw costs 2. Then 3." },
  { id: "t-card-4", category: "cards", text: "Unplayed cards older than one turn get discarded automatically. Don't hoard." },
  { id: "t-card-5", category: "cards", text: "Rare cards are rare. Legendary cards show up about once per run." },
  { id: "t-card-6", category: "cards", text: "Some cards require flags from earlier decisions. You'll see them only if you set those flags." },
  { id: "t-card-7", category: "cards", text: "Role-signature cards only appear for that role. They define the early game." },
  { id: "t-card-8", category: "cards", text: "Category weighting is heavy. Your role pulls cards from its favored categories 3x as often." },

  /* -------------- Events -------------- */
  { id: "t-event-1", category: "events", text: "Events pause play until you choose. There is no 'skip.'" },
  { id: "t-event-2", category: "events", text: "A role-only option in an event is shown only to that role. You may not see what others see." },
  { id: "t-event-3", category: "events", text: "Stochastic options (labeled 'roll') give a weighted random outcome. The weights are shown." },
  { id: "t-event-4", category: "events", text: "Crisis events fire from your game state, not the year. Three protected blocks; a heat wave; a tower riot." },
  { id: "t-event-5", category: "events", text: "An event can set flags the rest of the game reads. Some flags bite for decades." },
  { id: "t-event-6", category: "events", text: "You can read the glossary while an event is showing, but you cannot dismiss the event." },
  { id: "t-event-7", category: "events", text: "The same event never fires twice in one run." },

  /* -------------- Parcels -------------- */
  { id: "t-parcel-1", category: "parcels", text: "Parkhaven is 7 rows by 10 columns. 70 parcels total." },
  { id: "t-parcel-2", category: "parcels", text: "HOLC grades are locked at start. You cannot change them directly." },
  { id: "t-parcel-3", category: "parcels", text: "Speculator-owned parcels bleed memory each year. Land trust parcels gain it." },
  { id: "t-parcel-4", category: "parcels", text: "Hover a parcel to see its type, owner, HOLC grade, and condition." },
  { id: "t-parcel-5", category: "parcels", text: "Protected parcels resist demolition and gentrification. They also cost political capital." },
  { id: "t-parcel-6", category: "parcels", text: "The 3D map is draggable. Scroll to zoom. Classic mode is easier to read at a glance." },
  { id: "t-parcel-7", category: "parcels", text: "Three protected blocks by year 2000 changes the late game completely." },
  { id: "t-parcel-8", category: "parcels", text: "Vacant parcels accept new buildings most easily. Demolished parcels are vacant with extra memory loss." },

  /* -------------- Resources -------------- */
  { id: "t-res-1", category: "resources", text: "Capital is money. You get more of it every 5 years, but cards get more expensive." },
  { id: "t-res-2", category: "resources", text: "Power is political capital. You spend it on fights, rezonings, and tough votes." },
  { id: "t-res-3", category: "resources", text: "Trust is community buy-in. You spend it on organizing, you earn it by showing up." },
  { id: "t-res-4", category: "resources", text: "Knowledge unlocks research cards. Read glossary pop-ups; each gives +1 Knowledge." },
  { id: "t-res-5", category: "resources", text: "The Scholar earns +2 Knowledge per note read. The rest of us earn +1." },
  { id: "t-res-6", category: "resources", text: "Redrawing costs Power, not Capital. Redraw to refresh cards you don't want." },

  /* -------------- Role-specific -------------- */
  { id: "t-alderman-1", category: "role", role: "alderman", text: "Alderman starts balanced. No special advantage, no forbidden categories. Versatility is the style." },
  { id: "t-organizer-1", category: "role", role: "organizer", text: "Organizer starts with less capital, more trust. Use organizing cards to compound the trust." },
  { id: "t-developer-1", category: "role", role: "developer", text: "Developer has the most capital. Use it. Your trust can recover via joint ventures." },
  { id: "t-scholar-1", category: "role", role: "scholar", text: "Scholar: read every glossary note you hit. +2 Knowledge each, compounds fast." },
  { id: "t-preacher-1", category: "role", role: "preacher", text: "Preacher skews culture, schools, and organizing cards. Use pulpit events aggressively." },
  { id: "t-journalist-1", category: "role", role: "journalist", text: "Journalist stacks research. Your disclosure cards hit harder than other roles'." },

  /* -------------- Strategy -------------- */
  { id: "t-strat-1", category: "strategy", text: "Drift from early decisions compounds. A 1942 expressway is still costing you in 2020." },
  { id: "t-strat-2", category: "strategy", text: "Land trusts are the single strongest long-term anti-displacement tool." },
  { id: "t-strat-3", category: "strategy", text: "Pre-opening affordability covenants on transit are cheaper than post-opening displacement mitigation." },
  { id: "t-strat-4", category: "strategy", text: "You can have a top-5 run with moderate scores across all four axes. You can also have a top-5 run with one dominant axis." },
  { id: "t-strat-5", category: "strategy", text: "Heritage gains from protected blocks compound. Plant them early." },
  { id: "t-strat-6", category: "strategy", text: "Equity losses from early decisions (towers, expressways, tax abatements) are loud and persistent." },
  { id: "t-strat-7", category: "strategy", text: "Read 20+ glossary entries to unlock several cards you can't otherwise draw." },
  { id: "t-strat-8", category: "strategy", text: "Skip objectives if they'd force you into a run style that doesn't fit the ward you drew." },

  /* -------------- History hooks -------------- */
  { id: "t-history-1", category: "history", text: "Shelley v. Kraemer (1948) makes racial covenants unenforceable. The game reflects this." },
  { id: "t-history-2", category: "history", text: "Hills v. Gautreaux (1976) was the basis for scattered-site CHA. Back the plaintiff in the 1960s." },
  { id: "t-history-3", category: "history", text: "The 1995 heat wave killed 739 Chicagoans concentrated in weakly-networked neighborhoods. The game tests you on this." },
  { id: "t-history-4", category: "history", text: "HOPE VI (1992) demolished much of CHA. Push for 1:1 replacement in writing." },
  { id: "t-history-5", category: "history", text: "The CRA (1977) is federal law you can enforce locally. Find the bank." },
  { id: "t-history-6", category: "history", text: "The Red Line Extension was funded in 2024. In the game, its construction tests your anti-displacement infrastructure." },

  /* -------------- Achievement hints -------------- */
  { id: "t-achieve-1", category: "achievement", text: "Reach 1980 with zero towers built for the Tower-Free achievement." },
  { id: "t-achieve-2", category: "achievement", text: "Protect one parcel in every block for the Six for Six achievement." },
  { id: "t-achieve-3", category: "achievement", text: "Hold 25 land-trust parcels for Land Bank. 40 for Land Trust Architect." },
  { id: "t-achieve-4", category: "achievement", text: "Read every glossary entry for the Historian achievement. There are about 50." },
  { id: "t-achieve-5", category: "achievement", text: "End with all four scores above 80 for the All Four Above 80 achievement. It is hard." },
  { id: "t-achieve-6", category: "achievement", text: "Some achievements require specific flags. Experiment with each role's signature events." },
];

export const TIPS_BY_CATEGORY: Record<TipCategory, Tip[]> = {
  general: TIPS.filter((t) => t.category === "general"),
  cards: TIPS.filter((t) => t.category === "cards"),
  events: TIPS.filter((t) => t.category === "events"),
  parcels: TIPS.filter((t) => t.category === "parcels"),
  resources: TIPS.filter((t) => t.category === "resources"),
  role: TIPS.filter((t) => t.category === "role"),
  strategy: TIPS.filter((t) => t.category === "strategy"),
  history: TIPS.filter((t) => t.category === "history"),
  achievement: TIPS.filter((t) => t.category === "achievement"),
};

/** Get a random tip relevant to the current year and role. Deterministic on seed. */
export function pickTip(seed: string, year?: number, role?: string): Tip {
  const candidates = TIPS.filter((t) => {
    if (t.role && role && t.role !== role) return false;
    if (t.year && year !== undefined) {
      if (t.year.from !== undefined && year < t.year.from) return false;
      if (t.year.to !== undefined && year > t.year.to) return false;
    }
    return true;
  });
  const pool = candidates.length > 0 ? candidates : TIPS;
  // Simple seeded hash
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % pool.length;
  return pool[idx];
}
