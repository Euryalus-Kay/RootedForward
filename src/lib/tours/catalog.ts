/* ------------------------------------------------------------------ */
/*  The list of tours, for the /tours page.                            */
/*                                                                     */
/*  One entry per finished route. Right now that is Hyde Park. When a  */
/*  new neighborhood is done, add an entry here and it appears on the  */
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
];
