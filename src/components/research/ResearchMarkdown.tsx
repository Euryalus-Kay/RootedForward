"use client";

/* ------------------------------------------------------------------ */
/*  ResearchMarkdown                                                   */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Long-form markdown renderer tuned for a research / press-archive  */
/*  reading experience.                                                */
/*                                                                     */
/*  - Standard markdown: # / ## / ### headings, paragraphs, lists,    */
/*    blockquotes, bold, italic, inline code, links.                  */
/*  - Citations: supports [^N] or [cite:N] syntax in the source.      */
/*    Renders each reference as a superscript number that links down  */
/*    to the matching citation in the bibliography (Citations.tsx).   */
/*    A back arrow in the citation scrolls the reader back to the    */
/*    point in the article where the citation was invoked.           */
/*  - Table of contents: h2 headings are scanned on render and        */
/*    emitted with stable ids (used by the TOC component).            */
/*  - Images: supports ![alt](url) with an optional caption on the   */
/*    line immediately following, prefixed with `^ `.                 */
/*                                                                     */
/*  Deliberately hand-rolled rather than pulling in a full markdown   */
/*  library. The subset we support is small, the behaviour we want   */
/*  (anchor-linked citations, heading ids, caption handling) is       */
/*  specific, and adding a dep is not worth the weight.               */
/*                                                                     */
/* ------------------------------------------------------------------ */

