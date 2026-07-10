# R9 design. The Same Map

The canonical build reference for the R9 ground-up redesign. Merges the
council verdict (council-1-verdict.md), the lead's research memo
(research-memo.md), and the researcher's answers below. Decision D-R9-01.

## Big Idea (one sentence, rules everything)

One map of the same ground stays on screen for the whole visit while five
named instruments mark it, and the bill arrives in 2026 as the visible sum
of what the visitor watched happen.

## Researcher's answers to the council's open questions

1. **The 1971 to 2026 bridge is fully sourced in the registry.** Three
   evidence rows stage it. The instrument returns (contract-for-deed selling
   returned to Black neighborhoods after the 2008 crash,
   `contracts.post_2008_return`, 2016). The grades still price the ground
   (median income today $207,434 on former A land against $65,240 on former
   D, homeownership 90 against 44 percent, on the same polygons,
   `present.holc_income_gradient` / `present.holc_ownership_gradient`, ACS
   2023; 97 percent of affordable-housing sites sit on former C or D land,
   `present.holc_subsidy_siting`). The ground is moving again (East Woodlawn
   median price doubled since 2019 to about $440,000 beside the Obama
   Center, the 2020 preservation ordinance, the May 2026 audit finding one
   project built on 52 reserved lots, `present.woodlawn_*`,
   `present.audit_2026`, `present.obama_center_opened`). Supporting register
   notes, Illinois only created a covenant removal process in 2022 and the
   Realtors apologized in November 2020. The finale closes present-tense.
2. **Covenant hatch is CUT (build-time amendment, 2026-07-10).** Full-text
   analysis of the 576 transcribed sheets found only 58 areas mentioning
   "restrict" at all, most about lot sizes, not racial deed restrictions;
   drawing a covenant map from that would lie twice (undercount and
   miscount). Per the data-absence rule the Stage takes NO covenant layer.
   The covenant chapter is carried by the deed facsimile itself, the
   Register bar 1927-1948, and the sourced coverage claim as a fact line.
3. **The grade flood order is sourced.** Every area's
   `security_grade_fields.date` carries the surveyor's filing date
   ("Nov'39"). Areas re-ink in filing order with the caption stating the
   order is the order the surveyors filed them, 1939 to 1940.
4. **Ledger dollars are dollars of their year.** The column head states the
   convention and that entries do not sum. No deflators; the sources do not
   permit a uniform one. The $587-more-per-month figure keeps its "2019
   dollars" tag wherever it appears.
5. **Clearance is before and after, two dated states.** No per-building
   demolition sequence exists in our data. The renewal area renders as a
   boundary region with its two sourced states and the One Mark One Family
   grid (about 4,000 squares, estimate label inside the graphic). No
   invented footprints. If the 1958 plan-map scan supports a traced
   boundary, trace it and credit the scan; otherwise the area label carries
   the layer.
6. **Memorial register follows the EJI precedent.** Names over counts,
   sober type, list over map on phones. The two dead are named in the serif
   at display size. Empty outcome cells announce "No conviction recorded."
   No imagery of victims anywhere. The chapter passes a dedicated
   descendant-test review before ship, separate from the general audit.
7. **The docket discrepancy reads as archival honesty.** All 40 appendix
   incidents list; the reconciling line states the commission recorded 58,
   its appendix lists 40, and 32 carry an address the map can place, some
   outside the square. This language shipped in R8 and carries over.
8. **No trustworthy public completion benchmarks exist.** Mitigation is
   structural. The charge lands inside ninety seconds, every act closes on
   a takeaway line, the Spine shows honest progress, and the projector-off
   floor (complete argument with zero interactions) is a verify-suite
   assertion, not an aspiration.
9. **iOS Safari 2026.** Stage height in svh (stable under address-bar
   collapse), never vh. Sticky is safe on Safari 18+. dvh only for
   non-critical chrome. Feature-check via @supports (height: 100svh) with an
   inline non-sticky fallback.
