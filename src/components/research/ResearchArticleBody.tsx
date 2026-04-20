"use client";

/* ------------------------------------------------------------------ */
/*  ResearchArticleBody                                                */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Client wrapper that glues ResearchMarkdown together with the TOC */
/*  component. Markdown rendering produces the headings array, which */
/*  the TOC consumes for scrollspy. Keeping them in one client       */
/*  boundary means the heading state lives locally and doesn't       */
/*  require server round-trips.                                        */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import ResearchMarkdown, {
  type Heading,
} from "@/components/research/ResearchMarkdown";
import ResearchTOC from "@/components/research/ResearchTOC";
import CitationsList from "@/components/research/CitationsList";
import type { Citation } from "@/lib/types/database";

interface ResearchArticleBodyProps {
  markdown: string | null;
  citations: Citation[];
}

export default function ResearchArticleBody({
  markdown,
  citations,
}: ResearchArticleBodyProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
      {/* Article column */}
      <article className="max-w-[65ch]">
        {/* TOC is rendered inline on mobile (top of article) and
            in the right column on desktop — the component handles
            both layouts via responsive CSS. The mobile one appears
            here, the desktop one appears in the sticky right column
            below. */}
        <div className="lg:hidden">
          <ResearchTOC headings={headings} />
        </div>

        <ResearchMarkdown
          source={markdown ?? ""}
          citations={citations}
          onHeadings={setHeadings}
        />

        <CitationsList citations={citations} />
      </article>

      {/* Desktop TOC — sticky right column */}
      <div className="hidden lg:block">
        <ResearchTOC headings={headings} />
      </div>
    </div>
  );
}
