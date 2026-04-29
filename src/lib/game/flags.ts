/**
 * Flag registry and strategic drift logic.
 *
 * Flags are the mechanism that carries a player's decisions forward
 * through the decades. A 1940 choice sets a flag; that flag bites (or
 * rewards) every turn thereafter. Flags also gate late-game cards and
 * events, so the specific mix of flags a player accumulates determines
 * which late-game options are on the table.
 *
 * This file is the single source of truth for what each flag means.
 * `computeDrift` in state.ts reads from here, and the player-facing
 * lasting-effects strip in the HUD displays these lines.
 */

export interface FlagDef {
  key: string;
  /** Short label shown in HUD. Should be terse and specific. */
  label: string;
  /** Long description for hover/tooltip. */
  description: string;
  /** Per-turn score deltas this flag applies */
  drift: { equity?: number; heritage?: number; growth?: number; sustainability?: number };
  /** Whether drift flips sign when a counter-flag is set */
  negatedBy?: string[];
  /** If present, flag becomes active only when all these other flags are also set */
  requiresAll?: string[];
  /** Tone for UI: positive flags show in green, negative in red, mixed in amber */
  tone: "positive" | "negative" | "mixed";
  /** Category tag for synergy-bonus grouping */
  group?: "development" | "preservation" | "equity-tools" | "climate" | "displacement" | "public-housing" | "historical";
}

