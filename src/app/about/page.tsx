import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import {
  PLACEHOLDER_STUDENT_BOARD,
  PLACEHOLDER_ADVISORY_BOARD,
} from "@/lib/about-constants";
import type { BoardMember } from "@/lib/about-constants";

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getBoardMembers(
  boardType: "student" | "advisory"
): Promise<BoardMember[]> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("board_members")
      .select("*")
      .eq("board_type", boardType)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (!error && data && data.length > 0) {
      return data as unknown as BoardMember[];
    }
  } catch {
    // fallback
  }
  return boardType === "student"
    ? PLACEHOLDER_STUDENT_BOARD
    : PLACEHOLDER_ADVISORY_BOARD;
}

/* ------------------------------------------------------------------ */
/*  Initials placeholder for missing photos                            */
/* ------------------------------------------------------------------ */

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-full w-full items-center justify-center bg-cream-dark">
      <span className="font-display text-3xl text-warm-gray-light">
        {initials}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Board card                                                         */
/* ------------------------------------------------------------------ */

function BoardCard({ member }: { member: BoardMember }) {
  return (
    <div>
      {/* Photo */}
      <div className="aspect-square w-full overflow-hidden rounded-sm bg-cream-dark">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.full_name}
            className="h-full w-full object-cover"
          />
        ) : (
          <InitialsAvatar name={member.full_name} />
        )}
      </div>
      {/* Info */}
      <h3 className="mt-4 font-display text-lg text-forest">
        {member.full_name}
      </h3>
      <p className="mt-0.5 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
        {member.role}
        {member.city && ` · ${member.city}`}
      </p>
      {member.affiliation && (
        <p className="mt-0.5 font-body text-xs italic text-warm-gray">
          {member.affiliation}
        </p>
      )}
      <p className="mt-3 font-body text-sm leading-relaxed text-ink/65">
        {member.bio}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function AboutPage() {
  const [studentBoard, advisoryBoard] = await Promise.all([
    getBoardMembers("student"),
    getBoardMembers("advisory"),
  ]);

  return (
    <PageTransition>
      {/* ============================================================
          SECTION 1: HEADER
          ============================================================ */}
      <section className="bg-cream pb-8 pt-28 md:pt-36">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            About
          </p>
          <h1 className="mt-4 font-display text-4xl text-forest md:text-6xl">
            Rooted Forward
          </h1>
          <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/70">
            A youth-led nonprofit using history to change the cities we live in.
          </p>
          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* ============================================================
          SECTION 2: WHAT WE DO
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-4">
              <h2 className="font-display text-3xl text-forest md:text-4xl">
                What We Do
              </h2>
            </div>
            <div className="md:col-span-8">
              <div className="max-w-[65ch] space-y-5">
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Rooted Forward started in Chicago as an attempt to answer a
                  question we kept hearing on neighborhood walks: how did this
                  happen, and is anyone trying to fix it? The history of
                  redlining, urban renewal, and disinvestment is documented in
                  archives most people never see. The patterns those policies
                  created are still shaping where families can live, which
                  schools get funded, and which neighborhoods get developed.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75">
                  We work across three connected pillars: education, policy, and
                  research. The education work brings the history into public
                  view through tours, films, and classroom curriculum. The policy
                  work translates what the history reveals into specific,
                  winnable campaigns. The research work is what holds the other
                  two together: archival digs, oral histories, and data analysis
                  that make sure everything we publish is grounded in evidence.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Everything we produce is led by students. The board, the
                  chapter leads, the researchers, the filmmakers. Adults advise.
                  Students decide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: THREE PILLARS
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-16 border-border" />
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Our Work
          </h2>

          {/* Pillar 1: Education */}
          <div className="mt-16 flex gap-6 md:gap-10">
            <span className="flex-shrink-0 font-display text-6xl leading-none text-border md:text-8xl">
              01
            </span>
            <div className="flex-1">
              <h3 className="font-display text-2xl text-forest">Education</h3>
              <div className="mt-4 max-w-[60ch] space-y-4">
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Most people in Chicago have walked past the physical evidence
                  of redlining without knowing what they were looking at. Our
                  education work makes that evidence visible. We build
                  neighborhood walking tours that explain how specific blocks
                  got the way they are, produce documentary shorts that follow
                  the people living with those decisions today, and run a
                  podcast that brings community voices into the conversation.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75">
                  The curriculum side puts these materials in classrooms.
                  Teachers across Chicago use our tours and films as teaching
                  tools, and we run live virtual sessions with students who
                  want to ask questions directly.
                </p>
              </div>
              <p className="mt-4 font-body text-xs text-warm-gray">
                Walking tours · Virtual tours · Documentary films · Podcast ·
                School curriculum
              </p>
              <Link
                href="/tours"
                className="mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
              >
                View our tours &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 2: Policy */}
          <div className="mt-16 flex gap-6 md:gap-10">
            <span className="flex-shrink-0 font-display text-6xl leading-none text-border md:text-8xl">
              02
            </span>
            <div className="flex-1">
              <h3 className="font-display text-2xl text-forest">Policy</h3>
              <div className="mt-4 max-w-[60ch] space-y-4">
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Awareness is the entry point, not the destination. Once people
                  understand how the patterns formed, the question becomes what
                  to do about the parts that are still active. We organize that
                  response through specific campaigns: collective public comment
                  drives, sign-on letters, and policy proposals developed with
                  legislative sponsors.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75">
                  All of this is currently focused on Chicago, where we have the
                  deepest research base and the strongest network of partners.
                </p>
              </div>
              <p className="mt-4 font-body text-xs text-warm-gray">
                Active campaigns · Public comment drives · Policy briefs ·
                Community proposals
              </p>
              <Link
                href="/policy"
                className="mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
              >
                See active campaigns &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 3: Research */}
          <div className="mt-16 flex gap-6 md:gap-10">
            <span className="flex-shrink-0 font-display text-6xl leading-none text-border md:text-8xl">
              03
            </span>
            <div className="flex-1">
              <h3 className="font-display text-2xl text-forest">Research</h3>
              <div className="mt-4 max-w-[60ch] space-y-4">
                <p className="font-body text-base leading-relaxed text-ink/75">
                  The tours and the campaigns only work if the underlying
                  research is solid. Our research team digs through archives
                  (HOLC maps, city planning records, oral history collections),
                  conducts interviews with longtime residents, and works with
                  data on housing, schools, and zoning to surface the patterns
                  we then translate into public-facing work.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Research output gets published as briefs, primary source
                  collections, and the evidence base behind every campaign we
                  run.
                </p>
              </div>
              <p className="mt-4 font-body text-xs text-warm-gray">
                Policy briefs · Primary source archives · Oral histories · Data
                analysis
              </p>
              <Link
                href="/policy"
                className="mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
              >
                Read our briefs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: HOW WE'RE STRUCTURED
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-16 border-border" />
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            How We&rsquo;re Structured
          </h2>
          <div className="mt-8 max-w-[65ch] space-y-5">
            <p className="font-body text-base leading-relaxed text-ink/75">
              Rooted Forward operates through a national Student Board that sets
              direction across all chapters, and a network of city chapters that
              run programming locally. An Advisory Board of educators,
              organizers, researchers, and policy professionals supports the
              work without governing it. They open doors, sharpen our research,
              and push back on our drafts. The decisions stay with the students.
            </p>
            <p className="font-body text-base leading-relaxed text-ink/75">
              If you want to join a chapter, start one in your city, or get
              involved in a specific campaign, the contact information is at the
              bottom of this page.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: STUDENT BOARD
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-16 border-border" />
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Student Board
          </h2>
          <p className="mt-3 font-body text-base text-ink/60">
            The Student Board sets organizational direction, manages chapters,
            and leads each pillar of the work.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {studentBoard.map((member) => (
              <BoardCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: ADVISORY BOARD
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-16 border-border" />
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Advisory Board
          </h2>
          <p className="mt-3 font-body text-base text-ink/60">
            Educators, organizers, researchers, and policy professionals who
            advise our work.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {advisoryBoard.map((member) => (
              <BoardCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7: GET INVOLVED
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-16 border-border" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h3 className="font-display text-xl text-forest">
                Join a Chapter
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                Open positions in Chicago, New York, Dallas, and San Francisco.
              </p>
              <Link
                href="/get-involved"
                className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
              >
                See openings &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-forest">
                Start a Chapter
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                We help students launch chapters in new cities.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
              >
                Contact us &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-forest">
                Partner With Us
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                For schools, nonprofits, and community organizations.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust"
              >
                Get in touch &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
