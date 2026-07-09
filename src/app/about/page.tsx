"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { BoardMember } from "@/lib/about-constants";

/* ------------------------------------------------------------------ */
/*  /about                                                             */
/*                                                                     */
/*  One scrolling page. Mission, story, founder, the two programs,    */
/*  then the People section (#people) with the Student Board and      */
/*  Advisory Board. Boards read from the board_members table and      */
/*  render only real rows; while a board is empty the section shows   */
/*  an honest placeholder line instead of fake name cards. Members    */
/*  are managed at /admin/about/board.                                 */
/* ------------------------------------------------------------------ */

/* Development seed rows ("Member Name", "Advisor Name", test entries)
   still exist in the live table. Filter them out so they can never
   render as if they were real people. */
function isRealMember(m: BoardMember): boolean {
  const name = m.full_name.trim().toLowerCase();
  if (!name) return false;
  if (name.includes("member name") || name.includes("advisor name")) return false;
  if (/^tes+t?$/.test(name) || name === "test" || name === "placeholder") return false;
  return true;
}

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

/* Founder photo. Drop a square image at public/founder.jpg and it     */
/* appears automatically; until then the initials mark holds the spot. */
/* onError misses failures that happen before hydration, so the effect */
/* also checks the img's loaded state after mount.                     */
function FounderPhoto() {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return <InitialsAvatar name="Zain Zaidi" />;
  }
  return (
    <img
      ref={imgRef}
      src="/founder.jpg"
      alt="Zain Zaidi, founder of Rooted Forward"
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function AboutPage() {
  const [studentBoard, setStudentBoard] = useState<BoardMember[]>([]);
  const [advisoryBoard, setAdvisoryBoard] = useState<BoardMember[]>([]);

  useEffect(() => {
    async function fetchBoards() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const [s, a] = await Promise.all([
          (supabase as any).from("board_members").select("*").eq("board_type", "student").eq("is_active", true).order("display_order"),
          (supabase as any).from("board_members").select("*").eq("board_type", "advisory").eq("is_active", true).order("display_order"),
        ]);
        if (s.data) setStudentBoard((s.data as BoardMember[]).filter(isRealMember));
        if (a.data) setAdvisoryBoard((a.data as BoardMember[]).filter(isRealMember));
      } catch {
        /* boards stay empty; the sections show their placeholder lines */
      }
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
            About
          </h1>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Our Mission
          </h2>
          <p className="mt-6 max-w-[60ch] font-body text-lg leading-relaxed text-ink/75 md:text-xl">
            Rooted Forward is a youth-led nonprofit in Chicago. We trace what
            redlining, urban renewal, and highway construction did to the
            neighborhoods people live in today, and we organize the response
            through education and policy work. The work is led by students.
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
              Rooted Forward grew out of Hyde Park. Our walking tour runs
              there, and our exhibit is set there. Over the last century,
              deed restrictions, appraisal maps, and urban renewal plans
              decided who could live in the neighborhood, and those decisions
              are still visible in the streets today. The same is true across
              Chicago.
            </p>
            <p className="font-body text-base leading-relaxed text-ink/75">
              We think the clearest way to understand that history is to
              stand where it happened and read the documents that made it.
              So that is what we build. A walking tour through Hyde Park, an
              online exhibit assembled from the original paperwork, a podcast
              about the city&rsquo;s neighborhoods, and policy campaigns that
              push for protections the city has not yet adopted.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
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
                We lead a walking tour through Hyde Park that connects
                specific blocks to the policies that shaped them. We also
                publish The Ground Keeps Moving, an online exhibit built from
                deeds, appraisal forms, and federal maps, and we make a
                podcast about Chicago&rsquo;s neighborhoods.
              </p>
              <p className="mt-3 font-body text-xs text-warm-gray">
                Walking tour · Online exhibit · Podcast
              </p>
              <Link href="/tours" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-light">
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
                organize that response through public comment drives, sign-on
                campaigns, and policy proposals, all focused on Chicago.
              </p>
              <p className="mt-3 font-body text-xs text-warm-gray">
                Active campaigns · Public comment drives · How-to guides · Community proposals
              </p>
              <Link href="/policy" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-light">
                See active campaigns &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* People */}
      <section id="people" className="scroll-mt-20 border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            People
          </h2>
          <p className="mt-3 max-w-[60ch] font-body text-base text-ink/60">
            {studentBoard.length === 0 && advisoryBoard.length === 0
              ? "Rooted Forward is run by students. We are building out two boards, a Student Board that will lead each program and an Advisory Board of educators, researchers, and policy professionals who will support the work without governing it. The decisions stay with the students."
              : "Rooted Forward is run by students. A Student Board leads each program, and an Advisory Board of educators, researchers, and policy professionals supports the work without governing it. The decisions stay with the students."}
          </p>

          {/* Founder */}
          <div className="mt-12 grid grid-cols-1 gap-8 rounded-sm border border-border bg-cream-dark/40 p-8 sm:grid-cols-[180px_1fr] md:p-10">
            <div className="aspect-square w-full max-w-[180px] overflow-hidden rounded-sm bg-cream-dark">
              <FounderPhoto />
            </div>
            <div>
              <h3 className="font-display text-2xl text-forest">Zain Zaidi</h3>
              <p className="mt-0.5 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                Founder · Chicago
              </p>
              <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/75">
                Zain founded Rooted Forward and leads its work across the
                education and policy programs, from the Hyde Park walking
                tour to the campaigns on the policy page.
              </p>
            </div>
          </div>

          {/* Student Board */}
          <div className="mt-16">
            <h3 className="font-display text-2xl text-forest">Student Board</h3>
            <p className="mt-2 font-body text-sm text-ink/60">
              Sets direction and leads each part of the work.
            </p>
            {studentBoard.length > 0 ? (
              <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {studentBoard.map((m) => <BoardCard key={m.id} member={m} />)}
              </div>
            ) : (
              <p className="mt-6 max-w-[60ch] rounded-sm border border-border bg-cream-dark/40 p-6 font-body text-sm leading-relaxed text-ink/60">
                Student board members will be listed here. If you want to be
                one of them, the{" "}
                <Link href="/get-involved" className="text-rust underline underline-offset-2">
                  get involved page
                </Link>{" "}
                is the place to start.
              </p>
            )}
          </div>

          {/* Advisory Board */}
          <div className="mt-16">
            <h3 className="font-display text-2xl text-forest">Advisory Board</h3>
            <p className="mt-2 font-body text-sm text-ink/60">
              Educators, researchers, and policy professionals who advise the
              work.
            </p>
            {advisoryBoard.length > 0 ? (
              <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {advisoryBoard.map((m) => <BoardCard key={m.id} member={m} />)}
              </div>
            ) : (
              <p className="mt-6 max-w-[60ch] rounded-sm border border-border bg-cream-dark/40 p-6 font-body text-sm leading-relaxed text-ink/60">
                Advisory board members will be listed here as they join.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Get Involved */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h3 className="font-display text-xl text-cream">Join the Team</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                We are based in Chicago and open to students across the city.
              </p>
              <Link href="/get-involved" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream">
                Get involved &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-cream">Start a Chapter</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                Outside Chicago? We help students bring the model to their
                own city.
              </p>
              <Link href="/get-involved" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream">
                Tell us where &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-cream">Partner With Us</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                For schools, nonprofits, and community organizations.
              </p>
              <Link href="/contact" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream">
                Get in touch &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
