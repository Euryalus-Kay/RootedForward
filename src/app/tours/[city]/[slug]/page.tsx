import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import StopActions from "@/components/tours/StopActions";
import CommentsSection from "@/components/tours/CommentsSection";
import RelatedStops from "@/components/tours/RelatedStops";
import { CITIES, PLACEHOLDER_STOPS } from "@/lib/constants";
import type { TourStop } from "@/lib/types/database";

interface PageProps {
  params: Promise<{ city: string; slug: string }>;
}

function getCityName(citySlug: string): string {
  const city = CITIES.find((c) => c.slug === citySlug);
  return city?.name ?? citySlug;
}

function buildFallbackStop(
  citySlug: string,
  stopSlug: string
): TourStop | null {
  const placeholder = PLACEHOLDER_STOPS.find(
    (s) => s.city === citySlug && s.slug === stopSlug
  );
  if (!placeholder) return null;
  return {
    id: `placeholder-${stopSlug}`,
    city: placeholder.city,
    slug: placeholder.slug,
    title: placeholder.title,
    lat: placeholder.lat,
    lng: placeholder.lng,
    video_url: placeholder.video_url,
    description: placeholder.description,
    images: placeholder.images,
    sources: placeholder.sources,
    published: true,
    created_at: new Date().toISOString(),
  };
}

function getAllFallbackStops(citySlug: string): TourStop[] {
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

async function getStopData(
  citySlug: string,
  stopSlug: string
): Promise<{ stop: TourStop; cityName: string; allStops: TourStop[] } | null> {
  let cityName = getCityName(citySlug);

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // Fetch city name from Supabase if available
    const { data: cityRow } = await supabase
      .from("cities")
      .select("*")
      .eq("slug", citySlug)
      .single();

    const cityData = cityRow as { name: string } | null;
    if (cityData) {
      cityName = cityData.name;
    }

    const { data: stop, error } = await supabase
      .from("tour_stops")
      .select("*")
      .eq("city", citySlug)
      .eq("slug", stopSlug)
      .eq("published", true)
      .single();

    if (error || !stop) {
      const fallback = buildFallbackStop(citySlug, stopSlug);
      if (!fallback) return null;
      return { stop: fallback, cityName, allStops: getAllFallbackStops(citySlug) };
    }

    // Fetch all stops in city for related stops
    const { data: allStopsData } = await supabase
      .from("tour_stops")
      .select("*")
      .eq("city", citySlug)
      .eq("published", true);

    return { stop, cityName, allStops: allStopsData ?? getAllFallbackStops(citySlug) };
  } catch {
    const fallback = buildFallbackStop(citySlug, stopSlug);
    if (!fallback) return null;
    return { stop: fallback, cityName, allStops: getAllFallbackStops(citySlug) };
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city, slug } = await params;
  const data = await getStopData(city, slug);

  if (!data) {
    return { title: "Stop Not Found | Rooted Forward" };
  }

  return {
    title: `${data.stop.title} | ${data.cityName} Tour | Rooted Forward`,
    description: data.stop.description.slice(0, 160),
  };
}

export default async function StopDetailPage({ params }: PageProps) {
  const { city: citySlug, slug } = await params;
  const data = await getStopData(citySlug, slug);

  if (!data) {
    notFound();
  }

  const { stop, cityName, allStops } = data;

  return (
    <PageTransition>
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 font-body text-sm text-warm-gray">
              <li>
                <Link
                  href="/tours"
                  className="transition-colors hover:text-forest"
                >
                  Tours
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li>
                <Link
                  href={`/tours/${citySlug}`}
                  className="transition-colors hover:text-forest"
                >
                  {cityName}
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li className="font-medium text-forest">{stop.title}</li>
            </ol>
          </nav>

          {/* Stop title */}
          <h1 className="font-display text-4xl leading-tight text-forest md:text-5xl">
            {stop.title}
          </h1>

          {/* City badge */}
          <span className="mt-4 inline-block rounded-full bg-forest/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest">
            {cityName}
          </span>

          {/* Video embed */}
          {stop.video_url && (
            <div className="mt-10">
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-ink">
                {/* Play icon placeholder behind iframe */}
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-16 w-16 text-warm-gray/40">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                  </svg>
                </div>
                <iframe
                  src={stop.video_url}
                  title={`Video: ${stop.title}`}
                  className="absolute inset-0 z-10 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mt-10">
            <p className="font-body text-lg leading-relaxed text-ink/80">
              {stop.description}
            </p>
          </div>

          {/* Photo gallery */}
          {stop.images && stop.images.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display text-2xl text-forest">Photos</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {stop.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-cream-dark"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${stop.title} photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {stop.sources && stop.sources.length > 0 && (
            <div className="mt-14 border-t border-border pt-10">
              <h2 className="font-display text-2xl text-forest">Sources</h2>
              <ol className="mt-6 list-decimal space-y-3 pl-6">
                {stop.sources.map((source, index) => (
                  <li
                    key={index}
                    className="font-body text-sm leading-relaxed text-warm-gray"
                  >
                    {source}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* User actions (save, visit, share) */}
          <div className="mt-10">
            <StopActions stopId={stop.id} stopTitle={stop.title} stopDescription={stop.description} city={citySlug} />
          </div>

          {/* Comments */}
          <div className="mt-14 border-t border-border pt-10">
            <CommentsSection stopId={stop.id} />
          </div>

          {/* Related stops */}
          {allStops.length > 1 && (
            <div className="mt-14 border-t border-border pt-10">
              <RelatedStops
                currentStopId={stop.id}
                city={citySlug}
                allStops={allStops}
              />
            </div>
          )}

          {/* Back link */}
          <div className="mt-14 border-t border-border pt-10">
            <Link
              href={`/tours/${citySlug}`}
              className="inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-light"
            >
              &larr; Back to {cityName} Tour
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
