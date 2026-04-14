import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

/* ------------------------------------------------------------------ */
/*  Board member data — edit these arrays to add/remove people         */
/* ------------------------------------------------------------------ */

interface BoardMember {
  name: string;
  role: string;
  bio: string;
}

const STUDENT_BOARD: BoardMember[] = [
  {
    name: "Member Name",
    role: "Chapter Lead",
    bio: "Short bio goes here. A sentence or two about their role and background.",
  },
  {
    name: "Member Name",
    role: "Tour Coordinator",
    bio: "Short bio goes here. A sentence or two about their role and background.",
  },
  {
    name: "Member Name",
    role: "Podcast Producer",
    bio: "Short bio goes here. A sentence or two about their role and background.",
  },
  {
    name: "Member Name",
    role: "Research Lead",
    bio: "Short bio goes here. A sentence or two about their role and background.",
  },
];

const ADVISORY_BOARD: BoardMember[] = [
  {
    name: "Advisor Name",
    role: "Historian",
    bio: "Short bio goes here. Background and how they support the organization.",
  },
  {
    name: "Advisor Name",
    role: "Urban Planner",
    bio: "Short bio goes here. Background and how they support the organization.",
  },
  {
    name: "Advisor Name",
    role: "Educator",
    bio: "Short bio goes here. Background and how they support the organization.",
  },
];

/* ------------------------------------------------------------------ */
/*  Board member card component                                        */
/* ------------------------------------------------------------------ */

function BoardCard({ member }: { member: BoardMember }) {
  return (
    <div className="rounded-sm border border-border bg-cream-dark p-6">
      {/* Photo placeholder */}
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cream border border-border">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
          className="h-8 w-8 text-warm-gray-light"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </div>
      <h3 className="font-display text-lg text-forest text-center">
        {member.name}
      </h3>
      <p className="mt-1 font-body text-sm font-medium text-rust text-center">
        {member.role}
      </p>
      <p className="mt-3 font-body text-sm leading-relaxed text-ink/70 text-center">
        {member.bio}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  return (
    <PageTransition>
      {/* Page Header */}
      <section className="bg-cream pb-12 pt-32 md:pt-40">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            About
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.1] text-forest md:text-6xl">
            About Rooted Forward
          </h1>
          <hr className="mt-8 w-24 border-t-2 border-rust" />
        </div>
      </section>

      {/* Mission */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                Our Mission
              </p>
            </div>
            <div className="md:col-span-9">
              <p className="font-body text-xl leading-relaxed text-ink/80 md:text-2xl md:leading-relaxed">
                Rooted Forward documents how policy decisions &mdash; redlining,
                urban renewal, highway construction, gentrification &mdash;
                shaped the neighborhoods we live in. We do this through walking
                tours, podcasts, and original research, all led by young people
                in Chicago.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-cream py-16 md:py-20">
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
                In early 2024, a group of high-school students on Chicago&rsquo;s
                South Side were looking at 1930s redlining maps in a history
                class. One student overlaid the old map on a current view of the
                neighborhood. The red lines from nearly a century ago matched
                the boundaries they walked past every day.
              </p>
              <p className="font-body text-lg leading-relaxed text-ink/75">
                Vacant lots, closed businesses, crumbling sidewalks &mdash; all
                on one side of a line a federal bureaucrat drew before their
                grandparents were born. They decided to build a walking tour so
                other people could see it too. That became Rooted Forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="border-t border-border bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-3">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                How We Work
              </p>
            </div>
            <div className="md:col-span-9">
              <h2 className="font-display text-3xl text-forest md:text-4xl">
                Youth-Led
              </h2>
              <div className="mt-8 max-w-3xl space-y-6">
                <p className="font-body text-lg leading-relaxed text-ink/75">
                  Rooted Forward is run by young people between the ages of 16
                  and 24. We design tour routes, do the research, write podcast
                  scripts, and conduct interviews. Adult advisors &mdash;
                  historians, urban planners, educators &mdash; provide
                  mentorship but don&rsquo;t make decisions for us.
                </p>
                <p className="font-body text-lg leading-relaxed text-ink/75">
                  Leadership rotates annually. Every tour, podcast episode, and
                  public statement is written and approved by youth members.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STUDENT BOARD
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Leadership
          </p>
          <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
            Student Board
          </h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-ink/70">
            The students who lead Rooted Forward&rsquo;s day-to-day work.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STUDENT_BOARD.map((member, i) => (
              <BoardCard key={`student-${i}`} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ADVISORY BOARD
          ============================================================ */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Advisory Board
          </h2>
          <p className="mt-4 max-w-2xl font-body text-lg leading-relaxed text-ink/70">
            Mentors and professionals who support our work.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ADVISORY_BOARD.map((member, i) => (
              <BoardCard key={`advisor-${i}`} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Join Us
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We&rsquo;re always looking for young researchers, storytellers,
            and tour guides. If this work matters to you, get involved.
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
