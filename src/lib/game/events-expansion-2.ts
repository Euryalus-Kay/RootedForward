/**
 * Second events expansion. Additional historical moments, micro-events,
 * and role-specific forced choices. Extends the events table roughly
 * 30% beyond the first expansion.
 */

import type { GameEvent } from "./types";

/* ============================================================== *
 *  1940s-50s additional                                           *
 * ============================================================== */

const MORE_EARLY: GameEvent[] = [
  {
    id: "exp2-black-metropolis-1945",
    year: { from: 1945, to: 1948 },
    title: "Black Metropolis published",
    headline: "A 900-page sociology of Bronzeville hits the bookstores.",
    body:
      "St. Clair Drake and Horace Cayton's 'Black Metropolis' documents the ward-adjacent Bronzeville at unprecedented depth. The book is reshaping how aldermen can talk about race, housing, and policy. You can endorse it, ignore it, or add your ward's data to the next edition.",
    lore:
      "Drake and Cayton's 'Black Metropolis' (1945) is the single most important sociological study of Black Chicago ever published. A companion to 'An American Dilemma' (Myrdal, 1944), it shaped the next generation of civil-rights policy research.",
    source: "Drake and Cayton, Black Metropolis (1945)",
    options: [
      {
        label: "Endorse it publicly; use its data in policy",
        outcome: "endorsed Black Metropolis and used its data in ward policy",
        effect: { knowledge: 3, equity: 2, heritage: 2 },
      },
      {
        label: "Commission a follow-up ward-scale study",
        outcome: "commissioned a ward-scale Black Metropolis follow-up",
        effect: { knowledge: 4, equity: 1 },
      },
      {
        label: "Ignore it",
        outcome: "ignored Black Metropolis",
        effect: { knowledge: -1 },
      },
    ],
  },
  {
    id: "exp2-fair-housing-bill-1948",
    year: { from: 1947, to: 1949 },
    title: "First Chicago fair-housing ordinance",
    headline: "Alderman Eugene Prussing proposes a city fair-housing ordinance.",
    body:
      "The proposal would outlaw racial restrictions in the sale or rental of housing within Chicago. The Property Owners Association is sending delegations. The Urban League is sending delegations. Your vote matters.",
    lore:
      "Chicago's first serious municipal fair-housing proposal came up repeatedly in 1947-1950 but failed. A fair-housing ordinance did not pass until 1963, and federal fair-housing law waited until the Fair Housing Act of 1968.",
    source: "Hirsch, Making the Second Ghetto (1983); Chicago Council journal",
    options: [
      {
        label: "Vote for the ordinance",
        outcome: "voted for the fair-housing ordinance",
        effect: { equity: 4, heritage: 2, trust: 1, power: -1 },
      },
      {
        label: "Vote for a weakened version",
        outcome: "voted for a weakened fair-housing ordinance",
        effect: { equity: 1 },
      },
      {
        label: "Vote against",
        outcome: "voted against the fair-housing ordinance",
        effect: { equity: -3, capital: 1 },
      },
    ],
  },
  {
    id: "exp2-beach-integration-1949",
    year: { from: 1945, to: 1952 },
    title: "Beach integration",
    headline: "A group of Black families plans to swim at the 29th Street beach.",
    body:
      "The 29th Street beach has been effectively whites-only for decades — the informal color line runs in the sand. A group of Black families plans to integrate it this summer. Your office can support publicly, support quietly, or stay out.",
    lore:
      "The 1919 Chicago race riot began at the 29th Street Beach when Eugene Williams, a Black teenager, was stoned to death for drifting across the informal color line. Beach-integration efforts through the 1940s and 50s faced violence. The 63rd Street Beach was finally informally integrated around 1952.",
    source: "Tuttle, Race Riot (1970); Chicago Commission on Race Relations report (1922)",
    options: [
      {
        label: "Support publicly; ask the Park District to enforce integration",
        outcome: "publicly backed beach integration",
        effect: { equity: 4, heritage: 3, trust: 2, power: -1 },
      },
      {
        label: "Quiet support; send staff as observers",
        outcome: "gave quiet support to beach integration",
        effect: { equity: 2, trust: 1 },
      },
      {
        label: "Stay out of it",
        outcome: "stayed out of the beach integration effort",
        effect: { equity: -2 },
      },
    ],
  },
];

