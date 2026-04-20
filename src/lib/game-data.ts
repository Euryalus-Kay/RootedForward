/**
 * Build the Block — game content
 *
 * Twelve decisions across four chapters of Chicago history, 1940-2040.
 * Every economic and historical detail draws on a real Chicago source;
 * citations live in the `source` field on each option.
 */

export type ScoreKey = "displacement" | "extraction" | "memory" | "capital" | "equity";

export interface Effect {
  /** delta to a hidden score (-3 to +3 typical) */
  displacement?: number;
  extraction?: number;
  memory?: number;
  capital?: number;
  equity?: number;
  /** parcels to recolor with the given grade/state. If omitted, no parcel change. */
  parcels?: { ids: number[]; state: ParcelState }[];
}

export type ParcelState =
  | "untouched"
  | "graded-a"
  | "graded-b"
  | "graded-c"
  | "graded-d"
  | "demolished"
  | "expressway"
  | "tower"
  | "rehab"
  | "displaced"
  | "preserved"
  | "tif-funded";

export interface Option {
  /** Short label shown on the button */
  label: string;
  /** What the player chose, in present tense, for the run log */
  chose: string;
  /** Editorial copy explaining what happened immediately */
  immediate: string;
  /** "In 1998..." style delayed callout */
  delayed: string;
  /** Source citation shown beneath the consequence */
  source: string;
  effect: Effect;
}

export interface Decision {
  year: string;
  /** The decision in the language of the time */
  prompt: string;
  /** Plain-language framing */
  context: string;
  options: Option[];
}

export interface Chapter {
  n: string;
  period: string;
  title: string;
  summary: string;
  decisions: Decision[];
}

/** All parcels start as 'untouched' */
export const TOTAL_PARCELS = 70;
export const GRID_COLS = 10;
export const GRID_ROWS = 7;

/** Parcel id sets used by the game */
const NORTH_BLOCK = [0, 1, 2, 3, 10, 11, 12, 13];
const CENTRAL_BLOCK = [14, 15, 16, 17, 24, 25, 26, 27, 34, 35, 36, 37];
const EAST_CORRIDOR = [4, 5, 6, 7, 8, 9, 18, 19, 28, 29, 38, 39, 48, 49];
const SOUTH_BLOCK = [40, 41, 42, 43, 44, 50, 51, 52, 53, 54, 60, 61, 62, 63, 64];
const SOUTHWEST_BLOCK = [45, 46, 47, 55, 56, 57, 58, 59, 65, 66, 67, 68, 69];
const EXPRESSWAY_LINE = [4, 14, 24, 34, 44, 54, 64];
const TOWER_SITES = [42, 43, 52, 53];
const REHAB_SITES = [16, 17, 26, 27];
const TIF_PARCELS = [15, 16, 25, 26, 35, 36];

