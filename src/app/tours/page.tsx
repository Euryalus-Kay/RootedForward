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
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Self-guided audio tour
          </p>
          <h1 className="mt-4 max-w-[16ch] font-display text-4xl leading-[1.05] text-ink md:text-6xl">
            {tour.title}
          </h1>
          <p className="mt-6 max-w-[58ch] font-body text-lg leading-relaxed text-ink/75">
            {tour.dek}
          </p>

          {/* Facts strip */}
          <div className="mt-10 grid max-w-3xl grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
            {[
              { label: "Starts at", value: tour.startLabel },
              { label: "Stops", value: `${tour.stops.length}` },
              { label: "Distance", value: `${tour.distanceMiles} miles` },
              { label: "Walking time", value: `About ${tour.walkMinutes} min` },
            ].map((fact) => (
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

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              href="#tour"
              className="inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Start the tour
            </a>
            <p className="font-body text-sm text-ink/60">
              Free. No app. Every stop can also be read or listened to from
              home.
            </p>
          </div>
          <SurveyRule className="mt-10 text-rust" />
        </div>
      </section>

      {/* The tour itself */}
      <section id="tour" className="scroll-mt-16">
        <WalkExperience tour={tour} />
      </section>

      {/* Before you walk */}
      <section className="border-t border-border bg-cream-dark py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/60">
            Before you walk
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Good to know
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {tour.practical.map((item) => (
              <div key={item.title} className="rounded-sm border border-border bg-cream p-6">
                <h3 className="font-display text-xl text-forest">{item.title}</h3>
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
          <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            {tour.stops
              .filter((s) => s.sources && s.sources.length)
              .map((s) => (
                <div key={s.id}>
                  <p className="font-body text-xs font-semibold uppercase tracking-wider text-ink/60">
                    Stop {s.number} &middot; {s.title}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {s.sources!.map((src) => (
                      <li key={src.url}>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-sm text-ink/70 underline decoration-warm-gray-light underline-offset-2 transition-colors hover:text-rust"
                        >
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
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
              className="inline-flex items-center rounded-sm bg-rust px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Read the exhibit
            </Link>
            <a
              href="https://www.viator.com/tours/Chicago/Hyde-Park-Walking-Tour-History-Race-and-Urban-Change/d673-5645710P1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-sm border border-cream/40 px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:border-cream hover:bg-cream/10"
            >
              Book the in-person tour
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
