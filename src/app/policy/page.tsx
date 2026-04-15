import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import {
  PLACEHOLDER_CAMPAIGNS,
  PLACEHOLDER_LEARNING_RESOURCES,
  CHICAGO_REFERENCES,
} from "@/lib/policy-constants";
import type { Campaign, LearningResource } from "@/lib/policy-constants";

export const metadata: Metadata = {
  title: "Policy | Rooted Forward",
  description:
    "Active campaigns, policy tools, and resources for Chicago policy engagement. Sign on, submit public comment, or propose your own policy idea.",
};

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

async function getCampaigns(): Promise<Campaign[]> {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) return PLACEHOLDER_CAMPAIGNS;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .in("status", ["active", "past"])
      .order("created_at", { ascending: false });
    if (!error && data && data.length > 0) {
      return data.map((c: any) => ({
        ...c,
        signature_count: c.signature_count ?? 0,
        decision_makers: c.decision_makers ?? null,
        evidence_links: c.evidence_links ?? null,
        related_tour_slugs: c.related_tour_slugs ?? [],
      })) as Campaign[];
    }
  } catch {
    // fallback
  }
  return PLACEHOLDER_CAMPAIGNS;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "";
  return new Date(deadline).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getOutcomeColor(outcome: string | null): string {
  if (!outcome) return "bg-warm-gray/10 text-warm-gray";
  const lower = outcome.toLowerCase();
  if (lower.startsWith("won")) return "bg-forest/10 text-forest";
  if (lower.startsWith("partial")) return "bg-rust/10 text-rust";
  return "bg-warm-gray/10 text-warm-gray";
}

function getOutcomeTag(outcome: string | null): string {
  if (!outcome) return "Closed";
  const lower = outcome.toLowerCase();
  if (lower.startsWith("won")) return "Won";
  if (lower.startsWith("partial")) return "Partial";
  return "Closed";
}

/* Icon lookup for learning resources */
function ResourceIcon({ icon }: { icon: LearningResource["icon"] }) {
  const cls = "h-6 w-6";
  switch (icon) {
    case "pen":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
      );
    case "book":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "compass":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
        </svg>
      );
    case "megaphone":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
        </svg>
      );
    case "scale":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
        </svg>
      );
    case "search":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      );
    case "users":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      );
  }
}

