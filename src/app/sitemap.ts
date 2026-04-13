import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rootedforward.org";

const CITIES = ["chicago", "new-york", "dallas", "san-francisco"];

const STOPS = [
  { city: "chicago", slug: "redlining-boundary-bronzeville" },
  { city: "chicago", slug: "pilsen-anti-displacement-murals" },
  { city: "chicago", slug: "hyde-park-urban-renewal" },
  { city: "new-york", slug: "cross-bronx-expressway" },
  { city: "new-york", slug: "harlem-blockbusting-corridor" },
  { city: "dallas", slug: "central-expressway-wall" },
  { city: "dallas", slug: "freedmans-cemetery" },
  { city: "san-francisco", slug: "fillmore-urban-renewal" },
  { city: "san-francisco", slug: "bayview-hunters-point-shipyard" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/tours`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/podcasts`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE_URL}/get-involved`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  const cityPages = CITIES.map((city) => ({
    url: `${BASE_URL}/tours/${city}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const stopPages = STOPS.map((stop) => ({
    url: `${BASE_URL}/tours/${stop.city}/${stop.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages, ...stopPages];
}
