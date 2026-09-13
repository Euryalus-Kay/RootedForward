import { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://rooted-forward.org").trim();

/* Crawling is open as of September 2026, so searching for the organisation
   by name finds it. Everything listed under disallow is either gated, an
   endpoint rather than a page, or deliberately unlisted.

   The museum kiosk is the interesting one. It is a 7MB single-file exhibit
   meant for one screen on a wall, not for search results, and it also
   carries an X-Robots-Tag noindex header in vercel.json. robots.txt alone
   only asks a crawler not to fetch a page, it does not stop the URL being
   listed if something links to it, so the header is what actually settles
   it. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/account",
          "/auth/",
          "/api/",
          "/kiosk/",
          "/game",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
