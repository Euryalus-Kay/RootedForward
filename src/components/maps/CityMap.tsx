"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { TourStop } from "@/lib/types/database";

interface CityMapProps {
  city: string;
  stops: TourStop[];
  center: [number, number];
  zoom: number;
}

export default function CityMap({ city, stops, center, zoom }: CityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const isValidToken = token && token !== 'placeholder' && token.startsWith('pk.');

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

    // Navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Add markers for each stop
      const markers: mapboxgl.Marker[] = [];

      stops.forEach((stop) => {
        // Create custom marker element
        const el = document.createElement("div");
        el.className = "rf-marker";
        el.innerHTML = `
          <span class="rf-marker-dot"></span>
          <span class="rf-marker-pulse"></span>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 12,
          closeButton: true,
          maxWidth: "240px",
        }).setHTML(`
          <div style="font-family: var(--font-body);">
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

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [isValidToken, city, stops, center, zoom]);

  if (!isValidToken) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-cream-dark">
        {/* Grid pattern background */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1B3A2D" strokeWidth="1" />
            </pattern>
            <pattern id="map-diag" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="16" stroke="#1B3A2D" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#map-grid)" />
          <rect width="100%" height="100%" fill="url(#map-diag)" />
        </svg>
        <div className="relative z-10 text-center px-6">
          {/* Map pin icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="mx-auto h-12 w-12 text-forest/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <p className="mt-3 font-display text-lg text-forest">
            Interactive Map
          </p>
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
        .rf-marker {
          position: relative;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        .rf-marker-dot {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #C45D3E;
          border: 2px solid #F5F0E8;
          z-index: 2;
        }
        .rf-marker-pulse {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(196, 93, 62, 0.25);
          z-index: 1;
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .rf-marker:hover .rf-marker-pulse {
          opacity: 1;
          transform: scale(1);
          animation: rf-pulse 1.5s ease-out infinite;
        }
        @keyframes rf-pulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapContainer}
        className="aspect-video w-full rounded-lg border border-border"
        role="application"
        aria-label={`Interactive map of tour stops in ${city}`}
      />
    </>
  );
}
