"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Media360 } from "@/lib/immersive/types";

/* ------------------------------------------------------------------ */
/*  PanoViewer: a dependency-free WebGL equirectangular 360 viewer.    */
/*                                                                     */
/*  Renders a fullscreen triangle and computes the view ray per pixel  */
/*  in the fragment shader, sampling the equirect texture. Supports    */
/*  photo and video sources, drag/touch with inertia, pinch and        */
/*  button zoom, fullscreen, keyboard arrows, a compass readout, and   */
/*  a gentle idle drift that respects prefers-reduced-motion.          */
/*                                                                     */
/*  Initializes lazily when scrolled near the viewport and tears down  */
/*  cleanly on unmount. Falls back to the poster when WebGL is         */
/*  unavailable.                                                       */
/* ------------------------------------------------------------------ */

const VERT = `
attribute vec2 aPos;
varying vec2 vNdc;
void main() {
  vNdc = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
varying vec2 vNdc;
uniform sampler2D uTex;
uniform float uYaw;     // radians
uniform float uPitch;   // radians
uniform float uFov;     // vertical, radians
uniform float uAspect;  // width / height
uniform float uYawOff;  // radians, aligns texture x=0 with its heading

const float PI = 3.14159265358979;

void main() {
  float tanHalf = tan(uFov * 0.5);
  vec3 dir = normalize(vec3(vNdc.x * tanHalf * uAspect, vNdc.y * tanHalf, -1.0));

  // pitch about X
  float cp = cos(uPitch); float sp = sin(uPitch);
  dir = vec3(dir.x, cp * dir.y - sp * dir.z, sp * dir.y + cp * dir.z);

  // yaw about Y
  float cy = cos(uYaw); float sy = sin(uYaw);
  dir = vec3(cy * dir.x + sy * dir.z, dir.y, -sy * dir.x + cy * dir.z);

  float lon = atan(dir.x, -dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));

  vec2 uv = vec2((lon + uYawOff) / (2.0 * PI) + 0.5, 0.5 - lat / PI);
  gl_FragColor = texture2D(uTex, uv);
}
`;

const DEG = Math.PI / 180;
const FOV_MIN = 40;
const FOV_MAX = 95;
const FOV_DEFAULT = 72;

function isPowerOfTwo(n: number) {
  return (n & (n - 1)) === 0 && n !== 0;
}

function compassPoint(headingDeg: number): string {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round((((headingDeg % 360) + 360) % 360) / 45) % 8];
}

interface PanoViewerProps {
  media: Media360;
  /** Tailwind height classes for the inline (non-fullscreen) frame */
  heightClass?: string;
  className?: string;
  /** Accessible label, e.g. the stop title */
  label?: string;
  /**
   * Scripted camera move in heading degrees, used by sequence playback.
   * Runs until the visitor interacts, then hands over control.
   */
  motion?: {
    fromYawDeg: number;
    toYawDeg: number;
    durationSec: number;
  } | null;
  /** Hide the control bar and hint (sequence playback drives the view) */
  chromeless?: boolean;
}

