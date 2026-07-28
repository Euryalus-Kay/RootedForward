/* ------------------------------------------------------------------ */
/*  The list of tours, for the /tours page.                            */
/*                                                                     */
/*  One entry per finished route. Add an entry and it appears on the   */
/*  page. Nothing else needs editing.                                  */
/*                                                                     */
/*  Real work only. A route belongs on this list when the research is  */
/*  finished and the tour is in the app, not while it is being         */
/*  written. Cities being researched are named in the "next" note on   */
/*  the page instead, without a route attached.                        */
/* ------------------------------------------------------------------ */

export interface TourListing {
  slug: string;
  title: string;
  city: string;
  neighborhood: string;
  /** the in-browser player, which the App Store listing promises is free */
  path: string;
  /** whether the tours page offers the browser player beside the app
   *  button. Off for a walk we would rather people took on a phone. */
  offerBrowser?: boolean;
  /** One sentence, plain. What the walk is about. */
  blurb: string;
  /** Facts strip. Keep these matched to src/lib/tours/*-walk.ts. */
  facts: { label: string; value: string }[];
  image: { src: string; alt: string; credit: string };
}

export const TOUR_CATALOG: TourListing[] = [
  {
    slug: "hyde-park",
    title: "Walk Hyde Park",
    city: "Chicago",
    neighborhood: "Hyde Park",
    path: "/tours/hyde-park-walk",
    offerBrowser: true,
    blurb:
      "The tour goes through the Chicago neighborhood of Hyde Park, stopping at sites that reflect its deep racial history and the inequality that still shapes the neighborhood today. It starts at Paul Cornell's stone by 53rd Street and ends at Harper Court.",
    facts: [
      { label: "Stops", value: "13, plus 3 detours" },
      { label: "On foot", value: "About 4 miles" },
      { label: "Audio", value: "About 70 minutes" },
      { label: "Price", value: "Free" },
    ],
    image: {
      src: "/media/site/hyde-park-aerial-1928.jpg",
      alt: "Aerial photograph of Hyde Park and the lakefront taken by the Chicago Aerial Survey Company in 1928",
      credit:
        "Hyde Park and the lakefront from the air, 1928. Chicago Aerial Survey Co. Public domain.",
    },
  },
  {
    slug: "harlem",
    title: "Walk Harlem",
    city: "New York",
    neighborhood: "Central Harlem",
    path: "/tours/harlem-walk",
    blurb:
      "The tour goes through Central Harlem, stopping at the blocks where Black New Yorkers bought and leased property and at the buildings where a century of covenants, appraisals, and clearance plans took the value back out. It starts at the Hotel Theresa on 125th Street and ends at 145th Street and Lenox Avenue.",
    facts: [
      { label: "Stops", value: "16, plus 1 detour" },
      { label: "On foot", value: "About 5 miles" },
      { label: "Audio", value: "About 90 minutes" },
      { label: "Price", value: "Free" },
    ],
    image: {
      src: "/media/harlem-walk/hotel-theresa-1913.jpg",
      alt: "A large pale hotel filling a street corner in 1913, seen from across a wide roadway, its upper storeys ringed with arched windows and its roofline breaking into tall ornate gables",
      credit:
        "The Hotel Theresa in 1913, the year it opened and the first stop on the walk. Published in Architecture and Building, November 1913, via Wikimedia Commons. Public domain.",
    },
  },
];
