import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import CurriculumRequestForm from "@/components/forms/CurriculumRequestForm";

export const metadata: Metadata = {
  title: "Curriculum | Rooted Forward",
  description:
    "Four classroom units on the federal, municipal, and private decisions that segregated American neighborhoods between 1933 and now. Built around our walking tours, podcast, and research papers.",
};

/* ------------------------------------------------------------------ */
/*  Curriculum                                                         */
/*                                                                     */
/*  The page lists four units. Each unit names the topic, the public  */
/*  primary sources we point students at, the Rooted Forward asset    */
/*  the unit pairs with, and a discussion prompt teachers can use as  */
/*  is. Nothing is fabricated. If a resource is not on this page,    */
/*  it is not in the kit.                                              */
/* ------------------------------------------------------------------ */

interface Reading {
  label: string;
  url: string;
  note?: string;
}

interface Unit {
  n: string;
  title: string;
  question: string;
  pairs_with: { label: string; href: string };
  readings: Reading[];
  discussion_prompt: string;
}

const UNITS: Unit[] = [
  {
    n: "01",
    title: "How the Lines Got Drawn",
    question:
      "Who decided which neighborhoods would receive bank loans, and what did those decisions look like on a map?",
    pairs_with: {
      label: "HOLC redlining and present-day outcomes dataset",
      href: "/research/data/holc-redlining-present-day-outcomes-chicago",
    },
    readings: [
      {
        label: "Mapping Inequality (Univ. of Richmond)",
        url: "https://dsl.richmond.edu/panorama/redlining/",
        note: "Interactive viewer for every U.S. city HOLC graded.",
      },
      {
        label: "HOLC Underwriting Manual, 1938 (digitized)",
        url: "https://catalog.archives.gov/id/720357",
        note: "Original FHA grading rubric at the National Archives.",
      },
      {
        label: "Richard Rothstein, The Color of Law, ch. 4",
        url: "https://www.epi.org/publication/the-color-of-law-a-forgotten-history-of-how-our-government-segregated-america/",
        note: "Standard high-school-readable summary of HOLC and FHA practice.",
      },
    ],
    discussion_prompt:
      "Pull up the Mapping Inequality viewer for your city. Find a tract graded D in 1938. What does it look like in 2025 on Census tract data? What does the same tract look like graded A?",
  },
  {
    n: "02",
    title: "Contract Buying and the Wealth Gap",
    question:
      "What happened to Black families who could not get federally insured mortgages, and how much did that cost them across a generation?",
    pairs_with: {
      label: "Cook County property-tax appeal dataset",
      href: "/research/data/cook-county-property-tax-appeal-disparity",
    },
    readings: [
      {
        label: "Beryl Satter, Family Properties (excerpt)",
        url: "https://www.metropolitanbooks.com/books/family-properties/",
        note: "The standard book on the Contract Buyers League and the 1968 strike.",
      },
      {
        label: "Coates, The Case for Reparations (Atlantic, 2014)",
        url: "https://www.theatlantic.com/magazine/archive/2014/06/the-case-for-reparations/361631/",
        note: "Profiles Clyde Ross and the Contract Buyers League directly.",
      },
      {
        label: "Contract Buyers League records, Newberry Library",
        url: "https://mms.newberry.org/detail.php?t=objects&type=related&kv=85706",
        note: "Original primary-source collection.",
      },
    ],
    discussion_prompt:
      "A 1968 contract-buying agreement on a $12,000 house carried a $25,000 contract price. Calculate the markup as a percent. Then calculate how that markup compounds across thirty years. Compare to the equivalent FHA-insured loan available to a white buyer the same year.",
  },
  {
    n: "03",
    title: "Public Housing and the Plan for Transformation",
    question:
      "Why did Chicago demolish 17,000 public-housing units in two decades, and what does the right of return mean in practice?",
    pairs_with: {
      label: "Comparative urban renewal and displacement dataset",
      href: "/research/data/comparative-urban-renewal-displacement",
    },
    readings: [
      {
        label: "Hills v. Gautreaux, 425 U.S. 284 (1976)",
        url: "https://supreme.justia.com/cases/federal/us/425/284/",
        note: "Full Supreme Court opinion, public domain.",
      },
      {
        label: "CHA Plan for Transformation, 1999 announcement",
        url: "https://www.thecha.org/about/plans-and-reports",
        note: "CHA's Moving to Work annual reports list every year of the plan.",
      },
      {
        label: "ProPublica Illinois CHA reporting (Mick Dumke 2022)",
        url: "https://www.propublica.org/series/chicago-housing-authority",
        note: "Independent investigation of the unit-count discrepancy.",
      },
    ],
    discussion_prompt:
      "The 1999 plan promised 25,000 replacement units. Twenty-five years later CHA reports 25,000. Read the ProPublica reporting and identify which categories of housing were counted that the original plan did not contemplate. Should those units count? Defend a position.",
  },
  {
    n: "04",
    title: "Tools the City Uses Now",
    question:
      "What does TIF actually do, who decides who benefits, and how would you change it?",
    pairs_with: {
      label: "Chicago TIF spending distribution dataset",
      href: "/research/data/chicago-tif-spending-distribution",
    },
    readings: [
      {
        label: "Illinois TIF Act, 65 ILCS 5/11-74.4",
        url: "https://www.ilga.gov/legislation/ilcs/ilcs4.asp?ActID=802&ChapterID=14",
        note: "The full enabling statute, public.",
      },
      {
        label: "Chicago TIF Illumination Project",
        url: "https://www.thecivlab.com/tif-illumination",
        note: "Independent annual breakdowns since 2013.",
      },
      {
        label: "Cook County Clerk TIF Annual Reports",
        url: "https://www.cookcountyclerkil.gov/finance/tif-revenue-reports",
        note: "Live revenue and expenditure for every Cook County TIF district.",
      },
    ],
    discussion_prompt:
      "Pick one TIF district from the Cook County Clerk reports. Read its three most recent annual reports. List every project that received funds. Decide whether each project clears the but-for test the law requires. Write a 500-word memo to the alderperson recommending changes.",
  },
];

