/**
 * Random events. Each year, the engine rolls to fire 0-2 events from the
 * pool of events whose year window includes the current year. Events
 * present the player with a forced choice that costs no resources to
 * resolve, but each option has different score and parcel consequences.
 *
 * Events are the historical pressure of the era pushing on Parkhaven.
 * Most have a "do nothing" option, which still has consequences.
 */

import type { GameEvent } from "./types";

export const EVENTS: GameEvent[] = [
  /* ---------- 1940s ---------- */
  {
    id: "great-migration-wave",
    year: { from: 1940, to: 1955 },
    title: "Great Migration arrival",
    headline: "The Illinois Central pulls in another full train.",
    body: "Twenty-eight families arrived this morning from Mississippi, Alabama, and Arkansas. They are looking for work and a place to live. Where do they go?",
    lore: "Between 1916 and 1970, six million Black Americans left the South for the North and West. Chicago's Black population grew from 44,000 in 1910 to 813,000 by 1960. Most arrivals could only legally rent in the narrow 'Black Belt' along South State Street.",
    source: "Wilkerson, The Warmth of Other Suns (2010)",
    weight: 3,
    options: [
      {
        label: "Open the central blocks",
        outcome: "you opened the central blocks to the new arrivals",
        effect: {
          equity: 3,
          heritage: 2,
          trust: 1,
          message: "28 families settle in the central blocks.",
          transformParcels: [
            { selector: "block:2", delta: { residents: 5 } },
          ],
        },
      },
      {
        label: "Concentrate them in the south",
        outcome: "you steered the new arrivals into the south blocks",
        effect: {
          equity: -2,
          heritage: -1,
          message: "Pressure builds in the south blocks.",
          transformParcels: [
            { selector: "block:5", delta: { residents: 8 } },
          ],
        },
      },
    ],
    glossary: ["Bronzeville"],
  },
  {
    id: "race-restriction-test",
    year: { from: 1944, to: 1948 },
    title: "Restrictive covenant test",
    headline: "A Black family signs a deed in the northern blocks. Neighbors threaten suit.",
    body: "The covenant on the deed predates Shelley v. Kraemer. The Property Owners Association is mobilizing. The family is asking the city to back them up.",
    lore: "Shelley v. Kraemer (1948) made racial covenants unenforceable in courts. Cases pre-Shelley often turned on whether the city would enforce or stand aside. Chicago largely sided with white owners until federal courts forced its hand.",
    source: "Shelley v. Kraemer, 334 U.S. 1 (1948)",
    options: [
      {
        label: "Back the family publicly",
        outcome: "you publicly backed the family",
        effect: { equity: 3, trust: 2, power: -1 },
      },
      {
        label: "Stay neutral",
        outcome: "you stayed neutral on the covenant test",
        effect: { equity: -2, heritage: -1 },
      },
      {
        label: "Side with the Association",
        outcome: "you sided with the Property Owners Association",
        effect: { equity: -3, capital: 2, power: 1, heritage: -2 },
      },
    ],
    glossary: ["Covenants"],
  },
  {
    id: "fha-redline-confirmation",
    year: { from: 1942, to: 1955 },
    title: "FHA redlines the southern blocks",
    headline: "Federal underwriters confirm: no FHA mortgages south of the line.",
    body: "Banks will follow the FHA. The southern blocks are about to lose access to long-term lending. Speculators are circling.",
    lore: "The FHA Underwriting Manual through 1947 explicitly directed appraisers to mark down properties in or near majority-Black neighborhoods. The manual was revised but the practice continued informally for decades.",
    source: "FHA Underwriting Manual (1938 edition)",
    weight: 1,
    options: [
      {
        label: "Lobby for federal review",
        outcome: "you lobbied federal regulators for a review",
        effect: { power: -2, equity: 2, knowledge: 1 },
      },
      {
        label: "Stand up a local lending pool",
        outcome: "you stood up a local lending pool",
        effect: { capital: -3, equity: 4, trust: 2 },
      },
      {
        label: "Accept the redline",
        outcome: "you accepted the redline",
        effect: { equity: -3, heritage: -2 },
      },
    ],
    glossary: ["HOLC", "FHA", "Redlining"],
  },

  /* ---------- 1950s ---------- */
  {
    id: "blockbuster-arrives",
    year: { from: 1950, to: 1968 },
    title: "Blockbusters working the blocks",
    headline: "A real-estate broker is calling every white homeowner in the central blocks. The pitch is panic.",
    body: "He says Black families are moving in and they should sell now before values crash. The owners who sell are paid less than market. The same broker resells to Black families at a premium.",
    lore: "Blockbusting was a documented Chicago practice through the 1960s. The brokers worked door-to-door in target blocks, often with newspaper plants confirming neighborhood transition.",
    source: "Satter, Family Properties (2009), ch. 4",
    weight: 2,
    options: [
      {
        label: "Pass an anti-solicitation ordinance",
        outcome: "you banned door-to-door real-estate solicitation",
        effect: { equity: 2, power: -1, heritage: 2 },
      },
      {
        label: "Publish a list of his transactions",
        outcome: "you publicly named the blockbuster",
        effect: { equity: 3, knowledge: 1, power: -2 },
      },
      {
        label: "Do nothing",
        outcome: "you did nothing about the blockbuster",
        effect: { equity: -3, heritage: -3, capital: 1 },
      },
    ],
    glossary: ["Blockbusting"],
  },
  {
    id: "dan-ryan-extension",
    year: { from: 1956, to: 1965 },
    title: "Federal expressway proposal",
    headline: "The state DOT wants to widen the expressway through the western edge.",
    body: "Federal funds will demolish six more parcels and connect Parkhaven to downtown. The residents on those blocks have lived there forty years.",
    lore: "Mayor Daley widened the Dan Ryan in 1962 specifically to prevent Black residents from spreading west of the line. The expressway became a permanent racial boundary.",
    source: "Cohen and Taylor, American Pharaoh (2000)",
    options: [
      {
        label: "Approve the widening",
        outcome: "you approved the expressway widening",
        effect: {
          growth: 3,
          capital: 3,
          heritage: -3,
          equity: -3,
          sustainability: -3,
          transformParcels: [
            { selector: "first-of-type:single-family", set: { type: "expressway", residents: 0, owner: "city" } },
          ],
        },
      },
      {
        label: "Reject the widening",
        outcome: "you rejected the expressway widening",
        effect: { heritage: 3, equity: 3, capital: -2, power: -1 },
      },
    ],
    glossary: ["Expressway"],
  },

  /* ---------- 1960s ---------- */
  {
    id: "king-march-on-marquette",
    year: { from: 1966, to: 1967 },
    title: "Open Housing March",
    headline: "Dr. King is leading a march into Marquette Park. Will Parkhaven send people?",
    body: "The march is asking northern white neighborhoods to accept Black neighbors. Counter-protesters are massing along the route. King got hit in the head with a rock at a previous march.",
    lore: "The Chicago Freedom Movement marches into Marquette Park in 1966 drew large violent counter-protests. King later said he had not seen mobs as hostile in the South.",
    source: "Ralph, Northern Protest (1993)",
    options: [
      {
        label: "Send a contingent from Parkhaven",
        outcome: "you sent a contingent to march with King",
        effect: { equity: 3, heritage: 3, trust: 2, power: -1 },
      },
      {
        label: "Issue a statement of support",
        outcome: "you issued a statement supporting the march",
        effect: { equity: 1, trust: 1 },
      },
      {
        label: "Stay quiet",
        outcome: "you stayed quiet about the march",
        effect: { equity: -2 },
      },
    ],
    glossary: ["ChicagoFreedomMovement"],
  },
  {
    id: "summit-agreement-pressure",
    year: { from: 1966, to: 1968 },
    title: "The Summit Agreement is on the table",
    headline: "Daley wants Parkhaven to endorse the Summit Agreement and end the marches.",
    body: "The agreement has vague language and no enforcement mechanism. Endorsement gets you political capital with Daley. Refusal makes you difficult.",
    lore: "The Summit Agreement (1966) ended the Chicago Open Housing Movement marches. Daley signed and then did not enforce. King later said it was 'a paper victory.'",
    source: "Garrow, Bearing the Cross (1986)",
    options: [
      {
        label: "Endorse the Summit",
        outcome: "you endorsed the Summit Agreement",
        effect: { capital: 2, power: 2, equity: -2, heritage: -1 },
      },
      {
        label: "Hold out for enforcement language",
        outcome: "you held out for enforcement language",
        effect: { equity: 3, heritage: 2, power: -2 },
      },
    ],
    glossary: ["ChicagoFreedomMovement"],
  },
  {
    id: "fair-housing-act",
    year: { from: 1968, to: 1970 },
    title: "Fair Housing Act passes",
    headline: "Title VIII of the Civil Rights Act of 1968 is law.",
    body: "Discrimination in housing sales and rentals is now federally illegal. Enforcement is left to local governments and HUD complaints.",
    lore: "The Fair Housing Act passed one week after Dr. King's assassination, in part because of the urban uprisings that followed. The law had teeth on paper. Enforcement was famously weak for the next forty years.",
    source: "Civil Rights Act of 1968, Title VIII",
    weight: 0.5,
    options: [
      {
        label: "Stand up an enforcement office",
        outcome: "you funded a local fair-housing enforcement office",
        effect: { equity: 4, power: -1, capital: -2, knowledge: 1 },
      },
      {
        label: "Refer complaints to HUD",
        outcome: "you referred fair-housing complaints to HUD",
        effect: { equity: 1 },
      },
    ],
  },
  {
    id: "contract-buyers-form",
    year: { from: 1968, to: 1971 },
    title: "Contract Buyers League forms",
    headline: "Five hundred Parkhaven families have organized a payment strike.",
    body: "They want speculators to renegotiate contracts at fair-market rates. They are asking for the city's backing. The speculators are threatening mass eviction.",
    lore: "The Contract Buyers League's 1968 strike was the largest organized challenge to predatory home-sale practices in U.S. history. Some families won renegotiated terms. Others lost their homes.",
    source: "Satter, Family Properties (2009)",
    options: [
      {
        label: "Back the strike publicly",
        outcome: "you publicly backed the Contract Buyers League",
        effect: { equity: 4, heritage: 3, trust: 3, power: -2 },
      },
      {
        label: "Mediate quietly",
        outcome: "you tried to mediate the contract dispute",
        effect: { equity: 1, knowledge: 1 },
      },
      {
        label: "Stay neutral",
        outcome: "you stayed neutral on the contract dispute",
        effect: { equity: -3, heritage: -2 },
      },
    ],
    glossary: ["ContractBuying"],
  },

  /* ---------- 1970s ---------- */
  {
    id: "gautreaux-decision",
    year: { from: 1976, to: 1978 },
    title: "Hills v. Gautreaux decided",
    headline: "The Supreme Court rules unanimously: scattered-site public housing must include the suburbs.",
    body: "CHA must offer Parkhaven families relocation to majority-white neighborhoods if they want it. Some families want to go. Others want to stay. The fight is over how the program is administered.",
    lore: "About 7,000 families participated in the Gautreaux relocation program over 25 years. Longitudinal studies by James Rosenbaum found large gains for participants.",
    source: "Hills v. Gautreaux, 425 U.S. 284 (1976)",
    options: [
      {
        label: "Run a strong relocation program",
        outcome: "you ran a strong Gautreaux relocation program",
        effect: { equity: 5, knowledge: 2, capital: -3 },
      },
      {
        label: "Run a minimal program",
        outcome: "you ran a minimal Gautreaux relocation program",
        effect: { equity: 1 },
      },
    ],
    glossary: ["Gautreaux"],
  },
  {
    id: "cha-tower-deterioration",
    year: { from: 1975, to: 1995 },
    title: "Tower elevator failures",
    headline: "The third elevator failure this month at the CHA tower.",
    body: "Residents are organizing. The CHA can fund repairs but only by cutting somewhere else. There is also growing pressure to demolish entirely.",
    lore: "By the 1980s, ongoing maintenance failures at CHA high-rises had made elevator outages a daily reality. Many residents could not access their apartments. The political momentum to demolish grew through the 1990s.",
    source: "Hunt, Blueprint for Disaster (2009)",
    requires: ["tower-built"],
    options: [
      {
        label: "Fund the elevator overhaul",
        outcome: "you funded a major elevator overhaul",
        effect: {
          capital: -3,
          equity: 3,
          heritage: 2,
          transformParcels: [
            { selector: "type:tower", delta: { condition: 15 } },
          ],
        },
      },
      {
        label: "Begin planning demolition",
        outcome: "you began planning tower demolition",
        effect: { equity: -2, heritage: -3, growth: 1, setFlag: "tower-demo-planning" },
      },
    ],
    glossary: ["CHA"],
  },
  {
    id: "harold-washington-coalition",
    year: { from: 1983, to: 1987 },
    title: "Harold Washington's coalition wants Parkhaven",
    headline: "The new mayor's coalition is reorganizing budget priorities.",
    body: "Parkhaven can join the coalition and get neighborhood-investment funds, but doing so puts you on the wrong side of the old machine.",
    lore: "Harold Washington was Chicago's first Black mayor (1983-1987). His coalition redirected significant city resources to South and West Side neighborhoods. The 'Council Wars' between his bloc and the old machine bloc paralyzed the council for two years.",
    source: "Rivlin, Fire on the Prairie (1992)",
    options: [
      {
        label: "Join the Washington coalition",
        outcome: "you joined the Washington coalition",
        effect: { equity: 4, heritage: 2, capital: 2, power: -2 },
      },
      {
        label: "Stay neutral",
        outcome: "you stayed neutral in the Council Wars",
        effect: { capital: 1 },
      },
    ],
  },

  /* ---------- 1990s ---------- */
  {
    id: "plan-for-transformation",
    year: { from: 1999, to: 2002 },
    title: "Plan for Transformation arrives",
    headline: "The CHA wants to demolish the towers and rebuild as mixed-income.",
    body: "The plan promises one-for-one replacement of public-housing units. The track record on similar promises is around 60 percent. Tens of thousands of families across Chicago will be affected.",
    lore: "The Plan for Transformation, launched 1999, was the largest public-housing redevelopment in U.S. history. The actual replacement rate ran around 60 percent. Tens of thousands of CHA residents were displaced.",
    source: "Chaskin and Joseph, Integrating the Inner City (2015)",
    requires: ["tower-built"],
    options: [
      {
        label: "Demolish for mixed-income",
        outcome: "you demolished the towers for mixed-income",
        effect: {
          equity: -2,
          heritage: -3,
          growth: 4,
          transformParcels: [
            { selector: "type:tower", set: { type: "courtyard", residents: 80, owner: "developer" } },
          ],
        },
      },
      {
        label: "Negotiate one-for-one replacement",
        outcome: "you negotiated for one-for-one replacement",
        effect: { equity: 2, heritage: -1, growth: 2, knowledge: 1 },
      },
      {
        label: "Rehab in place",
        outcome: "you chose rehab over demolition",
        effect: { equity: 4, heritage: 4, capital: -3 },
      },
    ],
    glossary: ["PlanForTransformation"],
  },

  /* ---------- 2000s ---------- */
  {
    id: "section-3-jobs",
    year: { from: 2000, to: 2010 },
    title: "Section 3 jobs program",
    headline: "Federal HUD-funded construction must hire local low-income workers.",
    body: "Local enforcement of Section 3 has been weak for decades. With effort, you can use it to put Parkhaven residents to work on the new construction.",
    lore: "Section 3 of the 1968 Housing Act requires HUD-funded construction to prioritize hiring of low-income local residents. Chicago compliance has historically been low. Activist organizations like the Coalition for the Homeless have pushed for stronger enforcement.",
    source: "HUD Section 3 program guidance",
    options: [
      {
        label: "Enforce Section 3 strictly",
        outcome: "you strictly enforced Section 3 hiring",
        effect: { equity: 3, heritage: 1, growth: 1 },
      },
      {
        label: "Use the standard waivers",
        outcome: "you used the standard Section 3 waivers",
        effect: { equity: -1, growth: 1 },
      },
    ],
  },
  {
    id: "obama-presidential-center",
    year: { from: 2015, to: 2025 },
    title: "Major institutional development",
    headline: "A presidential library, a major museum, or a research campus is sited in Parkhaven.",
    body: "It will bring jobs, visitors, and pressure on housing. Without a CBA, displacement risk is severe.",
    lore: "The Obama Presidential Center on Chicago's South Side faced years of negotiation over a community benefits agreement. Activists pushed for tenant protections; opponents argued the center itself would be a community benefit.",
    source: "Coverage of the Obama Presidential Center community benefits agreement debate (2018-2021)",
    options: [
      {
        label: "Demand a binding CBA",
        outcome: "you negotiated a binding community benefits agreement",
        effect: { equity: 4, heritage: 2, growth: 3, power: -2 },
      },
      {
        label: "Welcome the project",
        outcome: "you welcomed the institutional project",
        effect: { growth: 5, capital: 3, equity: -2 },
      },
    ],
  },
  {
    id: "great-recession-foreclosures",
    year: { from: 2007, to: 2012 },
    title: "Foreclosure wave",
    headline: "Subprime loans are blowing up across the south blocks.",
    body: "Tax-lien speculators are buying foreclosed properties cheap. The Cook County Land Bank could intervene if it had the funds.",
    lore: "The 2008 financial crisis hit Chicago Black neighborhoods especially hard because subprime lenders had aggressively targeted them through the 2000s. South Side blocks lost 50-60 percent of their median value. Speculators bought the foreclosed properties wholesale.",
    source: "Cook County Land Bank Authority foreclosure-recovery reports",
    options: [
      {
        label: "Fund the Land Bank to acquire",
        outcome: "you funded the Land Bank to acquire foreclosed parcels",
        effect: {
          capital: -4,
          equity: 4,
          heritage: 3,
          transformParcels: [
            { selector: "random:5", set: { owner: "land-trust", protected: true } },
          ],
        },
      },
      {
        label: "Accept the speculator buyout",
        outcome: "you accepted the speculator buyout of foreclosed parcels",
        effect: {
          equity: -3,
          heritage: -2,
          capital: 2,
          transformParcels: [
            { selector: "random:5", set: { owner: "speculator" } },
          ],
        },
      },
    ],
  },

  /* ---------- 2010s ---------- */
  {
    id: "school-closures-2013",
    year: { from: 2013, to: 2014 },
    title: "CPS announces school closures",
    headline: "Fifty schools, almost all on the South and West Side, are slated for closure.",
    body: "Parkhaven loses one of its three elementary schools unless the closure is fought.",
    lore: "Chicago closed 50 neighborhood schools in 2013 in the largest single round of urban school closures in U.S. history. The closures hit majority-Black neighborhoods almost exclusively.",
    source: "Chicago Public Schools 2013 school closure documentation",
    options: [
      {
        label: "Fight the closure",
        outcome: "you fought the school closure",
        effect: { equity: 3, heritage: 3, trust: 2, power: -2 },
      },
      {
        label: "Negotiate consolidation terms",
        outcome: "you negotiated consolidation terms",
        effect: { equity: -1, knowledge: 1 },
      },
      {
        label: "Accept the closure",
        outcome: "you accepted the school closure",
        effect: { equity: -3, heritage: -3 },
      },
    ],
  },
  {
    id: "logan-square-displacement",
    year: { from: 2014, to: 2025 },
    title: "Logan Square pattern arrives",
    headline: "Latino families are leaving the western blocks. White professionals are buying.",
    body: "The pattern is the same as Logan Square: 47 percent Latino population loss over 20 years. Anti-displacement coalitions can slow it but not stop it without more tools.",
    lore: "WBEZ documented Logan Square's loss of 20,000 Latino residents between 2000 and 2020. Adjacent white population grew by 12,000. Pilsen has lost 14,000 Latino residents in the same period.",
    source: "WBEZ, How Logan Square Lost 20,000 Latino Residents (2024)",
    options: [
      {
        label: "Pass anti-displacement protections",
        outcome: "you passed anti-displacement protections",
        effect: {
          equity: 4,
          heritage: 3,
          growth: -1,
          transformParcels: [
            { selector: "block:3", set: { protected: true } },
          ],
        },
      },
      {
        label: "Let the market run",
        outcome: "you let the displacement pattern run",
        effect: {
          equity: -4,
          heritage: -4,
          growth: 3,
          transformParcels: [
            { selector: "block:3", delta: { value: 12, memory: -10 } },
          ],
        },
      },
    ],
    glossary: ["Gentrification", "Displacement"],
  },
  {
    id: "covid-eviction-wave",
    year: { from: 2020, to: 2022 },
    title: "Pandemic eviction wave",
    headline: "Federal eviction moratorium is ending. Backlogged cases will hit Parkhaven hard.",
    body: "Mutual aid networks are running rent-relief funds. The city can supplement with general funds.",
    lore: "The federal CDC eviction moratorium ran from September 2020 to August 2021 when the Supreme Court struck it down. The wave of evictions that followed was partially absorbed by the Emergency Rental Assistance Program.",
    source: "Eviction Lab tracking, Princeton (2020-2023)",
    options: [
      {
        label: "Fund emergency rental assistance",
        outcome: "you funded emergency rental assistance",
        effect: { capital: -3, equity: 4, trust: 2 },
      },
      {
        label: "Defer to mutual aid",
        outcome: "you deferred to mutual aid networks",
        effect: { equity: 1, trust: 1 },
      },
      {
        label: "Let the wave hit",
        outcome: "you let the eviction wave hit",
        effect: { equity: -4, heritage: -3 },
      },
    ],
  },

  /* ---------- 2020s and beyond ---------- */
  {
    id: "rle-announcement",
    year: { from: 2026, to: 2032 },
    title: "Red Line Extension station siting",
    headline: "CTA wants to put a Red Line station in Parkhaven.",
    body: "Construction starts in three years. Land values within a half-mile will jump 40 percent in two years. Without preservation overlays first, the activity becomes displacement.",
    lore: "The CTA's Red Line Extension cost $5.75B for 5.6 miles, fully funded December 2024. CTA projected $1.7B in associated real-estate activity. Communities like Far South Side organized for years to ensure the extension actually came; the displacement risk is the next challenge.",
    source: "FTA Full Funding Grant Agreement (Dec 2024)",
    options: [
      {
        label: "Accept the station with preservation locked in",
        outcome: "you locked in preservation before accepting the station",
        effect: {
          equity: 4,
          heritage: 4,
          growth: 3,
          sustainability: 4,
          transformParcels: [
            { selector: "first-of-type:vacant", set: { type: "transit", owner: "city" } },
          ],
          setFlag: "transit-extension",
        },
      },
      {
        label: "Accept the station now, sort it out later",
        outcome: "you accepted the station without preservation overlays",
        effect: {
          equity: -3,
          heritage: -3,
          growth: 5,
          sustainability: 3,
          capital: 3,
          transformParcels: [
            { selector: "first-of-type:vacant", set: { type: "transit", owner: "city" } },
            { selector: "block:4", delta: { value: 15, memory: -8 } },
          ],
          setFlag: "transit-extension",
        },
      },
      {
        label: "Defer the station",
        outcome: "you deferred the Red Line Extension",
        effect: { equity: 1, sustainability: -2 },
      },
    ],
    glossary: ["RedLineExtension"],
  },
  {
    id: "climate-flood-event",
    year: { from: 2025, to: 2040 },
    title: "Major basement flooding",
    headline: "Three days of rain. Hundreds of basements flooded across the south blocks.",
    body: "Chicago's combined sewer system is overwhelmed. Green infrastructure investment can prevent future floods. Doing nothing means insurance premiums will rise sharply.",
    lore: "Chicago's combined sewer system, designed in the late 1800s, is increasingly overwhelmed by climate-intensified storms. South and West Side basements flood disproportionately. Insurance carriers have begun pulling out of high-risk Chicago zip codes.",
    source: "City of Chicago Department of Water Management 2023 stormwater plan",
    options: [
      {
        label: "Fund a green-infrastructure overhaul",
        outcome: "you funded a green-infrastructure overhaul",
        effect: { capital: -4, sustainability: 5, equity: 3, heritage: 2 },
      },
      {
        label: "Patch the worst spots",
        outcome: "you patched the worst flooded spots",
        effect: { capital: -1, sustainability: 1 },
      },
      {
        label: "Defer",
        outcome: "you deferred the stormwater investment",
        effect: { sustainability: -3, equity: -2 },
      },
    ],
  },
  {
    id: "ami-reform-debate",
    year: { from: 2022, to: 2030 },
    title: "AMI reform debate",
    headline: "Affordable-housing advocates want to switch from regional AMI to neighborhood AMI.",
    body: "Regional AMI floats high enough that 'affordable' rents are unaffordable to long-term Parkhaven residents. Neighborhood AMI would set the bar lower but reduce the per-unit subsidy that flows in.",
    lore: "Regional AMI in expensive metros floats high because it averages across rich and poor counties. New York City, San Francisco, and Boston have all considered neighborhood AMI as an alternative.",
    source: "Furman Center NYC AMI analyses (2019)",
    options: [
      {
        label: "Push for neighborhood AMI",
        outcome: "you pushed for neighborhood AMI",
        effect: { equity: 4, growth: -2, knowledge: 2 },
      },
      {
        label: "Keep the regional AMI",
        outcome: "you kept the regional AMI standard",
        effect: { growth: 1, equity: -2 },
      },
    ],
    glossary: ["AMI"],
  },
  {
    id: "ai-rental-screening-scandal",
    year: { from: 2024, to: 2035 },
    title: "AI tenant-screening scandal",
    headline: "An algorithmic screening tool is rejecting Parkhaven applicants at three times the rate of comparable applicants in white neighborhoods.",
    body: "Federal lawsuit pending. The city can ban algorithmic screening citywide or wait for the federal ruling.",
    lore: "Tenant-screening algorithms have been documented to discriminate against Black applicants and voucher holders. The federal Reveal investigation in 2020 mapped the patterns; lawsuits proceeded slowly through the late 2020s.",
    source: "Reveal CIR investigation of tenant-screening algorithms (2020)",
    options: [
      {
        label: "Ban algorithmic tenant screening",
        outcome: "you banned algorithmic tenant screening",
        effect: { equity: 4, knowledge: 1 },
      },
      {
        label: "Require disclosure only",
        outcome: "you required disclosure of algorithmic screening",
        effect: { equity: 1, knowledge: 1 },
      },
      {
        label: "Wait for the federal ruling",
        outcome: "you waited for the federal ruling",
        effect: { equity: -2 },
      },
    ],
  },

  /* ---------- ANYTIME / GENERIC ---------- */
  {
    id: "small-fire-disaster",
    year: { from: 1940, to: 2040 },
    title: "Building fire",
    headline: "A two-flat burned tonight. The family is at the church across the street.",
    body: "City emergency funds can rebuild. The family wants to come back. Without funds they have nowhere to go.",
    lore: "Building fires displace tens of thousands of Chicagoans annually. Insurance gaps mean uninsured renters often lose everything. The city's emergency-housing assistance is chronically under-resourced.",
    source: "Chicago Fire Department incident reports",
    weight: 2,
    options: [
      {
        label: "Fund full rebuild from city emergency reserves",
        outcome: "you funded the family's full rebuild",
        effect: { capital: -3, equity: 3, trust: 2, growth: -1 },
      },
      {
        label: "Partner with a church to co-fund a temporary placement",
        outcome: "you co-funded a temporary placement with the church",
        effect: { capital: -1, equity: 1, trust: 2, heritage: 1 },
      },
      {
        label: "Use the incident to push the state for housing funds",
        outcome: "you used the fire to push the state for housing funds",
        effect: { equity: 2, power: -2, knowledge: 1 },
      },
    ],
  },
  {
    id: "neighbor-organized-cleanup",
    year: { from: 1940, to: 2040 },
    title: "Neighbors organize a cleanup",
    headline: "A block club has organized a Saturday cleanup of vacant lots.",
    body: "The cleanup will pull you from another priority. The block club wants tangible support; the ward budget is tight this month.",
    lore: "Chicago block-club tradition is uniquely strong. Block-club registration with the city dates to the 1930s. Active block clubs are correlated with measurable improvements in nuisance-call resolution.",
    source: "City of Chicago Block Club registration data",
    weight: 2,
    options: [
      {
        label: "Full support: dumpsters, porta-potties, music",
        outcome: "you sent full support to the cleanup",
        effect: { capital: -2, trust: 3, heritage: 2, power: -1 },
      },
      {
        label: "Show up personally, keep it informal",
        outcome: "you showed up personally at the cleanup",
        effect: { trust: 2, capital: 0, heritage: 1, power: -1 },
      },
      {
        label: "Redirect their energy into the official permit process",
        outcome: "you redirected the cleanup into an official process",
        effect: { trust: -1, capital: 1, power: 1, heritage: -1 },
      },
    ],
  },
  {
    id: "rookie-organizer-arrives",
    year: { from: 1965, to: 2040 },
    title: "A young organizer wants to talk",
    headline: "A new arrival, just out of college, wants to start a tenant organizing project.",
    body: "She has Saul Alinsky's book and a stack of business cards. She wants city support to start.",
    lore: "Saul Alinsky's Industrial Areas Foundation began in Back of the Yards, Chicago, in 1939. The Alinsky model of community organizing has shaped tenant-organizing tradition nationally.",
    source: "Alinsky, Reveille for Radicals (1946)",
    weight: 1,
    options: [
      {
        label: "Fund a small organizing grant",
        outcome: "you funded a small organizing grant",
        effect: { capital: -1, trust: 3, equity: 1, knowledge: 1 },
      },
      {
        label: "Connect her to existing groups",
        outcome: "you connected the organizer to existing groups",
        effect: { trust: 1 },
      },
    ],
  },
  {
    id: "cultural-festival",
    year: { from: 1970, to: 2040 },
    title: "Annual cultural festival",
    headline: "The neighborhood association wants to throw a street festival.",
    body: "A modest grant covers permits, sound, and a stage. Builds heritage and community memory.",
    lore: "Chicago's neighborhood festivals (Pilsen Fest, Bronzeville Black Heritage Month, Polish Constitution Day) build community ties that translate into political organizing capacity over years.",
    source: "DCASE (Department of Cultural Affairs and Special Events) festival data",
    weight: 2,
    options: [
      {
        label: "Fund the festival",
        outcome: "you funded the cultural festival",
        effect: { capital: -1, heritage: 3, trust: 2 },
      },
      {
        label: "Send a city council representative",
        outcome: "you sent a council representative to the festival",
        effect: { trust: 1, heritage: 1 },
      },
    ],
  },
  {
    id: "speculator-package-purchase",
    year: { from: 1995, to: 2040 },
    title: "Bulk speculator offer",
    headline: "An out-of-state LLC wants to buy 10 vacant parcels at once.",
    body: "Easy money for the city budget. The LLC will hold the parcels empty waiting for prices to rise.",
    lore: "Cook County tax-lien auctions and Chicago's bulk surplus property sales have funneled thousands of vacant parcels into out-of-state LLCs since 2000. The Cook County Land Bank Authority was created in 2013 partly to slow this pattern.",
    source: "Cook County Land Bank Authority annual reports",
    weight: 2,
    options: [
      {
        label: "Refuse the offer",
        outcome: "you refused the speculator's bulk offer",
        effect: { capital: -2, equity: 3, heritage: 2 },
      },
      {
        label: "Counter with a Land Bank purchase",
        outcome: "you countered with a Land Bank purchase",
        effect: { capital: -3, equity: 4, heritage: 3 },
      },
      {
        label: "Accept the offer",
        outcome: "you accepted the speculator's bulk offer",
        effect: {
          capital: 4,
          equity: -3,
          heritage: -2,
          transformParcels: [
            { selector: "type:vacant", set: { owner: "speculator" } },
          ],
        },
      },
    ],
  },
  {
    id: "national-attention-news",
    year: { from: 1985, to: 2040 },
    title: "National news cycle",
    headline: "A major national outlet is doing a feature on Parkhaven.",
    body: "Coverage will boost knowledge and political capital, or it will brand the neighborhood as a problem.",
    lore: "National media coverage of Chicago neighborhoods has historically swung between extremes: hagiography of organizing victories or pathologizing of crime and disinvestment. Neither serves the residents well.",
    source: "Chicago neighborhood media coverage analyses",
    weight: 1,
    options: [
      {
        label: "Coordinate the story carefully",
        outcome: "you coordinated the national news story carefully",
        effect: { knowledge: 2, power: 1, heritage: 1 },
      },
      {
        label: "Decline to cooperate",
        outcome: "you declined to cooperate with the national outlet",
        effect: { trust: 1 },
      },
    ],
  },
];

