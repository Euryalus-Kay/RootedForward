"use client";

import { useState } from "react";
import CityMap from "@/components/maps/CityMap";
import StopListView from "@/components/tours/StopListView";
import type { City, TourStop } from "@/lib/types/database";
import { Map, List } from "lucide-react";

interface CityTourViewProps {
  city: City;
  stops: TourStop[];
}

export default function CityTourView({ city, stops }: CityTourViewProps) {
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <div>
      {/* Toggle buttons */}
      <div className="mb-8 flex gap-2" role="tablist" aria-label="View mode">
        <button
          role="tab"
          aria-selected={view === "map"}
          onClick={() => setView("map")}
          className={`inline-flex items-center gap-2 rounded-sm border px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-widest transition-colors ${
            view === "map"
              ? "border-forest bg-forest text-cream"
              : "border-border bg-cream text-ink hover:bg-cream-dark"
          }`}
        >
          <Map size={14} />
          Map view
        </button>
        <button
          role="tab"
          aria-selected={view === "list"}
          onClick={() => setView("list")}
          className={`inline-flex items-center gap-2 rounded-sm border px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-widest transition-colors ${
            view === "list"
              ? "border-forest bg-forest text-cream"
              : "border-border bg-cream text-ink hover:bg-cream-dark"
          }`}
        >
          <List size={14} />
          List view
        </button>
      </div>

      {/* Content */}
      <div role="tabpanel">
        {view === "map" ? (
          <CityMap
            city={city.slug}
            stops={stops}
            center={[city.lng, city.lat]}
            zoom={city.zoom}
          />
        ) : (
          <StopListView stops={stops} city={city.slug} />
        )}
      </div>
    </div>
  );
}
