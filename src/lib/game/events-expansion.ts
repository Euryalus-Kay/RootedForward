/**
 * Expansion pack of additional historical events.
 *
 * Each event is a forced choice. Each choice has documented consequences.
 * The lore notes tie the fictional Parkhaven event back to a real moment
 * in Chicago, Illinois, or federal history that the player can look up.
 *
 * Events are organized by era. Crisis events (triggered by signals) are
 * at the bottom and extend the existing crisis roster.
 */

import type { GameEvent } from "./types";

/* ============================================================== *
 *  Era I: 1940 to 1955 - Lines on a Map                           *
 * ============================================================== */

const ERA_I_EVENTS: GameEvent[] = [
  {
    id: "exp-zoot-suit-night-1943",
    year: { from: 1943, to: 1945 },
    title: "A Friday-night fight at the train station",
    headline: "Returning sailors attack Mexican-American teenagers at Union Station.",
    body:
      "The Zoot Suit Riots have reached Chicago. The Pilsen and Back of the Yards papers demand you say something. The Association wants you to blame the teenagers. Police are silent.",
    lore:
      "The 1943 Zoot Suit Riots began in Los Angeles but spread to most major cities including Chicago and Detroit. Mexican-American, Filipino, and Black youth in the era's popular 'zoot' fashion were beaten by white servicemen. Most city governments responded by arresting the victims.",
    source: "Mazón, The Zoot-Suit Riots (1984); Chicago Defender June 1943 coverage",
    options: [
      {
        label: "Publicly condemn the attacks and the policing response",
        outcome: "publicly condemned the attacks and the police response",
        effect: { equity: 3, trust: 2, power: -1, heritage: 2 },
      },
      {
        label: "Issue a bland statement calling for calm",
        outcome: "issued a bland statement calling for calm",
        effect: { equity: -1, heritage: -1 },
      },
      {
        label: "Blame the youth for their 'provocative' dress",
        outcome: "blamed the youth for their dress",
        effect: { equity: -3, capital: 1, heritage: -2 },
      },
    ],
  },
  {
    id: "exp-airport-siting-1945",
    year: { from: 1944, to: 1949 },
    title: "Municipal airport siting",
    headline: "The city is choosing a site for the new municipal airport.",
    body:
      "The ward's southwestern industrial corridor is under consideration. An airport would bring jobs. It would also carve out a mile of homes and a school. Decision is tight.",
    lore:
      "Chicago O'Hare was sited at Orchard Field in 1945. The choice between downtown-adjacent sites and exurban sites drove decades of land-use politics. Every major infrastructure siting decision involved trade-offs between jobs, displacement, and environmental harm.",
    source: "Chicago Tribune 1944-1949 airport siting coverage; Doherty, Airline Deregulation (1985)",
    options: [
      {
        label: "Push the airport elsewhere",
        outcome: "pushed the airport to a different ward",
        effect: { heritage: 3, sustainability: 2, growth: -2 },
      },
      {
        label: "Accept the airport; negotiate a jobs program",
        outcome: "accepted the airport with a jobs program attached",
        effect: { growth: 4, equity: 1, heritage: -2, sustainability: -1, capital: 3 },
      },
      {
        label: "Support it unconditionally",
        outcome: "supported the airport unconditionally",
        effect: { growth: 3, heritage: -3, sustainability: -2, equity: -1 },
      },
    ],
  },
  {
    id: "exp-housing-authority-vote-1947",
    year: { from: 1946, to: 1950 },
    title: "CHA siting vote",
    headline: "CHA proposes 300 units of public housing in the ward.",
    body:
      "Elizabeth Wood's CHA wants to place 300 units of integrated low-rise public housing in your ward. The Property Owners Association is apoplectic.",
    lore:
      "Elizabeth Wood, CHA's first executive director, consistently pushed for integrated low-rise public housing scattered across the city. White aldermen vetoed siting in their wards. The concentrated tower era came after Wood was forced out in 1954.",
    source: "Hirsch, Making the Second Ghetto (1983); Bowly, The Poorhouse (1978)",
    weight: 2,
    options: [
      {
        label: "Vote yes on integrated low-rise siting",
        outcome: "voted yes on CHA siting",
        effect: { equity: 4, heritage: 2, power: -2, transformParcels: [{ selector: "first-vacant", set: { type: "courtyard", owner: "cha" }, delta: { residents: 20 } }] },
      },
      {
        label: "Request concentrated tower siting instead",
        outcome: "requested concentrated tower siting",
        effect: { equity: -1, heritage: -2, capital: 1, setFlag: "tower-built" },
      },
      {
        label: "Veto CHA siting in the ward",
        outcome: "vetoed CHA siting",
        effect: { equity: -3, growth: -1, power: 2 },
      },
    ],
  },
  {
    id: "exp-chicago-housing-act-1949",
    year: { from: 1949, to: 1952 },
    title: "Federal Housing Act of 1949 implementation",
    headline: "Title I money. Title III money. Six sites already listed.",
    body:
      "The city is about to pick six urban renewal sites. Your ward is on the shortlist. Federal dollars pay the demolition cost.",
    lore:
      "Title I of the 1949 Housing Act funded local acquisition and demolition for urban renewal. Title III expanded public-housing production. Chicago received substantial federal funds. Decisions about where to clear were made in closed committee with minimal community input.",
    source: "Housing Act of 1949, Pub. L. 81-171",
    options: [
      {
        label: "Demand community review before designation",
        outcome: "demanded community review of urban renewal siting",
        effect: { heritage: 3, equity: 3, knowledge: 2, growth: -1 },
      },
      {
        label: "Accept designation; negotiate replacement housing",
        outcome: "accepted designation with replacement commitments",
        effect: { capital: 3, growth: 2, heritage: -2, equity: -1 },
      },
      {
        label: "Support unconditional designation",
        outcome: "supported designation unconditionally",
        effect: { capital: 4, growth: 3, heritage: -4, equity: -3, transformParcels: [{ selector: "random:4", set: { type: "demolished", owner: "city" } }] },
      },
    ],
    glossary: ["UrbanRenewal"],
  },
  {
    id: "exp-cicero-riot-1951",
    year: { from: 1951, to: 1953 },
    title: "Cicero riot",
    headline: "A Black family moves into Cicero. The mob burns their apartment.",
    body:
      "Harvey Clark's family moves into a Cicero apartment on July 11, 1951. A white mob of 4,000 destroys the building. Cicero is a half-hour from the ward. Your constituents are watching.",
    lore:
      "The 1951 Cicero race riot was one of the largest in postwar America. The Clark family had rented an apartment in the all-white suburb of Cicero; a mob burned the building. Illinois Governor Stevenson called the National Guard. No rioters were convicted.",
    source: "Hirsch, Making the Second Ghetto (1983)",
    options: [
      {
        label: "Lead a solidarity march to Cicero",
        outcome: "led a solidarity march to Cicero",
        effect: { equity: 4, heritage: 3, trust: 2, power: -2 },
      },
      {
        label: "Issue a written statement",
        outcome: "issued a written statement of support",
        effect: { equity: 2, trust: 1 },
      },
      {
        label: "Stay silent",
        outcome: "stayed silent on Cicero",
        effect: { equity: -2, heritage: -1, trust: -1 },
      },
    ],
  },
  {
    id: "exp-south-deering-riot-1953",
    year: { from: 1953, to: 1955 },
    title: "South Deering integration violence",
    headline: "Trumbull Park riots continue into a third year.",
    body:
      "The Howard family has held the apartment for two years. The mob has not given up. The police are present but ineffective. Your ward is considering a solidarity action.",
    lore:
      "The Trumbull Park disturbances in South Deering lasted from 1953 to 1960. Police protection of Black tenants was often symbolic. The NAACP, Urban League, and local organizers kept the issue visible.",
    source: "Hirsch, Making the Second Ghetto (1983); Trumbull Park oral history at U Chicago",
    options: [
      {
        label: "Organize a week of ward-based fundraising for the Howards",
        outcome: "raised ward funds for the Howard family",
        effect: { equity: 3, trust: 2, capital: -1 },
      },
      {
        label: "Publish the siting bias data in the weekly",
        outcome: "published the siting bias data in the ward weekly",
        effect: { knowledge: 2, equity: 2 },
      },
      {
        label: "Wait it out",
        outcome: "waited it out",
        effect: { equity: -2 },
      },
    ],
  },
  {
    id: "exp-korean-war-housing-1952",
    year: { from: 1951, to: 1954 },
    title: "Korean War housing demand",
    headline: "Defense workers flooding the city. Rents climbing.",
    body:
      "The Korean War is driving defense-plant hiring. New workers are arriving every week. Rents are spiking. Landlords are doubling up units.",
    lore:
      "The Korean War (1950-1953) drove a short-term manufacturing boom in Chicago. Defense plants in the 52nd Street corridor and in the Pullman district expanded. Housing tightened; informal illegal conversions multiplied.",
    source: "Pacyga, Chicago: A Biography (2009)",
    options: [
      {
        label: "Impose ward rent control via informal ordinance",
        outcome: "imposed informal rent control",
        effect: { equity: 3, trust: 2, power: -1, capital: -1 },
      },
      {
        label: "Legalize the informal conversions",
        outcome: "legalized the informal conversions",
        effect: { equity: 2, heritage: -1, growth: 2 },
      },
      {
        label: "Let the market absorb it",
        outcome: "let the market absorb the demand",
        effect: { growth: 2, equity: -2, heritage: -1 },
      },
    ],
  },
  {
    id: "exp-brown-v-board-local-1954",
    year: { from: 1954, to: 1957 },
    title: "Brown v. Board implementation",
    headline: "The ruling is unanimous. CPS leadership is not.",
    body:
      "Brown v. Board orders desegregation of public schools. CPS Superintendent Benjamin Willis is dragging his feet. Your ward has three schools where redrawing attendance zones could immediately integrate.",
    lore:
      "Brown v. Board of Education (1954) required desegregation 'with all deliberate speed.' CPS Superintendent Benjamin Willis used double-shift schedules and 'Willis Wagons' (mobile classrooms placed at Black schools) to avoid sending Black students to white schools. Chicago remained among the nation's most segregated school systems well past the 1960s.",
    source: "Brown v. Board of Education, 347 U.S. 483 (1954); Danns, Something Better for Our Children (2003)",
    options: [
      {
        label: "Force a boundary redraw in your ward immediately",
        outcome: "forced a school boundary redraw",
        effect: { equity: 5, heritage: 2, power: -2 },
      },
      {
        label: "Accept Willis's plan with cosmetic tweaks",
        outcome: "accepted Willis's plan with cosmetic changes",
        effect: { equity: -1, heritage: -1 },
      },
      {
        label: "Stay out of the fight",
        outcome: "stayed out of the school fight",
        effect: { equity: -3 },
      },
    ],
    glossary: ["ChicagoFreedomMovement"],
  },
];

