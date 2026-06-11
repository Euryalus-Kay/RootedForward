"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Award, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import ShareModal from "@/components/ui/ShareModal";

interface TourCertificateProps {
  city: string;
  cityName: string;
  totalStops: number;
  completedDate?: string;
}

function formatCompletionDate(date?: string): string {
  if (!date) {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TourCertificate({
  city,
  cityName,
  totalStops,
  completedDate,
}: TourCertificateProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const displayDate = formatCompletionDate(completedDate);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `I completed the ${cityName} Walking Tour on Rooted Forward! ${totalStops} stops visited.`;

  const handleDownload = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .rf-certificate,
          .rf-certificate * {
            visibility: visible;
          }
          .rf-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 3px solid #1B3A2D !important;
            box-shadow: none !important;
          }
          .rf-cert-actions {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.2 }}
      >
        <div
          ref={certificateRef}
          className={cn(
            "rf-certificate relative overflow-hidden rounded-2xl border-2 border-forest bg-cream p-8 shadow-lg",
            "sm:p-10 md:p-12"
          )}
        >
          {/* Decorative paper texture / corner accents */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="cert-texture"
                  width="4"
                  height="4"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="0.5" fill="#1B3A2D" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cert-texture)" />
            </svg>
          </div>

          {/* Top decorative border */}
          <div className="absolute left-6 right-6 top-0 h-1.5 rounded-b-full bg-gradient-to-r from-forest via-rust to-forest" />

          {/* Corner ornaments */}
          <svg className="absolute left-3 top-3 h-6 w-6 text-forest/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2v8M2 2h8" />
          </svg>
          <svg className="absolute right-3 top-3 h-6 w-6 text-forest/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 2v8M22 2h-8" />
          </svg>
          <svg className="absolute bottom-3 left-3 h-6 w-6 text-forest/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 22v-8M2 22h8" />
          </svg>
          <svg className="absolute bottom-3 right-3 h-6 w-6 text-forest/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 22v-8M22 22h-8" />
          </svg>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Award icon */}
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.4 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest/10"
            >
              <Award size={28} className="text-forest" />
            </motion.div>

            {/* Certificate heading */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rust"
            >
              Rooted Forward
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-2 font-display text-2xl text-forest sm:text-3xl"
            >
              Certificate of Completion
            </motion.h2>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="mx-auto my-5 h-px w-32 bg-gradient-to-r from-transparent via-forest/40 to-transparent"
            />

            {/* Body text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="font-body text-base text-ink-light sm:text-lg"
            >
              You have completed the
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-1 font-display text-xl text-forest sm:text-2xl"
            >
              {cityName} Walking Tour
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-cream-dark px-4 py-2"
            >
              <span className="font-display text-lg font-semibold text-rust">
                {totalStops}
              </span>
              <span className="font-body text-sm text-ink-light">
                stop{totalStops !== 1 ? "s" : ""} visited
              </span>
            </motion.div>

            {/* Date */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-5 font-body text-sm text-warm-gray"
            >
              Completed on {displayDate}
            </motion.p>
          </div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="rf-cert-actions relative z-10 mt-8 flex items-center justify-center gap-3"
          >
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-cream px-4 py-2.5 font-body text-sm font-medium text-ink-light transition-colors hover:bg-cream-dark"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
            >
              <Share2 size={16} />
              Share Achievement
            </button>
          </motion.div>
        </div>
      </motion.div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={`I completed the ${cityName} Walking Tour!`}
        url={currentUrl}
        description={shareText}
      />
    </>
  );
}
