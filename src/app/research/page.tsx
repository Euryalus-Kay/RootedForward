import { notFound } from "next/navigation";

/* The research section is hidden from the site for now (owner request,
   July 2026). Nothing is deleted. The full catalog page is preserved next
   to this file as page.hidden.tsx, and the same stub pattern covers
   /research/[slug], /research/data, and /research/data/[slug].

   To restore the research section:
     1. Delete the four stub page.tsx files under src/app/research and
        rename each page.hidden.tsx back to page.tsx.
     2. Re-add the "Research" item to NAV_LINKS in
        src/components/layout/Navbar.tsx.
     3. Re-add the /research rows and researchSlugs() pages to
        src/app/sitemap.ts.
     4. Point src/app/policy/briefs/[slug]/page.tsx back at
        /research/<slug> instead of /policy.
     5. Restore the Research band on the home page (src/app/page.tsx)
        and the research pillar copy on /about if wanted.

   Renders the site's 404 page. Like the existing hidden routes (/game,
   /curriculum), the HTTP status stays 200 because the streamed shell
   commits before notFound() throws; the 404 body plus removal from the
   sitemap and navbar is the established hiding pattern here. */

export const dynamic = "force-dynamic";

export default function ResearchPage() {
  notFound();
}
