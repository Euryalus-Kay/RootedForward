/* ------------------------------------------------------------------ */
/*  /about                                                             */
/*                                                                     */
/*  Rebuilt from nothing, July 2026. The old page tried to be a        */
/*  mission statement, a program list, and a staff directory at once,  */
/*  and the staff directory was mostly an apology for being empty.     */
/*  The people now live on their own page at /about/team.              */
/*                                                                     */
/*  What is left here is four things in order. The mission, what we    */
/*  do, how it started, and where we work. A visitor who reads only    */
/*  the first screen should already have it.                           */
/*                                                                     */
/*  Voice rules (owner, July 2026): no aphorism headlines, no          */
/*  balanced-pair sentences, no numbered rows, no rhetorical triads.   */
/*  Say the concrete thing. Site-wide, no em-dashes and no colons      */
/*  inside sentences or headings.                                      */
/*                                                                     */
/*  There are still no photographs of our own work. The one picture    */
/*  on this page is the actual document the founder's story is about,  */
/*  which is public domain (see public/media/hyde-park/credits.json).  */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import SurveyRule from "@/components/ui/SurveyRule";

export const metadata: Metadata = {
  title: "About | Rooted Forward",
  description:
    "Rooted Forward is a student-run nonprofit that researches how racial inequality was built into Chicago's neighborhoods and puts that research where people can use it. Started by Zain Zaidi after a survey of more than 140 residents at the Obama Presidential Center.",
};

/* ------------------------------------------------------------------ */
/*  What we do. The long version of each of these is on the home       */
/*  page, so here it is one sentence and a door.                       */
/* ------------------------------------------------------------------ */

const WORK = [
  {
    title: "Self-guided walking tours",
    line: "Students research one neighborhood at a time and build a tour out of what they find. It lives on the Rooted Forward app, free to walk or to read at home.",
    link: { label: "See the tours", href: "/tours" },
  },
  {
    title: "Community outreach",
    line: "We set up where people already are, like the Obama Presidential Center and neighborhood markets, and we survey and interview residents about their own block.",
    link: { label: "Help run one", href: "/get-involved" },
  },
  {
    title: "The podcast",
    line: "We record long conversations with people who have lived through what we research, and those conversations decide what we work on next.",
    link: { label: "Listen", href: "/podcasts" },
  },
  {
    title: "Policy advocacy",
    line: "We run petitions on Chicago bills that are already introduced and stuck in a committee, then hand the signatures to that committee.",
    link: { label: "Sign a petition", href: "/policy" },
  },
];

