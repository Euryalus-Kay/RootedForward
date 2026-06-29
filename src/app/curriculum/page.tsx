import { notFound } from "next/navigation";

/* Curriculum is hidden from the site for now (owner request, June 2026).
   Nothing is deleted. The full page is preserved next to this file as
   page.hidden.tsx, and the request form still lives at
   src/components/forms/CurriculumRequestForm.tsx.

   To restore the curriculum:
     1. Delete this file and rename page.hidden.tsx back to page.tsx.
     2. Re-add the "Curriculum" link to the Education dropdown in
        src/components/layout/Navbar.tsx.
     3. Add the /curriculum row back to src/app/sitemap.ts.

   Rendered dynamically so the response carries a real 404 status. */

export const dynamic = "force-dynamic";

export default function CurriculumPage() {
  notFound();
}
