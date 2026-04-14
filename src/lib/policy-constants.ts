/* ------------------------------------------------------------------ */
/*  Policy section placeholder / fallback data                         */
/* ------------------------------------------------------------------ */

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  status: "active" | "past" | "drafting";
  category: string;
  city: string;
  summary: string;
  full_brief_markdown: string | null;
  deadline: string | null;
  outcome: string | null;
  hero_image_url: string | null;
  target_body: string | null;
  problem_markdown: string | null;
  proposal_markdown: string | null;
  comment_template: string | null;
  decision_makers: { name: string; role: string; contact?: string }[] | null;
  evidence_links: { title: string; url: string; source: string }[] | null;
  related_tour_slugs: string[];
  signature_count: number;
  created_at: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  order_number: number;
  read_time_minutes: number;
  why_use: string;
  content_markdown: string;
  last_updated: string;
}

export interface PolicyBrief {
  id: string;
  slug: string;
  title: string;
  published_date: string;
  topic_tags: string[];
  summary: string;
  full_content_markdown: string | null;
  pdf_url: string | null;
  related_campaign_id: string | null;
}

export interface ApprovedComment {
  id: string;
  user_name: string;
  neighborhood: string;
  comment_body: string;
  created_at: string;
}

export interface ReferenceLink {
  name: string;
  url: string;
  annotation: string;
}

