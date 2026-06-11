import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import { Reveal } from "@/components/motion/Reveal";
import StopActions from "@/components/tours/StopActions";
import CommentsSection from "@/components/tours/CommentsSection";
import RelatedStops from "@/components/tours/RelatedStops";
import ImmersiveTourExperience from "@/components/immersive/ImmersiveTourExperience";
import { CITIES, PLACEHOLDER_STOPS } from "@/lib/constants";
import { getImmersiveTour } from "@/lib/immersive/data";
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
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
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

    // Fetch all stops in city for related stops, in tour order
    const { data: allStopsData } = await supabase
      .from("tour_stops")
      .select("*")
      .eq("city", citySlug)
      .eq("published", true)
      .order("created_at", { ascending: true });

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

  // Immersive tours share this route and take precedence by slug
  const immersive = await getImmersiveTour(city, slug);
  if (immersive) {
    return {
      title: `${immersive.title} | ${getCityName(city)} | Rooted Forward`,
      description: immersive.dek.slice(0, 160),
    };
  }

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

  // Immersive tours (2D/3D hybrid routes) share this URL space. They are
  // matched first; stop slugs and tour slugs are distinct by construction.
  const immersive = await getImmersiveTour(citySlug, slug);
  if (immersive) {
    const cityName = getCityName(citySlug);
    return (
      <PageTransition>
        <PageBanner
          eyebrow={`Immersive Tours / ${cityName}`}
          title={immersive.title}
          dek={immersive.dek}
          meta={[
            `${immersive.stops.length} stops`,
            immersive.medium === "underwater"
              ? "Underwater"
              : immersive.medium === "aerial"
                ? "Aerial"
                : "Street level",
            `${immersive.stops.filter((s) => s.media).length} look-around scenes`,
          ]}
        />
        <ImmersiveTourExperience tour={immersive} />
      </PageTransition>
    );
  }

  const data = await getStopData(citySlug, slug);

  if (!data) {
    notFound();
  }

  const { stop, cityName, allStops } = data;

  // Position of this stop within the tour, for the banner meta row.
  const stopIndex = allStops.findIndex((s) => s.slug === stop.slug);
  const bannerMeta =
    stopIndex >= 0
      ? [`Stop ${String(stopIndex + 1).padStart(2, "0")} of ${String(allStops.length).padStart(2, "0")}`, cityName]
      : [cityName];

  return (
    <PageTransition>
      <PageBanner
        compact
        eyebrow={`Walking Tours / ${cityName}`}
        title={stop.title}
        meta={bannerMeta}
      />

      <article className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <ol className="ledger flex flex-wrap items-center gap-x-3 gap-y-1 text-warm-gray">
              <li>
                <Link
                  href="/tours"
                  className="transition-colors hover:text-forest"
                >
                  Tours
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/tours/${citySlug}`}
                  className="transition-colors hover:text-forest"
                >
                  {cityName}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-forest">{stop.title}</li>
            </ol>
          </nav>

          {/* Video embed */}
          {stop.video_url && (
            <Reveal y={20} className="mt-10">
              <div className="relative aspect-video overflow-hidden rounded-sm border border-border bg-ink">
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
              <p className="ledger mt-3 text-warm-gray">
                Field recording / {stop.title}
              </p>
            </Reveal>
          )}

          {/* Description */}
          <Reveal y={16} className="mt-10">
            <p className="font-body text-lg leading-relaxed text-ink/80 md:text-xl md:leading-relaxed">
              {stop.description}
            </p>
          </Reveal>

          {/* Photo gallery */}
          {stop.images && stop.images.length > 0 && (
            <div className="mt-14 border-t border-border pt-10">
              <p className="eyebrow text-warm-gray">Photos</p>
              <div className="mt-6 grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                {stop.images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] overflow-hidden bg-cream-dark"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`${stop.title} photo ${index + 1}`}
                      className="photo-archival h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {stop.sources && stop.sources.length > 0 && (
            <div className="mt-14 border-t border-border pt-10">
              <p className="eyebrow text-warm-gray">Sources</p>
              <ol className="mt-6 space-y-3">
                {stop.sources.map((source, index) => (
                  <li
                    key={index}
                    className="flex items-baseline gap-4 font-body text-sm leading-relaxed text-ink/70"
                  >
                    <span className="ledger shrink-0 text-warm-gray">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{source}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* User actions (save, visit, share) */}
          <div className="mt-12">
            <StopActions stopId={stop.id} stopTitle={stop.title} stopDescription={stop.description} city={citySlug} />
          </div>

          {/* Comments */}
          <CommentsSection stopId={stop.id} />
        </div>
      </article>

      {/* Related stops */}
      {allStops.length > 1 && (
        <RelatedStops
          currentStopId={stop.id}
          city={citySlug}
          allStops={allStops}
        />
      )}

      {/* Back link */}
      <div className="border-t border-border bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
          <Link
            href="/tours"
            className="group inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back to the {cityName} tour</span>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
