/**
 * Factions. Six power centers that care about what the player does.
 * Each has a 0-100 "activity" meter. Player actions raise or lower
 * each meter. When a meter crosses thresholds, era-appropriate events
 * fire automatically from that faction.
 *
 * This makes the game feel alive: actions have political consequences
 * you can see accumulating, not just score numbers.
 */

export type FactionKey =
  | "machine"
  | "poa"
  | "cbl"
  | "chicagoFederation"
  | "university"
  | "press";

export interface Faction {
  key: FactionKey;
  name: string;
  tagline: string;
  /** What happens when activity is very high */
  hotHeadline: string;
  hotDescription: string;
  /** What happens when activity is very low */
  coldHeadline: string;
  coldDescription: string;
  /** Color for the HUD meter */
  color: string;
  /** What it wants, in one line (shown in UI) */
  wants: string;
  icon: string;
}

export const FACTIONS: Record<FactionKey, Faction> = {
  machine: {
    key: "machine",
    name: "The Machine",
    tagline: "Daley's people. Every job, every contract, every zone.",
    hotHeadline: "The Machine is furious.",
    hotDescription:
      "You have crossed one too many powerful aldermen. The next budget cuts your ward's share. Expect a tough reelection.",
    coldHeadline: "The Machine is quietly pleased.",
    coldDescription:
      "You have played ball. A mid-level patronage appointment opens in your office. You get an invite to the summer picnic.",
    color: "bg-ink",
    wants: "Obedience. Federal money. No surprises.",
    icon: "gear",
  },
  poa: {
    key: "poa",
    name: "Property Owners Association",
    tagline: "The homeowners of the northern blocks. Organized and loud.",
    hotHeadline: "The Property Owners Association is suing.",
    hotDescription:
      "You have challenged single-family zoning one too many times. They are filing a constitutional takings claim and writing letters to the Tribune.",
    coldHeadline: "The POA sends a cordial invitation.",
    coldDescription:
      "You have protected their interests. The annual garden party now includes your staff.",
    color: "bg-warm-gray",
    wants: "Low density. High values. Stable demographics.",
    icon: "house",
  },
  cbl: {
    key: "cbl",
    name: "Contract Buyers League",
    tagline: "Organized homeowners fighting the contract sellers.",
    hotHeadline: "The CBL is on strike again.",
    hotDescription:
      "Five hundred Parkhaven families are withholding contract payments. They need the city's backing. Not backing them publicly is a mark.",
    coldHeadline: "The CBL is disbanding.",
    coldDescription:
      "Without support the league has dissolved. The organized resistance to predatory lending ends with it.",
    color: "bg-rust",
    wants: "Regulate contract buying. Enforce fair housing. Back renters.",
    icon: "raised-fist",
  },
  chicagoFederation: {
    key: "chicagoFederation",
    name: "Chicago Federation of Labor",
    tagline: "The trades and the service unions.",
    hotHeadline: "The Federation is backing a strike.",
    hotDescription:
      "Construction halts on every project in the ward until a prevailing-wage and local-hiring concession arrives.",
    coldHeadline: "The Federation is skeptical.",
    coldDescription:
      "Your projects are being picketed as non-union or low-road. Expect less cooperation from city contractors.",
    color: "bg-forest",
    wants: "Prevailing wages. Local hiring. Pension protection.",
    icon: "hardhat",
  },
  university: {
    key: "university",
    name: "University Interests",
    tagline: "Institutional expansion. Quiet, relentless, well-funded.",
    hotHeadline: "The University is expanding into Parkhaven.",
    hotDescription:
      "A major institutional development arrives in the central blocks. Big capital, big displacement pressure, long shadow.",
    coldHeadline: "The University has cooled.",
    coldDescription:
      "Without institutional interest, adjacent blocks see lower land values but also fewer jobs.",
    color: "bg-amber-800",
    wants: "Expansion rights. Low-cost land. Zoning variances.",
    icon: "tower",
  },
  press: {
    key: "press",
    name: "The Press",
    tagline: "Tribune, Defender, WBEZ, Block Club.",
    hotHeadline: "The press is running positive coverage.",
    hotDescription:
      "Your ward is on the front page for good reasons. Knowledge and political capital rise.",
    coldHeadline: "The press is running critical coverage.",
    coldDescription:
      "Your decisions are getting pathologizing coverage. Trust and knowledge both take a hit.",
    color: "bg-indigo-700",
    wants: "Disclosure. Data. Access. Tips.",
    icon: "newspaper",
  },
};

export const FACTION_LIST: Faction[] = Object.values(FACTIONS);
