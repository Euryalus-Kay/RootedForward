"use client";

/* ------------------------------------------------------------------ */
/*  /admin/research                                                    */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Landing for the research admin section. Two entry points:        */
/*  entries (the archive) and directors (industry advisors).          */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, ExternalLink, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Counts {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  directors: number;
}

export default function AdminResearchHome() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const [all, pub, drafts, archived, directors] = await Promise.all([
          supabase
            .from("research_entries")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("research_entries")
            .select("id", { count: "exact", head: true })
            .eq("status", "published"),
          supabase
            .from("research_entries")
            .select("id", { count: "exact", head: true })
            .eq("status", "draft"),
          supabase
            .from("research_entries")
            .select("id", { count: "exact", head: true })
            .eq("status", "archived"),
          supabase
            .from("industry_directors")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
        ]);

        setCounts({
          total: all.count ?? 0,
          published: pub.count ?? 0,
          drafts: drafts.count ?? 0,
          archived: archived.count ?? 0,
          directors: directors.count ?? 0,
        });
      } catch {
        setCounts({
          total: 0,
          published: 0,
          drafts: 0,
          archived: 0,
          directors: 0,
        });
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            Research
          </h1>
          <p className="mt-1 max-w-xl font-body text-sm text-warm-gray">
            Manage every research entry and every industry director that
            appears on the /research page.
          </p>
        </div>
        <Link
          href="/research"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
        >
          <ExternalLink className="h-4 w-4" />
          View public page
        </Link>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="All entries" value={counts?.total} />
        <Stat label="Published" value={counts?.published} accent="forest" />
        <Stat label="Drafts" value={counts?.drafts} />
        <Stat label="Archived" value={counts?.archived} />
        <Stat label="Directors" value={counts?.directors} accent="rust" />
      </div>

      {/* Entry cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard
          href="/admin/research/entries"
          icon={<BookOpen className="h-5 w-5" />}
          title="Entries"
          description="Briefs, reports, primary sources, data analyses, and oral histories. Manage drafts, publish, archive, and edit citations."
          cta="Open entries"
        />
        <SectionCard
          href="/admin/research/directors"
          icon={<Users className="h-5 w-5" />}
          title="Industry Directors"
          description="Professionals and academics who review Rooted Forward research. Reorder, edit bios, upload headshots, archive."
          cta="Open directors"
        />
      </div>

      {/* Quick reference */}
      <div className="rounded-xl border border-border bg-white/60 p-5">
        <h2 className="font-display text-[15px] font-semibold text-forest">
          Publishing checklist
        </h2>
        <ul className="mt-3 space-y-2 font-body text-sm leading-relaxed text-ink/80">
          <li>
            <span className="mr-2 font-mono text-xs text-warm-gray">1.</span>
            Title, abstract, topic, city, format, published date.
          </li>
          <li>
            <span className="mr-2 font-mono text-xs text-warm-gray">2.</span>
            At least one author. Reviewers optional but encouraged for reports
            and data analyses.
          </li>
          <li>
            <span className="mr-2 font-mono text-xs text-warm-gray">3.</span>
            Full content (markdown) or PDF upload. Both is best.
          </li>
          <li>
            <span className="mr-2 font-mono text-xs text-warm-gray">4.</span>
            Citations entered with correct type. Use{" "}
            <code className="rounded bg-cream-dark px-1.5 py-0.5 font-mono text-[12px] text-ink">
              [^N]
            </code>{" "}
            in the body to reference a citation.
          </li>
          <li>
            <span className="mr-2 font-mono text-xs text-warm-gray">5.</span>
            Change status to Published and Save.
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | undefined;
  accent?: "forest" | "rust";
}) {
  const accentClass =
    accent === "forest"
      ? "text-forest"
      : accent === "rust"
        ? "text-rust"
        : "text-ink";
  return (
    <div className="rounded-lg border border-border bg-white/60 px-4 py-3">
      <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
        {label}
      </p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accentClass}`}>
        {value === undefined ? (
          <Loader2 className="h-5 w-5 animate-spin text-warm-gray" />
        ) : (
          value.toLocaleString()
        )}
      </p>
    </div>
  );
}

function SectionCard({
  href,
  icon,
  title,
  description,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-white/60 p-5 transition-all hover:border-warm-gray hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-forest/10 p-2 text-forest">{icon}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-forest">
            {title}
          </h3>
          <p className="mt-1 font-body text-sm leading-relaxed text-ink/75">
            {description}
          </p>
          <span className="mt-3 inline-block font-body text-sm font-medium text-rust transition-transform group-hover:translate-x-0.5">
            {cta} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
