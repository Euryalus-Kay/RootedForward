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
import type {
  SequenceAsset,
  SequenceDoc,
  SequenceOverlay,
  SequenceSegment,
} from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  TimelinePlayer: renders a SequenceDoc live in the browser.         */
/*                                                                     */
/*  The sequence is the product. Instead of exporting a flat file,     */
/*  the Studio's edit decision list plays directly: 2D clips with Ken  */
/*  Burns moves, 360 segments the viewer can grab mid-sequence, title  */
/*  overlays, and transitions (cut, crossfade, dip to black, slide,    */
/*  ripple). Overlapping transitions are modeled by letting a segment  */
/*  start before the previous one ends.                                */
/* ------------------------------------------------------------------ */

interface TimedSegment {
  seg: SequenceSegment;
  startSec: number;
  lenSec: number;
}

function overlapFor(seg: SequenceSegment): number {
  const t = seg.transitionIn;
  if (!t || t.type === "cut" || t.type === "dip-black") return 0;
  return Math.max(0, Math.min(t.durationSec, 3));
}

function layout(doc: SequenceDoc): { timed: TimedSegment[]; total: number } {
  const timed: TimedSegment[] = [];
  let cursor = 0;
  for (const seg of doc.segments) {
    const lenSec = Math.max(0.2, seg.outSec - seg.inSec);
    const start = timed.length === 0 ? 0 : cursor - overlapFor(seg);
    timed.push({ seg, startSec: Math.max(0, start), lenSec });
    cursor = Math.max(0, start) + lenSec;
  }
  return { timed, total: cursor };
}

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
}

