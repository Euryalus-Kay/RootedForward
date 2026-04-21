/**
 * Characters and factions.
 *
 * Named actors who appear in the game through events and who give
 * Parkhaven its population of recurring voices. The game engine
 * doesn't directly simulate each character, but their opinions
 * (which the UI can surface) give the ward texture.
 *
 * Every character is fictional. Several are composite portraits of
 * real Chicago archetypes. Each one's policy positions are drawn
 * from documented historical positions real Chicago figures held.
 */

export interface Character {
  id: string;
  name: string;
  /** Role in the ward's political life */
  role: string;
  /** One-line description */
  teaser: string;
  /** Long-form biography */
  bio: string;
  /** Whether this character exists only in certain eras */
  activeEras: ("1940s" | "1950s" | "1960s" | "1970s" | "1980s" | "1990s" | "2000s" | "2010s" | "2020s" | "2030s")[];
  /** Quoted line(s) this character offers in relevant events */
  voice: string[];
  /** Factions this character is aligned with */
  factions: string[];
}

export const CHARACTERS: Character[] = [
  {
    id: "eleanor-thompson",
    name: "Eleanor Thompson",
    role: "Block-club president, Eighteenth Street",
    teaser: "Sixty years on the block. Runs the Eighteenth Street Block Club. Knows every family.",
    bio:
      "Eleanor Thompson moved to Parkhaven in 1948 when her father took a meatpacking job at the Union Stock Yards. She raised four children in a three-flat on Eighteenth Street and has lived in the same building for seventy-odd years. She was a member of the Contract Buyers League in the late 1960s, organized her block club in 1972, and sat on the 1980s ward redistricting challenge committee. In 2020 she was the oldest active block-club president in the ward. She is your most reliable voice and your most honest critic.",
    activeEras: ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"],
    voice: [
      "The block is the unit. You forget that, you lose the ward.",
      "I remember when this street had four churches and a movie theater. Now we have a vape store. Progress, they call it.",
      "I've voted for every alderman in this ward since 1956. I've been disappointed by every one of them to one degree or another. That's how it works.",
      "If you're going to build something here, you better talk to the block first.",
      "My son couldn't afford to buy a place here anymore. My granddaughter is in Hyde Park.",
    ],
    factions: ["residents", "organizers"],
  },
  {
    id: "marcus-bell",
    name: "Rev. Marcus Bell",
    role: "Pastor, Parkhaven Baptist",
    teaser: "Third-generation pastor of Parkhaven Baptist. Sundays, he preaches. Mondays, he calls the mayor.",
    bio:
      "Rev. Marcus Bell is the third pastor of Parkhaven Baptist Church, following his grandfather and father. He was ordained in 1989, took the senior pulpit in 2001, and has overseen the congregation's growth from 400 to 1,200 members. The church runs a food pantry, an after-school program, a senior-center partnership, and a jobs-training program. Bell sits on the Bishop's Council and has twice endorsed in mayoral races. His uncle was arrested on the 1966 Marquette Park march; his aunt was a plaintiff in a 1972 fair-housing case. His pulpit carries that history.",
    activeEras: ["1990s", "2000s", "2010s", "2020s", "2030s"],
    voice: [
      "The pulpit is Sunday morning work. Monday morning is different work. The same work.",
      "We lost five parishioners in the heat wave. I read their names the next Sunday. They came back to me in the dreams.",
      "My grandfather used to say that the church and the block club are the same organization. He was right.",
      "I will sit down with anyone about anything. I have an opinion; I will tell it to you. That's it.",
      "When the police department did what they did to Laquan McDonald, I could not pretend that the law was a neutral thing.",
    ],
    factions: ["clergy", "organizers", "residents"],
  },
  {
    id: "lucia-alvarez",
    name: "Lucia Alvarez",
    role: "Tenant organizer, Parkhaven Rental Coalition",
    teaser: "Came up through Pilsen organizing. Knows every LLC landlord in the ward.",
    bio:
      "Lucia Alvarez started tenant organizing in Pilsen in the 2010s and moved to Parkhaven organizing in 2019. She runs the Parkhaven Rental Coalition, which coordinates tenant responses to mass evictions, rent hikes, and building sales. She speaks Spanish, English, and enough Polish to understand the older landlords' complaints. Her organizing model is Alinsky with fewer apologies. She has successfully pressured three landlords into selling buildings to tenant cooperatives.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "The landlord's LLC is in the Caymans. The eviction is at the Daley Center. I'm here in Parkhaven every Tuesday at seven.",
      "When the ARO passed in 2021, we read the fine print for three weeks before celebrating. Three weeks, and we still missed things.",
      "The thing about a rent strike is: it only works if everyone comes.",
      "I'm not an optimist. I'm an organizer. There's a difference.",
      "The tenant doesn't need you to tell them they deserve better. They need you to help them win.",
    ],
    factions: ["organizers", "tenants"],
  },
  {
    id: "james-o-connor",
    name: "James O'Connor",
    role: "Developer, O'Connor Construction",
    teaser: "Third-generation developer. Polished at the Union League Club. Not inflexible.",
    bio:
      "James O'Connor inherited a mid-size construction firm from his father in 2003. The firm builds about 200 units a year in Chicago and the collar counties. Under his leadership the firm has twice partnered with nonprofit affordable builders on joint-venture projects; the second was profitable, which surprised him. He's a centrist Democrat, donates to both wings of the party, and has a grudging respect for tenant organizers who do their research. He and Alvarez have publicly argued twice.",
    activeEras: ["2000s", "2010s", "2020s", "2030s"],
    voice: [
      "I can build you affordable or I can build you fast. Pick one, and I'll tell you the cost of the other.",
      "The opposition calls me names. The financing calls me a risk. I keep building.",
      "The ARO is what it is. I work within it. That's business.",
      "My grandfather built in Pilsen in the 1950s. He was a speculator. I don't defend it, but I do acknowledge it.",
      "Joint ventures are harder than flipping. They're also better.",
    ],
    factions: ["business"],
  },
  {
    id: "deborah-nkomo",
    name: "Dr. Deborah Nkomo",
    role: "Urban planner, UIC",
    teaser: "Professor, planning consultant, former city staff. The data in her head matters.",
    bio:
      "Dr. Deborah Nkomo teaches urban planning at the University of Illinois Chicago and consults for community-based organizations. She is a daughter of the Great Migration (her family arrived from Alabama in 1943), grew up in Washington Park, studied at Howard and Berkeley, and returned to Chicago in 1998. Her research focuses on property-tax assessment equity, displacement metrics, and participatory budgeting. Her 2019 report on Chicago TIF allocations is still cited in every ward-budget fight.",
    activeEras: ["2000s", "2010s", "2020s", "2030s"],
    voice: [
      "The math is unambiguous. The politics are separate.",
      "When I tell you a policy is regressive, I mean it quantitatively.",
      "I came up through neighborhood planning meetings. I know what they feel like. That shapes what I publish.",
      "The UIC analysis showed exactly what the residents had been saying. That's how this usually goes.",
      "Your ward's TIF in 2010 captured $14M and allocated none of it to affordable housing. I have the numbers.",
    ],
    factions: ["scholars"],
  },
  {
    id: "teresa-o-malley",
    name: "Alderman Teresa O'Malley",
    role: "Alderman of the neighboring 21st Ward",
    teaser: "Machine-aligned. Strong on services, quiet on reform. Will cut a deal.",
    bio:
      "Teresa O'Malley has held the 21st Ward seat since 1995. Her father held it before her. Her ward is majority-white, heavily Polish-American and Lithuanian-American, middle-class, and politically machine-aligned. She delivers services: pothole response, streetlight repair, garbage pickup. She has supported some citywide reform agendas and blocked others. On aldermanic prerogative she votes reliably with her colleagues. She is your neighbor, your ally on some ordinances, your opposition on others. You will negotiate with her.",
    activeEras: ["1990s", "2000s", "2010s", "2020s"],
    voice: [
      "The ward needs its ward alderman. I'm here. Call me.",
      "I do not vote against aldermanic prerogative. Not for any ordinance. Not for any mayor.",
      "My constituents do not want a tower. They do not want a shelter. They do want their streets plowed.",
      "If you cosponsor my small-business tax relief, I'll cosponsor your library expansion.",
      "I know what the residents voted for. I know what the lawyers said. I know which one pays the bills.",
    ],
    factions: ["business", "machine"],
  },
  {
    id: "samuel-grant",
    name: "Sam Grant",
    role: "Investigative journalist, Chicago weekly",
    teaser: "Investigative reporter. Will file the FOIA. Will wait three months for the response.",
    bio:
      "Sam Grant has been a reporter in Chicago since 1998, moving between the Tribune, the Sun-Times, the Reader, and a couple of nonprofit newsrooms. His 2017 series on TIF allocation patterns won a Lisagor. He files FOIA requests like breathing. He has broken stories that ended three aldermanic careers. He is disciplined, not cruel. If you do your job well he will cover it; if you don't he will cover that instead.",
    activeEras: ["2000s", "2010s", "2020s", "2030s"],
    voice: [
      "I filed the FOIA Thursday. You'll hear from me either way.",
      "My Lisagor was for six months of work across two departments. The source was a receptionist. People underestimate receptionists.",
      "I'm not trying to ruin you. I'm trying to publish what's true.",
      "Three stories from this ward in the last four years. I know the zoning clerks by first name.",
      "The Tribune laid off a hundred reporters last month. That is not unrelated to the quality of your ward's governance.",
    ],
    factions: ["media"],
  },
  {
    id: "leticia-williams",
    name: "Leticia Williams",
    role: "Youth organizer, Parkhaven Young Power",
    teaser: "Twenty-three. Runs the ward's youth organizing hub. Third generation organizer.",
    bio:
      "Leticia Williams is the third generation of her family in ward organizing. Her grandmother was in the CBL. Her mother was a Washington precinct captain. Leticia took over the ward's youth organizing hub in 2022 after two years with BYP100. Her strength is running 200-person deliberations and 50-person campaigns that actually produce ordinance language. She is not patient with aldermen who lecture her about process.",
    activeEras: ["2020s", "2030s"],
    voice: [
      "My grandmother organized the rent strike on our block. My mother organized the precinct. I organize the campaign.",
      "The twenty-three-year-old is the alderman you'll be negotiating with in fifteen years. Treat her accordingly.",
      "We have a campaign calendar. We have deadlines. We have a theory of change.",
      "I've already read the ordinance. I have three amendments. Email me a scheduling link.",
      "The young people do not need your encouragement. They need your vote.",
    ],
    factions: ["organizers", "youth"],
  },
  {
    id: "henry-park",
    name: "Henry Park",
    role: "Restaurant owner, 47th and Halsted",
    teaser: "Korean-American second-generation. Runs the corner restaurant. Knows the block.",
    bio:
      "Henry Park's family opened the restaurant at 47th and Halsted in 1987. He runs it now. Early morning prep, afternoon lunch rush, evening dinner. He pays his dishwashers above minimum. He's on the Chamber of Commerce. His daughter is in medical school. He worries about gentrification differently than the organizers do; he worries about the chain across the street opening in 2027 and killing his lease.",
    activeEras: ["2000s", "2010s", "2020s", "2030s"],
    voice: [
      "My father opened this place with twelve thousand dollars he borrowed from my uncle. He paid it back in three years.",
      "I've seen four aldermen come through. Two kept their promises on signage. One did the right thing on tax relief. One did nothing.",
      "I'm not against development. I'm against a CVS at that corner.",
      "My daughter says I should retire. I'll retire when the lease runs out or when my knees give.",
      "The block is the business. You change the block, you change the business.",
    ],
    factions: ["business", "residents"],
  },
  {
    id: "patricia-johnson",
    name: "Patricia Johnson",
    role: "Schoolteacher, Parkhaven High",
    teaser: "Twenty-six years at Parkhaven High. Teaches English. Union delegate.",
    bio:
      "Patricia Johnson has taught English at Parkhaven High School since 2000. She was the union delegate during the 2012 and 2019 strikes. She has worked under four principals. She knows every student her age in the ward by name, roughly, and they bring her their questions. Her students' college matriculation rate has been tracked locally as one of the best on the South Side. In 2023 she considered running for alderman against you.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "The kids know when an adult is lying to them. Take that seriously.",
      "The 2012 strike was the first time my union felt like a union again.",
      "I've taught Ta-Nehisi Coates, Toni Morrison, Gwendolyn Brooks, Imbolo Mbue. The students connect.",
      "If CPS closes this school, my students will have to travel to Hyde Park. Some of them will drop out. I'm not guessing.",
      "I thought about running against you. I decided to stay in the classroom. We'll see if I regret that.",
    ],
    factions: ["teachers", "organizers", "residents"],
  },
  {
    id: "david-rogers",
    name: "David Rogers",
    role: "Architect, community practice",
    teaser: "Parkhaven native. Architecture firm specializes in community-based design.",
    bio:
      "David Rogers grew up in the ward in the 1970s and 80s, went to IIT, and came back to run a small community-based architecture firm. His firm designs affordable housing, community centers, and school additions. He's designed five Parkhaven projects in twenty years. He has strong views on scale and context. He gets into arguments with developers over window ratios and arguments with preservationists over ADA compliance.",
    activeEras: ["2000s", "2010s", "2020s", "2030s"],
    voice: [
      "Buildings outlive the people who commission them. That shapes what I build.",
      "Three stories fits the block. Six stories does not.",
      "Affordable design is not the same as cheap design. I have to explain that every project.",
      "My firm is six people. We've produced more local affordable housing than most big firms. Scale is overrated.",
      "The question is not what the block looks like now. The question is what it will look like in fifty years.",
    ],
    factions: ["designers", "business"],
  },
  {
    id: "olivia-chen",
    name: "Dr. Olivia Chen",
    role: "Public health director, Parkhaven Clinic",
    teaser: "Medical director of the ward clinic. Public-health trained. Clinical-sociology reader.",
    bio:
      "Dr. Olivia Chen runs the ward's community health clinic. She trained at Rush, did public-health work at Cook County, and came to the clinic in 2018. She treats patients in the mornings and runs the clinic's preventive-care programs in the afternoons. She sits on the city's heat-vulnerability planning committee. Her administrative style is minimalist; her diagnostic style is relentless. She has saved perhaps a hundred lives in five years.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "Every patient is a data point. Every data point is a patient.",
      "The heat-wave deaths are preventable. They keep happening.",
      "I can treat asthma. I cannot treat the Dan Ryan exhaust.",
      "The clinic cannot substitute for the social determinants. I can, however, document them.",
      "My residents are trained to see the housing as part of the diagnosis. That is a Cook County legacy.",
    ],
    factions: ["health", "scholars"],
  },
  {
    id: "ruby-ortiz",
    name: "Ruby Ortiz",
    role: "Small-business owner, Ortiz Bakery",
    teaser: "Second-generation baker. Runs the bakery on 63rd. Knows the neighborhood's kids by name.",
    bio:
      "Ruby Ortiz runs Ortiz Bakery, which her mother opened in 1981. The bakery sells Mexican sweet bread, cakes for quinceañeras, and morning coffee. Ruby took over in 2010. She employs six. She ran for commissioner once and lost. She opens at 5 AM. Every third-grader in the ward knows the name of her bakery. Her twelve-year lease is up for renewal in 2028 and she is not confident about the renewal.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "My mother worked the ovens for forty years. My hands look like hers.",
      "The kids know the bakery. That's half the business.",
      "The landlord is fine. The landlord's new partner is not.",
      "I paid more in property tax this year than last year by a factor I don't want to say out loud.",
      "A cultural district would protect the block. An ordinance would protect the lease. An organizer would organize the block club. I want all three.",
    ],
    factions: ["business", "residents"],
  },
  {
    id: "anthony-lopez",
    name: "Detective Anthony Lopez",
    role: "CPD, Third District",
    teaser: "Twenty-year CPD veteran. Violent-crimes division. Parkhaven's beat since 2014.",
    bio:
      "Detective Anthony Lopez has been a Chicago police officer since 2004 and was promoted to detective in 2013. He has worked Parkhaven since 2014. He speaks Spanish, knows the local gangs by reputation, and has a working relationship with the ward's violence-interrupters. He is not a reformer; he is not an advocate for the status quo. He thinks the department's training is insufficient and says so at roll call. He has said, privately, that he would not have taken the job in 2004 if he had known what it would become.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "I do not ride around making enemies. I make the case.",
      "The violence interrupters are doing real work. I tell my colleagues that.",
      "A call came in three weeks ago. I was the second detective there. The family knew me.",
      "The consent decree is asking us to change the department we work for. Some of it is fair. Some of it is bureaucracy.",
      "I have an opinion on every reform proposal. Most of the opinions are not on the record.",
    ],
    factions: ["police"],
  },
  {
    id: "beatrice-walker",
    name: "Beatrice Walker",
    role: "Retired CHA tenant organizer",
    teaser: "Lived in Robert Taylor from 1962 to 2004. Organized there for thirty years.",
    bio:
      "Beatrice Walker moved into Robert Taylor Homes when she was nine, in 1962. She raised three children there. She was the Local Advisory Council president for two decades. She fought the Plan for Transformation publicly and privately. She was relocated in 2004 to a mixed-income property, then to a scattered-site unit in your ward. She has spoken at national policy conferences. Her memory of the towers is long, complicated, and specific. She is a voice the ward listens to.",
    activeEras: ["1990s", "2000s", "2010s", "2020s"],
    voice: [
      "The towers were not what people who never lived there say they were.",
      "They were also exactly what the people who lived there say they were.",
      "The demolition did not consult us. It told us. That difference matters.",
      "My son did not grow up in the tower I grew up in. That was not an accident.",
      "When the mixed-income development opened, I was on the advisory board. I was also paying twice the rent I used to pay.",
    ],
    factions: ["residents", "organizers"],
  },
  {
    id: "amanda-gutierrez",
    name: "Amanda Gutierrez",
    role: "Environmental scientist, climate-adaptation consultant",
    teaser: "PhD in environmental engineering. Consults on neighborhood-scale climate adaptation.",
    bio:
      "Amanda Gutierrez trained at Northwestern and now consults on climate adaptation for neighborhood-scale projects. Her firm has designed the green-infrastructure retrofits for about twenty Chicago commercial corridors. She grew up in Little Village and understands the equity dimensions of climate work at ground level. Her forthcoming book is about the neighborhoods that were built for flooding and the neighborhoods that were not.",
    activeEras: ["2020s", "2030s"],
    voice: [
      "A bioswale is a policy decision. A tree is a policy decision. Where they go is a policy decision.",
      "The sewers designed in the 1890s cannot handle the storms of the 2030s. That is not a model; that is physical reality.",
      "I am a climate scientist, which means I am an engineer, which means I am an equity analyst.",
      "My Little Village grew up with floods. The North Side is learning now.",
      "You cannot green-retrofit your way out of concentrated exposure. You can only reduce it at the margin.",
    ],
    factions: ["scholars", "environment"],
  },
  {
    id: "keith-robinson",
    name: "Keith Robinson",
    role: "Retired city planner",
    teaser: "Forty years on CDPD staff. Retired 2018. Memory of every zoning fight since 1982.",
    bio:
      "Keith Robinson was a senior planner at the Chicago Department of Planning and Development for thirty-six years. He retired in 2018 and has since served as a consulting advisor to community-based planning organizations. His files — formal and informal — are the institutional memory of Chicago zoning. He remembers every TIF formation, every neighborhood plan, every aldermanic end-run on the zoning code. He is your backroom resource.",
    activeEras: ["1980s", "1990s", "2000s", "2010s", "2020s"],
    voice: [
      "I worked on your ward's 1994 neighborhood plan. Most of it never got implemented. Some of it did.",
      "The department had seven planners in 1985 and twenty-two in 2015. Staffing does not correlate with planning quality.",
      "I know where the files are. I know who has the files the public-records office lost.",
      "Aldermanic prerogative is an informal practice. Informal practices are harder to reform than formal ones.",
      "The 2004 downtown plan is in a binder on my shelf. It is still the baseline document for downtown planning whether anyone will admit it or not.",
    ],
    factions: ["scholars", "planners"],
  },
  {
    id: "melissa-chang",
    name: "Melissa Chang",
    role: "Legal aid attorney, housing court",
    teaser: "Ten years in eviction defense. Knows every judge in housing court.",
    bio:
      "Melissa Chang has been a legal aid attorney at Lawyers' Committee for Better Housing since 2014. She represents tenants in eviction court. On a typical week she has 40 active cases. She has won reversal of more than 200 eviction judgments. She also lobbies for state-level tenant protections. She sleeps six hours a night on a good week. Her burnout ratio is inverted: she cares more now than when she started.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "Most evictions do not need to happen. That's the work.",
      "I won a case yesterday where the landlord had filed 37 eviction cases against the same family over nine years. The judge granted dismissal.",
      "Right-to-counsel would reduce evictions by about half. I know because New York's data is unambiguous.",
      "The landlord's attorney called me 'passionate.' I took it as a compliment; she did not mean it as one.",
      "I've never read an eviction file that looked like justice.",
    ],
    factions: ["legal", "organizers"],
  },
  {
    id: "carlos-riviera",
    name: "Carlos Riviera",
    role: "CTU chapter chair, Parkhaven Elementary",
    teaser: "Third-grade teacher. Chapter chair since 2012. Active in every ward CTU campaign.",
    bio:
      "Carlos Riviera has taught third grade at Parkhaven Elementary since 2008. He became CTU chapter chair in 2012, during the Karen Lewis strike, and has held the position since. He runs monthly general meetings, coordinates strike planning, and negotiates with administration. He is one of the ward's most connected organizers across teacher, tenant, and youth networks. His students' parents trust him. His students' grandparents trust him.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "The 2012 strike was the first time I felt like my union actually had my back.",
      "Every parent at this school knows my name. Every student knows my name. Every aide knows my name. That's the union relationship at school level.",
      "The chapter chair is the shop steward of pedagogy.",
      "I teach reading. That is a political act.",
      "The district is going to keep proposing closures until we stop them collectively.",
    ],
    factions: ["teachers", "organizers"],
  },
  {
    id: "sandra-mitchell",
    name: "Sandra Mitchell",
    role: "Managing director, Parkhaven Community Development Corporation",
    teaser: "Runs the ward's CDC. Affordable housing production. Economic development lead.",
    bio:
      "Sandra Mitchell has run the Parkhaven Community Development Corporation since 2011. Before that she was at LISC Chicago. The CDC has produced 400 affordable housing units in the ward, operates the small-business loan fund, and staffs the workforce-development office. Her style is operational and collaborative; she does not campaign, she builds. She knows the LIHTC application process better than most state staff. She thinks about equity in terms of balance sheets and completed projects.",
    activeEras: ["2010s", "2020s", "2030s"],
    voice: [
      "LIHTC Round 47 closed last month. We're in for Round 48.",
      "I do not need the spotlight. I need the financing.",
      "Affordable housing production is 80% paperwork. That's a feature, not a bug; paperwork is how you ensure accountability.",
      "The CDC has outlasted three mayors. That says something about nonprofits and something about mayors.",
      "Every project we fund is a compromise. The compromises are the work.",
    ],
    factions: ["nonprofits", "business"],
  },
];

export const CHARACTER_BY_ID: Map<string, Character> = new Map(
  CHARACTERS.map((c) => [c.id, c])
);

/** Get characters active in a given year */
export function activeCharactersForYear(year: number): Character[] {
  const decade = Math.floor(year / 10) * 10;
  const decadeLabel = `${decade}s` as Character["activeEras"][number];
  return CHARACTERS.filter((c) => c.activeEras.includes(decadeLabel));
}

/** All characters in a specific faction */
export function charactersByFaction(factionKey: string): Character[] {
  return CHARACTERS.filter((c) => c.factions.includes(factionKey));
}
