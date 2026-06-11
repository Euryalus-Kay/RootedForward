"use client";

/* ------------------------------------------------------------------ */
/*  ResearchTOC                                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Table of contents for the /research/[slug] detail page.           */
/*                                                                     */
/*  - Desktop (lg+): sticky column on the right margin, auto-          */
/*    highlights the section currently visible in the viewport.       */
/*  - Mobile: collapsible dropdown at the top of the article.         */
/*                                                                     */
/*  The TOC is generated from h2 headings emitted by                  */
/*  ResearchMarkdown via its `onHeadings` callback. We intentionally   */
/*  do not show h3 headings in the TOC — the design spec calls for    */
/*  one-level navigation.                                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Heading } from "@/components/research/ResearchMarkdown";

interface ResearchTOCProps {
  headings: Heading[];
}

export default function ResearchTOC({ headings }: ResearchTOCProps) {
  const topHeadings = useMemo(
    () => headings.filter((h) => h.level === 2),
    [headings]
  );

  const [activeId, setActiveId] = useState<string | null>(
    topHeadings[0]?.id ?? null
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ---------------- Scrollspy ---------------- */
  useEffect(() => {
    if (topHeadings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost entry that is currently in the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        // Account for the sticky navbar at the top of the page.
        rootMargin: "-96px 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    const nodes = topHeadings
      .map((h) => document.getElementById(h.id))
      .filter((n): n is HTMLElement => !!n);

    nodes.forEach((n) => observer.observe(n));

    return () => {
      nodes.forEach((n) => observer.unobserve(n));
      observer.disconnect();
    };
  }, [topHeadings]);

  if (topHeadings.length === 0) return null;

  const activeLabel =
    topHeadings.find((h) => h.id === activeId)?.text ??
    topHeadings[0].text;

  return (
    <>
      {/* ============================================================
          Mobile TOC — collapsible dropdown at the top of content
          ============================================================ */}
      <div className="mb-8 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-sm border border-border bg-cream-dark/60 px-4 py-3 text-left font-body text-sm text-ink transition-colors hover:bg-cream-dark"
          aria-expanded={mobileOpen}
          aria-controls="research-toc-mobile"
        >
          <span className="flex items-center gap-2">
            <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-warm-gray">
              Contents
            </span>
            <span className="text-warm-gray">/</span>
            <span className="truncate">{activeLabel}</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-warm-gray transition-transform ${
              mobileOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {mobileOpen && (
          <nav
            id="research-toc-mobile"
            aria-label="Table of contents"
            className="mt-2 rounded-sm border border-border bg-cream px-4 py-3"
          >
            <ol className="flex flex-col gap-1">
              {topHeadings.map((h, idx) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`block py-1 font-body text-sm leading-snug transition-colors ${
                      activeId === h.id
                        ? "text-forest"
                        : "text-ink/70 hover:text-forest"
                    }`}
                  >
                    <span className="mr-2 font-mono text-xs text-warm-gray">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>

      {/* ============================================================
          Desktop TOC — sticky right margin
          ============================================================ */}
      <aside
        className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto pl-8 lg:block"
        aria-label="Table of contents"
      >
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-warm-gray">
          Contents
        </p>
        <nav className="mt-3 border-l border-border">
          <ol className="flex flex-col">
            {topHeadings.map((h, idx) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={`relative block py-1.5 pl-4 pr-1 font-body text-[13px] leading-snug transition-colors ${
                    activeId === h.id
                      ? "text-forest"
                      : "text-ink/55 hover:text-forest"
                  }`}
                >
                  {activeId === h.id && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[-1px] top-1 h-[calc(100%-8px)] w-[2px] bg-forest"
                    />
                  )}
                  <span className="mr-2 font-mono text-[10px] text-warm-gray">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    </>
  );
}
