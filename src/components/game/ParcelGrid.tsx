"use client";

import type { Parcel, ParcelType, ParcelOwner } from "@/lib/game/types";
import { COLS, ROWS } from "@/lib/game/parcels";

const TYPE_GLYPH: Record<ParcelType, string> = {
  vacant: " ",
  "single-family": "h",
  "two-flat": "H",
  "three-flat": "B",
  courtyard: "C",
  tower: "T",
  "rehab-tower": "R",
  commercial: "$",
  industrial: "I",
  school: "S",
  church: "+",
  park: "P",
  transit: "M",
  expressway: "=",
  "land-trust": "L",
  demolished: "x",
  mural: "*",
  "community-garden": "G",
  library: "L",
  clinic: "C",
};

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

function colorFor(p: Parcel): string {
  // Owner overrides
  if (p.owner === "speculator") return "bg-rust/40";
  if (p.type === "expressway") return "bg-ink";
  if (p.type === "transit") return "bg-rust";
  if (p.type === "land-trust") return "bg-forest";
  if (p.type === "tower") return "bg-warm-gray";
  if (p.type === "rehab-tower") return "bg-forest-light";
  if (p.type === "park") return "bg-green-700";
  if (p.type === "school") return "bg-rust-dark";
  if (p.type === "church") return "bg-amber-800";
  if (p.type === "mural") return "bg-rust-light";
  if (p.type === "community-garden") return "bg-green-600";
  if (p.type === "library") return "bg-rust-dark";
  if (p.type === "clinic") return "bg-rust-dark";
  if (p.type === "commercial") return "bg-amber-700";
  if (p.type === "industrial") return "bg-stone-600";
  if (p.type === "vacant") return "bg-cream-dark";

  // Default by HOLC
  switch (p.holc) {
    case "A": return "bg-[#4F8A4A]";
    case "B": return "bg-[#4A79A8]";
    case "C": return "bg-[#D4A83A]";
    case "D": return "bg-[#B8373A]";
    default: return "bg-cream-dark";
  }
}

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
      className="relative"
      onMouseLeave={() => onHover?.(null)}
    >
      <div
        className={`grid gap-[2px] ${compact ? "" : "p-2"}`}
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {parcels.map((p) => {
          const isHigh = highSet.has(p.id);
          return (
            <div
              key={p.id}
              className={`group relative aspect-square rounded-[2px] transition-all duration-300 ${colorFor(p)} ${
                p.protected ? "ring-2 ring-rust ring-offset-1 ring-offset-cream" : ""
              } ${isHigh ? "ring-2 ring-cream ring-offset-2 ring-offset-forest" : ""}`}
              onMouseEnter={() => onHover?.(p)}
              title={`${TYPE_LABEL[p.type]}, HOLC ${p.holc}, ${p.residents} residents`}
            >
              {/* Type glyph for non-empty */}
              {p.type !== "vacant" && !compact && (
                <span className="absolute inset-0 flex items-center justify-center font-display text-[10px] font-bold text-cream/80">
                  {TYPE_GLYPH[p.type]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ParcelLegend() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-body text-[11px] text-ink/65 sm:grid-cols-3">
      <Legend swatch="bg-[#4F8A4A]" label="HOLC A" />
      <Legend swatch="bg-[#4A79A8]" label="HOLC B" />
      <Legend swatch="bg-[#D4A83A]" label="HOLC C" />
      <Legend swatch="bg-[#B8373A]" label="HOLC D" />
      <Legend swatch="bg-ink" label="Expressway" />
      <Legend swatch="bg-rust" label="Transit" />
      <Legend swatch="bg-forest" label="Land trust" />
      <Legend swatch="bg-warm-gray" label="CHA tower" />
      <Legend swatch="bg-rust/40" label="Speculator" />
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-[2px] ${swatch}`} />
      <span>{label}</span>
    </div>
  );
}

export function ParcelTooltip({ parcel }: { parcel: Parcel | null }) {
  if (!parcel) return null;
  return (
    <div className="rounded-sm border border-border bg-cream p-3 shadow-lg">
      <p className="font-display text-sm font-semibold text-forest">{TYPE_LABEL[parcel.type]}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-body text-[11px] text-ink/70">
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
