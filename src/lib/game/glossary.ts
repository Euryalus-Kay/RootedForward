/**
 * Glossary - inline-popoverable explanations for every term the game
 * uses. Each entry costs +1 Knowledge the first time the player reads
 * it, which can unlock deeper cards. The intent is that a player who
 * never opens a glossary entry can still complete a run, but a curious
 * player builds out their Knowledge resource and gets access to nuance.
 */

export interface GlossaryEntry {
  term: string;
  short: string;
  long: string;
  era?: string;
  source?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  HOLC: {
    term: "HOLC",
    short: "Home Owners' Loan Corporation. The 1933 federal agency that drew the redlining maps.",
    long: "The Home Owners' Loan Corporation was a New Deal federal agency created in 1933. Between 1935 and 1940 it produced color-coded Residential Security Maps for 239 American cities, grading every neighborhood A through D for mortgage lending risk. The grades were officially about housing condition and infrastructure. In practice they were about race. Black neighborhoods, almost without exception, got a D grade and were colored red on the maps, which is where the term redlining comes from. For decades after, the federal government used HOLC grades to direct FHA insurance, refusing to back mortgages in the red zones.",
    era: "1933 to 1968",
    source: "University of Richmond Mapping Inequality project",
  },
  Redlining: {
    term: "Redlining",
    short: "Refusing to lend in a neighborhood, originally based on the HOLC red lines.",
    long: "Redlining is the practice of denying mortgages, insurance, or services to residents of specific neighborhoods, usually based on race. The word comes from the red lines drawn on the HOLC maps in 1940. Even after the Fair Housing Act of 1968 made it illegal, redlining continued informally for decades. A 2018 NCRC study found that 74 percent of the formerly red-lined neighborhoods are still low-to-moderate income today.",
    source: "NCRC, HOLC Redlining Maps: The Persistent Structure of Segregation (2018)",
  },
  FHA: {
    term: "FHA",
    short: "Federal Housing Administration. Insures mortgages, but historically only in white areas.",
    long: "The Federal Housing Administration was created in 1934 to insure home loans, making 30-year fixed-rate mortgages possible for ordinary Americans. Until the late 1960s the FHA's underwriting manual instructed appraisers to mark down properties in or near majority-Black neighborhoods. Without FHA insurance, banks would not lend. This single policy choice is the largest single contributor to the racial wealth gap: white families used FHA-backed mortgages to build equity in suburbs, while Black families could not buy at all in those same suburbs and could not get conventional loans in the cities.",
    source: "Rothstein, The Color of Law (2017)",
  },
  AMI: {
    term: "AMI",
    short: "Area Median Income. The benchmark used to set affordable-housing rents.",
    long: "Area Median Income is the household income at the 50th percentile for a given metro area, calculated annually by HUD. Affordable-housing programs key their rent caps to a percentage of AMI. In Chicago in 2024, 60 percent AMI for a four-person household was about $66,300. Rents in 60% AMI units cap at roughly $1,650 per month. The system is used because it adjusts to local cost of living, but it is also criticized because in expensive metros the AMI floats high enough that 'affordable' housing is not actually affordable to the lowest-income residents.",
    source: "City of Chicago 2024 Income and Rent Limits",
  },
  TIF: {
    term: "TIF",
    short: "Tax Increment Financing. Captures property-tax growth in a district to fund development.",
    long: "Tax Increment Financing freezes a neighborhood's property-tax base for up to 23 years. Any growth above that base goes into a TIF fund instead of the general budget. In theory the fund pays for blight reduction in struggling areas. In practice Chicago's TIF program has often subsidized downtown developers. The Cook County Clerk reported that TIF captured $1.36 billion citywide in 2023 and 42 percent of all property-tax growth in the city. Critics point out that TIF revenue would otherwise have gone to schools and parks.",
    source: "Cook County Clerk 2023 TIF Report",
  },
  ARO: {
    term: "ARO",
    short: "Affordable Requirements Ordinance. Chicago's inclusionary zoning rule.",
    long: "Chicago's Affordable Requirements Ordinance, most recently overhauled in 2021, requires market-rate developers in certain zones to set aside a percentage of their units as affordable. The 2021 version raised the requirement to 20 percent in displacement-risk areas and required at least half of those units to be built on-site, not paid out as in-lieu fees. Developers fought the rule. Supporters argued the older version had failed because in-lieu payments siphoned affordable production out of the very neighborhoods that needed it.",
    source: "Chicago ARO 2021 ordinance",
  },
  CHA: {
    term: "CHA",
    short: "Chicago Housing Authority. Built and demolished the towers.",
    long: "The Chicago Housing Authority was created in 1937 to manage public housing. From the 1940s through the 1960s it built about 21,000 units, including the Robert Taylor Homes, Cabrini-Green, and the towers at Stateway Gardens. The towers were located primarily on the South and West Sides because white aldermen blocked siting in their wards. Conditions in the towers deteriorated through the 1980s. The Plan for Transformation, launched in 1999, demolished most of the high-rises and replaced them with mixed-income developments, scattering tens of thousands of residents.",
    source: "Hunt, Blueprint for Disaster (2009)",
  },
  Gautreaux: {
    term: "Gautreaux",
    short: "The 1966 lawsuit that ended concentrated public housing siting.",
    long: "Dorothy Gautreaux was a CHA tenant who in 1966 sued the housing authority and HUD for siting public housing only in Black neighborhoods. The case went to the Supreme Court in 1976 (Hills v. Gautreaux) and the court ruled the remedy could include moving Black families to majority-white suburbs. The Gautreaux program eventually relocated about 7,000 families. Longitudinal studies by James Rosenbaum found large educational and employment gains for participating families.",
    source: "Hills v. Gautreaux, 425 U.S. 284 (1976)",
  },
  ContractBuying: {
    term: "Contract buying",
    short: "Predatory home sale where the buyer never holds title until paid in full.",
    long: "When Black families could not get FHA-backed mortgages in the 1950s and 60s, speculators bought houses cheaply and resold them on contract at heavy markups. The buyer signed a long-term installment contract, made monthly payments, but never held title. Miss one payment and the seller could evict and keep everything paid in. The Duke Cook Center for Social Equity calculated that contract sellers extracted between $3.2 billion and $4 billion in wealth from Black Chicago between 1955 and 1975. The 1968 Contract Buyers League strike forced renegotiations.",
    source: "Duke Cook Center, The Plunder of Black Wealth in Chicago (2019); Satter, Family Properties (2009)",
  },
  Covenants: {
    term: "Racial covenants",
    short: "Deed restrictions that barred sales to non-whites. Made unenforceable in 1948.",
    long: "From the 1920s through the 1940s, white homeowner associations attached racial covenants to property deeds. The covenants barred sale or rental to Black, Asian, and Jewish families. By 1944, 80 percent of Chicago neighborhoods had covenants. Shelley v. Kraemer (1948) made covenants unenforceable in court, but they remained on the deeds, and zoning often did the same job in their place.",
    source: "Shelley v. Kraemer, 334 U.S. 1 (1948)",
  },
  UrbanRenewal: {
    term: "Urban renewal",
    short: "Federal program that demolished 'blighted' neighborhoods. Disproportionately Black ones.",
    long: "Title I of the 1949 Housing Act funded local governments to acquire and demolish 'blighted' urban land for new development. Between 1949 and 1973, about 2,500 urban renewal projects displaced an estimated 1 million people, two-thirds of them Black. Activists and historians sometimes shorten 'urban renewal' to 'Negro removal,' a phrase James Baldwin made famous in a 1963 interview.",
    source: "Federal Highway Administration; Baldwin, 1963 KQED interview",
  },
  Expressway: {
    term: "Expressway",
    short: "Interstate highways were routinely routed through Black neighborhoods.",
    long: "The Federal-Aid Highway Act of 1956 funded 41,000 miles of interstate, much of it cut through urban centers. Engineers and city officials routinely chose routes through Black neighborhoods because the land was cheaper and the residents had less political power to fight. Chicago's Dan Ryan Expressway, completed in 1962, was widened by Mayor Richard J. Daley specifically to keep Black residents on the South Side from spreading west. The Dan Ryan and Eisenhower together demolished thousands of housing units.",
    source: "Mohl, The Interstates and the Cities (2008)",
  },
  WhiteFlight: {
    term: "White flight",
    short: "Mass postwar migration of white families from city neighborhoods to suburbs.",
    long: "Between 1950 and 1980, American cities lost 8 million white residents to the suburbs while gaining 7 million Black residents in the same neighborhoods. The pattern was not natural. It was shaped by FHA-backed suburban mortgages available only to whites, racial steering by real-estate agents, blockbusting tactics, and explicit threats to white homeowners that integration would tank their property values. Chicago's South and West Sides shifted from majority-white to majority-Black in some cases inside a single decade.",
    source: "Sugrue, The Origins of the Urban Crisis (1996)",
  },
  Blockbusting: {
    term: "Blockbusting",
    short: "Real-estate tactic of scaring white owners into selling cheap, then reselling to Black buyers high.",
    long: "Blockbusting was a real-estate practice common in 1950s and 60s Chicago. An agent would tell white homeowners that Black families were moving in and their property values were about to crash, getting them to sell cheap. The agent then resold at a heavy markup to a Black family who had no other options. The Contract Buyers League documented the scale of this in Chicago. Blockbusters often coordinated with banks that refused to lend to Black families through normal channels, forcing them into contract sales.",
    source: "Satter, Family Properties (2009)",
  },
  Gentrification: {
    term: "Gentrification",
    short: "Wealthier residents move in, rents rise, original residents are pushed out.",
    long: "Gentrification is when a previously low-income neighborhood becomes attractive to wealthier residents, who bid up rents and property values until the original community can no longer afford to stay. In Chicago the most documented recent case is Logan Square, which lost an estimated 20,000 Latino residents between 2000 and 2020 while gaining about 12,000 white residents. Pilsen has lost about 14,000 Latino residents over the same period. Gentrification often follows transit investment and downtown growth.",
    source: "WBEZ, How Logan Square Lost 20,000 Latino Residents (2024)",
  },
  Displacement: {
    term: "Displacement",
    short: "Residents forced to leave, whether by eviction, rent hikes, or demolition.",
    long: "Displacement is what happens to the people who lived somewhere before gentrification or urban renewal arrives. It can be sudden (eviction, demolition) or slow (rent hikes that push families out one at a time). The harm is not only economic. Displaced residents lose social networks, kids change schools mid-year, elders lose access to healthcare they had built up locally. Studies show displaced families often end up in worse-resourced neighborhoods, sometimes with fewer transit options and worse air quality.",
    source: "Urban Displacement Project, UC Berkeley",
  },
  LIHTC: {
    term: "LIHTC",
    short: "Low-Income Housing Tax Credit. The main federal funder of affordable housing today.",
    long: "The Low-Income Housing Tax Credit, created in 1986, gives developers tax credits in exchange for building or rehabbing affordable units. It is the largest federal source of new affordable housing, but it is also expensive: in Chicago the average LIHTC unit costs the city about $519,000 to produce, and IHDA-funded units run around $454,000. Critics say the high per-unit cost reflects the fact that LIHTC projects layer multiple subsidies and accumulate developer fees, soft costs, and consultant overhead.",
    source: "City That Works, Chicago LIHTC analyses",
  },
  RedLineExtension: {
    term: "Red Line Extension",
    short: "$5.75B CTA project extending the Red Line 5.6 miles south to 130th Street.",
    long: "The Red Line Extension would extend the CTA Red Line from 95th Street south to 130th, adding four stations. The project costs about $5.75 billion and got a $1.97 billion Full Funding Grant Agreement from the Federal Transit Administration in December 2024. CTA projections show the new stations would unlock about $1.7 billion in real-estate activity, raising land values in a half-mile radius by an estimated 40 percent within two years. That is a benefit and a displacement risk.",
    source: "FTA Full Funding Grant Agreement (Dec 2024)",
  },
  ADU: {
    term: "ADU",
    short: "Accessory Dwelling Unit. A second small unit on a single-family lot. Legalized in Chicago 2021.",
    long: "An Accessory Dwelling Unit is a smaller second housing unit built on a property that already has a primary residence. Examples include a coach house in the back yard, a basement apartment, or an attic conversion. Chicago legalized ADUs in a pilot program in 2021 covering five zones. The pilot generated about 400 permits in three years, 94 percent in the North and Northwest sides where land values were already high. Citywide legalization arrives April 1, 2026.",
    source: "City of Chicago ADU pilot program reports",
  },
  CommunityLandTrust: {
    term: "Community land trust",
    short: "Nonprofit holds the land permanently; residents own only the buildings.",
    long: "A Community Land Trust is a nonprofit that holds title to land permanently, while leasing it long-term to residents who own (or rent) the buildings on top. Because the land never appreciates for the buildings' owner, CLT homes stay affordable across resales. The Chicago Community Land Trust was created in 2006 and has produced several hundred permanently affordable units. The model is much larger in Burlington, Vermont, where it dates to the 1980s.",
    source: "Lincoln Institute of Land Policy CLT outcomes studies",
  },
  Bronzeville: {
    term: "Bronzeville",
    short: "South Side Chicago neighborhood, the heart of Black Chicago in the Great Migration era.",
    long: "Bronzeville on Chicago's South Side was the cultural and commercial center of Black Chicago from the 1910s through the 1950s. The Great Migration brought hundreds of thousands of Black families north, and most settled in or near the Bronzeville corridor along South Parkway (now King Drive). The neighborhood produced or hosted Ida B. Wells, Gwendolyn Brooks, Sam Cooke, the Chicago Defender, and the Negro Leagues' American Giants. Disinvestment, urban renewal, and the Dan Ryan Expressway all hit Bronzeville hard from the 1950s onward.",
    source: "Drake and Cayton, Black Metropolis (1945)",
  },
  Pilsen: {
    term: "Pilsen",
    short: "Lower West Side neighborhood, historically Mexican-American, now gentrifying.",
    long: "Pilsen on Chicago's Lower West Side was historically Czech in the late 1800s, then Polish, and from the 1960s onward became Chicago's largest Mexican-American neighborhood. Pilsen residents have organized against displacement for half a century, including the murals along 16th Street and 18th Street that document the political history of the neighborhood. Census data shows Pilsen has lost about 14,000 Latino residents since 2000.",
    source: "WBEZ Pilsen demographic series",
  },
  HydePark: {
    term: "Hyde Park",
    short: "South Side neighborhood. Site of urban renewal led by the University of Chicago.",
    long: "Hyde Park is the South Side neighborhood that contains the University of Chicago. From the 1950s through the 1970s, the university led one of the most aggressive urban renewal campaigns in the country, demolishing hundreds of buildings to clear what it considered blight (and what was, more often, simply Black housing). The campaign created the Hyde Park-Kenwood Urban Renewal Plan, the first such plan in the country to use the term 'urban renewal.' The neighborhood the university preserved is integrated; the neighborhoods immediately south and west of it were leveled.",
    source: "Hirsch, Making the Second Ghetto (1983)",
  },
  Parkhaven: {
    term: "Parkhaven",
    short: "The fictional Chicago ward you govern in this game.",
    long: "Parkhaven is a fictional composite Chicago ward modeled on a hybrid of North Lawndale, Logan Square, Bronzeville, and Pilsen. It is fictional so you can make decisions about it without defaming any real Chicago alderman. Every economic and historical constraint Parkhaven faces is drawn from a real Chicago source, cited in the card or event that uses it.",
  },
  PlanForTransformation: {
    term: "Plan for Transformation",
    short: "1999 CHA plan to demolish the towers and replace with mixed-income housing.",
    long: "The Plan for Transformation, launched in 1999, was the largest public-housing redevelopment effort in U.S. history. The CHA committed to demolishing all of its high-rise family buildings and replacing them with mixed-income developments, with one-for-one replacement of public-housing units. In practice the replacement rate ran around 60 percent, and tens of thousands of residents were displaced. Chaskin and Joseph's longitudinal study found mixed results: poverty in the redeveloped sites dropped, but the displaced families' new neighborhoods saw poverty rise.",
    source: "Chaskin and Joseph, Integrating the Inner City (2015)",
  },
  Daley: {
    term: "Mayor Daley",
    short: "Richard J. Daley, mayor 1955-1976, who shaped Chicago's segregation.",
    long: "Richard J. Daley was mayor of Chicago from 1955 to 1976 and arguably the most consequential mayor in the city's history. Daley's policies and infrastructure choices, especially the Dan Ryan Expressway and the placement of CHA towers on the State Street corridor, intentionally maintained the racial boundaries of the city. He met with Dr. King during the 1966 Chicago Freedom Movement, signed the Summit Agreement, and then did not enforce it. His son Richard M. Daley served as mayor from 1989 to 2011 and oversaw the launch of the Plan for Transformation.",
    source: "Cohen and Taylor, American Pharaoh (2000)",
  },
  ChicagoFreedomMovement: {
    term: "Chicago Freedom Movement",
    short: "Dr. King and SCLC's 1966 northern campaign for fair housing.",
    long: "The Chicago Freedom Movement, also called the Chicago Open Housing Movement, was the SCLC's first major northern campaign. King moved his family into a North Lawndale apartment in January 1966 to draw attention to slum conditions. Marches into all-white neighborhoods, including Marquette Park, drew violent counter-protests where King was hit in the head with a thrown rock. The movement ended with the Summit Agreement, which Daley signed but did not enforce.",
    source: "Ralph, Northern Protest (1993); Garrow, Bearing the Cross (1986)",
  },
  Gautreaux2: {
    term: "Hills v. Gautreaux",
    short: "1976 Supreme Court case allowing inter-county relocation as a desegregation remedy.",
    long: "Hills v. Gautreaux (1976) ruled unanimously that the federal court could order HUD and CHA to remedy decades of discriminatory siting by relocating CHA families to majority-white neighborhoods, including suburbs in DuPage, Cook, and Lake counties. The case became the legal foundation for the Section 8 voucher program's mobility components. About 7,000 families participated in the resulting relocation program over 25 years.",
    source: "Hills v. Gautreaux, 425 U.S. 284 (1976)",
  },
  AffordableHousing: {
    term: "Affordable housing",
    short: "Housing that costs no more than 30 percent of household income.",
    long: "The standard definition of affordable housing is housing that costs a household no more than 30 percent of their gross income, including rent or mortgage plus utilities. Households spending more than 30 percent are 'cost-burdened.' Households spending more than 50 percent are 'severely cost-burdened.' In 2023 about half of all renters in the U.S. were cost-burdened, the highest share on record.",
    source: "Joint Center for Housing Studies, State of the Nation's Housing 2024",
  },
  Section8: {
    term: "Section 8",
    short: "Federal rental subsidy where tenants pay 30% of income, voucher covers the rest.",
    long: "Section 8 of the 1937 Housing Act authorizes the Housing Choice Voucher program. A tenant pays 30 percent of their income to a private landlord, and HUD's voucher pays the difference up to a fair-market rent. The program was expanded in the 1970s as part of the federal shift away from building public housing. Vouchers can in theory be used in any neighborhood, but landlords often refuse them, and many vouchers go unused for that reason.",
    source: "HUD Housing Choice Voucher program guidelines",
  },
  Inclusionary: {
    term: "Inclusionary zoning",
    short: "Requiring new market-rate development to include affordable units.",
    long: "Inclusionary zoning requires private developers building market-rate housing to include some percentage of affordable units, either on-site or off-site, or to pay a fee in lieu. Chicago's ARO is one example. Montgomery County, Maryland, has had inclusionary zoning since 1974 and is the most-studied case. Critics argue it raises the cost of all units; supporters argue without it private development never produces affordability at all.",
    source: "Mukhija et al., 'Inclusionary Housing in California and New Jersey' (2010)",
  },
};

/** Return the full definition for a term, or null if not found */
export function lookupTerm(term: string): GlossaryEntry | null {
  return GLOSSARY[term] ?? null;
}

/** Get all terms sorted alphabetically */
export function allTerms(): GlossaryEntry[] {
  return Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term));
}
