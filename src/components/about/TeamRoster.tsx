"use client";

/* ------------------------------------------------------------------ */
/*  TeamRoster                                                         */
/*                                                                     */
/*  The grid on /about/team. Built to be scanned, not read. One card   */
/*  per person, grouped by city, and every group that has nobody in it */
/*  renders as nothing at all.                                         */
/*                                                                     */
/*  Two sources feed it. TEAM_MEMBERS in src/lib/team-constants.ts is  */
/*  the source of truth, and real rows from the Supabase board_members */
/*  table get merged in on top of it (deduped by slug) so the existing */
/*  admin at /admin/about/board still reaches the public site. Seed    */
/*  rows left over from development are filtered by isRealName.        */
/*                                                                     */
/*  Nobody has sent a photo yet, so the default is an initials mark    */
/*  drawn to look deliberate rather than a broken image slot.          */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TEAM_MEMBERS,
  cityRank,
  isRealName,
  type TeamMember,
} from "@/lib/team-constants";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* The avatar sits on top of the card rather than beside the text, so
   the bio gets the full column width. At three across, side-by-side
   left the bio about 200px wide and it broke into slivers. */
const AVATAR_BOX = "flex h-16 w-16 items-center justify-center rounded-sm";

function Avatar({ member }: { member: TeamMember }) {
  if (member.photo) {
    return (
      <img
        src={member.photo}
        alt={member.name}
        loading="lazy"
        className="h-16 w-16 rounded-sm object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${AVATAR_BOX} border border-border bg-cream-dark`}
    >
      <span className="font-display text-xl leading-none text-forest/70">
        {initials(member.name)}
      </span>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="rounded-sm border border-border bg-cream p-6">
      <Avatar member={member} />
      <h3 className="mt-5 font-display text-xl leading-tight text-forest">
        {member.name}
      </h3>
      <p className="mt-1.5 font-body text-xs font-semibold uppercase tracking-[0.18em] text-rust">
        {member.role}
      </p>
      {member.focus && (
        <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
          {member.focus}
        </p>
      )}
    </div>
  );
}

/* The last tile in the grid. It is a real opening, not decoration. */
function OpenSeatCard() {
  return (
    <Link
      href="/get-involved"
      className="group flex flex-col rounded-sm border border-dashed border-warm-gray-light bg-cream-dark/30 p-6 transition-colors hover:border-rust"
    >
      <div
        aria-hidden="true"
        className={`${AVATAR_BOX} border border-dashed border-warm-gray-light text-warm-gray transition-colors group-hover:border-rust group-hover:text-rust`}
      >
        <span className="font-display text-2xl leading-none">+</span>
      </div>
      <h3 className="mt-5 font-display text-xl leading-tight text-forest">
        Your name here
      </h3>
      <p className="mt-3 font-body text-sm leading-relaxed text-ink/70">
        We are always short on people who can read an archive, run a survey
        table, or edit audio. No experience needed.
      </p>
      <span className="mt-auto pt-5 font-body text-sm font-semibold uppercase tracking-widest text-rust">
        Join the team{" "}
        <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
          &rarr;
        </span>
      </span>
    </Link>
  );
}

/* Shape of the board_members rows we care about. */
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

export default function TeamRoster() {
  const [extra, setExtra] = useState<TeamMember[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("board_members")
          .select("slug, full_name, role, city, bio, photo_url, board_type, display_order")
          .eq("is_active", true)
          .order("display_order");
        if (cancelled || !data) return;

        const known = new Set(TEAM_MEMBERS.map((m) => m.slug));
        const mapped = (data as BoardRow[])
          .filter((r) => isRealName(r.full_name))
          .map((r) => ({
            slug: r.slug ?? r.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: r.full_name,
            role: r.role,
            /* An advisor is a group of their own. A member with no city
               set goes to a neutral group rather than being assigned a
               city we do not actually know. */
            city:
              r.board_type === "advisory"
                ? "Advisory board"
                : r.city?.trim() || "Team",
            focus: r.bio?.trim() || undefined,
            photo: r.photo_url,
          }))
          .filter((m) => !known.has(m.slug));

        setExtra(mapped);
      } catch {
        /* No connection, no extra rows. The constants still render. */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const all = [...TEAM_MEMBERS, ...extra];

  /* Group by city, keeping CITY_ORDER first and the rest alphabetical. */
  const groups = Array.from(
    all.reduce((map, m) => {
      const list = map.get(m.city) ?? [];
      list.push(m);
      map.set(m.city, list);
      return map;
    }, new Map<string, TeamMember[]>()),
  ).sort(([a], [b]) => cityRank(a) - cityRank(b) || a.localeCompare(b));

  return (
    <div className="flex flex-col gap-16">
      {groups.map(([city, members], groupIndex) => (
        <section key={city}>
          <div className="flex items-baseline gap-4">
            <h2 className="font-display text-2xl text-ink md:text-3xl">
              {city}
            </h2>
            <span className="h-px flex-1 bg-border" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-ink/45">
              {members.length} {members.length === 1 ? "person" : "people"}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <MemberCard key={m.slug} member={m} />
            ))}
            {/* The open seat sits in the first group only, so it reads as
                one invitation and not a repeated empty tile. */}
            {groupIndex === 0 && <OpenSeatCard />}
          </div>
        </section>
      ))}
    </div>
  );
}
