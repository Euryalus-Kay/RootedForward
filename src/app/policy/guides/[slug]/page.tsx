import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import PageBanner from "@/components/layout/PageBanner";
import { Reveal } from "@/components/motion/Reveal";
import DraftingArea from "@/components/policy/DraftingArea";
import { PLACEHOLDER_GUIDES, PLACEHOLDER_CAMPAIGNS } from "@/lib/policy-constants";
import type { Guide } from "@/lib/policy-constants";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getGuide(slug: string): Promise<Guide | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .eq("slug", slug)
      .single();
    if (!error && data) return data as unknown as Guide;
  } catch {
    // fallback
  }
  return PLACEHOLDER_GUIDES.find((g) => g.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  return {
    title: guide
      ? `${guide.title} | Policy | Rooted Forward`
      : "Guide | Rooted Forward",
  };
}

/* Render markdown content with basic formatting */
function RenderGuideContent({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          id={line
            .replace("## ", "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-$/, "")}
          className="mt-12 mb-5 font-display text-2xl text-forest scroll-mt-24 md:text-3xl"
        >
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="my-4 font-body text-base font-semibold text-ink">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.startsWith("- ")) {
      // Collect consecutive list items
      const items: string[] = [line.replace("- ", "")];
      while (i + 1 < lines.length && lines[i + 1].startsWith("- ")) {
        i++;
        items.push(lines[i].replace("- ", ""));
      }
      elements.push(
        <ul key={i} className="my-4 list-disc pl-6 font-body text-base leading-relaxed text-ink/75 space-y-1.5">
          {items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    } else if (line.trim() === "") {
      // skip blank lines
    } else {
      // Render links in text: [text](url)
      const parts = line.split(/(\[.*?\]\(.*?\))/);
      const rendered = parts.map((part, j) => {
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a
              key={j}
              href={linkMatch[2]}
              target={linkMatch[2].startsWith("/") ? undefined : "_blank"}
              rel={linkMatch[2].startsWith("/") ? undefined : "noopener noreferrer"}
              className="text-rust underline decoration-rust/30 underline-offset-2 hover:decoration-rust"
            >
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      });

      elements.push(
        <p key={i} className="my-4 font-body text-base leading-relaxed text-ink/75">
          {rendered}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

/* Extract h2 headings for TOC */
function extractHeadings(markdown: string): { text: string; id: string }[] {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const text = line.replace("## ", "");
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, "");
      return { text, id };
    });
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  const headings = extractHeadings(guide.content_markdown);
  const activeCampaigns = PLACEHOLDER_CAMPAIGNS.filter(
    (c) => c.status === "active"
  );

  const lastUpdated = new Date(guide.last_updated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageTransition>
      {/* ============================================================
          COMPACT BANNER
          ============================================================ */}
      <PageBanner
        compact
        eyebrow="Policy / Guides"
        title={guide.title}
        meta={[`${guide.read_time_minutes} min read`, `Updated ${lastUpdated}`]}
      />

      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            {/* Main content */}
            <article className="max-w-3xl lg:col-span-8">
              {/* Why use this guide */}
              {guide.why_use && (
                <Reveal y={16}>
                  <div className="border-b border-border pb-6">
                    <p className="ledger text-warm-gray">When to use this</p>
                    <p className="mt-3 font-body text-base leading-relaxed text-ink/75">
                      {guide.why_use}
                    </p>
                  </div>
                </Reveal>
              )}

              <div className="max-w-[65ch]">
                <RenderGuideContent markdown={guide.content_markdown} />
              </div>

              {/* Drafting area */}
              <DraftingArea guideTitle={guide.title} guideSlug={guide.slug} />

              {/* Related campaigns */}
              {activeCampaigns.length > 0 && (
                <div className="mt-16 border-t border-border pt-10">
                  <p className="ledger text-warm-gray">Put it to work</p>
                  <h2 className="mt-3 font-display text-2xl text-forest">
                    Active Campaigns
                  </h2>
                  <div className="mt-6 border-t border-border">
                    {activeCampaigns.map((c) => (
                      <Link
                        key={c.id}
                        href={`/policy/campaigns/${c.slug}`}
                        className="group flex items-baseline justify-between gap-6 border-b border-border py-5 transition-colors hover:bg-white/40 md:px-3"
                      >
                        <div>
                          <p className="ledger text-rust">{c.category}</p>
                          <p className="mt-1.5 font-display text-lg leading-snug text-forest transition-colors group-hover:text-rust">
                            {c.title}
                          </p>
                        </div>
                        <span aria-hidden="true" className="arrow-nudge text-rust">
                          &rarr;
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* TOC sidebar */}
            {headings.length > 0 && (
              <aside className="hidden lg:col-span-4 lg:block">
                <div className="sticky top-24 border-l border-border pl-8">
                  <p className="ledger text-warm-gray">On this page</p>
                  <nav className="mt-5 flex flex-col gap-3">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="link-draw self-start font-body text-sm text-ink/60 transition-colors hover:text-forest"
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                  <div className="mt-8 border-t border-border pt-6">
                    <Link
                      href="/policy"
                      className="group inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-rust"
                    >
                      All policy tools
                      <span aria-hidden="true" className="arrow-nudge">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
