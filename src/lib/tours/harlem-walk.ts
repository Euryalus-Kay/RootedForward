import type { WalkTour } from "./walk-types";

// ------------------------------------------------------------------
// The Harlem walk, and the first Rooted Forward tour outside
// Chicago. Seventeen stops told in the order the history happened,
// from the Hotel Theresa at 125th Street north to 145th and Lenox,
// sixteen on the main line and one optional detour southwest to
// Morningside Park and Columbia. Chronological order costs some
// geography, so the walk doubles back several times and says so on
// stop one.
//
// Harlem is the mirror image of Hyde Park and that is the point.
// Chicago's story is exclusion, families kept out. Harlem's is
// entry followed by extraction: Black New Yorkers reached these
// blocks early, in numbers, on the open market, and then a century
// of covenants, appraisals, clearance plans and one foreclosure
// took the equity back out. Nearly every stop marks a place where
// property was acquired and then lost value or lost ownership.
//
// Two things here have no counterpart in the Chicago file. The day
// trip to Addisleigh Park carries its own audio, because New York's
// racial covenants were litigated in Queens and not in Manhattan.
// The checks list prints the claims the research threw out, which
// matters more in Harlem than it did in Hyde Park, since Harlem
// attracts confident statistics that do not survive checking.
//
// Stop coordinates are read out of the same Census TIGER geometry
// the map is drawn from (scripts/tiger-intersections.mjs), so every
// pin sits on the drawn street rather than beside it. The base
// plate is the USGS Central Park quadrangle, 1947 edition, which
// still shows the Polo Grounds and the Savoy's block.
//
// Audio: scripts/walk-tts.mjs --tour harlem (OpenAI, voice ash);
// durations.json is the source of audioSeconds.
// ------------------------------------------------------------------

const MEDIA = "/media/harlem-walk";

