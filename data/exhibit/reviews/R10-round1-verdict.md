# R10 Consolidated Punch List

## P1

- **flip-camera-cut** · p1 · `src/components/exhibit/ground/engine/camera.ts` go() + `StageController.tsx` applyDerived · *(technologist x3, merged)*
  Every within-frame zoom-in starts by hard-cutting to the destination viewBox on the svg element, deleting the rest of the city (flight opens on blank linen with a floating postcard), labels snap to 1/4 size at t=0; every zoom-out paints the unclipped flying sheet over the desk, pane border, and reading column for ~900ms; camera-anchored HTML (marks badge, stage note) jumps to destination coordinates at flight start.
  **Fix:** FLIP an inner `<g>` wrapper, not the svg element (set destination viewBox, apply inverse transform to the group, transition to identity; clipping stays at the svg viewport), and defer the `--gtext-k`/`--gsv` writes plus badge/note visibility to settle (hide behind `data-tween` like the towers).

- **press-inverted** · p1 · `StageBase.tsx:59` ground-press filter · *(technologist)*
  The intaglio feComposite operands are swapped (`in="blur" in2="SourceAlpha" operator="out"`), producing an outer drop shadow, so every graded fill reads as a plate raised off the paper. That inverts the binding R10 metaphor (policy presses down, only dollars rise) and gives the grades the register reserved for the towers.
  **Fix:** Swap to `<feComposite in="SourceAlpha" in2="blur" operator="out"/>` for a true inner shadow, re-shoot a3-s2, and eyeball a D area against a raised control.

- **rust-ledger-years** · p1 · `src/app/globals.css:847` `.glr-year` · *(cartographer, conservator, phone visitor)*
  The docked ledger rail prints every historical entry year (1833 through 1971) in rust `#A8502F` on every screen, including the ch4 memorial. Hard pigment law says rust means present-day only, with exactly two exceptions. The page chrome contradicts the color grammar the finale depends on.
  **Fix:** Set `.glr-year` to `var(--color-exh-ink)`; allow rust only via a `data-now` attribute set in LedgerRail.tsx when the posted entry year is 2026, and assert the rust register in the suite.

- **wall-bar-overrun** · p1 · Register wall (d-a2-register) and the docked rail summary bar on every d-* shot · *(cartographer)*
  The black bar labeled "NO YEAR OFF, 1921 TO 1970" is drawn from 1921 to the 2026 axis end, 56 years past its own label, on the exhibit's central quantitative claim, repeated on every view.
  **Fix:** End the solid bar at the 1970 tick; if an instrument genuinely runs to now, draw a visually distinct second segment (open or hatched) with its own label and anchor the chip on the solid segment only.

- **flood-stations** · p1 · `data/exhibit/ground-copy.json` a3-f1/f2/f3 + `exhibit-ground-prep.mjs` · *(cinematographer p1, conservator p2, merged)*
  The verdict's three-ease flood pull resolves as two states: a3-f2 sets cam "wide" so f2 and f3 are pixel-identical, and the payoff gets no arrival. Worse, the a3-f1 sr claims "the first filed sheets ink the South Side" while zero of the 35 Sept 1939 areas fall inside the southSide box, so the opening event happens off-screen.
  **Fix:** Emit two real focus boxes from the prep script (f1 aimed at the Sept 1939 batch extent, f2 a south-half mid pull), leave f3 wide, reword the f1 sr to match what is drawn, and add a3-f1/f2 shots plus resolved-camera assertions.

- **mobile-finale-clip** · p1 · m-a6-bridge, m-a6-ledger, m-a6-climb · *(phone visitor)*
  The Woodlawn tower cap plate, the one sanctioned rust cap carrying the $440,000 headline, is clipped by the viewport top for all three act-6 resolved states on mobile. The number the exhibit builds to never reads on a phone.
  **Fix:** At the phone breakpoint clamp deed-stack height/scale or pan the act-6 camera south so the cap plate resolves fully inside the stage frame below the era readout.

## P2

