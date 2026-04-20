import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Education | Rooted Forward",
  description:
    "Walking tours, a podcast, a playable game about Chicago housing policy, and a free classroom curriculum.",
};

const PROGRAMS = [
  {
    eyebrow: "Walking",
    title: "Walking Tours",
    href: "/tours",
    blurb:
      "Self-guided and in-person tours through the South and West Sides. Each stop pairs a place you can stand in with the policy that shaped it.",
    cta: "See the tours",
  },
  {
    eyebrow: "Audio",
    title: "Podcast",
    href: "/podcasts",
    blurb:
      "Long conversations with the historians, organizers, and lifelong residents who know these neighborhoods better than anyone we could quote.",
    cta: "Listen",
  },
  {
    eyebrow: "Playable",
    title: "The Game",
    href: "/game",
    blurb:
      "Twenty minutes in the chair of someone who shaped a Chicago neighborhood between 1940 and 2040. Every decision draws from the historical record.",
    cta: "Play it",
  },
  {
    eyebrow: "Classrooms",
    title: "Curriculum",
    href: "/curriculum",
    blurb:
      "A free 12-session unit built around the tours, podcast, and game. Used in three CPS schools and a handful of college courses so far.",
    cta: "Get the kit",
  },
];

export default function EducationPage() {
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
              Education
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="bg-cream pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl px-6">
            <p className="max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl">
              The story of how American cities got segregated by federal,
              municipal, and private decisions doesn&rsquo;t fit in one form.
              We tell it in four. Pick the one that fits the way you
              actually learn.
            </p>
          </div>
        </section>

        {/* Programs grid */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2">
              {PROGRAMS.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group flex flex-col bg-cream p-8 transition-colors hover:bg-cream-dark md:p-10"
                >
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                    {p.eyebrow}
                  </p>
                  <h3 className="mt-4 font-display text-3xl text-forest md:text-4xl">
                    {p.title}
                  </h3>
                  <p className="mt-5 max-w-[48ch] flex-1 font-body text-base leading-relaxed text-ink/70">
                    {p.blurb}
                  </p>
                  <span className="mt-6 inline-flex items-center font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors group-hover:text-rust-dark">
                    {p.cta} &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* For educators CTA */}
        <section className="bg-forest py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl text-cream md:text-5xl">
              Teaching with this stuff
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              Everything is free for classroom use. The curriculum kit is the
              fastest way in &mdash; pair it with a podcast episode, run the
              game in one period, and use the tour as a field-trip anchor.
            </p>
            <Link
              href="/curriculum"
              className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Request the curriculum
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