/* ============================================================== *
 *  STOCHASTIC GRANT EVENTS                                          *
 *  Applying for a grant is a gamble. The player chooses whether to  *
 *  spend the time; the outcome is rolled.                           *
 * ============================================================== */

EVENTS.push(
  {
    id: "federal-housing-grant",
    year: { from: 1965, to: 2040 },
    title: "Federal housing grant opportunity",
    headline: "HUD just opened a new competitive grant round.",
    body:
      "Writing the application takes staff time this quarter. You could also skip it and focus on the things already in motion.",
    lore:
      "Federal housing-grant cycles are competitive, political, and often unpredictable. Cities win or lose on the details of their applications.",
    source: "HUD Notice of Funding Opportunity archives",
    weight: 1,
    options: [
      {
        label: "Apply. Commit the staff time.",
        outcome: "applied for the federal grant",
        effect: {}, // placeholder; stochastic handles everything
        stochastic: [
          { weight: 35, label: "Approved", outcome: "The full grant came through. $40M landed.", effect: { capital: 4, equity: 2, growth: 1 } },
          { weight: 40, label: "Partial funding", outcome: "The application was funded at 30% of the request.", effect: { capital: 2, equity: 1 } },
          { weight: 25, label: "Rejected", outcome: "The application was rejected. The staff time was a loss.", effect: { capital: -1, knowledge: 1 } },
        ],
      },
      {
        label: "Skip it. Focus on what's already in motion.",
        outcome: "skipped the grant cycle",
        effect: { capital: 0 },
      },
    ],
  },
  {
    id: "foundation-grant",
    year: { from: 2000, to: 2040 },
    title: "Private foundation RFP",
    headline: "A major foundation is accepting applications for its civic-innovation portfolio.",
    body:
      "The foundation's priorities shift year to year. Your pitch could land or miss depending on what they're chasing this cycle.",
    lore:
      "Chicago has a large philanthropic ecosystem (MacArthur, Polk Bros, Chicago Community Trust, Joyce). Their priorities cycle and shape municipal possibility.",
    source: "Donors Forum / Forefront Chicago philanthropic reports",
    weight: 1,
    options: [
      {
        label: "Write a polished proposal",
        outcome: "submitted a polished foundation proposal",
        effect: {},
        stochastic: [
          { weight: 30, label: "Funded", outcome: "Funded at the ask. The foundation wants a write-up at year end.", effect: { capital: 3, knowledge: 2 } },
          { weight: 40, label: "Partial", outcome: "They want to fund half of it, with reporting obligations.", effect: { capital: 2, knowledge: 1 } },
          { weight: 30, label: "Pass", outcome: "The foundation passed, but kept you on the list for next cycle.", effect: { knowledge: 1 } },
        ],
      },
      {
        label: "Stay in the background",
        outcome: "didn't apply for the foundation grant",
        effect: {},
      },
    ],
  },
  {
    id: "court-filing",
    year: { from: 1990, to: 2040 },
    title: "Fair housing lawsuit filed",
    headline: "A civil-rights firm has filed an equal-credit-access suit against two Parkhaven lenders.",
    body:
      "Depositions will reach City Hall. Backing the plaintiffs costs political capital. Staying quiet preserves the banker relationships.",
    lore:
      "Fair-housing suits have been a significant driver of enforcement in the absence of vigorous federal action. The Chicago Lawyers' Committee for Civil Rights filed multiple such cases through the 2000s.",
    source: "Chicago Lawyers' Committee for Civil Rights filings",
    options: [
      {
        label: "Publicly back the plaintiffs",
        outcome: "publicly backed the plaintiffs",
        effect: {},
        stochastic: [
          { weight: 50, label: "Plaintiffs win", outcome: "The suit settles. Lenders agree to CRA-style concessions.", effect: { equity: 4, knowledge: 1 } },
          { weight: 30, label: "Plaintiffs lose", outcome: "The suit is dismissed. You took the hit anyway.", effect: { equity: 1, power: -2 } },
          { weight: 20, label: "Settled quietly", outcome: "A quiet settlement. Minor concessions, no publicity.", effect: { equity: 2 } },
        ],
      },
      {
        label: "Stay quiet",
        outcome: "stayed quiet on the suit",
        effect: { equity: -1, power: 1 },
      },
    ],
  }
);

