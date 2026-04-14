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
            {/* Left column */}
            <div className="md:col-span-3">
              <h1 className="font-display text-5xl leading-[1.08] tracking-tight text-forest md:text-7xl">
                Every Street Has a Story.
                <br />
                <span className="text-rust">Most Go Untold.</span>
              </h1>

              <p className="mt-8 max-w-xl font-body text-lg leading-relaxed text-ink/75 md:text-xl">
                Rooted Forward is a youth-led nonprofit based in Chicago
                documenting how redlining, urban renewal, and disinvestment
                shaped the neighborhoods we live in. We run walking tours and
                make podcasts so people can see and hear the history that&rsquo;s
                still built into the streets.
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

            {/* Right column */}
            <div className="relative md:col-span-2">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-cream-dark">
                <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hero-diag" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="16" stroke="#1A1A1A" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hero-diag)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-16 w-16 text-warm-gray-light">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                  </svg>
                </div>
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
            Walking Tours &amp; Podcasts
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Walking Tours Card */}
            <Link
              href="/tours"
              className="group rounded-sm border border-cream/10 bg-cream-dark/[0.06] p-10 transition-colors hover:bg-cream-dark/[0.12] md:p-12"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rust/40 text-rust">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <h3 className="mt-6 font-display text-2xl text-cream">
                Walking Tours
              </h3>
              <p className="mt-4 font-body leading-relaxed text-warm-gray-light">
                Self-guided tours across Chicago&rsquo;s South and West sides.
                Each stop connects a specific place to the policy decisions that
                shaped it &mdash; redlining boundaries, urban renewal demolitions,
                highway routes drawn through Black neighborhoods.
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rust/40 text-rust">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              </div>
              <h3 className="mt-6 font-display text-2xl text-cream">
                Podcasts
              </h3>
              <p className="mt-4 font-body leading-relaxed text-warm-gray-light">
                Conversations with historians, residents, and organizers about
                the places our tours visit. We go deeper into the research and
                let community members tell the story in their own words.
              </p>
              <span className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Listen Now &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED TOUR STOP
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
                  This stop looks at how a federal grading system for
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

              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-dark">
                <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-border" />
                <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="featured-diag" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="16" stroke="#1A1A1A" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#featured-diag)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-14 w-14 text-warm-gray-light">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Zm5.25-12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CALL TO ACTION
          ============================================================ */}
      <section className="bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Walk With Us
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We&rsquo;re looking for young researchers, storytellers, tour
            guides, and people who want to show up and do the work. If you care
            about this, we need you.
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
