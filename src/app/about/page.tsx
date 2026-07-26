/* ------------------------------------------------------------------ */
/*  /about                                                             */
/*                                                                     */
/*  Rebuilt from nothing, July 2026. The old page tried to be a        */
/*  mission statement, a program list, and a staff directory at once,  */
/*  and the staff directory was mostly an apology for being empty.     */
/*  There is no people section here at all now. A /about/team page      */
/*  was built and then pulled at the owner's request (July 2026) so    */
/*  he could build the real one himself; see git history at 92bc616    */
/*  for the roster component if it is worth reusing.                   */
/*                                                                     */
/*  Order, owner's call. Mission, how it started, what we do, where we */
/*  work. The founder's account sits directly under the mission        */
/*  because it is the reason the mission exists.                       */
/*                                                                     */
/*  The mission is the owner's own sentence, set in two colors at his  */
/*  request. Rust for who we are, ink for what we do. It says cities   */
/*  across the United States, not Chicago, because members now work    */
/*  in New York and Washington, DC and Chicago is only where we        */
/*  started. Keep that scope if you touch this copy.                   */
/*                                                                     */
/*  No SurveyRule on this page. The owner asked for every one of them  */
/*  to come off /about (July 2026); the divider is still in use        */
/*  elsewhere on the site.                                             */
/*                                                                     */
/*  Voice rules (owner, July 2026): no aphorism headlines, no          */
/*  balanced-pair sentences, no numbered rows, no rhetorical triads.   */
/*  Say the concrete thing. Site-wide, no em-dashes and no colons      */
/*  inside sentences or headings, and the owner has asked specifically */
/*  that this page carry no dash punctuation at all.                   */
/*                                                                     */
/*  There are still no photographs of our own work. The one picture    */
/*  on this page is the actual document the founder's story is about,  */
/*  which is public domain (see public/media/hyde-park/credits.json).  */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "About | Rooted Forward",
  description:
    "A student-run nonprofit started in Chicago. Rooted Forward educates people about racial inequality in cities across the United States, and works to address it through education, awareness, and political advocacy.",
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

          {/* Two colors in one statement, owner's call. The rust sentence
              says who we are, the ink sentence says what we do. Rust on
              cream is 3.7:1, which clears AA at this size and would not at
              body size, so this treatment stays on the headline only.
              44px rather than a scale step, so it stays clearly larger
              than the 36px section headings without running to seven
              lines the way text-5xl did. */}
          <h1 className="mt-5 max-w-[42ch] font-display text-2xl leading-[1.2] tracking-tight sm:text-3xl md:text-[2.75rem]">
            <span className="text-rust">
              A student-run nonprofit started in Chicago.
            </span>{" "}
            <span className="text-ink">
              Rooted Forward educates people about racial inequality in cities
              across the United States, and works to address it through
              education, awareness, and political advocacy.
            </span>
          </h1>

          <p className="mt-8 max-w-[56ch] font-body text-lg leading-relaxed text-ink/80 md:text-xl md:leading-relaxed">
            Redlining, restrictive covenants, and urban renewal decided who
            could live where in American cities. The impact is easy to see. In
            every one of these cities the difference between one block and the
            next is measurable in race, income, and life expectancy.
          </p>

          {/* The reach of the organization gets its own forest block so it
              does not read as one more line of body copy. Owner asked for
              this to stand out from the text around it. */}
          <div className="mt-9 max-w-[46ch] rounded-sm bg-forest px-7 py-6">
            <p className="font-body text-lg font-semibold leading-relaxed text-cream md:text-xl md:leading-relaxed">
              We started in Chicago and now have members in New York and
              Washington, DC.
            </p>
            <p className="mt-2 font-body text-base leading-relaxed text-cream/75">
              Everything we make is free.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT STARTED
          Directly under the mission, owner's call. The founder's
          account, plus the one number the whole organization came
          out of.
          ============================================================ */}
      <section className="bg-cream-dark/35 py-16 md:py-24">
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
                  rearranged these blocks on purpose. The pattern he had been
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
                  So he built this. Students in three cities do the archival
                  work and run the outreach now, and what comes out of it gets
                  published free.
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
          WHAT WE DO
          Four blocks, one sentence each. The home page carries the
          long version, so this one stays scannable.
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">
            What we do
          </h2>

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
                Most of the work is still here. Hyde Park is finished, nine
                stops between the Midway and the lake.
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
                Members in both cities are researching their own
                neighborhoods. Nothing is published yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE DOOR OUT. The "Who runs it" column that sat beside this
          pointed at /about/team, which the owner is rebuilding himself
          (July 2026). Put a people section back here when his page
          exists, and add its route to the footer and the sitemap.
          ============================================================ */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl text-cream md:text-4xl">
            We could use your help
          </h2>
          <p className="mt-4 max-w-[52ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
            If you can dig through an archive, run a survey table at a market,
            or edit audio, there is work here for you. You do not need
            experience to start.
          </p>
          <Link
            href="/get-involved"
            className="mt-8 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
