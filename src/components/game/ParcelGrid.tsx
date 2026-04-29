"use client";

import type { Parcel, ParcelType, ParcelOwner } from "@/lib/game/types";
import { COLS } from "@/lib/game/parcels";
import { ParcelIcon } from "./icons";
import { narrativeFor } from "@/lib/game/parcel-narrative";

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
      className={`relative ${compact ? "" : "rounded-sm bg-gradient-to-br from-forest/5 to-cream-dark/50 p-2"}`}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex gap-2">
        {/* Row labels: North / Central / South down the left side */}
        {!compact && (
          <div className="relative flex w-7 flex-shrink-0 flex-col font-body text-[9px] font-semibold uppercase tracking-widest text-warm-gray">
            <span className="absolute left-0 right-1 text-right" style={{ top: "calc(2 / 7 * 100% - 6px)" }}>N</span>
            <span className="absolute left-0 right-1 text-right" style={{ top: "calc(50% - 6px)" }}>C</span>
            <span className="absolute left-0 right-1 text-right" style={{ bottom: "calc(2 / 7 * 100% - 6px)" }}>S</span>
            <span className="absolute right-0 top-1 bottom-1 w-px bg-border" />
          </div>
        )}

        {/* The grid itself */}
        <div
          className="grid flex-1 gap-1"
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
                className={`group relative aspect-square overflow-hidden rounded-[4px] border border-black/10 shadow-sm transition-all duration-300 ${
                  p.protected ? "ring-2 ring-rust ring-offset-1 ring-offset-cream" : ""
                } ${isHigh ? "ring-2 ring-forest ring-offset-1 ring-offset-cream" : ""} hover:z-10 hover:scale-110 hover:shadow-md`}
                style={{ backgroundColor: fillFor(p) }}
              >
                {/* Building icon — large enough to read at a glance */}
                {showIcon && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    style={{ color: iconColorFor(p) }}
                  >
                    <ParcelIcon type={p.type} size={compact ? 12 : 22} />
                  </div>
                )}
                {/* Speculator hatched overlay */}
                {p.owner === "speculator" && (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, transparent 0 4px, #8B3A16 4px 5px)",
                    }}
                  />
                )}
                {/* Protected lock dot in the corner */}
                {p.protected && (
                  <div className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-rust shadow" />
                )}
              </div>
            );
          })}
        </div>

        {/* Lake Michigan strip on the right */}
        {!compact && (
          <div
            className="relative flex w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm"
            style={{
              background:
                "linear-gradient(180deg, #5a90c4 0%, #3d6e96 50%, #234a6c 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.25)",
            }}
          >
            {/* Animated lake shimmer */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(180deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 9px)",
              }}
            />
            <span
              className="relative rotate-90 whitespace-nowrap font-body text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/95"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            >
              Lake Michigan
            </span>
          </div>
        )}
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
  const n = narrativeFor(parcel);
  return (
    <div className="rounded-md border border-border bg-cream p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: fillFor(parcel), color: iconColorFor(parcel) }}
        >
          <ParcelIcon type={parcel.type} size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold leading-tight text-forest">
            {TYPE_LABEL[parcel.type]}
          </p>
          <p className="font-body text-[11px] text-warm-gray">{n.address}</p>
        </div>
      </div>

      <p className="mt-3 font-body text-[12px] leading-snug text-ink/75">{n.primary}</p>

      {n.stateLines.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {n.stateLines.map((line, i) => (
            <li key={i} className="flex gap-1.5 font-body text-[11px] leading-snug text-rust-dark">
              <span className="text-rust">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 font-body text-[11px] italic text-warm-gray">{n.ownership}</p>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-border pt-2 font-body text-[11px] text-ink/70">
        {n.vitalLines.map((v) => (
          <div key={v.label} className="flex justify-between">
            <dt className="text-warm-gray">{v.label}</dt>
            <dd className="font-medium">{v.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
