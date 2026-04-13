import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Detect embed platform from a URL string.
 */
export type EmbedPlatform =
  | "youtube"
  | "vimeo"
  | "spotify"
  | "apple-podcasts"
  | "unknown";

export function detectEmbedPlatform(url: string): EmbedPlatform {
  if (!url) return "unknown";
  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  )
    return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.includes("spotify.com")) return "spotify";
  if (url.includes("podcasts.apple.com")) return "apple-podcasts";
  return "unknown";
}

/**
 * Convert a video URL (YouTube, Vimeo) to an embeddable iframe src.
 * Returns the original URL if already an embed or unrecognized.
 */
export function toEmbedUrl(url: string): string {
  if (!url) return url;

  // Already an embed URL
  if (url.includes("/embed/") || url.includes("player.vimeo.com")) {
    return url;
  }

  // YouTube: youtube.com/watch?v=ID or youtu.be/ID
  const ytWatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytWatch) {
    return `https://www.youtube.com/embed/${ytWatch[1]}`;
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Spotify: open.spotify.com/episode/ID → embed form
  if (url.includes("open.spotify.com") && !url.includes("/embed/")) {
    return url.replace("open.spotify.com", "open.spotify.com/embed");
  }

  return url;
}

/**
 * Convert an Apple Podcasts URL to an embeddable form.
 */
export function toApplePodcastsEmbedUrl(url: string): string {
  if (!url) return url;
  if (url.includes("embed.podcasts.apple.com")) return url;
  return url.replace("podcasts.apple.com", "embed.podcasts.apple.com");
}
