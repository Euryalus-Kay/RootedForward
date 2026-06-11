"use client";

/* ------------------------------------------------------------------ */
/*  PodcastCard — one episode as an editorial archive row              */
/*                                                                     */
/*  Hairline-ruled ledger entry: oversized mono index numeral down     */
/*  the left rail, display-type title, guests and date in ledger       */
/*  style, and the embedded player tucked behind a toggle so the       */
/*  archive scans like a printed index until you choose to listen.     */
/* ------------------------------------------------------------------ */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Podcast } from "@/lib/types/database";
import PodcastPlayer from "./PodcastPlayer";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PodcastCardProps = Podcast;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function padEpisode(num: number): string {
  return String(num).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PodcastCard({
  title,
  description,
  embed_url,
  episode_number,
  publish_date,
  guests,
}: PodcastCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const needsTruncation = description.length > 280;
  const truncatedDescription = needsTruncation
    ? description.slice(0, 280).trimEnd() + "..."
    : description;

  const publishDate = formatDate(publish_date);

  /* ---- Share handler ---- */
  const handleShare = useCallback(async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `Ep. ${episode_number}: ${title}`,
      text: description.slice(0, 120),
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied");
      }
    } catch {
      /* User cancelled share or clipboard failed */
    }
  }, [title, description, episode_number]);

  return (
    <article className="border-t border-border">
      <div className="grid gap-x-10 gap-y-5 py-10 md:grid-cols-[7rem_1fr] md:py-14">
        {/* Index numeral rail */}
        <div className="hidden md:block" aria-hidden="true">
          <span className="index-numeral block text-6xl leading-none text-rust/70 lg:text-7xl">
            {padEpisode(episode_number)}
          </span>
        </div>

        {/* Entry */}
        <div className="min-w-0">
          {/* Ledger meta row */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
            <span className="ledger text-rust">
              Episode {padEpisode(episode_number)}
            </span>
            {publishDate && (
              <span className="ledger text-warm-gray">{publishDate}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-4 font-display text-2xl leading-tight text-forest md:text-3xl">
            {title}
          </h3>

          {/* Guests, ledger style */}
          {guests && guests.length > 0 && (
            <p className="ledger mt-4 text-warm-gray">
              With {guests.join(", ")}
            </p>
          )}

          {/* Description */}
          <div className="mt-4 max-w-[65ch]">
            <p className="font-body text-base leading-relaxed text-ink/75">
              {showFullDescription ? description : truncatedDescription}
            </p>
            {needsTruncation && (
              <button
                onClick={() => setShowFullDescription((prev) => !prev)}
                className="link-draw mt-2 font-body text-sm font-semibold text-forest"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          {/* Action row */}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className={cn(
                "inline-flex items-center gap-2.5 rounded-sm border px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-widest transition-colors",
                isExpanded
                  ? "border-forest bg-forest text-cream"
                  : "border-forest/30 text-forest hover:border-forest"
              )}
            >
              {isExpanded ? "Hide player" : "Play episode"}
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex"
                aria-hidden="true"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray transition-colors hover:text-ink"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Share
            </button>
          </div>

          {/* Expandable player */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-6">
                  <PodcastPlayer
                    title={title}
                    episodeNumber={episode_number}
                    embedUrl={embed_url ?? undefined}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}
