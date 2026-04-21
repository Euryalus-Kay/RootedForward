/**
 * Expansion pack of additional policy cards.
 *
 * Every card below is a real lever that a Chicago alderman, organizer,
 * developer, scholar, preacher, or journalist could pull. Card names and
 * descriptions are written in plain language. Lore notes cite real
 * Chicago, Illinois, and federal history.
 *
 * The expansion is organized by era so the deck rotates richly:
 *   - 1940 to 1955 : The Great Migration and redlining years
 *   - 1956 to 1975 : Urban renewal, expressways, public housing
 *   - 1976 to 2000 : Disinvestment, white flight, gentrification's first wave
 *   - 2001 to 2040 : Modern toolkit, climate, transit, displacement at scale
 *
 * Each card is balanced against the four hidden scores: equity, heritage,
 * growth, sustainability. Costs are paid in capital, power, trust, knowledge.
 * No card is strictly dominant. Every card involves a trade-off.
 */

import type { Card } from "./types";

/* ============================================================== *
 *  Era I: 1940 to 1955 - Lines on a Map                           *
 * ============================================================== */

const DEPRESSION_POSTWAR_CARDS: Card[] = [
  {
    id: "exp-fha-lending-pool-1943",
    name: "Municipal mortgage pool for redlined blocks",
    flavor: "City money where the federal dollar will not follow.",
    description:
      "The city stands up a local revolving loan fund. Black families in blocks the FHA has redlined can take a 20-year mortgage directly from the city. The fund takes losses the banks refused to take. Trust in the ward goes up, capital goes down fast, and the gap in homeownership between the north and south blocks closes a little.",
    lore:
      "Before the GI Bill, a handful of Black-owned banks in Chicago, Nashville, and Atlanta did something like this at a small scale. Illinois Federal Savings, founded in 1934, was the first Black-chartered S&L in Chicago. The municipal-pool idea was debated at the 1944 Chicago Urban League conference and never enacted.",
    source:
      "Satter, Family Properties (2009); Illinois Federal Savings and Loan records, Chicago History Museum",
    category: "finance",
    rarity: "rare",
    cost: { capital: 5, power: 2, knowledge: 1 },
    fromYear: 1940,
    toYear: 1960,
    effect: {
      equity: 5,
      growth: 2,
      trust: 2,
      transformParcels: [
        { selector: "holc:D", delta: { value: 4, condition: 3 } },
      ],
    },
    glossary: ["FHA", "Redlining"],
  },
  {
    id: "exp-stevens-hotel-protest-1944",
    name: "Back the Stevens Hotel sit-in",
    flavor: "A pulpit and a picket line on State Street.",
    description:
      "Black guests denied rooms. Your congregation backs the sit-in, your name appears on the coalition letter, the paper runs a sympathetic headline, the hotel opens its doors. Minor capital gain from donation bump, modest trust up. No parcels change; the city changes a little.",
    lore:
      "Ida B. Wells-Barnett had led similar integrated-hotel fights in Chicago starting in the 1890s. The late-1940s CORE chapter picketed Stouffer's and Walgreen lunch counters; the broader State Street hotel fight picks up through the 1950s. Acts 10 of solidarity matter.",
    source: "Chicago Defender archive, 1944 editions; CORE Chicago records",
    category: "organizing",
    rarity: "uncommon",
    cost: { trust: 1, power: 1 },
    fromYear: 1942,
    toYear: 1960,
    effect: {
      equity: 3,
      heritage: 2,
      trust: 2,
      message: "The hotel integrates. Slow ripple, not a wave.",
    },
    glossary: ["ChicagoFreedomMovement"],
  },
  {
    id: "exp-victory-gardens-citywide",
    name: "Victory gardens on vacant parcels",
    flavor: "Beans and tomatoes across the ward.",
    description:
      "Every vacant lot becomes a working garden. Block captains coordinate seed distribution, the Park District supplies tools, the newspaper prints planting guides. Food security goes up, neighborhood memory deepens, and the vacant parcels stop bleeding value.",
    lore:
      "At the peak of World War II, Chicago had about 250,000 active Victory Gardens. The program shut down after V-J Day but left a template that re-emerged as community gardens in the 1970s.",
    source: "Chicago Park District Victory Garden records (1942-1945)",
    category: "environment",
    rarity: "common",
    cost: { capital: 1, trust: 1 },
    fromYear: 1940,
    toYear: 1950,
    effect: {
      sustainability: 2,
      heritage: 2,
      equity: 1,
      transformParcels: [
        { selector: "type:vacant", delta: { condition: 6, memory: 4 } },
      ],
    },
  },
  {
    id: "exp-rent-strike-1946",
    name: "Support the Mecca rent strike",
    flavor: "The tenants are organized. The landlord is not.",
    description:
      "A nineteenth-century apartment hotel turned tenement. The boiler failed in February. The landlord ignored the letters. Rent strikes organize themselves fast when people freeze. Back the strike publicly and the tenants win a freeze; refuse and you keep the peace with the real-estate bloc.",
    lore:
      "The Mecca Flats at 34th and State Street was a famous Black Chicago apartment that IIT demolished in 1952 to build Crown Hall. Gwendolyn Brooks wrote her 1968 book-length poem 'In the Mecca' about the building's last decade.",
    source: "Gwendolyn Brooks, 'In the Mecca' (1968); IIT campus planning files",
    category: "organizing",
    rarity: "uncommon",
    cost: { trust: 2 },
    fromYear: 1942,
    toYear: 1955,
    effect: {
      equity: 3,
      heritage: 2,
      trust: 1,
      power: -1,
    },
    glossary: ["Bronzeville"],
  },
  {
    id: "exp-school-bond-1948",
    name: "Pass a school-construction bond",
    flavor: "The classrooms are overcrowded. The voters know it.",
    description:
      "Every school in the ward adds classrooms, every new classroom gets a teacher. The property tax goes up about a dollar a month on the average bill. Equity rises as the southside schools get the same class-size standard the north side already had.",
    lore:
      "Chicago passed major school bonds in 1945, 1957, and 1973. The 1957 bond built 176 new schools and additions. The fight over where to site them tracked exactly with where the city was willing to expand Black enrollment.",
    source: "CPS Capital Plan history; Hirsch, Making the Second Ghetto (1983)",
    category: "schools",
    rarity: "common",
    cost: { capital: 3, power: 1 },
    fromYear: 1945,
    toYear: 1965,
    effect: {
      equity: 3,
      growth: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "type:school", delta: { condition: 8, residents: 2 } },
      ],
    },
  },
  {
    id: "exp-shelley-kraemer-briefs-1947",
    name: "File an amicus brief for Shelley v. Kraemer",
    flavor: "The court will take the case. The brief will matter.",
    description:
      "Join the NAACP, ACLU, and American Jewish Congress amici supporting the Shelley plaintiffs. The ruling a year later makes racial covenants unenforceable. Short-term this costs political capital in your ward; the long run changes the entire national landscape.",
    lore:
      "Shelley v. Kraemer (1948) was argued by Thurgood Marshall for the NAACP LDF. Chicago's Robert Taylor (before the towers bore his name) and Elizabeth Wood filed a key amicus representing the CHA's view that covenants undermined federal housing programs.",
    source: "Shelley v. Kraemer, 334 U.S. 1 (1948); Chicago Defender coverage 1947-48",
    category: "preservation",
    rarity: "rare",
    cost: { power: 2, knowledge: 2 },
    fromYear: 1946,
    toYear: 1950,
    effect: {
      equity: 4,
      heritage: 2,
      knowledge: 1,
      setFlag: "covenants-challenged",
    },
    glossary: ["Covenants"],
  },
  {
    id: "exp-trumbull-park-defense-1953",
    name: "Defend the Trumbull Park integrators",
    flavor: "The family is Black. The neighborhood is white. The mob is real.",
    description:
      "A single family moves into a previously all-white CHA project on the far South Side. The mob throws rocks for weeks. The city sends police; the police are not neutral. Stand publicly with the family and you pay a political cost now for a moral credit that will matter in the 1960s fights.",
    lore:
      "Trumbull Park Homes in South Deering saw mob violence against Black families for almost a decade starting in 1953. Police protection was routine but ineffective. The Donald Howard family was the first to move in; they faced riots, fire-bombings, and daily harassment.",
    source: "Hirsch, Making the Second Ghetto (1983); Trumbull Park oral history collection at University of Chicago",
    category: "organizing",
    rarity: "rare",
    cost: { power: 2, trust: 1 },
    fromYear: 1952,
    toYear: 1960,
    effect: {
      equity: 4,
      heritage: 2,
      trust: 2,
      capital: -1,
    },
    glossary: ["ChicagoFreedomMovement"],
  },
  {
    id: "exp-cabrini-early-1942",
    name: "Support the original Cabrini rowhouses",
    flavor: "Two-story rowhouses. Integrated. Nice.",
    description:
      "Support federal funds for the first Cabrini-Green, a 586-unit rowhouse development. Construction is approved. Short-term modest growth. The choice matters for what gets built on top of the rowhouses later.",
    lore:
      "The Frances Cabrini Rowhouses were built in 1942 as relatively high-quality, low-rise integrated public housing. The Cabrini Extension (high-rises) came in 1958 and the Green Homes (high-rises) in 1962. The rowhouses remained until 2011, one of the last pieces of the complex standing.",
    source: "Hunt, Blueprint for Disaster (2009); CHA design archives",
    category: "housing",
    rarity: "common",
    cost: { capital: 3 },
    fromYear: 1940,
    toYear: 1950,
    effect: {
      growth: 2,
      equity: 2,
      heritage: 1,
      transformParcels: [
        { selector: "first-vacant:central", set: { type: "courtyard", owner: "cha" }, delta: { residents: 20, condition: 10 } },
      ],
    },
    glossary: ["CHA"],
  },
  {
    id: "exp-tuskegee-airmen-fund",
    name: "Fund a Tuskegee veterans' GI-Bill office",
    flavor: "The bill is on the books. The access is not.",
    description:
      "A storefront on 47th Street helps Black veterans get the benefits the federal statute nominally guarantees them. Mortgage counseling, business loans, tuition paperwork. The uptake rate in the ward goes from near zero to competitive with the North Side.",
    lore:
      "The 1944 GI Bill in practice excluded the vast majority of Black veterans because administrators blocked access to loans, mortgages, and university admissions. The Tuskegee Airmen were among the most organized in securing and distributing access through their own networks.",
    source: "Katznelson, When Affirmative Action Was White (2005)",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 2, trust: 1 },
    fromYear: 1945,
    toYear: 1960,
    effect: {
      equity: 4,
      growth: 2,
      heritage: 1,
      knowledge: 1,
      transformParcels: [
        { selector: "holc:C", delta: { condition: 3 } },
        { selector: "holc:D", delta: { condition: 3 } },
      ],
    },
  },
  {
    id: "exp-industrial-council-1944",
    name: "Back to Industrial Areas Foundation organizing",
    flavor: "Saul Alinsky and the Packinghouse Union at one table.",
    description:
      "Your ward's slaughterhouse workers, parish priests, and small-business owners sit at the same table under the IAF umbrella. The coalition takes on wage theft, schools, and streets. Your capital stays flat; your political muscle grows.",
    lore:
      "The Industrial Areas Foundation, founded by Saul Alinsky in 1940 starting with Chicago's Back of the Yards, pioneered broad-based community organizing that mixed labor unions, churches, and neighborhood associations. The model is now used globally.",
    source: "Alinsky, Reveille for Radicals (1946); Horwitt, Let Them Call Me Rebel (1989)",
    category: "organizing",
    rarity: "uncommon",
    cost: { trust: 2 },
    fromYear: 1940,
    toYear: 1970,
    effect: {
      equity: 2,
      heritage: 1,
      trust: 2,
      power: 1,
    },
  },
  {
    id: "exp-pruitt-igoe-caution-1952",
    name: "Memorandum: question the high-rise model",
    flavor: "Before the towers. A paper. A vote.",
    description:
      "You circulate Elizabeth Wood's 1952 memo questioning the CHA's shift from rowhouses to high-rises. It does not stop the towers. It makes your position legible to historians. Minor trust gain; the sustainability score holds because your ward postpones the tower decision two turns.",
    lore:
      "Elizabeth Wood was the CHA's first executive director and resisted both the segregation of public housing and the high-rise design. She was forced out in 1954. Her 1952 memo questioning towers is one of the most-cited documents in later public-housing scholarship.",
    source: "Bowly, The Poorhouse: Subsidized Housing in Chicago (1978); Hunt, Blueprint for Disaster",
    category: "research",
    rarity: "rare",
    cost: { knowledge: 1, power: 1 },
    fromYear: 1950,
    toYear: 1960,
    effect: {
      sustainability: 3,
      equity: 1,
      knowledge: 1,
      message: "The memo joins the record. The towers are postponed.",
    },
    glossary: ["CHA"],
  },
  {
    id: "exp-south-center-rehab-1948",
    name: "South Center Department Store rehab",
    flavor: "Chicago's first Black-owned department store. Restore it.",
    description:
      "South Center at 47th and South Parkway was the anchor of Bronzeville's commercial district. Back owner Harry Englestein in reopening the third floor, hire local workers for the renovation, and watch the block come alive for Saturday shopping.",
    lore:
      "The South Center Department Store, built in 1928, was Bronzeville's largest retail anchor. It operated until 1975. Englestein was white but hired an integrated staff and managed labor relations with the Black community through local organizations.",
    source: "Drake and Cayton, Black Metropolis (1945); Chicago Defender business pages 1945-1970",
    category: "commerce",
    rarity: "uncommon",
    cost: { capital: 3 },
    fromYear: 1945,
    toYear: 1965,
    effect: {
      growth: 3,
      heritage: 3,
      equity: 1,
      transformParcels: [
        { selector: "type:commercial", delta: { condition: 6, value: 4 } },
      ],
    },
    glossary: ["Bronzeville"],
  },
  {
    id: "exp-settle-covenants-1947",
    name: "Negotiate covenant buyouts",
    flavor: "Neighbors pay each other to lift the clause.",
    description:
      "Your office sets up a fund that quietly pays to remove racial covenants from deeds in the north blocks. Every deed released broadens the market. The Association screams. The fund delivers results.",
    lore:
      "A handful of northern-side Chicago neighborhoods used exactly this mechanism in 1946-1948 to preempt the Supreme Court ruling. The Hyde Park-Kenwood Community Conference formally organized around integration and covenant removal.",
    source: "Hyde Park-Kenwood Community Conference papers; Rothstein, The Color of Law",
    category: "preservation",
    rarity: "uncommon",
    cost: { capital: 3, power: 2 },
    fromYear: 1946,
    toYear: 1952,
    effect: {
      equity: 3,
      heritage: 1,
      transformParcels: [
        { selector: "block:0", delta: { value: -2 } },
        { selector: "block:1", delta: { value: -2 } },
      ],
    },
    glossary: ["Covenants"],
  },
  {
    id: "exp-newsletter-1950",
    name: "Publish a weekly ward newsletter",
    flavor: "The Defender covers the city. You cover the block.",
    description:
      "A one-sheet weekly tucked into every mailbox in the ward. Hearings, ordinance drafts, school-bond updates. It is the information infrastructure of your ward. Small knowledge gain now; compounding trust across the decades.",
    lore:
      "Chicago ward newsletters were a mid-century staple. Some, like the 4th Ward Citizens' News, influenced citywide policy. Alinsky built many of his Back of the Yards campaigns on mimeographed block newsletters.",
    source: "Chicago Public Library local publication archives",
    category: "research",
    rarity: "common",
    cost: { knowledge: 1 },
    fromYear: 1940,
    toYear: 2040,
    effect: {
      knowledge: 2,
      trust: 1,
      heritage: 1,
    },
  },
  {
    id: "exp-wpa-mural-restoration",
    name: "Restore the WPA post-office murals",
    flavor: "Paint from 1937. Scaffolding from 1950.",
    description:
      "The five New Deal murals in the Parkhaven post office are flaking. Contract a local team to restore them. The branch becomes a community landmark. The union electricians donate their time for the lighting.",
    lore:
      "The WPA Federal Art Project produced about 2,500 murals nationwide in the 1930s. Many Chicago post offices had commissioned murals. A surprising number survive, though some were destroyed in postwar renovations. Chicago's Woodlawn branch mural was painted over in 1961.",
    source: "GSA Public Buildings WPA mural registry",
    category: "culture",
    rarity: "common",
    cost: { capital: 1, knowledge: 1 },
    fromYear: 1940,
    toYear: 1965,
    effect: {
      heritage: 3,
      sustainability: 1,
      transformParcels: [
        { selector: "random:2", set: { type: "mural" }, delta: { memory: 8, condition: 5 } },
      ],
    },
  },
  {
    id: "exp-library-expansion-1953",
    name: "Build a branch library",
    flavor: "Stacks, meeting rooms, a bulletin board.",
    description:
      "The Carnegie Library Corporation grants part of the cost; the ward covers the rest. A Parkhaven branch opens with 30,000 volumes, a children's wing, and one of the first air-conditioned reading rooms on the South Side.",
    lore:
      "Chicago Public Library had 53 branch libraries by 1960. The Regional Library Branch Program of the 1960s added 12 more. Branches were crucial to Black Chicago literacy during an era of unequal schools.",
    source: "Chicago Public Library historical annual reports",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 1945,
    toYear: 1975,
    effect: {
      heritage: 3,
      equity: 2,
      knowledge: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "first-vacant", set: { type: "library", owner: "city" }, delta: { condition: 15 } },
      ],
    },
  },
  {
    id: "exp-stockyards-close-plan",
    name: "Quietly draft stockyards transition plan",
    flavor: "The yards will close. The question is what after.",
    description:
      "The Union Stock Yards are bleeding; by 1971 they will close. You commission a transition study now, so when the jobs go your ward has a plan: light industry, manufacturing, housing. Growth is steadier a generation from now.",
    lore:
      "The Union Stock Yards operated from 1865 to 1971 on 375 acres around 41st and Halsted. Their closure reshaped Back of the Yards and the surrounding neighborhoods. The transition was chaotic. A 1950s planning document would have been transformative.",
    source: "Pacyga, Chicago: A Biography (2009); Back of the Yards Neighborhood Council records",
    category: "research",
    rarity: "uncommon",
    cost: { knowledge: 2 },
    fromYear: 1948,
    toYear: 1965,
    effect: {
      knowledge: 2,
      sustainability: 2,
      growth: 1,
      setFlag: "industrial-transition-plan",
    },
  },
  {
    id: "exp-wabash-transit-1948",
    name: "Back the South Side Rapid Transit vote",
    flavor: "Elevated steel. Daily commute. 1948 electorate.",
    description:
      "You endorse the 1948 transit bond for the South Side. The State Street subway opens. A transit stop appears in your central blocks. Growth and sustainability tick up; a slow gentrification clock begins.",
    lore:
      "Chicago's 1943 subway and 1951 Dearborn Street subway reshaped downtown transit. South Side elevated upgrades continued through the 1950s. Every transit project raised land values in a quarter-mile radius; 1950s projects often displaced Black residents directly.",
    source: "CTA historical records; Chicago Tribune transit coverage 1947-1952",
    category: "transit",
    rarity: "uncommon",
    cost: { capital: 2, power: 2 },
    fromYear: 1945,
    toYear: 1965,
    effect: {
      growth: 3,
      sustainability: 2,
      equity: -1,
      transformParcels: [
        { selector: "first-vacant:central", set: { type: "transit", owner: "city" }, delta: { value: 8 } },
      ],
    },
    glossary: ["RedLineExtension"],
  },
  {
    id: "exp-chicago-defender-distro",
    name: "Subsidize Defender newsroom access",
    flavor: "The Black paper reaches the whole ward.",
    description:
      "Your office underwrites a subscription drive for the Chicago Defender across the ward. Print circulation doubles. The paper's coverage of your decisions is sharper; your trust score gains when you do right, loses faster when you do wrong.",
    lore:
      "The Chicago Defender was founded by Robert S. Abbott in 1905 and became the most important Black newspaper in the Great Migration era. Its 'Great Northern Drive' editorials in 1917 are credited with accelerating the Migration itself.",
    source: "Michaeli, The Defender (2016)",
    category: "culture",
    rarity: "common",
    cost: { capital: 1, trust: 1 },
    fromYear: 1940,
    toYear: 1975,
    effect: {
      heritage: 2,
      equity: 1,
      knowledge: 1,
    },
  },
  {
    id: "exp-dawson-machine",
    name: "Work with the Dawson organization",
    flavor: "The Black sub-machine inside the Daley machine.",
    description:
      "You align with Rep. William Dawson's Second Ward machine. Patronage jobs flow. The ward gets streetlights and trash pickup on time. The trade-off: on racial policy you follow where Dawson leads, which is rarely out front.",
    lore:
      "William L. Dawson represented the 1st Congressional District from 1943 to 1970, running the Black sub-machine for Mayor Daley. Dawson delivered services and patronage to Bronzeville but rarely challenged Daley on racial integration. Scholars debate whether this was compromise or collaboration.",
    source: "Grimshaw, Bitter Fruit: Black Politics and the Chicago Machine (1992)",
    category: "organizing",
    rarity: "rare",
    cost: { power: 2, trust: -1 },
    fromYear: 1943,
    toYear: 1970,
    effect: {
      capital: 3,
      growth: 2,
      equity: -1,
      heritage: -1,
    },
  },
  {
    id: "exp-block-club-federation",
    name: "Charter a block-club federation",
    flavor: "Every block has a club. Every club has a bylaw.",
    description:
      "Your ward recognizes a federation of block clubs by ordinance. The clubs get a quarterly stipend for events and maintenance. Trust climbs steadily. The federation becomes your partner for every organizing play.",
    lore:
      "Block clubs in Chicago date to the 1900s but exploded in the postwar era. By 1970 there were thousands. The Woodlawn Organization, founded 1959, federated block clubs at the neighborhood scale. The Alinsky-era IAF model spread the approach.",
    source: "Fish, Black Power White Power (1973); Chicago Community Trust block-club archives",
    category: "organizing",
    rarity: "common",
    cost: { trust: 1, capital: 1 },
    fromYear: 1945,
    toYear: 2040,
    effect: {
      trust: 2,
      equity: 1,
      heritage: 2,
      sustainability: 1,
    },
  },
  {
    id: "exp-gospel-crusade-radio",
    name: "Sponsor a gospel-radio broadcast",
    flavor: "Sunday morning, WVON, your congregation.",
    description:
      "You underwrite a weekly half-hour gospel hour on WVON. Donations spike to the parish. The broadcast gives your ward a cultural identity beyond politics. Heritage gains; capital takes a small hit.",
    lore:
      "WVON ('Voice of the Negro') began in 1963 under Leonard and Phil Chess of Chess Records. Gospel, blues, and talk radio on the South Side shaped the sound of Black Chicago for two generations. The station remains on air.",
    source: "Green, Selling the Race (2007)",
    category: "culture",
    rarity: "common",
    cost: { capital: 1 },
    fromYear: 1945,
    toYear: 2000,
    effect: {
      heritage: 3,
      trust: 1,
    },
  },
  {
    id: "exp-savings-and-loan-charter-1950",
    name: "Charter a Black-owned S&L",
    flavor: "A Black-owned bank. Lends in the redline.",
    description:
      "Your ward backs the charter of a Black-owned savings and loan. It opens on 63rd Street and will lend into redlined blocks the FHA will not touch. Equity and growth climb slowly over decades.",
    lore:
      "Illinois Federal Savings and Loan (1934) was Chicago's first Black-chartered S&L. Seaway National Bank came in 1965, Independence Bank of Chicago in 1964. Black-owned banks were a critical workaround to FHA redlining but never had the capital base of white-owned peers.",
    source: "Baradaran, The Color of Money (2017)",
    category: "finance",
    rarity: "rare",
    cost: { capital: 4, knowledge: 1 },
    fromYear: 1945,
    toYear: 1975,
    effect: {
      equity: 4,
      growth: 2,
      heritage: 1,
      transformParcels: [
        { selector: "holc:D", delta: { value: 2, condition: 2 } },
      ],
    },
    glossary: ["FHA", "Redlining"],
  },
  {
    id: "exp-marshall-plan-parish",
    name: "Fund parish-led housing cooperative",
    flavor: "The church owns the deed. The tenants own the board.",
    description:
      "St. Sabina (fictional, named for the real parish) chartered a tenant-cooperative apartment building. Ten units at low rent, controlled by a tenant board, backed by the parish endowment. Model scales slowly through the decades.",
    lore:
      "Chicago parishes, especially on the South and West sides, have operated affordable housing programs since the 1950s. Interfaith Housing Chicago (founded 1969) federated many of them. St. Sabina has long been a landmark in affordable-housing and anti-violence organizing.",
    source: "Interfaith Housing Development Corporation records",
    category: "housing",
    rarity: "uncommon",
    cost: { capital: 2, trust: 2 },
    fromYear: 1948,
    toYear: 2040,
    effect: {
      equity: 3,
      heritage: 2,
      trust: 2,
      transformParcels: [
        { selector: "first-of-type:three-flat", set: { owner: "land-trust", protected: true } },
      ],
    },
  },
  {
    id: "exp-postwar-playground-bond",
    name: "Neighborhood playground bond",
    flavor: "Sandbox, swings, three basketball hoops.",
    description:
      "A small bond funds six new playgrounds across the ward. Children get space. Parents meet their neighbors. The parks are modest but present. Heritage rises quietly for a generation.",
    lore:
      "The Chicago Park District's postwar playground program added more than 200 neighborhood playgrounds between 1948 and 1965. Distribution was uneven: North Side wards got more.",
    source: "Chicago Park District annual reports 1945-1965",
    category: "environment",
    rarity: "common",
    cost: { capital: 2 },
    fromYear: 1945,
    toYear: 1970,
    effect: {
      heritage: 2,
      sustainability: 2,
      equity: 1,
      transformParcels: [
        { selector: "random:3", set: { type: "park" }, delta: { condition: 10 } },
      ],
    },
  },
];

