// ------------------------------------------------------------------
// How the Columbia and West Harlem map is dressed. Same shape as
// harlem-map.ts and hyde-park-map.ts.
//
// Manhattan's grid is rotated about twenty-nine degrees east of
// north, so street names are set at +29 across the numbered streets
// and -61 along the avenues, measured off the projected frame. Park
// and campus outlines are OpenStreetMap ways (ODbL), simplified to
// about six metres. The two Columbia campuses are tinted the way the
// university quadrangles are in Hyde Park, because four of the six
// stops are about what the university did to the ground around it.
//
// Labels are anchored to survive the route-fitted viewBox clamp;
// keep every one inside roughly lng -73.972..-73.948,
// lat 40.8225..40.7995.
// ------------------------------------------------------------------
import type { WalkMapConfig } from "./walk-utils";

export const WEST_HARLEM_MAP: WalkMapConfig = {
  // The USGS Central Park quadrangle, 1947 edition (public domain),
  // resampled onto the tour frame and flattened onto cream as one
  // ink. It still shows the 125th Street ferry and the blocks that
  // Morningside Gardens and Grant Houses replaced.
  baseMapSrc: "/media/west-harlem-walk/map-base-1947.jpg",
  areaName: "West Harlem",

  placeLabels: [
    { text: "Hudson River", lat: 40.8135, lng: -73.9695, size: 12 },
    { text: "Morningside Heights", lat: 40.8065, lng: -73.9665, size: 11 },
    { text: "West Harlem", lat: 40.8155, lng: -73.9505, size: 12 },
    { text: "Manhattanville", lat: 40.8185, lng: -73.9555, size: 10 },
    { text: "Morningside Park", lat: 40.8058, lng: -73.9573, size: 8 },
    { text: "Riverside Park", lat: 40.8098, lng: -73.9665, size: 8 },
    { text: "Sakura Park", lat: 40.8129, lng: -73.9622, size: 7 },
    { text: "Columbia University", lat: 40.8072, lng: -73.9622, size: 8 },
    { text: "Grant's Tomb", lat: 40.8134, lng: -73.9645, size: 7 },
  ],

  streetLabels: [
    { text: "W 116th St", lat: 40.8062, lng: -73.9598, rotate: 29, size: 8 },
    { text: "W 120th St", lat: 40.8098, lng: -73.9598, rotate: 29, size: 8 },
    { text: "W 125th St", lat: 40.8125, lng: -73.9525, rotate: 29, size: 9 },
    { text: "La Salle St", lat: 40.8141, lng: -73.9588, rotate: 29, size: 7 },
    { text: "W 129th St", lat: 40.8172, lng: -73.9585, rotate: 29, size: 8 },
    { text: "Broadway", lat: 40.8098, lng: -73.9628, rotate: -61, size: 9 },
    { text: "Amsterdam Ave", lat: 40.8082, lng: -73.9585, rotate: -61, size: 8 },
    { text: "Morningside Dr", lat: 40.8075, lng: -73.9598, rotate: -61, size: 7 },
    { text: "Riverside Dr", lat: 40.8115, lng: -73.9648, rotate: -61, size: 8 },
    { text: "Claremont Ave", lat: 40.8132, lng: -73.9615, rotate: -61, size: 7 },
    { text: "12th Ave", lat: 40.8195, lng: -73.9598, rotate: -61, size: 7 },
  ],

  parkAreas: [
    // Morningside Park
    [
      [40.81023, -73.95716],
      [40.81073, -73.95678],
      [40.81010, -73.95529],
      [40.80999, -73.95526],
      [40.80577, -73.95834],
      [40.80543, -73.95845],
      [40.80318, -73.95840],
      [40.80138, -73.95967],
      [40.80185, -73.96080],
      [40.80204, -73.96084],
      [40.80551, -73.95963],
      [40.80794, -73.95784],
      [40.80961, -73.95698],
      [40.80991, -73.95696],
      [40.81023, -73.95716],
    ],
    // Riverside Park, the stretch beside the walk
    [
      [40.81645, -73.96190],
      [40.81655, -73.96185],
      [40.81652, -73.96171],
      [40.81673, -73.96144],
      [40.81754, -73.96091],
      [40.81756, -73.96114],
      [40.81734, -73.96150],
      [40.81627, -73.96264],
      [40.81392, -73.96430],
      [40.81056, -73.96722],
      [40.80760, -73.96917],
      [40.80411, -73.97187],
      [40.80161, -73.97364],
      [40.80156, -73.97351],
      [40.80006, -73.97448],
      [40.79906, -73.97484],
      [40.79872, -73.97464],
      [40.79842, -73.97474],
      [40.79770, -73.97523],
      [40.79696, -73.97556],
      [40.79642, -73.97550],
      [40.79613, -73.97506],
      [40.79641, -73.97462],
      [40.79678, -73.97427],
      [40.79781, -73.97423],
      [40.79878, -73.97373],
      [40.79977, -73.97284],
      [40.80089, -73.97148],
      [40.80449, -73.96890],
      [40.80702, -73.96753],
      [40.80794, -73.96692],
      [40.80893, -73.96591],
      [40.81148, -73.96407],
      [40.81142, -73.96394],
      [40.81225, -73.96333],
      [40.81228, -73.96346],
      [40.81256, -73.96316],
      [40.81361, -73.96245],
      [40.81401, -73.96230],
      [40.81397, -73.96199],
      [40.81568, -73.96074],
      [40.81634, -73.96055],
      [40.81704, -73.96085],
      [40.81652, -73.96117],
      [40.81604, -73.96107],
      [40.81602, -73.96128],
      [40.81620, -73.96139],
      [40.81626, -73.96176],
      [40.81645, -73.96190],
    ],
    // Sakura Park
    [
      [40.81268, -73.96278],
      [40.81243, -73.96214],
      [40.81338, -73.96146],
      [40.81353, -73.96148],
      [40.81374, -73.96196],
      [40.81268, -73.96278],
    ],
    // West Harlem Piers Park
    [
      [40.82030, -73.95982],
      [40.82038, -73.96000],
      [40.81803, -73.96209],
      [40.81796, -73.96190],
      [40.81855, -73.96126],
      [40.81996, -73.95998],
      [40.82027, -73.95975],
      [40.82030, -73.95982],
    ],
  ],

  campusAreas: [
    // Columbia University, the Morningside Heights campus
    [
      [40.81119, -73.96393],
      [40.80863, -73.96580],
      [40.80787, -73.96660],
      [40.80550, -73.96761],
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
    // Barnard College
    [
      [40.80850, -73.96468],
      [40.80824, -73.96405],
      [40.81051, -73.96239],
      [40.81077, -73.96302],
      [40.80850, -73.96468],
    ],
    // Teachers College
    [
      [40.81013, -73.96075],
      [40.80952, -73.95929],
      [40.81000, -73.95894],
      [40.81103, -73.96139],
      [40.81055, -73.96174],
      [40.81013, -73.96075],
    ],
    // Union Theological Seminary
    [
      [40.81210, -73.96203],
      [40.81195, -73.96214],
      [40.81181, -73.96181],
      [40.81149, -73.96205],
      [40.81164, -73.96241],
      [40.81102, -73.96282],
      [40.81077, -73.96222],
      [40.81184, -73.96142],
      [40.81210, -73.96203],
    ],
    // Columbia University, the Manhattanville campus
    [
      [40.81987, -73.95875],
      [40.81797, -73.96015],
      [40.81701, -73.95927],
      [40.81687, -73.95892],
      [40.81674, -73.95901],
      [40.81658, -73.95932],
      [40.81701, -73.95972],
      [40.81733, -73.96049],
      [40.81726, -73.96066],
      [40.81708, -73.96071],
      [40.81646, -73.96041],
      [40.81651, -73.95996],
      [40.81607, -73.95952],
      [40.81583, -73.95892],
      [40.81566, -73.95905],
      [40.81552, -73.95873],
      [40.81772, -73.95711],
      [40.81721, -73.95587],
      [40.81847, -73.95545],
      [40.81861, -73.95535],
      [40.81854, -73.95519],
      [40.81878, -73.95500],
      [40.81874, -73.95490],
      [40.81898, -73.95473],
      [40.81926, -73.95538],
      [40.81863, -73.95584],
      [40.81987, -73.95875],
    ],
  ],

  // below unless a neighbor would collide with the label
  stopLabelSide: {
    "columbia-gate": "left",
    "furnald-hall": "left",
    "hamilton-hall": "right",
    "morningside-overlook": "right",
    "morningside-park": "right",
    "institutions": "left",
    "riverside-church": "left",
    "morningside-gardens": "left",
    "grant-houses": "right",
    "city-college": "right",
    "prentis-hall": "left",
    "manhattanville": "right",
    "under-the-viaduct": "left",
    "west-harlem-piers": "left",
  },

  detourLegend:
    "The green detour runs north on Amsterdam Avenue to City College",
};
