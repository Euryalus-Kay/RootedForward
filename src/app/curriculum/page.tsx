import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import CurriculumRequestForm from "@/components/forms/CurriculumRequestForm";

export const metadata: Metadata = {
  title: "Curriculum | Rooted Forward",
  description:
    "A free 12-session classroom unit on the policies that built American cities. Built around our walking tours, podcast, and game.",
};

const UNITS = [
  {
    n: "01",
    title: "Lines on the Map",
    sessions: "3 sessions",
    body:
      "Students read a 1940 HOLC surveyor description out loud, overlay it on a current census map of the same tract, and trace what stayed in place. Pairs with the Bronzeville podcast episode and the first walking tour.",
    standards: "C3 D2.His.4.9-12 · D2.Geo.6.9-12",
  },
  {
    n: "02",
    title: "Contracts and the Color Tax",
    sessions: "2 sessions",
    body:
      "Students model the wealth gap created by contract buying with the actual Cook Center markup numbers, then read about the 1968 Contract Buyers League strike as a case in collective action.",
    standards: "C3 D2.Eco.10.9-12 · D4.7.9-12",
  },
  {
    n: "03",
    title: "The Towers and Gautreaux",
    sessions: "3 sessions",
    body:
      "From the CHA towers to Hills v. Gautreaux to HOPE VI. Students debate the Plan for Transformation in a structured Harkness seminar. We give you the prompts.",
    standards: "C3 D2.Civ.5.9-12 · D2.His.16.9-12",
  },
  {
    n: "04",
    title: "Today's Toolkit",
    sessions: "4 sessions",
    body:
      "TIF, ARO, the Red Line Extension. Students play the game in pairs, then write a 500-word memo recommending changes to one Chicago tool. We've used this with juniors and adult organizers and it works for both.",
    standards: "C3 D4.6.9-12 · D2.Civ.13.9-12",
  },
];

const FORMATS = [
  {
    title: "Lesson plans",
    body:
      "45-minute and 90-minute versions of every session, with timing, materials, and a printable script you can hand to a sub.",
  },
  {
    title: "Slide decks",
    body:
      "Editable Google Slides and Keynote files. Drop them into your existing class without rebranding.",
  },
  {
    title: "Discussion guides",
    body:
      "Harkness, Socratic, and small-group prompts, with sample student responses and follow-ups for the moments where conversations stall.",
  },
  {
    title: "Pre/post checks",
    body:
      "Five-question knowledge checks on AMI, redlining, TIF, displacement, and inclusionary zoning. The pilot cohort averaged a +1.5-question gain.",
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
            <p className="max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl md:leading-relaxed">
              Twelve sessions on how the federal government, the city of
              Chicago, and private actors segregated American neighborhoods
              between 1933 and now. Built for U.S. history, civics, and AP
              Human Geography. Used in three Chicago Public Schools and a
              handful of college courses. Free, and we will help you set it
              up.
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
              Run them as a 12-session arc, or pull a single unit into the
              course you already teach.
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
              Drop-in materials, not a homework assignment
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
                &ldquo;The pre/post gain on this unit was the cleanest I&rsquo;ve
                ever measured. By the end my juniors were arguing about TIF
                in the hallway.&rdquo;
              </p>
              <p className="mt-6 font-body text-sm uppercase tracking-[0.2em] text-warm-gray">
                CPS social studies teacher, pilot cohort
              </p>
            </div>
          </div>
        </section>

        {/* Real request form */}
        <section className="border-t border-border bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
                  Request the kit
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-forest md:text-4xl">
                  Tell us about your classroom.
                </h2>
                <p className="mt-6 max-w-[40ch] font-body text-base leading-relaxed text-ink/70">
                  We send everything over email: lesson plans, slide
                  decks, discussion guides, the assessment. If you want,
                  we&rsquo;ll set up a 20-minute call to walk through it
                  with you.
                </p>
                <p className="mt-6 max-w-[40ch] font-body text-sm leading-relaxed text-warm-gray">
                  We email back within a week. Usually faster.
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
