"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { TourStop } from "@/lib/types/database";

interface EnhancedCityMapProps {
  city: string;
  stops: TourStop[];
  center: [number, number];
  zoom: number;
  savedStops?: string[];
  visitedStops?: string[];
}

type StopState = "default" | "saved" | "visited" | "saved-visited";

function getStopState(
  stopId: string,
  savedStops: string[],
  visitedStops: string[]
): StopState {
  const isSaved = savedStops.includes(stopId);
  const isVisited = visitedStops.includes(stopId);
  if (isSaved && isVisited) return "saved-visited";
  if (isVisited) return "visited";
  if (isSaved) return "saved";
  return "default";
}

function getMarkerColor(state: StopState): string {
  switch (state) {
    case "visited":
    case "saved-visited":
      return "#1B3A2D";
    default:
      return "#C45D3E";
  }
}

function buildMarkerHTML(state: StopState): string {
  const color = getMarkerColor(state);
  const showBookmark = state === "saved" || state === "saved-visited";

  const bookmarkSVG = showBookmark
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="#F5F0E8" stroke="#F5F0E8" stroke-width="2" style="position:absolute;top:-3px;right:-3px;z-index:4;">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
       </svg>`
    : "";

  const checkSVG =
    state === "visited" || state === "saved-visited"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3;">
          <polyline points="20 6 9 17 4 12"/>
         </svg>`
      : "";

  return `
    <span class="rf-enh-marker-dot" style="background:${color};"></span>
    <span class="rf-enh-marker-pulse" style="background:${color}33;"></span>
    ${checkSVG}
    ${bookmarkSVG}
  `;
}

export default function EnhancedCityMap({
  city,
  stops,
  center,
  zoom,
  savedStops = [],
  visitedStops = [],
}: EnhancedCityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const isValidToken = token && token !== "placeholder" && token.startsWith("pk.");

  useEffect(() => {
    if (!isValidToken || !mapContainer.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      const markers: mapboxgl.Marker[] = [];

      stops.forEach((stop) => {
        const state = getStopState(stop.id, savedStops, visitedStops);
        const isVisited = state === "visited" || state === "saved-visited";

        const el = document.createElement("div");
        el.className = "rf-enh-marker";
        el.innerHTML = buildMarkerHTML(state);

        const visitedBadge = isVisited
          ? `<span style="display:inline-block;background:#1B3A2D;color:#F5F0E8;font-size:10px;font-weight:600;padding:1px 6px;border-radius:9999px;margin-bottom:6px;">Visited</span><br/>`
          : "";

        const popup = new mapboxgl.Popup({
          offset: 14,
          closeButton: true,
          maxWidth: "250px",
        }).setHTML(`
          <div style="font-family: var(--font-body);">
            ${visitedBadge}
            <p style="font-family: var(--font-display); font-size: 15px; font-weight: 600; color: var(--color-forest); margin: 0 0 8px 0; line-height: 1.3;">
              ${stop.title}
            </p>
            <a href="/tours/${city}/${stop.slug}"
               style="display: inline-block; font-size: 13px; font-weight: 600; color: var(--color-rust); text-decoration: none; letter-spacing: 0.05em;">
              View Stop &rarr;
            </a>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .setPopup(popup)
          .addTo(map);

        markers.push(marker);
      });

      // Fit bounds to include all stops
      if (stops.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        stops.forEach((stop) => {
          bounds.extend([stop.lng, stop.lat]);
        });
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [isValidToken, city, stops, center, zoom, savedStops, visitedStops]);

  if (!isValidToken) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-cream-dark">
        <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="enh-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1B3A2D" strokeWidth="1" />
            </pattern>
            <pattern id="enh-map-diag" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="16" stroke="#1B3A2D" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#enh-map-grid)" />
          <rect width="100%" height="100%" fill="url(#enh-map-diag)" />
        </svg>
        <div className="relative z-10 px-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="mx-auto h-12 w-12 text-forest/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <p className="mt-3 font-display text-lg text-forest">Interactive Map</p>
          <p className="mt-2 font-body text-sm text-warm-gray">
            Set <code className="rounded bg-cream px-1.5 py-0.5 text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .rf-enh-marker {
          position: relative;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .rf-enh-marker-dot {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #F5F0E8;
          z-index: 2;
        }
        .rf-enh-marker-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          z-index: 1;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .rf-enh-marker:hover .rf-enh-marker-pulse {
          opacity: 1;
          transform: scale(1);
          animation: rf-enh-pulse 1.5s ease-out infinite;
        }
        @keyframes rf-enh-pulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <div className="relative">
        <div
          ref={mapContainer}
          className="aspect-video w-full rounded-lg border border-border"
          role="application"
          aria-label={`Interactive map of tour stops in ${city}`}
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-border bg-cream/90 p-3 backdrop-blur-sm">
          <p className="mb-2 font-body text-xs font-semibold text-ink-light">Legend</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full border border-cream-dark" style={{ background: "#C45D3E" }} />
              <span className="font-body text-xs text-warm-gray">Unvisited</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full border border-cream-dark" style={{ background: "#1B3A2D" }} />
              <span className="font-body text-xs text-warm-gray">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#C45D3E" stroke="#C45D3E" strokeWidth="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              <span className="font-body text-xs text-warm-gray">Saved</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
