/* ------------------------------------------------------------------ */
/*  /about/team                                                        */
/*                                                                     */
/*  Its own tab in the navbar at the owner's request, July 2026.       */
/*                                                                     */
/*  The layout is TeamGrid, which carries the reasoning behind the     */
/*  shape. Cards show city and school, not job titles (owner's call).  */
/*  The bios came off the Mayor's Youth Commission roster and were     */
/*  rewritten around what each person actually works on. The MYC       */
/*  mention stays only for the two people it is genuinely central to.  */
/*                                                                     */
/*  The roster is TEAM_MEMBERS in src/lib/team-constants.ts, merged    */
/*  with live rows from the Supabase board_members table so the admin  */
/*  at /admin/about/board still reaches the public site. Both sides    */
/*  dedupe by slug, same read-live-then-fall-back pattern as the rest  */
/*  of the site.                                                       */
/*                                                                     */
/*  Real people only. Two seats are spoken for and not named yet, so   */
/*  they render as reserved tiles with no name and no face. Set        */
/*  OPEN_SEATS to 0 in team-constants.ts once both are filled.         */
/*                                                                     */
/*  Voice rules (owner, July 2026). No aphorism headlines, no balanced */
/*  pairs, no numbered rows, no rhetorical triads. Site-wide, no       */
/*  em-dashes and no colons inside sentences or headings.              */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import TeamGrid from "@/components/about/TeamGrid";
import {
  TEAM_MEMBERS,
  isRealName,
  type TeamMember,
} from "@/lib/team-constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meet the team | Rooted Forward",
  description:
    "The students who run Rooted Forward. Who each person is, where they go to school, and what they work on.",
};

/* Shape of the board_members rows the public page cares about. */
interface BoardRow {
  slug: string | null;
  full_name: string;
  role: string;
  city: string | null;
  bio: string | null;
  photo_url: string | null;
  board_type: "student" | "advisory";
  display_order: number | null;
}

async function loadRoster(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured()) return TEAM_MEMBERS;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("board_members")
      .select(
        "slug, full_name, role, city, bio, photo_url, board_type, display_order",
      )
      .eq("is_active", true)
      .order("display_order");

    if (!data) return TEAM_MEMBERS;

    const known = new Set(TEAM_MEMBERS.map((m) => m.slug));
    const extra = (data as BoardRow[])
      .filter((r) => isRealName(r.full_name))
      /* A row with no bio has nothing behind its Read bio button, so it
         stays off the page until somebody writes the paragraph. */
      .filter((r) => (r.bio ?? "").trim().length > 0)
      .map<TeamMember>((r) => ({
        slug: r.slug ?? r.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: r.full_name,
        /* The table has no sort field, so the last word of the name is the
           fallback. Anyone whose name it gets wrong belongs in
           team-constants.ts with an explicit sortKey. */
        sortKey: r.full_name.trim().split(/\s+/).pop() ?? r.full_name,
        role: r.role,
        city: r.city?.trim() || undefined,
        bio: r.bio!.trim(),
        photo: r.photo_url,
      }))
      .filter((m) => !known.has(m.slug));

    return [...TEAM_MEMBERS, ...extra];
  } catch {
    /* No connection, no extra rows. The constants still render. */
    return TEAM_MEMBERS;
  }
}

export default async function TeamPage() {
  const roster = await loadRoster();

  return (
    <PageTransition>
      {/* ============================================================
          WHO IS ON IT
          ============================================================ */}
      {/* ============================================================
          THE ROSTER, on a soft wash rather than flat cream. Owner asked
          for the page to be more interesting than a grid on a blank
          background (July 2026).

          Two low-alpha radial stops, rust coming in from the top left
          and forest answering from the bottom right, over the cream
          token. Both sit under 0.16 alpha on purpose. Anything stronger
          and an archival civic page starts reading like a product
          landing page, which is the failure mode this palette is most
          exposed to. Written as an inline style because Tailwind v4
          would need three nested arbitrary values to say the same thing.

          The heading shares the wash, so there is no rule cutting the
          gradient in half.
          ============================================================ */}
      <div
        className="bg-cream"
        style={{
          backgroundImage:
            "radial-gradient(64rem 40rem at 4% -14%, rgba(196, 93, 62, 0.34), rgba(196, 93, 62, 0) 62%), " +
            "radial-gradient(44rem 30rem at 82% 4%, rgba(212, 118, 92, 0.20), rgba(212, 118, 92, 0) 58%), " +
            "radial-gradient(56rem 42rem at 96% 108%, rgba(27, 58, 45, 0.16), rgba(27, 58, 45, 0) 62%)",
        }}
      >
        {/* Just the heading. The owner cut the eyebrow and the standfirst
            in July 2026, since the cards underneath already say who these
            people are and where they go to school. */}
        <section className="pb-12 pt-20 md:pb-16 md:pt-28">
          <div className="mx-auto max-w-5xl px-6">
            <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
              Leadership team
            </h1>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="mx-auto max-w-5xl px-6">
            <TeamGrid members={roster} />
          </div>
        </section>
      </div>

      {/* ============================================================
          THE DOOR OUT. The roster is short because the organization is
          small, so the honest thing to put under it is the opening.
          ============================================================ */}
      <section className="border-t border-border bg-cream-dark/35 py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-2xl text-forest md:text-3xl">
            We could use your help
          </h2>
          <p className="mt-4 max-w-[52ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
            If you can dig through an archive, run a survey table at a market,
            or edit audio, there is work here for you. You do not need
            experience to start.
          </p>
          <Link
            href="/get-involved"
            className="mt-7 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get involved
          </Link>
          <p className="mt-7 font-body text-sm leading-relaxed text-ink/70">
            Questions go to{" "}
            <a
              href="mailto:contact@rooted-forward.org"
              className="text-forest underline decoration-1 underline-offset-[3px] transition-colors hover:text-rust-dark"
            >
              contact@rooted-forward.org
            </a>
            .
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
