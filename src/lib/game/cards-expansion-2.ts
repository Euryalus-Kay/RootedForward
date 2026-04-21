/**
 * Second expansion pack of policy cards.
 *
 * Adds role-signature variants, scenario-specific cards, niche tools
 * for specific flag combinations, and late-game climate and policing
 * reform cards. Written to deepen the mid-game where the first expansion
 * concentrated on historical landmark cards.
 */

import type { Card } from "./types";

/* ============================================================== *
 *  Organizing tools, mid to late                                  *
 * ============================================================== */

const ORGANIZING_CARDS: Card[] = [
  {
    id: "exp2-door-knock-marathon",
    name: "Ward-wide door-knock marathon",
    flavor: "Three hundred volunteers. Three thousand doors. One weekend.",
    description:
      "Every building in the ward gets a visit. The volunteers collect concerns, offer rental-rights information, and register voters. Long-term trust compounds; the database of every household concern becomes a governing tool.",
    lore:
      "Saul Alinsky's IAF model of broad-based organizing relied on exactly this. The Woodlawn Organization in the 1960s, Kenwood-Oakland Community Organization in the 1970s, and United Power for Action and Justice in the 2000s have all used similar methods.",
    source: "Alinsky, Reveille for Radicals (1946); Stout, Blessed Unrest (2007)",
    category: "organizing",
    rarity: "common",
    cost: { trust: 2, capital: 1 },
    fromYear: 1940,
    toYear: 2040,
    effect: { trust: 3, heritage: 1, equity: 2, knowledge: 1 },
  },
  {
    id: "exp2-neighborhood-council",
    name: "Empower a neighborhood council",
    flavor: "Formal advisory board. Real agenda. Real minutes.",
    description:
      "Establish an elected neighborhood council with formal standing in zoning and permit review. The council adds friction to development and gives residents a seat. Growth slows; equity and heritage rise.",
    lore:
      "Portland OR's neighborhood associations (chartered 1974) and Minneapolis's NRP (1990) are the best-studied U.S. neighborhood-council systems. LA's neighborhood councils (2001) are the largest.",
    source: "Berry et al., The Rebirth of Urban Democracy (1993)",
    category: "organizing",
    rarity: "uncommon",
    cost: { power: 2, trust: 1 },
    fromYear: 1970,
    toYear: 2040,
    effect: { trust: 3, heritage: 2, equity: 2, growth: -1 },
  },
  {
    id: "exp2-mutual-aid-hub",
    name: "Establish a mutual-aid hub",
    flavor: "Food. Diapers. Rent help. Zero bureaucracy.",
    description:
      "A storefront that functions as a mutual-aid clearinghouse. No intake paperwork; neighbors help neighbors. Builds lasting community infrastructure; low immediate cost.",
    lore:
      "Mutual aid organizations expanded dramatically during the COVID-19 pandemic. Chicago networks including Chicago Mutual Aid Fund and South Side Mutual Aid distributed millions of dollars and thousands of meals. Dean Spade's 'Mutual Aid' (2020) is a core text.",
    source: "Spade, Mutual Aid (2020); Chicago Mutual Aid network records",
    category: "organizing",
    rarity: "common",
    cost: { trust: 1, capital: 1 },
    fromYear: 1970,
    toYear: 2040,
    effect: { trust: 3, heritage: 2, equity: 2 },
  },
  {
    id: "exp2-youth-organizing-hub",
    name: "Youth organizing center",
    flavor: "High schoolers, trained to campaign.",
    description:
      "A program that trains 50 high-schoolers a year in campaign organizing, legislative research, and public speaking. Alumni populate the next generation of ward politics. Trust and heritage compound long-term.",
    lore:
      "Chicago's BYP100 (2013), CTU's Grassroots Education Movement, and Voices of Youth in Chicago Education (VOYCE) have all trained large cohorts of young organizers. Southwest Youth Collaborative is a 30-year example.",
    source: "BYP100 organizing records; VOYCE program reports",
    category: "organizing",
    rarity: "uncommon",
    cost: { trust: 1, knowledge: 1 },
    fromYear: 1990,
    toYear: 2040,
    effect: { trust: 2, heritage: 2, equity: 2, growth: 1, knowledge: 1 },
  },
  {
    id: "exp2-broad-based-iaf",
    name: "Broad-based IAF affiliate",
    flavor: "Unions, churches, and neighborhood groups, at one table.",
    description:
      "Stand up an IAF affiliate covering your ward and three adjacent. The affiliate takes on property-tax reform, public safety, and school funding as citywide campaigns. Your ward's power projects beyond its borders.",
    lore:
      "United Power for Action and Justice (IAF Chicago, 1997-present) covers 40+ affiliates. Its campaigns on voucher housing, immigration, and public safety have shaped state and local policy.",
    source: "United Power for Action and Justice records",
    category: "organizing",
    rarity: "rare",
    cost: { power: 2, trust: 2 },
    fromYear: 1995,
    toYear: 2040,
    effect: { power: 2, trust: 3, equity: 3, heritage: 1 },
  },
  {
    id: "exp2-participatory-climate-plan",
    name: "Participatory climate planning",
    flavor: "Hundred-person deliberation. One summer.",
    description:
      "A citizens' assembly deliberates the ward's 10-year climate plan. Random selection, expert testimony, structured facilitation, binding-ish conclusions. The plan that emerges is more legitimate and more ambitious than staff-drafted versions.",
    lore:
      "Ireland's Citizens' Assembly (2016) and France's Citoyens pour le Climat (2020) are major examples. U.S. municipal applications include Bowling Green, Kentucky's participatory-budgeting assemblies.",
    source: "OECD, Innovative Citizen Participation (2020)",
    category: "organizing",
    rarity: "uncommon",
    cost: { knowledge: 2, trust: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: { trust: 3, sustainability: 3, knowledge: 2 },
  },
];

/* ============================================================== *
 *  Housing and zoning, late                                       *
 * ============================================================== */

const HOUSING_CARDS: Card[] = [
  {
    id: "exp2-adus-citywide",
    name: "Legalize ADUs citywide",
    flavor: "Basement apartments. Coach houses. Back in.",
    description:
      "Expand the 2021 pilot to citywide legalization. Every single-family lot can add a second unit. Modest supply expansion; modest affordability improvement; no large new construction.",
    lore:
      "Chicago's 2021 ADU pilot legalized accessory units in five zones. Citywide legalization is scheduled for April 1, 2026. Los Angeles's 2017 citywide ADU law produced about 30,000 permitted ADUs in five years.",
    source: "City of Chicago ADU Pilot Program reports; LA Planning Department",
    category: "zoning",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 2021,
    toYear: 2040,
    effect: {
      growth: 2,
      equity: 2,
      sustainability: 2,
      transformParcels: [
        { selector: "type:single-family", delta: { residents: 1 } },
      ],
    },
    glossary: ["ADU"],
  },
  {
    id: "exp2-office-conversion-subsidy",
    name: "LaSalle Street office-conversion subsidy",
    flavor: "Post-remote-work downtown. Empty towers. Missing apartments.",
    description:
      "Subsidize conversion of downtown office towers to apartments with affordability requirements. Adds significant housing supply; reduces downtown vacancies; complements rather than replaces neighborhood construction.",
    lore:
      "Chicago's LaSalle Street Reimagined initiative (2023) targets office-to-residential conversions in the Loop. Similar programs are underway in New York, San Francisco, and Washington DC. Adaptive reuse is cheaper per unit than ground-up construction.",
    source: "City of Chicago LaSalle Street Reimagined RFP",
    category: "housing",
    rarity: "uncommon",
    cost: { capital: 4, power: 2 },
    fromYear: 2023,
    toYear: 2040,
    effect: { growth: 4, equity: 2, sustainability: 2 },
  },
  {
    id: "exp2-shared-equity-homeownership",
    name: "Shared-equity homeownership program",
    flavor: "You buy. The city keeps a piece. Affordable at resale.",
    description:
      "First-time buyers get a shared-equity mortgage where the city or a nonprofit takes a minority equity stake in exchange for capital assistance. On resale, affordability is preserved. Produces affordable homeownership at scale.",
    lore:
      "Champlain Housing Trust (Burlington VT, 1984) is the largest shared-equity U.S. example. Boston, Washington DC, and Denver have sizable programs. The model produces lasting affordability the LIHTC rental model does not.",
    source: "Lincoln Institute of Land Policy shared-equity homeownership studies",
    category: "finance",
    rarity: "rare",
    cost: { capital: 4, knowledge: 2 },
    fromYear: 2000,
    toYear: 2040,
    effect: { equity: 4, heritage: 2, growth: 2 },
  },
  {
    id: "exp2-single-stair-reform",
    name: "Single-stair code reform",
    flavor: "Most of Europe does it. The fire is still mostly out.",
    description:
      "Reform the building code to allow single-stair residential buildings up to 6 stories, matching most European codes. Allows smaller-footprint infill buildings; adds supply without mega-project economics.",
    lore:
      "Seattle passed single-stair reform in 2023. New York's 'Faircloth Amendment' and other reforms have been debated. Point-access-block (PAB) buildings are standard in Europe and produce more livable small-lot infill.",
    source: "Seattle Single-Stair Code Update (2023)",
    category: "zoning",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 2 },
    fromYear: 2023,
    toYear: 2040,
    effect: { growth: 2, sustainability: 2, equity: 1 },
  },
  {
    id: "exp2-co-op-conversion-fund",
    name: "Co-op conversion fund",
    flavor: "Buildings flip to tenant co-op instead of speculator.",
    description:
      "A revolving loan fund finances conversions of rental buildings to tenant cooperatives when they go on the market. Tenants get first right of refusal and financing to exercise it.",
    lore:
      "Chicago's 2018 Tenant Opportunity to Purchase Ordinance included co-op conversion financing, modeled on Washington DC's 1980 TOPA. DC has produced about 4,000 co-op units via TOPA. New York City's HDFC co-ops are the largest U.S. tenant-cooperative portfolio.",
    source: "Chicago TOPA 2018; DC TOPA Act 1980",
    category: "housing",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 2000,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "type:three-flat", set: { owner: "land-trust" } },
      ],
    },
  },
  {
    id: "exp2-naturally-occurring-affordable",
    name: "NOAH preservation loan fund",
    flavor: "The old brick three-flats are already affordable. Keep them that way.",
    description:
      "Establish a loan fund specifically for 'naturally occurring affordable housing' — older buildings already at affordable rents that are at risk of purchase-and-upgrade by speculators. Preserves affordability at a fraction of new-construction cost.",
    lore:
      "NOAH preservation is a rising policy category. Minneapolis's Inclusive Financing Program, Denver's NOAH Fund, and New York's Housing Preservation Trust are the leading U.S. examples. Per-unit cost is typically half of LIHTC new construction.",
    source: "Urban Institute NOAH preservation research",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 3,
      sustainability: 1,
      transformParcels: [
        { selector: "type:two-flat", delta: { condition: 6 } },
        { selector: "type:three-flat", delta: { condition: 6 } },
      ],
    },
  },
  {
    id: "exp2-ptell-reform",
    name: "Property-tax assessment reform",
    flavor: "The assessor, the appeal board, the referee.",
    description:
      "Push for property-tax assessment reform at Cook County level. Regressive under-assessment of high-value properties and over-assessment of low-value properties has been a decades-long pattern. Correcting it redistributes the tax burden.",
    lore:
      "Cook County's 2017-2018 'Tax Divide' series by the Chicago Tribune and ProPublica documented widespread regressivity. Assessor Fritz Kaegi's 2019 reforms have partially addressed it, but the structural issues persist.",
    source: "ProPublica-Chicago Tribune 'The Tax Divide' (2017-2018)",
    category: "finance",
    rarity: "rare",
    cost: { power: 3, knowledge: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: { equity: 4, capital: 2 },
  },
];

