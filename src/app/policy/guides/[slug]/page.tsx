import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
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
          className="mt-12 mb-4 font-display text-2xl text-forest scroll-mt-24"
        >
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="my-3 font-body text-base font-semibold text-ink">
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
        <ul key={i} className="my-3 list-disc pl-6 font-body text-base leading-relaxed text-ink/75 space-y-1">
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
        <p key={i} className="my-3 font-body text-base leading-relaxed text-ink/75">
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
      <section className="bg-cream pb-20 pt-28 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Main content */}
            <article className="lg:col-span-8">
              <nav className="font-body text-xs text-warm-gray">
                <Link href="/policy" className="hover:text-forest">
                  Policy
                </Link>
                {" / "}
                <span className="text-ink/50">Guides</span>
              </nav>

              <h1 className="mt-6 font-display text-3xl leading-snug text-forest md:text-4xl">
                {guide.title}
              </h1>

              <div className="mt-3 flex items-center gap-4 font-body text-sm text-warm-gray">
                <span>{guide.read_time_minutes} min read</span>
                <span>&middot;</span>
                <span>Updated {lastUpdated}</span>
              </div>

              <hr className="my-8 border-border" />

              <div className="max-w-[65ch]">
                <RenderGuideContent markdown={guide.content_markdown} />
              </div>

              {/* Drafting area */}
              <DraftingArea guideTitle={guide.title} guideSlug={guide.slug} />

              {/* Related campaigns */}
              {activeCampaigns.length > 0 && (
                <div className="mt-16">
                  <hr className="mb-8 border-border" />
                  <h2 className="font-display text-xl text-forest">
                    Active Campaigns
                  </h2>
                  <div className="mt-4 flex flex-col gap-3">
                    {activeCampaigns.map((c) => (
                      <Link
                        key={c.id}
                        href={`/policy/campaigns/${c.slug}`}
                        className="rounded-sm border border-border px-5 py-4 transition-colors hover:bg-cream-dark"
                      >
                        <p className="font-body text-xs font-semibold uppercase tracking-wider text-rust">
                          {c.category}
                        </p>
                        <p className="mt-1 font-display text-base text-forest">
                          {c.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* TOC sidebar */}
            {headings.length > 0 && (
              <aside className="hidden lg:col-span-4 lg:block">
                <div className="sticky top-24">
                  <p className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                    On this page
                  </p>
                  <nav className="mt-4 flex flex-col gap-2">
                    {headings.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        className="font-body text-sm text-ink/60 transition-colors hover:text-forest"
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
