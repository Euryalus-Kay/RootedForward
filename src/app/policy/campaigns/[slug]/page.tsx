import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import { Reveal } from "@/components/motion/Reveal";
import SignatureForm from "@/components/policy/SignatureForm";
import CommentForm from "@/components/policy/CommentForm";
import CommentsFeed from "@/components/policy/CommentsFeed";
import ShareRow from "@/components/policy/ShareRow";
import {
  PLACEHOLDER_CAMPAIGNS,
  PLACEHOLDER_COMMENTS,
} from "@/lib/policy-constants";
import type { Campaign, ApprovedComment } from "@/lib/policy-constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCampaign(slug: string): Promise<Campaign | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("slug", slug)
      .single();
    if (!error && data) {
      const c = data as Campaign;
      return {
        ...c,
        signature_count: c.signature_count ?? 0,
        decision_makers: c.decision_makers ?? null,
        evidence_links: c.evidence_links ?? null,
        related_tour_slugs: c.related_tour_slugs ?? [],
      } as Campaign;
    }
  } catch {
    // fallback
  }
  return PLACEHOLDER_CAMPAIGNS.find((c) => c.slug === slug) ?? null;
}

async function getApprovedComments(campaignId: string): Promise<ApprovedComment[]> {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("public_comments")
      .select("id, comment_body, created_at, users(full_name)")
      .eq("campaign_id", campaignId)
      .eq("is_approved", true)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data && data.length > 0) {
      return data.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        user_name: ((c.users as Record<string, unknown>)?.full_name as string) ?? "Anonymous",
        neighborhood: "",
        comment_body: c.comment_body as string,
        created_at: c.created_at as string,
      }));
    }
  } catch {
    // fallback
  }
  // Only show placeholder comments for the first campaign
  if (campaignId === "c1") return PLACEHOLDER_COMMENTS;
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  return {
    title: campaign
      ? `${campaign.title} | Policy | Rooted Forward`
      : "Campaign | Rooted Forward",
  };
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "";
  return new Date(deadline).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* Simple markdown-ish renderer for section content */
function RenderMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ol key={`list-${elements.length}`} className="my-4 list-decimal pl-6 font-body text-base leading-relaxed text-ink/75 space-y-2">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="mt-12 mb-5 font-display text-2xl text-forest md:text-3xl">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={i} className="my-4 font-body text-base leading-relaxed text-ink/75">
          {line}
        </p>
      );
    }
  }
  flushList();
  return <>{elements}</>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await getCampaign(slug);
  if (!campaign) notFound();

  const comments = await getApprovedComments(campaign.id);
  const isActive = campaign.status === "active";
  const statusLabel = campaign.status === "active" ? "Active campaign" : campaign.status === "past" ? "Past campaign" : "Draft";
  const campaignUrl = `https://rooted-forward.org/policy/campaigns/${campaign.slug}`;

  const bannerMeta = [
    statusLabel,
    campaign.category,
    isActive && campaign.deadline
      ? `Comment closes ${formatDeadline(campaign.deadline)}`
      : null,
    `${campaign.signature_count.toLocaleString()} signatures`,
  ].filter(Boolean) as string[];

  return (
    <PageTransition>
      {/* ============================================================
          COMPACT BANNER
          ============================================================ */}
      <PageBanner
        compact
        eyebrow="Policy / Campaigns"
        title={campaign.title}
        meta={bannerMeta}
      />

      {/* ============================================================
          BODY — article column + sticky action sidebar
          ============================================================ */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            {/* Main content, left */}
            <article className="max-w-3xl lg:col-span-7">
              {/* Ledger metadata row */}
              {campaign.target_body && (
                <Reveal y={16}>
                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-border pb-5">
                    <span className="ledger text-warm-gray">Target body</span>
                    <span className="font-body text-sm text-ink/80">
                      {campaign.target_body}
                    </span>
                  </div>
                </Reveal>
              )}

              <Reveal delay={0.1}>
                <p className="mt-7 font-body text-lg leading-relaxed text-ink/80">
                  {campaign.summary}
                </p>
              </Reveal>

              {/* The Problem */}
              {campaign.problem_markdown && (
                <RenderMarkdown content={campaign.problem_markdown} />
              )}

              {/* What We're Proposing */}
              {campaign.proposal_markdown && (
                <RenderMarkdown content={campaign.proposal_markdown} />
              )}

              {/* Who Decides */}
              {campaign.decision_makers && campaign.decision_makers.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    Who Decides
                  </h2>
                  <div className="mt-5 border-t border-border">
                    {campaign.decision_makers.map((dm, i) => (
                      <div
                        key={i}
                        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-4"
                      >
                        <p className="font-body text-sm font-medium text-ink">
                          {dm.name}
                        </p>
                        <p className="font-body text-xs text-warm-gray">
                          {dm.role}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* The Evidence */}
              {campaign.evidence_links && campaign.evidence_links.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    The Evidence
                  </h2>
                  <div className="mt-5 border-t border-border">
                    {campaign.evidence_links.map((link, i) => (
                      <div
                        key={i}
                        className="border-b border-border py-4"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-draw font-body text-sm font-medium text-forest"
                        >
                          {link.title}
                        </a>
                        <p className="ledger mt-1.5 text-warm-gray">
                          {link.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Tours */}
              {campaign.related_tour_slugs.length > 0 && (
                <div className="mt-12">
                  <h2 className="font-display text-2xl text-forest md:text-3xl">
                    Related Tours
                  </h2>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {campaign.related_tour_slugs.map((tourSlug) => (
                      <Link
                        key={tourSlug}
                        href={`/tours/chicago/${tourSlug}`}
                        className="group inline-flex items-center gap-2 border border-forest/30 px-4 py-2.5 font-body text-sm text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
                      >
                        {tourSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        <span aria-hidden="true" className="arrow-nudge">&rarr;</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Comments Feed */}
              <div className="mt-16 border-t border-border pt-10">
                <p className="ledger text-warm-gray">Public record</p>
                <h2 className="mt-3 font-display text-2xl text-forest md:text-3xl">
                  What Chicagoans Are Saying
                </h2>
                <div className="mt-7">
                  <CommentsFeed comments={comments} />
                </div>
              </div>
            </article>

            {/* Sidebar, right */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 flex flex-col gap-6">
                {isActive && (
                  <>
                    <SignatureForm
                      campaignId={campaign.id}
                      campaignSlug={campaign.slug}
                    />
                    <CommentForm
                      campaignId={campaign.id}
                      campaignSlug={campaign.slug}
                      commentTemplate={campaign.comment_template}
                    />
                  </>
                )}

                {/* Counts */}
                <div className="border border-border bg-white/40 p-7">
                  <p className="ledger text-warm-gray">Count so far</p>
                  <div className="mt-5 grid grid-cols-2 gap-6">
                    <div>
                      <p className="font-display text-3xl text-forest">
                        {campaign.signature_count.toLocaleString()}
                      </p>
                      <p className="ledger mt-1.5 text-warm-gray">
                        signatures
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-3xl text-forest">
                        {comments.length}
                      </p>
                      <p className="ledger mt-1.5 text-warm-gray">
                        public comments
                      </p>
                    </div>
                  </div>
                </div>

                {/* Share */}
                <div className="border border-border bg-white/40 p-7">
                  <p className="ledger text-warm-gray">Share</p>
                  <div className="mt-4">
                    <ShareRow title={campaign.title} url={campaignUrl} />
                  </div>
                </div>

                {/* Past campaign outcome */}
                {campaign.status === "past" && campaign.outcome && (
                  <div className="border border-border bg-white/40 p-7">
                    <p className="ledger text-warm-gray">Outcome</p>
                    <p className="mt-3 font-body text-sm leading-relaxed text-ink/75">
                      {campaign.outcome}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
