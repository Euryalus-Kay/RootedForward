import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rooted-forward.org";

/* The sitemap lists only pages with real content behind them.
   /education (redirects to /tours), /curriculum, and the /research
   section are hidden for now; the placeholder multi-city tour stops
   were removed when the tours page was re-centered on Hyde Park. */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/tours`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    // The Ground Keeps Moving, the interactive Hyde Park exhibit
    { url: `${BASE_URL}/tours/chicago/hyde-park`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE_URL}/podcasts`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/policy`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/get-involved`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];
}
