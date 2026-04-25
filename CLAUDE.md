# Rooted Forward — AI Quick-Start

**Project:** rooted-forward.org. A Chicago-anchored civic site about urban policy, redlining, and displacement. Walking tours, a podcast, a playable game, a curriculum, a policy section, and a research archive.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Supabase (auth + Postgres + storage) · Vercel hosting.

---

## When the user asks you to add a research paper or dataset

**Read [`docs/RESEARCH-CONTRIBUTING.md`](docs/RESEARCH-CONTRIBUTING.md) first.** It is the canonical end-to-end walkthrough.

Short version:

1. Add the paper body in `src/lib/research-seed-content*.ts` (or inline)
2. Add the entry record in `src/lib/research-constants.ts` → `PLACEHOLDER_RESEARCH_ENTRIES`
3. Add the dataset metadata in `src/lib/research-datasets.ts` → `RESEARCH_DATASETS`
4. Add a seed row to `supabase/migrations/00X_*.sql` (next number)
5. Run the build to confirm

PDFs, charts, citations, the data page, the navbar dropdown, and the
admin tracking all read from those files automatically. There is no
sixth place to update.

---

## Hard rules

- **Real data only.** Never invent sample rows, citations, FOIA numbers,
  reviewer names, or oral-history quotes. If the data is not real, do
  not put it on the site. See "Real Data Policy" in `docs/RESEARCH-CONTRIBUTING.md`.
- **No em-dashes (` — `) in user-visible text.** They are the most
  reliable AI tell on this site. Use commas, periods, parentheses,
  or `since`/`because` clauses instead. Code comments are fine.
- **No colons inside sentences.** "X is Y: a Z that does Q" is the
  second-most-reliable AI tell. List-introducing colons before a real
  list are fine. Citation place + publisher colons are fine. Sentence-
  internal explanatory colons get replaced with a period or "namely".
- **No colons in titles or headings.** Rename them. The site has no
  paper titled "X: A Subtitle" any more.

---

## Branch and deploy

- Working branch: `claude/rooted-forward-site-avKps`. Never push to `main`.
- Production domain: `rooted-forward.org` (hyphenated; not `rootedforward.org`).
- Deploy command: `vercel deploy --prod --scope zain-zaidis-projects --yes`
- After every commit, push to origin and run the deploy. Verify the
  affected pages return HTTP 200 with `curl -s -o /dev/null -w "%{http_code}"`.

---

## Layout conventions across top-level pages

Every top-level page (`/research`, `/research/data`, `/policy`, `/game`,
`/podcasts`, `/education`) shares the banner pattern:

```tsx
<section className="relative pt-16 pb-12 md:pb-16">
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
  />
  <div className="absolute inset-0 bg-forest/70" />
  <div className="relative z-10 flex flex-col items-center justify-center pt-12 md:pt-16">
    <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/80">
      Section
    </p>
    <h1 className="mt-3 font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
      Page Title
    </h1>
  </div>
</section>
```

Match this exactly when adding a new top-level page.

---

## Where things live

| Concern | Path |
|---|---|
| Research entries (placeholder data) | `src/lib/research-constants.ts` |
| Research bodies (markdown) | `src/lib/research-seed-content*.ts` |
| Dataset metadata | `src/lib/research-datasets.ts` |
| Database schema | `supabase/migrations/*.sql` |
| Public research catalog | `src/app/research/page.tsx` |
| Paper detail page | `src/app/research/[slug]/page.tsx` |
| Data archive index | `src/app/research/data/page.tsx` |
| Data archive detail | `src/app/research/data/[slug]/page.tsx` |
| PDF generation | `src/app/api/research/pdf/route.ts` |
| Auth-gated download | `src/app/api/research/data/download/route.ts` |
| Admin sidebar | `src/app/admin/layout.tsx` |
| Admin data-usage log | `src/app/admin/research/data-usage/page.tsx` |
| Markdown renderer (charts, citations) | `src/components/research/ResearchMarkdown.tsx` |
| Chart renderer | `src/components/research/ResearchChart.tsx` |

---

## Common pitfalls when extending

- **Both `PLACEHOLDER_RESEARCH_ENTRIES` and the SQL seed need the same
  slug.** The page reads from Supabase first, then falls back to the
  placeholder constants. Keep them in sync.
- **Charts are JSON inside ` ```chart ` fences in the markdown body.**
  See `ResearchChart.tsx` for the full schema. Bar / line / pie are
  the supported types. Caption and title are required.
- **Citations use `[^N]` or `[cite:N]` syntax in the markdown body and
  resolve against the `citations` array on the entry record.**
- **The research-datasets storage bucket is private.** Reads happen
  through the API route, never via the public bucket URL.
- **Migration numbers must be monotonic.** Existing migrations through
  `005_research_data_downloads.sql`. New ones start at 006.

---

## Helpful skills

If the project uses your `claude-code-guide` skill or similar, refer to
the deeper guides there. For Anthropic-specific guidance not project-
specific, defer to the user's general instructions.
