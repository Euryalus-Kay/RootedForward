import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import SignatureForm from "@/components/policy/SignatureForm";
import CommentForm from "@/components/policy/CommentForm";
import CommentsFeed from "@/components/policy/CommentsFeed";
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
      const c = data as any;
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
        <h2 key={i} className="mt-10 mb-4 font-display text-2xl text-forest">
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
        <p key={i} className="my-3 font-body text-base leading-relaxed text-ink/75">
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
  const statusLabel = campaign.status === "active" ? "Active Campaign" : campaign.status === "past" ? "Past Campaign" : "Draft";
  const statusColor = campaign.status === "active" ? "bg-rust/15 text-rust" : "bg-warm-gray/15 text-warm-gray";

  return (
    <PageTransition>
      {/* Header */}
      <section className="bg-cream pb-8 pt-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6">
          {/* Breadcrumb */}
          <nav className="font-body text-xs text-warm-gray">
            <Link href="/policy" className="hover:text-forest">
              Policy
            </Link>
            {" / "}
            <Link href="/policy" className="hover:text-forest">
              Campaigns
            </Link>
            {" / "}
            <span className="text-ink/50">{campaign.title}</span>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`inline-block rounded-full px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider ${statusColor}`}
            >
              {statusLabel}
            </span>
            {campaign.deadline && isActive && (
              <span className="font-body text-sm text-warm-gray">
                Deadline: {formatDeadline(campaign.deadline)}
              </span>
            )}
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-3xl leading-snug text-forest md:text-5xl">
            {campaign.title}
          </h1>
          {campaign.target_body && (
            <p className="mt-3 font-body text-sm text-warm-gray">
              Target: {campaign.target_body}
            </p>
          )}
          <p className="mt-6 max-w-3xl font-body text-lg leading-relaxed text-ink/75">
            {campaign.summary}
          </p>
          <hr className="mt-10 border-border" />
        </div>
      </section>

      {/* Two-column body */}
      <section className="bg-cream pb-20 pt-8 md:pb-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Main content — left */}
            <div className="lg:col-span-7">
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
                <div className="mt-10">
                  <h2 className="mb-4 font-display text-2xl text-forest">
                    Who Decides
                  </h2>
                  <div className="flex flex-col gap-3">
                    {campaign.decision_makers.map((dm, i) => (
                      <div
                        key={i}
                        className="rounded-sm border border-border bg-cream-dark px-5 py-4"
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
                <div className="mt-10">
                  <h2 className="mb-4 font-display text-2xl text-forest">
                    The Evidence
                  </h2>
                  <div className="flex flex-col gap-3">
                    {campaign.evidence_links.map((link, i) => (
                      <div key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-sm font-medium text-forest underline decoration-border underline-offset-2 hover:text-rust hover:decoration-rust"
                        >
                          {link.title}
                        </a>
                        <p className="font-body text-xs text-warm-gray">
                          {link.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Tours */}
              {campaign.related_tour_slugs.length > 0 && (
                <div className="mt-10">
                  <h2 className="mb-4 font-display text-2xl text-forest">
                    Related Tours
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {campaign.related_tour_slugs.map((tourSlug) => (
                      <Link
                        key={tourSlug}
                        href={`/tours/chicago/${tourSlug}`}
                        className="rounded-sm border border-border px-4 py-2 font-body text-sm text-forest transition-colors hover:bg-cream-dark"
                      >
                        {tourSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} &rarr;
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Comments Feed */}
              <div className="mt-14">
                <h2 className="font-display text-2xl text-forest">
                  What Chicagoans Are Saying
                </h2>
                <div className="mt-6">
                  <CommentsFeed comments={comments} />
                </div>
              </div>
            </div>

            {/* Sidebar — right */}
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
                <div className="rounded-sm border border-border bg-cream-dark p-6">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-display text-2xl text-forest">
                        {campaign.signature_count.toLocaleString()}
                      </p>
                      <p className="font-body text-xs text-warm-gray">
                        signatures
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-2xl text-forest">
                        {comments.length}
                      </p>
                      <p className="font-body text-xs text-warm-gray">
                        public comments
                      </p>
                    </div>
                  </div>
                </div>

                {/* Share */}
                <div className="rounded-sm border border-border bg-cream-dark p-6">
                  <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                    Share
                  </h3>
                  <div className="mt-3 flex gap-3">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(campaign.title)}&url=${encodeURIComponent(`https://rootedforward.org/policy/campaigns/${campaign.slug}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-sm text-forest underline underline-offset-2 hover:text-rust"
                    >
                      X / Twitter
                    </a>
                    <span className="text-border">|</span>
                    <button
                      onClick={undefined}
                      className="font-body text-sm text-forest underline underline-offset-2 hover:text-rust"
                    >
                      Copy link
                    </button>
                  </div>
                </div>

                {/* Past campaign outcome */}
                {campaign.status === "past" && campaign.outcome && (
                  <div className="rounded-sm border border-border bg-cream-dark p-6">
                    <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                      Outcome
                    </h3>
                    <p className="mt-2 font-body text-sm leading-relaxed text-ink/75">
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