const TYPE_LABELS: Record<LearningResource["type"], string> = {
  tool: "Tool",
  guide: "Guide",
  reference: "Reference",
  interactive: "Interactive",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function PolicyPage() {
  const campaigns = await getCampaigns();
  const learningResources = PLACEHOLDER_LEARNING_RESOURCES;

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
              <div className="md:col-span-2">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cream-dark">
                  <div className="absolute inset-0 bg-gradient-to-b from-cream-dark to-border" />
                  <svg className="absolute inset-0 h-full w-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="campaign-diag" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
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

                <Link
                  href={`/policy/campaigns/${featured.slug}`}
                  className="mt-8 inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Read More &amp; Take Action &rarr;
                </Link>

                <p className="mt-5 font-body text-sm leading-relaxed text-ink/55">
                  {featured.signature_count.toLocaleString()} Chicagoans have
                  signed. You can add your signature or submit a public comment
                  on the campaign page.
                </p>
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
            <div className="mt-8 flex gap-6 overflow-x-auto pb-4">
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
          SECTION 4: POLICY LEARNING ZONE
          ============================================================ */}
      <section className="border-t border-border bg-forest py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/50">
            Policy Learning Zone
          </p>
          <h2 className="mt-3 font-display text-4xl text-cream md:text-6xl">
            Learn, Draft, Act
          </h2>
          <p className="mt-6 max-w-2xl font-body text-base leading-relaxed text-cream/70">
            Tools and guides for engaging with Chicago policy. Draft a public
            comment, write a proposal, find your alderperson, or learn how
            zoning, legislation, and public testimony actually work.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningResources.map((resource) => {
              const isExternal = resource.href.startsWith("http");
              const cardCls = "group flex flex-col rounded-sm border border-cream/15 bg-cream/[0.05] p-6 transition-all hover:bg-cream/[0.10] hover:border-cream/25";
              const cardContent = (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rust/50 text-rust">
                      <ResourceIcon icon={resource.icon} />
                    </div>
                    <span className="font-body text-[10px] font-semibold uppercase tracking-widest text-cream/50">
                      {TYPE_LABELS[resource.type]}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-rust">
                    {resource.title}
                  </h3>
                  <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-cream/65">
                    {resource.description}
                  </p>
                  <span className="mt-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust transition-transform group-hover:translate-x-1">
                    {resource.cta_label} &rarr;
                  </span>
                </>
              );

              return isExternal ? (
                <a key={resource.id} href={resource.href} target="_blank" rel="noopener noreferrer" className={cardCls}>
                  {cardContent}
                </a>
              ) : (
                <Link key={resource.id} href={resource.href} className={cardCls}>
                  {cardContent}
                </Link>
              );
            })}
          </div>

          {/* Quick reference links */}
          <div className="mt-16 border-t border-cream/15 pt-10">
            <h3 className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-cream/45">
              Chicago Quick Reference
            </h3>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {CHICAGO_REFERENCES.map((ref) => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm text-cream/60 underline decoration-cream/25 underline-offset-2 transition-colors hover:text-rust hover:decoration-rust"
                >
                  {ref.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: PROPOSE A POLICY IDEA
          ============================================================ */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-sm border border-border bg-cream-dark p-8 md:p-12">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-5">
              <div className="md:col-span-3">
                <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
                  Community Proposals
                </p>
                <h2 className="mt-3 font-display text-2xl text-forest md:text-3xl">
                  Have a policy idea for your neighborhood?
                </h2>
                <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-ink/70">
                  Rooted Forward reviews community-submitted proposals monthly.
                  If your idea is strong, we develop it into a full campaign
                  with research backing, public comment infrastructure, and a
                  delivery plan. You stay involved if you want to be.
                </p>
              </div>
              <div className="md:col-span-2 md:text-right">
                <Link
                  href="/policy/submit-proposal"
                  className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Submit a Proposal &rarr;
                </Link>
                <p className="mt-3 font-body text-xs text-warm-gray">
                  No account required. We respond within 30 days.
                </p>
              </div>
            </div>
          </div>
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
              {/* Vertical timeline line */}
              <div
                className="absolute left-3 top-2 h-[calc(100%-16px)] w-px bg-border"
                aria-hidden="true"
              />

              <div className="flex flex-col gap-8">
                {pastCampaigns.map((campaign) => {
                  const year = new Date(campaign.created_at).getFullYear();
                  return (
                    <Link
                      key={campaign.id}
                      href={`/policy/campaigns/${campaign.slug}`}
                      className="group relative pl-12"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-cream transition-colors group-hover:border-rust">
                        <div className="h-2 w-2 rounded-full bg-warm-gray transition-colors group-hover:bg-rust" />
                      </div>

                      {/* Card */}
                      <div className="rounded-sm border border-border p-5 transition-all group-hover:border-warm-gray group-hover:shadow-md md:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-body text-xs text-warm-gray">
                              {year} &middot; {campaign.category}
                            </p>
                            <h3 className="mt-1 font-display text-lg text-forest transition-colors group-hover:text-rust">
                              {campaign.title}
                            </h3>
                            {campaign.outcome && (
                              <p className="mt-2 font-body text-sm leading-relaxed text-ink/60">
                                {campaign.outcome.replace(
                                  /^(Won|Partial|Closed)\s*—?\s*/i,
                                  ""
                                )}
                              </p>
                            )}
                            <p className="mt-3 font-body text-xs text-warm-gray">
                              {campaign.signature_count.toLocaleString()} signatures
                            </p>
                          </div>
                          <span
                            className={`mt-1 flex-shrink-0 rounded-full px-2.5 py-0.5 font-body text-xs font-semibold uppercase tracking-wider ${getOutcomeColor(campaign.outcome)}`}
                          >
                            {getOutcomeTag(campaign.outcome)}
                          </span>
                        </div>
                        <span className="mt-3 inline-block font-body text-sm font-semibold uppercase tracking-widest text-rust opacity-0 transition-opacity group-hover:opacity-100">
                          View details &rarr;
                        </span>
                      </div>
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