export default function TimelinePlayer({
  doc,
  assets,
  className,
  heightClass = "aspect-video",
  autoPlay = false,
  loop = false,
  onTimeUpdate,
}: TimelinePlayerProps) {
  const filterId = useId().replace(/[:]/g, "x");
  const containerRef = useRef<HTMLDivElement>(null);
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const dispRef = useRef<SVGFEDisplacementMapElement | null>(null);

  const timeRef = useRef(0);
  const playingRef = useRef(autoPlay);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick] = useState(0); // drives re-render at ~15fps

  const resolved = useMemo(
    () => ({ ...(doc.assets ?? {}), ...(assets ?? {}) }),
    [doc.assets, assets]
  );
  const { timed, total } = useMemo(() => layout(doc), [doc]);

  const playingRefSync = useCallback((v: boolean) => {
    playingRef.current = v;
    setPlaying(v);
  }, []);

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
            playingRefSync(false);
          }
        }
      }
      onTimeUpdate?.(timeRef.current);
      // Re-render at ~15fps for overlay/transition styles; video elements
      // advance on their own.
      if (now - lastTick > 66) {
        lastTick = now;
        setTick((v) => (v + 1) % 1_000_000);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [total, loop, onTimeUpdate, playingRefSync]);

  /* --------------------------- media sync -------------------------- */

  const t = timeRef.current;
  const lookahead = 2.0;
  const active = timed.filter(
    ({ startSec, lenSec }) =>
      t >= startSec - lookahead && t <= startSec + lenSec + 0.5
  );

  useEffect(() => {
    // Sync every mounted video to the master clock
    for (const { seg, startSec, lenSec } of active) {
      const asset = resolved[seg.clipId];
      if (!asset || asset.kind !== "video" || asset.is360) continue;
      const el = videoElsRef.current.get(seg.id);
      if (!el) continue;
      const local = Math.min(
        seg.outSec,
        Math.max(seg.inSec, seg.inSec + (t - startSec))
      );
      const within = t >= startSec && t <= startSec + lenSec;
      if (Math.abs(el.currentTime - local) > 0.3) {
        try {
          el.currentTime = local;
        } catch {
          // not seekable yet
        }
      }
      el.muted = muted || (seg.muted ?? true);
      if (playing && within) {
        if (el.paused) el.play().catch(() => undefined);
      } else if (!el.paused) {
        el.pause();
      }
    }
    // tick drives this effect at ~15fps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, playing, muted]);

  /* ------------------------- ripple driver ------------------------- */

  const rippleActive = useMemo(() => {
    return timed.some(({ seg, startSec }) => {
      if (seg.transitionIn?.type !== "ripple") return false;
      const d = Math.max(0.2, seg.transitionIn.durationSec);
      return t >= startSec && t <= startSec + d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, timed]);

  useEffect(() => {
    const disp = dispRef.current;
    if (!disp) return;
    if (!rippleActive) {
      disp.setAttribute("scale", "0");
      return;
    }
    const entry = timed.find(({ seg, startSec }) => {
      if (seg.transitionIn?.type !== "ripple") return false;
      const d = Math.max(0.2, seg.transitionIn.durationSec);
      return t >= startSec && t <= startSec + d;
    });
    if (!entry) return;
    const d = Math.max(0.2, entry.seg.transitionIn.durationSec);
    const p = Math.min(1, Math.max(0, (t - entry.startSec) / d));
    // Bell curve: ramps up then settles
    const scale = Math.sin(p * Math.PI) * 55;
    disp.setAttribute("scale", String(scale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, rippleActive]);

  /* ----------------------------- controls -------------------------- */

  const seek = useCallback((next: number) => {
    timeRef.current = Math.max(0, next);
  }, []);

  const restart = useCallback(() => {
    seek(0);
    playingRefSync(true);
  }, [seek, playingRefSync]);

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

  /* --------------------------- per-segment ------------------------- */

  function segmentStyle(entry: TimedSegment): React.CSSProperties {
    const { seg, startSec, lenSec } = entry;
    const tr = seg.transitionIn;
    const d = Math.max(0.2, tr?.durationSec ?? 0);
    const sinceStart = t - startSec;
    const untilEnd = startSec + lenSec - t;

    let opacity = 1;
    let transform = "none";
    let filter: string | undefined;

    if (t < startSec || t > startSec + lenSec) {
      return { opacity: 0, pointerEvents: "none" };
    }

    switch (tr?.type) {
      case "crossfade":
        if (sinceStart < d) opacity = sinceStart / d;
        break;
      case "ripple":
        if (sinceStart < d) {
          opacity = Math.min(1, sinceStart / (d * 0.6));
          filter = `url(#${filterId})`;
        }
        break;
      case "slide-left":
        if (sinceStart < d) {
          const p = sinceStart / d;
          const ease = 1 - Math.pow(1 - p, 3);
          transform = `translateX(${(1 - ease) * 100}%)`;
        }
        break;
      case "dip-black":
        if (sinceStart < d * 0.5) opacity = sinceStart / (d * 0.5);
        break;
      default:
        break;
    }

    // Tail handling: fade for the incoming transition of the NEXT segment
    const idx = timed.indexOf(entry);
    const next = timed[idx + 1];
    if (next) {
      const nt = next.seg.transitionIn;
      if (nt?.type === "dip-black") {
        const nd = Math.max(0.2, nt.durationSec);
        if (untilEnd < nd * 0.5) {
          opacity = Math.min(opacity, Math.max(0, untilEnd / (nd * 0.5)));
        }
      } else if (nt?.type === "slide-left") {
        const nd = Math.max(0.2, nt.durationSec);
        const into = nd - Math.max(0, untilEnd);
        if (into > 0) {
          const p = Math.min(1, into / nd);
          const ease = 1 - Math.pow(1 - p, 3);
          transform = `translateX(${-ease * 28}%)`;
        }
      } else if (
        (nt?.type === "crossfade" || nt?.type === "ripple") &&
        untilEnd < 0.05
      ) {
        // The incoming segment fades in on top; keep this one fully
        // opaque underneath.
      }
    }

    return { opacity, transform, filter };
  }

  function kenBurnsStyle(entry: TimedSegment): React.CSSProperties {
    const kb = entry.seg.kenBurns;
    if (!kb) return {};
    const p = Math.min(1, Math.max(0, (t - entry.startSec) / entry.lenSec));
    const scale = kb.fromScale + (kb.toScale - kb.fromScale) * p;
    const x = (kb.fromX + (kb.toX - kb.fromX) * p) * 8;
    const y = (kb.fromY + (kb.toY - kb.fromY) * p) * 8;
    return {
      transform: `scale(${scale}) translate(${x}%, ${y}%)`,
      transformOrigin: "center center",
    };
  }

  function overlayVisible(seg: SequenceSegment, startSec: number) {
    const local = t - startSec;
    return (seg.overlays ?? []).filter(
      (o) => local >= o.startSec && local <= o.endSec
    );
  }

  function overlayStyle(o: SequenceOverlay, seg: SequenceSegment, startSec: number): React.CSSProperties {
    const local = t - startSec;
    const fade = 0.35;
    const a = Math.min(
      1,
      (local - o.startSec) / fade,
      (o.endSec - local) / fade
    );
    return { opacity: Math.max(0, Math.min(1, a)) };
  }

  const ended = !playing && t >= total && total > 0;

  /* ------------------------------ render --------------------------- */

  return (
    <div
      ref={containerRef}
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

      {/* Segments */}
      {active.map((entry) => {
        const { seg, startSec, lenSec } = entry;
        const asset = resolved[seg.clipId];
        const style = segmentStyle(entry);
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
        return (
          <div
            key={seg.id}
            className="absolute inset-0 overflow-hidden"
            style={style}
          >
            {asset.is360 ? (
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
                className="h-full w-full object-cover"
                style={kenBurnsStyle(entry)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.url}
                alt=""
                className="h-full w-full object-cover"
                style={kenBurnsStyle(entry)}
              />
            )}

            {/* 360 affordance during pano segments */}
            {asset.is360 && t >= startSec && (
              <span className="pointer-events-none absolute left-3 top-3 rounded-sm bg-rust px-2 py-1 font-body text-[10px] font-bold uppercase tracking-widest text-white">
                360, drag to look
              </span>
            )}

            {/* Overlays */}
            {overlayVisible(seg, startSec).map((o, i) => (
              <div
                key={`${seg.id}-o${i}`}
                className={cn(
                  "pointer-events-none absolute inset-x-0 flex px-8",
                  (o.position ?? (o.kind === "title" ? "center" : "lower")) ===
                    "center" && "inset-y-0 items-center justify-center",
                  (o.position ?? (o.kind === "title" ? "center" : "lower")) ===
                    "lower" && "bottom-14 justify-start",
                  (o.position ?? (o.kind === "title" ? "center" : "lower")) ===
                    "upper" && "top-10 justify-center"
                )}
                style={overlayStyle(o, seg, startSec)}
              >
                {o.kind === "title" ? (
                  <h3 className="max-w-3xl text-center font-display text-3xl text-cream drop-shadow-md md:text-5xl">
                    {o.text}
                  </h3>
                ) : o.kind === "lower-third" ? (
                  <div className="border-l-2 border-rust bg-ink/55 px-4 py-2 backdrop-blur-sm">
                    <p className="font-body text-sm font-semibold uppercase tracking-widest text-cream">
                      {o.text}
                    </p>
                  </div>
                ) : (
                  <p className="mx-auto max-w-2xl rounded-sm bg-ink/55 px-3 py-1.5 text-center font-body text-sm text-cream/90 backdrop-blur-sm">
                    {o.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      })}

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
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-3 pb-2.5 pt-8">
        {/* Scrub bar with segment markers */}
        <div
          className="group/scrub relative h-4 cursor-pointer"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const p = (e.clientX - rect.left) / rect.width;
            seek(p * total);
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
            style={{ width: `${total ? Math.min(100, (t / total) * 100) : 0}%` }}
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
              onClick={() => playingRefSync(!playing)}
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
    </div>
  );
}
