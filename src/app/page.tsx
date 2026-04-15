import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="bg-cream pb-16 pt-28 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="max-w-4xl font-display text-5xl leading-[1.08] tracking-tight text-forest md:text-7xl lg:text-8xl">
            Every Street Has a Story.
            <br />
            <span className="text-rust">Most Go Untold.</span>
          </h1>

          <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-ink/75 md:text-xl">
            Rooted Forward is a youth-led nonprofit based in Chicago
            documenting how redlining, urban renewal, and disinvestment shaped
            the neighborhoods we live in. We run walking tours and make
            podcasts so people can see and hear the history that&rsquo;s still
            built into the streets.
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

          {/* Divider */}
          <hr className="mt-16 border-border" />
        </div>
      </section>

      {/* ============================================================
          WHAT WE DO SECTION
          ============================================================ */}
      <section className="bg-ink py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray-light">
            What We Do
          </p>
          <h2 className="mt-3 font-display text-3xl text-cream md:text-4xl">
            Walking Tours &amp; Podcasts
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Walking Tours Card */}
            <Link
              href="/tours"
              className="group rounded-sm border border-cream/10 bg-cream-dark/[0.06] p-8 transition-colors hover:bg-cream-dark/[0.12] md:p-10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rust/40 text-rust">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              </div>
              <h3 className="mt-5 font-display text-xl text-cream">
                Walking Tours
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-warm-gray-light">
                Self-guided tours across Chicago&rsquo;s South and West sides.
                Each stop connects a specific place to the policy that shaped
                it, including redlining maps, urban renewal demolitions, and highway
                routes through Black neighborhoods.
              </p>
              <span className="mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Explore Tours &rarr;
              </span>
            </Link>

            {/* Podcasts Card */}
            <Link
              href="/podcasts"
              className="group rounded-sm border border-cream/10 bg-cream-dark/[0.06] p-8 transition-colors hover:bg-cream-dark/[0.12] md:p-10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rust/40 text-rust">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              </div>
              <h3 className="mt-5 font-display text-xl text-cream">
                Podcasts
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-warm-gray-light">
                Conversations with historians, residents, and organizers about
                the places our tours visit. We go deeper into the research and
                let community members tell the story in their own words.
              </p>
              <span className="mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Listen Now &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED TOUR STOP
          ============================================================ */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border-l-4 border-rust pl-8 md:pl-12">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Featured Stop
            </p>
            <h2 className="mt-3 font-display text-3xl leading-snug text-forest md:text-4xl">
              The Redlining Boundary at Bronzeville
            </h2>

            <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-ink/75">
              Stand at the corner where the Home Owners&rsquo; Loan Corporation
              drew a red line in 1938 and you can still see it today. Not on a map, but in the built environment. North of the line:
              maintained sidewalks, mature trees, single-family homes. South of
              the line: disinvestment written into every vacant lot.
            </p>
            <p className="mt-4 max-w-3xl font-body leading-relaxed text-ink/60">
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
        </div>
      </section>

      {/* ============================================================
          CALL TO ACTION
          ============================================================ */}
      <section className="bg-forest py-20 md:py-28">
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
