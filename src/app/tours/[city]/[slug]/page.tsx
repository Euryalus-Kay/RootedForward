import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/layout/PageTransition";
import StopActions from "@/components/tours/StopActions";
import CommentsSection from "@/components/tours/CommentsSection";
import RelatedStops from "@/components/tours/RelatedStops";
import ImmersiveTourExperience from "@/components/immersive/ImmersiveTourExperience";
import GroundShell, { GROUND_DEK, GROUND_TITLE } from "@/components/exhibit/ground/GroundShell";
import { CITIES, PLACEHOLDER_STOPS } from "@/lib/constants";
import { getImmersiveTour } from "@/lib/immersive/data";
import type { TourStop } from "@/lib/types/database";

/* Meta descriptions come from longer body copy; cut at a word boundary
   under the limit instead of mid-word. */
function metaDescription(text: string, limit = 160): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : limit).replace(/[,;.]?$/, "")}...`;
}

interface PageProps {
  params: Promise<{ city: string; slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  // ids must match buildFallbackStop's `placeholder-${slug}` scheme or
  // RelatedStops cannot exclude the current stop from its own list
  return PLACEHOLDER_STOPS.filter((s) => s.city === citySlug).map(
    (s) => ({
      id: `placeholder-${s.slug}`,
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

// viewport-fit=cover lets the exhibit's fixed chrome (HUD strip, timeline
// spine, caption plate) read env(safe-area-inset-*) and clear the iPhone
// notch and home indicator; harmless for the other tours on this route
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city, slug } = await params;

  // The Ground Keeps Moving, the Hyde Park exhibit (live since July 2026)
  if (city === "chicago" && (slug === "hyde-park" || slug === "hyde-park-exhibit")) {
    return {
      title: `${GROUND_TITLE} | Hyde Park | Rooted Forward`,
      description: metaDescription(GROUND_DEK),
    };
  }

  // Immersive tours share this route and take precedence by slug
  const immersive = await getImmersiveTour(city, slug);
  if (immersive) {
    return {
      title: `${immersive.title} | ${getCityName(city)} | Rooted Forward`,
      description: metaDescription(immersive.dek),
    };
  }

  const data = await getStopData(city, slug);

  if (!data) {
    return { title: "Stop Not Found | Rooted Forward" };
  }

  return {
    title: `${data.stop.title} | ${data.cityName} Tour | Rooted Forward`,
    description: metaDescription(data.stop.description),
  };
}

export default async function StopDetailPage({ params, searchParams }: PageProps) {
  const { city: citySlug, slug } = await params;

  // The Ground Keeps Moving, the interactive Hyde Park exhibit, live on the
  // public slug since July 2026. It replaced the film page (the player and
  // its mp4s live in git history before the exhibit-live tag). The old
  // preview slug redirects so shared links keep working. Intentionally
  // outside PageTransition (QC screenshots must capture real frames).
  if (citySlug === "chicago" && slug === "hyde-park") {
    return <GroundShell />;
  }
  // The R9 construction slug redirects back to the live page now that
  // the rebuild has swapped in; shared links from the build keep working.
  if (citySlug === "chicago" && slug === "hyde-park-exhibit") {
    const sp = (await searchParams) ?? {};
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") qs.set(k, v);
      else if (Array.isArray(v)) for (const item of v) qs.append(k, item);
    }
    const suffix = qs.size > 0 ? `?${qs.toString()}` : "";
    redirect(`/tours/chicago/hyde-park${suffix}`);
  }

  // Immersive tours (2D/3D hybrid routes) share this URL space. They are
  // matched first; stop slugs and tour slugs are distinct by construction.
  const immersive = await getImmersiveTour(citySlug, slug);
  if (immersive) {
    const cityName = getCityName(citySlug);

    const lookAround = immersive.stops.filter((s) => s.media).length;
    return (
      <PageTransition>
        <section className="bg-cream pt-20 md:pt-28">
          <div className="mx-auto max-w-6xl px-6">
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
                {/* /tours/[city] redirects to /tours, so the city crumb
                    is plain text rather than a bounce link */}
                <li>{cityName}</li>
                <li aria-hidden="true">&gt;</li>
                <li className="font-medium text-forest">{immersive.title}</li>
              </ol>
            </nav>

            <h1 className="font-display text-4xl leading-tight text-forest md:text-5xl">
              {immersive.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-block rounded-full bg-forest/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest">
                {cityName}
              </span>
              <span className="inline-block rounded-full bg-rust/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-rust">
                {immersive.medium === "underwater"
                  ? "Underwater"
                  : immersive.medium === "aerial"
                    ? "Aerial"
                    : "Street level"}
              </span>
              <span className="inline-block rounded-full bg-forest/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest">
                {immersive.stops.length} stops
              </span>
              {lookAround > 0 && (
                <span className="inline-block rounded-full bg-forest/10 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest">
                  {lookAround} look-around scenes
                </span>
              )}
            </div>

            <p className="mt-6 max-w-[65ch] font-body text-base leading-relaxed text-ink/70">
              {immersive.dek}
            </p>
          </div>
        </section>
        <ImmersiveTourExperience tour={immersive} />
      </PageTransition>
    );
  }

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
              {/* /tours/[city] redirects to /tours, so the city crumb
                  is plain text rather than a bounce link */}
              <li>{cityName}</li>
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
              href="/tours"
              className="inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-light"
            >
              &larr; Back to Tours
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
