/**
 * Codex. The narrative reference the player can browse mid-game.
 *
 * The codex is a background read. It collects biographies, institution
 * histories, and event write-ups that the cards and events reference.
 * Reading a codex entry doesn't affect play, but it supplies the
 * context that makes the decision structure legible.
 *
 * The codex is organized by category and is structured to support a
 * simple table-of-contents + detail-view UI (see components/game/Codex.tsx).
 */

export type CodexCategory =
  | "people"
  | "institutions"
  | "neighborhoods"
  | "policies"
  | "events"
  | "concepts";

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  title: string;
  /** One-line teaser shown in the table of contents */
  teaser: string;
  /** Full markdown-flavored body */
  body: string;
  /** Related codex entries by id */
  related?: string[];
  /** Real source for the referenced material */
  source?: string;
  /** Eras when this entry is most relevant */
  era?: "1940s" | "1950s" | "1960s" | "1970s" | "1980s" | "1990s" | "2000s" | "2010s" | "2020s" | "2030s";
}

export const CODEX: CodexEntry[] = [
  /* ---------- People ---------- */
  {
    id: "person-ida-b-wells",
    category: "people",
    title: "Ida B. Wells-Barnett",
    teaser: "Anti-lynching journalist. Chicago organizer. Grandmother of modern investigative reporting.",
    body:
      "Ida B. Wells-Barnett (1862-1931) was one of the founders of the NAACP, a pioneering investigative journalist, and a Chicago organizer who led integration fights at Chicago hotels and public spaces. Her Red Record (1895) statistically documented lynching in a way the national press could not ignore. She lived at 3624 S. Martin Luther King Dr. in Bronzeville from 1919 until her death in 1931; the house is now a National Historic Landmark. Her organizing template — pair investigative documentation with public pressure — runs through the whole civil rights movement.",
    source: "Giddings, Ida: A Sword Among Lions (2008)",
    era: "1940s",
  },
  {
    id: "person-harold-washington",
    category: "people",
    title: "Harold Washington",
    teaser: "Chicago's first Black mayor, 1983-1987. Reshaped the city before dying in office.",
    body:
      "Harold Washington (1922-1987) served in the Illinois House, Illinois Senate, and U.S. House before winning the 1983 Democratic primary over Mayor Jane Byrne and Richard M. Daley. His mayoral coalition — Black, Latino, and white progressives — redirected city spending toward neighborhoods. Council Wars (1983-1986) blocked much of his agenda; the 1986 special-election win flipped a seat and freed him briefly before his November 1987 death in office. His tenure changed Chicago's political arithmetic permanently. Brandon Johnson's 2023 coalition consciously referenced Washington's.",
    source: "Rivlin, Fire on the Prairie (1992)",
    era: "1980s",
  },
  {
    id: "person-fred-hampton",
    category: "people",
    title: "Fred Hampton",
    teaser: "21-year-old chairman of the Illinois Black Panther Party. Killed by police December 4, 1969.",
    body:
      "Fred Hampton (1948-1969) was the chairman of the Illinois Black Panther Party. He founded Chicago's Rainbow Coalition (reused later by Jesse Jackson), uniting the Panthers with the Young Lords and Young Patriots across race. Chicago police, under Cook County State's Attorney Edward Hanrahan, killed him in a pre-dawn raid on December 4, 1969 at 2337 W. Monroe. FBI COINTELPRO supplied the apartment floor plan. Forensic evidence showed police fired 90+ shots; the Panthers fired perhaps one. Hanrahan lost re-election in 1972. Hampton's body was buried in a closed-casket ceremony; his son, Fred Hampton Jr., was born three weeks after his killing.",
    source: "Haas, The Assassination of Fred Hampton (2010)",
    era: "1960s",
  },
  {
    id: "person-gwendolyn-brooks",
    category: "people",
    title: "Gwendolyn Brooks",
    teaser: "Poet laureate of Bronzeville. First Black Pulitzer winner (1950).",
    body:
      "Gwendolyn Brooks (1917-2000) was poet laureate of Illinois from 1968 to 2000 and the first Black American to win the Pulitzer Prize in Literature (Annie Allen, 1949, awarded 1950). Her book In the Mecca (1968) is a long-form poem about the last decade of the Mecca Flats apartment hotel, demolished 1952 by IIT to clear ground for Crown Hall. She lived most of her life in Bronzeville. Her poetry reads as a running documentary of twentieth-century Black Chicago.",
    source: "Kent, A Life of Gwendolyn Brooks (1990)",
    era: "1940s",
  },
  {
    id: "person-saul-alinsky",
    category: "people",
    title: "Saul Alinsky",
    teaser: "Founder of the Industrial Areas Foundation. Wrote the book on broad-based organizing.",
    body:
      "Saul Alinsky (1909-1972) was a Chicago-born organizer who founded the Industrial Areas Foundation in 1940 starting with Back of the Yards. Alinsky's model coupled unions, churches, and neighborhood associations into broad-based coalitions with trained leaders and collective power. His books Reveille for Radicals (1946) and Rules for Radicals (1971) became the central texts of community organizing. IAF now operates globally. Barack Obama trained in an Alinsky-lineage model; so did Hillary Clinton.",
    source: "Horwitt, Let Them Call Me Rebel (1989)",
  },
  {
    id: "person-elizabeth-wood",
    category: "people",
    title: "Elizabeth Wood",
    teaser: "First CHA executive director. Lost her job in 1954 over integration and low-rise design.",
    body:
      "Elizabeth Wood (1899-1993) was the first executive director of the Chicago Housing Authority, serving from 1937 to 1954. She consistently pushed for integrated, low-rise public housing sited across the city. White aldermen vetoed CHA projects in their wards, and Wood's 1952 memo questioning the high-rise model went unheeded. She was pushed out in 1954. The high-rise era followed. Historians including D. Bradford Hunt and Lawrence Vale treat Wood as the road not taken.",
    source: "Hunt, Blueprint for Disaster (2009)",
    era: "1940s",
  },
  {
    id: "person-dorothy-gautreaux",
    category: "people",
    title: "Dorothy Gautreaux",
    teaser: "CHA tenant whose 1966 lawsuit reshaped national public housing policy.",
    body:
      "Dorothy Gautreaux (1926-1968) was a CHA tenant and organizer at the Altgeld-Murray Homes. In 1966 she and other tenants, represented by attorney Alexander Polikoff, filed a lawsuit against CHA and HUD alleging that siting public housing exclusively in Black neighborhoods violated the 14th Amendment and federal civil-rights law. Gautreaux died in 1968 before the lawsuit resolved. Hills v. Gautreaux (1976) ruled unanimously that the federal court could order inter-county desegregation remedies. The Gautreaux relocation program (1976-1998) moved 7,000 families to majority-white neighborhoods.",
    source: "Polikoff, Waiting for Gautreaux (2006)",
    era: "1960s",
  },
  {
    id: "person-jane-byrne",
    category: "people",
    title: "Jane Byrne",
    teaser: "Chicago's first woman mayor, 1979-1983. Moved into Cabrini-Green to draw press.",
    body:
      "Jane Byrne (1933-2014) was mayor of Chicago from 1979 to 1983, the city's first and to date only woman mayor until Lori Lightfoot (2019). She famously moved into a Cabrini-Green apartment in 1981 for three weeks, drawing national attention to conditions there. Her tenure was stormy; her 1983 defeat by Harold Washington was a product of machine fracture and the civil-rights coalition's energy. She remains a complex figure.",
    source: "FitzGerald, The Chicago Mayors (1988)",
    era: "1980s",
  },
  {
    id: "person-bill-clinton-cabrini",
    category: "people",
    title: "Lawrence Vale",
    teaser: "MIT planning scholar whose histories of public housing reshaped the debate.",
    body:
      "Lawrence Vale is an MIT professor whose books on public housing — Reclaiming Public Housing (2002), Purging the Poorest (2013), and After the Projects (2018) — collectively shape the scholarly debate on CHA and the Plan for Transformation. His approach: case-compare three or four housing projects in depth, including tenant interviews, to show how policy variations produce very different outcomes.",
    source: "Vale's MIT DUSP bibliography",
  },

  /* ---------- Institutions ---------- */
  {
    id: "inst-cha",
    category: "institutions",
    title: "Chicago Housing Authority",
    teaser: "Created 1937. Built 21,000 units of family public housing, then mostly demolished them.",
    body:
      "The Chicago Housing Authority was created in 1937 under the federal Housing Act. It absorbed earlier city-level housing efforts. At peak (1970) it managed about 21,000 family-housing units and 9,000 elderly units. The high-rise era began with Elizabeth Wood's departure in 1954. The Plan for Transformation (1999) committed to demolishing most high-rises and replacing them with mixed-income developments at a 1:1 ratio, which was never achieved. Today CHA manages about 22,000 units including family public housing, scattered sites, and mixed-income developments, plus about 47,000 voucher households. The agency's transformation is still being evaluated.",
    related: ["inst-hud"],
    source: "Hunt, Blueprint for Disaster (2009)",
  },
  {
    id: "inst-hud",
    category: "institutions",
    title: "Department of Housing and Urban Development",
    teaser: "Federal housing agency. Created 1965. Funds public housing, Section 8, CDBG, LIHTC, HOPE VI.",
    body:
      "HUD was created in 1965 as part of the Great Society. It absorbed the FHA and the federal public-housing program. HUD funds local housing authorities (including CHA) through operating subsidies and capital grants. It administers Section 8 vouchers, CDBG, the HOPE VI/Choice Neighborhoods programs, and fair-housing enforcement. HUD's budget has been cut repeatedly since 1978 relative to need. Secretarial leadership has ranged from innovative (Bob Weaver, the first Black cabinet secretary) to scandalous (Sam Pierce's Reagan-era tenure was heavily investigated).",
    related: ["inst-cha"],
    source: "HUD program history",
  },
  {
    id: "inst-defender",
    category: "institutions",
    title: "Chicago Defender",
    teaser: "Black-Chicago newspaper founded 1905. Catalyzed the Great Migration.",
    body:
      "The Chicago Defender was founded by Robert S. Abbott in 1905. In the 1910s the paper's 'Great Northern Drive' editorials actively called for Black southerners to come north, and it was distributed by Pullman porters across the South. The paper is credited with accelerating the Great Migration. Later owners included John H. Sengstacke. The Defender operated as a weekly from 2008 until folding its print edition in 2019; it continues online.",
    source: "Michaeli, The Defender (2016)",
  },
  {
    id: "inst-ctu",
    category: "institutions",
    title: "Chicago Teachers Union",
    teaser: "25,000 members. Has struck nine times since 1969.",
    body:
      "The Chicago Teachers Union represents 25,000 CPS teachers and para-professionals. CTU has struck nine times since 1969. The 2012 strike under President Karen Lewis revived CTU as a citywide political force. The 2019 strike under Jesse Sharkey won staffing concessions during a budget-strapped period. CTU has been central to Chicago's progressive electoral coalition, including Brandon Johnson's 2023 victory.",
    source: "Golin, The Chicago Teachers Strike of 2012 (2016)",
  },
  {
    id: "inst-iaf",
    category: "institutions",
    title: "Industrial Areas Foundation",
    teaser: "Saul Alinsky's organizing network, born 1940 in Chicago. Now global.",
    body:
      "The Industrial Areas Foundation was founded in 1940 in Chicago's Back of the Yards by Saul Alinsky. IAF pioneered broad-based community organizing: coalitions of unions, churches, and neighborhood groups, professionally led, with a defined organizing model. IAF affiliates include United Power for Action and Justice (Chicago), COPS/Metro (San Antonio), East Brooklyn Congregations, and more than 60 others in the US, UK, Canada, Australia, and Germany.",
    source: "Horwitt, Let Them Call Me Rebel (1989)",
  },
  {
    id: "inst-push",
    category: "institutions",
    title: "Rainbow PUSH Coalition",
    teaser: "Rev. Jesse Jackson's civil-rights organization, Chicago-based.",
    body:
      "Operation PUSH (People United to Save Humanity) was founded by Rev. Jesse Jackson in 1971. It grew out of Operation Breadbasket, the SCLC's economic arm that Jackson led from 1966. In 1996 it merged with the National Rainbow Coalition to become Rainbow PUSH. Its Saturday morning meetings at 930 E. 50th Street have been a fixture of Chicago political life for five decades. Recent decades have been less central than the 1970s-80s peak but the organization remains active.",
    source: "Frady, Jesse (1996)",
  },

  /* ---------- Neighborhoods ---------- */
  {
    id: "hood-bronzeville",
    category: "neighborhoods",
    title: "Bronzeville",
    teaser: "South Side's Black cultural capital in the Great Migration era.",
    body:
      "Bronzeville, on Chicago's South Side, was the cultural and commercial center of Black Chicago from the 1910s through the 1950s. The neighborhood produced the Chicago Defender, the Negro Leagues' American Giants, gospel music institutionalized at Pilgrim Baptist, and writers including Richard Wright, Gwendolyn Brooks, Margaret Burroughs, and Lorraine Hansberry. Federal urban renewal (1950s-70s), the Dan Ryan Expressway (1962), and the Robert Taylor Homes (1961) together hollowed out its commercial corridor. Since 2000 the neighborhood has begun a complicated rebuild.",
    related: ["hood-south-side"],
  },
  {
    id: "hood-pilsen",
    category: "neighborhoods",
    title: "Pilsen",
    teaser: "Lower West Side. Czech, then Polish, then Mexican. Gentrifying.",
    body:
      "Pilsen is on Chicago's Lower West Side. Named by 1870s Czech immigrants (after Plzeň), it became Polish by the early 1900s and Mexican-American from the 1960s onward. At peak it had 50,000 Mexican residents. The 18th Street mural cluster documents the neighborhood's political history. Census data shows Pilsen has lost about 14,000 Latino residents since 2000 as rents have risen. The 2022 Pilsen Preservation Ordinance was a major anti-displacement tool.",
  },
  {
    id: "hood-hyde-park",
    category: "neighborhoods",
    title: "Hyde Park",
    teaser: "South Side neighborhood. Integrated. Contains the University of Chicago.",
    body:
      "Hyde Park is the South Side neighborhood that contains the University of Chicago. Its demographics — racially integrated, highly educated — are unusual for Chicago. The University's 1950s-70s urban renewal campaign, one of the most aggressive in the country, demolished hundreds of buildings deemed 'blighted' (meaning often: Black-occupied) around the campus. The neighborhood the University preserved is integrated; the neighborhoods it cleared were not.",
    source: "Hirsch, Making the Second Ghetto (1983)",
  },
  {
    id: "hood-north-lawndale",
    category: "neighborhoods",
    title: "North Lawndale",
    teaser: "West Side. Most-studied disinvestment case in America.",
    body:
      "North Lawndale was a 125,000-person neighborhood in 1960. Jewish through the 1940s, it went majority Black in the 1950s through blockbusting and white flight. Sears had a Lawndale headquarters until 1974. Industrial decline and the 1968 uprisings hit the neighborhood hard; population dropped below 40,000 by 2000. Ta-Nehisi Coates's 2014 Atlantic essay 'The Case for Reparations' centered on a North Lawndale family's experience with contract-for-deed real estate. Organizations like Lawndale Christian Community Church and North Lawndale Employment Network have been mainstays of recovery efforts.",
    source: "Sampson, Great American City (2012); Coates, 'The Case for Reparations' (2014)",
  },
  {
    id: "hood-parkhaven",
    category: "neighborhoods",
    title: "Parkhaven",
    teaser: "The fictional ward you govern. A composite of four real South Side neighborhoods.",
    body:
      "Parkhaven is the fictional Chicago ward you govern in this game. It does not exist as a Chicago neighborhood. Its geography is a 7x10 grid of parcels, roughly 2 square miles, situated on the South Side with Lake Michigan to the east. The initial parcel layout is a composite: the housing mix of Bronzeville, the commercial-corridor density of Logan Square, the HOLC grade distribution of North Lawndale, and the industrial-corridor edge of Pilsen. No real Chicago person is depicted. Every card and event in the game, however, cites a real Chicago source.",
  },

  /* ---------- Policies ---------- */
  {
    id: "policy-redlining",
    category: "policies",
    title: "Redlining",
    teaser: "Federal HOLC maps graded neighborhoods A through D. D was red. The red zones lost access to capital.",
    body:
      "The Home Owners' Loan Corporation (HOLC) drew color-coded Residential Security Maps for 239 American cities between 1935 and 1940. Every neighborhood got a grade A (green) through D (red). The grades were nominally about housing condition; in practice they tracked race almost perfectly. The FHA used the grades to direct federal mortgage insurance, refusing to back loans in D-graded areas. Private lenders followed suit. The pattern became self-reinforcing: without mortgages, housing in D zones decayed, justifying more denial. The University of Richmond's Mapping Inequality project has digitized the original maps; you can look up any address in the country.",
    source: "University of Richmond Mapping Inequality project",
  },
  {
    id: "policy-fair-housing",
    category: "policies",
    title: "Fair Housing Act of 1968",
    teaser: "Made housing discrimination illegal. Enforcement has varied.",
    body:
      "The Fair Housing Act was signed April 11, 1968, a week after Dr. King's assassination. The bill had been stalled in Congress for two years; King's death changed the calculus. Title VIII banned discrimination in the sale, rental, or financing of housing based on race, color, national origin, or religion. Amendments added sex (1974), disability and family status (1988). The act also requires federal grantees to 'affirmatively further fair housing,' which has been enforced unevenly (strong under Obama's 2015 AFFH rule; suspended under Trump; partially restored under Biden).",
    source: "Fair Housing Act of 1968, Pub. L. 90-284",
  },
  {
    id: "policy-section8",
    category: "policies",
    title: "Section 8 Housing Choice Voucher",
    teaser: "Tenant pays 30% of income, voucher covers the rest up to fair-market rent.",
    body:
      "Section 8 of the 1937 Housing Act authorizes the Housing Choice Voucher program. A tenant pays 30% of income to a private landlord; HUD pays the difference up to a fair-market rent. The program was expanded in the 1970s as part of the federal shift away from building new public housing. Vouchers can in theory be used in any neighborhood, though landlord refusal ('source-of-income discrimination') often restricts practical choice. Illinois passed a source-of-income protection in 2022.",
    source: "HUD Housing Choice Voucher program guidelines",
  },
  {
    id: "policy-tif",
    category: "policies",
    title: "Tax Increment Financing",
    teaser: "Freezes a district's tax base for 23 years. Growth goes to a dedicated fund.",
    body:
      "Tax Increment Financing (TIF) is a local economic-development tool that freezes a district's property-tax base for up to 23 years. Any growth above the base goes into a TIF fund for development, infrastructure, and other public goods within the district. Illinois authorized TIF in 1977; Chicago's first TIF was in 1984. By 2023 Chicago had 130 active TIFs capturing $1.36B. Critics note that TIF revenue would otherwise have gone to the schools and parks general funds. Reform ordinances since 2017 have required some TIFs to allocate for affordable housing.",
    source: "Cook County Clerk 2023 TIF Report",
  },
  {
    id: "policy-inclusionary",
    category: "policies",
    title: "Affordable Requirements Ordinance",
    teaser: "Chicago's inclusionary zoning. 2021 rewrite raised on-site requirements.",
    body:
      "The Affordable Requirements Ordinance (ARO) is Chicago's inclusionary zoning policy. Under the 2021 rewrite, market-rate developments in certain zones must set aside 20% of units as affordable (10-30% AMI depending on zone), with at least 50% built on-site rather than paid out as in-lieu fees. Previous versions allowed large in-lieu substitutions, reducing the affordable-unit count produced in the same neighborhoods as the market-rate development.",
    source: "Chicago ARO 2021 ordinance",
  },

  /* ---------- Events ---------- */
  {
    id: "event-great-migration",
    category: "events",
    title: "The Great Migration",
    teaser: "Six million Black Americans left the South between 1916 and 1970. Chicago was one of the largest destinations.",
    body:
      "The Great Migration was the mass movement of six million Black Americans from the South to Northern and Western cities between 1916 and 1970. The first wave (1916-1940) was driven by WWI industrial demand and Southern violence. The second (1940-1970) continued through WWII and its aftermath. Chicago's Black population grew from 44,000 in 1910 to 813,000 by 1960. Cities including Chicago, Detroit, Philadelphia, New York, Pittsburgh, and Los Angeles were transformed. The Migration is the largest internal population movement in American history.",
    source: "Wilkerson, The Warmth of Other Suns (2010); Grossman, Land of Hope (1989)",
  },
  {
    id: "event-freedom-movement-chicago",
    category: "events",
    title: "Chicago Freedom Movement 1966",
    teaser: "Dr. King's first major Northern campaign. Marquette Park, the Summit Agreement.",
    body:
      "The Chicago Freedom Movement, 1966, was the SCLC's first major Northern campaign, also called the Chicago Open Housing Movement. Dr. King moved his family into a North Lawndale tenement in January 1966 to draw attention to slum conditions. Marches into all-white neighborhoods drew violent counter-protests; the Marquette Park march on August 5, 1966 saw King hit with a thrown rock. He said: 'I have seen many demonstrations in the South, but I have never seen anything so hostile and so hateful as I've seen here today.' The campaign ended with the Summit Agreement (August 1966), which Daley signed but did not enforce.",
    source: "Ralph, Northern Protest (1993); Garrow, Bearing the Cross (1986)",
  },
  {
    id: "event-dnc-1968",
    category: "events",
    title: "1968 Democratic Convention",
    teaser: "Police and antiwar protesters clash in Grant Park. The Walker Report called it a 'police riot.'",
    body:
      "The 1968 Democratic National Convention in Chicago, August 26-29, was marked by violent clashes between Chicago police and antiwar protesters in Grant Park and Lincoln Park. The Walker Report to the National Commission on the Causes and Prevention of Violence (published December 1968) called the police response 'a police riot.' The Chicago Seven trial followed. Mayor Daley's handling of the convention shaped his national image and the national image of the Democratic Party.",
    source: "Farber, Chicago '68 (1988); Walker Report (1968)",
  },
  {
    id: "event-plan-for-transformation",
    category: "events",
    title: "CHA Plan for Transformation (1999)",
    teaser: "Largest public-housing redevelopment in U.S. history. Demolition-heavy.",
    body:
      "The Plan for Transformation, launched in 1999, was the Chicago Housing Authority's 10-year commitment to demolish almost all of its high-rise family buildings and replace them with mixed-income developments. The plan nominally promised 25,000 units of 1:1 replacement. By 2020 actual replacement was closer to 16,000. Tens of thousands of families were displaced; longitudinal studies by Chaskin and Joseph, Popkin, and Venkatesh document mixed outcomes. The Plan is still being evaluated; what it was trying to do and whether it was the right thing to do remain contested.",
    source: "Chaskin and Joseph, Integrating the Inner City (2015)",
  },
  {
    id: "event-1995-heat-wave",
    category: "events",
    title: "1995 Chicago Heat Wave",
    teaser: "Five days in July. 739 dead. Concentrated in disinvested neighborhoods.",
    body:
      "The July 1995 Chicago heat wave killed 739 people across five days. Temperatures exceeded 100°F, and humidity pushed the heat index above 110. Mortality was concentrated in neighborhoods with weakened social infrastructure — places where elderly residents lived alone, street life was thin, and public air conditioning was absent. Sociologist Eric Klinenberg's 'Heat Wave' (2002) compared North Lawndale (high mortality) to Little Village (lower mortality) to show the role of social infrastructure in survival. The heat wave is a foundational case in climate-vulnerability research.",
    source: "Klinenberg, Heat Wave (2002)",
  },
  {
    id: "event-2008-foreclosure",
    category: "events",
    title: "2008 Subprime Crisis",
    teaser: "Subprime defaults trigger global financial crisis. Chicago's South and West sides devastated.",
    body:
      "The 2008 subprime crisis hit Chicago's South and West sides harder than anywhere else in the country by some measures. Pre-2008 subprime lending had targeted Black and Latino neighborhoods at disproportionate rates. When housing prices stalled, subprime defaulted first. Foreclosures peaked at 28,000 in Chicago in 2009. Some South Side blocks lost half their occupied homes within three years. Recovery has been uneven; some neighborhoods still carry the demographic and economic scars of 2008 into the 2020s.",
    source: "Federal Reserve Bank of Chicago subprime crisis reports",
  },
  {
    id: "event-covid-chicago",
    category: "events",
    title: "COVID-19 in Chicago",
    teaser: "Pandemic deaths disproportionately Black and Latino. Federal rental assistance critical.",
    body:
      "COVID-19 reached Chicago in March 2020. Cumulative case and death rates were disproportionately concentrated in Black and Latino neighborhoods, reflecting both higher essential-worker exposure and worse baseline health. Federal rental assistance (ERAP, $280M administered through the Chicago Department of Housing) prevented a wave of evictions. Schools went remote for over a year in CPS; the digital divide was an immediate problem that the city did not fully close during the closure period.",
    source: "Chicago Department of Public Health COVID response reports",
  },

  /* ---------- Concepts ---------- */
  {
    id: "concept-gentrification",
    category: "concepts",
    title: "Gentrification",
    teaser: "When wealthier newcomers bid up rents and property values until original residents leave.",
    body:
      "Gentrification is not a natural process. It is shaped by specific public and private choices: transit investment, zoning changes, property-tax structures, university expansion, and private real-estate speculation. In Chicago the most documented recent cases are Logan Square (lost 20,000 Latino residents 2000-2020) and Pilsen (lost 14,000 Latino residents in the same period). Gentrification can bring benefits (improved services, new businesses) to those who remain, but displacement harms to those who leave are well-documented. Mitigation tools include affordability requirements, community land trusts, and right-to-counsel in eviction.",
    source: "WBEZ, Urban Displacement Project, UC Berkeley",
  },
  {
    id: "concept-displacement",
    category: "concepts",
    title: "Displacement",
    teaser: "Residents forced to leave through eviction, rent hikes, or demolition.",
    body:
      "Displacement can be sudden (eviction, demolition) or slow (gradual rent hikes). Its harms are well-documented: loss of social networks, mid-year school changes for children, loss of access to established healthcare, and often downgrade to lower-quality housing. Displaced families often end up in lower-resourced neighborhoods. Anti-displacement tools include rent stabilization, good-cause eviction, right of first refusal for tenants, community land trusts, and affordability covenants attached to transit or trail investments.",
    source: "Urban Displacement Project, UC Berkeley",
  },
  {
    id: "concept-community-land-trust",
    category: "concepts",
    title: "Community Land Trust",
    teaser: "Nonprofit holds the land permanently. Residents own the buildings.",
    body:
      "A Community Land Trust is a nonprofit that holds title to land in perpetuity and leases it long-term to residents who own or rent the buildings on top. Because the land never appreciates for the buildings' owner, CLT homes stay affordable across resales. The Chicago Community Land Trust was created in 2006 and operates at modest scale. The much larger Champlain Housing Trust in Burlington, Vermont (founded 1984) is the best-studied U.S. example. CLTs are one of the strongest long-term anti-displacement tools available.",
    source: "Lincoln Institute of Land Policy CLT outcomes studies",
  },
  {
    id: "concept-social-housing",
    category: "concepts",
    title: "Social Housing",
    teaser: "Publicly owned, mixed-income, permanently off the market.",
    body:
      "Social housing is publicly owned, mixed-income, permanently off the market. Vienna's social housing program houses 60% of Viennese residents; it is the best-known example globally. U.S. municipal social housing is at pilot scale: Seattle's 2023 I-135 created a Social Housing Developer; Montgomery County MD's Housing Opportunities Commission has operated a social-housing portfolio for decades. The approach is different from traditional U.S. public housing (means-tested, concentrated poverty) and from voucher-based programs (private market dependency).",
    source: "Vienna Social Housing records; Montgomery County Housing Production Fund",
  },
];

export const CODEX_BY_ID: Map<string, CodexEntry> = new Map(
  CODEX.map((e) => [e.id, e])
);

/** Codex entries grouped by category for the nav */
export function codexByCategory(): Record<CodexCategory, CodexEntry[]> {
  const out: Record<CodexCategory, CodexEntry[]> = {
    people: [],
    institutions: [],
    neighborhoods: [],
    policies: [],
    events: [],
    concepts: [],
  };
  for (const e of CODEX) out[e.category].push(e);
  return out;
}

export const CODEX_CATEGORY_LABEL: Record<CodexCategory, string> = {
  people: "People",
  institutions: "Institutions",
  neighborhoods: "Neighborhoods",
  policies: "Policies",
  events: "Historical events",
  concepts: "Concepts",
};
