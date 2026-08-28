# Phase 2. Rooted Forward, read closely

What the organization's existing visual and editorial system gives the
exhibition, and what the exhibition should refuse to inherit.

## The two design systems already in the codebase

**The org identity** (site-wide, `globals.css`): cream `#F5F0E8` /
cream-dark `#EDE6D8` ground, forest `#1B3A2D` structure, rust `#C45D3E`
as the single warm accent, ink `#1A1A1A` text, warm-gray apparatus,
`#DDD6C8` hairlines. Source Serif 4 for display, DM Sans for body.
Square-cornered cards, uppercase letterspaced eyebrows, rust CTAs. The
printed banner and flyer already extend this system faithfully.

**The exhibit system** (built for The Ground Keeps Moving, the on-site
Hyde Park exhibit): a second, document-derived palette the owner
approved for exactly this subject. Plat-book linen `#EDE6D6` and
`#E2D8C2`, carbon ink `#1C1A17` / `#4A453D`, HOLC survey blue
`#4A6B8A`, appraisal gold `#C9A227`, and a red `#B0322B` that is
**semantic only**, reserved for extraction, exclusion, and the D grade.
Green `#3E6B4F` appears exactly once in the whole exhibit, on the
Contract Buyers League credit entry. Two additional faces with
assigned jobs, Archivo Narrow for plat-book labels and IBM Plex Mono
for ledger figures.

That color discipline is the single most distinctive thing in the
organization's visual language. Almost nobody runs a semantic-only
accent. It is the opposite of template design and it should govern the
physical exhibition.

## Editorial voice (enforced, not aspirational)

- No em-dashes anywhere in user-visible text.
- No colons inside sentences. No colons in titles or headings.
- No aphorisms, no rhetorical pairs or triads, no hedging, short copy.
- Quotation marks appear only around verbatim-documented lines
  (`voices.json` encodes this as `quoteStatus`); everything else is
  visibly framed as summary.
- Every number carries a source. The fact registry
  (`data/exhibit/facts.json`, 127 entries) stores value, source, and
  locator for each. Panel copy below cites registry ids.

## Assets the exhibition can draw on

- `data/exhibit/walltext.json`. Finished museum wall text in the
  owner's register, including the exhibit title, the big idea line,
  and twelve chapter titles ("The purge", "The paperwork", "The color
  tax", "The walls crack"). The panels reuse this naming family.
- `data/exhibit/ledger.json`. The running debit/credit ledger of the
  century, one entry per chapter, each tied to a fact ref.
- `public/exhibit-data/holc-chicago.geojson`. All 703 HOLC areas,
  redrawn from Mapping Inequality (CC BY-NC 4.0; underlying HOLC
  records public domain). The site's own opening visual.
- `public/media/hyde-park-walk/` and `public/media/hyde-park/` plus
  `credits.json`. A vetted image library at web resolution with
  Commons-verified licenses. Print heroes need higher-resolution
  originals, fetched separately from LOC, BPL, NARA, and Commons.
- `src/lib/tours/hyde-park-walk.ts` and `hyde-park-map.ts`. Stop
  coordinates, route legs, and a 1929 USGS base-map treatment for the
  app's plate map.
- `src/lib/qr-links.ts`. Printed QR codes encode
  `rooted-forward.org/go/<slug>` behind a re-pointable 307. The
  exhibition gets its own `exhibit` slug so the printed code can be
  re-aimed for as long as the domain lives.
- `print/build-banner.mjs`. A proven render pipeline. Exact-inch CSS,
  embedded variable fonts, vector PDF via Chromium, type outlined
  through pdftocairo and rsvg-convert, QR decoded back off the
  rendered pixels before anything ships.

## What the exhibition must refuse

- The four mid-century photographs scanned from Susan O'Connor Davis's
  book (55th Street 1955 and 1961, Rhythm Liquors 1960, the Weese/Pei
  townhouses). They carry real copyright risk and are excluded from
  print. Public-domain substitutes are sourced instead.
- The app UI. Nothing on the panels should look like a screenshot of
  the site. The panels translate the identity into wall language.
- The rejected v2 design system. Nothing from it returns.
