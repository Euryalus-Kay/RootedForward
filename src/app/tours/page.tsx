import type { Metadata } from "next";
import Link from "next/link";
import SurveyRule from "@/components/ui/SurveyRule";
import { EXHIBIT_TITLE } from "@/components/exhibit/ExhibitShell";

/* ------------------------------------------------------------------ */
/*  /tours                                                             */
/*                                                                     */
/*  Centered on Hyde Park, the one neighborhood with real, finished   */
/*  work behind it. Two offers. The Ground Keeps Moving, the online   */
/*  exhibit at /tours/chicago/hyde-park, and the in-person Hyde Park  */
/*  walking tour bookable on Viator. The layout borrows the Chicago   */
/*  Architecture Center's tour-page pattern (a one-line dek, then a   */
/*  bordered facts strip) and gives every archival image a source    */
/*  line. The old stretched-photo banner was replaced with a          */
/*  typographic opener in July 2026.                                  */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Tours | Rooted Forward",
  description:
    "Walk Hyde Park with Rooted Forward. An in-person walking tour through the neighborhood's history of redlining and urban renewal, and an online exhibit built from the original documents.",
};

const TOUR_FACTS = [
  { label: "Duration", value: "2 hours" },
  { label: "Neighborhood", value: "Hyde Park, Chicago" },
  { label: "Guides", value: "Youth-led" },
  { label: "Group size", value: "Small groups" },
];

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Opener */}
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Tours
          </p>
          <h1 className="mt-4 max-w-[16ch] font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            Walk the streets where it happened.
          </h1>
          <p className="mt-6 max-w-[58ch] font-body text-lg leading-relaxed text-ink/75">
            Everything starts in Hyde Park. It is the neighborhood we know
            best, and its last century of deed restrictions, appraisal maps,
            and urban renewal plans tells the story of how Chicago drew its
            lines. You can walk it with us in person, or read the documents
            online.
          </p>
          <SurveyRule className="mt-10 text-rust" />
        </div>
      </section>

      {/* Online exhibit */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
                Online exhibit
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-forest md:text-4xl">
                Read the Hyde Park story online
              </h2>
              <p className="mt-5 max-w-[55ch] font-body text-base leading-relaxed text-ink/70">
                The exhibit gathers the paperwork that built the
                neighborhood on one long page, including deeds with the
                racial covenants still printed in them, bank appraisal
                forms, and the federal map from 1940. It runs from 1832 to
                today, and you scroll through it at your own pace.
              </p>
              <p className="mt-4 font-body text-sm font-semibold uppercase tracking-wider text-ink/60">
                One page &middot; Free &middot; No account
              </p>
              <p className="mt-3 font-body text-sm text-ink/60">
                We call it {EXHIBIT_TITLE}.
              </p>
              <Link
                href="/tours/chicago/hyde-park"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Start reading
              </Link>
            </div>
            <Link href="/tours/chicago/hyde-park" className="group block">
              <div className="overflow-hidden rounded-sm border border-border">
                <img
                  src="/media/site/midway-1893.jpg"
                  alt="Crowds on the Midway Plaisance beneath the first Ferris Wheel at the 1893 World's Columbian Exposition"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-2 font-body text-[11px] text-ink/60">
                The Midway Plaisance under the Ferris Wheel, 1893.
                Rijksmuseum collection, CC0.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* In-person walking tour */}
      <section className="border-t border-border bg-cream-dark py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            In person
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Hyde Park Walking Tour
          </h2>
          <p className="mt-4 max-w-[58ch] font-body text-lg leading-relaxed text-ink/75">
            A guided walk through the neighborhood&rsquo;s housing history,
            led by our student researchers.
          </p>

          {/* Facts strip */}
          <div className="mt-10 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
            {TOUR_FACTS.map((fact) => (
              <div key={fact.label} className="bg-cream px-5 py-4">
                <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                  {fact.label}
                </p>
                <p className="mt-1 font-body text-sm font-semibold text-forest">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <p className="max-w-[52ch] font-body text-base leading-relaxed text-ink/70">
                The route covers the University of Chicago&rsquo;s expansion
                campaigns, the boundaries drawn around Bronzeville, and the
                organizing that fought back. You stand at the corners where
                these things happened while you hear about them.
              </p>
              <p className="mt-4 max-w-[52ch] font-body text-base leading-relaxed text-ink/70">
                Our guides work from the same documents the online exhibit
                is built on, so every stop comes with the paperwork to back
                it up.
              </p>
              <a
                href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center rounded-sm bg-rust px-10 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Book on Viator
              </a>
            </div>

            <div>
              <img
                src="/media/site/hyde-park-aerial-1928.jpg"
                alt="Aerial photograph of Hyde Park and the lakefront taken by the Chicago Aerial Survey Company in 1928"
                loading="lazy"
                className="w-full rounded-sm border border-border object-cover"
              />
              <p className="mt-2 font-body text-[11px] text-ink/60">
                Hyde Park and the lakefront from the air, 1928. Chicago
                Aerial Survey Co. Public domain.
              </p>
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
