// ------------------------------------------------------------------
// Look Closer. The 1931 Turzak and Chapman map of Chicago as it is
// shown at the Chicago Maritime Museum, in a form a phone can hold.
//
// The words and the twelve details are the kiosk's own
// (public/kiosk/map-kiosk.html, built from the design-canvas export),
// carried over verbatim so the wall and the phone say the same thing.
// The detail circles are measured in the kiosk's map space, IMG_W by
// IMG_H, and every image of the map is the same crop, so a fraction of
// that space lands on the same spot at any size.
//
// The museum's name, mark, colors and visiting details come from
// chicagomaritimemuseum.org (September 2026). The mark is used with
// the partnership the wall already declares; ask before using it
// anywhere the museum has not seen.
// ------------------------------------------------------------------

export interface TextRun {
  t: string;
  /** set on the quoted words the map itself carries */
  b?: boolean;
}

export interface MapDetail {
  number: number;
  id: string;
  title: string;
  /** a 240px square crop of the map, from the kiosk */
  thumb: string;
  /** center and radius of the ring, in map space */
  cx: number;
  cy: number;
  r: number;
  /** a rectangle instead of a ring, for the index strip */
  box?: { w: number; h: number };
  /** the kiosk's label offset, kept so the numbers sit where they do on the wall */
  nudge?: { x: number; y: number };
  paragraphs: TextRun[][];
}

/** the kiosk's map space */
export const MAP_SPACE = { w: 7496, h: 4600 };

export const MAP_IMAGES = {
  /** paints first; 2400 by 1473 */
  base: "/media/look-closer/turzak-1931-2400.jpg",
  /** swapped in once the map is close; 6400 by 3927 */
  full: "/media/look-closer/turzak-1931-6400.jpg",
  /** the whole sheet for cards; 1400 wide */
  card: "/media/look-closer/turzak-1931-card.jpg",
};

export const MAP_CREDIT = {
  title: "An Illustrated Map of Chicago, 1931",
  makers: "Charles Turzak and Henry T. Chapman",
  publisher: "Houghton Mifflin, Boston",
  holder: "Norman B. Leventhal Map and Education Center, Boston Public Library",
};

export const MUSEUM = {
  name: "Chicago Maritime Museum",
  url: "https://www.chicagomaritimemuseum.org/",
  visitUrl: "https://www.chicagomaritimemuseum.org/plan-your-visit",
  logo: "/media/look-closer/cmm-logo.png",
  address: "1200 West 35th Street, Chicago",
  building: "River level of the Bridgeport Art Center, entered on the north side of the building from Racine Avenue",
  hours: "Tuesday to Sunday, 10 am to 4 pm. Closed Monday.",
  /** the mark's own inks */
  blue: "#0076B4",
  red: "#ED3E3A",
  ink: "#202020",
};

export const EXHIBIT = {
  /** the map's own name; "Look Closer" is the kiosk's headline, not a title */
  title: "An Illustrated Map of Chicago",
  /** one line under the title, on cards */
  line: "The 1931 illustrated map of Chicago on the Chicago Maritime Museum's wall, and the history behind its jokes.",
  partnership: "In partnership with the Chicago Maritime Museum",
  paragraphs: [
    "In 1931, Chicago was preparing for its second world's fair. Houghton Mifflin, a Boston publisher, created this bird's-eye map to promote the city to visitors. It presents Chicago as a lively place filled with beaches, ballparks, skyscrapers, and speedboats, viewed from over Lake Michigan.",
    "But a closer look shows that many of the map's jokes rely on racial stereotypes. Black Chicagoans are shown as a Pullman porter and a dancing figure with dice. The Near West Side is labeled \u201cThe Ghetto,\u201d and a stockyards worker is shown using a racial slur. Outside the city, a subdivision is described as \u201crestricted,\u201d referring to housing rules that kept Black families from buying homes in certain neighborhoods.",
    "The map reflects the racial divisions that shaped Chicago at the time. By 1930, about 234,000 Black residents lived in the city, many of whom had moved north during the Great Migration. Violence, discrimination in housing, and restrictive covenants pushed many Black families into a narrow area along State Street known as the \u201cBlack Belt.\u201d",
  ],
  howToRead: [
    "North is to the right. The artists drew Chicago from above Lake Michigan looking west, so the South Side is at left and the North Shore at right.",
    "The compass at top left reads \u2018I Will\u2019, the city's motto since 1892. The index along the bottom edge gives a grid reference for each point of interest.",
  ],
  tap: "Tap a numbered ring to read about that detail.",
};

/** The installation itself, photographed at the museum in September
 *  2026 by Rooted Forward: the map on the wall with the touch screen
 *  beside it. Cropped and lightened from the owner's photograph. */
