import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Build the Block | Rooted Forward",
  description:
    "A 20-minute browser game where you govern a fictional Chicago ward from 1940 to 2040. Real HOLC maps, real housing-finance numbers, real consequences.",
};

const CHAPTERS = [
  {
    n: "01",
    period: "1940 — 1955",
    title: "Lines on a Map",
    body: "You arrive as a new HOLC surveyor and grade Parkhaven's blocks A, B, C, D using the actual 1940 Chicago survey descriptions. The chapter closes with the Interstate Highway Act and a six-lane expressway routed through the C-graded corridor.",
  },
  {
    n: "02",
    period: "1955 — 1975",
    title: "Contracts and Covenants",
    body: "FHA-insured mortgages are denied to Black families arriving during the Great Migration. They can only buy through contract sellers at 84% markup. You decide whether to enforce a fair-housing ordinance and whether to back the 1968 Contract Buyers League strike.",
  },
  {
    n: "03",
    period: "1975 — 2000",
    title: "Urban Renewal and Public Housing",
    body: "CHA towers, Gautreaux, and HOPE VI. You decide siting, mix, and whether to fight the scattered-site injunction. The Plan for Transformation looms at chapter close: demolish the towers for mixed-income, or rehab in place.",
  },
  {
    n: "04",
    period: "2000 — 2040",
    title: "ARO, TIF, and the Red Line",
    body: "The modern toolkit. You set Parkhaven's affordable-requirements tier, route TIF dollars, and decide where a Red Line Extension lands. The chapter ends in 2040 with an editorial-layout end-screen describing the neighborhood your decisions built.",
  },
];

const PRINCIPLES = [
  {
    title: "No score. No win. No villain.",
    body: "There are no points, no leaderboards, no three-star endings. The end-screen is an essay, not a report card.",
  },
  {
    title: "Every number is sourced",
    body: "AMI, LIHTC per-unit costs, TIF capture, contract-buying markups, Red Line Extension funding — every figure clicks through to HUD, IHDA, the Civic Federation, NCRC, the Duke Cook Center.",
  },
  {
    title: "Hidden meters, visible direction",
    body: "Five latent variables — displacement, wealth extraction, community memory, political capital, equity delta — are surfaced through the world, not in numbers. The bakery closes. The mural fills in. The bank changes signs.",
  },
  {
    title: "The system, not the cartoon",
    body: "HOLC surveyors were professionals doing their jobs inside a federally sanctioned system. The game quotes them accurately and lets you feel what it was like to write those words.",
  },
];

const SOURCES = [
  "HUD",
  "IHDA",
  "Civic Federation",
  "Cook County Clerk",
  "NCRC",
  "Duke Cook Center",
  "Richmond DSL",
  "Block Club Chicago",
  "WBEZ",
  "CTA",
  "FTA",
  "Mapping Inequality",
];