export default function AboutPage() {
  return (
    <PageTransition>
      {/* ============================================================
          MISSION
          The whole pitch. Nothing above it, nothing beside it.
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-16 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            Our mission
          </p>
          <h1 className="mt-5 max-w-[26ch] font-display text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
            We close the gap between what was done to Chicago&rsquo;s
            neighborhoods and what people know about it.
          </h1>
          <p className="mt-8 max-w-[56ch] font-body text-lg leading-relaxed text-ink/80 md:text-xl md:leading-relaxed">
            Redlining, restrictive covenants, and urban renewal decided who
            could live where in this city. You can still see the result block
            by block. Almost nobody walking those blocks was ever taught it,
            and that is the part we work on.
          </p>
          <p className="mt-5 max-w-[56ch] font-body text-lg leading-relaxed text-ink/65">
            Rooted Forward is a nonprofit run by students. Everything we make
            is free.
          </p>
          <SurveyRule className="mt-12 text-rust" />
        </div>
      </section>

      {/* ============================================================
          WHAT WE DO
          Four blocks, one sentence each. The home page carries the
          long version, so this one stays scannable.
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">
            What we do
          </h2>
          <p className="mt-4 max-w-[52ch] font-body text-base leading-relaxed text-ink/65 md:text-lg">
            Four things, and we do all four in the same neighborhoods.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-12 md:grid-cols-2">
            {WORK.map((item) => (
              <div key={item.title} className="border-t-2 border-ink/15 pt-6">
                <h3 className="max-w-[18ch] font-display text-2xl leading-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-[46ch] font-body text-base leading-relaxed text-ink/70">
                  {item.line}
                </p>
                <Link
                  href={item.link.href}
                  className="group mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  {item.link.label}{" "}
                  <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT STARTED
          The founder's account, plus the one number the whole
          organization came out of.
          ============================================================ */}
      <section className="border-t border-border bg-cream-dark/35 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">
            How it started
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-y-12 md:grid-cols-12 md:gap-x-16">
            <div className="md:col-span-7">
              <div className="flex max-w-[58ch] flex-col gap-5 font-body text-base leading-relaxed text-ink/80 md:text-lg md:leading-relaxed">
                <p>
                  Rooted Forward was started by Zain Zaidi, a student who lives
                  on the Near South Side and goes to school in Hyde Park. Going
                  between the two every day, he kept running into the bubble
                  around the University of Chicago, and how completely the city
                  changed from one block to the next.
                </p>
                <p>
                  He went looking for why, and found redlining, restrictive
                  covenants, and the urban renewal campaigns that cleared and
                  re-sorted these blocks on purpose. The pattern he had been
                  walking through every day was drawn on a map decades before
                  he was born.
                </p>
                <p>
                  The next thing he wanted to know was how much of this the
                  neighborhood already knew. He ran a survey at the Obama
                  Presidential Center and talked with more than 140 people
                  about what they had lived through and what they had been
                  taught. The gap was far wider than he expected, including
                  among lifelong Chicagoans and especially among young people.
                </p>
                <p>
                  So he built this. Students from across Chicago do the
                  archival work and run the outreach now, and what comes out of
                  it gets published free.
                </p>
                <p>
                  The policy side comes from his seat on Chicago&rsquo;s
                  Mayor&rsquo;s Youth Commission. Sitting in those rooms is
                  where he saw how much a single ordinance can move, and how
                  few people outside City Hall are ever there when one is
                  decided. Rooted Forward works on that in small steps, on
                  bills that are already written and already stalled.
                </p>
              </div>
            </div>

            <div className="md:col-span-5">
              {/* The number the organization came out of. */}
              <div className="rounded-sm border-2 border-ink/15 bg-cream p-7">
                <p className="font-display text-6xl leading-none text-rust">
                  140+
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
                  Residents surveyed at the Obama Presidential Center about
                  what they knew of this history.
                </p>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink/55">
                  Most had not been taught it. That result is the reason there
                  is an organization.
                </p>
              </div>

              {/* The document the second paragraph is about. */}
              <figure className="mt-8">
                <img
                  src="/media/site/holc-chicago-1940.jpg"
                  alt="The 1940 Home Owners' Loan Corporation Residential Security Map of Chicago, with neighborhoods graded A through D in green, blue, yellow, and red"
                  loading="lazy"
                  className="w-full rounded-sm border border-border object-cover"
                />
                <figcaption className="mt-2 font-body text-[11px] leading-snug text-ink/60">
                  Residential Security Map of Chicago. Home Owners&rsquo; Loan
                  Corporation, 1940. CC0. The neighborhoods shaded red were the
                  ones banks were told to stay out of.
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHERE WE WORK
          Chicago is the start and still the bulk of it. The other two
          are real members doing real research, with nothing published
          yet, and the copy says exactly that.
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">
            Where we work
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-x-14 gap-y-10 md:grid-cols-2">
            <div className="border-t-2 border-ink/15 pt-6">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/55">
                Where we started
              </p>
              <h3 className="mt-3 font-display text-2xl text-ink">Chicago</h3>
              <p className="mt-3 max-w-[46ch] font-body text-base leading-relaxed text-ink/70">
                Most of the work is still here. Hyde Park is the neighborhood
                we have finished, nine stops between the Midway and the lake,
                and the survey tables run here too.
              </p>
              <Link
                href="/tours"
                className="group mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                Walk Hyde Park{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </div>

            <div className="border-t-2 border-ink/15 pt-6">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-ink/55">
                Where we went next
              </p>
              <h3 className="mt-3 font-display text-2xl text-ink">
                New York and Washington, DC
              </h3>
              <p className="mt-3 max-w-[46ch] font-body text-base leading-relaxed text-ink/70">
                We have members in both cities researching their own
                neighborhoods the same way we did Hyde Park. Tours and
                curriculum for both are being built now, and nothing is
                published until the documents behind it are.
              </p>
              <Link
                href="/about/team"
                className="group mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                See who is on it{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE TWO DOORS OUT. Meet the team, or join it.
          ============================================================ */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <SurveyRule className="text-rust-light" />
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="font-display text-3xl text-cream md:text-4xl">
                Who runs it
              </h2>
              <p className="mt-4 max-w-[46ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
                Students in Chicago, New York, and Washington, DC.
              </p>
              <Link
                href="/about/team"
                className="mt-7 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Meet the team
              </Link>
            </div>
            <div>
              <h2 className="font-display text-3xl text-cream md:text-4xl">
                We could use your help
              </h2>
              <p className="mt-4 max-w-[46ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
                If you can dig through an archive, run a survey table at a
                market, or edit audio, there is work here for you. You do not
                need experience to start.
              </p>
              <Link
                href="/get-involved"
                className="group mt-7 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream"
              >
                Get involved{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
