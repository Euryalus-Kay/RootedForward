// ------------------------------------------------------------------
// Initiatives. The exhibits and programs on /initiatives, and the
// photographs the home page borrows from them.
//
// Every photograph here is the organization's own (sent by the owner,
// October 18, 2026) except the Glessner House view, which is a 1963
// Historic American Buildings Survey photograph in the Library of
// Congress and public domain as federal work. The web copies in
// public/media/initiatives were re-encoded without EXIF, so no phone
// location data ships with them.
//
// The partner marks in public/media/partners are each organization's
// own, taken from their websites on October 18, 2026, and shown at the
// owner's request to name the partnerships.
//
// Captions say what is pictured and nothing more (owner's print rule,
// kept here). No dates or places go on this page that did not happen.
// Community Voices has no past-event list yet for that reason; add a
// real event to COMMUNITY_VOICES_EVENTS and its card appears.
// ------------------------------------------------------------------

import { EXHIBIT, EXHIBIT_PHOTO, MUSEUM } from "@/lib/look-closer";

export interface Photo {
  src: string;
  /** a smaller copy for srcset, about half the width of src */
  small?: string;
  alt: string;
  /** CSS object-position, for photos cropped into a collage cell */
  focus?: string;
}

export interface InitiativeLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface Partner {
  name: string;
  logo: string;
  url: string;
  /** rendered height of the mark in its tile, so the three read as one weight */
  logoClass: string;
  /** the same, for the smaller tiles in the home page band */
  bandClass: string;
}

/** A collage cell is a photograph or a partner's mark on its own tile. */
export type CollageCell = Photo | { logo: string; alt: string; background: string };

export interface Initiative {
  id: string;
  title: string;
  /** who it is with, or where it is shown */
  partner: string;
  /** a short status line, set like the date line on a wall label */
  status: string;
  body: string[];
  /** "museum" is a tall photo with two squares beside it, "stack" is a
   *  large photo over a wide strip and a small photo */
  layout: "museum" | "stack";
  cells: CollageCell[];
  links: InitiativeLink[];
}

const DIR = "/media/initiatives";

/* ---- Partners --------------------------------------------------- */

export const PARTNERS: Partner[] = [
  {
    name: MUSEUM.name,
    logo: "/media/partners/chicago-maritime-museum.png",
    url: MUSEUM.url,
    logoClass: "h-14 sm:h-20",
    bandClass: "h-14",
  },
  {
    name: "Japanese American Service Committee",
    logo: "/media/partners/jasc.png",
    url: "https://jasc-chicago.org/",
    logoClass: "h-7 sm:h-11",
    bandClass: "h-8",
  },
  {
    name: "Glessner House",
    logo: "/media/partners/glessner-house.png",
    url: "https://www.glessnerhouse.org/",
    logoClass: "h-11 sm:h-[4.25rem]",
    bandClass: "h-12",
  },
];

/* ---- Photographs ------------------------------------------------ */

