import type { WalkTour } from "./walk-types";

// ------------------------------------------------------------------
// Walk Dallas. Six stops from Deep Ellum through downtown and the
// Arts District into Uptown, from the building Black Dallas put up
// for itself in 1916 to the cemetery its freedpeople bought in 1869.
// No detours. Every stop is a public sidewalk or a public park, and
// each one carries more than one decade, on the same six-deep-stops
// principle as the New York walk (September 2026).
//
// The narration is written from the sources listed on each stop and
// nothing in it should outrun them: the Handbook of Texas entries on
// Deep Ellum, Freedmantown/North Dallas, Dallas Klan No. 66, the Dallas
// Citizens Council and Juanita Craft; Cynthia Lewis's 2019 Texas
// Woman's University thesis on postwar redevelopment and Dallas's
// Black communities; the 1937 Home Owners' Loan Corporation forms for
// areas C10 and D8 as transcribed by Mapping Inequality; the Dallas
// Landmark Commission's nomination and designation pages; the Equal
// Justice Initiative and KERA on Allen Brooks; and James Davidson's
// 2004 dissertation on the excavation of Freedman's Cemetery. Where two
// good sources disagree on a number (how much of the cemetery the road
// covered, how many acres the park is) the narration says the thing
// both agree on and no more.
//
// The six red plates each explain one mechanism, page-only, never read
// into the audio, in teaching order across the walk: the right-of-way,
// the referendum, the only school, the inner loop, the appraisal form,
// and ten dollars a grave.
//
// Photographs are public domain or open licence only: Library of
// Congress stereographs, postcards and Carol Highsmith's 2014 Dallas
// series, the 1958 USGS survey sheet, and the 1937 appraisal areas
// drawn from Mapping Inequality's digitized polygons over that sheet.
//
// Audio is not recorded yet. audioSrc is empty and audioSeconds is 0
// on every stop, the page hides the player, and /api/walk keeps the
// walk out of the app's index until scripts/walk-tts.mjs --tour dallas
// --patch has run (it needs OPENAI_API_KEY) and scripts/walk-audio-
// shrink.mjs has been run after it. listenMinutes is a reading-time
// estimate until then.
// ------------------------------------------------------------------

const MEDIA = "/media/dallas-walk";

