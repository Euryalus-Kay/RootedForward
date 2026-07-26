/* ------------------------------------------------------------------ */
/*  The roster behind /about/team                                      */
/*                                                                     */
/*  This file is the source of truth. Add a person by adding an object */
/*  to TEAM_MEMBERS, and the page picks them up with no other change.  */
/*  Any new value for `city` renders as its own group, so opening a    */
/*  fourth city needs nothing but a new string.                        */
/*                                                                     */
/*  The page also merges in real rows from the Supabase board_members  */
/*  table (managed at /admin/about/board), deduped against this file   */
/*  by slug, so either route works and neither double-lists anyone.    */
/*                                                                     */
/*  REAL PEOPLE ONLY. No filler names, no placeholder bios, no invented*/
/*  roles. An empty group renders as nothing, which is honest; a fake  */
/*  name is not. Same rule as the rest of the site.                    */
/* ------------------------------------------------------------------ */

export interface TeamMember {
  /** Stable id. Also the dedupe key against Supabase board_members rows. */
  slug: string;
  name: string;
  /** Short title. "Founder", "Research Lead", "Producer". */
  role: string;
  /** Group heading. Anything not in CITY_ORDER sorts to the end. */
  city: string;
  /** One line on what this person actually does. Optional but preferred. */
  focus?: string;
  /** Path under /public, or a full URL. Falls back to an initials mark. */
  photo?: string | null;
}

/* Cities render in this order. Unknown cities follow, alphabetically. */
export const CITY_ORDER = ["Chicago", "New York", "Washington, DC"] as const;

export const TEAM_MEMBERS: TeamMember[] = [
  {
    slug: "zain-zaidi",
    name: "Zain Zaidi",
    role: "Founder",
    city: "Chicago",
    focus:
      "Runs the organization day to day, from the Hyde Park research to the policy work. If you email us, he is the one answering.",
    photo: null,
  },
];

/* Sort helper shared by the page and anything else that lists people. */
export function cityRank(city: string): number {
  const i = (CITY_ORDER as readonly string[]).indexOf(city);
  return i === -1 ? CITY_ORDER.length : i;
}

/* Development seed rows ("Member Name", "Advisor Name", "test") are
   still sitting in the live board_members table. Anything that looks
   like one never reaches the page. */
export function isRealName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (n.includes("member name") || n.includes("advisor name")) return false;
  if (n === "test" || n === "placeholder" || /^tes+t?$/.test(n)) return false;
  return true;
}