/* ============================================================== *
 *  Era II: 1956 to 1975 - Contracts and Covenants                 *
 * ============================================================== */

const ERA_II_EVENTS: GameEvent[] = [
  {
    id: "exp-penny-stock-1958",
    year: { from: 1957, to: 1962 },
    title: "A 'penny stock' pump scandal",
    headline: "A developer uses a penny-stock offering to buy 40 ward parcels.",
    body:
      "The developer has gotten an SEC warning letter. Your office has the opportunity to cooperate with the investigation or to stay out of it.",
    lore:
      "Chicago real estate has repeatedly been implicated in securities fraud schemes, from the 1950s 'penny stock' era through the 1980s S&L scandals through 2008 subprime. Municipal cooperation with federal investigators has been inconsistent.",
    source: "SEC historical enforcement records; Chicago FBI financial-crimes archives",
    options: [
      {
        label: "Cooperate with federal investigators",
        outcome: "cooperated with federal investigators",
        effect: { equity: 3, knowledge: 2, power: -1 },
      },
      {
        label: "Quietly negotiate a settlement",
        outcome: "negotiated a quiet settlement",
        effect: { capital: 2, equity: -1 },
      },
      {
        label: "Stay out",
        outcome: "stayed out of the investigation",
        effect: { equity: -1 },
      },
    ],
  },
  {
    id: "exp-model-cities-grant-1967",
    year: { from: 1966, to: 1970 },
    title: "Model Cities designation offered",
    headline: "HUD is offering $8 million over five years.",
    body:
      "The ward qualifies. The designation requires a citizen-controlled board with real power over spending. The machine is uneasy.",
    lore:
      "The Model Cities Program (1966-1974) was Lyndon Johnson's attempt at neighborhood-scale War on Poverty. Chicago's Model Cities program was centralized under the Daley machine, limiting citizen-board power. A few successful projects (TWO's housing) resulted despite structural limits.",
    source: "Haar, Between the Idea and the Reality (1975)",
    options: [
      {
        label: "Accept designation with a real citizen board",
        outcome: "accepted Model Cities with a real citizen board",
        effect: { capital: 4, equity: 4, trust: 3, power: -2 },
      },
      {
        label: "Accept with a rubber-stamp board",
        outcome: "accepted Model Cities with a rubber-stamp board",
        effect: { capital: 4, growth: 2, equity: 1, trust: -1 },
      },
      {
        label: "Decline designation",
        outcome: "declined Model Cities designation",
        effect: { equity: -2, growth: -1 },
      },
    ],
  },
  {
    id: "exp-mlk-assassination-response-1968",
    year: { from: 1968, to: 1968 },
    title: "Dr. King is dead",
    headline: "April 4, 1968. Memphis. The West Side is burning.",
    body:
      "Fires are spreading on the West Side. The police and National Guard are arriving. Your ward is quieter so far. What do you do tonight?",
    lore:
      "After Dr. King's assassination on April 4, 1968, Chicago's West Side saw several days of uprisings. Mayor Daley issued the notorious 'shoot to kill' order for arsonists. Four square miles of West Side burned. The violence accelerated white flight and institutional disinvestment.",
    source: "Royko, Boss: Richard J. Daley of Chicago (1971); Chicago Tribune 1968 reporting",
    weight: 3,
    options: [
      {
        label: "Open churches and schools as safe sites through the night",
        outcome: "opened churches and schools as safe sites",
        effect: { equity: 3, heritage: 2, trust: 3, power: -1 },
      },
      {
        label: "Cooperate with curfew and National Guard",
        outcome: "cooperated with the curfew and National Guard",
        effect: { equity: -2, heritage: -2, trust: -2, power: 2 },
      },
      {
        label: "Stay in your office",
        outcome: "stayed in your office",
        effect: { equity: -1, trust: -1 },
      },
    ],
  },
  {
    id: "exp-dnc-convention-1968",
    year: { from: 1968, to: 1968 },
    title: "Democratic Convention in Chicago",
    headline: "Protests and police in Grant Park. The whole world is watching.",
    body:
      "Your ward is near the convention site. Protesters are camping in your parks. The mayor wants police to clear them. The press is everywhere.",
    lore:
      "The 1968 Democratic National Convention in Chicago was marked by violent clashes between police and antiwar protesters. The Walker Report called it a 'police riot.' Mayor Daley's handling of the convention shaped his national image and his local coalition.",
    source: "Walker Report, Rights in Conflict (1968); Farber, Chicago '68 (1988)",
    options: [
      {
        label: "Offer your parks to the protesters; negotiate a peaceful protest zone",
        outcome: "offered ward parks for peaceful protest",
        effect: { equity: 3, heritage: 2, trust: 2, power: -2 },
      },
      {
        label: "Cooperate with the police sweep",
        outcome: "cooperated with the police sweep",
        effect: { equity: -2, heritage: -1, power: 1 },
      },
      {
        label: "Stay out of sight",
        outcome: "stayed out of sight",
        effect: { heritage: -1 },
      },
    ],
  },
  {
    id: "exp-fred-hampton-1969",
    year: { from: 1969, to: 1970 },
    title: "Fred Hampton killed",
    headline: "December 4, 1969. 2337 W. Monroe. Chicago police raid.",
    body:
      "Fred Hampton, 21, chairman of the Illinois Black Panther Party, is killed in a pre-dawn raid. The state's attorney is already calling it a gun battle. Witnesses say he was shot while sleeping.",
    lore:
      "Fred Hampton was killed on December 4, 1969 in a raid led by State's Attorney Edward Hanrahan. Ballistics later showed police fired 90+ shots while Hampton's group fired perhaps one. The FBI's COINTELPRO program supplied the apartment floor plan. Hanrahan's career ended over the raid.",
    source: "Haas, The Assassination of Fred Hampton (2010)",
    weight: 2,
    options: [
      {
        label: "Demand a federal investigation",
        outcome: "demanded a federal investigation",
        effect: { equity: 4, heritage: 3, trust: 2, power: -1 },
      },
      {
        label: "Support the state's attorney's account",
        outcome: "supported the state's attorney's account",
        effect: { equity: -4, heritage: -3, trust: -3, capital: 2 },
      },
      {
        label: "Stay neutral in the press",
        outcome: "stayed neutral",
        effect: { equity: -2, trust: -1 },
      },
    ],
  },
  {
    id: "exp-gautreaux-implementation-1969",
    year: { from: 1969, to: 1972 },
    title: "Gautreaux consent decree implementation",
    headline: "Federal court orders CHA to site in majority-white areas.",
    body:
      "The first scattered-site proposals reach your northside ward. White homeowners are organizing. The federal court is watching.",
    lore:
      "Judge Richard Austin's 1969 Gautreaux consent decree required CHA to site new public housing in majority-white neighborhoods. For 10 years CHA built almost nothing, effectively refusing to comply. Eventually 2,000+ scattered-site units were built.",
    source: "Hills v. Gautreaux, 425 U.S. 284 (1976); Polikoff, Waiting for Gautreaux (2006)",
    options: [
      {
        label: "Support the scattered-site proposal",
        outcome: "supported scattered-site CHA siting",
        effect: { equity: 4, heritage: 2, power: -2 },
      },
      {
        label: "Propose smaller-scale alternative",
        outcome: "proposed a scaled-down alternative",
        effect: { equity: 1, heritage: 1 },
      },
      {
        label: "Block it in committee",
        outcome: "blocked the scattered-site proposal",
        effect: { equity: -4, heritage: -1, power: 2 },
      },
    ],
    glossary: ["Gautreaux", "CHA"],
  },
  {
    id: "exp-1970-census-redistrict",
    year: { from: 1970, to: 1972 },
    title: "1970 census redistricting",
    headline: "Your ward boundaries are redrawn.",
    body:
      "The machine redistricting proposal divides your ward's Black majority across three white-majority wards. A counter-proposal keeps your ward intact but adds two predominantly white blocks.",
    lore:
      "Post-1970-census redistricting in Chicago was a machine-controlled process that systematically diluted Black voting power. A series of federal lawsuits in the 1970s and 80s forced progressively fairer maps. The 1981 federal consent decree restructured the city council entirely.",
    source: "Ketchum v. Byrne, 740 F.2d 1398 (7th Cir. 1984)",
    options: [
      {
        label: "Organize against the machine map; sue if necessary",
        outcome: "sued over the redistricting map",
        effect: { equity: 4, power: -2, knowledge: 2 },
      },
      {
        label: "Accept the counter-proposal",
        outcome: "accepted the counter-proposal",
        effect: { equity: 1, heritage: 1 },
      },
      {
        label: "Go along with the machine map",
        outcome: "went along with the machine map",
        effect: { equity: -3, capital: 2, power: 1 },
      },
    ],
  },
  {
    id: "exp-tenants-rights-1971",
    year: { from: 1970, to: 1975 },
    title: "Tenants' rights ordinance draft",
    headline: "A draft ordinance is circulating. Landlords are hiring lobbyists.",
    body:
      "Early draft of what would become the 1986 Residential Landlord and Tenant Ordinance. Right-to-habitability, security-deposit rules, retaliation protection.",
    lore:
      "Chicago's RLTO passed in 1986 after 15 years of drafts. Early versions in the early 1970s would have been transformative. The lobbying against them by building owners was intense and organized through the Building Owners and Managers Association.",
    source: "Chicago RLTO legislative history",
    options: [
      {
        label: "Back the full ordinance",
        outcome: "backed the full tenants' rights ordinance",
        effect: { equity: 4, trust: 3, power: -2 },
      },
      {
        label: "Support a watered-down version",
        outcome: "supported a watered-down version",
        effect: { equity: 1 },
      },
      {
        label: "Vote no",
        outcome: "voted no on the ordinance",
        effect: { equity: -3, capital: 1 },
      },
    ],
  },
];

