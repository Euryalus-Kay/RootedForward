import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import { PLACEHOLDER_STOPS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tours | Rooted Forward",
  description:
    "Self-guided walking tours documenting racial inequity in Chicago.",
};

async function getChicagoStops() {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tour_stops")
      .select("*")
      .eq("city", "chicago")
      .eq("published", true)
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // Supabase not configured — fall through
  }

  return PLACEHOLDER_STOPS.filter((s) => s.city === "chicago");
}

export default async function ToursPage() {
  const stops = await getChicagoStops();

  return (
    <PageTransition>
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          {/* Page header */}
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Tours &middot; Chicago
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-forest md:text-6xl">
            Chicago Walking Tour
          </h1>
          <p className="mt-6 max-w-2xl font-body text-lg leading-relaxed text-ink/70">
            Self-guided stops across Chicago&rsquo;s South and West sides.
            Each one connects a specific place to the policy that shaped it,
            including redlining maps, urban renewal plans, and highway routes. Walk
            them in order or pick the ones closest to you.
          </p>

          {/* Stops list */}
          <div className="mt-16 flex flex-col gap-8">
            {stops.map((stop, index) => (
              <Link
                key={stop.slug}
                href={`/tours/chicago/${stop.slug}`}
                className="group block"
              >
                <article className="overflow-hidden rounded-sm border border-border transition-shadow hover:shadow-lg">
                  <div className="flex flex-col md:flex-row">
                    {/* Image placeholder */}
                    <div className="relative aspect-[16/9] w-full bg-cream-dark md:aspect-auto md:w-72 md:flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-border" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="select-none font-display text-6xl leading-none text-warm-gray-light/30">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="bg-cream p-6 md:p-8">
                      <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
                        Stop {index + 1}
                      </p>
                      <h2 className="mt-2 font-display text-xl text-forest md:text-2xl">
                        {stop.title}
                      </h2>
                      <p className="mt-3 font-body leading-relaxed text-ink/65 line-clamp-3">
                        {stop.description}
                      </p>
                      <span className="mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                        View Stop &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Expansion note */}
          <div className="mt-16 rounded-sm border border-border bg-cream-dark p-8 text-center">
            <p className="font-body text-sm text-warm-gray">
              More cities coming soon. Rooted Forward is expanding to New York,
              Dallas, and San Francisco.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
