"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import SurveyRule from "@/components/ui/SurveyRule";
import type { BoardMember } from "@/lib/about-constants";

/* ------------------------------------------------------------------ */
/*  /about                                                             */
/*                                                                     */
/*  Short and readable. A plain opener, the story with one archival   */
/*  portrait, two program blocks, then People. Right now People is    */
/*  the founder plus one honest line about the boards being formed;   */
/*  when real board_members rows exist they render automatically      */
/*  (managed at /admin/about/board), so nothing here needs a rewrite  */
/*  when advisors join. No fake names, ever.                          */
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

/* People rows run as a single column, photo left, text right. */
function BoardRow({ member }: { member: BoardMember }) {
  return (
    <div className="flex gap-6 py-8 sm:gap-8">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-sm bg-cream-dark sm:h-28 sm:w-28">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
        ) : (
          <InitialsAvatar name={member.full_name} />
        )}
      </div>
      <div className="min-w-0">
        <h4 className="font-display text-xl text-forest">{member.full_name}</h4>
        <p className="mt-0.5 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
          {member.role}
          {member.city && ` · ${member.city}`}
        </p>
        {member.affiliation && (
          <p className="mt-0.5 font-body text-xs italic text-warm-gray">{member.affiliation}</p>
        )}
        <p className="mt-3 max-w-[60ch] font-body text-sm leading-relaxed text-ink/65">
          {member.bio}
        </p>
      </div>
    </div>
  );
}

/* Founder photo. While no photo has shipped, this stays null and the  */
/* initials mark renders with no image request at all (an img pointing */
/* at a missing file would 404 on every visit and flash broken before  */
/* hydration). When the photo lands, drop it at public/founder.jpg and */
/* set this to "/founder.jpg".                                          */
const FOUNDER_PHOTO_SRC: string | null = null;