export default function PanoViewer({
  media,
  heightClass = "h-[420px] md:h-[520px]",
  className,
  label,
  motion = null,
  chromeless = false,
}: PanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const rafRef = useRef<number>(0);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const textureRef = useRef<WebGLTexture | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  // View state lives in refs so the render loop never re-subscribes
  const viewRef = useRef({
    yaw: 0,
    pitch: 0,
    fov: FOV_DEFAULT,
    yawVel: 0,
    pitchVel: 0,
    lastInteraction: 0,
    interactedEver: false,
    motionStart: 0,
    reducedMotion: false,
    textureReady: false,
    videoReady: false,
    visible: false,
  });
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDistRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [heading, setHeading] = useState(media.initialYawDeg ?? 0);

  const isVideo = media.kind === "video360";

  /* ----------------------------- helpers --------------------------- */

  const markInteraction = useCallback(() => {
    viewRef.current.lastInteraction = performance.now();
    viewRef.current.interactedEver = true;
    setHintVisible(false);
  }, []);

  const resetView = useCallback(() => {
    const v = viewRef.current;
    v.yaw = 0;
    v.pitch = 0;
    v.fov = FOV_DEFAULT;
    v.yawVel = 0;
    v.pitchVel = 0;
    markInteraction();
  }, [markInteraction]);

  const zoomBy = useCallback(
    (delta: number) => {
      const v = viewRef.current;
      v.fov = Math.min(FOV_MAX, Math.max(FOV_MIN, v.fov + delta));
      markInteraction();
    },
    [markInteraction]
  );

  /* ------------------------ lazy start on view --------------------- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          viewRef.current.visible = entry.isIntersecting;
          if (entry.isIntersecting) setStarted(true);
          const video = videoRef.current;
          if (video) {
            if (entry.isIntersecting && playing) {
              video.play().catch(() => undefined);
            } else {
              video.pause();
            }
          }
        }
      },
      { rootMargin: "240px 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playing]);

  /* --------------------------- GL lifecycle ------------------------ */

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    viewRef.current.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      setFailed("WebGL is not available in this browser.");
      return;
    }
    const isGl2 = typeof WebGL2RenderingContext !== "undefined" &&
      gl instanceof WebGL2RenderingContext;
    glRef.current = gl;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setFailed("Could not initialize the 360 renderer.");
      return;
    }
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed("Could not initialize the 360 renderer.");
      return;
    }
    gl.useProgram(program);
    programRef.current = program;

    // Fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      uYaw: gl.getUniformLocation(program, "uYaw"),
      uPitch: gl.getUniformLocation(program, "uPitch"),
      uFov: gl.getUniformLocation(program, "uFov"),
      uAspect: gl.getUniformLocation(program, "uAspect"),
      uYawOff: gl.getUniformLocation(program, "uYawOff"),
      uTex: gl.getUniformLocation(program, "uTex"),
    };
    gl.uniform1i(uniformsRef.current.uTex, 0);

    const texture = gl.createTexture();
    textureRef.current = texture;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Horizontal wrap set after we know the source dimensions
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

    const setWrap = (w: number, h: number) => {
      const repeatOk = isGl2 || (isPowerOfTwo(w) && isPowerOfTwo(h));
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_WRAP_S,
        repeatOk ? gl.REPEAT : gl.CLAMP_TO_EDGE
      );
    };

    let cancelled = false;
    let videoFrameHandle = 0;

    if (isVideo) {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = media.src;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      videoRef.current = video;

      const onReady = () => {
        if (cancelled) return;
        setWrap(video.videoWidth, video.videoHeight);
        viewRef.current.videoReady = true;
        if (viewRef.current.visible) video.play().catch(() => undefined);
      };
      video.addEventListener("canplay", onReady, { once: true });
      video.addEventListener("error", () => {
        if (!cancelled) setFailed("The 360 video could not be loaded.");
      });

      type VideoWithVFC = HTMLVideoElement & {
        requestVideoFrameCallback?: (cb: () => void) => number;
      };
      const vfc = (video as VideoWithVFC).requestVideoFrameCallback?.bind(video);
      if (vfc) {
        const onFrame = () => {
          if (cancelled) return;
          if (glRef.current && textureRef.current) {
            gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
            viewRef.current.textureReady = true;
          }
          videoFrameHandle = vfc(onFrame);
        };
        videoFrameHandle = vfc(onFrame);
      }
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        setWrap(img.naturalWidth, img.naturalHeight);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        viewRef.current.textureReady = true;
      };
      img.onerror = () => {
        if (!cancelled) setFailed("The 360 image could not be loaded.");
      };
      img.src = media.src;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const yawOff = ((media.initialYawDeg ?? 0) + 180) * DEG;
    let lastHeadingShown = -1;

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);
      const v = viewRef.current;
      if (!v.visible || document.hidden) return;

      const video = videoRef.current;
      const usingVfc =
        video &&
        "requestVideoFrameCallback" in HTMLVideoElement.prototype;
      if (
        isVideo &&
        video &&
        v.videoReady &&
        !usingVfc &&
        video.readyState >= 2
      ) {
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        v.textureReady = true;
      }
      if (!v.textureReady) return;

      // Scripted camera move (sequence playback) until first interaction
      const scripted = motionRef.current;
      if (scripted && !v.interactedEver && !v.reducedMotion) {
        if (!v.motionStart) v.motionStart = now;
        const p = Math.min(
          1,
          (now - v.motionStart) / Math.max(1, scripted.durationSec * 1000)
        );
        const h =
          scripted.fromYawDeg +
          (scripted.toYawDeg - scripted.fromYawDeg) * p;
        v.yaw = ((media.initialYawDeg ?? 0) - h) * DEG;
      } else if (pointersRef.current.size === 0) {
        // Inertia
        v.yaw += v.yawVel;
        v.pitch += v.pitchVel;
        v.yawVel *= 0.92;
        v.pitchVel *= 0.92;
        if (Math.abs(v.yawVel) < 0.00002) v.yawVel = 0;
        if (Math.abs(v.pitchVel) < 0.00002) v.pitchVel = 0;

        // Idle drift
        if (
          !v.reducedMotion &&
          !scripted &&
          v.yawVel === 0 &&
          now - v.lastInteraction > 5000
        ) {
          v.yaw += 0.9 * DEG * (1 / 60) * 0.35;
        }
      }
      v.pitch = Math.min(88 * DEG, Math.max(-88 * DEG, v.pitch));

      const u = uniformsRef.current;
      gl.uniform1f(u.uYaw as WebGLUniformLocation, v.yaw);
      gl.uniform1f(u.uPitch as WebGLUniformLocation, v.pitch);
      gl.uniform1f(u.uFov as WebGLUniformLocation, v.fov * DEG);
      gl.uniform1f(
        u.uAspect as WebGLUniformLocation,
        canvas.width / Math.max(1, canvas.height)
      );
      gl.uniform1f(u.uYawOff as WebGLUniformLocation, yawOff);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      const headingNow = Math.round(
        ((((media.initialYawDeg ?? 0) - v.yaw / DEG) % 360) + 360) % 360
      );
      if (headingNow !== lastHeadingShown) {
        lastHeadingShown = headingNow;
        setHeading(headingNow);
      }
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (videoFrameHandle && videoRef.current) {
        const v = videoRef.current as HTMLVideoElement & {
          cancelVideoFrameCallback?: (h: number) => void;
        };
        v.cancelVideoFrameCallback?.(videoFrameHandle);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
        videoRef.current = null;
      }
      if (glRef.current) {
        if (textureRef.current) glRef.current.deleteTexture(textureRef.current);
        if (programRef.current) glRef.current.deleteProgram(programRef.current);
      }
      glRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, media.src, media.kind]);

  /* ---------------------------- interaction ------------------------ */

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 2) {
        const pts = [...pointersRef.current.values()];
        pinchDistRef.current = Math.hypot(
          pts[0].x - pts[1].x,
          pts[0].y - pts[1].y
        );
      }
      const v = viewRef.current;
      v.yawVel = 0;
      v.pitchVel = 0;
      markInteraction();
    },
    [markInteraction]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const pointers = pointersRef.current;
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, next);

    const v = viewRef.current;
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchDistRef.current > 0) {
        v.fov = Math.min(
          FOV_MAX,
          Math.max(FOV_MIN, v.fov * (pinchDistRef.current / dist))
        );
      }
      pinchDistRef.current = dist;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Scale drag to the visible field of view: a full-height drag pans
    // roughly one field of view.
    const scale = (v.fov * DEG) / rect.height;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    v.yaw += dx * scale;
    v.pitch += dy * scale;
    v.pitch = Math.min(88 * DEG, Math.max(-88 * DEG, v.pitch));
    v.yawVel = dx * scale * 0.6;
    v.pitchVel = dy * scale * 0.6;
    v.lastInteraction = performance.now();
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    pinchDistRef.current = 0;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      // Only capture scroll for zoom in fullscreen, so the page scroll
      // is never hijacked mid-article.
      if (!isFullscreen) return;
      zoomBy(e.deltaY > 0 ? 4 : -4);
    },
    [isFullscreen, zoomBy]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const v = viewRef.current;
      const step = 6 * DEG;
      switch (e.key) {
        case "ArrowLeft":
          v.yaw -= step;
          break;
        case "ArrowRight":
          v.yaw += step;
          break;
        case "ArrowUp":
          v.pitch = Math.min(88 * DEG, v.pitch + step);
          break;
        case "ArrowDown":
          v.pitch = Math.max(-88 * DEG, v.pitch - step);
          break;
        case "+":
        case "=":
          zoomBy(-5);
          break;
        case "-":
          zoomBy(5);
          break;
        default:
          return;
      }
      e.preventDefault();
      markInteraction();
    },
    [markInteraction, zoomBy]
  );

  /* ----------------------------- fullscreen ------------------------ */

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
    markInteraction();
  }, [markInteraction]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => undefined);
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
    markInteraction();
  }, [markInteraction]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    markInteraction();
  }, [markInteraction]);

  /* ------------------------------- render -------------------------- */

  const controlBtn =
    "flex h-9 w-9 items-center justify-center rounded-sm bg-ink/60 text-cream/90 backdrop-blur-sm transition-colors hover:bg-ink/80 hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-cream/70";

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full select-none overflow-hidden rounded-sm border border-border bg-ink",
        isFullscreen ? "h-full" : heightClass,
        className
      )}
      role="application"
      aria-label={label ? `360 view, ${label}` : "360 view"}
    >
      {/* Poster sits underneath until the first frame renders */}
      {media.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      )}

      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <p className="max-w-sm text-center font-body text-sm text-cream/80">
            {failed} The flat preview above stands in for the look-around
            view.
          </p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />
      )}

      {/* Top chrome: 360 chip + provenance note */}
      <div
        className={cn(
          "pointer-events-none absolute left-3 top-3 flex max-w-[80%] flex-wrap items-center gap-2",
          chromeless && "hidden"
        )}
      >
        <span className="rounded-sm bg-rust px-2 py-1 font-body text-[10px] font-bold uppercase tracking-widest text-white">
          360 {isVideo ? "video" : "photo"}
        </span>
        {media.note && (
          <span className="rounded-sm bg-ink/60 px-2 py-1 font-body text-[10px] uppercase tracking-wider text-cream/85 backdrop-blur-sm">
            {media.note}
          </span>
        )}
      </div>

      {/* Compass readout */}
      {!failed && !chromeless && (
        <div className="pointer-events-none absolute right-3 top-3 rounded-sm bg-ink/60 px-2.5 py-1 backdrop-blur-sm">
          <span className="font-mono text-[11px] tracking-widest text-cream/90">
            {compassPoint(heading)} {String(heading).padStart(3, "0")}&deg;
          </span>
        </div>
      )}

      {/* Drag hint */}
      {!failed && hintVisible && !chromeless && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-sm bg-ink/65 px-5 py-3 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5 animate-pulse text-cream"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h8m-8 0l3-3m-3 3l3 3m5-3l-3-3m3 3l-3 3"
              />
            </svg>
            <span className="font-body text-sm font-medium text-cream">
              Drag to look around
            </span>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      {!failed && !chromeless && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isVideo && (
              <>
                <button
                  type="button"
                  onClick={togglePlay}
                  className={controlBtn}
                  aria-label={playing ? "Pause 360 video" : "Play 360 video"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className={controlBtn}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={resetView}
              className={controlBtn}
              aria-label="Reset view"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => zoomBy(5)}
              className={controlBtn}
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => zoomBy(-5)}
              className={controlBtn}
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className={controlBtn}
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
  );
}
