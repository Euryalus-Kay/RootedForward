/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/*                                                                     */
/*  Voice rules learned the hard way (owner feedback, July 2026):     */
/*  no aphorism headlines, no balanced-pair sentences ("we teach X,   */
/*  we work on Y"), no numbered 01/02 list rows, no triads. Say the   */
/*  concrete thing. Hierarchy comes from size (the tour is the big    */
/*  block, everything else steps down), not from a uniform grid.      */
/*  All imagery is public domain or CC0, provenance in                */
/*  public/media/hyde-park/credits.json.                              */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import SurveyRule from "@/components/ui/SurveyRule";
import { EXHIBIT_TITLE } from "@/components/exhibit/ExhibitShell";

export default function Home() {
  return (
    <PageTransition>
      {/* ============================================================
          HERO
          The 1940 HOLC Residential Security Map of Chicago. The
          headline just says what the map on screen did.
          ============================================================ */}
      <section className="relative overflow-hidden">
        {/* Cropped to the graded city and shoreline; the full sheet
            with its legend and suburb inset is the og:image. */}
        <img
          src="/media/site/holc-chicago-1940-city.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-[50%_44%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/95 to-cream/45" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-24 md:pb-40 md:pt-36">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            A student-run Chicago nonprofit
          </p>
          <h1 className="mt-5 font-display text-6xl leading-[0.95] tracking-tight text-ink sm:text-7xl md:text-8xl">
            Rooted Forward
          </h1>
          <p className="mt-7 max-w-xl font-body text-lg leading-relaxed text-ink/80">
            We give walking tours of Hyde Park and publish the old paperwork
            that decided who could live where in Chicago. The map behind
            this page is one piece of it, the government&rsquo;s 1940
            lending map of the city.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/tours"
              className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Book the walking tour
            </Link>
            <Link
              href="/tours/chicago/hyde-park"
              className="group font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
            >
              Read the exhibit{" "}
              <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </Link>
          </div>
        </div>

        <p className="absolute bottom-4 right-4 z-10 max-w-[46ch] text-right font-body text-[11px] leading-snug text-ink/70">
          Residential Security Map of Chicago. Home Owners&rsquo; Loan
          Corporation, 1940. CC0.
        </p>
      </section>

      {/* ============================================================
          THE WALKING TOUR — the main offer, so it gets the big block
          ============================================================ */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SurveyRule className="text-rust" />
          <div className="mt-10 grid grid-cols-1 items-center gap-y-10 md:grid-cols-12 md:gap-x-16">
            <div className="md:col-span-6">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                The walking tour
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl">
                Two hours on foot in Hyde Park
              </h2>
              <p className="mt-5 max-w-[52ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
                Our researchers walk you through the neighborhood and tell
                you what happened on the blocks you are standing on. The
                university&rsquo;s expansion, the restrictive covenants, the
                urban renewal bulldozers. Every stop comes with the
                documents to back it up.
              </p>
              <p className="mt-4 font-body text-sm font-semibold uppercase tracking-wider text-ink/60">
                2 hours &middot; Small groups &middot; Led by students
              </p>
              <Link
                href="/tours"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Tour details &amp; booking
              </Link>
            </div>
            <div className="md:col-span-6">
              <img
                src="/media/site/cobb-hall-postcard.jpg"
                alt="Hand-colored postcard of Cobb Hall at the University of Chicago"
                loading="lazy"
                className="w-full rounded-sm border border-border object-cover"
              />
              <p className="mt-2 font-body text-[11px] leading-snug text-ink/60">
                Cobb Hall at the University of Chicago. Tichnor Brothers
                postcard, circa 1930-1945. Public domain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE EXHIBIT — forest band, explained in plain words
          ============================================================ */}
      <section className="bg-forest py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-y-10 md:grid-cols-12 md:gap-x-16">
            <div className="md:col-span-6">
              <Link href="/tours/chicago/hyde-park" className="group block">
                <div className="overflow-hidden rounded-sm border border-cream/20">
                  <img
                    src="/media/site/midway-1893.jpg"
                    alt="Crowds on the Midway Plaisance beneath the first Ferris Wheel at the 1893 World's Columbian Exposition"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
              </Link>
              <p className="mt-2 font-body text-[11px] text-cream/65">
                The Midway Plaisance under the Ferris Wheel, 1893.
                Rijksmuseum collection, CC0.
              </p>
            </div>

            <div className="md:col-span-6">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust-light">
                The online exhibit
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-cream md:text-4xl">
                Can&rsquo;t make the tour? Read the whole story online.
              </h2>
              <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-cream/75 md:text-lg">
                The exhibit shows the real paperwork that built Hyde Park.
                Deeds with the racial covenants still printed in them, bank
                appraisal forms, the federal map from 1940. It walks you
                through them from 1832 to today, one long page, at your own
                pace.
              </p>
              <p className="mt-4 font-body text-sm text-cream/75">
                Free. No account. We call it {EXHIBIT_TITLE}.
              </p>
              <Link
                href="/tours/chicago/hyde-park"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Start reading
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PODCAST AND POLICY — the two smaller doors, side by side
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
            <div className="border-t-2 border-border pt-6">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                The podcast
              </p>
              <h2 className="mt-3 font-display text-2xl text-ink">
                Chicago neighborhoods, on your commute
              </h2>
              <p className="mt-3 max-w-[48ch] font-body text-base leading-relaxed text-ink/70">
                Conversations about the city&rsquo;s neighborhoods and the
                policies that shaped them. On Spotify or right on the site.
              </p>
              <Link
                href="/podcasts"
                className="group mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                Listen{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>

            <div className="border-t-2 border-border pt-6">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                Policy
              </p>
              <h2 className="mt-3 font-display text-2xl text-ink">
                Tools for pushing back
              </h2>
              <p className="mt-3 max-w-[48ch] font-body text-base leading-relaxed text-ink/70">
                Plain guides to testifying, commenting, and getting an
                ordinance moving. No campaign is running right now; the
                first one is in the works.
              </p>
              <Link
                href="/policy"
                className="group mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                See the policy tools{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CLOSER — ink band, short and plain. No archival photo here;
          pairing one with a recruitment button read as too much
          (owner, July 2026).
          ============================================================ */}
      <section className="bg-ink py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SurveyRule className="mx-auto text-rust-light" />
          <h2 className="mt-6 font-display text-3xl text-cream md:text-4xl">
            We could use your help.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] font-body text-lg leading-relaxed text-cream/75">
            Rooted Forward is small and run by students. If you can dig
            through an archive, lead a tour, or edit audio, there is work
            here for you. No experience needed.
          </p>
          <Link
            href="/get-involved"
            className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