function FounderPhoto() {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // onError misses failures that happen before hydration, so also
  // check the img's loaded state after mount
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
    }
  }, []);

  if (!FOUNDER_PHOTO_SRC || failed) {
    return <InitialsAvatar name="Zain Zaidi" />;
  }
  return (
    <img
      ref={imgRef}
      src={FOUNDER_PHOTO_SRC}
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
          supabase.from("board_members").select("*").eq("board_type", "student").eq("is_active", true).order("display_order"),
          supabase.from("board_members").select("*").eq("board_type", "advisory").eq("is_active", true).order("display_order"),
        ]);
        if (s.data) setStudentBoard((s.data as BoardMember[]).filter(isRealMember));
        if (a.data) setAdvisoryBoard((a.data as BoardMember[]).filter(isRealMember));
      } catch {
        /* boards stay hidden until real rows exist */
      }
    }
    fetchBoards();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Opener */}
      <section className="border-b border-border bg-cream pb-14 pt-20 md:pb-20 md:pt-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
            About
          </p>
          <h1 className="mt-4 max-w-[18ch] font-display text-4xl leading-[1.08] text-ink md:text-6xl">
            Rooted Forward is run by students.
          </h1>
          <p className="mt-6 max-w-[56ch] font-body text-lg leading-relaxed text-ink/75">
            We dig up the paperwork that decided who could live where in
            Chicago, and we turn it into things people actually use. A
            walking tour. An online exhibit. A podcast. Policy work.
          </p>
          <SurveyRule className="mt-10 text-rust" />
        </div>
      </section>

      {/* The story */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-7">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                The story
              </p>
              <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
                It started in Hyde Park
              </h2>
              <div className="mt-7 max-w-[58ch] space-y-5">
                <p className="font-body text-base leading-relaxed text-ink/75">
                  Hyde Park looks like a quiet college neighborhood. Then you
                  read the deeds. For a century, restrictive covenants,
                  appraisal maps, and urban renewal plans decided who could
                  live on which block, and you can still see those decisions
                  in the streets today.
                </p>
                <p className="font-body text-base leading-relaxed text-ink/75">
                  We believe the best place to learn that history is standing
                  where it happened, holding a copy of the document that did
                  it. That is the whole idea. Everything we make starts with
                  the original paperwork.
                </p>
              </div>
            </div>
            <div className="md:col-span-5">
              <img
                src="/media/site/fannie-barrier-williams-1880.jpg"
                alt="Studio portrait of Fannie Barrier Williams from around 1880"
                loading="lazy"
                className="w-full max-w-sm rounded-sm border border-border object-cover"
              />
              <p className="mt-2 max-w-sm font-body text-[11px] leading-snug text-ink/60">
                Fannie Barrier Williams, circa 1880. When the Hyde Park
                Improvement Protective Club set out in 1908 to buy out the
                neighborhood&rsquo;s Black households, she refused to leave.
                Her story is told in our exhibit. Public domain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            What we do
          </p>
          <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
            <div className="border-t-2 border-border pt-6">
              <h3 className="font-display text-2xl text-ink">Teach the history</h3>
              <p className="mt-3 max-w-[50ch] font-body text-base leading-relaxed text-ink/70">
                A two-hour walking tour of Hyde Park, an online exhibit built
                from the original documents, and a podcast about
                Chicago&rsquo;s neighborhoods.
              </p>
              <Link
                href="/tours"
                className="group mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                Tours &amp; exhibit{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>

            <div className="border-t-2 border-border pt-6">
              <h3 className="font-display text-2xl text-ink">Work on what&rsquo;s next</h3>
              <p className="mt-3 max-w-[50ch] font-body text-base leading-relaxed text-ink/70">
                Guides that teach Chicagoans how to testify and comment at
                City Hall, a channel for community policy ideas, and
                campaigns when there is one worth running.
              </p>
              <Link
                href="/policy"
                className="group mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
              >
                Policy tools{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* People */}
      <section id="people" className="scroll-mt-20 border-t border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            People
          </p>
          <h2 className="mt-3 font-display text-3xl text-forest md:text-4xl">
            Who runs it
          </h2>

          {/* Founder */}
          <div className="mt-10 grid max-w-4xl grid-cols-1 gap-8 rounded-sm border border-border bg-cream-dark/40 p-8 sm:grid-cols-[180px_1fr] md:p-10">
            <div className="aspect-square w-full max-w-[180px] overflow-hidden rounded-sm bg-cream-dark">
              <FounderPhoto />
            </div>
            <div>
              <h3 className="font-display text-2xl text-forest">Zain Zaidi</h3>
              <p className="mt-0.5 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                Founder · Chicago
              </p>
              <p className="mt-4 max-w-[60ch] font-body text-base leading-relaxed text-ink/75">
                Zain founded Rooted Forward and runs it day to day, from the
                Hyde Park walking tour to the policy work. If you email the
                organization, he is probably the one answering.
              </p>
            </div>
          </div>

          {/* Boards render only when real members exist; until then,
              one honest line instead of empty placeholder boxes. */}
          {studentBoard.length > 0 && (
            <div className="mt-14 max-w-4xl">
              <h3 className="font-display text-2xl text-forest">Student Board</h3>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {studentBoard.map((m) => <BoardRow key={m.id} member={m} />)}
              </div>
            </div>
          )}
          {advisoryBoard.length > 0 && (
            <div className="mt-14 max-w-4xl">
              <h3 className="font-display text-2xl text-forest">Advisory Board</h3>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {advisoryBoard.map((m) => <BoardRow key={m.id} member={m} />)}
              </div>
            </div>
          )}
          {studentBoard.length === 0 && advisoryBoard.length === 0 && (
            <p className="mt-8 max-w-[58ch] font-body text-base leading-relaxed text-ink/60">
              A student board and an advisory board are forming now. If you
              want in early,{" "}
              <Link href="/get-involved" className="text-rust underline underline-offset-2">
                this is the moment
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* Get Involved */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SurveyRule className="text-rust-light" />
          <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h3 className="font-display text-xl text-cream">Join the team</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                Open to students across Chicago.
              </p>
              <Link href="/get-involved" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream">
                Get involved &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-cream">Start a chapter</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                Outside Chicago? Bring the model to your city.
              </p>
              <Link href="/get-involved" className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust-light transition-colors hover:text-cream">
                Tell us where &rarr;
              </Link>
            </div>
            <div>
              <h3 className="font-display text-xl text-cream">Partner with us</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-cream/60">
                For schools, nonprofits, and community groups.
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
