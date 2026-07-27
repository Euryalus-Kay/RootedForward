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
/*  order    The owner set the running order by hand (July 2026), so    */
/*           every member carries one. Anyone added without one falls  */
/*           to the end, alphabetically by sortKey.                    */
/*                                                                     */
/*  photo    Run the raw portrait through                              */
/*           scripts/prep-team-headshots.py, which trims the frame,    */
/*           crops square on the face, moves every backdrop to the     */
/*           same neutral, matches exposure, and writes a 480px JPEG   */
/*           into public/media/team. Point at that. A person with no   */
/*           photo yet gets an initials circle, which is deliberate    */
/*           rather than a broken image slot.                          */
/*                                                                     */
/*           The four shipped in July 2026 came off ~142px originals,  */
/*           so they are upscaled and slightly soft on a retina        */
/*           screen. Re-run the script on the real files when they     */
/*           turn up and nothing else has to change.                   */
/* ------------------------------------------------------------------ */

export interface TeamMember {
  /** Stable id. Also the dedupe key against Supabase board_members rows. */
  slug: string;
  /** Rendered exactly as stored. No text-transform, no title-case helper. */
  name: string;
  /** Surname as this person writes it, used for sorting. */
  sortKey: string;
  /** Display order, set by the owner. Lower sorts first, and anyone
   *  without one falls to the end alphabetically. */
  order?: number;
  /** Optional, and mostly empty on purpose. The cards lead with school
   *  rather than title, so this is for the handful of people where the
   *  title is the fact (the founder). It renders as a quiet italic line
   *  under the name, not as a badge. */
  role?: string;
  /** Optional, but all or nothing across the whole roster. */
  city?: string;
  /** Where this person studies. Shown on the card under the city. */
  school?: string;
  /** 45 to 110 words, third person. Opens in the bio dialog. Optional,
   *  so somebody can go up with a name and a face on the day they join
   *  and get their paragraph when they write it. No bio, no button. */
  bio?: string;
  /** Path under /public or a full URL. Falls back to an initials circle. */
  photo?: string | null;
  /** CSS object-position for the circular crop, e.g. "50% 20%" for a
   *  loose shot. Applied as an inline style. It cannot be a Tailwind
   *  class, since v4 scans source text and will not generate one from a
   *  runtime string. */
  objectPosition?: string;
}

/* Seats that are spoken for and not named yet. They render as reserved
   tiles so the grid shows the shape the roster is heading for. Back to 0
   in July 2026, when the last two people landed. */
export const OPEN_SEATS = 0;

