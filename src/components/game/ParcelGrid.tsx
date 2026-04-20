"use client";

import type { Parcel, ParcelType, ParcelOwner } from "@/lib/game/types";
import { COLS } from "@/lib/game/parcels";
import { ParcelIcon } from "./icons";

/* ------------------------------------------------------------------ */
/*  Display helpers                                                    */
/* ------------------------------------------------------------------ */

const TYPE_LABEL: Record<ParcelType, string> = {
  vacant: "Vacant lot",
  "single-family": "Single-family home",
  "two-flat": "Two-flat",
  "three-flat": "Three-flat",
  courtyard: "Courtyard apartment",
  tower: "Public housing tower",
  "rehab-tower": "Rehabilitated tower",
  commercial: "Commercial building",
  industrial: "Industrial site",
  school: "School",
  church: "Church",
  park: "Park",
  transit: "Transit station",
  expressway: "Expressway",
  "land-trust": "Land trust parcel",
  demolished: "Demolished",
  mural: "Public mural",
  "community-garden": "Community garden",
  library: "Library",
  clinic: "Health clinic",
};

const OWNER_LABEL: Record<ParcelOwner, string> = {
  resident: "Resident-owned",
  absentee: "Absentee landlord",
  speculator: "Speculator-owned",
  "land-trust": "Community land trust",
  city: "City",
  cha: "Chicago Housing Authority",
  university: "University",
  developer: "Private developer",
  vacant: "Vacant",
};

/** Tile background color (the HOLC base or building type overlay) */
function fillFor(p: Parcel): string {
  // Overrides
  if (p.owner === "speculator") return "#C45D3E55"; // translucent rust
  if (p.type === "expressway") return "#1A1A1A";
  if (p.type === "transit") return "#C45D3E";
  if (p.type === "land-trust") return "#1B3A2D";
  if (p.type === "tower") return "#4A4A4A";
  if (p.type === "rehab-tower") return "#2A5440";
  if (p.type === "park") return "#3F7C3A";
  if (p.type === "school") return "#A8462A";
  if (p.type === "church") return "#854B1E";
  if (p.type === "mural") return "#D4765C";
  if (p.type === "community-garden") return "#4F8A4A";
  if (p.type === "library") return "#8B3A16";
  if (p.type === "clinic") return "#8B3A16";
  if (p.type === "commercial") return "#B55F1A";
  if (p.type === "industrial") return "#57564F";
  if (p.type === "vacant") return "#E8DEC9";

  // HOLC base colors
  switch (p.holc) {
    case "A": return "#4F8A4A";
    case "B": return "#4A79A8";
    case "C": return "#D4A83A";
    case "D": return "#B8373A";
    default: return "#E8DEC9";
  }
}

/** Icon color inside the tile */
function iconColorFor(p: Parcel): string {
  if (p.type === "vacant") return "#8A8578";
  return "#F5F0E8";
}

/** Shows a building silhouette for non-trivial types */
function hasIcon(type: ParcelType): boolean {
  return type !== "vacant";
}

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

export interface ParcelGridProps {
  parcels: Parcel[];
  onHover?: (p: Parcel | null) => void;
  highlight?: number[];
  compact?: boolean;
}

export default function ParcelGrid({ parcels, onHover, highlight, compact }: ParcelGridProps) {
  const highSet = new Set(highlight ?? []);
  return (
    <div
      className={`relative rounded-sm ${compact ? "" : "bg-gradient-to-br from-forest/5 to-cream-dark/50 p-3"}`}
      onMouseLeave={() => onHover?.(null)}
    >
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {parcels.map((p) => {
          const isHigh = highSet.has(p.id);
          const showIcon = hasIcon(p.type);
          return (
            <div
              key={p.id}
              onMouseEnter={() => onHover?.(p)}
              title={`${TYPE_LABEL[p.type]} · HOLC ${p.holc} · ${p.residents} residents`}
              className={`group relative aspect-square overflow-hidden rounded-[3px] shadow-sm transition-all duration-500 ${
                p.protected ? "ring-2 ring-rust" : ""
              } ${isHigh ? "ring-2 ring-forest ring-offset-1" : ""} hover:z-10 hover:scale-110 hover:shadow-lg`}
              style={{ backgroundColor: fillFor(p) }}
            >
              {/* Subtle inner shadow for dimension */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/15" />
              {/* Protected marker lock corner */}
              {p.protected && (
                <div className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-rust" />
              )}
              {/* Building icon */}
              {showIcon && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ color: iconColorFor(p) }}>
                  <ParcelIcon type={p.type} size={compact ? 10 : 16} />
                </div>
              )}
              {/* Speculator shimmer stripes */}
              {p.owner === "speculator" && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, transparent 0 3px, #8B3A16 3px 4px)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend                                                             */
/* ------------------------------------------------------------------ */

export function ParcelLegend() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-body text-[11px] text-ink/65 sm:grid-cols-3">
      <Legend color="#4F8A4A" label="HOLC A (best)" />
      <Legend color="#4A79A8" label="HOLC B" />
      <Legend color="#D4A83A" label="HOLC C" />
      <Legend color="#B8373A" label="HOLC D (redlined)" />
      <Legend color="#1A1A1A" label="Expressway" />
      <Legend color="#C45D3E" label="Transit station" />
      <Legend color="#1B3A2D" label="Land trust" />
      <Legend color="#4A4A4A" label="CHA tower" />
      <Legend color="#C45D3E55" label="Speculator" />
      <Legend color="#3F7C3A" label="Park / garden" />
      <Legend color="#D4765C" label="Mural" />
      <Legend color="#E8DEC9" label="Vacant" />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 rounded-[2px] shadow-sm"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

export function ParcelTooltip({ parcel }: { parcel: Parcel | null }) {
  if (!parcel) return null;
  return (
    <div className="rounded-sm border border-border bg-cream p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[3px]"
          style={{ backgroundColor: fillFor(parcel), color: iconColorFor(parcel) }}
        >
          <ParcelIcon type={parcel.type} size={16} />
        </div>
        <p className="font-display text-sm font-semibold text-forest">{TYPE_LABEL[parcel.type]}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-body text-[11px] text-ink/70">
        <dt className="text-warm-gray">HOLC</dt><dd>{parcel.holc}</dd>
        <dt className="text-warm-gray">Owner</dt><dd>{OWNER_LABEL[parcel.owner]}</dd>
        <dt className="text-warm-gray">Residents</dt><dd>{parcel.residents}</dd>
        <dt className="text-warm-gray">Condition</dt><dd>{parcel.condition}</dd>
        <dt className="text-warm-gray">Value</dt><dd>{parcel.value}</dd>
        <dt className="text-warm-gray">Memory</dt><dd>{parcel.memory}</dd>
        <dt className="text-warm-gray">Protected</dt><dd>{parcel.protected ? "Yes" : "No"}</dd>
      </dl>
    </div>
  );
}
