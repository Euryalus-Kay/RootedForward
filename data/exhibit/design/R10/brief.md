# R10 brief. The graphics overhaul of "The Same Map"

## The owner's directive (2026-07-10, verbatim intent)

The concept and layout stay. The graphics do not measure up. His words, cleaned up:
"You are not doing a good job on the graphical elements. This whole page is boring.
Make the maps and things more interesting. Make them 3D and have things zoom into
elements as you move. Make the charts easy and quick to read. The timeline at the
bottom does not feel well thought out. Make the elements better, be more creative.
I want a cohesive 3D thing that's hyper-detailed, integrated with 2D maps, and
better zooming, highlights on the maps. Go all out. And check every map."

## What ships today (R9, live)

One server-rendered SVG map of Chicago that never leaves the screen. Thirteen
chapters scroll past it; each step sets a discrete StageState (frame crop, era,
grades on/flood/off, linework, labels, marks, dim, warm, today ring). Frame
changes are hard viewBox cuts between three crops (citywide, Black Belt,
Hyde Park township). A docked five-bar instrument register rides under the map;
a ledger rail sits at the page bottom; a left-edge spine turns D-red at ch6.

Screenshots of all 54 steps at both widths are in `.r9shots/` (files
`d-<anchor>.png` desktop, `m-<anchor>.png` mobile). Advisors should look at
at least: d-ch0, d-a2-register, d-ch5, d-ch1, d-ch4, d-a3-s2, d-ch8, d-ch11,
d-a6-sum, d-a6-climb.

## The audit (what is actually wrong, map by map)

1. **Opening (d-ch0).** The 1940 map floats small in a huge cream field. No
   lake, no ground fabric. Grade fills are washed near-pastel. It reads as
   colored confetti, not a city.
2. **Overture (d-a2-register).** Worst state on the page. While the register
   wall is studied, the map pane is bare cream with five floating labels.
3. **1921/1927 covenant era (d-ch5, d-a3-s1).** Near-blank paper; the 32
   bombing marks form a tiny unreadable knot behind the HYDE PARK label
   (r=3.2 at a 1132-wide viewBox is under 2 screen pixels).
4. **Hyde Park township (d-ch1, d-ch2, d-ch3, d-ch8).** The lake is a flat
   gray slab; no section grid, no parks (Jackson Park, Washington Park, the
   Midway exist in cached data but are never drawn), no fairground footprint
   at the 1893 beat, nothing showing clearance at 1955.
5. **The flood (d-a3-f1..f3).** The best beat, but at citywide zoom the
   filing-order batches read as subtle stipple. No camera movement supports
   it.
6. **The memorial (d-ch4).** The one act that reads designed (dim field,
   marks, dashed commission square). Keep its dignity; it stays flat and
   motionless. Composition could improve (marks hug the left third).
7. **Docked register (bottom of every shot).** Hairline bars ~1px, floating
   one-letter initials, cryptic. The owner singled it out.
8. **Register wall (d-a2-register right pane).** Bars are plain dark slabs;
   the 1921-1970 "no gap" claim is stated in text but not drawn.
9. **Finale charts (d-a6-ledger, d-a6-climb, d-a6-bridge).** Correct but
   quiet; the owner wants faster reads and more spectacle without losing the
   historian register.
10. **Camera.** Only three fixed crops all page. Nothing ever zooms to the
    thing being discussed (Binga's block, the commission square, North
    Lawndale, East Woodlawn today).

## Materials verified available (real data only)

- 694 HOLC area polygons in two frames + per-grade merged fills (geometry.json)
- All 77 Chicago community areas, real geometry (fetched today,
  data/exhibit-src/community-areas.geojson) → true shoreline/lake fill by
  eastern hull, whisper neighborhood fabric, honest label anchors
- Citywide parks (data/exhibit-src/parks-cpd.geojson, Chicago Park District)
- Hyde Park frame layers incl. 55 park polygons currently unused
  (public/exhibit-data/hp-frame-layers.json)
- The PLSS mile section grid: Chicago's street grid arithmetic (800 units/mile
  from State/Madison) is already used for bombing geocoding; section lines are
  the 1830s survey instrument itself, era-appropriate for the 1832 bare-ground
  beat
- 32 located bombing incidents, commission square, township boundary,
  East Woodlawn 2026 anchor, sheet filing dates (flood order)
- 127-fact registry; ledger/climb/bridge dollar figures with sources

## Hard constraints (non-negotiable)

- Real data only. No invented geometry, no decorative fake detail. Every layer
  must name its source.
- Grade is ordinal. Continuous-magnitude extrusion of grades was killed in R7
  and stays dead; quantized rank steps with an on-page disclosure were the
  R7-approved honest form. Dollar figures (ledger, gap) DO have true
  magnitude and may extrude honestly.
- ch4 (bombing memorial) stays flat, motionless, undecorated. Dead are
  counted, not named. No camera drama there; a slow static reveal at most.
- Rust (#A8502F) means present-day only. Grade colors mean grades only.
  exh-green appears once (CBL credit).
- Reduced-motion = keyboard = phone = the same resolved states. Discrete
  states; animation is presentation, never information. No scroll hijacking;
  the page must remain an honest scrolling document.
- The 694 area paths must remain DOM elements (tap targets for the sheet
  lookups; the verify suite reads them).
- House copy rules: no em-dashes, no sentence colons, historian register.
- Stack: Next.js 16, React 19, no new runtime dependencies without a strong
  case. The stage is a server-rendered SVG steered by CSS/data attributes;
  geometry.json stays out of the client bundle. Initial-paint budget matters
  (SSR full map at first paint is a shipped win to preserve).

## What the council must produce

Concepts for a cohesive visual language upgrade, specifically:

1. **The 3D integration.** The owner explicitly wants 3D married to the 2D
   map. Options include CSS-perspective camera tilts of the whole stage, SVG
   2.5D relief (stacked offsets, R7 precedent), a WebGL hero moment sharing
   the same geometry, extruded true-magnitude data objects (dollar towers) at
   the finale, engraved/intaglio depth (D pressed deepest into the paper).
   What is the ONE coherent 3D language, where does it appear, where does it
   deliberately not (ch4)?
2. **The camera.** A zoom/highlight choreography per act: what does the
   camera do at each chapter, what gets spotlit, how do 2D zooms and 3D tilts
   read as one continuous camera? Reduced-motion parity plan.
3. **The ground plane.** How the new real layers (lake, shoreline,
   neighborhoods, parks, section grid) appear per era so no state is ever
   bare cream, without faking period detail we don't have.
4. **The register.** Redesign of the docked strip and the wall so a stranger
   reads them in two seconds. The relay thesis (no year off, 1921-1970) drawn,
   not just stated.
5. **New ideas.** Not just adaptations of what exists. If a better mechanism
   exists for a beat, name it.

Advisors must look at the screenshots before writing. Concepts must respect
every hard constraint and say explicitly how they handle ch4, reduced motion,
and the real-data rule.
