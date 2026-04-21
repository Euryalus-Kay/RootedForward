/**
 * Expansion pack for the game glossary.
 *
 * Adds roughly 45 additional terms, each with a short (one-line) summary
 * and a long explanation. Reading any entry rewards +1 Knowledge the
 * first time (+2 for the Scholar role).
 *
 * All entries cite real primary or secondary sources. The intent is that
 * a player who reads the whole glossary comes away with a working
 * understanding of a century of Chicago neighborhood policy history.
 */

import type { GlossaryEntry } from "./glossary";

export const GLOSSARY_EXPANSION: Record<string, GlossaryEntry> = {
  /* -------------- Federal and national-scale terms -------------- */
  NewDeal: {
    term: "New Deal",
    short: "Franklin Roosevelt's 1933-1939 recovery program that reshaped American housing.",
    long:
      "The New Deal (1933-1939) was the federal government's answer to the Great Depression. It gave us Social Security, the SEC, the TVA, the WPA, the CCC, and a dozen other agencies you have heard of. For cities, its most consequential pieces were the Home Owners' Loan Corporation (which drew the redlining maps), the FHA (which institutionalized them nationwide), the Public Works Administration (which built the first public housing), and the 1937 Housing Act (which created local housing authorities like CHA). The New Deal built the administrative state that governs American cities to this day; much of its housing architecture also built in segregation that persists.",
    era: "1933 to 1939",
    source: "Katznelson, Fear Itself (2013)",
  },
  FairHousingAct: {
    term: "Fair Housing Act",
    short: "The 1968 federal law making housing discrimination illegal.",
    long:
      "Title VIII of the Civil Rights Act of 1968, known as the Fair Housing Act, made it illegal to discriminate in the sale, rental, or financing of housing on the basis of race, color, national origin, or religion. Sex was added in 1974, disability and family status in 1988. Sexual orientation and gender identity are covered in most states but not federally. The FHA also nominally requires HUD and federal grantees to 'affirmatively further fair housing,' a provision that has been enforced unevenly since 1968.",
    era: "1968 to present",
    source: "Fair Housing Act of 1968, Pub. L. 90-284; HUD AFFH regulations",
  },
  GIBill: {
    term: "GI Bill",
    short: "1944 veteran-benefits law that reshaped the American middle class, mostly for white veterans.",
    long:
      "The Servicemen's Readjustment Act of 1944, known as the GI Bill, provided returning WWII veterans with tuition assistance, unemployment pay, and low-interest mortgages. The bill was facially race-neutral but administered through local offices that routinely refused Black veterans access to mortgages and universities. Historian Ira Katznelson called it 'the most far-reaching affirmative action program in American history, for whites.' Black veterans' exclusion is a major source of the modern racial wealth gap.",
    era: "1944 to present",
    source: "Katznelson, When Affirmative Action Was White (2005)",
  },
  Section235: {
    term: "Section 235",
    short: "1968 federal subsidy for low-income first-time homebuyers; widely defrauded.",
    long:
      "Section 235 of the 1968 Housing and Urban Development Act subsidized mortgages for low-income first-time homebuyers. The subsidy flowed through the FHA. In cities including Detroit, Philadelphia, and parts of Chicago, local real-estate brokers defrauded the program by selling deteriorated properties with inflated appraisals to families who would default within months. Historian Keeanga-Yamahtta Taylor documented the pattern in 'Race for Profit' (2019), showing that what looked like homeownership opportunity was often wealth-stripping under a new name.",
    era: "1968 to 1975",
    source: "Taylor, Race for Profit (2019)",
  },
  HOPEVI: {
    term: "HOPE VI",
    short: "1992 HUD program funding demolition of public housing towers.",
    long:
      "HOPE VI (Housing Opportunities for People Everywhere) was a HUD program from 1992 to 2010 that funded the demolition and redevelopment of severely distressed public housing. Chicago's Plan for Transformation, launched in 1999, was the largest HOPE VI project. Replacement commitments were frequently not met: demolished units numbered about 80,000 nationally; replacement units about 27,000. Research on HOPE VI outcomes (Popkin et al., Chaskin & Joseph) is extensive and mixed; displaced residents often ended up in poorer neighborhoods than where they had come from.",
    era: "1992 to 2010",
    source: "Popkin et al., A Decade of HOPE VI (2004)",
  },
  CDBG: {
    term: "CDBG",
    short: "Community Development Block Grant. Flexible federal grant to cities.",
    long:
      "The Community Development Block Grant is HUD's flexible grant to local governments, authorized by the Housing and Community Development Act of 1974. CDBG consolidated several categorical programs. Cities use CDBG for a wide range of neighborhood investments: housing rehabilitation, public facilities, economic development, fair housing. Chicago receives about $85M per year in CDBG. Block grants trade flexibility for accountability; allocation decisions can be contested.",
    era: "1974 to present",
    source: "HUD CDBG program documentation",
  },
  WagnerAct: {
    term: "Wagner Act",
    short: "1935 federal law guaranteeing private-sector workers the right to unionize.",
    long:
      "The National Labor Relations Act of 1935 (Wagner Act) gave private-sector workers the federally protected right to form unions, bargain collectively, and strike. The law transformed industrial labor but excluded agricultural and domestic workers, categories disproportionately filled by Black and Latino workers at the time. The act built the mid-century labor movement that powered the Great Migration's economic opportunities in Chicago.",
    era: "1935 to present",
    source: "NLRA, 29 U.S.C. §§ 151-169",
  },
  GreatSociety: {
    term: "Great Society",
    short: "Lyndon Johnson's 1964-1968 reform program. Civil rights, Medicare, Medicaid, War on Poverty.",
    long:
      "The Great Society was President Johnson's legislative agenda from 1964 to 1968, including the Civil Rights Act of 1964, Voting Rights Act of 1965, Medicare, Medicaid, Fair Housing Act, Head Start, VISTA, Model Cities, and dozens of other programs. The scope of social reform in those four years is unmatched in U.S. history. The Vietnam War and the urban rebellions of 1965-1968 complicated its legacy. Reagan-era retrenchment hollowed out much of it.",
    era: "1964 to 1968",
    source: "Dallek, Flawed Giant (1998)",
  },
  NewFederalism: {
    term: "New Federalism",
    short: "Nixon-Reagan era shift of federal dollars to states via block grants.",
    long:
      "Beginning with Nixon's 1969 proposals and accelerating under Reagan, the federal government shifted from categorical aid (specific programs with specific requirements) to block grants (flexible state-controlled funds) and eventually direct funding cuts. The shift reduced federal accountability for social outcomes and gave states leverage to redirect spending. Urban programs were disproportionately affected; CDBG was one block-grant innovation that survived.",
    era: "1969 to 2001",
    source: "Conlan, From New Federalism to Devolution (1998)",
  },
  War_on_Drugs: {
    term: "War on Drugs",
    short: "Federal anti-drug policy beginning 1971; disproportionately targeted Black communities.",
    long:
      "The War on Drugs began with Nixon's 1971 declaration and accelerated with the 1986 Anti-Drug Abuse Act (which imposed the 100:1 crack/powder sentencing disparity) and 1994 Crime Bill. Mass incarceration rose dramatically, disproportionately affecting Black and brown neighborhoods. Chicago's public housing tower era overlapped directly with the most aggressive policing of the drug war. Research on crime-control effectiveness of drug-war policies is mixed-to-negative.",
    era: "1971 to present",
    source: "Alexander, The New Jim Crow (2010); Hinton, From the War on Poverty to the War on Crime (2016)",
  },

  /* -------------- Zoning, land use, and planning terms -------------- */
  Euclidean: {
    term: "Euclidean zoning",
    short: "Use-based zoning that separates residential, commercial, industrial.",
    long:
      "Euclidean zoning, named after the 1926 Supreme Court case Village of Euclid v. Ambler Realty, is the most common American zoning approach. It divides cities into zones by use: residential, commercial, industrial. Chicago's zoning code remains largely Euclidean. Critics note that use-based zoning enforces suburban-style separation, drives car dependency, and can enforce class segregation. Form-based codes and transect codes offer alternatives.",
    era: "1926 to present",
    source: "Village of Euclid v. Ambler Realty, 272 U.S. 365 (1926)",
  },
  DownZoning: {
    term: "Downzoning",
    short: "Reducing allowed density or building height. Often a preservation tool, sometimes an exclusion tool.",
    long:
      "Downzoning reduces the allowed density or height on a parcel or block. It is often used to preserve neighborhood character; it is also used to exclude affordable housing by banning multifamily. In the 1940s-1970s, white aldermen across American cities routinely downzoned whole neighborhoods to single-family in response to Black families moving in. The tactic was called 'zoning out.'",
    source: "Rothstein, The Color of Law (2017)",
  },
  UpZoning: {
    term: "Upzoning",
    short: "Increasing allowed density or building height.",
    long:
      "Upzoning allows taller, denser development. It is a core tool of housing-supply advocates. Evidence on upzoning's effects on affordability is mixed and strongly site-dependent: upzoning alone rarely produces affordable housing, but coupled with affordability requirements it can. Chicago's transit-oriented-development upzonings (2015, 2019, 2021) are recent examples.",
    source: "Freemark, 'Upzoning Chicago' (2020); Mast, JHE 'The Effect of New Market-Rate Housing Construction on the Low-Income Housing Market' (2021)",
  },
  FormBasedCode: {
    term: "Form-based code",
    short: "Zoning that regulates building shape instead of use.",
    long:
      "Form-based codes regulate the physical form of buildings (height, frontage, setback, floor-area) rather than the uses inside them. They allow mixed use by default. The Smart Code developed by Andrés Duany (2003) is the most-used template. Cincinnati, Miami, and several smaller cities have adopted form-based codes citywide. Chicago has used them in specific overlay districts but not citywide.",
    source: "Form-Based Codes Institute reference materials",
  },
  TOD: {
    term: "TOD",
    short: "Transit-Oriented Development. Denser housing near transit.",
    long:
      "Transit-Oriented Development couples dense, mixed-use development with transit stations. Chicago's 2015 TOD ordinance allowed reduced parking and increased density near CTA stops. TOD is a core sustainability tool: it reduces per-household emissions and increases transit ridership. Without explicit affordability requirements, TOD can accelerate gentrification around new stations.",
    source: "Chicago TOD Ordinance 2015, 2019, 2021 amendments",
  },
  RezoneByRight: {
    term: "By right",
    short: "Development allowed without discretionary approval.",
    long:
      "'By right' means a project that conforms to the zoning code can be built without needing a variance, special use permit, or planned development. 'By right' approvals are faster and more predictable. Chicago zoning has been shaped to require discretionary aldermanic review for many projects via 'aldermanic prerogative,' which gives individual aldermen veto power over developments in their wards.",
    source: "Chicago Zoning Ordinance; Aldermanic Prerogative tradition",
  },
  AldermanicPrerogative: {
    term: "Aldermanic prerogative",
    short: "Chicago tradition that individual aldermen control land-use in their wards.",
    long:
      "Aldermanic prerogative is the Chicago practice that zoning changes, special-use permits, and many administrative approvals in a ward require that ward's alderman's signoff. The practice is not formally codified but is enforced through the full council's informal culture. It gives individual aldermen enormous power; critics argue it enforces spatial segregation by letting aldermen veto affordable housing. Reform efforts have been periodic and incomplete.",
    source: "Civic Federation reports on aldermanic prerogative; WBEZ coverage 2019-2023",
  },

  /* -------------- Housing programs and finance -------------- */
  HUD: {
    term: "HUD",
    short: "U.S. Department of Housing and Urban Development. Federal housing agency.",
    long:
      "The Department of Housing and Urban Development was created in 1965 as part of Johnson's Great Society. It oversees the FHA (which it absorbed), public housing (via local authorities like CHA), Section 8, CDBG, HOPE VI, and fair-housing enforcement. HUD's budget has been cut repeatedly since 1978. The agency has also been subject to major scandals (the 1989 Pierce scandal, the 2000s Philadelphia Housing Authority scandal) that shaped its political standing.",
    era: "1965 to present",
    source: "HUD program history",
  },
  IHDA: {
    term: "IHDA",
    short: "Illinois Housing Development Authority. State affordable-housing financier.",
    long:
      "The Illinois Housing Development Authority finances affordable housing construction and preservation statewide. IHDA administers LIHTC allocations in Illinois, issues housing bonds, and operates several gap-financing programs. It is the largest state-level affordable-housing financier in Illinois. The cost per LIHTC unit it finances averages about $454,000 (2023).",
    source: "IHDA annual reports",
  },
  MortgageInterest: {
    term: "Mortgage interest deduction",
    short: "Federal tax break on home-mortgage interest. Largest housing subsidy.",
    long:
      "The mortgage interest deduction allows homeowners to deduct mortgage interest from federal income tax. It is the largest federal housing subsidy by dollars (roughly $30B/year), but flows almost entirely to higher-income households; renters and low-income homeowners see no benefit. Economists across the political spectrum have called it regressive and inefficient. The 2017 Tax Cuts and Jobs Act capped the deduction but did not eliminate it.",
    source: "Joint Committee on Taxation estimates; Quigley and Raphael housing policy analysis",
  },
  ContractForDeed: {
    term: "Contract for deed",
    short: "Real-estate transaction where buyer never holds title until paid in full; predatory variant of contract buying.",
    long:
      "A contract for deed is a real-estate installment sale in which the buyer makes payments but the seller retains title until the contract is fulfilled. If the buyer misses a payment, the seller can rescind the contract and keep everything paid. The structure was heavily used against Black Chicago buyers in the 1950s and 1960s. A modern variant persists; the Consumer Financial Protection Bureau has flagged it as a predatory structure.",
    source: "Satter, Family Properties (2009); CFPB enforcement actions",
  },
  Reparations: {
    term: "Reparations",
    short: "Redress for specific historic harms, often compensatory.",
    long:
      "Reparations are compensatory or restorative responses to specific historic harms. In U.S. context, the core debate is about reparations for slavery and its structural successors (redlining, convict leasing, mass incarceration). Evanston, Illinois (2019) passed the first municipal reparations program in the U.S., funded by cannabis tax revenue. Several universities (including Georgetown, Chicago) have implemented institutional reparations. The federal H.R. 40 commission bill has been reintroduced every Congress since 1989.",
    source: "Darity and Mullen, From Here to Equality (2020); Evanston Restorative Housing Program",
  },
  NIMBY: {
    term: "NIMBY",
    short: "Not In My Back Yard. Opposition to local development by residents.",
    long:
      "NIMBY, 'Not In My Back Yard,' is the pejorative for residents who oppose proposed nearby development, especially affordable housing, transit, or renewable energy infrastructure. The term has become contested: some NIMBY opposition is genuinely defensive against displacement; some is classic exclusion; the motives are not always easily separable. The Yes-In-My-Back-Yard (YIMBY) movement emerged in the late 2010s as a pro-housing-supply counterweight.",
    source: "Einstein, Glick, and Palmer, Neighborhood Defenders (2019)",
  },

  /* -------------- Chicago-specific terms -------------- */
  Machine: {
    term: "Chicago Machine",
    short: "The Democratic Party organization that ran Chicago from the 1930s onward.",
    long:
      "The Chicago Democratic Machine was the citywide patronage organization that dominated Chicago politics from Mayor Anton Cermak (1931) through Mayor Richard J. Daley (1976) and in softer form through Richard M. Daley (2011). It worked through ward committeemen, precinct captains, patronage jobs, and block-level organization. Harold Washington's 1983 election was a major break. The Shakman decrees (1972-present) have gradually dismantled formal patronage.",
    source: "Royko, Boss (1971); O'Connor, Requiem for Daley (1977)",
  },
  Shakman: {
    term: "Shakman decrees",
    short: "Court orders restricting patronage hiring in Cook County government.",
    long:
      "Beginning in 1972, federal consent decrees (named for attorney Michael Shakman) banned politically motivated hiring and firing in Cook County government. The decrees have been expanded, litigated, and enforced by a federal monitor for decades. They structurally changed how Chicago and Cook County governments operate, though violations and workarounds continue.",
    era: "1972 to present",
    source: "Shakman v. Democratic Organization of Cook County",
  },
  CouncilWars: {
    term: "Council Wars",
    short: "1983-1986 deadlock between Mayor Harold Washington and opposition aldermen.",
    long:
      "After Harold Washington was elected in 1983, 29 of the 50 aldermen led by Edward Vrdolyak blocked most of his agenda through procedural maneuvers and vote denials. The 21 Washington allies and 29 Vrdolyak opponents routinely deadlocked 29-21 and 21-21 votes. The 1986 special-election win flipped a seat and let Washington's agenda briefly pass. His death in November 1987 reshuffled the coalitions again.",
    era: "1983 to 1986",
    source: "Rivlin, Fire on the Prairie (1992)",
  },
  Washington: {
    term: "Harold Washington",
    short: "Chicago's first Black mayor, 1983-1987.",
    long:
      "Harold Washington was Chicago's first Black mayor, serving from April 1983 until his death in November 1987. A veteran South Side politician and congressman, he won the 1983 Democratic primary over Mayor Jane Byrne and Richard M. Daley. His coalition of Black, Latino, and white progressives redirected city spending toward neighborhoods and opened city hiring. Council Wars limited but did not fully block his agenda. His death triggered the political realignment that led eventually to Richard M. Daley's long tenure.",
    source: "Rivlin, Fire on the Prairie (1992); Travis, Harold, the People's Mayor (1989)",
  },
  Cabrini: {
    term: "Cabrini-Green",
    short: "North Side CHA development, demolished 2011; symbolic of the tower era.",
    long:
      "Cabrini-Green was a CHA complex of rowhouses (1942), high-rises (1958 and 1962), and scattered structures on the Near North Side. At peak it housed 15,000 people. Its proximity to the Loop made it a unique public-housing site. Conditions deteriorated through the 1970s and 1980s. Demolitions began 1995; the last high-rise came down in 2011. The remaining rowhouses were demolished or rehabbed into mixed-income in the Parkside of Old Town redevelopment.",
    source: "Hunt, Blueprint for Disaster (2009)",
  },
  StateStreetCorridor: {
    term: "State Street corridor",
    short: "The two-mile strip of CHA tower developments along State Street, 22nd to 54th.",
    long:
      "The State Street Corridor, also called 'The State Street Vertical Ghetto,' concentrated most of CHA's Black family high-rise housing in a narrow strip. Robert Taylor Homes (1961-2007), Stateway Gardens (1955-2007), Dearborn Homes (1950-present), and Harold Ickes Homes (1955-2010) all sat on or near State Street. The concentration was not accidental: white aldermen blocked CHA projects in their wards, leaving only the South Side corridor where Black residents were already concentrated.",
    source: "Hirsch, Making the Second Ghetto (1983)",
  },
  SouthSide: {
    term: "South Side",
    short: "The portion of Chicago south of the downtown Loop, roughly from 22nd to the city line.",
    long:
      "Chicago's South Side has been the center of Black Chicago since the Great Migration of 1910-1940. It includes Bronzeville, Hyde Park, Woodlawn, Englewood, Washington Park, Chatham, Roseland, Pullman, Calumet Heights, and more. The South Side shaped a century of Black American culture: the Chicago Defender, gospel music, blues, the Black Panthers, the Wall of Respect. Disinvestment and federal policy concentrated wealth extraction on the South Side for most of the 20th century.",
    source: "Drake and Cayton, Black Metropolis (1945); Black, Bridges of Memory (2004)",
  },
  WestSide: {
    term: "West Side",
    short: "Chicago's West Side neighborhoods, including North Lawndale, Austin, Garfield Park.",
    long:
      "Chicago's West Side includes North Lawndale, South Lawndale (Little Village), Austin, Garfield Park, and Humboldt Park. The West Side saw major 1968 uprisings after Dr. King's assassination; the area's disinvestment was severe enough that observers said it still had not recovered fifty years later. Little Village has the nation's largest Mexican-American population; North Lawndale has been one of Chicago's most-studied disinvestment cases.",
    source: "Sampson, Great American City (2012)",
  },
  DaleyII: {
    term: "Mayor Richard M. Daley",
    short: "Mayor of Chicago 1989-2011. Son of Richard J. Daley.",
    long:
      "Richard M. Daley was mayor of Chicago from 1989 to 2011, longer than any other mayor. His administration privatized parking meters (2008, disastrously), launched the Plan for Transformation (1999), hosted the 1996 Democratic Convention, and hosted the 1996 and 2009 Olympic bids. He ushered in Millennium Park (2004), the 606 (2015), and Navy Pier redevelopment. Critics note that his tenure accelerated gentrification and closed dozens of neighborhood schools.",
    source: "Cohen and Taylor, American Pharaoh (2000); Rivlin, Fire on the Prairie (1992)",
  },
  Emanuel: {
    term: "Mayor Rahm Emanuel",
    short: "Mayor of Chicago 2011-2019. Closed 50 schools; Laquan McDonald shooting.",
    long:
      "Rahm Emanuel was mayor of Chicago from 2011 to 2019. His administration closed 50 neighborhood schools in 2013 (disproportionately Black and West-Side schools), suppressed the video of Laquan McDonald's 2014 police killing until after the 2015 election, and pushed an aggressive downtown-first development agenda. His two terms ended amid declining approval; he declined to seek a third.",
    source: "Ewing, Ghosts in the Schoolyard (2018); Chicago Sun-Times Laquan McDonald coverage",
  },
  Lightfoot: {
    term: "Mayor Lori Lightfoot",
    short: "Mayor of Chicago 2019-2023. First Black woman mayor of Chicago; first openly gay.",
    long:
      "Lori Lightfoot was mayor of Chicago from 2019 to 2023, the first Black woman and first openly gay mayor of Chicago. Her tenure overlapped with COVID-19 (2020), the 2020 uprisings, and the 2021 police raid on Anjanette Young. She lost the 2023 election to Brandon Johnson amid mixed results on policing, school funding, and COVID-era management. Her administration did secure passage of the 2021 ARO rewrite and launched the Invest South West program.",
    source: "Chicago Tribune Lightfoot administration coverage",
  },
  Johnson: {
    term: "Mayor Brandon Johnson",
    short: "Mayor of Chicago 2023-present. Progressive organizer elected on police-reform platform.",
    long:
      "Brandon Johnson was elected mayor of Chicago in April 2023. A former teacher and Cook County Commissioner, he was backed by CTU and SEIU. His agenda has included Bring Chicago Home (2024 referendum), youth employment expansion, and reorientation of city spending toward neighborhoods. His relationship with the police department has been contested.",
    source: "Chicago Tribune, Block Club Chicago 2023-2024 coverage",
  },

  /* -------------- Environmental and climate terms -------------- */
  GreenInfrastructure: {
    term: "Green infrastructure",
    short: "Nature-based tools for stormwater, heat, and air-quality management.",
    long:
      "Green infrastructure includes bioswales, permeable pavement, green roofs, rain gardens, street trees, and wetland restoration. These tools manage stormwater, reduce urban heat, and improve air quality at lower cost than traditional 'grey' infrastructure. Chicago's Stormwater Management Ordinance (2014) and Space to Grow program (2014-) have been significant. Green infrastructure delivery is racially uneven.",
    source: "Chicago Space to Grow program evaluations",
  },
  HeatIsland: {
    term: "Urban heat island",
    short: "Cities run 5-7°F hotter than surrounding rural areas due to concrete, asphalt, and loss of canopy.",
    long:
      "The urban heat island effect makes cities run 5-7°F hotter than surrounding areas because dark surfaces (roofs, pavement) absorb heat and trees and vegetation are scarce. Within cities, the heat island is also uneven: historically redlined neighborhoods have less tree canopy, more dark surface, and more heat. Chicago's 1995 heat wave killed 739 people concentrated in weaker-networked, lower-tree-canopy areas.",
    source: "Klinenberg, Heat Wave (2002); Hoffman et al. 'Disparities in the Cooling Effect of Tree Canopy' (2020)",
  },
  CombinedSewer: {
    term: "Combined sewer",
    short: "A single pipe carries both sewage and stormwater. Chicago has one; it overflows during storms.",
    long:
      "Chicago has a combined sewer system: the same pipes carry sanitary sewage and stormwater. In heavy rain, the system is overwhelmed and overflows into the Chicago River and the canal system (and sometimes into basements). The Deep Tunnel TARP project (1975-ongoing) is a $4B solution that has reduced but not eliminated overflows. Combined sewer systems are vulnerable to climate-intensified storms.",
    source: "Metropolitan Water Reclamation District of Greater Chicago TARP program",
  },
  AirQuality: {
    term: "Air quality",
    short: "Airborne pollutant levels; in Chicago, unevenly distributed across neighborhoods.",
    long:
      "Urban air quality reflects traffic, industrial emissions, and atmospheric transport. Chicago's air quality is generally within EPA standards but with significant local variation: expressway-adjacent neighborhoods and industrial-corridor neighborhoods have elevated PM2.5, asthma rates, and cardiovascular mortality. The Little Village Environmental Justice Organization has documented this for two decades.",
    source: "EPA Air Quality Index data; LVEJO advocacy",
  },

  /* -------------- Organizing and movement terms -------------- */
  IAF: {
    term: "IAF",
    short: "Industrial Areas Foundation. Alinsky-founded broad-based community organizing network.",
    long:
      "The Industrial Areas Foundation was founded by Saul Alinsky in 1940 in Chicago's Back of the Yards. IAF pioneered broad-based community organizing: coalitions of unions, churches, and neighborhood groups that trained leaders and took on citywide issues. IAF now operates in dozens of cities worldwide. Its approach influenced every subsequent generation of community organizing including Barack Obama's training.",
    era: "1940 to present",
    source: "Alinsky, Rules for Radicals (1971); Horwitt, Let Them Call Me Rebel (1989)",
  },
  PanthersChicago: {
    term: "Illinois Black Panther Party",
    short: "Chicago branch of the BPP, led by Fred Hampton 1968-1969.",
    long:
      "The Illinois Black Panther Party was founded in 1968 with Fred Hampton as chairman. Its Survival Programs included free breakfast, free medical clinics, free legal aid, and community police patrols. Hampton's Rainbow Coalition united the Panthers with the Young Lords (Puerto Rican) and Young Patriots (poor white). FBI COINTELPRO operations, the Chicago Police Department, and Cook County State's Attorney Edward Hanrahan orchestrated his December 4, 1969 killing.",
    source: "Williams, From the Bullet to the Ballot (2013); Haas, The Assassination of Fred Hampton (2010)",
  },
  OperationPush: {
    term: "Operation PUSH / RainbowPUSH",
    short: "Jesse Jackson's 1971-founded national civil-rights organization.",
    long:
      "Operation PUSH (People United to Save Humanity) was founded by Rev. Jesse Jackson in 1971, headquartered in Chicago. It grew from Operation Breadbasket. In 1996 it merged with the National Rainbow Coalition to become RainbowPUSH. Saturday morning meetings at its 930 E. 50th Street headquarters have been a fixture of Black Chicago political life for five decades.",
    source: "Frady, Jesse (1996)",
  },
  CTU: {
    term: "CTU",
    short: "Chicago Teachers Union. 25,000 members; major political force post-2012.",
    long:
      "The Chicago Teachers Union represents about 25,000 CPS teachers, teaching assistants, and paraprofessionals. CTU has struck nine times since 1969. The 2012 strike under President Karen Lewis rejuvenated CTU as a citywide political force. CTU endorsements and volunteers were instrumental in Brandon Johnson's 2023 mayoral election. CTU's organizing model has influenced teachers' unions nationally.",
    source: "Golin, The Chicago Teachers Strike of 2012 (2016)",
  },
  SEIU: {
    term: "SEIU",
    short: "Service Employees International Union. Janitors, healthcare, home care workers.",
    long:
      "SEIU is one of the country's largest unions with 2M members. In Chicago, SEIU Local 1 represents janitors, security officers, and building-maintenance workers. SEIU Healthcare Illinois Indiana represents 90,000 home-care and childcare workers. SEIU's Fight for 15 campaign pushed the minimum wage debate nationally starting 2012. In Chicago politics, SEIU is routinely one of the two or three most decisive union endorsers.",
    source: "SEIU Local 1 and SEIU Healthcare IL-IN organizing records",
  },

  /* -------------- Culture and heritage terms -------------- */
  Bronzeville2: {
    term: "Chicago Black Renaissance",
    short: "1930s-50s Black arts and intellectual movement on the South Side.",
    long:
      "The Chicago Black Renaissance (sometimes called the Chicago Renaissance or the South Side Renaissance) was the Black arts, music, and intellectual movement centered in Bronzeville from the 1930s through the 1950s. Figures include Richard Wright, Gwendolyn Brooks, Margaret Burroughs, Thomas A. Dorsey, Katherine Dunham, Mahalia Jackson, Lorraine Hansberry, and many more. The movement's scale approached and arguably surpassed the Harlem Renaissance.",
    era: "1930 to 1955",
    source: "Mullen, Popular Fronts: Chicago and African-American Cultural Politics (1999)",
  },
  PilsenMurals: {
    term: "Pilsen murals",
    short: "The cluster of Mexican-American political and cultural murals along 18th Street.",
    long:
      "Pilsen's 18th and 16th Street murals, painted from the 1970s onward, document Mexican revolutionary history, Chicago labor history, and neighborhood struggles against displacement. Artists including Ray Patlan, Jose Guerrero, Aurelio Diaz, Mario Castillo, and others created works that are themselves anti-displacement tools: developers have avoided buildings with murals for fear of public backlash.",
    source: "Fort, The Murals of Pilsen (2012); National Museum of Mexican Art mural archives",
  },
  WallOfRespect: {
    term: "Wall of Respect",
    short: "1967 Chicago mural that launched the global community-mural movement.",
    long:
      "The Wall of Respect was a mural painted in 1967 by the Organization of Black American Culture (OBAC) on the side of a two-story building at 43rd and Langley. Forty portraits of Black heroes. The wall stood until a 1971 fire. Its influence was enormous: the global community-mural movement, including the Chicano mural movement in Pilsen and the Latino mural movement in the Mission in San Francisco, trace their origin to it.",
    era: "1967 to 1971",
    source: "Huebner, The Wall of Respect (2015)",
  },
  CommunityBenefits: {
    term: "Community Benefits Agreement",
    short: "Contract between a developer and a community coalition on project outcomes.",
    long:
      "A Community Benefits Agreement is a negotiated private contract between a developer and a coalition of community organizations, committing the developer to specific job, affordability, environmental, and funding commitments. The Los Angeles Staples Center CBA (2001) is the most-studied U.S. example. Chicago's Obama Presidential Center CBA fight (2017-2021) was a landmark case, though its outcome was mixed.",
    source: "Gross, Community Benefits Agreements (2005)",
  },
  CommunityControl: {
    term: "Community control",
    short: "Neighborhood residents holding formal decision-making power over local institutions.",
    long:
      "Community control is the principle that residents should hold formal decision-making power over institutions affecting their neighborhoods: schools, police, land use, housing. The concept comes from the 1960s-70s Black Power and student movements. Chicago has implemented versions of community control at various scales: Local School Councils (1988), Police District Councils (2022), aldermanic participatory budgeting, and neighborhood development corporations.",
    source: "Reed, Class Notes (2000); Marable, Beyond Black and White (1995)",
  },

  /* -------------- Economic / finance terms -------------- */
  Subprime: {
    term: "Subprime",
    short: "High-risk, high-interest mortgages that fueled the 2008 crash.",
    long:
      "Subprime mortgages were issued to borrowers with weaker credit or less collateral, typically at higher interest rates. Between 2000 and 2007, subprime lending exploded and was disproportionately targeted at Black and Latino neighborhoods. When housing prices stalled and then fell, subprime defaulted first, triggering the 2008 financial crisis. Chicago's South and West sides were devastated; foreclosure rates in some neighborhoods exceeded 30%.",
    source: "Taylor, Race for Profit (2019); Federal Reserve Bank of Chicago subprime crisis analyses",
  },
  MansionTax: {
    term: "Mansion tax",
    short: "Higher tax rate on high-value real-estate sales.",
    long:
      "A mansion tax (or graduated real-estate transfer tax) charges a higher rate on property sales above a threshold. Chicago's 'Bring Chicago Home' 2024 referendum proposed a graduated structure with the revenue dedicated to homelessness services. The referendum failed narrowly. New York State and several other jurisdictions have mansion taxes. They raise revenue without broad-based property-tax increases.",
    source: "Bring Chicago Home coalition; NYS Real Property Transfer Tax",
  },
  TIFAffordable: {
    term: "TIF-affordable allocation",
    short: "Requiring a portion of a TIF's revenue to fund affordable housing.",
    long:
      "TIF-affordable allocations require a portion of a Tax Increment Financing district's revenue to fund affordable housing, either inside the district or at a pooled fund. Chicago's original TIF design had no such requirement; reforms since 2017 have added affordable-housing carve-outs for specific TIF districts. The proportion varies widely.",
    source: "Chicago TIF Ordinance amendments; Civic Federation TIF reports",
  },

  /* -------------- Transportation -------------- */
  CTA: {
    term: "CTA",
    short: "Chicago Transit Authority. Buses and L trains.",
    long:
      "The Chicago Transit Authority operates bus and rail transit in Chicago and 35 suburbs. Founded 1947, consolidating earlier private streetcar and elevated companies. CTA runs the Red, Blue, Brown, Green, Orange, Pink, Purple, and Yellow rail lines, plus 127 bus routes. Annual ridership has varied; pre-pandemic it was about 490M, post-pandemic about 300M. The Red Line Extension is the largest current expansion project.",
    source: "CTA historical records",
  },
  Divvy: {
    term: "Divvy",
    short: "Chicago's bike-share system.",
    long:
      "Divvy is Chicago's bike-share system, launched in 2013. It has about 600 stations and 8,000 bikes and e-bikes. Station siting has been geographically uneven, with denser coverage downtown and on the North Side than on the South and West sides. Recent expansions have begun closing that gap.",
    source: "Chicago Department of Transportation Divvy program records",
  },
  Metra: {
    term: "Metra",
    short: "Chicago's commuter rail system.",
    long:
      "Metra operates 11 commuter-rail lines connecting Chicago to its suburbs. It serves about 230,000 daily riders pre-pandemic. The Electric Line, following the route of the original Illinois Central, runs from Millennium Station through the South Side and into the south suburbs. Metra fares are significantly higher than CTA, creating de facto class-and-race transit tiering.",
    source: "Regional Transportation Authority; Metra ridership reports",
  },
  Pace: {
    term: "Pace",
    short: "Chicago suburban bus system.",
    long:
      "Pace operates suburban bus routes in the six-county Chicago region. Its routes connect to CTA at several transfer points. Pace has pioneered bus-on-shoulder service on the Stevenson Expressway. Service quality is uneven: lower-density suburbs have limited service, creating transportation-access gaps for low-income workers.",
    source: "Pace suburban bus ridership data",
  },
};
