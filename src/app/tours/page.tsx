import type { Metadata } from "next";
import Link from "next/link";
import SurveyRule from "@/components/ui/SurveyRule";
import WalkExperience from "@/components/tours/walk/WalkExperience";
import { HYDE_PARK_WALK } from "@/lib/tours/hyde-park-walk";

/* ------------------------------------------------------------------ */
/*  /tours                                                             */
/*                                                                     */
/*  The Hyde Park racial-history audio walking tour. Starts at Paul   */
/*  Cornell's stone by 53rd Street, crosses the neighborhood he       */
/*  built, and names the instruments that decided who could live in   */
/*  it. Same player, map, and plate design as the earlier Jackson     */
/*  Park walk (that tour's data survives in jackson-park-walk.ts).    */
/*  The map is our own SVG built from Census TIGER geometry; the      */
/*  audio is pregenerated and served from /public.                    */
/* ------------------------------------------------------------------ */

const tour = HYDE_PARK_WALK;

export const metadata: Metadata = {
  title: "Hyde Park Walking Tour | Rooted Forward",
  description:
    "A free self-guided audio tour of Hyde Park, from Paul Cornell's stone to Harper Court. Nine stops on how the neighborhood was built, who it was built for, and the paperwork that kept it that way.",
};

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Opener */}
      <section className="relative overflow-hidden border-b border-border bg-cream pb-10 pt-20 md:pb-20 md:pt-28">
        {/* the 1940 HOLC security map of Chicago, the redlining map
            itself, washed into the paper */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/site/holc-chicago-1940.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[62%] object-cover opacity-[0.14] mix-blend-multiply [mask-image:radial-gradient(ellipse_75%_90%_at_70%_40%,black_45%,transparent)] md:block"
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Self-guided audio tour
          </p>
          <h1 className="walk-title mt-4 max-w-[16ch] text-4xl font-semibold leading-[1.08] text-ink md:text-6xl">
            {tour.title}
          </h1>
          <p className="mt-6 max-w-[58ch] font-body text-lg leading-relaxed text-ink/75">
            {tour.dek}
          </p>

          <p className="mt-6 font-display text-lg italic text-ink/65">
            {`${tour.distanceMiles} miles, mostly flat`}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#start"
              className="inline-flex items-center rounded-[3px] bg-rust px-9 py-4 font-body text-base font-semibold text-white shadow-[5px_5px_0_0_rgba(27,58,45,0.18)] transition-all hover:-translate-y-0.5 hover:bg-rust-dark motion-reduce:transition-none"
            >
              Start the tour
            </a>
            <a
              href="#before-you-walk"
              className="font-body text-sm text-ink/70 underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
            >
              Hours and what to know first
            </a>
          </div>
          <SurveyRule className="mt-10 hidden text-rust md:block" />
        </div>
      </section>

      {/* Why this walk: the founder's essay, shortened. The tour's
          argument in four paragraphs before the first stop. */}
      <section aria-label="Why this walk" className="border-b border-border bg-cream py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-[62ch]">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              Why this walk
            </p>
            <h2 className="walk-title mt-3 text-2xl font-semibold leading-snug text-forest md:text-3xl">
              The covenants are still on our deeds
            </h2>
            <div className="mt-5 space-y-4 font-body text-base leading-relaxed text-ink/80">
              <p>
                On Juneteenth, Barack Obama opened his presidential center on
                the ground where Chicago staged the 1893 World&apos;s Fair. The
                fair called itself the White City, and it meant it. Ida B.
                Wells and Frederick Douglass stood at its gates with a pamphlet
                about who had been shut out. Now the first Black
                president&apos;s words wrap a 225-foot tower on the same ground.
              </p>
              <p>
                It reads like closure. It is not, because for a century the
                neighborhoods around that park were a workshop where the tools
                of American housing segregation were designed, tested, and
                defended.
              </p>
              <p>
                Paul Cornell bought lakefront acres here in 1853, cut a deal
                with the Illinois Central for a train stop, and sold Hyde Park
                to wealthy Chicagoans as a refuge from the city. Exclusivity
                was the product. When Black families moved south during the
                Great Migration, that promise grew teeth.
              </p>
              <p>
                None of it was weather. Every stage had authors, and every
                instrument had a signature. This walk goes where they signed.
                The five red plates along the way name them, one by one.
              </p>
            </div>
            <p className="mt-5 font-display text-[13px] italic text-ink/60">
              Adapted from an essay by Zain Zaidi, Rooted Forward&apos;s founder.
            </p>
          </div>
        </div>
      </section>

      {/* The plate index: a small framed photograph of each site.
          Tap one to jump straight to that stop in the tour below. */}
      <section aria-label="The nine stops" className="border-b border-border bg-[#FBF8F2] py-8 md:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="walk-title text-xl font-semibold text-forest">The nine stops</h2>
            <p className="font-display text-[13px] italic text-ink/60">
              Pick a plate to jump ahead
            </p>
          </div>
          <ol className="-mx-6 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-9 md:gap-3.5 md:overflow-visible md:px-0 md:pb-0">
            {tour.stops.map((s) => (
              <li key={s.id} className="shrink-0 snap-start">
                <a
                  href={`#stop-${s.number}`}
                  aria-label={`Jump to stop ${s.number}, ${s.title}`}
                  className="group block w-28 md:w-auto"
                >
                  <span className="walk-plate-flush block rounded-[2px] p-1 shadow-[3px_3px_0_0_rgba(27,58,45,0.08)] transition-transform group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[2px_2px_0_0_rgba(27,58,45,0.1)] group-active:translate-x-[2px] group-active:translate-y-[2px] motion-reduce:transition-none">
                    {/* the site as it looks today, so walkers know
                        what they are heading toward */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(s.nowImage ?? s.images[0]).src.replace(
                        "/hyde-park-walk/",
                        "/hyde-park-walk/thumbs/"
                      )}
                      alt=""
                      loading="lazy"
                      className="aspect-[3/2] w-full rounded-[1px] object-cover"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="mt-1.5 block text-center font-display text-sm text-ink/60"
                  >
                    {s.number}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The tour itself */}
      <section id="tour" className="scroll-mt-16">
        <WalkExperience tour={tour} />
      </section>

      {/* Before you walk */}
      <section
        id="before-you-walk"
        className="scroll-mt-16 border-t border-border bg-cream-dark/50 py-14 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            Before you walk
          </p>
          <h2 className="walk-title mt-3 text-3xl font-semibold text-forest md:text-4xl">
            Good to know
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {tour.practical.map((item, i) => (
              <div key={item.title} className="walk-plate rounded-[3px] p-6">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="text-rust">
                    {i === 0 && (
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 4.6V8l2.4 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    {i === 1 && (
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <path d="M2 13c2.5 0 2.5-2.4 5-2.4S9.5 13 12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M3.5 8.5 6 3.2a.9.9 0 0 1 1.6 0l1.1 2.3M10.3 8.6l1.5-3.1a.8.8 0 0 1 1.5 0l1 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                    {i === 2 && (
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                        <path d="M3 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="2" y="10" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
                        <rect x="11" y="10" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                  </span>
                  <h3 className="font-display text-xl text-forest">{item.title}</h3>
                </div>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section className="border-t border-border bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            Sources
          </p>
          <h2 className="walk-title mt-3 text-3xl font-semibold text-forest md:text-4xl">
            Where this history comes from
          </h2>
          <p className="mt-4 max-w-[58ch] font-body text-base leading-relaxed text-ink/70">
            Every stop was written from the records below. If you think we
            got something wrong,{" "}
            <Link
              href="/contact"
              className="underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
            >
              tell us
            </Link>{" "}
            and we will check it against the documents.
          </p>
          {/* open columns on desktop, one accordion on phones */}
          <div className="mt-8 hidden gap-x-12 md:block md:columns-2">
            {tour.stops
              .filter((s) => s.sources && s.sources.length)
              .map((s) => (
                <div key={s.id} className="mb-7 break-inside-avoid">
                  <p className="font-body text-sm font-semibold text-ink/80">
                    Stop {s.number} &middot; {s.title}
                  </p>
                  <ul className="mt-1.5">
                    {s.sources!.map((src) => (
                      <li key={src.url}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block py-1 font-body text-sm text-ink/70 underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
                        >
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
          <details className="walk-plate-flush mt-6 rounded-[3px] md:hidden">
            <summary className="cursor-pointer list-none px-5 py-4 font-body text-sm font-medium text-ink/80 [&::-webkit-details-marker]:hidden">
              See every source
            </summary>
            <div className="border-t border-ink/15 px-5 pb-5">
              {tour.stops
                .filter((s) => s.sources && s.sources.length)
                .map((s) => (
                  <div key={s.id} className="mt-5">
                    <p className="font-body text-sm font-semibold text-ink/80">
                      Stop {s.number} &middot; {s.title}
                    </p>
                    <ul className="mt-1">
                      {s.sources!.map((src) => (
                        <li key={src.url}>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block py-1 font-body text-sm text-ink/70 underline decoration-warm-gray-light underline-offset-2"
                          >
                            {src.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </details>
        </div>
      </section>

      {/* Related */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="walk-title text-2xl font-semibold text-cream md:text-3xl">
            Prefer to stay in?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-cream/70">
            Our online exhibit walks the same ground on one long page, built
            from the original deeds, appraisal forms, and maps. Our in-person
            Hyde Park tour is on Viator.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tours/chicago/hyde-park"
              className="inline-flex items-center rounded-[3px] bg-rust px-8 py-3.5 font-body text-base font-semibold text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:bg-rust-dark motion-reduce:transition-none"
            >
              Read the exhibit
            </Link>
            <a
              href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-[3px] border border-cream/50 px-8 py-3.5 font-body text-base font-semibold text-cream transition-all hover:-translate-y-0.5 hover:border-cream hover:bg-cream/10 motion-reduce:transition-none"
            >
              Book the in-person tour
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
