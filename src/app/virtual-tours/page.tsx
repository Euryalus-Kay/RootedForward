import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Virtual Tours | Rooted Forward",
  description:
    "Self-paced online versions of our Chicago walking tours, with archival photos, primary sources, and audio commentary at every stop.",
};

const FEATURES = [
  {
    title: "Archival imagery",
    body: "Each stop pairs a present-day photograph with a HOLC map fragment, a 1950s aerial, or a city planning document from the period.",
  },
  {
    title: "Audio at every stop",
    body: "Three-to-five minute commentaries by our youth researchers — the same script used on the in-person tour, with optional captions.",
  },
  {
    title: "Primary sources",
    body: "Click through to the actual surveyor notes, deed restrictions, and city ordinances that shaped each block.",
  },
  {
    title: "Built for class",
    body: "Stops can be assigned individually or in sequence. A teacher mode hides the navigation chrome and reveals discussion prompts.",
  },
];

const TOURS = [
  {
    eyebrow: "Tour 01",
    title: "The Redlining Boundary at Bronzeville",
    blurb:
      "Eight stops along the eastern edge of HOLC area D28, from the corner where the Home Owners' Loan Corporation drew the line in 1938 to the disinvestment you can still see today.",
    duration: "~25 min",
  },
  {
    eyebrow: "Tour 02",
    title: "Pilsen's Anti-Displacement Murals",
    blurb:
      "A mural-by-mural reading of the political art on 16th Street, set against four decades of displacement pressure on Chicago's largest historically Mexican-American neighborhood.",
    duration: "~20 min",
  },
  {
    eyebrow: "Tour 03",
    title: "Hyde Park Urban Renewal",
    blurb:
      "What the University of Chicago demolished, what it built, and what the neighborhood organized to defend, traced across six blocks of the South Side.",
    duration: "~30 min",
  },
];

export default function VirtualToursPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* Banner */}
        <section className="relative pt-16 pb-12 md:pb-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
            <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              Virtual Tours
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="bg-cream pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl px-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Self-paced
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
              The walking tour, without the walk
            </h2>
            <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75">
              Our virtual tours are designed for classrooms outside Chicago
              and for anyone who can&rsquo;t make it to a stop in person. Same
              scripts, same primary sources, same youth-led commentary. Open
              one in a browser and walk through the history at your own pace.
            </p>
          </div>
        </section>

        {/* Coming soon callout */}
        <section className="bg-cream py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="border-l-4 border-rust bg-cream-dark p-8 md:p-10">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                In production
              </p>
              <h3 className="mt-3 font-display text-2xl text-forest md:text-3xl">
                Launching fall 2026
              </h3>
              <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/70">
                The first three virtual tours are in production with a
                target launch this fall. We&rsquo;ll publish a beta to our
                educator list first &mdash; if you teach high-school history,
                civics, or geography, sign up to get early access and help us
                test it with your students.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Join the educator beta
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl text-forest md:text-4xl">
              What&rsquo;s in a virtual tour
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="flex gap-5">
                  <span className="flex-shrink-0 font-display text-3xl leading-none text-border">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-forest">{f.title}</h3>
                    <p className="mt-3 max-w-[48ch] font-body text-base leading-relaxed text-ink/70">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tour list */}
        <section className="border-t border-border bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl text-forest md:text-4xl">
              First three tours
            </h2>
            <p className="mt-3 max-w-[55ch] font-body text-base text-ink/60">
              Each tour mirrors a stop on our self-guided Chicago walking
              tours.
            </p>
            <div className="mt-10 flex flex-col gap-px bg-border">
              {TOURS.map((t) => (
                <div key={t.title} className="flex flex-col gap-2 bg-cream p-6 md:flex-row md:items-baseline md:justify-between md:gap-10 md:p-8">
                  <div>
                    <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                      {t.eyebrow}
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-forest">{t.title}</h3>
                    <p className="mt-3 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
                      {t.blurb}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-body text-sm text-warm-gray md:text-right">
                    {t.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-forest py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl text-cream md:text-5xl">
              In Chicago this semester?
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              Take the in-person walking tour first, then use the virtual
              version as the classroom follow-up.
            </p>
            <Link
              href="/tours"
              className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              See walking tours
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