export const CHAPTERS: Chapter[] = [
  {
    n: "01",
    period: "1940 — 1955",
    title: "Lines on a Map",
    summary:
      "You arrive in Parkhaven as a federal HOLC surveyor. The city is asking you to grade every block A, B, C, or D for mortgage risk. The grades will steer thirty years of federal lending.",
    decisions: [
      {
        year: "1940",
        prompt: "How will you grade Parkhaven?",
        context:
          "The HOLC surveyor's manual says racial composition is a legitimate factor. The northern blocks are white and well-kept. The central blocks are mixed and aging. The southern blocks have a growing Black population.",
        options: [
          {
            label: "Transcribe the historical grades",
            chose: "graded the ward by the surveyor's manual",
            immediate:
              "North goes B. Central goes C. South goes D. Banks will now refuse FHA-backed loans south of the line.",
            delayed:
              "By 1968 the boundary you drew today shows up in census data, school funding, and life expectancy.",
            source:
              "1940 Chicago HOLC Residential Security Map (D28 area description), Mapping Inequality / University of Richmond",
            effect: {
              displacement: 1,
              extraction: 2,
              memory: -1,
              equity: -3,
              parcels: [
                { ids: NORTH_BLOCK, state: "graded-b" },
                { ids: CENTRAL_BLOCK, state: "graded-c" },
                { ids: SOUTH_BLOCK, state: "graded-d" },
                { ids: SOUTHWEST_BLOCK, state: "graded-d" },
              ],
            },
          },
          {
            label: "Refuse — grade by physical condition only",
            chose: "refused to grade by race",
            immediate:
              "You file a dissenting report. HOLC accepts the manual's grades anyway. Your name is removed from the project.",
            delayed:
              "Your dissent ends up in the Parkhaven Record, where a 2026 historian quotes it in a footnote.",
            source:
              "Rooted Forward dissent branch — see end-screen Parkhaven Record",
            effect: {
              memory: 3,
              capital: -2,
              equity: 1,
              parcels: [
                { ids: NORTH_BLOCK, state: "graded-b" },
                { ids: CENTRAL_BLOCK, state: "graded-c" },
                { ids: SOUTH_BLOCK, state: "graded-d" },
                { ids: SOUTHWEST_BLOCK, state: "graded-d" },
              ],
            },
          },
        ],
      },
      {
        year: "1948",
        prompt: "A racial covenant case lands on your desk.",
        context:
          "Shelley v. Kraemer just made racial covenants unenforceable. The Parkhaven Property Owners' Association wants you to use zoning to do the same job another way.",
        options: [
          {
            label: "Quietly enforce through zoning",
            chose: "used zoning to do what covenants no longer could",
            immediate:
              "Single-family overlays go up across the northern blocks. The Association sends a thank-you note.",
            delayed:
              "Sixty years later that overlay is still on the books. A 2024 ADU pilot can't legally place a coach house in those blocks.",
            source:
              "Rothstein, The Color of Law (2017), ch. 3 — exclusionary zoning as covenant substitute",
            effect: { displacement: 2, extraction: 2, equity: -2, capital: 1 },
          },
          {
            label: "Decline. Let the court ruling stand.",
            chose: "declined to use zoning as a covenant substitute",
            immediate:
              "The Association calls you a problem. A small wave of Black families moves into formerly-restricted blocks within a year.",
            delayed:
              "The integration period is brief. By 1962 white flight and disinvestment hollow out the same blocks.",
            source: "Sugrue, The Origins of the Urban Crisis, on post-Shelley integration patterns",
            effect: { memory: 2, equity: 2, capital: -1 },
          },
        ],
      },
      {
        year: "1956",
        prompt: "The federal government wants to route an expressway through Parkhaven.",
        context:
          "The Federal-Aid Highway Act passed. Washington offers $18M to bulldoze a six-lane corridor through the C-graded eastern blocks. The corridor would cut Parkhaven in half.",
        options: [
          {
            label: "Accept the expressway",
            chose: "approved the expressway",
            immediate:
              "Nine blocks come down. Roughly 1,400 residents are displaced with relocation vouchers worth less than a year's rent.",
            delayed:
              "By 1990 the corridor's air-quality readings sit above EPA limits. Asthma rates in the adjacent blocks run double the city average.",
            source:
              "Mohl, 'The Interstates and the Cities,' Journal of Policy History (2008); Chicago Department of Public Health air quality reports",
            effect: {
              displacement: 3,
              extraction: 2,
              memory: -3,
              capital: 2,
              equity: -2,
              parcels: [{ ids: EXPRESSWAY_LINE, state: "expressway" }],
            },
          },
          {
            label: "Decline. Re-route through the rail corridor.",
            chose: "rejected the expressway routing",
            immediate:
              "Federal money walks. Parkhaven gets flagged uncooperative for the next funding round.",
            delayed:
              "The blocks survive intact. Forty years later they're still standing, still dense, and worth four times the city average per parcel.",
            source: "FHWA route selection records, 1956-1962",
            effect: { memory: 3, capital: -2, equity: 1 },
          },
        ],
      },
    ],
  },
  {
    n: "02",
    period: "1955 — 1975",
    title: "Contracts and Covenants",
    summary:
      "The Great Migration brings Black families to Parkhaven. They cannot get FHA-backed mortgages — banks refuse to lend in the D-graded blocks. Speculators step in.",
    decisions: [
      {
        year: "1962",
        prompt: "Will you regulate contract sellers?",
        context:
          "Speculators are buying houses for $12,000 and selling them on contract to Black families for $22,000 — an 84% markup. One missed payment and the family loses everything.",
        options: [
          {
            label: "Pass a local fair-housing ordinance",
            chose: "passed a local fair-housing ordinance",
            immediate:
              "Contract terms must now be filed with the city. Markups drop to 30% within two years. The Property Owners' Association sues.",
            delayed:
              "By 1975 the Contract Buyers League uses your filings as evidence in their class-action recovery suit.",
            source:
              "Satter, Family Properties (2009); Duke Cook Center for Social Equity, 'The Plunder of Black Wealth in Chicago' (2019)",
            effect: { extraction: -3, memory: 2, capital: -2, equity: 2 },
          },
          {
            label: "Let the market run",
            chose: "let contract sellers operate freely",
            immediate:
              "Roughly 75% of Parkhaven's home sales to Black families are now on contract. Speculators extract about $587/month per family above a fair mortgage (2019 dollars).",
            delayed:
              "The wealth siphoned out of these blocks between 1955 and 1975 totals around $4 billion across Chicago, per Cook Center.",
            source:
              "Duke Cook Center for Social Equity, 'The Plunder of Black Wealth' (2019)",
            effect: { extraction: 3, displacement: 2, memory: -2, equity: -3 },
          },
        ],
      },
      {
        year: "1968",
        prompt: "The Contract Buyers League is going on a payment strike.",
        context:
          "Five hundred Parkhaven families plan to withhold contract payments until terms are renegotiated. They're asking for the city's backing.",
        options: [
          {
            label: "Back the strike publicly",
            chose: "backed the Contract Buyers League strike",
            immediate:
              "The mayor is furious. Six speculators agree to renegotiate within four months. A handful of Parkhaven families keep their homes.",
            delayed:
              "The contract-buying era ends in Parkhaven by 1972, ahead of the citywide curve.",
            source: "Satter, Family Properties (2009), chs. 9-11",
            effect: {
              extraction: -2,
              memory: 3,
              capital: -2,
              equity: 2,
            },
          },
          {
            label: "Stay neutral",
            chose: "stayed neutral on the contract strike",
            immediate:
              "Strikers lose their homes one by one. Eviction sheriffs work overtime in Parkhaven through the summer of 1969.",
            delayed:
              "Roughly 200 families displaced from these blocks never return. Their grandchildren live in the south suburbs.",
            source: "Chicago Defender coverage of 1968-1969 evictions",
            effect: {
              displacement: 3,
              memory: -3,
              equity: -2,
            },
          },
        ],
      },
      {
        year: "1966",
        prompt: "Dr. King and the Chicago Freedom Movement want a meeting.",
        context:
          "King is marching for open housing. Mayor Daley offers a Summit Agreement with vague language and no enforcement. Parkhaven is being asked to sign on.",
        options: [
          {
            label: "Hold out for enforcement language",
            chose: "refused to sign the Summit Agreement without enforcement",
            immediate:
              "Daley calls you difficult. The marches continue. A small fair-housing tester program goes into effect in Parkhaven six months later.",
            delayed:
              "The 1968 federal Fair Housing Act passes. Parkhaven's tester program is cited as a model.",
            source: "Garrow, Bearing the Cross (1986); Chicago Freedom Movement archives",
            effect: { memory: 3, capital: -1, equity: 2 },
          },
          {
            label: "Sign the Summit Agreement",
            chose: "signed the Summit Agreement",
            immediate:
              "Daley calls it a victory. Three months later, Parkhaven's white-flight rate hits its postwar peak.",
            delayed:
              "The Summit's vague language is cited a generation later by historians as a model of how not to enforce a civil-rights agreement.",
            source: "Garrow, Bearing the Cross (1986); Ralph, Northern Protest (1993)",
            effect: { displacement: 2, memory: -2, equity: -1 },
          },
        ],
      },
    ],
  },
  {
    n: "03",
    period: "1975 — 2000",
    title: "Towers and Renewal",
    summary:
      "The Chicago Housing Authority is siting public-housing towers. Gautreaux is in the courts. The University of Chicago is expanding in the next ward over.",
    decisions: [
      {
        year: "1976",
        prompt: "Where will the CHA build its Parkhaven family towers?",
        context:
          "CHA wants 600 units of public housing in Parkhaven. The federal government will fund concentrated towers cheaply, or scattered low-rise units expensively.",
        options: [
          {
            label: "Concentrated towers in the south blocks",
            chose: "approved concentrated CHA towers",
            immediate:
              "Four 16-story towers go up on the demolished expressway-adjacent parcels. 600 units, but the design is already failing in Cabrini-Green.",
            delayed:
              "By 1995 two towers are uninhabitable. The Plan for Transformation will demolish them all by 2008.",
            source: "Hunt, Blueprint for Disaster (2009); CHA annual reports 1976-1995",
            effect: {
              displacement: 1,
              memory: -2,
              equity: -1,
              parcels: [{ ids: TOWER_SITES, state: "tower" }],
            },
          },
          {
            label: "Scattered-site low-rise across the ward",
            chose: "approved scattered-site low-rise housing",
            immediate:
              "150 units across 30 sites, mixed into existing blocks. Construction takes six years. The Property Owners' Association sues twice and loses both.",
            delayed:
              "Hills v. Gautreaux (1976) cites your scattered-site program in oral argument. The model spreads to Yonkers and beyond.",
            source: "Hills v. Gautreaux, 425 U.S. 284 (1976); Polikoff, Waiting for Gautreaux (2006)",
            effect: { memory: 2, capital: -3, equity: 3 },
          },
        ],
      },
      {
        year: "1983",
        prompt: "Harold Washington's coalition is reorganizing TIF.",
        context:
          "The new mayor wants to use Tax Increment Financing to direct property-tax growth into the blocks the banks redlined. Parkhaven would get its own TIF district.",
        options: [
          {
            label: "Establish a Parkhaven TIF for affordable housing",
            chose: "established a TIF dedicated to affordable housing",
            immediate:
              "Property-tax growth in Parkhaven is captured for 23 years. The first $2.4M funds 60 units of permanently affordable housing.",
            delayed:
              "By 2000 the TIF has produced 320 affordable units. CPS school funding in Parkhaven runs about $400/student below comparable wards.",
            source:
              "Civic Federation, 'TIF in Chicago' (annual); Cook County Clerk TIF reports",
            effect: {
              extraction: -1,
              memory: 2,
              equity: 2,
              parcels: [{ ids: TIF_PARCELS, state: "tif-funded" }],
            },
          },
          {
            label: "Decline. Keep the property tax in CPS.",
            chose: "kept property-tax growth in the school district",
            immediate:
              "Parkhaven's three elementary schools see real per-pupil funding rise 18% over the next decade.",
            delayed:
              "Without TIF, no significant new affordable construction happens until 2015. Land values stay low and gentrification arrives later but harder.",
            source:
              "Chicago Public Schools per-pupil expenditure reports, 1983-2000",
            effect: { memory: 1, equity: 1 },
          },
        ],
      },
      {
        year: "1999",
        prompt: "The CHA Plan for Transformation arrives.",
        context:
          "HUD wants the towers demolished and replaced with mixed-income housing. The CHA promises one-for-one replacement; in practice the rate runs about 60%.",
        options: [
          {
            label: "Demolish for mixed-income",
            chose: "demolished the towers for mixed-income redevelopment",
            immediate:
              "Two towers come down. 320 families get vouchers; about 110 use them in Parkhaven, the rest scatter to the south suburbs.",
            delayed:
              "By 2015 the mixed-income blocks have a 28% poverty rate, down from 71%. The displaced families' new neighborhoods saw an 8-point poverty increase.",
            source:
              "CHA Plan for Transformation reports; Chaskin & Joseph, Integrating the Inner City (2015)",
            effect: { displacement: 3, memory: -2, equity: -1 },
          },
          {
            label: "Rehab in place",
            chose: "rehabbed the towers in place",
            immediate:
              "A $90M federal rehab keeps the towers and the residents. Major elevator and plumbing replacement. No displacement.",
            delayed:
              "Two of the four towers are still operating in 2025. Maintenance costs run 40% above projections.",
            source:
              "HUD HOPE VI rehab vs. demolition cost comparisons (2008)",
            effect: {
              memory: 3,
              capital: -2,
              equity: 2,
              parcels: [{ ids: REHAB_SITES, state: "rehab" }],
            },
          },
        ],
      },
    ],
  },
  {
    n: "04",
    period: "2000 — 2040",
    title: "ARO, TIF, and the Red Line",
    summary:
      "The modern toolkit: inclusionary zoning, transit investment, TIF capture. Parkhaven is becoming the gentrification frontier.",
    decisions: [
      {
        year: "2021",
        prompt: "What ARO tier will Parkhaven adopt?",
        context:
          "The 2021 Affordable Requirements Ordinance lets you set the affordable share for new market-rate development. Higher tier means more affordable units, fewer projects pencil out.",
        options: [
          {
            label: "20% affordable, on-site, 60% AMI",
            chose: "set ARO at 20% on-site",
            immediate:
              "Three planned market-rate towers cancel within a year. The two that proceed produce 80 affordable units at 60% AMI ($66,300 for a family of four).",
            delayed:
              "By 2030 Parkhaven has 240 new affordable units and slower gentrification than Logan Square, where the in-lieu fees siphoned production elsewhere.",
            source:
              "City of Chicago 2024 Income and Rent Limits; ARO 2021 ordinance text",
            effect: { displacement: -2, extraction: -1, memory: 2, equity: 2 },
          },
          {
            label: "10% affordable, mostly in-lieu fees",
            chose: "set ARO at 10% with in-lieu option",
            immediate:
              "Eight market-rate projects break ground. Most pay the in-lieu fee ($175K/unit). Cash flows to a citywide fund.",
            delayed:
              "Logan Square loses 47% of its Latino population by 2030. Parkhaven follows the same curve five years later.",
            source:
              "WBEZ, 'How Logan Square Lost 20,000 Latino Residents' (2024); ARO in-lieu fee analyses",
            effect: { displacement: 3, extraction: 2, memory: -2, equity: -2 },
          },
        ],
      },
      {
        year: "2026",
        prompt: "Where do Parkhaven's TIF dollars go?",
        context:
          "The TIF is capturing $12M/year. Three departments are bidding for it: a developer subsidy for downtown-style towers, a community land trust, and infrastructure (transit, schools, parks).",
        options: [
          {
            label: "Community land trust",
            chose: "directed TIF to a community land trust",
            immediate:
              "$30M over three years buys 80 parcels into permanent community ownership. Rents on those parcels lock at 50% AMI.",
            delayed:
              "By 2040 the land trust holds 220 parcels. Their tenants are 4x more likely to still be in the neighborhood than market-rate renters.",
            source:
              "Cook County Clerk 2023 TIF report ($1.36B citywide); Lincoln Institute community land trust outcomes",
            effect: { displacement: -2, memory: 3, equity: 3 },
          },
          {
            label: "Developer subsidy",
            chose: "directed TIF to developer subsidy",
            immediate:
              "$30M unlocks $200M in market-rate towers. The skyline changes within 18 months.",
            delayed:
              "TIF captured 42% of Parkhaven's property tax growth by 2034. CPS funding in Parkhaven schools sits 12% below comparable wards.",
            source: "Civic Federation TIF analyses (2020-2024)",
            effect: { displacement: 2, extraction: 3, capital: 1, equity: -3 },
          },
          {
            label: "Schools and transit",
            chose: "directed TIF to schools and transit",
            immediate:
              "$30M funds two CTA station rehabs and a new K-8 school. No new affordable units this decade.",
            delayed:
              "Test scores rise. So do land values. By 2035 the median rent has doubled.",
            source: "CTA capital plans; CPS facility investments",
            effect: { displacement: 1, memory: 1, equity: 0 },
          },
        ],
      },
      {
        year: "2030",
        prompt: "The Red Line Extension is ready to break ground.",
        context:
          "The CTA Red Line Extension cost $5.75B for 5.6 miles and four stations, fully funded by an FTA grant signed Dec 2024. A Parkhaven station would unlock $1.7B in real-estate activity. Land values in a half-mile radius will jump 40% within 24 months.",
        options: [
          {
            label: "Lock in community-preservation overlays first",
            chose: "passed community-preservation overlays before the RLE announcement",
            immediate:
              "Right-of-first-refusal for tenants, anti-flipping ordinance, demolition moratorium on rent-controlled buildings. Then the RLE announcement.",
            delayed:
              "Land values jump as predicted. Displacement runs at about a quarter of what the model expected.",
            source:
              "FTA Full Funding Grant Agreement, Red Line Extension (Dec 2024); CTA Transit-Served Location density analyses",
            effect: { displacement: -2, memory: 3, equity: 3 },
          },
          {
            label: "Take the station, sort it out later",
            chose: "took the station without preservation overlays",
            immediate:
              "Groundbreaking ceremony makes the front page. Three speculative LLCs file for permits within two weeks.",
            delayed:
              "By 2040 the half-mile around the station is unrecognizable. The bakery on 22nd closed in 2032. The mural on Damen got painted over.",
            source:
              "CTA Red-Purple Modernization displacement studies; Pilsen and Logan Square parallels",
            effect: { displacement: 3, extraction: 3, memory: -3, equity: -3 },
          },
        ],
      },
    ],
  },
];

