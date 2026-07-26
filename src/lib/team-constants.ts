/* ------------------------------------------------------------------ */
/*  The roster behind /about/team                                      */
/*                                                                     */
/*  This file is the source of truth. Add a person by adding an object */
/*  to TEAM_MEMBERS and the page picks them up with no other change.   */
/*                                                                     */
/*  REAL PEOPLE ONLY. No filler names, no invented bios, no borrowed   */
/*  headshots. Same rule as the rest of the site. The two seats that   */
/*  are spoken for but not named yet render as reserved tiles with no  */
/*  name and no face on them, which is honest; a stand-in person is    */
/*  not. Set OPEN_SEATS to 0 when both are filled.                     */
/*                                                                     */
/*  Field notes.                                                       */
/*                                                                     */
/*  school   What the card shows instead of a job title, at the        */
/*           owner's request (July 2026). High school for the people   */
/*           still in one, college for the people who have started.    */
/*           Everybody gets one or the card looks half filled.         */
/*                                                                     */
/*  bio      45 to 110 words, third person. It sits behind the Read    */
/*           bio button, so it can carry the detail the card cannot.   */
/*           No character adjectives, nothing about being passionate.  */
/*                                                                     */
/*  city     All of them or none of them. City on four people out of   */
/*           six reads as an oversight, not a fact.                    */
/*                                                                     */
/*  sortKey  The surname as that person writes it. Stored rather than  */
/*           split off `name`, which gets mononyms, particles, and     */
/*           non-Western name order wrong on the first try.            */
/*                                                                     */
/*  pinned   Lower sorts first, ahead of everyone unpinned.            */
/*                                                                     */
/*  photo    Drop the file in public/media/team and point at it. Until */
/*           then an initials circle renders, which is deliberate      */
/*           rather than a broken image slot.                          */
/* ------------------------------------------------------------------ */

export interface TeamMember {
  /** Stable id. Also the dedupe key against Supabase board_members rows. */
  slug: string;
  /** Rendered exactly as stored. No text-transform, no title-case helper. */
  name: string;
  /** Surname as this person writes it, used for sorting. */
  sortKey: string;
  /** Lower numbers sort ahead of everyone without one. */
  pinned?: number;
  /** Optional. The cards show school rather than title, so this is only
   *  read where a title genuinely matters. */
  role?: string;
  /** Optional, but all or nothing across the whole roster. */
  city?: string;
  /** Where this person studies. Shown on the card under the city. */
  school?: string;
  /** 45 to 110 words, third person. Opens in the bio dialog. */
  bio: string;
  /** Path under /public or a full URL. Falls back to an initials circle. */
  photo?: string | null;
  /** CSS object-position for the circular crop, e.g. "50% 20%" for a
   *  loose shot. Applied as an inline style. It cannot be a Tailwind
   *  class, since v4 scans source text and will not generate one from a
   *  runtime string. */
  objectPosition?: string;
}

/* Seats that are spoken for and not named yet. They render as reserved
   tiles so the grid shows the shape the roster is heading for. Set to 0
   the moment both people are added above. */
export const OPEN_SEATS = 2;

export const TEAM_MEMBERS: TeamMember[] = [
  {
    slug: "zain-zaidi",
    name: "Zain Zaidi",
    sortKey: "Zaidi",
    pinned: 0,
    role: "Founder",
    city: "Chicago",
    school: "University of Chicago Laboratory Schools",
    bio:
      "Zain started Rooted Forward after going back and forth between the Near South Side, where he lives, and Hyde Park, where he goes to school, and running into how completely the city changed from one block to the next. He sits on Chicago's Mayor's Youth Commission and is on its Education Working Group, which is where the policy work here comes from. He also teaches public speaking and writing to refugee students through Forging Opportunities for Refugees in America. He debates, golfs, codes, and walks Chicago neighborhoods.",
    photo: null,
  },
  {
    slug: "ayomide-olatunji",
    name: "Ayomide Olatunji",
    sortKey: "Olatunji",
    city: "Chicago",
    school: "Harvard University",
    bio:
      "Ayomide works on getting science-based health information to more people, particularly around mental health and cancer prevention. He sits on Chicago's Mayor's Youth Commission, where he is part of the Public Health working group and both the Summit Planning and Charter committees. His academic interest is in how cellular and metabolic changes drive neurological disease and long-term health outcomes, and he plans to study neuroscience and public policy on the way to becoming a physician and an educator. He plays the talking drum, cooks, and plays club soccer.",
    photo: null,
  },
  {
    slug: "osheanna-tyler-hudson",
    name: "Osheanna Tyler-Hudson",
    sortKey: "Tyler-Hudson",
    city: "Chicago",
    school: "DePaul University",
    bio:
      "Osheanna finished at Christ the King Jesuit College Prep and starts at DePaul this fall. She works with nonprofits in Austin that create ways for young people to get involved in their own neighborhood, and she wants a firsthand understanding of how Chicago politics actually works. She is going for a business degree first, and law school after that.",
    photo: null,
  },
  {
    slug: "javonte-white",
    name: "Javonte White",
    sortKey: "White",
    city: "Chicago",
    school: "Collins Academy High School",
    bio:
      "Javonte is from North Lawndale and goes to Collins Academy High School. He writes stories and poems, and uses writing as the place he works out what he is thinking. He listens to a lot of R&B and lo-fi rap. He graduates in 2028 and wants to write screenplays for television and film. He also wants to be a leader people notice, inside his own school and across Chicago Public Schools.",
    photo: null,
  },
];

/* Pinned first, then alphabetical by the surname each person supplied.
   Sorted here rather than by the order of the array, so a new member can
   be appended to TEAM_MEMBERS without landing at the bottom of the page. */
export function sortRoster<T extends TeamMember>(members: T[]): T[] {
  return members
    .slice()
    .sort(
      (a, b) =>
        (a.pinned ?? Number.MAX_SAFE_INTEGER) -
          (b.pinned ?? Number.MAX_SAFE_INTEGER) ||
        a.sortKey.localeCompare(b.sortKey),
    );
}

/* Development seed rows ("Member Name", "Advisor Name", "test") are still
   sitting in the live board_members table. Anything that looks like one
   never reaches the page. */
export function isRealName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (n.includes("member name") || n.includes("advisor name")) return false;
  if (n.includes("placeholder")) return false;
  if (n === "test" || /^tes+t?$/.test(n)) return false;
  return true;
}