export const HARLEM_WALK: WalkTour = {
  title: "Walk Harlem",
  dek: "A free, self-guided audio tour from the Hotel Theresa to 145th Street, presented in chronological order. The main route includes sixteen stops and covers about five miles, with one optional detour and one separate day trip. The tour explains how Black New Yorkers entered a neighborhood built to exclude them and how a century of covenants, appraisals, clearance plans, and foreclosures affected the property they acquired.",
  walkMinutes: 123,
  listenMinutes: 92,
  distanceMiles: 5.3,
  startLabel: "West 125th Street at Adam Clayton Powell Jr. Boulevard, outside the Hotel Theresa",
  practical: [
    {
      title: "Getting there and timing",
      text:
        "The walk starts outside the Hotel Theresa, on the northwest corner of West 125th Street and Adam Clayton Powell Jr. Boulevard, and ends at West 145th Street and Lenox Avenue, twenty blocks north. The stops run in time order rather than in a neat loop, so the route doubles back on itself and a few stops sit within sight of each other. Plan on about four hours with the stops. The 2 and 3 trains stop at 125th and Lenox at the start and at 145th and Lenox at the finish, so you can ride back to where you began in ten minutes. The A, B, C and D also serve 125th and 145th Streets. Short on time? Stop after the densest block, eleven stops in, and pick up the northern half another day.",
    },
    {
      title: "The ground",
      text:
        "Flat city sidewalks for most of the way, about five miles on the main line. The exception is the climb from Harlem River Houses up to Edgecombe Avenue, which is a genuine hill, and the walk back down 145th Street from Edgecombe to Lenox, which is long. The longest single leg is the nineteen minutes from 409 Edgecombe down to 145th and Lenox at the finish, and the 3 train covers most of it if you would rather ride. The busiest crossings are on 125th Street, along Lenox, and at 145th; use the marked crosswalks. Strivers' Row, the Dunbar courtyards and the Harlem River Houses courtyards are all open to walk through, and all three are people's homes, so keep your voice down and do not photograph into windows. The Schomburg Center is free and worth going inside.",
    },
    {
      title: "The detour and the day trip",
      text:
        "**There is only one optional detour on this walk, and it is deliberate.** Stop three, Morningside Park and Columbia, is drawn in green on the map because it sits southwest of everything else and adds about half an hour. It is there because our Chicago tour spends four stops on what a university did to a neighborhood, and this is New York's nearest equivalent. The main walk is complete without it. Separately, there is a **day trip to Addisleigh Park in St. Albans, Queens**, printed at the end of this document. It is not walkable from Harlem and is not part of the route. It is there because Addisleigh Park is where New York's racial covenants were actually taken to court, and Harlem's were not, so the legal half of this story lives in a different borough.",
    },
    {
      title: "Listening",
      text:
        "Headphones are nicest, but a phone speaker works fine. Every stop's audio is also printed on the page, so you can read instead of listen. If you share your location, it is used only to draw your dot on the map. It never leaves your phone.",
    },
  ],
  detourNotice:
    "This optional stop is southwest of the main route and adds about thirty minutes of walking for the round trip. It covers Morningside Park, Columbia University's abandoned gymnasium project, and the Manhattanville expansion. It is included because users of the Chicago tour often ask whether New York has a comparable example of a university shaping the surrounding neighborhood. The main route contains the complete central history, so the detour may be skipped without interrupting the sequence. Visitors who take it should look for the waterfall at the 114th Street end of Morningside Park, which was built in the excavation Columbia created for the gymnasium.",
  dayTrip: {
    title: "Addisleigh Park, St. Albans, Queens",
    dek:
      "The one place on this tour where a New York court was asked to enforce a racial covenant, an hour away in Queens",
    body: [
      "Harlem has a recorded covenant and no case that ever reached the state's highest court. Addisleigh Park has both, and it is the reason this tour can say what New York judges actually did with racial restrictions before 1948.",
      "Addisleigh Park is a district of freestanding and attached houses in St. Albans, southeastern Queens, built mostly between the 1910s and the 1930s. The first deed restrictions there governed lot and building size. **The racial covenants came later, starting in late 1939, and were written by white owners reacting to Black families buying in.** White residents then sued twice to enforce them. In **Dury v. Neely** in 1942, and again in **Kemp v. Rubin** in 1947, **New York courts upheld the covenants both times**, and the Appellate Division affirmed Kemp that December.",
      "In *Kemp*, Sophie Rubin's contract to sell her house to Samuel Richardson was found to violate a 1939 agreement that ran until the end of 1975. **The judge enforced it while writing that distinctions based on color and ancestry were inconsistent with American traditions, and that he was bound by precedent anyway.** The Landmarks Preservation Commission's designation report says he acknowledged that forty-eight Black families were already living in Addisleigh Park.",
      "Then the Supreme Court decided **Shelley v. Kraemer** in May 1948. **That July the New York Court of Appeals reversed Kemp and threw the neighbors' case out**, with costs in all courts. A restriction that two New York courts had enforced was dead within ten weeks.",
      "The neighborhood then became one of the most prominent Black suburbs in America. **Count Basie lived at 174-27 Adelaide Road. Joe Louis at 175-12 Murdock Avenue. Fats Waller on Sayres Avenue.** Lena Horne, Ella Fitzgerald, and Jackie Robinson all lived in the district. The **Landmarks Preservation Commission designated the Addisleigh Park Historic District on February 1, 2011**, covering roughly four hundred twenty houses.",
      "Getting there means the Long Island Rail Road to St. Albans, or the E or F train to Jamaica and a bus east. Allow half a day. It is a quiet residential district, so walk it the way you would walk any neighborhood where people live.",
      "One warning. A case sometimes cited as *Silsdorf v. City of New York*, 1948, said to have struck down the Addisleigh Park covenants, appears to be unreliable and conflicts with the better-documented record. **Do not use it.** The confirmed cases are *Dury v. Neely* and *Kemp v. Rubin*.",
    ],
    audioSrc: `${MEDIA}/audio/addisleigh-park.mp3`,
    audioSeconds: 168, // measured after generation
  },
  checks: {
    title: "How we checked this",
    intro:
      "Harlem attracts confident statistics that do not survive checking. During research for this tour we found a number of widely repeated claims that are wrong, unsourced, or garbled. We are listing them because the corrections are more interesting than the errors, and because if you find one of these in another tour you will know what happened.",
    items: [
      "**Love B. Woods did not buy the Hotel Theresa in 1937.** The Sidenberg estate held it until 1948. Woods was the last manager and tried unsuccessfully to buy it. The hotel desegregated in 1940 after years of financial losses.",
      "**Frank Schiffman did not desegregate the Apollo.** Sidney Cohen did, reopening the theater on January 26, 1934. Schiffman took over after Cohen died in late 1935.",
      "**The Lenox Avenue subway opened November 23, 1904, not October.** October 27, 1904 is the first IRT line on the West Side. The Harlem branch, including the 135th Street station, opened a month later.",
      "**The Hudson Realty evictions were spring 1904, not 1905.** The deed record and the contemporary press both put them in April and May 1904.",
      "**The Strivers' Row houses did not carry racial covenants and did not sit empty for twenty-four years.** The recorded 1890 restrictions concerned stables, factories and alterations. Equitable Life rented the houses, sold thirty-one in 1905, and held the rest until 1919 and 1920, when they were sold to Black buyers. It was a sales policy, not a deed. The figure of eight thousand dollars per house traces only to Wikipedia and we do not use it.",
      "**The 1935 uprising caused about two million dollars in damage, not two hundred million.** One widely cited history is wrong by three orders of magnitude.",
      "**E. Franklin Frazier did not chair the Mayor's Commission.** Charles H. Roberts chaired it. Frazier was research director and principal author.",
      "**The 1943 uprising damage figures range from $250,000 to $5 million across sources, a spread of twenty times.** We use the physical counts instead: 1,485 stores burglarized and 4,495 windows broken.",
      "**There was no 1944 Brown-Isaacs amendment.** The 1943 effort was Isaacs-Davis, and it was defeated. Earl Brown was not elected to the Council until 1949.",
      "**Harlem River Houses drew more than 15,000 applications by the government's own account, not 20,000.** The Landmarks Preservation Commission says 11,500. We name the source when we give the number.",
      "**Harlem River Houses and Williamsburg Houses cost about the same per apartment**, roughly $7,700 to $7,900, so there is no funding disparity to narrate. The real difference is that Williamsburg cleared twelve blocks and Harlem River was built on vacant land.",
      "**Drew-Hamilton Houses is named for Monsignor Cornelius J. Drew, not Dr. Charles Drew.**",
      "**Lenox Terrace is not a Mitchell-Lama development and was not built by LeFrak.** It was Title I, and Olnick has owned it since 1958. Its 2019 and 2020 rezoning application was disapproved unanimously by a Council subcommittee in February 2020; there was no later approval.",
      "**Polo Grounds Towers displaced nobody.** The federal survey documents record the site as vacant land. It was a ballpark.",
      "**It is Local Law 45 of 1976 that cut the tax-arrears period, not a 1977 law.** The 1977 date comes from conflating it with a court decision that upheld the change.",
      "**We could not verify the widely repeated claim that the City of New York owned sixty to sixty-five percent of Harlem's residential property in the late 1980s, and we do not use it.** At the citywide peak in February 1985 the city held 5,100 occupied buildings and 48,000 occupied apartments across every distressed neighborhood in five boroughs. The likely origin of the Harlem figure is that roughly sixty percent of what the city owned citywide was vacant.",
      "**The arson statistics that circulate about Harlem are Bronx statistics.** Seven Bronx tracts lost more than ninety-seven percent of their buildings in the 1970s. Central Harlem lost a third of its population, which is severe and is not the same thing.",
      "**Howard Cosell never said \"the Bronx is burning.\"** ESPN's producers reviewed the entire 1977 World Series Game 2 broadcast. It is not there.",
      "**The Columbia gymnasium lease was about two acres for fifty years from 1960.** Figures of 2.1 acres, three thousand dollars a year, or thirty years do not check out.",
      "**Kaur v. New York State Urban Development Corporation:** the three-to-two ruling against Columbia was the Appellate Division on December 3, 2009. The Court of Appeals reversed on June 24, 2010, unanimously in result, not five to two.",
      "**\"Not majority Black since 2000\" refers to greater Harlem including East Harlem, not to Community District 10.** On the community district measure, Central Harlem's Black share crossed below fifty percent between the 2023 and 2024 American Community Survey estimates.",
      "**The St. Philip's figure of $640,000 for ten buildings is corroborated in several books but we could not reach a primary source, and the claim that it was the largest Black real estate transaction to that date traces to James Weldon Johnson.** We attribute it to him out loud rather than stating it as established fact.",
      "**Frazier's Commission report gives Harlem's population increase as \"more than 600 per cent\" over twenty-five years.** A city web page says 800 percent. We read the typescript at magnification; it says 600.",
      "**We do not use the Nassau County versus Brooklyn per-capita FHA mortgage figures** that circulate from Kenneth Jackson's *Crabgrass Frontier*, because we were not able to open the printed table and confirm them.",
    ],
  },
  route: [
    [40.80897, -73.94833],
    [40.80961, -73.94983],
    [40.80897, -73.94833],
    [40.80777, -73.94548],
    [40.81094, -73.94317],
    [40.81006, -73.94108],
    [40.81094, -73.94317],
    [40.81212, -73.94603],
    [40.81275, -73.94557],
    [40.81216, -73.94414],
    [40.81157, -73.94272],
    [40.8122, -73.94225],
    [40.81232, -73.94253],
    [40.8122, -73.94225],
    [40.81411, -73.94085],
    [40.81343, -73.93924],
    [40.81411, -73.94085],
    [40.81434, -73.94068],
    [40.81411, -73.94085],
    [40.81531, -73.9437],
    [40.81463, -73.94419],
    [40.81471, -73.94436],
    [40.81463, -73.94419],
    [40.81785, -73.94184],
    [40.81845, -73.94326],
    [40.81785, -73.94184],
    [40.81723, -73.9423],
    [40.81641, -73.94037],
    [40.81603, -73.93946],
    [40.81473, -73.93617],
    [40.81374, -73.9369],
    [40.81473, -73.93617],
    [40.81603, -73.93946],
    [40.81728, -73.93854],
    [40.81759, -73.93831],
    [40.82044, -73.93623],
    [40.82164, -73.93908],
    [40.8245, -73.937],
    [40.82481, -73.93679],
    [40.82651, -73.93678],
    [40.8272, -73.93668],
    [40.8304, -73.9402],
    [40.82365, -73.94384],
    [40.82044, -73.93623],
  ],
// One spur. The optional stop is the only thing off the main
// line, and it leaves the walk at the Apollo and comes back to
// it, so the map can draw the whole round trip instead of a
// dashed line running off the plate.
  detourRoutes: [
    [
      [40.80961, -73.94983],
      [40.81017, -73.95117],
      [40.8084, -73.9543],
      [40.80389, -73.9582],
      [40.80401, -73.95918],
      [40.80389, -73.9582],
      [40.8084, -73.9543],
      [40.81017, -73.95117],
      [40.80961, -73.94983],
    ],
  ],
  stops: [
    {
      id: "hotel-theresa",
      number: 1,
      title: "The Hotel Theresa",
      dek: "A hotel that excluded Black guests for twenty-seven years, beside the corner where Harlem property owners organized",
      mapLabel: "Hotel Theresa",
      lat: 40.80897,
      lng: -73.94833,
      audioSrc: `${MEDIA}/audio/hotel-theresa.mp3`,
      audioSeconds: 329,
      transcript: [
        "Stand on the northwest corner of West 125th Street and Adam Clayton Powell Jr. Boulevard, below the white tower. This is the Hotel Theresa. It opened in 1913, remained Harlem's tallest building for decades, and refused Black guests during its first twenty-seven years. The hotel's history and its location introduce the main subjects of this tour.",
        "Rooted Forward is a youth-led nonprofit that documents how American cities determined who could live in different neighborhoods. Our first tour focused on Chicago's South Side, where exclusion largely prevented Black families from entering certain areas. Harlem followed a different pattern. Beginning in 1904, Black New Yorkers bought and leased buildings on these blocks, and by 1930 Central Harlem was seventy percent Black. This tour examines what happened to the property and equity they acquired after entering the neighborhood.",
        "The route follows the history in chronological order, running north from here to 155th Street and then back to 145th Street. It doubles back in several places, and some stops are close enough to see from one another. The main walk covers roughly five miles and includes sixteen stops.",
        "The Hotel Theresa was built in **1912 and 1913** and designed by the brothers **George and Edward Blum**. Their use of patterned brick and terra cotta is still visible on the upper floors. The hotel was named for Theresa Kaufman, the wife of its developer, German-born stockbroker Gustavus Sidenberg. It had thirteen stories, three hundred rooms, and a whites-only policy.",
        "The hotel did not desegregate because its owners voluntarily changed their policy. According to the Landmarks Preservation Commission, it began accepting Black guests in **1940** after **huge financial losses over a number of years**. Harlem had become overwhelmingly Black, and the hotel's white customer base had declined. Financial pressure ended the policy. The same relationship between restricted housing choices and financial incentives appears throughout this tour.",
        "Many accounts state that a Black businessman named Love B. Woods bought the Theresa in 1937 and integrated it. The property records do not support that claim. The Sidenberg estate **retained ownership until 1948**. Woods was the hotel's last manager and **tried unsuccessfully to buy it**. This correction is included because several widely repeated details about Harlem do not match the available records.",
        "After 1940, the Theresa became a major social center of Black America and was sometimes called the Waldorf of Harlem. Joe Louis celebrated here, and Lena Horne, Duke Ellington, Dinah Washington, Jimi Hendrix, and Muhammad Ali stayed at the hotel. In **September 1960**, Fidel Castro left a midtown hotel during a dispute over a cash deposit and moved his delegation into about forty suites on three floors of the Theresa. He met Nikita Khrushchev and Malcolm X here, bringing international attention to this corner. *Ebony* magazine had described the hotel's condition in **1946**: **\"with its dimly lit hallways, drab colorless bedrooms, dingy ancient furnishing and limited room service, the Theresa is anything but a first-rate hotel. But it is the best that Harlem has.\"** The description also reflected the limited choices available in Harlem's housing market.",
        "The Theresa stopped operating as a hotel in **1967** and reopened as office space in **1970**, its current use. New York City designated it a landmark on **July 13, 1993**, and it was listed on the National Register in 2005. The painted hotel name remains visible on the 125th Street side of the building.",
        "Look one block east toward Fifth Avenue. On the evening of **Tuesday, January 27, 1914**, property owners filled the auditorium at **5 West 125th Street** to organize a corporation intended to remove Black residents from Harlem by buying property back. The red box below reproduces their resolutions from the real estate trade press.",
        "This market pattern made Harlem increasingly Black while also making its housing more expensive. Exclusion in other parts of New York limited Black residents' choices and concentrated demand in Harlem. That demand allowed landlords to charge a premium, while the higher returns made sales and rentals to Black residents profitable. The premium then became a lasting feature of the neighborhood's housing market. James Weldon Johnson summarized the process in 1930: **\"Economic necessity usually discounts race prejudice, or any other kind of prejudice, as much as ninety per cent, sometimes a hundred.\"**",
        "The next stop is about two hundred metres west, on 125th Street between Adam Clayton Powell Jr. Boulevard and Frederick Douglass Boulevard. It appears early in the tour even though its history is later, just as the Obama Center appears early in the Chicago walk. Seeing the street as it is now provides context for the earlier history that follows.",
      ],
      interrupts: [
        {
          title: "The improvement corporations",
          body: [
            "An improvement association was **a property owners' organization created to control who could live on particular blocks**. Chicago's Hyde Park Improvement Protective Club was organized in 1908 with 350 members. Harlem had two similar campaigns. The first, the **Harlem Property Owners' Improvement Corporation**, was organized around 1910 by former New York City police officer **John G. Taylor** and sought to hold the racial boundary at West 136th Street. Taylor is quoted as saying, **\"We are approaching a crisis. It is the question of whether the white man will rule Harlem or the Negro.\"** In 1911, the *Harlem Home News* urged readers to **\"repel the black hordes that stand ready to destroy the homes and scatter the fortunes of the whites.\"**",
            "The second campaign is well documented but rarely discussed. On page 205 of its **January 31, 1914** issue, the *Real Estate Record and Builders' Guide* published an article titled **\"HARLEM'S PROBLEM: An Improvement Corporation to Deal with the Negro Invasion.\"** The organizing meeting filled the auditorium at **5 West 125th Street** on **January 27, 1914**, with **Ransom E. Wilcox** presiding. A thirty-person committee planned to form a **Property Owners' Improvement Corporation with capital stock of $500,000 in $5 shares**. Operations would begin after $100,000 was subscribed. More than **$10,000 had already been pledged**, and thirty additional members joined that night. The corporation claimed the area from **110th Street to the Harlem River, and from Park Avenue west to Morningside, St. Nicholas, and Bradhurst**. That territory covered all of Harlem and every stop on this tour.",
            "The organization gave this reason for its work: **\"The gradual growth of this class of occupancy has caused a corresponding deterioration of real estate values which has proved well nigh ruinous.\"** The first item in its plan was: **\"To arrange with the property owners to rent their properties to white tenants. This could be done section by section, thereby not causing an over supply of vacant apartments.\"** The fourth item was: **\"To create a proper environment in the vicinity of 135th street and Lenox avenue.\"** The route reaches 135th Street and Lenox Avenue in about an hour.",
            "The effort failed because property values **rose** as African Americans moved into Harlem. The Landmarks Preservation Commission explains that Black New Yorkers were willing to pay more than white New Yorkers **simply because their housing supply was so restricted**. Restrictive covenants and similar policies failed as white owners began renting and selling to Black residents at inflated prices. **Frank A. Shaw**, who chaired the corporation's subscription drive in 1914 and served as vice president in 1915, acknowledged the change in the real estate press on **July 21, 1917**: **\"I consider it foolhardy to attempt to save the district north of 131st street, from the Harlem River to the chain of parks on the west, from negroes. I believe Seventh avenue will ultimately be absorbed by colored people.\"**",
          ],
          after: 9,
        },
      ],
      images: [
        {
          src: `${MEDIA}/hotel-theresa-1913.jpg`,
          alt: "A black and white photograph of a large pale hotel filling a street corner, seen from across a wide roadway. Rows of windows rise through more than a dozen floors, the upper storeys are ringed with arched openings, and the roofline breaks into tall ornate gables at the corner and again at the far end of the block. Striped awnings shade the shopfronts at street level and a few thin trees stand along the sidewalk at the left. A handful of small figures are on the almost empty roadway in front.",
          credit:
            "The Hotel Theresa in 1913, the year it opened. Photographer unknown, published in Architecture and Building, November 1913, via Wikimedia Commons. Public domain.",
          label: "1913",
          after: 1,
        },
        {
          src: `${MEDIA}/hotel-theresa-1943.jpg`,
          alt: "A black and white photograph looking across a wide commercial street at a four storey building. A long awning over the shopfronts is lettered Kanter's twice and hung with striped bunting, and a large heart shaped sign between the two lettered sections reads The Heart of Harlem. Shoppers stand and walk along the sidewalk in front of the display windows. A partly hidden sign at the left carries the number 130 and the word Wear above the words hosiery and uniforms, and further down the block a vertical sign reads Strickler above parked cars. The foreground pavement is empty except for a fire hydrant and a lamp post. The frame is the full film negative, with the number OWI 31112-C written across the top.",
          credit:
            "125th Street in Harlem, June 1943. Photograph by Roger Smith. Library of Congress Prints and Photographs Division, Farm Security Administration and Office of War Information Black and White Negatives, LC-USW3-031112-C. No known restrictions.",
          label: "1943",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/hotel-theresa-today.jpg`,
        alt: "A tall white building standing on a city street corner, photographed from across the intersection. Its short end wall faces the camera on the left and its long flank runs away to the right along the avenue. The facade is patterned white brickwork with rows of square and arched windows and small iron balconies near the top, and the roofline rises into ornate curved gables. Dark storefronts fill the ground floor, including a corner deli under a maroon awning lettered Welcome to Harlem Gourmet Deli. Cars are parked at the curb, a white bus passes in front of the building, and the sky is bright with scattered cloud.",
        credit:
          "The Hotel Theresa today, an office building since 1970. Photograph by Beyond My Ken, 2013, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk west along 125th Street, away from the Theresa, past the corner with the large state office tower. Stop in front of the Apollo Theater's marquee at 253 West 125th Street. Blumstein's, the wide limestone department store building, is across and slightly east at number 230.",
        distanceMeters: 210,
        minutes: 3,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, Hotel Theresa Designation Report (LP-1843, July 13, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1843.pdf" },
        { label: "Real Estate Record and Builders' Guide, \"Harlem's Problem: An Improvement Corporation to Deal with the Negro Invasion,\" January 31, 1914, page 205 (Columbia University Libraries)", url: "https://rerecord.library.columbia.edu/document.php?vollist=1&vol=ldpd_7031148_053&page=ldpd_7031148_053_00000517" },
        { label: "Real Estate Record and Builders' Guide, \"Negro Problem in Harlem Being Adjusted,\" July 21, 1917, with Frank A. Shaw's statement (Columbia University Libraries)", url: "https://rerecord.library.columbia.edu/document.php?vollist=1&vol=ldpd_7031148_060&page=ldpd_7031148_060_00000435" },
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
        { label: "James Weldon Johnson, Black Manhattan (Alfred A. Knopf, 1930)", url: "https://archive.org/details/blackmanhattan00john_1" },
        { label: "Gilbert Osofsky, Harlem, the Making of a Ghetto (Harper and Row, 1966)", url: "https://archive.org/details/harlemmakingofg00osof" },
        { label: "Kevin McGruder, Race and Real Estate, Interracial Conflict and Co-Existence in Harlem, 1890-1920 (Columbia University Press, 2015)", url: "https://cup.columbia.edu/book/race-and-real-estate/9780231169141" },
      ],
    },
    {
      id: "west-125th",
      number: 2,
      title: "West 125th Street",
      dek: "Four disputes on the same two hundred yards of 125th Street over ninety years",
      mapLabel: "125th Street",
      lat: 40.80961,
      lng: -73.94983,
      audioSrc: `${MEDIA}/audio/west-125th.mp3`,
      audioSeconds: 508,
      transcript: [
        "This stop appears out of chronological order. The rest of the tour returns to earlier events. It comes first because four major conflicts over Harlem's housing and development took place along these two hundred yards of 125th Street.",
        "Begin with the wide limestone-fronted building across the street at **230 West 125th Street**. It was **Blumstein's**, Harlem's largest department store, built in 1922 and 1923 for $1.25 million. Although the surrounding neighborhood was overwhelmingly Black, the store accepted Black customers' money while refusing to hire Black sales clerks.",
        "In **June 1934**, the **Citizens League for Fair Play**, organized by the **Reverend John H. Johnson** of St. Martin's Episcopal Church, began picketing the store. Its fliers stated: **\"This firm, acknowledging its large proportion of Negro business, has refused to employ Negro Clerks. Stay out of Blumstein's!\"** Picket signs read **\"We Won't Shop Where We Can't Work.\"** More than fifty churches and organizations supported the campaign, including Abyssinian Baptist. On **July 26, 1934**, after six weeks of protest, Blumstein's agreed to hire Black sales clerks. A victory parade was held on August 4. By the end of 1935, about **three hundred stores on 125th Street** employed Black clerks.",
        "The campaign also faced a legal response. On **November 2, 1934**, New York Supreme Court Justice **Samuel I. Rosenman** issued an injunction against picketing the A. S. Beck shoe store at 264 West 125th Street. He ruled that picketing **must be restricted to labor conflicts and could not be used in racial disputes**. The ruling remained in effect until the United States Supreme Court rejected that principle in *New Negro Alliance v. Sanitary Grocery Co.* in 1938.",
        "Now look at **256 West 125th Street**, across the street and a few doors west of the Apollo. This was the **S. H. Kress and Company** five-and-dime store. At about **2:30 p.m. on March 19, 1935**, sixteen-year-old **Lino Rivera** took a ten-cent penknife from a counter. Store employees caught him, and he bit the hands of the men restraining him. They then released him through the rear door onto 124th Street, a detail that helped make a later rumor believable. An ambulance arrived to treat the bitten men and left without a patient. By coincidence, a hearse parked outside while its driver visited his brother-in-law inside the store. A crowd gathered, and someone was heard saying that Rivera's treatment was **\"just like down South where they lynch us.\"** By that evening, an uprising had begun across Harlem.",
        "Three people died, all of them Black. About one hundred people were injured, and between two hundred and two hundred fifty stores were damaged, with losses estimated at about **two million dollars**. One of those killed was **Lloyd Hobbs, age sixteen**. He was walking home from a movie with his brother at about 12:45 a.m. when a patrolman shot him on Seventh Avenue near 126th Street. Hobbs died at Harlem Hospital.",
        "A second uprising took place eight years later, three blocks north. On the night of **August 1, 1943**, at the **Braddock Hotel on West 126th Street at Eighth Avenue**, white patrolman James Collins attempted to arrest a Black woman named Marjorie Polite. A Black soldier, **Private Robert Bandy**, intervened, and Collins shot him in the shoulder. Bandy's wound was minor, but a rumor spread that a soldier had been killed. Published damage estimates range from $250,000 to $5 million, so this tour uses the recorded physical totals instead: **1,485 stores burglarized and 4,495 windows broken.** James Baldwin's father was buried the next morning, on Baldwin's nineteenth birthday. Baldwin continued writing about that night throughout his life.",
        "After the 1935 uprising, Mayor La Guardia appointed a commission to investigate its causes. The commission's report is one of the most important documents on Harlem housing and provides much of the evidence used in this tour. Stop ten includes a separate red box on the report. One sentence explains why the theft of a penknife led to a neighborhood-wide uprising: **\"The explosion of March nineteenth would never have been set off by the trivial incident described above, had not existing economic and social forces created a state of emotional tension which sought release upon the slightest provocation.\"**",
        "Turn toward the **Apollo Theater** at 253 West 125th Street. The building opened in 1913 and 1914 as Hurtig and Seamon's New Burlesque Theater and was designed by George Keister. During its first twenty years, it remained segregated even as the surrounding neighborhood became majority Black. Black patrons were limited to inferior seating. In **January 1934**, **Sidney Cohen** took over the theater and reopened it on **January 26, 1934** as the 125th Street Apollo, serving Black audiences and presenting Black performers. The Apollo desegregated five months before the Blumstein's boycott and fourteen months before the 1935 uprising. These changes and conflicts were taking place on the same street at the same time.",
        "Frank Schiffman, whose family later operated the Apollo for decades and is often credited in accounts of its history, **did not desegregate it**. Schiffman and his partner took over only after Sidney Cohen died in late 1935.",
        "The fourth and largest conflict involved the nineteen-story dark tower to the east on the north side of the street. This is the **Adam Clayton Powell Jr. State Office Building** at 163 West 125th Street, still Harlem's tallest building. New York State announced the project on **December 7, 1966**, acquired the land through eminent domain for six million dollars, and began construction in June 1967. On **June 30, 1969**, community organizations occupied the excavation, renamed it **Reclamation Site Number One**, and held it for several months. They proposed a community-designed complex with housing, a school, and a cultural center. *Architectural Forum* called the state project **\"Rockefeller's Viet Nam.\"** In **December 1969**, a community referendum chaired by Judge James L. Watson recorded **178 votes against the building and 55 in favor**, and **167 against the governor's compromise and 20 in favor**. The state continued with the project, and the building opened in 1973.",
        "A later development dispute began with the rezoning of 125th Street. On **April 30, 2008**, the City Council approved the rezoning of twenty-four blocks by a vote of **forty-seven to two**. Community Board 10 and the Borough President had both recommended denial. The negotiated plan projected 3,858 apartments and promised that forty-six percent would be income-targeted, including 700 permanently affordable units. It also included assistance for seventy-one businesses and six million dollars for Marcus Garvey Park. Critics argued that the share serving genuinely low-income residents could be as low as **ten percent**. The development completed since the rezoning can be seen from this block.",
        "The tour traces a repeated pattern. Residents organize and win a specific concession, but that victory does not necessarily determine who can remain in the neighborhood. The route now returns to the beginning of Harlem's housing change. The next stop is the neighborhood's oldest surviving residential row. The optional detour that follows examines Columbia University's role in the area and provides the closest New York comparison to the University of Chicago in the Hyde Park tour.",
      ],
      images: [
        {
          src: `${MEDIA}/west-125th-between-1946-and-1948.jpg`,
          alt: "Black-and-white night photograph looking up at the lit Apollo Theater marquee. Outlined neon letters spell APOLLO across the top. The letter board below reads ARNET COBB AND BAND, BROWNSKIN CHORUS, FRED GORDON, SID CATLET AND BAND, with the performers' names spelled as they appear on the sign. Rows of bare bulbs line the underside of the marquee. About a dozen Black men and women in 1940s dress, several in wide-brimmed hats and light suits, walk and stand on the sidewalk beneath it. Framed posters at left advertise Rochester in person and Red Allen and his band. Further down the sidewalk at right, a Loew's marquee advertises Claudette Colbert and Fred MacMurray in The Egg and I.",
          credit:
            "The Apollo Theater marquee at 253 West 125th Street, between 1946 and 1948. Photograph by William P. Gottlieb, William P. Gottlieb Collection, Library of Congress, via Wikimedia Commons. Public domain.",
          label: "between 1946 and 1948",
          after: 1,
        },
      ],
      nowImage: {
        src: `${MEDIA}/west-125th-today.jpg`,
        alt: "Color daytime photograph of the Apollo Theater on West 125th Street. A tall vertical blade sign spelling APOLLO in red neon-outlined letters on a gold ground rises above the roofline, braced by an open black steel truss. The pale stone facade above the marquee carries fluted Ionic pilasters, a Greek-key frieze band and a dentilled cornice. The marquee below reads APOLLO in red letters on a gold panel, and a blue message board on both faces reads BE GOOD OR BE GONE, AMATEUR NIGHT, WEDNESDAYS AT 7:30PM. A white A and L Cesspool Service van and a green taxi sit at the curb beside a red-painted bus lane. A few people walk and stand on the sidewalk under the marquee. Neighboring storefronts read Banana Republic Factory Store, Blick art materials and Apollo Music Cafe.",
        credit:
          "The Apollo Theater at 253 West 125th Street, 2018. Photograph by Carol M. Highsmith, Carol M. Highsmith Archive, Library of Congress Prints and Photographs Division. No known restrictions on publication.",
        label: "Today",
      },
      toNext: {
        text: "Walk east along 125th Street to Lenox Avenue, also signed Malcolm X Boulevard. Turn north and go five blocks to West 130th Street. Turn east. The low three-story houses with wooden porches on the south side of the street are Astor Row. If you are doing the optional detour to Morningside Park and Columbia, do it now instead. Its own directions bring you back to Astor Row afterward.",
        distanceMeters: 920,
        minutes: 12,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, Apollo Theater Designation Report (LP-1299, June 28, 1983)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1299.pdf" },
        { label: "Save Harlem Now!, Blumstein's Building Endangered, 230 West 125th Street", url: "https://save-harlem-now.squarespace.com/s/Blumsteins.pdf" },
        { label: "Mayor's Commission on Conditions in Harlem, Report of Subcommittee Which Investigated the Disturbance of March 19th, May 29, 1935 (University of Minnesota Law Library, Riesenfeld Rare Books Center)", url: "https://librarycollections.law.umn.edu/documents/archive/racial-justice/HarlemRiotReport1935.pdf" },
        { label: "University of Minnesota Law Library, Law and the Struggle for Racial Justice, catalog record for the 1935 Harlem subcommittee report", url: "https://librarycollections.law.umn.edu/racial-justice/harlemriot010.html" },
        { label: "New Negro Alliance v. Sanitary Grocery Co., 303 U.S. 552 (1938), United States Reports (Library of Congress)", url: "https://tile.loc.gov/storage-services/service/ll/usrep/usrep303/usrep303552/usrep303552.pdf" },
        { label: "Cheryl Lynn Greenberg, \"Or Does It Explode?\" Black Harlem in the Great Depression (Oxford University Press, 1991)", url: "https://archive.org/details/ordoesitexplodeb00gree" },
        { label: "Stephen Robertson, Harlem in Disorder, A Spatial History of How Racial Violence Changed in 1935 (Stanford University Press, 2024)", url: "https://www.harlemindisorder.org/archive/documentation.html" },
        { label: "Brian D. Goldstein, The Roots of Urban Renaissance, Gentrification and the Struggle over Harlem (Harvard University Press, 2017)", url: "https://www.hup.harvard.edu/books/9780674971509" },
        { label: "New York City Department of City Planning, 125th Street Corridor Rezoning, Approved", url: "https://www.nyc.gov/assets/planning/downloads/pdf/our-work/plans/manhattan/archive/125th-street.pdf" },
        { label: "New York City Council, press release on the 125th Street river to river rezoning vote, April 30, 2008", url: "https://council.nyc.gov/press/2008/04/30/1314/" },
      ],
    },
    {
      id: "morningside-columbia",
      number: 3,
      title: "Morningside Park and Columbia",
      dek: "Columbia University, Morningside Park, and an abandoned gymnasium excavation later turned into a waterfall",
      mapLabel: "Morningside",
      optional: true,
      lat: 40.80401,
      lng: -73.95918,
      audioSrc: `${MEDIA}/audio/morningside-columbia.mp3`,
      audioSeconds: 213,
      transcript: [
        "This optional stop provides a New York comparison to the four University of Chicago stops in the Hyde Park tour. It examines how Columbia University affected the surrounding neighborhood.",
        "Look up at the cliff. Morningside Park lies below a schist escarpment that creates a clear physical boundary between Morningside Heights and Harlem. In the late 1930s, federal mortgage-risk appraisers placed **Columbia and Morningside Heights, at the top of the cliff, in the second-best category**. Their file described the area as **\"comparatively high ground dropping abruptly from Morningside Drive to the east.\"** Under the heading for Black residents, they wrote **\"No.\"** They gave the lowest grade to the Harlem blocks below the cliff and described them as **\"Largely negro, old tenement houses.\"** The map included the park within the higher-rated area and drew the boundary along the base of the hill.",
        "In **1960**, Columbia University received a fifty-year lease on about two acres of this public park to build a gymnasium. The plan gave Harlem residents a **separate basement entrance leading to about fifteen percent of the facilities**. Critics called the design Gym Crow. Construction began on **February 18, 1968**. On **April 23, 1968**, students occupied five university buildings during a protest that connected opposition to the gym with Columbia's war research. Police cleared the buildings on **April 30**, resulting in **712 arrests and 148 injuries**, according to the university's archive. Columbia cancelled the gymnasium in **March 1969**.",
        "The cancelled project left an open excavation in the park for about twenty years. In **1989**, the city completed the waterfall and pond now in front of you on that site. The project cost **$950,000**. Columbia contributed $250,000, half the amount it had pledged. The waterfall is the main physical evidence that remains from the gymnasium dispute.",
        "Columbia later expanded north of 125th Street. In **2007**, the City Council approved a seventeen-acre expansion into **Manhattanville**, supported by the possible use of eminent domain. Opponents challenged the finding of blight used to justify the project. On **December 3, 2009**, the Appellate Division rejected that finding in a three-to-two decision. Justice James Catterson called it **\"mere sophistry\"** and criticized **\"the idiocy of considering things like unpainted block walls\"** as evidence of blight. New York's highest court **reversed the decision on June 24, 2010**, allowing Columbia to proceed. Judge Robert Smith agreed with the result but wrote that **\"the finding of 'blight' in this case seems to me strained and pretextual.\"**",
        "Columbia's role in Harlem was not the same as the University of Chicago's role in Hyde Park. The University of Chicago led the country's first federally approved urban renewal plan and directly financed racial covenants. Columbia's actions were more limited but included leasing public parkland, expanding through demolition and eminent domain, and remaining at the top of a hill that federal appraisers rated separately from Harlem below. Both institutions treated parts of the surrounding neighborhood as areas to be managed through institutional planning. Similar approaches appear again on the main route.",
      ],
      images: [
        {
          src: `${MEDIA}/morningside-columbia-1925-from-the-caption-print.jpg`,
          alt: "Oblique black and white aerial photograph of upper Manhattan, mounted on a card typed Cathedral St. John Divine, New York City. A large cathedral under construction stands at lower centre, its nave still an open foundation beside the finished crossing dome. To its upper left a grid of blocks holds a campus with a low domed library and a colonnaded portico. A long dark strip of parkland with bare trees runs diagonally from lower centre to upper right, separating that grid from a tighter grid of rooftops on the right. White lettering along the bottom of the print reads CATHEDRAL ST JOHN DIVINE, NEW YORK, N.Y. beside a code containing 10-26-25.",
          credit:
            "Aerial view over the Cathedral of Saint John the Divine under construction, with Columbia, Morningside Park and Harlem beyond. The print carries a date code of 10-26-25. U.S. National Archives, Record Group 18, local identifier 18-AA-92-51, via Wikimedia Commons. Public domain.",
          label: "1925 (from the caption printed on the photograph; NARA gives no item-level date)",
          after: 1,
        },
        {
          src: `${MEDIA}/morningside-columbia-1968.jpg`,
          alt: "Coarse newspaper halftone of a dense crowd. At the left, several young men in jackets, one in a light helmet, gesture with raised arms. Across the centre, dozens of figures in light-coloured helmets are packed shoulder to shoulder toward an open doorway in a brick building. At the right, people sit on a ledge beneath a large hand-lettered sign whose paint strokes are only partly legible.",
          credit:
            "The photograph Helix ran above its account of the Columbia revolt, volume 3, number 7, May 9, 1968. No photographer is credited on the page, and the issue is catalogued to Paul Dorpat. Seattle Public Library via the Digital Public Library of America and Wikimedia Commons. No Copyright, United States.",
          label: "1968",
          after: 4,
        },
        {
          src: `${MEDIA}/morningside-columbia-1908-to-1909.jpg`,
          alt: "Colour postcard view looking down over Morningside Park. In the foreground, poplars and shrubs on a slope, with a curved railed overlook at the lower right. Behind them an elevated railway on iron trestles crosses the frame, with a train running on it. Beyond the tracks, rows of five and six storey brick and stone flats fill the distance. Printed along the bottom, 12453 MORNINGSIDE PARK, NEW YORK CITY, and along the top right, COPR. DETROIT PUBLISHING CO.",
          credit:
            "Morningside Park and the Ninth Avenue elevated. Detroit Publishing Company postcard number 12453, 1908 to 1909, New York Public Library, via Wikimedia Commons. Public domain.",
          label: "1908 to 1909",
          after: 5,
        },
      ],
      nowImage: {
        src: `${MEDIA}/morningside-columbia-today.jpg`,
        alt: "A green pond in a city park. Canada geese swim on the water and stand on boulders along the right bank. Behind the pond a grey rock cliff runs across the frame, with trees growing on it and above it. A willow hangs over the water at the left. A paved path curves along the right side, where a few people are standing and walking.",
        credit:
          "The pond in Morningside Park, built on the site of the gymnasium excavation Columbia abandoned. Photograph by Jim.henderson, 2019, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Return east along 125th Street to Lenox Avenue, turn north, and walk five blocks to West 130th Street. Turn east. The houses with the wooden porches on the south side are Astor Row.",
        distanceMeters: 1300,
        minutes: 17,
      },
      sources: [
        { label: "Mapping Inequality, the HOLC appraisal of area B7, Cathedral Heights, Manhattan, the block containing Columbia University", url: "https://dsl.richmond.edu/panorama/redlining/map/NY/Manhattan/area_descriptions/B7" },
        { label: "Mapping Inequality, the HOLC appraisal of area D22, Morningside Avenue, Manhattan, the Harlem blocks below the cliff", url: "https://dsl.richmond.edu/panorama/redlining/map/NY/Manhattan/area_descriptions/D22" },
        { label: "Mapping Inequality, Redlining in New Deal America (Digital Scholarship Lab, University of Richmond)", url: "https://dsl.richmond.edu/panorama/redlining/" },
        { label: "Columbia University Libraries, 1968 Columbia in Crisis, the Morningside Park gymnasium", url: "https://exhibitions.library.columbia.edu/exhibits/show/1968/causes/gym" },
        { label: "Columbia University Libraries, 1968 Columbia in Crisis, the Bust of April 30, 1968", url: "https://exhibitions.library.columbia.edu/exhibits/show/1968/bust" },
        { label: "Columbia University Libraries, 1968 Columbia in Crisis, timeline of events", url: "https://exhibitions.library.columbia.edu/exhibits/show/1968/timeline" },
        { label: "Brian D. Goldstein, The Roots of Urban Renaissance, Gentrification and the Struggle over Harlem (Harvard University Press, 2017)", url: "https://www.hup.harvard.edu/books/9780674971509" },
      ],
    },
    {
      id: "astor-row",
      number: 4,
      title: "Astor Row",
      dek: "Twenty-eight houses built on land the Astor family bought for $10,000 and kept all white until 1921",
      mapLabel: "Astor Row",
      lat: 40.81006,
      lng: -73.94108,
      audioSrc: `${MEDIA}/audio/astor-row.mp3`,
      audioSeconds: 283,
      transcript: [
        "This is the oldest surviving residential row in Central Harlem. The three-story brick houses stand behind small front yards and have wide wooden porches supported by turned columns, an uncommon design in Manhattan. The Landmarks Preservation Commission states that the porches and yards are **\"much more suggestive of the rural background of Harlem than of the urban area it was becoming.\"**",
        "**John Jacob Astor bought this block at auction in 1844 for $10,000.** The property passed to his son William Backhouse Astor in 1848. In 1875, it passed to William's sons, who divided it the following year. **William Astor received the northern half facing 130th Street** and developed the row. Numbers 8 through 22 were built in **1880 and 1881**, numbers 24 through 38 in **1882 and 1883**, and numbers 40 through 62 in **1883**. Charles Buek built the first group. Those houses stand in freestanding pairs. The later houses form a continuous row with deep recesses that create the appearance of pairs.",
        "Harlem's large supply of late nineteenth-century row houses developed after rail transportation reached the area. Elevated lines arrived **between 1878 and 1881**, quickly changing a farming district into a commuter suburb. Construction peaked in 1881. The recession of 1893 stopped development, and speculation resumed around 1895. One Harlem history states that **almost overnight Harlem's entire housing inventory was built during the frenzy from 1890 to 1905**. Except for the public housing developments, nearly every building on this tour was constructed within about twenty-five years for a white tenant population that never became large enough to fill it.",
        "**This block remained an all-white enclave into the early 1920s** because the Astor family continued to own most of it and generally refused to sell. In 1893, the row passed to William Astor's grandchildren, Mary, James, and Sarah Van Alen. **Sarah sold numbers 42 through 62 in 1912. Mary and James kept their properties until 1920 and 1921.** The Landmarks Preservation Commission describes the row as **\"An all-white enclave until that point.\"**",
        "Sarah's sale in 1912 began the transfer of the block, but ownership did not fully change until Mary and James sold in 1920 and 1921. The Astors did not need a covenant or an improvement corporation to exclude Black residents. A family that owned an entire blockfront could control occupancy simply by refusing to sell. This form of exclusion was based on ownership rather than a recorded restriction, so it is not addressed by a law that removes racial covenants from deeds.",
        "In **November 1920**, the *New York Times* described the block as **\"one of the most attractive and exclusive home centres\"** in Harlem and **\"a picture of domestic tranquility and comfort which few other blocks in the city possess.\"** Claude McKay called it **\"the block beautiful.\"** in his 1928 novel *Home to Harlem*. The Landmarks Preservation Commission records the later change: **\"Although built for single families, within a short time they were carved up into boarding houses and single-room-occupancy dwellings.\"** Houses designed for one family began housing many residents because of the housing pressures explained at the next several stops.",
        "By **1990, most of the porches had been removed or were in serious disrepair**. Brooke Astor saw the row during a tour of Upper Manhattan, and the Vincent Astor Foundation gave **$1.7 million** to the New York Landmarks Conservancy for the Astor Row Porch Project. All but three of the twenty-eight houses now have new or restored porches. The Conservancy also converted two vacant buildings into an eight-unit limited-equity cooperative, and Abyssinian Baptist's development organization helped restore two houses. Money from a later generation of the Astor family therefore helped restore the row built by the earlier generation.",
        "The next stop is one block north, on West 130th and West 131st Streets. There, white property owners used a recorded restriction that the Astor family had not needed.",
      ],
      images: [
        {
          src: `${MEDIA}/astor-row-1896.jpg`,
          alt: "A black and white photograph of an elevated railway. A train of four wooden passenger cars runs along a curving steel viaduct carried high on tall latticework columns. Beneath the structure is an unpaved dirt street with wagon ruts. Two women in shawls stand on a low sidewalk at the left beside piles of rubble and stacked pipe, and several men stand along a plank fence at the right. Bare trees and open ground fill the middle distance, with a large institutional building on a rise behind. A handwritten number, 24767-aa, is inked on the sky at upper left, and a printed copyright line runs along the lower right edge.",
          credit:
            "Elevated railroads in New York City, at 110th Street, at the southern edge of Harlem. Photograph copyrighted by J. S. Johnston, dated 1896 by the Library of Congress. Prints and Photographs Division, digital ID cph.3b04566, LOT 5282, via Wikimedia Commons. No known restrictions on publication.",
          label: "1896",
          after: 1,
        },
        {
          src: `${MEDIA}/astor-row-undated-catalogued-approximately-1760-.jpg`,
          alt: "A colored print looking out from high ground across a wide flat plain. The foreground holds tilled farm fields in strips of green, gold and reddish brown, with scattered farm buildings, hedgerows, haystacks and a straight road crossing diagonally. Woods and a curving carriage drive with riders fill the lower right corner. In the middle distance sits a cluster of low white buildings with a long shed, and beyond that rows of larger houses and blocks of buildings stretch to the horizon under a sky of tall white and grey clouds. Printed beneath the image is the caption HARLEM. From the old Fort in the Central Park.",
          credit:
            "Harlem, from the old fort in the Central Park. Undated color print from Booth's History of New York, catalogued by the New York Public Library as approximately 1760 to 1900. Emmet Collection of Manuscripts Relating to American History, Miriam and Ira D. Wallach Division of Art, Prints and Photographs, New York Public Library, via Wikimedia Commons. Public domain.",
          label: "undated, catalogued approximately 1760 to 1900",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/astor-row-today.jpg`,
        alt: "A long row of three-story red brick houses running down the south side of a street, each set back behind a small front yard enclosed by a low iron fence. Every house has a wide covered wooden porch carried on slender turned columns, with a band of thin spindles running along the top of the porch under the roof. Windows are trimmed with painted stone lintels. Bare trees stand along the sidewalk, cars are parked at the curb, a cyclist rides in the roadway, and a taller brick apartment building rises behind the row in the distance.",
        credit:
          "Astor Row, the row houses on the south side of West 130th Street between Fifth and Lenox Avenues in Harlem. Photograph by Beyond My Ken, 2014, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk west along Astor Row to Lenox Avenue and cross it. Continue west on West 130th Street one block, turn north to West 131st Street, and stop midway along the block, between Lenox Avenue and Adam Clayton Powell Jr. Boulevard, with the row houses on both sides of you.",
        distanceMeters: 450,
        minutes: 6,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, 40 West 130th Street House, Part of Astor Row, Designation Report (LP-1153, August 11, 1981)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1153.pdf" },
        { label: "New York City Landmarks Preservation Commission, 32 West 130th Street House, Part of Astor Row, Designation Report (LP-1149, August 11, 1981)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1149.pdf" },
        { label: "New York Landmarks Conservancy, the Astor Row Porch Project", url: "https://nylandmarks.org/what-we-do/success-story/astor-row/" },
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
        { label: "Claude McKay, Home to Harlem (Harper and Brothers, 1928)", url: "https://archive.org/details/hometoharlem0000clau_g8x4" },
        { label: "Gilbert Osofsky, Harlem, the Making of a Ghetto (Harper and Row, 1966)", url: "https://archive.org/details/harlemmakingofg00osof" },
        { label: "Kevin McGruder, Race and Real Estate, Interracial Conflict and Co-Existence in Harlem, 1890-1920 (Columbia University Press, 2015)", url: "https://archive.org/details/racerealestatein0000mcgr" },
      ],
    },
    {
      id: "covenant-blocks",
      number: 5,
      title: "The covenant blocks",
      dek: "A recorded 1912 agreement signed by more than sixty-five property owners on these blocks",
      mapLabel: "Covenant blocks",
      lat: 40.81216,
      lng: -73.94414,
      audioSrc: `${MEDIA}/audio/covenant-blocks.mp3`,
      audioSeconds: 148,
      transcript: [
        "These are among the best-documented racially restricted blocks in New York City. On **February 15, 1912**, more than **sixty-five white property owners** on both sides of West 130th and West 131st Streets signed and recorded one agreement. The document remains on file in the New York County Register's office in **Conveyance Liber 159, pages 9 through 11**.",
        "The owners agreed that they would **not sell or rent to people described as \"negro, mulatto, quadroon, or octoroon of either sex as tenant, guest, boarder, or occupant in any manner.\"** The wording classified people by fractions of ancestry so that the restriction could be applied in property transactions.",
        "The effect of another covenant in this area is also documented. In **1913**, the **Harlem branch of the YWCA** tried to move into **118 West 131st Street** but was blocked by a racial restriction on the property. The organization could not rent the building because its members were Black.",
        "The houses around you became part of the **Central Harlem West 130th to 132nd Streets Historic District on May 29, 2018**. The city now protects the buildings that the 1912 covenant was intended to reserve for white residents. The two documents were created more than a century apart.",
        "Saying that \"it did not work\" does not mean the covenant had no effect. It did not permanently keep these blocks white. Within a few years, the blocks had become Black because restricted housing choices allowed owners to charge Black tenants more, and enough owners chose the higher income over maintaining the agreement. However, the covenant still operated for a period of time and on particular properties. During those years, Black families excluded from these blocks paid higher prices elsewhere. Even a covenant that eventually failed imposed a financial cost while it remained effective.",
        "Philip A. Payton Jr. used the difference between white and Black housing demand to help break these restrictions. He lived and worked a few blocks away, and two buildings he advertised remain standing at the next stop.",
      ],
      interrupts: [
        {
          title: "Restrictive covenants",
          body: [
            "A racial covenant was **a restriction written into a property deed, or into a signed agreement among neighbors, prohibiting sale or rental to a Black person**. The restriction ran with the land and therefore applied to later owners, allowing one campaign to limit a block for many years. Covenants spread across the country during the 1910s and 1920s. In **1926, the Supreme Court allowed them to remain in Corrigan v. Buckley**, reasoning that they were private agreements between property owners rather than government action.",
            "Chicago used racial covenants on a much larger and more organized scale. In **1927, the Chicago Real Estate Board distributed a model racial covenant** drafted by counsel for the national realtors' association. More than **220 subdivisions in Cook County** adopted it, and one estimate found covenants covering **38 of Chicago's 85 square miles of residential land south of North Avenue**. New York's covenants were generally created locally and signed street by street. They are therefore harder to identify and did not remain effective as long. Harlem's covenant campaign was defeated within about a decade. Chicago's system lasted roughly twenty years and ended only after court action.",
            "The national ruling came in **1948 with Shelley v. Kraemer**. The Supreme Court held that court enforcement of a racial covenant was state action and therefore unconstitutional. The decision made the covenants **unenforceable**, but it did not remove or invalidate the language in the property documents. That language remains in many records.",
            "**Section 327-a of New York's Real Property Law took effect on June 3, 2026.** A property owner may now record a \"restrictive covenant modification document,\" at **no charge**. The filing must include a complete copy of the original instrument **with the unlawful covenant stricken** and must be signed under penalty of law. The Register cross-indexes the new filing to the original book and page, preserving the historical record while removing the restriction. Sellers must remove these covenants at closing. Condominium, cooperative, and homeowners' association boards **must delete or amend unlawful restrictions by June 3, 2027**, one year after the law took effect, and may do so without owner approval. The 1912 agreement in Liber 159 is the type of document covered by this law.",
            "**Rooted Forward has identified an area for further research.** Chicago has the Chicago Covenants Project, Minneapolis has Mapping Prejudice, and Seattle and Washington, DC, have similar projects. **New York City does not have a comprehensive deed-based covenant-mapping project.** The only New York State project listed by the National Covenants Research Coalition covers Syracuse. As a result, researchers must examine the property records for these blocks parcel by parcel, and no complete study has been published. A student project could create the first covenant micro-map of a Harlem block. Contact information for anyone interested in helping appears on the tour page.",
          ],
          after: 3,
        },
      ],
      images: [
      ],
      nowImage: {
        src: `${MEDIA}/covenant-blocks-today.jpg`,
        alt: "A five-story brownstone-fronted building photographed from the sidewalk in bright afternoon sun, with hard shadows falling across the facade. A wide stone stoop with thin iron railings and two potted plants rises to a pair of wood-and-glass double doors, the number 154 on the transom above them and a small round plaque fixed to the wall to the right. Above the entrance a three-sided bay projects on carved stone brackets and continues up through the middle floors, and a painted bracketed cornice runs along the roofline. Tree branches hang into the upper left of the frame above the neighboring stoop, whose transom reads 152. At the lower right an iron fence encloses a sunken basement areaway, and a paler adjoining facade recedes at the right edge of the frame.",
        credit:
          "154 West 131st Street, on the block where the Protective Association for 130th to 132nd Streets filed its February 1912 restrictive agreement. The building now stands in the Central Harlem West 130th-132nd Streets Historic District, designated May 29, 2018, and Romare Bearden lived here with his parents in the 1920s. Photograph by Jay Dobkin, 2020, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk north to West 132nd Street and turn west, staying between Lenox Avenue and Adam Clayton Powell Jr. Boulevard. Stop in front of number 103, and look along the block toward number 119.",
        distanceMeters: 150,
        minutes: 2,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
        { label: "Corrigan v. Buckley, 271 U.S. 323 (1926), United States Reports (Library of Congress)", url: "https://tile.loc.gov/storage-services/service/ll/usrep/usrep271/usrep271323/usrep271323.pdf" },
        { label: "Shelley v. Kraemer, 334 U.S. 1 (1948), United States Reports (Library of Congress)", url: "https://tile.loc.gov/storage-services/service/ll/usrep/usrep334/usrep334001/usrep334001.pdf" },
        { label: "New York Real Property Law section 327-a, modification of unlawful restrictive covenants (New York State Senate)", url: "https://www.nysenate.gov/legislation/laws/RPP/327-A" },
        { label: "Kevin McGruder, Race and Real Estate, Interracial Conflict and Co-Existence in Harlem, 1890-1920 (Columbia University Press, 2015)", url: "https://archive.org/details/racerealestatein0000mcgr" },
        { label: "The Chicago Covenants Project", url: "https://www.chicagocovenants.com/" },
        { label: "Mapping Prejudice, University of Minnesota", url: "https://mappingprejudice.umn.edu/" },
        { label: "National Covenants Research Coalition, Who We Are", url: "https://www.nationalcovenantsresearchcoalition.com/whoweare" },
      ],
    },
    {
      id: "payton-buildings",
      number: 6,
      title: "Payton's buildings",
      dek: "Two surviving houses advertised by Philip A. Payton Jr., who built a business around Harlem's restricted housing market",
      mapLabel: "Payton's buildings",
      lat: 40.81232,
      lng: -73.94253,
      audioSrc: `${MEDIA}/audio/payton-buildings.mp3`,
      audioSeconds: 438,
      transcript: [
        "**Philip A. Payton Jr.** advertised **103 West 132nd Street in 1913 for sixty-five dollars a month**. In the *New York Age* of August 12, 1915, he advertised **119 West 132nd Street for seventy-five dollars a month**. Both buildings remain standing with their original stoops. They are ordinary rental properties, and transactions involving buildings like these helped open Harlem to Black residents.",
        "Payton was born in **Westfield, Massachusetts, on February 27, 1876**, to a barber's family. In 1907, he described his career for Booker T. Washington's book *The Negro in Business*. He arrived in New York on **Sunday, April 10, 1899**, against his parents' wishes. He operated a department store weighing machine for **six dollars a week**, worked as a barber for five or six dollars, and in **February 1900 became a porter in a real estate office for eight dollars a week**. He opened his own firm on **October 1, 1900**. Payton wrote that during the first winter, **\"altogether I think we took in less than $125.\"**",
        "Payton described the family's financial condition directly: **\"Many were the days that we were compelled to live or rather exist on ten cents per day. One time I remember I walked from Nassau street to 134th street for the want of a five cent piece.\"** He and his wife survived largely on cornmeal. He also wrote: **\"Like all very poor people we had both a dog and a cat. Shortly after this both our cat and dog died. I have always claimed they starved to death, but Mrs. Payton won't have it that way.\"**",
        "Payton was later evicted from a flat he managed on West 134th Street. Soon afterward, he wrote, **\"One fine day I made a deal that netted me nearly $1,150.\"** By 1907, he held title to **$250,000 in New York real estate**. His advertisement stated: **\"COLORED TENEMENTS WANTED. Colored man makes a specialty of managing colored tenements; references; bond. Philip A. Payton, Jr., agent and broker, 67 W. 134th.\"** Payton and his wife Maggie lived at **13 West 131st Street**, east of Lenox Avenue on the street visited earlier in the tour.",
        "Payton built his business around two conditions. Harlem had many empty apartments, while Black New Yorkers had few neighborhoods where they could rent. James Weldon Johnson described the oversupply: **\"Harlem had been overbuilt with new apartment houses, the only rapid transportation was the elevated running up Eighth Avenue, the Lenox Avenue Subway had not yet been built. This left the people on Lenox Avenue and to the east with only the electric street-cars.\"** Owners of empty buildings were willing to accept Black tenants. Because those tenants were excluded elsewhere, they were often willing or forced to pay higher rents. Payton connected the owners and tenants and earned commissions on the transactions.",
        "On **June 15, 1904**, Payton chartered the **Afro-American Realty Company**. It was authorized to issue **fifty thousand shares at ten dollars each, for a total of five hundred thousand dollars**. The directors included **Fred R. Moore**, editor of the *New York Age*; **Emmett J. Scott**, secretary to Booker T. Washington; and real estate brokers **John E. Nail** and **Henry C. Parker**. The company's prospectus explained its business strategy in the following statement:",
        "**\"Race prejudice is a luxury, and, like all other luxuries, can be made very expensive in New York City if the negroes will but answer this call of the Afro-American Realty Company. With a cash capital of $500,000 the Afro-American Realty Company can turn race prejudice into dollars and cents. The very prejudice which has heretofore worked against us can be turned and used to our profit.\"**",
        "By 1907, the company controlled **twenty apartment houses valued at $690,000**. It owned six and leased fourteen, with annual rents totaling **sixty-six thousand dollars**. About **$135,000 of the authorized $500,000 had actually been paid in**. Some later accounts give much larger figures, but those numbers first appeared in a 2004 newspaper column rather than a period source. This tour therefore uses the figures published in Washington's 1907 book.",
        "The Afro-American Realty Company did not last. In **October 1906, thirty-five stockholders filed suit**, alleging that the prospectus described five-year leases even though each lease could be cancelled after sixty or ninety days. They also claimed that stock had been issued using inflated property values. Payton was **arrested on January 29, 1907** and responded: **\"The whole affair is a spite action. All the charges of fraud against me are absolutely absurd.\"** The company paid one dividend in June 1907 and stopped operating in 1908.",
        "Payton continued working in real estate. On **July 10, 1917**, he completed the largest transaction of his career: **six six-story, fireproof elevator buildings containing more than three hundred apartments** on West 141st and West 142nd Streets between Lenox and Seventh Avenues. The buildings covered about three-quarters of a block, were assessed at more than one million dollars, and were part of a transaction valued at about **one and a half million dollars**. The *New York Times* called it **\"the most important transaction in the history of this city for the housing of negroes.\"** Payton renamed the buildings **Attucks, Toussaint, Wheatley, Dunbar, Douglass, and Washington Courts** and announced that **each lobby would display a portrait of the person for whom the building was named**. The route later passes these buildings. **Philip Payton died of liver cancer on August 29, 1917, at age forty-one, seven weeks after the transaction.**",
        "Historian Kevin McGruder, who examined the deed records, identifies an important limitation in Payton's model. The business **depended on** the segregation it used because the higher rents paid by Black tenants created the profit. Payton ultimately managed all-Black buildings rather than the integrated buildings he had described, and his success helped reinforce the same racial boundary he crossed. His work expanded Black access to Harlem while also operating within and benefiting from a segregated housing market. Similar mixed results appear throughout the tour.",
        "The next stop is the West 135th Street block where this change began in the spring of 1904.",
      ],
      interrupts: [
        {
          title: "How race became a price",
          body: [
            "Black Harlem residents generally paid more for poorer housing because the market offered one housing supply to two groups with very different choices. On page 1020 of its **December 18, 1915** issue, the *Real Estate Record and Builders' Guide* published a study titled **\"How the Colored Population Live: Fifty Thousand in Harlem Paying High Rents.\"** Black Harlem families earned an average of **$791 a year and paid $281 in rent, or thirty-six percent of their income**. The study compared them with residents of **133 similar apartments occupied by German Jewish families in nearby districts, who paid $207 a year** despite having higher incomes. It reported that when buildings changed occupancy, **\"When these houses were opened to colored people the rents increased per month from $1 to $5 per apartment.\"**",
            "The study described two identical buildings that rented to white tenants for **sixteen to nineteen dollars a month**. After a neighboring library reduced the apartments' light, rents fell to **fourteen to seventeen dollars**. When the buildings were opened to Black tenants, the study reported: **\"the house is now filled with these families, who pay from $20 to $24 a month. There is a waiting list.\"** The apartments therefore rented at a premium of about forty percent even after their conditions had worsened.",
            "Twenty years later, the Mayor's Commission documented the same pricing pattern. Elevator buildings at Broadway and 147th Street, **\"where the owners boast that they would not have Negroes in their buildings,\"** rented to white tenants for **thirty-seven dollars a month**. Comparable apartments available to Black tenants **\"usually begin at $44 and run as high as $60.\"** The Commission also described how rents were **reduced for white tenants as a bribe to keep them** while a neighborhood was changing. Once Black demand became strong enough, owners removed the white tenants and rented the same apartments **\"at a figure 25 to 30 per cent above that normally paid by the white tenants.\"**",
            "The Commission summarized the cause of the price difference as follows: **\"That the landlords of Harlem are able to exercise such autocratic power over the lives of 200,000 people is due to the fact that Negroes cannot move about freely in the city and live where they please.\"** It later stated: **\"Crowded in a black ghetto, the Negro tenant is forced to pay exorbitant rentals because he cannot escape. He is the veritable slave of the landlord.\"**",
            "Chicago used different methods to produce a similar financial result. A **kitchenette** divided one apartment into as many as six units and multiplied the landlord's rental income. Under an **installment land contract**, a speculator bought a house cheaply from a departing white owner and resold it to a Black family at about twice the price, while providing no equity until the final payment. Duke researchers estimate that Chicago contract buyers lost between three and four billion dollars. **Harlem's method differed in form but served the same function.** Central Harlem consisted mainly of absentee-owned apartment buildings rather than owner-occupied houses, so the added cost appeared in rents and then in tenants' subletting. A landlord charged one family about thirty percent more, and that family often took in lodgers to meet the payment.",
          ],
          after: 8,
        },
      ],
      images: [
        {
          src: `${MEDIA}/hotel-theresa-1907.jpg`,
          alt: "A printed book plate with three panels inside a decorative border. At the left an oval portrait shows a seated Black man in a dark three piece suit and eyeglasses with a pale pocket square. At the right an oval portrait shows a Black woman in a high collared white blouse with a pendant. Between them a narrow upright photograph shows the front of a masonry row house with pale awnings at the windows and two doorways at street level. The printed captions below read Philip A Payton, Jr., Vice-President and Manager Afro-American Realty Co., New York, then Their home, New York City, then Mrs. Philip A. Payton, Jr.",
          credit:
            "Philip A. Payton Jr., vice president and manager of the Afro-American Realty Company, with Mrs. Payton and their New York home. From Booker T. Washington, The Negro in Business, Boston, Hertel, Jenkins and Company, 1907, via Wikimedia Commons. Public domain.",
          label: "1907",
          after: 1,
        },
        {
          src: `${MEDIA}/payton-buildings-1907.jpg`,
          alt: "A printed halftone plate divided into three panels. At left, an oval portrait of a seated Black man in a suit and waistcoat, wearing round eyeglasses, with a white pocket square in his breast pocket. At centre, a rectangular photograph of a narrow masonry row house seen from across the street, with three tiers of window openings, a wide round-arched window under a pale awning on the middle floor, dark doorways at street level, and a heavy bracketed roof cornice topped by a small pediment and urn finials. At right, an oval portrait of a Black woman turned in profile, wearing a high-necked white lace blouse and a pendant. Printed captions below the panels read Philip A Payton, Jr., Vice-President and Manager Afro-American Realty Co., New York, then Their home, New York City, then Mrs. Philip A. Payton, Jr.",
          credit:
            "Philip A. Payton Jr., his wife Maggie, and their New York home. Plate inserted after page 200 of Booker T. Washington, The Negro in Business, Hertel, Jenkins and Company, 1907. Photographer unrecorded. Scan from Google Books, via Wikimedia Commons. Public domain.",
          label: "1907",
          after: 4,
        },
        {
          src: `${MEDIA}/payton-buildings-1914.jpg`,
          alt: "A grainy black and white halftone portrait of a Black man from the chest up, turned slightly toward the viewer's right, wearing round wire-rimmed eyeglasses, a dark jacket, a white shirt collar and a patterned necktie, against a dark background.",
          credit:
            "Philip A. Payton Jr. Detail from the plate headed Leading Citizens of The Negro City, page 951 of The Outlook, volume 108, December 1914, illustrating the article A Negro City in New York by E. F. Dyckoff. Photographer unrecorded. Scan from Google Books, via Wikimedia Commons. Public domain.",
          label: "1914",
          after: 7,
        },
      ],
      toNext: {
        text: "Return east to Lenox Avenue, turn north, and walk three blocks to West 135th Street. Turn east toward Fifth Avenue and stop partway along the block, in front of the modern buildings on the south side.",
        distanceMeters: 510,
        minutes: 7,
      },
      sources: [
        { label: "Booker T. Washington, The Negro in Business (Hertel, Jenkins, 1907), chapter on Philip A. Payton Jr. and the Afro-American Realty Company", url: "https://archive.org/details/negroinbusiness00washgoog" },
        { label: "Real Estate Record and Builders' Guide, \"How the Colored Population Live: Fifty Thousand in Harlem Paying High Rents,\" December 18, 1915, page 1020 (Columbia University Libraries)", url: "https://rerecord.library.columbia.edu/document.php?vollist=1&vol=ldpd_7031148_056&page=ldpd_7031148_056_00001190" },
        { label: "Kevin McGruder, Race and Real Estate, Interracial Conflict and Co-Existence in Harlem, 1890-1920 (Columbia University Press, 2015)", url: "https://archive.org/details/racerealestatein0000mcgr" },
        { label: "James Weldon Johnson, Black Manhattan (Alfred A. Knopf, 1930)", url: "https://archive.org/details/blackmanhattan00john_1" },
        { label: "Gilbert Osofsky, Harlem, the Making of a Ghetto (Harper and Row, 1966)", url: "https://archive.org/details/harlemmakingofg00osof" },
        { label: "Cheryl Lynn Greenberg, \"Or Does It Explode?\" Black Harlem in the Great Depression (Oxford University Press, 1991), on the Mayor's Commission findings about Harlem rents", url: "https://archive.org/details/ordoesitexplodeb00gree" },
        { label: "Samuel DuBois Cook Center on Social Equity, Duke University, The Plunder of Black Wealth in Chicago", url: "https://socialequity.duke.edu/portfolio-item/the-plunder-of-black-wealth-in-chicago-new-findings-on-the-lasting-toll-of-predatory-housing-contracts/" },
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
      ],
    },
    {
      id: "west-135th-1904",
      number: 7,
      title: "West 135th Street, 1904",
      dek: "The West 135th Street block where threatened evictions were reversed within ten days",
      mapLabel: "135th St, 1904",
      lat: 40.81343,
      lng: -73.93924,
      audioSrc: `${MEDIA}/audio/west-135th-1904.mp3`,
      audioSeconds: 295,
      transcript: [
        "Most of the buildings connected to this stop no longer stand. The block's remaining property records document how several buildings changed hands as Black residents established themselves in Harlem.",
        "In the spring of **1904**, the **Hudson Realty Company** purchased three buildings at **40, 42, and 44 West 135th Street**. Together, they housed about thirty-eight Black households, and the company began removing the tenants. On **May 2, 1904**, the *New York Herald* reported: **\"One hundred families will be on the move to-day, and six hundred other families are perilously near eviction.\"**",
        "That evening, residents held a protest meeting at **Mercy Seat Baptist Church, 46 West 135th Street**, on this block. The *New York Times* reported on the meeting. The Reverend N. S. Epps explained: **\"The prospective opening of the subway has enhanced the desirability of the locality, and so the very landlords who had once invited the negro tenants are now trying to drive them out.\"**",
        "The planned subway increased the value of the surrounding property. The **Lenox Avenue subway, including the 135th Street station one block west, opened shortly after midnight on November 23, 1904**. Construction along this section had begun on **August 30, 1900**. During those four years, the expected transportation improvement made this block more desirable to property owners and developers.",
        "Within the next ten days, a series of property transactions began reversing the attempted removals. The sequence is documented in the deed records.",
        "**May 2.** Mercy Seat Baptist leased 46 West 135th Street for one hundred dollars a month, with an option to buy the property for sixteen thousand dollars. The owner was **Louis Partzschefeld**, a German-born cornice maker who lived nearby at 4 West 136th Street.",
        "**May 5.** Black undertaker **James C. Thomas** purchased **30 and 32 West 135th Street** from Charles and Katie Kroehle for **one hundred dollars and the assumption of thirty thousand dollars in mortgages**. The Kroehles had bought the buildings only fifteen days earlier. The rapid resale was a speculative transaction that transferred the properties to a Black buyer.",
        "**May 12.** Mercy Seat Baptist purchased 45 and 47 West 134th Street for sixteen thousand dollars. **Abyssinian Baptist** acquired 61 West 134th Street and assumed a twenty-five-thousand-dollar mortgage.",
        "**Late June and July.** Thomas sold both of his West 135th Street buildings to **Philip Payton**. Payton's total cost was **two hundred dollars, a thirty-thousand-dollar first mortgage, and a thirty-five-hundred-dollar second mortgage**.",
        "Partzschefeld, the Kroehles, and several other white owners who sold to Black buyers on this block were largely German American and had social and business connections outside Harlem. **They completed sales to Black buyers during the same weeks that nearby owners were organizing evictions.** Historian Kevin McGruder uses these transactions to show that Harlem's change was not simply a process of white residents leaving as Black residents arrived. Some white owners resisted Black occupancy, while others cooperated because the transactions were profitable. The owners who sold helped determine the outcome.",
        "Eighteen months later, the *New York Times* reported the reversed position of white tenants. On **December 17, 1905**, under the headline **\"REAL ESTATE RACE WAR IS STARTED IN HARLEM: Dispossessed White Men Ask Negroes to be Allowed to Stay,\"** the newspaper stated: **\"White folks, hat in hand, filed into the real estate office of a negro named Philip A. Payton, Jr., in West One Hundred and Thirty-fourth Street, yesterday, and pleaded that they might be left in undisturbed possession of their little flats over the holidays. They were scrutinized by the colored clerks.\"** Christmas was one week away. The article identified **Kassel and Goldberg** as the white real estate firm that had sold property to Payton.",
        "These transactions marked the beginning of Harlem's large-scale change in ownership and occupancy. Most of the buildings involved are now gone. The surviving evidence consists mainly of the deed chain, the history of a church that later moved, and the nearby subway entrance. Not every important housing event leaves a building that can still be visited.",
      ],
      images: [
        {
          src: `${MEDIA}/west-135th-1904-1938.jpg`,
          alt: "A black and white photograph of a long row of five and six storey brick walk-up apartment buildings along a wide street. Iron fire escapes zigzag down every facade, and bedding and laundry hang over several of them. High stoops with iron railings lead up to the entrance doors, and ground floor windows are covered with iron grilles. At the far left a low white brick storefront carries signs reading AUTO RADIOS and EXPERT RADIO SERVICE. A hanging sign partway down the block advertises furnished rooms. A few pedestrians walk along the sidewalk, blurred by the exposure, a car stands at the right, and streetcar tracks run through the wide roadway across the foreground. The print is stained across the sky at the top.",
          credit:
            "Walk-up apartment buildings on 135th Street near Fifth Avenue. Photograph by Aubrey Pollard for the Works Progress Administration, October 5, 1938. Schomburg Center for Research in Black Culture, Photographs and Prints Division, The New York Public Library. Public domain.",
          label: "1938",
          after: 1,
        },
        {
          src: `${MEDIA}/west-135th-1904-1914.jpg`,
          alt: "A black and white head and shoulders portrait of a Black man wearing round wire rimmed eyeglasses, a dark suit jacket, a white wing collar and a light patterned cravat. He is turned slightly to his right and looks toward the camera against a dark background. The picture is a coarse printed halftone reproduced from a magazine page, so the grain of the printing screen is visible throughout.",
          credit:
            "Philip A. Payton Jr., the Harlem real estate broker behind the Afro-American Realty Company. Photographer unknown, published in The Outlook, volume 108, number 17, December 23, 1914, page 951, in the article A Negro City in New York by E. F. Dyckoff. Via Wikimedia Commons. Public domain.",
          label: "1914",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/west-135th-1904-today.jpg`,
        alt: "A Harlem street corner in bright sunshine. In the foreground a green painted railing encloses a staircase descending to a subway entrance, and a sign on the kiosk reads 135 St Station, Uptown and The Bronx, with red circles numbered 2 and 3 and a line about an elevator across the street. Two cast iron lamp posts with green glass globes stand beside the stair, and an advertising panel mounted on the railing carries a poster for the film Date Night. A stack of white plastic patio chairs sits on the sidewalk next to the entrance. Signs on a pole at the left include a yellow school crossing sign, a red and white Don't Honk sign and a yellow diamond reading HOSPITAL. Crossing the intersection are a blue truck lettered All-Weld Products Corp pulling a white flatbed trailer loaded with steel gas cylinders, a silver car and, further off, a yellow school bus. Older brick apartment buildings and street trees line the left side. At the right a green and white street sign reads W 135 St, mounted on a pole in front of a tall modern building faced in grey panels with a dark bronze figure sculpture at its corner, and a red clad building under construction stands behind it.",
        credit:
          "West 135th Street at Lenox Avenue, looking north at the northbound stair of the 135th Street station on the IRT Lenox Avenue subway line. Photograph by Jim Henderson, April 7, 2010, via Wikimedia Commons. CC0 public domain dedication.",
        label: "Today",
      },
      toNext: {
        text: "Walk back west along 135th Street to Lenox Avenue, also signed Malcolm X Boulevard. The Schomburg Center is on the northwest corner at number 515, with the older red brick library building attached to it around the corner at 103 West 135th Street.",
        distanceMeters: 200,
        minutes: 3,
      },
      sources: [
        { label: "Kevin McGruder, Race and Real Estate, Interracial Conflict and Co-Existence in Harlem, 1890-1920 (Columbia University Press, 2015), the deed-by-deed account of the 1904 West 135th Street transactions", url: "https://archive.org/details/racerealestatein0000mcgr" },
        { label: "Booker T. Washington, The Negro in Business (Hertel, Jenkins, 1907), on the Hudson Realty evictions and the Afro-American Realty Company's purchase on West 135th Street", url: "https://archive.org/details/negroinbusiness00washgoog" },
        { label: "Gilbert Osofsky, Harlem, the Making of a Ghetto (Harper and Row, 1966)", url: "https://archive.org/details/harlemmakingofg00osof" },
        { label: "James Weldon Johnson, Black Manhattan (Alfred A. Knopf, 1930)", url: "https://archive.org/details/blackmanhattan00john_1" },
        { label: "New York City Landmarks Preservation Commission, St. Philip's Protestant Episcopal Church Designation Report (LP-1846, July 13, 1993), on the church purchases along West 133rd, 134th and 135th Streets", url: "https://s-media.nyc.gov/agencies/lpc/lp/1846.pdf" },
        { label: "New York City Landmarks Preservation Commission, Abyssinian Baptist Church and Community House Designation Report (LP-1851, July 13, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1851.pdf" },
        { label: "New York City Landmarks Preservation Commission, Schomburg Collection for Research in Black Culture, originally the West 135th Street Branch Library, Designation Report (LP-1133, February 3, 1981)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1133.pdf" },
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
      ],
    },
    {
      id: "schomburg",
      number: 8,
      title: "The Schomburg Center",
      dek: "The 135th Street and Lenox Avenue corner named in a 1914 exclusion plan, now home to a major Black history archive",
      mapLabel: "Schomburg",
      lat: 40.81434,
      lng: -73.94068,
      audioSrc: `${MEDIA}/audio/schomburg.mp3`,
      audioSeconds: 243,
      transcript: [
        "The fourth item in the 1914 property owners' plan was **\"To create a proper environment in the vicinity of 135th street and Lenox avenue.\"** This is that intersection. It is now the location of the world's largest research library devoted to Black history and culture.",
        "The older building around the corner at **103 West 135th Street** was constructed in **1904 and 1905** as a Carnegie library branch. **Charles F. McKim** designed it, and his firm appears again at Strivers' Row later in the tour. The building opened as a general neighborhood library just as Harlem's population was beginning to change.",
        "**Ernestine Rose**, the branch librarian during the 1920s, hired Black employees, added works by Black writers, and made the library an important working and meeting place during the Harlem Renaissance. In **1925**, the branch established a separate division for Negro literature, history, and prints.",
        "**Arturo Alfonso Schomburg** was a Puerto Rican man of African descent. After being told as a child that Black people had no history, he spent his life collecting books, documents, and art that showed otherwise. In **1926, the Carnegie Corporation gave the New York Public Library ten thousand dollars to purchase his collection**, which included about **five thousand volumes, three thousand manuscripts, and two thousand etchings**. The collection was placed in this building, and Schomburg became its curator in 1932. Materials such as the 1915 real estate journal and 1907 business memoir cited in this tour are available because collections like his were preserved.",
        "The dark building at **515 Malcolm X Boulevard** opened in **1980** and was designed by **Bond Ryder and Associates**. Partner **J. Max Bond Jr.** had led the Architects' Renewal Committee in Harlem during the late 1960s. That group created the community's alternative proposal for the State Office Building site discussed at stop two. Bond later designed this archive building. It was expanded in 2007 for eleven million dollars and underwent a $22.3 million renovation completed in 2017.",
        "The available research on New York covenants remains incomplete. Chicago's covenants have been mapped by the Chicago Covenants Project, and Minneapolis has Mapping Prejudice. **New York City has no comparable project.** The 1912 covenant discussed earlier is known because the Landmarks Preservation Commission cited it in a historic district report, not because researchers systematically examined Harlem's deeds. The Schomburg Center and the New York County Register contain the materials needed for that work. Rooted Forward would like to work with the Schomburg and a student research team to create the first covenant micro-map of a Harlem block. This remains an open research project.",
        "Behind you at **506 Lenox Avenue** is **Harlem Hospital**. In 1935, the Mayor's Commission reported that the hospital regularly held **450 patients despite having 325 beds**. It also found that **patient elevators had been out of service for more than a year and patients were transported in the garbage elevator**. The Commission described nursing assignments as **\"a deliberate attempt to establish a Jim Crow health set-up.\"** In 1934, nurses made **11,471 school visits in East Harlem**, compared with **1,417 in Central Harlem**. These findings show how housing segregation and neighborhood conditions also affected health services.",
      ],
      images: [
        {
          src: `${MEDIA}/schomburg-1915.jpg`,
          alt: "A three-storey classical library building of light stone standing mid-block among taller brick tenements, with three tall arched ground-floor windows behind an iron railing, a carved cornice, and a row of square upper windows. A bare tree stands at the curb and a few figures are on the sidewalk.",
          credit:
            "The 135th Street branch of the New York Public Library in 1915, eleven years before Arturo Schomburg's collection was bought for it. New York Public Library Digital Collections, via Wikimedia Commons. Public domain.",
          label: "1915",
          after: 1,
        },
        {
          src: `${MEDIA}/schomburg-reference-room-1926.jpg`,
          alt: "The interior of a library reference room with long wooden tables and bentwood chairs down the centre, tall windows along the far wall, low bookcases beneath them, and a card catalogue and reading lamps at the near end.",
          credit:
            "The reference room at the 135th Street branch in 1926, the year the Carnegie Corporation bought Arturo Schomburg's collection for the library. Print from a lantern slide, New York Public Library Digital Collections, via Wikimedia Commons. Public domain.",
          label: "1926",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/schomburg-today.jpg`,
        alt: "A long red brick building fills a street corner, with a horizontal band of windows above a glazed ground floor and narrow slot windows in the brick above. At the corner a glass entrance pavilion carries a banner reading PROGRAMS. A green subway kiosk marked 135 St Station stands at the curb beside a traffic light, speed limit signs and an orange food truck. People walk on the sidewalk and a cyclist rides past bare spring trees. At the far left, along the side street, stands an older limestone building with a heavy bracketed cornice, a red tile roof edge, an arched window and two lanterns beside its doorway.",
        credit:
          "The Schomburg Center at 135th Street and Lenox Avenue, with the 1905 Carnegie branch at the far left. Photograph by ajay_suresh, 2022, via Wikimedia Commons. CC BY 2.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk west along 135th Street to Adam Clayton Powell Jr. Boulevard, turn south one block to West 134th Street, and turn west. St. Philip's Episcopal Church is on the south side of the street at number 204, a low church front of orange brick set into the row.",
        distanceMeters: 460,
        minutes: 6,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, Schomburg Collection for Research in Black Culture, originally the West 135th Street Branch Library, Designation Report (LP-1133, February 3, 1981)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1133.pdf" },
        { label: "New York Public Library, Schomburg Center, 135th Street Branch records, Sc MG 219", url: "https://archives.nypl.org/scm/21100" },
        { label: "New York Public Library Digital Collections, the Arturo Alfonso Schomburg papers", url: "https://digitalcollections.nypl.org/collections/arturo-alfonso-schomburg-papers" },
        { label: "Real Estate Record and Builders' Guide, \"Harlem's Problem: An Improvement Corporation to Deal with the Negro Invasion,\" January 31, 1914, page 205 (Columbia University Libraries)", url: "https://rerecord.library.columbia.edu/document.php?vollist=1&vol=ldpd_7031148_053&page=ldpd_7031148_053_00000517" },
        { label: "Cheryl Lynn Greenberg, \"Or Does It Explode?\" Black Harlem in the Great Depression (Oxford University Press, 1991), on the Mayor's Commission findings about Harlem Hospital", url: "https://archive.org/details/ordoesitexplodeb00gree" },
        { label: "Mayor's Commission on Conditions in Harlem, Report of Subcommittee Which Investigated the Disturbance of March 19th, May 29, 1935 (University of Minnesota Law Library)", url: "https://librarycollections.law.umn.edu/documents/archive/racial-justice/HarlemRiotReport1935.pdf" },
        { label: "Brian D. Goldstein, The Roots of Urban Renaissance, Gentrification and the Struggle over Harlem (Harvard University Press, 2017), on J. Max Bond Jr. and the Architects' Renewal Committee in Harlem", url: "https://www.hup.harvard.edu/books/9780674971509" },
        { label: "The Chicago Covenants Project", url: "https://www.chicagocovenants.com/" },
        { label: "Mapping Prejudice, University of Minnesota", url: "https://mappingprejudice.umn.edu/" },
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
      ],
    },
    {
      id: "st-philips",
      number: 9,
      title: "St. Philip's and the churches that bought Harlem",
      dek: "A Black congregation's reported $640,000 purchase of ten apartment buildings",
      mapLabel: "St. Philip's",
      lat: 40.81471,
      lng: -73.94436,
      audioSrc: `${MEDIA}/audio/st-philips.mp3`,
      audioSeconds: 368,
      transcript: [
        "St. Philip's is a relatively small church building, but the congregation's real estate purchases help explain how Harlem differed from Chicago.",
        "St. Philip's Episcopal Church was founded in 1818. Around **1909**, its rector, the **Reverend Hutchens Chew Bishop**, sold the congregation's West 25th Street property for about **six hundred thousand dollars**. He then used church funds to purchase Harlem real estate on a scale unusual for any Black institution at the time. The Landmarks Preservation Commission states: **\"Throughout 1908 Dr. Bishop, on behalf of St. Philip's, purchased tenement and rowhouse blocks along West 133rd, 134th and 135th Streets between Seventh and Eighth Avenues.\"** The figure most often cited is **$640,000 for ten apartment houses at 107 to 145 West 135th Street**.",
        "**Nail and Parker**, the Black real estate firm founded around 1905 by John E. Nail and Henry C. Parker, managed the properties. Both men had also served on the Afro-American Realty Company's board. St. Philip's vestry minutes dated **June 15, 1912** list the firm as agent for 107 through 145 West 135th Street and 219 West 133rd Street. James Weldon Johnson described the purchase as the largest real estate transaction by Black Americans up to that time. This tour attributes the claim to Johnson because no independent source was found to confirm the superlative.",
        "The same vestry minutes record a disagreement among Harlem's Black real estate leaders. **Philip Payton offered to exchange West 135th Street property for the church's West 25th Street parcel. The vestry refused to consider the proposal.**",
        "The present church was completed in **1910 and 1911** and designed by **Vertner Woodson Tandy** and **George Washington Foster Jr.** Tandy, a Cornell graduate, was the **first African American architect registered in New York State**. Foster had worked as a draftsman for Henry Hardenbergh and is believed to have worked for D. H. Burnham and Company on the Flatiron Building in 1903. The 1910 census counted only **fifty-nine Black architects in the United States**. The Bishop of Kyoto laid the cornerstone on **June 18, 1910**, and the church was dedicated on **March 25, 1911**. Orange Roman brick covers only the front facade. The Landmarks Preservation Commission interprets the repeated sets of three arches and gables as a reference to the Trinity.",
        "Two other Black congregations made major Harlem property purchases during the same period. **Mother AME Zion**, at 140 to 148 West 137th Street, was founded in 1796 and is New York's oldest Black congregation. It served as an Underground Railroad station and became known as the Freedom Church. Harriet Tubman and Frederick Douglass were members of the AME Zion denomination. Mother Zion's effort to purchase a Harlem church provides one of the clearest documented examples of a racial covenant affecting a sale in the neighborhood.",
        "The Reverend Bishop of St. Philip's **offered the Church of the Redeemer fifty thousand dollars** for its West 136th Street building. The white vestry members refused because they **believed they were bound by an agreement not to sell to Black buyers**. In **1914, the Church of the Redeemer sold the building for twenty-two thousand dollars to a white woman, who immediately resold it to Mother Zion**. The congregation therefore rejected a direct fifty-thousand-dollar offer on racial grounds and later sold the same property for **less than half that amount** through a white intermediary. The restriction cost the white congregation twenty-eight thousand dollars and delayed Mother Zion's purchase by only a few months.",
        "Mother Zion built its current church between **1923 and 1925**. **George W. Foster Jr.**, who also designed St. Philip's, was the architect. The building opened on **September 20, 1925**. The next day's *New York Times* reported that **more than seven thousand people attended the opening of the new $450,000 church** and described the congregation as **\"each time moving further uptown with the negro colony.\"**",
        "The third congregation is **Abyssinian Baptist**, located on West 138th Street later in the route. Its pastor, **Adam Clayton Powell Sr.**, wrote that members had **\"a superstitious belief that the 40th Street property was a gold mine, and if they held it long enough it would yield them a million dollars.\"** The church rejected an offer of **$240,000 in 1916**. Powell later wrote that **\"seven years later we were glad to accept one hundred and ninety thousand dollars.\"** He also stated that **\"it was apparent as early as 1911 that Harlem would be the final destination of the Abyssinian Church.\"**",
        "The locations of the three churches reflect the limited property available to Black congregations. White congregations leaving Harlem often occupied **corner lots**. By the time Black congregations began purchasing sites, the Landmarks Preservation Commission explains, **\"As few such sites remained available, Abyssinian Baptist, Mother Zion, and St. Philip's all erected their new homes on mid-block locations.\"** St. Philip's therefore stands within a row-house block rather than on a corner. The available real estate shaped the location of Harlem's major Black institutions.",
        "Two blocks north are the next two stops, one of the best-known residential addresses in Black America and, directly across the avenue, a block once identified as the most crowded in New York City.",
      ],
      images: [
        {
          src: `${MEDIA}/st-philips-1917.jpg`,
          alt: "A black and white photograph of a wide avenue filled with a long column of Black men marching in dark suits and straw boater hats. On the right, marchers carry a large white banner hand-lettered with the Declaration of Independence passage about all men being created equal, and under it the line reading if of African descent tear off this coupon. Hand-lettered placards rise from the middle of the column. Crowds of onlookers line both sidewalks, an American flag hangs from a building at center, and tall stone commercial buildings recede up the street.",
          credit:
            "The NAACP Silent Protest Parade on Fifth Avenue, July 28, 1917, marching against the East St. Louis massacre. In the front row are James Weldon Johnson at far right, W. E. B. Du Bois second from right, the Reverend Hutchens Chew Bishop of St. Philip's, and the realtor John E. Nail. Photographer unknown. Schomburg Center for Research in Black Culture, Photographs and Prints Division, The New York Public Library, via Wikimedia Commons. Public domain.",
          label: "1917",
          after: 1,
        },
      ],
      nowImage: {
        src: `${MEDIA}/st-philips-today.jpg`,
        alt: "A red-orange brick church front seen from the sidewalk, filling the frame. A tall pointed-arch window of pale blue and green stained glass sits below a gabled roofline capped with a stone cross. At street level, three narrow Gothic-arched windows in stone frames run between two stone doorways with dark wooden doors, each set under a carved gabled hood. A black iron fence runs along the sidewalk and parked cars fill the foreground.",
        credit:
          "St. Philip's Episcopal Church, 204 West 134th Street, today. Photograph by Beyond My Ken, 2014, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk west to Frederick Douglass Boulevard, turn north four blocks to West 138th Street, and turn east. You are entering Strivers' Row through the west gateway. Walk in until you are between the two rows.",
        distanceMeters: 600,
        minutes: 8,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, St. Philip's Protestant Episcopal Church Designation Report (LP-1846, July 13, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1846.pdf" },
        { label: "New York City Landmarks Preservation Commission, Mother African Methodist Episcopal Zion Church Designation Report (LP-1849, July 13, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1849.pdf" },
        { label: "New York City Landmarks Preservation Commission, Abyssinian Baptist Church and Community House Designation Report (LP-1851, July 13, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1851.pdf" },
        { label: "Kevin McGruder, Race and Real Estate, Interracial Conflict and Co-Existence in Harlem, 1890-1920 (Columbia University Press, 2015)", url: "https://archive.org/details/racerealestatein0000mcgr" },
        { label: "James Weldon Johnson, Black Manhattan (Alfred A. Knopf, 1930)", url: "https://archive.org/details/blackmanhattan00john_1" },
        { label: "Booker T. Washington, The Negro in Business (Hertel, Jenkins, 1907), on John E. Nail, Henry C. Parker and the Afro-American Realty board", url: "https://archive.org/details/negroinbusiness00washgoog" },
        { label: "Gilbert Osofsky, Harlem, the Making of a Ghetto (Harper and Row, 1966)", url: "https://archive.org/details/harlemmakingofg00osof" },
        { label: "New York City Landmarks Preservation Commission, Central Harlem West 130th to 132nd Streets Historic District Designation Report (LP-2607, May 29, 2018)", url: "https://s-media.nyc.gov/agencies/lpc/lp/2607.pdf" },
      ],
    },
    {
      id: "strivers-row",
      number: 10,
      title: "Strivers' Row",
      dek: "Row houses built for wealthy white residents, kept from Black buyers by an insurance company's sales policy, and sold to Black owners beginning in 1919",
      mapLabel: "Strivers' Row",
      lat: 40.81845,
      lng: -73.94326,
      audioSrc: `${MEDIA}/audio/strivers-row.mp3`,
      audioSeconds: 427,
      transcript: [
        "This is the St. Nicholas Historic District, designated on **March 16, 1967** as Harlem's first historic district. It is commonly known as Strivers' Row. The district contains 127 row houses in four rows, plus apartment buildings along the two avenue frontages. Including those apartment buildings produces the often-cited total of 146. The district is the most complete surviving example of the housing originally built for wealthy white Harlem residents.",
        "The developer, **David H. King Jr.**, had constructed the base of the Statue of Liberty, the Washington Arch, Madison Square Garden, and the Equitable Building. He purchased this land and promoted a development created **\"on such a large scale and with such ample resources as to 'Create a Neighborhood' independent of surrounding influences,\"** He described the site as **\"high, healthful and accessible, swept by the westerly breezes from the Hudson.\"**",
        "King hired three architectural firms to design different sections of the development. On the south side of 138th Street, the **even-numbered houses from 202 to 250** are Georgian designs in red brick and brownstone by **James Brown Lord**. These twenty-five houses are the **widest in the district, at about twenty-two feet**. They form three groups separated by wrought-iron gateways, and pairs of adjoining doors share a common stoop so that two houses appear as one larger residence. The **north side of 138th Street and the south side of 139th Street** contain thirty-five houses on each street by **Bruce Price and Clarence S. Luce**. They use buff brick and Indiana limestone and average about seventeen feet in width. The **odd-numbered houses from 203 to 269 West 139th Street** were designed by **McKim, Mead and White** in an Italian Renaissance style using dark mottled brown brick. These thirty-two houses are about nineteen feet wide. Number 233 is the center house and has a recessed porch with arches.",
        "The district's service alleys are another important part of the plan. King created a **main alley running from avenue to avenue and two shorter alleys between 138th and 139th Streets**. There were two gateways on each street and one at each avenue end. The original design included **circular flower beds and fountains where the interior alleys met**. The block association reports that the alleys are now used mainly for trash storage and parking. One surviving gate sign reads **\"Private Road. Walk Your Horses.\"**",
        "The rents show the income level of the intended residents. According to the Landmarks Preservation Commission, **working-class New York families paid ten to eighteen dollars a month**, while rents for these houses **began just below eighty dollars a month and ranged from nine hundred to seventeen hundred dollars a year**.",
        "The restrictions recorded by King are often incorrectly described as racial covenants. The agreement, dated **December 1890**, restricted **nuisances rather than race**. It prohibited stables, factories, tenements, oversized hotels, and alterations or additions. The Landmarks Preservation Commission cites the document, and **it contains no racial restriction**.",
        "Black buyers were excluded through the owner's sales policy rather than a recorded covenant. King lost control of the project after the **Panic of 1893** and transferred the remaining houses to his mortgage lender, the **Equitable Life Assurance Society**. Equitable **rented the houses, sold thirty-one in 1905, and retained the rest until selling them to Black buyers in 1919 and 1920**. For about twenty-five years, a life insurance company kept most of Harlem's most desirable row houses from Black purchasers. Because the policy was not written into the deeds, there was no covenant for a court to invalidate or a later law to remove.",
        "Some accounts state that the houses remained empty for decades and were later sold for eight thousand dollars each. The evidence does not support the claim that they were vacant, and the price appears to come only from Wikipedia. The documented facts are that Equitable controlled the sales and began selling the remaining houses to Black buyers in 1919. The correct description is a sales policy, not a racial covenant.",
        "The sales to Black buyers received public attention. **William Pickens's move to the district in February 1920 appeared on the front page of the *New York Age*.** Residents included many prominent Black professionals and artists: **W. C. Handy at 232 West 139th Street; Eubie Blake at 236 West 138th; Noble Sissle at 264 West 139th; Fletcher Henderson at 228 West 139th; Vertner Tandy, architect of St. Philip's, at 221 West 139th; heavyweight boxer Harry Wills at 245 West 139th; and Dr. Louis T. Wright, the first Black surgeon on Harlem Hospital's staff and later chair of the NAACP board, at 218 West 139th.** Composer **Will Marion Cook lived at 221 West 138th Street from 1918 until his death in 1944**. His house is a **National Historic Landmark**. Duke Ellington called Cook **\"the master of all masters of our people.\"**",
        "The name Strivers' Row was in use by the early 1920s. On **July 29, 1922**, the *Chicago Defender* reported that it originally referred to West 139th Street and the wealthy residents of the \"ultra set,\" adding that **\"usually it was as a roomer.\"** In **1928**, Wallace Thurman wrote: **\"139th Street, known among Harlemites as 'strivers' row.' It is the most aristocratic street in Harlem. When one lives on 'strivers' row' one has supposedly arrived.\"** The *Afro-American* defined a striver in 1929 as **\"the nearest equivalent in Harlemese to nouveau riche.\"**",
        "The 1935 Mayor's Commission documented unequal city services on this block. For **West 139th Street between Seventh and Eighth Avenues**, it reported: **\"As long as white residents lived in the block, the garbage and trash were collected regularly from the rear court; but as soon as the Negro residents moved in the block they were ordered to place the garbage and trash on their front sidewalks.\"** The houses, alleys, and city government remained the same, but the level of service changed when the residents became Black. Buying the property did not produce equal treatment.",
        "Cross Seventh Avenue to the east. The next block shows how overcrowded housing existed directly beside Strivers' Row.",
      ],
      images: [
        {
          src: `${MEDIA}/strivers-row-1980.jpg`,
          alt: "Black and white photograph looking west along West 138th Street. On the right, a continuous row of four story light brick town houses with heavy cornices, stoops and iron railings runs back along the block and recedes into the distance. Nearest the camera stands the end house of the row, wider than the rest, with carved ornamental panels above its windows and an arched doorway. Beside it a tall wrought iron gate hangs between two rusticated stone piers, closing the service alley, with a small posted sign on the gate. Cars of the period are parked along both curbs and a leafing tree overhangs the street at upper left. A label along the right edge of the negative reads HABS No. NY-5721-2.",
          credit:
            "The row on West 138th Street from the southeast, with the Will Marion Cook House at number 221 in the right foreground. Photograph by Jack E. Boucher, Historic American Buildings Survey, 1980. Library of Congress Prints and Photographs Division, HABS NY,31-NEYO,111A--2. No known restrictions.",
          label: "1980",
          after: 1,
        },
        {
          src: `${MEDIA}/strivers-row-1980-2.jpg`,
          alt: "Black and white photograph of a four story light brick town house at the east end of a row, seen from across the street. The front carries carved ornamental panels above the second and third floor windows and a deep overhanging cornice at the roofline. The east side wall, largely plain brick with a few windows, is turned toward the camera. A stoop with a black iron rail climbs to the main entrance, with a service door at sidewalk level beneath it, and adjoining houses of the same design continue to the left. At right a wrought iron gate hangs between two stone piers, closing the service alley beside the house, with a small posted sign on the gate. A leafy street tree stands at the curb and cars of the period are parked in front. A label across the top of the negative reads HABS No. NY-5721-1.",
          credit:
            "The Will Marion Cook House at 221 West 138th Street, the east end unit of its row, with the service alley gateway at right. Photograph by Jack E. Boucher, Historic American Buildings Survey, 1980. Library of Congress Prints and Photographs Division, HABS NY,31-NEYO,111A--1. No known restrictions.",
          label: "1980",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/strivers-row-today.jpg`,
        alt: "A long unbroken row of town houses on the north side of West 139th Street, photographed at an angle so the row recedes toward the far end of the block. The upper three floors are mottled orange-brown brick with stone window surrounds, small iron balconies and round carved medallions set between the windows. The ground floor and stoops are brownstone, each entry reached by a flight of steps with a black iron rail, several with clipped hedges and shrubs in front. Bare trees and a parking sign stand along the curb at right, and the pavement is wet. The house nearest the camera carries the number 245.",
        credit:
          "The McKim, Mead and White row on the north side of West 139th Street, numbers 219 to 245. Photograph by Beyond My Ken, 2014, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk east along West 138th Street, out through the gateway and across Adam Clayton Powell Jr. Boulevard, which is Seventh Avenue. Continue east on 138th. Abyssinian Baptist Church is on the south side of the street at numbers 132 to 142.",
        distanceMeters: 280,
        minutes: 4,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, St. Nicholas Historic District Designation Report, LP-0322 (March 16, 1967)", url: "https://s-media.nyc.gov/agencies/lpc/lp/0322.pdf" },
        { label: "Mayor's Commission on Conditions in Harlem, The Negro in Harlem (1936), digitized by the NYC Department of Records and Information Services", url: "https://harlemconditions.cityofnewyork.us/" },
        { label: "Historic American Buildings Survey, Will Marion Cook House, HABS NY-5721 (Library of Congress)", url: "https://tile.loc.gov/storage-services/master/pnp/habshaer/ny/ny1300/ny1334/data/ny1334data.pdf" },
        { label: "Wallace Thurman, Negro Life in New York's Harlem (Haldeman-Julius, 1928), Project Gutenberg edition", url: "https://www.gutenberg.org/ebooks/73870" },
        { label: "St. Nicholas Historic District Block Association, Strivers' Row", url: "https://www.striversrownyc.org/" },
        { label: "NYC Department of Records and Information Services, The Mayor's Commission on Conditions in Harlem, 1935", url: "https://www.archives.nyc/blog/2019/3/1/the-mayors-commission-on-conditions-in-harlem-1935" },
        { label: "Real Estate Record and Builders' Guide, digitized by Columbia University Libraries", url: "https://rerecord.cul.columbia.edu/" },
      ],
    },
    {
      id: "densest-block",
      number: 11,
      title: "The densest block in New York",
      dek: "A block with 620 residents per acre, directly east of Strivers' Row",
      mapLabel: "Densest block",
      lat: 40.81641,
      lng: -73.94037,
      audioSrc: `${MEDIA}/audio/densest-block.mp3`,
      audioSeconds: 401,
      transcript: [
        "The distance from Strivers' Row to this block is about two hundred fifty metres. In 1935, the housing conditions on the two sides of that distance were among the most unequal in New York City.",
        "The Mayor's Commission on Conditions in Harlem measured population density throughout New York City. On page fifty-three, it reported: **\"In the majority of the tracts occupied by Negroes, the density ranges from 150 to 450 persons per acre. However, one block in Harlem, between 138th and 139th Streets and Seventh and Lenox Avenues, has a density of 620 persons per acre, the highest in the entire city.\"**",
        "This is the block identified in the report. In 1930, New York City averaged about **thirty-six residents per acre**, while Manhattan averaged about 128. This block had **about seventeen times the citywide density**. It stood directly across Seventh Avenue from row houses twenty-two feet wide that had been built for households paying as much as seventeen hundred dollars a year.",
        "The Commission explained the relationship between density and housing costs: **\"Economic and racial barriers have held the Negro population within certain limits, thereby making the Negro at the same time the victim of overcrowding and high rentals.\"** Restricted movement caused Black residents to experience overcrowding and high rents at the same time.",
        "The Commission also studied nearby blocks household by household. On the block bounded by **137th Street, 138th Street, Seventh Avenue, and Lenox Avenue**, one block south, **sixty percent of 374 Black families paid more than half their income in rent**. Average monthly income was **$88.27**, and average rent was **$36.69, or forty-one percent of income**. On the block between **133rd and 134th Streets**, 301 families lived in 31 houses, **nine of which had been condemned**. **Ninety-seven families, about one-third of the block, spent sixty-one percent or more of their income on rent.**",
        "Many families met these costs by subletting rooms. **By 1940, forty percent of Black families in Harlem took in lodgers.** Wallace Thurman described the conditions in 1927: **\"People rent a five-room apartment, originally planned for a small family, and crowd two over-sized families into it. Hallways are curtained off and lined with cots. Living rooms become triplex apartments. Clothes closets and washrooms become kitchenettes. He who works nights will sleep by day in the bed of one who works days, and vice versa.\"**",
        "Rent parties provided another source of money. Thurman reported an admission charge of **twenty-five cents** and noted that Saturday nights were preferred because workers had recently been paid. Invitations were distributed **\"in pool halls, subway stations, cigar stores, and on the street.\"** He counted **twelve rent parties on one block, including five in a single forty-apartment building**. He also identified the area where they were not held: **137th to 139th Streets between Seventh and Eighth Avenues, where much of Harlem's upper class lived**. Thurman reproduced one invitation: **\"Hey! Hey! Come on boys and girls let's shake that thing. Where? At Hot Poppa Sam's, West 134th Street, three flights up. Jelly Roll Smith at the piano. Saturday night, May 7, 1927. Hey! Hey!\"**",
        "The health effects of overcrowding were severe. From 1929 through 1933, the tuberculosis death rate in the Central Harlem Health District averaged **247 per one hundred thousand residents**, compared with **119 on the Lower East Side**. In four health areas that were more than ninety-five percent Black, the rate ranged from **251 to 319**. Infant mortality in those same areas ranged from **94 to 120 deaths per thousand live births**. By 1934, the citywide white tuberculosis death rate was **49**. The Commission reported that the Black rate had risen from **\"175 per cent in excess of the white rate\"** to **\"nearly 400 per cent in excess.\"**",
        "On the south side of the street is **Abyssinian Baptist Church**, at 132 to 142 West 138th Street. The congregation purchased a 150-foot vacant lot in **April 1920**, built the church between **May 1922 and May 1923**, and dedicated it on **Sunday, June 17, 1923**. The building seated one thousand people and cost **$334,000** to construct and furnish. **More than eighty percent of the mortgage had already been paid at the dedication**, and the congregation burned the remaining mortgage on **January 11, 1928**. Membership later exceeded ten thousand under Adam Clayton Powell Jr. In **1987**, the church established the **Abyssinian Development Corporation**. It built senior housing at 50 West 131st Street, transitional housing at 139 to 143 West 138th Street, and middle-income condominiums at 51 West 131st Street. It also helped restore two Astor Row houses.",
        "**Liberty Hall** stood at **114 West 138th Street** on this block. **Marcus Garvey** and the Universal Negro Improvement Association purchased the former Metropolitan Baptist Tabernacle in 1919 and dedicated Liberty Hall on **July 27, 1919**. The hall seated six thousand people. One week after Garvey's mail-fraud conviction, **two thousand supporters met here** and called the verdict a miscarriage of justice. Garvey was deported in 1927. **Liberty Hall no longer stands. The address 114 West 138th Street no longer exists as a separate tax lot, and six-story apartment buildings now occupy the frontage.**",
        "During the same period, this block contained a major Black church, the headquarters of a major Black political movement, and the highest residential density recorded in New York City. These institutions and conditions developed together because housing restrictions concentrated a large population and many of its organizations within a limited area.",
      ],
      interrupts: [
        {
          title: "The report the mayor buried",
          body: [
            "The information at this stop comes from ***The Negro in Harlem: A Report on Social and Economic Conditions Responsible for the Outbreak of March 19, 1935.*** After the uprising discussed at stop two, Mayor La Guardia appointed an eleven-member commission chaired by **Charles H. Roberts**, New York's first Black alderman. Sociologist **E. Franklin Frazier** served as research director and principal author. Other members included **Countee Cullen, A. Philip Randolph, Eunice Hunton Carter, Hubert Delany, Morris Ernst, Arthur Garfield Hays, and Oswald Garrison Villard**. The Commission heard **160 witnesses during 21 public hearings and 4 closed hearings**. The Police Commissioner refused to testify, and the District Attorney instructed police officers not to appear.",
            "The Commission's transmittal letter is dated **March 19, 1936**, exactly one year after the uprising. **Mayor La Guardia did not publish the report.** The *New York Post* and the *Daily Worker* printed excerpts, while the *Amsterdam News* published the complete report and stated that the mayor considered it **\"too hot, too caustic, too critical, and too unfavorable.\"** **Arno Press issued the first complete public printing in 1969, thirty-four years later.** The Municipal Archives digitized the typescript in **2022**.",
            "The city scans contain **no searchable text layer**, which makes the report difficult to use and helps explain why a few secondhand quotations are repeated while its block-level data are rarely cited. Rooted Forward used optical character recognition on the housing, health, and March 19 chapters and compared the important figures with enlarged page images. Every number used at this stop was checked against the original typescript.",
            "The report ended its housing analysis with a judgment that also applies to a later stop: **\"the present proposed federal housing project for five or six hundred families will scarcely touch the problem of the 56,157 Negro families in Harlem.\"** The project was Harlem River Houses. **Its 574 apartments represented about one percent of 56,157 families.**",
          ],
        },
      ],
      images: [
        {
          src: `${MEDIA}/densest-block-1936.jpg`,
          alt: "A sepia-toned photograph of the same stone church front, taken from across the street at a sharp angle. A tall traceried window under a broad arch fills the centre of the facade, a square battlemented tower stands at the left with a smaller traceried window in it, and wooden doors sit at pavement level. An attached stone building with rows of mullioned windows runs off to the left, and a taller plain building shows at the far right edge.",
          credit:
            "Exterior of Abyssinian Baptist Church, Harlem, May 1936. Federal Writers Project New York City Guide photograph, negative no. 17. Schomburg Center for Research in Black Culture, Photographs and Prints Division, The New York Public Library. Public domain.",
          label: "1936",
          after: 1,
        },
        {
          src: `${MEDIA}/densest-block-1943.jpg`,
          alt: "A black and white photograph of a brick apartment house filling the picture area. Five storeys of closely spaced windows sit above ground floor storefronts, iron fire escapes zigzag down the facade, and most windows have drawn blinds or curtains. Signs at street level read Tailor and Furniture Shop. About half a dozen people stand or walk along the pavement. The scan carries a black film border with the handwritten negative number 23991-E along the bottom edge.",
          credit:
            "Harlem apartment house, New York. Photograph by Gordon Parks, May or June 1943. Farm Security Administration and Office of War Information photograph collection, Library of Congress Prints and Photographs Division, LC-USW3-023991-E. No known restrictions.",
          label: "1943",
          after: 4,
        },
        {
          src: `${MEDIA}/densest-block-1938.jpg`,
          alt: "A sepia-toned photograph mounted on a tan card, with the typed line Lenox Avenue, nos. 422-426 across the top and a pencilled reference at the top right. The picture shows a row of brownstone and brick walk-ups with shops at street level, hand-painted signs for A.B.C. Auto School, Mae's Beauty Salon and Mays and Johnson Beauty School, a barber pole beside a sign reading Shave 15 cents, people sitting on a stoop and leaning from an upper window, a man seated on a case beside a fruit and vegetable stand, and a woman walking along the pavement.",
          credit:
            "Harlem Street II, 422-424 Lenox Avenue. Photograph by Berenice Abbott, June 14, 1938, from Changing New York. The Miriam and Ira D. Wallach Division of Art, Prints and Photographs, The New York Public Library. Public domain.",
          label: "1938",
          after: 7,
        },
      ],
      nowImage: {
        src: `${MEDIA}/densest-block-today.jpg`,
        alt: "A large Gothic Revival church of rough-faced grey and brown stone seen from the sidewalk at a steep upward angle. A broad Tudor-arched window filled with vertical stone tracery fills the centre of the front, a square battlemented tower rises at the right, and a red double door sits under a pointed stone arch at street level behind a black iron fence. The pavement is wet and bare tree branches cross the upper right corner.",
        credit:
          "Abyssinian Baptist Church, 132 West 138th Street, Harlem. Photograph by Beyond My Ken, 2014, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Continue east on West 138th Street across Lenox Avenue to Fifth Avenue. The tall brick towers set back in landscaped grounds, running north and south along Fifth from 135th to 138th Street, are Riverton.",
        distanceMeters: 300,
        minutes: 4,
      },
      sources: [
        { label: "Mayor's Commission on Conditions in Harlem, The Negro in Harlem (1936), digitized by the NYC Department of Records and Information Services", url: "https://harlemconditions.cityofnewyork.us/" },
        { label: "Mayor's Commission on Conditions in Harlem, the housing chapter of The Negro in Harlem (1936)", url: "https://harlemconditions.cityofnewyork.us/housing/" },
        { label: "Sylvia Kollar, Conditions in Harlem Revisited, NYC Department of Records and Information Services (September 30, 2022)", url: "https://www.archives.nyc/blog/2022/9/30/conditions-in-harlem-revisited-from-the-1936-mayors-commission-report-to-today" },
        { label: "New York City Landmarks Preservation Commission, Abyssinian Baptist Church and Community House Designation Report, LP-1851 (July 13, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1851.pdf" },
        { label: "Wallace Thurman, Negro Life in New York's Harlem (Haldeman-Julius, 1928), Project Gutenberg edition", url: "https://www.gutenberg.org/ebooks/73870" },
        { label: "New York Public Library, Schomburg research guide to Marcus Garvey and the Universal Negro Improvement Association", url: "https://www.nypl.org/blog/2016/11/10/marcus-garvey-and-unia" },
        { label: "Universal Negro Improvement Association, Central Division (New York) Records, Schomburg Center for Research in Black Culture", url: "https://archives.nypl.org/scm/20787" },
        { label: "Abyssinian Baptist Church, church history", url: "https://www.abyssinian.org/history" },
      ],
    },
    {
      id: "riverton",
      number: 12,
      title: "Riverton",
      dek: "A segregated MetLife development connected to a major New York fair-housing case",
      mapLabel: "Riverton",
      lat: 40.81374,
      lng: -73.9369,
      audioSrc: `${MEDIA}/audio/riverton.mp3`,
      audioSeconds: 362,
      transcript: [
        "Riverton consists of seven thirteen-story buildings on twelve acres with **1,232 apartments**. The *New York Times* announced the project on **September 18, 1944**, reporting that rents would average twelve dollars and fifty cents per room. The developer was the **Metropolitan Life Insurance Company**, then the largest private landlord in the United States. MetLife worked with Robert Moses and the City of New York under a state law that gave redevelopment companies tax exemptions and eminent-domain powers.",
        "At the same time, MetLife was developing **Stuyvesant Town** on the Lower East Side. That project covered eighty acres and contained more than eight thousand apartments. Together with Peter Cooper Village, the two developments held more than eleven thousand apartments. Stuyvesant Town did not accept Black tenants. To clear the Gas House District for construction, MetLife and the city demolished, according to the Stuyvesant Park Neighborhood Association, **600 buildings containing 3,100 families, 500 stores and small factories, three churches, three schools, and two theaters**. About eleven thousand people were displaced. In 1945, the *New York Times* called the clearance **\"the greatest and most significant mass movement of families in New York's history.\"**",
        "MetLife chairman **Frederick H. Ecker** stated the company's policy directly: **\"Negroes and whites do not mix.\"** He also claimed that integration would reduce nearby property values. Longer versions of the quotation appear in later sources, but only the first sentence has been verified in a primary source, so this tour quotes only that sentence.",
        "Riverton allowed MetLife to answer criticism of Stuyvesant Town by providing a separate development for Black tenants in Harlem. Many Black leaders opposed this arrangement rather than treating Riverton as evidence of equal access. MetLife excluded Black applicants from a tax-supported project downtown while building a separate project for them about seventy blocks north, and it used Riverton to defend that policy.",
        "The federal mortgage-appraisal map also treated Riverton's site differently from most of Central Harlem. In 1937 and 1938, the Home Owners' Loan Corporation graded the area from 125th to 145th Streets as hazardous. However, the boundary **moved east to Park Avenue, returned to Fifth Avenue, and extended to the Harlem River**. This left the area east of Fifth Avenue between about 132nd and 142nd Streets in a separate, ungraded industrial and commercial zone. **Riverton was built within that excluded strip.** The part of Central Harlem that the federal appraisers did not mark red was the location MetLife selected for development.",
        "Three Black veterans applied to Stuyvesant Town and filed suit after MetLife rejected them. The case was **Dorsey v. Stuyvesant Town Corporation**. On **July 28, 1947**, Justice **Felice Benvenga** ruled for MetLife and held that **\"housing accommodation is not a recognized civil right.\"** The Appellate Division affirmed the decision **unanimously and without an opinion on December 20, 1948**. The **New York Court of Appeals upheld the whites-only policy on July 19, 1949**. The **United States Supreme Court denied review on June 5, 1950**, with **Justices Black and Douglas dissenting** from that denial.",
        "The three veterans were represented by **Charles Abrams, Thurgood Marshall, Joseph B. Robison, Will Maslow, and Shad Polier**. Marshall would argue the racial-covenant cases two years later and *Brown v. Board of Education* five years after that. MetLife's attorneys included **Samuel Seabury**. In dissent, Judge **Stanley Fuld** began with a wartime precedent: **\"Distinctions between citizens solely because of their ancestry are by their very nature odious to a free people.\"**",
        "Although the plaintiffs lost *Dorsey*, the case helped produce new fair-housing laws. New York City enacted the **Brown-Isaacs law**, which prohibited discrimination in privately developed housing receiving tax subsidies. It was named for Council members **Earl Brown and Stanley Isaacs**. The city later adopted the **Sharkey-Brown-Isaacs Fair Housing Practices Law**, extending the prohibition to **privately owned housing generally**. Sources commonly give the years 1951 and 1957, but they disagree on the exact enactment dates. The sequence is clear even though the precise dates remain unsettled. The later law is generally described as the first municipal fair-housing ordinance in the United States to cover private housing.",
        "The sequence shows the limits of the 1948 covenant decision. **Shelley v. Kraemer had already made racial covenants unenforceable**, but MetLife still won in 1949 because the company was not relying on a covenant. It was selecting tenants through a company policy. A Supreme Court decision ended judicial enforcement of one type of restriction, while a later city ordinance was needed to prohibit another. Housing discrimination continued through new methods after earlier methods were limited.",
        "One commonly repeated detail also needs correction. Some accounts state that a Brown-Isaacs amendment failed in 1944. The earlier proposal was the **Isaacs-Davis amendment**, introduced in 1943 by Stanley Isaacs and Benjamin J. Davis Jr. It was defeated after Robert Moses argued that its supporters were **\"obviously looking for a political issue and not for results.\"** **Earl Brown was not elected to the City Council until 1949.**",
      ],
      images: [
        {
          src: `${MEDIA}/riverton-1951.jpg`,
          alt: "Black and white elevated view down a long central mall. A fenced paved playground with children, a slide and a basketball hoop sits in the middle, with benches and young trees around it. Tall brick apartment towers line both sides and further towers stand in the distance.",
          credit:
            "Riverton, Madison Avenue at 135th Street, New York City, 1951. Gottscho-Schleisner Collection, Library of Congress, LC catalog gsc1994027490. No known restrictions on publication.",
          label: "1951",
          after: 1,
        },
        {
          src: `${MEDIA}/riverton-1951-2.jpg`,
          alt: "Black and white view along a broad paved walkway. Adults sit on benches with baby carriages at the left and a child rides a bicycle. Clipped hedges and a lawn run along the right behind a low rail. Tall brick apartment towers rise behind the trees, and an ornamental lamp post stands in the foreground.",
          credit:
            "Stuyvesant Town, 14th Street, New York City, 1951. Gottscho-Schleisner Collection, Library of Congress, LC catalog gsc1994027471. No known restrictions on publication.",
          label: "1951",
          after: 4,
        },
        {
          src: `${MEDIA}/riverton-1951-3.jpg`,
          alt: "Black and white ground level view across a mown lawn framed by dense clipped shrub beds, with a low fence at the far side. Beyond it stand five tall brick apartment towers with young trees between the lawn and the buildings, and the corner of another brick building fills the right edge.",
          credit:
            "Riverton, Madison Avenue at 135th Street, New York City, 1951. Gottscho-Schleisner Collection, Library of Congress, LC catalog gsc1994027477. No known restrictions on publication.",
          label: "1951",
          after: 7,
        },
      ],
      nowImage: {
        src: `${MEDIA}/riverton-today.jpg`,
        alt: "A dark grey sign lettered Riverton Square, Private Residential Community, standing on a cobbled walkway. Behind it are mature green trees and red brick apartment buildings with evenly spaced windows and window air conditioning units.",
        credit:
          "The Riverton Square sign at Riverton Houses, Harlem. Photograph by Free Culture NYU for Wikis Take Manhattan, 2008, via Wikimedia Commons. CC BY-SA 3.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk north along Fifth Avenue to West 140th Street, then west to Lenox Avenue. Stop at the northeast corner of Lenox and 140th, in front of the tall red-brick apartment slabs, which run east from Lenox toward Fifth. Look for the bronze plaque set into the sidewalk.",
        distanceMeters: 520,
        minutes: 7,
      },
      sources: [
        { label: "Dorsey v. Stuyvesant Town Corp., 190 Misc. 187 (New York Supreme Court, July 28, 1947), Caselaw Access Project", url: "https://case.law/caselaw/?reporter=misc&volume=190&case=0187-01" },
        { label: "Dorsey v. Stuyvesant Town Corp., 299 N.Y. 512 (New York Court of Appeals, July 19, 1949), Caselaw Access Project", url: "https://case.law/caselaw/?reporter=ny&volume=299&case=0512-01" },
        { label: "Shelley v. Kraemer, 334 U.S. 1 (1948), United States Reports, Library of Congress", url: "https://tile.loc.gov/storage-services/service/ll/usrep/usrep334/usrep334001/usrep334001.pdf" },
        { label: "Mapping Inequality, the HOLC residential security maps and area descriptions (Digital Scholarship Lab, University of Richmond)", url: "https://dsl.richmond.edu/panorama/redlining/" },
        { label: "Stuyvesant Park Neighborhood Association, Peter Cooper Village and Stuyvesant Town", url: "https://www.spnanyc.org/news/peter-cooper-village-stuyvesant-town" },
        { label: "New-York Historical, What's Wrong with This Picture, on Stuyvesant Town's tenant policy", url: "https://www.nyhistory.org/blogs/stuyvesant-town-whats-wrong" },
        { label: "City of New York, Where We Live NYC, the history of fair housing law in New York City", url: "https://wherewelive.cityofnewyork.us/fair-housing-nyc/fair-housing/" },
        { label: "The New York Times, issue of September 18, 1944, TimesMachine", url: "https://timesmachine.nytimes.com/timesmachine/1944/09/18/issue.html" },
      ],
    },
    {
      id: "savoy-title-one",
      number: 13,
      title: "The Savoy plaque",
      dek: "The Savoy Ballroom site and an urban-renewal project that removed more apartments than it replaced",
      mapLabel: "Savoy plaque",
      lat: 40.81759,
      lng: -73.93831,
      audioSrc: `${MEDIA}/audio/savoy-title-one.mp3`,
      audioSeconds: 211,
      transcript: [
        "The plaque below marks **596 Lenox Avenue**, the location of the **Savoy Ballroom** from 1926 to 1958. The ballroom had ten thousand square feet of dance floor, which was replaced twice because of wear. It was integrated from its opening and became the place where the Lindy hop developed. The Savoy closed in **1958** and was **demolished during March and April 1959**. Former dancers Frankie Manning and Norma Miller unveiled the plaque on **May 26, 2002**.",
        "The surrounding seven towers cover thirteen acres. They opened in 1957 as Delano Village and are now called Savoy Park. The development was built through **Title I urban renewal** and was identified in federal records simply as **\"North Harlem.\"** Harlem Estates, Inc. served as the private redeveloper.",
        "The project figures appear in Robert Moses's report *Slum Clearance Progress: Title I, New York City*, dated **July 15, 1957**. The report lists the acreage cleared, apartments removed, and apartments constructed for each project. For North Harlem, it records **13.07 acres, 1,108 existing apartments demolished, and 1,785 apartments built**. This project produced a net increase in housing.",
        "South along Lenox Avenue, between 132nd and 135th Streets and from Fifth Avenue to Lenox Avenue, is **Lenox Terrace**. In Title I records, the project was named **\"Harlem.\"** Moses's table lists **14.79 acres, 2,065 existing apartments demolished, and 1,710 apartments built**, producing **a net loss of 355 apartments**. The clearance project therefore ended with 355 fewer homes than had existed on the occupied site.",
        "West of Central Harlem, the **Morningside-Manhattanville** Title I project covered **9.39 acres**, demolished **1,384 apartments**, and built about **981**. On **October 21, 1957**, the *New York Times* reported on the project under the headline **\"3-YEAR SLUM PLAN RELOCATES 5,935.\"** The term \"relocates\" was commonly used for residents displaced by clearance.",
        "Moses's 1957 report also listed two Harlem Title I projects that were never constructed. **\"Mid-Harlem,\" covering 125th to 135th Streets from Eighth to St. Nicholas Avenues**, was identified as under study. **\"Cathedral Parkway,\"** was listed as a future project. Mid-Harlem would have covered an area ten blocks long and twelve blocks wide. Those sections of the neighborhood remained because the proposed projects did not proceed.",
        "As you walk north, look to the left on West 141st and 142nd Streets between Lenox and Seventh Avenues. The six elevator buildings there are the properties **Philip Payton purchased on July 10, 1917**, in the largest transaction of his career. He renamed them for Crispus Attucks, Toussaint Louverture, Phillis Wheatley, Paul Laurence Dunbar, Frederick Douglass, and Booker T. Washington. Payton died seven weeks after the purchase. The next stop takes its name from one of these buildings.",
      ],
      interrupts: [
        {
          title: "Urban renewal",
          body: [
            "Title I of the **Housing Act of 1949** allowed cities to condemn land classified as slum property, clear it, and sell it to private developers at a reduced price. The federal government paid two-thirds of the difference between acquisition cost and resale value. The program became one of the twentieth century's most influential housing policies and, in many cities, demolished more housing than it constructed. **New York used Title I more extensively than any other city**, through a Committee on Slum Clearance chaired by **Robert Moses** from 1949 to 1960.",
            "Across New York City, **nearly 100,000 families were displaced by clearance programs between 1946 and 1960**. The Community Service Society found that some households removed for one project **had previously been removed for another**. Residents had no right to return to the completed development, and meaningful relocation assistance did not exist during most of this period.",
            "Chicago's comparable project was the **Hyde Park-Kenwood Urban Renewal Plan**, approved on November 7, 1958. It covered about 856 acres, demolished 638 buildings, and displaced about 4,000 families. Those families represented roughly one-third of everyone displaced by urban renewal in Chicago. The University of Chicago led the effort through a commission it created and staffed. Harlem did not have one institution playing the same central role, which has made its clearance history less closely associated with a single organization, even though the number of apartments removed was larger.",
            "Public housing construction also relied on large cleared sites. **Lincoln Houses**, east of Central Harlem, opened on December 29, 1948 with 1,286 apartments. Skidmore, Owings and Merrill designed the project with **Tandy and Forbes**, the firm of Vertner Tandy. **St. Nicholas Houses** was completed on September 30, 1954 with **13 buildings and 1,526 apartments on 14.45 acres, at a cost of $20.5 million**. The *Amsterdam News* described the site as one of the city's most congested slums. The development was designed as one superblock and **doubled in size to qualify under the Housing Act of 1949**. **King Towers**, originally named Stephen Foster Houses, was completed on November 1, 1954 with 1,379 apartments. It was renamed for Dr. Martin Luther King Jr. in **May 1968**, one month after his assassination. **Drew-Hamilton Houses** opened on September 30, 1965 with 1,217 apartments in five twenty-one-story towers.",
            "By 1960, **Harlem had the largest concentration of public housing in the United States, with an estimated 60,000 residents in thirteen projects within two square miles**. Today, Community District 10 contains **17 NYCHA developments with 8,734 apartments and 16,583 residents**, or about one in eight Central Harlem residents. The NYU Furman Center uses a somewhat different boundary and counts individual properties rather than developments. It reports 63 properties and 7,766 rental units. Both sets of figures appear later in the tour. The difference results from boundaries and counting methods rather than conflicting evidence.",
            "One project on this list did not displace residents. **Polo Grounds Towers**, at 155th Street beside the Harlem River, opened on June 30, 1968. Its four thirty-story towers contain 1,614 apartments and were built on the former site of a baseball stadium. Federal survey records describe the land as vacant. The community still strongly opposed the project, but the concern was racial concentration rather than displacement. In June 1964, the Polo Grounds Community Association asked: **\"Why are more low-income houses being built in Harlem, especially a 30-story building, where the City knows it will not be integrated?\"** The New York State Committee on Discrimination in Housing had concluded in December 1962: **\"There is no realistic prospect of achieving any racial integration in this project as planned.\"** The completed project remained segregated as both groups had predicted.",
          ],
          after: 6,
        },
      ],
      images: [
        {
          src: `${MEDIA}/savoy-title-one-between-1935-and-1943.jpg`,
          alt: "A black and white lithograph of a crowded ballroom floor. Dozens of dancers, most of them Black, stand and dance close together in evening gowns and suits, several caught mid step with heads thrown back and mouths open in laughter. At the back, three musicians play on a raised bandstand behind music stands, the one on the right clearly on a trumpet. The print is stamped New York City WPA Art Project at lower left, titled The Savoy in pencil at lower center, and signed Dayton Brandfield in pencil at lower right.",
          credit:
            "The Savoy, a lithograph by Dayton Brandfield for the New York City WPA Art Project, made between 1935 and 1943. Schomburg Center for Research in Black Culture, Art and Artifacts Division, The New York Public Library, via Wikimedia Commons. Public domain.",
          label: "between 1935 and 1943",
          after: 1,
        },
      ],
      nowImage: {
        src: `${MEDIA}/savoy-title-one-today.jpg`,
        alt: "A bronze plaque headed SAVOY set into a polished pink granite pillar behind a black iron fence. Raised lettering fills the panel, with a relief of two dancers near the bottom and the words Home of Happy Feet 1926 to 1958 beneath them. Behind the pillar are a mown lawn, trees, and low red brick apartment buildings on both sides.",
        credit:
          "The Savoy Ballroom plaque on Lenox Avenue between 140th and 141st Streets. Photograph by Wikimedia Commons user Lukeholladay, 2013, via Wikimedia Commons. CC BY-SA 3.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk north on Lenox Avenue, past 141st and 142nd Streets, to West 145th Street. Turn west and go one avenue block to Adam Clayton Powell Jr. Boulevard, then north four blocks to West 149th Street. The large brick complex on the west side of the boulevard, built around interior courtyards, is the Dunbar Apartments.",
        distanceMeters: 1000,
        minutes: 13,
      },
      sources: [
        { label: "New York City Committee on Slum Clearance, Slum Clearance Progress, Title I, NYC, Seymour B. Durst Old York Library, Columbia University Libraries", url: "https://dlc.library.columbia.edu/durst/cul:37pvmcvdph" },
        { label: "Housing Act of 1949, Public Law 81-171, 63 Stat. 413 (July 15, 1949), U.S. Government Publishing Office", url: "https://www.govinfo.gov/content/pkg/STATUTE-63/pdf/STATUTE-63-Pg413.pdf" },
        { label: "Clio, Savoy Ballroom, Harlem 1926 to 1958", url: "https://theclio.com/entry/42765" },
        { label: "New York City Housing Authority, Development Data Book 2014", url: "https://www.nyc.gov/assets/nycha/downloads/pdf/ddb/2014ddb.pdf" },
        { label: "New York City Housing Authority, St. Nicholas Houses", url: "https://www.nyc.gov/site/nycha/about/comp-mod/st-nicholas-houses-and-todt-hill.page" },
        { label: "The New York Times, issue of October 21, 1957, TimesMachine", url: "https://timesmachine.nytimes.com/timesmachine/1957/10/21/issue.html" },
        { label: "WNYC, Robert Moses on Slum Clearance, from the Municipal Archives radio collection", url: "https://www.wnyc.org/story/robert-moses-on-slum-clearance/" },
        { label: "Hyde Park Historical Society, urban renewal maps for Hyde Park and Kenwood", url: "https://www.hydeparkhistory.org/urban-renewal-maps" },
        { label: "African American Intellectual History Society, The University of Chicago, Urban Renewal, and the Black Community", url: "https://www.aaihs.org/the-university-of-chicago-urban-renewal-and-the-black-community/" },
        { label: "Real Estate Record and Builders' Guide, digitized by Columbia University Libraries", url: "https://rerecord.cul.columbia.edu/" },
      ],
    },
    {
      id: "dunbar-apartments",
      number: 14,
      title: "The Dunbar Apartments",
      dek: "A 1928 cooperative where 511 families became owners and were returned to rental status in 1936",
      mapLabel: "Dunbar",
      lat: 40.8245,
      lng: -73.937,
      audioSrc: `${MEDIA}/audio/dunbar-apartments.mp3`,
      audioSeconds: 260,
      transcript: [
        "Enter through one of the archways and stand in the courtyard. The building's main importance to this tour is its history as a Black housing cooperative rather than its architecture.",
        "In early **1926**, **John D. Rockefeller Jr.** purchased this block from **William Vincent Astor for $500,000**. The seller belonged to the same Astor family that had owned the row on West 130th Street. Rockefeller hired garden-apartment architect **Andrew J. Thomas** to design **511 apartments** in six-story buildings around landscaped courtyards. The apartments had cross-ventilation and gardens rather than narrow airshafts. The Dunbar opened in **1928** and provided some of the highest-quality housing then available to Black families in the United States.",
        "The Dunbar was established as a **cooperative**, making resident ownership the central part of the plan. A family paid **$150 as a down payment** and then **$50 per room**. Those payments accumulated as equity in the apartment. For Black New Yorkers who had spent years paying unusually high rents, the cooperative offered a large group an opportunity to convert monthly housing payments into ownership and wealth.",
        "The residents included many prominent Black leaders and artists. **W. E. B. Du Bois** lived here. Explorer **Matthew Henson**, who reached the North Pole in 1909, also lived here, and a tablet at the boulevard entrance was dedicated to him on April 6, 1970. Other residents included **Bill \"Bojangles\" Robinson, Countee Cullen, and Paul Robeson**. **A. Philip Randolph** operated the **Brotherhood of Sleeping Car Porters** from an office in the complex. In **September 1928**, the **Dunbar National Bank** opened on the ground floor as Harlem's first bank, with Black tellers and officers.",
        "The Landmarks Preservation Commission's designation report describes the end of the cooperative in the following words: **\"In December 1936, Rockefeller foreclosed the mortgage and transferred the property from the corporation to himself as an individual. The cooperative plan was abandoned and the equity returned to each tenant who was then put on a rental basis.\"**",
        "After eight years of making ownership payments, 511 households received their equity back and became renters. The Depression was the immediate cause. Unemployment in Black Harlem was much higher than in the city overall, and many residents could no longer make their cooperative payments. The ownership structure also determined the result: **Rockefeller held all preferred stock and all voting stock**. Residents had financial equity but no voting control. When the cooperative failed, Rockefeller controlled the decision about what happened to their ownership interests.",
        "The result resembles what happened to Black homebuyers in Chicago through a different system. Chicago speculators sold homes on installment contracts under which buyers received no equity until the final payment and could lose the property after one missed payment. Duke researchers estimate that Black Chicago contract buyers lost **three to four billion dollars**. At the Dunbar, residents did build real equity and received it back, but they still became renters in apartments they had been purchasing. **The legal arrangements differed, but both systems limited long-term wealth accumulation.**",
        "Rockefeller's role also connects the Dunbar to Harlem River Houses, the next stop. Much of the proposed Harlem River Houses site two blocks north belonged to Rockefeller's Empire Mortgage Company. When New York City attempted to acquire the land, **Rockefeller refused to sell unless the city also purchased the Dunbar**. He was concerned that a new low-rent public development nearby would draw tenants away from his buildings. The total condemnation award was **$1,095,000**. Rockefeller had created high-quality housing for Black residents, but during the 1930s he also sought protection from lower-cost government housing nearby.",
      ],
      interrupts: [
        {
          title: "What happened to the equity",
          body: [
            "Much of the wealth difference between Black and white American families comes from housing. Housing wealth depends on who could purchase property, when they were allowed to purchase, and the terms available to them. This tour has covered five separate methods that limited housing equity for Black Harlem residents. Listed together, they show a repeated pattern rather than a series of unrelated events.",
            "**The premium.** Beginning in 1904, Black tenants paid twenty-five to sixty percent more than white tenants for comparable apartments. The real estate press documented this in 1915, and the Mayor's Commission documented it again in 1935. Money paid in above-market rent could not be saved for a down payment or other investment.",
            "**The withheld sale.** Equitable Life rented the Strivers' Row houses but did not sell the remaining properties to Black buyers until 1919 and 1920. The Astor family kept most of its West 130th Street row until 1921. Neither form of exclusion required a written restriction. Both kept roughly twenty-five years of property appreciation beyond the reach of Black buyers.",
            "**The failed cooperative.** From 1928 to 1936, Dunbar residents accumulated equity before foreclosure ended the cooperative and returned them to rental status.",
            "**The mortgage.** Beginning in the late 1930s, the federal appraisal system classified the entire neighborhood as hazardous. The red box two stops from here explains the maps in detail. Without access to mortgages, buildings were usually purchased by people or companies with cash rather than by the residents living in them.",
            "**The clearance.** Title I demolished 2,065 apartments at the Lenox Terrace site and replaced them with 1,710. The Morningside-Manhattanville project relocated 5,935 people. Residents of condemned buildings were not compensated for the value of remaining in their homes and communities.",
            "Any one of these events could be described as an individual loss. When five methods affected the same population in sequence over sixty years, they formed a larger system. The tour follows chronological order so that this progression can be seen clearly.",
          ],
          after: 7,
        },
      ],
      images: [
        {
          src: `${MEDIA}/dunbar-apartments-1929.jpg`,
          alt: "A black and white halftone photograph looking down a long open garden court between tall brick apartment blocks. A narrow paved walk runs away from the camera down the centre of the frame. A young tree with sparse foliage stands beside the walk on the left, and planting beds, low shrubs and grass border the walk on both sides. Further brick blocks step back into the distance on either side under a pale blank sky. No people are visible.",
          credit:
            "The garden court of the Dunbar Apartments in 1929, the year after the complex was completed. Halftone photomechanical print, photographer unrecorded, Black America collection, Schomburg Center for Research in Black Culture, Jean Blackwell Hutson Research and Reference Division, The New York Public Library. Public domain.",
          label: "1929",
          after: 1,
        },
        {
          src: `${MEDIA}/dunbar-apartments-undated-the-commons-record-giv.jpg`,
          alt: "A black and white photograph with the survey number HABS NY-5697-3 printed along the top edge. A six storey brick facade is seen straight on from across the garden court. At the centre of the ground floor a small arched doorway numbered 246 is reached by a short flight of steps and a paved path, with a framed plaque set into the brick above the door and a second small plaque on the wall to its right. Clipped hedges and a low rough stone wall flank the path. A window air conditioner projects from a window to the left of the entrance. Fire escapes zigzag down the projecting wing on the right. Leafy tree branches hang across the top of the frame.",
          credit:
            "One of the courtyard entrances of the Dunbar Apartments at 246 West 150th Street. Historic American Buildings Survey, photographer and date unrecorded. Library of Congress, Prints and Photographs Division, NY,31-NEYO,118-3. Public domain.",
          label: "Undated. The Commons record gives no date and no photographer, the Library of Congress catalogue was unreachable during this task, and window air conditioners visible in the frame place the exposure well after the 1920s and 1930s. Do not caption this one with a year.",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/dunbar-apartments-today.jpg`,
        alt: "A tall arched passage cut through a red brown brick building. A pale limestone surround frames the arch, with turned baluster columns and carved foliate capitals on either side and the number 2588 above the opening. Two shield shaped relief panels flank the number, each showing a kneeling robed figure with hands raised and head tilted back in song beneath floating musical notes, with a row of small faces behind. Above the arch a stone balcony with an iron railing carries a carved crest, an eagle with spread wings over an animal head with curved horns, two robed female figures standing either side of a carved profile portrait of a man, and a band of stylised clouds below. Through the dark passage a winter courtyard is visible with a paved walk running away from the camera, bare trees, patches of snow on the ground and ornamental iron gates and railings along both sides of the walk. At street level chain link fencing runs along both sides of the entrance, a small red sign reading Private Property No Trespassing is fixed to the brick at the right edge, and a passer by in a brown leather jacket is cut off by the left edge of the frame.",
        credit:
          "One of the eight arched entranceways into the Dunbar Apartments courtyard. The complex was begun in 1926 and completed in 1928, designed by Andrew J. Thomas and financed by John D. Rockefeller Jr., and it was designated a New York City landmark on July 14, 1970. Photograph by Beyond My Ken, February 2014, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Leave the courtyard onto Adam Clayton Powell Jr. Boulevard and walk north to West 151st Street. Turn east and cross Macombs Place. The low brick buildings set around planted courtyards, running from Macombs Place east toward Harlem River Drive between 151st and 153rd Streets, are Harlem River Houses.",
        distanceMeters: 380,
        minutes: 5,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, Dunbar Apartments Designation Report, LP-0708", url: "https://s-media.nyc.gov/agencies/lpc/lp/0708.pdf" },
        { label: "Gotham Center for New York City History, Housing to Remember, the Paul Laurence Dunbar Apartments", url: "https://www.gothamcenter.org/blog/housing-to-remember-the-paul-laurence-dunbar-apartments" },
        { label: "Samuel DuBois Cook Center on Social Equity at Duke University and the Nathalie P. Voorhees Center at the University of Illinois at Chicago, The Plunder of Black Wealth in Chicago (2019)", url: "https://ndccnetwork.org/wp-content/uploads/The-Plunder-of-Black-Wealth-in-Chicago.pdf" },
        { label: "New York City Landmarks Preservation Commission, Harlem River Houses Designation Report, LP-0894 (September 23, 1975)", url: "https://s-media.nyc.gov/agencies/lpc/lp/0894.pdf" },
        { label: "Mayor's Commission on Conditions in Harlem, The Negro in Harlem (1936), digitized by the NYC Department of Records and Information Services", url: "https://harlemconditions.cityofnewyork.us/" },
        { label: "Clio, Dunbar Apartments", url: "https://theclio.com/entry/10425" },
      ],
    },
    {
      id: "harlem-river-houses",
      number: 15,
      title: "Harlem River Houses",
      dek: "A 574-apartment public housing development that received more than 15,000 applications",
      mapLabel: "Harlem River Houses",
      lat: 40.82651,
      lng: -73.93678,
      audioSrc: `${MEDIA}/audio/harlem-river-houses.mp3`,
      audioSeconds: 321,
      transcript: [
        "Harlem River Houses covers nine acres and contains seven four- and five-story buildings with **574 apartments and 1,940 rooms**. The buildings form three groups divided by the boulevard. It was one of New York City's first two federally funded public housing developments and was built specifically for working-class African American families after the uprising of March 19, 1935.",
        "The buildings cover **30.16 percent of the site**, compared with about sixty percent on typical Harlem blocks in 1935. Each apartment receives natural light and cross-ventilation. Landscape architect **Michael Rapuano** designed Belgian-block courtyards planted with London plane trees. The grounds also contain sculptures by **Heinz Warneke**: playing bears at the east end, penguins around the western fountain, a **mother and child** at the north, and a figure titled ***Black Laborer*** at the south end of the plaza, installed in 1939. The open site differs sharply from the nearby 138th Street block that held 620 residents per acre during the same decade.",
        "The federal government's opening booklet listed **60 two-room apartments, 259 three-room apartments, 232 four-room apartments, and 23 five-room apartments**. Weekly rents included heat and water. They ranged from **$4.45 to $4.95 for two rooms** and from **$6.15 to $7.25 for five rooms**.",
        "The final rent level resulted from a disagreement between federal and city officials. Federal officials proposed charging **$8.75 per room each month**. The New York City Housing Authority would not agree to operate the project above **$7.50**, and the final rate was **$7.10**. **Langdon Post**, the city's Tenement House Commissioner and the first chair of the Housing Authority, explained that a higher rent **\"would discriminate precisely against the lowest-income families.\"** City officials argued successfully in 1937 that public housing had to remain affordable to the poor households it was intended to serve.",
        "Demand greatly exceeded the available housing. The Public Works Administration's opening booklet records **more than 15,000 applications for 574 apartments**. The Landmarks Preservation Commission gives a lower figure of 11,500. The ratio was therefore between twenty and twenty-six applicant families for every apartment. Before the development opened, the Mayor's Commission had compared the same 574 apartments with **56,157 Black families in Harlem**, meaning the project could serve about **one percent** of them.",
        "A seven-person architectural team worked under chief architect **Archibald Manning Brown**, and **Horace Ginsbern** is generally credited with the site plan. The team included **John Louis Wilson Jr.**, the first African American graduate of Columbia University's architecture school, class of **1928**. He received his license in 1930 and became one of New York State's first Black registered architects. The National Trust explains his appointment as follows: **\"This move was politically motivated, given that he was the only African-American architect involved. However, Wilson was more than qualified.\"** The statement records both the political reason for his inclusion and his professional qualifications.",
        "One planned artwork is no longer connected to this site. Sculptor **Richmond Barthé** was commissioned to create an **eighty-foot frieze titled *Green Pastures: The Walls of Jericho*** for Harlem River Houses. The work was not installed here. In **1941, it was placed at Kingsborough Houses**, a mostly white public housing development in Brooklyn. A major work by a Black sculptor, originally commissioned for New York's first federal housing built for Black residents, was therefore redirected to a white development.",
        "The other federal project built at the same time was **Williamsburg Houses** in Brooklyn, which opened with **1,622 apartments** for a mostly white population. Construction costs per apartment were nearly the same at both developments, about $7,700 to $7,900, so the available figures do not show a funding difference. The main difference was the site. Williamsburg Houses **cleared twelve city blocks, demolished 568 buildings, and relocated 5,400 people**. Harlem River Houses was constructed on **vacant land**. Critics argued that choosing an empty, inexpensive site left Harlem's most overcrowded occupied blocks unchanged.",
        "New York City designated Harlem River Houses a landmark on **September 23, 1975**, after six witnesses testified in support and none opposed the designation. It was listed on the National Register on **December 18, 1979** and became part of a Special Planned Community Preservation District in **2014**. Nearly ninety years after opening, it continues to serve the basic housing purpose for which it was built.",
      ],
      images: [
        {
          src: `${MEDIA}/harlem-river-houses-1937.jpg`,
          alt: "Black and white photograph of a carved stone sculpture of a large bear bending its head down over a smaller bear cub, set on a low polygonal stone base. The sculpture stands in a bed of bare earth scattered with dead leaves. A concrete walkway runs behind it, and a long brick building wall with a doorway and basement windows fills the background. A young tree held upright by wooden stakes stands at the upper left.",
          credit:
            "Heinz Warneke's sculpture of two bears at the Harlem River Houses, 1937. Franklin D. Roosevelt Library Public Domain Photographs, National Archives and Records Administration, NAID 195799, via Wikimedia Commons. Public domain.",
          label: "1937",
          after: 1,
        },
        {
          src: `${MEDIA}/harlem-river-houses-1951.jpg`,
          alt: "Black and white photograph of a shallow many sided pool basin, drained and scattered with dead leaves, ringed by a low stepped stone kerb and thin metal pipe handrails. Four small rounded stone animal figures sit around the rim, at least two of them on low circular pedestals, each with its head bent down toward the basin. Tall plane trees in full leaf arch over the whole space. Brick buildings with tall windows and doorways stand on the left and the right, with benches, a paved walk and a parked car visible between the trees in the middle distance.",
          credit:
            "The shallow pool and its stone animal figures at Harlem River Houses, 1951. Gottscho-Schleisner Collection, Library of Congress Prints and Photographs Division, digital id gsc.5a17215. No known restrictions on publication.",
          label: "1951",
          after: 4,
        },
        {
          src: `${MEDIA}/harlem-river-houses-1940.jpg`,
          alt: "Black and white photograph of a carved stone figure of a seated woman holding a small child, with a dog seated at her feet, raised on a tall brick and stone pedestal beside a recessed doorway in a brick apartment building. Two small children in winter coats and bonnets stand on the sunlit pavement at the right, looking up at the sculpture. Rows of tall windows run across the building facade behind them, and a metal railing guards a basement areaway at the right.",
          credit:
            "A stone figure of a woman and child beside a doorway at Harlem River Houses, 1940. Gottscho-Schleisner Collection, Library of Congress Prints and Photographs Division, digital id gsc.5a06063. No known restrictions on publication.",
          label: "1940",
          after: 7,
        },
      ],
      nowImage: {
        src: `${MEDIA}/harlem-river-houses-today.jpg`,
        alt: "Orange red brick apartment buildings of four and five storeys standing on two sides of an open lawn patched with snow. A large bare tree with pale mottled bark rises in the left foreground. A flight of steps with green metal railings climbs from the lawn toward a dark passage cut through the banded brick base of the nearest building. Chain link fencing runs along the lower right and across the left middle distance. Low winter sun throws long branch shadows across the brickwork.",
        credit:
          "The grounds at Harlem River Houses today. Photograph by Beyond My Ken, 2014, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Leave the courtyards and walk west on West 153rd Street, uphill, to Edgecombe Avenue. Turn north two blocks to West 155th Street. Number 409 is the large apartment building on the east side of Edgecombe at the corner, standing right at the edge of the drop toward the river.",
        distanceMeters: 520,
        minutes: 7,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, Harlem River Houses Designation Report, LP-0894 (September 23, 1975)", url: "https://s-media.nyc.gov/agencies/lpc/lp/0894.pdf" },
        { label: "National Trust for Historic Preservation, The Experimental History Behind the Harlem River Houses", url: "https://savingplaces.org/stories/the-experimental-history-behind-the-harlem-river-houses" },
        { label: "The Cultural Landscape Foundation, Harlem River Houses", url: "https://www.tclf.org/harlem-river-houses" },
        { label: "NYC LGBT Historic Sites Project, Richmond Barthe and Green Pastures, The Walls of Jericho", url: "https://www.nyclgbtsites.org/site/richmond-barthe-green-pastures-the-walls-of-jericho/" },
        { label: "Federal Emergency Administration of Public Works, Harlem River Houses (1937), catalog record in the Monthly Catalog of United States Government Publications, University of North Texas", url: "https://mocat.library.unt.edu/catalog/510-ch1143" },
        { label: "Mayor's Commission on Conditions in Harlem, The Negro in Harlem (1936), digitized by the NYC Department of Records and Information Services", url: "https://harlemconditions.cityofnewyork.us/" },
        { label: "New York City Housing Authority, Development Data Book 2014", url: "https://www.nyc.gov/assets/nycha/downloads/pdf/ddb/2014ddb.pdf" },
      ],
    },
    {
      id: "409-edgecombe",
      number: 16,
      title: "409 Edgecombe Avenue",
      dek: "A major Black professional address that federal appraisers graded hazardous and the city later took for unpaid taxes",
      mapLabel: "409 Edgecombe",
      lat: 40.8304,
      lng: -73.9402,
      audioSrc: `${MEDIA}/audio/409-edgecombe.mp3`,
      audioSeconds: 212,
      transcript: [
        "This section of Edgecombe Avenue is known as Sugar Hill. Number 409 became home to an unusually large group of Black political, legal, and cultural leaders. Notice that the land drops sharply to the east, because the hill also appears as a boundary on federal appraisal maps.",
        "The building was constructed in **1916 and 1917** for white tenants and was designed by **Schwartz and Gross**. The Landmarks Preservation Commission summarizes the change in policy: **\"African-Americans were first permitted to move into the building in 1928.\"** Black tenants were excluded for the building's first eleven years.",
        "Residents included **W. E. B. Du Bois; Thurgood Marshall; Walter White**, executive secretary of the NAACP; **Roy Wilkins**, who later succeeded White; and painter **Aaron Douglas**. *Ebony* magazine described the concentration of leadership with a qualification that should remain part of the quotation: **legend, only slightly exaggerated, says that bombing 409 would wipe out Negro leadership for the next twenty years.**",
        "The NAACP did not operate its legal campaign from this building; its offices were downtown. Number 409 was where several of the people directing that work lived. While the association prepared the cases that led to **Shelley v. Kraemer in 1948**, its executive secretary and lead counsel returned each night to an apartment building that had excluded Black residents until 1928 and stood in an area federal appraisers had assigned their lowest mortgage-risk grade. Thurgood Marshall argued against racial restrictions on property while living in Sugar Hill.",
        "A similar change occurred four blocks north at **555 Edgecombe Avenue at 160th Street**. The same architects designed it, and it was built between 1914 and 1916. The Landmarks Preservation Commission states that **\"in 1939-40 the tenant population of 555 Edgecombe Avenue shifted exclusively to African-American.\"** Residents included **Paul Robeson** and **Count Basie**.",
        "Look east down the hill and west toward Convent Avenue. The following red box reproduces the federal appraisal descriptions and boundaries for this location.",
        "The building later experienced a second major change, which makes it the final full historical stop on the main walk.",
        "**In 1979, the City of New York took title to 409 Edgecombe Avenue because of unpaid property taxes.** The landlord of a building associated with many of Black America's leading figures had stopped paying the city. Similar tax foreclosures were common in Harlem during the 1970s.",
        "The resident ownership of 409 Edgecombe Avenue provides the clearest positive outcome on this tour. It resulted from a series of events rather than a voluntary grant by an owner or government agency. Faster foreclosure increased city ownership, the city could not manage or sell its large inventory, and organized tenants purchased their buildings for $250 per apartment. At this stop, the people living in the property ultimately became the people who owned it.",
        "The final stop is ten blocks south at 145th Street and Lenox Avenue, where another dispute over ownership, development, and displacement is continuing.",
      ],
      interrupts: [
        {
          title: "Redlining",
          body: [
            "Redlining was **the practice of assigning neighborhood lending-risk grades partly according to the race of residents**. In **1937 and 1938**, the federal **Home Owners' Loan Corporation** surveyed Manhattan and placed neighborhoods in four categories from A to D, shown from green to red. Local real estate agents and lenders helped complete the appraisal forms. The maps assigned all of Central Harlem a **D, or hazardous, grade**.",
            "The appraisal worksheets record the reasons for each grade. Area **D26**, from **125th to 145th Streets**, was described as: **\"Formerly a good residential district with many well built private homes. Now practically entirely negro with many tenements. Most of remaining one-family structures have been converted to rooming houses, etc. Comparatively speaking, rents are not low due to great crowding.\"** The field for Black residents read **\"Yes, 90%.\"** The trend of desirability was **\"Static to down.\"** Availability of mortgage funds was listed as **\"None.\"**",
            "**This location is within area D27, covering 145th to 155th Streets.** The form described it as: **\"An old tenement area, entirely negro except partially on western edge. St. Nicholas and Edgecambe (or higher ground) formerly contained some good private homes, now mainly converted. Two large low cost housing projects are located in northeast corner of area, one private, the other Federal.\"** The entry for Black residents was **\"Yes, 90+.\"** The form listed infiltration by **\"Negroes.\"** and a trend of **\"Down.\"** The two housing developments were the **Dunbar Apartments and Harlem River Houses**, the previous two stops. The appraiser specifically identified the good houses on the higher ground and named Edgecombe Avenue but still graded the area hazardous.",
            "The boundary is visible in the topography. Between 135th and 155th Streets, three federal grades ran west to east across about ten blocks. **Riverside Drive to Broadway received B minus, with Black residents listed as \"No.\"** **Broadway to Convent Avenue, including Hamilton Heights, received C minus**. The form stated that the area was **\"steadily deteriorating due partly to influx of negroes\"** and listed **\"infiltration of less desirable inhabitants.\"** as a harmful influence. **East of Convent Avenue and St. Nicholas Avenue received D, with a Black population of ninety percent or more.** The boundary between the C and D areas followed **the crest of the bluff past City College**, along the hill at this corner.",
            "The topographic boundary matched federal appraisal guidance. **Section 229 of the Federal Housing Administration's 1936 Underwriting Manual** stated: **\"Hills and ravines and other peculiarities of topography many times make encroachment of inharmonious uses so difficult that protection is afforded. A college campus often protects locations in its vicinity.\"** In Harlem, the racial boundary followed both a hill and a college campus. Section 233 stated: **\"If a neighborhood is to retain stability it is necessary that properties shall continue to be occupied by the same social and racial classes.\"** Section 284 recommended deed restrictions including: **\"Prohibition of the occupancy of properties except by the race for which they are intended.\"** The federal government therefore provided developers with explicit guidance supporting racial restrictions.",
            "**Researchers disagree about how much the HOLC maps themselves caused later segregation and disinvestment.** Economists Aaronson, Hartley, and Mazumder estimate that the maps caused lasting damage and explain fifteen to thirty percent of the later differences between C- and D-rated areas in homeownership and racial composition. Fishback and colleagues estimate that **racial bias in the map boundaries explains no more than four to twenty percent** of Black concentration in D areas and argue that the maps mainly recorded existing inequality. Michney and Winling found that HOLC itself **made loans in Black neighborhoods** more often than previously believed and that the confidential maps were not widely distributed. Fishback, Rose, Snowden, and Storrs found that the FHA had **developed and used its own redlining method before the HOLC maps were created** and did not change its practices afterward. A careful summary is that the maps may have reinforced existing practices, but they also clearly documented the appraisal industry's racial assumptions in a federal file. For this tour, the written descriptions are as important as the map colors.",
            "One field requires caution. Every Harlem appraisal sheet states that mortgage funds were available in the amount of **\"None.\"** The sheets for Morningside Heights and Riverside Drive say the same because Manhattan had little single-family home purchasing at the time. The evidence specific to race is therefore the **assigned grade, the \"Negro %\" field, and the appraisers' written explanations**, rather than the mortgage-funds line alone.",
            "Private lending records also show limited service in Harlem. During **1977** Senate Banking Committee hearings that led to the Community Reinvestment Act, **Morris D. Crawford Jr., chair of the Bowery Savings Bank**, defended his institution by stating that **\"back as far as 1956 our bank established an office in Harlem, the first one in 50 years.\"** He presented the fifty-year absence as evidence in the bank's favor. The previous year, New York City's Commissioner of the Treasury asked all **42 city savings banks** for lending data. **Fifteen banks did not respond**, and the published table contained no figures for the Harlem Savings Bank. The **Community Reinvestment Act became law on October 12, 1977**.",
            "**Current mortgage data show continuing racial differences but do not by themselves establish discrimination.** Rooted Forward matched 2023 federal mortgage-disclosure records for New York County with the digitized 1937 HOLC boundaries. Across Manhattan, lenders denied **40.1 percent of Black applicants** and **20.6 percent of white applicants**. Within the former Harlem redlined areas, denial rates were **43.5 percent for Black applicants** and **26.8 percent for white applicants**. For owner-occupied home purchases, the Manhattan rates were 22.4 percent for Black applicants and 12.5 percent for white applicants. These are unadjusted figures that do not control for credit score, income, or debt ratio, and the sample sizes within the old polygons are small. They show the pattern of outcomes in 2023, not proof of discriminatory treatment.",
          ],
          after: 6,
        },
        {
          title: "The city as landlord",
          body: [
            "During the 1970s, many Harlem owners abandoned apartment buildings when rents no longer covered taxes, heating costs, and repairs. An owner could stop paying expenses while continuing to collect rent until the city foreclosed. New York accelerated the process through **Local Law 45 of 1976**, which reduced the tax-arrears period required before the city could take title from three years to **one year, or four tax quarters**. Before 1976, foreclosure often took about seven years. After the law, it could occur in one.",
            "The foreclosures made New York City one of the country's largest residential landlords. In September 1979, the city owned **4,092 occupied buildings containing 34,880 occupied apartments**. By **February 1985**, it owned **5,100 occupied buildings with 48,000 occupied apartments**, as well as about sixty thousand vacant units. The city had difficulty selling them. By the early 1980s, only **271 buildings** had been sold since the sales program began in 1980, out of about ten thousand properties. In 1985, the city spent **$511.43 per apartment each year** to manage buildings in its central program. The 1984 housing survey found that **84 percent of tenants in city-foreclosed buildings were minorities**, compared with 46.5 percent of all renters, and that their **median household income was $8,215**.",
            "The scale of housing abandonment was large. At the peak in 1975, New York City lost **40,000 apartments in one year, or more than three thousand each month**. From 1970 through 1983, the city lost **more than 310,000 low-income housing units**.",
            "According to the City Planning Department's figures for Community District 10, **Central Harlem's population declined from 159,267 in 1970 to 105,641 in 1980**. This was a loss of **53,626 residents, or 33.7 percent, in ten years**. The population continued falling to 99,519 in 1990 before beginning to rise. Other agencies use different neighborhood boundaries and report totals that vary by as many as eleven thousand people, so the source and boundary should be identified when these figures are used.",
            "**The history of arson should not be transferred from the South Bronx to Central Harlem.** Large-scale fires that destroyed entire blocks were concentrated mainly in the South Bronx and Brownsville. Seven Bronx census tracts lost more than **97 percent of their buildings between 1970 and 1980**, and Bronx Community District 2 declined from about 100,000 residents to about 30,000. Central Harlem lost about one-third of its population, while the South Bronx lost about two-thirds. Harlem experienced severe abandonment, but the scale and cause of destruction in the South Bronx were different. Tours that apply Bronx arson statistics to Harlem are inaccurate.",
            "Fire-service policy remains relevant because consultants helped determine where companies and inspections were reduced. In **1972**, the RAND Corporation advised the Fire Department to close thirteen companies and open seven. Altogether, **fifty fire units were closed or moved, and inspections fell by seventy percent**. National fire deaths declined about forty percent during the period, while **New York City's fire deaths doubled**. A RAND analyst later said: **\"There was no question that where the commissioner kept his car was not a house that was going to be closed.\"** A retired fire chief explained that poorer neighborhoods appeared more often on the closure list because **\"the people in those neighborhoods didn't have a very big voice.\"**",
            "In **1976**, city housing administrator **Roger Starr** proposed **\"planned shrinkage\"**, a policy of reducing services in neighborhoods losing population in order to encourage further abandonment. Mayor Beame rejected the proposal, City Council members called it inhuman, racist, and genocidal, and Starr left his position within the year. Starr later wrote: **\"Although my phrase 'planned shrinkage' will run a poor second to 'benign neglect' in the unappreciated phrases derby, it will remain the most prominent label in the file of my government service.\"** Planned shrinkage and Local Law 45 were proposed or adopted in the **same year**. The city was considering withdrawal of services while also becoming the owner of a growing number of abandoned buildings.",
            "Tenant organizations returned many city-owned buildings to private ownership. The **Tenant Interim Lease program**, created in **1978**, allowed organized tenant associations to manage a city-owned building and later purchase it for **$250 per apartment**. The properties became **Housing Development Fund Corporation cooperatives**, and more than one thousand now operate across New York City. **409 Edgecombe Avenue is one of them.** The building excluded Black tenants until 1928, housed Du Bois, Marshall, White, and Wilkins, received a hazardous federal grade in 1938, and was taken for taxes in 1979. It is now owned by its residents.",
          ],
          after: 8,
        },
      ],
      images: [
        {
          src: `${MEDIA}/409-edgecombe-1942.jpg`,
          alt: "A black and white studio portrait of a seated middle-aged man in a mid-tone suit with wide lapels, a patterned tie and round eyeglasses. He has a moustache and light hair receding at the temples, and his head is turned toward the right of the frame so that he looks past the camera. His arms are folded in front of him and the back of a plain dark wooden chair shows at the left. Behind him is a blank pale seamless backdrop.",
          credit:
            "Walter White, executive secretary of the NAACP and a resident of 409 Edgecombe Avenue until 1947. Photograph by Gordon Parks, June 1942, Farm Security Administration and Office of War Information Photograph Collection, Library of Congress, digital id fsa.8b14792. Public domain.",
          label: "1942",
          after: 1,
        },
        {
          src: `${MEDIA}/409-edgecombe-1946.jpg`,
          alt: "A black and white studio portrait of an elderly bald man shown in near profile, facing the left of the frame. He has a short white goatee and moustache and wears a checked jacket, a white shirt and a checked tie. Behind him hangs a patterned cloth backdrop of swirling pinwheel and crescent shapes. Dark border strips from the edge of the photographic print frame the top and right of the image.",
          credit:
            "W. E. B. Du Bois, who lived at 409 Edgecombe Avenue from 1945 to 1950. Photograph by Carl Van Vechten, 1946, Carl Van Vechten photograph collection, Library of Congress, digital id ppmsca.18639. Public domain, no known copyright restrictions.",
          label: "1946",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/409-edgecombe-today.jpg`,
        alt: "A steep upward view from the pavement of a large red brick apartment house. Two projecting brick wings rise thirteen storeys and are joined by a set-back wall of paler yellow brick that forms the open light court between them. Arched window heads, stone cornices and carved stone roundels mark the lower floors, and a row of arched windows runs across the top storey. Bare tree branches cross the upper right corner and the left edge against a clear pale blue sky.",
        credit:
          "409 Edgecombe Avenue, built 1916 to 1917 by Schwartz and Gross and designated a New York City landmark on June 15, 1993. Photograph by Epicgenius, March 2026, via Wikimedia Commons. CC BY-SA 4.0.",
        label: "Today",
      },
      toNext: {
        text: "Walk south on Edgecombe Avenue to West 145th Street, then east along 145th, downhill, across St. Nicholas, Frederick Douglass and Adam Clayton Powell Jr. Boulevards, to Lenox Avenue. Stop at the northwest corner. The large cleared site is the One45 parcel. If you would rather ride, the 3 train runs from 145th Street and Lenox; note that the A, B, C and D stop at 145th Street and St. Nicholas Avenue, three avenue blocks west.",
        distanceMeters: 1550,
        minutes: 19,
      },
      sources: [
        { label: "New York City Landmarks Preservation Commission, 409 Edgecombe Avenue Apartments (Colonial Parkway Apartments) Designation Report, LP-1861 (June 15, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1861.pdf" },
        { label: "New York City Landmarks Preservation Commission, 555 Edgecombe Avenue Apartments (Roger Morris Apartments) Designation Report, LP-1862 (June 15, 1993)", url: "https://s-media.nyc.gov/agencies/lpc/lp/1862.pdf" },
        { label: "Mapping Inequality, the HOLC residential security maps and area descriptions (Digital Scholarship Lab, University of Richmond)", url: "https://dsl.richmond.edu/panorama/redlining/" },
        { label: "Federal Housing Administration, Underwriting Manual, with revisions to April 1, 1936, FRASER at the Federal Reserve Bank of St. Louis", url: "https://fraser.stlouisfed.org/files/docs/publications/fha/1936apr_fha_underwritingmanual.pdf" },
        { label: "Daniel Aaronson, Daniel Hartley and Bhashkar Mazumder, The Effects of the 1930s HOLC Redlining Maps, American Economic Journal, Economic Policy 13, no. 4 (2021)", url: "https://www.aeaweb.org/articles?id=10.1257%2Fpol.20190414" },
        { label: "Price Fishback, Jonathan Rose, Kenneth Snowden and Thomas Storrs, New Evidence on Redlining by Federal Housing Programs in the 1930s, NBER Working Paper 29244", url: "https://www.nber.org/papers/w29244" },
        { label: "Todd M. Michney and LaDale Winling, New Perspectives on New Deal Housing Policy, Journal of Urban History (2020), Georgia Tech research record", url: "https://hg.gatech.edu/node/652460" },
        { label: "Community Reinvestment Act, Title VIII of Public Law 95-128, 91 Stat. 1111 (October 12, 1977), U.S. Government Publishing Office", url: "https://www.govinfo.gov/content/pkg/STATUTE-91/pdf/STATUTE-91-Pg1111.pdf" },
        { label: "Gotham Center for New York City History, Building for Us, stories of homesteading and cooperative housing", url: "https://www.gothamcenter.org/blog/building-for-us" },
      ],
    },
    {
      id: "one45",
      number: 17,
      title: "145th Street and Lenox",
      dek: "A proposed thousand-apartment development and the current debate over who can remain in Harlem",
      mapLabel: "145th and Lenox",
      lat: 40.82044,
      lng: -73.93623,
      audioSrc: `${MEDIA}/audio/one45.mp3`,
      audioSeconds: 512,
      transcript: [
        "The route has covered about five miles and more than 120 years of housing history. This final stop examines current conditions and development plans.",
        "**Central Harlem is no longer majority Black.** The NYU Furman Center reports the Black share of Community District 10's population as **77.3 percent in 2000, 69.5 percent in 2006, 58.6 percent in 2010, 54.3 percent in 2019, 50.9 percent in 2023, and 43.2 percent in 2024**. The 2024 figure should be interpreted cautiously because an eight-point change in one year partly reflects survey variation. The long-term pattern is clear. The Black share declined from about three-quarters to less than one-half in twenty-four years.",
        "The same source reports rents in 2025 dollars. **The district's median rent is $1,540, while the median rent paid by households that moved in recently is $2,380.** Recent movers therefore pay about fifty-five percent more than the district median. This comparison measures the difference between established residents and people entering the neighborhood. **Twenty-nine percent of renters are severely rent burdened**, meaning they spend more than half their income on rent. The share approaches forty percent among low-income renters. In 1935, the Mayor's Commission found that sixty percent of families on a nearby block paid more than half their income in rent. The same measure remains important ninety years later.",
        "The supply of low-cost apartments has also declined. The share of newly available units affordable to a household earning thirty percent of area median income fell from **19.3 percent in 2010 to 8.8 percent in 2024**. Public housing continues to provide a large share of the district's lower-cost housing through **63 NYCHA properties containing 7,766 apartments, or 13.6 percent of all rental units**. At the same time, affordability restrictions on **2,055 subsidized apartments may expire between 2026 and 2031**. Of the 4,576 apartments constructed in the district from 2010 through 2025, **57 percent were market-rate units**.",
        "The development site in front of you became the subject of a rezoning proposal in 2021. Developer **Bruce Teitelbaum** proposed **One45**, two 363-foot towers with **915 apartments**, a civil rights museum, and headquarters space for the National Action Network. District Council member **Kristin Richardson Jordan** demanded that **fifty-seven percent of the apartments be affordable to households earning thirty percent of area median income**. Teitelbaum withdrew the application on **May 31 and June 1, 2022**, only hours before the committee vote.",
        "On **January 18, 2023**, the developer opened a **truck depot with space for two hundred vehicles** on the cleared property. A major Harlem intersection was therefore used for truck parking in a neighborhood with some of New York City's highest childhood asthma rates. The use showed the control a private owner retained over the site while negotiations over residential development were unresolved.",
        "The proposal returned in **February 2023**. After a committee vote on June 26, the **City Council approved the project on July 14, 2025**. The plan now includes **1,000 apartments, of which 338 are designated affordable**. A thirty-two-story tower will contain 502 apartments, including 126 priced for households at about sixty percent of area median income. A thirty-story tower will contain 408 apartments, including 122 at about eighty percent of area median income. A separate eight-story building will provide ninety apartments for seniors. The agreement also includes an **$8.8 million reconstruction of Charles Young Playground**, a technology center, thirty thousand square feet of retail space with twenty percent reserved for Harlem businesses, a twenty-percent local-hiring commitment, and an ownership interest for a Harlem developer.",
        "Later financing and occupancy changes include a **$26 million bridge loan issued in October 2025** for a project valued at about six hundred million dollars. The National Action Network **left its space on January 31, 2026**. The tax exemption used in the financing requires the project to be completed **by June 15, 2031**. As of summer 2026, construction has not begun.",
        "On **June 25, 2026**, the coalition **Defend Harlem** carried a **hearse down Lenox Avenue from 145th Street to 120th Street** as a funeral procession for the avenue. The former Council member joined the march. The coalition is asking that **400 of the project's one thousand apartments** be affordable to households earning between thirty-five thousand and sixty-five thousand dollars. Defend Harlem is a campaign of the New York Interfaith Commission for Housing Equity. It was founded in 2022 by **Kai Cogsville**, whose father, Donald Cogsville, founded the Harlem Urban Development Corporation during the 1970s. Two generations of the same family have therefore taken part in debates over Harlem development.",
        "The housing restrictions described in this tour changed form over time. In 1904, access depended on whether an owner would sell or rent to a Black household. In 1912, owners used a racial covenant. In 1914, they formed a corporation to regain property block by block. From 1915 through 1935, restricted choices allowed landlords to charge Black tenants more for poorer housing. In 1928, residents entered a cooperative that became a rental property in 1936. In 1938, federal appraisers assigned the neighborhood a hazardous grade. In 1949, an insurance company's tenant-selection policy survived a court challenge. During the 1950s, clearance projects sometimes constructed fewer apartments than they removed. In the 1970s, landlords abandoned buildings and a city law accelerated tax foreclosure. In 2026, the main tools are development financing, area-median-income requirements, and construction deadlines. **The methods changed, but the continuing questions are who can remain in the neighborhood and who owns the housing residents pay for.**",
        "A new state law now provides a way to remove one of the older restrictions. Since **June 3, 2026**, a New York property owner may file a document removing a racial covenant from a deed at no charge. The original document is preserved and cross-indexed, so the historical record remains available. Cooperative and condominium boards must remove unlawful language **by June 3, 2027** without seeking approval from individual owners. The West 130th and 131st Street covenant recorded in Liber 159 is covered by the law. As far as this research could determine, **no one has systematically searched Harlem's property records for additional covenants**, and New York City still has no comprehensive covenant-mapping project. That work remains available for future researchers and students.",
        "Thank you for completing the walk. Please report any errors you find. The tour page lists the sources for every stop, and the printed version includes corrections to claims commonly repeated in other accounts. Rooted Forward is a student-led project, and Harlem is its first tour outside Chicago.",
      ],
      images: [
        {
          src: `${MEDIA}/one45-1938.jpg`,
          alt: "A black and white photograph of a row of joined brownstone and brick buildings four storeys high. Ground floor storefronts include Jones Barber Shop with a striped pole, May's and Johnson Beauty School, Mae's Beauty Salon, A.B.C. Auto School, a photo studio and a produce stand with price tags. Painted and printed signs read 422, Shave 15, Hair Cut 25 and 4 Radio Photo Poses 10. A framed church notice with a cross and an open Bible stands in a parlour window above the barber shop. Two women sit on the stoop at left, an older man and a younger man stand talking at the foot of the steps, a man in a suit and hat sits on a crate at right, and a woman in a light dress and heels walks along the sidewalk carrying a handbag.",
          credit:
            "Storefronts and a stoop at 422-424 Lenox Avenue near West 131st Street, about fourteen blocks south of this corner. Photograph by Berenice Abbott, June 14, 1938, for the Federal Art Project series Changing New York, Miriam and Ira D. Wallach Division of Art, Prints and Photographs, New York Public Library, via Wikimedia Commons. Public domain as a work of a Works Progress Administration employee.",
          label: "1938",
          after: 1,
        },
        {
          src: `${MEDIA}/one45-1943.jpg`,
          alt: "A black and white photograph of a woman leaning out of an open apartment window, resting her forearms on the stone sill and holding a small object in one hand. A small long haired dog sits on the sill beside her, looking off to the right. A curtain hangs behind them and the wall at right is painted brick. Handwriting across the top of the negative reads OWI-24045-E.",
          credit:
            "A woman and her dog at an apartment window in Harlem. The Library of Congress records no street address for the picture. Photograph by Gordon Parks, May 1943, Office of War Information, Library of Congress Prints and Photographs Division, digital ID fsa.8d28566, via Wikimedia Commons. No known restrictions on publication.",
          label: "1943",
          after: 4,
        },
      ],
      nowImage: {
        src: `${MEDIA}/one45-today.jpg`,
        alt: "A sunlit street corner with a green painted subway entrance. Stairs descend below the sidewalk behind a green railing. A black sign on the entrance reads 145, Downtown and, above a red circle containing the numeral 3. An overhead green street sign reads W 145 ST. One man in a plaid shirt and dark cap stands at the top of the stairs holding a bottle, and a second man in a white t-shirt and cap stands beside the railing to the right. At left a folding table of bottled toiletries, a wheeled shopping cart and cardboard boxes sit on the sidewalk. Traffic, green lamp posts, yellow traffic signals, mostly bare trees and tall brick apartment towers fill the background under a clear blue sky.",
        credit:
          "The southwest corner of West 145th Street and Lenox Avenue, the north edge of the One45 site, looking north across 145th Street. Photograph by Jim Henderson, April 7, 2010, via Wikimedia Commons. CC0 1.0 public domain dedication.",
        label: "Today",
      },
      sources: [
        { label: "NYU Furman Center, Central Harlem neighborhood profile", url: "https://furmancenter.org/neighborhoods/view/central-harlem" },
        { label: "New York City Planning Commission, report on application C 250115 ZMM, One45 for Harlem", url: "https://www.nyc.gov/assets/planning/download/pdf/about/cpc/250115.pdf" },
        { label: "New York City Council, press release on the One45 agreement, June 26, 2025", url: "https://council.nyc.gov/press/2025/06/26/2910" },
        { label: "Manhattan Community Board 10, One45 for Harlem resolution, February 2025", url: "https://cbmanhattan.cityofnewyork.us/cb10/wp-content/uploads/sites/11/2025/02/Final-CB10_One45-For-Harlem-Resolution_February-2025-1.pdf" },
        { label: "New York Amsterdam News, One45 rezoning finally approved by NYC Council, July 10, 2025", url: "https://amsterdamnews.com/news/2025/07/10/one45-approved-by-council-but-unhappy-with-affordability/" },
        { label: "New York Amsterdam News, Why Defend Harlem movement wants City Hall to keep its eye on One45 project, July 9, 2026", url: "https://amsterdamnews.com/news/2026/07/09/defend-harlem-wants-city-hall-to-keep-its-eye-on-one45-project/" },
        { label: "New York Amsterdam News, Kai Cogsville and Defend Harlem are leading the charge against housing inequity, October 30, 2025", url: "https://amsterdamnews.com/news/2025/10/30/kai-cogsville-and-defend-harlem-push-for-housing-equity/" },
        { label: "New York State Senate Bill S3178A of 2025, chapter 578 of the Laws of 2025, adding Real Property Law section 327-a", url: "https://www.nysenate.gov/legislation/bills/2025/S3178/amendment/A" },
        { label: "The Real Deal, City Council approves 1,000 housing units at Harlem's One45, July 14, 2025", url: "https://therealdeal.com/new-york/2025/07/14/nyc-city-council-approves-bruce-teitelbaums-one45/" },
      ],
    },
  ],
};