/* ============================================================== *
 *  Schools and learning                                           *
 * ============================================================== */

const SCHOOL_CARDS: Card[] = [
  {
    id: "exp2-community-schools-model",
    name: "Community-schools expansion",
    flavor: "The school is the neighborhood's anchor, all day.",
    description:
      "Every school in the ward becomes a 'community school': wraparound services, extended hours, social workers on staff, after-school programming, weekend use, summer operations. Academic outcomes climb; community social infrastructure strengthens.",
    lore:
      "Chicago's Community Schools Initiative (2004-present) operates in about 170 CPS schools. Wraparound services have documented effects on attendance, discipline referrals, and graduation rates. Coalition for Community Schools is the national network.",
    source: "Coalition for Community Schools; CPS Community Schools Initiative reports",
    category: "schools",
    rarity: "uncommon",
    cost: { capital: 3, trust: 1 },
    fromYear: 2000,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 2,
      sustainability: 2,
      transformParcels: [
        { selector: "type:school", delta: { condition: 12, memory: 6 } },
      ],
    },
  },
  {
    id: "exp2-homework-delivery-pilot",
    name: "Broadband-for-homework pilot",
    flavor: "Every CPS student, home internet, subsidized.",
    description:
      "Partner with a local broadband provider to subsidize home internet for every CPS student in the ward. Digital divide closes; homework completion rates climb.",
    lore:
      "Chicago Connected (2020) subsidized home internet for 100,000 CPS students during the pandemic. The program continued in modified form. Digital divide remains a meaningful barrier in some neighborhoods.",
    source: "Chicago Connected program reports",
    category: "schools",
    rarity: "common",
    cost: { capital: 2 },
    fromYear: 2020,
    toYear: 2040,
    effect: { equity: 3, growth: 1, sustainability: 1 },
  },
  {
    id: "exp2-bilingual-expansion",
    name: "Bilingual-education expansion",
    flavor: "Español y English, en el aula.",
    description:
      "Expand dual-language programs in ward schools. Both English and Spanish track from K; students exit at 8th grade bilingual and biliterate. Academic outcomes for Spanish-dominant students improve markedly; all students benefit from second-language proficiency.",
    lore:
      "CPS's dual-language program has grown steadily since the 1980s. Research including Thomas and Collier (2002) consistently finds strong long-term outcomes. The program's expansion has been uneven across neighborhoods.",
    source: "Thomas and Collier, A National Study of School Effectiveness (2002); CPS dual-language program records",
    category: "schools",
    rarity: "uncommon",
    cost: { capital: 2, knowledge: 2 },
    fromYear: 1990,
    toYear: 2040,
    effect: { equity: 3, heritage: 3, growth: 1 },
  },
  {
    id: "exp2-restorative-justice-schools",
    name: "Restorative-justice in every CPS school",
    flavor: "Circle process. Conflict resolution. No more suspensions.",
    description:
      "Train every teacher in restorative-justice practice. Replace suspensions with circle processes and restitution agreements. Student-suspension gap between Black and white students closes; school climate improves.",
    lore:
      "Chicago's Alternatives Inc. pioneered restorative-justice in CPS beginning 2004. The 2014 CPS Student Code of Conduct revision codified restorative approaches. Research including Gregory et al. (2016) shows meaningful reduction in racial discipline gap.",
    source: "Gregory et al., 'The Promise of Restorative Practices' (2016)",
    category: "schools",
    rarity: "uncommon",
    cost: { capital: 2, trust: 2, knowledge: 1 },
    fromYear: 2005,
    toYear: 2040,
    effect: { equity: 4, heritage: 2, trust: 2 },
  },
  {
    id: "exp2-uchicago-promise",
    name: "Ward-to-college scholarship program",
    flavor: "Every ward graduate. A seat if they want it.",
    description:
      "Partner with local universities to create a ward-scale scholarship program guaranteeing admission and full tuition to any ward HS graduate with a 3.0 GPA. Enrollment at 4-year colleges climbs.",
    lore:
      "Kalamazoo Promise (2005), Pittsburgh Promise (2008), and about 200 other 'Promise' programs nationwide are the model. Long-term studies show meaningful educational attainment effects for participating cohorts.",
    source: "W.E. Upjohn Institute Promise Program research",
    category: "schools",
    rarity: "rare",
    cost: { capital: 4, knowledge: 2 },
    fromYear: 2005,
    toYear: 2040,
    effect: { equity: 4, heritage: 2, growth: 2, sustainability: 2 },
  },
];

