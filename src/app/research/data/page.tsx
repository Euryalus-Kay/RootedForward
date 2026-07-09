import { notFound } from "next/navigation";

/* Hidden with the rest of the research section (owner request, July 2026).
   The real data archive index is preserved as page.hidden.tsx beside this
   file. See src/app/research/page.tsx for the full restore checklist.

   Renders the site's 404 page. Like the existing hidden routes (/game,
   /curriculum), the HTTP status stays 200 because the streamed shell
   commits before notFound() throws; the 404 body plus removal from the
   sitemap and navbar is the established hiding pattern here. */

export const dynamic = "force-dynamic";

export default function ResearchDataPage() {
  notFound();
}
