"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Share2, ExternalLink } from "lucide-react";
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
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function padEpisode(num: number): string {
  return String(num).padStart(2, "0");
}

/* ------------------------------------------------------------------ */
/*  Spotify icon (inline SVG)                                          */
/* ------------------------------------------------------------------ */

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Apple Podcasts icon (inline SVG)                                   */
/* ------------------------------------------------------------------ */

function ApplePodcastsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-.002 4.384a7.618 7.618 0 017.618 7.616 7.573 7.573 0 01-2.088 5.254 7.56 7.56 0 01-1.1.974c-.12-.276-.252-.582-.384-.894a6.38 6.38 0 001.572-4.206 6.389 6.389 0 00-12.776 0 6.38 6.38 0 001.572 4.206c-.132.312-.264.618-.384.894a7.56 7.56 0 01-1.1-.974 7.573 7.573 0 01-2.088-5.254 7.618 7.618 0 017.618-7.616h.54zm-.54 3.084a4.536 4.536 0 00-4.536 4.532c0 1.476.714 2.79 1.812 3.612.078-.264.162-.54.258-.822A3.31 3.31 0 017.924 12a4.078 4.078 0 014.074-4.074A4.078 4.078 0 0116.072 12a3.31 3.31 0 01-1.068 2.79c.096.282.18.558.258.822a4.52 4.52 0 001.812-3.612 4.536 4.536 0 00-4.536-4.532h-.54zM12 10.2a1.8 1.8 0 00-1.8 1.8 1.8 1.8 0 001.26 1.716c-.054.6-.168 1.374-.36 2.286-.21.996-.462 1.866-.69 2.634a9.87 9.87 0 01-.198.6c.54.192 1.116.3 1.716.36h.144c.6-.06 1.176-.168 1.716-.36a9.87 9.87 0 01-.198-.6c-.228-.768-.48-1.638-.69-2.634-.192-.912-.306-1.686-.36-2.286A1.8 1.8 0 0013.8 12a1.8 1.8 0 00-1.8-1.8z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PodcastCard({
  id,
  title,
  description,
  embed_url,
  episode_number,
  publish_date,
  guests,
  published,
  created_at,
}: PodcastCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const truncatedDescription =
    description.length > 200
      ? description.slice(0, 200).trimEnd() + "..."
      : description;

  const needsTruncation = description.length > 200;

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
        toast.success("Link copied!");
      }
    } catch {
      /* User cancelled share or clipboard failed */
    }
  }, [title, description, episode_number]);

  return (
    <article className="rounded-xl border border-border bg-cream-dark/60 overflow-hidden transition-shadow hover:shadow-md">
      {/* Top section */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:gap-8">
          {/* Episode number */}
          <div className="flex-shrink-0">
            <span className="font-display text-6xl font-light leading-none text-rust md:text-7xl">
              {padEpisode(episode_number)}
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="font-display text-xl font-semibold leading-snug text-forest md:text-2xl">
              {title}
            </h3>

            {/* Guest list */}
            {guests && guests.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {guests.map((guest) => (
                  <span
                    key={guest}
                    className="inline-flex items-center gap-1.5"
                  >
                    {/* Avatar dot */}
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-cream"
                      aria-hidden="true"
                    >
                      {guest.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-body text-sm text-ink-light">
                      {guest}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Publish date */}
            <p className="mt-2 font-body text-sm text-warm-gray-light">
              {formatDate(publish_date)}
            </p>

            {/* Description */}
            <div className="mt-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={showFullDescription ? "full" : "truncated"}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-body text-sm leading-relaxed text-ink/75"
                >
                  {showFullDescription ? description : truncatedDescription}
                </motion.p>
              </AnimatePresence>
              {needsTruncation && (
                <button
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="mt-1 font-body text-sm font-semibold text-forest transition-colors hover:text-forest-light"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Action buttons row */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {/* Share button */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/60 px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              {/* Listen on Spotify */}
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/60 px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
                aria-label="Listen on Spotify"
              >
                <SpotifyIcon className="h-4 w-4 text-[#1DB954]" />
                Spotify
                <ExternalLink className="h-3 w-3 text-warm-gray-light" />
              </a>

              {/* Listen on Apple Podcasts */}
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/60 px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
                aria-label="Listen on Apple Podcasts"
              >
                <ApplePodcastsIcon className="h-4 w-4 text-[#A855F7]" />
                Apple Podcasts
                <ExternalLink className="h-3 w-3 text-warm-gray-light" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable player section */}
      <div className="border-t border-border/60">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center justify-center gap-2 px-6 py-3 font-body text-sm font-medium text-forest transition-colors hover:bg-cream-dark/80"
        >
          {isExpanded ? "Hide Player" : "Show Player"}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 md:px-8 md:pb-8">
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
    </article>
  );
}
