# Adding a Research Paper to Rooted Forward

This is the canonical end-to-end guide for publishing a new research
paper on rooted-forward.org. Follow it in order. Every existing paper
on the site was added through this exact sequence.

The site is built so that **one new paper = changes to four
predictable files plus one optional file**. PDF generation, the data
archive page, the navbar, the chart renderer, and the admin
download-tracking dashboard all read from those files automatically.

---

## Real Data Policy

**Read this before you start.** It is the single rule that everything
else follows from.

1. **Every numerical claim, quotation, and FOIA reference in a Rooted
   Forward paper must be traceable to a public primary source.** No
   invented respondents. No invented FOIA request numbers. No
   reviewer names, no oral-history narrators, no industry directors
   that do not actually exist.
2. **Replication archives must be 100% real.** Cleaned files derived
   from public sources are fine; fabricated sample rows are not. Until
   the cleaned archive is uploaded to the storage bucket, the paper
   ships in `archive_status: "in_preparation"` and the data page
   surfaces the upstream public URLs so readers always have a path to
   the genuine raw data.
3. **Sample rows on the data page must come from the documented
   public record, not be invented for shape.** It is better to ship
   `sample_rows: []` than fake data.
4. **Citations must be real and verified.** Real DOI, real journal,
   real volume and page numbers. AI-fabricated citations have been
   caught on this site and embarrassed the project. Run every
   citation through Crossref or Google Scholar before adding it.
5. **Em-dashes and sentence-internal colons read as AI tells.** Use
   commas, periods, parentheses, `since`, `namely`, etc. List-
   introducing colons in front of real lists are fine. Place +
   publisher colons in citations are fine.

---

## The Files

