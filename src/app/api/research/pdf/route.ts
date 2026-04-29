/* ------------------------------------------------------------------ */
/*  /api/research/pdf?slug=...                                         */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Generates a real downloadable PDF of a published research entry.  */
/*  Server-side, uses pdfkit with no Chromium dependency, returns a   */
/*  Content-Disposition: attachment response so the browser saves to  */
/*  disk rather than opening the print dialog.                        */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  cityLabel,
  formatLabel,
  normalizeCitations,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Colors (ink, forest, warm-gray) keyed to the on-site design       */
/* ------------------------------------------------------------------ */

const INK = "#1A1A1A";
const FOREST = "#1B3A2D";
const WARM_GRAY = "#6F6A5D";
const RULE = "#D9D2C1";

/* ------------------------------------------------------------------ */
/*  Fetch entry                                                        */
/* ------------------------------------------------------------------ */

async function fetchEntry(slug: string): Promise<ResearchEntry | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data } = await supabase
        .from("research_entries")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (data) {
        return {
          ...data,
          authors: data.authors ?? [],
          reviewers: data.reviewers ?? [],
          citations: normalizeCitations(data.citations),
          related_campaign_ids: data.related_campaign_ids ?? [],
          related_tour_slugs: data.related_tour_slugs ?? [],
        } as ResearchEntry;
      }
    }
  } catch {
    // fall through to placeholder
  }
  return PLACEHOLDER_RESEARCH_ENTRIES.find((e) => e.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/*  Format helpers                                                     */
/* ------------------------------------------------------------------ */

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function formatPublicationDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Strip lightweight inline markdown (bold, italic, code, links, citation refs). */
function stripInline(text: string): string {
  return text
    .replace(/\[(?:\^|cite:)([\w-]+)\]/g, "[$1]")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/(^|\W)_(.+?)_(?=\W|$)/g, "$1$2");
}

/* ------------------------------------------------------------------ */
/*  Markdown renderer to pdfkit                                        */
/* ------------------------------------------------------------------ */

interface RenderCtx {
  doc: PDFKit.PDFDocument;
  margin: number;
}

function drawHorizontalRule({ doc, margin }: RenderCtx) {
  const width = doc.page.width - margin * 2;
  doc.save();
  doc.moveTo(margin, doc.y).lineTo(margin + width, doc.y).lineWidth(0.4)
    .strokeColor(RULE).stroke();
  doc.restore();
  doc.moveDown(0.8);
}