/* ============================================================== *
 *  Era III: 1976 to 2000 - Towers and Renewal                     *
 * ============================================================== */

const ERA_III_EVENTS: GameEvent[] = [
  {
    id: "exp-washington-primary-1983",
    year: { from: 1982, to: 1984 },
    title: "Harold Washington primary",
    headline: "Washington vs. Byrne vs. Daley. The machine is splitting.",
    body:
      "The February 1983 primary is tight. Daley and Byrne split the white vote. Washington needs 99% Black turnout and single digits white. Your ward's turnout operation matters.",
    lore:
      "Harold Washington won the February 22, 1983 Democratic primary over Mayor Jane Byrne and Cook County State's Attorney Richard M. Daley. Black turnout reached 82%. Washington went on to win the April general election over Republican Bernard Epton.",
    source: "Rivlin, Fire on the Prairie (1992)",
    weight: 2,
    options: [
      {
        label: "Go all-in for Washington",
        outcome: "went all-in for Washington",
        effect: { equity: 5, heritage: 3, trust: 3, power: -1 },
      },
      {
        label: "Split endorsement",
        outcome: "gave a split endorsement",
        effect: { equity: -1, power: 1 },
      },
      {
        label: "Stay machine",
        outcome: "stayed with the machine",
        effect: { equity: -3, capital: 2, trust: -2 },
      },
    ],
  },
  {
    id: "exp-washington-death-1987",
    year: { from: 1987, to: 1989 },
    title: "Harold Washington dies",
    headline: "November 25, 1987. Heart attack. The Council Wars resume.",
    body:
      "Washington dies at his desk. The city council must pick an acting mayor. Alderman Eugene Sawyer and Alderman Tim Evans are both candidates.",
    lore:
      "Harold Washington died of a heart attack on November 25, 1987 in his office. The council elected Eugene Sawyer acting mayor in a 29-19 vote over Tim Evans, widely seen as a machine reconstitution. Richard M. Daley won the February 1989 special election.",
    source: "Rivlin, Fire on the Prairie (1992)",
    options: [
      {
        label: "Back Tim Evans to continue Washington's coalition",
        outcome: "backed Tim Evans for acting mayor",
        effect: { equity: 3, heritage: 2, trust: 2 },
      },
      {
        label: "Back Eugene Sawyer",
        outcome: "backed Eugene Sawyer for acting mayor",
        effect: { equity: 1, capital: 2, power: 1 },
      },
      {
        label: "Stay out of the fight",
        outcome: "stayed out of the fight",
        effect: { equity: -1, heritage: -1 },
      },
    ],
  },
  {
    id: "exp-chicago-heat-wave-1995",
    year: { from: 1995, to: 1995 },
    title: "1995 Chicago heat wave",
    headline: "Temperatures above 100. 739 dead.",
    body:
      "The July 1995 heat wave is killing elderly Chicagoans, disproportionately on the South and West sides. Your ward is hit hard.",
    lore:
      "The 1995 Chicago heat wave killed 739 people over five days in mid-July. Klinenberg's sociological analysis showed mortality concentrated in neighborhoods with weakened social infrastructure. Wards that had maintained block-club networks and open public buildings saw fewer deaths.",
    source: "Klinenberg, Heat Wave (2002)",
    weight: 3,
    options: [
      {
        label: "Open churches, schools, and libraries as cooling centers. Mobilize the block clubs.",
        outcome: "opened cooling centers and mobilized block clubs",
        effect: { equity: 4, heritage: 3, trust: 3, sustainability: 2 },
      },
      {
        label: "Run the standard city script",
        outcome: "ran the standard city script",
        effect: { equity: -1, sustainability: -1 },
      },
      {
        label: "Under-respond; downplay the scale",
        outcome: "under-responded to the heat wave",
        effect: { equity: -4, heritage: -2, trust: -3, sustainability: -2 },
      },
    ],
  },
  {
    id: "exp-hope-vi-arrives-1996",
    year: { from: 1995, to: 1999 },
    title: "HOPE VI funding available",
    headline: "HUD is offering demolition-and-replace funding for CHA towers.",
    body:
      "Your ward has tower parcels. HOPE VI would demolish them and replace with mixed-income. Replacement ratio is 1:0.6 on paper; less in practice.",
    lore:
      "HOPE VI (1992-2010) funded the demolition of much of U.S. public housing. The Plan for Transformation (1999) scaled HOPE VI to Chicago's entire high-rise stock. Replacement units were much fewer than demolished units.",
    source: "Popkin et al., A Decade of HOPE VI (2004)",
    options: [
      {
        label: "Demand 1:1 replacement in writing before demolition",
        outcome: "demanded 1:1 replacement in writing",
        effect: { equity: 4, heritage: 2, growth: 1, power: -2 },
      },
      {
        label: "Accept standard replacement ratio",
        outcome: "accepted standard replacement ratio",
        effect: { growth: 3, capital: 2, equity: -2, heritage: -2, transformParcels: [{ selector: "type:tower", set: { type: "vacant" } }] },
      },
      {
        label: "Rehab the towers instead",
        outcome: "rehabbed the towers instead",
        effect: { equity: 3, heritage: 2, sustainability: 2, capital: -3, transformParcels: [{ selector: "type:tower", set: { type: "rehab-tower" }, delta: { condition: 30 } }] },
      },
    ],
    glossary: ["CHA", "PlanForTransformation"],
  },
  {
    id: "exp-casino-referendum-1999",
    year: { from: 1998, to: 2002 },
    title: "Casino referendum",
    headline: "State gaming board. Three Chicago site proposals.",
    body:
      "Chicago is debating whether to host a casino. A site is rumored for the ward's industrial corridor. Casinos bring tax revenue and social costs.",
    lore:
      "Chicago's casino debate ran from the mid-1990s through the 2022 approval of Bally's Chicago. Earlier proposals (Emanuel-era and before) repeatedly failed on opposition to siting or scale. The 2023 Bally's casino is in River West.",
    source: "Illinois Gaming Board records; Chicago Tribune casino coverage 1995-2023",
    options: [
      {
        label: "Support a casino with high community-benefit standards",
        outcome: "supported a casino with strong community benefits",
        effect: { capital: 4, growth: 3, equity: 1, heritage: -1, sustainability: -1 },
      },
      {
        label: "Block the casino",
        outcome: "blocked the casino proposal",
        effect: { heritage: 2, sustainability: 1, growth: -2, capital: -1 },
      },
      {
        label: "Support a standard casino deal",
        outcome: "supported a standard casino deal",
        effect: { capital: 4, growth: 3, equity: -2, heritage: -2 },
      },
    ],
  },
  {
    id: "exp-columbia-college-expansion-1989",
    year: { from: 1987, to: 1993 },
    title: "University expansion proposal",
    headline: "Columbia College wants 4 blocks for a campus expansion.",
    body:
      "The proposal would buy out 40 households, raze them, and replace with dorms and a gallery. The college is offering a 10% above-market buyout.",
    lore:
      "University-led neighborhood expansion has been a Chicago story since the 1950s Hyde Park urban renewal. Columbia, DePaul, IIT, Loyola, Northwestern, and UIC have all expanded via purchase and demolition. Community benefit agreements are now standard in these deals.",
    source: "Hirsch, Making the Second Ghetto (1983) for the historical baseline",
    options: [
      {
        label: "Demand a community benefit agreement with permanent affordability",
        outcome: "demanded a CBA with permanent affordability",
        effect: { equity: 4, heritage: 3, growth: 1 },
      },
      {
        label: "Accept the standard buyout",
        outcome: "accepted the standard buyout",
        effect: { growth: 3, capital: 3, equity: -2, heritage: -3, transformParcels: [{ selector: "random:4", delta: { memory: -15, residents: -4 } }] },
      },
      {
        label: "Block the expansion",
        outcome: "blocked the expansion",
        effect: { heritage: 3, equity: 2, growth: -2 },
      },
    ],
  },
  {
    id: "exp-illinois-lottery-1976",
    year: { from: 1975, to: 1980 },
    title: "Illinois State Lottery",
    headline: "Revenue pitched for schools. Policy analyzed as regressive tax.",
    body:
      "The state lottery is rolling out. Ward retailers can apply for ticket licenses. Academic analysis finds lottery is a regressive tax.",
    lore:
      "The Illinois State Lottery began in 1974. Revenues were nominally dedicated to K-12 schools. Scholarly analysis consistently finds state lotteries are regressive: low-income purchasers make up a disproportionate share of ticket buyers.",
    source: "Clotfelter and Cook, Selling Hope (1989)",
    options: [
      {
        label: "Discourage ward retailers from lottery licensing",
        outcome: "discouraged ward lottery retailing",
        effect: { equity: 2, heritage: 1, growth: -1 },
      },
      {
        label: "Promote lottery retailing for small-business revenue",
        outcome: "promoted ward lottery retailing",
        effect: { growth: 1, equity: -1 },
      },
      {
        label: "No action",
        outcome: "took no action on lottery retailing",
        effect: {},
      },
    ],
  },
  {
    id: "exp-tif-creation-vote-1984",
    year: { from: 1984, to: 1990 },
    title: "Ward TIF district proposal",
    headline: "A TIF district proposal covers half the ward.",
    body:
      "The Central TIF would freeze the tax base for 23 years and redirect growth to a development fund. Supporters call it a growth engine. Critics call it a school starvation device.",
    lore:
      "Illinois authorized TIF in 1977. Chicago adopted its first TIF in 1984 (Central Loop). TIFs proliferated under Mayor Daley (1989-2011). The 2008 Progress Illinois report and Cook County Clerk TIF reports document revenue capture patterns.",
    source: "Cook County Clerk TIF Reports; Progress Illinois TIF analyses",
    options: [
      {
        label: "Structure the TIF with mandatory affordable-housing allocations",
        outcome: "structured the TIF with affordable allocations",
        effect: { growth: 3, equity: 2, sustainability: 1, capital: 2, setFlag: "tif-active", message: "TIF active with affordability rider." },
      },
      {
        label: "Accept standard TIF",
        outcome: "accepted standard TIF",
        effect: { growth: 3, capital: 3, equity: -2, setFlag: "tif-active" },
      },
      {
        label: "Block the TIF",
        outcome: "blocked the TIF",
        effect: { equity: 2, growth: -2, capital: -1 },
      },
    ],
    glossary: ["TIF"],
  },
  {
    id: "exp-empowerment-zone-1994",
    year: { from: 1993, to: 1997 },
    title: "Federal Empowerment Zone designation",
    headline: "HUD is offering tax credits for businesses that hire locally.",
    body:
      "Your ward qualifies. Benefit is $3,000 per employee tax credit for hiring zone residents. Critics say it mostly subsidizes businesses that would have hired anyway.",
    lore:
      "The Empowerment Zone program (1994) designated 6 urban zones including Chicago. Evaluations including Busso et al. (2013) found modest employment effects but significant deadweight loss. The program was replaced by Promise Zones (2014).",
    source: "Busso, Gregory, and Kline, 'Assessing the Incidence and Efficiency of a Prominent Place Based Policy' (2013)",
    options: [
      {
        label: "Accept with a local-hire enforcement office",
        outcome: "accepted EZ designation with enforcement office",
        effect: { capital: 3, equity: 2, growth: 2 },
      },
      {
        label: "Accept standard EZ",
        outcome: "accepted standard EZ designation",
        effect: { capital: 3, growth: 1 },
      },
      {
        label: "Decline",
        outcome: "declined EZ designation",
        effect: { capital: -1 },
      },
    ],
  },
];

