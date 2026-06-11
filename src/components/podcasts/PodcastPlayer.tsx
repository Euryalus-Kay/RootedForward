"use client";

/* ------------------------------------------------------------------ */
/*  PodcastPlayer — the audio surface inside an episode row            */
/*                                                                     */
/*  Spotify embed URLs render the official iframe inside a hairline    */
/*  frame with a ledger caption. Anything else gets the custom HTML    */
/*  audio player: play/pause, seek, volume, mute, playback speed.      */
/* ------------------------------------------------------------------ */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PodcastPlayerProps {
  title: string;
  episodeNumber: number;
  embedUrl?: string;
}

type PlaybackSpeed = 0.5 | 1 | 1.25 | 1.5 | 2;

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 1.25, 1.5, 2];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Now Playing indicator (3 pulsing bars)                             */
/* ------------------------------------------------------------------ */

function NowPlayingBars() {
  return (
    <div className="flex items-end gap-[3px] h-4" aria-label="Now playing">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-rust"
          animate={{
            height: ["6px", "16px", "10px", "16px", "6px"],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Spotify embed                                                      */
/* ------------------------------------------------------------------ */

function SpotifyEmbed({
  embedUrl,
  title,
  episodeNumber,
}: {
  embedUrl: string;
  title: string;
  episodeNumber: number;
}) {
  return (
    <div className="border border-border bg-white/40 p-4">
      <div className="flex items-baseline justify-between gap-4 px-1 pb-3">
        <span className="ledger text-warm-gray">
          Ep {String(episodeNumber).padStart(2, "0")} / Audio
        </span>
        <span className="ledger text-warm-gray/70">Via Spotify</span>
      </div>
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block"
        title={`Listen to Episode ${episodeNumber}: ${title}`}
        style={{
          border: "none",
          borderRadius: "12px",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom HTML audio player                                           */
/* ------------------------------------------------------------------ */

function CustomAudioPlayer({
  embedUrl,
  title,
  episodeNumber,
}: {
  embedUrl: string;
  title: string;
  episodeNumber: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [isDragging, setIsDragging] = useState(false);

  /* ---- Audio event handlers ---- */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isDragging]);

  /* ---- Play / Pause ---- */
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch {
      /* Autoplay blocked or source error */
    }
  }, [isPlaying]);

  /* ---- Seek via progress bar click ---- */
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressBarRef.current;
      if (!audio || !bar || !duration) return;

      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = fraction * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration]
  );

  /* ---- Volume ---- */
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      setIsMuted(val === 0);
      if (audioRef.current) {
        audioRef.current.volume = val;
        audioRef.current.muted = val === 0;
      }
    },
    []
  );

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        setVolume(0.5);
        audio.volume = 0.5;
      }
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  /* ---- Playback speed ---- */
  const cycleSpeed = useCallback(() => {
    const currentIdx = SPEEDS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEEDS.length;
    const newSpeed = SPEEDS[nextIdx];
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, [speed]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border border-border bg-white/40 p-5">
      <audio ref={audioRef} src={embedUrl} preload="metadata" />

      {/* Header row */}
      <div className="mb-5 flex items-baseline gap-4">
        <span className="ledger shrink-0 text-rust">
          Ep {String(episodeNumber).padStart(2, "0")}
        </span>
        <p className="min-w-0 flex-1 truncate font-display text-sm text-forest">
          {title}
        </p>
        {isPlaying && <NowPlayingBars />}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-rust text-cream transition-colors hover:bg-rust-dark"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isPlaying ? (
              <motion.div
                key="pause"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Pause className="h-5 w-5" fill="currentColor" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Progress area */}
        <div className="flex-1 space-y-1.5">
          {/* Progress bar */}
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            className="group relative h-1.5 cursor-pointer bg-cream-dark"
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
          >
            <div
              className="absolute inset-y-0 left-0 bg-rust transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 border border-rust bg-cream opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between">
            <span className="ledger tabular-nums text-warm-gray">
              {formatTime(currentTime)}
            </span>
            <span className="ledger tabular-nums text-warm-gray">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: volume + speed */}
      <div className="mt-4 flex items-center justify-between">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-cream-dark accent-rust"
            aria-label="Volume"
          />
        </div>

        {/* Playback speed */}
        <button
          onClick={cycleSpeed}
          className={cn(
            "ledger rounded-sm border px-3 py-1.5 tabular-nums transition-colors",
            speed !== 1
              ? "border-rust bg-rust/5 text-rust"
              : "border-border text-warm-gray hover:bg-cream-dark hover:text-ink"
          )}
        >
          {speed}x
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main PodcastPlayer component                                       */
/* ------------------------------------------------------------------ */

export default function PodcastPlayer({
  title,
  episodeNumber,
  embedUrl,
}: PodcastPlayerProps) {
  if (!embedUrl) {
    return (
      <div className="border border-dashed border-border bg-white/40 p-8 text-center">
        <p className="ledger text-warm-gray">Episode audio coming soon</p>
      </div>
    );
  }

  // Detect Spotify embed URL
  const isSpotify =
    embedUrl.includes("spotify.com") || embedUrl.includes("spotify");

  if (isSpotify) {
    return (
      <SpotifyEmbed
        embedUrl={embedUrl}
        title={title}
        episodeNumber={episodeNumber}
      />
    );
  }

  // Otherwise, render custom HTML audio player
  return (
    <CustomAudioPlayer
      embedUrl={embedUrl}
      title={title}
      episodeNumber={episodeNumber}
    />
  );
}
