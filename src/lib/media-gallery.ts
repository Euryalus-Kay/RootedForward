// ------------------------------------------------------------------
// Photographs for /media (a selection) and /media/all (every one), both
// unlisted at the owner's request (October 18, 2026). Nothing on the
// site links to either page, and neither is in the sitemap.
//
// Files live in public/media/gallery: <slug>-800.jpg for grids,
// <slug>.jpg for display, and full/rooted-forward-<slug>.jpg (up to
// 2400px, no EXIF, so no phone location data) for download, plus a zip
// of the full set. All are the organization's own photographs.
//
// Captions say exactly what is pictured. Names and titles were checked
// on October 18, 2026: Hamilton Chang is JASC's Chief Executive Officer
// (jasc-chicago.org/new-leadership-2026), Madeline Crispell is the
// Chicago Maritime Museum's curator, and Ayako Yoshimura is the
// Japanese Studies Librarian at the University of Chicago Library. The
// JASC photographs were taken on October 17, 2026; the museum ones
// carry no date, so their captions give none.
// ------------------------------------------------------------------

export interface GalleryPhoto {
  slug: string;
  caption: string;
  alt: string;
  /** display size, for layout */
  w: number;
  h: number;
  /** the download's size in KB */
  kb: number;
  place: "maritime" | "jasc";
  /** object-position for the square thumbnail on /media/all */
  focus?: string;
}

const DIR = "/media/gallery";

export const galleryPaths = (slug: string) => ({
  thumb: `${DIR}/${slug}-800.jpg`,
  display: `${DIR}/${slug}.jpg`,
  full: `${DIR}/full/rooted-forward-${slug}.jpg`,
});

export const GALLERY_ZIP = { href: `${DIR}/rooted-forward-photographs.zip`, mb: 10.3 };

/** Each section's line, with the work's title set apart so the page
 *  can show it in roman inside the italic line. */
export const PLACES = {
  maritime: { name: "Chicago Maritime Museum", pre: "Our touchscreen guide to ", work: "An Illustrated Map of Chicago", post: ", 1931." },
  jasc: { name: "Japanese American Service Committee", pre: "Our exhibit ", work: "Japanese Americans in Hyde Park", post: ", photographed October 17, 2026." },
} as const;

