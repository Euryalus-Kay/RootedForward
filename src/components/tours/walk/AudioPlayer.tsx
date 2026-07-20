"use client";

// ------------------------------------------------------------------
// Site-styled audio player for the walking tour. One instance per
// stop. Players coordinate through a window event so starting one
// pauses every other, which matters in browse mode where all stops
// render at once.
// ------------------------------------------------------------------
import { useCallback, useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/tours/walk-utils";
import { emitAudioState, registerAudio, unregisterAudio } from "./audio-bus";

const EXCLUSIVE_EVENT = "rf-walk-audio-play";

interface AudioPlayerProps {
  src: string;
  /** duration fallback until metadata loads */
  seconds: number;
  /** unique id for cross-player coordination */
  playerId: string;
  /** accessible name, e.g. "Play stop 3, Statue of the Republic" */
  label: string;
  onEnded?: () => void;
  onStarted?: () => void;
  /** in the focused tour on phones the transport bar carries the play
      button, so this card keeps only the scrubber, times, and speed */
  compact?: boolean;
}

export default function AudioPlayer({
  src,
  seconds,
  playerId,
  label,
  onEnded,
  onStarted,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(seconds);
  const [rate, setRate] = useState(1);
  const [ready, setReady] = useState(false);

  // pause when another player starts; expose this element to the
  // mini-player through the bus
  useEffect(() => {
    if (audioRef.current) registerAudio(playerId, audioRef.current);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== playerId) audioRef.current?.pause();
    };
    window.addEventListener(EXCLUSIVE_EVENT, handler);
    return () => {
      window.removeEventListener(EXCLUSIVE_EVENT, handler);
      unregisterAudio(playerId);
    };
  }, [playerId]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      window.dispatchEvent(new CustomEvent(EXCLUSIVE_EVENT, { detail: playerId }));
      void el.play();
    } else {
      el.pause();
    }
  }, [playerId]);

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : 1;
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="walk-plate rounded-[3px] px-4 py-3.5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `Pause. ${label}` : label}
          className={`h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rust text-white ring-1 ring-inset ring-white/30 transition-transform hover:scale-105 hover:bg-rust-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-cream motion-reduce:transition-none ${
            compact ? "hidden md:flex" : "flex"
          }`}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect x="2.5" y="2" width="4" height="12" rx="0.5" />
              <rect x="9.5" y="2" width="4" height="12" rx="0.5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M4 2.3v11.4c0 .5.55.8.98.53l9.02-5.7a.62.62 0 0 0 0-1.06L4.98 1.77A.62.62 0 0 0 4 2.3Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || seconds || 1}
            step={5}
            value={Math.min(current, duration || seconds || 1)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={`Seek within audio. ${label}`}
            aria-valuetext={`${formatClock(current)} of ${formatClock(duration || seconds)}`}
            className="walk-audio-range w-full"
            style={{ "--walk-progress": `${pct}%` } as React.CSSProperties}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="font-body text-[11px] tabular-nums text-ink/70">
              {ready ? formatClock(current) : "0:00"}
            </span>
            <span className="font-body text-[11px] tabular-nums text-ink/70">
              {formatClock(duration || seconds)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleRate}
          aria-label={`Playback speed ${rate}x. Change speed.`}
          className="min-h-[32px] shrink-0 rounded-[3px] border border-ink/25 bg-white px-3 py-2 font-body text-[11px] font-semibold tabular-nums text-ink/70 transition-colors hover:border-rust/60 hover:text-rust"
        >
          {rate}x
        </button>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          setReady(true);
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={(e) => {
          setPlaying(true);
          // lock-screen title and controls while walking
          if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: label.replace(/^Play /, ""),
              artist: "Rooted Forward",
              album: "Walk Jackson Park",
            });
            const el = e.currentTarget;
            navigator.mediaSession.setActionHandler("play", () => void el.play());
            navigator.mediaSession.setActionHandler("pause", () => el.pause());
          }
          emitAudioState(playerId, true);
          onStarted?.();
        }}
        onPause={() => {
          setPlaying(false);
          emitAudioState(playerId, false);
        }}
        onEnded={() => {
          setPlaying(false);
          emitAudioState(playerId, false);
          onEnded?.();
        }}
      />
    </div>
  );
}