- **suite-blind** · p2 · `scripts/exhibit-scenarios.mjs`, `scripts/exhibit-shots.mjs` · *(technologist, conservator, cinematographer, merged)*
  The suite shipped the inverted press green (only asserts `filter.includes("url")`), never observes a mid-flight frame, has zero act-6 tower coverage, no resize scenario, no arrive-early data lint despite design.md claiming one, and the shot list is hand-maintained (6 steps missing at both widths, including two where defects live).
  **Fix:** One hardening commit: feComposite operand assertion, one ~150ms mid-tween frame probe, a money-beat block (tower presence, ring alignment, one rust cap, legend), resize re-derivation check, arrive-early lint over RESOLVED_STEPS covering cam AND frame/dim deltas, rust-year and mobile-disclosure asserts, and shots enumerated from ground-copy.json so a missing shot fails the run.

- **counter-703-sheets** · p2 · `StageController.tsx:336` filing counter, suite lock at `exhibit-scenarios.mjs:389` · *(cartographer, cinematographer, conservator)*
  The counter calls all 703 flood ids "sheets" while the colophon and GradeFlood panel in the same viewport say 576 sheets (the true count), and the final label reads broken ("sheets filed through undated sheets. 703 of 703", wrapping mid-count).
  **Fix:** Count what it counts, "areas graded ... N of 703", give the last batch a truthful one-line label ("through Apr 1940, plus undated"), reconcile the 9 pathless ids, and update the suite assertion in the same commit.

- **township-mislabel** · p2 · `FRAME_LABEL` in StageController.tsx:55, ground-copy.json ch1/a4/a6-sum, StageBase.tsx citywide boundary ghost · *(conservator, cinematographer)*
  The boundary called "HYDE PARK TOWNSHIP" is, per its own source record, the modern community-area polygon; the historic 1861-1889 township was ~30x larger. The a6-sum closing copy then points at a citywide "township line" ghost that is a ~16px rectangle drawn under the fills, effectively unfindable and possibly the wrong geometry for the sentence.
  **Fix:** Rename the plate to HYDE PARK, reword a4/a6-sum to "the Hyde Park line / this neighborhood", name the community-area boundary as such in the colophon, and give the citywide ghost legible ink above the fills so the closing sentence lands.

- **ch4-arrive-early** · p2 · ground-copy.json ch4 stage, StageController frame-cut branch · *(cinematographer)*
  The verdict says the step BEFORE ch4 completes the cut to the Black Belt crop so the memorial entry has zero motion; as shipped, the frame cut plus dim land ON ch4, satisfying the no-cam-change law on a technicality because frame is a separate field.
  **Fix:** Land `frame: "blackBelt"` + dim on a2-s1 (or a text-light pre-step), leaving ch4's entry with only the permitted marks reveal; extend the arrive-early suite check to frame/dim (folds into suite-blind).

- **a3s1-carry-zoom** · p2 · ground-copy.json a3-s1 (no stage, carries bombingField cam) · *(cinematographer)*
  The county-wide claim ("hundreds of Cook County subdivisions") plays at the page's tightest zoom for three steps because the camera carries forward, then the pull-back spends itself on ch6's chapter head.
  **Fix:** Add `cam: "wide"` to a3-s1's stage so the widening claim gets the widening frame and ch6 arrives static.

- **binga-veil-missing** · p2 · geometry.json veilHoles, types.ts VeilTarget, ch5 stage · *(cinematographer)*
  The verdict's ch5 veil on Binga's block does not exist anywhere in the build, and design.md falsely claims the prep script emits it. A silent deviation from the binding plan, undocumented.
  **Fix:** Emit a bingaBlock hole from the already-geocoded bombing rows (real geometry only) and wire it into ch5; if it cannot be honestly derived, record the omission in design.md like the streets/renewal gates.

- **tower-shear** · p2 · globals.css `.gtower` (no transform transition), `.ground-towers` opacity target mismatch · *(cinematographer, technologist)*
  During the a6-bridge lean the sheet tweens 700ms but the counter-rotation is static, so towers shear backward mid-flight and snap plumb at settle; towers also pop back after tweens because the opacity rule and transition live on different elements.
  **Fix:** Give `.gtower` (and the legend chip) `transition: transform 700ms cubic-bezier(0.22,1,0.36,1)` matching `.ground-sheet`, and move the opacity transition onto `.ground-towers`.

