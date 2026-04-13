import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export default function AboutPage() {
  return (
    <PageTransition>
      {/* ============================================================
          PAGE HEADER
          ============================================================ */}
      <section className="bg-cream pb-12 pt-32 md:pt-40">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            About
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.1] text-forest md:text-6xl">
            We Don&rsquo;t Wait for Permission to Tell the Truth
          </h1>
          <hr className="mt-8 w-24 border-t-2 border-rust" />
        </div>
      </section>

      {/* ============================================================
          MISSION SECTION
          ============================================================ */}
      <section className="bg-cream py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Our Mission
              </p>
            </div>
            <div className="md:col-span-9">
              <p className="font-body text-xl leading-relaxed text-ink/80 md:text-2xl md:leading-relaxed">
                We are young people who believe the built environment tells the
                truth about American racism when textbooks won&rsquo;t. Through
                walking tours, podcasts, and community storytelling, we document
                how redlining, urban renewal, highway construction, and
                gentrification have shaped the cities we live in.
              </p>
              <p className="mt-6 font-body text-xl leading-relaxed text-ink/80 md:text-2xl md:leading-relaxed">
                Our work is rooted in research, grounded in community, and
                pointed toward justice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          OUR STORY SECTION
          ============================================================ */}
      <section className="bg-cream py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="border-l-4 border-rust pl-8 md:pl-12">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              Our Story
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
              It Started With a Map
            </h2>
            <div className="mt-8 max-w-3xl space-y-6">
              <p className="font-body text-lg leading-relaxed text-ink/75">
                In the spring of 2024, a group of high-school students on the
                South Side of Chicago were looking at 1930s Home Owners&rsquo;
                Loan Corporation maps &mdash; the redlining maps &mdash; in a
                history class. One student overlaid the map on a current view of
                the neighborhood and froze: the red lines from nearly a century
                ago matched the boundaries they walked past every day.
              </p>
              <p className="font-body text-lg leading-relaxed text-ink/75">
                Vacant lots, shuttered businesses, crumbling infrastructure
                &mdash; all concentrated on one side of a line that a federal
                bureaucrat drew before their grandparents were born. The other
                side: maintained, invested in, and thriving. The map wasn&rsquo;t
                history. It was still the present.
              </p>
              <p className="font-body text-lg leading-relaxed text-ink/75">
                Those students decided that if the built environment was
                a&nbsp;document, they were going to be the ones to read it
                aloud. They designed a walking tour of Bronzeville, recorded
                interviews with residents, and opened it to the public. Within
                months, young people in New York, Dallas, and San Francisco were
                doing the same. Rooted Forward was born.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          YOUTH-LED STRUCTURE SECTION
          ============================================================ */}
      <section className="border-t border-border bg-cream py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                How We Work
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-display text-3xl text-forest md:text-4xl">
                Youth-Led, Every Step
              </h2>
              <div className="mt-8 max-w-3xl space-y-6">
                <p className="font-body text-lg leading-relaxed text-ink/75">
                  Rooted Forward is organized into city chapters, each led by
                  young people between the ages of 16 and 24. Chapter leads
                  design tour routes, research stops, write podcast scripts,
                  conduct interviews, and train new guides. Adult advisors
                  &mdash; historians, urban planners, educators, and community
                  organizers &mdash; provide mentorship, but they never hold
                  decision-making power.
                </p>
                <p className="font-body text-lg leading-relaxed text-ink/75">
                  Our structure is intentionally flat. Leadership rotates
                  annually so that no single voice dominates the narrative.
                  Every tour script, every podcast episode, and every public
                  statement is authored, reviewed, and approved by youth members.
                  We believe the people closest to the story are the most
                  qualified to tell it.
                </p>
                <p className="font-body text-lg leading-relaxed text-ink/75">
                  This isn&rsquo;t a youth program attached to an adult
                  organization. This is a youth organization, period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CHAPTER LOCATIONS SECTION
          ============================================================ */}
      <section className="border-t border-border bg-cream py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Our Chapters
          </p>
          <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
            Where We Work
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2">
            {[
              {
                city: "Chicago",
                context:
                  "South Side and West Side neighborhoods shaped by redlining, urban renewal, and decades of disinvestment. Our founding chapter.",
                href: "/tours/chicago",
              },
              {
                city: "New York",
                context:
                  "From the Cross-Bronx Expressway to East New York, tracing displacement and resistance across five boroughs.",
                href: "/tours/new-york",
              },
              {
                city: "Dallas",
                context:
                  "Highways built to divide, neighborhoods erased for \"progress,\" and communities still fighting for visibility in North Texas.",
                href: "/tours/dallas",
              },
              {
                city: "San Francisco",
                context:
                  "The Fillmore, Bayview-Hunters Point, and the ongoing story of demolition, displacement, and cultural survival.",
                href: "/tours/san-francisco",
              },
            ].map(({ city, context, href }) => (
              <Link
                key={city}
                href={href}
                className="group bg-cream p-10 transition-colors hover:bg-cream-dark md:p-12"
              >
                <h3 className="font-display text-2xl text-forest md:text-3xl">
                  {city}
                </h3>
                <p className="mt-3 font-body leading-relaxed text-ink/60">
                  {context}
                </p>
                <span className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                  View Tours &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          BOTTOM CTA
          ============================================================ */}
      <section className="bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Join the Work
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We are always looking for young researchers, storytellers, tour
            guides, and allies. If this work matters to you, it needs you.
          </p>
          <Link
            href="/get-involved"
            className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
