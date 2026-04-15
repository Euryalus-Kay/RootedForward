import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";

/* ------------------------------------------------------------------ */
/*  Board member data                                                  */
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
/*  Board card                                                         */
/* ------------------------------------------------------------------ */

function BoardCard({ member }: { member: BoardMember }) {
  return (
    <div className="flex flex-col items-start border-t border-border pt-6">
      <p className="font-display text-lg text-forest">{member.name}</p>
      <p className="mt-0.5 font-body text-sm text-rust">{member.role}</p>
      <p className="mt-3 font-body text-sm leading-relaxed text-ink/65">
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
      {/* Header */}
      <section className="bg-cream pb-8 pt-28 md:pt-36">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            About
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-forest md:text-6xl">
            About Rooted Forward
          </h1>
          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* Mission */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-4xl px-6">
          <p className="max-w-[60ch] font-body text-xl leading-relaxed text-ink/80 md:text-2xl md:leading-relaxed">
            Rooted Forward documents how policy decisions shaped the
            neighborhoods we live in. Redlining. Urban renewal. Highway
            construction. Gentrification. We trace those decisions through
            walking tours, podcasts, and original research, all led by young
            people in Chicago.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-14 border-border" />
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            It Started With a Map
          </h2>
          <div className="mt-8 max-w-[60ch] space-y-5">
            <p className="font-body text-base leading-relaxed text-ink/75">
              In early 2024, a group of high school students on Chicago&rsquo;s
              South Side were looking at 1930s redlining maps in a history
              class. One student overlaid the old map on a current view of the
              neighborhood. The red lines from nearly a century ago matched
              the boundaries they walked past every day.
            </p>
            <p className="font-body text-base leading-relaxed text-ink/75">
              Vacant lots, closed businesses, crumbling sidewalks. All on one
              side of a line a federal bureaucrat drew before their
              grandparents were born. They decided to build a walking tour so
              other people could see it too. That became Rooted Forward.
            </p>
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-14 border-border" />
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Youth-Led
          </h2>
          <div className="mt-8 max-w-[60ch] space-y-5">
            <p className="font-body text-base leading-relaxed text-ink/75">
              Rooted Forward is run by young people between the ages of 16 and
              24. We design tour routes, do the research, write podcast
              scripts, and conduct interviews. Adult advisors provide
              mentorship. They do not make decisions for us.
            </p>
            <p className="font-body text-base leading-relaxed text-ink/75">
              Leadership rotates annually. Every tour, podcast episode, and
              public statement is written and approved by youth members.
            </p>
          </div>
        </div>
      </section>

      {/* Student Board */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-14 border-border" />
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Leadership
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Student Board
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STUDENT_BOARD.map((member, i) => (
              <BoardCard key={`student-${i}`} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Advisory Board
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ADVISORY_BOARD.map((member, i) => (
              <BoardCard key={`advisor-${i}`} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Join Us
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            We are always looking for young researchers, storytellers, and
            tour guides. If this work matters to you, get involved.
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
