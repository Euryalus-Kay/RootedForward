import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="paper-texture relative min-h-screen bg-cream">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-32 lg:py-40">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-5 md:gap-16">
            {/* Left column — 60 % */}
            <div className="md:col-span-3">
              <h1 className="font-display text-5xl leading-[1.08] tracking-tight text-forest md:text-7xl">
                Every Street Has a Story.
                <br />
                <span className="text-rust">Most Go Untold.</span>
              </h1>

              <p className="mt-8 max-w-xl font-body text-lg leading-relaxed text-ink/75 md:text-xl">
                Rooted Forward is a youth-led nonprofit documenting racial
                inequity through walking tours and podcasts in Chicago, New York,
                Dallas, and San Francisco. We turn sidewalks into classrooms and
                microphones into megaphones.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/tours"
                  className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Explore Our Tours
                </Link>
                <Link
                  href="/podcasts"
                  className="inline-flex items-center rounded-sm border-2 border-forest px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
                >
                  Listen to the Podcast
                </Link>
              </div>
            </div>

            {/* Right column — 40 % */}
            <div className="relative md:col-span-2">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-cream-dark">
                {/* Placeholder for hero image */}
                <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent px-5 py-4">
                  <p className="font-body text-xs tracking-wide text-cream/90">
                    Youth tour guide in Bronzeville, Chicago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT WE DO SECTION
          ============================================================ */}
      <section className="bg-ink py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray-light">
            What We Do
          </p>
          <h2 className="mt-3 font-display text-3xl text-cream md:text-4xl">
            Two Ways We Tell the Story
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Walking Tours Card */}
            <Link
              href="/tours"
              className="group rounded-sm border border-cream/10 bg-cream-dark/[0.06] p-10 transition-colors hover:bg-cream-dark/[0.12] md:p-12"
            >
              {/* Icon area */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rust/40 text-rust">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
              </div>

              <h3 className="mt-6 font-display text-2xl text-cream">
                Walking Tours
              </h3>
              <p className="mt-4 font-body leading-relaxed text-warm-gray-light">
                Youth-led walking tours that trace the physical legacy of
                redlining, urban renewal, and displacement across four American
                cities. Each stop is a lesson the sidewalk remembers.
              </p>
              <span className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Explore Tours &rarr;
              </span>
            </Link>

            {/* Podcasts Card */}
            <Link
              href="/podcasts"
              className="group rounded-sm border border-cream/10 bg-cream-dark/[0.06] p-10 transition-colors hover:bg-cream-dark/[0.12] md:p-12"
            >
              {/* Icon area */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rust/40 text-rust">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                  />
                </svg>
              </div>

              <h3 className="mt-6 font-display text-2xl text-cream">
                Podcasts
              </h3>
              <p className="mt-4 font-body leading-relaxed text-warm-gray-light">
                Long-form audio storytelling that amplifies community voices,
                archival recordings, and original reporting. Hear the history
                that never made it into the textbook.
              </p>
              <span className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Listen Now &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED TOUR PREVIEW SECTION
          ============================================================ */}
      <section className="bg-cream py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border-l-4 border-rust pl-8 md:pl-12">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Featured Stop
            </p>
            <h2 className="mt-3 font-display text-3xl leading-snug text-forest md:text-5xl">
              The Redlining Boundary
              <br className="hidden md:block" /> at Bronzeville
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
              {/* Left: description */}
              <div>
                <p className="font-body text-lg leading-relaxed text-ink/75">
                  Stand at the corner where the Home Owners&rsquo; Loan
                  Corporation drew a red line in 1938 and you can still see it
                  today &mdash; not on a map, but in the built environment.
                  North of the line: maintained sidewalks, mature trees,
                  single-family homes. South of the line: disinvestment written
                  into every vacant lot and shuttered storefront.
                </p>
                <p className="mt-6 font-body leading-relaxed text-ink/60">
                  This stop examines how a federal policy designed to grade
                  &ldquo;mortgage risk&rdquo; became a self-fulfilling prophecy
                  that shaped Bronzeville for nearly a century.
                </p>
                <Link
                  href="/tours/chicago/redlining-boundary-bronzeville"
                  className="mt-8 inline-flex items-center rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  View This Stop
                </Link>
              </div>

              {/* Right: placeholder image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-dark">
                <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-border" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CITY CHAPTERS SECTION
          ============================================================ */}
      <section className="border-t border-border bg-cream py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Our Chapters
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Four Cities. Four Histories.
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2">
            {[
              {
                city: "Chicago",
                tagline:
                  "From Bronzeville to Pilsen, traces of segregation written into the grid.",
                href: "/tours/chicago",
              },
              {
                city: "New York",
                tagline:
                  "Redlines, renewal, and resistance across five boroughs.",
                href: "/tours/new-york",
              },
              {
                city: "Dallas",
                tagline:
                  "Highway walls and invisible borders in the heart of Texas.",
                href: "/tours/dallas",
              },
              {
                city: "San Francisco",
                tagline:
                  "Displacement, demolition, and the fight for the Fillmore.",
                href: "/tours/san-francisco",
              },
            ].map(({ city, tagline, href }) => (
              <Link
                key={city}
                href={href}
                className="group bg-cream p-10 transition-colors hover:bg-cream-dark md:p-12"
              >
                <h3 className="font-display text-2xl text-forest md:text-3xl">
                  {city}
                </h3>
                <p className="mt-3 font-body leading-relaxed text-ink/60">
                  {tagline}
                </p>
                <span className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                  Explore &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CALL TO ACTION SECTION
          ============================================================ */}
      <section className="bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Walk With Us
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            Whether you want to lead a tour, research local history, produce a
            podcast episode, or simply show up and listen &mdash; there is a
            place for you in this work.
          </p>
          <Link
            href="/get-involved"
            className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