/* ============================================================== *
 *  Era IV: 2001 to 2040 - Modern Toolkit                          *
 * ============================================================== */

const ERA_IV_EVENTS: GameEvent[] = [
  {
    id: "exp-2008-foreclosure-crisis",
    year: { from: 2007, to: 2010 },
    title: "Subprime crisis",
    headline: "Foreclosures. Vacancies. Vandalism.",
    body:
      "The ward has 300 foreclosure filings in one quarter. Speculators are buying up the vacancies. Neighbors are organizing squats.",
    lore:
      "The 2008 foreclosure crisis hit Chicago's South and West sides hardest. Pre-existing redlining, subprime targeting, and speculative flipping combined. Recovery was uneven; some neighborhoods have not recovered. Anti-Eviction Campaign, Communities United, and other organizations documented and fought the crisis.",
    source: "Federal Reserve Bank of Chicago subprime crisis reports; Anti-Eviction Campaign records",
    weight: 3,
    options: [
      {
        label: "Fund foreclosure prevention and tenant support",
        outcome: "funded foreclosure prevention and tenant support",
        effect: { equity: 4, trust: 2, capital: -3 },
      },
      {
        label: "Let the market clear",
        outcome: "let the market clear",
        effect: { equity: -4, heritage: -3, trust: -2, transformParcels: [{ selector: "random:5", set: { owner: "speculator" } }] },
      },
      {
        label: "Buy up vacant parcels with a land bank",
        outcome: "bought vacant parcels with a land bank",
        effect: { equity: 3, heritage: 2, sustainability: 1, capital: -3, transformParcels: [{ selector: "type:vacant", set: { owner: "land-trust" } }] },
      },
    ],
  },
  {
    id: "exp-covid-pandemic-2020",
    year: { from: 2020, to: 2022 },
    title: "COVID-19 pandemic",
    headline: "Hospitals overwhelmed. Schools closed. Rents unpaid.",
    body:
      "The pandemic is disproportionately hitting your ward's essential workers. Rental relief funds are oversubscribed. Schools are remote; digital divide is acute.",
    lore:
      "COVID-19 mortality in Chicago was disproportionately concentrated in Black and Latino neighborhoods. Federal rental assistance was critical; uptake varied by neighborhood. Schools remained remote in CPS until 2021.",
    source: "City of Chicago COVID-19 response reports; CDPH data archives",
    weight: 3,
    options: [
      {
        label: "Mobilize ward infrastructure for relief: broadband, food, rent assistance",
        outcome: "mobilized ward infrastructure for comprehensive relief",
        effect: { equity: 5, heritage: 2, trust: 3, sustainability: 2, capital: -2 },
      },
      {
        label: "Standard city response",
        outcome: "followed the standard city response",
        effect: { equity: -1, trust: -1 },
      },
      {
        label: "Prioritize reopening business over protection",
        outcome: "prioritized business reopening",
        effect: { equity: -3, heritage: -1, growth: 1, trust: -2 },
      },
    ],
  },
  {
    id: "exp-george-floyd-protest-2020",
    year: { from: 2020, to: 2020 },
    title: "George Floyd protests",
    headline: "Minneapolis. May 25. Chicago takes to the streets.",
    body:
      "Thousands march in downtown Chicago. The mayor raises bridges. Looting begins in neighborhood commercial corridors. Your ward's 63rd Street corridor is hit.",
    lore:
      "George Floyd was murdered by Minneapolis police on May 25, 2020. Chicago saw among the largest protests. Mayor Lightfoot raised downtown bridges, effectively sealing downtown. Looting followed in several commercial corridors. The city's policing and property-damage responses both drew criticism.",
    source: "Chicago Tribune May-June 2020 coverage; Lightfoot administration records",
    options: [
      {
        label: "Mobilize community repair and jobs program; refuse police escalation",
        outcome: "mobilized community repair and refused police escalation",
        effect: { equity: 4, heritage: 2, trust: 3, power: -1, capital: -2 },
      },
      {
        label: "Cooperate with curfew and police sweeps",
        outcome: "cooperated with curfew and police sweeps",
        effect: { equity: -2, trust: -2, power: 1 },
      },
      {
        label: "Stay silent through the week",
        outcome: "stayed silent",
        effect: { equity: -1, trust: -1 },
      },
    ],
  },
  {
    id: "exp-rle-construction-2028",
    year: { from: 2025, to: 2032 },
    title: "Red Line Extension construction begins",
    headline: "Shovels in the ground. 95th to 130th.",
    body:
      "The RLE will disrupt six ward blocks for five years. Post-construction, four new stations will transform land values. Developers are circling.",
    lore:
      "The Red Line Extension began construction in 2025 after the FTA's Full Funding Grant Agreement in December 2024. Target revenue service: 2030. Projected ridership: 31,000 daily boardings. Land-value impacts projected at 40% uplift within a half-mile radius by 2032.",
    source: "FTA Red Line Extension records; CTA construction and EIS",
    options: [
      {
        label: "Lock in anti-displacement measures before station openings",
        outcome: "locked in anti-displacement measures pre-station",
        effect: { equity: 5, heritage: 3, sustainability: 3, setFlag: "transit-extension" },
      },
      {
        label: "Negotiate a standard community benefits agreement",
        outcome: "negotiated a standard CBA",
        effect: { growth: 3, sustainability: 2, equity: 1, setFlag: "transit-extension" },
      },
      {
        label: "Let the market respond",
        outcome: "let the market respond to the RLE",
        effect: { growth: 4, equity: -4, heritage: -3, setFlag: "transit-extension", transformParcels: [{ selector: "adjacent-to:transit", delta: { value: 15 } }] },
      },
    ],
    glossary: ["RedLineExtension", "Displacement"],
  },
  {
    id: "exp-bally-casino-2023",
    year: { from: 2022, to: 2025 },
    title: "Bally's Chicago casino opens",
    headline: "River West. First Chicago casino. $1.7B projected revenue.",
    body:
      "The casino is not in your ward. The impact is. Reduced state aid because casino revenue is state-restricted. Addictions rising. Some jobs available to ward residents.",
    lore:
      "Bally's Chicago was approved in 2022, opened temporarily in 2023, and permanent site in 2026. Revenue accrues to pension funds, not schools or neighborhood services. Social-cost analyses of casinos (Grinols, Kindt) are mixed.",
    source: "Illinois Gaming Board; City of Chicago Bally's agreement",
    options: [
      {
        label: "Build problem-gambling services infrastructure",
        outcome: "built problem-gambling services infrastructure",
        effect: { equity: 2, sustainability: 1, capital: -2 },
      },
      {
        label: "Just take the jobs",
        outcome: "just took the jobs",
        effect: { growth: 1 },
      },
      {
        label: "Ignore the downstream effects",
        outcome: "ignored downstream casino effects",
        effect: { equity: -2, heritage: -1 },
      },
    ],
  },
  {
    id: "exp-mansion-tax-referendum-2024",
    year: { from: 2023, to: 2026 },
    title: "Bring Chicago Home mansion-tax referendum",
    headline: "Real-estate transfer tax on sales over $1M. Ballot measure.",
    body:
      "The coalition proposes a graduated transfer tax on real-estate sales, with revenue dedicated to homelessness services. Landlord groups are fighting. Your ward's turnout matters.",
    lore:
      "Chicago's 'Bring Chicago Home' referendum was on the March 2024 primary ballot. A judge initially blocked it; the court of appeals restored it. The referendum failed narrowly. The coalition continues to work.",
    source: "Bring Chicago Home coalition records; March 2024 referendum results",
    options: [
      {
        label: "Go all-in for the referendum",
        outcome: "went all-in for the mansion tax",
        effect: { equity: 4, heritage: 2, power: -2 },
      },
      {
        label: "Quiet support",
        outcome: "quietly supported the referendum",
        effect: { equity: 1 },
      },
      {
        label: "Oppose",
        outcome: "opposed the referendum",
        effect: { equity: -3, capital: 2 },
      },
    ],
  },
  {
    id: "exp-migrant-crisis-2023",
    year: { from: 2022, to: 2025 },
    title: "Venezuelan migrant crisis",
    headline: "Buses arrive weekly from Texas. Your ward's gym is a shelter.",
    body:
      "Greg Abbott is bussing asylum-seekers to Chicago. The city is scrambling. Your ward's public gym becomes a temporary shelter. Neighbors are mobilizing, some to help, some to complain.",
    lore:
      "Governor Greg Abbott's busing program began in 2022 and has sent tens of thousands of migrants to Chicago, New York, and other cities. Chicago's shelter system has been stretched; several neighborhood gyms were temporarily converted. Mayor Johnson's response has been contested.",
    source: "City of Chicago migrant response reports; WBEZ migrant crisis coverage",
    options: [
      {
        label: "Open the shelter and organize volunteer supports",
        outcome: "opened the shelter and organized volunteer supports",
        effect: { equity: 4, heritage: 2, trust: 2, capital: -1 },
      },
      {
        label: "Accept the shelter quietly",
        outcome: "accepted the shelter quietly",
        effect: { equity: 1 },
      },
      {
        label: "Block the shelter",
        outcome: "blocked the shelter",
        effect: { equity: -4, heritage: -2, trust: -2 },
      },
    ],
  },
  {
    id: "exp-ev-mandate-2030",
    year: { from: 2028, to: 2035 },
    title: "EV mandate implementation",
    headline: "2035 ICE vehicle ban approaches. Ward is mid-transition.",
    body:
      "The state's 2035 internal-combustion vehicle phase-out is six years away. Ward's charging infrastructure is thin. Mechanics fear obsolescence. Lease costs up.",
    lore:
      "Illinois EV policy has been inconsistent. A 2035 phase-out would roughly match California's. Charging infrastructure investment has lagged demand. Equitable EV transition is a growing concern area.",
    source: "Illinois EPA EV transition plans; RMI equitable EV transition reports",
    options: [
      {
        label: "Build out public charging; reskill mechanics; preserve legacy shops",
        outcome: "built out public charging and reskilled mechanics",
        effect: { sustainability: 4, equity: 3, heritage: 2, growth: 2, capital: -3 },
      },
      {
        label: "Let the market handle the transition",
        outcome: "let the market handle the transition",
        effect: { sustainability: 1, equity: -2, growth: 1 },
      },
      {
        label: "Fight the phase-out",
        outcome: "fought the phase-out",
        effect: { heritage: 1, sustainability: -3 },
      },
    ],
  },
  {
    id: "exp-climate-flooding-2032",
    year: { from: 2028, to: 2040 },
    title: "100-year flood, third in a decade",
    headline: "Twelve inches of rain in three days. Every basement south of the canal.",
    body:
      "Third major flood since 2023. FEMA is on site. Residents are demanding buyouts, floodwalls, or both.",
    lore:
      "Climate-intensified rainfall has increased Chicago flood events. The Chicago Area Waterway System and combined sewers are increasingly overwhelmed. FEMA flood-buyout programs (Hazard Mitigation Grants) are oversubscribed. Managed retreat and green infrastructure are both parts of the toolkit.",
    source: "Chicago Area Waterway System flood reports; FEMA HMG program data",
    options: [
      {
        label: "Fund voluntary buyouts in the floodplain; green infrastructure elsewhere",
        outcome: "funded voluntary buyouts and green infrastructure",
        effect: { sustainability: 5, equity: 3, heritage: 1, capital: -4 },
      },
      {
        label: "Build floodwalls",
        outcome: "built floodwalls",
        effect: { sustainability: 2, heritage: 1, capital: -3 },
      },
      {
        label: "Wait it out",
        outcome: "waited it out",
        effect: { sustainability: -3, equity: -3 },
      },
    ],
  },
  {
    id: "exp-ai-data-center-2034",
    year: { from: 2028, to: 2040 },
    title: "AI data-center siting proposal",
    headline: "A data center wants 20 acres. 200 megawatts. 50 permanent jobs.",
    body:
      "The power consumption is the equivalent of 150,000 homes. Jobs are limited. Tax revenue is substantial. The ward's industrial land is vacant and tempting.",
    lore:
      "Hyperscale AI data centers became a major siting issue in the mid-2020s. Power demand is enormous; jobs are few; tax benefits can be real. Northern Virginia and Hillsboro OR showed the trade-offs. Chicago has seen smaller data centers; the question of hyperscale is open.",
    source: "Uptime Institute data-center reports; Illinois Commerce Commission energy reviews",
    options: [
      {
        label: "Demand community benefit agreement with renewable sourcing and worker training",
        outcome: "negotiated a data center CBA with renewable sourcing",
        effect: { capital: 4, growth: 3, sustainability: 2, equity: 2 },
      },
      {
        label: "Accept standard siting",
        outcome: "accepted standard data-center siting",
        effect: { capital: 5, growth: 3, sustainability: -3, equity: -1 },
      },
      {
        label: "Block the data center",
        outcome: "blocked the data-center proposal",
        effect: { sustainability: 3, growth: -2, capital: -1 },
      },
    ],
  },
  {
    id: "exp-ev-autonomous-freight",
    year: { from: 2032, to: 2040 },
    title: "Autonomous-freight corridor",
    headline: "An autonomous-truck corridor is proposed along the expressway.",
    body:
      "The corridor would reduce trucking costs 40% at the expense of local driver jobs. Local freight handlers are skeptical. The state is pushing hard.",
    lore:
      "Autonomous freight has been piloted in Texas, Arizona, and California. Safety records are improving but local workforce displacement is real. Illinois has a growing logistics sector that the transition could reshape.",
    source: "DOT autonomous-vehicle program reviews; BLS transportation workforce projections",
    options: [
      {
        label: "Demand a just-transition package for drivers",
        outcome: "demanded a just-transition package",
        effect: { equity: 3, growth: 1, sustainability: 1, capital: -2 },
      },
      {
        label: "Accept without labor protections",
        outcome: "accepted without labor protections",
        effect: { growth: 3, sustainability: 2, equity: -3 },
      },
      {
        label: "Block the corridor",
        outcome: "blocked the autonomous-freight corridor",
        effect: { heritage: 2, growth: -2 },
      },
    ],
  },
];

