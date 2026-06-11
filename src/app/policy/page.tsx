/* ------------------------------------------------------------------ */
/*  /policy                                                            */
/*                                                                     */
/*  The policy desk. Sections, in order:                               */
/*   1. PageBanner          — v2 banner with live campaign counts.     */
/*   2. Active campaigns    — featured campaign + hairline card grid.  */
/*   3. Learning zone       — dark band: guides, tools, references.    */
/*   4. The record          — past campaigns as ledger rows.           */
/*   5. Proposals closer    — ink band with the submit CTA.            */
/*   6. Quiet footer        — single email prompt.                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import SectionHeading from "@/components/layout/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import WordReveal from "@/components/motion/WordReveal";
import Magnetic from "@/components/motion/Magnetic";
import GradeStrip from "@/components/motion/GradeStrip";
import {
  PLACEHOLDER_CAMPAIGNS,
  PLACEHOLDER_LEARNING_RESOURCES,
  PLACEHOLDER_GUIDES,
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
      return data.map((c: Campaign) => ({
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

function getOutcomeTone(outcome: string | null): string {
  if (!outcome) return "text-warm-gray";
  const lower = outcome.toLowerCase();
  if (lower.startsWith("won")) return "text-grade-a";
  if (lower.startsWith("partial")) return "text-grade-c";
  return "text-warm-gray";
}

function getOutcomeTag(outcome: string | null): string {
  if (!outcome) return "Closed";
  const lower = outcome.toLowerCase();
  if (lower.startsWith("won")) return "Won";
  if (lower.startsWith("partial")) return "Partial";
  return "Closed";
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

  const bannerMeta = [
    `${activeCampaigns.length} active ${activeCampaigns.length === 1 ? "campaign" : "campaigns"}`,
    `${pastCampaigns.length} past ${pastCampaigns.length === 1 ? "campaign" : "campaigns"}`,
    `${PLACEHOLDER_GUIDES.length} how-to guides`,
  ];

  // Ledger facts for the featured campaign panel. Real fields only.
  const featuredFacts = featured
    ? ([
        featured.target_body ? ["Target body", featured.target_body] : null,
        featured.deadline
          ? ["Comment closes", formatDeadline(featured.deadline)]
          : null,
        ["Signatures", featured.signature_count.toLocaleString()],
        ["Category", featured.category],
      ].filter(Boolean) as [string, string][])
    : [];

  return (
    <PageTransition>
      {/* ============================================================
          SECTION 1: BANNER
          ============================================================ */}
      <PageBanner
        eyebrow="Policy / Chicago"
        title="The parts still running"
        dek="Once you can see how redlining, urban renewal, and disinvestment shaped these neighborhoods, the next question is what to do about the patterns that never stopped. We organize that response here. Campaigns you can sign onto, comment drives that put residents into the official record, and a channel for proposing your own ideas."
        meta={bannerMeta}
      />

      {/* ============================================================
          SECTION 2: ACTIVE CAMPAIGNS
          ============================================================ */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            index="01"
            eyebrow="Take action"
            title="Active campaigns"
            lede="Each campaign pairs a specific ask with a specific decision-maker. Signatures and approved public comments are compiled and delivered to the target body."
          />

          {featured ? (
            <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
              {/* Featured campaign, left */}
              <div className="md:col-span-7">
                <Reveal y={20}>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="ledger text-rust">Active / {featured.category}</span>
                    {featured.deadline && (
                      <span className="ledger text-warm-gray">
                        Comment closes {formatDeadline(featured.deadline)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-5 max-w-xl font-display text-3xl leading-tight text-forest md:text-4xl">
                    {featured.title}
                  </h3>
                  <p className="mt-6 max-w-[62ch] font-body text-base leading-relaxed text-ink/75">
                    {featured.summary}
                  </p>
                  <Magnetic className="mt-9 inline-block">
                    <Link
                      href={`/policy/campaigns/${featured.slug}`}
                      className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                    >
                      Read it and take action
                    </Link>
                  </Magnetic>
                  <p className="mt-5 max-w-[52ch] font-body text-sm leading-relaxed text-ink/55">
                    {featured.signature_count.toLocaleString()} Chicagoans have
                    signed. You can add your signature or submit a public
                    comment on the campaign page.
                  </p>
                </Reveal>
              </div>

              {/* Ledger fact panel, right */}
              <div className="md:col-span-5">
                <Reveal delay={0.15} y={24}>
                  <div className="border border-border bg-white/40 p-7">
                    <p className="ledger text-warm-gray">Campaign file</p>
                    <dl className="mt-5">
                      {featuredFacts.map(([label, value], i) => (
                        <div
                          key={label}
                          className={`flex items-baseline justify-between gap-6 py-3.5 ${
                            i > 0 ? "border-t border-border" : ""
                          }`}
                        >
                          <dt className="ledger shrink-0 text-warm-gray">{label}</dt>
                          <dd className="text-right font-body text-sm text-ink/80">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4 border-t border-border pt-5">
                      <GradeStrip className="opacity-60" />
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          ) : (
            <Reveal>
              <p className="mt-12 font-body text-base text-warm-gray">
                No active campaigns right now. Check the record below or
                propose one of your own.
              </p>
            </Reveal>
          )}

          {/* Other active campaigns, hairline grid */}
          {otherActive.length > 0 && (
            <div className="mt-14 border-t border-border pt-10">
              <p className="ledger text-warm-gray">Also active</p>
              <div className="mt-6 grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                {otherActive.map((campaign, i) => (
                  <Reveal key={campaign.id} delay={i * 0.06} className="h-full">
                    <Link
                      href={`/policy/campaigns/${campaign.slug}`}
                      className="card-lift group flex h-full flex-col bg-cream p-7"
                    >
                      <div className="flex items-center justify-between">
                        <span className="ledger text-rust">{campaign.category}</span>
                        <span className="ledger text-warm-gray">
                          {campaign.signature_count.toLocaleString()} signed
                        </span>
                      </div>
                      <h4 className="mt-4 font-display text-xl leading-snug text-forest">
                        {campaign.title}
                      </h4>
                      <p className="mt-3 line-clamp-3 flex-1 font-body text-sm leading-relaxed text-ink/65">
                        {campaign.summary}
                      </p>
                      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                        <span className="font-body text-xs uppercase tracking-widest text-warm-gray">
                          Read the campaign
                        </span>
                        <span aria-hidden="true" className="arrow-nudge text-rust">
                          &rarr;
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          SECTION 3: POLICY LEARNING ZONE — dark band
          ============================================================ */}
      <section className="grain relative overflow-hidden bg-forest py-20 md:py-28">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="index-numeral pointer-events-none absolute -right-6 top-8 select-none text-[11rem] leading-none text-cream/[0.05] md:text-[18rem]"
        >
          02
        </span>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            index="02"
            eyebrow="Policy learning zone"
            title="Learn, draft, act"
            lede="Tools and guides for engaging with Chicago policy. Draft a public comment, write a proposal, find your alderperson, or learn how zoning, legislation, and public testimony actually work."
            tone="dark"
          />

          <div className="mt-14 grid grid-cols-1 gap-px bg-cream/15 sm:grid-cols-2 lg:grid-cols-4">
            {learningResources.map((resource) => {
              const isExternal = resource.href.startsWith("http");
              const cardCls =
                "group flex h-full flex-col bg-forest p-8 transition-colors hover:bg-forest-light";
              const cardContent = (
                <>
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust-light">
                    {TYPE_LABELS[resource.type]}
                  </p>
                  <h3 className="mt-4 font-display text-xl leading-snug text-cream">
                    {resource.title}
                  </h3>
                  <p className="mt-3 flex-1 font-body text-sm leading-relaxed text-cream/65">
                    {resource.description}
                  </p>
                  <span className="mt-6 inline-flex items-center font-body text-xs font-semibold uppercase tracking-widest text-rust-light transition-colors group-hover:text-cream">
                    {resource.cta_label} &rarr;
                  </span>
                </>
              );

              return (
                <Reveal key={resource.id} className="h-full">
                  {isExternal ? (
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardCls}
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <Link href={resource.href} className={cardCls}>
                      {cardContent}
                    </Link>
                  )}
                </Reveal>
              );
            })}
          </div>

          {/* Chicago quick reference */}
          <div className="mt-16 border-t border-cream/15 pt-10">
            <Reveal>
              <p className="eyebrow text-cream/45">Chicago quick reference</p>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-5 md:grid-cols-2 lg:grid-cols-3">
              {CHICAGO_REFERENCES.map((ref, i) => (
                <Reveal key={ref.url} delay={(i % 3) * 0.05}>
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <span className="link-draw font-body text-sm font-medium text-cream/85">
                      {ref.name}
                    </span>
                    <p className="mt-1 font-body text-xs leading-relaxed text-cream/45">
                      {ref.annotation}
                    </p>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: THE RECORD — past campaigns as ledger rows
          ============================================================ */}
      {pastCampaigns.length > 0 && (
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionHeading
              index="03"
              eyebrow="The record"
              title="Past campaigns"
              lede="What we asked for, what happened, and the count of residents who put their names on it. Wins and losses both stay on the books."
            />

            <div className="mt-12 border-t border-border">
              {pastCampaigns.map((campaign, i) => {
                const year = new Date(campaign.created_at).getFullYear();
                return (
                  <Reveal key={campaign.id} delay={i * 0.06}>
                    <Link
                      href={`/policy/campaigns/${campaign.slug}`}
                      className="group grid grid-cols-1 gap-x-8 gap-y-3 border-b border-border py-7 transition-colors hover:bg-white/40 md:grid-cols-12 md:items-baseline md:px-4"
                    >
                      <div className="flex items-baseline gap-5 md:col-span-2 md:flex-col md:gap-1.5">
                        <span className="ledger text-warm-gray">{year}</span>
                        <span className="ledger text-rust">{campaign.category}</span>
                      </div>
                      <div className="md:col-span-7">
                        <h3 className="font-display text-xl leading-snug text-forest transition-colors group-hover:text-rust md:text-2xl">
                          {campaign.title}
                        </h3>
                        {campaign.outcome && (
                          <p className="mt-2 max-w-[62ch] font-body text-sm leading-relaxed text-ink/60">
                            {campaign.outcome.replace(/^(Won|Partial|Closed)\.?\s*/i, "")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-5 md:col-span-3 md:flex-col md:items-end md:gap-1.5">
                        <span className={`ledger ${getOutcomeTone(campaign.outcome)}`}>
                          {getOutcomeTag(campaign.outcome)}
                        </span>
                        <span className="ledger text-warm-gray">
                          {campaign.signature_count.toLocaleString()} signatures
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SECTION 5: COMMUNITY PROPOSALS — closer
          ============================================================ */}
      <section className="grain relative overflow-hidden bg-ink py-20 md:py-28">
        <div className="grid-lines-light absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Reveal y={12}>
            <GradeStrip className="mx-auto justify-center opacity-70" />
          </Reveal>
          <WordReveal
            as="h2"
            text="Have a policy idea for your neighborhood?"
            delay={0.1}
            className="mt-8 font-display text-3xl text-cream md:text-5xl"
          />
          <Reveal delay={0.3}>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-cream/70 md:text-lg">
              Rooted Forward reviews community-submitted proposals monthly. If
              your idea is strong, we develop it into a full campaign with
              research backing, public comment infrastructure, and a delivery
              plan. You stay involved if you want to be.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <Magnetic className="mt-10">
              <Link
                href="/policy/submit-proposal"
                className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
              >
                Submit a proposal
              </Link>
            </Magnetic>
            <p className="mt-4 font-body text-xs text-cream/45">
              No account required. We respond within 30 days.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: QUIET FOOTER BLOCK
          ============================================================ */}
      <section className="bg-cream py-14 md:py-16">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-body text-sm leading-relaxed text-warm-gray">
            Working on Chicago policy? We share our research with journalists,
            researchers, and legislative offices on request.{" "}
            <a
              href="mailto:contact@rooted-forward.org"
              className="text-forest underline decoration-border underline-offset-2 transition-colors hover:decoration-forest"
            >
              contact@rooted-forward.org
            </a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
