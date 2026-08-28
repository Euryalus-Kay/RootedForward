"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  YouTubeEmbed                                                       */
/*                                                                     */
/*  A click-to-play facade rather than a live iframe. The home page    */
/*  would otherwise pull YouTube's player javascript on every visit,   */
/*  for a video most visitors never press play on, and set cookies     */
/*  before anyone asked for them. Until the click this is one JPEG.    */
/*                                                                     */
/*  Captions. The film has no authored subtitles, only YouTube's       */
/*  auto-generated English track, and it was burning that over the     */
/*  picture. cc_load_policy=0 is not enough on its own, because it     */
/*  only means "use the viewer's own preference" and plenty of people  */
/*  have captions switched on account-wide. So the player is built     */
/*  through the IFrame API and unloadModule is called on ready, which  */
/*  does turn them off for everyone. If that script fails to load we   */
/*  fall back to a plain iframe, where captions may reappear for those */
/*  viewers but the video still plays.                                 */
/*                                                                     */
/*  Quality. The embed picks a resolution from the player's size and   */
/*  the viewer's bandwidth, and no supported parameter forces one, so  */
/*  the way to a 4K stream is a large player and the maxres still.     */
/* ------------------------------------------------------------------ */

interface YouTubeEmbedProps {
  /** The bare video id, not a full URL. */
  id: string;
  /** Used as the accessible name for the play button. */
  title: string;
  /** Which of YouTube's stills to use. "default" is the frame YouTube
      picked, 1 to 3 are its alternates. */
  frame?: "default" | "1" | "2" | "3";
  /** Which band it sits on, so the frame picks up the right contrast. */
  tone?: "dark" | "light";
  /** A still we host ourselves, used instead of YouTube's. The walking
      tour uses this so nothing is fetched from YouTube until someone
      actually presses play, and so the app and the page show the same
      frame. */
  poster?: string;
}

/* Minimal shape of the bits of the IFrame API this file touches. */
interface YTPlayer {
  unloadModule: (name: string) => void;
  setOption: (module: string, option: string, value: unknown) => void;
  playVideo: () => void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: Record<string, unknown>
  ) => YTPlayer;
  ready: (cb: () => void) => void;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const API_SRC = "https://www.youtube.com/iframe_api";

/* Constant, so it lives outside the component and stays out of the
   effect's dependency list. cc_load_policy only defers to the viewer's
   preference; unloadModule on ready is what actually kills captions. */
const PLAYER_VARS = {
  autoplay: 1,
  rel: 0,
  modestbranding: 1,
  playsinline: 1,
  cc_load_policy: 0,
  iv_load_policy: 3,
  /* the control is on by default, but say so, because the player the
     API builds is not the same element as the fallback iframe below */
  fs: 1,
} as const;

/** Loads the IFrame API once per page and resolves when YT is usable. */
function loadYouTubeApi(): Promise<YTNamespace> {
  return new Promise((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${API_SRC}"]`
    );
    const onReady = () => {
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YT namespace missing"));
    };
    if (!existing) {
      const s = document.createElement("script");
      s.src = API_SRC;
      s.async = true;
      s.onerror = () => reject(new Error("iframe_api failed to load"));
      document.head.appendChild(s);
    }
    // The API calls this global once, no matter who inserted the tag.
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      onReady();
    };
    // Already loaded by someone else and the global will not fire again.
    if (window.YT?.ready) window.YT.ready(onReady);
    setTimeout(() => reject(new Error("iframe_api timed out")), 6000);
  });
}

/* Clearing the selected track is what actually stops the auto-generated
   subtitles from painting over the picture. unloadModule alone does not,
   because the module reloads with playback. Called on ready, on the
   first PLAYING, and twice more on a short delay, since the module can
   arrive late on a slow connection. */
function killCaptions(player: YTPlayer) {
  const clear = () => {
    try {
      player.setOption("captions", "track", {});
      player.unloadModule("captions");
      player.unloadModule("cc");
    } catch {
      /* not loaded yet, which is the outcome we wanted anyway */
    }
  };
  clear();
  setTimeout(clear, 800);
  setTimeout(clear, 2500);
}

export default function YouTubeEmbed({
  id,
  title,
  frame = "default",
  tone = "dark",
  poster,
}: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  /* Set only when the API route fails, so the plain iframe takes over. */
  const [fallback, setFallback] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);

  const still = frame === "default" ? "maxresdefault" : `maxres${frame}`;
  const posterSrc = poster ?? `https://i.ytimg.com/vi/${id}/${still}.jpg`;

  useEffect(() => {
    if (!playing || fallback || playerRef.current) return;
    let cancelled = false;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mountRef.current) return;
        playerRef.current = new YT.Player(mountRef.current, {
          videoId: id,
          host: "https://www.youtube-nocookie.com",
          playerVars: PLAYER_VARS,
          events: {
            onReady: (e: { target: YTPlayer }) => {
              killCaptions(e.target);
              e.target.playVideo();
            },
            onStateChange: (e: { target: YTPlayer; data: number }) => {
              // 1 is PLAYING. The captions module is not loaded yet at
              // onReady, so clearing it there alone does nothing and the
              // auto track comes back the moment playback starts.
              if (e.data === 1) killCaptions(e.target);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });

    return () => {
      cancelled = true;
    };
  }, [playing, fallback, id]);

  const start = useCallback(() => setPlaying(true), []);

  const query = new URLSearchParams(
    Object.entries(PLAYER_VARS).map(([k, v]) => [k, String(v)])
  );

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-sm border bg-ink ${
        tone === "dark" ? "border-cream/20" : "border-border"
      }`}
    >
      {playing ? (
        fallback ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?${query}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          /* The API replaces this node with the iframe it builds. */
          <div ref={mountRef} className="absolute inset-0 h-full w-full" />
        )
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* every maxres still is 1280x720, sharp on a retina screen */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc}
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
  );
}
