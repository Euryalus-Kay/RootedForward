import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import {
  PLACEHOLDER_CAMPAIGNS,
  PLACEHOLDER_GUIDES,
  CHICAGO_REFERENCES,
} from "@/lib/policy-constants";
import type { Campaign, Guide } from "@/lib/policy-constants";

export const metadata: Metadata = {
  title: "Policy | Rooted Forward",
  description:
    "Active campaigns, how-to guides, and resources for Chicago policy engagement. Sign on, submit public comment, or propose your own policy idea.",
};

/* ------------------------------------------------------------------ */
/*  Data fetching with fallback                                        */
/* ------------------------------------------------------------------ */

async function getCampaigns(): Promise<Campaign[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .in("status", ["active", "past"])
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      return data as unknown as Campaign[];
    }
  } catch {
    // Supabase not configured
  }
  return PLACEHOLDER_CAMPAIGNS;
}

async function getGuides(): Promise<Guide[]> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .order("order_number", { ascending: true });
    if (!error && data && data.length > 0) {
      return data as unknown as Guide[];
    }
  } catch {
    // Supabase not configured
  }
  return PLACEHOLDER_GUIDES;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "";
  const d = new Date(deadline);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getOutcomeColor(outcome: string | null): string {
  if (!outcome) return "text-warm-gray";
  const lower = outcome.toLowerCase();
  if (lower.startsWith("won")) return "text-forest";
  if (lower.startsWith("partial")) return "text-rust";
  return "text-warm-gray";
}

