import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import CityTourView from "@/components/tours/CityTourView";
import { CITIES, PLACEHOLDER_STOPS } from "@/lib/constants";
import type { City, TourStop } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ city: string }>;
}

function buildFallbackCity(slug: string): City | null {
  const constant = CITIES.find((c) => c.slug === slug);
  if (!constant) return null;
  return {
    id: slug,
    name: constant.name,
    slug: constant.slug,
    description: constant.tagline,
    hero_image: null,
    lat: constant.lat,
    lng: constant.lng,
    zoom: constant.zoom,
  };
}

function buildFallbackStops(citySlug: string): TourStop[] {
  return PLACEHOLDER_STOPS.filter((s) => s.city === citySlug).map(
    (s, index) => ({
      id: `placeholder-${index}`,
      city: s.city,
      slug: s.slug,
      title: s.title,
      lat: s.lat,
      lng: s.lng,
      video_url: s.video_url,
      description: s.description,
      images: s.images,
      sources: s.sources,
      published: true,
      created_at: new Date().toISOString(),
    })
  );
}

async function getCityData(
  citySlug: string
): Promise<{ city: City; stops: TourStop[] } | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();

    const { data: city, error: cityError } = await supabase
      .from("cities")
      .select("*")
      .eq("slug", citySlug)
      .single();

    if (cityError || !city) {
      // Try fallback
      const fallbackCity = buildFallbackCity(citySlug);
      if (!fallbackCity) return null;
      return { city: fallbackCity, stops: buildFallbackStops(citySlug) };
    }

    const { data: stops } = await supabase
      .from("tour_stops")
      .select("*")
      .eq("city", citySlug)
      .eq("published", true);

    return { city, stops: stops ?? buildFallbackStops(citySlug) };
  } catch {
    // Supabase not configured
    const fallbackCity = buildFallbackCity(citySlug);
    if (!fallbackCity) return null;
    return { city: fallbackCity, stops: buildFallbackStops(citySlug) };
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const data = await getCityData(citySlug);

  if (!data) {
    return { title: "City Not Found | Rooted Forward" };
  }

  return {
    title: `${data.city.name} Tour | Rooted Forward`,
    description: data.city.description,
  };
}

export default async function CityTourPage({ params }: PageProps) {
  const { city: citySlug } = await params;
  const data = await getCityData(citySlug);

  if (!data) {
    notFound();
  }

  const { city, stops } = data;

  // Get display name for breadcrumb
  const cityName = city.name;

  return (
    <PageTransition>
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 font-body text-sm text-warm-gray">
              <li>
                <Link
                  href="/tours"
                  className="transition-colors hover:text-forest"
                >
                  Tours
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li className="text-forest font-medium">{cityName}</li>
            </ol>
          </nav>

          {/* City header */}
          <h1 className="font-display text-4xl leading-tight text-forest md:text-6xl">
            {cityName}
          </h1>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-ink/70">
            {city.description}
          </p>

          {/* Map / List toggle view */}
          <div className="mt-12">
            <CityTourView city={city} stops={stops} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
