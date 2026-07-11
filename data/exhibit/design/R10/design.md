# R10 design. The Pressed Sheet

Binding build plan. Fuses the chairman's verdict (council-verdict.md), the
peer-review catches (council-reviews.json), and the lead's engineering
decisions. The owner's directive and the map-by-map audit live in brief.md.

## The language, in four sentences

The map is a printed survey sheet lying on a cream-dark desk, and the whole
page is a camera over that desk. Policy presses DOWN into the paper in four
quantized rank steps; only true dollars ever rise UP off it. The sheet is
flat and plumb whenever the page is testifying (the memorial, every document,
the receipt, the colophon) and leans at exactly three events (ch1, the
clearance study, the finale bill). The relief does not exist until the
underwriting sentence lands at a3-s2, where it arrives as one stamp.

## Engineering decisions by the lead (where the verdict left room)

1. **FLIP camera on the inner data-camera group, destination-first**
   (corrected in audit round 1; the first cut ran the transform on the
   svg element, which clipped the rest of the city out of every flight).
   The tween sets the real target viewBox immediately, applies the
   inverse affine to the group in user units (transform-box view-box,
   origin 0 0), and transitions to identity. transitionend AND
   transitioncancel plus a watchdog handle interruption; retargeting
   mid-flight composes against the computed matrix. Micro-layers
   (fabric, grid, parks) and the city labels rest behind data-tween
   during flight.
2. **No frame reprojection.** The one-plane detail experiment is removed
   from geometry.json (the code stays in the prep script behind the
   second-sheet ruling). Cross-frame changes are the second-sheet cut, a
   300ms paper slide, instant under reduced motion.
3. **Veil holes.** Named holes (lawndale, jacksonPark, township, binga
   block, bombing field) are emitted by the prep script as real-geometry
   path strings; the a0-locate hole concatenates the visitor's own area
   path at runtime (evenodd).
4. **Streets are not sourced.** The Major Streets export endpoint refuses
   (blobby view). Per the verdict's own gating rule the street layer is
   omitted, not faked; the fabric, parks, grid, and lake carry the ground.
   Same for the renewal footprint (unsourced, omitted).
   Also cut, recorded here per the same rule: the verdict's act-1 "1893
   camera push 20 percent tighter" (the hydePark sheet has no camera
   capability this round; the parks' arrival carries the beat), and the
   mobile chapter-anchor retune deliberately exempts ch4 (the memorial's
   resolved position is law-sealed; adjusting its anchor risks motion on
   entry).
5. **The docked register keeps initials plus adds the union band.** Full
   lane names at 44px need more height than the pane lane allows on
   desktop; lanes carry the boxed initials taught by the wall, with the
   short names in the tap sheet and title attributes. The union band and
   caret carry the two-second read.

## New stage grammar (types + resolver)

StageState gains: `cam` (named focus key or "wide"), `tilt` (0|10|22),
`veil` (named hole or "none"), `press` (bool, monotonic from a3-s2),
`towers` (list at act6 beats), `marksMode` ("badge"|"dots"), `sr`
(resolved-state sentence). All carry forward through resolveSteps like the
rest. Registry-enforced laws: memorial flag pins ch4 to
{tilt 0, veil none, cam frozen, no press}; arrive-early is a data-shape rule
checked by the suite (no cam change lands on a chapterHead marked solemn or
on a3-s2/ch4).

## The strata table (verify-enforced minimums)

Minimum visible state everywhere: desk + sheet + lake + title block. Then by
era: 1832-1889 add PLSS mile grid (State/Madison 800-units arithmetic, the
survey's own instrument) + township boundary; 1893 add the real park
footprints (fair labeled on Jackson Park); 1900-1933 add community-area
whisper fabric; 1934+ add HOLC linework and fills (flat until the press);
township acts use the hp sheet's own layers; 1971-2026 full stack + rust
ring (only rust on the map) + towers at money beats. Every layer names its
source in the colophon; the title block carries era, frame, and the R7
depth disclosure once the press exists.

## Build order (chairman's gates, kept)

Gate 1 ground+register: strata layers, plate-mark, title block, register
dock/wall rebuild with union band and corrected batons (1948 covenants ->
redlining, 1950 rule -> redlining, 1968 redlining -> renewal, 1970
contracts -> renewal), suite extension protecting all of it.
Gate 2 camera+marks: FLIP engine, CameraStates for all 54 steps, veil,
semantic-zoom marks, flood recut (three per-step eases, wet-ink settle,
filing counter), ch4 recomposed crop (wider, east-shifted, motion-frozen).
Gate 3 depth+bill: intaglio on the five fills (U flat; depths .6/1.1/1.7/2.4)
with THE PRESS at a3-s2 + disclosure; tilt events; act6 deed-stack towers
(counter-rotated HTML, slivers with a disclosed per-sliver value,
North Lawndale and East Woodlawn anchors, hidden during tweens); cross-
section climb; tap-to-raise printing the surveyor's words; mobile pass as
design (8deg cap, band-only dock with tap sheet).

Perf gate at 2 and 3: median 55fps during any 900ms tween on a mid-tier
device profile, press filter static-only; fallback is the offset-stroke
deboss, pre-built.

## Cut order if needed (verdict's, binding)

Tilt events first, wet-ink grammar second. Never the ground strata, never
the union band, never the semantic zoom.