/* ------------------------------------------------------------------ */
/*  Campaigns                                                          */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_CAMPAIGNS: Campaign[] = [
  {
    id: "c1",
    slug: "woodlawn-affordable-housing-covenant",
    title: "Woodlawn Affordable Housing Covenant",
    status: "active",
    category: "Housing",
    city: "chicago",
    summary:
      "The Obama Presidential Center is bringing $3.4 billion in investment to Woodlawn and South Shore. Community organizations have been fighting for a community benefits agreement since 2018, but the ordinance passed by City Council in 2022 left out binding affordable housing protections for renters within a half-mile of the site. We are calling on the Department of Housing to adopt a binding covenant that caps rent increases for existing tenants in the Woodlawn impact zone for fifteen years.",
    full_brief_markdown: null,
    deadline: "2026-06-15T23:59:59Z",
    outcome: null,
    hero_image_url: null,
    target_body: "Chicago Department of Housing",
    problem_markdown:
      "## The Problem\n\nThe Obama Presidential Center broke ground in 2021 and is expected to open in 2026. The University of Chicago's own projections estimate the center will draw 750,000 visitors annually and generate billions in economic activity. That money flows into a neighborhood where the median household income is $24,000 and 60% of residents are renters.\n\nWoodlawn lost nearly 70% of its population between 1960 and 2010, largely due to urban renewal, redlining, and the disinvestment those policies caused. The residents who stayed — or who moved in during the decades when nobody else would invest — are now facing displacement by the very revitalization their neighborhood was promised.\n\nProperty values in Woodlawn have already increased 60% since the center was announced. Rents are following. The 2022 ordinance created a housing trust fund and right of first refusal for tenants, but it did not include the rent stabilization provisions that community groups requested during the public comment period.",
    proposal_markdown:
      "## What We're Proposing\n\nA binding affordable housing covenant attached to all residential properties within a half-mile of the Obama Presidential Center site. The covenant would:\n\n1. Cap annual rent increases at 3% or CPI (whichever is lower) for existing tenants for 15 years\n2. Require landlords receiving any city subsidy in the impact zone to maintain 30% of units at or below 60% AMI\n3. Establish an independent monitoring body with community representation\n4. Create an anti-displacement fund financed by a 1% transfer tax on property sales over $500,000 in the impact zone\n\nThis is not a blanket rent control proposal. It is a targeted protection for a specific geography facing a specific displacement pressure, modeled on protections other cities have adopted near major public investments.",
    comment_template:
      "I am a Chicago resident writing to urge the Department of Housing to adopt a binding affordable housing covenant for the Woodlawn impact zone surrounding the Obama Presidential Center. The 2022 ordinance left out rent stabilization protections that community organizations requested during public comment. As development pressure increases, existing renters — many of whom stayed through decades of disinvestment — need binding protections against displacement. I support Rooted Forward's proposal for a 15-year covenant capping rent increases and requiring affordable unit set-asides in subsidized properties.",
    decision_makers: [
      { name: "Lissette Castañeda", role: "Commissioner, Chicago Department of Housing" },
      { name: "Jeanette Taylor", role: "Alderperson, 20th Ward" },
      { name: "Desmon Yancy", role: "Alderperson, 5th Ward" },
    ],
    evidence_links: [
      { title: "Obama Presidential Center Community Benefits Ordinance (2022)", url: "https://chicago.legistar.com", source: "Chicago City Clerk" },
      { title: "Woodlawn Property Value Analysis 2018–2025", url: "#", source: "Institute for Housing Studies at DePaul" },
      { title: "Community Benefits Agreements: Lessons from U.S. Cities", url: "#", source: "Partnership for Working Families" },
    ],
    related_tour_slugs: ["hyde-park-urban-renewal"],
    signature_count: 847,
    created_at: "2025-12-01",
  },
  {
    id: "c2",
    slug: "cpd-traffic-stop-data-transparency",
    title: "CPD Traffic Stop Data Transparency Act",
    status: "past",
    category: "Policing",
    city: "chicago",
    summary:
      "Pushed Chicago Police Department to publish geocoded traffic stop data broken down by race, ward, and outcome. The data confirmed what residents already knew: stops were concentrated in Black neighborhoods with no proportional difference in contraband recovery rates.",
    full_brief_markdown: null,
    deadline: null,
    outcome: "Partial — CPD began publishing quarterly stop data in 2025 but excluded officer badge numbers and GPS coordinates.",
    hero_image_url: null,
    target_body: "Chicago Police Department / City Council Public Safety Committee",
    problem_markdown: null,
    proposal_markdown: null,
    comment_template: null,
    decision_makers: null,
    evidence_links: null,
    related_tour_slugs: [],
    signature_count: 1203,
    created_at: "2025-03-01",
  },
  {
    id: "c3",
    slug: "pilsen-industrial-corridor-rezoning",
    title: "Pilsen Industrial Corridor Rezoning Review",
    status: "past",
    category: "Zoning",
    city: "chicago",
    summary:
      "Organized public comment opposing the rezoning of parcels along the Pilsen Industrial Corridor from M2 manufacturing to B3 commercial, which would have allowed luxury residential development without affordable unit requirements.",
    full_brief_markdown: null,
    deadline: null,
    outcome: "Won — Zoning Committee tabled the application after 340 public comments opposed the change. Parcels remain M2.",
    hero_image_url: null,
    target_body: "Chicago Zoning Board of Appeals",
    problem_markdown: null,
    proposal_markdown: null,
    comment_template: null,
    decision_makers: null,
    evidence_links: null,
    related_tour_slugs: ["pilsen-anti-displacement-murals"],
    signature_count: 340,
    created_at: "2025-06-01",
  },
];