10. **The shareable unit is the area permalink, not the visitor.** The
    grade receipt copy-links to the AREA's reading-room permalink
    (#room-files:<areaId>), never encoding visitor location. No generated
    share images and no per-chapter OG images in v1.

## The through-line system (four persistent objects)

All four derive purely from scroll position so any deep link, refresh, or
back-button lands on a coherent scene. All visible together at 390px.
Chrome outside the Stage totals about 51px; if the week-one 390px test
reads cluttered, the Ledger Rail merges into the Register.

1. **The Stage.** Sticky top pane, about 50svh, holding the flat map as
   inline SVG (target under 80KB gzipped; one merged path per grade for
   fills, per-area hit layer mounted only in chapters that invite tapping).
   Two framed states only, the citywide South Side frame and the Hyde Park
   inset, both already projected in holc-frames.json. Chapters draw dated,
   registry-sourced layers onto it (cession boundary, township plat extent,
   bombing marks, sheet-sourced restriction hatch, grade pigment in filing
   order, clearance region, present-day annotations) and no mark is ever
   erased. Every layer change is a discrete stepped state fired on
   IntersectionObserver thresholds. Reduced motion, keyboard, and phone get
   the identical states.
2. **The Instrument Register.** Five bars, one 1900 to 2026 axis, true
   dates (realtors' rule 1921-1950, covenants 1927-1948, HOLC/FHA
   1934-1968, urban renewal 1952 onward, contract selling 1952-1970 with
   the 2008 return noted). Docked 24px strip under the Stage from the cold
   open, riding date cursor, full-screen expansion once at the overture
   with handoff annotations, bars are anchor jump links. Court defeats
   terminate bars with dated annotations (unenforceable 1948); the strip is
   never stamped defeated and runs to 2026. The single most carefully
   typeset object on the page. Built and phone-tested first.
3. **The Ledger Rail.** 24px bottom band posting the 11 dated entries as
   the story reaches them, tabular figures, rust (rust means now), dollar
   convention visible. Expands in the finale into the full account column.
4. **The Spine.** 3px left-edge rule doubling as scroll progress. Surveyor
   ink from 1832, turning permanently D-red at the federal letterhead in
   the Washington chapter, ending at the visitor's grade receipt.

## Act structure (seven acts, thirteen chapters preserved as anchors)

- **Act 0. The Map and the Charge.** The 1940 map in initial HTML, painted
  at first paint, one caption line (drawn 1940, priced every block by
  race). First scroll drains it in four labeled stepped states, 1940
  rewinding to 1832. The charge card, three historian-register sentences,
  engineered, five named instruments, the 2022 bill $285,010 against
  $44,890, every figure carrying its fact chip. Register docks. The rust
  grade-under-your-feet button appears, opt-in, tap-the-map fallback,
  graceful never-graded card. A ninety-second exit leaves with the whole
  argument.
- **Act 1. Ground Before Paper** (first taking, the fair). Cession
  boundary, township plat extent with the 1853 plat scan as the first
  liftable document, the fair as footprint plus one credited full-bleed
  photograph. Ledger posts 1833. Under 120 words. Takeaway, the ground was
  surveyed and sold before it was ever graded.
- **Act 2. By Hand** (five instruments overture, the purge, the bombing
  years). Register expands full-screen once, no gap 1921 to 1970, then
  re-docks. The purge chapter shows the club's own documents (Stage marks
  only what data supports). Then the hard cut. Stage dims to the exhibit's
  one dark value, 32 static marks, the Empty Column docket, a real HTML
  table, 40 rows, date, address, outcome bordered and blank, totals row
  bombings 58, killed 2, convictions 0, the two dead named large in serif,
  a full viewport of dark air before and after, transitions unbound across
  the range. Ida B. Wells closes the act alone.
- **Act 3. By Paper** (the paperwork, Washington, the walls crack).
  Article 34 alone at display size on empty cream. The deed facsimile, tap
  the clause for transcription with signature and recording stamp. Sheet-
  sourced restriction hatch in dated steps. Then the Grade Flood, the
  drained map re-inks in filing order while the focus polygon's sheet rises
  alongside, justifying sentence highlighted; every polygon becomes
  tappable to its sheet, one A and one D sheet pre-opened side by side; the
  576-sheet reading room lives behind this gesture. Spine turns D-red at
  the federal letterhead. The Supreme Court reroute rebuilt vertical for
  390px, law left, money right, four gates; beneath it the Register shows
  the covenant bar dying in 1948 while HOLC runs on and two bars sit ready.
  Hansberry speaks at the South Rhodes address. Takeaway, the courts
  cracked the paper and the money changed instruments.
- **Act 4. By Public Money** (the university rebuilds). Before-and-after
  clearance states under visitor control, persistent voids after. One Mark
  One Family, a canvas grid of about 4,000 squares scrolled past, estimate
  label in the graphic. One large credited clearance photograph. A bench, a
  single Travis or Baldwin quotation.
- **Act 5. The Color Tax and the Basement** (the color tax, Contract
  Buyers League). Two Buyers One House on the page's single native range
  slider, paired payment columns on one money axis, median income
  reference line, the $71,000 shaded difference labeled at true scale,
  final figure renders untouched. The difference detaches as a perforated
  stub met again in the finale ledger. Then the warm room, the basement
  photograph full-bleed, Ruth Wells and Clyde Ross verbatim carrying it,
  paperwork demoted to evidence, King closing. The Ledger posts its only
  entry in the visitor's favor.