/* ============================================================== *
 *  1960s-70s additional                                           *
 * ============================================================== */

const MORE_MID: GameEvent[] = [
  {
    id: "exp2-ceta-funding-1974",
    year: { from: 1973, to: 1979 },
    title: "CETA jobs-program funding",
    headline: "Federal job-training dollars available. Match required.",
    body:
      "The Comprehensive Employment and Training Act makes funds available to local governments. The ward can match and stand up a jobs program: 150 slots for summer youth, 80 slots for adult training. The match is real; so is the long-term return.",
    lore:
      "CETA (1973-1982) was the main federal jobs program between the end of the War on Poverty and the Workforce Investment Act (1998). Chicago's program was among the largest; evaluation results were mixed but positive for targeted groups.",
    source: "Mirengoff and Rindler, The Comprehensive Employment and Training Act (1976)",
    options: [
      {
        label: "Fully match and implement",
        outcome: "fully matched and implemented CETA jobs program",
        effect: { capital: -2, equity: 4, heritage: 2, growth: 2 },
      },
      {
        label: "Match partially",
        outcome: "partially matched CETA funding",
        effect: { equity: 2, growth: 1 },
      },
      {
        label: "Decline",
        outcome: "declined CETA funding",
        effect: { equity: -1 },
      },
    ],
  },
  {
    id: "exp2-boycott-pepsi-1975",
    year: { from: 1974, to: 1978 },
    title: "Boycott a major distributor",
    headline: "Operation Breadbasket calls for a boycott of a major Chicago distributor.",
    body:
      "The distributor has refused to meet hiring benchmarks in Black neighborhoods. Rev. Jackson is calling for a boycott. Your ward's retailers are being asked to participate. The boycott will cost some revenue in the short run.",
    lore:
      "Operation Breadbasket's negotiated hiring covenants shaped several major distributor-hiring patterns through the 1970s. The Pepsi boycott (1974-1975) and the A&P boycott (1971) are two documented examples.",
    source: "Operation PUSH records; Frady, Jesse (1996)",
    options: [
      {
        label: "Endorse the boycott; organize ward retailers to participate",
        outcome: "organized ward participation in the boycott",
        effect: { equity: 3, trust: 2, growth: -1 },
      },
      {
        label: "Endorse without organizing",
        outcome: "endorsed the boycott without organizing",
        effect: { equity: 2, trust: 1 },
      },
      {
        label: "Stay neutral",
        outcome: "stayed neutral on the boycott",
        effect: {},
      },
    ],
  },
  {
    id: "exp2-public-housing-plan-change",
    year: { from: 1972, to: 1978 },
    title: "Scattered-site implementation fight",
    headline: "CHA proposes 200 scattered-site units in the ward's northern blocks.",
    body:
      "The Gautreaux consent decree requires CHA to site units in majority-white areas. Your ward qualifies. The homeowners' association is organizing against. Your vote decides.",
    lore:
      "Judge Richard Austin's 1969 Gautreaux consent decree required CHA to site units in majority-white areas. For a decade CHA built almost nothing, effectively stonewalling. About 2,000 scattered-site units eventually got built.",
    source: "Polikoff, Waiting for Gautreaux (2006)",
    options: [
      {
        label: "Support siting; meet with homeowners' association to explain",
        outcome: "supported scattered-site siting",
        effect: { equity: 5, heritage: 2, power: -2, transformParcels: [{ selector: "random:3", set: { owner: "cha" } }] },
      },
      {
        label: "Propose a reduced unit count",
        outcome: "proposed reduced scattered-site unit count",
        effect: { equity: 2, power: -1 },
      },
      {
        label: "Block the proposal",
        outcome: "blocked scattered-site siting",
        effect: { equity: -4, heritage: -1, power: 2 },
      },
    ],
    glossary: ["Gautreaux"],
  },
  {
    id: "exp2-urban-homesteading-1976",
    year: { from: 1974, to: 1981 },
    title: "Urban Homesteading Program",
    headline: "HUD is distributing vacant HUD-owned homes for $1.",
    body:
      "The Urban Homesteading Program offers vacant HUD-owned homes for nominal price in exchange for a rehabilitation commitment. Your ward has eligible homes. You can organize the uptake.",
    lore:
      "Section 810 Urban Homesteading (1974-1991) transferred about 3,300 vacant HUD homes to low-income homesteaders. Philadelphia was the largest participant. Chicago's program produced smaller numbers but meaningful parcel-scale effects.",
    source: "HUD Urban Homesteading Program reports",
    options: [
      {
        label: "Aggressively organize uptake",
        outcome: "organized aggressive uptake of homesteading program",
        effect: { equity: 3, heritage: 2, growth: 2, transformParcels: [{ selector: "type:vacant", delta: { condition: 12 } }] },
      },
      {
        label: "Low-key participation",
        outcome: "low-key participated in homesteading",
        effect: { equity: 1, growth: 1 },
      },
      {
        label: "Decline",
        outcome: "declined homesteading participation",
        effect: {},
      },
    ],
  },
];