/* ============================================================== *
 *  Era II: 1956 to 1975 - Contracts and Covenants                 *
 * ============================================================== */

const URBAN_RENEWAL_CARDS: Card[] = [
  {
    id: "exp-contract-buyers-league-1968",
    name: "Back the Contract Buyers League strike",
    flavor: "Payment withheld. Title contested.",
    description:
      "You stand with the CBL when 500 Black homeowners stop payments and contract sellers come after them. Your political capital takes a hit; your equity score climbs significantly. Several parcels flip out of speculator hands back to the residents.",
    lore:
      "The Contract Buyers League, led by Ruth Wells and Charles Baker, organized starting in 1968. At peak, 500 families in Lawndale and Austin were on rent strike. They won renegotiations for 95% of participants, saving an estimated $30,000 per family in today's dollars.",
    source: "Satter, Family Properties (2009); Chicago History Museum CBL collection",
    category: "organizing",
    rarity: "rare",
    cost: { trust: 3, power: 2 },
    fromYear: 1967,
    toYear: 1975,
    effect: {
      equity: 5,
      heritage: 3,
      capital: -2,
      transformParcels: [
        { selector: "owner:speculator", set: { owner: "resident" }, delta: { memory: 10 } },
      ],
    },
    glossary: ["ContractBuying"],
  },
  {
    id: "exp-fair-housing-march-1966",
    name: "Join the Marquette Park march",
    flavor: "Dr. King is leading. You walk with him.",
    description:
      "You publicly join the August 5, 1966 march into Marquette Park. You take a rock to the shoulder, like King did. The cost is real; so is the moral capital you earn. Trust spikes; some early equity gains; your political standing with the North Side wards drops permanently.",
    lore:
      "The Chicago Freedom Movement's Marquette Park march on August 5, 1966 was one of the most violent civil rights confrontations in the North. King was struck by a rock and said 'I have seen many demonstrations in the South, but I have never seen anything so hostile and so hateful as I've seen here today.'",
    source: "Ralph, Northern Protest (1993); Garrow, Bearing the Cross (1986)",
    category: "organizing",
    rarity: "rare",
    cost: { power: 2, trust: 1 },
    fromYear: 1966,
    toYear: 1968,
    effect: {
      equity: 5,
      heritage: 4,
      trust: 3,
      power: -2,
    },
    glossary: ["ChicagoFreedomMovement"],
  },
  {
    id: "exp-neg-summit-1966",
    name: "Negotiate the Summit Agreement seriously",
    flavor: "Daley is at the table. He may still not mean it.",
    description:
      "You insist the Summit Agreement's fair-housing commitments have enforcement teeth: HUD reporting, an independent monitor, a benchmark by 1970. Daley agrees on paper. You build the monitoring system into the ordinance immediately. The agreement's afterlife is actually binding.",
    lore:
      "The Summit Agreement of August 1966 was the outcome of the Chicago Freedom Movement: Daley, CHA, real-estate boards, and the SCLC agreed to fair-housing policies. In practice Daley never enforced it. Scholars debate whether any version could have worked given the machine's incentives.",
    source: "Ralph, Northern Protest (1993)",
    category: "preservation",
    rarity: "rare",
    cost: { power: 3, knowledge: 2 },
    fromYear: 1966,
    toYear: 1970,
    effect: {
      equity: 5,
      heritage: 3,
      trust: 2,
      setFlag: "summit-enforced",
    },
    glossary: ["ChicagoFreedomMovement"],
  },
  {
    id: "exp-lafayette-place-option",
    name: "Refuse the I-290 southern swing",
    flavor: "The expressway does not have to go here.",
    description:
      "When federal engineers propose routing the Eisenhower south through your ward's industrial corridor, you mobilize and get the route pushed north. The ward keeps its fabric. The price is future federal favor.",
    lore:
      "The Eisenhower Expressway (I-290) was routed through the Near West Side between 1949 and 1961, demolishing the primarily Italian and Greek Taylor Street corridor. Alternative routes were considered but rejected, often because of political weight on the north side.",
    source: "Mohl, The Interstates and the Cities (2008); Chicago Tribune 1950-1960 expressway coverage",
    category: "infrastructure",
    rarity: "rare",
    cost: { power: 3, trust: 2 },
    fromYear: 1956,
    toYear: 1968,
    effect: {
      heritage: 4,
      equity: 3,
      sustainability: 2,
      growth: -2,
    },
    glossary: ["Expressway"],
  },
  {
    id: "exp-robert-taylor-siting",
    name: "Fight the Robert Taylor siting",
    flavor: "Fifty-three blocks along State Street. No.",
    description:
      "You publicly oppose the siting of Robert Taylor Homes on the two-mile State Street corridor. Your opposition wins a quarter of the proposed sites being scrapped. The towers that do get built are smaller. A quieter decade later, lower heritage damage.",
    lore:
      "The Robert Taylor Homes were 28 identical 16-story buildings on 53 blocks along State Street, built 1961-1962. Their siting was approved by aldermen after white wards rejected any CHA proposals in their territory. Demolition began in 1998.",
    source: "Hunt, Blueprint for Disaster (2009)",
    category: "housing",
    rarity: "rare",
    cost: { power: 3, trust: 2 },
    fromYear: 1958,
    toYear: 1964,
    effect: {
      heritage: 3,
      equity: 2,
      sustainability: 1,
      growth: -2,
      setFlag: "taylor-opposed",
    },
    glossary: ["CHA"],
  },
  {
    id: "exp-gautreaux-plaintiff-1966",
    name: "Back Dorothy Gautreaux in court",
    flavor: "Her name will be on the case that changes the country.",
    description:
      "You back the Gautreaux lawsuit with city resources, including a private investigator who documents the siting bias pattern across five decades. When the Supreme Court rules in 1976, the Gautreaux program's scope is bigger because of what you put on the record in 1967.",
    lore:
      "Dorothy Gautreaux was a CHA tenant and organizer who filed the 1966 lawsuit that ended at the Supreme Court as Hills v. Gautreaux (1976). The Gautreaux relocation program ran 1976-1998 and moved about 7,000 families to majority-white neighborhoods.",
    source: "Hills v. Gautreaux, 425 U.S. 284 (1976); Rubinowitz and Rosenbaum, Crossing the Class and Color Lines (2000)",
    category: "preservation",
    rarity: "rare",
    cost: { knowledge: 2, power: 2 },
    fromYear: 1966,
    toYear: 1976,
    effect: {
      equity: 5,
      heritage: 3,
      knowledge: 2,
      setFlag: "gautreaux-backed",
    },
    glossary: ["Gautreaux"],
  },
  {
    id: "exp-section-235-push-1968",
    name: "Push Section 235 homeownership",
    flavor: "A federal subsidy for a Black homeowner's first mortgage.",
    description:
      "The 1968 Housing Act created Section 235 subsidies for first-time low-income buyers. You set up a ward office that gets 200 families through the paperwork in year one. Equity climbs. Later, when Section 235 is scandalized by predatory real-estate agents, your office catches most of it.",
    lore:
      "Section 235 of the 1968 Housing and Urban Development Act subsidized mortgages for low-income first-time buyers. It was heavily defrauded in many cities including Detroit and Philadelphia. Chicago's outcomes were mixed; well-run neighborhood offices made a difference.",
    source: "Taylor, Race for Profit (2019)",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 2, knowledge: 2 },
    fromYear: 1968,
    toYear: 1976,
    effect: {
      equity: 3,
      growth: 2,
      heritage: 1,
    },
  },
  {
    id: "exp-fight-dan-ryan-widening",
    name: "Fight the Dan Ryan widening",
    flavor: "Daley wants fourteen lanes. Your ward wants eight.",
    description:
      "The original Dan Ryan was widened from 8 to 14 lanes at Daley's direction, specifically to separate South Side Black neighborhoods from white wards to the west. You fight to freeze lane count. You lose. You record the loss. Your equity score holds when later Chicago reckons with expressway racism.",
    lore:
      "The Dan Ryan Expressway opened in 1962 and was widened in 1967 to 14 lanes. Mayor Richard J. Daley personally directed the widening. Historians including Arnold Hirsch argue the widening was explicitly racial, intended to keep the South Side Black population east of Halsted.",
    source: "Hirsch, Making the Second Ghetto (1983)",
    category: "infrastructure",
    rarity: "uncommon",
    cost: { power: 2 },
    fromYear: 1964,
    toYear: 1972,
    effect: {
      heritage: 2,
      equity: 2,
      knowledge: 1,
    },
    glossary: ["Expressway", "Daley"],
  },
  {
    id: "exp-open-gallery-1970",
    name: "Commission a Wall of Respect mural",
    flavor: "Forty-three artists. Forty portraits.",
    description:
      "You commission a South Side mural on the side of a two-story commercial building, modeled on the 1967 Wall of Respect at 43rd and Langley. The artwork becomes a landmark. Heritage climbs. The parcel becomes protected by community tradition.",
    lore:
      "The Wall of Respect, painted in 1967 by the Organization of Black American Culture (OBAC), depicted forty Black heroes and sparked the global community-mural movement. It stood until 1971, destroyed in a fire. Chicago now has hundreds of community murals, many descendants of the Wall.",
    source: "Jeff Huebner, The Wall of Respect: Vestiges, Shards, and the Legacy of Black Power (2015)",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 1, trust: 1 },
    fromYear: 1967,
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
    id: "exp-first-black-alderman-aid",
    name: "Back a Black aldermanic challenger",
    flavor: "The Daley machine has a candidate. You back the other.",
    description:
      "You endorse and mobilize for a Black challenger in a previously machine-controlled ward. The challenger wins. Your ward's political alignment shifts for a generation. Organizing infrastructure is built; some machine favors are lost.",
    lore:
      "Black aldermanic representation in Chicago grew slowly from one in the 1930s to several by the 1960s. Harold Washington's 1983 mayoral victory was built on decades of aldermanic wins in challenge campaigns starting in the 1960s.",
    source: "Grimshaw, Bitter Fruit (1992)",
    category: "organizing",
    rarity: "uncommon",
    cost: { trust: 2, power: 1 },
    fromYear: 1963,
    toYear: 1985,
    effect: {
      equity: 3,
      trust: 2,
      power: 2,
    },
  },
  {
    id: "exp-model-cities-funding",
    name: "Apply for Model Cities funding",
    flavor: "Federal grant. Seven square miles. Citizen oversight.",
    description:
      "You apply for and win Model Cities designation. $8 million federal dollars flow into the ward over five years with mandated resident-board oversight. Housing renovates; schools get reading programs; trust builds. The compromise is that the city cuts you into its patronage system.",
    lore:
      "The Model Cities Program (1966-1974) funded 150 U.S. cities. Chicago's program concentrated in Lawndale, Woodlawn, and Grand Boulevard. Outcomes were mixed but the program produced several lasting neighborhood institutions including Woodlawn Organization's housing arm.",
    source: "Haar, Between the Idea and the Reality (1975)",
    category: "finance",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 2 },
    fromYear: 1966,
    toYear: 1975,
    effect: {
      capital: 5,
      equity: 3,
      growth: 2,
      heritage: 1,
      transformParcels: [
        { selector: "block:4", delta: { condition: 8 } },
        { selector: "block:5", delta: { condition: 8 } },
      ],
    },
  },
  {
    id: "exp-chicago-freedom-school",
    name: "Fund a Freedom School in the basement",
    flavor: "Curriculum not on the CPS reading list.",
    description:
      "A Freedom School runs out of your largest church basement every summer. Chicago history from a Black perspective, civic organizing, and civil-rights training. Three generations of ward leaders graduate from it. Knowledge and trust compound quietly over decades.",
    lore:
      "Freedom Schools began in Mississippi in 1964 and spread to northern cities. Chicago's Freedom Schools in the late 1960s were often run out of churches and Black Panther offices. Survival Programs associated with the Illinois Black Panther Party included free breakfast programs that continued through the 1970s.",
    source: "Williams, From the Bullet to the Ballot (2013)",
    category: "schools",
    rarity: "uncommon",
    cost: { trust: 1, knowledge: 1 },
    fromYear: 1964,
    toYear: 2000,
    effect: {
      heritage: 3,
      equity: 3,
      knowledge: 2,
      trust: 1,
    },
  },
  {
    id: "exp-gacy-chief-1972",
    name: "Back Rainbow Coalition across race lines",
    flavor: "Black Panthers, Young Lords, Young Patriots, at one table.",
    description:
      "Fred Hampton's original Rainbow Coalition (1969) unites the Chicago Black Panther Party with the Puerto Rican Young Lords and the poor-white Young Patriots. You provide safe meeting space and material support. Your trust score climbs sharply; your heat with the police department rises.",
    lore:
      "Fred Hampton was the 21-year-old chairman of the Illinois Black Panther Party. His Rainbow Coalition (later name reused by Jesse Jackson) was one of the most innovative multi-racial organizing efforts in American political history. He was killed by the Chicago Police Department on December 4, 1969 while sleeping.",
    source: "Williams, From the Bullet to the Ballot (2013)",
    category: "organizing",
    rarity: "rare",
    cost: { trust: 2, power: 2 },
    fromYear: 1968,
    toYear: 1975,
    effect: {
      equity: 4,
      heritage: 3,
      trust: 3,
      knowledge: 1,
    },
  },
  {
    id: "exp-roseland-schools-1972",
    name: "Fight school boundary gerrymandering",
    flavor: "The line on the map. The line in the school.",
    description:
      "The CPS has gerrymandered school-attendance boundaries to keep Roseland's elementary schools more segregated than the neighborhood. You build the data case and force boundary adjustments. Equity climbs; a few white families leave for suburbs.",
    lore:
      "Chicago Public Schools' attendance boundaries were repeatedly gerrymandered through the 1960s and 70s to maintain segregation. The 1980 federal consent decree required some redrawing but many patterns persisted. School boundary challenges became a routine civil-rights tactic.",
    source: "Danns, Something Better for Our Children (2003)",
    category: "schools",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 2 },
    fromYear: 1967,
    toYear: 1985,
    effect: {
      equity: 3,
      heritage: 1,
      sustainability: 1,
    },
  },
  {
    id: "exp-operation-breadbasket",
    name: "Support Operation Breadbasket",
    flavor: "Boycott. Negotiate. Hire.",
    description:
      "You publicly back Operation Breadbasket's boycott of the Jewel-Osco distribution center until Black hires in the ward reach parity. The pickets work; two hundred union jobs go to Parkhaven residents. Your ward's working class rises an inch.",
    lore:
      "Operation Breadbasket was founded by Rev. Jesse Jackson in Chicago in 1966 as the SCLC's economic arm. Its boycotts and negotiated covenants secured Black hiring at A&P, National Tea, Red Rooster, and others. It became Operation PUSH in 1971.",
    source: "Frady, Jesse: The Life and Pilgrimage of Jesse Jackson (1996)",
    category: "organizing",
    rarity: "common",
    cost: { trust: 2 },
    fromYear: 1966,
    toYear: 1980,
    effect: {
      equity: 3,
      trust: 2,
      growth: 1,
    },
  },
  {
    id: "exp-harold-washington-precinct",
    name: "Build precinct infrastructure for a Washington run",
    flavor: "The machine is a machine. You are building another one.",
    description:
      "A decade before 1983, you pre-build the precinct infrastructure that will elect Chicago's first Black mayor. Money into precinct captains, voter registration, neighborhood organizers. Slow burn; when Harold Washington runs, the ward delivers at 90%.",
    lore:
      "Harold Washington won the Democratic mayoral primary in February 1983 and the general election in April. His coalition was built on two decades of Black political organizing. Joe Gardner, Jacky Grimshaw, and Ed Kelly were among the architects of the precinct-level work.",
    source: "Rivlin, Fire on the Prairie (1992)",
    category: "organizing",
    rarity: "rare",
    cost: { trust: 2, power: 2, knowledge: 1 },
    fromYear: 1972,
    toYear: 1983,
    effect: {
      equity: 3,
      trust: 3,
      power: 2,
      heritage: 1,
    },
  },
  {
    id: "exp-preservation-landmark-1969",
    name: "Landmark the Pilgrim Baptist Church",
    flavor: "Dankmar Adler designed it. Gospel was born there.",
    description:
      "You push through the landmark designation for Pilgrim Baptist Church, a 1890 Adler and Sullivan synagogue turned 1922 Black Baptist church where gospel music was institutionalized by Thomas A. Dorsey. The designation slows demolition of three other contiguous blocks; heritage rises markedly.",
    lore:
      "Pilgrim Baptist was a 1890 Adler and Sullivan synagogue (originally KAM Temple), converted in 1922 to a Baptist church. Thomas A. Dorsey, the 'Father of Gospel Music,' served as music director there for 50 years. The building burned in 2006. The site is still empty.",
    source: "Chicago Landmarks Commission designation reports; Harris, The Rise of Gospel Blues (1992)",
    category: "preservation",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 1968,
    toYear: 1985,
    effect: {
      heritage: 5,
      growth: -1,
      transformParcels: [
        { selector: "type:church", set: { protected: true }, delta: { memory: 10 } },
      ],
    },
  },
  {
    id: "exp-scattered-site-1970",
    name: "Back scattered-site public housing",
    flavor: "Small, low-rise, spread across the whole city.",
    description:
      "You push for scattered-site CHA units at low-rise scale across all 50 wards, not concentrated in your ward. The North Side fights hard. Compromise gets 1,000 scattered-site units built. Heritage holds; equity rises modestly.",
    lore:
      "The Gautreaux consent decree of 1969 required CHA to site scattered-site units in majority-white areas. The program produced about 2,000 units by 2000, constantly fought by northside aldermen. Units were small, well-maintained, and often indistinguishable from market-rate housing.",
    source: "Hills v. Gautreaux, 425 U.S. 284 (1976); CHA scattered-site program records",
    category: "housing",
    rarity: "rare",
    cost: { power: 3, capital: 2 },
    fromYear: 1970,
    toYear: 1995,
    effect: {
      equity: 4,
      heritage: 2,
      sustainability: 2,
      transformParcels: [
        { selector: "random:6", set: { owner: "cha" }, delta: { condition: 8 } },
      ],
    },
    glossary: ["Gautreaux", "CHA"],
  },
  {
    id: "exp-hotline-1974",
    name: "Open a tenant-rights hotline",
    flavor: "Call the number. Talk to a paralegal.",
    description:
      "A phone line in a storefront, staffed by a paralegal and a rotating set of law-school volunteers. Evictions referred to legal aid; code violations routed to housing court. The pipeline runs for thirty years.",
    lore:
      "Lawyers' Committee for Better Housing (LCBH) was founded in 1980 in Chicago to provide tenant-side legal aid. It remains the city's largest tenant-rights provider. Earlier tenant hotlines operated out of Legal Assistance Foundation, founded 1967.",
    source: "LCBH 40-year anniversary report",
    category: "organizing",
    rarity: "common",
    cost: { capital: 1, trust: 1 },
    fromYear: 1968,
    toYear: 2040,
    effect: {
      equity: 2,
      trust: 2,
    },
  },
  {
    id: "exp-open-lands-trust-1972",
    name: "Charter a land-banking nonprofit",
    flavor: "The city buys vacant. The nonprofit holds.",
    description:
      "A nonprofit land bank quietly acquires vacant lots across the ward using municipal bond proceeds. The bank holds parcels until the right community project appears, keeping speculators out. Eight land-trust parcels arrive over the next decade.",
    lore:
      "Illinois's land-banking enabling act dates to 2010 but informal land-banking by nonprofits existed much earlier. Openlands (1963) and Neighborhood Housing Services (1975) were among Chicago's pioneering land-stewardship organizations.",
    source: "Illinois Land Bank Authority Act; Openlands 50-year history",
    category: "finance",
    rarity: "uncommon",
    cost: { capital: 2, knowledge: 2 },
    fromYear: 1970,
    toYear: 2040,
    effect: {
      equity: 3,
      sustainability: 2,
      heritage: 1,
      transformParcels: [
        { selector: "type:vacant", set: { owner: "land-trust" } },
      ],
    },
    glossary: ["CommunityLandTrust"],
  },
  {
    id: "exp-ordinance-2-family",
    name: "Legalize two-flats in single-family zones",
    flavor: "A second unit on the single-family block.",
    description:
      "You pass an ordinance quietly legalizing two-flats in the northern blocks' single-family zones. Opposition from the Property Owners Association is loud. A generation later the north blocks remain middle-class; but at lower density, with fewer wealth extractors.",
    lore:
      "Chicago's postwar 'R-1' single-family zones were used explicitly to maintain racial and class segregation. Rezoning to allow two-flats is one of the quieter interventions against that pattern. Minneapolis eliminated single-family zoning citywide in 2020.",
    source: "Rothstein, The Color of Law (2017); Minneapolis 2040 Plan",
    category: "zoning",
    rarity: "uncommon",
    cost: { power: 2 },
    fromYear: 1968,
    toYear: 2000,
    effect: {
      equity: 3,
      growth: 2,
      heritage: -1,
      transformParcels: [
        { selector: "block:0", delta: { value: -2, residents: 1 } },
        { selector: "block:1", delta: { value: -2, residents: 1 } },
      ],
    },
  },
  {
    id: "exp-teachers-strike-1969",
    name: "Back the CTU strike",
    flavor: "The schools close. The demands are on the table.",
    description:
      "You publicly back the 1969 CTU strike for smaller class sizes, decent heating, and teacher pay. The strike ends with a settlement. Your political cost is modest; the school system improves for a generation.",
    lore:
      "The Chicago Teachers Union has struck 9 times since 1969. The 1969 strike won major salary increases. The 2012 strike under Karen Lewis rejuvenated CTU as a political force. CTU political endorsement is a significant factor in mayoral races.",
    source: "Golin, The Chicago Teachers Strike of 2012 (2016)",
    category: "schools",
    rarity: "uncommon",
    cost: { power: 1, trust: 1 },
    fromYear: 1969,
    toYear: 2040,
    effect: {
      equity: 2,
      growth: 1,
      sustainability: 1,
      trust: 1,
    },
  },
  {
    id: "exp-alewife-lakefront",
    name: "Lakefront park extension",
    flavor: "Burnham said it. You fund it.",
    description:
      "You allocate ward resources to the lakefront park extension project, adding three blocks of park along the shore. The park becomes the ward's front yard. Heritage and sustainability rise; you lose some private-development revenue.",
    lore:
      "Chicago's 1909 Plan of Chicago (Burnham Plan) mandated a continuous lakefront park from Evanston to Indiana. Most of it was built by 1950, but extensions and upgrades continue. Lakefront parks are Chicago's most recognizable public asset.",
    source: "Smith, The Plan of Chicago (2006)",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 3, power: 1 },
    fromYear: 1960,
    toYear: 2000,
    effect: {
      sustainability: 4,
      heritage: 3,
      growth: -1,
      transformParcels: [
        { selector: "random:2", set: { type: "park" }, delta: { condition: 15 } },
      ],
    },
  },
];

