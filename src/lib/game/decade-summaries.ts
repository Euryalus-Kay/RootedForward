/**
 * Decade summaries. Historical flavor text shown at the top of each
 * new decade (every 10 years). Each entry gives the player a sense of
 * the national and local context for the upcoming decade.
 *
 * These are informational overlays; they do not affect game mechanics.
 */

export interface DecadeSummary {
  startYear: number;
  endYear: number;
  title: string;
  subtitle: string;
  national: string;
  chicago: string;
  parkhaven: string;
  watchFor: string[];
  era: "depression" | "postwar" | "renewal" | "modern";
}

export const DECADE_SUMMARIES: DecadeSummary[] = [
  {
    startYear: 1940,
    endYear: 1949,
    title: "1940s — Great Migration and Great War",
    subtitle: "The HOLC map is dry. The Illinois Central keeps arriving.",
    national:
      "FDR is in his third term. The Depression is easing, war is coming. The Federal Housing Administration is insuring mortgages for white veterans and refusing them for Black ones. The Pearl Harbor attack comes December 7, 1941; the war lasts until 1945. The GI Bill (1944) arrives; so does the 1948 Shelley v. Kraemer ruling that makes racial covenants unenforceable in court.",
    chicago:
      "Chicago's Black population is 280,000 in 1940 and will be 500,000 by 1950. The Dan Ryan Expressway and the high-rise public housing tower era are both five to ten years away. Elizabeth Wood runs CHA and is building integrated low-rise developments. Richard J. Daley is a state senator; he will not be mayor until 1955.",
    parkhaven:
      "Parkhaven's 70 parcels reflect 1940 Chicago. HOLC grades are locked in. Your central blocks are mixed. Your southern blocks are mostly D-rated. Covenants restrict much of your northern blocks. Every decision you make will echo for eighty years.",
    watchFor: [
      "HOLC redlining is the starting condition; you did not create it, but you inherit its consequences",
      "FHA insurance follows HOLC grades; without it, there is no long-term lending in the D zones",
      "Covenants restrict the north blocks until 1948 and informally much longer",
      "CHA under Elizabeth Wood is still capable of low-rise, integrated decisions",
    ],
    era: "depression",
  },
  {
    startYear: 1950,
    endYear: 1959,
    title: "1950s — Contracts and Covenants",
    subtitle: "Shelley v. Kraemer is on paper. The contract sellers are real.",
    national:
      "Eisenhower presides. The Korean War ends in 1953. Brown v. Board (1954) orders school desegregation 'with all deliberate speed,' which Chicago School Superintendent Ben Willis interprets as 'very deliberate.' The Federal-Aid Highway Act (1956) funds 41,000 miles of interstate, much of it cut through urban centers.",
    chicago:
      "Daley is elected mayor in 1955 and will serve until 1976. Urban renewal is demolishing Black neighborhoods across the South and West Sides. The Illinois Institute of Technology demolishes the Mecca Flats to build Crown Hall. Cabrini-Green's first high-rise (Extension) opens in 1958. Contract sellers are extracting $3-4 billion in wealth from Black Chicago.",
    parkhaven:
      "Your ward's blocks are churning. Black families are moving in via contract sale; white families are moving out via FHA-backed suburban mortgages. Speculators are circling. The first CHA siting proposals will arrive. Your decisions about housing and siting this decade will shape the tower era.",
    watchFor: [
      "Contract sales are stripping wealth from Black families at scale — support the Contract Buyers League if the chance arises",
      "CHA siting decisions taken in this decade determine the 1960s tower era",
      "Expressway routing decisions begin; federal money is on the line",
      "Brown v. Board creates space for school-boundary redraw fights",
    ],
    era: "postwar",
  },
  {
    startYear: 1960,
    endYear: 1969,
    title: "1960s — The Decade That Changes",
    subtitle: "King comes north. Hampton rises. Daley rules.",
    national:
      "Kennedy, then Johnson, then Nixon. The Civil Rights Act (1964), the Voting Rights Act (1965), and the Fair Housing Act (1968) reshape the legal landscape. Vietnam escalates. Dr. King is assassinated April 4, 1968; Robert Kennedy two months later. The cities burn; the federal War on Poverty both helps and hollows.",
    chicago:
      "Daley's mayoral grip tightens. The Dan Ryan opens in 1962. Robert Taylor Homes, 28 identical 16-story buildings along State Street, open in 1961-1962. The Chicago Freedom Movement arrives in January 1966; King is hit with a rock in Marquette Park in August. The Summit Agreement is signed, then ignored. The 1968 DNC becomes a 'police riot.' Fred Hampton is killed December 4, 1969.",
    parkhaven:
      "Your decade. The long drift of earlier decisions is now compounding: towers or not, expressway or not, contract buyers or not. The civil-rights coalition is organizing in your ward. Choose carefully which movements to support and which to keep distance from; both carry costs.",
    watchFor: [
      "Every tower built in this decade will be a problem by 1990",
      "The Summit Agreement is the best chance to get fair-housing enforcement on paper",
      "The Gautreaux lawsuit filed in 1966 will not decide until 1976; the work is in the 1960s",
      "Fred Hampton's Rainbow Coalition (1969) is a unique organizing moment — short-lived",
    ],
    era: "postwar",
  },
  {
    startYear: 1970,
    endYear: 1979,
    title: "1970s — Disinvestment Begins",
    subtitle: "White flight peaks. Deindustrialization arrives. HUD underfunds.",
    national:
      "Nixon through Ford through Carter. The 1973 oil shock. The 1974 Community Development Block Grant program consolidates urban aid. Hills v. Gautreaux (1976) orders CHA to desegregate by inter-county relocation; CHA resists. The 1977 Community Reinvestment Act creates leverage against redlining. The Chicago School's economic thinking takes hold nationally.",
    chicago:
      "The Union Stock Yards close in 1971. Richard J. Daley dies in office in 1976; Bilandic and Byrne follow. Blockbusting hits the West Side hard. The Chicago School of neoliberal economics gains influence. The first Chicago TIF will arrive in 1984 but the policy groundwork is being laid now.",
    parkhaven:
      "Your ward is in the hollow middle of the century. The 1968 uprising's damage is uneven. Federal money is pulling back. Manufacturing jobs are leaving. Community organizing is mature but under-resourced. Preservation overlays are becoming available; land trusts are being chartered.",
    watchFor: [
      "CRA (1977) gives you enforcement leverage against bank redlining",
      "Landmark designations start protecting buildings in earnest",
      "Scattered-site CHA under Gautreaux begins — fight for it in your ward",
      "Land banking and early CLTs are new tools you can reach for",
    ],
    era: "renewal",
  },
  {
    startYear: 1980,
    endYear: 1989,
    title: "1980s — Reagan and Resistance",
    subtitle: "Federal housing budget halved. Harold Washington elected.",
    national:
      "Reagan. Section 8 expansion substituting for new public-housing production. Federal housing budget cut by over 50%. The AIDS crisis hits cities. The 1986 Immigration Reform and Control Act legalizes 2.7M people. The 1986 Tax Reform Act creates LIHTC, the current primary affordable-housing finance tool.",
    chicago:
      "Harold Washington is elected in 1983; he is the first Black mayor. Council Wars (1983-1986) blocks much of his agenda. Washington dies in office November 25, 1987. Eugene Sawyer is elected acting mayor. The 1989 special election is won by Richard M. Daley. The Chicago Residential Landlord and Tenant Ordinance (RLTO) passes in 1986.",
    parkhaven:
      "Your ward's politics change if you had been building toward it. Washington's transition council can direct resources your way. Council Wars is a rough decade for the coalition. The infrastructure you pre-built matters hugely now. SRO losses are accelerating; preservation ordinances are a tool.",
    watchFor: [
      "Pre-built precinct organization pays off dramatically this decade",
      "LIHTC is new — use it as a scattered-site tool, not a concentration tool",
      "SRO preservation is your homelessness-prevention lever",
      "The CRA work from the 1970s starts delivering visible results",
    ],
    era: "renewal",
  },
  {
    startYear: 1990,
    endYear: 1999,
    title: "1990s — Transformation",
    subtitle: "CHA towers come down. HOPE VI arrives. Global warming enters policy.",
    national:
      "Clinton. HOPE VI (1992). The 1994 Crime Bill. The 1996 welfare reform. The 1998 merger of HMOs. The internet reaches neighborhoods. The Kyoto Protocol (1997) starts the long climate-policy struggle. The Plan for Transformation (1999) launches in Chicago.",
    chicago:
      "The 1995 heat wave kills 739 Chicagoans over five days. The first CHA towers come down. Demolition rolls through the 1990s. Richard M. Daley expands. Neighborhood-level disinvestment continues; by 2000 several West Side and South Side blocks are more than 30% vacant. The 1999 Plan for Transformation commits to 25,000 units of 1:1 replacement.",
    parkhaven:
      "Your ward's towers (if you built any) are condemned. Your decision: demolish or rehab. The 1995 heat wave is a decisive test of your ward's social infrastructure. The dot-com boom barely touches your ward. Foreclosure prevention infrastructure is worth pre-building now for the 2008 crisis.",
    watchFor: [
      "The 1995 heat wave tests everything you've built into the ward's social infrastructure",
      "Demolish vs. rehab is the decade's biggest choice",
      "Foreclosure prevention offices built now will matter by 2008",
      "HOPE VI replacement commitments need fierce defense to actually deliver",
    ],
    era: "renewal",
  },
  {
    startYear: 2000,
    endYear: 2009,
    title: "2000s — The Road to the Crash",
    subtitle: "Millennium Park, then subprime, then foreclosure at scale.",
    national:
      "Bush through Obama's first year. The 2001 recession, then the 2004-2007 subprime boom, then the 2008 crash. Massive fiscal stimulus (ARRA 2009). The Affordable Care Act is signed in 2010. Iraq and Afghanistan wars. The 2005 Kelo ruling expands eminent-domain use.",
    chicago:
      "Millennium Park opens in 2004. Daley wins the 2016 Olympics bid (and then loses it to Rio). The 2008 crisis devastates the South and West sides. Chicago's 2006 Community Land Trust is launched. Plan for Transformation demolitions continue. The 2005-2006 condo boom is concentrated in gentrifying neighborhoods.",
    parkhaven:
      "Your ward's foreclosure filings spike in 2008 and 2009. Speculators are buying up vacancies. Your land bank infrastructure, if you built one, activates. The 2006 CLT is available for you to hand parcels to. Post-2008 recovery is uneven.",
    watchFor: [
      "Pre-2008 foreclosure prevention office is a huge advantage",
      "Land bank and CLT handoffs keep parcels out of speculator hands",
      "Green infrastructure becomes broadly funded mid-decade",
      "Obama's 2015 AFFH rule (coming) makes fair-housing enforcement real",
    ],
    era: "modern",
  },
  {
    startYear: 2010,
    endYear: 2019,
    title: "2010s — Transit, Trails, Tear-Downs",
    subtitle: "The 606 opens. Emanuel closes 50 schools. CTU strikes. Divvy arrives.",
    national:
      "Obama second term through Trump. Affordable Care Act implementation. Marriage equality (2015). The 2015 Supreme Court disparate-impact ruling for housing. The 2017 tax law caps SALT. Black Lives Matter emerges. Climate policy fights continue.",
    chicago:
      "The 606 opens in 2015 and causes immediate gentrification in Humboldt Park. Rahm Emanuel is mayor 2011-2019; he closes 50 neighborhood schools in 2013. The Laquan McDonald video suppression and aftermath. CTU strikes in 2012 and 2019. Lori Lightfoot elected in 2019. The 2021 ARO rewrite is the decade's largest affordable-housing reform.",
    parkhaven:
      "Your ward's gentrification pressure intensifies. Rents rise faster than wages. If transit or trail investment is planned, pre-lock affordability covenants before openings. Data-driven displacement-warning systems are becoming available. Community ownership models are scaling.",
    watchFor: [
      "Pre-opening affordability covenants on transit and trails are decisive",
      "Data-driven displacement-warning tools emerge mid-decade",
      "TOD upzoning without affordability can backfire hard",
      "Chicago's 2021 ARO is a major tool for on-site affordability",
    ],
    era: "modern",
  },
  {
    startYear: 2020,
    endYear: 2029,
    title: "2020s — Pandemic and Pivot",
    subtitle: "COVID. Police reform. Climate intensifies. The migrant buses arrive.",
    national:
      "Trump first term's end, COVID-19 (2020-2022), Biden administration, return of Trump in 2024. Inflation (2022-2024). The 2024 election. AI data-center siting wars. The 2035 ICE vehicle ban looms. Federal infrastructure spending.",
    chicago:
      "COVID deaths disproportionately Black and Latino. 2020 George Floyd protests. Brandon Johnson elected 2023 on police-reform and CTU-backed platform. Bring Chicago Home referendum fails 2024. Venezuelan migrant crisis (2022-2024). Red Line Extension funded 2024, construction begins 2025, target revenue 2030. The 2024 NASCAR race. The 2022 Loretta Lynn Mansion Tax fight.",
    parkhaven:
      "Your ward's equity infrastructure is tested by COVID, then by the migrant crisis, then by the RLE construction. Climate-adaptation plans become standard. Guaranteed-income pilots, reparations ordinances, baby bonds — all become locally available tools. Violence-interruption programs mature.",
    watchFor: [
      "Pandemic response in 2020-2022 is a key test of ward infrastructure",
      "RLE construction (2025-2030) is the decade's largest displacement risk",
      "Climate adaptation spending scales up; seize federal dollars",
      "Baby bonds and reparations are new local tools",
    ],
    era: "modern",
  },
  {
    startYear: 2030,
    endYear: 2040,
    title: "2030s — Adaptation",
    subtitle: "The decade when climate moves from foresight to fact.",
    national:
      "The 2035 ICE vehicle phase-out. Interstate data-center conflicts. Adaptation funding scales. Coastal retreat in some cities. The 2036 election. AI transforms governance with uneven results.",
    chicago:
      "The Red Line Extension is in revenue service by 2030. Data centers want 20-acre siting. Autonomous freight corridors proposed. Flood events become routine. Managed retreat is a live policy option for lakefront and canal-adjacent blocks. The 2036 election likely transforms state and local politics.",
    parkhaven:
      "The last decade of the run. The legacy you hand off is largely already written — the infrastructure you've built, the lasting effects you've accumulated. Your remaining choices are about adaptation, transition, and the final shape of the archetype that will describe you.",
    watchFor: [
      "Climate adaptation is baseline-cost now; green infrastructure is not optional",
      "Data-center siting is the decade's classic big-employer trade-off",
      "EV transitions require deliberate labor-force protection",
      "The archetype that emerges is mostly already written; the last decade is refinement",
    ],
    era: "modern",
  },
];

export function decadeSummaryForYear(year: number): DecadeSummary | null {
  for (const d of DECADE_SUMMARIES) {
    if (year >= d.startYear && year <= d.endYear) return d;
  }
  return null;
}
