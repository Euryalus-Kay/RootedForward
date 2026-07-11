# R10 Final Build Direction: THE PRESSED SHEET

Chairman's ruling, R10 design council. Binding for the build.

---

## 1) The chosen chassis

**A named fusion: THE PRESSED SHEET.** The technologist's engineering chassis carrying the conservator's grammar, dressed with the visitor's register and the cinematographer's material.

All six concepts converged on one metaphor (intaglio paper on a drafting table, policy pressed down, dollars rising up, a union coverage band, a ch4 exemption). The council did not produce six options; it produced one concept with six engineering plans. So the chassis decision is really an engineering decision, and the technologist wins it on four facts no other concept got right together: the FLIP hybrid camera (composited transform tween, snap to true viewBox on transitionend, so we get smooth motion AND crisp vectors at rest), all chrome outside the perspective wrapper (the only concept that saw the CSS containing-block trap that would silently break the sticky stage), the correct count of five merged grade fills, and an honest gate on the one unsourced layer.

Onto that chassis we bolt the conservator's three laws (the press moment, the plumb rule, the second sheet), because they turn taste into enforceable grammar, and the visitor's two-second reads (the union-band dock, semantic zoom, the cross-section climb), because they are the sharpest answers to the owner's actual complaints.

The one load-bearing fork the concepts split on, reprojecting the Hyde Park frame into citywide coordinates versus keeping two coordinate spaces, is resolved **against reprojection**. It is the round's largest unproven engineering bet, three concepts silently depended on it without budgeting it, and the conservator's second-sheet device makes the cut honest instead of hiding it. Cross-frame changes stay cuts, staged as a second physical document sliding onto the table, which is what the hydePark frame literally is. Within-frame zooming, which is most of the page, gets the full continuous camera.

---

## 2) The 3D language

**One language: the map is a printed survey sheet lying on a desk. Depth means pressure of policy. Down is ordinal and quantized; up is true dollars only.** No WebGL, no new dependencies, SSR first paint untouched (flat, transform-free, filter-free).

**The desk and sheet.** The sticky stage wrapper becomes three nested divs: `.table { perspective: 1400px }`, `.sheet { transform: rotateX(var(--tilt)); transform-style: preserve-3d }`, and inside it the untouched server-rendered SVG. The sheet gets a plate-mark rectangle and a soft shadow onto a cream-dark desk surface (two rects, one shadow), so even the sparsest era reads as paper on a table, never void. All type chrome (era readout, notes, dock, ledger rail, spine) stays outside `.sheet` in screen space; it never tilts, never blurs, and the sticky containing block survives. `--tilt` is quantized to exactly three tokens: **0deg (plumb), 10deg, 22deg** desktop; **0deg and 8deg** mobile.

**The plumb rule (conservator), enforced in the registry.** Tilted means the reader is examining an instrument; plumb means testimony. The memorial, every document facsimile (deed, Article 34, two-buyers), the receipt, the register wall, and the colophon are plumb by registry flag, not by convention.

**Pressed ink, DOWN.** The five merged per-grade fill paths (`data-gfill`: A, B, C, D, U; never the 694 tap-target paths, which stay filter-free above the fills in hit-test order) get an intaglio inner-shadow filter at quantized depths: **A 0.6 / B 1.1 / C 1.7 / D 2.4 viewBox units. U gets zero depth and stays flat**, with the disclosure covering it: the surveyors never ranked those areas, so they carry no depth. On-page disclosure line in the title block: "Depth shows grade rank in four equal steps, not a measured quantity. Ungraded areas carry none." This is the R7-approved form, restated. Ink saturation citywide rises about 15 percent toward the archival sheet pigments, killing the confetti read at ch0. Pre-built fallback if the Safari device gate fails: paired offset-stroke clones per grade path, visually equivalent at these depths.

**THE PRESS (conservator).** Relief does not exist from first paint. The map is inked flat through the whole flood, and at a3-s2 ("the city's doctrine had become the country's underwriting") the relief arrives as one discrete stamp: `data-press="on"`, a 400ms shadow-deepen and a 4 percent plate darken, an instant cut under reduced motion. The page's single most memorable state change is its argument. A structural bonus: ch4 precedes a3-s2 in narrative order, so the memorial exists in a world where the press has not yet happened; no relief can ghost through it.