/* ============================================================== *
 *  Era III: 1976 to 2000 - Towers and Renewal                     *
 * ============================================================== */

const DISINVESTMENT_CARDS: Card[] = [
  {
    id: "exp-cra-enforcement-1977",
    name: "Enforce the Community Reinvestment Act locally",
    flavor: "Federal law on paper. Local staff in practice.",
    description:
      "The 1977 CRA requires banks to lend in low-income neighborhoods. You set up a ward CRA compliance office that files complaints against the banks not meeting targets. Within five years, $20M in new mortgages flow into the ward.",
    lore:
      "The Community Reinvestment Act (1977) was authored by Senator William Proxmire and grew out of NCRC, LISC, and the Woodstock Institute's advocacy. Enforcement has varied by administration. Local CRA offices in neighborhoods like Austin and Lawndale were often decisive in actual uptake.",
    source: "Community Reinvestment Act of 1977, Pub. L. 95-128",
    category: "finance",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 2 },
    fromYear: 1977,
    toYear: 2020,
    effect: {
      equity: 3,
      growth: 2,
      heritage: 1,
      capital: 2,
      transformParcels: [
        { selector: "holc:D", delta: { value: 4, condition: 3 } },
      ],
    },
    glossary: ["Redlining", "FHA"],
  },
  {
    id: "exp-pilsen-mural-cluster",
    name: "Commission the 18th Street mural cluster",
    flavor: "A dozen murals. One commission. One coalition.",
    description:
      "You commission a cluster of twelve murals along 18th Street, in partnership with Pilsen Arts Alliance. Walls tell neighborhood history in Spanish, English, and Nahuatl. The cluster becomes a tourist route and a shield against redevelopment.",
    lore:
      "The 18th Street murals in Pilsen date from the 1970s. Artists including Ray Patlan, Jose Guerrero, and Aurelio Diaz painted murals that documented Mexican revolutionary history and Chicago labor history. The cluster is a designated cultural corridor.",
    source: "Fort, The Murals of Pilsen (2012)",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 2, trust: 1 },
    fromYear: 1975,
    toYear: 2000,
    effect: {
      heritage: 5,
      equity: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "random:3", set: { type: "mural" }, delta: { memory: 12 } },
      ],
    },
    glossary: ["Pilsen"],
  },
  {
    id: "exp-weed-and-seed-refuse",
    name: "Refuse the federal Weed and Seed grant",
    flavor: "They weed first. The seed never comes.",
    description:
      "You turn down the federal Weed and Seed grant, which would have brought $2M for policing and only promised $500k for social services. The decision costs you capital now. Your trust score and equity gain significantly over the decade as the neighborhood avoids becoming a policing laboratory.",
    lore:
      "Weed and Seed was a Justice Department anti-crime program (1991-2011) that coupled aggressive policing with community development. Critics documented that the weeding routinely outpaced the seeding. Several Chicago neighborhoods received Weed and Seed designations.",
    source: "Gilmore, Golden Gulag (2007) on carceral policy context; DOJ Weed and Seed program evaluations",
    category: "organizing",
    rarity: "uncommon",
    cost: { capital: -1 },
    fromYear: 1991,
    toYear: 2010,
    effect: {
      equity: 3,
      trust: 2,
      sustainability: 1,
    },
  },
  {
    id: "exp-tenant-purchase-coop",
    name: "Tenant-purchase conversion of a troubled building",
    flavor: "The landlord walked. The tenants buy.",
    description:
      "A 40-unit apartment building has been foreclosed; the tenants organize a purchase cooperative with city loan backing. The sale closes at below-market. The building stabilizes. The co-op model spreads to three other buildings in the decade.",
    lore:
      "Limited-equity cooperatives in Chicago include the Diversey Manor Co-op and the Paseo Boricua co-ops. The city has had a tenant-first-refusal ordinance since 2018 for condo conversions. The larger tenant-opportunity-to-purchase (TOPA) concept is modeled on Washington DC and Mount Rainier MD.",
    source: "Chicago Tenant Opportunity to Purchase Ordinance (2018); DC TOPA Act",
    category: "housing",
    rarity: "uncommon",
    cost: { capital: 3, trust: 2 },
    fromYear: 1980,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 2,
      growth: 1,
      transformParcels: [
        { selector: "first-of-type:courtyard", set: { owner: "land-trust", protected: true } },
      ],
    },
    glossary: ["CommunityLandTrust"],
  },
  {
    id: "exp-tower-demolish-phase-1",
    name: "Demolish the worst tower",
    flavor: "Lake Parc. Sixteen stories. Empty.",
    description:
      "One of the worst-conditioned CHA towers comes down. Every resident is offered a voucher and a caseworker. The demolition clears parcel for new construction; the displacement harm is real.",
    lore:
      "Lake Parc Place (formerly Washington Park Extension) was one of the first CHA high-rises demolished, in 1989. The Plan for Transformation in 1999 accelerated demolitions. Research by Sudhir Venkatesh, Mary Pattillo, and Chaskin & Joseph documents mixed outcomes for displaced residents.",
    source: "Hunt, Blueprint for Disaster (2009); Chaskin and Joseph, Integrating the Inner City (2015)",
    category: "housing",
    rarity: "rare",
    cost: { capital: 4, power: 2, trust: 2 },
    fromYear: 1985,
    toYear: 2005,
    effect: {
      growth: 2,
      sustainability: 2,
      heritage: -3,
      equity: -2,
      transformParcels: [
        { selector: "type:tower", set: { type: "vacant" } },
      ],
    },
    glossary: ["CHA", "PlanForTransformation"],
  },
  {
    id: "exp-rehab-tower-alternative",
    name: "Rehab the tower instead of demolishing",
    flavor: "Strip it to the studs. Bring it back.",
    description:
      "Rather than demolish, you secure federal funds to do a deep rehab on the tower: new mechanical, insulation, windows, elevators, interior reconfiguration. Residents stay through the rehab with phased moves. The tower becomes a stable working-class building.",
    lore:
      "Pilot projects in Cabrini-Green's 1230 N. Burling and in Lake Parc Place showed that deep rehabs were feasible but more expensive per unit than demolition-and-scatter. The Plan for Transformation largely chose demolition.",
    source: "Chaskin and Joseph, Integrating the Inner City (2015)",
    category: "housing",
    rarity: "rare",
    cost: { capital: 5, power: 2 },
    fromYear: 1985,
    toYear: 2015,
    effect: {
      heritage: 3,
      equity: 4,
      sustainability: 2,
      transformParcels: [
        { selector: "type:tower", set: { type: "rehab-tower" }, delta: { condition: 40 } },
      ],
    },
    glossary: ["CHA"],
  },
  {
    id: "exp-lakefront-protection-ordinance",
    name: "Lakefront Protection Ordinance",
    flavor: "The lake belongs to nobody and to everybody.",
    description:
      "You help pass the Lakefront Protection Ordinance (modeled on Chicago's 1973), which restricts development along the shoreline and protects public access. Sustainability climbs over decades; a handful of developers grumble.",
    lore:
      "Chicago's Lakefront Protection Ordinance (1973) restricted development within 800 feet of the lake. The ordinance was strengthened in 2008. The lakefront is Chicago's most-used public space; Lake Michigan is the drinking-water source.",
    source: "City of Chicago Lakefront Protection Ordinance",
    category: "environment",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 1973,
    toYear: 2040,
    effect: {
      sustainability: 5,
      heritage: 3,
      growth: -2,
      transformParcels: [
        { selector: "random:1", set: { type: "park", protected: true } },
      ],
    },
  },
  {
    id: "exp-single-room-occupancy-preserve",
    name: "Preserve SRO hotel stock",
    flavor: "Nine dollars a night. A lock on the door.",
    description:
      "Chicago lost about 80% of its SRO hotel units between 1960 and 2000. You pass a preservation ordinance that gives SROs a tax break in exchange for keeping rents below a threshold. Equity rises; capital cost is real.",
    lore:
      "Single-Room Occupancy hotels were a critical housing type for poor single adults, especially men, through the mid-20th century. Chicago had about 50,000 SRO units in 1960 and fewer than 10,000 by 2000. Loss correlates directly with rise in homelessness.",
    source: "Hoch and Slayton, New Homeless and Old (1989); Chicago SRO Preservation Ordinance (2014)",
    category: "preservation",
    rarity: "uncommon",
    cost: { capital: 2, power: 2 },
    fromYear: 1980,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 3,
      growth: -1,
    },
  },
  {
    id: "exp-savings-strike-woodlawn-1976",
    name: "Back the Woodlawn revitalization compact",
    flavor: "Three decades of disinvestment. One compact.",
    description:
      "You sign the Woodlawn Compact, a cross-sector agreement among the University of Chicago, the Woodlawn Organization, the Bishop, and the city. Commitments on jobs, housing, and school investment. The compact mostly holds; outcomes are real but uneven.",
    lore:
      "The Woodlawn Compact concept has been proposed several times; a version was partially implemented in the 1970s. The Woodlawn Organization (TWO) was one of Alinsky's most successful IAF projects, founded in 1960.",
    source: "Fish, Black Power White Power (1973); TWO organizational history",
    category: "organizing",
    rarity: "uncommon",
    cost: { power: 2, trust: 2 },
    fromYear: 1975,
    toYear: 2000,
    effect: {
      equity: 3,
      heritage: 2,
      growth: 2,
      trust: 2,
      transformParcels: [
        { selector: "block:4", delta: { condition: 6 } },
      ],
    },
  },
  {
    id: "exp-paid-nurse-home-visits",
    name: "Expand the Nurse Family Partnership",
    flavor: "A nurse visits every new low-income mother. Free.",
    description:
      "You fund an expansion of the Nurse Family Partnership in the ward. Every low-income first-time mother gets a trained nurse home-visit schedule through the child's second birthday. Long-run outcomes on child health and educational attainment are well-documented.",
    lore:
      "The Nurse Family Partnership was developed by David Olds and has been rigorously evaluated in multiple trials with strong positive effects on child and maternal outcomes. It is one of the most-cited evidence-based social programs.",
    source: "Olds et al., 'Effect of Home Visiting by Nurses on Maternal and Child Functioning,' Pediatrics (2007)",
    category: "schools",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 1990,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 1,
      sustainability: 2,
    },
  },
  {
    id: "exp-lehman-college-access-1985",
    name: "Fund a neighborhood college-access office",
    flavor: "FAFSA, visits, tutoring. In the neighborhood.",
    description:
      "A storefront office with four staff helps every Parkhaven high schooler navigate college applications, FAFSA, and decision-making. Four-year college enrollment climbs from 15% to 32% in the ward over fifteen years.",
    lore:
      "Chicago Public Schools' college access initiatives grew through the 2000s. Organizations like OneGoal (2009) pioneered replicable models. Earlier, neighborhood-based efforts in communities like Bronzeville produced similar outcomes at smaller scale.",
    source: "CPS College and Career Office data; OneGoal program evaluations",
    category: "schools",
    rarity: "common",
    cost: { capital: 2, knowledge: 1 },
    fromYear: 1985,
    toYear: 2040,
    effect: {
      equity: 3,
      growth: 2,
      sustainability: 1,
      knowledge: 1,
    },
  },
  {
    id: "exp-city-pulp-fiction-1990",
    name: "Back a free storefront theater",
    flavor: "Basement company. Tickets five dollars.",
    description:
      "You underwrite a small storefront theater in an abandoned shoe-repair space. It runs for 40 years, producing Black, Latinx, and working-class playwrights. Heritage climbs; the company alumni populate Chicago theater for decades.",
    lore:
      "Chicago's storefront-theater scene grew from Steppenwolf (1974) and Organic Theater (1969) through Victory Gardens, Congo Square, Teatro Vista, and dozens of smaller companies. Storefront companies under 99 seats receive favorable zoning and code treatment.",
    source: "Chicago storefront theater oral histories; Chicago Reader theater archives",
    category: "culture",
    rarity: "common",
    cost: { capital: 1, trust: 1 },
    fromYear: 1980,
    toYear: 2040,
    effect: {
      heritage: 3,
      equity: 1,
      growth: 1,
      transformParcels: [
        { selector: "type:commercial", delta: { memory: 8 } },
      ],
    },
  },
  {
    id: "exp-sro-voucher-program-1988",
    name: "Local SRO voucher program",
    flavor: "The voucher fills the gap the federal voucher will not.",
    description:
      "The ward funds a small voucher program specifically for single-adult SRO residents, who often do not qualify for federal Section 8. About 200 residents get stabilized rents. Equity rises; capital drains.",
    lore:
      "Local voucher supplements to Section 8 are common in cities with tight markets. Chicago's Flexible Housing Pool and the Low-Income Trust Fund (2016) are modern variants.",
    source: "All Chicago Making Homelessness History program data",
    category: "housing",
    rarity: "uncommon",
    cost: { capital: 3 },
    fromYear: 1985,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 1,
      sustainability: 1,
    },
    glossary: ["Section8", "AffordableHousing"],
  },
  {
    id: "exp-washington-transition-council",
    name: "Serve on a Washington transition council",
    flavor: "Harold is mayor. You are in the room.",
    description:
      "You are named to Harold Washington's transition council for neighborhood investment (modeled on the real 1983 council). You push for a neighborhoods-first CDBG allocation, and it sticks through the Byrne and Daley II years. Long-run growth and equity benefit your ward.",
    lore:
      "Harold Washington's 1983 election was Chicago's first Black mayor. His administration (1983-1987) prioritized neighborhood investment over downtown. Ed Kelly, Jacky Grimshaw, and dozens of organizers staffed transition work. The 'neighborhoods-first' framing held through 1989.",
    source: "Rivlin, Fire on the Prairie (1992); Grimshaw, Bitter Fruit (1992)",
    category: "finance",
    rarity: "rare",
    cost: { power: 3, knowledge: 2 },
    fromYear: 1983,
    toYear: 1995,
    effect: {
      capital: 4,
      equity: 4,
      heritage: 2,
      growth: 2,
    },
  },
  {
    id: "exp-council-wars-neutral",
    name: "Stay neutral in Council Wars",
    flavor: "Twenty-nine vs. twenty-one. Pick neither.",
    description:
      "Through Council Wars (1983-1986), you refuse to align with the Vrdolyak Twenty-Nine or the Washington Twenty-One. Your ward receives less from both sides. Political independence is earned; the short-run growth cost is real.",
    lore:
      "Council Wars was the 1983-1986 stalemate between Mayor Washington's 21 aldermanic allies and Alderman Ed Vrdolyak's bloc of 29 opponents. Most votes deadlocked 29-21. The 1986 special-election win tipped the balance and let Washington's agenda pass briefly before his death in November 1987.",
    source: "Rivlin, Fire on the Prairie (1992)",
    category: "organizing",
    rarity: "uncommon",
    cost: { power: 1 },
    fromYear: 1983,
    toYear: 1987,
    effect: {
      knowledge: 2,
      trust: 1,
      capital: -2,
      growth: -1,
    },
  },
  {
    id: "exp-nof-foreclosure-1998",
    name: "Build a foreclosure prevention office",
    flavor: "Before the 2008 crash. Infrastructure first.",
    description:
      "A ward foreclosure-prevention office opens in 1998 and is ready by 2008. When the subprime crisis arrives, Parkhaven's foreclosure rate is half the neighboring wards'. Trust and equity climb; the real dividend is when other neighborhoods are burning.",
    lore:
      "Neighborhood Housing Services of Chicago (founded 1975) ran the earliest foreclosure-prevention work in the city. The Housing Action Illinois coalition expanded it through the 2008 crisis. Pre-existing infrastructure was decisive in outcomes by neighborhood.",
    source: "Housing Action Illinois subprime crisis reports; NHS Chicago 40-year records",
    category: "finance",
    rarity: "rare",
    cost: { capital: 2, knowledge: 2 },
    fromYear: 1995,
    toYear: 2012,
    effect: {
      equity: 3,
      heritage: 2,
      sustainability: 1,
      trust: 1,
    },
  },
  {
    id: "exp-hope-vi-neutralize-1996",
    name: "Condition HOPE VI replacement units",
    flavor: "One for one. In writing. Enforceable.",
    description:
      "You insist that every CHA unit demolished under HOPE VI be replaced one-for-one in the ward, in writing, before demolition begins. The delay takes three years. The end result is real: 500 more low-rent units than the baseline plan would have produced.",
    lore:
      "HOPE VI (1992-2010) was HUD's program that funded CHA's demolitions. Replacement commitments were often nominal and not met. The Chicago Plan for Transformation's 25,000-unit commitment fell well short; about 16,000 units of replacement built by 2020.",
    source: "Popkin et al., A Decade of HOPE VI (2004)",
    category: "housing",
    rarity: "rare",
    cost: { power: 3, knowledge: 2 },
    fromYear: 1995,
    toYear: 2015,
    effect: {
      equity: 5,
      heritage: 2,
      growth: 1,
    },
    glossary: ["CHA", "PlanForTransformation"],
  },
  {
    id: "exp-dearborn-homes-rehab",
    name: "Deep rehab Dearborn Homes",
    flavor: "The oldest tower. Still here. Still needed.",
    description:
      "You secure the funding for a deep rehab of Dearborn Homes (Chicago's oldest CHA high-rise, opened 1950). The building is brought up to modern standard without displacing residents. Model for tower preservation citywide.",
    lore:
      "Dearborn Homes was CHA's oldest high-rise, opened in 1950. It was rehabbed 2010-2012 at a cost of about $130M. It remains the only fully-public, fully-rehabbed CHA high-rise. The rehab was widely seen as a model for what Plan for Transformation could have been.",
    source: "CHA Dearborn Homes rehab project reports (2010-2012)",
    category: "housing",
    rarity: "rare",
    cost: { capital: 5, knowledge: 2 },
    fromYear: 2005,
    toYear: 2020,
    effect: {
      equity: 4,
      heritage: 3,
      sustainability: 2,
      growth: 1,
      transformParcels: [
        { selector: "type:tower", set: { type: "rehab-tower" }, delta: { condition: 50 } },
      ],
    },
    glossary: ["CHA"],
  },
  {
    id: "exp-art-bridge-1999",
    name: "Commission a public-art lakefront bridge",
    flavor: "A pedestrian bridge. Public art. Landmark.",
    description:
      "A pedestrian bridge over the expressway, designed by a Black Chicago artist, becomes a landmark. Heritage climbs; sustainability gains slightly from a pedestrian connection; small increase in foot traffic to the central blocks.",
    lore:
      "Chicago has multiple public-art bridges including the 31st Street Pedestrian Bridge (2012) and Burnham Park bridges. The Crown Fountain, Cloud Gate, and Lurie Garden in Millennium Park (2004) are the most-cited recent examples.",
    source: "Chicago Public Art Program records; Millennium Park design history",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 3, power: 1 },
    fromYear: 1995,
    toYear: 2040,
    effect: {
      heritage: 3,
      sustainability: 2,
      growth: 1,
    },
  },
  {
    id: "exp-charter-school-trojan",
    name: "Block a charter-school expansion",
    flavor: "The proposal is glossy. You read the fine print.",
    description:
      "You block the proposed expansion of a charter-school operator into the ward. CPS enrollment stabilizes; the neighborhood high school gets the resources the charter would have drained. Growth is muted; heritage and equity rise.",
    lore:
      "Chicago's charter school expansion in the 1990s and 2000s often drew resources from neighborhood schools. The Noble Network, UNO, and KIPP all grew dramatically. The 2013 CPS school closures closed 50 neighborhood schools, many in Black neighborhoods while charters expanded.",
    source: "Ewing, Ghosts in the Schoolyard (2018)",
    category: "schools",
    rarity: "uncommon",
    cost: { power: 2, trust: 1 },
    fromYear: 1995,
    toYear: 2020,
    effect: {
      equity: 3,
      heritage: 2,
      growth: -1,
      sustainability: 1,
    },
  },
  {
    id: "exp-afterschool-pipeline-1995",
    name: "Fund a citywide afterschool pipeline",
    flavor: "Three hours of programming. Every afternoon.",
    description:
      "Every K-8 student in the ward gets free, full-time afterschool programming: academic support, sports, arts, mentorship. Enrollment 70%. Three decades later the ward's educational attainment is a full standard deviation above comparable communities.",
    lore:
      "Afterschool programming at scale has strong evidence of effect, especially in high-poverty communities. Chicago's After School Matters (2001, Maggie Daley) reaches 19,000 teens annually. Elementary-level programs include LaSalle Street Network and local park district offerings.",
    source: "After School Matters program evaluations; Chicago Park District reports",
    category: "schools",
    rarity: "common",
    cost: { capital: 3, trust: 1 },
    fromYear: 1990,
    toYear: 2040,
    effect: {
      equity: 4,
      growth: 2,
      heritage: 1,
      sustainability: 1,
    },
  },
];

