"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  YouTubeEmbed                                                       */
/*                                                                     */
/*  A click-to-play facade rather than a live iframe. The home page    */
/*  would otherwise pull YouTube's player javascript on every visit,   */
/*  for a video most visitors never press play on, and set cookies     */
/*  before anyone asked for them. Until the click this is one JPEG.    */
/*                                                                     */
/*  On quality: the embed player picks a resolution from the player's  */
/*  size and the viewer's bandwidth. There is no supported parameter   */
/*  that forces one, so the way to get a 4K stream is to give the      */
/*  player a large box, which is why this renders wide rather than in  */
/*  a column, and to use the maxres still so the frame before play is  */
/*  not a soft 480p thumbnail. Viewers can still pick 2160p by hand    */
/*  in the player's own quality menu.                                  */
/* ------------------------------------------------------------------ */

interface YouTubeEmbedProps {
  /** The bare video id, not a full URL. */
  id: string;
  /** Used as the accessible name for the play button. */
  title: string;
  /** Shown under the frame. */
  caption?: string;
  /** Which band it sits on, so the frame and caption pick up the
      right contrast. "dark" is the forest band, "light" is cream. */
  tone?: "dark" | "light";
}

export default function YouTubeEmbed({
  id,
  title,
  caption,
  tone = "dark",
}: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);

  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  return (
    <figure className="m-0">
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-sm border bg-ink ${
          tone === "dark" ? "border-cream/20" : "border-border"
        }`}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?${params}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title}`}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {/* maxres is 1280x720, so it stays sharp on a retina screen */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <span className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/15" />
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-rust text-white shadow-lg transition-transform duration-200 group-hover:scale-105 md:h-24 md:w-24">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="ml-1 h-8 w-8 md:h-10 md:w-10"
              >
                <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.28-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption
          className={`mt-3 font-body text-sm ${
            tone === "dark" ? "text-cream/65" : "text-ink/60"
          }`}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