- **climb-empty** · p2 · `Climb.tsx` PAPER_BAR fill vs page linen · *(cinematographer)*
  Mid-track the white-median column's fill is near-identical to the page background, so roughly four viewports of the climb render as two hairline borders around whitespace. The thing whose height is the argument frames nothing.
  **Fix:** Fill the white column with the towers' SLIVER_STACK repeating gradient (same act-6 material grammar) so every mid-climb viewport contains countable material.

- **mobile-disclosure-hidden** · p2 · globals.css:1243 `.gtb-disclosure { display:none }` under 1024px · *(conservator)*
  Every phone visitor gets the depth encoding with the R7-mandated rank disclosure never printed. Breaks the honesty ruling and phone parity for an entire device class.
  **Fix:** Remove the display:none and let the line wrap at reduced size (it fits at 210px/9px), asserted in the mobile suite.

- **equal-steps-false** · p2 · StageBase.tsx PRESS_DEPTH vs disclosure wording · *(conservator)*
  The disclosure says "four equal steps" but the drawn depths (0.6/1.1/1.7/2.4) and the opacity ladder are unequal. A false word inside the honesty instrument itself.
  **Fix:** Drop "equal" ("four ranked steps", matching the a3-s2 sr), or make the ladder truly equal (0.6/1.2/1.8/2.4); either passes the existing suite.

- **ch1-sr-boundary** · p2 · ground-copy.json ch1 (sr vs `boundary:false`) · *(cinematographer, conservator)*
  The ch1 sr tells non-visual visitors the township boundary is drawn; it is not (and an 1861 boundary on an 1833 plat would be anachronistic anyway). A screen-reader lie on the first camera event.
  **Fix:** Strike "and the township boundary" from the ch1 sr, keep its true first appearance at a1-s2, and add the sr/state parity assertion to the suite.

- **wall-annotation-collisions** · p2 · InstrumentRegister.tsx (d-a2-register rows C/M/S; m-a2-register wraps) · *(cartographer, conservator, phone visitor)*
  Relay connectors drop straight through "the deed" and graze "unenforceable 1948"; the endnote and alias share a baseline; at 390px the court phrases wrap into orphan lines floating in space. Legibility failures on the argument-in-one-figure wall.
  **Fix:** Paper-colored halos behind annotations plus a few-pixel connector offset on desktop; at the phone breakpoint give end-cap phrases their own right-aligned line under the bar's end.

- **s-row-2008-undrawn** · p2 · Register wall row S · *(cartographer)*
  "returned after 2008" floats with no bar, tick, or segment drawn at or after 2008, the exact stated-but-not-drawn failure R9 flagged on this panel.
  **Fix:** Draw a hatched/open S segment from 2008 to the axis end, bound to the registered fact that sources the return.

- **finale-label-collisions** · p2 · d-a6-ledger overlays vs base labels · *(cartographer)*
  The $440,000 card and both towers sever four base labels (orphaned " MICHIGAN", "PARK", "THE LO", "NORTH ... NDALE") on the most photographed state of the page.
  **Fix:** When towers/cards are active, suppress the base-map labels they intersect (controller already has the geometry to test intersection).

- **hyde-p-clip** · p2 · bombingField camera, d-ch5/d-a3-s1, label counter-scale in globals.css:1298 · *(cartographer, cinematographer)*
  HYDE PARK renders as "HYDE P", sliced by the pane edge, on screen for four consecutive steps at the marquee zoom.
  **Fix:** Per-focus label gate, hide (or nudge) labels whose anchor falls within its text width of the crop boundary, via a data attribute the controller can already compute.

