import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-cream pb-8 pt-28 md:pt-36">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="font-display text-5xl tracking-tight text-forest md:text-7xl lg:text-8xl">
            Rooted Forward
          </h1>
          <p className="mt-8 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75">
            We are a youth-led nonprofit in Chicago that traces what
            redlining, urban renewal, and highway construction did to the
            neighborhoods people live in today. We do that through walking
            tours that put you on the streets where those decisions landed,
            a podcast that records what residents and historians have to say
            about it, and policy work that tries to change the patterns that
            are still running. Everything here is researched, written, and
            led by young people.
          </p>
          <hr className="mt-12 border-border" />
        </div>
      </section>

      {/* Navigation cards */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-4xl px-6">
          <div className="flex flex-col gap-6">
            {/* Tours */}
            <Link
              href="/tours"
              className="group block border-t border-border pt-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    Walking Tours
                  </h2>
                  <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-ink/65">
                    Self-guided stops across Chicago&rsquo;s South and West
                    sides. Each one pairs a location with the policy decision
                    that shaped it. Redlining boundaries you can still see in
                    the infrastructure. Urban renewal demolitions. Highway
                    routes drawn through the middle of Black neighborhoods.
                  </p>
                </div>
                <span className="mt-2 flex-shrink-0 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                  Explore &rarr;
                </span>
              </div>
            </Link>

            {/* Podcast */}
            <Link
              href="/podcasts"
              className="group block border-t border-border pt-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    Podcast
                  </h2>
                  <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-ink/65">
                    Conversations with historians, residents, and organizers
                    about the places our tours visit. The research behind
                    each stop, told by the people who lived it.
                  </p>
                </div>
                <span className="mt-2 flex-shrink-0 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                  Listen &rarr;
                </span>
              </div>
            </Link>

            {/* Policy */}
            <Link
              href="/policy"
              className="group block border-t border-border pt-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    Policy
                  </h2>
                  <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-ink/65">
                    Active campaigns you can sign onto, tools for drafting
                    public comments and policy proposals, and a channel for
                    residents to submit their own ideas. The second half of
                    the work.
                  </p>
                </div>
                <span className="mt-2 flex-shrink-0 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                  View &rarr;
                </span>
              </div>
            </Link>

            {/* About */}
            <Link
              href="/about"
              className="group block border-t border-border pt-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    About
                  </h2>
                  <p className="mt-3 max-w-xl font-body text-base leading-relaxed text-ink/65">
                    Who we are, how we started, and the student and advisory
                    boards that run the organization.
                  </p>
                </div>
                <span className="mt-2 flex-shrink-0 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                  Read &rarr;
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
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