export default function GamePage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cream">
        {/* Hero banner */}
        <section className="relative bg-forest pt-28 pb-20 md:pt-36 md:pb-28">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              A Rooted Forward Game
            </p>
            <h1 className="mt-5 max-w-[14ch] font-display text-5xl leading-[0.95] text-cream md:text-7xl lg:text-[5.5rem]">
              Build the Block
            </h1>
            <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-cream/70 md:text-xl md:leading-relaxed">
              A 20-minute browser game where you inherit a disinvested Chicago
              ward in 1940 and make a century of zoning, transit, housing-finance,
              and community-benefit decisions. By 2040, Parkhaven looks the way
              it does because of the lines you drew.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <span className="inline-flex cursor-not-allowed items-center rounded-sm bg-rust/40 px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white">
                Play &mdash; Coming 2026
              </span>
              <Link
                href="/contact"
                className="inline-flex items-center font-body text-sm font-semibold uppercase tracking-widest text-cream/80 underline underline-offset-4 transition-colors hover:text-cream"
              >
                Join the playtest list
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-3 border-t border-cream/15 pt-6 font-body text-xs uppercase tracking-[0.2em] text-cream/55">
              <span>20 minutes &middot; replayable</span>
              <span>1940 &mdash; 2040</span>
              <span>Browser, free</span>
              <span>For grades 11+ &amp; adults</span>
            </div>
          </div>
        </section>

        {/* The premise */}
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
              <div className="lg:col-span-4">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  The premise
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-forest md:text-5xl">
                  You are the next person to draw the line.
                </h2>
              </div>
              <div className="space-y-5 lg:col-span-8">
                <p className="font-body text-base leading-relaxed text-ink/75 md:text-lg md:leading-relaxed">
                  You inherit Ward 42 &mdash; Parkhaven, a fictional Chicago
                  composite modeled on a North Lawndale and Logan Square
                  hybrid. Close enough to the Loop to be redlined in 1940.
                  Close enough to transit to be gentrifiable in 2010. The
                  decisions you make as surveyor, alderman, planner, and mayor
                  cascade across a century.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75 md:text-lg md:leading-relaxed">
                  Every economic and historical constraint in the game is
                  drawn from a real Chicago source. The HOLC tiles display in
                  their original surveyor colors. The contract-buying markups
                  match the Duke Cook Center&rsquo;s findings. The Red Line
                  Extension costs what the FTA actually committed to fund in
                  December 2024.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75 md:text-lg md:leading-relaxed">
                  By 2040 you will write &mdash; not score &mdash; the
                  neighborhood you built.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="bg-cream-dark py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Four chapters &middot; one century
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-5xl">
              The arc of the game
            </h2>
            <div className="mt-14 flex flex-col gap-px bg-border">
              {CHAPTERS.map((c) => (
                <article
                  key={c.n}
                  className="grid grid-cols-1 gap-6 bg-cream p-8 md:grid-cols-12 md:gap-10 md:p-12"
                >
                  <div className="md:col-span-3">
                    <p className="font-display text-5xl leading-none text-rust md:text-6xl">
                      {c.n}
                    </p>
                    <p className="mt-3 font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                      {c.period}
                    </p>
                  </div>
                  <div className="md:col-span-9">
                    <h3 className="font-display text-2xl text-forest md:text-3xl">
                      {c.title}
                    </h3>
                    <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/70 md:text-lg md:leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* The end screen */}
        <section className="bg-ink py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
              <div className="lg:col-span-5">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                  The end-screen
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-cream md:text-5xl">
                  The Parkhaven Record, 2040
                </h2>
                <p className="mt-6 max-w-[40ch] font-body text-base leading-relaxed text-cream/65 md:text-lg">
                  Not a win screen. A two-page editorial artifact rendering
                  your century as a narrative your students can read aloud and
                  argue about.
                </p>
              </div>
              <div className="lg:col-span-7">
                <div className="space-y-6 border-l-2 border-rust pl-8">
                  <p className="font-display text-2xl leading-snug text-cream/85 md:text-3xl">
                    &ldquo;The bakery on 22nd closed in 1998. My grandmother&rsquo;s
                    block is a Chase branch now. The mural on Damen got finished
                    in 2026 and I learned the names of every painter in eighth
                    grade.&rdquo;
                  </p>
                  <p className="font-body text-sm uppercase tracking-[0.2em] text-cream/45">
                    &mdash; A 2040 Parkhaven resident, in your run
                  </p>
                </div>
                <p className="mt-8 max-w-[55ch] font-body text-base leading-relaxed text-cream/65 md:text-lg">
                  A four-axis compass plots your run against four named
                  archetypes &mdash; the Reformer, the Caretaker, the Developer,
                  the Speculator &mdash; with no ranking between them. Every
                  archetype&rsquo;s epilogue is written with equal craft. There
                  is no good ending.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Design principles */}
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Design principles
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-5xl">
              What this game refuses to do
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2">
              {PRINCIPLES.map((p, i) => (
                <div key={p.title} className="flex gap-6">
                  <span className="flex-shrink-0 font-display text-4xl leading-none text-border">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-forest md:text-2xl">
                      {p.title}
                    </h3>
                    <p className="mt-3 max-w-[48ch] font-body text-base leading-relaxed text-ink/70">
                      {p.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sources */}
        <section className="border-t border-border bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
              <div className="lg:col-span-5">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  Sources
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-forest md:text-4xl">
                  Every number clicks through
                </h2>
                <p className="mt-6 max-w-[40ch] font-body text-base leading-relaxed text-ink/70">
                  AMI bands from HUD&rsquo;s 2024 Chicago-Naperville-Joliet
                  HMFA. Per-unit LIHTC costs from IHDA. TIF capture from the
                  Cook County Clerk. HOLC polygons from the University of
                  Richmond&rsquo;s Mapping Inequality project, attributed and
                  CC-licensed. Full bibliography exportable from the game.
                </p>
              </div>
              <div className="lg:col-span-7">
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map((s) => (
                    <span
                      key={s}
                      className="rounded-sm border border-border bg-cream-dark px-4 py-2 font-body text-sm text-forest"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-forest py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              Launching 2026
            </p>
            <h2 className="mt-4 font-display text-3xl text-cream md:text-5xl">
              Be in the first classroom to play it
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              We&rsquo;re running educator and community playtests through
              fall 2026. If you teach high-school history, civics, or
              geography &mdash; or if you organize in a Chicago neighborhood
              this game is about &mdash; we want you in the room.
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Join the playtest list
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