- **ch8-renewal-undrawn** · p2 · d-ch8, ground-copy.json ch8 · *(cartographer)*
  "THE RENEWAL PLAN LAY INSIDE THIS TOWNSHIP" floats over an unchanged parcel field with nothing drawn, and the grade-depth disclosure persists in a grade-free state.
  **Fix:** Demote the sentence to the plate footer as a caption and gate the depth disclosure to `data-press="on"` states (digitizing the 1958 boundary is declined below).

- **plss-grid-water** · p2 · d-a0-r3 · *(cartographer)*
  The PLSS section grid is clipped to a data bbox, gridding open Lake Michigan and stopping at an unexplained bare strip down the west edge. The 1830s survey instrument drawn dishonestly.
  **Fix:** Clip the grid to the shoreline and extend to the neatline on the west (or clip to the documented surveyed extent and draw that boundary).

- **mobile-chapter-anchors** · p2 · m-ch0/ch1/ch4/ch5/ch9 · *(phone visitor)*
  Mobile chapter-boundary resolved states start mid-sentence (ch0) or leave half the viewport blank cream with the kicker pinned at the bottom edge; keyboard/reduced-motion users land exactly there. Verify whether the ch4/ch5 archival image failed to render at capture.
  **Fix:** Retune mobile step anchoring and pre-chapter spacers so each chapter resolves with kicker and heading in the upper half beneath the dock, ch0 at the top of the title block.

- **reported-chip-occluded** · p2 · m-a6-bridge, fixed ledger N button · *(phone visitor)*
  The N button sits on top of the REPORTED source-status chip under the $440,000 sentence, hiding the real-data disclosure exactly where a skeptic checks sourcing.
  **Fix:** Bottom clearance on the steps pane equal to the button diameter plus margin at the phone breakpoint (or render source chips inline at sentence end).

- **safari-pass** · p2 · whole R10 surface, no WebKit evidence · *(technologist)*
  R10 stacks CSS transform readback, SVG url() filters inside preserve-3d, and non-scaling-stroke, three of WebKit's flakiest features, and all evidence is headless Chrome.
  **Fix:** One manual Safari + iOS Safari walk of ch1, ch5, a3-s2, and act 6 before ship, with the pre-built offset-stroke deboss fallback wired behind a capability check if filters misbehave; record the pass in build state.

## P3