/* ============================================================== *
 *  Environment and climate                                        *
 * ============================================================== */

const ENV_CARDS: Card[] = [
  {
    id: "exp2-tree-equity-plan",
    name: "Tree-equity plan",
    flavor: "Three thousand trees. Where the shade is thinnest.",
    description:
      "Survey the ward's tree canopy, identify blocks with the least, and plant 3,000 shade trees over five years. Street temperatures drop; asthma and heat-mortality risk drops.",
    lore:
      "Chicago's 2022 Our Roots Chicago plan aims to plant 75,000 trees by 2027, prioritizing low-canopy neighborhoods. American Forests' Tree Equity Score maps canopy disparities block-by-block.",
    source: "Our Roots Chicago plan; American Forests Tree Equity Score",
    category: "environment",
    rarity: "common",
    cost: { capital: 2 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      sustainability: 4,
      heritage: 2,
      equity: 2,
      transformParcels: [
        { selector: "all", delta: { condition: 1 } },
      ],
    },
  },
  {
    id: "exp2-green-alley-program",
    name: "Green alley retrofits",
    flavor: "Permeable pavement. Less flood. Less heat.",
    description:
      "Retrofit 80 ward alleys with permeable pavement and native-plant drainage features. Stormwater runoff drops significantly; basement flooding after 1-inch rains mostly disappears.",
    lore:
      "Chicago's Green Alley Program, launched 2006, has retrofitted about 300 alleys. Per-alley costs are $80-120K. Flood-risk reductions are well-documented.",
    source: "Chicago Department of Transportation Green Alley Program",
    category: "environment",
    rarity: "common",
    cost: { capital: 3 },
    fromYear: 2010,
    toYear: 2040,
    effect: { sustainability: 4, heritage: 1, equity: 1 },
  },
  {
    id: "exp2-solar-coop-pilot",
    name: "Solar cooperative pilot",
    flavor: "Rooftops owned collectively. Bills cut.",
    description:
      "Install rooftop solar on 300 low-income ward homes under a cooperative-ownership structure. Members pay reduced electric bills and receive a modest annual dividend.",
    lore:
      "Blacks in Green's Sustainable Square Mile in West Woodlawn and Solar United Neighbors's Illinois co-op programs are leading Chicago-area examples. Illinois Solar For All (2019) provides significant subsidy.",
    source: "Blacks in Green program materials; Illinois Solar For All reports",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: { sustainability: 4, equity: 4, growth: 1 },
  },
  {
    id: "exp2-urban-ag-network",
    name: "Urban agriculture network",
    flavor: "Vacant to vegetables. Block by block.",
    description:
      "Convert 25 vacant parcels into urban-agriculture sites. A staffed coordinator network connects growers with schools, markets, and food-insecurity programs.",
    lore:
      "Chicago's Urban Farm Ordinance (2011) created the regulatory framework. Growing Home (Englewood), Urban Growers Collective, and Dion's Chicago Dream are active production networks. Food-deserts policy overlaps with urban-ag programming.",
    source: "Chicago Urban Farm Ordinance; Growing Home and UGC records",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 2, trust: 2 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      sustainability: 3,
      heritage: 3,
      equity: 2,
      transformParcels: [
        { selector: "type:vacant", set: { type: "community-garden" } },
      ],
    },
  },
  {
    id: "exp2-flood-buyout-targeted",
    name: "Voluntary flood-buyout program",
    flavor: "Repeat-flood parcels. Buy at pre-flood value. Retire the use.",
    description:
      "Identify the 15 repeat-flood parcels in the ward and offer voluntary buyouts at pre-flood value. Buildings demolished; land converted to green infrastructure or community use. Future flood losses prevented.",
    lore:
      "FEMA's Hazard Mitigation Grant Program funds voluntary buyouts. A 2020 NRDC report documented about 43,000 federally-funded buyouts nationwide since 1989. The approach is politically difficult but effective.",
    source: "NRDC, Going Under: Post-Disaster Buyouts and the Flood Crisis (2020)",
    category: "environment",
    rarity: "rare",
    cost: { capital: 5, power: 2 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      sustainability: 5,
      equity: 2,
      growth: -1,
      transformParcels: [
        { selector: "random:3", set: { type: "park" } },
      ],
    },
  },
  {
    id: "exp2-electrify-public-buildings",
    name: "Electrify public buildings",
    flavor: "Boilers out. Heat pumps in. Carbon down.",
    description:
      "Electrify heating and cooling in all ward public buildings: schools, library, clinic, park buildings. Capital-intensive; emissions drop permanently.",
    lore:
      "Chicago's 2022 Building Decarbonization Working Group recommended public-building electrification as an early lever. NYC's Local Law 97 requires similar for private large buildings. Cost-effectiveness varies with electricity mix.",
    source: "Chicago Building Decarbonization Working Group report (2022)",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 4 },
    fromYear: 2020,
    toYear: 2040,
    effect: { sustainability: 4, growth: 1 },
  },
];

