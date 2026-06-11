"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Captions,
  CaptionsOff,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PanoViewer from "./PanoViewer";
import {
  fadeGain,
  filterToCss,
  layoutDoc,
  mediaTimeAt,
  MUSIC_DUCK,
  segmentSpeed,
  trackGainAt,
  type TimedSegment,
} from "@/lib/immersive/timeline";
import type {
  SequenceAsset,
  SequenceDoc,
  SequenceOverlay,
  SequenceSegment,
} from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  TimelinePlayer: renders a SequenceDoc live in the browser.         */
/*                                                                     */
/*  The full grammar plays here with no render step: trimmed 2D clips  */
/*  with speed, color grades, transforms, Ken Burns moves; grabbable   */
/*  360 segments; eight transitions; styled animated text; stickers;   */
/*  subtitles; and a mixed soundtrack (clip audio, music bed, and a    */
/*  voiceover that ducks the music).                                   */
/* ------------------------------------------------------------------ */

export interface PlayerControls {
  seek: (t: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  getTime: () => number;
  isPlaying: () => boolean;
}

const OVERLAY_COLORS: Record<string, string> = {
  cream: "#F5F0E8",
  white: "#FFFFFF",
  rust: "#C45D3E",
  ink: "#1A1A1A",
};

const TITLE_SIZES: Record<string, string> = {
  sm: "text-xl md:text-3xl",
  md: "text-3xl md:text-5xl",
  lg: "text-5xl md:text-7xl",
};

const THIRD_SIZES: Record<string, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface TimelinePlayerProps {
  doc: SequenceDoc;
  /** Override or supplement doc.assets, keyed by clipId */
  assets?: Record<string, SequenceAsset>;
  className?: string;
  heightClass?: string;
  autoPlay?: boolean;
  loop?: boolean;
  /** Called every tick with the current time, for editor scrubbing UIs */
  onTimeUpdate?: (t: number) => void;
  /** Receives a transport API for external control (editor playhead) */
  controlsRef?: React.MutableRefObject<PlayerControls | null>;
  /** Hide the built-in control bar (editor renders its own transport) */
  minimalChrome?: boolean;
}

export default function TimelinePlayer({
  doc,
  assets,
  className,
  heightClass,
  autoPlay = false,
  loop = false,
  onTimeUpdate,
  controlsRef,
  minimalChrome = false,
}: TimelinePlayerProps) {
  const filterId = useId().replace(/[:]/g, "x");
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voRef = useRef<HTMLAudioElement | null>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);

