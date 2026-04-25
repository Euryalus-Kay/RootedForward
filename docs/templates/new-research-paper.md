# New Research Paper — Copy-Paste Skeleton

Copy these blocks verbatim into the listed files, then replace the
all-caps placeholders. The slug must be identical in every block.

See `docs/RESEARCH-CONTRIBUTING.md` for the full walkthrough and the
real-data policy. **Do not invent citations, FOIA numbers, sample
rows, or upstream URLs.** If you don't have a real value, leave the
field empty or use `null`.

---

## 1. `src/lib/research-seed-content.ts` (or a `-volN.ts` file)

```ts
export const REPLACE_WITH_PAPER_SLUG_BODY = [
  "## 1. Introduction",
  "",
  "Opening paragraph. No em-dashes. No colons inside sentences.",
  "",
  "## 2. Background",
  "",
  "Lit-review paragraph with citations like (Avenancio-León & Howard 2022)[^1].",
  "",
  "## 3. Data and Methodology",
  "",
  "What you used and how.",
  "",
  "## 4. Findings",
  "",
  "Numbers. Tables. Charts (see chart fence example below).",
  "",
  "```chart",
  "{",
  '  "type": "bar",',
  '  "title": "REPLACE WITH FIGURE TITLE",',
  '  "caption": "Source attribution and units.",',
  '  "unit": "%",',
  '  "x": ["Group A", "Group B"],',
  '  "series": [',
  '    {"name": "Series 1", "data": [12, 34]}',
  "  ]",
  "}",
  "```",
  "",
  "## 5. Discussion",
  "",
  "What it means.",
  "",
  "## 6. Limitations",
  "",
  "Be honest. State what the design cannot identify.",
  "",
  "## 7. Conclusion",
  "",
  "Plain restatement of the contribution.",
  "",
  "## Data Availability",
  "",
  "Replication archive at [rooted-forward.org/research/data/REPLACE_WITH_PAPER_SLUG](https://rooted-forward.org/research/data/REPLACE_WITH_PAPER_SLUG).",
  "",
  "## References",
  "",
  "Avenancio-León, C. F., & Howard, T. (2022). The assessment gap. *The Quarterly Journal of Economics*, 137(3), 1383–1434.",
].join("\n");
```

---

## 2. `src/lib/research-constants.ts`

Add the import at the top:

```ts
import { REPLACE_WITH_PAPER_SLUG_BODY } from "./research-seed-content";
```

Add the entry to `PLACEHOLDER_RESEARCH_ENTRIES`:

```ts
{
  id: "re-NEXT_NUMBER",
  slug: "replace-with-paper-slug",
  title: "Real Title Without Colons",
  abstract:
    "Two- to three-sentence abstract. Plain prose. No em-dashes. State the question, the data, the finding.",
  full_content_markdown: REPLACE_WITH_PAPER_SLUG_BODY,
  topic: "Housing",
  city: "chicago",
  format: "data_analysis",
  authors: ["Zain Zaidi"],
  reviewers: [],
  citations: [
    {
      id: "1",
      text: "Avenancio-León, C. F., & Howard, T. (2022). The assessment gap: Racial inequalities in property taxation. The Quarterly Journal of Economics, 137(3), 1383–1434.",
      url: "https://doi.org/10.1093/qje/qjac009",
      accessed_date: "2025-12-01",
      type: "primary",
    },
  ],
  pdf_url: null,
  cover_image_url: null,
  published_date: "2026-04-22",
  status: "published",
  related_campaign_ids: [],
  related_tour_slugs: [],
  created_at: nowIso,
  updated_at: nowIso,
},
```

---

## 3. `src/lib/research-datasets.ts`

Add to `RESEARCH_DATASETS`:

```ts
"replace-with-paper-slug": {
  summary:
    "ONE-SENTENCE SUMMARY. PLAIN ENGLISH. SHOWN ON THE GRID CARD.",
  contents:
    "FULL PARAGRAPH. SHOWN ON THE DETAIL PAGE.",
  files: [
    { name: "filename-1.csv", bytes: 1000000, description: "What this file contains." },
    { name: "filename-2.geojson", bytes: 500000, description: "What this file contains." },
    { name: "analysis.R", bytes: 12000, description: "Replication code." },
  ],
  license: "Code MIT, derived data CC BY 4.0.",
  upstream_sources: [
    {
      label: "REAL PUBLIC SOURCE NAME",
      url: "https://real-public-url.example.com/",
      note: "Optional one-line note about how to find the data on this site.",
    },
  ],
  preview: {
    columns: [
      { name: "column_1", type: "text", description: "Optional description." },
      { name: "column_2", type: "numeric" },
    ],
    sample_rows: [],
  },
  archive_status: "in_preparation",
},
```

**`upstream_sources` must contain at least one real, working public
URL.** If you don't have one, the paper's underlying data isn't
public and the paper shouldn't claim a replication archive.

---

## 4. `supabase/migrations/00N_<descriptive>.sql`

Use the next migration number. Existing migrations end at `005_*`.

```sql
INSERT INTO research_datasets (
  slug, license, source, contents, is_public
) VALUES
  (
    'replace-with-paper-slug',
    'Code MIT, derived data CC BY 4.0.',
    'REAL PUBLIC SOURCE NAME, REAL PUBLIC SOURCE NAME 2.',
    'FULL CONTENTS PARAGRAPH FROM RESEARCH_DATASETS.',
    true
  )
ON CONFLICT (slug) DO UPDATE
  SET license = EXCLUDED.license,
      source = EXCLUDED.source,
      contents = EXCLUDED.contents,
      is_public = EXCLUDED.is_public,
      updated_at = now();
```

Apply with `supabase db push` or paste into the dashboard SQL editor.

---

## 5. Verify

```bash
npm run build                                                       # must pass
git add -A && git commit -m "Add <slug>"
git push origin claude/rooted-forward-site-avKps
vercel deploy --prod --scope zain-zaidis-projects --yes

curl -s -o /dev/null -w "%{http_code}\n" "https://rooted-forward.org/research/<slug>"
curl -s -o /dev/null -w "%{http_code}\n" "https://rooted-forward.org/research/data/<slug>"
# both should print 200
```

---

## What to remove from the skeleton before publishing

- All-caps placeholders (`REPLACE_WITH_*`)
- `re-NEXT_NUMBER` (replace with the next sequential id)
- Empty arrays where you actually have content
- `sample_rows: []` if you have a verified row from the public record
- `archive_status: "in_preparation"` if the cleaned archive is
  uploaded — flip to `"live"` and add `storage_path`