- **Act 6. The Ledger and the Ground.** The bridge, three evidence rows
  (the instrument returns, the grades still price the ground, the ground is
  moving again), all registry-sourced, answering the visitor who concedes
  everything through 1970. The full 11-entry ledger as one tall account
  column, the $71,000 stub slotting in, convention in the column head. The
  True-Scale Climb, both bars on one pixel-per-dollar scale, $44,890
  completing in one viewport, $285,010 demanding about six more, ledger
  events annotated at their dollar heights, skip link, persistent
  true-scale minimap with a you-are-here cursor, a summit pull-back frame
  holding both bars whole. The grade receipt reprised from sessionStorage,
  area permalink as the shareable unit. The answer wall, the colophon
  crediting the 126 registry facts, and a plain Study Room door into the
  reading room, code-split.

## Art direction

Paper and ink in the existing exhibit tokens and families. No new design
system. The pigment law is absolute, the four HOLC colors mean grades and
nothing else, rust means present-day consequence and the one CTA, exh-green
stays reserved for the CBL credit entry. Display serif for datelines and
chapter titles, body face for cards capped at 50 words, tabular figures in
every numeric context, the plat face for machine text. Texture only from
real scans, no synthetic grain. Flat even light except two designed value
shifts, down for the bombing chapter, warm for the basement. The archival
photographs are the only halftone, full-column, credited, nothing overlaid.

## Interaction model

Two gestures, learned in Act 0, never changed. ADVANCE is scroll and always
means time. INSPECT is tap and every number, mark, polygon, and document
opens its registry source. One labeled tap opportunity per chapter, one
native slider on the whole page, two deliberate inputs at the end (location
and the answer wall). Zero interactions still delivers the complete
argument. Keyboard steps the identical resolved states, visible focus, skip
links. Screen readers get the docket and ledger as real tables, polygons as
named buttons, a prose equivalent per act. Every chapter keeps a stable
anchor; existing #room-files:<areaId> and #find-your-ground contracts keep
working.

## Engineering contract (CI acceptance, not aspiration)

Designed at 390px and adapted up; nothing exists on desktop that does not
exist on the phone (desktop moves the Stage to a left column). All
narrative changes are discrete IO-threshold states, never per-pixel
handlers; CSS scroll-driven animation only for the Spine fill with a JS
fallback. No scroll hijacking, no snap sections, no WebGL, no three.js, no
audio, no canvas except the family grid. Stage SVG under 80KB gzipped,
initial route JS under 180KB gzipped, images lazy AVIF with reserved
dimensions, sheet scans load at tap time, reading room code-split. The
reduced-motion build, keyboard build, and phone build are the same build of
discrete resolved states. No tween may display a value that does not
resolve to a dated fact ID. Motion budget is written and enforced in
review.

## Reuse map

KEEP (as modules): facts.ts + FactValue/SourceSup (chips and popovers, the
audit contract), richText.tsx, projection.ts + holc-frames.json +
holc-chicago.geojson + holc-descriptions.json (adds filing-date use),
bombings.json, models.ts (Two Buyers), voices.ts, files-room.ts +
SurveyorsFiles (behind the Study Room door), AnswerWall, moderation, the
lint/audit/verify script harness, FigureBlock (credits discipline).
REBUILD: every layout component (ChapterSection, StationBlock, ExhibitHeader,
RecordBlock, TimelineSpine, HolcMapStation, MachinesPanel, CasesFlow,
GapAtScale, TwoBuyers, BombingMap render layers).
DELETE at swap: the relief turntable (HolcReliefStage, relief.ts), rigged
instruments, machine rooms and doors, PlannersTable, LayerSlider,
FollowTheDollar, the document-flow shell. Nothing of the current framing
survives.
COPY: new file data/exhibit/ground-copy.json holds all R9 visitor text,
re-cut from walltext.json content to the new word budgets; the lint script
gains it as a target; walltext.json is retained as archive until the swap
commit removes its consumers.

## Build order and gates (adapted to this session's agent process)

1. Stage geometry build script + the Instrument Register, phone-tested at
   390px (screenshot gate with blind readers). Either failing reshapes the
   concept before sunk cost.
2. Engine (IO steps, state derivation, Spine, Ledger Rail) + Act 0 to
   final polish. Blind feel-test (skeptic, curator, fresh visitor) on the
   finished act before mass production, because feel is what killed the
   last two builds.
3. Acts 1 to 6 built in parallel waves with strict file ownership, real
   data only, word budgets enforced.
4. The bombing chapter gets its dedicated descendant-test review.
5. Verify suite rewritten scene by scene as acts land; gates (tsc, both
   lint passes, audit-facts, build) stay green throughout.
6. The swap commit replaces the ExhibitShell body, deletes dead
   components, retires old scenarios, ships, deploys, production smoke.
7. The R9 audit loop, full council on screenshots of every scene plus
   humanizer copy audit, fix waves, repeat until a round returns nothing.