/* ------------------------------------------------------------------ */
/*  How-To Guides                                                      */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_GUIDES: Guide[] = [
  {
    id: "g1",
    slug: "submit-public-comment-city-council",
    title: "How to Submit Public Comment to Chicago City Council",
    order_number: 1,
    read_time_minutes: 6,
    why_use:
      "Use this when City Council is voting on an ordinance you want to support or oppose. Written comments become part of the official record and are read by alderpeople and their staff.",
    content_markdown: `## What public comment actually does

When Chicago City Council votes on an ordinance, alderpeople are supposed to know what their constituents think. In practice, most of them hear from lobbyists, developers, and advocacy organizations. Public comment is the mechanism that puts your voice into the official record alongside theirs.

Written comments submitted to the City Clerk's office are distributed to all 50 alderpeople before a vote. They are also entered into the Council Journal, which is the permanent legislative record of the city. This is not a suggestion box. It is a legal record, and elected officials are aware that their response to public comment — or lack of response — is documented.

## When to submit

Submit your comment **before** the scheduled vote. Comments submitted after a vote still enter the record, but they cannot influence the outcome. City Council meets roughly once a month; check the [City Clerk meeting schedule](https://www.chicityclerk.com/legislation-records/journals-and-reports/meetings) for exact dates. Committee hearings, where most of the real debate happens, are listed separately.

For maximum impact, submit at least **48 hours** before the committee hearing where the ordinance will be discussed. That is when staff are compiling briefing materials.

## How to write it

Keep it short. Three to five paragraphs. Open with who you are and where you live — your ward matters because alderpeople pay the most attention to their own constituents. State the ordinance number or title. Say whether you support or oppose it. Give one or two specific reasons why. Close by stating what you want your alderperson to do.

Do not use form letters if you can avoid it. Staff can tell. A two-paragraph comment in your own words carries more weight than a five-page template.

## Where to send it

**Email**: Send to your alderperson directly (find them at [Ward Office Finder](https://www.chicago.gov/city/en/depts/mayor/iframe/lookup_ward_and_alderman.html)) and CC the City Clerk at officeofthecityclerk@cityofchicago.org.

**In person**: You can also deliver written testimony at the committee hearing or full Council meeting. Sign up to speak during the public comment period — you will usually get two to three minutes.

## What happens after

Your comment is entered into the Council Journal. If you emailed your alderperson directly, their office may respond. If you submitted through the Clerk, it goes into the public record but you probably will not receive a personal reply. That is normal. The record still matters.`,
    last_updated: "2026-01-15",
  },
  {
    id: "g2",
    slug: "submit-comment-zoning-change",
    title: "How to Submit Public Comment on a Chicago Zoning Change",
    order_number: 2,
    read_time_minutes: 7,
    why_use:
      "Use this when a developer or property owner has applied to rezone a parcel near you. Zoning changes affect what gets built, how tall it can be, and whether affordable housing is required.",
    content_markdown: `## Why zoning changes matter

Zoning determines what can be built on a parcel of land. When a developer wants to build something the current zoning does not allow — say, a six-story residential building on a lot zoned for manufacturing — they file for a zoning change. If approved, the new zoning runs with the land permanently. It is not a one-time exception.

Zoning changes in Chicago go through the Zoning Board of Appeals or the Committee on Zoning, Landmarks and Building Standards, depending on the type. Both hold public hearings. Both accept written comment.

## How to find out about zoning changes near you

The City of Chicago publishes zoning applications on the [Department of Planning and Development](https://www.chicago.gov/city/en/depts/dcd.html) website. Applications for zoning map amendments are also posted in the Council Journal. Your alderperson's office should notify you of major applications in your ward, but this does not always happen.

The most reliable method: check the Zoning Board of Appeals calendar monthly and look for applications in your community area.

## What to include in your comment

State the application number and address. Say whether you support or oppose the change and why. The most effective comments address the zoning criteria directly:

- **Is the proposed use compatible with surrounding properties?** If the area is residential and the application is for a commercial use, say so.
- **Will the change cause harm to adjacent properties?** Increased traffic, shadows, noise.
- **Does the applicant meet the standards for the requested zoning class?** Each class has height, density, and setback requirements.
- **Is there a public benefit?** Affordable housing units, community space, local hiring commitments.

You do not need to be a zoning expert. Describe the impact in concrete terms: how it will affect your block, your commute, your rent.

## Where to submit

Written comments go to the Zoning Board of Appeals at zba@cityofchicago.org or to the Committee on Zoning at the City Clerk's office. Copy your alderperson. Attend the hearing in person if you can — spoken testimony is entered into the hearing record.

## Timing

Submit before the hearing date. Check the Zoning Board calendar for scheduled hearings on the application.`,
    last_updated: "2026-01-15",
  },
  {
    id: "g3",
    slug: "written-testimony-illinois-general-assembly",
    title: "How to Submit Written Testimony to the Illinois General Assembly",
    order_number: 3,
    read_time_minutes: 5,
    why_use:
      "Use this when a state bill in committee affects your community. The witness slip system lets anyone in Illinois register support or opposition before the committee votes.",
    content_markdown: `## How state committee hearings work

Before a bill reaches the floor of the Illinois House or Senate, it goes through a subject-matter committee. The committee holds a hearing, takes testimony, and votes on whether to advance the bill. This is where most bills die, and it is where your input matters most.

Illinois has a system called **witness slips** that lets anyone register a position on a bill in committee. You do not have to attend the hearing. You do not have to write a long letter. You fill out a form online and your position is counted.

## How to file a witness slip

Go to [my.ilga.gov](https://my.ilga.gov) and create an account. Search for the bill number. Click "Create Witness Slip" on the bill's page. Fill in:

- Your name and address
- Whether you are a **proponent** (support), **opponent** (oppose), or registering **no position**
- Whether you want to appear in person, submit written testimony, or just be counted as a record of appearance

If you just want your position counted, select "Record of Appearance Only." This takes about two minutes and it matters — committee chairs look at slip counts before hearings.

## If you want to submit written testimony

You can upload written testimony as a PDF or paste it into the form. Keep it to one page. State who you are, what bill you are addressing, your position, and your reason. One specific, personal reason is better than five general ones.

## Timing

Witness slips must be filed **before** the committee hearing. Hearings are scheduled on the General Assembly calendar. Most committees post their agendas 24 to 48 hours in advance. File your slip as soon as you see the bill scheduled.

## Why this matters

Legislators track witness slip counts. A bill with 500 opponent slips and 12 proponent slips has a visibility problem. Slips do not guarantee an outcome, but they create a public record of where constituents stand, and that record follows the bill through every stage.`,
    last_updated: "2026-01-15",
  },
  {
    id: "g4",
    slug: "write-policy-proposal",
    title: "How to Write a Policy Proposal",
    order_number: 4,
    read_time_minutes: 8,
    why_use:
      "Use this when you have identified a problem that needs a policy solution and you want to put a concrete recommendation in front of decision-makers.",
    content_markdown: `## What a policy proposal is (and is not)

A policy proposal is a document that identifies a specific problem, proposes a specific solution, and explains why the solution will work. It is not a petition. It is not an op-ed. It is not a list of demands. It is a detailed, evidence-based argument for a particular course of action directed at a particular decision-making body.

Good policy proposals get read because they do the work for the reader. A busy alderperson or committee staffer does not have time to research your issue from scratch. If you hand them a proposal that lays out the problem, the solution, the evidence, the cost, and the precedent, you have made it easy for them to act.

## Structure

**Problem statement** (1-2 paragraphs): What is the problem? Who does it affect? How large is it? Use numbers if you have them.

**Background** (2-3 paragraphs): How did the problem develop? What has been tried before? Why did previous approaches fail or fall short?

**Proposed solution** (2-4 paragraphs): What specific action are you recommending? Be precise. "The city should address housing affordability" is a wish. "The Department of Housing should adopt a 15-year rent stabilization covenant for properties within a half-mile of the Obama Presidential Center" is a proposal.

**Evidence** (1-2 paragraphs): What evidence supports your solution? Has this been done elsewhere? What were the results? Cite sources.

**Implementation** (1-2 paragraphs): Who would implement this? What would it cost? What is the timeline? What are the potential obstacles?

**Ask** (1 paragraph): What specific action do you want the reader to take? Introduce an ordinance? Vote yes in committee? Direct a department to study the issue?

## Common mistakes

Writing too broadly. A proposal about "housing in Chicago" will not get traction. A proposal about rent stabilization in a specific geography tied to a specific development will.

Skipping the evidence section. Your argument is only as strong as your sources. Use data from city agencies, academic research, investigative journalism, or comparable policies in other cities.

Not naming the decision-maker. Every proposal needs a target: a specific person or body with the authority to act on your recommendation.

## What to do with it

Send it to your alderperson, the relevant committee chair, and any city department with jurisdiction. Rooted Forward also accepts community-submitted proposals through our [submit a proposal](/policy/submit-proposal) page — we develop the strongest ones into campaigns.`,
    last_updated: "2026-01-15",
  },
  {
    id: "g5",
    slug: "get-alderperson-to-sponsor-ordinance",
    title: "How to Get an Alderperson to Sponsor an Ordinance",
    order_number: 5,
    read_time_minutes: 6,
    why_use:
      "Use this when you have a policy proposal that requires City Council action and you need an alderperson to formally introduce it.",
    content_markdown: `## How Chicago ordinances work

An ordinance is a law passed by Chicago City Council. Any alderperson can introduce one. Once introduced, it is assigned to a committee, which holds a hearing and votes on whether to send it to the full Council for a vote. The mayor can also introduce ordinances, but most come from individual alderpeople.

You cannot introduce an ordinance yourself. You need an alderperson to sponsor it. That means convincing one of the 50 alderpeople that your proposal is worth attaching their name to and spending political capital on.

## Start with your own alderperson

Your alderperson is the most likely sponsor because you are their constituent. Find yours using the [Ward Office Finder](https://www.chicago.gov/city/en/depts/mayor/iframe/lookup_ward_and_alderman.html). Call their ward office and request a meeting. Do not email a cold pitch — call and ask for a scheduled sit-down.

## What to bring to the meeting

Bring a written policy proposal (see our [guide on writing one](/policy/guides/write-policy-proposal)). Bring evidence. Bring the names of other constituents who support it. If you have signatures or public comments, bring those too. The alderperson needs to see that this is not just your personal issue — it is a constituency issue.

Be specific about what you are asking: "We would like you to introduce an ordinance that does X." Not "We would like you to look into the problem of Y."

## If your alderperson says no

Ask why. If they give a substantive objection, address it and come back. If they are not interested, approach the alderperson who chairs the relevant committee. Housing issues go through the Committee on Housing and Real Estate. Zoning goes through Zoning, Landmarks and Building Standards. Public safety goes through Public Safety.

Committee chairs have outsized influence because they control what gets a hearing. If the committee chair sponsors your ordinance, it will get a hearing. If they do not, it might sit in committee indefinitely.

## Building support

One sponsor is the minimum. Multiple co-sponsors make an ordinance harder to ignore. After you secure a primary sponsor, ask them which colleagues might sign on. Approach those offices with a copy of the ordinance and a brief explaining the issue.

Twenty-six votes passes an ordinance. You need to get there. That is the math.`,
    last_updated: "2026-01-15",
  },
  {
    id: "g6",
    slug: "organize-sign-on-letter",
    title: "How to Organize a Sign-On Letter",
    order_number: 6,
    read_time_minutes: 5,
    why_use:
      "Use this when you want to demonstrate broad support for a position by collecting organizational and individual endorsements on a single letter to a decision-maker.",
    content_markdown: `## What a sign-on letter does

A sign-on letter is a document sent to a decision-maker that carries the endorsement of multiple organizations and individuals. It says: this is not one person's opinion — this is a coalition position. The recipient sees fifty organizations and three hundred individuals who all agree on a specific ask. That is harder to dismiss than a single comment.

## Write the letter first

Draft the letter before you start collecting signatures. People need to see what they are signing. Keep it to one page. Structure:

- **Opening**: Who is writing and why.
- **The ask**: One or two specific things you want the recipient to do.
- **The argument**: Three to five sentences explaining why.
- **Closing**: A deadline for response, if applicable.

Do not try to cover every angle. The letter should make one clear point with one clear ask. If you have five asks, you have five letters.

## Collecting signatures

Set up a simple form (Google Form works fine, or use Rooted Forward's campaign tools). For each signer, collect:

- Name
- Organization (if signing on behalf of one)
- Title
- Neighborhood or zip code

Set a deadline for signatures. Two weeks is standard. Send the form to every organization and individual you think might sign. Follow up once.

## Who to send it to

Address the letter to the specific person who can act on your request. CC their staff, the relevant committee, and any other officials who should see it. Send it as a PDF with all signatures listed. Include a cover page with the total count: "This letter has been signed by 47 organizations and 312 individuals."

## After you send it

Publish the letter and signer list on your website or social media. Notify local media. If you do not receive a response within two weeks, follow up with the recipient's office by phone. Ask for a meeting.

## When to use Rooted Forward's platform instead

If the issue is something Rooted Forward is already working on, submit signatures through our campaign pages instead of running a separate letter. Our platform tracks counts in real time, lets signers add personal comments, and compiles everything into a formatted delivery document. Check our [active campaigns](/policy) to see if there is already an effort underway.`,
    last_updated: "2026-01-15",
  },
];

