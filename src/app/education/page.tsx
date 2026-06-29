import { redirect } from "next/navigation";

/* The Education landing page is hidden for now (owner request, June 2026).
   Nothing is deleted. Instead of its own landing page, the Education nav
   entry points straight at the walking tours, so this route redirects
   there too. The original landing page is preserved next to this file as
   page.hidden.tsx.

   To restore the landing page:
     1. Delete this file and rename page.hidden.tsx back to page.tsx.
     2. Point the Education links in src/components/layout/Navbar.tsx and
        the home page (src/app/page.tsx) back at /education.
     3. Add the /education row back to src/app/sitemap.ts. */

export default function EducationPage() {
  redirect("/tours");
}