**Rising dollars, UP: the deed-stacks (cinematographer's material, visitor's geometry).** At act6 only, the ledger, climb, and bridge figures rise as HTML towers, absolutely positioned by the same resolved anchor-percentage math the notes already use, counter-rotated `rotateX(calc(-1 * var(--tilt)))` with transform-origin bottom, so they stand truly perpendicular to the tilted sheet. No in-plane fake axonometry anywhere (that double-projection flaw killed the drawn-prism variants). Each tower is styled as a countable stack of paper slivers via a repeating gradient, one sliver equals a fixed disclosed dollar amount printed on the face with its source. Anchors: North Lawndale (contract-sale extraction) and East Woodlawn (the 2026 figures). Towers derive position from resolved CameraState only and hide during tweens. Grades may never rise; dollars may never press. That seam is stated on the page as a one-line legend near a3-s2 and act6.

**Where the language deliberately does not appear.** ch4 (see section on the memorial inside the camera plan; registry-enforced flag). All document scenes, plumb and flat. The register wall, plumb (its bars take the deboss for material cohesion, but no tilt, no towers). The flood, flat: the inking is the event, the table does not move. Every long-reading state: tilt occurs at exactly three events on the whole page (ch1, a4-clearance, act6), so it stays an event, never a texture.

---

## 3) The camera plan, act by act

**Engine.** Every one of the 54 steps resolves to a CameraState `{frame, cx, cy, w, tilt, spot, press, towers, marksMode}` in one registry table. Zoom runs as the FLIP hybrid: a CSS transform transition (900ms, `cubic-bezier(0.22, 1, 0.36, 1)`) on a single inner `g[data-camera]`, then the true viewBox snaps in on settle and the transform clears so vectors re-rasterize crisp. **Interrupted-tween handling (the flaw review 2 caught): listen for `transitionend` AND `transitioncancel`, plus an rAF watchdog at duration + 100ms; on retarget mid-flight, read the computed transform, snap it as the new origin, and retarget.** Micro-layers (section grid, whisper fabric) hide behind a `data-tween` flag during flight. Linework uses `vector-effect: non-scaling-stroke`. Spotlighting is the technologist's veil: one paper-toned evenodd path (frame rect minus a precomputed hole per named target), opacity-composited, no filters near the 694 paths. Cross-frame changes are the second-sheet cut: a 300ms paper slide as the township plat is laid on the desk.

**Two laws, registry-encoded so they cannot regress (scenographer):** the **arrive-early rule**, no camera move ever lands on a solemn or load-bearing beat, the move spends itself on the preceding step; and **no scroll-linked transforms anywhere**, moves fire once on step entry.