| File | What it holds |
|---|---|
| `src/lib/research-constants.ts` | The entry record (slug, title, abstract, authors, citations, topic, format, etc.) |
| `src/lib/research-seed-content*.ts` | The full markdown body (long; lives in a separate vol file once it's over a few hundred lines) |
| `src/lib/research-datasets.ts` | Dataset metadata (files, license, real upstream sources, schema, sample row) |
| `supabase/migrations/00N_*.sql` | The Postgres seed row |
| `supabase/migrations/00N_*.sql` (same file) | A `research_datasets` upsert with the same dataset metadata |

That is the full surface area. The rest of the site (PDF route, data
page, navbar, charts, admin tracking) reads from these.

---

## Step-by-step

### 1. Pick a slug

Use the URL-style slug everywhere: lowercase, hyphenated, no diacritics.

Good: `cook-county-property-tax-appeal-disparity`
Bad: `Cook County Property Tax Appeal Disparity` or `2024-cook-county-property-tax-appeals`

The slug becomes the URL path (`/research/<slug>`), the data archive
detail path (`/research/data/<slug>`), and the key everywhere in code.

### 2. Write the markdown body

Add a new exported constant in `src/lib/research-seed-content.ts` (or
`-vol2.ts`, `-vol3.ts`, etc. if the file is getting large):

```ts
export const COOK_COUNTY_PROPERTY_TAX_BODY = [
  "## 1. Introduction",
  "",
  "Opening paragraph...",
  "",
  "## 2. Background",
  "",
  "More content...",
].join("\n");
```

**Conventions:**

- Section headings use `##` (h2). Subsections use `###` (h3). Don't
  use `#` (h1) — the page title is the h1.
- **No em-dashes** in user-visible prose. No colons in headings.
- Citations use `[^N]` or `[cite:N]` syntax. The `N` matches the `id`
  field on the citations array.
- Charts are JSON inside ` ```chart ` fences (see "Charts" below).
- Tables are standard markdown tables.
- See an existing body like `OBAMA_CENTER_BRIEF_BODY` for a working
  reference.

Then import the new constant in `src/lib/research-constants.ts`:

```ts
import { COOK_COUNTY_PROPERTY_TAX_BODY } from "./research-seed-content";
```

### 3. Add the entry record

Add a new object to the `PLACEHOLDER_RESEARCH_ENTRIES` array in
`src/lib/research-constants.ts`. Copy the shape of an adjacent entry.
Required fields:

```ts
{
  id: "re-16",                                  // next sequential number
  slug: "cook-county-property-tax-appeal-disparity",
  title: "Racial Disparities in Cook County Property-Tax Appeals, 2015–2024",
  abstract: "Two- to three-paragraph abstract...",
  full_content_markdown: COOK_COUNTY_PROPERTY_TAX_BODY,
  topic: "Housing",                             // or "Policing", "Displacement", etc.
  city: "chicago",
  format: "data_analysis",                      // brief | report | primary_source_collection | data_analysis | oral_history
  authors: ["Zain Zaidi"],
  reviewers: [],                                // keep empty unless you have real reviewer names
  citations: [
    {
      id: "1",
      text: "Avenancio-León, C. F., & Howard, T. (2022). The assessment gap: Racial inequalities in property taxation. The Quarterly Journal of Economics, 137(3), 1383–1434.",
      url: "https://doi.org/10.1093/qje/qjac009",
      accessed_date: "2025-12-01",
      type: "primary",                          // primary | secondary
    },
    // ... more citations
  ],
  pdf_url: null,                                // null = generate on demand
  cover_image_url: null,
  published_date: "2026-04-22",
  status: "published",
  related_campaign_ids: [],
  related_tour_slugs: [],
  created_at: nowIso,
  updated_at: nowIso,
},
```

**Title rules:**
- No colons. The site has no paper titled "X: A Subtitle" any more.
- Real, descriptive titles in the style of an academic working paper.

### 4. Add the dataset metadata

Add a new entry to `RESEARCH_DATASETS` in
`src/lib/research-datasets.ts`. Use the slug as the key:

```ts
"cook-county-property-tax-appeal-disparity": {
  summary:
    "Ten years of Cook County property-tax appeals (2015–2024), tract demographics, specialized-firm concentration.",
  contents:
    "Ten-year Cook County appeal record cleaned and matched to 2020 census tracts...",
  files: [
    { name: "cook-appeals-2015-2024.csv", bytes: 92000000, description: "1.74 million appeal filings." },
    { name: "cook-appeals-tract-panel.csv", bytes: 1400000, description: "Tract-year panel." },
    { name: "cook-appeals-analysis.R", bytes: 24000, description: "Replication code." },
  ],
  license: "Code MIT, derived data CC BY 4.0.",
  upstream_sources: [
    { label: "Cook County Assessor — Open Data", url: "https://www.cookcountyassessor.com/open-data", note: "Property-data downloads, including appeal records." },
    { label: "Cook County Board of Review", url: "https://www.cookcountyboardofreview.com/", note: "Second-stage appeal records." },
  ],
  preview: {
    columns: [
      { name: "tract_geoid", type: "text" },
      { name: "year", type: "int" },
      { name: "filings_per_1000", type: "numeric" },
    ],
    sample_rows: [],   // leave empty unless you have a real, verified row
  },
  archive_status: "in_preparation",   // flip to "live" only after admin upload
},
```

**`upstream_sources` is required.** Every dataset entry must have at
least one real public URL where the underlying raw data lives. This
is the contract that lets us mark archives "in preparation" without
shipping anything fabricated — readers always have a path to genuine
data.

**`sample_rows` defaults to empty.** Add one only when you have a
real row from the public record.

### 5. Add the database seed row

Create the next migration file at
`supabase/migrations/00N_<descriptive-name>.sql`. The file should
upsert one row in `research_datasets` mirroring the TypeScript entry:

```sql
INSERT INTO research_datasets (
  slug, license, source, contents, is_public
) VALUES
  (
    'cook-county-property-tax-appeal-disparity',
    'Code MIT, derived data CC BY 4.0.',
    'Cook County Assessor and Board of Review (Illinois FOIA).',
    'Ten-year Cook County appeal record cleaned and matched to 2020 census tracts...',
    true
  )
ON CONFLICT (slug) DO UPDATE
  SET license = EXCLUDED.license,
      source = EXCLUDED.source,
      contents = EXCLUDED.contents,
      is_public = EXCLUDED.is_public,
      updated_at = now();
```

If the paper ships with the cleaned archive already uploaded, also
add a corresponding `research_entries` insert. If the paper is being
added through the admin UI, that step is automatic.

Apply the migration:

```bash
# Option A: Supabase CLI (preferred)
supabase db push

# Option B: copy-paste into the SQL editor at
# https://supabase.com/dashboard
```

### 6. Build, verify, deploy

```bash
npm run build
```

If the build fails, fix the error before continuing. Common failures:

- **Type error in citations:** every citation must have `id`, `text`,
  `url` (string or null), `accessed_date` (string or null), `type`.
- **Slug mismatch:** the slug in the entry record must equal the key
  in `RESEARCH_DATASETS` and the migration's seed row.
- **Missing import:** the body constant must be imported in
  `research-constants.ts`.

When the build passes:

```bash
git add -A
git commit -m "Add <paper-title>"
git push origin claude/rooted-forward-site-avKps   # never push to main
vercel deploy --prod --scope zain-zaidis-projects --yes
```

Verify the new paper renders on production:

```bash
curl -s -o /dev/null -w "%{http_code}" https://rooted-forward.org/research/<your-slug>
curl -s -o /dev/null -w "%{http_code}" https://rooted-forward.org/research/data/<your-slug>
# both should print 200
```

---

## Charts

Charts are JSON inside ` ```chart ` fences in the markdown body.
The renderer supports `bar`, `line`, and `pie`.

```text
\`\`\`chart
{
  "type": "bar",
  "title": "Property tax appeal filing rate by tract racial composition",
  "caption": "Appeals filed per 1,000 residential parcels per year, 2015 through 2024 average. Source: Cook County Assessor administrative records.",
  "unit": "per 1k",
  "x": ["Majority white", "Majority Black", "Majority Latino", "Mixed or other"],
  "series": [
    {"name": "Filings per 1,000 parcels", "data": [93, 39, 51, 68]}
  ]
}
\`\`\`
```

Required: `type`, `title`, `caption`, `series` (or `slices` for pie),
and either `x` (for bar/line) or `slices` with `name` and `value`.

The full schema is in `src/components/research/ResearchChart.tsx`.
Charts auto-receive a Figure number based on document order.

---

## Citations

Use `[^N]` or `[cite:N]` inline:

```markdown
Avenancio-León and Howard (2022) found a 10–13 percent racial assessment gap [^1].
```

Where `[^1]` resolves to the citation with `id: "1"` in the entry's
`citations` array. Citations render as superscript anchor links that
scroll to a numbered bibliography at the bottom of the page; the back
arrow on each bibliography entry returns to the inline reference.

**Citation conventions:**
- Real journal name, real volume, real page numbers.
- DOI in the `url` field where one exists.
- Place + publisher colons (`Chicago: University of Chicago Press`)
  are the only colons that survive the AI-tell filter.
- Verify in Crossref before adding. AI-generated citations have been
  caught on this site.

---

## PDFs

PDF generation is automatic. The route at
`src/app/api/research/pdf/route.ts` reads from
`PLACEHOLDER_RESEARCH_ENTRIES` (or the live Supabase row) and emits a
typeset PDF using `pdfkit`. No additional work needed when adding a
new paper.

The `Download as PDF` button on each paper page calls the route and
saves the result. Test it by clicking after deploy.

---

## When the cleaned archive is ready

1. Build the cleaned ZIP locally. Filenames must match the `files`
   list in `RESEARCH_DATASETS`.
2. Upload to the `research-datasets` storage bucket via the Supabase
   dashboard, the CLI, or a future admin UI.
3. Update `src/lib/research-datasets.ts`:
   - `archive_status: "live"`
   - `storage_path: "<slug>/<your-archive>.zip"` (path inside the bucket)
4. Commit, push, deploy.

The download API will mint a signed URL on each request and log every
download to `dataset_downloads`. The admin can see usage at
`/admin/research/data-usage`.

---

## Quick checklist when finishing

- [ ] Slug used consistently across the four files
- [ ] No em-dashes in the body, abstract, or title
- [ ] No colons in the title or in any heading
- [ ] No invented citations, FOIA numbers, reviewers, or quotes
- [ ] All citations verified through Crossref or DOI
- [ ] At least one real public upstream URL on the dataset entry
- [ ] `sample_rows` empty if no verified row available
- [ ] `npm run build` passes with no errors
- [ ] `/research/<slug>` returns 200 on production
- [ ] `/research/data/<slug>` returns 200 on production
- [ ] PDF download works on production
- [ ] No paper-page console errors on first paint

---

## See also

- `CLAUDE.md` (repo root): top-level project orientation
- `docs/templates/new-research-paper.md`: copy-paste skeleton
- `src/lib/research-datasets.ts`: file-header doc for dataset metadata
- `src/components/research/ResearchMarkdown.tsx`: full markdown grammar