/* ============================================================== *
 *  1980s-90s additional                                           *
 * ============================================================== */

const MORE_EIGHTIES: GameEvent[] = [
  {
    id: "exp2-rlto-passage-1986",
    year: { from: 1985, to: 1987 },
    title: "Residential Landlord and Tenant Ordinance",
    headline: "The RLTO is on the Council agenda.",
    body:
      "The ordinance creates habitability standards, security-deposit protection, retaliation protection, and tenant remedies for failed services. Landlord lobby is fighting. Your vote matters.",
    lore:
      "Chicago's RLTO, passed December 2, 1986, remains one of the strongest tenant-protection ordinances in the United States. Its passage was a Washington-coalition victory. Amendments through 2020-2023 further strengthened it.",
    source: "Chicago Residential Landlord and Tenant Ordinance legislative history",
    options: [
      {
        label: "Vote for the full RLTO",
        outcome: "voted for the full RLTO",
        effect: { equity: 4, trust: 2, heritage: 1, power: -1 },
      },
      {
        label: "Vote for amended RLTO with carve-outs",
        outcome: "voted for amended RLTO",
        effect: { equity: 2, trust: 1 },
      },
      {
        label: "Vote no",
        outcome: "voted no on RLTO",
        effect: { equity: -3, capital: 1 },
      },
    ],
  },
  {
    id: "exp2-cabrini-occupation-1989",
    year: { from: 1987, to: 1992 },
    title: "Cabrini-Green Local Advisory Council negotiation",
    headline: "The Cabrini LAC has occupied the CHA office for 14 days.",
    body:
      "The CHA wants to demolish the 1230 N. Burling building and relocate 492 families. The LAC wants one-for-one replacement in the neighborhood, not vouchers to other Southside tower projects. CHA and the LAC are stuck. You can mediate.",
    lore:
      "Cabrini-Green tenants organized fiercely against demolition through the 1990s. The 1995 tenant buyout of Cabrini's Wayman AME Church was a landmark. Pattillo (2007) documents the resident-organizing tradition at Cabrini.",
    source: "Pattillo, Black on the Block (2007); Hunt, Blueprint for Disaster (2009)",
    options: [
      {
        label: "Back the LAC's one-for-one demand; introduce a council ordinance",
        outcome: "backed the Cabrini LAC's one-for-one demand",
        effect: { equity: 4, heritage: 3, trust: 2, power: -2 },
      },
      {
        label: "Broker a compromise voucher package",
        outcome: "brokered a Cabrini voucher package",
        effect: { equity: 1, trust: 1 },
      },
      {
        label: "Stand with the CHA plan",
        outcome: "stood with the CHA demolition plan",
        effect: { equity: -3, heritage: -2, trust: -2, capital: 2 },
      },
    ],
    glossary: ["CHA", "PlanForTransformation"],
  },
  {
    id: "exp2-wilson-crime-act-1994",
    year: { from: 1993, to: 1996 },
    title: "Crime Bill implementation",
    headline: "Federal Crime Bill offers $8M for ward policing.",
    body:
      "The 1994 Violent Crime Control and Law Enforcement Act makes federal dollars available for local policing expansion. The funds require a 3-year ramp-up to permanent hiring. Accepting locks in long-term policing cost; declining leaves federal money on the table.",
    lore:
      "The 1994 Crime Bill was the largest federal criminal-justice law of the decade. Its COPS program funded 100,000 local officers nationwide. Scholarly analysis (Alexander 2010, others) has treated it as foundational to mass incarceration.",
    source: "Violent Crime Control and Law Enforcement Act of 1994",
    options: [
      {
        label: "Refuse the grant; invest in alternatives",
        outcome: "refused the Crime Bill grant, invested in alternatives",
        effect: { equity: 3, trust: 2, capital: -2 },
      },
      {
        label: "Accept with community-policing emphasis",
        outcome: "accepted the grant with community-policing emphasis",
        effect: { equity: 1, capital: 3, trust: 1 },
      },
      {
        label: "Accept with traditional policing",
        outcome: "accepted the grant with traditional policing",
        effect: { equity: -3, trust: -2, capital: 4, setFlag: "policing-heavy" },
      },
    ],
  },
];

