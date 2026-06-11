/* ------------------------------------------------------------------ */
/*  Home page                                                          */
/*                                                                     */
/*  Five movements: a full-screen depth hero, the mission statement    */
/*  that inks in on scroll, the three pillars as a stacked deck of     */
/*  full-screen panels, a featured-research strip with live counts,    */
/*  and the get-involved closer. All motion comes from the shared      */
/*  motion library so the page degrades cleanly without JS or with     */
/*  reduced motion.                                                    */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import Hero from "@/components/home/Hero";
import MissionStatement from "@/components/home/MissionStatement";
import PillarStack from "@/components/home/PillarStack";
import FeaturedResearch from "@/components/home/FeaturedResearch";
import { Reveal } from "@/components/motion/Reveal";
import WordReveal from "@/components/motion/WordReveal";
import Magnetic from "@/components/motion/Magnetic";
import GradeStrip from "@/components/motion/GradeStrip";

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <MissionStatement />
      <PillarStack />
      <FeaturedResearch />

      {/* ============================================================
          GET INVOLVED — closer, sits against the footer
          ============================================================ */}
      <section className="grain relative overflow-hidden bg-ink py-24 md:py-32">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Reveal y={12}>
            <GradeStrip className="mx-auto justify-center opacity-70" />
          </Reveal>
          <WordReveal
            as="h2"
            text="This is your city too."
            delay={0.1}
            className="mt-8 font-display text-4xl text-cream md:text-6xl"
          />
          <Reveal delay={0.3}>
            <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
              We need young researchers, tour guides, podcast producers, and
              people who want to push on policy. If this matters to you, there
              is a place for you here.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <Magnetic className="mt-10">
              <Link
                href="/get-involved"
                className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Get involved
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}
