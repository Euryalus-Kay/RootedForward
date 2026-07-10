# R9 research memo. What the best displays actually do

First-hand research pass, 2026-07-10, done by the lead before the design doc.
Sources reviewed directly: the Pudding's responsive-scrollytelling process
piece, SIGGRAPH and OJA write-ups of the NYT Greenwood reconstruction, NN/g
on scrolljacking, MDN and Chrome documentation on CSS scroll-driven
animations, EJI's Lynching in America case studies (Stink Studios, Liz
Wells), Segregation by Design, Serrell's exhibit-label literature, and the
GSAP image-sequence scrubbing documentation.

## The ten laws this build follows

1. **The Tse law.** NYT measured that only 10 to 15 percent of readers touch
   an interactive; 85 percent never open a tooltip. Archie Tse's rule at
   Malofiej: "If you make a tooltip or rollover, assume no one will ever see
   it. The default state has to be really rewarding for people who never go
   beyond looking at it and scrolling." Consequence for us. The scroll path
   IS the exhibit. Every argument must land for a visitor whose only input
   is a thumb flick. Taps add depth; they never carry the argument.

2. **Space beats statistics (the Greenwood precedent).** The NYT team found
   that "seeing the spatial geometry of it grasped the scale in a different
   way." They OCR'd the 1921 city directory so each reconstructed building
   carried real names and businesses; the emotion came from naming, not from
   totals. The judges' verdict called it show-don't-tell storytelling. We
   hold the same materials for Chicago. 703 graded areas with the surveyors'
   own sheets, 40 bombing incidents with street addresses, a contract
   ledger. The move is to put the record ON the ground, named, at its real
   location, and let totals arrive only after the visitor has seen instances.

3. **Only scroll-animate what changes in time or space.** The Pudding's
   test. Keep a scrollytelling scene only when the transition itself carries
   meaning (change over time, movement through space); otherwise stack
   static frames. Our subject is literally the same ground changing across a
   century, the strongest possible case for one persistent scene. But
   chapters that are documents (the paperwork, the cases) may read better as
   crisp stacked frames than as forced animation.

4. **Never take the wheel.** NN/g's scrolljacking studies: users get
   disoriented, task-oriented users leave, accessibility breaks. Everything
   we do rides native scroll with `position: sticky`. No hijack, no
   steppers, no swipe overrides, no pinned sections that eat more than
   roughly two viewports of scroll without visible progress.

5. **The platform does the animation now.** CSS scroll-driven animations
   (`animation-timeline: view()` and `scroll()`) are production-real in
   2026 (Chrome 115+, Safari 18+, Firefox since late 2025), run on the
   compositor thread, and stay at 60fps on mid phones when they animate
   only transform and opacity. Build the choreography in CSS with
   `@supports` guards and an IntersectionObserver fallback; reserve React
   state for discrete scene changes. Reduced-motion users get the final
   frame of every scene, always legible standalone.

6. **Phones get an honest alternative, not a shrunken map.** EJI's team
   shipped mobile-first and replaced the national map with a state LIST on
   phones because a small map is decoration, not information. Where our map
   detail exceeds a 390px screen, the phone gets the named-list or
   single-area treatment rather than 703 untappable slivers.

7. **The subject's own materials are the art direction.** Segregation by
   Design gets its identity from the HOLC map's own palette and figure-
   ground building footprints; erasing footprints one by one IS the story of
   renewal. Our palette already lives in the primary sources. The linen of
   the paper record, surveyor ink, and the four HOLC grade colors with D-red
   reserved for harm. Type and texture should read as record, not as web.

8. **Serrell's label discipline.** One Big Idea sentence rules the whole
   exhibit; most visitors are sweepers who read seconds per stop; word
   budgets are real (steps of 25 to 40 words, one idea each). Layer depth
   for the diligent minority (the files room pattern) without taxing the
   sweeper.

9. **Image-sequence scrubbing is a trap for us.** The Apple-style canvas
   technique needs every frame downloaded before it works and punishes mid
   phones. Our assets are vectors and scans, not renders. SVG and CSS
   transforms give us the same cinema without the payload. At most one such
   moment, only if a raster asset demands it.

10. **Emotion comes from the particular.** Greenwood worked through 70
    named businesses on one block; EJI works through counties and named
    victims; Segregation by Design works through one city block at a time.
    Our equivalents are one surveyor sentence about one block, one bombing
    at one address, one family's contract arithmetic. Lead scenes with one
    instance, then widen to the total.

## Techniques shortlist (things worth building)

- Sticky scene + steps: the persistent ground panel holds while step text
  scrolls past; each step advances the scene state. The workhorse pattern.
- Figure-ground erasure: building footprints or area polygons that vanish
  or flip as the record dictates (renewal clearance, covenant spread).
- Before/after wipe on archival aerials or map states, driven by scroll
  position, not by a drag handle (drag optional on top).
- True-scale reveals: a bar or column that cannot fit the frame and must be
  scrolled through (the wealth gap already does this; generalize sparingly).
- The named-record rail: a slow vertical roll of real entries (addresses,
  sheet lines, docket rows) used as texture that is also fully real.
- Scroll-scrubbed map epoch crossfades: one camera, one city, five epochs.
- Progress honesty: a visible act indicator so a visitor knows where they
  are and how much remains (scrollytelling pieces that hide length lose
  people).

## What to refuse

- Scroll hijacking in any form, including full-screen snap sections.
- Interactions required to advance (Tse law).
- A shrunken 703-polygon map on phones pretending to be usable.
- Canvas frame-scrub sequences of any length on the critical path.
- Animation on the bombing chapter. The record sits still there.
- Chartjunk cinema. Motion that does not encode time, space, or quantity.
