/**
 * The Parkhaven Almanac.
 *
 * A long-form reference that expands the codex with more detailed
 * historical context. The Almanac is organized as chapters, each
 * covering a specific theme or era. Each chapter is a sequence of
 * sections with a heading, body, and optional source attribution.
 *
 * The Almanac is narrative and informational. It does not affect
 * gameplay mechanics. Players may browse it from the Pause menu
 * when the UI wires it up.
 */

export interface AlmanacSection {
  heading: string;
  body: string;
  /** Source note shown below the section */
  source?: string;
  /** Pull-quote shown in a callout */
  quote?: { text: string; attribution: string };
}

export interface AlmanacChapter {
  id: string;
  title: string;
  subtitle: string;
  /** Ordered list of sections */
  sections: AlmanacSection[];
  /** Related codex-entry ids */
  relatedCodex?: string[];
  /** Decade range this chapter most directly covers */
  decades: number[];
}

export const ALMANAC: AlmanacChapter[] = [
  /* =============================================================== */
  /*  Chapter 1: The HOLC Map                                         */
  /* =============================================================== */
  {
    id: "chap-holc",
    title: "The HOLC Map",
    subtitle: "How a federal agency drew the lines that made Parkhaven.",
    decades: [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2030],
    sections: [
      {
        heading: "The problem the New Deal was solving",
        body:
          "In 1933, about half of American mortgages were in default. Most home loans had been short-term (three to five years), interest-only, with a balloon payment at the end. When the Depression hit, millions of families could not refinance the balloon, and the banks could not take losses at scale. The federal government's answer was the Home Owners' Loan Corporation, chartered June 13, 1933. HOLC issued long-term, amortized mortgages — the thirty-year fixed-rate mortgage that Americans still use was invented here. In three years HOLC refinanced about a million mortgages, roughly a tenth of all owner-occupied homes.",
        source: "Fishback et al., 'The New Deal and the Great Migration' (2020)",
      },
      {
        heading: "The maps",
        body:
          "HOLC's Division of Research and Statistics hired local real-estate appraisers to survey every neighborhood in 239 cities. The surveyors assigned grades A through D, colored on maps: green, blue, yellow, red. The nominal metric was risk of mortgage default over the next decade. The actual content of the grade reports, digitized and published by the Mapping Inequality project at the University of Richmond, shows the grades tracking race almost perfectly. A surveyor's note on a Chicago D-zone from 1940 reads: 'This area contains a heavy concentration of Negro population.' The note on a nearby A-zone reads: 'This is a restricted area; infiltration has been prevented.'",
        source: "University of Richmond Mapping Inequality project; HOLC Chicago Area Report (1940)",
        quote: {
          text: "Infiltration of Negroes and Mexicans; detrimental influences of transit and industry; mixed residential character.",
          attribution: "HOLC surveyor, Chicago South Side D-zone, 1940",
        },
      },
      {
        heading: "Why the maps mattered",
        body:
          "The HOLC grades by themselves were not decisive. What made them decisive was that the Federal Housing Administration, the much larger federal mortgage-insurance program, adopted them. The FHA's underwriting manual, first issued 1938, instructed appraisers to mark down properties in or near D-zones. Without FHA insurance, private banks would not lend. The maps became a self-fulfilling prophecy: D-zone homes could not get mortgages, so their values stagnated, so they were risky to lend in, so they could not get mortgages. For three decades, federal policy systematically denied Black neighborhoods the capital that built white suburban wealth.",
        source: "Rothstein, The Color of Law (2017), ch. 4",
      },
      {
        heading: "Measuring the damage, 80 years later",
        body:
          "A 2018 study by the National Community Reinvestment Coalition tracked every 1940 HOLC neighborhood forward to 2018. The headline finding: 74% of neighborhoods the HOLC maps redlined are still low-to-moderate income today. A 2020 study by Richard Rothstein and the Economic Policy Institute estimated that the missing wealth — the capital that would have accumulated in these neighborhoods under non-discriminatory lending — is a material portion of the present-day racial wealth gap. A 2022 study in Health Affairs linked redlining to present-day disparities in childhood asthma and elder heat-mortality rates.",
        source: "NCRC, HOLC Redlining Maps: The Persistent Structure of Segregation (2018); Nardone et al., Health Affairs (2022)",
      },
      {
        heading: "Parkhaven's map",
        body:
          "Parkhaven's parcels inherit 1940 HOLC grades. Your ward has a mix: the north blocks are mostly B (blue), trending to A (green) in the corners; the central blocks are C (yellow) with some B; the south blocks are D (red), with C at the edges. The grades locked at start. No card in the game re-grades them — that is a federal, systemic decision, not a ward-level one. But many cards and events adjust values, conditions, and memories of D-grade parcels, which is where most of your long-term equity work happens.",
      },
    ],
    relatedCodex: ["policy-redlining"],
  },

  /* =============================================================== */
  /*  Chapter 2: The Great Migration                                 */
  /* =============================================================== */
  {
    id: "chap-migration",
    title: "The Great Migration",
    subtitle: "Six million people moved north. Your ward was one destination.",
    decades: [1910, 1920, 1930, 1940, 1950, 1960, 1970],
    sections: [
      {
        heading: "The numbers",
        body:
          "Between 1916 and 1970, six million Black Americans left the South for the North and West. Chicago was one of the largest destinations. Between 1910 and 1960, Chicago's Black population grew from 44,000 to 813,000, a factor of nineteen. New York, Detroit, Philadelphia, Cleveland, Pittsburgh, and Los Angeles saw comparable growth. The Migration is the largest internal population movement in American history.",
        source: "Wilkerson, The Warmth of Other Suns (2010)",
      },
      {
        heading: "The drivers",
        body:
          "The push was Southern violence and Southern agricultural collapse. Between 1877 and 1950, about 4,400 documented lynchings, mostly in the South. The boll weevil (1890s-1920s) wrecked cotton. Mechanization (1940s-1960s) replaced most cotton labor. The pull was wartime industrial demand: World War I (1914-1918) and World War II (1939-1945) both dramatically expanded Northern manufacturing, and both times Black Southerners were offered industrial jobs they could not get in the South. The Chicago Defender's 'Great Northern Drive' editorials in 1917 specifically called for Southern Black readers to come north; Pullman porters distributed the paper across the South.",
        source: "Grossman, Land of Hope (1989); Wilkerson, The Warmth of Other Suns (2010)",
      },
      {
        heading: "The Black Belt",
        body:
          "Arriving Black Chicagoans could only legally rent in a narrow strip along South State Street and South Wabash Avenue, known as the Black Belt. By 1940 the Black Belt was the most densely populated neighborhood in Chicago: 375,000 people on roughly 7 square miles. Restrictive covenants barred sales or rentals outside the Belt. When the Belt overflowed — as it did constantly from 1916 onward — the pressure forced incremental expansion block by block, usually followed by white-resident violence. The 1919 Chicago Race Riots killed 38 people over five days after a Black teenager was stoned to death at the 29th Street Beach.",
        source: "Drake and Cayton, Black Metropolis (1945); Tuttle, Race Riot (1970)",
        quote: {
          text: "Chicago is segregated as cleanly as a salad: lettuce here, tomato there, egg on top, dressing on the side.",
          attribution: "Richard Wright, 12 Million Black Voices (1941), paraphrase",
        },
      },
      {
        heading: "Bronzeville",
        body:
          "The Black Belt's heart was Bronzeville, the corridor along South Parkway (now Martin Luther King Drive) from 22nd Street to 55th Street. From the 1920s through the 1950s Bronzeville was the cultural and commercial capital of Black Chicago. It produced the Chicago Defender, the Negro Leagues American Giants, the Regal Theater, the Savoy Ballroom, the Ida B. Wells house, and writers including Richard Wright, Gwendolyn Brooks, Lorraine Hansberry, Margaret Burroughs, and Langston Hughes (who summered there). St. Louis Blues, gospel music as an institutional form, electric blues, and Chicago jazz all emerged from or through Bronzeville. When urban renewal, the Dan Ryan Expressway, and the Robert Taylor Homes hit the corridor through the 1950s and 60s, they hit Black American culture as infrastructure.",
        source: "Drake and Cayton, Black Metropolis (1945); Green, Selling the Race (2007)",
      },
      {
        heading: "Mexican migration",
        body:
          "The Great Migration is usually told as a Black story; it was also a Mexican one. Between 1916 and 1930 the Mexican-American population in Chicago grew from about 1,000 to 20,000, primarily labor brought north by the meatpackers and the steel mills. The Repatriation Acts of the 1930s deported or forcibly returned about 500,000 people to Mexico, including U.S. citizens; Chicago's Mexican population dropped. It rebuilt after 1940. By 1960 Pilsen and Little Village were Chicago's largest Mexican-American neighborhoods. Demographics, labor, and political organizing overlap the Black Migration story throughout.",
        source: "Balderrama and Rodríguez, Decade of Betrayal (2006); Arredondo, Mexican Chicago (2008)",
      },
    ],
    relatedCodex: ["event-great-migration", "hood-bronzeville", "hood-pilsen"],
  },

  /* =============================================================== */
  /*  Chapter 3: Urban Renewal and Expressways                       */
  /* =============================================================== */
  {
    id: "chap-renewal",
    title: "Urban Renewal and Expressways",
    subtitle: "The federal government paid to demolish neighborhoods. Chicago took the money.",
    decades: [1940, 1950, 1960, 1970],
    sections: [
      {
        heading: "Title I",
        body:
          "The 1949 Housing Act created two programs that reshaped American cities. Title I funded local governments to acquire and demolish 'blighted' urban land for private redevelopment. Title III funded new public-housing construction. Between 1949 and 1974, Title I paid for about 2,500 urban-renewal projects, demolishing roughly 600,000 housing units and displacing about 2 million people. Two thirds of those displaced were Black.",
        source: "Federal Highway Administration; Gotham, 'Missed Opportunities' (2000)",
        quote: {
          text: "Urban renewal means Negro removal.",
          attribution: "James Baldwin, KQED interview (1963)",
        },
      },
      {
        heading: "The Hyde Park laboratory",
        body:
          "The University of Chicago ran one of the country's most aggressive urban-renewal campaigns. Between 1952 and 1967, the University demolished or rehabilitated hundreds of buildings in a ten-block radius around its campus. The Hyde Park-Kenwood Urban Renewal Plan (1958) was the first such plan in the country to use the term 'urban renewal.' The University's rationale was crime and decay; the result was the demolition of the Black neighborhoods immediately south and west of campus, while preserving the racially integrated core. The integrated neighborhood that Hyde Park remains today is built on that demolition.",
        source: "Hirsch, Making the Second Ghetto (1983); Rotella, World's Greatest City (2012)",
      },
      {
        heading: "The expressways",
        body:
          "The 1956 Federal-Aid Highway Act funded 41,000 miles of interstate at 90% federal matching. Most of the system built surface highways through open country, but about 2,000 miles were urban interstates. Route selection for urban stretches was routinely political. In Chicago, the Dan Ryan Expressway (I-90/94, completed 1962) was widened from 8 to 14 lanes in 1967 at Mayor Daley's direction, explicitly to keep Black South Side population east of Halsted Street. The Eisenhower Expressway (I-290, completed 1961) was routed through the primarily Italian and Greek Taylor Street corridor, demolishing thousands of housing units. The Kennedy (I-90 Northwest) and the Stevenson (I-55) had less racialized sitings but also displaced thousands.",
        source: "Mohl, The Interstates and the Cities (2008); Hirsch, Making the Second Ghetto (1983)",
      },
      {
        heading: "Public housing: high-rises",
        body:
          "Title III of the 1949 act funded public-housing construction. Elizabeth Wood, CHA's first executive director, had pushed for integrated, low-rise public housing scattered across the city. The 1951-52 Trumbull Park riots, in which a white mob in South Deering tried to drive out a single Black family who had moved into a CHA rowhouse, gave Mayor Kennelly the political cover to push Wood out. The high-rise era followed. Robert Taylor Homes (28 identical 16-story buildings along State Street, 1961-62), Stateway Gardens (1955), Dearborn Homes (1950), Harold Ickes Homes (1955), and Ida B. Wells Extension (1954) all concentrated Black residents in tower blocks on the State Street corridor. White aldermen had vetoed all CHA proposals outside Black neighborhoods; the State Street corridor was the only place the political system would allow building.",
        source: "Hunt, Blueprint for Disaster (2009); Hirsch, Making the Second Ghetto (1983)",
      },
      {
        heading: "Public housing: deterioration",
        body:
          "The towers deteriorated faster than anyone had planned. Federal capital funding never met maintenance needs. Concentrating poverty produced the social problems that concentration of poverty produces. By 1980 the South Side towers were functional prisons; by 1990 many were barely habitable. Reagan-era HUD funding cuts accelerated the decay. The Plan for Transformation, launched 1999 under Mayor Richard M. Daley, demolished most of the high-rises over 15 years. The demolition is documented; the replacement commitment was not fully honored. CHA's 2020 tower footprint is roughly 10% of its 1970 peak.",
        source: "Hunt, Blueprint for Disaster (2009); Chaskin and Joseph, Integrating the Inner City (2015)",
      },
    ],
    relatedCodex: ["event-plan-for-transformation", "inst-cha", "policy-section8"],
  },

  /* =============================================================== */
  /*  Chapter 4: The Long 1960s                                      */
  /* =============================================================== */
  {
    id: "chap-long-60s",
    title: "The Long 1960s",
    subtitle: "King comes north. Hampton rises. The city burns, then keeps going.",
    decades: [1960, 1970],
    sections: [
      {
        heading: "The Chicago Freedom Movement",
        body:
          "In January 1966, Dr. King moved his family into a North Lawndale tenement for the SCLC's first major Northern campaign. The Chicago Open Housing Movement targeted racial covenants, blockbusting, and de facto school segregation. On August 5, 1966, a march into Marquette Park — an all-white Southwest Side neighborhood — drew a violent counter-protest. King was struck in the head by a thrown rock. He said: 'I have seen many demonstrations in the South, but I have never seen anything so hostile and so hateful as I've seen here today.' The campaign ended with the Summit Agreement in August 1966: Mayor Daley, the CHA, and Chicago real-estate boards agreed on paper to fair-housing commitments. In practice Daley never enforced it.",
        source: "Ralph, Northern Protest (1993); Garrow, Bearing the Cross (1986)",
      },
      {
        heading: "The West Side burns",
        body:
          "Dr. King was assassinated April 4, 1968. The West Side uprisings began that evening. Over four days, fires consumed four square miles along West Madison and Roosevelt Road. Mayor Daley, in his most-quoted order, directed police to 'shoot to kill' arsonists and 'shoot to maim' looters. Eleven people died in Chicago. Fifty years later, the Madison-Roosevelt corridor had not recovered. Lawndale's population in 2020 was about a third of its 1960 peak. The uprisings accelerated white flight and institutional disinvestment across the West Side.",
        source: "Gitlin and Hollander, Uptown (1970); Chicago Tribune April 1968 coverage",
      },
      {
        heading: "The 1968 DNC",
        body:
          "The Democratic National Convention came to Chicago August 26-29, 1968. Antiwar protesters organized large demonstrations at Grant Park and Lincoln Park. Chicago Police, under Daley's direct instruction, responded with sustained beatings of protesters and journalists. The Walker Report to the National Commission on the Causes and Prevention of Violence (published December 1968) called it 'a police riot.' The Chicago Seven trial followed. Nationally televised footage of the police response shaped a generation's view of both Chicago and the Democratic Party.",
        source: "Farber, Chicago '68 (1988); Walker Report (1968)",
      },
      {
        heading: "Fred Hampton",
        body:
          "Fred Hampton, chairman of the Illinois Black Panther Party, was 21 when Chicago police killed him in his sleep on December 4, 1969. Hampton had founded the Rainbow Coalition — the original Rainbow Coalition — uniting the Panthers with the Young Lords (Puerto Rican) and Young Patriots (poor white Southern Chicagoans). Survival Programs included free breakfast for 3,500 children daily, a free medical clinic, community legal aid, and sickle-cell testing. The FBI's COINTELPRO program, the Chicago Police Department's Gang Intelligence Unit, and Cook County State's Attorney Edward Hanrahan jointly organized the raid. The FBI supplied the apartment floor plan. Ballistics showed police fired 90+ shots; the Panthers fired one. Hanrahan lost re-election in 1972 to Bernard Carey, partly over the raid.",
        source: "Haas, The Assassination of Fred Hampton (2010); Williams, From the Bullet to the Ballot (2013)",
        quote: {
          text: "You can kill the revolutionary, but you can't kill the revolution.",
          attribution: "Fred Hampton, 1969",
        },
      },
      {
        heading: "Gautreaux",
        body:
          "Dorothy Gautreaux was a CHA tenant at the Altgeld-Murray Homes and an NAACP organizer. In 1966 she and other tenants, represented by attorney Alexander Polikoff, sued CHA and HUD for racial discrimination in public-housing siting. The lawsuit argued that CHA's siting concentrated Black residents in Black neighborhoods in violation of the 14th Amendment. The litigation was long. Hills v. Gautreaux (1976) ruled unanimously in the plaintiffs' favor and allowed an inter-county remedy. The Gautreaux Assisted Housing Program, run by the Leadership Council for Metropolitan Open Communities, relocated about 7,000 Black families to majority-white neighborhoods, mostly in suburban Cook County and the collar counties. James Rosenbaum's longitudinal research documented significant educational and employment gains for participating families, with effects persisting into the second generation.",
        source: "Polikoff, Waiting for Gautreaux (2006); Rubinowitz and Rosenbaum, Crossing the Class and Color Lines (2000)",
      },
    ],
    relatedCodex: ["person-fred-hampton", "person-dorothy-gautreaux", "event-freedom-movement-chicago"],
  },

  /* =============================================================== */
  /*  Chapter 5: Contract Buying and the CBL                         */
  /* =============================================================== */
  {
    id: "chap-contract-buying",
    title: "Contract Buying and the CBL",
    subtitle: "The biggest wealth transfer you've never heard of.",
    decades: [1940, 1950, 1960, 1970],
    sections: [
      {
        heading: "How contract buying worked",
        body:
          "From about 1940 to the early 1970s, Black home-buyers in Chicago were largely shut out of conventional mortgages. Banks would not lend in the HOLC D-zones; the FHA would not insure. Into the gap stepped contract sellers. A speculator would buy a house cheap in a transitioning neighborhood and resell it 'on contract' at a heavy markup — often double or triple the purchase price. The buyer signed a long-term installment contract, made monthly payments, but never held title until every payment was made. Miss one payment and the seller could rescind the contract and keep everything already paid. The buyer had no equity, no recourse, and no legal protection.",
        source: "Satter, Family Properties (2009); Duke Cook Center, The Plunder of Black Wealth in Chicago (2019)",
      },
      {
        heading: "The scale",
        body:
          "A 2019 Duke Cook Center study estimated that contract sellers extracted between $3.2 billion and $4 billion (in 2019 dollars) from Black Chicago between 1955 and 1975. Eighty-five percent of Black homes in Chicago bought in that period were bought on contract. The per-family wealth extraction was between $71,000 and $86,000, in 2019 dollars. For context: Ta-Nehisi Coates's 2014 Atlantic essay 'The Case for Reparations' centered one North Lawndale family (the Ross family) whose contract purchase cost roughly the equivalent of their home itself in wealth stripped.",
        source: "Duke Cook Center, The Plunder of Black Wealth in Chicago (2019)",
      },
      {
        heading: "The Contract Buyers League",
        body:
          "The Contract Buyers League formed in 1968 in Lawndale. Ruth Wells, Charles Baker, Clyde Ross, and Sister Carol Marie Sgarlata organized a strike: 500 families stopped making payments simultaneously, demanding either renegotiation or foreclosure challenges. The strike ran through 1969 and 1970. Contract sellers tried to evict; the CBL organized legal support. By 1972 the CBL had secured renegotiations for 95% of participating families. The savings — about $30,000 per family in today's dollars — amounted to about $15 million recovered from the sellers.",
        source: "Satter, Family Properties (2009); Chicago History Museum CBL collection",
      },
      {
        heading: "Why it kept happening",
        body:
          "Contract buying ended not because the law caught up — the law barely changed — but because the market shifted. As Section 235 (1968) and then the 1974 CDBG program opened conventional lending to Black buyers, the extractive premium that supported contract buying collapsed. But the structure never fully disappeared. Contemporary 'contract for deed' arrangements, 'rent-to-own' schemes, and the post-2008 investor boom in Southside rental single-family homes echo the original mechanism. The Consumer Financial Protection Bureau has flagged modern variants; local organizing against them continues.",
        source: "CFPB enforcement actions on contract-for-deed; Taylor, Race for Profit (2019)",
      },
    ],
    relatedCodex: ["policy-redlining", "policy-fair-housing"],
  },

  /* =============================================================== */
  /*  Chapter 6: Harold Washington                                   */
  /* =============================================================== */
  {
    id: "chap-washington",
    title: "Harold Washington",
    subtitle: "The mayor who broke the machine — for four years.",
    decades: [1970, 1980],
    sections: [
      {
        heading: "The coalition",
        body:
          "Harold Washington did not win Chicago's 1983 mayoral election by a machine handoff. He won by a two-decade organizing project that predated his candidacy. Black political infrastructure — the ministerial alliance, the Black aldermanic caucus, the independent business leaders, Rev. Jesse Jackson's PUSH, the civil-rights litigation bar — had been building toward the win since the 1966 Chicago Freedom Movement. In 1981, the Byrne administration's management of the CHA, the schools, and the 1979 snowstorm alienated the Black electorate enough to make a challenge feasible. The February 1983 Democratic primary was a three-way between incumbent Mayor Jane Byrne, State's Attorney Richard M. Daley, and Washington. Byrne and Daley split the white vote; Washington won the Black vote with 85% turnout and 82% share.",
        source: "Rivlin, Fire on the Prairie (1992); Grimshaw, Bitter Fruit (1992)",
      },
      {
        heading: "The general election",
        body:
          "Chicago's Democratic primary normally determined the mayoralty; Republicans had not won since 1927. The 1983 general election was different. Republican Bernard Epton, a moderate state representative, ran an overtly racial campaign. 'Before it's too late' was the slogan, widely understood to mean 'before a Black mayor is elected.' Many white Democrats, led by Alderman Edward Vrdolyak, defected to Epton. Washington won 51.4% to 48%. His inauguration was April 29, 1983.",
        source: "Rivlin, Fire on the Prairie (1992)",
      },
      {
        heading: "Council Wars",
        body:
          "The city council opposition organized immediately. Vrdolyak's bloc of 29 aldermen (all white) held 29-21 majorities on most procedural votes. Substantive votes deadlocked 25-25 (Washington had some flexibility among the 21, the Vrdolyak 29 did not). The Council Wars ran from May 1983 to May 1986, effectively paralyzing most administrative initiatives. Federal Judge Charles Kocoras's 1985 redistricting ruling in Ketchum v. Byrne restored competitive districts. The March 1986 special elections flipped enough seats to give Washington a 25-25 council with his tie-breaking vote. Roughly 90 substantive ordinances passed in the 18 months between May 1986 and Washington's November 25, 1987 death.",
        source: "Rivlin, Fire on the Prairie (1992); Ketchum v. Byrne, 740 F.2d 1398 (7th Cir. 1984)",
      },
      {
        heading: "What Washington did",
        body:
          "Washington's administration redirected city resources away from downtown and toward neighborhoods. The 1984 Chicago Development Plan allocated a majority of CDBG and capital funds to neighborhoods for the first time. Minority-owned business contracting rose from 3% to 25%. Public-housing management was reorganized. The 1986 Residential Landlord and Tenant Ordinance passed. The administration was also ideologically serious in a way Chicago mayors rarely are: Washington was a policy reader, a habit that shaped the administration's internal culture and policy output.",
        source: "Grimshaw, Bitter Fruit (1992); Fuchs, Mayors and Money (1992)",
      },
      {
        heading: "Death and succession",
        body:
          "Washington died of a heart attack at his desk on November 25, 1987, at age 65. The council's November 1987 meeting to elect an acting mayor was a classic Chicago political brawl. Alderman Eugene Sawyer, a Black Daley-era veteran, won 29-19 over Alderman Tim Evans, broadly seen as Washington's heir. The Sawyer election was widely interpreted as a machine reconstitution. Richard M. Daley won the February 1989 special election. The Washington coalition did not hold. The CTU and SEIU endorsements that elected Brandon Johnson in 2023 traced political lineage directly back to the Washington organizing infrastructure.",
        source: "Rivlin, Fire on the Prairie (1992); Grimshaw, Bitter Fruit (1992)",
      },
    ],
    relatedCodex: ["person-harold-washington", "concept-community-control"],
  },

  /* =============================================================== */
  /*  Chapter 7: The 1995 Heat Wave                                  */
  /* =============================================================== */
  {
    id: "chap-heat-wave",
    title: "The 1995 Heat Wave",
    subtitle: "A five-day test of every ward's social infrastructure.",
    decades: [1990],
    sections: [
      {
        heading: "The storm",
        body:
          "From July 12 to July 16, 1995, Chicago's high temperatures held between 99°F and 106°F, with overnight lows refusing to drop below 84°F. Relative humidity pushed heat indexes above 120°F. The city's combined-sewer system overflowed. The power grid, stressed by record air-conditioning demand, failed in patches. Hospital emergency rooms reached capacity. Ambulances were delayed two to three hours. Morgue capacity was overwhelmed; refrigerated trucks were brought in to hold the dead.",
        source: "Klinenberg, Heat Wave (2002); CDC MMWR 1995 reports",
      },
      {
        heading: "The toll",
        body:
          "The Cook County medical examiner attributed 465 deaths to the heat over five days; the CDC's retrospective estimate, accounting for excess mortality across categories, was 739. The victims were disproportionately older (median age 75), disproportionately Black (55% of deaths; 39% of population), and disproportionately isolated. Clusters emerged in specific wards: North Lawndale, Grand Boulevard, Washington Park, Roseland, and South Chicago all had mortality rates 3-5 times the city average. Lincoln Park, Lakeview, and the North Side lakefront wards had mortality rates at or below expected baseline.",
        source: "Klinenberg, Heat Wave (2002); Whitman et al., American Journal of Public Health (1997)",
      },
      {
        heading: "The sociology",
        body:
          "Eric Klinenberg's 'Heat Wave' (2002) is the canonical analysis. Klinenberg compared two neighborhoods at similar poverty levels but dramatically different outcomes: North Lawndale (high mortality) and Little Village (low mortality). The difference he found was social infrastructure. Little Village had dense street life, functional commercial corridors where elderly residents shopped daily, active block clubs, and churches that knew their elderly parishioners by name. North Lawndale had lost most of its commercial corridor to disinvestment. Elderly residents more often lived alone and saw no one for days at a time. When the heat hit, the Little Village neighborhood's social capital functioned as a check-in system; Lawndale's had largely disappeared.",
        source: "Klinenberg, Heat Wave (2002)",
      },
      {
        heading: "The city response",
        body:
          "Mayor Richard M. Daley's immediate response was to deny the scale of the crisis. His July 18 press conference dismissed the mortality count. The Commissioner of Health, Sheila Lyne, was fired soon after. The city's long-term response was more constructive: the Office of Emergency Management was reorganized, cooling-center protocols were codified, a heat-emergency warning system was established. Chicago's 2012 Climate Action Plan includes specific heat-vulnerability policies informed by the 1995 event. Per-capita tree canopy funding is explicitly redistributive.",
        source: "Klinenberg, Heat Wave (2002); Chicago Climate Action Plan (2012, updated 2022)",
      },
      {
        heading: "The pattern repeats",
        body:
          "Climate projections suggest longer and more intense heat waves for the Midwest through the 2030s. The 2022 heat dome killed hundreds in the Pacific Northwest. The 2023 European heat wave killed thousands across the Mediterranean. Chicago's 2012 and 2022 Climate Action Plans and the 2021 Urban Heat Island Mitigation Plan all treat the 1995 event as the standing reference scenario. Neighborhood-scale preparedness — cooling centers, block-club check-in systems, functional commercial corridors — is what Klinenberg's analysis keeps recommending.",
        source: "Fourth National Climate Assessment; Chicago Department of Public Health heat-vulnerability reports",
      },
    ],
    relatedCodex: ["event-1995-heat-wave", "concept-displacement"],
  },

  /* =============================================================== */
  /*  Chapter 8: The 2008 Foreclosure Crisis                         */
  /* =============================================================== */
  {
    id: "chap-2008-crisis",
    title: "The 2008 Foreclosure Crisis",
    subtitle: "Chicago's South and West sides were ground zero.",
    decades: [2000, 2010],
    sections: [
      {
        heading: "The lead-in",
        body:
          "Between 2000 and 2007, subprime mortgage lending in Chicago grew from about 3% of originations to roughly 25%. The volume was not evenly distributed. A 2009 Woodstock Institute study found that in majority-Black Chicago neighborhoods, subprime loans made up 55% of originations by 2006. In majority-white neighborhoods, the comparable figure was 12%. Lenders including Countrywide, New Century, and Ameriquest actively targeted these neighborhoods. Mortgage brokers operating in them received higher commission rates for placing borrowers in subprime rather than prime products, even when the borrower qualified for prime.",
        source: "Woodstock Institute, Paying More for the American Dream (2009)",
      },
      {
        heading: "The crash",
        body:
          "Housing prices stalled in 2006, turned down in 2007. Adjustable-rate subprime mortgages, designed to reset to higher payments after a 2-3 year teaser period, began resetting into defaults. By late 2007 the first wave of Southside Chicago foreclosures hit the news. By 2008 it was systemic. Chicago's quarterly foreclosure filing peaked at around 7,200 in Q4 2009; some South Side community areas had filings on one in every four occupied homes.",
        source: "Federal Reserve Bank of Chicago foreclosure reports",
      },
      {
        heading: "The speculators",
        body:
          "As foreclosures accumulated, institutional investors and LLC-structured 'flipper' firms bought bulk inventory at auction. A 2018 Chicago Reporter study found that about 40% of post-2009 single-family-home purchases in the most-hit South Side community areas went to LLC buyers, most not local. These investors typically held, rented, and sometimes flipped. Maintenance was often minimal; code violations accumulated. Vacancy rates in some blocks passed 30%. The institutional-landlord pattern that followed the 2008 crisis is the proximate ancestor of the current large-scale single-family rental market (Invitation Homes, American Homes 4 Rent, and their peers).",
        source: "Chicago Reporter 2018 investor-purchase series; Fields, 'Automated Landlord' (2022)",
      },
      {
        heading: "The recovery that wasn't",
        body:
          "The official recovery began in 2012 by most national metrics. Chicago's neighborhoods recovered on very different schedules. The North and Northwest sides had recovered to pre-crisis prices by 2014. The South and West sides had not recovered by 2020, and in several community areas they still have not. Research by Sampson and Winter at Harvard showed that the 2008 shock reshaped Chicago's demographic trajectory: population loss on the South and West sides in the 2010s correlates tightly with 2008-2012 foreclosure rates at the census-tract level.",
        source: "Sampson and Winter, 'Neighborhood Concentration of Poverty' (2018)",
      },
      {
        heading: "What we learned",
        body:
          "The policy response included the 2010 Dodd-Frank Act, the CFPB's creation, mortgage-servicing reforms, and the Neighborhood Stabilization Program (NSP) that funded local land banking. The lessons that didn't become policy: source-of-income discrimination against voucher holders, institutional-landlord regulation, proactive code enforcement against absentee LLC owners. Many of the same structural vulnerabilities remain. A crisis of a similar type in the 2020s or 2030s would likely find the same neighborhoods most exposed, though perhaps less targeted with the specific subprime product mix.",
        source: "Dodd-Frank Act; CFPB mortgage servicing rules; NSP program evaluations",
      },
    ],
    relatedCodex: ["event-2008-foreclosure", "concept-gentrification"],
  },

  /* =============================================================== */
  /*  Chapter 9: Climate and the Ward                                */
  /* =============================================================== */
  {
    id: "chap-climate",
    title: "Climate and the Ward",
    subtitle: "The local scale where adaptation happens.",
    decades: [2020, 2030],
    sections: [
      {
        heading: "The regional forecast",
        body:
          "The Fourth National Climate Assessment (2018) and Fifth Assessment (2023) both project that Chicago's climate by 2040 will resemble present-day St. Louis: warmer winters, hotter summers, more intense precipitation events, more days above 90°F. The combined-sewer system designed in the 1890s and partially upgraded in the 1960s and 70s is not adequate for the projected rainfall. The lakefront will see more erosion events; Lake Michigan levels have swung between 576 feet and 582 feet in the past decade, a wider range than the historical baseline.",
        source: "Fourth National Climate Assessment (2018); Fifth Assessment (2023); USACE Great Lakes water-level records",
      },
      {
        heading: "Flood and heat as local issues",
        body:
          "Climate adaptation is often discussed at national and state scales but is mostly implemented at ward and block scale. A bioswale installation happens on a specific block. A cooling center opens in a specific library. Tree planting follows a per-block budget. Chicago's Space to Grow program (2014-), which adds green infrastructure to CPS schoolyards, is an example of ward-scale climate policy. The policy gaps are uneven: Lawndale, Austin, Englewood, and similar disinvested wards have substantially less green infrastructure than comparable North Side wards, despite higher climate vulnerability.",
        source: "Space to Grow program evaluations; Chicago tree-canopy data",
      },
      {
        heading: "Energy and the built environment",
        body:
          "Residential buildings are about 30% of Chicago's carbon emissions. Retrofit is the main lever. The 2019 Chicago Energy Rating Ordinance requires large-building energy disclosures. The 2022 Chicago Building Decarbonization Working Group recommended electrification-first retrofits for income-restricted housing, but funding has lagged the recommendation. Programs including Illinois Solar For All (2019) have financed rooftop solar on low-income buildings, with Blacks in Green's Sustainable Square Mile in West Woodlawn as a neighborhood-scale demonstration.",
        source: "Chicago Energy Rating Ordinance; Illinois Solar For All",
      },
      {
        heading: "Transit and land-use as climate policy",
        body:
          "Transit-oriented development is climate policy: each household within a half-mile of frequent transit emits about 30-40% less carbon than the average U.S. household. Chicago's 2015 TOD ordinance allowed taller, denser construction within a quarter-mile of CTA stops; the 2019 and 2021 amendments extended the radius. The Red Line Extension (2024 FFGA, target revenue 2030) will add four stations to the far South Side. Pre-opening affordability covenants are the difference between TOD that reduces emissions and displacement, and TOD that reduces emissions and accelerates displacement.",
        source: "Chicago TOD Ordinance; FTA Red Line Extension EIS",
      },
      {
        heading: "Equity in the energy transition",
        body:
          "The 2035 ICE vehicle phase-out — proposed federally, adopted in various forms by California and other states — will affect wards unevenly. Charging infrastructure investment has lagged demand; the South and West sides have about 1/5 the charging density of the North Side per capita. Legacy auto repair shops, disproportionately Black and Latino owned, face skills-transition pressure. The Biden administration's 2022 Inflation Reduction Act provided some of the federal funding needed for equitable transition; the 2025 policy environment may or may not carry those programs forward.",
        source: "Chicago EV charging inventory; BLS auto service industry demographics",
      },
    ],
    relatedCodex: ["concept-gentrification", "concept-community-land-trust"],
  },

  /* =============================================================== */
  /*  Chapter 10: Tools You Have                                     */
  /* =============================================================== */
  {
    id: "chap-tools",
    title: "Tools You Have",
    subtitle: "A quick reference to the major policy levers the game models.",
    decades: [2020, 2030],
    sections: [
      {
        heading: "Zoning",
        body:
          "Zoning is the law that says what you can build and where. Euclidean zoning separates uses; form-based codes regulate building shape. Chicago is primarily Euclidean. Key moves: upzoning (allows more density), downzoning (restricts density), TOD overlays (density near transit), affordability requirements (percentage of units below market), form-based overlays (building shape flexibility). Your ward's aldermanic prerogative over zoning makes every case a politically-mediated decision.",
      },
      {
        heading: "Tax and finance",
        body:
          "The property tax is the primary local revenue source. TIF (Tax Increment Financing) freezes the tax base and redirects growth to a development fund. Property-tax freezes, abatements, and exemptions can provide relief but also erode the base. Transfer taxes are collected at sale; a mansion-tax variant taxes high-value transactions at a higher rate. Local baby-bond and reparations programs are newer tools with Evanston and Connecticut as precedents.",
      },
      {
        heading: "Land stewardship",
        body:
          "Community Land Trusts hold land permanently off the market. Publicly-owned land banks assemble parcels for later community-controlled development. Preservation overlays limit demolition. Scattered-site public housing distributes affordability across the ward rather than concentrating it. Tenant opportunity to purchase (TOPA) gives tenants first right of refusal when buildings go on the market.",
      },
      {
        heading: "Housing production and preservation",
        body:
          "LIHTC is the main federal funder of new affordable production. Public housing is built through CHA with federal capital and operating subsidies. Section 8 is tenant-side rental subsidy. Affordability covenants attached to market-rate developments (ARO) produce some on-site affordable units. Preservation programs (HOME, federal housing trust fund, IHDA) fund rehabilitation of existing affordable stock, often at lower per-unit cost than new production.",
      },
      {
        heading: "Tenant and landlord regulation",
        body:
          "Chicago's Residential Landlord and Tenant Ordinance (1986) established a framework. Good-cause eviction requires landlords to show cause; right-to-counsel in eviction provides tenants with legal representation. Source-of-income anti-discrimination (Illinois 2022) bars landlord refusal of Section 8. Just-cause lease nonrenewal, security-deposit regulation, notice periods — each is a specific regulatory move with measurable effects.",
      },
      {
        heading: "Community infrastructure",
        body:
          "Schools, libraries, clinics, parks, community centers, and social-infrastructure institutions are the ward-scale public goods. Their location, condition, and funding matter to every other dimension of the ward. Klinenberg's 'Palaces for the People' (2018) argues that the decline of public social infrastructure maps directly onto many of the problems (heat mortality, loneliness, civic disengagement) the game models.",
      },
      {
        heading: "Transit and mobility",
        body:
          "Transit investment raises land values. Pre-opening affordability covenants determine whether the investment gentrifies. Equitable charging infrastructure is the EV-era version. Micromobility (bike-share, scooter-share) has station-siting equity dimensions. Autonomous freight is an emerging labor and equity question.",
      },
      {
        heading: "Climate adaptation",
        body:
          "Green infrastructure (bioswales, trees, permeable pavement) manages stormwater and urban heat. Resilience hubs (buildings with power and water during grid failures) provide critical redundancy. Managed retreat from floodplains is a controversial but sometimes necessary tool. Energy-retrofit programs for existing buildings reduce emissions and bills simultaneously. Voluntary buyout programs for flood-exposed parcels are the adaptation lever the game models most directly.",
      },
    ],
    relatedCodex: ["policy-inclusionary", "policy-tif"],
  },
];

export const ALMANAC_BY_ID: Map<string, AlmanacChapter> = new Map(
  ALMANAC.map((c) => [c.id, c])
);

/** Get chapters that cover a given year */
export function chaptersForYear(year: number): AlmanacChapter[] {
  const decade = Math.floor(year / 10) * 10;
  return ALMANAC.filter((c) => c.decades.includes(decade));
}

/** Total section count, for progress display */
export function totalSectionCount(): number {
  return ALMANAC.reduce((sum, c) => sum + c.sections.length, 0);
}