/* ============================================================== *
 *  Preservation and culture                                       *
 * ============================================================== */

const CULTURE_CARDS: Card[] = [
  {
    id: "exp2-mural-fund-permanent",
    name: "Permanent mural fund",
    flavor: "Public art. Year after year. Juried.",
    description:
      "Endow a permanent mural fund that commissions 4-6 new murals per year from ward artists. Over two decades, the ward becomes a cultural corridor.",
    lore:
      "Philadelphia's Mural Arts Program (1984-present), the largest public-art program in the U.S., has produced about 4,000 murals. Chicago's Public Art Program is smaller but growing; several ward-scale initiatives exist.",
    source: "Philadelphia Mural Arts Program records; Chicago Public Art Program",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 2, trust: 1 },
    fromYear: 1990,
    toYear: 2040,
    effect: {
      heritage: 4,
      equity: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "random:2", set: { type: "mural" }, delta: { memory: 10 } },
      ],
    },
  },
  {
    id: "exp2-archive-of-the-ward",
    name: "Archive of the ward",
    flavor: "Every block club's minutes. Digitized. Public.",
    description:
      "Fund a neighborhood archive that collects block-club minutes, parish records, ward-newsletter runs, and oral histories. The archive becomes a research resource and a memory-preservation tool.",
    lore:
      "The South Side Community Art Center, the DuSable Black History Museum, and the Vivian G. Harsh Research Collection at Carter G. Woodson Library are Chicago exemplars. The Chicago History Museum's community-archives program partners with smaller organizations.",
    source: "Vivian G. Harsh Research Collection; Chicago History Museum partnerships",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 2, knowledge: 2 },
    fromYear: 1980,
    toYear: 2040,
    effect: { heritage: 4, knowledge: 2, equity: 1 },
  },
  {
    id: "exp2-storefront-preservation",
    name: "Legacy business protection",
    flavor: "The corner store. The barbershop. The bakery.",
    description:
      "Establish a legacy-business program that gives long-standing ward businesses rent subsidies, technical assistance, and protection against condo conversion of their space.",
    lore:
      "San Francisco's Legacy Business Registry (2015) is the prototype. New York, LA, and several other cities have followed. Chicago's program is small; several wards have piloted local versions.",
    source: "San Francisco Legacy Business Registry",
    category: "preservation",
    rarity: "uncommon",
    cost: { capital: 2, knowledge: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      heritage: 4,
      equity: 2,
      growth: 1,
      transformParcels: [
        { selector: "type:commercial", delta: { memory: 8 } },
      ],
    },
  },
  {
    id: "exp2-cultural-district",
    name: "Cultural district designation",
    flavor: "The neighborhood is art. Officially.",
    description:
      "Formally designate a cultural district along a ward corridor, with protections against teardown, subsidies for arts tenants, and a tourism marketing budget.",
    lore:
      "Illinois's Cultural Districts Program designates specific corridors. Chicago's Bronzeville Historic District, Pilsen Cultural District, and Little Village Cultural District are examples. Designation has preservation and economic-development effects.",
    source: "Illinois Cultural Districts Program",
    category: "preservation",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 1995,
    toYear: 2040,
    effect: {
      heritage: 5,
      equity: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "block:2", set: { protected: true } },
      ],
    },
  },
  {
    id: "exp2-oral-history-project",
    name: "Oral history commission",
    flavor: "Forty interviews. Three years. One narrative.",
    description:
      "Commission a ward oral-history project with 40 elder interviews. Produce a book, a podcast series, and a permanent exhibit at the library. Memory of the ward's decades becomes shareable.",
    lore:
      "Studs Terkel's interview archive at the Chicago History Museum is the Chicago exemplar. StoryCorps' Griot Initiative (2003-present) has recorded tens of thousands of Black American interviews. Smithsonian's Anacostia Museum runs similar.",
    source: "StoryCorps records; Chicago History Museum Studs Terkel archive",
    category: "culture",
    rarity: "common",
    cost: { knowledge: 2, capital: 1 },
    fromYear: 1980,
    toYear: 2040,
    effect: {
      heritage: 4,
      knowledge: 2,
      equity: 1,
      transformParcels: [
        { selector: "all", delta: { memory: 1 } },
      ],
    },
  },
];