export const FLAGS: FlagDef[] = [
  /* ================= Development / displacement ================== */
  {
    key: "expressway-built",
    label: "Expressway cut through",
    description:
      "The expressway you approved in the 1950s or 60s is still polluting the air and cutting the ward in half.",
    drift: { heritage: -1, sustainability: -1 },
    tone: "negative",
    group: "development",
  },
  {
    key: "tower-built",
    label: "CHA towers built",
    description:
      "The high-rise public housing you agreed to keeps deteriorating. Maintenance never caught up.",
    drift: { heritage: -0.5, equity: -0.3 },
    negatedBy: ["tower-rehabbed"],
    tone: "negative",
    group: "public-housing",
  },
  {
    key: "tower-rehabbed",
    label: "Towers rehabbed",
    description:
      "You chose deep-rehab over demolition. The tower is working-class housing again. Heritage holds.",
    drift: { heritage: 0.4, equity: 0.3 },
    tone: "positive",
    group: "public-housing",
  },
  {
    key: "tax-abatement-active",
    label: "Tax abatement active",
    description: "The developer tax break is still eroding the school-fund baseline.",
    drift: { equity: -0.5 },
    tone: "negative",
    group: "development",
  },
  {
    key: "fast-track-permits",
    label: "Fast-track luxury permits",
    description: "Fast-tracked luxury permits are pushing rents up faster than wages.",
    drift: { equity: -1 },
    tone: "negative",
    group: "displacement",
  },
  {
    key: "policing-heavy",
    label: "Heavy policing",
    description: "Overpolicing is eroding trust you'll need later.",
    drift: { equity: -0.5 },
    tone: "negative",
    group: "equity-tools",
  },
  {
    key: "tif-active",
    label: "TIF (no affordability)",
    description:
      "A TIF district is capturing tax growth without the affordable-housing allocation that could make it fair.",
    drift: { equity: -0.5 },
    negatedBy: ["tif-affordable", "tif-sunset"],
    tone: "negative",
    group: "development",
  },
  {
    key: "tif-affordable",
    label: "TIF with affordability",
    description: "Your TIF carries an affordable-housing allocation. Growth with teeth.",
    drift: { equity: 0.3, growth: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "tif-sunset",
    label: "TIF sunset returned",
    description: "You ended the TIF early and sent the tax base back to schools and services.",
    drift: { equity: 0.2, sustainability: 0.1 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "transit-extension",
    label: "Transit station opened",
    description:
      "A transit station is pulling in capital and pushing out residents.",
    drift: { equity: -1 },
    negatedBy: ["preservation-overlay", "rle-affordability-locked"],
    tone: "mixed",
    group: "displacement",
  },
  {
    key: "rle-affordability-locked",
    label: "RLE affordability locked",
    description:
      "You locked station-area affordability BEFORE the transit opened. Displacement pressure contained.",
    drift: { equity: 0.6, sustainability: 0.3 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "tod-upzoning",
    label: "TOD upzoning pressure",
    description:
      "Upzoning near transit is adding homes, but the land market is moving faster than tenant protections.",
    drift: { growth: 0.2, sustainability: 0.1, equity: -0.4 },
    negatedBy: ["preservation-overlay", "rle-affordability-locked", "tif-affordable"],
    tone: "mixed",
    group: "displacement",
  },
  {
    key: "market-rate-tower",
    label: "Market-rate tower signal",
    description: "A luxury tower signaled that outside capital can win approvals quickly.",
    drift: { growth: 0.2, equity: -0.4, heritage: -0.2 },
    negatedBy: ["cba-active", "tif-affordable", "rle-affordability-locked"],
    tone: "mixed",
    group: "displacement",
  },
  {
    key: "exclusionary-zoning",
    label: "Exclusionary zoning legacy",
    description:
      "The single-family lock-in protected some incumbents while narrowing who could afford to arrive later.",
    drift: { equity: -0.4, growth: -0.2, heritage: 0.1 },
    tone: "negative",
    group: "historical",
  },

  /* ================= Preservation / heritage ==================== */
  {
    key: "preservation-overlay",
    label: "Preservation overlay",
    description: "Preservation overlays still protecting the building stock.",
    drift: { heritage: 1 },
    tone: "positive",
    group: "preservation",
  },
  {
    key: "tenant-union-active",
    label: "Tenant union active",
    description: "Organized tenants are catching rent spikes before they become displacement waves.",
    drift: { equity: 0.3, heritage: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "topa-active",
    label: "Tenant purchase rights",
    description: "Tenants get a shot at buying their building before a speculative sale closes.",
    drift: { equity: 0.3, heritage: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "anti-flip-tax",
    label: "Fast flips taxed",
    description: "The transfer-tax surcharge makes short-term speculation less profitable.",
    drift: { equity: 0.2, heritage: 0.2, growth: -0.1 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "cba-active",
    label: "Community benefits contract",
    description: "Major development now has enforceable local hiring and affordability terms.",
    drift: { equity: 0.3, growth: 0.1 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "coalition-active",
    label: "Anti-displacement coalition",
    description: "Cross-neighborhood organizers can respond when pressure moves block to block.",
    drift: { equity: 0.3, heritage: 0.3 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "covenants-challenged",
    label: "Covenants challenged",
    description:
      "You put your name on the Shelley v. Kraemer amicus brief. Every subsequent fair-housing win carries your fingerprint.",
    drift: { equity: 0.3, heritage: 0.2 },
    tone: "positive",
    group: "historical",
  },
  {
    key: "summit-enforced",
    label: "Summit Agreement enforced",
    description:
      "You insisted the 1966 Summit Agreement have enforcement teeth. Fair-housing gains persist.",
    drift: { equity: 0.5, heritage: 0.3 },
    tone: "positive",
    group: "historical",
  },
  {
    key: "taylor-opposed",
    label: "Opposed State Street vertical",
    description:
      "You publicly opposed the Robert Taylor siting. Concentration of poverty did not land in your ward at full scale.",
    drift: { heritage: 0.3, equity: 0.2 },
    tone: "positive",
    group: "historical",
  },
  {
    key: "gautreaux-backed",
    label: "Backed Gautreaux",
    description:
      "You staffed the Gautreaux suit. The remedy is bigger because you put your office behind the plaintiffs.",
    drift: { equity: 0.5 },
    tone: "positive",
    group: "historical",
  },
  {
    key: "industrial-transition-plan",
    label: "Transition plan ready",
    description:
      "You drafted a stockyards-transition plan before the jobs left. The 1970s layoffs did less long-term damage.",
    drift: { growth: 0.4, sustainability: 0.2 },
    tone: "positive",
    group: "preservation",
  },

  /* ================= Equity tools (modern) ====================== */
  {
    key: "cra-office",
    label: "CRA enforcement office",
    description:
      "Your Community Reinvestment Act office keeps banks lending in the D-zones. Capital flows where it was refused.",
    drift: { equity: 0.4, growth: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "land-bank-active",
    label: "Land bank acquiring",
    description: "A community-controlled land bank keeps acquiring vacant parcels. Speculators lose footholds.",
    drift: { equity: 0.3, heritage: 0.2, sustainability: 0.1 },
    tone: "positive",
    group: "preservation",
  },
  {
    key: "baby-bonds-active",
    label: "Baby bonds program",
    description: "Every child born in the ward has a savings account that grows until age 18.",
    drift: { equity: 0.5, growth: 0.1 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "reparations-passed",
    label: "Reparations ordinance",
    description:
      "Your local reparations ordinance distributes housing grants to descendants of redlining-era families.",
    drift: { equity: 0.6, heritage: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "gi-pilot-active",
    label: "Guaranteed income pilot",
    description: "500 ward families get $500/month. The pilot is extending; outcomes are documented.",
    drift: { equity: 0.4, sustainability: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "pb-active",
    label: "Participatory budgeting",
    description: "Residents control 80% of discretionary ward spending. Trust compounds.",
    drift: { heritage: 0.2, equity: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "rtc-active",
    label: "Right-to-counsel in eviction",
    description:
      "Every tenant facing eviction gets an attorney. Eviction rates halved.",
    drift: { equity: 0.5 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "good-cause-active",
    label: "Good-cause eviction",
    description: "Landlords must show cause. Renewals are the default.",
    drift: { equity: 0.4 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "violence-interrupters-active",
    label: "Violence interrupters funded",
    description:
      "CRED-model interrupters are preventing conflicts before they become shootings.",
    drift: { equity: 0.3, heritage: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "municipal-broadband",
    label: "Municipal broadband",
    description: "Fiber at every home. Digital divide closed.",
    drift: { equity: 0.3, growth: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "municipal-lending",
    label: "Municipal mortgage pool",
    description:
      "City-backed mortgages in redlined blocks. Homeownership gap narrows slowly across decades.",
    drift: { equity: 0.5, growth: 0.2 },
    tone: "positive",
    group: "historical",
  },

  /* ================= Climate ==================================== */
  {
    key: "climate-plan-active",
    label: "Climate adaptation plan",
    description: "The ward's phased climate plan is funding itself through bond proceeds.",
    drift: { sustainability: 0.6, equity: 0.2 },
    tone: "positive",
    group: "climate",
  },
  {
    key: "heat-mitigation-active",
    label: "Heat-island mitigation",
    description: "Trees planted, dark roofs painted white, fountains installed. Mortality falls.",
    drift: { sustainability: 0.4, equity: 0.2 },
    tone: "positive",
    group: "climate",
  },
  {
    key: "green-infrastructure",
    label: "Green infrastructure deployed",
    description: "Bioswales and permeable pavement on 80 alleys. Basement floods become rare.",
    drift: { sustainability: 0.4 },
    tone: "positive",
    group: "climate",
  },
  {
    key: "solar-coop-active",
    label: "Solar cooperative",
    description: "A neighborhood solar co-op cuts bills for 500 families.",
    drift: { sustainability: 0.3, equity: 0.3 },
    tone: "positive",
    group: "climate",
  },
  {
    key: "ev-ready",
    label: "EV-ready ward",
    description: "Charging infrastructure, reskilled mechanics. The transition does not leave the ward behind.",
    drift: { sustainability: 0.4, growth: 0.2 },
    tone: "positive",
    group: "climate",
  },
  {
    key: "606-mitigated",
    label: "Trail displacement mitigated",
    description: "Pre-opening affordability covenants around the 606-style trail held.",
    drift: { equity: 0.3, sustainability: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "ada-deferred",
    label: "Deferred maintenance legacy",
    description:
      "You accepted a maintenance deferral deal in the 1990s. The bill is coming due.",
    drift: { sustainability: -0.3, equity: -0.2 },
    tone: "negative",
    group: "development",
  },

  /* ================= Social infrastructure ====================== */
  {
    key: "community-schools-active",
    label: "Community schools",
    description: "Every school is a wraparound services hub. Attendance and outcomes climb.",
    drift: { equity: 0.4, heritage: 0.2 },
    tone: "positive",
    group: "equity-tools",
  },
  {
    key: "cultural-district",
    label: "Cultural district designated",
    description: "A ward corridor is formally a cultural district. Teardowns slow; arts tenants protected.",
    drift: { heritage: 0.5, equity: 0.1 },
    tone: "positive",
    group: "preservation",
  },
  {
    key: "tower-demo-planning",
    label: "Tower demolition planned",
    description:
      "A demolition is scheduled. Whether it becomes replacement or displacement depends on what you do next.",
    drift: {},
    tone: "mixed",
    group: "public-housing",
  },
];

export const FLAG_BY_KEY: Map<string, FlagDef> = new Map(FLAGS.map((f) => [f.key, f]));

/** Compute the effective drift of a flag set. Handles negation. */
export function effectiveDrift(flags: Set<string>): {
  equity: number;
  heritage: number;
  growth: number;
  sustainability: number;
  lines: Array<{ flag: string; label: string; description: string; equity: number; heritage: number; growth: number; sustainability: number; tone: "positive" | "negative" | "mixed" }>;
} {
  let equity = 0;
  let heritage = 0;
  let growth = 0;
  let sustainability = 0;
  const lines: ReturnType<typeof effectiveDrift>["lines"] = [];

  for (const f of FLAGS) {
    if (!flags.has(f.key)) continue;
    if (f.requiresAll && !f.requiresAll.every((r) => flags.has(r))) continue;
    // If a negating flag is present, skip this flag's drift entirely —
    // the counter-flag replaces it.
    if (f.negatedBy && f.negatedBy.some((n) => flags.has(n))) continue;
    const dq = f.drift.equity ?? 0;
    const dh = f.drift.heritage ?? 0;
    const dg = f.drift.growth ?? 0;
    const ds = f.drift.sustainability ?? 0;
    if (dq === 0 && dh === 0 && dg === 0 && ds === 0) continue;
    equity += dq;
    heritage += dh;
    growth += dg;
    sustainability += ds;
    lines.push({
      flag: f.key,
      label: f.label,
      description: f.description,
      equity: dq,
      heritage: dh,
      growth: dg,
      sustainability: ds,
      tone: f.tone,
    });
  }

  return { equity, heritage, growth, sustainability, lines };
}

/** All flags in a group (for synergy detection) */
export function flagsInGroup(group: FlagDef["group"], flags: Set<string>): string[] {
  return FLAGS.filter((f) => f.group === group && flags.has(f.key)).map((f) => f.key);
}
