/* ------------------------------------------------------------------ */
/*  Petitions                                                          */
/*                                                                     */
/*  The policy section runs on petitions now. One petition equals one  */
/*  real bill that is sitting in a real Chicago committee right now.   */
/*                                                                     */
/*  Real Data Policy applies with no exceptions. Every petition here   */
/*  names a bill that exists, states where it actually sits, and       */
/*  links the reporting or the city record that backs each claim.      */
/*  Signature counts start at zero and only grow from real signatures. */
/*  When a bill passes or dies, flip `status` to "closed" and write    */
/*  the honest outcome into `outcome`. Never invent a record number,   */
/*  a vote, or a date.                                                 */
/*                                                                     */
/*  Same fallback pattern as the rest of the site. Pages read the      */
/*  `petitions` table first (migration 009) and fall back to this      */
/*  array by slug. Keep the two in sync.                               */
/* ------------------------------------------------------------------ */

export interface PetitionSource {
  title: string;
  publisher: string;
  url: string;
}

export interface Petition {
  slug: string;
  /** Short name a person would actually say out loud. */
  title: string;
  /** The bill's formal name, as the city files it. */
  billName: string;
  /** The city the bill affects. Shown big on the card, and the form
      asks a signer whether they live here. */
  city: string;
  /** City record number, when the bill has one. */
  recordNumber: string | null;
  status: "open" | "closed";
  /** One line, plain. Shown on the policy index under the title. */
  oneLiner: string;
  /** Where the bill sits today. Kept short and checkable. */
  whereItStands: string;
  /** Who the signatures are addressed to. */
  addressedTo: string;
  /** What the bill would do. Short paragraphs, no jargon. */
  whatItWouldDo: string[];
  /** Why this org is asking, tied to the history the site covers. */
  whyWeCareAboutIt: string[];
  /** The sentence a signer is putting their name to. */
  petitionStatement: string;
  sources: PetitionSource[];
  /** Filled in only after the bill is decided. */
  outcome: string | null;
}

