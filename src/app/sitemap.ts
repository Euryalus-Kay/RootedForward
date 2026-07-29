import { MetadataRoute } from "next";
import { PETITIONS } from "@/lib/petitions";
import { WALK_TOURS } from "@/lib/tours/registry";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rooted-forward.org";

/* The sitemap lists only pages with real content behind them.
   /education (redirects to /tours), /curriculum, and the /research
   section are hidden for now; the placeholder multi-city tour stops
   were removed when the tours page was re-centered on Hyde Park. */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/about/team`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/tours`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    // The Walk Hyde Park audio tour, in the browser
    { url: `${BASE_URL}/tours/hyde-park-walk`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    // added by the switch in src/lib/tours/registry.ts
    ...WALK_TOURS.filter((t) => t.slug !== "hyde-park").map((t) => ({
      url: `${BASE_URL}${t.path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8,
    })),
    // The Ground Keeps Moving, the interactive Hyde Park exhibit
    { url: `${BASE_URL}/tours/chicago/hyde-park`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE_URL}/podcasts`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/policy`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    // One page per open petition, so a bill is findable by its own name
    ...PETITIONS.filter((p) => p.status === "open").map((p) => ({
      url: `${BASE_URL}/policy/petitions/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/get-involved`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];
}
