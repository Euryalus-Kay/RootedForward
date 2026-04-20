/**
 * Generates a fictional but consistent street address and a one-line
 * narrative description for any parcel. Deterministic per parcel id
 * so the same parcel always reads as the same address.
 */

import type { Parcel, ParcelType, ParcelOwner } from "./types";

const STREET_NAMES: string[] = [
  "Bronzeville", "Halsted", "Damen", "Ashland", "Western", "California",
  "Pulaski", "Cermak", "Madison", "Roosevelt", "Garfield", "Marquette",
  "King Drive", "Cottage Grove", "Lake Park", "Drexel", "Dorchester",
  "Woodlawn", "Greenwood", "Kimbark", "South Park", "Indiana", "Wabash",
  "State", "Michigan", "Prairie", "Calumet",
];

function streetForRow(row: number): string {
  return STREET_NAMES[row % STREET_NAMES.length];
}

function streetNumberForCol(col: number, baseRow: number): number {
  return 100 * (baseRow + 1) + col * 17 + 9;
}

/** Stable fictional address like "1422 W. Halsted Ave." */
export function addressFor(p: Parcel): string {
  const street = streetForRow(p.row);
  const num = streetNumberForCol(p.col, p.row);
  const direction = p.col < 4 ? "W." : p.col > 5 ? "E." : "S.";
  const suffix = (p.id % 4 === 0) ? "Blvd." : (p.id % 4 === 1) ? "Ave." : (p.id % 4 === 2) ? "St." : "Pl.";
  return `${num} ${direction} ${street} ${suffix}`;
}

const TYPE_DESC: Record<ParcelType, string> = {
  vacant: "Vacant lot. Boarded fence, weeds. The Land Bank flagged it 18 months ago.",
  "single-family": "A wood-frame two-story. The owners painted the porch in 1982 and again in 2019.",
  "two-flat": "Brick two-flat. Family on top, family on bottom. Original tin ceilings inside.",
  "three-flat": "Greystone three-flat. Built around 1908. The third-floor unit has the best light.",
  courtyard: "U-shaped courtyard apartment. 1924 brick, twelve units, shared garden in the middle.",
  tower: "Sixteen-story public-housing tower. Elevators have failed three times this winter.",
  "rehab-tower": "Rehabbed eight-story tower. New elevators, new boilers, original residents back.",
  commercial: "Mixed-use commercial. A bakery downstairs, dental office on the second floor.",
  industrial: "Light industrial. A small parts manufacturer, eleven employees, pension uncertain.",
  school: "Elementary school. Built 1924, last refurbished 1998. Three hundred students.",
  church: "Storefront church. The congregation has been here since the second migration wave.",
  park: "Pocket park. A jungle gym, a chess board on a stone table, three benches.",
  transit: "CTA station. Three exits, a sign at every entrance promising new turnstiles.",
  expressway: "Expressway corridor. Four lanes each direction. The noise is constant.",
  "land-trust": "Held by the community land trust. Lease runs 99 years. Resale formula is in the bylaws.",
  demolished: "Demolished. Foundation still here.",
  mural: "Outdoor mural. Painted in 1979 and restored in 2003. The artist still lives nearby.",
  "community-garden": "Community garden. Eighteen plots, a rain barrel, a small composting station.",
  library: "Branch library. Late hours on Thursdays. A children's reading hour every Saturday morning.",
  clinic: "Federally Qualified Health Center. Sliding-scale primary care. Dental down the hall.",
};

const OWNER_DESC: Record<ParcelOwner, string> = {
  resident: "Owner-occupied",
  absentee: "Absentee landlord",
  speculator: "Held by an out-of-state LLC",
  "land-trust": "Community land trust",
  city: "City-owned",
  cha: "Chicago Housing Authority",
  university: "University-owned",
  developer: "Held by a developer",
  vacant: "Vacant",
};

/** Build short state-derived sentences that reflect game-driven changes
 *  to this parcel. Returns 0-3 lines depending on what's happened. */
function stateNotes(p: Parcel): string[] {
  const out: string[] = [];

  // Condition / value extremes
  if (p.condition >= 80) out.push("Recently renovated. The trim is fresh.");
  else if (p.condition >= 60 && p.owner === "resident") out.push("Well maintained by the owners.");
  else if (p.condition <= 30 && p.owner === "absentee") out.push("The landlord hasn't been by in months.");
  else if (p.condition <= 25) out.push("The roof leaks. The boiler is on its last winter.");

  // Value pressure
  if (p.value >= 80 && p.owner !== "land-trust") out.push("Land values here have climbed sharply.");
  else if (p.value <= 30) out.push("Property values have stayed flat for decades.");

  // Memory
  if (p.memory >= 80) out.push("Three generations of the same families on this block.");
  else if (p.memory <= 25 && p.displacementEvents > 0) out.push("Most of the long-term residents are gone.");

  // Owner-specific
  if (p.owner === "speculator") out.push("Bought by an out-of-state LLC at a tax-lien auction.");
  if (p.owner === "land-trust") out.push("In permanent trust. Resale capped by the bylaws.");
  if (p.owner === "cha") out.push("Operated by the Chicago Housing Authority.");
  if (p.owner === "developer") out.push("Held by a developer awaiting rezoning approval.");

  // Protection status
  if (p.protected) out.push("Protected by a community-preservation overlay.");

  return out.slice(0, 3);
}

export function narrativeFor(p: Parcel): {
  address: string;
  primary: string;
  ownership: string;
  vitalLines: { label: string; value: string }[];
  stateLines: string[];
} {
  return {
    address: addressFor(p),
    primary: TYPE_DESC[p.type],
    ownership: OWNER_DESC[p.owner],
    stateLines: stateNotes(p),
    vitalLines: [
      { label: "HOLC", value: p.holc },
      { label: "Residents", value: String(p.residents) },
      { label: "Condition", value: `${p.condition}/100` },
      { label: "Value", value: `${p.value}/100` },
      { label: "Memory", value: `${p.memory}/100` },
      { label: "Protected", value: p.protected ? "Yes" : "No" },
    ],
  };
}
