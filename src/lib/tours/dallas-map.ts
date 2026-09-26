// ------------------------------------------------------------------
// How the Dallas map is dressed. Same shape as hyde-park-map.ts,
// harlem-map.ts and west-harlem-map.ts.
//
// Downtown Dallas is laid out on the old Trinity River grid, about
// forty-five degrees off north, so Main, Elm and Commerce are set at
// -14 across the plate and the downtown cross streets (Akard, Harwood,
// Pearl) at +76 or +48. North of Woodall Rodgers the grid turns with
// the old Freedman's Town streets, so Ross, Flora, Thomas, State and
// Hall sit at about -42 and McKinney at -72.
//
// The park rings are drawn from the 1958 survey sheet and the TIGER
// corners, since Overpass would not answer while this map was made.
// The one campus tint is the 68 acres zoned as the Arts District in
// February 1983 (PD 145), because the third stop is about what that
// zoning replaced.
//
// Labels are anchored to survive the route-fitted viewBox clamp;
// keep every one inside roughly lng -96.811..-96.769,
// lat 32.7745..32.8125.
// ------------------------------------------------------------------
import type { WalkMapConfig } from "./walk-utils";

export const DALLAS_MAP: WalkMapConfig = {
  // The USGS Dallas 7.5-minute quadrangle, 1958 edition (public
  // domain), resampled onto the tour frame and flattened onto cream
  // as one ink. It still names Washington High School, Griggs Park
  // and the freedmen's cemetery beside the new six-lane expressway,
  // and it shows the blocks Woodall Rodgers Freeway had not yet taken.
  baseMapSrc: "/media/dallas-walk/map-base-1958.jpg",
  areaName: "central Dallas",

  placeLabels: [
    { text: "Downtown", lat: 32.7793, lng: -96.8038, size: 12 },
    { text: "Deep Ellum", lat: 32.7864, lng: -96.7848, size: 12 },
    { text: "Arts District", lat: 32.7873, lng: -96.7998, size: 8 },
    { text: "Uptown", lat: 32.8002, lng: -96.8038, size: 12 },
    { text: "State-Thomas", lat: 32.7957, lng: -96.7936, size: 9 },
    { text: "Little Mexico", lat: 32.7950, lng: -96.8058, size: 9 },
    { text: "Pike Park", lat: 32.7922, lng: -96.8104, size: 7 },
    { text: "Griggs Park", lat: 32.7987, lng: -96.7929, size: 7 },
    { text: "Main Street Garden", lat: 32.7804, lng: -96.7938, size: 7 },
    { text: "Dealey Plaza", lat: 32.7783, lng: -96.8072, size: 7 },
    { text: "Cityplace", lat: 32.8046, lng: -96.7968, size: 8 },
  ],

  streetLabels: [
    { text: "Main St", lat: 32.7799, lng: -96.8028, rotate: -14, size: 9 },
    { text: "Elm St", lat: 32.7822, lng: -96.7960, rotate: -14, size: 8 },
    { text: "Commerce St", lat: 32.7790, lng: -96.8032, rotate: -14, size: 8 },
    { text: "Ross Ave", lat: 32.7884, lng: -96.7975, rotate: -42, size: 8 },
    { text: "Flora St", lat: 32.7893, lng: -96.7982, rotate: -42, size: 7 },
    { text: "Woodall Rodgers Fwy", lat: 32.7918, lng: -96.7990, rotate: -42, size: 8 },
    { text: "McKinney Ave", lat: 32.7940, lng: -96.8025, rotate: -72, size: 9 },
    { text: "Thomas Ave", lat: 32.7951, lng: -96.7990, rotate: -42, size: 7 },
    { text: "State St", lat: 32.7987, lng: -96.7963, rotate: -42, size: 7 },
    { text: "Hall St", lat: 32.8006, lng: -96.7952, rotate: 40, size: 8 },
    { text: "Lemmon Ave", lat: 32.8055, lng: -96.7965, rotate: 30, size: 8 },
    { text: "N Central Expy", lat: 32.7960, lng: -96.7921, rotate: 84, size: 8 },
    { text: "I-345", lat: 32.7852, lng: -96.7902, rotate: 88, size: 7 },
    { text: "Good-Latimer Expy", lat: 32.7872, lng: -96.7899, rotate: 47, size: 7 },
    { text: "Pearl St", lat: 32.7871, lng: -96.7965, rotate: 48, size: 7 },
    { text: "Akard St", lat: 32.7835, lng: -96.8004, rotate: 76, size: 7 },
    { text: "Harwood St", lat: 32.7845, lng: -96.7969, rotate: 48, size: 7 },
    { text: "Routh St", lat: 32.7935, lng: -96.7984, rotate: 48, size: 7 },
    { text: "Harry Hines Blvd", lat: 32.7935, lng: -96.8084, rotate: 44, size: 7 },
  ],

  parkAreas: [
    // Klyde Warren Park, the deck over Woodall Rodgers between Pearl
    // and St. Paul, drawn 45 metres either side of the freeway line
    [
      [32.79081, -96.80063],
      [32.79024, -96.79997],
      [32.78804, -96.80253],
      [32.78862, -96.80319],
      [32.79081, -96.80063],
    ],
    // Griggs Park, read off the 1958 sheet
    [
      [32.79847, -96.79407],
      [32.79754, -96.79286],
      [32.79588, -96.79407],
      [32.79690, -96.79517],
      [32.79847, -96.79407],
    ],
    // Freedman's Memorial, the cemetery ground beside the expressway
    [
      [32.80272, -96.79572],
      [32.80272, -96.79420],
      [32.80106, -96.79400],
      [32.80106, -96.79560],
      [32.80272, -96.79572],
    ],
    // Pike Park, what is left of Little Mexico
    [
      [32.79385, -96.81035],
      [32.79385, -96.80895],
      [32.79265, -96.80895],
      [32.79265, -96.81035],
      [32.79385, -96.81035],
    ],
    // Main Street Garden, the block between Main, Commerce, Harwood
    // and St. Paul
    [
      [32.781712, -96.794145],
      [32.781383, -96.795684],
      [32.780644, -96.795496],
      [32.780979, -96.793977],
      [32.781712, -96.794145],
    ],
  ],

  campusAreas: [
    // The Arts District as zoned in 1983 (PD 145): St. Paul Street to
    // Routh Street, Ross Avenue to Woodall Rodgers, TIGER corners
    [
      [32.788336, -96.802838],
      [32.792835, -96.797499],
      [32.790655, -96.794834],
      [32.786124, -96.800202],
      [32.788336, -96.802838],
    ],
  ],

  // below unless a neighbor would collide with the label
  stopLabelSide: {
    "pythias-temple": "right",
    "main-and-akard": "left",
    "flora-street": "right",
    "klyde-warren": "left",
    "state-thomas": "left",
    "freedmans-memorial": "right",
  },
};