/* ------------------------------------------------------------------ */
/*  Chicago Reference Links                                            */
/* ------------------------------------------------------------------ */

export const CHICAGO_REFERENCES: ReferenceLink[] = [
  {
    name: "Chicago City Clerk Legislative Tracker",
    url: "https://chicago.legistar.com",
    annotation: "Track ordinances, resolutions, and committee activity in real time.",
  },
  {
    name: "Chicago City Council Meetings",
    url: "https://www.chicityclerk.com/legislation-records/journals-and-reports/meetings",
    annotation: "Schedules, agendas, and archived journals.",
  },
  {
    name: "Ward Office Finder",
    url: "https://www.chicago.gov/city/en/depts/mayor/iframe/lookup_ward_and_alderman.html",
    annotation: "Find your alderperson by address.",
  },
  {
    name: "Illinois General Assembly Witness Slip Portal",
    url: "https://my.ilga.gov",
    annotation: "Register support or opposition on any state bill in committee.",
  },
  {
    name: "Chicago Department of Planning and Development",
    url: "https://www.chicago.gov/city/en/depts/dcd.html",
    annotation: "Zoning applications, community area plans, and public notices.",
  },
  {
    name: "Cook County Board of Commissioners",
    url: "https://www.cookcountyil.gov/agency/board-commissioners",
    annotation: "County-level agendas and meeting schedules.",
  },
  {
    name: "Chicago Metropolitan Agency for Planning (CMAP)",
    url: "https://www.cmap.illinois.gov",
    annotation: "Regional data on housing, transportation, and land use.",
  },
  {
    name: "Institute for Housing Studies at DePaul",
    url: "https://www.housingstudies.org",
    annotation: "Chicago housing data and research.",
  },
  {
    name: "Metropolitan Planning Council",
    url: "https://www.metroplanning.org",
    annotation: "Research archive on regional equity.",
  },
];

