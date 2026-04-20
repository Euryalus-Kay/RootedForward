"use client";

/* ------------------------------------------------------------------ */
/*  DownloadPDFButton                                                  */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Triggers the browser's print dialog with print-only styling        */
/*  applied. The user can then use their browser's "Save as PDF"      */
/*  destination to export a well formatted PDF of the article.        */
/*                                                                     */
/*  Implementation intentionally avoids a PDF generation library so   */
/*  the app has no additional bundle weight. Every modern browser     */
/*  supports Save as PDF from the print dialog. The accompanying     */
/*  @media print styles in globals.css handle the layout.             */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { Download } from "lucide-react";

export default function DownloadPDFButton({
  label = "Download as PDF",
}: {
  label?: string;
}) {
  const handleClick = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-print-hide="true"
      className="inline-flex items-center gap-2 rounded-sm border border-border bg-cream px-3 py-1.5 font-body text-[13.5px] text-ink transition-colors hover:bg-cream-dark hover:border-warm-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
      aria-label="Download this article as a PDF"
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