- **Act 0 (ch0, a0-charge, a0-locate).** First paint: flat, plumb, citywide, full ground stack (lake, fabric, deepened pigments, plate-mark, title block), zero transform, zero filter in the critical path. The SSR win is preserved exactly. "Take the grades away" ghosts the five fills in place (opacity only; they do not slide up, up belongs to dollars). a0-locate cuts the veil hole to the visitor's own community area.
- **Act 1 (ch1-ch3, a1-plat, a1-fair, a1-wells).** Second-sheet cut to the township plat. ch1 is tilt event one: 10deg raking lean over the 1832 ground (shoreline, PLSS section grid drawing itself in west to east, township boundary), then back plumb. At the 1893 beat the camera pushes 20 percent tighter as Jackson Park, Washington Park, and the Midway print; a1-fair holds the veil on the real Jackson Park footprint, labeled as where the fair stood. a1-wells returns plumb and wide.
- **Act 2 (a2-overture, a2-register, then ch4).** Second-sheet cut back to citywide, camera wide. The map pane holds the grounded plate (lake, whisper fabric, era readout) for the whole register wall sequence; never bare cream again. **The step before ch4 completes the cut to a recomposed Black Belt crop and settles plumb, so entering the memorial involves zero motion.** ch4 itself: no viewBox change, no tilt (hard-locked 0 by the memorial flag), no veil, no press (which does not yet exist), transitions suppressed inside the stage. The only permitted event is the existing slow opacity reveal of the marks and the dashed commission square, a cut under reduced motion. The composition fix is a wider, east-shifted crop constant so the 32 marks and the square sit right of center with air. Dead counted, not named.
- **Act 3 (ch5, a3-deed, a3-article34, a3-s1, a3-hansberry, a3-cases, a3-flood f1-f3, a3-s2).** ch5 pushes to a close south-side camera; the marks run **semantic zoom (visitor)**: a labeled count badge at citywide ("32 bombings, 1917 to 1921") that resolves into individually readable, tappable dots (radius floor 4.5 screen px, set per state by the controller) as the camera arrives; veil on Binga's block. Document steps: plumb, flat, frontal. The flood: **three discrete per-step eases, not one scroll-spanning move**: f1 tight on the first filed sheets in the Black Belt, f2 mid pull, f3 lands citywide exactly as the map completes; batches enter with the wet-ink settle (dark flash to resting tone, 600ms) in true filing order while the title block's filing counter ticks through the real sheet dates. a3-s2: plumb, flat, THE PRESS.
- **Act 4 (ch8, a4-clearance, a4-baldwin).** Second sheet back onto the desk; township frame with parks, streets, boundary. a4-clearance is tilt event two, a mild 10deg examination. **No renewal-area footprint or spotlight hole is drawn unless the boundary is sourced from the city data portal as an R10 sourcing task; until then clearance is carried by text and the era ground.** (This kills the internal inconsistency two concepts shipped.)
- **Act 5 (a5-basement, a5-twobuyers).** Citywide, plumb; veil hole cut to the North Lawndale community-area polygon (real geometry we hold). Document scenes flat.
- **Act 6 (ch11, a6-ledger through a6-colophon).** Tilt event three: 22deg as the deed-stacks rise at North Lawndale and East Woodlawn, built in discrete steps, big number posting first and axis context drawing in beneath it (scenographer's staging). a6-climb is the visitor's cross-section: one pressed bar against one rising stack with a physical bracket labeled "three times the Black median." a6-sum returns plumb, flat, citywide, full stack, rust ring, the one-map read. a6-receipt and a6-colophon: plumb; the colophon eases the sheet flat and wide, the document laid back down, mirroring ch0.

**Reduced-motion resolution.** Every step is a discrete resolved CameraState; `prefers-reduced-motion` (checked via media query AND matchMedia in the tween engine) sets every transition, the press deepen, the wet-ink settle, and the tower builds to none. Keyboard, phone, and reduced-motion visitors land on pixel-identical resolved states. A static tilt is a state, not a motion, so it still renders. **Non-visual parity (the gap all six missed): each step's registry entry gains an sr-only resolved-state sentence (era, frame, what is spotlit, what stands), and the union band, press, and towers each carry aria text stating the claim in words ("From 1921 to 1970 no year passed with every instrument off").** The verify suite asserts the resolved CameraState, the sr-only text, at least two visible ground strata, and the minimum mark size, per step, all 54, at both widths (scenographer's bare-cream assertion merged with the visitor's snapshot table).

---

## 4) The ground plane per era

Hard rule, verify-enforced: minimum visible state is **desk + sheet + lake + title block**. Bare cream becomes impossible. Every layer carries a `data-source` attribute and a line in the colophon; sources also print in the title block.

| Era / states | Ground stack |
|---|---|
| Always | Cream-dark desk, plate-marked sheet, Lake Michigan as true polygon from the eastern hull of community-areas.geojson, filled with water-lining (horizontal hairline pattern, a period engraving convention on real geometry), corner plat title block (era, frame, sources, disclosure) |
| 1832-1889 (ch1, a1-plat) | + PLSS mile section grid (the 800-units-per-mile State/Madison arithmetic already trusted for bombing geocoding; the grid IS the 1830s instrument) + township boundary. Deliberately no community fabric; it is a modern index and would fake period detail |
| 1893 (ch2, a1-fair) | + Jackson Park, Washington Park, the Midway from parks-cpd.geojson and the 55 cached hp-frame-layers polygons, hatched in a neutral ink-olive (exh-green stays reserved for the CBL credit); the fair labeled on Jackson Park's real footprint |
| 1900-1933 (ch3, ch4, ch5, covenant beats) | + the 77 community areas as whisper hairline fabric + major-streets.geojson at low ink inside close crops. ch4 renders exactly this fabric at its existing dim treatment, unchanged |
| 1934-1948 (a3) | + HOLC linework and grade fills, flat ink through the flood, pressed from a3-s2 onward |
| 1949-1963 (ch8, act4) | Township sheet: lake, section grid, the 55 park polygons, streets, boundary. Renewal footprint gated on sourcing; omitted rather than faked |
| 1966-1970 (act5) | Citywide with North Lawndale CA polygon as veil target |
| 1971-2026 (ch11, act6) | Full stack + rust today ring (rust appears on the map only here) + towers on money beats |

Mobile ships the identical strata. SSR budget: simplified topology, under 25KB gzipped added HTML; geometry.json stays out of the client bundle.

---

## 5) The register redesign

Unanimous across six concepts, so it ships first-class. Two surfaces, one grammar, with **the baton dates corrected** (review 3 caught that 1948-to-renewal and 1950-to-contracts connect dying instruments to successors not yet running; batons must point at instruments actually running at that date).

**The docked strip** grows from cryptic hairlines to a 44px instrument (32px mobile). Desktop: a 1900-2026 year rail with decade ticks; five 5px lanes labeled by short words in plat caps (RULE, DEED, MAP, BULLDOZER, CONTRACT), full spans ghosted, elapsed story portions in solid ink (no more grows-as-you-go ribbon, which reads as an unfinished render); beneath them the **UNION BAND**, the computed boolean union of the five real intervals, one unbroken 6px near-black bar labeled NO YEAR OFF, 1921-1970 inside it; an ink caret riding the story year, turning rust exactly once, at 2026. Mobile: the union band, the rail, and the caret only; tapping opens the five-lane wall as a bottom sheet (tap, not hover; phones have no hover). Two-second stranger read: five named bars collapse into one long dark bar, and a caret says where you stand in it.

**The wall (a2-register)** keeps its studied layout. Bars take the deboss so the instruments share the plate's material. Each lane: full name, begin and end year ticks, the court event that ended it engraved at the end cap (unenforceable 1948, written out 1950, outlawed 1968). At each closure a **baton-pass vertical** drops from the dying bar to a bar actually running that year: 1948 covenants down to redlining, 1950 the rule down to redlining, 1968 redlining down to renewal, 1970 contract selling down to renewal. Every baton is a pair of true dates. Beneath the five, the union band prints itself left to right on arrival (resolved instantly under reduced motion), with the sentence "no year the machinery was off" set inside the drawn bar rather than in a paragraph below. Sr-only text states the full claim. The ledger rail adopts the wet-ink posting treatment so all page chrome joins the one arrival grammar; the left-edge spine is already within-language and stays.

---

## 6) Grafted ideas from losing concepts (attributed)

- **The press moment** (conservator): relief absent until a3-s2, arriving as one discrete stamp.
- **The plumb rule** (conservator): tilt as grammar; memorial, documents, receipt, colophon always plumb, registry-enforced.
- **The second sheet** (conservator): cross-frame cuts staged as a physical second document on the desk; the honest zero-reprojection answer.
- **The arrive-early law** (scenographer): no move lands on a solemn beat, encoded in the registry.
- **The bare-cream verify contract** (scenographer, merged with the visitor's resolved-states table): per-step assertions of CameraState, two-plus ground strata, minimum mark size, sr-only text.
- **Semantic zoom for the 32 marks** (visitor): count badge resolving to readable, tappable dots; more honest than pretending sub-pixel dots read.
- **The cross-section climb and union-band dock** (visitor).
- **Deed-stack material** (cinematographer): countable slivers with a disclosed per-sliver value, applied to the visitor's correctly counter-rotated HTML towers.
- **The plat title block and tap-to-raise** (cartographer): era, frame, sources, and the R7 disclosure as period furniture; tapping any of the 694 areas lifts it one depth step and prints its record in the title block. **Extended per review 1's catch: the tap also prints the surveyor's actual words from public/exhibit-data/holc-descriptions.json, the cheapest fully honest route to the owner's hyper-detailed ask, already sitting in the repo unused.**
- **Wet-ink state grammar and the filing counter** (cartographer; counter also cinematographer and technologist): one arrival treatment page-wide, and the flood's batch order made countable.
- **The veil loupe and margin discipline** (technologist, with the cinematographer's opacity-only rule): spotlights without filters near the tap targets.
- **Big-number-first chart staging** (scenographer) for a6-ledger, a6-climb, a6-bridge.

---

## 7) Killed ideas, with reasons

- **Citywide-to-township continuous zoom / frame reprojection** (scenographer, cinematographer, visitor's fixed-viewBox variant). Constraint: the two frames are separately pre-projected coordinate spaces; tweening between them sweeps misregistered geometry, and reprojection is the round's biggest unproven bet. The second sheet replaces it.
- **Tilted first paint at 18deg with a whole-SVG drop-shadow** (scenographer). Constraint: puts a perspective transform and an SVG-wide filter in the SSR critical path, and hiding labels under tilt yields a label-less opening. First paint stays flat.
- **Rust playhead / rust now-line on the strip** (scenographer). Constraint: rust means present-day only. The caret is ink until 2026.
- **The Loop-anchored citywide-gap tower** (scenographer). Constraint: pins a non-geographic aggregate to a place; brushes real-data honesty.
- **In-plane isometric SVG prisms under real perspective** (cartographer, conservator, cinematographer's flat deed-stacks). Constraint: double projection; only counter-rotated HTML stands honestly off a rotated plane.
- **The renewal-boundary spotlight and clearance hatch as drawn** (cartographer, visitor, cinematographer). Constraint: no such geometry in the verified materials. Gated on an R10 sourcing task; omitted until then.
- **Grade groups sliding UP at "take the grades away"** (cinematographer). Constraint: breaks the page's own up-is-dollars grammar. They ghost in place.
- **The one continuous scroll-spanning flood pull-back** (scenographer, visitor as written). Constraint adjacency: reads as scroll hijack. Decomposed into three discrete per-step eases.
- **30deg desktop tilt** (cinematographer). Taste and legibility: past the angle where the composition holds; 22deg is the ceiling.
- **The 64px dock** (cartographer, conservator). Constraint: eats the mobile viewport; 44/32 with the tap sheet.
- **Hover-expanded dock lanes** (technologist). Constraint: no hover on phones.
- **The grows-with-the-story dock ribbon** (technologist). Taste: reads as an unfinished render, not a device.
- **Deckle edges, paper grain, wood or table texture** (conservator's grain, scenographer's flagged risk). Taste: skeuomorphic rot; all depth comes from light and the plate-mark, nothing else.
- **The transcribed HOLC title-block inscription** (cinematographer). Constraint: asserts an archival transcription not in the verified materials. The title block ships with our own sourced furniture; the inscription may join it only if sourced.
- **WebGL anything.** Constraint: second renderer, split material language, killed in R7 and stays dead.

---

## 8) Build order with risk ranking

Three gates; a partial ship at any gate boundary is still a coherent ship. Performance gate for the whole program, named once and enforced at gates 2 and 3: **on an iPhone 12-class Safari device, median 55fps during any 900ms tween, no frame over 50ms, press filter static-only; failure at the gate swaps the intaglio to the offset-stroke fallback before anything else is cut.**

**Gate 1, the ground and the register (lowest risk, kills the owner's top three complaints).**
1. Ground strata + lake + plate-mark + title block, all eras, both frames, both widths. Risk: LOW. Pure SSR layers from held geometry.
2. Register rebuild: dock, wall, union band, corrected batons, ledger-rail wet-ink, sr-only claims. Risk: LOW. Drawing and dates, no motion tech.
3. Verify-suite extension: CameraState + strata + mark-size + sr-only assertions across all 54 steps. Risk: LOW, and it protects everything after it.

**Gate 2, the camera and the marks.**
4. FLIP camera engine with interrupted-tween handling, registry CameraStates, arrive-early law, second-sheet cuts, reduced-motion pathway. Risk: MEDIUM. The one genuinely new mechanism; Safari transform profiling lives here.
5. Veil spotlight system + semantic zoom marks + a0-locate loupe. Risk: LOW-MEDIUM. Precomputed holes, controller-set radii.
6. Flood recut: three discrete eases, wet-ink entrances, filing counter. Risk: MEDIUM. Choreography over existing batch data.

**Gate 3, the depth and the bill.**
7. Intaglio filters on the five fills (U flat), THE PRESS at a3-s2, disclosure line, tilt events at ch1 and a4. Risk: MEDIUM. Bounded (five paths), gated by the device test, fallback pre-built, blind taste test on d-ch0 / d-a3-s2 before act-wide lock.
8. Act6 deed-stack towers, cross-section climb, big-number-first staging, 22deg finale. Risk: MEDIUM-HIGH. HTML-over-SVG registration across crops is the page's finickiest surface; towers derive from resolved states only and hide during tweens.
9. Tap-to-raise + surveyor descriptions in the title block. Risk: LOW. Data already shipped to the client.
10. Mobile pass as design, not degradation: 8deg cap, union-band dock with tap sheet, mobile act6 composes the cross-section flat inside the pane while desktop stands the towers (same figures, same resolved states). Risk: MEDIUM, mostly layout time. Walk every m-* screenshot against the new verify contract before ship.

If the schedule bites, the cut order is: tilt events (ship static plumb everywhere) first, wet-ink grammar second. Never the ground strata, never the union band, never the semantic zoom. Those three are where the owner's verdict changes.