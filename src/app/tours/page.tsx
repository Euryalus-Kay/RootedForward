import type { Metadata } from "next";
import Link from "next/link";
import SurveyRule from "@/components/ui/SurveyRule";
import WalkExperience from "@/components/tours/walk/WalkExperience";
import { JACKSON_PARK_WALK } from "@/lib/tours/jackson-park-walk";

/* ------------------------------------------------------------------ */
/*  /tours                                                             */
/*                                                                     */
/*  The Jackson Park self-paced audio walking tour. Starts at the     */
/*  Obama Presidential Center, loops the park in under an hour of     */
/*  walking, and plays a short recorded story at each stop. The map   */
/*  is our own SVG built from Census TIGER geometry; the audio is     */
/*  pregenerated and served from /public. The previous /tours index   */
/*  is preserved intact at page.hidden.tsx.                           */
/* ------------------------------------------------------------------ */

const tour = JACKSON_PARK_WALK;

export const metadata: Metadata = {
  title: "Jackson Park Walking Tour | Rooted Forward",
  description:
    "A free self-guided audio tour of Jackson Park, starting at the Obama Presidential Center. Eight stops in about an hour of walking, from the 1893 World's Fair to the fights that shaped the South Side.",
};

export default function ToursPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Opener */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream via-cream to-cream-dark/60 pb-16 pt-20 md:pb-24 md:pt-28">
        {/* drifting color fields under the glass */}
        <div
          aria-hidden="true"
          className="walk-blob pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#C9A227]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="walk-blob-slow pointer-events-none absolute right-1/4 top-32 h-80 w-80 rounded-full bg-rust/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="walk-blob pointer-events-none absolute -bottom-24 right-8 h-[26rem] w-[26rem] rounded-full bg-forest/10 blur-3xl"
        />
        {/* the 1893 Rand McNally bird's eye of these exact grounds,
            washed into the paper */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/jackson-park-walk/birdseye-1893.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[62%] object-cover opacity-[0.12] mix-blend-multiply [mask-image:radial-gradient(ellipse_75%_90%_at_70%_40%,black_45%,transparent)] md:block"
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Self-guided audio tour
          </p>
          <h1 className="mt-4 max-w-[16ch] font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            {tour.title}
          </h1>
          <p className="mt-6 max-w-[58ch] font-body text-lg leading-relaxed text-ink/75">
            {tour.dek}
          </p>

          <p className="mt-6 inline-block rounded-full border border-white/70 bg-white/45 px-5 py-2.5 font-body text-base font-medium text-forest shadow-sm backdrop-blur-md">
            {`${tour.stops.length} stops · ${tour.distanceMiles} miles · about an hour · free`}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#tour"
              className="inline-flex items-center rounded-full bg-gradient-to-br from-rust to-rust-dark px-9 py-4 font-body text-base font-semibold text-white shadow-xl shadow-rust/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-rust/30 motion-reduce:transition-none"
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
          <SurveyRule className="mt-10 text-rust" />
        </div>
        {/* curve into the tour */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 52" fill="none" preserveAspectRatio="none" className="block h-[52px] w-full">
            <path d="M0 52h1440V16C1180 40 900 48 720 44 480 38 220 18 0 30v22Z" fill="#F5F0E8" />
          </svg>
        </div>
      </section>

      {/* The tour itself */}
      <section id="tour" className="scroll-mt-16">
        <WalkExperience tour={tour} />
      </section>

      {/* Before you walk */}
      <section
        id="before-you-walk"
        className="relative scroll-mt-16 overflow-hidden bg-gradient-to-b from-cream to-cream-dark py-14 md:py-20"
      >
        <div
          aria-hidden="true"
          className="walk-blob-slow pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#C9A227]/10 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            Before you walk
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Good to know
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {tour.practical.map((item, i) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/70 bg-white/50 p-6 shadow-lg shadow-forest/5 backdrop-blur-md transition-transform hover:-translate-y-1 motion-reduce:transition-none"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rust to-rust-dark text-cream shadow-md shadow-rust/25"
                >
                  {i === 0 && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 4.6V8l2.4 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {i === 1 && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 13c2.5 0 2.5-2.4 5-2.4S9.5 13 12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M3.5 8.5 6 3.2a.9.9 0 0 1 1.6 0l1.1 2.3M10.3 8.6l1.5-3.1a.8.8 0 0 1 1.5 0l1 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  {i === 2 && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <rect x="2" y="10" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
                      <rect x="11" y="10" width="3" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  )}
                </span>
                <h3 className="mt-3 font-display text-xl text-forest">{item.title}</h3>
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
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Where this history comes from
          </h2>
          <p className="mt-4 max-w-[58ch] font-body text-base leading-relaxed text-ink/70">
            Every stop was written from the records below. If you think we
            got something wrong, tell us and we will check it against the
            documents.
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
          <details className="mt-6 rounded-2xl border border-white/70 bg-white/45 backdrop-blur-md md:hidden">
            <summary className="cursor-pointer list-none px-5 py-4 font-body text-sm font-medium text-ink/80 [&::-webkit-details-marker]:hidden">
              See every source
            </summary>
            <div className="border-t border-white/60 px-5 pb-5">
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
          <h2 className="font-display text-2xl text-cream md:text-3xl">
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
              className="inline-flex items-center rounded-full bg-gradient-to-br from-rust to-rust-dark px-8 py-3.5 font-body text-base font-semibold text-white shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 motion-reduce:transition-none"
            >
              Read the exhibit
            </Link>
            <a
              href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-cream/40 bg-cream/10 px-8 py-3.5 font-body text-base font-semibold text-cream backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-cream hover:bg-cream/20 motion-reduce:transition-none"
            >
              Book the in-person tour
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
