"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PLACEHOLDER_STUDENT_BOARD,
  PLACEHOLDER_ADVISORY_BOARD,
} from "@/lib/about-constants";
import type { BoardMember } from "@/lib/about-constants";

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
/*  Tab content: Organization                                          */
/* ------------------------------------------------------------------ */

function OrganizationTab() {
  return (
    <>
      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Our Mission
          </h2>
          <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl">
            Rooted Forward is a youth-led nonprofit in Chicago tracing what
            redlining, urban renewal, and highway construction did to the
            neighborhoods people live in today. We organize the response
            through education, policy, and research. Everything is led by
            students.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Our Story
          </h2>
          <div className="mt-8 max-w-[60ch] space-y-5">
            <p className="font-body text-base leading-relaxed text-ink/75">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. In
              spring 2024, a group of high school students on the South Side
              of Chicago were looking at redlining maps in a history class.
              One student overlaid the old map on a current view of the
              neighborhood. The red lines matched the boundaries they walked
              past every day. That observation became the first walking tour.
              The first tour became Rooted Forward.
            </p>
            <p className="font-body text-base leading-relaxed text-ink/75">
              Placeholder text for the rest of the story. Describe how the
              organization grew from one classroom to multiple chapters, the
              decision to add policy work, the launch of the podcast, and how
              research became the foundation holding everything together. This
              section will be filled in with your real story.
            </p>
            <p className="font-body text-base leading-relaxed text-ink/75">
              Placeholder text for the current state. Where the organization
              is now, what chapters are active, what the near-term goals are.
              Keep it concrete and specific to Chicago. Mention the team size,
              the number of tours completed, and what campaigns are underway.
            </p>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            What We Do
          </h2>

          {/* Education */}
          <div className="mt-14 flex gap-6 md:gap-10">
            <span className="flex-shrink-0 font-display text-6xl leading-none text-border md:text-8xl">
              01
            </span>
            <div className="flex-1">
              <h3 className="font-display text-2xl text-forest">Education</h3>
              <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/75">
                We build neighborhood walking tours that explain how specific
                blocks got the way they are, produce documentary shorts that
                follow the people living with those decisions today, and run a
                podcast that brings community voices into the conversation.
                Teachers across Chicago use our materials as curriculum.
              </p>
              <p className="mt-3 font-body text-xs text-warm-gray">
                Walking tours · Documentary films · Podcast · School curriculum
              </p>
              <Link href="/tours" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
                View our tours &rarr;
              </Link>
            </div>
          </div>

          {/* Policy */}
          <div className="mt-14 flex gap-6 md:gap-10">
            <span className="flex-shrink-0 font-display text-6xl leading-none text-border md:text-8xl">
              02
            </span>
            <div className="flex-1">
              <h3 className="font-display text-2xl text-forest">Policy</h3>
              <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/75">
                Once people understand how the patterns formed, the question
                becomes what to do about the parts that are still active. We
                organize that response through specific campaigns: collective
                public comment drives, sign-on letters, and policy proposals
                developed with legislative sponsors. Currently focused on
                Chicago.
              </p>
              <p className="mt-3 font-body text-xs text-warm-gray">
                Active campaigns · Public comment drives · Policy briefs · Community proposals
              </p>
              <Link href="/policy" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
                See active campaigns &rarr;
              </Link>
            </div>
          </div>

          {/* Research */}
          <div className="mt-14 flex gap-6 md:gap-10">
            <span className="flex-shrink-0 font-display text-6xl leading-none text-border md:text-8xl">
              03
            </span>
            <div className="flex-1">
              <h3 className="font-display text-2xl text-forest">Research</h3>
              <p className="mt-4 max-w-[55ch] font-body text-base leading-relaxed text-ink/75">
                Our research team digs through archives (HOLC maps, city
                planning records, oral history collections), conducts
                interviews with longtime residents, and works with data on
                housing, schools, and zoning to surface the patterns we then
                translate into public-facing work.
              </p>
              <p className="mt-3 font-body text-xs text-warm-gray">
                Policy briefs · Primary source archives · Oral histories · Data analysis
              </p>
              <Link href="/policy" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust">
                Read our briefs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Get Involved */}
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content: People                                                */
/* ------------------------------------------------------------------ */

function PeopleTab({
  studentBoard,
  advisoryBoard,
}: {
  studentBoard: BoardMember[];
  advisoryBoard: BoardMember[];
}) {
  return (
    <>
      {/* How we're structured */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl">
            A national Student Board sets direction across all chapters. City
            chapters run programming locally. An Advisory Board of educators,
            organizers, researchers, and policy professionals supports the work
            without governing it. The decisions stay with the students.
          </p>
        </div>
      </section>

      {/* Student Board */}
      <section className="border-t border-border py-16 md:py-24">
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

      {/* Advisory Board */}
      <section className="border-t border-border py-16 md:py-24">
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "people" ? "people" : "organization";

  const [studentBoard, setStudentBoard] = useState<BoardMember[]>(PLACEHOLDER_STUDENT_BOARD);
  const [advisoryBoard, setAdvisoryBoard] = useState<BoardMember[]>(PLACEHOLDER_ADVISORY_BOARD);

  useEffect(() => {
    async function fetchBoards() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const [s, a] = await Promise.all([
          (supabase as any).from("board_members").select("*").eq("board_type", "student").eq("is_active", true).order("display_order"),
          (supabase as any).from("board_members").select("*").eq("board_type", "advisory").eq("is_active", true).order("display_order"),
        ]);
        if (s.data && s.data.length > 0) setStudentBoard(s.data as unknown as BoardMember[]);
        if (a.data && a.data.length > 0) setAdvisoryBoard(a.data as unknown as BoardMember[]);
      } catch { /* use placeholders */ }
    }
    fetchBoards();
  }, []);

  return (
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
            {tab === "organization" ? "The Organization" : "People"}
          </h1>
        </div>
      </section>

      {/* Content */}
      <div className="bg-cream">
        {tab === "organization" ? (
          <OrganizationTab />
        ) : (
          <PeopleTab studentBoard={studentBoard} advisoryBoard={advisoryBoard} />
        )}
      </div>
    </div>
  );
}