/* ============================================================== *
 *  2000s-2010s additional                                         *
 * ============================================================== */

const MORE_MODERN: GameEvent[] = [
  {
    id: "exp2-parking-meter-privatization-2008",
    year: { from: 2008, to: 2010 },
    title: "Parking-meter privatization",
    headline: "Morgan Stanley bid: $1.15B for 75 years of parking meters.",
    body:
      "Mayor Daley wants council approval within 48 hours. The deal has not been public-reviewed; the price is widely believed to be tens of millions under market. Your vote matters; the deal will shape the city's fiscal position for a generation.",
    lore:
      "Chicago's 2008 parking-meter privatization sold 75 years of meter revenue to Chicago Parking Meters LLC for $1.15B. Inspector General David Hoffman's 2009 report concluded the deal was undervalued by about $1B. The city is still paying in various ways.",
    source: "Chicago Inspector General report on parking-meter privatization (2009); Farmer, 'The Worst Parking Meter Deal Ever' (2018)",
    options: [
      {
        label: "Vote no; demand independent valuation",
        outcome: "voted no on parking-meter privatization",
        effect: { knowledge: 2, equity: 2, sustainability: 1 },
      },
      {
        label: "Vote yes with community-benefits conditions",
        outcome: "voted yes with CBA conditions",
        effect: { capital: 3, equity: -1, sustainability: -1 },
      },
      {
        label: "Vote yes",
        outcome: "voted yes on parking-meter privatization",
        effect: { capital: 4, equity: -3, heritage: -1, sustainability: -2 },
      },
    ],
  },
  {
    id: "exp2-olympic-bid-2009",
    year: { from: 2007, to: 2010 },
    title: "2016 Olympics bid",
    headline: "Chicago is bidding for the 2016 Summer Olympics.",
    body:
      "The bid includes a proposed stadium in your ward's industrial corridor. Bid wins: infrastructure investment, jobs. Bid loses: some infrastructure money still flows, some does not. The neighborhood-displacement pressure from bid speculation is already real.",
    lore:
      "Chicago bid for the 2016 Olympics; the IOC chose Rio in October 2009 in the first round. Chicago's bid would have cost substantial public money; opposition organizing (No Games Chicago) predicted displacement impacts.",
    source: "Chicago 2016 bid records; No Games Chicago campaign records",
    options: [
      {
        label: "Oppose the bid; organize against displacement",
        outcome: "opposed the Olympic bid",
        effect: { equity: 2, heritage: 2, sustainability: 1, growth: -1 },
      },
      {
        label: "Support with anti-displacement conditions",
        outcome: "supported the bid with anti-displacement conditions",
        effect: { growth: 2, equity: 1, capital: 2 },
      },
      {
        label: "Support unconditionally",
        outcome: "supported the Olympic bid unconditionally",
        effect: { growth: 3, capital: 2, equity: -3, heritage: -2 },
      },
    ],
  },
  {
    id: "exp2-school-closures-2013",
    year: { from: 2012, to: 2015 },
    title: "CPS school closures",
    headline: "50 schools proposed for closure. 12 are in your ward.",
    body:
      "The Emanuel administration is proposing the largest single-district school-closure in U.S. history. Your ward stands to lose 12 schools. Community hearings are running.",
    lore:
      "Chicago Public Schools closed 49 schools in 2013 under the Emanuel administration, the largest such closure in U.S. history. Ewing's 'Ghosts in the Schoolyard' (2018) is the canonical analysis. Hearings drew thousands of parents; closures went ahead anyway.",
    source: "Ewing, Ghosts in the Schoolyard (2018)",
    weight: 2,
    options: [
      {
        label: "Testify against every ward-school closure; organize mass action",
        outcome: "organized against every closure",
        effect: { equity: 4, heritage: 3, trust: 3, power: -1, transformParcels: [{ selector: "type:school", delta: { memory: 8 } }] },
      },
      {
        label: "Negotiate sparing some schools",
        outcome: "negotiated sparing some schools from closure",
        effect: { equity: 1, heritage: 1, trust: 1 },
      },
      {
        label: "Accept the plan",
        outcome: "accepted the school-closure plan",
        effect: { equity: -4, heritage: -3, trust: -3, capital: 1 },
      },
    ],
  },
  {
    id: "exp2-laquan-mcdonald-2015",
    year: { from: 2014, to: 2017 },
    title: "Laquan McDonald video release",
    headline: "A video of a Chicago police killing is finally released.",
    body:
      "The October 2014 police killing of Laquan McDonald was not released publicly until court order in November 2015. The gap was politically managed. Your response now shapes how the ward engages.",
    lore:
      "Laquan McDonald, 17, was shot 16 times by Chicago police officer Jason Van Dyke on October 20, 2014. The video was suppressed until court order on November 24, 2015, 13 months later. The Emanuel administration's handling prompted state-attorney resignation and federal consent decree. Van Dyke was convicted in October 2018.",
    source: "People v. Jason Van Dyke, 2018; COPA records",
    weight: 2,
    options: [
      {
        label: "Demand federal DOJ investigation and consent decree",
        outcome: "demanded federal DOJ investigation",
        effect: { equity: 4, heritage: 3, trust: 3, power: -1 },
      },
      {
        label: "Support independent oversight reforms",
        outcome: "supported independent police oversight",
        effect: { equity: 2, trust: 2 },
      },
      {
        label: "Accept the administration's handling",
        outcome: "accepted the administration's handling",
        effect: { equity: -3, trust: -2 },
      },
    ],
  },
  {
    id: "exp2-606-opening-2015",
    year: { from: 2014, to: 2017 },
    title: "The 606 trail opens",
    headline: "2.7-mile elevated rail-to-trail opens in Humboldt Park.",
    body:
      "The 606 has brought trail-oriented retail and rapid rent increases along its length. Your ward has a portion. You can lock down affordability covenants now, before the full price effect hits, or accept the market trajectory.",
    lore:
      "The 606, opened June 2015, produced documented gentrification in Humboldt Park. DePaul's IHS documented 20-40% rent increases within a half-mile radius in the first three years. Ward-level anti-displacement ordinances (Northwest Side, 2018) partially mitigated but came years late.",
    source: "DePaul IHS, Gentrification and the 606 Trail (2019)",
    options: [
      {
        label: "Lock affordability covenants on all rental buildings within half mile",
        outcome: "locked 606 affordability covenants",
        effect: { equity: 4, sustainability: 2, heritage: 2, growth: -1 },
      },
      {
        label: "Anti-displacement fund for displaced residents",
        outcome: "funded anti-displacement assistance",
        effect: { equity: 2, sustainability: 1, capital: -2 },
      },
      {
        label: "Let the market play out",
        outcome: "let the market play out around the 606",
        effect: { equity: -4, heritage: -2, growth: 2, setFlag: "fast-track-permits" },
      },
    ],
  },
  {
    id: "exp2-opc-cba-2018",
    year: { from: 2017, to: 2021 },
    title: "Obama Presidential Center CBA",
    headline: "The OPC is coming to Jackson Park. The coalition wants a CBA.",
    body:
      "A coalition of community organizations is demanding a Community Benefits Agreement. The Obama Foundation says they won't sign one. You can join the coalition or negotiate directly.",
    lore:
      "The Obama Presidential Center, announced 2016 for Jackson Park, was a landmark CBA fight. The CBA Coalition demanded affordability, jobs, and anti-displacement commitments. The Foundation ultimately signed no CBA; some commitments were secured through the city.",
    source: "Obama CBA Coalition records; Preservation Chicago coverage",
    options: [
      {
        label: "Join the CBA Coalition; pressure the Foundation",
        outcome: "joined the OPC CBA Coalition",
        effect: { equity: 4, heritage: 2, trust: 2 },
      },
      {
        label: "Negotiate separate ward-level commitments",
        outcome: "negotiated separate ward-level OPC commitments",
        effect: { equity: 2, capital: 2 },
      },
      {
        label: "Stay out of the CBA fight",
        outcome: "stayed out of the OPC CBA fight",
        effect: { equity: -1 },
      },
    ],
  },
];