/* ------------------------------------------------------------------ */
/*  Placeholder approved comments (for campaign detail page)           */
/* ------------------------------------------------------------------ */

export const PLACEHOLDER_COMMENTS: ApprovedComment[] = [
  {
    id: "pc1",
    user_name: "Maria G.",
    neighborhood: "Woodlawn",
    comment_body:
      "I have lived in Woodlawn for twenty-two years. I moved here because it was one of the few neighborhoods where I could afford rent on a teaching salary. The rent on my apartment has gone up $400 in the last three years. I support this covenant because the people who stayed through the hard years should not be the ones pushed out when things finally improve.",
    created_at: "2026-03-10",
  },
  {
    id: "pc2",
    user_name: "Terrence W.",
    neighborhood: "South Shore",
    comment_body:
      "The Obama Center is going to be a good thing for the South Side. But good things can come with bad consequences if we do not plan for them. Fifteen years of rent protection is reasonable. It gives the neighborhood time to stabilize without losing the people who make it a neighborhood in the first place.",
    created_at: "2026-03-08",
  },
  {
    id: "pc3",
    user_name: "Diane L.",
    neighborhood: "Hyde Park",
    comment_body:
      "I watched what happened during the last round of urban renewal in Hyde Park. The University of Chicago cleared entire blocks of Black families in the name of neighborhood improvement. We have a chance to do this differently. The covenant is the minimum.",
    created_at: "2026-03-05",
  },
];
