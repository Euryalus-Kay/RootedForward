/**
 * Follow-up cards.
 *
 * These are cards that appear in the draw pool ONLY if the player has
 * already set a specific flag in an earlier era. They are the unlock
 * chains that make strategy matter: the 1960 decision to back the CBL
 * opens a 1985 card that wouldn't be playable otherwise; a 1977 CRA
 * office opens a 2020 CRA enforcement expansion; a 1945 mortgage pool
 * opens a 1980s community-bank consolidation play.
 *
 * Each card lists `requiresFlag` keying off the flags in flags.ts. The
 * draw engine filters on this (see availableCards in cards.ts).
 */

import type { Card } from "./types";

export const FOLLOWUP_CARDS: Card[] = [
  /* ========= Chain: municipal mortgage pool ========================= */
  {
    id: "fu-mortgage-pool-expand-1985",
    name: "Expand the municipal mortgage pool",
    flavor: "The fund survived two recessions. Scale it.",
    description:
      "Your 1940s municipal mortgage pool turns out to be the ward's most resilient financial institution. Scale the fund, securitize second mortgages, and extend lending into adjacent blocks.",
    lore:
      "Community banks and municipal lending pools that survived the 1970s oil shocks and the 1980s S&L crisis often emerged stronger. Illinois Federal Savings (1934) and Seaway National (1965) are Chicago examples.",
    source: "Baradaran, The Color of Money (2017)",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 1980,
    toYear: 2010,
    requiresFlag: "municipal-lending",
    effect: {
      equity: 4,
      growth: 3,
      heritage: 1,
      transformParcels: [
        { selector: "holc:D", delta: { value: 5, condition: 2 } },
        { selector: "holc:C", delta: { value: 3 } },
      ],
    },
  },
  {
    id: "fu-mortgage-pool-reparative-2020",
    name: "Reparative mortgage: descendants' program",
    flavor: "The ward lends first. The federal program lends second.",
    description:
      "Decades of municipal lending data lets you launch a reparative mortgage program targeted to descendants of the families the FHA refused. Below-market rates, simplified underwriting, measurable outcomes.",
    lore:
      "Reparative mortgage programs are being piloted in Evanston, St. Paul, and several other U.S. cities. Municipal data is a prerequisite.",
    source: "Evanston Restorative Housing Program records",
    category: "finance",
    rarity: "rare",
    cost: { capital: 4, power: 2, knowledge: 2 },
    fromYear: 2020,
    toYear: 2040,
    requiresFlag: "municipal-lending",
    effect: {
      equity: 6,
      heritage: 3,
      growth: 1,
    },
  },

  /* ========= Chain: CRA enforcement ================================= */
  {
    id: "fu-cra-expansion-2008",
    name: "CRA enforcement wins the subprime reset",
    flavor: "The data you've been keeping is a shield.",
    description:
      "Your ward's CRA enforcement office has been documenting lending patterns for thirty years. In the subprime crisis, that data lets you force the worst-actor banks into settlement and redirect settlement money to foreclosure-prevention.",
    lore:
      "A handful of U.S. cities with serious CRA data practices (Cleveland, Baltimore, Chicago Woodstock Institute) were able to use Troubled Asset Relief Program settlements to fund foreclosure-prevention work at scale.",
    source: "Woodstock Institute CRA compliance reports",
    category: "finance",
    rarity: "rare",
    cost: { knowledge: 2, power: 2 },
    fromYear: 2007,
    toYear: 2012,
    requiresFlag: "cra-office",
    effect: {
      equity: 5,
      capital: 3,
      heritage: 2,
      transformParcels: [
        { selector: "type:vacant", set: { owner: "land-trust" } },
      ],
    },
  },

  /* ========= Chain: land bank / community stewardship ============== */
  {
    id: "fu-land-bank-expansion",
    name: "Expand the land bank tenfold",
    flavor: "The model is proven. The budget is approved.",
    description:
      "Your land bank operates at a scale no other ward's does. Expand acquisition tenfold, partner with the Chicago Community Land Trust, and move 30+ parcels into permanent community stewardship.",
    lore:
      "Cook County Land Bank Authority (2013) and Detroit Land Bank (2014) are the U.S. benchmarks. Scaling is cheap once the operational model and financing are proven.",
    source: "Cook County Land Bank Authority scale reports",
    category: "finance",
    rarity: "rare",
    cost: { capital: 4, power: 2 },
    fromYear: 2020,
    toYear: 2040,
    requiresFlag: "land-bank-active",
    effect: {
      equity: 5,
      heritage: 3,
      sustainability: 2,
      transformParcels: [
        { selector: "type:vacant", set: { owner: "land-trust" } },
        { selector: "owner:absentee", set: { owner: "land-trust" } },
      ],
    },
  },

  /* ========= Chain: tower rehab ===================================== */
  {
    id: "fu-tower-rehab-expansion",
    name: "Second tower rehab",
    flavor: "The first rehab worked. The model scales.",
    description:
      "Your ward's deep-rehab of the first CHA tower created a template. Extend the model to every remaining tower and lock in long-term working-class affordability.",
    lore:
      "Dearborn Homes' rehab (2010-2012) demonstrated that deep-rehab at scale was feasible. Its replication has been limited mostly by political will and HUD capital allocation.",
    source: "Dearborn Homes rehab project reports",
    category: "housing",
    rarity: "rare",
    cost: { capital: 5, power: 2 },
    fromYear: 2010,
    toYear: 2030,
    requiresFlag: "tower-rehabbed",
    effect: {
      equity: 5,
      heritage: 4,
      sustainability: 2,
      transformParcels: [
        { selector: "type:tower", set: { type: "rehab-tower" }, delta: { condition: 40 } },
      ],
    },
    glossary: ["CHA", "PlanForTransformation"],
  },

  /* ========= Chain: preservation overlay ============================ */
  {
    id: "fu-preservation-expand",
    name: "Expand preservation citywide",
    flavor: "The overlay held. Extend it.",
    description:
      "Your preservation overlay has prevented teardowns for a generation. Expand the overlay to cover the cultural district and adjacent blocks.",
    lore:
      "Chicago landmarks covers about 2% of the city's buildings. Expansion has been a perennial reform target.",
    source: "Landmarks Illinois preservation-scaling studies",
    category: "preservation",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 2 },
    fromYear: 1985,
    toYear: 2040,
    requiresFlag: "preservation-overlay",
    effect: {
      heritage: 5,
      equity: 2,
      transformParcels: [
        { selector: "block:3", set: { protected: true } },
        { selector: "block:4", set: { protected: true } },
      ],
    },
  },

  /* ========= Chain: covenants / fair housing ======================== */
  {
    id: "fu-shelley-follow-through-1968",
    name: "Fair-housing enforcement office",
    flavor: "The ruling was the easy part. The enforcement is the work.",
    description:
      "Your ward's early amicus in Shelley v. Kraemer means you have a functional fair-housing enforcement network by 1968. When the Fair Housing Act passes, you're ready to file complaints on day one.",
    lore:
      "Local fair-housing enforcement varied wildly. Chicago's Leadership Council for Metropolitan Open Communities (1966) was among the most active U.S. enforcement offices. Pre-existing infrastructure mattered enormously.",
    source: "Leadership Council for Metropolitan Open Communities records",
    category: "organizing",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 1968,
    toYear: 1985,
    requiresFlag: "covenants-challenged",
    effect: {
      equity: 4,
      heritage: 2,
      trust: 1,
    },
    glossary: ["Covenants"],
  },

  /* ========= Chain: Summit Agreement enforcement =================== */
  {
    id: "fu-summit-enforcement-expand-1975",
    name: "Summit Agreement audit",
    flavor: "Daley signed it. The audit will prove it.",
    description:
      "You commission an independent audit of Summit Agreement compliance. The audit becomes the legal baseline for every subsequent fair-housing suit in the ward.",
    lore:
      "Summit Agreement compliance was never formally audited. A compliance audit would have changed the 1970s fair-housing landscape dramatically.",
    source: "Ralph, Northern Protest (1993)",
    category: "research",
    rarity: "rare",
    cost: { knowledge: 3, power: 2 },
    fromYear: 1975,
    toYear: 1990,
    requiresFlag: "summit-enforced",
    effect: {
      equity: 5,
      heritage: 2,
      knowledge: 2,
    },
  },

  /* ========= Chain: Gautreaux ======================================= */
  {
    id: "fu-gautreaux-scaled-1985",
    name: "Scale Gautreaux-style relocation",
    flavor: "The consent decree delivered. The program scales.",
    description:
      "Your ward's early backing of Gautreaux means you have the political network and administrative template to scale the relocation program's methodology citywide in the mid-1980s.",
    lore:
      "Rubinowitz and Rosenbaum's longitudinal studies of Gautreaux showed meaningful educational and employment effects. Scaling would have compounded the gains.",
    source: "Rubinowitz and Rosenbaum, Crossing the Class and Color Lines (2000)",
    category: "housing",
    rarity: "rare",
    cost: { capital: 3, power: 3, knowledge: 2 },
    fromYear: 1980,
    toYear: 2000,
    requiresFlag: "gautreaux-backed",
    effect: {
      equity: 6,
      heritage: 2,
      sustainability: 2,
    },
    glossary: ["Gautreaux"],
  },

  /* ========= Chain: climate adaptation ============================= */
  {
    id: "fu-climate-bond-issue",
    name: "Issue a climate-adaptation bond",
    flavor: "The plan is on paper. The bond is on the ballot.",
    description:
      "Your climate-adaptation plan's phased design makes it bond-financeable. A $200M ward climate bond passes on a November ballot. Funding covers the plan's second decade.",
    lore:
      "New Orleans' 2019 climate bond ($500M) is the U.S. model. New York (2023), Seattle (2023) followed. Plan-first, bond-second is a standard sequence.",
    source: "NACo climate-bond tracking",
    category: "environment",
    rarity: "rare",
    cost: { power: 2, knowledge: 2 },
    fromYear: 2030,
    toYear: 2040,
    requiresFlag: "climate-plan-active",
    effect: {
      sustainability: 6,
      equity: 3,
      capital: 4,
    },
  },
  {
    id: "fu-green-infra-scale-2035",
    name: "Green infrastructure citywide scale-up",
    flavor: "The pilot worked. The city imports the model.",
    description:
      "Your green-infrastructure retrofits in the ward become the citywide standard. Your firm designs them. Your ward funds its own maintenance through the citywide contract.",
    lore:
      "Philadelphia's Green City Clean Waters program (2011-2036) is a $2.4B program that builds on neighborhood-scale pilots. Similar scale-ups in Milwaukee and Cincinnati.",
    source: "Philadelphia Green City Clean Waters",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 2 },
    fromYear: 2030,
    toYear: 2040,
    requiresFlag: "green-infrastructure",
    effect: {
      sustainability: 5,
      equity: 2,
      growth: 2,
    },
  },

  /* ========= Chain: reparations scaling ============================ */
  {
    id: "fu-reparations-scale",
    name: "Reparations program scaling",
    flavor: "Evanston is small. Your ward is next.",
    description:
      "Your ward's reparations ordinance becomes the Illinois model. State legislation tracks it. The housing-grant program scales from tens to hundreds of families per year.",
    lore:
      "Illinois HR 36 and several municipal reparations bills have been modeled on Evanston. Scaling depends on proof-of-concept at ward level.",
    source: "Evanston Restorative Housing Program scaling analyses",
    category: "finance",
    rarity: "rare",
    cost: { power: 3, capital: 3 },
    fromYear: 2025,
    toYear: 2040,
    requiresFlag: "reparations-passed",
    effect: {
      equity: 7,
      heritage: 4,
      transformParcels: [
        { selector: "holc:D", delta: { value: 3, condition: 3, memory: 6 } },
        { selector: "holc:C", delta: { value: 2, memory: 4 } },
      ],
    },
  },

  /* ========= Chain: baby bonds / equity ============================ */
  {
    id: "fu-baby-bonds-mature",
    name: "First baby-bonds cohort matures",
    flavor: "The first kids are eighteen. The accounts are open.",
    description:
      "The first cohort of baby-bond recipients reaches 18 and begins drawing. Down-payment assistance, college tuition, small business capital. A quiet compounding of generational wealth.",
    lore:
      "Connecticut's 2022 baby-bonds program is projected to pay out starting 2040. First-cohort outcomes will be decisive for scaling.",
    source: "CT Baby Bonds program projections",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 2 },
    fromYear: 2035,
    toYear: 2040,
    requiresFlag: "baby-bonds-active",
    effect: {
      equity: 5,
      growth: 3,
      heritage: 2,
    },
  },

  /* ========= Chain: guaranteed income ============================== */
  {
    id: "fu-gi-permanent",
    name: "Permanent guaranteed income",
    flavor: "The pilot is done. The program is permanent.",
    description:
      "Your guaranteed-income pilot's outcomes justify making the program permanent. 2,000 families at $500/month, funded by TIF surplus and a small property-tax levy.",
    lore:
      "A handful of U.S. cities have moved from guaranteed-income pilots to permanent programs. Evidence has generally been strong.",
    source: "Mayors for a Guaranteed Income program network data",
    category: "finance",
    rarity: "rare",
    cost: { capital: 4, power: 2 },
    fromYear: 2030,
    toYear: 2040,
    requiresFlag: "gi-pilot-active",
    effect: {
      equity: 6,
      heritage: 2,
      sustainability: 2,
    },
  },

  /* ========= Chain: right-to-counsel =============================== */
  {
    id: "fu-rtc-expand-services",
    name: "Right-to-counsel plus housing navigator",
    flavor: "The lawyer wins the case. The navigator keeps the apartment.",
    description:
      "Pair every right-to-counsel legal case with a housing-navigator who helps the tenant stabilize after the court win. Evictions drop further; re-filing rates drop.",
    lore:
      "New York's integrated right-to-counsel plus navigator programs have shown stronger outcomes than legal-only programs.",
    source: "NYC Right to Counsel Coalition evaluation",
    category: "organizing",
    rarity: "uncommon",
    cost: { capital: 2 },
    fromYear: 2025,
    toYear: 2040,
    requiresFlag: "rtc-active",
    effect: {
      equity: 4,
      heritage: 1,
    },
  },

  /* ========= Chain: cultural district ============================== */
  {
    id: "fu-cultural-corridor-scale",
    name: "Cultural corridor anchor fund",
    flavor: "The district is designated. The anchor tenants are funded.",
    description:
      "Establish a permanent fund that subsidizes anchor arts tenants and legacy businesses in the cultural district. Heritage compounds; displacement of the district itself prevented.",
    lore:
      "Pilsen's Cultural District and San Francisco's Mission Cultural Center are examples of sustained-funding models for cultural-district preservation.",
    source: "San Francisco Cultural Centers program",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 3, power: 1 },
    fromYear: 2020,
    toYear: 2040,
    requiresFlag: "cultural-district",
    effect: {
      heritage: 5,
      equity: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "type:mural", delta: { memory: 10 } },
        { selector: "type:commercial", delta: { memory: 6 } },
      ],
    },
  },

  /* ========= Chain: community schools ============================== */
  {
    id: "fu-community-schools-wraparound-decade",
    name: "Community-schools decade evaluation",
    flavor: "Decade of outcomes. Citations. Scale.",
    description:
      "A decade of community-schools operation produces peer-reviewed outcomes. Your model gets scaled citywide with your ward's staff as the implementation team.",
    lore:
      "Community schools have a growing evidence base; decade-long outcomes data is the threshold for citywide scaling.",
    source: "Coalition for Community Schools decadal evaluations",
    category: "schools",
    rarity: "uncommon",
    cost: { knowledge: 2 },
    fromYear: 2020,
    toYear: 2040,
    requiresFlag: "community-schools-active",
    effect: {
      equity: 4,
      heritage: 2,
      knowledge: 2,
    },
  },

  /* ========= Chain: violence interrupters ========================== */
  {
    id: "fu-interrupters-state-model",
    name: "State-level violence-interrupter funding",
    flavor: "The model works. The state funds it.",
    description:
      "Your ward's violence-interrupter outcomes are the basis for state-level funding. Illinois establishes a line item. Your funding is permanent; staff can plan past the next budget.",
    lore:
      "Illinois's Reimagine Public Safety Act (2021) provided state-level funding for violence-interruption based on city-scale evidence.",
    source: "Reimagine Public Safety Act of 2021",
    category: "organizing",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 2025,
    toYear: 2040,
    requiresFlag: "violence-interrupters-active",
    effect: {
      equity: 4,
      heritage: 2,
      trust: 1,
    },
  },

  /* ========= Chain: industrial transition ========================== */
  {
    id: "fu-industrial-transition-realized",
    name: "Industrial corridor redevelopment delivers",
    flavor: "Your plan from the 1950s pays off.",
    description:
      "The industrial-transition plan you drafted pre-stockyards-closure becomes the basis for the 1980s-90s corridor redevelopment. Jobs stay; construction stays. The layoff decades do less long-term damage.",
    lore:
      "Back of the Yards and the South Side industrial corridor lost tens of thousands of jobs from 1971 to 1985. A pre-plan would have materially changed outcomes.",
    source: "Pacyga, Chicago: A Biography (2009)",
    category: "commerce",
    rarity: "rare",
    cost: { capital: 4, knowledge: 2 },
    fromYear: 1980,
    toYear: 2000,
    requiresFlag: "industrial-transition-plan",
    effect: {
      growth: 5,
      equity: 3,
      sustainability: 2,
    },
  },

  /* ========= Chain: negative drift counter =========================== */
  {
    id: "fu-expressway-cap-2030",
    name: "Cap the expressway",
    flavor: "Deck the interstate. Park on top.",
    description:
      "Federal funds now available to deck over the expressway you accepted in the 1960s. Build a 1/2 mile cap with a park and housing on top. Heritage and sustainability recover.",
    lore:
      "Boston's Rose Kennedy Greenway (2004), Dallas's Klyde Warren Park (2012), and the proposed Chicago Sunshine Project over the Eisenhower are all expressway-cap projects.",
    source: "Boston Big Dig / Greenway; Dallas Klyde Warren Park",
    category: "infrastructure",
    rarity: "rare",
    cost: { capital: 5, power: 3, knowledge: 2 },
    fromYear: 2025,
    toYear: 2040,
    requiresFlag: "expressway-built",
    effect: {
      sustainability: 5,
      heritage: 4,
      equity: 2,
      transformParcels: [
        { selector: "type:expressway", set: { type: "park" }, delta: { memory: 8 } },
      ],
    },
    glossary: ["Expressway"],
  },
  {
    id: "fu-tif-reform",
    name: "Retrofit your TIF for affordability",
    flavor: "The district exists. The rules can change.",
    description:
      "Amend your existing TIF district's ordinance to require a 50% affordable-housing allocation. Existing projects grandfathered; new projects bound by the requirement.",
    lore:
      "Chicago's post-2017 TIF reforms allowed mid-district ordinance amendments. Not every TIF took up the option.",
    source: "Chicago TIF Ordinance amendments 2017-2023",
    category: "finance",
    rarity: "uncommon",
    cost: { power: 3, knowledge: 1 },
    fromYear: 2000,
    toYear: 2040,
    requiresFlag: "tif-active",
    effect: {
      equity: 4,
      sustainability: 1,
      setFlag: "tif-affordable",
    },
    glossary: ["TIF"],
  },
];
