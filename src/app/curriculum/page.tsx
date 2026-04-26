import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import CurriculumRequestForm from "@/components/forms/CurriculumRequestForm";

export const metadata: Metadata = {
  title: "Curriculum | Rooted Forward",
  description:
    "Four classroom units on the federal, municipal, and private decisions that segregated American neighborhoods between 1933 and now. Built around our walking tours, podcast, game, and research papers.",
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
      label: "1938 HOLC Chicago map dataset",
      href: "/research/data/1938-holc-chicago-map-annotated",
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
      label: "Chicago Housing Authority retrospective dataset",
      href: "/research/data/cha-plan-for-transformation-retrospective",
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
      label: "Bronzeville TIF expenditure dataset",
      href: "/research/data/bronzeville-tif-expenditure-analysis",
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
    asset: "Game",
    href: "/game",
    body:
      "Twenty-minute interactive scenario where students make rezoning, TIF, and housing-policy decisions on a real Chicago neighborhood.",
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
        {/* Banner */}
        <section className="relative pt-16 pb-12 md:pb-16">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
          />
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex items-center justify-center pt-12 md:pt-16">
            <h1 className="font-display text-4xl text-white md:text-5xl lg:text-6xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
              Curriculum
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="bg-cream pt-16 md:pt-24">
          <div className="mx-auto max-w-3xl px-6">
            <p className="max-w-[60ch] font-body text-lg leading-relaxed text-ink/80 md:text-xl">
              Four classroom units on the federal, municipal, and
              private decisions that segregated American neighborhoods
              between 1933 and now. Built for U.S. history, civics, and
              AP Human Geography. Free for any educator. Email and we
              will send what we have.
            </p>
            <p className="mt-5 max-w-[60ch] font-body text-base leading-relaxed text-ink/70">
              Every unit points at real public primary sources you can
              click and read in class today. The readings are the
              curriculum. We provide the framing questions, discussion
              prompts, and links to the Rooted Forward dataset each
              unit pairs with.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-cream pt-12 md:pt-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">
                  4
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  Units
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">
                  Free
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  CC BY-NC-SA 4.0
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">
                  9–12
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  Grade Range
                </p>
              </div>
              <div className="bg-cream p-6 text-center md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">
                  Public
                </p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  Sources Only
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Units */}
        <section className="border-t border-border bg-cream py-16 md:py-24 mt-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display text-3xl text-forest md:text-4xl">
              The Four Units
            </h2>
            <p className="mt-3 max-w-[55ch] font-body text-base text-ink/70">
              Run them in order, or pull a single unit into the course
              you already teach. Every reading below is on a public
              site you can link from a slide.
            </p>
            <ul className="mt-12 flex flex-col gap-px bg-border">
              {UNITS.map((u) => (
                <li
                  key={u.n}
                  className="bg-cream p-7 md:p-10"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-10">
                    <div className="md:col-span-3">
                      <p className="font-display text-5xl leading-none text-rust md:text-6xl">
                        {u.n}
                      </p>
                      <p className="mt-3 font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                        Unit {u.n}
                      </p>
                    </div>
                    <div className="md:col-span-9">
                      <h3 className="font-display text-2xl text-forest md:text-3xl">
                        {u.title}
                      </h3>
                      <p className="mt-3 font-body text-[15.5px] italic leading-relaxed text-ink/75">
                        {u.question}
                      </p>

                      <div className="mt-6">
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-warm-gray">
                          Readings
                        </p>
                        <ul className="mt-2 space-y-2.5">
                          {u.readings.map((r) => (
                            <li
                              key={r.url}
                              className="font-body text-[14.5px] leading-relaxed text-ink/85"
                            >
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-forest underline decoration-forest/40 underline-offset-2 hover:decoration-forest"
                              >
                                {r.label}
                              </a>
                              {r.note && (
                                <span className="ml-1 text-ink/65">
                                  {r.note}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6">
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-warm-gray">
                          Discussion prompt
                        </p>
                        <p className="mt-2 max-w-[60ch] font-body text-[14.5px] leading-relaxed text-ink/85">
                          {u.discussion_prompt}
                        </p>
                      </div>

                      <div className="mt-6">
                        <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-warm-gray">
                          Pairs with
                        </p>
                        <Link
                          href={u.pairs_with.href}
                          className="mt-2 inline-block font-body text-[14.5px] font-semibold text-rust underline decoration-rust/40 underline-offset-2 hover:decoration-rust"
                        >
                          {u.pairs_with.label} →
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What pairs with what */}
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

        {/* Request form */}
        <section className="border-t border-border bg-cream py-20 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                  Use it in your classroom
                </p>
                <h2 className="mt-3 font-display text-3xl leading-tight text-forest md:text-4xl">
                  Tell us what you teach.
                </h2>
                <p className="mt-5 max-w-[40ch] font-body text-base leading-relaxed text-ink/75">
                  Send a note about your subject, grade, and how many
                  class periods you have for this. We will email back
                  the framing questions, the readings list, and any
                  slide drafts we have for the units that fit.
                </p>
                <p className="mt-4 max-w-[40ch] font-body text-sm leading-relaxed text-warm-gray">
                  We reply within a week. If you want a 20-minute call
                  to walk through it, ask.
                </p>
              </div>
              <div className="md:col-span-7">
                <CurriculumRequestForm />
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
