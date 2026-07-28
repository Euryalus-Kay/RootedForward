// ------------------------------------------------------------------
// How the Harlem map is dressed. Same shape as hyde-park-map.ts.
//
// Manhattan's grid is rotated about twenty-nine degrees east of
// north, so street names are set at +29 across the numbered streets
// and -61 along the avenues, measured off the projected frame. Park
// outlines are OpenStreetMap ways, simplified; the Columbia campus
// is tinted the way the university quadrangles are in Hyde Park,
// because the detour stop is about what a university did to the
// ground below it.
//
// Labels are anchored to survive the route-fitted viewBox clamp;
// keep every one inside roughly lng -73.962..-73.932,
// lat 40.8304..40.8039.
// ------------------------------------------------------------------
import type { WalkMapConfig } from "./walk-utils";

export const HARLEM_MAP: WalkMapConfig = {
  // The USGS Central Park quadrangle, 1947 edition (public domain),
  // resampled onto the tour frame and flattened onto cream as one
  // ink. It still shows the Polo Grounds and the Savoy's block.
  baseMapSrc: "/media/harlem-walk/map-base-1947.jpg",
  areaName: "Harlem",

  placeLabels: [
    { text: "Harlem River", lat: 40.8265, lng: -73.9323, size: 12 },
    { text: "Hudson River", lat: 40.8195, lng: -73.9615, size: 12 },
    { text: "Harlem", lat: 40.8164, lng: -73.9462, size: 17 },
    { text: "Sugar Hill", lat: 40.8273, lng: -73.9433, size: 11 },
    { text: "Morningside Heights", lat: 40.8079, lng: -73.9615, size: 9 },
    { text: "Morningside Park", lat: 40.806, lng: -73.958, size: 8 },
    { text: "Marcus Garvey Park", lat: 40.8045, lng: -73.9438, size: 8 },
    { text: "St. Nicholas Park", lat: 40.817, lng: -73.949, size: 8 },
    { text: "Jackie Robinson Park", lat: 40.8264, lng: -73.9412, size: 8 },
    { text: "Columbia University", lat: 40.808, lng: -73.9625, size: 8 },
    { text: "The Bronx", lat: 40.8325, lng: -73.927, size: 11 },
  ],

  streetLabels: [
    { text: "W 125th St", lat: 40.8084, lng: -73.9464, rotate: 29, size: 9 },
    { text: "W 135th St", lat: 40.8144, lng: -73.9421, rotate: 29, size: 9 },
    { text: "W 145th St", lat: 40.8209, lng: -73.9378, rotate: 29, size: 9 },
    { text: "W 155th St", lat: 40.8301, lng: -73.9389, rotate: 29, size: 8 },
    { text: "W 116th St", lat: 40.8039, lng: -73.9494, rotate: 29, size: 8 },
    { text: "Lenox Ave", lat: 40.8113, lng: -73.9442, rotate: -61, size: 9 },
    { text: "Adam Clayton Powell Jr Blvd", lat: 40.8133, lng: -73.9464, rotate: -61, size: 8 },
    { text: "Frederick Douglass Blvd", lat: 40.814, lng: -73.9506, rotate: -61, size: 8 },
    { text: "Fifth Ave", lat: 40.8096, lng: -73.9394, rotate: -61, size: 8 },
    { text: "Edgecombe Ave", lat: 40.8272, lng: -73.9421, rotate: -61, size: 8 },
    { text: "St Nicholas Ave", lat: 40.82, lng: -73.948, rotate: -61, size: 8 },
    { text: "Amsterdam Ave", lat: 40.82, lng: -73.9544, rotate: -61, size: 8 },
  ],

  parkAreas: [
    // Morningside Park
    [
      [40.81023, -73.95716],
      [40.81073, -73.95678],
      [40.80999, -73.95526],
      [40.80577, -73.95834],
      [40.80318, -73.9584],
      [40.80138, -73.95967],
      [40.80185, -73.9608],
      [40.80204, -73.96084],
      [40.80551, -73.95963],
      [40.80794, -73.95784],
      [40.80961, -73.95698],
      [40.81023, -73.95716],
    ],
    // Jackie Robinson Park
    [
      [40.82343, -73.94295],
      [40.82377, -73.94362],
      [40.82926, -73.93961],
      [40.82998, -73.93969],
      [40.82972, -73.93881],
      [40.82821, -73.93945],
      [40.82343, -73.94295],
    ],
    // Saint Nicholas Park
    [
      [40.81296, -73.95164],
      [40.81271, -73.95103],
      [40.815, -73.94919],
      [40.82126, -73.94628],
      [40.82173, -73.94738],
      [40.8212, -73.94776],
      [40.82015, -73.94746],
      [40.81888, -73.94838],
      [40.81834, -73.94922],
      [40.81761, -73.94982],
      [40.81686, -73.94997],
      [40.81618, -73.9496],
      [40.81576, -73.94961],
      [40.81296, -73.95164],
    ],
    // Marcus Garvey Memorial Park
    [
      [40.80279, -73.94309],
      [40.8051, -73.94149],
      [40.80619, -73.94425],
      [40.80386, -73.94585],
      [40.80279, -73.94309],
    ],
  ],

  campusAreas: [
    // Columbia University
    [
      [40.81119, -73.96393],
      [40.80863, -73.9658],
      [40.80787, -73.9666],
      [40.8055, -73.96761],
      [40.80481, -73.96596],
      [40.80419, -73.96641],
      [40.80316, -73.96393],
      [40.80626, -73.96164],
      [40.80554, -73.95992],
      [40.80823, -73.95798],
      [40.80978, -73.95725],
      [40.81019, -73.95749],
      [40.81249, -73.96296],
      [40.81119, -73.96393],
    ],
  ],

  detourLegend:
    "The green detour runs southwest to Morningside Park and Columbia",

  // below unless a neighbor would collide with the label
  stopLabelSide: {
    "hotel-theresa": "right",
    "west-125th": "left",
    "morningside-columbia": "left",
    "astor-row": "right",
    "covenant-blocks": "left",
    "schomburg": "right",
    "st-philips": "left",
    "riverton": "right",
    "409-edgecombe": "left",
    "one45": "right",
  },
};
