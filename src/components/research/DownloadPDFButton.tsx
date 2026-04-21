"use client";

/* ------------------------------------------------------------------ */
/*  DownloadPDFButton                                                  */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Requests a real PDF from /api/research/pdf?slug=... and saves it   */
/*  to the user's disk. The server route renders the article with     */
/*  pdfkit — no browser print dialog, no Chromium dependency,         */
/*  produces a real downloadable PDF with academic typesetting.       */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";

export default function DownloadPDFButton({
  label = "Download as PDF",
  slug: slugProp,
}: {
  label?: string;
  /** Optional explicit slug. If omitted, resolves from the pathname. */
  slug?: string;
}) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const resolveSlug = (): string | null => {
    if (slugProp) return slugProp;
    if (!pathname) return null;
    const match = pathname.match(/\/research\/([^/?#]+)/);
    return match ? match[1] : null;
  };

  const handleClick = async () => {
    if (busy) return;
    const slug = resolveSlug();
    if (!slug) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/research/pdf?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        throw new Error(`PDF generation failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${slug}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      // Fall back to print if the server route fails
      if (typeof window !== "undefined") window.print();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      data-print-hide="true"
      className="inline-flex items-center gap-2 rounded-sm border border-border bg-cream px-3 py-1.5 font-body text-[13.5px] text-ink transition-colors hover:bg-cream-dark hover:border-warm-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest disabled:cursor-wait disabled:opacity-70"
      aria-label="Download this article as a PDF"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {busy ? "Preparing PDF…" : label}
    </button>
  );
}
