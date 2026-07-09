import type { Metadata } from "next";
import Link from "next/link";
import {
  EXHIBIT_TITLE,
  EXHIBIT_KICKER,
  EXHIBIT_DEK,
} from "@/components/exhibit/ExhibitShell";

/* ------------------------------------------------------------------ */
/*  /tours                                                             */
/*                                                                     */
/*  Centered on Hyde Park, the one neighborhood with real, finished   */
/*  work behind it. Two things live here. The Ground Keeps Moving,    */
/*  the online exhibit at /tours/chicago/hyde-park, and the in-       */
/*  person Hyde Park walking tour bookable on Viator. The old multi-  */
/*  stop map, the placeholder city stops, and the underwater routes   */
/*  section were removed in July 2026 when the page was re-centered;  */
/*  they live in git history if they are ever needed again.           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Tours | Rooted Forward",
  description:
    "Walk Hyde Park with Rooted Forward. An in-person walking tour through the neighborhood's history of redlining and urban renewal, and an online exhibit built from the original documents.",
};

export default function ToursPage() {
  return (
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
            Tours
          </h1>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-cream pt-14 md:pt-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl">
            Everything starts in Hyde Park. It is the neighborhood we know
            best, and its last century of deed restrictions, appraisal maps,
            and urban renewal plans tells the story of how Chicago drew its
            lines. You can walk it with us in person, or read the documents
            online.
          </p>
        </div>
      </section>

      {/* Online exhibit */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 rounded-sm border border-border bg-cream-dark/40 p-8 md:grid-cols-2 md:gap-14 md:p-12">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Online Exhibit
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-forest md:text-4xl">
                {EXHIBIT_TITLE}
              </h2>
              <p className="mt-2 font-body text-sm font-semibold uppercase tracking-widest text-rust">
                {EXHIBIT_KICKER}
              </p>
              <p className="mt-5 max-w-[55ch] font-body text-base leading-relaxed text-ink/70">
                {EXHIBIT_DEK}
              </p>
              <p className="mt-3 font-body text-sm text-warm-gray">
                Free to read, at your own pace.
              </p>
              <Link
                href="/tours/chicago/hyde-park"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Enter the exhibit
              </Link>
            </div>
            <Link href="/tours/chicago/hyde-park" className="group block">
              <div className="overflow-hidden rounded-sm border border-border">
                <img
                  src="/media/hyde-park/exhibit/fig/midway-1893-crowd.jpg"
                  alt="The Ferris Wheel above the crowd on the Midway Plaisance at the 1893 World's Columbian Exposition"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-2 font-body text-[11px] text-warm-gray">
                The Ferris Wheel on the Midway Plaisance, 1893. Public domain.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* In-person walking tour */}
      <section className="bg-cream-dark py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border-l-4 border-rust pl-8 md:pl-12">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              In Person
            </p>
            <h2 className="mt-2 font-display text-3xl text-forest md:text-4xl">
              Hyde Park Walking Tour
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-2 md:gap-16">
            <div>
              <p className="max-w-[52ch] font-body text-base leading-relaxed text-ink/70 md:text-lg md:leading-relaxed">
                A two-hour walk through Hyde Park and the neighborhoods around
                it, led by trained youth researchers. You hear the history of
                redlining, urban renewal, and community resistance at the
                places where it actually happened.
              </p>
              <p className="mt-4 max-w-[52ch] font-body text-base leading-relaxed text-ink/70 md:text-lg md:leading-relaxed">
                The route covers the University of Chicago&rsquo;s expansion
                campaigns, the boundaries drawn around Bronzeville, and the
                organizing that fought back.
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-sm border border-border bg-cream p-8 md:p-10">
              <div className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-border pb-3">
                  <span className="font-body text-sm text-warm-gray">Duration</span>
                  <span className="font-body text-sm font-semibold text-forest">2 hours</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border pb-3">
                  <span className="font-body text-sm text-warm-gray">Location</span>
                  <span className="font-body text-sm font-semibold text-forest">Hyde Park, Chicago</span>
                </div>
                <div className="flex items-baseline justify-between border-b border-border pb-3">
                  <span className="font-body text-sm text-warm-gray">Guide</span>
                  <span className="font-body text-sm font-semibold text-forest">Youth-led</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="font-body text-sm text-warm-gray">Group</span>
                  <span className="font-body text-sm font-semibold text-forest">Small groups</span>
                </div>
              </div>
              <a
                href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 self-center inline-flex items-center justify-center rounded-sm bg-rust px-10 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Book on Viator
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What's next */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-2xl text-cream md:text-3xl">
            More neighborhoods are coming
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-cream/70">
            Hyde Park is the first route. If you want to help research the
            next one, we want to hear from you.
          </p>
          <Link
            href="/get-involved"
            className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get involved
          </Link>
        </div>
      </section>
    </div>
  );
}