export interface Archetype {
  key: "reformer" | "caretaker" | "developer" | "speculator";
  name: string;
  blurb: string;
  /** What the 2040 resident says about this version of Parkhaven */
  resident: string;
}

export const ARCHETYPES: Record<Archetype["key"], Archetype> = {
  reformer: {
    key: "reformer",
    name: "The Reformer",
    blurb:
      "You used the tools you had to bend the system. Not all the way — the tools were designed inside constraints you couldn't escape — but the next person inherits a Parkhaven with more options than you started with.",
    resident:
      "My grandmother's block is still her block. The land trust on 22nd holds the bakery, and the bakery still sells the same croissant. I can name three murals from memory. The expressway noise is the loudest thing about my morning.",
  },
  caretaker: {
    key: "caretaker",
    name: "The Caretaker",
    blurb:
      "You held the line. Few new arrivals, few departures. The institutions that existed in 1990 mostly still exist. The neighborhood is recognizable to a person born here in 1965.",
    resident:
      "Not much has changed since I was a kid. That cuts both ways. The school is the same school. The corner store is the same corner store. The asthma rates are the same too.",
  },
  developer: {
    key: "developer",
    name: "The Developer",
    blurb:
      "You picked growth. The skyline changed. The tax base grew. Most of the people who lived here when you started are not here now, but the ones who arrived have a Parkhaven that looks nothing like 1940.",
    resident:
      "I moved here in 2027 because of the Red Line and the new architecture. My building has a gym. I've never met anyone who lived here before me. I am told that is part of the cost.",
  },
  speculator: {
    key: "speculator",
    name: "The Speculator",
    blurb:
      "You let the market decide. The market decided what it usually decides. The Cook Center will write a paper about Parkhaven's wealth extraction in 2042.",
    resident:
      "My family moved here in 1958. We don't live here anymore. I drive through sometimes to look at the building. Someone else lives in it now and they don't know my grandmother's name.",
  },
};

/** Pick the archetype that best fits a final score vector */
export function chooseArchetype(scores: Record<ScoreKey, number>): Archetype["key"] {
  const { displacement, extraction, memory, equity } = scores;
  // Reformer: low displacement, high memory, positive equity
  // Caretaker: low displacement, high memory, neutral equity
  // Developer: high displacement, high extraction (capital growth), negative equity
  // Speculator: high displacement, very high extraction, very negative equity, low memory
  if (extraction >= 5 && equity <= -3 && memory <= 0) return "speculator";
  if (displacement >= 5 && extraction >= 3) return "developer";
  if (memory >= 4 && equity >= 2 && displacement <= 2) return "reformer";
  if (memory >= 2 && Math.abs(equity) <= 2 && displacement <= 3) return "caretaker";
  // Fallbacks by dominant axis
  if (extraction > memory && extraction > equity) return "speculator";
  if (displacement > memory) return "developer";
  if (memory > 0) return "reformer";
  return "caretaker";
}
