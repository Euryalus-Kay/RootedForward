"use client";

/* ------------------------------------------------------------------ */
/*  /admin/research/help                                               */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  A reference guide for admin users working on the research        */
/*  archive. Covers publishing workflow, citation syntax, file      */
/*  upload constraints, related-content linking, and troubleshooting. */
/*                                                                     */
/*  Deliberately long and thorough — this is the document admins     */
/*  come back to when they forget how something works.                */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: GuideSection[] = [
  { id: "getting-started", title: "Getting started", icon: BookOpen },
  { id: "publishing-workflow", title: "Publishing workflow", icon: Check },
  { id: "citations", title: "Citations", icon: Tag },
  { id: "uploads", title: "PDF and cover uploads", icon: FileText },
  { id: "directors", title: "Industry directors", icon: Users },
  { id: "related-content", title: "Related content", icon: LinkIcon },
  { id: "images", title: "Images and figures", icon: ImageIcon },
  { id: "permissions", title: "Permissions", icon: ShieldCheck },
  { id: "troubleshooting", title: "Troubleshooting", icon: Info },
];

export default function AdminResearchHelpPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/research"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-body text-sm text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to research admin
        </Link>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-forest">
          Research admin guide
        </h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-warm-gray">
          Everything you need to know to create, edit, and publish research
          entries and manage industry directors. Written for new editors, but
          kept here as a reference for anyone who needs to look something up.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="max-w-3xl space-y-10">
          <Section id="getting-started" title="Getting started" icon={BookOpen}>
            <p>
              The research archive lives on the public site at{" "}
              <InlineCode>/research</InlineCode>. Every published entry appears
              there, sorted by publication date. Each entry has a detail page
              at <InlineCode>/research/[slug]</InlineCode> that renders the
              full body, citations, and related content.
            </p>
            <p>
              The admin side has two surfaces:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <Link
                  href="/admin/research/entries"
                  className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                >
                  Entries
                </Link>{" "}
                &mdash; every research entry (draft, published, or archived).
              </li>
              <li>
                <Link
                  href="/admin/research/directors"
                  className="text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
                >
                  Industry Directors
                </Link>{" "}
                &mdash; the roster of advisors shown on{" "}
                <InlineCode>/research</InlineCode>.
              </li>
            </ul>
            <p>
              If you are authoring a new piece of research, start at{" "}
              <InlineCode>Entries</InlineCode> and click{" "}
              <strong>New Entry</strong>. The form walks through every field.
              You can save a draft at any time and return later.
            </p>
          </Section>

          <Section
            id="publishing-workflow"
            title="Publishing workflow"
            icon={Check}
          >
            <p>
              Every entry has one of three statuses:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>Draft</strong> &mdash; visible only in the admin. Not
                shown anywhere on the public site.
              </li>
              <li>
                <strong>Published</strong> &mdash; appears on the public
                archive, on filtered views, in the sitemap, and in the JSON
                feed at <InlineCode>/api/research/entries</InlineCode>.
              </li>
              <li>
                <strong>Archived</strong> &mdash; hidden from the public
                archive but preserved in the database and in the admin. Use
                this for entries that are historically important but no longer
                representative of current thinking. Archived entries can be
                restored at any time.
              </li>
            </ul>

            <p className="pt-2">The standard flow is:</p>
            <ol className="ml-5 list-decimal space-y-1.5">
              <li>Create a new entry from the Entries index.</li>
              <li>
                Fill in title, abstract, topic, city, format, published date,
                and at least one author.
              </li>
              <li>
                Write the body as markdown in the editor (supports the full
                syntax described in the Citations section below).
              </li>
              <li>Enter citations in the Citations editor.</li>
              <li>
                Upload a PDF if the entry has a typeset version available.
                Upload a cover image if you have one &mdash; otherwise the
                public page will render a typographic cover automatically.
              </li>
              <li>Save as Draft to preview.</li>
              <li>
                Click <strong>View public page</strong> to see what the
                published entry will look like.
              </li>
              <li>
                When ready, switch status to <strong>Published</strong> and
                save, or click <strong>Save &amp; publish</strong> directly.
              </li>
            </ol>

            <p>
              Published entries re-cache at most once per hour. If you
              urgently need a freshly-published entry to be visible, trigger a
              manual rebuild from the project settings, or wait the default
              revalidation interval.
            </p>
          </Section>

          <Section id="citations" title="Citations" icon={Tag}>
            <p>
              Every citation in a research entry has five fields:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>ID</strong> &mdash; auto-assigned. This is the number
                you reference in the body markdown.
              </li>
              <li>
                <strong>Type</strong> &mdash; primary or secondary. The detail
                page splits them into two subsections if both are present.
              </li>
              <li>
                <strong>Citation text</strong> &mdash; the full bibliographic
                entry in Chicago Manual of Style format.
              </li>
              <li>
                <strong>URL</strong> &mdash; optional. If provided, the
                citation text links to this URL on the public page.
              </li>
              <li>
                <strong>Accessed date</strong> &mdash; optional. If provided,
                &quot;Accessed [date]&quot; is appended to the citation.
              </li>
            </ul>

            <p className="pt-2">
              To reference a citation in the body, use one of these syntaxes:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <InlineCode>[^1]</InlineCode> &mdash; standard footnote syntax.
              </li>
              <li>
                <InlineCode>[cite:1]</InlineCode> &mdash; alternative syntax,
                functionally identical.
              </li>
            </ul>

            <p>
              Both render as a superscript linked number that scrolls down to
              the corresponding citation in the bibliography at the bottom of
              the page. The citation in the bibliography has a back-arrow
              that scrolls the reader back to the invocation point. This is
              standard academic footnote behavior.
            </p>

            <p>
              Citations can be reordered by dragging them in the Citations
              editor. When you reorder, the IDs are re-numbered to match.
              Update your body markdown to match the new IDs, or reorder
              before you write the body.
            </p>

            <p>
              If a citation is unused in the body, it still appears in the
              bibliography. The back-arrow just has no corresponding anchor
              and the link is a no-op. Cleaner practice: remove unused
              citations.
            </p>
          </Section>

          <Section id="uploads" title="PDF and cover uploads" icon={FileText}>
            <p>
              Every research entry can have two uploaded assets:
            </p>

            <h3 className="font-display text-[17px] font-semibold text-forest">
              PDF
            </h3>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Stored in the <InlineCode>research-pdfs</InlineCode> Supabase Storage bucket.</li>
              <li>Accepted format: PDF only.</li>
              <li>Max size: 25 MB.</li>
              <li>
                Filename is <InlineCode>{"{entry-id}.pdf"}</InlineCode> once
                the entry has an ID, or a timestamped draft filename
                otherwise.
              </li>
              <li>
                Uploading a replacement overwrites the existing file (no
                version history).
              </li>
            </ul>

            <h3 className="font-display text-[17px] font-semibold text-forest">
              Cover image
            </h3>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                Stored in the shared <InlineCode>media</InlineCode> bucket
                under the <InlineCode>research-covers</InlineCode> folder.
              </li>
              <li>Accepted formats: JPG, PNG, WebP.</li>
              <li>Max size: 5 MB.</li>
              <li>
                Recommended aspect ratio: 4:5 (portrait), matching what the
                featured entry treatment renders.
              </li>
              <li>
                Optional. Entries without a cover image render a typographic
                cover with the topic name in display serif &mdash; this is
                usually the right choice for data analyses, briefs, and
                primary source collections where a photograph would feel
                mismatched.
              </li>
            </ul>
          </Section>

          <Section id="directors" title="Industry directors" icon={Users}>
            <p>
              Industry directors appear on the public research page in the
              order set by their <InlineCode>display_order</InlineCode>
              &nbsp;value, low to high. We use increments of 10 so that
              inserting a new director between two existing ones does not
              require renumbering everyone.
            </p>
            <p>
              You can change order by:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>Drag-and-drop.</strong> Grab the handle on the left of
                each director row and drag to a new position. This
                automatically renumbers all directors in 10-unit increments.
              </li>
              <li>
                <strong>Manual entry.</strong> Type a new number in the
                &quot;Order&quot; input next to each director. Useful when
                you want to move one director to a very specific position.
              </li>
            </ul>

            <p>
              Photo uploads are client-side resized to 800x800 before
              upload. This keeps the public page fast and ensures consistent
              crop across all director cards. The resize is a center-crop, so
              upload photos that work well cropped to a square. If you need
              precise control over the crop, pre-crop the image before
              uploading.
            </p>

            <p>
              To remove a director temporarily, toggle{" "}
              <strong>Archive</strong>. This sets{" "}
              <InlineCode>is_active = false</InlineCode> and hides the
              director from the public page while preserving the record. To
              remove permanently, use <strong>Delete</strong>, which cannot
              be undone.
            </p>
          </Section>

          <Section
            id="related-content"
            title="Related content"
            icon={LinkIcon}
          >
            <p>
              The detail page for each research entry shows up to three
              sections of related content at the bottom:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <strong>More research</strong> &mdash; up to three other
                published entries sharing topic or city tags. Auto-populated
                from the archive.
              </li>
              <li>
                <strong>Related campaigns</strong> &mdash; populated from the{" "}
                <InlineCode>related_campaign_ids</InlineCode> array. Select
                from the campaign picker in the entry editor.
              </li>
              <li>
                <strong>Related walking tour stops</strong> &mdash; populated
                from the <InlineCode>related_tour_slugs</InlineCode> array.
                Type the slug of a tour stop as a chip.
              </li>
            </ul>

            <p>
              A research entry with <InlineCode>format = &quot;brief&quot;</InlineCode>{" "}
              and at least one <InlineCode>related_campaign_ids</InlineCode>{" "}
              also surfaces on the Policy page as a policy brief. This is
              how the policy page integrates with the research archive after
              the merge of the legacy <InlineCode>policy_briefs</InlineCode>{" "}
              table into <InlineCode>research_entries</InlineCode>.
            </p>
          </Section>

          <Section id="images" title="Images and figures" icon={ImageIcon}>
            <p>
              The markdown body supports inline images with captions. Syntax:
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-cream-dark/40 px-3 py-2 font-mono text-[13px] leading-snug text-ink">
              {"![Alt text describing the image](/path/to/image.jpg)\n^ Caption that appears below the image, in small muted text."}
            </pre>
            <p>
              The <InlineCode>^</InlineCode> on the line immediately after the
              image marks a caption. This is a Rooted Forward convention, not
              standard markdown.
            </p>
            <p>
              Images are not hosted by the research admin &mdash; upload them
              to the <InlineCode>media</InlineCode> Supabase Storage bucket
              (use the Site Content admin page) and reference their public URLs
              here. For very large graphics or multi-page figure groups,
              consider packaging them in the PDF instead.
            </p>
          </Section>

          <Section id="permissions" title="Permissions" icon={ShieldCheck}>
            <p>
              Only users with <InlineCode>role = admin</InlineCode> in the{" "}
              <InlineCode>users</InlineCode> table can create, edit, or
              delete research entries and directors. Row Level Security is
              enforced at the database level, so even direct API requests
              without admin credentials will fail.
            </p>
            <p>
              Public users can read published entries and active directors
              through both the website and the read-only JSON API at{" "}
              <InlineCode>/api/research/entries</InlineCode> and{" "}
              <InlineCode>/api/research/directors</InlineCode>. Drafts and
              archived entries are never exposed through either surface.
            </p>
            <p>
              Uploaded PDFs and director photos are in public buckets. The
              URLs are unguessable but not authenticated, so treat them as
              publicly accessible once uploaded. Do not upload sensitive or
              pre-release material to these buckets.
            </p>
          </Section>

          <Section
            id="troubleshooting"
            title="Troubleshooting"
            icon={Info}
          >
            <p>
              Common issues and their fixes:
            </p>

            <h3 className="font-display text-[17px] font-semibold text-forest">
              &ldquo;Failed to save entry&rdquo; error
            </h3>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                Check that the slug is unique across all entries. A duplicate
                slug will fail the database unique-constraint.
              </li>
              <li>
                Check that the published date is a valid date (YYYY-MM-DD).
              </li>
              <li>
                If the error message is about a storage bucket, confirm the
                bucket exists in Supabase and that your admin account has
                write permission.
              </li>
            </ul>

            <h3 className="font-display text-[17px] font-semibold text-forest">
              Citation superscripts do not render
            </h3>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                Confirm the citation ID you referenced in the body exists in
                the Citations editor. A reference to{" "}
                <InlineCode>[^5]</InlineCode> when there is no citation with
                ID 5 renders as empty.
              </li>
              <li>
                Confirm the syntax is exactly <InlineCode>[^N]</InlineCode>{" "}
                or <InlineCode>[cite:N]</InlineCode> with no spaces inside
                the brackets.
              </li>
            </ul>

            <h3 className="font-display text-[17px] font-semibold text-forest">
              Director photo shows the wrong image after upload
            </h3>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                The public page caches director photos aggressively. The
                admin preview includes a cache-buster, but the public page
                may take up to an hour to refresh.
              </li>
              <li>
                If you need an immediate update, re-upload with a slightly
                different filename (toggle active and back, then re-upload).
              </li>
            </ul>

            <h3 className="font-display text-[17px] font-semibold text-forest">
              Entry does not appear on the public page
            </h3>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>Confirm the status is <strong>Published</strong>, not Draft.</li>
              <li>Confirm the published date is not in the future (future-dated published entries are technically visible but can be confusing).</li>
              <li>
                The public page caches for up to one hour. If you just
                published, wait or force a rebuild.
              </li>
            </ul>
          </Section>

          <Section id="api" title="API access" icon={LinkIcon}>
            <p>
              The research archive is also available as a JSON feed:
            </p>
            <ul className="ml-5 list-disc space-y-1.5">
              <li>
                <InlineCode>GET /api/research/entries</InlineCode> &mdash;
                paginated list of published entries. Supports{" "}
                <InlineCode>?topic=</InlineCode>,{" "}
                <InlineCode>?city=</InlineCode>,{" "}
                <InlineCode>?format=</InlineCode>,{" "}
                <InlineCode>?sort=</InlineCode>,{" "}
                <InlineCode>?page=</InlineCode>, and{" "}
                <InlineCode>?per_page=</InlineCode>.
              </li>
              <li>
                <InlineCode>GET /api/research/entries/[slug]</InlineCode>{" "}
                &mdash; single entry with full body, citations, and related
                metadata.
              </li>
              <li>
                <InlineCode>GET /api/research/directors</InlineCode> &mdash;
                active directors in display order. Pass{" "}
                <InlineCode>?include_archived=true</InlineCode> to include
                archived directors.
              </li>
              <li>
                <InlineCode>GET /api/research/directors/[id]</InlineCode>{" "}
                &mdash; single director by id or slug.
              </li>
            </ul>
            <p>
              Write endpoints (POST, PATCH, DELETE) require an admin session
              cookie. They are intended for programmatic updates from within
              the Rooted Forward org, not public write access. The public
              should consume the read endpoints only.
            </p>
          </Section>
        </div>

        {/* Sticky TOC */}
        <aside className="sticky top-8 hidden h-fit lg:block">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
            In this guide
          </p>
          <nav className="mt-3 border-l border-border">
            <ol className="flex flex-col">
              {SECTIONS.map((sec, idx) => {
                const Icon = sec.icon;
                return (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="flex items-center gap-2 py-1.5 pl-4 pr-1 font-body text-[13px] leading-snug text-ink/70 transition-colors hover:text-forest"
                    >
                      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-warm-gray" />
                      <span>
                        <span className="mr-1.5 font-mono text-[10px] text-warm-gray">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {sec.title}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

interface SectionProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function Section({ id, title, icon: Icon, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
        <Icon className="h-5 w-5 text-forest" />
        <h2 className="font-display text-xl font-semibold text-forest">
          {title}
        </h2>
      </div>
      <div className="space-y-3 font-body text-[15px] leading-[1.7] text-ink/85">
        {children}
      </div>
    </section>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-cream-dark/60 px-1.5 py-0.5 font-mono text-[12.5px] text-forest">
      {children}
    </code>
  );
}