- **rust-on-red-tag** · p3 · d-a6-sum, d-a6-ledger, m-a6-sum · *(cartographer, conservator, phone visitor)* The EAST WOODLAWN 2026 rust tag sits on D-red with a weak halo, the Woodlawn tower plants over the ring, and at 390px the ring is a 3-4px fleck the copy asks you to find. **Fix:** thicken the linen halo and offset the tower base a few viewBox units; scale the ring and label up at the phone breakpoint for a6-sum.
- **anachronistic-labels** · p3 · d-ch1, d-a0-r3 · *(cartographer, cinematographer)* THE MIDWAY on the 1833 sheet, THE LOOP on the 1832 sheet, against the strata table's own no-faked-period-detail rationale. **Fix:** era-gate the hp/city label layers like parks (MIDWAY from 1893 on).
- **ch0-neatline-bleed** · p3 · d-ch0 · *(cartographer)* Lake fill bleeds past the inner neatline top-right with the 1940 stamp astride it. **Fix:** clip the water polygon to the neatline rect, keep the stamp fully in the margin.
- **ch4-stamp-legibility** · p3 · d-ch4 · *(cartographer, scope-reduced)* The 1917 stamp is dark-on-dark with its last digit overhanging the corner. **Fix:** lighten or halo the stamp and keep it inside the corner (recomposition declined below).
- **orphan-square** · p3 · d-a2-register map pane · *(cartographer, scope-reduced)* An unlabeled square outline floats under HYDE PARK in the overture state. **Fix:** suppress the today-ring anchor until its chapter.
- **plate-caption-camera** · p3 · d-ch5 caption, d-a3-flood cards · *(cartographer)* The tight commission-square zoom still carries the citywide plate title, and paired cards mix "Filed Jan'40" with "Filed November 1, 1939". **Fix:** bind the plate caption to camera state and normalize both cards to the long date form.
- **act1-push-unrecorded** · p3 · StageController resolveBox, design.md · *(cinematographer)* The verdict's 1893 20 percent push was dropped silently; the hydePark frame has no camera capability. **Fix:** record the cut in design.md alongside the streets/renewal gates (implement hpFocus only if a later round reopens act 1).
- **gtext-k-letterbox** · p3 · StageController.tsx:128 · *(technologist)* Counter-scale uses width ratio but the home crop is height-constrained, so close crops oversize type by up to 44 percent. **Fix:** compute from meet scales, kHome/kTo with k = min(paneW/w, paneH/h).
- **ssr-double-payload** · p3 · StageBase/GroundShell SSR · *(technologist)* 1.07MB HTML from the StageBase subtree serialized twice plus duplicated path d strings. **Fix:** swap duplicate fill/pattern paths to `<use>` now, add a page-size gate to the suite, and note the RSC restructure as follow-up.
- **small-pops** · p3 · globals.css R10 block, StageController veil, LedgerColumn portal · *(technologist)* Sheetcut-into-tilt plays a ~1deg backward jump; veil clears its d before the 450ms fade; DollarTowers reads towersSlot.current during render (latent portal bug). **Fix:** suppress the transform transition while data-sheetcut is on, reorder veil writes (opacity first, clear d after), hold the slot in state via callback ref.
- **mobile-caret-clamp** · p3 · m-a0-charge, m-ch1, m-ch2 · *(phone visitor)* Pre-1900 story years all clamp to the 1900 tick, three different years at one position. **Fix:** hide the caret tick for pre-rail years and show the year chip alone flush left.
- **dock-tap-hint** · p3 · mobile dock, all m-* shots · *(phone visitor)* No affordance that the dock opens the five-instrument sheet; it reads as a static graphic. **Fix:** a subtle chevron or FIVE INSTRUMENTS tap hint at the right end of the strip on phones.
- **entry11-parity** · p3 · m-a6-ledger vs d-a6-climb · *(phone visitor)* Entry 11 has two texts ("The bill still outstanding" vs "The century's bill, still outstanding"). **Fix:** one string at both breakpoints, asserted in the suite.
- **north-lawndale-plate** · p3 · LedgerColumn.tsx DeedTower place · *(conservator)* The tower plate says LAWNDALE while map, ledger, and sr say North Lawndale, which is what the Duke study covers. **Fix:** change place to "North Lawndale", keep the plate shift.
- **legend-label-overlap** · p3 · m-a6-bridge/ledger/climb · *(phone visitor)* The mandated sliver legend covers the stage label's last letters at 390px. **Fix:** stack the legend on its own line above the stage label at narrow widths.

## DECLINED

- **ch4 memorial recomposition west** (cartographer): taste-only; the memorial crop is law-sealed and suite-enforced, and re-cropping the one hard-frozen state risks more than empty lake costs. Stamp legibility kept as ch4-stamp-legibility.
- **Rail letter-chip key on first appearance** (cartographer): the R/C/M/S/U chips are defined at the register wall; a persistent key adds dock chrome to every pre-act-2 screen and fights the two-second read more than mild foreshadowing does.
- **Digitizing the historic 1861-1889 township polygon** (conservator alternative fix): hand-tracing a boundary with no sourced geometry strains the real-data rule; the wording fix in township-mislabel resolves the dishonesty.
- **Digitizing the 1958 renewal-area boundary** (cartographer alternative fix in ch8): same reason; footer demotion chosen.
- **55fps tween gate measured in the suite** (technologist sub-item): frame timing in headless CI is noise, not evidence; check perf once by hand during the safari-pass walk instead.
- **Note for all lenses:** no lens flagged the Next.js dev badge, correctly; had any, it is a dev-mode artifact and never a finding.

## VERDICT

**Another full round needed.** Two of the p1s (flip-camera-cut, press-inverted) change what every frame and screenshot shows, the flood restaging adds new camera states and new evidence, and the verify suite was demonstrably blind to all of them. Fix p1+p2, harden the suite per suite-blind, regenerate the complete shot set at both widths from an enumerated step list, run the Safari pass, and re-audit before ship.