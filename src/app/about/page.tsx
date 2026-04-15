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
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("board_members")
      .select("*")
      .eq("board_type", boardType)
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    if (!error && data && data.length > 0) return data as unknown as BoardMember[];
  } catch { /* fallback */ }
  return boardType === "student" ? PLACEHOLDER_STUDENT_BOARD : PLACEHOLDER_ADVISORY_BOARD;
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex h-full w-full items-center justify-center bg-cream-dark">
      <span className="font-display text-3xl text-warm-gray-light">{initials}</span>
    </div>
  );
}

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative h-full min-h-[350px] w-full bg-cream-dark md:min-h-0">
      <div className="absolute inset-0 bg-gradient-to-br from-cream-dark to-border" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-body text-xs uppercase tracking-widest text-warm-gray-light">{label}</p>
      </div>
    </div>
  );
}

function BoardCard({ member }: { member: BoardMember }) {
  return (
    <div>
      <div className="aspect-square w-full overflow-hidden rounded-sm bg-cream-dark">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
        ) : (
          <InitialsAvatar name={member.full_name} />
        )}
      </div>
      <h3 className="mt-4 font-display text-lg text-forest">{member.full_name}</h3>
      <p className="mt-0.5 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
        {member.role}{member.city && ` · ${member.city}`}
      </p>
      {member.affiliation && (
        <p className="mt-0.5 font-body text-xs italic text-warm-gray">{member.affiliation}</p>
      )}
      <p className="mt-3 font-body text-sm leading-relaxed text-ink/65">{member.bio}</p>
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
          HERO BANNER — like MSF/Red Cross about pages
          ============================================================ */}
      <section className="relative">
        <div
          className="h-[50vh] min-h-[350px] bg-cover bg-center md:h-[60vh]"
          style={{ backgroundImage: "url('/hero-redlining.jpg')" }}
        >
          <div className="absolute inset-0 bg-forest/70" />
          <div className="relative z-10 flex h-full items-end">
            <div className="mx-auto w-full max-w-6xl px-6 pb-10 md:pb-14">
              <p className="font-body text-sm font-semibold uppercase tracking-[0.25em] text-cream/50">
                About
              </p>
              <h1 className="mt-2 font-display text-4xl text-white md:text-6xl lg:text-7xl">
                Who We Are
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          MISSION — centered statement
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-display text-2xl leading-relaxed text-forest md:text-3xl lg:text-4xl lg:leading-snug">
            A youth-led nonprofit using history to change the cities we live in.
          </p>
          <p className="mx-auto mt-8 max-w-2xl font-body text-base leading-relaxed text-ink/70">
            Rooted Forward started in Chicago as an attempt to answer a question
            we kept hearing on neighborhood walks: how did this happen, and is
            anyone trying to fix it? We work across three pillars: education,
            policy, and research. Everything is led by students.
          </p>
        </div>
      </section>

      {/* ============================================================
          EDUCATION — photo left, text right (like MSF split sections)
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div>
          <PhotoPlaceholder label="Education photo" />
        </div>
        <div className="flex flex-col justify-center bg-cream px-6 py-14 sm:px-10 md:px-14 md:py-20">
          <span className="font-display text-6xl text-border md:text-7xl">01</span>
          <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
            Education
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/70">
            We build neighborhood walking tours that explain how specific blocks
            got the way they are, produce documentary shorts, and run a podcast
            that brings community voices into the conversation. Teachers across
            Chicago use our materials as curriculum.
          </p>
          <p className="mt-4 font-body text-xs text-warm-gray">
            Walking tours · Documentary films · Podcast · School curriculum
          </p>
          <Link href="/tours" className="mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
            View our tours &rarr;
          </Link>
        </div>
      </section>

      {/* ============================================================
          POLICY — text left (dark bg), photo right
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col justify-center bg-forest px-6 py-14 sm:px-10 md:px-14 md:py-20">
          <span className="font-display text-6xl text-cream/15 md:text-7xl">02</span>
          <h2 className="mt-4 font-display text-3xl text-cream md:text-4xl">
            Policy
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-cream/70">
            Once people understand how the patterns formed, the question becomes
            what to do about the parts that are still active. We organize
            campaigns: collective public comment drives, sign-on letters, and
            policy proposals developed with legislative sponsors. Currently
            focused on Chicago.
          </p>
          <p className="mt-4 font-body text-xs text-cream/40">
            Active campaigns · Public comment drives · Policy briefs · Community proposals
          </p>
          <Link href="/policy" className="mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
            See active campaigns &rarr;
          </Link>
        </div>
        <div>
          <PhotoPlaceholder label="Policy photo" />
        </div>
      </section>

      {/* ============================================================
          RESEARCH — photo left, text right
          ============================================================ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div>
          <PhotoPlaceholder label="Research photo" />
        </div>
        <div className="flex flex-col justify-center bg-cream px-6 py-14 sm:px-10 md:px-14 md:py-20">
          <span className="font-display text-6xl text-border md:text-7xl">03</span>
          <h2 className="mt-4 font-display text-3xl text-forest md:text-4xl">
            Research
          </h2>
          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/70">
            Our research team digs through archives (HOLC maps, city planning
            records, oral history collections), conducts interviews with
            longtime residents, and works with data on housing, schools, and
            zoning. Research output is published as briefs and becomes the
            evidence base behind every campaign.
          </p>
          <p className="mt-4 font-body text-xs text-warm-gray">
            Policy briefs · Primary source archives · Oral histories · Data analysis
          </p>
          <Link href="/policy" className="mt-5 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
            Read our briefs &rarr;
          </Link>
        </div>
      </section>

      {/* ============================================================
          STRUCTURE — full width dark section
          ============================================================ */}
      <section className="bg-ink py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl text-cream md:text-4xl">
            How We Work
          </h2>
          <p className="mx-auto mt-6 max-w-2xl font-body text-base leading-relaxed text-cream/65">
            A national Student Board sets direction across all chapters. City
            chapters run programming locally. An Advisory Board of educators,
            organizers, researchers, and policy professionals supports the work
            without governing it. They open doors, sharpen our research, and
            push back on our drafts. The decisions stay with the students.
          </p>
        </div>
      </section>

      {/* ============================================================
          STUDENT BOARD
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Student Board
          </h2>
          <p className="mt-3 font-body text-base text-ink/60">
            Sets organizational direction, manages chapters, and leads each
            pillar of the work.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {studentBoard.map((m) => <BoardCard key={m.id} member={m} />)}
          </div>
        </div>
      </section>

      {/* ============================================================
          ADVISORY BOARD
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Advisory Board
          </h2>
          <p className="mt-3 font-body text-base text-ink/60">
            Educators, organizers, researchers, and policy professionals who
            advise our work.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {advisoryBoard.map((m) => <BoardCard key={m.id} member={m} />)}
          </div>
        </div>
      </section>

      {/* ============================================================
          GET INVOLVED
          ============================================================ */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h3 className="font-display text-xl text-cream">Join a Chapter</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                Open positions in Chicago, New York, Dallas, and San Francisco.
              </p>
              <Link href="/get-involved" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
                See openings &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-cream">Start a Chapter</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                We help students launch chapters in new cities.
              </p>
              <Link href="/contact" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
                Contact us &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-cream">Partner With Us</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                For schools, nonprofits, and community organizations.
              </p>
              <Link href="/contact" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
                Get in touch &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