export const EXHIBIT_PHOTO = {
  src: "/media/look-closer/exhibit-wall.jpg",
  small: "/media/look-closer/exhibit-wall-800.jpg",
  alt: "The 1931 map of Chicago mounted on a wall at the Chicago Maritime Museum, with a touch screen showing the interactive guide in front of it and two people standing beside it",
  caption: "The map and its touch screen on the museum's wall in Bridgeport, September 2026. Photograph by Rooted Forward.",
};

/** The home page's words for the exhibit, in the owner's wording
 *  (September 13, 2026). The app's plate uses the shorter line in
 *  LOOK_CLOSER_FEATURE instead. */
export const WEB_COPY = {
  lockup: "Rooted Forward & Chicago Maritime Museum",
  lede: "Rooted Forward and the Chicago Maritime Museum created this exhibit to explore the history behind a 1931 illustrated map of Chicago.",
  body: [
    "Published as Chicago prepared for its second world\u2019s fair, the map presents a lively city of beaches, ballparks, and skyscrapers. But its jokes and drawings also include racial caricatures and references to housing restrictions that excluded Black families from certain neighborhoods. Our interactive guide explains these details and the discrimination and segregation they reflect.",
    "Visit the museum in Bridgeport to see the map and explore it on the touchscreen beside it, or open the interactive map here on your phone.",
  ],
  explore: "Explore the map",
  visit: "Plan a visit",
};

/** What the site and the app put on their front doors while the map
 *  is on the museum's wall. Served in /api/walk as `featured`. */
export const LOOK_CLOSER_FEATURE = {
  id: "look-closer",
  title: EXHIBIT.title,
  /** the caption under the title, the people who drew the map */
  byline: `${MAP_CREDIT.makers}, 1931`,
  /** the plate's one line, under a lockup that already names both
   *  partners; it has to say in person and here (owner's wording,
   *  September 13, 2026) */
  line: "Read more about the 1931 map, on display at the Chicago Maritime Museum or available to explore virtually here.",
  note: "Now on view",
  image: MAP_IMAGES.card,
  imageAlt: "An Illustrated Map of Chicago, 1931, by Charles Turzak and Henry T. Chapman, a bird's-eye view of the city from over Lake Michigan with north to the right",
  /** the kiosk itself, adapted for a phone */
  url: "https://rooted-forward.org/look-closer/map",
  partner: {
    name: MUSEUM.name,
    logo: MUSEUM.logo,
    url: MUSEUM.url,
    accent: MUSEUM.blue,
    visitUrl: MUSEUM.visitUrl,
    place: "1200 West 35th Street, Bridgeport, on the river level of the Bridgeport Art Center",
    hours: MUSEUM.hours,
  },
  /** the information sheet in the app: the owner's words for the
   *  exhibit, the kiosk's paragraph on the city behind it, and how to
   *  use the map */
  about: [WEB_COPY.lede, ...WEB_COPY.body, EXHIBIT.paragraphs[2], EXHIBIT.tap],
  credit: `${MAP_CREDIT.title}. ${MAP_CREDIT.makers}. ${MAP_CREDIT.publisher}. ${MAP_CREDIT.holder}.`,
};

