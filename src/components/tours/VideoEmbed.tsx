"use client";

import { toEmbedUrl, detectEmbedPlatform } from "@/lib/utils";

interface VideoEmbedProps {
  url: string;
  title?: string;
}

export default function VideoEmbed({ url, title = "Video" }: VideoEmbedProps) {
  const embedSrc = toEmbedUrl(url);
  const platform = detectEmbedPlatform(url);

  const platformLabel =
    platform === "youtube"
      ? "YouTube"
      : platform === "vimeo"
        ? "Vimeo"
        : "Video";

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-ink">
      {/* Play icon placeholder behind iframe */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-16 w-16 text-warm-gray/40"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <iframe
        src={embedSrc}
        title={`${platformLabel}: ${title}`}
        className="absolute inset-0 z-10 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