export const PHOTOS = {
  mapWall: {
    src: EXHIBIT_PHOTO.src,
    small: EXHIBIT_PHOTO.small,
    alt: EXHIBIT_PHOTO.alt,
    focus: "50% 30%",
  },
  maritimePodium: {
    src: `${DIR}/maritime-podium.jpg`,
    small: `${DIR}/maritime-podium-800.jpg`,
    alt: "Zain Zaidi of Rooted Forward speaking at a Chicago Maritime Museum podium, gesturing toward a projected slide",
    focus: "60% 40%",
  },
  maritimeVisitors: {
    src: `${DIR}/maritime-visitors.jpg`,
    small: `${DIR}/maritime-visitors-700.jpg`,
    alt: "Zain Zaidi of Rooted Forward with three visitors in front of the 1931 map at the Chicago Maritime Museum, one of them reading the touch screen",
    focus: "50% 40%",
  },
  jascWithPanels: {
    src: `${DIR}/jasc-with-panels.jpg`,
    small: `${DIR}/jasc-with-panels-900.jpg`,
    alt: "Zain Zaidi of Rooted Forward and a man in a gray vest smiling beside the Japanese Americans in Hyde Park panels at the Japanese American Service Committee in Chicago",
    focus: "58% 40%",
  },
  jascCrowd: {
    src: `${DIR}/jasc-crowd.jpg`,
    small: `${DIR}/jasc-crowd-800.jpg`,
    alt: "A full room of people seated in armchairs at the Japanese American Service Committee in Chicago, with a Japanese American Citizens League Chicago Chapter banner at the left",
    focus: "50% 60%",
  },
  jascWithHost: {
    src: `${DIR}/jasc-with-host.jpg`,
    small: `${DIR}/jasc-with-host-500.jpg`,
    alt: "Zain Zaidi of Rooted Forward with a woman in a red Open House Chicago shirt at the Japanese American Service Committee",
    focus: "50% 40%",
  },
  jascGroup: {
    src: `${DIR}/jasc-group.jpg`,
    small: `${DIR}/jasc-group-800.jpg`,
    alt: "Visitors talking in front of the Japanese Americans in Hyde Park panels, with Zain Zaidi of Rooted Forward listening at the right",
    focus: "50% 50%",
  },
  /* A 3:2 cut of the poster from its map to its foot, made for the
     card, since no object-position on the whole 2:3 sheet clears both
     the text above and the code below. */
  outreachPoster: {
    src: `${DIR}/outreach-poster-card.jpg`,
    small: `${DIR}/outreach-poster-card-855.jpg`,
    alt: "Detail of the Rooted Forward outreach poster, a redlining map of Chicago above a code to scan and the site address",
    focus: "50% 50%",
  },
  glessner: {
    src: `${DIR}/glessner-1963.jpg`,
    small: `${DIR}/glessner-1963-800.jpg`,
    alt: "Glessner House, a long granite house with a steep roof and a round arched entry, seen from the street corner in 1963 with two parked cars",
    focus: "50% 55%",
  },
} satisfies Record<string, Photo>;

export const GLESSNER_CREDIT =
  "Glessner House from the northwest. Photograph by Cervin Robinson, 1963. Historic American Buildings Survey, Library of Congress. Public domain.";

/* ---- The feature initiatives, each with a collage -------------- */

export const FEATURED: Initiative[] = [
  {
    id: "maritime",
    title: EXHIBIT.title,
    partner: `With the ${MUSEUM.name}`,
    status: "On view now",
    body: [
      "The 1931 map hangs on the museum’s wall in Bridgeport, with our touchscreen guide beside it. The guide explains the racial caricatures in the map’s drawings and the housing restrictions behind its jokes.",
      "We are planning a full exhibit with the museum for January 2027.",
    ],
    layout: "museum",
    /* The founder beside the touch screen is the tall cell (the spare
       bench at its right is what crops away), the founder at the
       museum's podium runs across the top right, and the visitors and
       the seal share the row under it. */
    cells: [
      { ...PHOTOS.mapWall, focus: "12% 50%" },
      PHOTOS.maritimePodium,
      { ...PHOTOS.maritimeVisitors, focus: "42% 40%" },
      { logo: "/media/partners/chicago-maritime-museum.png", alt: MUSEUM.name, background: MUSEUM.blue },
    ],
    links: [
      { label: "Explore the map", href: "/look-closer/map" },
      { label: "Read about the map", href: "/look-closer" },
    ],
  },
  {
    id: "japanese-americans-in-hyde-park",
    title: "Japanese Americans in Hyde Park",
    partner: "At the Japanese American Service Committee",
    status: "Ongoing exhibit",
    body: [
      "We created an exhibit on the Japanese Americans who lived and worked in Hyde Park, tracing the neighborhood's history from the 1800s through the mid-twentieth century.",
    ],
    layout: "stack",
    /* Bottom-anchored, so the two men keep their feet in frame. */
    cells: [{ ...PHOTOS.jascWithPanels, focus: "58% 100%" }, PHOTOS.jascCrowd, PHOTOS.jascWithHost],
    links: [{ label: "JASC", href: "https://jasc-chicago.org/", external: true }],
  },
];

/* ---- Community Voices ------------------------------------------- */

export interface CommunityVoicesEvent {
  /** e.g. "Community Voices 3" */
  name: string;
  /** ISO date, e.g. "2026-09-12" */
  date: string;
  /** where it happened, as people know the place */
  place: string;
  /** optional photo of the table or the flyer */
  photo?: Photo;
}

/** Real events only. Empty until the owner sends dates and places. */
export const COMMUNITY_VOICES_EVENTS: CommunityVoicesEvent[] = [];