function renderMarkdownToPdf(doc: PDFKit.PDFDocument, source: string, margin: number) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  const contentWidth = doc.page.width - margin * 2;

  const paragraphBuffer: string[] = [];
  const flush = () => {
    if (paragraphBuffer.length === 0) return;
    const joined = stripInline(paragraphBuffer.join(" ").trim());
    if (joined) {
      doc.font("Times-Roman").fontSize(11).fillColor(INK);
      doc.text(joined, {
        align: "justify",
        lineGap: 2,
        width: contentWidth,
      });
      doc.moveDown(0.6);
    }
    paragraphBuffer.length = 0;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();

    if (!trimmed.trim()) {
      flush();
      i++;
      continue;
    }

    // Skip fenced code blocks (charts / maps) — represent as a figure caption
    const fenceOpen = trimmed.match(/^```(chart|map|math)?\s*$/);
    if (fenceOpen) {
      flush();
      const fenceType = fenceOpen[1] ?? "code";
      const fenceLines: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trimEnd())) {
        fenceLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      // Try to parse caption out of JSON-ish config
      let caption: string | null = null;
      try {
        const cfg = JSON.parse(fenceLines.join("\n"));
        caption = cfg.caption ?? cfg.title ?? null;
      } catch {
        /* ignore */
      }
      doc.font("Times-Italic").fontSize(10).fillColor(WARM_GRAY);
      const label = fenceType === "chart" ? "[Figure: chart]" : fenceType === "map" ? "[Figure: map]" : "[Figure]";
      doc.text(
        caption ? `${label} ${caption}` : label,
        { width: contentWidth, lineGap: 1 }
      );
      doc.moveDown(0.8);
      continue;
    }

    // Headings
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);

    if (h1 || h2 || h3) {
      flush();
      const text = stripInline((h1?.[1] ?? h2?.[1] ?? h3?.[1] ?? "").trim());
      doc.moveDown(0.3);
      if (h3) {
        doc.font("Times-Bold").fontSize(12).fillColor(FOREST);
      } else {
        doc.font("Times-Bold").fontSize(14).fillColor(FOREST);
      }
      doc.text(text, { width: contentWidth });
      doc.moveDown(0.3);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flush();
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimEnd().startsWith("> ")) {
        quoteLines.push(lines[i].trimEnd().slice(2));
        i++;
      }
      const quoteText = stripInline(quoteLines.join(" "));
      doc.font("Times-Italic").fontSize(11).fillColor(INK);
      const indent = 18;
      doc.text(quoteText, margin + indent, doc.y, {
        width: contentWidth - indent * 2,
        align: "justify",
        lineGap: 2,
      });
      doc.moveDown(0.6);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      flush();
      drawHorizontalRule({ doc, margin });
      i++;
      continue;
    }

    // Table — capture and render minimally as italic label
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flush();
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trimEnd().startsWith("|") &&
        lines[i].trimEnd().endsWith("|")
      ) {
        tableLines.push(lines[i].trimEnd());
        i++;
      }
      // Render cleanly column-aligned
      const rows = tableLines
        .filter((l) => !/^\|\s*-+[-|:\s]*\|\s*$/.test(l))
        .map((l) =>
          l
            .slice(1, -1)
            .split("|")
            .map((c) => stripInline(c.trim()))
        );
      if (rows.length) {
        const cols = rows[0].length;
        const colWidth = contentWidth / cols;
        doc.font("Times-Roman").fontSize(9.5).fillColor(INK);
        const startY = doc.y;
        let rowY = startY;
        for (const row of rows) {
          // measure tallest cell in this row
          let rowHeight = 0;
          for (let c = 0; c < cols; c++) {
            const cell = row[c] ?? "";
            const h = doc.heightOfString(cell, { width: colWidth - 6 });
            rowHeight = Math.max(rowHeight, h);
          }
          // draw cells
          for (let c = 0; c < cols; c++) {
            const cell = row[c] ?? "";
            doc.text(cell, margin + c * colWidth + 3, rowY, {
              width: colWidth - 6,
              lineGap: 1,
            });
          }
          rowY += rowHeight + 5;
          if (rowY > doc.page.height - margin - 20) {
            doc.addPage();
            rowY = doc.y;
          }
        }
        doc.y = rowY;
        doc.moveDown(0.5);
      }
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      flush();
      doc.font("Times-Roman").fontSize(11).fillColor(INK);
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trimEnd())) {
        const item = stripInline(lines[i].trimEnd().replace(/^[-*]\s+/, ""));
        doc.text(`•  ${item}`, margin + 12, doc.y, {
          width: contentWidth - 12,
          lineGap: 2,
          align: "left",
          indent: 0,
        });
        doc.moveDown(0.2);
        i++;
      }
      doc.moveDown(0.3);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      flush();
      doc.font("Times-Roman").fontSize(11).fillColor(INK);
      let n = 1;
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trimEnd())) {
        const item = stripInline(lines[i].trimEnd().replace(/^\d+\.\s+/, ""));
        doc.text(`${n}.  ${item}`, margin + 12, doc.y, {
          width: contentWidth - 12,
          lineGap: 2,
          align: "left",
          indent: 0,
        });
        doc.moveDown(0.2);
        n++;
        i++;
      }
      doc.moveDown(0.3);
      continue;
    }

    paragraphBuffer.push(trimmed);
    i++;
  }

  flush();
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const entry = await fetchEntry(slug);
  if (!entry) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const margin = 72; // 1 inch
  const doc = new PDFDocument({
    size: "LETTER",
    margin,
    info: {
      Title: entry.title,
      Author: entry.authors.join(", "),
      Subject: entry.abstract,
      Creator: "Rooted Forward Research",
      Producer: "Rooted Forward",
    },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk as Buffer));
  const endPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  /* ---------- COVER / HEADER ---------- */

  const contentWidth = doc.page.width - margin * 2;

  // Masthead
  doc.font("Times-Bold").fontSize(9).fillColor(WARM_GRAY)
    .text("ROOTED FORWARD RESEARCH", margin, margin, { characterSpacing: 1.5 });
  doc.moveDown(0.3);
  drawHorizontalRule({ doc, margin });

  // Title
  doc.font("Times-Bold").fontSize(22).fillColor(FOREST);
  doc.text(entry.title, { width: contentWidth, lineGap: 3 });
  doc.moveDown(0.5);

  // Metadata line
  doc.font("Times-Roman").fontSize(10).fillColor(WARM_GRAY);
  doc.text(
    `${formatLabel(entry.format)}  ·  ${entry.topic}  ·  ${cityLabel(entry.city)}`,
    { width: contentWidth }
  );
  doc.moveDown(0.2);
  doc.text(`Published ${formatPublicationDate(entry.published_date)}`, {
    width: contentWidth,
  });
  doc.moveDown(0.5);

  // Credits
  doc.font("Times-Roman").fontSize(10.5).fillColor(INK);
  doc.text(`Published by ${formatList(entry.authors)}`, { width: contentWidth });
  if (entry.reviewers && entry.reviewers.length > 0) {
    doc.font("Times-Roman").fontSize(10).fillColor(WARM_GRAY);
    doc.text(`Reviewed by ${formatList(entry.reviewers)}`, {
      width: contentWidth,
    });
  }
  doc.moveDown(0.8);
  drawHorizontalRule({ doc, margin });

  /* ---------- BODY ---------- */

  doc.font("Times-Roman").fontSize(11).fillColor(INK);
  renderMarkdownToPdf(doc, entry.full_content_markdown ?? "", margin);

  /* ---------- CITATIONS ---------- */

  if (entry.citations && entry.citations.length > 0) {
    doc.addPage();
    doc.font("Times-Bold").fontSize(14).fillColor(FOREST);
    doc.text("Citations", { width: contentWidth });
    doc.moveDown(0.4);
    drawHorizontalRule({ doc, margin });

    entry.citations.forEach((c, idx) => {
      doc.font("Times-Bold").fontSize(10).fillColor(FOREST);
      doc.text(`[${c.id ?? idx + 1}]`, margin, doc.y, { continued: true });
      doc.font("Times-Roman").fontSize(10).fillColor(INK);
      doc.text(`  ${stripInline(c.text)}`, {
        width: contentWidth,
        lineGap: 1.5,
      });
      if (c.url) {
        doc.font("Times-Italic").fontSize(9).fillColor(WARM_GRAY);
        doc.text(c.url, { width: contentWidth });
      }
      if (c.accessed_date) {
        doc.font("Times-Italic").fontSize(9).fillColor(WARM_GRAY);
        doc.text(`Accessed ${c.accessed_date}`, { width: contentWidth });
      }
      doc.moveDown(0.45);
    });
  }

  /* ---------- FOOTER (page numbers, colophon) ---------- */

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const footerY = doc.page.height - margin / 2 - 6;
    doc.font("Times-Roman").fontSize(8).fillColor(WARM_GRAY);
    doc.text(
      "Rooted Forward · rooted-forward.org/research",
      margin,
      footerY,
      { width: contentWidth / 2, lineBreak: false }
    );
    doc.text(
      `${i + 1} / ${range.count}`,
      margin + contentWidth / 2,
      footerY,
      { width: contentWidth / 2, align: "right", lineBreak: false }
    );
  }

  doc.end();
  const pdfBuffer = await endPromise;

  const filename = `${entry.slug}.pdf`;
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