export const TEAM_MEMBERS: TeamMember[] = [
  {
    slug: "zain-zaidi",
    name: "Zain Zaidi",
    sortKey: "Zaidi",
    order: 0,
    role: "Founder",
    city: "Chicago",
    school: "University of Chicago Laboratory Schools",
    bio:
      "Zain started Rooted Forward after going back and forth between the Near South Side, where he lives, and Hyde Park, where he goes to school, and running into how completely the city changed from one block to the next. He sits on Chicago's Mayor's Youth Commission and is on its Education Working Group, which is where the policy work here comes from. He also teaches public speaking and writing to refugee students through Forging Opportunities for Refugees in America. He debates, golfs, codes, and walks Chicago neighborhoods.",
    photo: "/media/team/zain-zaidi.jpg",
  },
  {
    slug: "ayomide-olatunji",
    name: "Ayomide Olatunji",
    sortKey: "Olatunji",
    order: 1,
    city: "Chicago",
    school: "Harvard University",
    bio:
      "Ayomide works on getting science-based health information to more people, particularly around mental health and cancer prevention. He sits on Chicago's Mayor's Youth Commission, where he is part of the Public Health working group and both the Summit Planning and Charter committees. His academic interest is in how cellular and metabolic changes drive neurological disease and long-term health outcomes, and he plans to study neuroscience and public policy on the way to becoming a physician and an educator. He plays the talking drum, cooks, and plays club soccer.",
    photo: "/media/team/ayomide-olatunji.jpg",
  },
  {
    slug: "osheanna-tyler-hudson",
    name: "Osheanna Tyler-Hudson",
    sortKey: "Tyler-Hudson",
    order: 3,
    city: "Chicago",
    school: "DePaul University",
    bio:
      "Osheanna finished at Christ the King Jesuit College Prep and starts at DePaul this fall. She works with nonprofits in Austin that create ways for young people to get involved in their own neighborhood, and she wants a firsthand understanding of how Chicago politics actually works. She is going for a business degree first, and law school after that.",
    photo: "/media/team/osheanna-tyler-hudson.jpg",
  },
  {
    slug: "javonte-white",
    name: "Javonte White",
    sortKey: "White",
    order: 5,
    city: "Chicago",
    school: "Collins Academy High School",
    bio:
      "Javonte is from North Lawndale and goes to Collins Academy High School. He writes stories and poems, and uses writing as the place he works out what he is thinking. He listens to a lot of R&B and lo-fi rap. He graduates in 2028 and wants to write screenplays for television and film. He also wants to be a leader people notice, inside his own school and across Chicago Public Schools.",
    photo: "/media/team/javonte-white.jpg",
  },
  {
    slug: "ahmed-agha",
    name: "Ahmed Agha",
    sortKey: "Agha",
    order: 2,
    city: "Washington, DC",
    school: "Georgetown University",
    bio:
      "Ahmed grew up in Dallas and is now an undergraduate at Georgetown University. He conducts medical research and plans to pursue a career in medicine. His research includes a study on how a patient's insurance affects the outcomes of simultaneous pancreas and kidney transplants. In Washington, DC, he researches how urban development has shaped racial inequality across the city, helping Rooted Forward better understand the communities it works with. In his free time, Ahmed enjoys cooking, especially experimenting with new recipes.",
    photo: "/media/team/ahmed-agha.jpg",
  },
  {
    slug: "sabina-aliyev",
    name: "Sabina Aliyev",
    sortKey: "Aliyev",
    order: 4,
    city: "New York",
    /* Xaverian High School, the Catholic school in Bay Ridge, Brooklyn.
       Spotted on the crest on her polo and then confirmed by the owner. */
    school: "Xaverian High School",
    bio:
      "Sabina attends Xaverian High School in Bay Ridge, Brooklyn. She spends much of her free time walking through New York's neighborhoods and searching for restaurants she has not tried before. As she explored more of the city, she began noticing how quickly the streets, housing, businesses, and public spaces could change from one neighborhood to the next. Her research helps turn what she notices while walking through the city into a clearer understanding of how New York was built and how it could become more equal.",
    photo: "/media/team/sabina-aliyev.jpg",
  },
];

/* The owner's running order first, then alphabetical by surname for
   anyone who does not have one.
   Sorted here rather than by the order of the array, so a new member can
   be appended to TEAM_MEMBERS without landing at the bottom of the page. */
export function sortRoster<T extends TeamMember>(members: T[]): T[] {
  return members
    .slice()
    .sort(
      (a, b) =>
        (a.order ?? Number.MAX_SAFE_INTEGER) -
          (b.order ?? Number.MAX_SAFE_INTEGER) ||
        a.sortKey.localeCompare(b.sortKey),
    );
}

/* Development seed rows are still sitting in the live board_members table
   ("Member Name" x3, "Advisor Name" x2, and one called "tesr"). Anything
   that looks like one never reaches the page.

   The load-bearing rule is the last one. Chasing individual typos with a
   regex is how "tesr" reached production in the first place, since it
   does not match test, tset, or teest. A real roster entry has a first
   name and a last name, so a single-token name is a keyboard test. The
   escape hatch for anyone who genuinely goes by one name is to add them
   to TEAM_MEMBERS above, which does not go through this filter. */
const SEED_NAMES = new Set([
  "test",
  "tesr",
  "tset",
  "asdf",
  "name",
  "new member",
]);

export function isRealName(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  if (SEED_NAMES.has(n)) return false;
  if (
    n.includes("member name") ||
    n.includes("advisor name") ||
    n.includes("placeholder")
  ) {
    return false;
  }
  const tokens = n.split(/\s+/).filter(Boolean);
  /* One word is a keyboard test. Two tokens is a first and last name, and
     a single initial counts, so "J Smith" survives. */
  if (tokens.length < 2) return false;
  return !tokens.some((t) => SEED_NAMES.has(t));
}