/* ============================================================== *
 *  2020s-30s additional                                           *
 * ============================================================== */

const MORE_LATE: GameEvent[] = [
  {
    id: "exp2-prp-defund-2020",
    year: { from: 2020, to: 2023 },
    title: "Defund-the-police vote",
    headline: "City Council budget vote includes police-funding amendment.",
    body:
      "An amendment proposes a 10% cut to CPD and reallocation to violence interrupters, mental health, and housing. Your vote matters. Organizers and police union are both mobilizing.",
    lore:
      "Chicago's 2020 budget debates featured 'defund' amendments that never passed in full. Violence-interruption funding rose through 2022. Brandon Johnson's 2023 election changed the budget discourse. 'Treatment Not Trauma' won a non-binding 2023 referendum.",
    source: "Chicago City Council budget records; Treatment Not Trauma Coalition",
    options: [
      {
        label: "Vote for the amendment",
        outcome: "voted for the police-reallocation amendment",
        effect: { equity: 4, heritage: 2, trust: 3, power: -1 },
      },
      {
        label: "Vote for a smaller reallocation",
        outcome: "voted for a smaller police reallocation",
        effect: { equity: 2, trust: 1 },
      },
      {
        label: "Vote against",
        outcome: "voted against the amendment",
        effect: { equity: -3, trust: -2, setFlag: "policing-heavy" },
      },
    ],
  },
  {
    id: "exp2-bring-chicago-home-2024",
    year: { from: 2023, to: 2025 },
    title: "Bring Chicago Home referendum",
    headline: "Graduated mansion-tax referendum on the March primary ballot.",
    body:
      "The referendum would graduated real-estate transfer tax on sales over $1M with revenue dedicated to homelessness services. The real-estate lobby is fighting. Your ward's turnout matters.",
    lore:
      "The 'Bring Chicago Home' referendum was on the March 2024 Democratic primary ballot. It failed narrowly after a prolonged legal fight (initially blocked by judge, restored by court of appeals). The coalition continues.",
    source: "Bring Chicago Home coalition; 2024 primary results",
    options: [
      {
        label: "Go all-in for the referendum; door-knock your ward",
        outcome: "went all-in for Bring Chicago Home",
        effect: { equity: 4, trust: 2, power: -2 },
      },
      {
        label: "Quiet endorsement",
        outcome: "quietly endorsed the referendum",
        effect: { equity: 1 },
      },
      {
        label: "Oppose",
        outcome: "opposed Bring Chicago Home",
        effect: { equity: -3, capital: 2 },
      },
    ],
  },
  {
    id: "exp2-migrant-shelter-2023",
    year: { from: 2022, to: 2025 },
    title: "Migrant shelter siting",
    headline: "The mayor wants to use the ward park field house as a shelter.",
    body:
      "Venezuelan asylum-seekers are arriving on Greg Abbott's buses. Shelter capacity is stretched. The ward field house is proposed as a 200-bed emergency shelter. Neighbors are organizing, some for, some against.",
    lore:
      "Greg Abbott's Operation Lone Star bused asylum-seekers to Chicago and other sanctuary cities starting 2022. Chicago's shelter system was overwhelmed; several neighborhood gyms and field houses were temporarily converted. Mayor Johnson's response was contested.",
    source: "City of Chicago migrant response reports; Block Club Chicago 2022-2024 coverage",
    options: [
      {
        label: "Open the shelter; organize volunteer supports and language services",
        outcome: "opened the shelter with volunteer support",
        effect: { equity: 4, heritage: 2, trust: 2, capital: -1 },
      },
      {
        label: "Open the shelter, minimal supports",
        outcome: "opened the shelter with minimal supports",
        effect: { equity: 2, heritage: 1 },
      },
      {
        label: "Block the shelter",
        outcome: "blocked the shelter",
        effect: { equity: -4, heritage: -2, trust: -2 },
      },
    ],
  },
  {
    id: "exp2-cta-safety-2026",
    year: { from: 2024, to: 2030 },
    title: "CTA safety proposal",
    headline: "A proposal to put more CPD officers on buses and trains.",
    body:
      "Violent incidents on CTA are up. The proposal adds 200 CPD officers to transit patrol. An alternative proposal adds unarmed ambassadors, mental-health responders, and fare-enforcement officers.",
    lore:
      "CTA safety has been a persistent political issue. The 2022-2024 transit-safety debates featured proposals ranging from armed police expansion to unarmed ambassadors. Comparisons with Portland and Seattle transit-safety models have been frequent.",
    source: "CTA Board reports; RTA transit-safety studies",
    options: [
      {
        label: "Support the ambassador/mental-health alternative",
        outcome: "supported the transit-ambassador model",
        effect: { equity: 3, sustainability: 2, trust: 2 },
      },
      {
        label: "Support a mixed approach",
        outcome: "supported a mixed transit-safety approach",
        effect: { equity: 1, sustainability: 1 },
      },
      {
        label: "Support armed CPD expansion",
        outcome: "supported armed CPD transit expansion",
        effect: { equity: -3, trust: -2, setFlag: "policing-heavy" },
      },
    ],
  },
  {
    id: "exp2-climate-bond-2028",
    year: { from: 2026, to: 2035 },
    title: "Climate-adaptation bond",
    headline: "$500M climate bond on the November ballot.",
    body:
      "The bond would fund stormwater, heat-island, and grid-resilience projects citywide. The ward would see significant investment if passed. Property-tax impact is a dollar-a-month on the typical bill.",
    lore:
      "Climate-adaptation bonds have been proposed in several U.S. cities. New Orleans (2019), New York (2023), and Seattle (2023) passed versions. Chicago's 2024 capital-budget discussion featured early climate-bond proposals.",
    source: "City of Chicago 2024 capital-planning discussions; NACo climate-bond tracking",
    options: [
      {
        label: "Endorse; actively campaign",
        outcome: "actively campaigned for the climate bond",
        effect: { sustainability: 4, equity: 2, heritage: 1, capital: -1 },
      },
      {
        label: "Quiet endorsement",
        outcome: "quietly endorsed the climate bond",
        effect: { sustainability: 2, equity: 1 },
      },
      {
        label: "Oppose",
        outcome: "opposed the climate bond",
        effect: { sustainability: -2 },
      },
    ],
  },
];

/* ============================================================== *
 *  Export                                                         *
 * ============================================================== */

export const EXPANSION_EVENTS_2: GameEvent[] = [
  ...MORE_EARLY,
  ...MORE_MID,
  ...MORE_EIGHTIES,
  ...MORE_MODERN,
  ...MORE_LATE,
];
