"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PLACEHOLDER_STOPS } from "@/lib/constants";

interface TourStop {
  slug: string;
  title: string;
  lat: number;
  lng: number;
  description: string;
}

/* ------------------------------------------------------------------ */
/*  Chicago map coordinates (simplified outline)                       */
/*  The city is roughly a rectangle along Lake Michigan                 */
/*  SVG viewBox maps to approximate lat/lng bounds                     */
/*  North: 42.02, South: 41.64, West: -87.94, East: -87.52           */
/* ------------------------------------------------------------------ */

function latToY(lat: number): number {
  // Map latitude to SVG Y coordinate
  const north = 42.02;
  const south = 41.64;
  return ((north - lat) / (north - south)) * 600;
}

function lngToX(lng: number): number {
  // Map longitude to SVG X coordinate
  const west = -87.94;
  const east = -87.52;
  return ((lng - west) / (east - west)) * 400;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

async function fetchStops(): Promise<TourStop[]> {
  try {
    const res = await fetch("/api/policy/campaigns"); // reuse pattern
    // Actually just use constants for now
  } catch {}
  return PLACEHOLDER_STOPS.filter((s) => s.city === "chicago").map((s) => ({
    slug: s.slug,
    title: s.title,
    lat: s.lat,
    lng: s.lng,
    description: s.description,
  }));
}

/* ------------------------------------------------------------------ */
/*  Interactive Map Component                                          */
/* ------------------------------------------------------------------ */

function ChicagoMap({ stops }: { stops: TourStop[] }) {
  const [hoveredStop, setHoveredStop] = useState<string | null>(null);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg viewBox="0 0 400 600" className="w-full" xmlns="http://www.w3.org/2000/svg">
        {/* Lake Michigan — follows the real eastern shoreline of Chicago */}
        <path
          d="M295 0 C298 10, 305 20, 310 30 L318 50 L322 80 L320 100 C318 120, 322 140, 325 160
             L328 180 C330 200, 325 220, 320 235 L315 250 C310 265, 308 280, 310 300
             L315 320 C318 340, 322 355, 325 370 L328 390 C330 410, 328 430, 325 450
             L320 480 C318 500, 322 520, 330 540 L340 560 L355 575 L370 585 L400 590
             L400 0 Z"
          fill="#1B3A2D"
          opacity="0.06"
        />

        {/* Chicago city outline — based on real city shape:
            Narrow at top (O'Hare arm), wide middle, jagged west edge,
            Lake Michigan shoreline on east, narrowing at far south */}
        <path
          d="M40 28 L55 25 L80 22 L95 18
             L82 15 L75 10 L70 5 L68 0 L90 0 L95 5 L100 12
             L120 15 L160 18 L200 20 L240 22 L270 25
             L290 28 L305 35 L315 45
             L320 65 L322 85 L320 105
             L318 125 L322 145 L325 165
             L328 185 L325 210 L318 235
             L312 250 L310 270 L312 290
             L318 310 L322 330 L325 350
             L328 370 L325 395 L320 420
             L318 445 L322 465 L328 485
             L332 505 L338 525 L345 545
             L355 560 L365 572 L372 580
             L365 585 L345 582 L320 578
             L295 572 L270 568 L245 565
             L220 568 L195 572 L175 575
             L158 572 L142 568 L125 562
             L110 555 L95 548 L82 540
             L72 530 L65 518 L60 505
             L58 490 L55 475 L52 458
             L48 440 L45 420 L42 400
             L40 380 L38 358 L35 335
             L32 310 L30 285 L28 260
             L25 235 L22 210 L20 185
             L22 160 L25 135 L28 110
             L32 85 L35 60 L38 42 Z"
          fill="#1B3A2D"
          opacity="0.05"
        />
        <path
          d="M40 28 L55 25 L80 22 L95 18
             L82 15 L75 10 L70 5 L68 0 L90 0 L95 5 L100 12
             L120 15 L160 18 L200 20 L240 22 L270 25
             L290 28 L305 35 L315 45
             L320 65 L322 85 L320 105
             L318 125 L322 145 L325 165
             L328 185 L325 210 L318 235
             L312 250 L310 270 L312 290
             L318 310 L322 330 L325 350
             L328 370 L325 395 L320 420
             L318 445 L322 465 L328 485
             L332 505 L338 525 L345 545
             L355 560 L365 572 L372 580
             L365 585 L345 582 L320 578
             L295 572 L270 568 L245 565
             L220 568 L195 572 L175 575
             L158 572 L142 568 L125 562
             L110 555 L95 548 L82 540
             L72 530 L65 518 L60 505
             L58 490 L55 475 L52 458
             L48 440 L45 420 L42 400
             L40 380 L38 358 L35 335
             L32 310 L30 285 L28 260
             L25 235 L22 210 L20 185
             L22 160 L25 135 L28 110
             L32 85 L35 60 L38 42 Z"
          fill="none"
          stroke="#1B3A2D"
          strokeWidth="1.5"
          opacity="0.25"
        />

        {/* Subtle neighborhood labels */}
        <text x="180" y="195" fill="#1B3A2D" opacity="0.12" fontSize="9" fontFamily="sans-serif" textAnchor="middle">The Loop</text>
        <text x="130" y="245" fill="#1B3A2D" opacity="0.12" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Pilsen</text>
        <text x="260" y="310" fill="#1B3A2D" opacity="0.12" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Bronzeville</text>
        <text x="285" y="380" fill="#1B3A2D" opacity="0.12" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Hyde Park</text>
        <text x="120" y="140" fill="#1B3A2D" opacity="0.12" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Logan Sq</text>
        <text x="80" y="290" fill="#1B3A2D" opacity="0.12" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Austin</text>
        <text x="200" y="480" fill="#1B3A2D" opacity="0.12" fontSize="7" fontFamily="sans-serif" textAnchor="middle">Englewood</text>

        {/* Lake Michigan label */}
        <text x="365" y="250" fill="#1B3A2D" opacity="0.10" fontSize="11" fontFamily="serif" fontStyle="italic" transform="rotate(90 365 250)" textAnchor="middle">Lake Michigan</text>

        {/* Tour stop nodes — bigger, with better tooltips */}
        {stops.map((stop, i) => {
          const x = lngToX(stop.lng);
          const y = latToY(stop.lat);
          const isHovered = hoveredStop === stop.slug;
          // Position tooltip to the left if node is on the right side
          const tooltipX = x > 200 ? x - 215 : x + 20;
          const tooltipY = y - 30;

          return (
            <g key={stop.slug}>
              {/* Outer glow */}
              <circle cx={x} cy={y} r="18" fill="#C45D3E" opacity="0.12" />

              {/* Pulse on hover */}
              {isHovered && (
                <circle cx={x} cy={y} r="22" fill="#C45D3E" opacity="0.1">
                  <animate attributeName="r" from="16" to="30" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.15" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Main node */}
              <Link href={`/tours/chicago/${stop.slug}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "14" : "12"}
                  fill="#C45D3E"
                  stroke="#F5F0E8"
                  strokeWidth="3"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredStop(stop.slug)}
                  onMouseLeave={() => setHoveredStop(null)}
                />
              </Link>

              {/* Number inside node */}
              <text
                x={x}
                y={y + 4}
                fill="#F5F0E8"
                fontSize="10"
                fontFamily="sans-serif"
                fontWeight="700"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {i + 1}
              </text>

              {/* Tooltip on hover — positioned to the side, not overlapping */}
              {isHovered && (
                <foreignObject
                  x={tooltipX}
                  y={tooltipY}
                  width="195"
                  height="85"
                  className="pointer-events-none"
                >
                  <div className="rounded bg-forest p-3 shadow-lg">
                    <p className="font-body text-[11px] font-semibold text-cream leading-tight">
                      {stop.title}
                    </p>
                    <p className="mt-1.5 font-body text-[9px] leading-snug text-cream/65">
                      {stop.description.substring(0, 90)}...
                    </p>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ToursPage() {
  const [stops, setStops] = useState<TourStop[]>([]);

  useEffect(() => {
    // Try DB first, fall back to constants
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("tour_stops")
          .select("slug, title, lat, lng, description")
          .eq("city", "chicago")
          .eq("published", true)
          .order("created_at", { ascending: true });
        if (!error && data && data.length > 0) {
          setStops(data as TourStop[]);
          return;
        }
      } catch {}
      setStops(
        PLACEHOLDER_STOPS.filter((s) => s.city === "chicago").map((s) => ({
          slug: s.slug,
          title: s.title,
          lat: s.lat,
          lng: s.lng,
          description: s.description,
        }))
      );
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Banner */}
      <section className="relative pt-16 pb-12 md:pb-16">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero-redlining.jpg')" }} />
        <div className="absolute inset-0 bg-forest/70" />
        <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
          <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
            Chicago Walking Tours
          </h1>
        </div>
      </section>

      {/* Intro + Map Section */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: description */}
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Self-Guided Tours
              </p>
              <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
                Walk the History
              </h2>
              <p className="mt-6 max-w-[55ch] font-body text-base leading-relaxed text-ink/70">
                Each stop on our Chicago tour connects a specific place to
                the policy that shaped it. Redlining boundaries you can still
                trace in the infrastructure. Urban renewal demolitions that
                erased entire blocks. Highway routes that split neighborhoods
                in half. Click a location on the map to explore.
              </p>

              {/* Stop list */}
              <div className="mt-10 flex flex-col gap-4">
                {stops.map((stop, i) => (
                  <Link
                    key={stop.slug}
                    href={`/tours/chicago/${stop.slug}`}
                    className="group flex items-start gap-4 rounded-sm border border-border p-4 transition-all hover:border-rust/30 hover:shadow-sm"
                  >
                    <span className="flex-shrink-0 font-display text-2xl text-border">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display text-lg text-forest transition-colors group-hover:text-rust">
                        {stop.title}
                      </h3>
                      <p className="mt-1 font-body text-sm text-ink/55 line-clamp-2">
                        {stop.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: interactive map */}
            <div className="flex items-start justify-center lg:sticky lg:top-24">
              <div className="w-full rounded-sm border border-border bg-cream-dark p-6">
                <p className="mb-4 text-center font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  Tour Map
                </p>
                <ChicagoMap stops={stops} />
                <p className="mt-2 text-center font-display text-lg tracking-widest text-forest">
                  C H I C A G O
                </p>
                <p className="mt-1 text-center font-body text-[9px] text-warm-gray">
                  Click a stop to explore &middot; Map by Rooted Forward
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* In-Person Tours / Viator Section */}
      <section className="border-t border-border bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/40">
                In-Person Experience
              </p>
              <h2 className="mt-3 font-display text-3xl text-cream md:text-4xl">
                Guided Walking Tours
              </h2>
              <p className="mt-6 max-w-[55ch] font-body text-base leading-relaxed text-cream/70">
                In addition to our self-guided virtual stops, we offer
                in-person guided walking tours in the Chicago area. Led by
                trained youth guides, these tours take you through Hyde Park
                and surrounding neighborhoods with live commentary on the
                history of redlining, urban renewal, and community resistance
                you can see in the built environment around you.
              </p>
              <a
                href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Book on Viator
              </a>
              <p className="mt-3 font-body text-xs text-cream/40">
                Booking and reviews managed through Viator / TripAdvisor
              </p>
            </div>

            {/* Viator embed / info card */}
            <div className="flex items-center justify-center">
              <div className="w-full rounded-sm border border-cream/15 bg-cream/[0.05] p-8">
                <h3 className="font-display text-xl text-cream">
                  Hyde Park Walking Tour
                </h3>
                <p className="mt-1 font-body text-sm text-cream/50">
                  History, Race, and Urban Change
                </p>
                <hr className="my-5 border-cream/10" />
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="font-body text-xs font-semibold uppercase text-rust">Duration</span>
                    <span className="font-body text-sm text-cream/70">2 hours</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-body text-xs font-semibold uppercase text-rust">Location</span>
                    <span className="font-body text-sm text-cream/70">Hyde Park, Chicago</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-body text-xs font-semibold uppercase text-rust">Guide</span>
                    <span className="font-body text-sm text-cream/70">Youth-led, trained researchers</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-body text-xs font-semibold uppercase text-rust">Covers</span>
                    <span className="font-body text-sm text-cream/70">Redlining, urban renewal, University of Chicago expansion, community resistance</span>
                  </div>
                </div>
                <a
                  href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-sm border-2 border-cream/30 px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:border-cream hover:bg-cream/10"
                >
                  Check Availability &amp; Book
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expansion note */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-body text-sm text-warm-gray">
            More cities coming soon. Rooted Forward is expanding to New York,
            Dallas, and San Francisco.
          </p>
        </div>
      </section>
    </div>
  );
}