function getOutcomeTag(outcome: string | null): string {
  if (!outcome) return "Closed";
  const lower = outcome.toLowerCase();
  if (lower.startsWith("won")) return "Won";
  if (lower.startsWith("partial")) return "Partial";
  return "Closed";
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function PolicyPage() {
  const [campaigns, guides] = await Promise.all([getCampaigns(), getGuides()]);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const featured = activeCampaigns[0] ?? null;
  const otherActive = activeCampaigns.slice(1);
  const pastCampaigns = campaigns.filter((c) => c.status === "past");

  return (
    <PageTransition>
      {/* ============================================================
          SECTION 1: PAGE HEADER
          ============================================================ */}
      <section className="bg-cream pb-10 pt-28 md:pt-36">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Policy / Chicago
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-forest md:text-6xl">
            Public Policy Initiatives
          </h1>
          <p className="mt-8 max-w-[65ch] font-body text-lg leading-relaxed text-ink/75">
            Rooted Forward exists to teach people how historical urban
            inequality shaped the Chicago they live in today. The tours, films,
            and classroom work are the first half of that mission. This page is
            the second half. Once you understand how redlining, urban renewal,
            and disinvestment produced the neighborhoods we walk through, the
            next question is what to do about the patterns that are still
            running. We organize that response here: active campaigns you can
            sign onto, public comment drives that put community voices into the
            official record, and a channel for residents to propose their own
            policy ideas.
          </p>
          <hr className="mt-12 border-border" />
        </div>
      </section>

      {/* ============================================================
          SECTION 2: FEATURED ACTIVE CAMPAIGN
          ============================================================ */}
      {featured && (
        <section className="bg-cream py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-14">
              {/* Left: image area */}
              <div className="md:col-span-2">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cream-dark">
                  <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                  <svg
                    className="absolute inset-0 h-full w-full opacity-[0.05]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="campaign-diag"
                        width="16"
                        height="16"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                      >
                        <line x1="0" y1="0" x2="0" y2="16" stroke="#1A1A1A" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#campaign-diag)" />
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/40 to-transparent px-5 py-4">
                    <p className="font-body text-xs uppercase tracking-wider text-cream/80">
                      {featured.category}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: campaign info */}
              <div className="md:col-span-3">
                <span className="inline-block rounded-full bg-rust/15 px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider text-rust">
                  Active Campaign
                </span>
                <h2 className="mt-4 font-display text-3xl leading-snug text-forest md:text-4xl">
                  {featured.title}
                </h2>
                {featured.deadline && (
                  <p className="mt-3 font-body text-sm text-warm-gray">
                    Public comment closes {formatDeadline(featured.deadline)}
                  </p>
                )}
                <p className="mt-6 max-w-[60ch] font-body text-base leading-relaxed text-ink/75">
                  {featured.summary}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/policy/campaigns/${featured.slug}`}
                    className="inline-flex items-center justify-center rounded-sm bg-rust px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                  >
                    Add Your Signature
                  </Link>
                  <Link
                    href={`/policy/campaigns/${featured.slug}#comment`}
                    className="inline-flex items-center justify-center rounded-sm border-2 border-forest px-6 py-3 font-body text-sm font-semibold uppercase tracking-widest text-forest transition-colors hover:bg-forest hover:text-cream"
                  >
                    Submit Public Comment
                  </Link>
                </div>

                <p className="mt-5 font-body text-sm text-warm-gray">
                  {featured.signature_count.toLocaleString()} Chicagoans have
                  signed
                </p>

                <Link
                  href={`/policy/campaigns/${featured.slug}`}
                  className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
                >
                  Read the full brief &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 3: OTHER ACTIVE INITIATIVES
          ============================================================ */}
      {otherActive.length > 0 && (
        <section className="bg-cream py-12">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-2xl text-forest md:text-3xl">
              Other Active Initiatives
            </h2>
            <div className="mt-8 flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
              {otherActive.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/policy/campaigns/${campaign.slug}`}
                  className="group block w-80 flex-shrink-0"
                >
                  <div className="rounded-sm border border-border p-6 transition-shadow hover:shadow-md">
                    <span className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                      {campaign.category}
                    </span>
                    <h3 className="mt-2 font-display text-lg text-forest">
                      {campaign.title}
                    </h3>
                    <p className="mt-2 font-body text-sm leading-relaxed text-ink/65 line-clamp-2">
                      {campaign.summary.split(". ")[0]}.
                    </p>
                    <p className="mt-3 font-body text-xs text-warm-gray">
                      {campaign.signature_count.toLocaleString()} signatures
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 4: RESOURCE LIBRARY
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Left: How-To Guides */}
            <div>
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                How-To Guides
              </h2>
              <div className="mt-10 flex flex-col gap-8">
                {guides.map((guide) => (
                  <div key={guide.id}>
                    <Link
                      href={`/policy/guides/${guide.slug}`}
                      className="group"
                    >
                      <p className="font-body text-xs font-semibold tabular-nums text-warm-gray-light">
                        {String(guide.order_number).padStart(2, "0")}
                      </p>
                      <h3 className="mt-1 font-display text-lg text-forest transition-colors group-hover:text-rust">
                        {guide.title}
                      </h3>
                      <p className="mt-0.5 font-body text-xs text-warm-gray">
                        {guide.read_time_minutes} min read
                      </p>
                    </Link>
                    <p className="mt-2 font-body text-sm italic leading-relaxed text-ink/60">
                      {guide.why_use}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Chicago Reference */}
            <div>
              <h2 className="font-display text-2xl text-forest md:text-3xl">
                Chicago Reference
              </h2>
              <div className="mt-10 flex flex-col gap-6">
                {CHICAGO_REFERENCES.map((ref) => (
                  <div key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm font-medium text-forest underline decoration-border underline-offset-2 transition-colors hover:text-rust hover:decoration-rust"
                    >
                      {ref.name}
                    </a>
                    <p className="mt-1 font-body text-sm leading-relaxed text-ink/60">
                      {ref.annotation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: SUBMIT YOUR OWN PROPOSAL
          ============================================================ */}
      <section className="bg-cream py-12">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-12 border-border" />
          <p className="max-w-[65ch] font-body text-base leading-relaxed text-ink/70">
            Have a policy idea for your neighborhood? Rooted Forward reviews
            community-submitted proposals monthly and develops the strongest
            ones into campaigns.{" "}
            <Link
              href="/policy/submit-proposal"
              className="font-medium text-rust underline decoration-rust/30 underline-offset-2 transition-colors hover:decoration-rust"
            >
              Submit a proposal &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: PAST CAMPAIGNS
          ============================================================ */}
      {pastCampaigns.length > 0 && (
        <section className="border-t border-border bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-display text-2xl text-forest md:text-3xl">
              Past Campaigns
            </h2>

            <div className="relative mt-12">
              {/* Vertical line */}
              <div
                className="absolute left-3 top-0 h-full w-px bg-border"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-10">
                {pastCampaigns.map((campaign) => {
                  const year = new Date(campaign.created_at).getFullYear();
                  return (
                    <Link
                      key={campaign.id}
                      href={`/policy/campaigns/${campaign.slug}`}
                      className="group relative pl-10"
                    >
                      {/* Dot on timeline */}
                      <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-cream">
                        <div className="h-2 w-2 rounded-full bg-warm-gray" />
                      </div>

                      <p className="font-display text-2xl text-forest/40">
                        {year}
                      </p>
                      <h3 className="mt-1 font-display text-lg text-forest transition-colors group-hover:text-rust">
                        {campaign.title}
                      </h3>
                      <span
                        className={`mt-1 inline-block font-body text-xs font-semibold uppercase tracking-wider ${getOutcomeColor(campaign.outcome)}`}
                      >
                        {getOutcomeTag(campaign.outcome)}
                      </span>
                      {campaign.outcome && (
                        <p className="mt-2 font-body text-sm leading-relaxed text-ink/60">
                          {campaign.outcome.replace(/^(Won|Partial|Closed)\s*—?\s*/i, "")}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 7: QUIET FOOTER BLOCK
          ============================================================ */}
      <section className="bg-cream pb-20 pt-8">
        <div className="mx-auto max-w-4xl px-6">
          <hr className="mb-10 border-border" />
          <p className="font-body text-sm leading-relaxed text-warm-gray">
            Working on Chicago policy? We share our research with journalists,
            researchers, and legislative offices on request.{" "}
            <a
              href="mailto:policy@rootedforward.org"
              className="text-forest underline decoration-border underline-offset-2 transition-colors hover:decoration-forest"
            >
              policy@rootedforward.org
            </a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