/* ============================================================== *
 *  Era IV: 2001 to 2040 - Modern Toolkit                          *
 * ============================================================== */

const MODERN_CARDS: Card[] = [
  {
    id: "exp-606-displacement-mitigation",
    name: "Displacement Mitigation Zone along a new trail",
    flavor: "Before the trail opens. Not after.",
    description:
      "Lock down affordability requirements on all new construction along the planned trail before the trail opens. The mitigation measures catch 70% of what The 606 opening did to Humboldt Park. Equity gains; short-run growth is lower.",
    lore:
      "The 606, a 2.7-mile trail opened in 2015, caused immediate gentrification pressure along its length, especially on the west end in Humboldt Park. Post-opening affordability ordinances (2018 Northwest Side, 2020 tear-down moratorium) partially addressed it but were slow.",
    source: "DePaul IHS, Gentrification and the 606 Trail (2019)",
    category: "preservation",
    rarity: "rare",
    cost: { power: 3, knowledge: 2 },
    fromYear: 2010,
    toYear: 2025,
    effect: {
      equity: 5,
      heritage: 3,
      sustainability: 3,
      growth: -1,
    },
    glossary: ["Gentrification", "Displacement"],
  },
  {
    id: "exp-zpt-zoning-points",
    name: "Zoning-points system",
    flavor: "Affordability earns FAR. So does mixed use.",
    description:
      "Replace the use-based zoning grid with a points-based system: developers earn floor-area bonuses by adding affordability, transit proximity, open space, or labor peace agreements. The code rewards the behaviors the city wants.",
    lore:
      "New York's Inclusionary Housing Program and Vancouver's density-bonus system are well-known examples. Chicago's ARO is a simpler, percentage-based inclusionary policy. Points-based systems offer more flexibility but can be gamed if not carefully designed.",
    source: "NYC IHP policy documents; Vancouver CAC policy reviews",
    category: "zoning",
    rarity: "rare",
    cost: { power: 3, knowledge: 3 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      equity: 4,
      sustainability: 3,
      growth: 2,
      heritage: 1,
    },
  },
  {
    id: "exp-open-data-civic-lab",
    name: "Stand up a ward data lab",
    flavor: "Ward as open-source project.",
    description:
      "Partner with a university to stand up a ward-scale open-data lab. Every hearing, every permit, every budget line published in real time. Knowledge climbs; factional secrecy declines; accountability becomes routine.",
    lore:
      "Chicago's Array of Things and the Plenario open-data platform (Argonne and U of Chicago, 2010s) were pioneering civic-data projects. Open-data commitments at the ward level are newer; a few Chicago wards publish granular data on their own.",
    source: "City of Chicago Data Portal; Array of Things reports",
    category: "research",
    rarity: "uncommon",
    cost: { knowledge: 2, capital: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      knowledge: 3,
      trust: 2,
      sustainability: 1,
    },
  },
  {
    id: "exp-heat-island-mitigation",
    name: "Neighborhood heat-island plan",
    flavor: "Trees. Paint. Pumps. Repeat.",
    description:
      "Plant 3,000 street trees, paint 500 dark roofs white, install 40 public cooling fountains, open 5 designated cooling centers. Summer temperatures in the ward drop 3-4°F by 2040. Climate mortality among elders drops proportionally.",
    lore:
      "Chicago's 1995 heat wave killed 739 people disproportionately on the South and West sides. The 2012 Chicago Climate Action Plan set tree-canopy and cool-roof targets. Per-capita tree canopy varies by neighborhood; historically redlined areas have less.",
    source: "Klinenberg, Heat Wave (2002); Chicago Climate Action Plan",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 4 },
    fromYear: 2005,
    toYear: 2040,
    effect: {
      sustainability: 5,
      equity: 3,
      heritage: 1,
      transformParcels: [
        { selector: "all", delta: { condition: 2 } },
      ],
    },
  },
  {
    id: "exp-broadband-as-utility",
    name: "Municipal broadband as a utility",
    flavor: "Fiber to every home. At cost.",
    description:
      "Your ward joins a municipal broadband pilot. Fiber goes into every home at cost; low-income residents qualify for free service. Digital divide closes. Educational outcomes, small business growth, and civic participation all climb.",
    lore:
      "Chattanooga, Tennessee's municipal fiber (2010) is the best-known U.S. example. Chicago has piloted small municipal-fiber projects; the 2022 Illinois Broadband Office is state-level. Digital divide in Chicago is racially patterned.",
    source: "Chattanooga EPB reports; Illinois Broadband Office 2022 plan",
    category: "infrastructure",
    rarity: "rare",
    cost: { capital: 5, power: 2 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      equity: 4,
      growth: 3,
      sustainability: 2,
    },
  },
  {
    id: "exp-participatory-budgeting",
    name: "Participatory budgeting program",
    flavor: "The residents draft the line items.",
    description:
      "Your ward goes full participatory budgeting: residents propose, deliberate, and vote on 80% of ward discretionary spending. Turnout climbs after year three. Trust skyrockets; trade-offs made visible.",
    lore:
      "Participatory budgeting originated in Porto Alegre, Brazil (1989). Chicago's 49th Ward began in 2009, becoming the first in the U.S. A dozen Chicago wards now run PB processes. Scholarship generally finds positive civic effects and mixed fiscal effects.",
    source: "Baiocchi, Militants and Citizens (2005); PB Chicago research reports",
    category: "organizing",
    rarity: "uncommon",
    cost: { knowledge: 2, trust: 1 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      trust: 4,
      equity: 2,
      sustainability: 1,
      heritage: 1,
    },
  },
  {
    id: "exp-right-to-counsel",
    name: "Right-to-counsel in eviction court",
    flavor: "A tenant with a lawyer wins six times out of ten.",
    description:
      "Fund a local right-to-counsel program that provides attorneys to every tenant facing eviction. Eviction rates drop 50%. Children's school changes drop. Pediatric ER visits drop.",
    lore:
      "New York City passed the first U.S. right-to-counsel in 2017; San Francisco, Philadelphia, Cleveland, and other cities have followed. Evaluations show dramatic reductions in eviction judgments and meaningful social-cost savings.",
    source: "NYC Right to Counsel Coalition evaluation; Stout Risius Ross analysis",
    category: "organizing",
    rarity: "rare",
    cost: { capital: 4, power: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      equity: 5,
      heritage: 2,
      trust: 2,
    },
    glossary: ["Displacement"],
  },
  {
    id: "exp-lihtc-scatter-2020",
    name: "LIHTC scatter across the ward",
    flavor: "Small buildings. Everywhere. Low density.",
    description:
      "Six 12-unit LIHTC buildings spread across the ward, not concentrated. Working-class affordability. No tower effect. Neighbors do not notice the difference after year two.",
    lore:
      "Scattered-site LIHTC developments are now a major share of HUD's affordable-housing portfolio. Research by Diamond and McQuade and others shows modest positive spillover effects for surrounding property values, countering common fears.",
    source: "Diamond and McQuade, 'Who Wants Affordable Housing in Their Backyard?' (2019)",
    category: "housing",
    rarity: "uncommon",
    cost: { capital: 4, knowledge: 2 },
    fromYear: 2000,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 2,
      growth: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "random:6", delta: { condition: 8, residents: 6 } },
      ],
    },
    glossary: ["LIHTC", "AffordableHousing"],
  },
  {
    id: "exp-reverse-tif-2028",
    name: "Redirect expired TIF surplus to schools",
    flavor: "When the TIF closes, the money goes home.",
    description:
      "The ward's oldest TIF district expires. Instead of renewing, you return the $40M surplus to CPS and Chicago Parks. Investment where the normal tax base would have directed it anyway. Equity and sustainability rise.",
    lore:
      "Chicago's TIF surplus policy under Mayor Lori Lightfoot and Brandon Johnson has varied. TIFs can be closed early, surplus declared, or extended. The structure of TIF in Chicago has been a perennial reform target.",
    source: "Cook County Clerk TIF Reports; Civic Federation TIF analyses",
    category: "finance",
    rarity: "uncommon",
    cost: { power: 3 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      equity: 4,
      growth: 1,
      sustainability: 2,
      capital: 3,
    },
    glossary: ["TIF"],
  },
  {
    id: "exp-street-safety-vision-zero",
    name: "Vision Zero ward plan",
    flavor: "No traffic deaths. Not a slogan.",
    description:
      "Implement a full Vision Zero plan on every arterial in the ward: curb bump-outs, raised crosswalks, pedestrian-priority signals, 20 mph school zones. Traffic deaths drop to near zero by year five. Equity climbs because deaths concentrated in under-resourced areas.",
    lore:
      "Vision Zero was pioneered in Sweden (1997). Chicago's Vision Zero Action Plan launched 2017 but has been under-resourced. Traffic deaths in Chicago reached a decade high in 2022. Neighborhood-scale Vision Zero is a growing reform model.",
    source: "Chicago Vision Zero Action Plan; NACTO design guides",
    category: "infrastructure",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      sustainability: 3,
      equity: 3,
      heritage: 1,
    },
  },
  {
    id: "exp-climate-adaptation-plan",
    name: "Ward climate-adaptation plan",
    flavor: "Floods, heat, power, air. A plan for each.",
    description:
      "Commission a comprehensive climate-adaptation plan for the ward: flood mitigation, heat response, grid resilience, air-quality hardening. Plan is phased over a decade; first phase is funded within three years. Sustainability climbs dramatically.",
    lore:
      "Chicago's 2022 Climate Action Plan (city-scale) has neighborhood supplements. National Center for Healthy Housing's Climate Ready Neighborhoods framework is a template. Neighborhood-scale plans have been piloted in Bronzeville and Chatham.",
    source: "Chicago Climate Action Plan (2022); Chicago Metropolitan Agency for Planning climate resilience work",
    category: "environment",
    rarity: "rare",
    cost: { capital: 4, knowledge: 3 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      sustainability: 6,
      equity: 3,
      heritage: 1,
      growth: 1,
    },
  },
  {
    id: "exp-baby-bond-local",
    name: "Local baby-bonds program",
    flavor: "Every kid starts with a savings account.",
    description:
      "Every child born in the ward gets a $1,000 account at birth that grows until age 18. Funded by a small property-tax levy. By 2040, an entire cohort has some starting wealth. Generational equity gains compound.",
    lore:
      "William Darity Jr. and A. Kirsten Mullen proposed baby bonds as reparative economic policy. Washington DC and Connecticut have implemented state-level baby-bond programs (2020, 2022). Evaluations are pending but early.",
    source: "Darity and Mullen, From Here to Equality (2020); CT Baby Bonds program",
    category: "finance",
    rarity: "rare",
    cost: { capital: 5, power: 2 },
    fromYear: 2023,
    toYear: 2040,
    effect: {
      equity: 6,
      growth: 2,
      heritage: 2,
      sustainability: 1,
    },
  },
  {
    id: "exp-violence-interrupters-cred",
    name: "Fund CRED-model violence interrupters",
    flavor: "A network. A call tree. No police.",
    description:
      "The ward funds a CRED-model violence interrupter network that operates independent of CPD. Street-level mediators prevent shootings, respond to conflicts, and maintain neighborhood peace. Homicide rate drops 40% in three years.",
    lore:
      "CRED (Creating Real Economic Destiny, founded 2017 by Arne Duncan) and Cure Violence (founded 2000 at UIC) are Chicago-based violence-interruption programs. Peer-reviewed evaluations (Skogan et al. 2008, others) show significant reductions when programs are adequately funded and sustained.",
    source: "Skogan et al., Evaluation of CeaseFire-Chicago (2008)",
    category: "organizing",
    rarity: "rare",
    cost: { capital: 4, trust: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      equity: 5,
      heritage: 3,
      trust: 3,
    },
  },
  {
    id: "exp-renewable-cooperative",
    name: "Neighborhood energy cooperative",
    flavor: "Roofs as solar. Residents as shareholders.",
    description:
      "Form an energy cooperative that installs solar on 500 ward rooftops, owned cooperatively by residents. Member residents see 30% lower electric bills. Sustainability and equity climb. ComEd resistance is real but loses.",
    lore:
      "Blacks in Green (BIG), founded by Naomi Davis in Chicago, pioneered the 'Sustainable Square Mile' concept. State-level Illinois Solar for All program funds similar projects. Rooftop cooperatives in Bronzeville and Englewood have scaled slowly.",
    source: "Blacks in Green program materials; Illinois Solar for All reports",
    category: "environment",
    rarity: "uncommon",
    cost: { capital: 4, knowledge: 2 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      sustainability: 5,
      equity: 4,
      growth: 1,
    },
  },
  {
    id: "exp-immigration-sanctuary-2017",
    name: "Codify sanctuary status in ward services",
    flavor: "Every service. No questions about status.",
    description:
      "Your ward codifies sanctuary in every service office: health clinics, schools, police, permits. ICE is barred from ward property. Equity climbs; federal disfavor costs you some capital in years with hostile administrations.",
    lore:
      "Chicago's Welcoming City Ordinance (1985, strengthened 2006 and 2012) is one of the nation's strongest sanctuary policies. Ward-level sanctuary practices extend the ordinance in specific neighborhood service offices.",
    source: "Chicago Welcoming City Ordinance; MALDEF sanctuary-city policy analyses",
    category: "organizing",
    rarity: "uncommon",
    cost: { power: 2, trust: 1 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 2,
      trust: 2,
      capital: -1,
    },
  },
  {
    id: "exp-reparations-evanston-model",
    name: "Local reparations ordinance",
    flavor: "Evanston went first. You can follow.",
    description:
      "Pass a ward-scale reparations ordinance based on the Evanston (2019) model: cannabis tax revenue funds direct housing grants to descendants of redlining-era families. Modest in dollar scale; profound in symbolic scale; effective in actual parcels affected.",
    lore:
      "Evanston passed a municipal reparations resolution in 2019 and began disbursements in 2021. Chicago has not passed equivalent policy but several aldermanic initiatives have been proposed. The cannabis-tax linkage has been copied by several cities.",
    source: "Evanston Restorative Housing Program records",
    category: "finance",
    rarity: "rare",
    cost: { capital: 3, power: 3 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      equity: 6,
      heritage: 3,
      trust: 2,
      transformParcels: [
        { selector: "holc:D", delta: { value: 3, condition: 3, memory: 6 } },
      ],
    },
  },
  {
    id: "exp-guaranteed-income-pilot",
    name: "Ward guaranteed-income pilot",
    flavor: "Five hundred residents. Five hundred dollars a month.",
    description:
      "A 500-family, 3-year guaranteed-income pilot in the ward. At pilot's end, participating families report higher employment, better housing stability, and better child health. Program becomes permanent. Equity and sustainability rise.",
    lore:
      "Stockton's SEED program (2019, Mayor Michael Tubbs) was the U.S. pioneer. Chicago's Resilient Communities Pilot (2022) followed. Evaluation results have generally been positive on mental health, employment, and stability outcomes.",
    source: "Stockton SEED evaluation; Chicago Resilient Communities Pilot reports",
    category: "finance",
    rarity: "rare",
    cost: { capital: 5, knowledge: 2 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      equity: 5,
      heritage: 1,
      growth: 2,
      sustainability: 2,
    },
  },
  {
    id: "exp-cultural-asset-inventory",
    name: "Cultural-asset inventory and protection",
    flavor: "Every storefront. Every mural. Every landmark.",
    description:
      "Fund a comprehensive inventory of every culturally-significant storefront, mural, church, and gathering place in the ward. Three dozen get landmarked. Several get covenanted affordability for arts tenants. Heritage climbs dramatically.",
    lore:
      "Chicago's Cultural Plan (2012) called for neighborhood cultural-asset inventories. A few wards have conducted them (19th Ward, 25th Ward Pilsen). The National Trust's ReUrbanism program provides templates.",
    source: "Chicago Cultural Plan (2012); National Trust ReUrbanism program",
    category: "preservation",
    rarity: "uncommon",
    cost: { knowledge: 2, capital: 2 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      heritage: 5,
      equity: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "type:commercial", delta: { memory: 8 } },
        { selector: "type:mural", delta: { memory: 8 } },
        { selector: "type:church", delta: { memory: 6 } },
      ],
    },
  },
  {
    id: "exp-ward-wellness-clinic",
    name: "Open a no-cost wellness clinic",
    flavor: "Preventive care. Walk in. Sliding scale.",
    description:
      "Open a ward-scale no-cost wellness clinic with preventive primary care, mental health, and dental. Partner with a safety-net hospital. Emergency-room visits for common complaints fall 40%. Equity and sustainability climb.",
    lore:
      "Cook County Hospital (now Stroger) and community health centers like Howard Brown, Esperanza, and Lawndale Christian Health Center provide sliding-scale care. Expansion of federally qualified health centers under the ACA dramatically increased access.",
    source: "HRSA FQHC program reports; Lawndale Christian Health Center records",
    category: "schools",
    rarity: "uncommon",
    cost: { capital: 3, trust: 1 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 1,
      sustainability: 2,
      transformParcels: [
        { selector: "first-vacant", set: { type: "clinic", owner: "city" }, delta: { condition: 12 } },
      ],
    },
  },
  {
    id: "exp-land-bank-auction",
    name: "Community-controlled land-bank auction",
    flavor: "Nonprofits have first bid.",
    description:
      "Restructure the ward's land-bank auction so that nonprofit land trusts and tenant cooperatives get 30 days of exclusive bidding before market investors. Parcels flow into community stewardship at a 5x rate.",
    lore:
      "Detroit's 'community-first' land bank rules (2017) demonstrated this model works. Cook County Land Bank Authority (2013) has piloted similar elements. Community-controlled auction is a known best practice.",
    source: "Cook County Land Bank Authority records; Detroit Land Bank CFP evaluations",
    category: "finance",
    rarity: "uncommon",
    cost: { power: 2, knowledge: 1 },
    fromYear: 2015,
    toYear: 2040,
    effect: {
      equity: 4,
      heritage: 2,
      sustainability: 1,
      transformParcels: [
        { selector: "type:vacant", set: { owner: "land-trust" } },
      ],
    },
    glossary: ["CommunityLandTrust"],
  },
  {
    id: "exp-rle-station-affordability",
    name: "Pre-station affordability lock-in",
    flavor: "The station is in. The rents are locked.",
    description:
      "Before the Red Line Extension station opens in your ward, lock affordability covenants on all rental buildings within a half mile. 2,500 units. Rents hold to 60% AMI. Displacement pressure vastly reduced; some developer capital leaves.",
    lore:
      "The Red Line Extension ($5.75B, FTA 2024 FFGA) is projected to raise land values within a half-mile radius by 40% within two years. Pre-station affordability covenants are a standard best practice. Chicago's 2023 TOD+ ordinance has some components.",
    source: "FTA RLE EIS; Chicago TOD+ Ordinance (2023)",
    category: "preservation",
    rarity: "rare",
    cost: { power: 4, capital: 2, knowledge: 2 },
    fromYear: 2025,
    toYear: 2040,
    effect: {
      equity: 6,
      heritage: 2,
      sustainability: 2,
      growth: -1,
      setFlag: "rle-affordability-locked",
    },
    glossary: ["RedLineExtension", "Displacement"],
  },
  {
    id: "exp-good-cause-eviction",
    name: "Pass good-cause eviction protection",
    flavor: "The landlord must have a reason.",
    description:
      "Good-cause eviction ordinance: landlords must show cause to refuse lease renewal; rent hikes above an inflation threshold require justification. Evictions drop sharply; rent increases moderate.",
    lore:
      "New York passed a statewide good-cause eviction law in 2024. Several Illinois municipalities have considered but not adopted local versions. Chicago's renter protections are patchwork. Good-cause is a nationally-debated but increasingly common tenant protection.",
    source: "NY Good Cause Eviction Law (2024); National Low Income Housing Coalition analyses",
    category: "organizing",
    rarity: "rare",
    cost: { power: 3, trust: 2 },
    fromYear: 2020,
    toYear: 2040,
    effect: {
      equity: 5,
      heritage: 2,
      sustainability: 1,
      growth: -1,
    },
  },
  {
    id: "exp-social-housing-project",
    name: "First social-housing development",
    flavor: "Publicly owned. Mixed-income. Permanent.",
    description:
      "Build the first social-housing project in the ward: publicly owned, mixed-income, permanently off the market. 200 units. Model spreads to three other wards within a decade.",
    lore:
      "Vienna's social housing (1920s-present) houses 60% of the city. Seattle (2023 I-135) created a Social Housing Developer. Montgomery County MD pioneered a U.S. municipal social housing program. Social housing is gaining as a model.",
    source: "Vienna Social Housing records; Montgomery County Housing Production Fund",
    category: "housing",
    rarity: "rare",
    cost: { capital: 5, power: 3 },
    fromYear: 2023,
    toYear: 2040,
    effect: {
      equity: 5,
      heritage: 2,
      growth: 3,
      sustainability: 3,
      transformParcels: [
        { selector: "first-vacant", set: { type: "courtyard", owner: "city", protected: true }, delta: { residents: 30, condition: 20 } },
      ],
    },
    glossary: ["AffordableHousing"],
  },
  {
    id: "exp-library-as-third-place",
    name: "Expand the library branch as third place",
    flavor: "Not just books. Workshops, daycare, printers.",
    description:
      "Triple the library branch's program footprint: daycare, makerspace, workforce computing, meeting rooms, daytime social services. The library becomes the ward's most-used civic infrastructure. Heritage and equity climb.",
    lore:
      "Chicago's 2019 'Little Village and Independence' libraries were prototypes for library-as-third-place design. The Chicago Public Library's Innovation Lab at Harold Washington is another. Libraries nationwide have expanded services dramatically since 2000.",
    source: "Chicago Public Library strategic plans; Klinenberg, Palaces for the People (2018)",
    category: "culture",
    rarity: "uncommon",
    cost: { capital: 3, knowledge: 1 },
    fromYear: 2010,
    toYear: 2040,
    effect: {
      heritage: 3,
      equity: 3,
      sustainability: 2,
      growth: 1,
      knowledge: 2,
      transformParcels: [
        { selector: "type:library", delta: { condition: 15 } },
      ],
    },
  },
];

