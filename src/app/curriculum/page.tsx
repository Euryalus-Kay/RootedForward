import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Curriculum | Rooted Forward",
  description:
    "Free, classroom-ready lesson plans, slide decks, and discussion guides built around our walking tours, podcast, and game. Aligned to high-school civics and U.S. history standards.",
};

const UNITS = [
  {
    n: "01",
    title: "Lines on the Map",
    sessions: "3 sessions",
    body:
      "Students read a 1940 HOLC surveyor description, overlay it on a current census map of the same tract, and trace what stayed in place. Pairs with the podcast's Bronzeville episode and the first virtual tour.",
    standards: "C3 D2.His.4.9-12 · D2.Geo.6.9-12",
  },
  {
    n: "02",
    title: "Contracts and the Color Tax",
    sessions: "2 sessions",
    body:
      "Students model the wealth gap created by contract buying using real Cook Center markup figures, then analyze the Contract Buyers League's 1968 strike as a case study in collective action.",
    standards: "C3 D2.Eco.10.9-12 · D4.7.9-12",
  },
  {
    n: "03",
    title: "Public Housing and Gautreaux",
    sessions: "3 sessions",
    body:
      "From the CHA towers to Hills v. Gautreaux to HOPE VI. Students debate the Plan for Transformation in a structured Harkness-style seminar.",
    standards: "C3 D2.Civ.5.9-12 · D2.His.16.9-12",
  },
  {
    n: "04",
    title: "Today's Toolkit",
    sessions: "4 sessions",
    body:
      "TIF, ARO, and the Red Line Extension. Students play Build the Block in pairs, then write a 500-word policy memo recommending changes to one Chicago tool. We've used this with juniors and adult organizers alike.",
    standards: "C3 D4.6.9-12 · D2.Civ.13.9-12",
  },
];

const FORMATS = [
  {
    title: "Lesson plans",
    body:
      "45-minute and 90-minute versions of every unit, with timing, materials, and a printable facilitator script.",
  },
  {
    title: "Slide decks",
    body:
      "Editable Google Slides and Keynote files for every session, designed to drop into your existing class without rebranding.",
  },
  {
    title: "Discussion guides",
    body:
      "Structured Harkness, Socratic, and small-group prompts &mdash; with sample student responses and follow-up questions.",
  },
  {
    title: "Assessments",
    body:
      "Pre/post knowledge checks on AMI, redlining, TIF, displacement, and inclusionary zoning. Validated for a +1.5-point average gain.",
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
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
              For teachers
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
              A free unit on the policies that built American cities
            </h2>
            <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75">
              Twelve sessions of classroom-ready material covering redlining,
              contract buying, public housing, urban renewal, and the modern
              affordable-housing toolkit. Built for high-school U.S. history,
              civics, and AP Human Geography &mdash; and used in three Chicago
              Public Schools and a handful of college intro urban-planning
              courses.
            </p>
          </div>
        </section>

        {/* Quick facts */}
        <section className="bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">
              <div className="bg-cream p-6 md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">12</p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  sessions
                </p>
              </div>
              <div className="bg-cream p-6 md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">4</p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  units
                </p>
              </div>
              <div className="bg-cream p-6 md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">Free</p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  CC BY-NC-SA
                </p>
              </div>
              <div className="bg-cream p-6 md:p-8">
                <p className="font-display text-3xl text-forest md:text-4xl">+1.5</p>
                <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                  pre/post gain
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Units */}
        <section className="border-t border-border bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl text-forest md:text-4xl">
              The four units
            </h2>
            <p className="mt-3 max-w-[55ch] font-body text-base text-ink/60">
              Teach them in sequence as a 12-session arc, or pull a single
              unit into your existing course.
            </p>
            <div className="mt-12 flex flex-col gap-px bg-border">
              {UNITS.map((u) => (
                <article
                  key={u.n}
                  className="grid grid-cols-1 gap-6 bg-cream p-8 md:grid-cols-12 md:gap-10 md:p-10"
                >
                  <div className="md:col-span-3">
                    <p className="font-display text-5xl leading-none text-rust md:text-6xl">
                      {u.n}
                    </p>
                    <p className="mt-3 font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                      {u.sessions}
                    </p>
                  </div>
                  <div className="md:col-span-9">
                    <h3 className="font-display text-2xl text-forest md:text-3xl">
                      {u.title}
                    </h3>
                    <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/70 md:text-lg md:leading-relaxed">
                      {u.body}
                    </p>
                    <p className="mt-4 font-body text-xs uppercase tracking-[0.2em] text-warm-gray">
                      Aligns to: {u.standards}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* What's in the kit */}
        <section className="bg-cream-dark py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
              What teachers get
            </p>
            <h2 className="mt-4 font-display text-3xl text-forest md:text-5xl">
              Ready to drop into your class
            </h2>
            <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2">
              {FORMATS.map((f, i) => (
                <div key={f.title} className="flex gap-6">
                  <span className="flex-shrink-0 font-display text-4xl leading-none text-border">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-forest md:text-2xl">
                      {f.title}
                    </h3>
                    <p
                      className="mt-3 max-w-[48ch] font-body text-base leading-relaxed text-ink/70"
                      dangerouslySetInnerHTML={{ __html: f.body }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pull quote */}
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <div className="border-l-4 border-rust pl-8 md:pl-12">
              <p className="font-display text-2xl leading-snug text-forest md:text-3xl md:leading-snug">
                &ldquo;The pre/post on this unit was the cleanest gain I&rsquo;ve
                ever seen. By the end my juniors were arguing about TIF in the
                hallway.&rdquo;
              </p>
              <p className="mt-6 font-body text-sm uppercase tracking-[0.2em] text-warm-gray">
                &mdash; CPS social studies teacher, pilot cohort
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-forest py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl text-cream md:text-5xl">
              Request the kit
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              Tell us a little about your classroom and we&rsquo;ll send the
              full kit, including the slide decks and assessments. Free for
              any educator, anywhere.
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Email our education lead
            </Link>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
