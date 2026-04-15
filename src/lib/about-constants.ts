/* ------------------------------------------------------------------ */
/*  About page placeholder / fallback data                             */
/* ------------------------------------------------------------------ */

export interface BoardMember {
  id: string;
  slug: string;
  full_name: string;
  role: string;
  city: string | null;
  affiliation: string | null;
  bio: string;
  photo_url: string | null;
  board_type: "student" | "advisory";
  display_order: number;
  pillar_lead: "education" | "policy" | "research" | null;
  socials: { linkedin?: string; website?: string; email?: string } | null;
}

export const PLACEHOLDER_STUDENT_BOARD: BoardMember[] = [
  {
    id: "sb1",
    slug: "member-name-1",
    full_name: "Member Name",
    role: "Chapter Lead",
    city: "Chicago",
    affiliation: null,
    bio: "Bio placeholder. Replace with a two to three sentence description of this member's role and background.",
    photo_url: null,
    board_type: "student",
    display_order: 1,
    pillar_lead: "education",
    socials: null,
  },
  {
    id: "sb2",
    slug: "member-name-2",
    full_name: "Member Name",
    role: "Policy Lead",
    city: "Chicago",
    affiliation: null,
    bio: "Bio placeholder. Replace with a two to three sentence description of this member's role and background.",
    photo_url: null,
    board_type: "student",
    display_order: 2,
    pillar_lead: "policy",
    socials: null,
  },
  {
    id: "sb3",
    slug: "member-name-3",
    full_name: "Member Name",
    role: "Research Lead",
    city: "Chicago",
    affiliation: null,
    bio: "Bio placeholder. Replace with a two to three sentence description of this member's role and background.",
    photo_url: null,
    board_type: "student",
    display_order: 3,
    pillar_lead: "research",
    socials: null,
  },
  {
    id: "sb4",
    slug: "member-name-4",
    full_name: "Member Name",
    role: "Podcast Producer",
    city: "Chicago",
    affiliation: null,
    bio: "Bio placeholder. Replace with a two to three sentence description of this member's role and background.",
    photo_url: null,
    board_type: "student",
    display_order: 4,
    pillar_lead: null,
    socials: null,
  },
];

export const PLACEHOLDER_ADVISORY_BOARD: BoardMember[] = [
  {
    id: "ab1",
    slug: "advisor-name-1",
    full_name: "Advisor Name",
    role: "Advisor",
    city: "Chicago",
    affiliation: "University of Chicago",
    bio: "Bio placeholder. Replace with a four to five sentence description of this advisor's professional background and how they support Rooted Forward.",
    photo_url: null,
    board_type: "advisory",
    display_order: 1,
    pillar_lead: null,
    socials: null,
  },
  {
    id: "ab2",
    slug: "advisor-name-2",
    full_name: "Advisor Name",
    role: "Advisor",
    city: "Chicago",
    affiliation: "Metropolitan Planning Council",
    bio: "Bio placeholder. Replace with a four to five sentence description of this advisor's professional background and how they support Rooted Forward.",
    photo_url: null,
    board_type: "advisory",
    display_order: 2,
    pillar_lead: null,
    socials: null,
  },
  {
    id: "ab3",
    slug: "advisor-name-3",
    full_name: "Advisor Name",
    role: "Advisor",
    city: "Chicago",
    affiliation: null,
    bio: "Bio placeholder. Replace with a four to five sentence description of this advisor's professional background and how they support Rooted Forward.",
    photo_url: null,
    board_type: "advisory",
    display_order: 3,
    pillar_lead: null,
    socials: null,
  },
];
