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
        {/* Background */}
        <rect width="400" height="600" fill="#F5F0E8" opacity="0.3" />

        {/* Decorative inner border frame */}
        <rect x="8" y="8" width="384" height="584" rx="2" fill="none" stroke="#1B3A2D" strokeWidth="0.5" opacity="0.12" />
        <rect x="12" y="12" width="376" height="576" rx="1" fill="none" stroke="#1B3A2D" strokeWidth="0.3" opacity="0.08" />

        {/* Defs for gradients, patterns, and markers */}
        <defs>
          <linearGradient id="lakeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4A8FA3" stopOpacity="0.25" />
            <stop offset="35%" stopColor="#4A8FA3" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4A8FA3" stopOpacity="0.08" />
          </linearGradient>
          <pattern id="lakePattern" patternUnits="userSpaceOnUse" width="20" height="8" patternTransform="rotate(-5)">
            <path d="M0 4 Q5 1.5, 10 4 Q15 6.5, 20 4" fill="none" stroke="#4A8FA3" strokeWidth="0.8" opacity="0.22" />
          </pattern>
          {/* Subtle dot pattern for land texture */}
          <pattern id="landDots" patternUnits="userSpaceOnUse" width="12" height="12">
            <circle cx="2" cy="2" r="0.5" fill="#1B3A2D" opacity="0.06" />
          </pattern>
          {/* Clip path for city land area */}
          <clipPath id="cityClip">
            <path d={`
              M42 72 L38 65 L32 55 L26 42 L20 28 L14 14 L8 0
              L22 0 L28 6 L32 14 L36 22 L40 30 L42 38 L44 46
              L48 52 L54 50 L58 46 L64 42 L72 38 L80 36 L90 35
              L102 36 L115 38 L130 40 L148 38 L168 36 L188 35
              L210 37 L232 40 L252 44 L270 48 L286 52 L298 58 L308 50 L314 35 L318 20
              L324 32 L328 48 L330 65 L332 85 L332 105 L331 125
              L329 145 L327 165 L326 185 L326 205 L328 225 L330 245
              L331 265 L330 285 L328 305 L326 325 L323 345 L321 365
              L319 385 L318 405 L318 425 L320 445 L322 465 L325 485
              L329 505 L334 522 L340 538 L348 555 L355 568 L362 578 L368 585
              L355 588 L338 586 L318 583 L298 579 L280 576 L265 573
              L250 571 L238 573 L225 575 L212 577 L200 575 L186 571
              L172 565 L158 557 L146 548 L135 537 L126 525 L118 512
              L112 498 L107 482 L103 465 L99 445 L96 425 L93 405
              L90 382 L88 358 L82 340 L78 340 L78 310 L82 310
              L82 286 L78 286 L78 262 L80 262 L78 238 L77 214 L76 192
              L77 168 L72 168 L72 145 L78 145 L80 122 L76 122 L76 100
              L82 100 L84 82 L72 75 L58 72 L42 72
            `} />
          </clipPath>
          <marker id="routeArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#C45D3E" opacity="0.4" />
          </marker>
        </defs>

        {/* Lake Michigan — eastern shoreline with realistic curve */}
        <path
          d="M318 0 L400 0 L400 600 L368 585
             C358 578, 348 560, 340 538
             C334 520, 329 505, 325 485
             C322 465, 320 445, 318 425
             C318 405, 319 385, 321 365
             C323 345, 326 325, 328 305
             C330 285, 331 265, 330 245
             C328 225, 326 205, 326 185
             C327 165, 329 145, 331 125
             C332 105, 332 85, 330 65
             C328 48, 324 32, 318 20
             Z"
          fill="url(#lakeGradient)"
        />
        {/* Lake water texture */}
        <path
          d="M318 20
             C324 32, 328 48, 330 65
             C332 85, 332 105, 331 125
             C329 145, 327 165, 326 185
             C326 205, 328 225, 330 245
             C331 265, 330 285, 328 305
             C326 325, 323 345, 321 365
             C319 385, 318 405, 318 425
             C320 445, 322 465, 325 485
             C329 505, 334 520, 340 538
             C348 560, 358 578, 368 585
             L400 600 L400 0 L318 0 Z"
          fill="url(#lakePattern)"
        />
        {/* Lake shoreline accent — solid line */}
        <path
          d="M318 20
             C324 32, 328 48, 330 65
             C332 85, 332 105, 331 125
             C329 145, 327 165, 326 185
             C326 205, 328 225, 330 245
             C331 265, 330 285, 328 305
             C326 325, 323 345, 321 365
             C319 385, 318 405, 318 425
             C320 445, 322 465, 325 485
             C329 505, 334 520, 340 538
             C348 560, 358 578, 368 585"
          fill="none"
          stroke="#4A8FA3"
          strokeWidth="2"
          opacity="0.4"
        />

        {/* Chicago city outline — realistic shape:
            O'Hare arm: narrow NW corridor (15px wide),
            widens dramatically at North Side,
            jagged western boundary with township jogs,
            Lake Michigan shoreline on east,
            narrowing southern tail toward state line */}
        {(() => {
          const chicagoOutline = `
            M42 72 L38 65 L32 55 L26 42 L20 28 L14 14 L8 0
            L22 0 L28 6 L32 14 L36 22
            L40 30 L42 38 L44 46
            L48 52 L54 50 L58 46 L64 42
            L72 38 L80 36 L90 35
            L102 36 L115 38 L130 40
            L148 38 L168 36 L188 35
            L210 37 L232 40 L252 44 L270 48
            L286 52 L298 58 L308 50 L314 35 L318 20
            L324 32 L328 48 L330 65
            L332 85 L332 105 L331 125
            L329 145 L327 165 L326 185
            L326 205 L328 225 L330 245
            L331 265 L330 285 L328 305
            L326 325 L323 345 L321 365
            L319 385 L318 405 L318 425
            L320 445 L322 465 L325 485
            L329 505 L334 522 L340 538
            L348 555 L355 568 L362 578 L368 585
            L355 588 L338 586 L318 583
            L298 579 L280 576 L265 573
            L250 571 L238 573 L225 575
            L212 577 L200 575 L186 571
            L172 565 L158 557 L146 548
            L135 537 L126 525 L118 512
            L112 498 L107 482 L103 465
            L99 445 L96 425 L93 405
            L90 382 L88 358 L82 340
            L78 340 L78 310 L82 310
            L82 286 L78 286 L78 262
            L80 262 L78 238 L77 214 L76 192
            L77 168 L72 168 L72 145 L78 145
            L80 122 L76 122 L76 100
            L82 100 L84 82 L72 75 L58 72 L42 72
          `;
          return (
            <>
              <path d={chicagoOutline} fill="#DDD6C8" opacity="0.2" />
              <path d={chicagoOutline} fill="url(#landDots)" />
              <path d={chicagoOutline} fill="none" stroke="#1B3A2D" strokeWidth="2.2" opacity="0.4" />
            </>
          );
        })()}

        {/* Chicago River — the distinctive Y shape */}
        {/* Main stem — flowing east to Lake Michigan */}
        <path
          d="M328 172 C310 170, 290 174, 270 177
             C250 180, 235 182, 220 180
             C205 178, 190 174, 175 172
             L155 170"
          fill="none"
          stroke="#4A8FA3"
          strokeWidth="3"
          opacity="0.3"
          strokeLinecap="round"
        />
        {/* South Branch — flows southwest */}
        <path
          d="M220 180 C218 195, 215 210, 210 225
             C205 242, 200 258, 195 275"
          fill="none"
          stroke="#4A8FA3"
          strokeWidth="2.5"
          opacity="0.25"
          strokeLinecap="round"
        />
        {/* North Branch — flows north */}
        <path
          d="M220 180 C218 165, 215 148, 210 132
             C205 118, 198 102, 190 88"
          fill="none"
          stroke="#4A8FA3"
          strokeWidth="2.5"
          opacity="0.25"
          strokeLinecap="round"
        />
        <text x="164" y="166" fill="#5B9AAD" opacity="0.3" fontSize="6" fontFamily="serif" fontStyle="italic" textAnchor="middle">Chicago River</text>

        {/* Expressways — thicker lines for major highways, clipped to city */}
        <g clipPath="url(#cityClip)">
          {/* Dan Ryan / I-90/94 — runs roughly N-S through the south side */}
          <path
            d="M220 170 C218 195, 215 220, 210 250
               C205 280, 200 310, 195 340
               C190 370, 185 400, 180 440
               C175 480, 172 510, 170 540"
            fill="none"
            stroke="#1B3A2D"
            strokeWidth="2.5"
            opacity="0.1"
            strokeLinecap="round"
          />
          <text x="182" y="290" fill="#1B3A2D" opacity="0.12" fontSize="4.5" fontFamily="sans-serif" fontWeight="600" transform="rotate(-82 182 290)">I-90/94</text>

          {/* Eisenhower / I-290 — runs E-W through the West Side */}
          <path
            d="M80 215 C120 212, 160 210, 200 208 C230 207, 260 208, 290 210"
            fill="none"
            stroke="#1B3A2D"
            strokeWidth="2"
            opacity="0.08"
            strokeLinecap="round"
          />
          <text x="110" y="210" fill="#1B3A2D" opacity="0.1" fontSize="4.5" fontFamily="sans-serif" fontWeight="600">I-290</text>
        </g>

        {/* Street grid — major N-S and E-W streets with labels, clipped to city */}
        <g opacity="0.1" stroke="#1B3A2D" strokeWidth="0.5" clipPath="url(#cityClip)">
          {/* N-S streets */}
          <line x1="200" y1="60" x2="200" y2="560" strokeWidth="0.8" />
          <line x1="250" y1="50" x2="250" y2="570" />
          <line x1="150" y1="80" x2="150" y2="550" />
          <line x1="300" y1="40" x2="300" y2="580" strokeWidth="0.8" />
          <line x1="120" y1="90" x2="120" y2="535" />
          <line x1="270" y1="45" x2="270" y2="575" />
          <line x1="175" y1="75" x2="175" y2="555" />
          <line x1="225" y1="55" x2="225" y2="565" />
          {/* E-W streets */}
          <line x1="60" y1="150" x2="330" y2="150" />
          <line x1="60" y1="200" x2="330" y2="200" strokeWidth="0.8" />
          <line x1="65" y1="250" x2="330" y2="250" />
          <line x1="70" y1="300" x2="328" y2="300" />
          <line x1="75" y1="350" x2="325" y2="350" strokeWidth="0.8" />
          <line x1="80" y1="400" x2="320" y2="400" />
          <line x1="85" y1="450" x2="322" y2="450" />
          <line x1="90" y1="500" x2="330" y2="500" />
          <line x1="65" y1="225" x2="330" y2="225" />
          <line x1="70" y1="275" x2="328" y2="275" />
          <line x1="75" y1="325" x2="326" y2="325" />
          <line x1="78" y1="375" x2="322" y2="375" />
          <line x1="82" y1="425" x2="320" y2="425" />
          <line x1="86" y1="475" x2="326" y2="475" />
        </g>

        {/* Major street labels */}
        <text x="202" y="570" fill="#1B3A2D" opacity="0.15" fontSize="5" fontFamily="sans-serif" textAnchor="middle">State St</text>
        <text x="302" y="570" fill="#1B3A2D" opacity="0.15" fontSize="5" fontFamily="sans-serif" textAnchor="middle">Michigan Ave</text>
        <text x="252" y="570" fill="#1B3A2D" opacity="0.12" fontSize="4.5" fontFamily="sans-serif" textAnchor="middle">King Dr</text>
        <text x="152" y="568" fill="#1B3A2D" opacity="0.12" fontSize="4.5" fontFamily="sans-serif" textAnchor="middle">Ashland</text>

        {/* Neighborhood labels — prominent and readable */}
        {/* Major neighborhood labels — all-caps for key areas */}
        <text x="225" y="192" fill="#1B3A2D" opacity="0.32" fontSize="12" fontFamily="sans-serif" fontWeight="800" textAnchor="middle" letterSpacing="3">THE LOOP</text>
        <text x="140" y="264" fill="#1B3A2D" opacity="0.25" fontSize="9.5" fontFamily="sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="1.5">PILSEN</text>
        <text x="190" y="322" fill="#1B3A2D" opacity="0.2" fontSize="9" fontFamily="sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="1.5">BRONZEVILLE</text>
        <text x="240" y="415" fill="#1B3A2D" opacity="0.25" fontSize="9.5" fontFamily="sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="1.5">HYDE PARK</text>

        {/* Secondary neighborhood labels — mixed case */}
        <text x="135" y="142" fill="#1B3A2D" opacity="0.22" fontSize="8" fontFamily="sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.8">Logan Square</text>
        <text x="95" y="300" fill="#1B3A2D" opacity="0.2" fontSize="7.5" fontFamily="sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.5">Austin</text>
        <text x="195" y="500" fill="#1B3A2D" opacity="0.2" fontSize="7.5" fontFamily="sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.5">Englewood</text>
        <text x="255" y="130" fill="#1B3A2D" opacity="0.22" fontSize="8" fontFamily="sans-serif" fontWeight="600" textAnchor="middle" letterSpacing="0.8">Lincoln Park</text>
        <text x="155" y="350" fill="#1B3A2D" opacity="0.2" fontSize="7.5" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">Back of the Yards</text>
        <text x="140" y="430" fill="#1B3A2D" opacity="0.18" fontSize="7" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">Bridgeport</text>
        <text x="275" y="458" fill="#1B3A2D" opacity="0.18" fontSize="7" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">Woodlawn</text>
        <text x="175" y="112" fill="#1B3A2D" opacity="0.18" fontSize="7" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">Wicker Park</text>
        <text x="280" y="90" fill="#1B3A2D" opacity="0.18" fontSize="7" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">Lakeview</text>
        <text x="130" y="220" fill="#1B3A2D" opacity="0.18" fontSize="7" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">Little Village</text>
        <text x="245" y="540" fill="#1B3A2D" opacity="0.16" fontSize="7" fontFamily="sans-serif" fontWeight="500" textAnchor="middle" letterSpacing="0.5">South Shore</text>

        {/* Lake Michigan label */}
        <text x="362" y="300" fill="#1B3A2D" opacity="0.18" fontSize="13" fontFamily="serif" fontStyle="italic" letterSpacing="4" transform="rotate(90 362 300)" textAnchor="middle">Lake Michigan</text>

        {/* Full compass rose */}
        <g transform="translate(38, 555)" opacity="0.45">
          {/* Outer ring */}
          <circle cx="0" cy="0" r="18" fill="#F5F0E8" stroke="#1B3A2D" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="15" fill="none" stroke="#1B3A2D" strokeWidth="0.4" />
          {/* Tick marks */}
          <line x1="0" y1="-18" x2="0" y2="-15" stroke="#1B3A2D" strokeWidth="1" />
          <line x1="0" y1="15" x2="0" y2="18" stroke="#1B3A2D" strokeWidth="0.6" />
          <line x1="-18" y1="0" x2="-15" y2="0" stroke="#1B3A2D" strokeWidth="0.6" />
          <line x1="15" y1="0" x2="18" y2="0" stroke="#1B3A2D" strokeWidth="0.6" />
          {/* North arrow — filled dark */}
          <polygon points="0,-13 -4,0 0,-3 4,0" fill="#1B3A2D" />
          {/* South arrow — outline */}
          <polygon points="0,13 -4,0 0,3 4,0" fill="none" stroke="#1B3A2D" strokeWidth="0.6" />
          {/* East/West small arrows */}
          <polygon points="13,0 0,-3 3,0 0,3" fill="none" stroke="#1B3A2D" strokeWidth="0.5" />
          <polygon points="-13,0 0,-3 -3,0 0,3" fill="none" stroke="#1B3A2D" strokeWidth="0.5" />
          {/* Center dot */}
          <circle cx="0" cy="0" r="1.5" fill="#1B3A2D" />
          {/* Cardinal labels */}
          <text x="0" y="-22" fill="#1B3A2D" fontSize="7" fontFamily="serif" fontWeight="800" textAnchor="middle">N</text>
          <text x="0" y="28" fill="#1B3A2D" fontSize="5" fontFamily="serif" textAnchor="middle">S</text>
          <text x="24" y="2" fill="#1B3A2D" fontSize="5" fontFamily="serif" textAnchor="middle">E</text>
          <text x="-24" y="2" fill="#1B3A2D" fontSize="5" fontFamily="serif" textAnchor="middle">W</text>
        </g>

        {/* Scale bar — clean, readable */}
        <g transform="translate(320, 568)" opacity="0.4">
          <line x1="0" y1="0" x2="50" y2="0" stroke="#1B3A2D" strokeWidth="2" />
          <line x1="0" y1="-4" x2="0" y2="4" stroke="#1B3A2D" strokeWidth="1.5" />
          <line x1="50" y1="-4" x2="50" y2="4" stroke="#1B3A2D" strokeWidth="1.5" />
          <text x="25" y="12" fill="#1B3A2D" fontSize="7" fontFamily="sans-serif" textAnchor="middle">2 mi</text>
        </g>

        {/* Tour route — curved dotted path connecting stops in order */}
        {stops.length > 1 && (() => {
          const coords = stops.map(s => ({ x: lngToX(s.lng), y: latToY(s.lat) }));
          // Build a smooth curved path through the stops
          let pathD = `M${coords[0].x} ${coords[0].y}`;
          for (let i = 0; i < coords.length - 1; i++) {
            const curr = coords[i];
            const next = coords[i + 1];
            const midX = (curr.x + next.x) / 2;
            const midY = (curr.y + next.y) / 2;
            // Offset the control point to create a nice curve
            const cpX = midX - 20;
            const cpY = midY;
            pathD += ` Q${cpX} ${cpY} ${next.x} ${next.y}`;
          }
          return (
            <path
              d={pathD}
              fill="none"
              stroke="#C45D3E"
              strokeWidth="2.5"
              strokeDasharray="8 5"
              opacity="0.4"
              strokeLinecap="round"
              markerMid="url(#routeArrow)"
            />
          );
        })()}

        {/* Tour stop nodes — large and prominent */}
        {stops.map((stop, i) => {
          const x = lngToX(stop.lng);
          const y = latToY(stop.lat);
          const isHovered = hoveredStop === stop.slug;
          // Label positioning: place to the left for nodes near the right edge
          const labelX = x > 220 ? x - 26 : x + 26;
          const labelAnchor = x > 220 ? "end" : "start";
          // Position tooltip above the node, not overlapping anything
          const tooltipW = 240;
          const tooltipH = 130;
          const tooltipX = Math.max(10, Math.min(x - tooltipW / 2, 400 - tooltipW - 10));
          const tooltipY = Math.max(10, y - tooltipH - 35);
          // Line from label pill to node
          const lineEndX = x > 220 ? x - 20 : x + 20;

          return (
            <g key={stop.slug}>
              {/* Outer glow rings */}
              <circle cx={x} cy={y} r="28" fill="#C45D3E" opacity="0.06" />
              <circle cx={x} cy={y} r="24" fill="#C45D3E" opacity="0.1" />

              {/* Pulse on hover */}
              {isHovered && (
                <circle cx={x} cy={y} r="28" fill="#C45D3E" opacity="0.12">
                  <animate attributeName="r" from="22" to="42" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.2" to="0" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Main node — large and bold */}
              <Link href={`/tours/chicago/${stop.slug}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "19" : "17"}
                  fill="#C45D3E"
                  stroke="#F5F0E8"
                  strokeWidth="4"
                  className="cursor-pointer transition-all duration-200"
                  style={{ filter: 'drop-shadow(0 2px 6px rgba(196,93,62,0.35))' }}
                  onMouseEnter={() => setHoveredStop(stop.slug)}
                  onMouseLeave={() => setHoveredStop(null)}
                />
              </Link>

              {/* Number inside node */}
              <text
                x={x}
                y={y + 6}
                fill="#F5F0E8"
                fontSize="15"
                fontFamily="sans-serif"
                fontWeight="800"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {i + 1}
              </text>

              {/* Connector line from node to label */}
              <line
                x1={x > 220 ? x - 19 : x + 19}
                y1={y - 2}
                x2={x > 220 ? x - 24 : x + 24}
                y2={y - 8}
                stroke="#8A8578"
                strokeWidth="1"
                opacity="0.3"
                className="pointer-events-none"
              />

              {/* Label background pill — sized per label */}
              {(() => {
                const name = stop.title.includes('Bronzeville') ? 'Bronzeville' :
                  stop.title.includes('Pilsen') ? 'Pilsen' :
                  stop.title.includes('Hyde Park') ? 'Hyde Park' :
                  stop.title.split(' ').slice(0, 2).join(' ');
                const pillW = name.length * 6.5 + 16;
                const pillX = x > 220 ? labelX - pillW + 4 : labelX - 4;
                return (
                  <rect
                    x={pillX}
                    y={y - 23}
                    width={pillW}
                    height="30"
                    rx="5"
                    fill="#F5F0E8"
                    opacity="0.9"
                    stroke="#DDD6C8"
                    strokeWidth="0.5"
                    className="pointer-events-none"
                  />
                );
              })()}
              {/* Stop name label next to node — short neighborhood name */}
              <text
                x={labelX}
                y={y - 9}
                fill="#1B3A2D"
                fontSize="10"
                fontFamily="sans-serif"
                fontWeight="700"
                textAnchor={labelAnchor}
                letterSpacing="0.3"
                className="pointer-events-none"
              >
                {stop.title.includes('Bronzeville') ? 'Bronzeville' :
                 stop.title.includes('Pilsen') ? 'Pilsen' :
                 stop.title.includes('Hyde Park') ? 'Hyde Park' :
                 stop.title.split(' ').slice(0, 2).join(' ')}
              </text>
              <text
                x={labelX}
                y={y + 2}
                fill="#8A8578"
                fontSize="6.5"
                fontFamily="sans-serif"
                fontWeight="600"
                textAnchor={labelAnchor}
                letterSpacing="0.5"
                className="pointer-events-none"
              >
                STOP {i + 1}
              </text>

              {/* Tooltip on hover — positioned above the node */}
              {isHovered && (
                <foreignObject
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipW}
                  height={tooltipH}
                  className="pointer-events-none"
                >
                  <div className="rounded-sm bg-forest p-4 shadow-xl">
                    <p className="font-body text-sm font-semibold text-cream leading-snug">
                      {stop.title}
                    </p>
                    <p className="mt-2 font-body text-xs leading-relaxed text-cream/70">
                      {stop.description.substring(0, 120)}...
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

/*
  MULTI-CITY SUPPORT:
  To re-enable the city tab selector, uncomment the CITIES array below
  and the city selector section in the JSX (search for "City selector tabs").
  Then wrap the Chicago content in the selectedCity === "chicago" conditional
  and uncomment the placeholder for other cities at the bottom.

  const CITIES = [
    { slug: "chicago", name: "Chicago", active: true },
    { slug: "new-york", name: "New York", active: false },
    { slug: "dallas", name: "Dallas", active: false },
    { slug: "san-francisco", name: "San Francisco", active: false },
  ];
*/

export default function ToursPage() {
  // const [selectedCity, setSelectedCity] = useState("chicago"); // Uncomment for multi-city
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
            Walking Tours
          </h1>
        </div>
      </section>

      {/*
        MULTI-CITY: Uncomment this city selector section to enable tabs.
        Also uncomment selectedCity state above and CITIES array.

      <section className="border-b border-border bg-cream">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex gap-0 overflow-x-auto">
            {CITIES.map((city) => (
              <button
                key={city.slug}
                onClick={() => city.active && setSelectedCity(city.slug)}
                className={`relative whitespace-nowrap px-6 py-4 font-body text-sm font-semibold uppercase tracking-widest transition-colors ${
                  selectedCity === city.slug
                    ? "border-b-2 border-rust text-rust"
                    : city.active
                      ? "text-warm-gray hover:text-forest"
                      : "cursor-default text-warm-gray/40"
                }`}
              >
                {city.name}
                {!city.active && (
                  <span className="ml-2 rounded-full bg-cream-dark px-2 py-0.5 font-body text-[9px] uppercase tracking-wider text-warm-gray">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>
      */}

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
              <div className="w-full rounded-sm border border-border bg-cream-dark p-6 shadow-md">
                <p className="mb-4 text-center font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  Tour Map
                </p>
                <ChicagoMap stops={stops} />
                <p className="mt-3 text-center font-display text-2xl font-bold tracking-[0.35em] text-forest">
                  CHICAGO
                </p>
                <p className="mt-1.5 text-center font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-rust">
                  Click a stop to explore
                </p>
                <p className="mt-0.5 text-center font-body text-[8px] text-warm-gray/60">
                  Map by Rooted Forward
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cream spacer bar to separate from footer */}
      <section className="bg-cream py-10">
        <div className="mx-auto max-w-6xl px-6">
          <hr className="border-border" />
        </div>
      </section>

      {/* In-Person Tours / Viator Section */}
      <section className="bg-forest py-16 md:py-24">
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

      {/*
        MULTI-CITY: Uncomment this block and wrap Chicago content above
        in {selectedCity === "chicago" ? ( <> ... </> ) : ( this block )}

      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            {CITIES.find((c) => c.slug === selectedCity)?.name} Tours
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-ink/60">
            Tours for this city are in development. Check back soon.
          </p>
          <Link href="/get-involved" className="mt-8 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark">
            Help Us Launch
          </Link>
        </div>
      </section>
      */}
    </div>
  );
}