import React from "react";
import Link from "next/link";
import type { Citation } from "@/lib/types/database";

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ResearchMarkdownProps {
  source: string;
  citations?: Citation[];
  /** Called after first render with the discovered h2/h3 headings. */
  onHeadings?: (headings: Heading[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Escape any HTML-like characters in user content. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Apply inline markdown (bold, italic, inline code, links) to a text segment. */
function inlineMarkdown(raw: string): string {
  let text = escapeHtml(raw);

  // inline code first so its contents don't get re-processed
  text = text.replace(
    /`([^`]+?)`/g,
    '<code class="rounded bg-cream-dark px-1.5 py-0.5 text-[0.92em] font-mono text-forest">$1</code>'
  );

  // bold ** or __
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // italic * or _ (avoid matching inside bold — we handled bold first)
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/(^|\W)_(.+?)_(?=\W|$)/g, "$1<em>$2</em>");

  // inline links [text](url)
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-forest underline decoration-forest/40 underline-offset-2 transition-colors hover:decoration-forest" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return text;
}

/** Replace citation references in text with superscript anchor links. */
function renderCitationRefs(text: string, citationIds: Set<string>): string {
  // Supports [^1] and [cite:1]. The citation id in the text maps to
  // the `id` field on the Citation object in the citations array.
  return text.replace(/\[(?:\^|cite:)([\w-]+)\]/g, (_, idRaw) => {
    const id = String(idRaw);
    if (!citationIds.has(id)) return "";
    return `<sup id="cite-ref-${id}" class="ml-0.5 align-super"><a href="#citation-${id}" class="text-forest underline decoration-forest/30 decoration-1 underline-offset-2 hover:decoration-forest">[${id}]</a></sup>`;
  });
}

/* ------------------------------------------------------------------ */
/*  Block parser                                                       */
/* ------------------------------------------------------------------ */

interface Block {
  key: string;
  node: React.ReactNode;
}

function renderBlocks(
  source: string,
  citations: Citation[] | undefined
): { blocks: Block[]; headings: Heading[] } {
  const citationIds = new Set((citations ?? []).map((c) => c.id));
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const headings: Heading[] = [];
  let blockIdx = 0;

  /** Tracks heading-id collisions within a single document. */
  const usedHeadingIds = new Map<string, number>();

  function uniqueHeadingId(text: string): string {
    const base = slugifyHeading(text) || "section";
    const used = usedHeadingIds.get(base) ?? 0;
    const id = used === 0 ? base : `${base}-${used + 1}`;
    usedHeadingIds.set(base, used + 1);
    return id;
  }

  function pushBlock(node: React.ReactNode) {
    blocks.push({ key: `block-${blockIdx++}`, node });
  }

  function flushParagraph(buffer: string[]) {
    if (buffer.length === 0) return;
    const joined = buffer.join(" ").trim();
    if (!joined) {
      buffer.length = 0;
      return;
    }
    const html = renderCitationRefs(inlineMarkdown(joined), citationIds);
    pushBlock(
      <p
        key={`p-${blockIdx}`}
        className="font-body text-[17px] leading-[1.75] text-ink/85"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
    buffer.length = 0;
  }

  let i = 0;
  const paragraphBuffer: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Blank line breaks paragraph
    if (!trimmed.trim()) {
      flushParagraph(paragraphBuffer);
      i++;
      continue;
    }

    // Headings
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);

    if (h1 || h2 || h3) {
      flushParagraph(paragraphBuffer);
      const text = (h1?.[1] ?? h2?.[1] ?? h3?.[1] ?? "").trim();
      const level: 2 | 3 = h3 ? 3 : 2; // h1 is treated as h2 for TOC
      const id = uniqueHeadingId(text);
      headings.push({ id, text, level });
      const inlineHtml = renderCitationRefs(inlineMarkdown(text), citationIds);
      if (level === 2 || h1) {
        pushBlock(
          <h2
            key={id}
            id={id}
            className="scroll-mt-24 font-display text-[28px] leading-tight text-forest md:text-[32px]"
            dangerouslySetInnerHTML={{ __html: inlineHtml }}
          />
        );
      } else {
        pushBlock(
          <h3
            key={id}
            id={id}
            className="scroll-mt-24 font-display text-[22px] leading-snug text-forest md:text-[24px]"
            dangerouslySetInnerHTML={{ __html: inlineHtml }}
          />
        );
      }
      i++;
      continue;
    }

    // Blockquote (single or multi-line)
    if (trimmed.startsWith("> ")) {
      flushParagraph(paragraphBuffer);
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimEnd().startsWith("> ")) {
        quoteLines.push(lines[i].trimEnd().slice(2));
        i++;
      }
      const inner = inlineMarkdown(quoteLines.join(" "));
      const withCites = renderCitationRefs(inner, citationIds);
      pushBlock(
        <blockquote
          key={`bq-${blockIdx}`}
          className="my-2 border-l-2 border-forest/50 pl-5 font-body text-[17px] italic leading-[1.75] text-ink/75"
          dangerouslySetInnerHTML={{ __html: withCites }}
        />
      );
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      flushParagraph(paragraphBuffer);
      pushBlock(<hr key={`hr-${blockIdx}`} className="my-6 border-border" />);
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph(paragraphBuffer);
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trimEnd())) {
        items.push(lines[i].trimEnd().replace(/^[-*]\s+/, ""));
        i++;
      }
      pushBlock(
        <ul
          key={`ul-${blockIdx}`}
          className="ml-5 list-disc space-y-2 font-body text-[17px] leading-[1.75] text-ink/85 marker:text-warm-gray"
        >
          {items.map((item, idx) => {
            const html = renderCitationRefs(inlineMarkdown(item), citationIds);
            return (
              <li key={idx} dangerouslySetInnerHTML={{ __html: html }} />
            );
          })}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph(paragraphBuffer);
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trimEnd())) {
        items.push(lines[i].trimEnd().replace(/^\d+\.\s+/, ""));
        i++;
      }
      pushBlock(
        <ol
          key={`ol-${blockIdx}`}
          className="ml-5 list-decimal space-y-2 font-body text-[17px] leading-[1.75] text-ink/85 marker:text-warm-gray"
        >
          {items.map((item, idx) => {
            const html = renderCitationRefs(inlineMarkdown(item), citationIds);
            return (
              <li key={idx} dangerouslySetInnerHTML={{ __html: html }} />
            );
          })}
        </ol>
      );
      continue;
    }

    // Image: ![alt](url) with optional caption on next line beginning ^
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      flushParagraph(paragraphBuffer);
      const alt = imgMatch[1];
      const url = imgMatch[2];
      let caption: string | null = null;
      if (i + 1 < lines.length && lines[i + 1].trimEnd().startsWith("^ ")) {
        caption = lines[i + 1].trimEnd().slice(2);
        i++;
      }
      pushBlock(
        <figure key={`img-${blockIdx}`} className="my-2">
          <img
            src={url}
            alt={alt}
            className="w-full rounded-sm border border-border"
            loading="lazy"
          />
          {caption && (
            <figcaption
              className="mt-3 font-body text-sm leading-relaxed text-warm-gray"
              dangerouslySetInnerHTML={{ __html: inlineMarkdown(caption) }}
            />
          )}
        </figure>
      );
      i++;
      continue;
    }

    // Default: treat as paragraph content
    paragraphBuffer.push(trimmed);
    i++;
  }

  flushParagraph(paragraphBuffer);

  return { blocks, headings };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ResearchMarkdown({
  source,
  citations,
  onHeadings,
}: ResearchMarkdownProps) {
  const { blocks, headings } = React.useMemo(
    () => renderBlocks(source || "", citations),
    [source, citations]
  );

  React.useEffect(() => {
    onHeadings?.(headings);
  }, [headings, onHeadings]);

  if (!source || !source.trim()) {
    return (
      <p className="font-body text-base italic leading-relaxed text-warm-gray">
        This entry does not have a full body yet. Download the PDF above for
        the complete text.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b) => (
        <React.Fragment key={b.key}>{b.node}</React.Fragment>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Static extraction — for the server / TOC dropdown (no render)     */
/* ------------------------------------------------------------------ */

export function extractHeadings(source: string): Heading[] {
  const { headings } = renderBlocks(source || "", []);
  return headings;
}

/* ------------------------------------------------------------------ */
/*  Link back from citation → body text                                */
/* ------------------------------------------------------------------ */

/**
 * When a reader is on a citation in the Citations section, they
 * click this component to scroll back to the place in the article
 * body where the citation was invoked. The back-arrow link anchors
 * on the `#cite-ref-{id}` emitted by `renderCitationRefs`.
 */
export function CitationBackLink({ citationId }: { citationId: string }) {
  return (
    <Link
      href={`#cite-ref-${citationId}`}
      aria-label={`Jump back to the point in the article where citation ${citationId} is used`}
      className="ml-2 inline-flex items-center text-warm-gray transition-colors hover:text-forest"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
        />
      </svg>
    </Link>
  );
}
