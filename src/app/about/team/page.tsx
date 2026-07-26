/* ------------------------------------------------------------------ */
/*  /about/team                                                        */
/*                                                                     */
/*  One job. Show who is on this, fast. Name, role, city, one line on  */
/*  what they do, and nothing else on the page competing with it.      */
/*                                                                     */
/*  The roster lives in src/lib/team-constants.ts. Adding a person is  */
/*  one object in that array, and a new city needs nothing but a new   */
/*  string. Real people only, same as everywhere else on the site.     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import SurveyRule from "@/components/ui/SurveyRule";
import TeamRoster from "@/components/about/TeamRoster";

export const metadata: Metadata = {
  title: "Meet the team | Rooted Forward",
  description:
    "The students who run Rooted Forward, in Chicago, New York, and Washington, DC. Names, roles, and what each person works on.",
};

export default function TeamPage() {
  return (
    <PageTransition>
      {/* ============================================================
          WHO IS ON IT
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Meet the team
          </p>
          <h1 className="mt-4 max-w-[18ch] font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
            Who is on this
          </h1>
          <p className="mt-7 max-w-[54ch] font-body text-lg leading-relaxed text-ink/80">
            Rooted Forward is run by students. Here is everyone on it, what
            they work on, and which city they are in.
          </p>
          <SurveyRule className="mt-10 text-rust" />
        </div>
      </section>

      {/* ============================================================
          THE ROSTER
          ============================================================ */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <TeamRoster />
        </div>
      </section>

      {/* ============================================================
          BACK OUT
          ============================================================ */}
      <section className="border-t border-border bg-cream-dark/35 py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-2xl text-forest md:text-3xl">
            Why we do this
          </h2>
          <p className="mt-4 max-w-[54ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
            The short version is a survey of more than 140 people at the Obama
            Presidential Center, and how few of them had ever been taught how
            their own neighborhood was built.
          </p>
          <Link
            href="/about"
            className="group mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
          >
            Read the whole story{" "}
            <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
