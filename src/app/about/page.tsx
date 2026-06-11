"use client";

/* ------------------------------------------------------------------ */
/*  About page                                                         */
/*                                                                     */
/*  Two tabs driven by ?tab= (organization | people), linked from the  */
/*  navbar. Organization reads as an editorial dossier: mission set    */
/*  large, the founding story, the three pillars as indexed ledger     */
/*  rows, and a dark get-involved band. People renders the student     */
/*  and advisory boards as archival cards from Supabase with the       */
/*  placeholder constants as fallback.                                 */
/* ------------------------------------------------------------------ */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import {
  PLACEHOLDER_STUDENT_BOARD,
  PLACEHOLDER_ADVISORY_BOARD,
} from "@/lib/about-constants";
import type { BoardMember } from "@/lib/about-constants";

/* ------------------------------------------------------------------ */
/*  Tab navigation                                                     */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "organization", label: "The Organization", href: "/about?tab=organization" },
  { key: "people", label: "People", href: "/about?tab=people" },
] as const;

function TabNav({ active }: { active: string }) {
  return (
    <nav aria-label="About sections" className="border-b border-border bg-cream">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 lg:px-8 md:gap-12">
        {TABS.map((t, i) => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-baseline gap-2.5 py-4 font-body text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                isActive ? "text-rust" : "text-warm-gray hover:text-ink"
              }`}
            >
              <span className="index-numeral text-[0.7rem]">{`0${i + 1}`}</span>
              <span>{t.label}</span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-rust"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared editorial row: mono label left, content right               */
/* ------------------------------------------------------------------ */

function EditorialRow({
  label,
  children,
  bordered = false,
}: {
  label: string;
  children: React.ReactNode;
  bordered?: boolean;
}) {
  return (
    <section className={`py-16 md:py-24 ${bordered ? "border-t border-border" : ""}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-8 md:grid-cols-12 md:gap-x-12">
          <div className="md:col-span-3">
            <Reveal y={14}>
              <p className="eyebrow text-warm-gray">{label}</p>
              <div className="mt-5 h-px w-14 bg-rust/60" aria-hidden="true" />
            </Reveal>
          </div>
          <div className="md:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content: Organization                                          */
/* ------------------------------------------------------------------ */

const PILLARS = [
  {
    index: "01",
    title: "Education",
    desc: "We build neighborhood walking tours that explain how specific blocks got the way they are, produce documentary shorts that follow the people living with those decisions today, and run a podcast that brings community voices into the conversation. Teachers across Chicago use our materials as curriculum.",
    items: "Walking tours · Documentary films · Podcast · School curriculum",
    href: "/tours",
    cta: "View our tours",
  },
  {
    index: "02",
    title: "Policy",
    desc: "Once people understand how the patterns formed, the question becomes what to do about the parts that are still active. We organize that response through specific campaigns: collective public comment drives, sign-on letters, and policy proposals developed with legislative sponsors. Currently focused on Chicago.",
    items: "Active campaigns · Public comment drives · Policy briefs · Community proposals",
    href: "/policy",
    cta: "See active campaigns",
  },
  {
    index: "03",
    title: "Research",
    desc: "Our research team digs through archives (HOLC maps, city planning records, oral history collections), conducts interviews with longtime residents, and works with data on housing, schools, and zoning to surface the patterns we then translate into public-facing work.",
    items: "Policy briefs · Primary source archives · Oral histories · Data analysis",
    href: "/research",
    cta: "Read the research",
  },
];

const INVOLVEMENT = [
  {
    title: "Join a Chapter",
    desc: "Open positions in Chicago, New York, Dallas, and San Francisco.",
    href: "/get-involved",
    cta: "See openings",
  },
  {
    title: "Start a Chapter",
    desc: "We help students launch chapters in new cities.",
    href: "/contact",
    cta: "Contact us",
  },
  {
    title: "Partner With Us",
    desc: "For schools, nonprofits, and community organizations.",
    href: "/contact",
    cta: "Get in touch",
  },
];

function OrganizationTab() {
  return (
    <>
      {/* Mission, set large */}
      <EditorialRow label="Our Mission">
        <Reveal mask>
          <p className="max-w-3xl font-display text-2xl leading-snug text-forest md:text-4xl md:leading-[1.18]">
            Rooted Forward is a youth-led nonprofit in Chicago tracing what
            redlining, urban renewal, and highway construction did to the
            neighborhoods people live in today.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-ink/70 md:text-lg">
            We organize the response through education, policy, and research.
            Everything is led by students.
          </p>
        </Reveal>
      </EditorialRow>

      {/* Founding story */}
      <EditorialRow label="Our Story" bordered>
        <Reveal>
          <p className="max-w-[62ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
            In spring 2024, a group of high school students on the South Side
            of Chicago were looking at redlining maps in a history class. One
            student overlaid the old map on a current view of the neighborhood.
            The red lines matched the boundaries they walked past every day.
            That observation became the first walking tour. The first tour
            became Rooted Forward.
          </p>
        </Reveal>
      </EditorialRow>

      {/* Three pillars as indexed ledger rows */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading eyebrow="Programs" title="What We Do" tone="light" />

          <div className="mt-12 md:mt-16">
            {PILLARS.map((p) => (
              <Reveal key={p.title}>
                <div className="relative border-t border-border py-10 md:py-14">
                  <span
                    aria-hidden="true"
                    className="index-numeral pointer-events-none absolute right-0 top-8 select-none text-7xl leading-none text-ink/[0.05] md:text-[9rem]"
                  >
                    {p.index}
                  </span>
                  <div className="relative grid grid-cols-1 gap-y-5 md:grid-cols-12 md:gap-x-12">
                    <div className="md:col-span-4">
                      <div className="flex items-baseline gap-4">
                        <span className="index-numeral text-sm text-rust">
                          {p.index}
                        </span>
                        <h3 className="font-display text-2xl text-forest md:text-3xl">
                          {p.title}
                        </h3>
                      </div>
                    </div>
                    <div className="max-w-2xl md:col-span-8">
                      <p className="font-body text-base leading-relaxed text-ink/75">
                        {p.desc}
                      </p>
                      <p className="ledger mt-5 text-warm-gray">{p.items}</p>
                      <Link
                        href={p.href}
                        className="mt-6 inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                      >
                        <span>{p.cta}</span>
                        <span aria-hidden="true" className="arrow-nudge">
                          &rarr;
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Get involved band */}
      <section className="grain relative overflow-hidden bg-forest py-16 md:py-24">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading eyebrow="Next Steps" title="Get Involved" tone="dark" />
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {INVOLVEMENT.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="h-full border-t border-cream/15 pt-6">
                  <span className="ledger text-cream/40">{`0${i + 1}`}</span>
                  <h3 className="mt-3 font-display text-xl text-cream">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                    {item.desc}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex items-center gap-2 font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream"
                  >
                    <span>{item.cta}</span>
                    <span aria-hidden="true" className="arrow-nudge">
                      &rarr;
                    </span>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content: People                                                */
/* ------------------------------------------------------------------ */

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-cream-dark">
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <span className="relative font-display text-4xl text-warm-gray-light">
        {initials}
      </span>
    </div>
  );
}

function BoardCard({ member, index }: { member: BoardMember; index: number }) {
  return (
    <article className="group card-lift flex h-full flex-col border border-border bg-white/40 p-5">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream-dark">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.full_name}
            className="photo-archival h-full w-full object-cover"
          />
        ) : (
          <InitialsAvatar name={member.full_name} />
        )}
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <span className="ledger text-warm-gray">
          {String(index + 1).padStart(2, "0")}
        </span>
        {member.city && <span className="ledger text-warm-gray">{member.city}</span>}
      </div>
      <h3 className="mt-3 font-display text-xl text-forest">{member.full_name}</h3>
      <p className="eyebrow mt-1.5 text-rust">{member.role}</p>
      {member.affiliation && (
        <p className="mt-1.5 font-body text-xs italic text-warm-gray">
          {member.affiliation}
        </p>
      )}
      <p className="mt-3 font-body text-sm leading-relaxed text-ink/65">
        {member.bio}
      </p>
    </article>
  );
}

function PeopleTab({
  studentBoard,
  advisoryBoard,
}: {
  studentBoard: BoardMember[];
  advisoryBoard: BoardMember[];
}) {
  return (
    <>
      {/* How we are structured */}
      <EditorialRow label="How We Are Structured">
        <Reveal mask>
          <p className="max-w-3xl font-display text-2xl leading-snug text-forest md:text-4xl md:leading-[1.18]">
            The decisions stay with the students.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-ink/70 md:text-lg">
            A national Student Board sets direction across all chapters. City
            chapters run programming locally. An Advisory Board of educators,
            organizers, researchers, and policy professionals supports the
            work without governing it.
          </p>
        </Reveal>
      </EditorialRow>

      {/* Student Board */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            index="01"
            title="Student Board"
            lede="Sets organizational direction, manages chapters, and leads each pillar of the work."
            tone="light"
          />
          <RevealGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {studentBoard.map((m, i) => (
              <BoardCard key={m.id} member={m} index={i} />
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Advisory Board */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            index="02"
            title="Advisory Board"
            lede="Educators, organizers, researchers, and policy professionals who advise our work."
            tone="light"
          />
          <RevealGroup className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {advisoryBoard.map((m, i) => (
              <BoardCard key={m.id} member={m} index={i} />
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Closer */}
      <section className="border-t border-border py-14 md:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center lg:px-8">
          <Reveal>
            <p className="max-w-xl font-display text-2xl text-forest md:text-3xl">
              Open positions in Chicago, New York, Dallas, and San Francisco.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Magnetic>
              <Link
                href="/get-involved"
                className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                See openings
              </Link>
            </Magnetic>
          </Reveal>
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
  const isPeople = tab === "people";

  const [studentBoard, setStudentBoard] = useState<BoardMember[]>(PLACEHOLDER_STUDENT_BOARD);
  const [advisoryBoard, setAdvisoryBoard] = useState<BoardMember[]>(PLACEHOLDER_ADVISORY_BOARD);

  useEffect(() => {
    async function fetchBoards() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient() as unknown as import("@supabase/supabase-js").SupabaseClient;
        const [s, a] = await Promise.all([
          supabase.from("board_members").select("*").eq("board_type", "student").eq("is_active", true).order("display_order"),
          supabase.from("board_members").select("*").eq("board_type", "advisory").eq("is_active", true).order("display_order"),
        ]);
        if (s.data && s.data.length > 0) setStudentBoard(s.data as unknown as BoardMember[]);
        if (a.data && a.data.length > 0) setAdvisoryBoard(a.data as unknown as BoardMember[]);
      } catch { /* use placeholders */ }
    }
    fetchBoards();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <PageBanner
        key={tab}
        eyebrow={isPeople ? "About / People" : "About / The Organization"}
        title={isPeople ? "People" : "The Organization"}
        dek={
          isPeople
            ? "The Student Board sets direction. The Advisory Board supports the work without governing it."
            : "The mission, the founding story, and the three pillars of the work."
        }
        meta={
          isPeople
            ? [
                `${studentBoard.length} student board members`,
                `${advisoryBoard.length} advisors`,
              ]
            : ["Chicago, Illinois", "Student led", "Education / Policy / Research"]
        }
      />

      <TabNav active={tab} />

      {isPeople ? (
        <PeopleTab studentBoard={studentBoard} advisoryBoard={advisoryBoard} />
      ) : (
        <OrganizationTab />
      )}
    </div>
  );
}