export const GALLERY: GalleryPhoto[] = [
  {
    slug: "cmm-podium",
    caption: "Zain Zaidi, founder of Rooted Forward, speaking at the Chicago Maritime Museum.",
    alt: "Zain Zaidi in a Rooted Forward shirt at a Chicago Maritime Museum podium, gesturing toward a projected slide",
    w: 1453, h: 1082, kb: 133, place: "maritime",
  },
  {
    slug: "cmm-curator",
    caption: "Zain Zaidi with Madeline Crispell, curator of the Chicago Maritime Museum, beside the 1931 map and our touchscreen guide.",
    alt: "Madeline Crispell and Zain Zaidi standing on either side of a touch screen in front of the 1931 illustrated map of Chicago",
    w: 1200, h: 1499, kb: 469, place: "maritime",
  },
  {
    slug: "cmm-map-visitors",
    caption: "Zain Zaidi with visitors at the 1931 map and our touchscreen guide.",
    alt: "Zain Zaidi, seen from behind, talking with a woman in glasses at the 1931 map of Chicago while two visitors look at the map and its touch screen",
    w: 1256, h: 1600, kb: 459, place: "maritime",
  },
  {
    slug: "cmm-gallery-zain",
    caption: "Zain Zaidi in the galleries of the Chicago Maritime Museum.",
    alt: "Zain Zaidi in a green Rooted Forward shirt standing in a museum gallery of display cases under a wood ceiling",
    w: 1200, h: 1600, kb: 432, place: "maritime",
  },
  {
    slug: "cmm-ship-case",
    caption: "Visitors around the glass case of a model sailing ship in the Chicago Maritime Museum.",
    alt: "A group looking at a model sailing ship in a long glass case",
    w: 1200, h: 1600, kb: 426, place: "maritime",
  },
  {
    slug: "cmm-ship-model",
    caption: "A model sailing ship in its glass case, with visitors on the far side.",
    alt: "A model ship in a glass case with visitors behind it and reflected in the glass",
    w: 1200, h: 1600, kb: 419, place: "maritime",
  },
  {
    slug: "cmm-display-1",
    caption: "A visitor reading a display label in the Chicago Maritime Museum.",
    alt: "Visitors in coats leaning over a museum display case to read its label",
    w: 1200, h: 1600, kb: 352, place: "maritime",
  },
  {
    slug: "cmm-display-2",
    caption: "Three visitors reading a label stand in the Chicago Maritime Museum.",
    alt: "Three visitors standing at a museum display, one of them reading a label",
    w: 1200, h: 1600, kb: 430, place: "maritime",
  },
  {
    slug: "cmm-gallery-visitors",
    caption: "Visitors in the galleries of the Chicago Maritime Museum.",
    alt: "Two visitors beside a tall glass case holding a ship model",
    w: 1200, h: 1600, kb: 369, place: "maritime",
  },
  {
    slug: "cmm-gallery-walk",
    caption: "Visitors walking through the Chicago Maritime Museum.",
    alt: "A group walking between display cases of ship models under a wood ceiling",
    w: 1200, h: 1600, kb: 394, place: "maritime",
  },
  {
    slug: "jasc-hamilton-chang",
    caption: "Zain Zaidi with Hamilton Chang, Chief Executive Officer of the Japanese American Service Committee, beside our panels.",
    alt: "Zain Zaidi and Hamilton Chang smiling beside the Japanese Americans in Hyde Park panels",
    w: 1600, h: 1200, kb: 707, place: "jasc", focus: "25% 50%",
  },
  {
    slug: "jasc-ayako-yoshimura",
    caption: "Zain Zaidi with Ayako Yoshimura, Japanese Studies Librarian at the University of Chicago Library.",
    alt: "Ayako Yoshimura in a red shirt and Zain Zaidi in a Rooted Forward shirt standing together at the Japanese American Service Committee",
    w: 1600, h: 1200, kb: 544, place: "jasc",
  },
  {
    slug: "jasc-audience",
    caption: "A full room at the Japanese American Service Committee.",
    alt: "Rows of people seated in armchairs facing the front of a large room, with a Japanese American Citizens League banner at the left",
    w: 1448, h: 1086, kb: 304, place: "jasc",
  },
  {
    slug: "jasc-visitors",
    caption: "Visitors at our panels, with Zain Zaidi at right.",
    alt: "Four men standing near our two panels and the Rooted Forward poster, one of them reading, with Zain Zaidi listening at the right",
    w: 1600, h: 1200, kb: 728, place: "jasc", focus: "85% 50%",
  },
  {
    slug: "jasc-panels-1",
    caption: "Our two panels and the Rooted Forward poster by the window at the Japanese American Service Committee.",
    alt: "The Rooted Forward poster and the panels How Hyde Park was built and A Japantown at 43rd and Ellis on metal stands by a window",
    w: 1200, h: 1600, kb: 934, place: "jasc",
  },
  {
    slug: "jasc-chang-japantown",
    caption: "Hamilton Chang and Zain Zaidi at our panel on the Japantown at 43rd and Ellis.",
    alt: "Hamilton Chang with his arm out toward Zain Zaidi, who is looking at the panel A Japantown at 43rd and Ellis",
    w: 1600, h: 1200, kb: 730, place: "jasc", focus: "35% 50%",
  },
  {
    slug: "jasc-yoshimura-room",
    caption: "Ayako Yoshimura and Zain Zaidi, with the room filling behind them.",
    alt: "Ayako Yoshimura and Zain Zaidi standing by a wall of display shelves, with people taking seats in the room behind them",
    w: 1600, h: 1200, kb: 600, place: "jasc",
  },
  {
    slug: "jasc-panels-2",
    caption: "Our two panels and the Rooted Forward poster, seen from closer.",
    alt: "The Rooted Forward poster and the two panels on metal stands beside a window and a railing, seen from closer",
    w: 1200, h: 1600, kb: 814, place: "jasc",
  },
  {
    slug: "jasc-panels-3",
    caption: "Our two panels and the Rooted Forward poster, seen from across the room.",
    alt: "The Rooted Forward poster and the two panels on metal stands, seen from farther back, with a framed W flag and a jersey on the wall",
    w: 1200, h: 1600, kb: 772, place: "jasc",
  },
];

/** The selection on /media, row by row. Photos in a row share one
 *  height and keep their own shape, so nothing is cropped. */
export const CURATED: Record<GalleryPhoto["place"], string[][]> = {
  maritime: [["cmm-podium", "cmm-curator", "cmm-map-visitors"]],
  jasc: [
    ["jasc-hamilton-chang", "jasc-ayako-yoshimura"],
    ["jasc-audience", "jasc-visitors"],
  ],
};

export const photoBySlug = (slug: string): GalleryPhoto => {
  const p = GALLERY.find((x) => x.slug === slug);
  if (!p) throw new Error(`No gallery photo ${slug}`);
  return p;
};
