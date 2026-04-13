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
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-body text-sm font-medium transition-colors ${
            view === "map"
              ? "bg-forest text-cream"
              : "border border-border bg-cream text-ink hover:bg-cream-dark"
          }`}
        >
          <Map size={16} />
          Map View
        </button>
        <button
          role="tab"
          aria-selected={view === "list"}
          onClick={() => setView("list")}
          className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-body text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-forest text-cream"
              : "border border-border bg-cream text-ink hover:bg-cream-dark"
          }`}
        >
          <List size={16} />
          List View
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
