import type { ImmersiveTour } from "./types";
import { HYDE_PARK_TOUR } from "./tours/hyde-park";

/* ------------------------------------------------------------------ */
/*  Placeholder immersive tours.                                       */
/*                                                                     */
/*  Production reads from the immersive_tours table first and falls    */
/*  back to this array by (city, slug). Keep both sides in sync, the   */
/*  same way PLACEHOLDER_RESEARCH_ENTRIES mirrors its SQL seed.        */
/*                                                                     */
/*  Copy rules: every factual statement here is documented history.    */
/*  The 360 scenes ship as labeled synthetic test captures until real  */
/*  underwater footage is uploaded through the admin dashboard. Do     */
/*  not swap in unlabeled media or invent facts, quotes, or numbers.   */
/* ------------------------------------------------------------------ */

const TEST_NOTE =
  "Test capture. A labeled synthetic panorama stands in until real footage is uploaded.";

export const PLACEHOLDER_IMMERSIVE_TOURS: ImmersiveTour[] = [
  HYDE_PARK_TOUR,
  {
    city: "chicago",
    slug: "beneath-the-water-line",
    title: "Beneath the Water Line",
    dek: "An underwater route through the Chicago River and the lakefront. The same policy history the walking tours trace on the street is written into the water, in reversed currents, buried tunnels, industrial sediment, and a shipwreck you can see from the shore.",
    medium: "underwater",
    heroNote:
      "The look-around scenes on this tour are labeled test captures while real underwater footage is gathered.",
    published: true,
    stops: [
      {
        id: "main-stem-reversal",
        title: "The River That Flows Backward",
        kicker: "Main Stem / Michigan Avenue",
        depthLabel: "Surface to 20 ft",
        lat: 41.8887,
        lng: -87.6233,
        body:
          "In 1900 the Sanitary District of Chicago finished the canal that reversed the Chicago River, pulling it away from Lake Michigan and sending it toward the Mississippi watershed instead. The point was blunt. The city drank from the lake and dumped its waste into the river, and the river carried that waste to the drinking water intakes. Rather than stop polluting the river, Chicago re-engineered which way it ran. Under the Michigan Avenue bridge the current still obeys that decision. Every drop moving past the bridge piers is evidence of how far the city would go to protect some neighborhoods from what it was willing to leave in the water near others.",
        facts: [
          "Reversed in 1900 by the Sanitary District of Chicago",
          "The canal sent the river toward the Mississippi watershed",
          "Built to keep sewage away from the lake drinking water intakes",
        ],
        sources: [
          "Encyclopedia of Chicago, Chicago River entry",
          "Metropolitan Water Reclamation District of Greater Chicago, district history",
          "Libby Hill, The Chicago River, a Natural and Unnatural History, 2000",
        ],
        media: {
          kind: "video360",
          src: "/media/360/test-pano.mp4",
          poster: "/media/360/test-pano-poster.jpg",
          initialYawDeg: 0,
          note: TEST_NOTE,
        },
      },
      {
        id: "bubbly-creek",
        title: "Bubbly Creek Still Bubbles",
        kicker: "South Fork / Back of the Yards",
        depthLabel: "0 to 12 ft",
        lat: 41.8398,
        lng: -87.6566,
        body:
          "The South Fork of the South Branch served for decades as the open drain of the Union Stock Yards. So much packinghouse waste settled into the channel that gases from the decomposing sediment rose to the surface in a constant simmer, which is how the creek got its name. Upton Sinclair described it in The Jungle in 1906. The yards closed in 1971. The bubbles did not. The creek bed still holds a thick organic layer from the stockyard era, and federal and local agencies have studied dredging and restoration for years. It is the clearest place in the city to see how industrial harm outlives the industry, and whose neighborhoods were asked to absorb it.",
        facts: [
          "Named for gases rising from stockyard waste in the sediment",
          "Described by Upton Sinclair in The Jungle, 1906",
          "Subject of U.S. Army Corps of Engineers restoration studies",
        ],
        sources: [
          "Upton Sinclair, The Jungle, 1906",
          "U.S. Army Corps of Engineers, Bubbly Creek ecosystem restoration study",
          "Encyclopedia of Chicago, Bubbly Creek entry",
        ],
        media: null,
      },
      {
        id: "water-cribs",
        title: "The Cribs Miles Offshore",
        kicker: "Lake Michigan / Drinking water intakes",
        depthLabel: "30 to 35 ft",
        lat: 41.7825,
        lng: -87.5302,
        body:
          "The round structures on the horizon off the lakefront are intake cribs, the mouths of the city's drinking water system. Engineer Ellis Chesbrough sent the first tunnel two miles out under the lakebed in the 1860s because the water at the shoreline was already fouled. Later tunnels were dug by hand under the lake, dangerous work that killed dozens of laborers, including in a fire at a crib construction site in 1909. The water that reaches every tap in Chicago and many suburbs still enters here, far enough from shore to stay ahead of what the city put in the water closer in.",
        facts: [
          "Intake cribs sit miles offshore over tunnels under the lakebed",
          "The first two mile lake tunnel opened in 1867",
          "A 1909 fire at a crib construction site killed dozens of workers",
        ],
        sources: [
          "Encyclopedia of Chicago, Water Supply entry",
          "Chicago Department of Water Management, system history",
          "Chicago Tribune archive coverage of the 1909 crib fire",
        ],
        media: {
          kind: "photo360",
          src: "/media/360/test-pano.jpg",
          poster: "/media/360/test-pano-poster.jpg",
          initialYawDeg: 90,
          note: TEST_NOTE,
        },
      },
      {
        id: "morgan-shoal-silver-spray",
        title: "A Shipwreck in Sight of Hyde Park",
        kicker: "Morgan Shoal / 49th Street",
        depthLabel: "5 to 25 ft",
        lat: 41.8047,
        lng: -87.5722,
        body:
          "Morgan Shoal is a limestone reef lying just off the shoreline between roughly 45th and 51st Streets, one of the few places where the lake bottom rises close enough to the surface to be dangerous. In 1914 the steamer Silver Spray grounded on the shoal, and on calm days its boiler still breaks the surface within sight of the same Hyde Park blocks the walking tour covers. The shoal also shaped the shore itself. This stretch resisted the landfill expansion that manufactured most of Chicago's lakefront, which is why the revetment here looks rougher and older than the parkland north of it.",
        facts: [
          "A limestone reef close offshore between about 45th and 51st Streets",
          "The steamer Silver Spray grounded on the shoal in 1914",
          "The wreck's boiler is still visible above calm water",
        ],
        sources: [
          "Chicago Park District, Morgan Shoal framework planning documents",
          "Chicago Tribune archive coverage of the Silver Spray grounding, 1914",
          "Hyde Park Historical Society accounts",
        ],
        media: {
          kind: "video360",
          src: "/media/360/test-pano.mp4",
          poster: "/media/360/test-pano-poster.jpg",
          initialYawDeg: 270,
          note: TEST_NOTE,
        },
      },
      {
        id: "deep-tunnel",
        title: "The Tunnel Hundreds of Feet Down",
        kicker: "Deep Tunnel / South Branch",
        depthLabel: "150 to 300 ft below grade",
        lat: 41.829,
        lng: -87.647,
        body:
          "Reversing the river did not finish the job. In heavy storms the combined sewers still overflowed into the river and sometimes back into the lake and into basements, and the flooding fell hardest on low lying working class neighborhoods. The answer, begun in the 1970s and still under construction, is the Tunnel and Reservoir Plan, better known as the Deep Tunnel. More than 100 miles of tunnels bored through bedrock far beneath the river system catch the overflow and hold it for treatment in reservoirs like McCook. It is one of the largest public works projects in the country, and almost nobody who lives above it has ever seen it.",
        facts: [
          "Construction began in the 1970s and continues today",
          "More than 100 miles of tunnels bored through bedrock",
          "Storm overflow is held in reservoirs like McCook for treatment",
        ],
        sources: [
          "Metropolitan Water Reclamation District, Tunnel and Reservoir Plan",
          "U.S. EPA materials on combined sewer overflows",
          "Encyclopedia of Chicago, Flood Control and Drainage entry",
        ],
        media: null,
      },
    ],
  },
];

export function findPlaceholderImmersiveTour(
  city: string,
  slug: string
): ImmersiveTour | null {
  return (
    PLACEHOLDER_IMMERSIVE_TOURS.find(
      (t) => t.city === city && t.slug === slug && t.published
    ) ?? null
  );
}