/* ============================================================== *
 *  Research and finance                                           *
 * ============================================================== */

const RESEARCH_FINANCE: Card[] = [
  {
    id: "exp2-displacement-dashboard",
    name: "Displacement-risk dashboard",
    flavor: "Maps, blocks, warning lights.",
    description:
      "A public dashboard that uses eviction-filing data, rent-increase data, and permit-application data to generate block-level displacement-risk warnings. Triggers early-intervention by legal aid and tenant organizers.",
    lore:
      "Urban Displacement Project at UC Berkeley has developed the methodology. New York's Housing Preservation Department uses a comparable tool. Chicago's DePaul Institute for Housing Studies has piloted ward-scale versions.",
    source: "Urban Displacement Project, UC Berkeley; DePaul IHS reports",
    category: "research",
    rarity: "uncommon",
    cost: { knowledge: 2, capital: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: { knowledge: 2, equity: 3 },
  },
  {
    id: "exp2-public-bank-pilot",
    name: "Municipal public bank",
    flavor: "The city as its own depositor.",
    description:
      "Charter a municipal public bank that holds city deposits and makes loans aligned with city priorities. Interest earnings stay public. Access to capital for CLTs and coops expands.",
    lore:
      "North Dakota's state-owned bank (1919) is the U.S. exemplar. California's Public Banking Act (2019) allows municipal public banks; San Francisco and Los Angeles are actively exploring. The Public Bank Act of 2024 in Illinois is pending.",
    source: "Bank of North Dakota records; California AB 857 (2019)",
    category: "finance",
    rarity: "rare",
    cost: { power: 3, capital: 3, knowledge: 2 },
    fromYear: 2020,
    toYear: 2040,
    effect: { equity: 4, growth: 2, sustainability: 2, heritage: 1 },
  },
  {
    id: "exp2-cooperative-contractor-prefrence",
    name: "Cooperative-contractor preference",
    flavor: "City contracts go to worker-owned bidders first.",
    description:
      "Reform ward contracting to give preference to worker-owned cooperatives. Multiplies the equity effects of every capital dollar the ward spends.",
    lore:
      "Cleveland's Evergreen Cooperatives (2008) and the Democracy at Work Institute's municipal-policy work have been the models. Chicago's ChiFresh Kitchen (2020) is a small-scale example.",
    source: "Democracy at Work Institute municipal-policy toolkits",
    category: "finance",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: { equity: 3, growth: 1, heritage: 1 },
  },
  {
    id: "exp2-green-bank",
    name: "Neighborhood green bank",
    flavor: "Solar. Heat pumps. Cheap loans.",
    description:
      "Capitalize a neighborhood green bank that makes low-interest loans for residential energy retrofits. Pays for itself within a decade through loan-repayment cycles.",
    lore:
      "Connecticut Green Bank (2011) is the U.S. first; NY Green Bank followed. Neighborhood-scale green banks are a growing model; Chicago-Southland is piloting.",
    source: "Connecticut Green Bank annual reports",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 4, knowledge: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: { sustainability: 4, growth: 2, equity: 2 },
  },
];

/* ============================================================== *
 *  Export                                                         *
 * ============================================================== */

export const EXPANSION_CARDS_2: Card[] = [
  ...ORGANIZING_CARDS,
  ...HOUSING_CARDS,
  ...SCHOOL_CARDS,
  ...ENV_CARDS,
  ...CULTURE_CARDS,
  ...RESEARCH_FINANCE,
];