  const timeRef = useRef(0);
  const playingRef = useRef(autoPlay);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [showCC, setShowCC] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick] = useState(0);

  const resolved = useMemo(
    () => ({ ...(doc.assets ?? {}), ...(assets ?? {}) }),
    [doc.assets, assets]
  );
  const { timed, total } = useMemo(() => layoutDoc(doc), [doc]);

  const setPlayingBoth = useCallback((v: boolean) => {
    playingRef.current = v;
    setPlaying(v);
  }, []);

  /* --------------------------- transport --------------------------- */

  const seek = useCallback(
    (next: number) => {
      timeRef.current = Math.max(0, Math.min(total, next));
    },
    [total]
  );

  useEffect(() => {
    if (!controlsRef) return;
    controlsRef.current = {
      seek,
      play: () => setPlayingBoth(true),
      pause: () => setPlayingBoth(false),
      toggle: () => setPlayingBoth(!playingRef.current),
      getTime: () => timeRef.current,
      isPlaying: () => playingRef.current,
    };
    return () => {
      controlsRef.current = null;
    };
  }, [controlsRef, seek, setPlayingBoth]);

  /* ----------------------------- clock ----------------------------- */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastTick = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = (now - last) / 1000;
      last = now;
      if (playingRef.current) {
        timeRef.current += dt;
        if (timeRef.current >= total) {
          if (loop) {
            timeRef.current = 0;
          } else {
            timeRef.current = total;
            setPlayingBoth(false);
          }
        }
      }
      onTimeUpdate?.(timeRef.current);
      if (now - lastTick > 66) {
        lastTick = now;
        setTick((v) => (v + 1) % 1_000_000);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [total, loop, onTimeUpdate, setPlayingBoth]);

  /* --------------------------- media sync -------------------------- */

  const t = timeRef.current;
  const lookahead = 2.0;
  const active = timed.filter(
    ({ startSec, lenSec }) =>
      t >= startSec - lookahead && t <= startSec + lenSec + 0.5
  );

  useEffect(() => {
    for (const { seg, startSec, lenSec } of active) {
      const asset = resolved[seg.clipId];
      if (!asset || asset.kind !== "video" || asset.is360) continue;
      const el = videoElsRef.current.get(seg.id);
      if (!el) continue;
      const local = mediaTimeAt(seg, t - startSec);
      const within = t >= startSec && t <= startSec + lenSec;
      if (Math.abs(el.currentTime - local) > 0.3) {
        try {
          el.currentTime = local;
        } catch {
          // not seekable yet
        }
      }
      el.playbackRate = segmentSpeed(seg);

      // Clip soundtrack: explicit audio settings win, then the legacy
      // muted flag (default muted).
      const base = seg.audio
        ? Math.max(0, Math.min(1, seg.audio.volume))
        : (seg.muted ?? true)
          ? 0
          : 1;
      const env = seg.audio
        ? fadeGain(
            t - startSec,
            lenSec,
            seg.audio.fadeInSec,
            seg.audio.fadeOutSec
          )
        : 1;
      const vol = muted ? 0 : base * env;
      el.muted = vol <= 0.001;
      el.volume = Math.max(0, Math.min(1, vol));

      if (playing && within) {
        if (el.paused) el.play().catch(() => undefined);
      } else if (!el.paused) {
        el.pause();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, playing, muted]);

  /* --------------------------- audio beds -------------------------- */

  const voGainNow = doc.voiceover
    ? trackGainAt(doc.voiceover, t, total)
    : 0;

  useEffect(() => {
    const syncBed = (
      el: HTMLAudioElement | null,
      track: SequenceDoc["music"],
      gain: number
    ) => {
      if (!el || !track) return;
      const local = t - (track.offsetSec ?? 0);
      const inWindow = local >= 0 && t < total;
      el.loop = track.loop;
      const dur = Number.isFinite(el.duration) ? el.duration : 0;
      if (inWindow && dur > 0) {
        const target = track.loop ? local % dur : Math.min(local, dur - 0.05);
        if (Math.abs(el.currentTime - target) > 0.35) {
          try {
            el.currentTime = target;
          } catch {
            // not seekable yet
          }
        }
      }
      el.volume = Math.max(0, Math.min(1, muted ? 0 : gain));
      if (playing && inWindow && el.paused) {
        el.play().catch(() => undefined);
      } else if ((!playing || !inWindow) && !el.paused) {
        el.pause();
      }
    };

    const duck = voGainNow > 0.02 ? MUSIC_DUCK : 1;
    syncBed(
      musicRef.current,
      doc.music ?? null,
      doc.music ? trackGainAt(doc.music, t, total) * duck : 0
    );
    syncBed(voRef.current, doc.voiceover ?? null, voGainNow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, playing, muted]);

  /* ------------------------- ripple driver ------------------------- */

  useEffect(() => {
    const disp = dispRef.current;
    if (!disp) return;
    const entry = timed.find(({ seg, startSec }) => {
      if (seg.transitionIn?.type !== "ripple") return false;
      const d = Math.max(0.2, seg.transitionIn.durationSec);
      return t >= startSec && t <= startSec + d;
    });
    if (!entry) {
      disp.setAttribute("scale", "0");
      return;
    }
    const d = Math.max(0.2, entry.seg.transitionIn.durationSec);
    const p = Math.min(1, Math.max(0, (t - entry.startSec) / d));
    disp.setAttribute("scale", String(Math.sin(p * Math.PI) * 55));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, timed]);

  /* ----------------------------- chrome ---------------------------- */

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen().catch(() => undefined);
    }
  }, []);

  const restart = useCallback(() => {
    seek(0);
    setPlayingBoth(true);
  }, [seek, setPlayingBoth]);

  /* --------------------------- per-segment ------------------------- */

  function segmentStyle(entry: TimedSegment): {
    style: React.CSSProperties;
    extraBlurPx: number;
  } {
    const { seg, startSec, lenSec } = entry;
    const tr = seg.transitionIn;
    const d = Math.max(0.2, tr?.durationSec ?? 0);
    const sinceStart = t - startSec;
    const untilEnd = startSec + lenSec - t;

    let opacity = 1;
    let transform = "none";
    let clipPath: string | undefined;
    let filter: string | undefined;
    let extraBlurPx = 0;

    if (t < startSec || t > startSec + lenSec) {
      return { style: { opacity: 0, pointerEvents: "none" }, extraBlurPx: 0 };
    }

    const idx = timed.indexOf(entry);
    const isFirst = idx === 0;

    if (!isFirst && tr && sinceStart < d) {
      const p = sinceStart / d;
      const ease = 1 - Math.pow(1 - p, 3);
      switch (tr.type) {
        case "crossfade":
          opacity = p;
          break;
        case "ripple":
          opacity = Math.min(1, sinceStart / (d * 0.6));
          filter = `url(#${filterId})`;
          break;
        case "slide-left":
          transform = `translateX(${(1 - ease) * 100}%)`;
          break;
        case "dip-black":
          if (sinceStart < d * 0.5) opacity = sinceStart / (d * 0.5);
          break;
        case "wipe":
          clipPath = `inset(0 ${(1 - ease) * 100}% 0 0)`;
          break;
        case "zoom":
          opacity = p;
          transform = `scale(${1.18 - 0.18 * ease})`;
          break;
        case "blur":
          opacity = p;
          extraBlurPx = (1 - p) * 14;
          break;
        default:
          break;
      }
    }

    // Tail handling for the NEXT segment's incoming transition
    const next = timed[idx + 1];
    if (next) {
      const nt = next.seg.transitionIn;
      const nd = Math.max(0.2, nt?.durationSec ?? 0);
      if (nt?.type === "dip-black") {
        if (untilEnd < nd * 0.5) {
          opacity = Math.min(opacity, Math.max(0, untilEnd / (nd * 0.5)));
        }
      } else if (nt?.type === "slide-left") {
        const into = nd - Math.max(0, untilEnd);
        if (into > 0) {
          const p = Math.min(1, into / nd);
          const ease = 1 - Math.pow(1 - p, 3);
          transform = `translateX(${-ease * 28}%)`;
        }
      } else if (nt?.type === "zoom") {
        const into = nd - Math.max(0, untilEnd);
        if (into > 0) {
          const p = Math.min(1, into / nd);
          transform = `scale(${1 - 0.06 * p})`;
        }
      } else if (nt?.type === "blur") {
        const into = nd - Math.max(0, untilEnd);
        if (into > 0) {
          const p = Math.min(1, into / nd);
          extraBlurPx = Math.max(extraBlurPx, p * 10);
        }
      }
    }

    return {
      style: { opacity, transform, clipPath, filter },
      extraBlurPx,
    };
  }

  function kenBurnsStyle(entry: TimedSegment): React.CSSProperties {
    const kb = entry.seg.kenBurns;
    const fit = entry.seg.transform?.fit ?? "cover";
    const base: React.CSSProperties = { objectFit: fit };
    if (!kb) return base;
    const p = Math.min(1, Math.max(0, (t - entry.startSec) / entry.lenSec));
    const scale = kb.fromScale + (kb.toScale - kb.fromScale) * p;
    const x = (kb.fromX + (kb.toX - kb.fromX) * p) * 8;
    const y = (kb.fromY + (kb.toY - kb.fromY) * p) * 8;
    return {
      ...base,
      transform: `scale(${scale}) translate(${x}%, ${y}%)`,
      transformOrigin: "center center",
    };
  }

  function transformStyle(seg: SequenceSegment): React.CSSProperties {
    const tr = seg.transform;
    if (!tr) return {};
    const parts: string[] = [];
    if (tr.xPct !== 0 || tr.yPct !== 0)
      parts.push(`translate(${tr.xPct}%, ${tr.yPct}%)`);
    if (tr.scale !== 1) parts.push(`scale(${tr.scale})`);
    if (tr.rotateDeg !== 0) parts.push(`rotate(${tr.rotateDeg}deg)`);
    return parts.length > 0 ? { transform: parts.join(" ") } : {};
  }

  function overlaysAt(seg: SequenceSegment, startSec: number) {
    const local = t - startSec;
    return (seg.overlays ?? []).filter(
      (o) => local >= o.startSec && local <= o.endSec
    );
  }

  function overlayAnimStyle(
    o: SequenceOverlay,
    startSec: number
  ): React.CSSProperties {
    const local = t - startSec;
    const fade = 0.35;
    const aIn = Math.min(1, Math.max(0, (local - o.startSec) / fade));
    const aOut = Math.min(1, Math.max(0, (o.endSec - local) / fade));
    const a = Math.min(aIn, aOut);
    const anim = o.anim ?? "fade";
    const style: React.CSSProperties = { opacity: a };
    if (anim === "none") {
      style.opacity = local >= o.startSec && local <= o.endSec ? 1 : 0;
    } else if (anim === "slide-up") {
      style.transform = `translateY(${(1 - aIn) * 18}px)`;
    } else if (anim === "pop") {
      const s = 0.9 + 0.1 * (1 - Math.pow(1 - aIn, 3));
      style.transform = `scale(${s})`;
    }
    return style;
  }

  const cueNow = (doc.subtitles ?? []).find(
    (c) => t >= c.startSec && t <= c.endSec
  );

  const ended = !playing && t >= total && total > 0;

  const aspect = doc.aspect ?? "16:9";
  const aspectStyle: React.CSSProperties = {
    aspectRatio:
      aspect === "9:16" ? "9 / 16" : aspect === "1:1" ? "1 / 1" : "16 / 9",
  };

  /* ------------------------------ render --------------------------- */

  return (
    <div
      className={cn(
        aspect === "9:16" && "mx-auto max-w-[320px] md:max-w-[380px]",
        aspect === "1:1" && "mx-auto max-w-[560px]"
      )}
    >
      <div
        ref={containerRef}
        style={heightClass ? undefined : aspectStyle}
        className={cn(
          "relative w-full overflow-hidden rounded-sm border border-border bg-ink",
          heightClass,
          className
        )}
      >
        {/* SVG filter for the ripple transition */}
        <svg className="absolute h-0 w-0" aria-hidden="true">
          <defs>
            <filter id={filterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.03"
                numOctaves="2"
                result="noise"
              />
              <feDisplacementMap
                ref={dispRef}
                in="SourceGraphic"
                in2="noise"
                scale="0"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Audio beds */}
        {doc.music && resolved[doc.music.clipId] && (
          <audio
            ref={musicRef}
            src={resolved[doc.music.clipId].url}
            preload="auto"
            crossOrigin="anonymous"
          />
        )}
        {doc.voiceover && resolved[doc.voiceover.clipId] && (
          <audio
            ref={voRef}
            src={resolved[doc.voiceover.clipId].url}
            preload="auto"
            crossOrigin="anonymous"
          />
        )}

        {/* Segments */}
        {active.map((entry) => {
          const { seg, startSec, lenSec } = entry;
          const asset = resolved[seg.clipId];
          const { style, extraBlurPx } = segmentStyle(entry);
          if (!asset) {
            return (
              <div
                key={seg.id}
                className="absolute inset-0 flex items-center justify-center"
                style={style}
              >
                <p className="px-6 text-center font-body text-sm text-cream/70">
                  Missing media for this segment. Re-link the clip in the
                  Studio.
                </p>
              </div>
            );
          }
          const mediaFilter = filterToCss(seg.filter, extraBlurPx);
          return (
            <div
              key={seg.id}
              className="absolute inset-0 overflow-hidden"
              style={style}
            >
              <div
                className="absolute inset-0 overflow-hidden"
                style={transformStyle(seg)}
              >
                {asset.is360 ? (
                  <div
                    className="h-full w-full"
                    style={
                      mediaFilter !== "none" ? { filter: mediaFilter } : undefined
                    }
                  >
                    <PanoViewer
                      media={{
                        kind: asset.kind === "video" ? "video360" : "photo360",
                        src: asset.url,
                        poster: asset.poster ?? null,
                        initialYawDeg: seg.panoMotion?.fromYawDeg ?? 0,
                      }}
                      motion={
                        seg.panoMotion
                          ? {
                              fromYawDeg: seg.panoMotion.fromYawDeg,
                              toYawDeg: seg.panoMotion.toYawDeg,
                              durationSec: lenSec,
                            }
                          : null
                      }
                      chromeless
                      heightClass="h-full"
                      className="rounded-none border-0"
                      label={doc.title}
                    />
                  </div>
                ) : asset.kind === "video" ? (
                  <video
                    ref={(el) => {
                      if (el) videoElsRef.current.set(seg.id, el);
                      else videoElsRef.current.delete(seg.id);
                    }}
                    src={asset.url}
                    playsInline
                    muted
                    preload="auto"
                    crossOrigin="anonymous"
                    className="h-full w-full"
                    style={{
                      ...kenBurnsStyle(entry),
                      ...(mediaFilter !== "none"
                        ? { filter: mediaFilter }
                        : {}),
                    }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt=""
                    className="h-full w-full"
                    style={{
                      ...kenBurnsStyle(entry),
                      ...(mediaFilter !== "none"
                        ? { filter: mediaFilter }
                        : {}),
                    }}
                  />
                )}
              </div>

              {/* Stickers */}
              {(seg.stickers ?? []).map((st) => {
                const local = t - startSec;
                if (local < st.startSec || local > st.endSec) return null;
                const a = Math.min(
                  1,
                  (local - st.startSec) / 0.25,
                  (st.endSec - local) / 0.25
                );
                const stAsset = resolved[st.assetId];
                if (!stAsset) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={st.id}
                    src={stAsset.url}
                    alt=""
                    className="pointer-events-none absolute"
                    style={{
                      left: `${st.xPct}%`,
                      top: `${st.yPct}%`,
                      width: `${st.widthPct}%`,
                      opacity: Math.max(0, a) * st.opacity,
                      transform: `translate(-50%, -50%) rotate(${st.rotateDeg}deg)`,
                    }}
                  />
                );
              })}

              {/* 360 affordance */}
              {asset.is360 && t >= startSec && (
                <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-rust px-2 py-1 font-body text-[10px] font-bold uppercase tracking-widest text-white">
                  360, drag to look
                </span>
              )}

              {/* Overlays */}
              {overlaysAt(seg, startSec).map((o, i) => {
                const pos =
                  o.position ?? (o.kind === "title" ? "center" : "lower");
                const color = OVERLAY_COLORS[o.style?.color ?? "cream"];
                const size = o.style?.size ?? "md";
                const withBg = o.style?.background ?? o.kind !== "title";
                return (
                  <div
                    key={`${seg.id}-o${i}`}
                    className={cn(
                      "pointer-events-none absolute inset-x-0 flex px-8",
                      pos === "center" &&
                        "inset-y-0 items-center justify-center",
                      pos === "lower" && "bottom-14 justify-start",
                      pos === "upper" && "top-10 justify-center"
                    )}
                    style={overlayAnimStyle(o, startSec)}
                  >
                    {o.kind === "title" ? (
                      <h3
                        className={cn(
                          "max-w-3xl text-center font-display drop-shadow-md",
                          TITLE_SIZES[size]
                        )}
                        style={{
                          color,
                          ...(withBg
                            ? {
                                backgroundColor: "rgba(26,26,26,0.55)",
                                padding: "0.25em 0.6em",
                              }
                            : {}),
                        }}
                      >
                        {o.text}
                      </h3>
                    ) : o.kind === "lower-third" ? (
                      <div
                        className="border-l-2 border-rust px-4 py-2"
                        style={
                          withBg
                            ? {
                                backgroundColor: "rgba(26,26,26,0.55)",
                                backdropFilter: "blur(4px)",
                              }
                            : undefined
                        }
                      >
                        <p
                          className={cn(
                            "font-body font-semibold uppercase tracking-widest",
                            THIRD_SIZES[size]
                          )}
                          style={{ color }}
                        >
                          {o.text}
                        </p>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "mx-auto max-w-2xl rounded-sm px-3 py-1.5 text-center font-body",
                          THIRD_SIZES[size]
                        )}
                        style={{
                          color,
                          ...(withBg
                            ? {
                                backgroundColor: "rgba(26,26,26,0.55)",
                                backdropFilter: "blur(4px)",
                              }
                            : {}),
                        }}
                      >
                        {o.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Subtitles */}
        {showCC && cueNow && (
          <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-8">
            <p className="max-w-2xl rounded-sm bg-ink/75 px-3 py-1.5 text-center font-body text-sm leading-snug text-cream">
              {cueNow.text}
            </p>
          </div>
        )}

        {/* End slate */}
        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/70">
            <p className="font-display text-2xl text-cream">{doc.title}</p>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-sm bg-rust px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Play again
            </button>
          </div>
        )}

        {/* Control bar */}
        {!minimalChrome && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-3 pb-2.5 pt-8">
            <div
              className="group/scrub relative h-4 cursor-pointer"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                seek(((e.clientX - rect.left) / rect.width) * total);
              }}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(total)}
              aria-valuenow={Math.round(Math.min(t, total))}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") seek(Math.min(total, t + 2));
                if (e.key === "ArrowLeft") seek(Math.max(0, t - 2));
              }}
            >
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-cream/25" />
              <div
                className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-rust"
                style={{
                  width: `${total ? Math.min(100, (t / total) * 100) : 0}%`,
                }}
              />
              {timed.slice(1).map(({ seg, startSec }) => (
                <div
                  key={`m-${seg.id}`}
                  className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-cream/50"
                  style={{ left: `${total ? (startSec / total) * 100 : 0}%` }}
                />
              ))}
            </div>

            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlayingBoth(!playing)}
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-cream/90 transition-colors hover:bg-cream/10 hover:text-cream"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-cream/90 transition-colors hover:bg-cream/10 hover:text-cream"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                {(doc.subtitles?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCC((v) => !v)}
                    className="flex h-8 w-8 items-center justify-center rounded-sm text-cream/90 transition-colors hover:bg-cream/10 hover:text-cream"
                    aria-label={showCC ? "Hide subtitles" : "Show subtitles"}
                  >
                    {showCC ? (
                      <Captions className="h-4 w-4" />
                    ) : (
                      <CaptionsOff className="h-4 w-4" />
                    )}
                  </button>
                )}
                <span className="font-mono text-[11px] tracking-wider text-cream/80">
                  {fmt(Math.min(t, total))} / {fmt(total)}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-cream/90 transition-colors hover:bg-cream/10 hover:text-cream"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