export const DALLAS_WALK: WalkTour = {
  title: "Walk Dallas",
  dek: "A free, self-guided tour from the Knights of Pythias Temple in Deep Ellum to Freedman's Memorial on Central Expressway. Six stops over about three and a half miles, on a lynching, a segregation ordinance, an appraisal map, two freeways, and the neighborhood that became Uptown.",
  walkMinutes: 73,
  listenMinutes: 30,
  distanceMiles: 3.7,
  startLabel: "Knights of Pythias Temple, Elm Street at Good-Latimer Expressway",
  practical: [
    {
      title: "Getting there and timing",
      text: "The walk starts on the sidewalk outside the Knights of Pythias Temple, now the Pittman Hotel, at Elm Street and Good-Latimer Expressway in Deep Ellum, one block south of the Deep Ellum station on the DART Green Line. It ends at Freedman's Memorial at Lemmon Avenue and Central Expressway, about a third of a mile from the Cityplace/Uptown station on the Red, Orange and Blue lines, and a short walk from the free M-Line trolley on McKinney Avenue, which runs back down to Klyde Warren Park and the St. Paul station. The stops run roughly in the order the history happened, so the route goes west under the freeway into downtown, north through the Arts District, over the freeway into Uptown, and north again to the memorial. Plan on about two and a half hours with the stops. Short on time? Stop after Klyde Warren Park, four stops in, and take the trolley from McKinney Avenue.",
    },
    {
      title: "The ground",
      text: "City sidewalks the whole way, about three and a half miles, mostly flat with one easy rise into Uptown. The route passes under the elevated freeway at Elm Street and crosses the Woodall Rodgers frontage roads twice, at Pearl Street and at Routh Street, both at signals with marked crosswalks. Dallas summers are serious. From June to September the afternoon is regularly above 95 degrees, so carry water and start in the morning. The route was checked against OpenStreetMap foot routing in September 2026 and has not been assessed for wheelchair access.",
    },
    {
      title: "Safety and what you can go into",
      text: "The route stays in downtown, the Arts District and Uptown, the parts of central Dallas with the most people on the sidewalk, and it was chosen to. Do the walk in daylight. Deep Ellum is an entertainment district that gets loud late, and since July 2025 the city has closed its streets to cars at ten on weekend nights, so an evening there is a different outing from this one. **Nothing on this walk needs a ticket or an appointment.** The Pittman's lobby is open to the public. Booker T. Washington High School is a working school and the walk stays on the sidewalk outside it. St. Paul is an active congregation. Klyde Warren Park and Freedman's Memorial are public parks.",
    },
    {
      title: "Reading and listening",
      text: "Every stop is printed in full on the page, so you can read as you walk. The recorded narration for this walk is still being made and will appear here when it is done. If you share your location, it is used only to draw your dot on the map. It never leaves your phone.",
    },
  ],
  route: [
    [32.78422, -96.78746],
    [32.78399, -96.78738],
    [32.78378, -96.78838],
    [32.78361, -96.78883],
    [32.78355, -96.78915],
    [32.78330, -96.79029],
    [32.78323, -96.79064],
    [32.78320, -96.79078],
    [32.78310, -96.79124],
    [32.78305, -96.79149],
    [32.78301, -96.79171],
    [32.78297, -96.79185],
    [32.78293, -96.79204],
    [32.78290, -96.79220],
    [32.78286, -96.79237],
    [32.78276, -96.79249],
    [32.78265, -96.79253],
    [32.78253, -96.79255],
    [32.78232, -96.79252],
    [32.78218, -96.79247],
    [32.78205, -96.79255],
    [32.78188, -96.79336],
    [32.78173, -96.79406],
    [32.78169, -96.79425],
    [32.78141, -96.79563],
    [32.78138, -96.79578],
    [32.78112, -96.79696],
    [32.78108, -96.79712],
    [32.78101, -96.79750],
    [32.78093, -96.79788],
    [32.78074, -96.79878],
    [32.78059, -96.79948],
    [32.78124, -96.79973],
    [32.78142, -96.79978],
    [32.78172, -96.79987],
    [32.78200, -96.79995],
    [32.78212, -96.79999],
    [32.78254, -96.80012],
    [32.78281, -96.80020],
    [32.78298, -96.80026],
    [32.78319, -96.80032],
    [32.78358, -96.80043],
    [32.78375, -96.80048],
    [32.78393, -96.80053],
    [32.78423, -96.80061],
    [32.78435, -96.80065],
    [32.78462, -96.80072],
    [32.78481, -96.80077],
    [32.78500, -96.80083],
    [32.78522, -96.80090],
    [32.78538, -96.80095],
    [32.78554, -96.80089],
    [32.78589, -96.80048],
    [32.78607, -96.80027],
    [32.78618, -96.80014],
    [32.78638, -96.79989],
    [32.78670, -96.79952],
    [32.78687, -96.79932],
    [32.78700, -96.79934],
    [32.78727, -96.79965],
    [32.78748, -96.79991],
    [32.78767, -96.80015],
    [32.78781, -96.80012],
    [32.78825, -96.79960],
    [32.78838, -96.79945],
    [32.78883, -96.79891],
    [32.78899, -96.79873],
    [32.78943, -96.79819],
    [32.78954, -96.79805],
    [32.79017, -96.79731],
    [32.79031, -96.79715],
    [32.79061, -96.79678],
    [32.79074, -96.79662],
    [32.79135, -96.79589],
    [32.79145, -96.79576],
    [32.79135, -96.79589],
    [32.79074, -96.79662],
    [32.79061, -96.79678],
    [32.79031, -96.79715],
    [32.79017, -96.79731],
    [32.78954, -96.79805],
    [32.78943, -96.79819],
    [32.78904, -96.79867],
    [32.78896, -96.79877],
    [32.78897, -96.79892],
    [32.78913, -96.79907],
    [32.78955, -96.79945],
    [32.79017, -96.80003],
    [32.79033, -96.80019],
    [32.79047, -96.80034],
    [32.79075, -96.80063],
    [32.79063, -96.80065],
    [32.79051, -96.80065],
    [32.79039, -96.80067],
    [32.78992, -96.80122],
    [32.78977, -96.80119],
    [32.78989, -96.80119],
    [32.78997, -96.80108],
    [32.79010, -96.80088],
    [32.79018, -96.80073],
    [32.79032, -96.80069],
    [32.79051, -96.80065],
    [32.79063, -96.80065],
    [32.79075, -96.80063],
    [32.79085, -96.80052],
    [32.79101, -96.80030],
    [32.79113, -96.80015],
    [32.79142, -96.79980],
    [32.79195, -96.79918],
    [32.79235, -96.79869],
    [32.79269, -96.79827],
    [32.79288, -96.79803],
    [32.79300, -96.79788],
    [32.79308, -96.79778],
    [32.79287, -96.79747],
    [32.79267, -96.79716],
    [32.79278, -96.79721],
    [32.79310, -96.79766],
    [32.79318, -96.79777],
    [32.79325, -96.79805],
    [32.79329, -96.79820],
    [32.79332, -96.79838],
    [32.79335, -96.79861],
    [32.79334, -96.79893],
    [32.79333, -96.79917],
    [32.79347, -96.79917],
    [32.79371, -96.79885],
    [32.79381, -96.79895],
    [32.79413, -96.79918],
    [32.79447, -96.79958],
    [32.79519, -96.79883],
    [32.79552, -96.79843],
    [32.79581, -96.79810],
    [32.79588, -96.79800],
    [32.79604, -96.79782],
    [32.79624, -96.79758],
    [32.79633, -96.79747],
    [32.79656, -96.79719],
    [32.79695, -96.79757],
    [32.79713, -96.79778],
    [32.79726, -96.79794],
    [32.79748, -96.79778],
    [32.79773, -96.79748],
    [32.79781, -96.79738],
    [32.79804, -96.79710],
    [32.79813, -96.79699],
    [32.79843, -96.79664],
    [32.79854, -96.79650],
    [32.79886, -96.79611],
    [32.79894, -96.79602],
    [32.79955, -96.79529],
    [32.79967, -96.79515],
    [32.80009, -96.79466],
    [32.80025, -96.79475],
    [32.80033, -96.79485],
    [32.80042, -96.79495],
    [32.80100, -96.79430],
    [32.80125, -96.79460],
    [32.80171, -96.79411],
    [32.80182, -96.79406],
    [32.80198, -96.79407],
    [32.80221, -96.79371],
    [32.80227, -96.79358],
    [32.80237, -96.79350],
    [32.80249, -96.79350],
    [32.80260, -96.79351],
  ],
  stops: [
    {
      id: "pythias-temple",
      number: 1,
      title: "The Knights of Pythias Temple",
      dek: "Black Dallas built its own four-story building here in 1916. The railroad beside it became a freeway, and the freeway became a wall",
      mapLabel: "Pythias Temple",
      lat: 32.78428,
      lng: -96.78722,
      audioSrc: "",
      audioSeconds: 0,
      lookFor: "The north sidewalk of Elm Street at Good-Latimer Expressway, in front of the four-story brick building with the arched top-floor windows, now the Pittman Hotel. The Green Line platform is a block north up Good-Latimer. The hotel lobby is public, but nothing on this walk needs you to go in.",
      transcript: [
        "Stand on Elm Street at Good-Latimer Expressway and look up at the brick building on the corner. Four floors, tall arched windows across the top, and a hotel sign on it now. Then look west along Elm, toward downtown. The street runs under an elevated freeway before it gets there. That building and that freeway are the whole first stop, and they are about sixty years apart.",
        "**Deep Ellum was settled by freedpeople after the Civil War, along the tracks of the Houston and Texas Central Railroad.** The railroad reached Dallas in 1872, and the freight yards and cotton gins that grew up beside it gave the district its work. The tracks ran north from here to Freedman's Town, the Black neighborhood you will reach at the end of this walk, and the streets along them, which people called Central Track, were the spine that held the two together. Jewish merchants ran most of the pawn shops on Elm, and Black musicians played the clubs. **By 1920 there were twelve nightclubs, cafes and domino parlors here, and Blind Lemon Jefferson and Huddie Ledbetter, Leadbelly, both played the street.**",
        "**The building in front of you was designed in 1916 by William Sidney Pittman for the Grand Lodge of the Colored Knights of Pythias of Texas.** Pittman had trained at Tuskegee and at Drexel, had married Booker T. Washington's daughter Portia in 1907, and had moved to Texas in 1913. He is usually described as the first Black architect to practice in the state. His clients here were a Black fraternal order, and they built the first major commercial building in Dallas put up by Black Dallasites, for Black Dallasites, with their own money. **A barber shop and a drug store on the ground floor, the offices of Black doctors and other professionals on the second, insurance companies on the third, and a ballroom on the fourth.** The Dallas Express, the city's Black weekly, advertised the Fisk Jubilee Singers here in 1919. Marcus Garvey and George Washington Carver both appeared in the building.",
        "Now the railroad. **As early as 1911 the city's planner, George Kessler, proposed buying the Houston and Texas Central right-of-way, pulling up the tracks and building a road on the line.** It took three decades and a war. The city began buying the right-of-way in 1943. Construction of Central Expressway started in March 1947, and the first section, north of downtown through Freedman's Town, opened on August 19, 1949. The southern section, through here, was built between 1954 and 1956. The streetcar on Elm stopped running in 1956. The lodge had already sold this building in 1946, and an insurance company bought it in 1959 and turned the ballroom into offices.",
        "**Then the road was rebuilt in the air.** Construction of the elevated freeway began in 1968, and by 1969 the new structure had cut off the 2400 block of Elm Street, the center of the district, and taken it out altogether. The elevated road opened on August 23, 1973, as Interstate 345, a mile and four tenths long, every foot of it above the ground. **From that year Deep Ellum was on the far side of a wall from downtown**, and the building beside you stood empty from the 1990s until developers took it on in 2017. The hotel opened on August 12, 2020, named for the architect. The federal appraisers who graded Dallas in 1937 did not give Deep Ellum a grade at all. They marked it commercial and left it blank.",
        "One more date. In May 2023 the city council voted for the state's plan to rebuild Interstate 345 below street level, at an estimated cost of 1.65 billion dollars and more than a decade away. The freeway you are about to walk under is the one the city has agreed, in principle, to take down.",
        "The next stop is downtown at Main and Akard, on the other side of the freeway.",
      ],
      images: [
        {
          src: `${MEDIA}/pythias-temple-1958-sheet.jpg`,
          alt: "A section of the 1958 United States Geological Survey sheet showing Deep Ellum, with the four-lane Central Expressway running north to south through the railroad yards beside Elm, Main and Commerce streets, the Federal Building and City Hall to the west, and the built-up blocks tinted red",
          credit:
            "Deep Ellum and the east side of downtown on the 1958 survey sheet. The new four-lane Central Expressway runs through the old railroad yards at the center, on the line of the Houston and Texas Central tracks, with Elm Street crossing it at the top. The elevated freeway was fifteen years away. United States Geological Survey, Dallas quadrangle, 1958. Public domain.",
          label: "1958",
          after: 3,
        },
        {
          src: `${MEDIA}/pythias-temple-station-2014.jpg`,
          alt: "A yellow and white DART light-rail train at the Deep Ellum station platform under a curved canopy, with young trees along the street and a wide road in the foreground",
          credit:
            "The Deep Ellum station on the Green Line, one block north of this stop, where the walk begins. It opened on September 14, 2009. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
          label: "The station",
          after: 5,
        },
      ],
      nowImage: {
        src: `${MEDIA}/pythias-temple-traveling-man-2014.jpg`,
        alt: "A tall stainless-steel sculpture of a smiling robot-like figure with a round head and a long curved body, seen from below against a sky of white clouds",
        credit:
          "One of the three Traveling Man sculptures at Good-Latimer and Elm, across from this stop, by Brad Oldham and Brandon Oldenburg, put up when the Green Line opened in 2009. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
        label: "Today",
        after: 4,
      },
      interrupts: [
        {
          title: "The right-of-way",
          body: [
            "**A railroad line is the cheapest place to put a freeway, because the land is already in one strip and already owned by one company.** That is what George Kessler saw in 1911 and what the city acted on from 1943. The Houston and Texas Central right-of-way became Central Expressway, and no plan ever had to say that it ran through Black Dallas. It ran along the tracks.",
            "But the tracks were where Black Dallas had been allowed to build. The freedpeople who settled Deep Ellum and Freedman's Town settled beside the railroad because that was the ground that was open to them, and Stringtown, the row of shotgun houses that linked the two along Central Track, was built on it. **When the strip was widened for a road, the houses on either side of it were the ones taken, at prices the city set.** The 1958 survey sheet above shows the result on this side of downtown. The elevated freeway of 1973 did the same thing a second time, in the air.",
          ],
          after: 4,
        },
      ],
      toNext: {
        text: "Walk west on Elm Street, with the hotel behind you, for about a third of a mile. Elm passes under the elevated freeway, Interstate 345, and comes out on the downtown side. Turn left onto Pearl Expressway for one short block, then right onto Main Street. Follow Main west for about seven blocks, past Main Street Garden, to Akard Street. Pegasus Plaza is on the south side of Main just before Akard.",
        distanceMeters: 1294,
        minutes: 16,
      },
      sources: [
        {
          label: "Lisa C. Maxwell, Deep Ellum, Handbook of Texas Online, Texas State Historical Association (the freedmen's town origins, the Pythias Temple of 1916, the twelve clubs of 1920, the streetcar's end in 1956 and the 1969 elevation of the expressway)",
          url: "https://www.tshaonline.org/handbook/entries/deep-ellum",
        },
        {
          label: "Knights of Pythias Temple (Dallas, Texas), Wikipedia (the 1916 building, its floors and tenants, the 1946 and 1959 sales, the 1989 landmark designation and the 2020 hotel)",
          url: "https://en.wikipedia.org/wiki/Knights_of_Pythias_Temple_(Dallas,_Texas)",
        },
        {
          label: "William Sidney Pittman, Wikipedia (Tuskegee and Drexel, the 1907 marriage to Portia Washington, the move to Texas in 1913, the Pythian Temple of 1915 to 1916 and his death in Dallas in 1958)",
          url: "https://en.wikipedia.org/wiki/William_Sidney_Pittman",
        },
        {
          label: "Mark Lamster, Deep Ellum's Kimpton Pittman Hotel preserves the life and work of Texas' first Black architect, Dallas Morning News, February 20, 2026",
          url: "https://www.dallasnews.com/arts-entertainment/architecture/2026/02/20/deep-ellums-kimpton-pittman-hotel-preserves-life-work-of-texas-first-black-architect/",
        },
        {
          label: "Kimpton Pittman Hotel opens in historic Dallas landmark, Hospitality Net announcement (the August 12, 2020 opening and the Perkins and Will restoration)",
          url: "https://www.hospitalitynet.org/announcement/41004988/kimpton-pittman-hotel.html",
        },
        {
          label: "Advertisement for the Fisk Jubilee Singers at the Knights of Pythias Temple, The Dallas Express, March 8, 1919, via Wikimedia Commons",
          url: "https://commons.wikimedia.org/wiki/File:Fisk_jubilee_singers_dallas.png",
        },
        {
          label: "Cynthia Lewis, Under Asphalt and Concrete, Postwar Urban Redevelopment in Dallas and Its Impact on Black Communities, 1943 to 1983, master's thesis, Texas Woman's University, 2019 (the 1943 right-of-way purchases, the March 1947 start, the August 19, 1949 opening, the 1954 to 1956 southern section, Stringtown, and the Temple's tenants)",
          url: "https://twu-ir.tdl.org/server/api/core/bitstreams/25c75ee8-4aec-4df1-b163-a163b210eea0/content",
        },
        {
          label: "Central Expressway (Dallas), Wikipedia (Kessler's 1911 proposal to buy the Houston and Texas Central right-of-way)",
          url: "https://en.wikipedia.org/wiki/Central_Expressway_(Dallas)",
        },
        {
          label: "Interstate 345, Wikipedia (opened August 23, 1973, 1.4 miles, entirely elevated, and the May 2023 council vote for the below-grade rebuild)",
          url: "https://en.wikipedia.org/wiki/Interstate_345",
        },
        {
          label: "Deep Ellum, Dallas, Wikipedia (the 1968 start of freeway construction, the 1969 loss of the 2400 block of Elm, the 2007 demolition of the Good-Latimer tunnel, and the 2025 weekend street closures)",
          url: "https://en.wikipedia.org/wiki/Deep_Ellum,_Dallas",
        },
        {
          label: "Deep Ellum station, Wikipedia (opened September 14, 2009; the Traveling Man sculptures)",
          url: "https://en.wikipedia.org/wiki/Deep_Ellum_station",
        },
        {
          label: "Mapping Inequality, Redlining in New Deal America, University of Richmond Digital Scholarship Lab, Dallas 1937 (Deep Ellum and downtown marked commercial, without a grade)",
          url: "https://dsl.richmond.edu/panorama/redlining/map/TX/Dallas",
        },
      ],
    },
    {
      id: "main-and-akard",
      number: 2,
      title: "Main and Akard",
      dek: "In 1910 a mob hanged Allen Brooks from a welcome arch on this corner. In 1961 the same downtown desegregated its lunch counters by arrangement",
      mapLabel: "Main and Akard",
      lat: 32.780572,
      lng: -96.799503,
      audioSrc: "",
      audioSeconds: 0,
      lookFor: "Pegasus Plaza, the small park on the south side of Main Street at Akard Street, beside the Magnolia Building. The base of the 2021 historical marker stands near the corner. Look west along Main toward the red sandstone courthouse, half a mile away.",
      transcript: [
        "You are at Main and Akard, in the middle of downtown, in a small park called Pegasus Plaza. In July 1908 the Elks held their national convention in Dallas, and the city built an arch of electric lights across Main Street right here to welcome them. There is a night photograph of it in the Library of Congress. Welcome Visitors, it says, in bulbs. **The arch was still standing on March 3, 1910.**",
        "That day a crowd of white men broke into the county courthouse, the red sandstone building half a mile west along Main that Dallas calls Old Red, where a Black man named Allen Brooks, fifty-nine years old, a handyman, was being held on an accusation of assaulting a white child. **They threw him from a second-floor window with a rope around his neck, dragged him along Main Street to this corner, and hanged him from a telegraph pole beside the arch.** Thousands watched. A photographer made a picture and it was printed as a souvenir postcard and mailed around the country. No one was ever charged. **On November 20, 2021, the Dallas County Justice Initiative, Remembering Black Dallas and the Equal Justice Initiative dedicated a marker to him on this corner**, with a hundred and ten white carnations for the years since and fifty-nine red roses for his life. A second marker went up at the courthouse in July 2023. In May 2025 someone cut the sign off the marker here and took it, and when this tour was written a replacement was being made. The base is what you can see.",
        "The lynching was the loudest thing this downtown did about race. The quieter things were written down. **In 1907 the city charter was amended to require segregation in schools, churches and places of amusement. In 1916 Dallas voters approved an ordinance that sorted the city's blocks into white, Black and open**, and closed each block to the other race once one was living on it. The Texas Supreme Court struck it down in 1917, the same year the United States Supreme Court struck down a similar ordinance in Louisville, so in 1921 the city passed another one, which let the residents of a neighborhood petition to have it designated for one race, and required three quarters of them to undo it. Deed restrictions did the rest.",
        "In 1921 the Ku Klux Klan organized a Dallas chapter, Klan Number 66. **On the first of April that year its members whipped a Black bellhop named Alex Johnson and branded the letters K K K into his forehead.** Within a few years the chapter had about thirteen thousand members, one in three eligible men in the city, and its candidates won the 1922 elections. Its exalted cyclops, a Dallas dentist named Hiram Wesley Evans, left in 1922 to become the Klan's national leader. **On October 24, 1923, the State Fair of Texas held a Klan Day that drew more than a hundred and fifty thousand people.** The chapter fell apart within a few years. The fair went on admitting Black visitors on one day of its run, called Negro Achievement Day from 1936, and in 1955 the NAACP Youth Council, led by Juanita Craft, picketed it.",
        "Now walk two blocks east in your mind, to Main and Ervay, where the Wilson Building stands. **On April 25, 1960, Richard Stewart, one of five Black students at Southern Methodist University, sat down with two white seminary classmates at the whites-only lunch counter of the H. L. Green store there.** It was the first publicized protest against a segregated eating place in Dallas. Black ministers picketed outside the store that year, and Craft's youth council went on picketing lunch counters, theaters and buses for four years.",
        "What the city did next is the Dallas way of doing things. The Dallas Citizens Council, founded in 1937 by the banker R. L. Thornton and open only to the heads of large companies, formed a biracial committee in 1961, chaired by its president C. A. Tatum and including Black leaders such as A. Maceo Smith and the lawyer W. J. Durham. **On July 26, 1961, the committee had nearly fifty downtown lunch counters serve Black customers on the same day, by arrangement, with no announcement and no crowd.** A council member, the advertising man Sam Bloom, produced a film, Dallas at the Crossroads, narrated by Walter Cronkite, which was shown to the city's civic clubs for weeks and broadcast on the evening of September 5, 1961, telling white Dallas to obey the law. The next morning eighteen Black first-graders entered white schools. Dallas had watched Little Rock and New Orleans and decided that whatever else happened, it would not be photographed.",
        "The next stop is on the far side of downtown, in the Arts District, on the corner where three buildings of Freedman's Town are still standing.",
      ],
      images: [
        {
          src: `${MEDIA}/main-akard-1908-elks-arch.jpg`,
          alt: "A night photograph of an electric-lit welcome arch spanning Main Street at Akard Street in 1908, its curves outlined in bulbs, the words Welcome Visitors across the middle and streetcar tracks running beneath it",
          credit:
            "The Elks' Court of Honor arch across Main Street at Akard, lit at night for the Elks' Grand Lodge meeting of July 1908. On March 3, 1910, a mob hanged Allen Brooks from a pole beside it. Keystone View Company stereograph, Library of Congress, Prints and Photographs Division, LC-USZ62-92705. No known restrictions on publication.",
          label: "1908",
          after: 0,
        },
        {
          src: `${MEDIA}/main-akard-1903-courthouse.jpg`,
          alt: "A colored postcard of the Dallas County Courthouse in 1903, a large red sandstone building with a central clock tower, corner turrets and arched windows, with a few figures on the street in front",
          credit:
            "The Dallas County Courthouse on a 1903 postcard. Allen Brooks was taken from a second-floor window of this building. Joseph Linz and Brothers, Dallas, 1903, Library of Congress, Prints and Photographs Division. No known restrictions on publication.",
          label: "1903",
          after: 1,
        },
        {
          src: `${MEDIA}/main-akard-1905-main-street.jpg`,
          alt: "A 1905 postcard view along Main Street in Dallas, with tall stone commercial buildings on both sides, streetcar wires overhead, horse-drawn wagons at the curb and a few pedestrians in the road",
          credit:
            "Main Street in 1905, five years before the lynching, looking along the blocks the mob walked. Rotograph Company postcard, Library of Congress, Prints and Photographs Division. No known restrictions on publication.",
          label: "1905",
          after: 1,
        },
        {
          src: `${MEDIA}/main-akard-1926-main-street.jpg`,
          alt: "A black and white view west along Main Street from St. Paul Street around 1926, with cars and a streetcar in the road and tall office buildings, including the Praetorian and Kirby buildings, rising on both sides",
          credit:
            "Main Street looking west from St. Paul Street, around 1926, in the years of Klan Number 66. The Wilson Building, where the H. L. Green lunch counter later stood, is on this stretch. Keystone View Company stereograph, Library of Congress, Prints and Photographs Division, LC-USZ62-92710. No known restrictions on publication.",
          label: "c. 1926",
          after: 3,
        },
        {
          src: `${MEDIA}/main-akard-old-red-2014.jpg`,
          alt: "The former Dallas County Courthouse today, a red sandstone Romanesque building with a tall clock tower and round corner turrets, under a blue sky",
          credit:
            "The courthouse today, which Dallas calls Old Red. A second marker for Allen Brooks was placed here in July 2023. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
          label: "Old Red",
          after: 5,
        },
      ],
      nowImage: {
        src: `${MEDIA}/main-akard-magnolia-2014.jpg`,
        alt: "Carved stone figures and an eagle above the words Magnolia Building on the facade of an early twentieth-century office tower in downtown Dallas",
        credit:
          "The Magnolia Building at Akard and Commerce, the tower beside Pegasus Plaza. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
        label: "Today",
        after: 2,
      },
      interrupts: [
        {
          title: "The referendum",
          body: [
            "**In 1916 Dallas put racial zoning to a popular vote.** The ordinance the voters approved designated blocks as white, Black or open, and closed a block to the other race once one race lived there. It did what a deed covenant did, but for the whole city at once and by majority.",
            "It lasted a year. The Texas Supreme Court invalidated it in 1917, and in November of that year the United States Supreme Court, in Buchanan v. Warley, held that Louisville's version violated the Fourteenth Amendment. **Dallas's answer in 1921 was to let residents petition for a designation instead of imposing one**, which put the same map back under a different signature. When that failed too, the work passed to deed restrictions, to the appraisers you will meet at the fifth stop, and to the roads.",
          ],
          after: 2,
        },
      ],
      toNext: {
        text: "From Pegasus Plaza cross Main and walk north on Akard Street for four blocks, across Elm and Pacific, to Ross Avenue. Turn right on Ross for two blocks to Harwood Street, then left on Harwood for one block to Flora Street. Turn right onto Flora and follow it past the Dallas Museum of Art and the Nasher Sculpture Center, across Pearl and Olive, to Routh Street. The 1922 school is on the corner ahead of you.",
        distanceMeters: 1508,
        minutes: 19,
      },
      sources: [
        {
          label: "Night view of Elks' Court of Honor, at intersection of Main and Akard Streets, Dallas, Texas, Grand Lodge meeting, July 1908, Keystone View Company, Library of Congress",
          url: "https://www.loc.gov/pictures/item/93517287/",
        },
        {
          label: "Equal Justice Initiative, Dallas Community Memorializes Allen Brooks with Historical Marker (the March 3, 1910 lynching, the courthouse window, the pole at Main and Akard, the postcard, no prosecutions, and the November 20, 2021 dedication)",
          url: "https://eji.org/news/dallas-community-memorializes-allen-brooks-with-historical-marker/",
        },
        {
          label: "KERA News, 111 years in the making, Dallas advocates unveil historical marker for Allen Brooks, November 20, 2021",
          url: "https://www.keranews.org/news/2021-11-20/allen-brooks-marker-ceremony",
        },
        {
          label: "KERA News, Historical marker commemorating lynching of Black man vandalized in downtown Dallas, May 28, 2025",
          url: "https://www.keranews.org/texas-news/2025-05-28/historical-marker-downtown-dallas-allen-brooks-lynching-vandalized",
        },
        {
          label: "Lynching of Allen Brooks, Wikipedia (the crowd, the postcard's wording and the second marker at the courthouse in July 2023)",
          url: "https://en.wikipedia.org/wiki/Lynching_of_Allen_Brooks",
        },
        {
          label: "Cynthia Lewis, Under Asphalt and Concrete, Texas Woman's University, 2019, chapter two, citing Michael Phillips, White Metropolis (the 1907 charter amendment, the 1916 referendum, the 1917 Texas Supreme Court decision and the 1921 petition law)",
          url: "https://twu-ir.tdl.org/server/api/core/bitstreams/25c75ee8-4aec-4df1-b163-a163b210eea0/content",
        },
        {
          label: "Buchanan v. Warley, 245 U.S. 60 (1917), Supreme Court of the United States",
          url: "https://supreme.justia.com/cases/federal/us/245/60/",
        },
        {
          label: "Amber Jolly and Ted Banks, Dallas Ku Klux Klan No. 66, Handbook of Texas Online, Texas State Historical Association (the 1921 founding, the whipping of Alex Johnson on April 1, 1921, the 13,000 members, Hiram Wesley Evans, the 1922 elections and the Klan Day of October 24, 1923)",
          url: "https://www.tshaonline.org/handbook/entries/dallas-ku-klux-klan-no-66",
        },
        {
          label: "Mamie L. Abernathy-McKnight, Craft, Juanita Jewel Shanks, Handbook of Texas Online (the 1955 State Fair picket and the youth council's pickets of lunch counters, restaurants and theaters from 1961 to 1964)",
          url: "https://www.tshaonline.org/handbook/entries/craft-juanita-jewel-shanks",
        },
        {
          label: "Linda Green, Memories of Integration, United Methodist News Service, February 1997 (Richard Stewart, one of five Black students at SMU, and the April 25, 1960 sit-in at H. L. Green)",
          url: "https://archive.wfn.org/1997/02/msg00037.html",
        },
        {
          label: "City of Dallas Office of Historic Preservation, Black History Month posts, February 2018 (H. L. Green at 1623 Main Street in the Wilson Building, the first downtown department store to desegregate its lunch counter)",
          url: "https://cityofdallaspreservation.wordpress.com/2018/02/27/black-history-month-posts-2018/",
        },
        {
          label: "Citizens Protest Segregation at H.L. Green, 1960, photograph of the Reverends E. W. Thomas and H. Rhett James picketing, Marion Butts Collection, Dallas Public Library, via East Texas History",
          url: "https://easttexashistory.org/files/show/2662",
        },
        {
          label: "Dallas Citizens Council, Handbook of Texas Online (founded November 12, 1937, the membership rule, the 1961 biracial committee under C. A. Tatum Jr., and Sam Bloom's film Dallas at the Crossroads)",
          url: "https://www.tshaonline.org/handbook/entries/dallas-citizens-council",
        },
        {
          label: "Commit Partnership, The Miseducation of Dallas County, Desegregation is not Integration (the Committee of 14 with A. Maceo Smith and W. J. Durham, the nearly fifty restaurants, and the September 5, 1961 broadcast, citing the Dallas Morning News of September 2, 1961)",
          url: "https://www.commitpartnership.org/insights/latest-learnings/desegregation-integration",
        },
        {
          label: "Texas Lunch Counter Desegregation Narrative, San Antonio Report, 2019 (Dallas lunch counters desegregated on July 26, 1961, citing Martin Kuhlman)",
          url: "https://sanantonioreport.org/wp-content/uploads/2019/05/Texas-Lunch-Counter-Desegregation-Narrative_FINAL.pdf",
        },
        {
          label: "Dallas at the Crossroads (1961), Texas Archive of the Moving Image",
          url: "https://texasarchive.org/2010_01599",
        },
        {
          label: "Dallas ISD, The Work Continues, A timeline of the desegregation of Dallas ISD schools (September 6, 1961, eighteen Black students enter white schools)",
          url: "https://thehub.dallasisd.org/2021/08/31/43577/",
        },
      ],
    },
    {
      id: "flora-street",
      number: 3,
      title: "Flora Street",
      dek: "A church of 1873, a high school of 1922 and a YMCA of 1930 are what is left of Freedman's Town on this side of the freeway. The Arts District was built around them",
      mapLabel: "Booker T. Washington",
      lat: 32.79142,
      lng: -96.79576,
      audioSrc: "",
      audioSeconds: 0,
      lookFor: "The corner of Flora Street and Routh Street. The red brick school of 1922 faces Flora. St. Paul's brick church is across Routh. The Moorland YMCA, now the Dallas Black Dance Theatre, is one block east, where Flora becomes Ann Williams Way. Stay on the sidewalk, since the school is in session on weekdays.",
      transcript: [
        "You are at Flora and Routh, in the Arts District, and you are standing in Freedman's Town. Three buildings on this corner are older than everything else you can see. The red brick school on the corner is Booker T. Washington High School, built in 1922. The brick church across Routh Street is St. Paul United Methodist, organized in 1873. One block east, where the street changes its name to Ann Williams Way, is the Moorland YMCA of 1930. **Everything else, the museum, the concert hall, the opera house, the sculpture garden, arrived after 1984.**",
        "When emancipation reached Texas in 1865, freedpeople settled on the open ground just north of the town, and in 1869 a white landowner named William Boales began selling them acreage. In 1873 the Dallas Herald counted over five hundred Black residents in what it called Freedmantown. **St. Paul was organized that year under a brush arbor, and its first frame church was also a school.** By 1878 there were seven Black churches in the neighborhood. The high school was the work of a Baptist preacher, Allen R. Griggs, who started a grammar school here around 1875 and added grades until he had a high school. **In 1892 the city opened its first public high school for Black students, and in 1922 that school moved into this building, designed by Lang and Witchell, and was renamed for Booker T. Washington.** For the next seventeen years, until Lincoln High School opened in 1939, every Black high school student in Dallas came here.",
        "The YMCA came next. Dallas's YMCA, founded in 1885, was for white men. Black men formed their own association in 1902, it became a branch of the city Y after the First World War, and in 1928 the branch set out to build a home of its own. In the middle of the Depression Black Dallasites raised seventy-five thousand dollars toward it. **The cornerstone was laid on April 6, 1930, by the grand lodge of the Knights of Pythias, the same order whose temple you saw in Deep Ellum.** Two arched doors on the front were carved Men and Boys. Women used a side door. Upstairs were thirty-seven sleeping rooms, because the hotels downtown would not take Black travelers, and Thurgood Marshall and Muhammad Ali stayed here. It was the only Y for Black people in the Southwest. Black schools without gyms held their games and their proms in it. **In the 1950s the NAACP held its public meetings here, and in 1967 the Dallas Morning News called the building a focal point in the shaping of the destiny of a total community.** Ernie Banks played ball here as a boy. It closed in 1970, when a new Y opened in Oak Cliff, and the Dallas Black Dance Theatre has been in it since 2008. The block of Flora in front of it was renamed for the company's founder, Ann Williams, in 2014.",
        "In 1937 the federal Home Owners' Loan Corporation sent appraisers through Dallas to grade its neighborhoods for mortgage lenders. **The form for the area that includes this corner, area D8, colored red, says under foreign born, Mexican, fifty percent. Under Negro, yes, twenty percent. Under detrimental influences, type of population, old cheap houses predominate.** Under availability of mortgage funds it says none. And under clarifying remarks it says this. Almost no sales as properties are being held as future business and industrial sites. In 1937 the appraiser was already describing the ground under the school as somebody's future business site.",
        "**The roads came first.** The Central Expressway right-of-way ran along the east edge of the neighborhood. In February 1947 the city bought a whole block between Munger Avenue and Flora Street with at least thirty Black-owned houses on it for 109,790 dollars, about nine thousand dollars more than it paid the same month for a single commercial building, while white-owned houses nearby were selling for twenty to forty thousand dollars each. Owners who refused got blanket condemnations and eviction notices of sixty days to six months. Then, in 1952, the city's traffic engineer proposed a freeway along Cochran and Munger streets, one block north of here, and that is the fourth stop.",
        "The plan for this ground was written in 1977, when the city hired Carr, Lynch Associates to study where its museum and its orchestra, both stuck in old buildings at Fair Park, should go. **Voters approved bonds in 1979, the council adopted a master plan by Sasaki Associates in 1982, and in February 1983 it zoned sixty-eight acres here as the Arts District.** The Dallas Museum of Art opened in January 1984 and the Meyerson Symphony Center in 1989. The school, the church and the Y were inside the sixty-eight acres and stayed. In 2016 the church was listed on the National Register.",
        "The school changed too. In 1970 a parent named Sam Tasby sued the school district, and in July 1971 a federal judge found that Dallas still ran a dual system. **In 1976, under the desegregation order, the district made this school its arts magnet**, open to students from across the city. Erykah Badu, Norah Jones and Roy Hargrove went here. Ernie Banks went to the old school, before the magnet, and learned his baseball at the Y a block away. The city made the 1922 building a landmark in 2006, and the new building beside it, finished in 2008, was designed to keep it.",
        "The next stop is Klyde Warren Park, back down Flora and one block north, on top of the freeway.",
      ],
      images: [
        {
          src: `${MEDIA}/flora-street-1958-sheet.jpg`,
          alt: "A section of the 1958 survey sheet showing Washington High School, Sacred Heart School and Crozier Technical High School among the small blocks north of downtown Dallas, with the six-lane Central Expressway at the right edge and the built-up blocks tinted red",
          credit:
            "This corner on the 1958 survey sheet. Washington High School is marked at the center, with the blocks of Freedman's Town around it and the new Central Expressway at the right. Every street between the school and the expressway was later cleared for the Arts District or the freeway. United States Geological Survey, Dallas quadrangle, 1958. Public domain.",
          label: "1958",
          after: 2,
        },
        {
          src: `${MEDIA}/flora-street-1937-holc.jpg`,
          alt: "The 1937 Home Owners' Loan Corporation areas drawn over the 1958 survey sheet, with area D8 colored red covering the blocks around Washington High School and Little Mexico, a yellow area to the north, and the ungraded commercial blocks of downtown left plain to the south",
          credit:
            "The 1937 appraisal areas around this corner, drawn over the 1958 sheet. Area D8, red, took in the blocks around the school and Little Mexico to the west. Its form said the properties were being held as future business and industrial sites. Polygons from Mapping Inequality, University of Richmond Digital Scholarship Lab (CC BY-NC 4.0), from the Home Owners' Loan Corporation's 1937 map of Dallas, a federal record in the public domain.",
          label: "1937",
          after: 3,
        },
        {
          src: `${MEDIA}/flora-street-dma-2014.jpg`,
          alt: "The entrance of the Dallas Museum of Art, a low white canopy with the museum's name on it above a large bronze reclining sculpture on a stone plinth, with clipped hedges on either side",
          credit:
            "The Dallas Museum of Art on Flora Street, opened in January 1984, the first building of the Arts District. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
          label: "1984",
          after: 5,
        },
      ],
      nowImage: {
        src: `${MEDIA}/flora-street-meyerson-2014.jpg`,
        alt: "The Morton H. Meyerson Symphony Center at dusk, a curved glass and stone building with a lit interior, seen across an empty plaza with a tree at the right",
        credit:
          "The Meyerson Symphony Center on Flora Street, opened in 1989, one block from the school. Photograph by Carol M. Highsmith, August 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
        label: "Today",
        after: 6,
      },
      interrupts: [
        {
          title: "The only",
          body: [
            "**From 1892 to 1939 Dallas had one high school for its Black students, and from 1930 to 1970 one YMCA.** A single institution for a whole population is not a neutral fact of scale. It means every Black teenager in a city of a quarter of a million rode to this corner, that the building was always full, and that when the city decided what to do with the ground around it, the school was the only one there was to negotiate with.",
            "The same arithmetic ran the other way at the Y. Because there was one, everything happened in it. The NAACP met in it, the proms were in it, the visiting lawyers slept in it. **That is why the civil rights history of Dallas has an address, and why the address is a block from the opera house.**",
          ],
          after: 2,
        },
      ],
      toNext: {
        text: "Walk back southwest on Flora Street for a quarter of a mile to Pearl Street, past the Meyerson. Turn right on Pearl and go north for two short blocks to the Woodall Rodgers frontage road. Cross at the signal and go straight into Klyde Warren Park. Walk to the middle of the main lawn.",
        distanceMeters: 811,
        minutes: 10,
      },
      sources: [
        {
          label: "Marsha Prior, Freedmantown/North Dallas, Handbook of Texas Online, Texas State Historical Association (the 1865 settlement, William Boales's 1869 sales, the 1873 Dallas Herald count, the seven churches of 1878, Allen R. Griggs's school, the 1922 move to Flora and Fairmount, the YMCA and YWCA buildings)",
          url: "https://www.tshaonline.org/handbook/entries/freedmantownnorth-dallas",
        },
        {
          label: "City of Dallas Office of Historic Preservation, Booker T. Washington School (constructed 1922, Lang and Witchell, the only high school for African American students for seventeen years, Dallas Landmark 2006)",
          url: "https://dallascityhall.com/departments/sustainabledevelopment/historicpreservation/Pages/booker_t._washington_school.aspx",
        },
        {
          label: "Booker T. Washington High School for the Performing and Visual Arts, Wikipedia (the 1892 school, the 1976 arts magnet under Tasby v. Estes, the 2008 building and the alumni)",
          url: "https://en.wikipedia.org/wiki/Booker_T._Washington_High_School_for_the_Performing_and_Visual_Arts",
        },
        {
          label: "Texas Historical Commission, Discover These 8 African American History Sites in Dallas, July 8, 2020 (the 1922 school replacing the 1892 Dallas Colored High School; St. Paul, 1873)",
          url: "https://thc.texas.gov/blog/discover-these-8-african-american-history-sites-dallas",
        },
        {
          label: "Dallas ISD, The Work Continues, A timeline of the desegregation of Dallas ISD schools (Sam Tasby's suit of October 6, 1970 and the July 1971 ruling)",
          url: "https://thehub.dallasisd.org/2021/08/31/43577/",
        },
        {
          label: "Marcel Quimby, Moorland YMCA Serves African-American Community, Dallas County Chronicle, June 2012 (the 1928 plan, the $75,000 raised, the cornerstone of April 6, 1930, the Men and Boys doors, the thirty-seven rooms, the NAACP meetings, Ernie Banks, the 1970 closing)",
          url: "https://www.dallascounty.org/Assets/uploads/docs/plandev/historical/Chronicle/2012/June2012Chronicle.pdf",
        },
        {
          label: "City of Dallas Office of Historic Preservation, Moorland YMCA, February 26, 2019 (Short North Dallas, the 1970 closing, the Dallas Black Dance Theatre since 2008 and the 2014 renaming of Flora Street)",
          url: "https://cityofdallaspreservation.wordpress.com/2019/02/26/moorland-ymca/",
        },
        {
          label: "St. Paul United Methodist Church, Texas Time Travel, Texas Historical Commission (organized 1873, the brick church completed in 1927, the Pittman attribution)",
          url: "https://texastimetravel.com/directory/st-paul-united-methodist-church-0/",
        },
        {
          label: "St. Paul United Methodist Church, Dallas County Pioneer Association (the Dallas Landmark designation of 1982, the state marker of 2013 and the National Register listing of December 27, 2016)",
          url: "https://dallaspioneer.org/st-paul-united-methodist-church/",
        },
        {
          label: "Mapping Inequality, Dallas 1937, area D8 (the appraisal form quoted in the narration)",
          url: "https://dsl.richmond.edu/panorama/redlining/map/TX/Dallas/area_descriptions#loc=14/32.79/-96.8",
        },
        {
          label: "Cynthia Lewis, Under Asphalt and Concrete, Texas Woman's University, 2019 (the February 1947 purchase of the block between Munger Avenue and Flora Street, the prices, and the blanket condemnations)",
          url: "https://twu-ir.tdl.org/server/api/core/bitstreams/25c75ee8-4aec-4df1-b163-a163b210eea0/content",
        },
        {
          label: "Arts District, Dallas, SAH Archipedia, Society of Architectural Historians (the 1977 Carr and Lynch study and the 1983 Sasaki plan along Flora Street)",
          url: "https://sah-archipedia.org/essays/TX-02-0001-0008-0002",
        },
        {
          label: "AIA Dallas, The Dallas Arts District (the Sasaki plan adopted in 1982, PD 145 zoned in February 1983, the sixty-eight acres, the museum in 1984)",
          url: "https://www.aiadallas.org/columns/the-dallas-arts-district/",
        },
        {
          label: "Dallas Museum of Art, Wikipedia (the 1979 bond election, the Edward Larrabee Barnes building and the January 1984 opening)",
          url: "https://en.wikipedia.org/wiki/Dallas_Museum_of_Art",
        },
      ],
    },
    {
      id: "klyde-warren",
      number: 4,
      title: "Klyde Warren Park",
      dek: "The freeway under your feet was proposed in 1952, took about two hundred Black homes, and opened in 1983. The park on top of it opened in 2012",
      mapLabel: "Klyde Warren Park",
      lat: 32.78979,
      lng: -96.80117,
      audioSrc: "",
      audioSeconds: 0,
      lookFor: "The main lawn of Klyde Warren Park, between Pearl Street and St. Paul Street. Stand near the middle and you are above the center lanes of Woodall Rodgers Freeway. The skyline is to the south, Uptown to the north.",
      transcript: [
        "You are standing on a lawn about five acres in size, and under the lawn, a few feet down, the lanes of Woodall Rodgers Freeway are moving. The park is a concrete deck built across the trench between Pearl Street and St. Paul Street. Downtown is behind you to the south. Uptown, which is Freedman's Town under a new name, is in front of you to the north. **For twenty-nine years, from 1983 to 2012, the only way across this gap was a street bridge over the trench.**",
        "The freeway is named for James Woodall Rodgers, mayor from 1939 to 1947, whose administration began Central Expressway. **In 1952 the city's traffic engineer, Lloyd Braff, proposed a loop of freeways around downtown, and this was to be its north side, along Cochran and Munger streets.** People called it the Cochran-Munger Expressway, after the streets it would erase. The state agreed to take it into the highway system only after the city promised to pay for the right-of-way itself. Construction began in 1958. By 1962 most of Cochran Street had been demolished, and churches, businesses and families were moved. **The freeway leveled about two hundred Black homes in North Dallas.** Money and design problems then stalled it for two decades, so that the neighborhood lived beside a half-built trench, and it opened to traffic in May 1983.",
        "It cut on the west side too. **West of here, on the other side of the Dallas North Tollway, was Little Mexico**, the neighborhood Mexican families built after 1910 as they fled the revolution, with eight to ten thousand people by 1920. The tollway split it in half between 1966 and 1968, this freeway cut through it too, and development took the rest. What is left is Pike Park, six tenths of a mile west of here, which began in 1913 as Summit Play Park. Its field house was built in 1915, and in 1931 the park board had to write rules for the joint use of the park by Mexicans and Americans, in its words, because white residents kept trying to keep Mexican American children out. In 1978, when the neighborhood was already going, the city rebuilt the field house in a Mexican style with a red tile roof. The red area the appraisers drew here in 1937, D8, ran west from these blocks toward Little Mexico, and its form says foreign born, Mexican, fifty percent.",
        "**The park opened on October 27, 2012.** It cost the city twenty million dollars in bonds, the state and federal governments twenty million in highway money, the 2009 stimulus act sixteen and seven tenths million, and private donors nearly fifty million, of which the businessman Kelcy Warren gave ten million and named the park for his son. It is a good park, with a promenade under the trees and a lawn where children run through the fountains. **What it connects is the Arts District to Uptown.** What it replaced, in the sense that matters on this walk, was a neighborhood that did not need connecting, because Cochran Street ran straight through it.",
        "The next stop is State-Thomas, the part of Freedman's Town that survived as houses, about three quarters of a mile north.",
      ],
      images: [
        {
          src: `${MEDIA}/klyde-warren-freeways-2014.jpg`,
          alt: "An aerial view of a tangle of freeway ramps and railway lines on the edge of downtown Dallas, with lines of traffic, a freight train and warehouses below",
          credit:
            "The freeways and rail lines that meet at the edge of downtown Dallas, seen from Reunion Tower. Woodall Rodgers was to be the north side of a loop of them. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
          label: "The loop",
          after: 1,
        },
        {
          src: `${MEDIA}/klyde-warren-pool-2014.jpg`,
          alt: "Children run through jets of water in a shallow pool at Klyde Warren Park, with the glass towers of downtown Dallas rising behind them under a cloudy sky",
          credit:
            "The fountains at Klyde Warren Park, with downtown behind. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
          label: "The park",
          after: 3,
        },
      ],
      nowImage: {
        src: `${MEDIA}/klyde-warren-promenade-2014.jpg`,
        alt: "A tree-lined promenade in Klyde Warren Park, with white arched sculptures over the path, tables and chairs in the shade and a lawn to one side",
        credit:
          "The promenade at Klyde Warren Park, on the deck over the freeway. Photograph by Carol M. Highsmith, May 2014, Carol M. Highsmith Archive, Library of Congress. No known restrictions on publication.",
        label: "Today",
        after: 0,
      },
      interrupts: [
        {
          title: "The inner loop",
          body: [
            "**A loop road needs a north side, and in 1952 the north side of downtown Dallas was Freedman's Town.** The traffic engineer's drawing put the freeway on Cochran and Munger streets, and the state's condition, that the city buy the right-of-way, made the cheapest land the obvious land. The 1937 appraisal form had already priced it. Area D8, mortgage funds none, properties held as future business and industrial sites.",
            "Between the plan of 1952 and the opening of 1983 lie thirty-one years in which the houses were bought, cleared and left as a trench while the money was found. **A neighborhood cannot wait thirty-one years.** By the time the road opened, the blocks on both sides of it had emptied, and the ground north of it was ready for what the city called a tax increment district. That is the fifth stop.",
          ],
          after: 1,
        },
      ],
      toNext: {
        text: "Leave the park at its northeast corner, at Pearl Street, and turn right along the north frontage road of Woodall Rodgers, walking east with the freeway on your right, for about a quarter of a mile to Routh Street. Turn left onto Routh and go north for two blocks to Thomas Avenue. Turn right onto Thomas and follow it northeast for three blocks to Allen Street, then turn left onto Allen for one block to State Street. Stop on the corner.",
        distanceMeters: 1435,
        minutes: 18,
      },
      sources: [
        {
          label: "Woodall Rodgers, Wikipedia (James Woodall Rodgers, mayor of Dallas 1939 to 1947, Central Expressway begun in his term, the freeway named for him)",
          url: "https://en.wikipedia.org/wiki/Woodall_Rodgers",
        },
        {
          label: "Texas State Highway Spur 366, Wikipedia (the Woodall Rodgers Freeway, opened 1983, 2.6 miles, built through a prominent African American neighborhood)",
          url: "https://en.wikipedia.org/wiki/Woodall_Rodgers_Freeway",
        },
        {
          label: "Cynthia Lewis, Under Asphalt and Concrete, Texas Woman's University, 2019 (Lloyd Braff's 1952 inner loop, the Cochran-Munger Expressway, the state's right-of-way condition, construction from 1958, roughly two hundred Black homes, and the May 1983 opening)",
          url: "https://twu-ir.tdl.org/server/api/core/bitstreams/25c75ee8-4aec-4df1-b163-a163b210eea0/content",
        },
        {
          label: "Marsha Prior, Freedmantown/North Dallas, Handbook of Texas Online (the 1962 demolition of most of Cochran Street for the freeway)",
          url: "https://www.tshaonline.org/handbook/entries/freedmantownnorth-dallas",
        },
        {
          label: "Kathryn Holliday, Road to Disinvestment, Columns, AIA Dallas, February 2017 (Woodall Rodgers begun in the 1960s through Little Mexico and North Dallas and opened in 1983; the Dallas North Tollway through the center of Little Mexico)",
          url: "https://www.aiadallas.org/columns/road-to-disinvestment/",
        },
        {
          label: "Klyde Warren Park, Wikipedia (opened October 27, 2012; the city, state, federal, stimulus and private funding; Kelcy Warren's gift)",
          url: "https://en.wikipedia.org/wiki/Klyde_Warren_Park",
        },
        {
          label: "Little Mexico, Handbook of Texas Online, Texas State Historical Association (the population of 8,000 to 10,000 in 1920, the tollway of 1966 to 1968, and the few buildings left)",
          url: "https://www.tshaonline.org/handbook/entries/little-mexico",
        },
        {
          label: "Dallas Landmark Commission, Landmark Nomination Form, Summit Play Park / Pike Park, February 1996 (the origin in 1912 to 1913, the 1915 field house by Lang and Witchell, the renaming of July 12, 1927, the 1931 rules for joint use, and the December 1978 renovation)",
          url: "https://dallascityhall.com/departments/sustainabledevelopment/historicpreservation/HP%20Documents/Landmark%20Structures/Pike%20Park%20Landmark%20Nomination.pdf",
        },
        {
          label: "City of Dallas Office of Historic Preservation, Pike Park (established 1913 as Summit Play Park; Dallas Landmark 2000)",
          url: "https://dallascityhall.com/departments/sustainabledevelopment/historicpreservation/Pages/Pike-Park.aspx",
        },
        {
          label: "Mapping Inequality, Dallas 1937, area D8",
          url: "https://dsl.richmond.edu/panorama/redlining/map/TX/Dallas/area_descriptions#loc=14/32.79/-96.8",
        },
      ],
    },
    {
      id: "state-thomas",
      number: 5,
      title: "State-Thomas",
      dek: "The best Black streets in Dallas, an appraiser wrote in 1937. A landmark district in 1986, the city's first tax increment district in 1988, and Uptown after that",
      mapLabel: "State-Thomas",
      lat: 32.797289,
      lng: -96.797982,
      audioSrc: "",
      audioSeconds: 0,
      lookFor: "The corner of State Street and Allen Street. Look southwest along State Street for the Victorian houses with porches and turned wood. The Spake House of 1890 is at 2600 State Street, two blocks down. The new apartment blocks around them are Uptown.",
      transcript: [
        "You are at State Street and Allen Street, in what the city calls the State-Thomas Historic District. Look along State Street. **The wooden houses with the deep porches are the largest group of Victorian houses left in Dallas**, and the new apartment buildings around them are Uptown. This is the piece of Freedman's Town that survived as houses, and for a long time it was two neighborhoods with a line through them.",
        "The line was Hall Street, two blocks north. South of it, in the 1880s and 1890s, white families built the big houses you are looking at. North of it were the freedpeople's acres. **When the white families left for Highland Park after 1900, Black professionals bought some of these houses**, and the neighborhood that was being called North Dallas by 1889 became the center of Black Dallas. The Dallas Express, the Black weekly, was founded here in 1892. The city's first Black-owned bank, the Penny Savings Bank, opened in 1907. Dr. William McMillan opened a sanitarium at Hall and State in 1923. **The number of businesses grew from about fifty after the First World War to more than a hundred and thirty by 1924**, and by the 1920s Dallas had more than twenty-four thousand Black residents. North Dallas was, in the words of the city's preservation planner Marsha Prior, the heart and soul of Black Dallas. The architect William Sidney Pittman lived here. So did Ollie Bryan, one of the first Black women dentists in the country.",
        "In 1937 the appraisers came through. **The form for this area, C10, colored yellow, says under Negro, yes, fifteen percent.** Under detrimental influences it says railroad tracks through area, cemetery in area, mixtures of population. Under trend of desirability it says down. Under availability of mortgage funds it says limited. And under clarifying remarks it says, Thomas and State streets best negro streets. The appraiser could see what these streets were. He graded them for lenders anyway, and the grade was the one that said, do not lend here for long.",
        "**The first blow was the expressway.** In the 1940s the railroad tracks on the east side of the neighborhood were pulled up and Central Expressway was built on them, and when it opened in 1949 it cut North Dallas in two. Prior, who has spent a career on this neighborhood, put it this way to the Dallas Morning News in 2021. It is one thing to cross over some railroad tracks. It is another thing to try to cross over a freeway on foot. Roseland Homes, the public housing project that opened on the east side in 1942, had already taken houses and a church. Then came the 1962 demolitions for Woodall Rodgers, and then desegregation, which let Black families leave, and by the 1980s most of the blocks around you stood empty.",
        "**On March 19, 1986, the city made what was left a landmark district, and in 1988 it drew its first tax increment financing district around it, the State-Thomas TIF.** A TIF takes the rise in property taxes inside a line and spends it inside the line, on streets, sewers and buried wires, so that developers will build there. Here it worked exactly as designed. The Meridian apartments went up on State Street in 1991, an improvement district followed, and the TIF district went, in the words of its own boosters, from ninety-five percent vacant to ninety-five percent developed. The free trolley on McKinney Avenue had started running in 1989. **What the TIF did not include was anyone who had left.** Prior said it in one sentence. We blinked and it became Uptown.",
        "Look at the houses once more before you go. The Spake House at 2600 State Street was built in 1890. Griggs Park, a block east, is named for Allen Griggs, the preacher whose school became Booker T. Washington. The cemetery the appraiser listed as a detrimental influence is the last stop.",
        "It is about half a mile. Walk northeast on State Street to Hall Street.",
      ],
      images: [
        {
          src: `${MEDIA}/state-thomas-1937-holc.jpg`,
          alt: "The 1937 Home Owners' Loan Corporation areas drawn over the 1958 survey sheet, with a large yellow area labeled C10 covering the Freedman's Town blocks around Hall Street and the cemeteries beside the expressway, and a red area labeled D8 at the lower left",
          credit:
            "The 1937 appraisal areas around this stop, drawn over the 1958 sheet. Area C10, yellow, held Thomas and State streets, Hall Street and the cemetery. Its form graded the trend here as down and mortgage funds as limited. Polygons from Mapping Inequality, University of Richmond Digital Scholarship Lab (CC BY-NC 4.0), from the Home Owners' Loan Corporation's 1937 map of Dallas, a federal record in the public domain.",
          label: "1937",
          after: 2,
        },
        {
          src: `${MEDIA}/state-thomas-1958-sheet.jpg`,
          alt: "A section of the 1958 survey sheet showing the blocks of North Dallas between McKinney Avenue and the six-lane Central Expressway, with Griggs Park, Darrell School, and the Greenwood, Emanuel and freedmen's cemeteries at the top, the built-up blocks tinted red",
          credit:
            "North Dallas on the 1958 survey sheet, nine years after the expressway opened along its east side. Griggs Park is at the center and the cemeteries are at the top. United States Geological Survey, Dallas quadrangle, 1958. Public domain.",
          label: "1958",
          after: 3,
        },
      ],
      interrupts: [
        {
          title: "The appraisal form",
          body: [
            "**The 1937 form for area C10 is the strangest document on this walk, because the man who filled it in was paying attention.** He wrote that Thomas and State were the best Black streets. He listed the schools, the churches and the stores as favorable. Then he wrote down, as detrimental, the railroad, the cemetery and the mixture of the population, marked the trend as down and the mortgage funds as limited, and colored the area yellow.",
            "Yellow was not red. It meant a lender could still make a loan here, on a short term, at a higher rate, and should expect the area to decline. That expectation did its own work for forty years. **When the 1988 TIF arrived, the vacancy it was designed to cure was the one the form had predicted**, and the prediction had helped to cause it.",
          ],
          after: 2,
        },
      ],
      toNext: {
        text: "Walk northeast on State Street for four blocks, about a quarter of a mile, to Hall Street. Turn left onto Hall for a few steps, then right onto the sidewalk that runs along the Central Expressway frontage road, with the traffic on your right and the cemeteries on your left. Follow it for about three hundred yards to Lemmon Avenue. The gate of Freedman's Memorial, with its two bronze figures, is on the corner.",
        distanceMeters: 829,
        minutes: 10,
      },
      sources: [
        {
          label: "Marsha Prior, Freedmantown/North Dallas, Handbook of Texas Online (the 1889 ward and the name North Dallas, the Dallas Express of 1892, the Penny Savings Bank of 1907, the McMillan Sanitarium of 1923, the growth of businesses to 130 by 1924, the population over 24,000 in the 1920s, Roseland Homes in 1942, the expressway of 1949 and the 1962 demolitions)",
          url: "https://www.tshaonline.org/handbook/entries/freedmantownnorth-dallas",
        },
        {
          label: "Maggie Kelleher and Olivia Mars, State Thomas, now part of pricey Uptown, was once the heart and soul of Black Dallas, Dallas Morning News, February 22, 2021 (Marsha Prior's quotations, the line at Hall Street, Pittman and Ollie Bryan, the Spake House of 1890, the 1986 designation)",
          url: "https://www.dallasnews.com/news/2021/02/22/state-thomas-now-part-of-pricey-uptown-was-once-the-heart-and-soul-of-black-dallas/",
        },
        {
          label: "City of Dallas Office of Historic Preservation, State Thomas Historic District (Dallas Landmark District, 1986; the largest remaining collection of intact Victorian residential structures in Dallas)",
          url: "https://dallascityhall.com/departments/sustainabledevelopment/historicpreservation/Pages/state_thomas.aspx",
        },
        {
          label: "State Thomas, Dallas, Wikipedia (designated March 19, 1986; Griggs Park named for the Reverend A. R. Griggs)",
          url: "https://en.wikipedia.org/wiki/State_Thomas,_Dallas",
        },
        {
          label: "Uptown Dallas Inc., The Uptown Story (the 1988 State-Thomas TIF, the first in Dallas; the Meridian of 1991; ninety-five percent vacant to ninety-five percent developed)",
          url: "https://uptowndallas.net/uptown-beat/history-of-uptown/",
        },
        {
          label: "McKinney Avenue Transit Authority, Wikipedia (the trolley's return on July 22, 1989, and its free fare)",
          url: "https://en.wikipedia.org/wiki/McKinney_Avenue_Transit_Authority",
        },
        {
          label: "Mapping Inequality, Dallas 1937, area C10 (the appraisal form quoted in the narration)",
          url: "https://dsl.richmond.edu/panorama/redlining/map/TX/Dallas/area_descriptions#loc=14/32.797/-96.797",
        },
        {
          label: "Cynthia Lewis, Under Asphalt and Concrete, Texas Woman's University, 2019 (Roseland Homes replacing 266 homes and a church; the first two miles of the expressway through North Dallas and the more than a thousand people it displaced)",
          url: "https://twu-ir.tdl.org/server/api/core/bitstreams/25c75ee8-4aec-4df1-b163-a163b210eea0/content",
        },
        {
          label: "Marsha Prior and Robert V. Kemper, From Freedman's Town to Uptown, Community Transformation and Gentrification in Dallas, Texas, Urban Anthropology 34, no. 2/3 (2005), 177 to 216",
          url: "https://www.researchgate.net/publication/237611769_From_Freedman's_Town_To_Uptown_Community_Transformation_And_Gentrification_In_Dallas_Texas",
        },
      ],
    },
    {
      id: "freedmans-memorial",
      number: 6,
      title: "Freedman's Memorial",
      dek: "In 1869 freedpeople bought an acre for their dead. In 1947 the state built a freeway across part of it and offered ten dollars a grave. Between 1991 and 1994 the archaeologists counted 1,157 people",
      mapLabel: "Freedman's Memorial",
      lat: 32.8026,
      lng: -96.79355,
      audioSrc: "",
      audioSeconds: 0,
      lookFor: "The gate of Freedman's Memorial at Lemmon Avenue East and the Central Expressway frontage road, between the two bronze figures. The memorial is an open city park. Visit it in daylight and give the traffic beside it a wide berth.",
      transcript: [
        "You are at the gate of Freedman's Memorial, between two bronze figures. The man on the left is the Sentinel, dressed after the Benin kingdom of West Africa, and the woman on the right is the Prophetess, an oral historian with her hand raised. Inside are three more bronzes, a bound man and a bound woman set into the walls, called Struggling Soul and Violated Soul, and at the center a freed couple, called Dream of Freedom. All of them are by David Newton. The lanes of Central Expressway are running past the gate. **You are in a cemetery.**",
        "**In 1869 William Boales sold an acre here to a freedman named Sam Eakins for a burial ground**, one of the first things the people of Freedman's Town did as a community. For thirty-eight years, until about 1907, it was the main burial ground for Black Dallas. Roughly five thousand people were buried in it. Most families could not afford stone, and marked their graves with wooden crosses and small objects. The cemetery closed in the 1920s after vandalism, and the neighborhood's own decline, which you have been walking through all afternoon, left few people to tend it.",
        "**On August 12, 1946, the Dallas Morning News reported that the state highway department was about to build the city's first freeway, and the line of the old railroad ran across this ground.** Construction began in March 1947 and the road opened in August 1949. Part of the cemetery went under it. The crews used the wooden markers and the few headstones as fill. The state offered ten dollars a grave to any family that could prove a relative's grave had been destroyed. In 1965 the city set aside a small memorial park with the two original markers that were left.",
        "It came back in the 1980s, when the state planned to widen the expressway. **A survey found the graves in 1987, and a historian named Mamie McKnight and her organization, Black Dallas Remembered, made the city and the state stop and dig properly.** Between November 1991 and August 1994 archaeologists excavated just under an acre, and they recorded 1,150 burials holding the remains of 1,157 people, the largest cemetery excavation in the country at the time. Every one of them was reburied in a plot beside the memorial. The state's report on the work runs to several volumes, and a later dissertation reconstructed the cemetery year by year from the coffin hardware, the buttons and the charms the dead were buried with. The city made the ground a landmark in 1992, and the state put up a marker in 1993.",
        "**The city held a national search for an artist in the mid-1990s and chose David Newton, and the memorial was dedicated on Juneteenth 1999.** The poems on the plaques along the back wall were written by ten Dallas schoolchildren who won a contest, and the poem on the granite slab, called Here, is by the Dallas teacher and writer Nia Akimbo. Newton said his theme was the whole story, from Africa through enslavement to emancipation here.",
        "That is the end of the walk. Run the line once. 1869, an acre. 1910, an arch. 1916, a vote. 1937, a form. 1947, a road. 1983, another road. 1988, a line on a map with money inside it. 1999, this gate. **Every stop on this walk was a decision about who the ground was for, and every one of them was written down.** The Cityplace/Uptown station is about a third of a mile north, and the free trolley runs on McKinney Avenue, a few blocks west. Thank you for walking with us.",
      ],
      images: [
        {
          src: `${MEDIA}/freedmans-memorial-1958-sheet.jpg`,
          alt: "A section of the 1958 survey sheet showing Greenwood Cemetery, Emanuel Cemetery and a smaller cemetery marked with a cross, with the six-lane Central Expressway running north to south immediately beside them and the streets of North Dallas to the south",
          credit:
            "The cemeteries on the 1958 survey sheet, nine years after the expressway opened. The small plot marked with a cross beside the six-lane road is what was left of Freedman's Cemetery above ground. United States Geological Survey, Dallas quadrangle, 1958. Public domain.",
          label: "1958",
          after: 2,
        },
      ],
      interrupts: [
        {
          title: "Ten dollars a grave",
          body: [
            "**The state did not deny that it had built a road over graves. It priced them.** Ten dollars to any family that could prove which grave had been destroyed, in a cemetery where most graves had been marked with wood that the crews had already used as fill. The offer was designed not to be collected.",
            "The 1990s did the arithmetic the 1940s had refused. **1,150 burials, 1,157 people, every one recorded and reburied**, an artist chosen by a national search, a memorial paid for by the city. Nothing on this walk was undone. But this is the one place on it where the ledger was finally read aloud, and the names that could be recovered were said.",
          ],
          after: 3,
        },
      ],
      sources: [
        {
          label: "Marsha Prior, Freedmantown/North Dallas, Handbook of Texas Online (the 1869 sale of an acre to Sam Eakins for a cemetery, the 1965 memorial park with two original markers, and the 1993 state marker)",
          url: "https://www.tshaonline.org/handbook/entries/freedmantownnorth-dallas",
        },
        {
          label: "James M. Davidson, Freedman's Cemetery (1869 to 1907), A Chronological Reconstruction of an Excavated African-American Burial Ground, Dallas, Texas, doctoral dissertation, University of Texas at Austin, 2004 (the years of use, the excavation of November 1991 to August 1994, the 0.95 acre, the 1,150 burials and 1,157 individuals)",
          url: "https://repositories.lib.utexas.edu/server/api/core/bitstreams/057f6252-2890-45a7-abd2-771c31f8a582/content",
        },
        {
          label: "Duane E. Peter, Marsha Prior, Melissa M. Green and Victoria G. Clow, editors, Freedman's Cemetery, A Legacy of a Pioneer Black Community in Dallas, Texas, two volumes, Texas Department of Transportation, Archeology Studies Program Report 21, 2000 (catalog record)",
          url: "https://www.proquest.com/openview/64c8801c75558d4b38702cf680ac55c7/1?pq-origsite=gscholar&cbl=35231",
        },
        {
          label: "Megan Kimble, Dallas' First Freeway Built Over Freedman's Cemetery, Texas Observer, September 17, 2021 (the acre bought in 1869, the Dallas Morning News of August 12, 1946, the 1949 opening, the markers used as fill, the 1987 survey, the 1,157 remains, the 1999 dedication and David Newton's words)",
          url: "https://www.texasobserver.org/forgetful-city/",
        },
        {
          label: "Cynthia Lewis, Under Asphalt and Concrete, Texas Woman's University, 2019 (the makeshift markers used as road fill and the state's offer of ten dollars per grave, citing the Dallas Morning News)",
          url: "https://twu-ir.tdl.org/server/api/core/bitstreams/25c75ee8-4aec-4df1-b163-a163b210eea0/content",
        },
        {
          label: "City of Dallas Office of Historic Preservation, Remembering Dallas Historian Mamie McKnight, 1929 to 2018 (Black Dallas Remembered's intervention when crews widening the expressway found graves, and the largest cemetery excavation in the country)",
          url: "https://cityofdallaspreservation.wordpress.com/2018/01/12/remembering-dallas-historian-mamie-mcknight-1929-2018/",
        },
        {
          label: "City of Dallas Office of Historic Preservation, Freedman's Cemetery (Dallas Landmark 1992, state marker program 1993)",
          url: "https://dallascityhall.com/departments/sustainabledevelopment/historicpreservation/Pages/freedman_s_cemetery.aspx",
        },
        {
          label: "South Dallas Cultural Center, Freedman's Memorial, A Place for Healing, November 3, 2021 (the roughly five thousand burials, the mid-1990s national search, David Newton, the five bronzes and their names, the children's poems and Nia Akimbo's Here)",
          url: "https://sdcc.dallasculture.org/2021/11/03/freedmans-memorial-a-place-for-healing/",
        },
        {
          label: "Freedman's Cemetery Dallas, Clio (the remains and their effects reinterred in an adjacent plot under state law)",
          url: "https://theclio.com/entry/43576",
        },
        {
          label: "Kathryn Holliday, Road to Disinvestment, Columns, AIA Dallas, February 2017 (the memorial dedicated on Juneteenth 1999)",
          url: "https://www.aiadallas.org/columns/road-to-disinvestment/",
        },
        {
          label: "Texas Historical Commission, Discover These 8 African American History Sites in Dallas, July 8, 2020 (the cemetery established in 1869 and closed in the 1920s after vandalism)",
          url: "https://thc.texas.gov/blog/discover-these-8-african-american-history-sites-dallas",
        },
      ],
    },
  ],
};