/* ============================================================== *
 *  Bonus role-locked cards                                        *
 * ============================================================== */

const ROLE_SIGNATURE_CARDS: Card[] = [
  {
    id: "exp-preacher-sermon-press",
    name: "Commission a press conference sermon",
    flavor: "Pulpit and press corps. One afternoon.",
    description:
      "You deliver a policy sermon with the press corps in attendance. The story reaches citywide. Your Trust score gains; your Power is spent but renewed through the coverage.",
    lore:
      "Rev. Jesse Jackson's weekly Saturday meetings at Operation PUSH headquarters on South Drexel reliably generated citywide coverage from 1971 onward. Rev. Michael Pfleger at St. Sabina has done similar work for anti-violence and housing campaigns.",
    source: "Operation PUSH records; St. Sabina Faith Community records",
    category: "culture",
    rarity: "common",
    cost: { trust: 1 },
    fromYear: 1960,
    toYear: 2040,
    onlyRoles: ["preacher"],
    effect: {
      trust: 3,
      heritage: 2,
      power: 1,
    },
  },
  {
    id: "exp-developer-joint-venture",
    name: "Joint-venture with an affordable builder",
    flavor: "Profit. Capped. By choice.",
    description:
      "Your developer firm joint-ventures with a nonprofit affordable builder on a 50-unit project. Profit is capped at a reasonable return. Your firm keeps the income stream; the community gets deeper affordability. Reputation recovers.",
    lore:
      "Chicago developers including Related Midwest, Preservation of Affordable Housing, and Mercy Housing Lakefront have pioneered public-private partnerships. Joint ventures with cap-on-profit structures are a growing tool in affordable production.",
    source: "LISC Chicago case studies; Preservation of Affordable Housing records",
    category: "housing",
    rarity: "rare",
    cost: { capital: 4 },
    fromYear: 1995,
    toYear: 2040,
    onlyRoles: ["developer"],
    effect: {
      growth: 3,
      equity: 3,
      trust: 2,
      transformParcels: [
        { selector: "first-vacant", set: { type: "courtyard", owner: "developer" }, delta: { residents: 25, condition: 12 } },
      ],
    },
    glossary: ["AffordableHousing"],
  },
  {
    id: "exp-journalist-freedom-of-information-marathon",
    name: "FOIA marathon",
    flavor: "Every agency. Every document. Every week.",
    description:
      "Your paper runs a year-long FOIA marathon: 500 records requests across every agency touching the ward. Coverage of hidden deals floods the paper. The machine wobbles; some reforms pass; trust in the institution goes up.",
    lore:
      "Chicago Sun-Times and Chicago Tribune investigative work dating to the 1970s produced landmark reforms. The Better Government Association's records work has shaped a generation of ordinances. FOIA patience is its own discipline.",
    source: "Better Government Association records; Chicago Tribune investigative archives",
    category: "research",
    rarity: "uncommon",
    cost: { knowledge: 1 },
    fromYear: 1975,
    toYear: 2040,
    onlyRoles: ["journalist"],
    effect: {
      knowledge: 3,
      equity: 2,
      trust: 2,
    },
  },
  {
    id: "exp-scholar-impact-paper",
    name: "Release an impact-evaluation paper",
    flavor: "Peer-reviewed. Cited. Hard to dismiss.",
    description:
      "You publish a peer-reviewed evaluation of a ward-scale intervention in a top-tier journal. The paper becomes the national reference. Future funding arrives on the strength of the evidence base.",
    lore:
      "University of Chicago Crime Lab, Chicago Booth, and UChicago Urban Labs have produced evaluations that drove national policy. Jens Ludwig's work on gun violence, Sue Dynarski's on education, and Jonathan Guryan's on youth employment are examples.",
    source: "UChicago Urban Labs publications",
    category: "research",
    rarity: "uncommon",
    cost: { knowledge: 2 },
    fromYear: 1980,
    toYear: 2040,
    onlyRoles: ["scholar"],
    effect: {
      knowledge: 3,
      equity: 2,
      sustainability: 2,
      capital: 2,
    },
  },
  {
    id: "exp-organizer-strike-wave",
    name: "Coordinate a citywide strike wave",
    flavor: "Six unions. One contract season. One message.",
    description:
      "You coordinate contract timing across six ward-based unions: teachers, janitors, hotel workers, hospital workers, city laborers, and SEIU home-care. The wave wins historic contracts. Organizing infrastructure matures.",
    lore:
      "Chicago's Fight for 15 (2012), the 2012 and 2019 CTU strikes, and the 2018 hotel workers' strike were high points of recent organizing. Pay-linked coordination across unions is a deliberate strategy sometimes called 'bargaining for the common good.'",
    source: "In These Times coverage of Chicago labor organizing; Center for Popular Democracy reports",
    category: "organizing",
    rarity: "rare",
    cost: { trust: 3, power: 2 },
    fromYear: 2000,
    toYear: 2040,
    onlyRoles: ["organizer"],
    effect: {
      equity: 5,
      trust: 3,
      growth: 1,
      power: 1,
    },
  },
  {
    id: "exp-alderman-ordinance-omnibus",
    name: "Pass the omnibus tenant ordinance",
    flavor: "Six protections. One vote.",
    description:
      "You draft and pass an omnibus tenant-protection ordinance combining six bills: just-cause eviction, security-deposit cap, retaliation protection, rent-increase notice, ADU legalization, and relocation assistance. Equity and trust both climb substantially.",
    lore:
      "Chicago's Residential Landlord and Tenant Ordinance (1986) is one of the nation's strongest. The 2020 COVID-era tenant protection amendments further strengthened it. Omnibus bills are how landmark tenant-protection laws tend to move.",
    source: "Chicago RLTO legislative history",
    category: "organizing",
    rarity: "rare",
    cost: { power: 4 },
    fromYear: 1985,
    toYear: 2040,
    onlyRoles: ["alderman"],
    effect: {
      equity: 5,
      trust: 3,
      heritage: 1,
      sustainability: 1,
    },
  },
];

/* ============================================================== *
 *  Export: merge everything                                       *
 * ============================================================== */

export const EXPANSION_CARDS: Card[] = [
  ...DEPRESSION_POSTWAR_CARDS,
  ...URBAN_RENEWAL_CARDS,
  ...DISINVESTMENT_CARDS,
  ...MODERN_CARDS,
  ...ROLE_SIGNATURE_CARDS,
];