/* ============================================================== *
 *  CRISIS EVENTS (state-triggered)                                  *
 *  These fire automatically when scores or parcel counts cross a   *
 *  threshold. Options are role-specific so a Developer and an      *
 *  Organizer don't see the same menu.                              *
 * ============================================================== */

EVENTS.push(
  {
    id: "crisis-unrest",
    year: { from: 1940, to: 2040 },
    triggerSignal: "low-equity",
    title: "Civil unrest",
    headline: "Protests have grown into three nights of unrest.",
    body:
      "Parkhaven's inequality has boiled over. Storefronts on the commercial strip are broken glass. National news is asking who was in charge. You have to decide how to respond.",
    lore:
      "Chicago has seen civil unrest at multiple inflection points (1919, 1968, 2020). The response by local authorities has deeply shaped neighborhood trajectories after.",
    source: "Chicago Tribune coverage of 1968 and 2020 unrest",
    options: [
      {
        label: "Deploy police to clear the streets",
        outcome: "deployed police to clear the streets",
        effect: { growth: 1, equity: -3, heritage: -2, trust: -3, setFlag: "policing-heavy" },
        roles: ["alderman", "developer", "technocrat"],
      },
      {
        label: "Hire private security for the commercial strip",
        outcome: "hired private security for commerce",
        effect: { capital: -2, equity: -1, heritage: -1 },
        roles: ["developer"],
      },
      {
        label: "Organize a peace march through the affected blocks",
        outcome: "organized a peace march",
        effect: { trust: 3, equity: 2, heritage: 2, power: -2 },
        roles: ["organizer", "preacher"],
      },
      {
        label: "Negotiate directly with youth organizers",
        outcome: "negotiated with youth organizers",
        effect: { trust: 2, equity: 2, knowledge: 1, power: -1 },
        roles: ["organizer", "scholar", "journalist"],
      },
      {
        label: "Open the congregations as overnight shelter",
        outcome: "opened the churches as overnight shelter",
        effect: { trust: 3, heritage: 2, equity: 1, capital: -1 },
        roles: ["preacher"],
      },
      {
        label: "Publish a long-form explanation of what's happening",
        outcome: "published a long-form explanation of the unrest",
        effect: { knowledge: 2, equity: 1, trust: 1, power: -1 },
        roles: ["journalist", "scholar"],
      },
      {
        label: "Call a ward-wide community meeting",
        outcome: "called a ward-wide community meeting",
        effect: { trust: 2, equity: 1, power: -1 },
      },
    ],
  },
  {
    id: "crisis-displacement",
    year: { from: 1940, to: 2040 },
    triggerSignal: "high-displacement",
    title: "Displacement crisis",
    headline: "Hundreds of families have been evicted in the last twelve months.",
    body:
      "The national press has picked up the story. City hall is calling. You have to respond and you have to do it fast.",
    lore:
      "Mass displacement events (CHA demolitions, Logan Square 2010s) have drawn national attention and forced municipal responses.",
    source: "ProPublica and Block Club Chicago displacement coverage",
    options: [
      {
        label: "Fast-track an emergency relocation fund",
        outcome: "fast-tracked emergency relocation assistance",
        effect: { capital: -3, equity: 4, trust: 2 },
      },
      {
        label: "Block new demolition permits for a year",
        outcome: "blocked new demolition permits for a year",
        effect: { equity: 3, heritage: 3, growth: -2, power: -1 },
        roles: ["alderman", "organizer", "preacher"],
      },
      {
        label: "Fund new construction elsewhere to absorb the displaced",
        outcome: "funded new construction elsewhere",
        effect: { capital: -3, growth: 2, equity: 2 },
        roles: ["developer", "technocrat"],
      },
      {
        label: "File an emergency civil-rights petition",
        outcome: "filed an emergency civil-rights petition",
        effect: { knowledge: 2, equity: 2, power: -2 },
        roles: ["journalist", "scholar", "organizer"],
      },
    ],
  },
  {
    id: "crisis-tower-collapse",
    year: { from: 1970, to: 2030 },
    triggerSignal: "tower-deterioration",
    title: "Tower elevator fire",
    headline: "A second elevator fire at the CHA tower. Residents refuse to go home.",
    body:
      "The building isn't habitable this week. The press is asking if it will ever be again.",
    lore:
      "CHA tower fires and elevator failures through the 1980s and 1990s were chronic. The Plan for Transformation was the eventual federal-level response.",
    source: "Hunt, Blueprint for Disaster (2009)",
    options: [
      {
        label: "Emergency structural rehab",
        outcome: "emergency-funded structural rehab",
        effect: { capital: -3, equity: 3, heritage: 2 },
      },
      {
        label: "Relocate residents and begin demolition planning",
        outcome: "relocated residents and planned demolition",
        effect: { equity: -2, heritage: -3, growth: 2, setFlag: "tower-demo-planning" },
        roles: ["developer", "alderman", "technocrat"],
      },
      {
        label: "Open the church basement for families that won't go home",
        outcome: "opened the church as temporary shelter",
        effect: { trust: 3, equity: 2, heritage: 1, capital: -1 },
        roles: ["preacher"],
      },
      {
        label: "Document every family's story",
        outcome: "documented the families' stories",
        effect: { knowledge: 2, heritage: 2, equity: 1 },
        roles: ["journalist", "scholar"],
      },
    ],
  },
  {
    id: "crisis-speculator-wave",
    year: { from: 1990, to: 2040 },
    triggerSignal: "many-speculators",
    title: "Speculator wave",
    headline: "Out-of-state LLCs now own a quarter of your vacant lots.",
    body:
      "They are holding and waiting for values to rise. Blocks are emptying. You have to do something.",
    lore:
      "Chicago's post-2008 tax-lien auctions funneled thousands of parcels into out-of-state LLCs. The Cook County Land Bank was established in 2013 partly to reverse this.",
    source: "Cook County Land Bank Authority reports",
    options: [
      {
        label: "Buy back 5 speculator-held lots with the Land Bank",
        outcome: "bought back 5 parcels through the Land Bank",
        effect: {
          capital: -4,
          equity: 3,
          heritage: 3,
          transformParcels: [
            { selector: "owner:speculator", set: { owner: "land-trust", protected: true } },
          ],
        },
      },
      {
        label: "Hit them with a vacant-property tax",
        outcome: "passed a vacant-property tax",
        effect: { equity: 2, sustainability: 1, capital: 1, power: -2 },
        roles: ["alderman", "organizer"],
      },
      {
        label: "Negotiate development deals with the biggest holders",
        outcome: "negotiated development deals with speculators",
        effect: { capital: 3, growth: 3, equity: -2 },
        roles: ["developer"],
      },
      {
        label: "Run an exposé on the worst LLCs",
        outcome: "published an exposé on absentee speculators",
        effect: { knowledge: 2, equity: 2, power: -1 },
        roles: ["journalist", "scholar"],
      },
    ],
  },
  {
    id: "crisis-flood",
    year: { from: 2020, to: 2040 },
    triggerSignal: "climate-flood",
    title: "Neighborhood-scale flood",
    headline: "Three days of rain. Basements flooded on every block south of the canal.",
    body:
      "Insurance carriers are pulling out. FEMA is asking if the city wants to declare a disaster. Federal money is on the table.",
    lore:
      "Chicago's combined sewer system, designed in the late 1800s, is increasingly overwhelmed by climate-intensified storms. South and West Side basements flood disproportionately.",
    source: "Chicago Department of Water Management 2023 stormwater plan",
    options: [
      {
        label: "Declare a disaster, apply for FEMA funds",
        outcome: "applied for FEMA disaster funds",
        effect: {},
        stochastic: [
          { weight: 45, label: "Declared", outcome: "Declaration granted. Federal funds arrive.", effect: { capital: 4, sustainability: 3, equity: 2 } },
          { weight: 35, label: "Partial", outcome: "Partial declaration. Some help, not enough.", effect: { capital: 2, sustainability: 1 } },
          { weight: 20, label: "Denied", outcome: "Declaration denied. The city is on its own.", effect: { capital: -1, sustainability: -1 } },
        ],
      },
      {
        label: "Pour capital into green infrastructure before the next storm",
        outcome: "poured capital into green infrastructure",
        effect: { capital: -4, sustainability: 5, equity: 2 },
        roles: ["technocrat", "scholar", "alderman"],
      },
      {
        label: "Hire private disaster-response contractors",
        outcome: "hired private disaster-response contractors",
        effect: { capital: -3, sustainability: 2 },
        roles: ["developer"],
      },
      {
        label: "Mobilize the congregation to help the flooded families",
        outcome: "mobilized the congregation for flood relief",
        effect: { trust: 3, heritage: 2, equity: 2 },
        roles: ["preacher"],
      },
    ],
  }
);

