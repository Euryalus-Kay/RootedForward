/**
 * Flag-gated events. These only appear in the pool when the player has
 * (or hasn't) set specific flags earlier. They are how the event feed
 * actually responds to player strategy, producing branching playthroughs.
 */

import type { GameEvent } from "./types";

export const GATED_EVENTS: GameEvent[] = [
  {
    id: "gated-tower-inspection-1982",
    year: { from: 1980, to: 1990 },
    title: "Tower-condition inspection",
    headline: "A federal inspector has been through the CHA towers in your ward.",
    body:
      "Her preliminary findings: elevators non-functional, plumbing failing, asbestos throughout. Her recommendation: designate for demolition, or commit to a $120M deep rehab. The inspector will wait 90 days for your answer.",
    lore:
      "Federal capital-needs assessments of CHA towers in the 1980s consistently recommended either major rehab or demolition. Most were demolished a decade later under HOPE VI.",
    source: "HUD CHA capital needs assessments 1982-1990",
    requires: ["tower-built"],
    blockedBy: ["tower-rehabbed", "tower-demo-planning"],
    options: [
      {
        label: "Commit to deep rehab; issue the bond",
        outcome: "committed to deep tower rehab",
        effect: {
          equity: 3,
          heritage: 3,
          sustainability: 2,
          capital: -3,
          setFlag: "tower-rehabbed",
        },
      },
      {
        label: "Designate for demolition; plan replacement units",
        outcome: "designated the tower for demolition",
        effect: {
          heritage: -2,
          equity: -1,
          setFlag: "tower-demo-planning",
        },
      },
      {
        label: "Defer the decision; do minimum maintenance",
        outcome: "deferred the tower decision",
        effect: { equity: -1, sustainability: -1, setFlag: "ada-deferred" },
      },
    ],
    glossary: ["CHA"],
  },
  {
    id: "gated-cra-enforcement-case-1985",
    year: { from: 1982, to: 1995 },
    title: "First CRA enforcement case",
    headline: "Your CRA office files its first formal complaint.",
    body:
      "A neighborhood S&L has been systematically refusing mortgages in the southern blocks for a decade despite rising deposits from those same blocks. Your office has the paper trail. The regulator is listening.",
    lore:
      "The first wave of CRA enforcement cases in the 1980s established the pattern for decades of subsequent neighborhood-scale compliance work.",
    source: "Woodstock Institute CRA enforcement case studies",
    requires: ["cra-office"],
    options: [
      {
        label: "File the formal complaint with a press strategy",
        outcome: "filed a public CRA complaint",
        effect: { equity: 4, knowledge: 2, power: -1 },
      },
      {
        label: "Negotiate a quiet settlement",
        outcome: "negotiated a quiet CRA settlement",
        effect: { equity: 2, capital: 2 },
      },
      {
        label: "Drop the case",
        outcome: "dropped the CRA case",
        effect: { equity: -2 },
      },
    ],
  },
  {
    id: "gated-ws-coalition-1985",
    year: { from: 1983, to: 1990 },
    title: "Washington coalition city council seat",
    headline: "A special-election seat is open. Your ward's turnout operation could decide it.",
    body:
      "The Vrdolyak 29 holds tight. Flipping this seat flips the council. Your ward's precinct operation is the deciding block.",
    lore:
      "Chicago's March 1986 special election in the 25th and 26th wards flipped the council from 29-21 to 25-25, ending Council Wars and freeing Washington's agenda briefly.",
    source: "Rivlin, Fire on the Prairie (1992)",
    requires: ["summit-enforced"],
    options: [
      {
        label: "Full ward mobilization for the Washington candidate",
        outcome: "delivered the ward for the Washington candidate",
        effect: { equity: 4, trust: 3, power: 2 },
      },
      {
        label: "Endorse but stay hands-off",
        outcome: "endorsed but stayed hands-off",
        effect: { equity: 1 },
      },
    ],
  },
  {
    id: "gated-gautreaux-family-arrive-1980",
    year: { from: 1978, to: 1995 },
    title: "Gautreaux family arrives",
    headline: "A Gautreaux relocation family moves into a ward two-flat.",
    body:
      "The program you backed is working. A family is settling. The block club is organizing a welcome. Your public role here matters.",
    lore:
      "Gautreaux participating families' outcomes tracked meaningfully with receiving-neighborhood integration support. Small ward-level choices had outsize effects.",
    source: "Rubinowitz and Rosenbaum, Crossing the Class and Color Lines (2000)",
    requires: ["gautreaux-backed"],
    options: [
      {
        label: "Attend the welcome; fund the block-club event",
        outcome: "publicly welcomed the Gautreaux family",
        effect: { equity: 3, trust: 2, heritage: 2 },
      },
      {
        label: "Send a staff member",
        outcome: "sent a staff member to the welcome",
        effect: { equity: 1, trust: 1 },
      },
    ],
  },
  {
    id: "gated-foreclosure-wave-2008-prepared",
    year: { from: 2007, to: 2010 },
    title: "Foreclosure wave — your infrastructure ready",
    headline: "The 2008 crisis hits. Your foreclosure-prevention office is already open.",
    body:
      "The ward's 1998-era foreclosure-prevention office has been waiting for this crisis. Legal aid on speed dial; Section 235 paperwork templates on file. The wave will be devastating everywhere else; here it's merely damaging.",
    lore:
      "Chicago neighborhoods with pre-existing foreclosure-prevention infrastructure (NHS Chicago, LISC) had materially better 2008-2012 outcomes than neighborhoods without.",
    source: "Housing Action Illinois subprime crisis reports",
    requires: ["cra-office"],
    options: [
      {
        label: "Activate full prevention protocol; mass intake week",
        outcome: "ran a mass foreclosure-prevention intake week",
        effect: {
          equity: 5,
          heritage: 3,
          trust: 2,
          transformParcels: [
            { selector: "owner:absentee", set: { owner: "resident" } },
          ],
        },
      },
      {
        label: "Standard response",
        outcome: "ran standard foreclosure response",
        effect: { equity: 2, heritage: 1 },
      },
    ],
  },
  {
    id: "gated-climate-flood-mitigated",
    year: { from: 2025, to: 2040 },
    title: "Flood hits — mitigation holds",
    headline: "A 100-year storm. Your green infrastructure does the work it was designed for.",
    body:
      "Basements are dry where bioswales were installed. Combined-sewer overflow events in the ward are 90% down versus adjacent wards. The city's adaptation planners are taking notes.",
    lore:
      "Chicago's Green Alley Program post-2006 and bioswale neighborhoods have documented measurable flood-event mitigation versus controls.",
    source: "Chicago Green Alley Program evaluation; MWRD basement-flood data",
    requires: ["green-infrastructure", "climate-plan-active"],
    options: [
      {
        label: "Publish the outcomes, press for citywide scaling",
        outcome: "published flood-mitigation outcomes",
        effect: { sustainability: 4, knowledge: 2, equity: 1 },
      },
      {
        label: "Do the quiet work",
        outcome: "did the quiet work without scaling",
        effect: { sustainability: 2, heritage: 1 },
      },
    ],
  },
  {
    id: "gated-heat-wave-2032",
    year: { from: 2028, to: 2040 },
    title: "Heat dome — mitigation holds",
    headline: "Three days above 110°F. Your heat-island work saves lives.",
    body:
      "Tree canopy and cool roofs drop street temperatures 4-5°F versus unmitigated wards. Elder mortality in the ward is 70% below citywide rate. The 1995-heat-wave comparisons are striking.",
    lore:
      "Tree-canopy interventions have measurable heat-mortality effects in peer-reviewed studies including Hoffman et al. 2020.",
    source: "Hoffman et al., 'Disparities in the Cooling Effect of Tree Canopy' (2020)",
    requires: ["heat-mitigation-active"],
    blockedBy: [],
    options: [
      {
        label: "Serve as citywide coordinator for heat response",
        outcome: "coordinated citywide heat response",
        effect: { sustainability: 3, equity: 3, heritage: 2, power: 2 },
      },
      {
        label: "Focus on the ward",
        outcome: "focused heat response on the ward",
        effect: { sustainability: 3, equity: 2, heritage: 1 },
      },
    ],
  },
  {
    id: "gated-rle-opens-safe-2032",
    year: { from: 2030, to: 2040 },
    title: "Red Line Extension opens — displacement contained",
    headline: "Station opens. Rents hold. Residents stay.",
    body:
      "Your pre-station affordability lock-in holds. Two years after opening, displacement monitoring shows rent increases under 8% ward-wide — a fraction of the 40% projected without the lock-in.",
    lore:
      "Pre-station affordability covenants have demonstrable effects in peer-reviewed displacement studies.",
    source: "DePaul IHS transit-displacement research",
    requires: ["rle-affordability-locked", "transit-extension"],
    options: [
      {
        label: "Public celebration; make the ward the displacement-prevention case study",
        outcome: "made the ward the displacement-prevention case study",
        effect: { equity: 5, heritage: 3, sustainability: 3, knowledge: 2 },
      },
    ],
  },
  {
    id: "gated-tower-rehab-paying-off",
    year: { from: 2020, to: 2040 },
    title: "Rehabbed tower pays off",
    headline: "Twenty years into the rehab. The building is beloved.",
    body:
      "Your decision to rehab rather than demolish has produced one of Chicago's most stable working-class buildings. Tenant tenure averages 18 years. Community life is dense. The building is a case study.",
    lore:
      "Dearborn Homes' 2020-era condition and tenant stability has been a model for subsequent CHA rehabs.",
    source: "CHA Dearborn Homes post-rehab reports",
    requires: ["tower-rehabbed"],
    options: [
      {
        label: "Commission a documentary; preserve the story",
        outcome: "commissioned a documentary about the rehab",
        effect: { heritage: 4, equity: 2, knowledge: 2 },
      },
      {
        label: "Keep it operational; no fuss",
        outcome: "kept the rehab operational without fanfare",
        effect: { heritage: 2, equity: 2, sustainability: 1 },
      },
    ],
  },
  {
    id: "gated-reparations-scaled-outcome",
    year: { from: 2030, to: 2040 },
    title: "Reparations ordinance delivers",
    headline: "Ten years of reparations housing grants. Outcomes documented.",
    body:
      "The program has moved 400 families into homeownership, 80% descendants of redlining-era families. Down-payment grants averaged $45K. Second-generation outcomes are the first rigorous evidence base for urban reparations.",
    lore:
      "Evanston's Restorative Housing Program began disbursing 2021. Longitudinal outcomes data will be decisive for national reparations policy.",
    source: "Evanston Restorative Housing Program longitudinal reports",
    requires: ["reparations-passed"],
    options: [
      {
        label: "Fund the outcome study; publish the evidence",
        outcome: "funded the reparations outcomes study",
        effect: { equity: 5, heritage: 3, knowledge: 3 },
      },
    ],
  },
  {
    id: "gated-expressway-cap-ceremony",
    year: { from: 2035, to: 2040 },
    title: "Expressway cap ribbon-cutting",
    headline: "The park over the interstate opens.",
    body:
      "Half a mile of decked park. Housing on top. The wound the expressway made in the 1960s is — not healed, but stitched. A quiet ceremony includes descendants of residents displaced in the original construction.",
    lore:
      "Expressway-cap projects including Boston's Rose Kennedy Greenway have been opened with explicit reference to original displacement.",
    source: "Boston Greenway dedication records",
    requires: ["expressway-built"],
    blockedBy: [],
    options: [
      {
        label: "Full ceremony with displacement acknowledgment",
        outcome: "cut the ribbon with a displacement acknowledgment",
        effect: { heritage: 5, equity: 2, sustainability: 3 },
      },
      {
        label: "Quiet opening",
        outcome: "had a quiet cap opening",
        effect: { heritage: 2, sustainability: 2 },
      },
    ],
  },
];
