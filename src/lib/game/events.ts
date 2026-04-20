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
        label: "Fund emergency housing",
        outcome: "you funded emergency housing for the displaced family",
        effect: { capital: -1, equity: 2, trust: 1 },
      },
      {
        label: "Refer to charity",
        outcome: "you referred the displaced family to charity",
        effect: { equity: -1 },
      },
    ],
  },
  {
    id: "neighbor-organized-cleanup",
    year: { from: 1940, to: 2040 },
    title: "Neighbors organize a cleanup",
    headline: "A block club has organized a Saturday cleanup of vacant lots.",
    body: "They are asking the city for dumpsters and tools. Modest support builds long-term goodwill.",
    lore: "Chicago block-club tradition is uniquely strong. Block-club registration with the city dates to the 1930s. Active block clubs are correlated with measurable improvements in nuisance-call resolution.",
    source: "City of Chicago Block Club registration data",
    weight: 2,
    options: [
      {
        label: "Send dumpsters and tools",
        outcome: "you sent dumpsters and tools to the cleanup",
        effect: { capital: -1, trust: 2, heritage: 1 },
      },
      {
        label: "Send a thank-you note",
        outcome: "you sent a thank-you note for the cleanup",
        effect: { trust: 0 },
      },
      {
        label: "Ignore",
        outcome: "you ignored the cleanup",
        effect: { trust: -1 },
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

/** Map for fast lookup */
export const EVENT_BY_ID: Map<string, GameEvent> = new Map(EVENTS.map((e) => [e.id, e]));

/** Get events that can fire in a given year, optionally filtered by flags */
export function eligibleEvents(
  year: number,
  flags: Set<string>,
  alreadyResolved: Set<string>
): GameEvent[] {
  return EVENTS.filter((e) => {
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
