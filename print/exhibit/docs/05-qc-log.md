# Phase 8. Quality control log

Every pass below was run against rendered previews, not against the
source files. Changes are listed with the pass that caught them.

## Pass 1 · Content

- Every number on the sheets traced to `data/exhibit/facts.json` or to
  the current tour document. Two corrections came out of the trace.
  The tour says "more than 400 contracts renegotiated"; the fact
  registry's checked figure is 155 by 1971 (different source, different
  cutoff). The sheets carry 155. The university's covenant defense
  spend is printed as the registry's exact $83,597.46 rather than the
  tour's rounded figure.
- The Davis-book scans (55th Street 1955 and 1961, Rhythm Liquors,
  the Weese/Pei townhouses) were excluded from the image plan at the
  start for rights reasons. The renewal era is carried by the numbers
  block, the Russell Lee kitchenette photograph, and the era band
  instead of a before/after pair that cannot be licensed.
- Quotes verified against the voices registry. Verbatim marks only on
  Wells, Binga, Baldwin, Butler, and the two document texts.

## Pass 2 · Graphic design

- Board 2's first draft left a four-inch void under the deck and a
  crowded left column. Columns re-hung (left 9.9in, right 12.5in from
  top), map widened to 18.2in, Binga portrait cut (a 2in newspaper
  halftone read as clutter, the line carries itself).
- Board 3's first timeline collided at 1953/1955 and floated in dead
  space. Rebuilt with lane names in a left gutter, fewer entries,
  side-anchored labels near neighbors, Baldwin moved to close the
  left column.
- Banner set 1 had stacked-module syndrome and fifteen-inch bare
  tails. Solved structurally, every banner now ends in the same
  deep-linen plinth at 64in with one deep visual object running into
  it (the 1871 plan, the survey map, the kitchenette photograph, the
  route map). Reading content lives above 64in; the bottom eight
  inches carry nothing.
- Banner 2 rebuilt a second time, documents first at eye height, the
  survey map nearly full width to the plinth.
- Scan borders cropped out of the Graham lithograph and the Russell
  Lee photograph (inset scale, no retouching).

## Pass 3 · Anti-AI review

- The masthead locator block planned for every sheet was cut as
  meaningless repetition before it was built.
- No rounded rectangles, no drop shadows, no icons, no gradients
  anywhere. The one tile on the system (the QR) is squared and
  bordered in carbon.
- Document blocks are typeset, labeled "set from the original text",
  never fake facsimiles or fake paper.

## Pass 3b · Owner's language review (August 28)

The owner rejected the entire metaphorical layer. Every title, deck,
label, caption, foot entry, and lane tag was rewritten literal. The
full ruling is at the top of `03-content-architecture.md` and in
project memory. This pass renamed the exhibition itself.

## Pass 4 · Physical viewing

- Titles 96pt to 150pt read at fifteen feet. Body 26.5pt to 28.5pt,
  captions 19pt, credits 14.5pt, nothing under the Smithsonian 14pt
  floor except nothing.
- Banner eye-zone rule enforced by construction: title zone in the
  top 10in, primary reading 10in to 45in from the top, browse
  graphics below, plinth from 64in, cassette allowance below 73in
  empty.
- The QR sits at 28in to 32in from the top of banner 4 and mid-sheet
  on board 4, chest height on both supports.

## Pass 5 · Series

- Contact sheets (`out/series-boards.jpg`, `out/series-banners.jpg`).
  The four boards read as one system with four distinct leads,
  photograph, documents and map, numbers, photograph and route. Bands,
  feet, publisher block, and caption conventions repeat exactly.

## Open items

- High-resolution archival originals still landing (Graham litho,
  1871 plan, kitchenette TIFF, 1928 aerial, pamphlet title page).
  Placed sizes on the boards need roughly 3000px sources and the
  repo's web copies are 1600px to 1920px, so final PDFs wait for the
  fetch. A labeled SCAN TO COME frame stands in for the pamphlet.
- Copy re-check by a second reader in progress; fixes fold in before
  final PDFs.
- CMYK conversion is not run locally (no Ghostscript on this machine,
  same as the shipped flyer and banner). PDFs deliver in RGB with
  fonts outlined; large-format shops convert at RIP. Note carried in
  the production spec.
