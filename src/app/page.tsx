import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          HERO — split layout: text left, photo right
          ============================================================ */}
      <section className="grid min-h-[90vh] grid-cols-1 lg:grid-cols-2">
        {/* Left: text on solid forest background */}
        <div className="flex flex-col justify-center bg-forest px-6 py-24 sm:px-10 lg:px-16 lg:py-0">
          <h1 className="font-display text-6xl leading-[0.88] tracking-tight text-cream md:text-7xl xl:text-8xl">
            Rooted
            <br />
            Forward
          </h1>
          <p className="mt-8 max-w-md font-body text-base leading-relaxed text-cream/75 md:text-lg">
            A youth-led nonprofit documenting how redlining, urban renewal,
            and disinvestment shaped Chicago. Walking tours. Podcasts.
            Policy campaigns. All led by young people.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/tours"
              className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Explore Tours
            </Link>
            <Link
              href="/policy"
              className="inline-flex items-center rounded-sm border-2 border-cream/30 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:border-cream hover:bg-cream/10"
            >
              Policy Work
            </Link>
          </div>
        </div>

        {/* Right: photo */}
        <div
          className="relative hidden bg-cover bg-center lg:block"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        >
          <div className="absolute inset-0 bg-forest/15" />
        </div>
      </section>

      {/* ============================================================
          WHAT WE DO — three cards
          ============================================================ */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <Link href="/tours" className="group">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-dark">
                <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12 text-warm-gray-light">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-5 font-display text-2xl text-forest transition-colors group-hover:text-rust">
                Walking Tours
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                Self-guided stops across Chicago&rsquo;s South and West sides.
                Each one pairs a location with the policy that shaped it.
              </p>
              <span className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Explore &rarr;
              </span>
            </Link>

            <Link href="/podcasts" className="group">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-dark">
                <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12 text-warm-gray-light">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-5 font-display text-2xl text-forest transition-colors group-hover:text-rust">
                Podcast
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                Conversations with historians, residents, and organizers about
                the places our tours visit.
              </p>
              <span className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                Listen &rarr;
              </span>
            </Link>

            <Link href="/policy" className="group">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-dark">
                <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12 text-warm-gray-light">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                  </svg>
                </div>
              </div>
              <h2 className="mt-5 font-display text-2xl text-forest transition-colors group-hover:text-rust">
                Policy
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                Active campaigns, public comment tools, and a channel for
                residents to propose their own policy ideas.
              </p>
              <span className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                View &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED STOP
          ============================================================ */}
      <section className="border-t border-border bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-cream-dark">
              <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-border" />
              <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="stop-diag" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="16" stroke="#1A1A1A" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#stop-diag)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-14 w-14 text-warm-gray-light">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Zm5.25-12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Featured Stop
              </p>
              <h2 className="mt-3 font-display text-3xl leading-snug text-forest md:text-4xl">
                The Redlining Boundary at Bronzeville
              </h2>
              <p className="mt-6 font-body text-base leading-relaxed text-ink/70">
                Stand at the corner where the Home Owners&rsquo; Loan
                Corporation drew a red line in 1938 and you can still see it
                today. Not on a map, but in the built environment. North of
                the line: maintained sidewalks, mature trees, single-family
                homes. South of the line: disinvestment written into every
                vacant lot.
              </p>
              <Link
                href="/tours/chicago/redlining-boundary-bronzeville"
                className="mt-8 inline-flex w-fit items-center rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                View This Stop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA
          ============================================================ */}
      <section className="bg-forest py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Get Involved
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We are looking for young researchers, storytellers, tour guides,
            and people who want to do the work. If this matters to you, we
            need you.
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
