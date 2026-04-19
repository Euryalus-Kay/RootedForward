import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Education | Rooted Forward",
  description:
    "Walking tours, podcasts, a serious civic game, and a free classroom curriculum. Everything Rooted Forward makes for educators and learners.",
};

const PROGRAMS = [
  {
    eyebrow: "Audio",
    title: "Podcast",
    href: "/podcasts",
    blurb:
      "Conversations with historians, residents, planners, and organizers about the policy decisions that shaped Chicago's neighborhoods. New episodes monthly.",
    cta: "Listen to episodes",
  },
  {
    eyebrow: "Self-paced",
    title: "Virtual Tours",
    href: "/virtual-tours",
    blurb:
      "Online versions of our walking tours for classrooms and learners outside Chicago. Archival photos, primary sources, and audio commentary at every stop.",
    cta: "Take a tour",
  },
  {
    eyebrow: "Interactive",
    title: "Build the Block",
    href: "/game",
    blurb:
      "A 20-minute browser game where you govern a fictional Chicago ward from 1940 to 2040. Real HOLC maps, real housing-finance numbers, real consequences.",
    cta: "Play the game",
  },
  {
    eyebrow: "For teachers",
    title: "Curriculum",
    href: "/curriculum",
    blurb:
      "Free, classroom-ready lesson plans, discussion guides, and slide decks built around our tours, podcast, and game. Aligned to high-school civics and U.S. history standards.",
    cta: "Browse the kit",
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
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              What we make for learners
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
              Four ways into the same history
            </h2>
            <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75">
              The story of how American cities were segregated by federal,
              municipal, and private decisions doesn&rsquo;t fit in one
              format. We tell it in four — a podcast for the long form, virtual
              tours for the spatial story, a game for the moral weight of the
              decisions, and a curriculum so any teacher can run the whole arc
              with their students.
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
              Teaching with Rooted Forward
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              Everything we make is free for classroom use. Pair the podcast
              with the curriculum, run the game in a 45-minute session, and use
              the virtual tour as a bridge to a field trip.
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Talk to our team
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
