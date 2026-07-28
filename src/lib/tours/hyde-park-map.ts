// ------------------------------------------------------------------
// How the Hyde Park map is dressed. These were constants inside
// WalkMap.tsx until Harlem arrived and the component had to stop
// knowing which city it was drawing. Values are unchanged, so the
// plate looks exactly as it did.
//
// Labels are anchored to survive the route-fitted viewBox clamp; keep
// every one inside roughly lng -87.608..-87.576, lat 41.802..41.784.
// ------------------------------------------------------------------
import type { WalkMapConfig } from "./walk-utils";

export const HYDE_PARK_MAP: WalkMapConfig = {
  // The USGS Jackson Park quadrangle, 1929 edition (public domain),
  // reprojected and cropped to exactly the geometry frame, flattened
  // onto cream as one ink.
  baseMapSrc: "/media/hyde-park-walk/map-base-1929.jpg",
  areaName: "Hyde Park",

  placeLabels: [
    { text: "Lake Michigan", lat: 41.797, lng: -87.5755, size: 13 },
    { text: "Hyde Park", lat: 41.7973, lng: -87.5975, size: 15 },
    { text: "Midway Plaisance", lat: 41.78635, lng: -87.6005, size: 11 },
    { text: "Jackson Park", lat: 41.7867, lng: -87.5805, size: 12 },
    { text: "Woodlawn", lat: 41.7828, lng: -87.5955, size: 11 },
    { text: "Washington Park", lat: 41.7943, lng: -87.6094, size: 10 },
    { text: "University of Chicago", lat: 41.79, lng: -87.5997, size: 9 },
    { text: "Nichols Park", lat: 41.7972, lng: -87.5943, size: 8 },
  ],

  streetLabels: [
    { text: "E Hyde Park Blvd", lat: 41.8026, lng: -87.5948, rotate: 0, size: 8 },
    { text: "E 53rd St", lat: 41.8001, lng: -87.591, rotate: 0, size: 9 },
    { text: "E 55th St", lat: 41.7957, lng: -87.5993, rotate: 0, size: 9 },
    { text: "E 57th St", lat: 41.7921, lng: -87.5911, rotate: 0, size: 9 },
    { text: "E 60th St", lat: 41.7846, lng: -87.599, rotate: 0, size: 8 },
    { text: "E 61st St", lat: 41.78415, lng: -87.6091, rotate: 0, size: 8 },
    { text: "E 63rd St", lat: 41.78055, lng: -87.5989, rotate: 0, size: 8 },
    { text: "Lake Park Ave", lat: 41.7967, lng: -87.58722, rotate: -87, size: 9 },
    { text: "Woodlawn Ave", lat: 41.7938, lng: -87.5968, rotate: -90, size: 9 },
    { text: "Ellis Ave", lat: 41.7958, lng: -87.6015, rotate: -90, size: 8 },
    { text: "University Ave", lat: 41.7942, lng: -87.5986, rotate: -90, size: 8 },
    { text: "Kimbark Ave", lat: 41.7987, lng: -87.5953, rotate: -90, size: 8 },
    { text: "Harper Ave", lat: 41.7972, lng: -87.5889, rotate: -90, size: 8 },
    { text: "Cottage Grove Ave", lat: 41.7935, lng: -87.6069, rotate: -90, size: 8 },
    { text: "Stony Island Ave", lat: 41.7852, lng: -87.5873, rotate: -90, size: 8 },
  ],

  // soft green ground for the parks; boundaries are streets, the lake
  // polygon paints over the eastern overhang
  parkAreas: [
    // Jackson Park: 56th down past the frame, Stony Island to the lake
    [
      [41.7936, -87.587],
      [41.7936, -87.566],
      [41.7737, -87.556],
      [41.7737, -87.587],
    ],
    // Midway Plaisance strip: 59th to 60th, lake side to Washington Park
    [
      [41.7872, -87.5868],
      [41.7872, -87.613],
      [41.7854, -87.613],
      [41.7854, -87.5868],
    ],
    // Washington Park: west of Cottage Grove
    [
      [41.8045, -87.6063],
      [41.8045, -87.618],
      [41.7815, -87.618],
      [41.7815, -87.6063],
    ],
    // Nichols Park: 53rd to 55th between Kimbark and Kenwood
    [
      [41.7994, -87.5948],
      [41.7994, -87.5935],
      [41.7953, -87.5935],
      [41.7953, -87.5948],
    ],
    // Harold Washington Park: 51st to 53rd east of Hyde Park Blvd
    [
      [41.8032, -87.5827],
      [41.8032, -87.579],
      [41.7994, -87.579],
      [41.7994, -87.5827],
    ],
  ],

  // the university's main quadrangles, tinted the way printed maps
  // mark institutions, warm and slightly apart from the parks' green
  campusAreas: [
    [
      [41.7921, -87.6014],
      [41.7921, -87.5977],
      [41.7885, -87.5977],
      [41.7885, -87.6014],
    ],
  ],

  detourLegend:
    "Green detours run southwest to the Hansberry house and Daley’s, northwest to Drexel Boulevard",

  // below unless a neighbor would collide with the label
  stopLabelSide: {
    "cornells-stone": "left",
    "lake-park-tracks": "right",
    "harper-court": "left",
    "obama-center": "right",
  },
};
