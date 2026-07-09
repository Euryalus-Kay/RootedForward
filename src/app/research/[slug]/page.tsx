import { notFound } from "next/navigation";

/* Hidden with the rest of the research section (owner request, July 2026).
   The real paper detail page is preserved as page.hidden.tsx beside this
   file. See src/app/research/page.tsx for the full restore checklist.

   Rendered dynamically so the response carries a real 404 status. */

export const dynamic = "force-dynamic";

export default function ResearchEntryPage() {
  notFound();
}
