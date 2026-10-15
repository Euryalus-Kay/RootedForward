import { notFound } from "next/navigation";

/* The podcast is hidden from the site for now (owner request, October
   2026). Nothing is deleted. The full page is preserved next to this
   file as page.hidden.tsx and its skeleton as loading.hidden.tsx; the
   admin screen at /admin/podcasts, the /api/podcasts route and the
   podcasts table are untouched.

   To restore the podcast:
     1. Delete this file, rename page.hidden.tsx back to page.tsx and
        loading.hidden.tsx back to loading.tsx.
     2. Re-add the "Podcast" link to NAV_LINKS in
        src/components/layout/Navbar.tsx and to the footer links in
        src/components/layout/Footer.tsx, and put "a podcast" back in
        the footer blurb and the site description in src/app/layout.tsx.
     3. Uncomment the podcast rows in src/app/page.tsx (WORK, plus the
        MicrophoneIcon above it) and src/app/about/page.tsx (WORK), and
        put it back in the sentence on src/app/app-verification/page.tsx.
     4. Uncomment the "Be a podcast guest" tab in
        src/components/forms/JoinForm.tsx and restore the description on
        src/app/get-involved/page.tsx.
     5. Set PODCASTS_HIDDEN to false in src/components/ui/SearchModal.tsx.
     6. Add the /podcasts row back to src/app/sitemap.ts.

   Rendered dynamically so the response carries a real 404 status. */

export const dynamic = "force-dynamic";

export default function PodcastsPage() {
  notFound();
}