export const MAP_DETAILS: MapDetail[] = [
  {
    number: 1,
    id: "pullman-porter",
    title: "The Pullman porter",
    thumb: "/media/look-closer/thumbs/c1.jpg",
    cx: 1612,
    cy: 1590,
    r: 210,
    paragraphs: [[{"t":"'Yes sah!'","b":true},{"t":" The map's one Black worker speaks in dialect and grins. The Pullman Company was the largest employer of Black men in the United States, and its porters were organizing. The Brotherhood of Sleeping Car Porters, led by A. Philip Randolph, won a contract in 1937, the first between a major U.S. company and a Black-led union."}],[{"t":"Before the contract, porters worked about 400 hours a month and depended on tips; passengers called every porter 'George', after George Pullman. Porters also carried the Chicago Defender south on their runs, spreading news of Chicago jobs through the South during the Great Migration."}]],
  },
  {
    number: 2,
    id: "bathers",
    title: "Bathers off Jackson Park",
    thumb: "/media/look-closer/thumbs/c2.jpg",
    cx: 1605,
    cy: 2455,
    r: 218,
    paragraphs: [[{"t":"Swimmers splash below 'Jackson Pk.'","b":true},{"t":" Chicago's beaches were public but not shared. In July 1919, white bathers stoned Eugene Williams, a Black seventeen-year-old who drifted toward the 29th Street beach, and he drowned. The week of violence that followed killed 38 people and left about 1,000 families, most of them Black, homeless."}],[{"t":"Afterwards the Chicago Commission on Race Relations, six Black and six white members, spent three years studying the causes. Its 1922 report, The Negro in Chicago, traced the violence to the housing shortage, job discrimination and police bias, and found that the city's beaches and parks were segregated by custom, not by law."}]],
  },
  {
    number: 3,
    id: "worlds-fair",
    title: "World's Fair of 1933",
    thumb: "/media/look-closer/thumbs/c3.jpg",
    cx: 2400,
    cy: 2520,
    r: 231,
    paragraphs: [[{"t":"'World's Fair of 1933'","b":true},{"t":" is what the map was selling. The Century of Progress Exposition opened on the lakefront in May 1933 and ran two summers. When the map was printed, the fairgrounds were still fresh landfill. Black Chicagoans reported being turned away from fair restaurants and hired for few of its jobs; the Chicago Defender protested."}],[{"t":"The fair stretched along the lake from 12th Street to 39th Street, on Northerly Island and on land newly filled for the purpose. When it closed in 1934 nearly all of its buildings were demolished. Northerly Island later became Meigs Field airport and is now a park."}]],
  },
  {
    number: 4,
    id: "negro-section",
    title: "The 'Negro section'",
    thumb: "/media/look-closer/thumbs/c4.jpg",
    cx: 3000,
    cy: 2085,
    r: 173,
    nudge: { x: -4, y: -6 },
    paragraphs: [[{"t":"The map's index lists a "},{"t":"'Negro section'","b":true},{"t":" here. What it draws is a dancing caricature and a pair of dice. In 1931 this was the center of the Black Belt, home to the Chicago Defender, Supreme Liberty Life Insurance, the Regal Theater and most of the city's 234,000 Black residents, who had begun calling the district Bronzeville. None of that is drawn."}],[{"t":"Rents in the Black Belt ran higher than in white districts, because families could not move anywhere else. On 3 August 1931, ten weeks before this map was copyrighted, police shot and killed three Black men at an eviction protest at 50th Street and Dearborn Street. Tens of thousands joined the funeral march, and the city halted evictions for a time."}]],
  },
  {
    number: 5,
    id: "olearys-cow",
    title: "O'Leary's cow",
    thumb: "/media/look-closer/thumbs/c5.jpg",
    cx: 3150,
    cy: 2300,
    r: 170,
    nudge: { x: 4, y: 12 },
    paragraphs: [[{"t":"'I started the Chicago fire Oct. 8, 1871 at O'Leary's.'","b":true},{"t":" The map repeats a story the city had told for sixty years: that Catherine O'Leary's cow kicked over a lantern in her barn at 137 DeKoven Street. The fire did begin beside the barn, but no cause was ever proved. O'Leary, an Irish immigrant who sold milk, was blamed in the newspapers for the rest of her life."}],[{"t":"The reporter Michael Ahern later admitted that he and two colleagues had invented the cow. The story stuck because it fitted what many Chicagoans already believed about poor Irish immigrants. In 1997 the Chicago City Council formally cleared Catherine O'Leary and her cow. The Chicago Fire Academy stands on the site today."}]],
  },
  {
    number: 6,
    id: "chinatown",
    title: "Chinatown",
    thumb: "/media/look-closer/thumbs/c6.jpg",
    cx: 3270,
    cy: 1915,
    r: 120,
    paragraphs: [[{"t":"The map's index lists "},{"t":"'Chinatown'","b":true},{"t":" here. What it draws is a file of identical figures with slanted eyes. Chicago's Chinatown had moved from Clark and Van Buren Streets to 22nd Street, now Cermak Road, and Wentworth Avenue around 1912. In 1930 about 2,700 Chinese people lived in Chicago. The Chinese Exclusion Act, in force from 1882 to 1943, kept the community small and mostly male."}],[{"t":"The On Leong Merchants Association built its headquarters at Cermak and Wentworth in 1928, with green-tiled pagoda roofs; it is now the Pui Tak Center. Exclusion law also barred Chinese immigrants from becoming citizens until 1943, so most of Chinatown's adults could not vote."}]],
  },
  {
    number: 7,
    id: "stock-yards",
    title: "The Stock Yards",
    thumb: "/media/look-closer/thumbs/c7.jpg",
    cx: 3365,
    cy: 1560,
    r: 195,
    paragraphs: [[{"t":"A packinghouse worker introduces himself with a slur: "},{"t":"'I'm a Polak, a pig stabber, a Chicagoan.'","b":true},{"t":" The Union Stock Yards employed tens of thousands of Polish, Lithuanian, Mexican and Black workers, who lived in the crowded blocks 'back of the yards'. In 1919, white mobs attacked Black workers walking to these gates."}],[{"t":"By 1930 about 20,000 Mexican immigrants lived in Chicago, many recruited for the packinghouses and steel mills after the First World War. During the Depression, relief officials pressed thousands of Mexican families to leave for Mexico. The Yards closed in 1971. Their old stone gate still stands at Exchange Avenue, less than a mile from this museum."}]],
  },
  {
    number: 8,
    id: "the-ghetto",
    title: "'The Ghetto'",
    thumb: "/media/look-closer/thumbs/c8.jpg",
    cx: 3540,
    cy: 1950,
    r: 173,
    paragraphs: [[{"t":"The map labels the Near West Side "},{"t":"'The Ghetto'","b":true},{"t":" and draws two bearded men beside it. This was the Maxwell Street market district, settled by Jewish families since the 1880s. By 1931 most had moved west to Lawndale as Black and Mexican families arrived. Expressways and a university campus cleared the area in the 1950s and 1960s."}],[{"t":"In 1931 'ghetto' meant a Jewish quarter. Within a generation the word was being used for the Black neighborhoods that covenants and public housing had walled in. The Maxwell Street market survived until 1994, when the University of Illinois expanded south. It now runs on Sundays on Desplaines Street, a few blocks east."}]],
  },
  {
    number: 9,
    id: "hull-house",
    title: "Hull House",
    thumb: "/media/look-closer/thumbs/c9.jpg",
    cx: 3855,
    cy: 1810,
    r: 150,
    paragraphs: [[{"t":"'Best known social settlement in the world.'","b":true},{"t":" Jane Addams and Ellen Gates Starr opened Hull-House on Halsted Street in 1889, among Italian, Greek, Jewish and, later, Mexican neighbors. It ran a nursery, clubs, classes and a gymnasium, and its residents pushed the city for playgrounds, garbage collection and the first juvenile court. In December 1931, as this map went on sale, Addams became the first American woman to receive the Nobel Peace Prize."}],[{"t":"Forty years before this map, Hull-House residents surveyed the same blocks house by house and published Hull-House Maps and Papers (1895), coloring each building by the nationality and wages of the people inside. Their maps were made to argue for better housing and pay. The city cleared the neighborhood for the University of Illinois campus in 1963; the original house is a museum."}]],
  },
  {
    number: 10,
    id: "little-italy",
    title: "Little Italy",
    thumb: "/media/look-closer/thumbs/c10.jpg",
    cx: 4450,
    cy: 2450,
    r: 165,
    paragraphs: [[{"t":"'I keeped da street clean en little Italy.'","b":true},{"t":" A street sweeper with a broom and a cart is the map's Italian Chicagoan. About 74,000 Italian-born people lived in Chicago in 1930; many men found their first work on street-cleaning and construction gangs. On the map, the Black porter, the Polish packinghouse worker and the Italian sweeper all speak in broken English. The sightseers and the salesman speak plainly."}],[{"t":"This part of the Near North Side, known as Little Sicily, was cleared in the 1940s for the Frances Cabrini Homes, one of Chicago's first public housing projects. Cabrini-Green grew around them and housed a mostly Black population until the last high-rise came down in 2011. The land is being redeveloped."}]],
  },
  {
    number: 11,
    id: "restricted",
    title: "'Restricted'",
    thumb: "/media/look-closer/thumbs/c11.jpg",
    cx: 6000,
    cy: 1590,
    r: 199,
    paragraphs: [[{"t":"'But is this a restricted neighboorhood [sic]?'","b":true},{"t":" a buyer asks. "}],[{"t":"'Oh! Very,'","b":true},{"t":" the salesman boasts. 'Restricted' meant a covenant: a deed clause forbidding sale or rental to Black families. The Chicago Real Estate Board circulated a model covenant in 1927, and property-owners' associations backed by the University of Chicago enforced them around Hyde Park and Kenwood. The Supreme Court ruled them unenforceable in 1948."}],[{"t":"The court ruling did not end segregation in housing. After 1948 the university and the city turned to 'urban renewal', clearing blocks of Hyde Park and Kenwood in the 1950s and 1960s and displacing thousands of mostly Black residents. Rooted Forward's self-guided walking tour follows this history through Hyde Park."}]],
  },
  {
    number: 12,
    id: "the-index",
    title: "The index",
    thumb: "/media/look-closer/thumbs/c12.jpg",
    cx: 2250,
    cy: 4325,
    r: 200,
    box: { w: 1100, h: 300 },
    paragraphs: [[{"t":"'Points of interest in Chicago.'","b":true},{"t":" The index along the bottom edge sorts the city into sights. Between Navy Pier and the Newberry Library it lists a 'Negro section'; two columns to the left are a 'Ghetto' and an 'Italian section'. Elsewhere in the index are a 'Bohemian section', 'Chinatown' and a 'Polish section'. Each has a grid reference, as a place for visitors to look at."}],[{"t":"Tourist maps of the 1920s and 1930s often listed immigrant quarters as attractions. The people who lived in them had little choice about where they lived: covenants, lending practices and violence decided that. Chicago's 'community areas', drawn up by University of Chicago sociologists around 1930, still shape how the city describes its neighborhoods today."}]],
  },
];
