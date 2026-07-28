/* ------------------------------------------------------------------ */
/*  The walking tours, and everything each one needs to draw itself.    */
/*                                                                      */
/*  Hyde Park was the only walk for a year, so its geometry, its map    */
/*  labels and its intro were module constants scattered across the     */
/*  player, the map component and the API route. Harlem made that       */
/*  impossible. A tour is now one bundle in this list, and the page      */
/*  routes, /api/walk, the sitemap and the iOS app all read from here.  */
/*                                                                      */
/*  To add a city: write <slug>-walk.ts, generate <slug>-geometry.json  */
/*  with scripts/walk-prep-map.mjs, write its map config below, and     */
/*  add one entry. Nothing else needs editing.                          */
/* ------------------------------------------------------------------ */

import type { WalkTour } from "./walk-types";
import type { WalkGeometry, WalkMapConfig } from "./walk-utils";
import { HYDE_PARK_WALK } from "./hyde-park-walk";
import { HARLEM_WALK } from "./harlem-walk";
import { HYDE_PARK_MAP } from "./hyde-park-map";
import { HARLEM_MAP } from "./harlem-map";
import { WALK_INTRO } from "@/components/tours/walk/WalkIntro";
import { HARLEM_INTRO } from "@/components/tours/walk/HarlemIntro";
import hydeParkGeometry from "./hyde-park-geometry.json";
import harlemGeometry from "./harlem-geometry.json";

export interface WalkIntroDoc {
  title: string;
  paragraphs: string[];
  byline: string;
}

/** the parts of a tour page that are not the tour itself. Everything
 *  else on /tours/<city>-walk is rendered from the tour data by the
 *  shared WalkTourPage, so the two cities cannot drift apart. */
export interface WalkPageConfig {
  metaTitle: string;
  metaDescription: string;
  /** the ground, in three or four words, set under the distance */
  terrain: string;
  /** a period document washed into the paper behind the title */
  wash: { src: string; alt: string };
  /** the closing block, when the city has other things to read or book */
  related?: {
    heading: string;
    body: string;
    links: {
      label: string;
      href: string;
      external?: boolean;
      primary?: boolean;
    }[];
  };
}

export interface WalkTourBundle {
  /** the key used by /api/walk?tour= and by the app */
  slug: string;
  /** the page this walk lives on */
  path: string;
  /** folder under /public/media holding this walk's plates and audio */
  mediaDir: string;
  tour: WalkTour;
  intro: WalkIntroDoc;
  geometry: WalkGeometry;
  map: WalkMapConfig;
  page: WalkPageConfig;
}

export const WALK_TOURS: WalkTourBundle[] = [
  {
    slug: "hyde-park",
    path: "/tours/hyde-park-walk",
    mediaDir: "/media/hyde-park-walk",
    tour: HYDE_PARK_WALK,
    intro: WALK_INTRO,
    geometry: hydeParkGeometry as WalkGeometry,
    map: HYDE_PARK_MAP,
    page: {
      metaTitle: "Hyde Park Walking Tour | Rooted Forward",
      metaDescription:
        "A free self-guided audio tour of Hyde Park, told in the order it happened, from Paul Cornell's stone through the fair and the university to Harper Court. Thirteen stops on how the neighborhood was built, who it was built for, and the paperwork that kept it that way.",
      terrain: "mostly flat",
      wash: {
        src: "/media/site/holc-chicago-1940.jpg",
        alt: "The 1940 Home Owners' Loan Corporation security map of Chicago",
      },
      related: {
        heading: "Prefer to stay in?",
        body: "Our online exhibit walks the same ground on one long page, built from the original deeds, appraisal forms, and maps. Our in-person Hyde Park tour is on Viator.",
        links: [
          {
            label: "Read the exhibit",
            href: "/tours/chicago/hyde-park",
            primary: true,
          },
          {
            label: "Book the in-person tour",
            href: "https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1",
            external: true,
          },
        ],
      },
    },
  },
  {
    slug: "harlem",
    path: "/tours/harlem-walk",
    mediaDir: "/media/harlem-walk",
    tour: HARLEM_WALK,
    intro: HARLEM_INTRO,
    geometry: harlemGeometry as WalkGeometry,
    map: HARLEM_MAP,
    page: {
      metaTitle: "Harlem Walking Tour | Rooted Forward",
      metaDescription:
        "A free self-guided audio tour of Harlem, told in the order it happened, from the Hotel Theresa north to 145th and Lenox. Sixteen stops on how Black New Yorkers reached these blocks through the open market, and what a century of covenants, appraisals and clearance took back out.",
      terrain: "flat until the climb to Sugar Hill",
      wash: {
        src: "/media/site/usgs-harlem-1900.jpg",
        alt: "The 1900 United States Geological Survey sheet for Harlem",
      },
      related: {
        heading: "The other walk",
        body: "Walk Hyde Park covers the same century on Chicago's South Side, stop for stop, from Paul Cornell's stone to Harper Court.",
        links: [
          {
            label: "Walk Hyde Park",
            href: "/tours/hyde-park-walk",
            primary: true,
          },
          { label: "Read the Chicago exhibit", href: "/tours/chicago/hyde-park" },
        ],
      },
    },
  },
];

/** The walk /api/walk serves when no tour is named. The iPhone build
 *  already with Apple asks for exactly that URL and knows nothing
 *  about a second city, so this must stay Hyde Park. */
export const DEFAULT_WALK_SLUG = "hyde-park";

export function getWalkTour(slug: string): WalkTourBundle | undefined {
  return WALK_TOURS.find((t) => t.slug === slug);
}
