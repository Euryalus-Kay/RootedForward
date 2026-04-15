import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Policy Brief | Rooted Forward`,
    description: `Policy brief: ${slug.replace(/-/g, " ")}`,
  };
}

export default async function BriefDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Try to fetch from Supabase
  let brief = null;
  try {
    const { isSupabaseConfigured, createClient } = await import("@/lib/supabase/server");
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("policy_briefs" as never)
      .select("*")
      .eq("slug" as never, slug)
      .single();
    if (!error && data) brief = data;
  } catch {
    // fallback
  }

  if (!brief) {
    notFound();
  }

  return (
    <PageTransition>
      <section className="bg-cream pb-20 pt-28 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-4xl px-6">
          <nav className="font-body text-xs text-warm-gray">
            <Link href="/policy" className="hover:text-forest">
              Policy
            </Link>
            {" / "}
            <span className="text-ink/50">Briefs</span>
          </nav>

          <h1 className="mt-6 font-display text-3xl leading-snug text-forest md:text-4xl">
            {(brief as Record<string, unknown>).title as string}
          </h1>

          <hr className="my-8 border-border" />

          <div className="max-w-[65ch] font-body text-base leading-relaxed text-ink/75">
            <p>Brief content will appear here when published.</p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
