import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import { CITIES, PLACEHOLDER_STOPS } from "@/lib/constants";
import type { City } from "@/lib/types/database";

export const metadata: Metadata = {
  title: "Tours | Rooted Forward",
  description:
    "Self-guided walking tours documenting racial inequity in Chicago, New York, Dallas, and San Francisco.",
};

const STOP_COUNTS: Record<string, number> = {
  chicago: 3,
  "new-york": 2,
  dallas: 2,
  "san-francisco": 2,
};

async function getCities(): Promise<
  Array<{
    name: string;
    slug: string;
    tagline: string;
    stopCount: number;
  }>
> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: cities } = await supabase.from("cities").select("*");

    if (cities && cities.length > 0) {
      return cities.map((city: City) => ({
        name: city.name,
        slug: city.slug,
        tagline: city.description,
        stopCount: STOP_COUNTS[city.slug] ?? 0,
      }));
    }
  } catch {
    // Supabase not configured — fall through to constants
  }

  return CITIES.map((city) => ({
    name: city.name,
    slug: city.slug,
    tagline: city.tagline,
    stopCount:
      PLACEHOLDER_STOPS.filter((s) => s.city === city.slug).length,
  }));
}

export default async function ToursPage() {
  const cities = await getCities();

  return (
    <PageTransition>
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          {/* Page header */}
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Tours
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest md:text-6xl">
            Walk the History They Paved Over
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-ink/70">
            Self-guided walking tours that trace the physical legacy of
            redlining, urban renewal, and displacement across four American
            cities. Each stop pairs a place with the policy that shaped
            it&mdash;so you can see the history the sidewalk remembers.
          </p>

          {/* City grid */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {cities.map((city) => (
              <Link
                key={city.slug}
                href={`/tours/${city.slug}`}
                className="group block"
              >
                <article className="overflow-hidden rounded-sm border border-border transition-shadow hover:shadow-lg">
                  {/* Placeholder image area */}
                  <div className="relative aspect-[3/4] w-full bg-cream-dark">
                    <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                    {/* Large watermark letter */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="select-none font-display text-[12rem] leading-none text-warm-gray-light/20">
                        {city.name.charAt(0)}
                      </span>
                    </div>
                    {/* Map pin icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-14 w-14 text-warm-gray-light">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/50 to-transparent px-6 py-5">
                      <h2 className="font-display text-2xl text-cream md:text-3xl">
                        {city.name}
                      </h2>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="bg-cream p-6">
                    <p className="font-body leading-relaxed text-ink/65">
                      {city.tagline}
                    </p>
                    <p className="mt-3 font-body text-sm font-medium text-warm-gray">
                      {city.stopCount}{" "}
                      {city.stopCount === 1 ? "stop" : "stops"}
                    </p>
                    <span className="mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                      Explore City &rarr;
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