/** Map for fast lookup */
export const EVENT_BY_ID: Map<string, GameEvent> = new Map(EVENTS.map((e) => [e.id, e]));

/** Get events that can fire in a given year, optionally filtered by flags.
 *  Excludes crisis events (those have triggerSignal and are fired by
 *  state checks, not the normal year-window lottery). */
export function eligibleEvents(
  year: number,
  flags: Set<string>,
  alreadyResolved: Set<string>
): GameEvent[] {
  return EVENTS.filter((e) => {
    if (e.triggerSignal) return false; // crisis events don't appear in normal pool
    // Year window
    if (typeof e.year === "number") {
      if (e.year !== year) return false;
    } else {
      if (year < e.year.from || year > e.year.to) return false;
    }
    // Required flags
    if (e.requires) {
      for (const f of e.requires) if (!flags.has(f)) return false;
    }
    // Blocked flags
    if (e.blockedBy) {
      for (const f of e.blockedBy) if (flags.has(f)) return false;
    }
    // Don't repeat
    if (alreadyResolved.has(e.id)) return false;
    return true;
  });
}

/** Check for crisis events that should fire given current state. Returns
 *  matching event ids. The engine calls this each turn. */
export function checkCrisisTriggers(state: {
  scores: { equity: number; heritage: number; growth: number; sustainability: number };
  parcels: Array<{ owner: string; type: string; displacementEvents: number }>;
  flags: Set<string>;
  resolvedEvents: Array<{ eventId: string }>;
}): GameEvent[] {
  const resolvedSet = new Set(state.resolvedEvents.map((e) => e.eventId));
  const out: GameEvent[] = [];
  for (const e of EVENTS) {
    if (!e.triggerSignal) continue;
    if (resolvedSet.has(e.id)) continue;
    switch (e.triggerSignal) {
      case "low-equity":
        if (state.scores.equity <= -20) out.push(e);
        break;
      case "low-heritage":
        if (state.scores.heritage <= -25) out.push(e);
        break;
      case "high-displacement":
        if (state.parcels.filter((p) => p.displacementEvents > 0).length >= 15) out.push(e);
        break;
      case "tower-deterioration":
        if (state.flags.has("tower-built") && state.scores.heritage < -10) out.push(e);
        break;
      case "many-speculators":
        if (state.parcels.filter((p) => p.owner === "speculator").length >= 8) out.push(e);
        break;
      case "climate-flood":
        if (state.scores.sustainability <= -15) out.push(e);
        break;
    }
  }
  return out;
}
