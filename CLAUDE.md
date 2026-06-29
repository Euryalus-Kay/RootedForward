# Rooted Forward — AI Quick-Start

**Project:** rooted-forward.org. A Chicago-anchored civic site about urban policy, redlining, and displacement. Walking tours, a podcast, a curriculum, a policy section, and a research archive. (A playable game exists in the code but is hidden from the site; see below.)

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Supabase (auth + Postgres + storage) · Vercel hosting.

---

## Common commands

| Task | Command |
|---|---|
| Local dev server | `npm run dev` |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Deploy production | `vercel deploy --prod --scope zain-zaidis-projects --yes` |
| Verify a page | `curl -s -o /dev/null -w "%{http_code}" https://rooted-forward.org/<path>` |

There is no test runner. CI (`.github/workflows/ci.yml`) runs typecheck,
lint, and build separately on every push to `main` or `claude/*`. Match
those locally before pushing. UI changes get verified by `npm run build`
plus `curl` checks against production after deploy.

---

## When the user asks you to add a research paper or dataset

**Read [`docs/RESEARCH-CONTRIBUTING.md`](docs/RESEARCH-CONTRIBUTING.md) first.** It is the canonical end-to-end walkthrough.

Short version:

1. Add the paper as one file in `src/lib/research/papers/<slug>.ts` and register it in `src/lib/research/papers/index.ts`
2. Add the entry record in `src/lib/research-constants.ts` → `PLACEHOLDER_RESEARCH_ENTRIES`
3. Add the dataset metadata in `src/lib/research-datasets.ts` → `RESEARCH_DATASETS`
4. Drop real CSV/JSON files at `public/data/<slug>/<filename>` and mark
   them with `available: true` in the dataset entry
5. Add a seed row to `supabase/migrations/00X_*.sql` (next number)
6. Run the build to confirm

PDFs, charts, citations, the data page, the navbar dropdown, the
in-site spreadsheet viewer, and the admin tracking all read from
those files automatically. Any CSV at `public/data/<slug>/<file>`
with `available: true` shows up as a live sortable, filterable,
paginated spreadsheet on `/research/data/<slug>` and as an audit-
logged download via `/api/research/data/file`.

---

## Immersive tours and the Studio (2D/3D hybrid)

- **Types + placeholder data:** `src/lib/immersive/` (`types.ts`,
  `constants.ts`, `data.ts`, `demo.ts`, `studio-client.ts`). Tours read
  the `immersive_tours` table first and fall back to
  `PLACEHOLDER_IMMERSIVE_TOURS` by (city, slug), same pattern as the
  rest of the site.
- **Player components:** `src/components/immersive/` holds `PanoViewer`
  (dependency-free WebGL equirectangular 360 viewer), `TimelinePlayer`
  (plays a `SequenceDoc` edit live in the browser), and
  `ImmersiveTourExperience` (the scrollytelling hybrid tour reader).
  Immersive tours share `/tours/[city]/[slug]` and match before stops.
- **Admin:** `/admin/immersive` manages tours and 360 media and has a
  no-database player test bench. `/admin/studio` is the AI editor
  (Analyst, Director, Critic agents on `claude-fable-5` via
  `/api/studio/agent`, structured outputs enforced). Uploads go through
  `/api/studio/upload-url` (service-role signed) into the public
  `tour-media` bucket.
- **Env:** `ANTHROPIC_API_KEY` must be set (already in Vercel
  production). Migration `006_immersive_tours.sql` creates the tables,
  policies, and seed; the `tour-media` bucket already exists on the
  production project (50MB per file plan cap).
- **Media honesty:** the shipped 360 assets in `public/media/360` and
  `public/media/studio` are generated, labeled test patterns
  (`scripts/gen-immersive-test-media.py`). Keep test captures labeled
  via the media `note` field until real footage replaces them.

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

## Architecture in three sentences

- **Pages read Supabase first, fall back to TypeScript constants.**
  Every content-driven page (research, policy, podcasts, tours, site
  copy) loads the live row from Supabase, then falls through to the
  matching placeholder array in `src/lib/*-constants.ts`. Both sides
  stay in sync by slug. The pitfall is already noted for research
  entries; the same pattern holds across the site.
- **Auth enforcement is split on purpose.** `src/middleware.ts` only
  requires a logged-in user on `/admin` and `/account`. The admin
  role check is client-side in `src/app/admin/layout.tsx`. This was
  a deliberate workaround for cookie and RLS issues across deploy
  environments. Do not move the role check into middleware.
- **The game is hidden.** `/game` serves a 404 (`notFound()` in
  `src/app/game/page.tsx`) and nothing on the site links to or
  mentions it, by the owner's request. The code under `src/lib/game/`
  and `src/components/game/` is intact so it can be restored, but do
  not re-link it, restyle it, or spend time on it.

---

## Hidden sections (curriculum and the education landing page)

By the owner's request (June 2026) the curriculum and the standalone
education landing page are hidden, not deleted. The full original pages
are preserved next to their routes as `page.hidden.tsx` so restoring
them is a rename, not a rewrite.

- **Curriculum.** `/curriculum` serves a 404 (`notFound()` in
  `src/app/curriculum/page.tsx`). The real page is preserved at
  `src/app/curriculum/page.hidden.tsx`, and the request form still lives
  at `src/components/forms/CurriculumRequestForm.tsx`. The "Curriculum"
  link was removed from the Education dropdown in
  `src/components/layout/Navbar.tsx`.
- **Education landing page.** There is no `/education` landing page. The
  route now redirects to `/tours` (`redirect()` in
  `src/app/education/page.tsx`), the original landing page is preserved
  at `src/app/education/page.hidden.tsx`, and both the navbar "Education"
  link and the home-page Education pillar (`src/app/page.tsx`) point
  straight at `/tours`.
- Both routes were dropped from `src/app/sitemap.ts`.

To restore either one: delete the stub `page.tsx`, rename
`page.hidden.tsx` back to `page.tsx`, re-add the nav/home links and the
sitemap rows. Each stub file has the same checklist in a comment.

---

## Branch and deploy

- Working branch: `claude/rooted-forward-site-avKps`. Never push to `main`.
- Production domain: `rooted-forward.org` (hyphenated; not `rootedforward.org`).
- Deploy command: `vercel deploy --prod --scope zain-zaidis-projects --yes`
- After every commit, push to origin and run the deploy. Verify the
  affected pages return HTTP 200 with `curl -s -o /dev/null -w "%{http_code}"`.

---

## Layout conventions

Pages are plain Tailwind with the site palette tokens (`cream`,
`cream-dark`, `forest`, `rust`, `ink`, `warm-gray`, `border`) and the
`font-display` / `font-body` families. Section eyebrows are
`font-body text-xs font-semibold uppercase tracking-[0.25em]`,
headings are `font-display text-3xl text-forest md:text-4xl`, cards
are `rounded-sm border border-border` on cream, and primary CTAs are
rust, uppercase, tracking-widest. A design-system v2 overhaul was
built and then removed at the owner's request (reverted June 2026);
do not reintroduce its shared `PageBanner`/`SectionHeading`/motion
library without being asked.

---

## Where things live

| Concern | Path |
|---|---|
| Research entries (placeholder data) | `src/lib/research-constants.ts` |
| Research papers (one file each) | `src/lib/research/papers/<slug>.ts` + `index.ts` |
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
