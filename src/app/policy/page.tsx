import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  title: "Policy | Rooted Forward",
  description:
    "Policy initiatives, research, and outreach resources from Rooted Forward.",
};

/* ------------------------------------------------------------------ */
/*  Policy initiative data — edit these arrays to update content       */
/* ------------------------------------------------------------------ */

interface PolicyItem {
  title: string;
  description: string;
  status: "active" | "planned" | "completed";
}

const INITIATIVES: PolicyItem[] = [
  {
    title: "Redlining Impact Documentation",
    description:
      "Mapping and documenting the ongoing effects of 1930s HOLC redlining maps on present-day Chicago neighborhoods. Collecting resident testimonies and infrastructure data.",
    status: "active",
  },
  {
    title: "Urban Renewal Displacement Research",
    description:
      "Researching the long-term outcomes of mid-century urban renewal projects in Bronzeville and Hyde Park, including displacement numbers and community impact.",
    status: "active",
  },
  {
    title: "Highway Routing and Community Division",
    description:
      "Examining how highway construction decisions in Chicago were used to reinforce racial segregation and destroy established neighborhoods.",
    status: "planned",
  },
  {
    title: "Anti-Gentrification Policy Toolkit",
    description:
      "Developing a set of policy recommendations and resources for communities facing gentrification pressure, starting with Pilsen.",
    status: "planned",
  },
];

const STATUS_LABELS: Record<PolicyItem["status"], string> = {
  active: "In Progress",
  planned: "Planned",
  completed: "Completed",
};

const STATUS_COLORS: Record<PolicyItem["status"], string> = {
  active: "bg-rust/15 text-rust",
  planned: "bg-warm-gray/15 text-warm-gray",
  completed: "bg-forest/15 text-forest",
};

/* ------------------------------------------------------------------ */
/*  Resource placeholder data — replace with real links when ready     */
/* ------------------------------------------------------------------ */

interface Resource {
  title: string;
  description: string;
  type: "document" | "link" | "toolkit";
}

const RESOURCES: Resource[] = [
  {
    title: "Policy Brief Template",
    description: "Template for writing policy briefs on local housing and infrastructure issues.",
    type: "document",
  },
  {
    title: "Community Outreach Guide",
    description: "How to engage community members in policy research and advocacy.",
    type: "toolkit",
  },
  {
    title: "Redlining Map Resources",
    description: "Links to HOLC map archives and tools for overlaying historical data.",
    type: "link",
  },
  {
    title: "Local Government Contacts",
    description: "Directory of relevant city and county officials for policy engagement.",
    type: "document",
  },
];

const TYPE_ICONS: Record<Resource["type"], string> = {
  document: "Doc",
  link: "Link",
  toolkit: "Kit",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PolicyPage() {
  return (
    <PageTransition>
      {/* Page Header */}
      <section className="bg-cream pb-12 pt-32 md:pt-40">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray">
            Policy
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.1] text-forest md:text-6xl">
            Policy &amp; Research
          </h1>
          <hr className="mt-8 w-24 border-t-2 border-rust" />
          <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-ink/70">
            Our tours and podcasts are grounded in policy research. This page
            tracks what we&rsquo;re working on, what we&rsquo;ve done, and
            resources for people doing similar work.
          </p>
        </div>
      </section>

      {/* ============================================================
          CURRENT INITIATIVES
          ============================================================ */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Initiatives
          </h2>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-ink/70">
            Policy research and documentation projects we&rsquo;re currently
            undertaking or planning to start.
          </p>

          <div className="mt-10 flex flex-col gap-6">
            {INITIATIVES.map((item, i) => (
              <div
                key={i}
                className="rounded-sm border border-border bg-cream-dark p-6 md:p-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-forest">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-body leading-relaxed text-ink/70">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 font-body text-xs font-semibold uppercase tracking-wider ${STATUS_COLORS[item.status]}`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          RESOURCES (PLACEHOLDER)
          ============================================================ */}
      <section className="border-t border-border bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            Resources
          </h2>
          <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-ink/70">
            Policy and outreach materials. More resources will be added as
            our work develops.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {RESOURCES.map((resource, i) => (
              <div
                key={i}
                className="rounded-sm border border-border bg-cream-dark p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-cream border border-border font-body text-xs font-bold uppercase text-warm-gray">
                    {TYPE_ICONS[resource.type]}
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-forest">
                      {resource.title}
                    </h3>
                    <p className="mt-1 font-body text-sm leading-relaxed text-ink/65">
                      {resource.description}
                    </p>
                    <p className="mt-3 font-body text-xs font-medium uppercase tracking-wider text-warm-gray">
                      Coming soon
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl text-cream md:text-5xl">
            Get Involved in Policy Work
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/70">
            Interested in contributing to our research or policy initiatives?
            We&rsquo;re always looking for people who want to dig into the data
            and push for change.
          </p>
          <Link
            href="/get-involved"
            className="mt-10 inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
          >
            Get Involved
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