export const PETITIONS: Petition[] = [
  {
    slug: "protecting-renters-ordinance",
    title: "Protect Chicago renters",
    billName: "Protecting Renters Ordinance",
    city: "Chicago",
    recordNumber: null,
    status: "open",
    oneLiner:
      "Landlords would need a real reason to evict you or refuse to renew your lease.",
    whereItStands:
      "Mayor Brandon Johnson brought it straight to the Committee on Housing and Real Estate in June 2026. The committee has not voted. A full City Council vote is expected in the fall.",
    addressedTo: "The Chicago City Council Committee on Housing and Real Estate",
    whatItWouldDo: [
      "Right now a Chicago landlord can decline to renew your lease without giving any reason at all. This ordinance would change that. A landlord would need a valid cause to evict a tenant or end a lease.",
      "If you do have to move because the owner is moving in, or because the building is being sold, gutted, or torn down, the landlord would owe you relocation money. The amount is five months of rent or $5,000, whichever is larger.",
      "It also caps a security deposit at one month of rent, caps an application fee at $20, and bans the move-in charges that get added on top of rent.",
      "The rest of it is plumbing. Landlords would register their units with the city once a year, and a new Bureau of Rental Housing Services inside the Department of Housing would take complaints and enforce the rules.",
    ],
    whyWeCareAboutIt: [
      "Chicago has not seriously rewritten its renter law since the mid-1980s.",
      "The neighborhoods our tours cover are the ones where this lands hardest. In East Woodlawn, a few blocks from the Obama Presidential Center, the median price of a single-family home went from roughly $220,000 in 2019 to roughly $440,000 in 2025. Renters who stayed through the decades when no bank would lend on those blocks are the ones being asked to leave now.",
      "A rule that makes a landlord say why is a small thing. It is also the difference between moving and not moving for a lot of families.",
    ],
    petitionStatement:
      "I am asking the Committee on Housing and Real Estate to hold a vote on the Protecting Renters Ordinance and to advance it to the full City Council. Chicago renters should not lose their homes without a reason.",
    sources: [
      {
        title: "Mayor Wants To Create A Tenant Bill Of Rights, Other Protections For Renters",
        publisher: "Block Club Chicago, June 29, 2026",
        url: "https://blockclubchicago.org/2026/06/29/mayor-wants-to-create-a-tenant-bill-of-rights-other-protections-for-renters/",
      },
      {
        title: "Mayor Brandon Johnson, Department of Housing Introduce The Protecting Renters Ordinance",
        publisher: "City of Chicago",
        url: "https://www.chicago.gov/city/en/depts/mayor/press_room/press_releases/2026/may/protecting-renters-ordinance.html",
      },
      {
        title: "Chicago's Efforts to Keep Housing Affordable in Woodlawn Falls Short as Obama Center Nears Opening",
        publisher: "Illinois Answers Project, May 7, 2026",
        url: "https://illinoisanswers.org/2026/05/07/affordability-woodlawn-obama-center-housing-costs/",
      },
      {
        title: "Chicago landlords spooked by expanded tenants' rights ordinance",
        publisher: "The Real Deal, July 2, 2026",
        url: "https://therealdeal.com/chicago/2026/07/02/landlords-fight-chicago-tenant-protections/",
      },
    ],
    outcome: null,
  },
  {
    slug: "hazel-johnson-cumulative-impacts-ordinance",
    title: "Stop stacking pollution on the same neighborhoods",
    billName: "Hazel M. Johnson Cumulative Impacts Ordinance",
    city: "Chicago",
    recordNumber: "O2025-0016697",
    status: "open",
    oneLiner:
      "Before the city approves another polluting plant, it would have to count the pollution the neighborhood already carries.",
    whereItStands:
      "Introduced in April 2025 and sent to the Committee on Zoning, Landmarks and Building Standards in September 2025. It has been sitting there ever since with no vote scheduled.",
    addressedTo:
      "The Chicago City Council Committee on Zoning, Landmarks and Building Standards",
    whatItWouldDo: [
      "Chicago reviews industrial rezoning applications one at a time. A scrapyard is judged on its own, then an asphalt plant is judged on its own, and nobody adds up what a single neighborhood is breathing by the end.",
      "This ordinance would make the city add it up. A company asking for a heavy industrial rezoning would have to show how its pollution stacks on top of what is already there before the zoning is approved.",
      "It also puts an environmental justice project manager and an advisory board inside city government, and adds requirements for companies that relocate.",
      "It is named for Hazel M. Johnson, who organized against industrial pollution around the Altgeld Gardens public housing development on the Far South Side and is widely called the mother of the environmental justice movement.",
    ],
    whyWeCareAboutIt: [
      "The city's own cumulative impacts assessment found the heaviest pollution burdens sitting on Black and Latino neighborhoods on the South and West sides.",
      "Those are largely the same neighborhoods the federal government graded red in 1940, and the same ones the city later zoned for the industry nobody wanted next door. Our exhibit walks through how that map was drawn. This ordinance is one of the few live chances to stop the pattern from repeating.",
      "The bill has now been stuck in one committee for most of a year. A committee that never votes never has to go on record.",
    ],
    petitionStatement:
      "I am asking the Committee on Zoning, Landmarks and Building Standards to schedule a vote on the Hazel M. Johnson Cumulative Impacts Ordinance. Chicago should count the pollution a neighborhood already carries before approving more of it.",
    sources: [
      {
        title: "Mayor Brandon Johnson Introduces the Hazel Johnson Cumulative Impacts Ordinance",
        publisher: "City of Chicago, April 2025",
        url: "https://www.chicago.gov/city/en/depts/mayor/press_room/press_releases/2025/april/Hazel-Johnson-Cumulative-Impacts-Ordinance.html",
      },
      {
        title: "Ordinance O2025-0016697",
        publisher: "Chicago Councilmatic",
        url: "https://chicago.councilmatic.org/legislation/o2025-0016697/",
      },
      {
        title: "In Chicago, a Landmark Environmental Justice Bill Inches Toward Passage",
        publisher: "Inside Climate News, July 2, 2025",
        url: "https://insideclimatenews.org/news/02072025/chicago-landmark-environmental-justice-bill/",
      },
      {
        title: "Ask your alderperson to act on the Hazel M. Johnson environmental health ordinance now",
        publisher: "The TRiiBE, June 2026",
        url: "https://thetriibe.com/2026/06/essay-ask-your-alderperson-to-act-on-the-hazel-m-johnson-environmental-health-ordinance-now/",
      },
    ],
    outcome: null,
  },
];

export function getPetition(slug: string): Petition | undefined {
  return PETITIONS.find((p) => p.slug === slug);
}