const PAIRINGS = [
  {
    asset: "Walking tours",
    href: "/tours",
    body:
      "Each unit pairs with a stop on a walking tour. Field-trip versions of every tour are mapped and printable.",
  },
  {
    asset: "Podcast",
    href: "/podcasts",
    body:
      "Episodes are 25 to 40 minutes. Use one as homework before a unit; we include a five-question listening guide.",
  },
  {
    asset: "Research data",
    href: "/research/data",
    body:
      "Every unit links to a real dataset on this site. Students sort, filter, and export the same data the papers use.",
  },
];

export default function CurriculumPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        <PageBanner
          eyebrow="Education / Curriculum"
          title="Curriculum"
          dek="Four classroom units on the federal, municipal, and private decisions that segregated American neighborhoods between 1933 and now. Free for any educator."
          meta={[
            `${UNITS.length} units`,
            "Grades 9–12",
            "Public sources only",
            "CC BY-NC-SA 4.0",
          ]}
        />

        {/* Intro */}
        <section className="bg-cream pt-16 md:pt-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-3xl">
              <Reveal>
                <p className="font-body text-lg leading-relaxed text-ink/80 md:text-xl">
                  Built for U.S. history, civics, and AP Human Geography.
                  Every unit points at real public primary sources you can
                  click and read in class today. The readings are the
                  curriculum. We provide the framing questions, discussion
                  prompts, and links to the Rooted Forward dataset each
                  unit pairs with.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================================
            01 — THE FOUR UNITS, as archival dossier rows
            ============================================================ */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionHeading
              index="01"
              eyebrow="The kit"
              title="The four units"
              lede="Run them in order, or pull a single unit into the course you already teach. Every reading below is on a public site you can link from a slide."
            />

            <div className="mt-12 border-t border-border md:mt-16">
              {UNITS.map((u) => (
                <article
                  key={u.n}
                  className="grid grid-cols-1 gap-x-12 gap-y-8 border-b border-border py-10 md:grid-cols-12 md:py-14"
                >
                  {/* Dossier rail */}
                  <div className="md:col-span-3">
                    <Reveal y={18}>
                      <span
                        className="index-numeral block text-6xl leading-none text-rust md:text-8xl"
                        aria-hidden="true"
                      >
                        {u.n}
                      </span>
                      <p className="ledger mt-4 text-warm-gray">
                        Unit {u.n} / 0{UNITS.length}
                      </p>
                      <p className="ledger mt-1.5 text-warm-gray">
                        {u.readings.length} readings
                      </p>
                    </Reveal>
                  </div>

                  {/* Dossier body */}
                  <div className="md:col-span-9">
                    <Reveal y={20}>
                      <h3 className="max-w-[26ch] font-display text-2xl leading-tight text-forest md:text-4xl">
                        {u.title}
                      </h3>
                      <p className="mt-4 max-w-[62ch] font-body text-[15.5px] italic leading-relaxed text-ink/75">
                        {u.question}
                      </p>
                    </Reveal>

                    <Reveal y={16} delay={0.08}>
                      <div className="mt-8">
                        <p className="ledger text-warm-gray">Readings</p>
                        <ul className="mt-3 space-y-3">
                          {u.readings.map((r) => (
                            <li
                              key={r.url}
                              className="max-w-[72ch] font-body text-[15px] leading-relaxed"
                            >
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-draw font-semibold text-forest"
                              >
                                {r.label}
                                <span
                                  aria-hidden="true"
                                  className="ml-1 text-rust"
                                >
                                  &#8599;
                                </span>
                              </a>
                              {r.note && (
                                <span className="ml-2 text-ink/60">
                                  {r.note}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>

                    <Reveal y={16} delay={0.12}>
                      <blockquote className="mt-8 border-l-2 border-rust/50 pl-5 md:pl-6">
                        <p className="ledger text-warm-gray">
                          Discussion prompt
                        </p>
                        <p className="mt-2 max-w-[62ch] font-body text-[15px] italic leading-relaxed text-ink/80">
                          {u.discussion_prompt}
                        </p>
                      </blockquote>
                    </Reveal>

                    <Reveal y={12} delay={0.16}>
                      <div className="mt-8 border-t border-border pt-4">
                        <Link
                          href={u.pairs_with.href}
                          className="group inline-flex flex-wrap items-baseline gap-x-3 gap-y-1"
                        >
                          <span className="ledger text-warm-gray">
                            Pairs with
                          </span>
                          <span className="font-body text-sm font-semibold text-rust transition-colors group-hover:text-rust-dark">
                            {u.pairs_with.label}
                          </span>
                          <span
                            aria-hidden="true"
                            className="arrow-nudge text-rust"
                          >
                            &rarr;
                          </span>
                        </Link>
                      </div>
                    </Reveal>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            02 — HOW IT FITS TOGETHER (dark band)
            ============================================================ */}
        <section className="bg-cream-dark py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              How it fits together
            </p>
            <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
              Curriculum and the rest of the site
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
              {PAIRINGS.map((p) => (
                <div key={p.asset} className="flex flex-col gap-2">
                  <Link
                    href={p.href}
                    className="font-display text-xl text-forest underline decoration-transparent underline-offset-2 transition-colors hover:decoration-forest md:text-2xl"
                  >
                    {p.asset}
                  </Link>
                  <p className="max-w-[48ch] font-body text-base leading-relaxed text-ink/70">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            03 — REQUEST FORM
            ============================================================ */}
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <SectionHeading
                  index="03"
                  eyebrow="Use it in your classroom"
                  title="Tell us what you teach"
                  lede="Send a note about your subject, grade, and how many class periods you have for this. We will email back the framing questions, the readings list, and any slide drafts we have for the units that fit."
                />
                <Reveal delay={0.2}>
                  <p className="mt-6 max-w-[40ch] font-body text-sm leading-relaxed text-warm-gray">
                    We reply within a week. If you want a 20-minute call
                    to walk through it, ask.
                  </p>
                  <p className="ledger mt-8 text-warm-gray">
                    Licensed CC BY-NC-SA 4.0
                  </p>
                </Reveal>
              </div>
              <div className="lg:col-span-7">
                <Reveal delay={0.15} y={24}>
                  <div className="border border-border bg-white/40 p-6 md:p-8">
                    <CurriculumRequestForm />
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