/* ============================================================== *
 *  Extra crisis events                                            *
 * ============================================================== */

const CRISIS_EVENTS: GameEvent[] = [
  {
    id: "exp-crisis-speculator-fire",
    year: { from: 1965, to: 2040 },
    triggerSignal: "many-speculators",
    title: "Arson investigation wave",
    headline: "Seven suspicious fires in one month. All in speculator-owned buildings.",
    body:
      "The pattern is clear; the insurance payouts are suspicious; the families burned out are terrified. The fire marshal wants authority to freeze insurance payouts pending investigation.",
    lore:
      "Chicago had a well-documented arson-for-profit pattern in the 1970s and 80s. Bronzeville, Lawndale, and parts of the South Side saw buildings repeatedly burn, insurance paid, and the land eventually flipped. Federal prosecutors pursued several rings in the 1980s.",
    source: "Newbern, Crying the Fire (1982); Chicago Tribune arson investigations 1974-1990",
    options: [
      {
        label: "Back the fire marshal's investigation",
        outcome: "backed the fire marshal's investigation",
        effect: { equity: 3, heritage: 2, trust: 2, power: -1 },
      },
      {
        label: "Seek federal co-investigation",
        outcome: "sought federal co-investigation",
        effect: { equity: 2, knowledge: 2, heritage: 1 },
      },
      {
        label: "Let the marshal handle it quietly",
        outcome: "let the marshal handle it quietly",
        effect: { equity: 1 },
      },
    ],
  },
  {
    id: "exp-crisis-tower-riot",
    year: { from: 1970, to: 2010 },
    triggerSignal: "tower-deterioration",
    title: "Tower residents occupy CHA offices",
    headline: "A delegation from the towers has occupied the management office.",
    body:
      "The elevator has been broken for 40 days. The heat failed last winter. The management office is locked from the inside. Reporters are on-site.",
    lore:
      "CHA office occupations were a common tactic in the 1970s and 80s. Resident management corporations grew from some of these actions. The Cabrini-Green LAC and Robert Taylor LAC were significant political actors.",
    source: "Hunt, Blueprint for Disaster (2009); Feldman and Stall, The Dignity of Resistance (2004)",
    options: [
      {
        label: "Go to the office in person; back the residents' demands",
        outcome: "backed the tower residents' demands",
        effect: { equity: 4, heritage: 3, trust: 3, power: -2 },
      },
      {
        label: "Call for a mediator",
        outcome: "called for mediation",
        effect: { equity: 1, trust: 1 },
      },
      {
        label: "Call the police",
        outcome: "called the police",
        effect: { equity: -4, heritage: -2, trust: -3, power: 2 },
      },
    ],
  },
  {
    id: "exp-crisis-low-equity-march",
    year: { from: 1960, to: 2040 },
    triggerSignal: "low-equity",
    title: "Organized march at the ward office",
    headline: "Three hundred residents are marching on your office.",
    body:
      "Banner: 'Our Ward, Our Voice.' Demands: an emergency anti-displacement ordinance, a community benefits board, and an audit of every TIF dollar in the ward. You can address the crowd, negotiate, or ignore.",
    lore:
      "Neighborhood marches on aldermanic offices have been a regular Chicago feature since the 1960s. Aldermanic responses have varied widely; successful de-escalation often requires substantive commitments, not just listening.",
    source: "Chicago community organizing oral histories",
    options: [
      {
        label: "Address the crowd; commit publicly to the three demands",
        outcome: "addressed the crowd and committed to the demands",
        effect: { equity: 4, heritage: 2, trust: 3, power: -2 },
      },
      {
        label: "Meet a delegation privately",
        outcome: "met a delegation privately",
        effect: { equity: 2, trust: 1 },
      },
      {
        label: "Ignore the march",
        outcome: "ignored the march",
        effect: { equity: -3, heritage: -1, trust: -3 },
      },
    ],
  },
  {
    id: "exp-crisis-heritage-demolition",
    year: { from: 1960, to: 2040 },
    triggerSignal: "low-heritage",
    title: "Demolition derby on three cultural buildings",
    headline: "Three pre-1920 buildings at once. Permits filed.",
    body:
      "A mural on the side of the grocery. A former jazz club. A three-flat built by the woman who led the 1919 strike. All slated for demolition this week. Emergency landmarking is possible but politically expensive.",
    lore:
      "Chicago's landmarks ordinance has demolition-review procedures but they are routinely circumvented by 90-day demo-delay expiration or emergency demolitions for 'safety.' Recent losses include the Rainbo Club, Pilgrim Baptist, and hundreds of less-publicized buildings.",
    source: "Landmarks Illinois most-endangered lists; Chicago landmarks ordinance",
    options: [
      {
        label: "Emergency-landmark all three",
        outcome: "emergency-landmarked all three",
        effect: { heritage: 5, power: -2, capital: -1 },
      },
      {
        label: "Landmark the mural only",
        outcome: "landmarked the mural only",
        effect: { heritage: 2, power: -1 },
      },
      {
        label: "Let them go",
        outcome: "let them go",
        effect: { heritage: -3 },
      },
    ],
  },
  {
    id: "exp-crisis-displacement-wave",
    year: { from: 2000, to: 2040 },
    triggerSignal: "high-displacement",
    title: "Displacement wave",
    headline: "Thirty eviction filings in one week. Organized by address.",
    body:
      "A new landlord is buying up buildings and mass-evicting. Residents are organizing a block-wide rent strike. The court is a few weeks away from issuing judgments.",
    lore:
      "Mass eviction patterns by purchase-and-evict investors became increasingly common after 2015. The Eviction Lab at Princeton has documented the scale. Tenant organizing against mass-eviction patterns often requires multi-building coordination.",
    source: "Eviction Lab, Princeton; Community Investment Corporation Chicago data",
    options: [
      {
        label: "Fund legal aid for all 30 cases; coordinate the rent strike",
        outcome: "funded legal aid and coordinated the rent strike",
        effect: { equity: 5, heritage: 2, trust: 3, capital: -3, power: -1 },
      },
      {
        label: "Standard mediation",
        outcome: "offered standard mediation",
        effect: { equity: 1 },
      },
      {
        label: "Let the court handle it",
        outcome: "let the court handle it",
        effect: { equity: -4, heritage: -2, trust: -2, transformParcels: [{ selector: "random:4", delta: { residents: -3, memory: -10 } }] },
      },
    ],
  },
  {
    id: "exp-crisis-climate-heat-dome",
    year: { from: 2025, to: 2040 },
    triggerSignal: "climate-flood",
    title: "Heat dome",
    headline: "Three days over 110. Grid stressed.",
    body:
      "The grid is groaning. ComEd is rolling blackouts. Your cooling centers are at capacity. Elderly residents are dying.",
    lore:
      "Climate projections predict longer, more severe heat domes in the Midwest through the 2030s. Chicago's 2012 Climate Action Plan is being updated. Heat mortality remains concentrated in weakly-networked, low-income neighborhoods.",
    source: "Fourth National Climate Assessment; Chicago Climate Action Plan updates",
    options: [
      {
        label: "Mobilize block clubs and libraries for a full heat response",
        outcome: "mobilized block clubs and libraries for heat response",
        effect: { sustainability: 4, equity: 3, heritage: 2, trust: 2 },
      },
      {
        label: "Standard cooling-center response",
        outcome: "ran a standard cooling-center response",
        effect: { sustainability: 1, equity: 1 },
      },
      {
        label: "Under-respond",
        outcome: "under-responded to the heat dome",
        effect: { sustainability: -3, equity: -4, heritage: -2 },
      },
    ],
  },
];

/* ============================================================== *
 *  Export                                                         *
 * ============================================================== */

export const EXPANSION_EVENTS: GameEvent[] = [
  ...ERA_I_EVENTS,
  ...ERA_II_EVENTS,
  ...ERA_III_EVENTS,
  ...ERA_IV_EVENTS,
  ...CRISIS_EVENTS,
];
