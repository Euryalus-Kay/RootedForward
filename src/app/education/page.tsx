import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";

export const metadata: Metadata = {
  title: "Education | Rooted Forward",
  description:
    "Walking tours, a podcast, and a free classroom curriculum on Chicago housing policy.",
};

const PROGRAMS = [
  {
    index: "01",
    eyebrow: "On foot",
    title: "Walking Tours",
    href: "/tours",
    blurb:
      "Self-guided and in-person tours through the South and West Sides. Each stop pairs a place you can stand in with the policy that shaped it.",
    cta: "See the tours",
  },
  {
    index: "02",
    eyebrow: "Audio",
    title: "Podcast",
    href: "/podcasts",
    blurb:
      "Long conversations with the historians, organizers, and lifelong residents who know these neighborhoods better than anyone we could quote.",
    cta: "Listen",
  },
  {
    index: "03",
    eyebrow: "Classrooms",
    title: "Curriculum",
    href: "/curriculum",
    blurb:
      "A free classroom unit built around the tours, the podcast, and our research data. Used in three CPS schools and a handful of college courses so far.",
    cta: "Get the kit",
  },
];

export default function EducationPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        <PageBanner
          eyebrow="Education / Programs"
          title="Education"
          dek="The story of how American cities got segregated by federal, municipal, and private decisions doesn't fit in one form. We tell it in three."
          meta={[`${PROGRAMS.length} programs`, "Free for classroom use"]}
        />

        {/* ============================================================
            01 — THE THREE PROGRAMS
            ============================================================ */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionHeading
              index="01"
              eyebrow="Three ways in"
              title="Pick the form that fits"
              lede="Same history, three doors. Take it on foot, put it in your ears, or bring it into a classroom."
            />

            {/* The original card treatment, unchanged from before the
                redesign: open hairline grid, no outer frame, no motion. */}
            <div className="mt-12 grid grid-cols-1 gap-px bg-border md:mt-16 md:grid-cols-3">
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

        {/* ============================================================
            02 — FOR EDUCATORS
            ============================================================ */}
        <section className="grain relative overflow-hidden bg-forest py-20 md:py-28">
          <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="index-numeral pointer-events-none absolute -right-4 top-6 select-none text-[9rem] leading-none text-cream/[0.05] md:-right-8 md:text-[16rem]"
          >
            02
          </span>

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 items-end gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-7">
                <SectionHeading
                  index="02"
                  eyebrow="For educators"
                  title="Teaching with this stuff"
                  lede="Everything is free for classroom use. The curriculum kit is the fastest way in. Pair it with a podcast episode and use a tour as the field-trip anchor."
                  tone="dark"
                />
              </div>
              <div className="md:col-span-5">
                <Reveal delay={0.2}>
                  <div className="flex flex-wrap items-center gap-4 md:justify-end">
                    <Magnetic>
                      <Link
                        href="/curriculum"
                        className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                      >
                        Request the curriculum
                      </Link>
                    </Magnetic>
                    <Link
                      href="/tours"
                      className="inline-flex items-center rounded-sm border border-cream/30 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:border-cream/60 hover:text-white"
                    >
                      Plan a field trip
                    </Link>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
