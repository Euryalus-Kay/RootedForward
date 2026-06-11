"use client";

import {
  fadeGain,
  filterToCss,
  layoutDoc,
  mediaTimeAt,
  MUSIC_DUCK,
  segmentSpeed,
  trackGainAt,
  transitionVisual,
  type TimedSegment,
} from "./timeline";
import type {
  AudioTrack,
  SequenceAsset,
  SequenceDoc,
  SequenceOverlay,
} from "./types";

/* ------------------------------------------------------------------ */
/*  exportSequence: renders a SequenceDoc to a real video file in the  */
/*  browser. An offscreen canvas plays the cut in real time (2D clips  */
/*  with grades, Ken Burns, transitions; 360 segments through a small  */
/*  WebGL equirect renderer following their scripted camera move;      */
/*  text, stickers, subtitles drawn on top) while WebAudio mixes clip  */
/*  sound, the music bed, and the voiceover into the same capture.     */
/*  MediaRecorder writes WebM.                                         */
/*                                                                     */
/*  Known approximation: the ripple transition exports as a crossfade  */
/*  with a slight swell, since canvas has no displacement filter.      */
/* ------------------------------------------------------------------ */

export interface ExportOptions {
  width: number;
  height: number;
  fps?: number;
  onProgress?: (fraction: number, note: string) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  mimeType: string;
  /** Seconds of footage rendered */
  durationSec: number;
}

/* ----------------------- 360 GL mini renderer --------------------- */

const PANO_VERT = `
attribute vec2 aPos;
varying vec2 vNdc;
void main() { vNdc = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const PANO_FRAG = `
precision highp float;
varying vec2 vNdc;
uniform sampler2D uTex;
uniform float uYaw;
uniform float uPitch;
uniform float uFov;
uniform float uAspect;
uniform float uYawOff;
const float PI = 3.14159265358979;
void main() {
  float tanHalf = tan(uFov * 0.5);
  vec3 dir = normalize(vec3(vNdc.x * tanHalf * uAspect, vNdc.y * tanHalf, -1.0));
  float cp = cos(uPitch); float sp = sin(uPitch);
  dir = vec3(dir.x, cp * dir.y - sp * dir.z, sp * dir.y + cp * dir.z);
  float cy = cos(uYaw); float sy = sin(uYaw);
  dir = vec3(cy * dir.x + sy * dir.z, dir.y, -sy * dir.x + cy * dir.z);
  float lon = atan(dir.x, -dir.z);
  float lat = asin(clamp(dir.y, -1.0, 1.0));
  vec2 uv = vec2((lon + uYawOff) / (2.0 * PI) + 0.5, 0.5 - lat / PI);
  gl_FragColor = texture2D(uTex, uv);
}
`;

class PanoRenderer {
  canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    const gl = (this.canvas.getContext("webgl2") ||
      this.canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) throw new Error("WebGL is unavailable for 360 export");
    this.gl = gl;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, PANO_VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, PANO_FRAG));
    gl.linkProgram(program);
    gl.useProgram(program);

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

    for (const name of ["uYaw", "uPitch", "uFov", "uAspect", "uYawOff", "uTex"]) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    gl.uniform1i(this.uniforms.uTex, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.viewport(0, 0, width, height);
  }

  render(
    source: HTMLVideoElement | HTMLImageElement,
    headingDeg: number,
    pitchDeg: number,
    initialYawDeg: number
  ) {
    const gl = this.gl;
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch {
      return;
    }
    const DEG = Math.PI / 180;
    const yaw = (initialYawDeg - headingDeg) * DEG;
    gl.uniform1f(this.uniforms.uYaw, yaw);
    gl.uniform1f(this.uniforms.uPitch, (pitchDeg ?? 0) * DEG);
    gl.uniform1f(this.uniforms.uFov, 72 * DEG);
    gl.uniform1f(
      this.uniforms.uAspect,
      this.canvas.width / Math.max(1, this.canvas.height)
    );
    gl.uniform1f(this.uniforms.uYawOff, (initialYawDeg + 180) * DEG);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

/* --------------------------- preloading --------------------------- */

interface LoadedMedia {
  videos: Map<string, HTMLVideoElement>;
  images: Map<string, HTMLImageElement>;
  audios: Map<string, HTMLAudioElement>;
}

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("video");
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.muted = false;
    el.volume = 1;
    el.playsInline = true;
    el.oncanplay = () => resolve(el);
    el.onerror = () => reject(new Error(`Could not load video ${url}`));
    el.src = url;
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Could not load image ${url}`));
    el.src = url;
  });
}

function loadAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const el = new Audio();
    el.crossOrigin = "anonymous";
    el.preload = "auto";
    el.oncanplay = () => resolve(el);
    el.onerror = () => reject(new Error(`Could not load audio ${url}`));
    el.src = url;
  });
}

/* ---------------------------- text layer -------------------------- */

const OVERLAY_COLORS: Record<string, string> = {
  cream: "#F5F0E8",
  white: "#FFFFFF",
  rust: "#C45D3E",
  ink: "#1A1A1A",
};

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  o: SequenceOverlay,
  localSec: number,
  W: number,
  H: number
) {
  const fadeDur = 0.35;
  const aIn = Math.min(1, Math.max(0, (localSec - o.startSec) / fadeDur));
  const aOut = Math.min(1, Math.max(0, (o.endSec - localSec) / fadeDur));
  const alpha = o.anim === "none" ? 1 : Math.min(aIn, aOut);
  if (alpha <= 0) return;

  const sizeKey = o.style?.size ?? "md";
  const color = OVERLAY_COLORS[o.style?.color ?? "cream"];
  const withBg = o.style?.background ?? o.kind !== "title";
  const isTitle = o.kind === "title";

  const titlePx = { sm: 0.05, md: 0.085, lg: 0.12 }[sizeKey] * H;
  const bodyPx = { sm: 0.028, md: 0.034, lg: 0.05 }[sizeKey] * H;
  const px = isTitle ? titlePx : bodyPx;

  ctx.save();
  ctx.globalAlpha *= alpha;

  let dy = 0;
  let scale = 1;
  if (o.anim === "slide-up") dy = (1 - aIn) * 18;
  if (o.anim === "pop") scale = 0.9 + 0.1 * (1 - Math.pow(1 - aIn, 3));

  ctx.font = isTitle
    ? `${px}px Georgia, 'Times New Roman', serif`
    : `600 ${px}px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
  ctx.textBaseline = "middle";

  const pos = o.position ?? (isTitle ? "center" : "lower");
  const metrics = ctx.measureText(o.text);
  const textW = metrics.width;
  const padX = px * 0.5;
  const padY = px * 0.35;

  let x: number;
  let y: number;
  if (pos === "center") {
    x = W / 2;
    y = H / 2;
    ctx.textAlign = "center";
  } else if (pos === "upper") {
    x = W / 2;
    y = H * 0.12;
    ctx.textAlign = "center";
  } else {
    x = o.kind === "lower-third" ? W * 0.055 : W / 2;
    y = H * 0.84;
    ctx.textAlign = o.kind === "lower-third" ? "left" : "center";
  }

  ctx.translate(x, y + dy);
  ctx.scale(scale, scale);

  if (withBg) {
    const left =
      ctx.textAlign === "center" ? -textW / 2 - padX : -padX * 0.4;
    ctx.fillStyle = "rgba(26,26,26,0.55)";
    ctx.fillRect(left, -px / 2 - padY, textW + padX * 2, px + padY * 2);
    if (o.kind === "lower-third") {
      ctx.fillStyle = "#C45D3E";
      ctx.fillRect(left - 3, -px / 2 - padY, 3, px + padY * 2);
    }
  } else if (isTitle) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = px * 0.12;
    ctx.shadowOffsetY = 2;
  }

  ctx.fillStyle = color;
  ctx.fillText(o.text, 0, 0);
  ctx.restore();
}

/* ------------------------------ export ---------------------------- */

export async function exportSequence(
  doc: SequenceDoc,
  extraAssets: Record<string, SequenceAsset>,
  opts: ExportOptions
): Promise<ExportResult> {
  const { width: W, height: H } = opts;
  const fps = opts.fps ?? 30;
  const onProgress = opts.onProgress ?? (() => undefined);
  const assets = { ...(doc.assets ?? {}), ...extraAssets };
  const { timed, total } = layoutDoc(doc);
  if (timed.length === 0) throw new Error("The sequence has no segments");

  onProgress(0, "Loading media");

  /* Preload every referenced asset */
  const media: LoadedMedia = {
    videos: new Map(),
    images: new Map(),
    audios: new Map(),
  };
  const neededClipIds = new Set<string>(timed.map((e) => e.seg.clipId));
  for (const e of timed)
    for (const st of e.seg.stickers ?? []) neededClipIds.add(st.assetId);
  if (doc.music) neededClipIds.add(doc.music.clipId);
  if (doc.voiceover) neededClipIds.add(doc.voiceover.clipId);

  for (const clipId of neededClipIds) {
    const asset = assets[clipId];
    if (!asset) throw new Error(`Missing media for clip ${clipId}`);
    if (asset.kind === "video") {
      media.videos.set(clipId, await loadVideo(asset.url));
    } else if (asset.kind === "image") {
      media.images.set(clipId, await loadImage(asset.url));
    } else {
      media.audios.set(clipId, await loadAudio(asset.url));
    }
  }

  /* Canvas + audio graph */
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D is unavailable");

  const pano = new PanoRenderer(W, H);

  const actx = new AudioContext();
  await actx.resume();
  const dest = actx.createMediaStreamDestination();
  const gains = new Map<string, GainNode>();
  const wireAudio = (key: string, el: HTMLMediaElement) => {
    const src = actx.createMediaElementSource(el);
    const gain = actx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(dest);
    gains.set(key, gain);
  };
  for (const [clipId, el] of media.videos) wireAudio(`clip:${clipId}`, el);
  for (const [clipId, el] of media.audios) wireAudio(`bed:${clipId}`, el);

  /* Recorder */
  const stream = canvas.captureStream(fps);
  const audioTrack = dest.stream.getAudioTracks()[0];
  if (audioTrack) stream.addTrack(audioTrack);
  const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find(
    (m) => MediaRecorder.isTypeSupported(m)
  );
  if (!mimeType) throw new Error("This browser cannot record WebM video");
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: W >= 1600 ? 10_000_000 : 6_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  /* Drawing helpers */

  const drawCover = (
    source: CanvasImageSource,
    sw: number,
    sh: number,
    entry: TimedSegment,
    t: number
  ) => {
    const seg = entry.seg;
    const fit = seg.transform?.fit ?? "cover";
    const frameAspect = W / H;
    const srcAspect = sw / sh;
    let dw: number;
    let dh: number;
    if ((fit === "cover") === srcAspect > frameAspect) {
      dh = H;
      dw = H * srcAspect;
    } else {
      dw = W;
      dh = W / srcAspect;
    }

    ctx.save();
    ctx.translate(W / 2, H / 2);

    const tr = seg.transform;
    if (tr) {
      ctx.translate((tr.xPct / 100) * W, (tr.yPct / 100) * H);
      if (tr.rotateDeg) ctx.rotate((tr.rotateDeg * Math.PI) / 180);
      if (tr.scale !== 1) ctx.scale(tr.scale, tr.scale);
    }

    const kb = seg.kenBurns;
    if (kb) {
      const p = Math.min(1, Math.max(0, (t - entry.startSec) / entry.lenSec));
      const s = kb.fromScale + (kb.toScale - kb.fromScale) * p;
      const xo = ((kb.fromX + (kb.toX - kb.fromX) * p) * 8 * dw) / 100;
      const yo = ((kb.fromY + (kb.toY - kb.fromY) * p) * 8 * dh) / 100;
      ctx.scale(s, s);
      ctx.translate(xo, yo);
    }

    ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  /* Frame loop */

  let raf = 0;
  let stopped = false;
  const start = performance.now();

  const cleanup = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    for (const el of media.videos.values()) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    for (const el of media.audios.values()) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    actx.close().catch(() => undefined);
  };

  const result = new Promise<ExportResult>((resolve, reject) => {
    opts.signal?.addEventListener("abort", () => {
      cleanup();
      try {
        recorder.stop();
      } catch {
        // already stopped
      }
      reject(new Error("Export canceled"));
    });

    recorder.onstop = () => {
      if (opts.signal?.aborted) return;
      resolve({
        blob: new Blob(chunks, { type: mimeType }),
        mimeType,
        durationSec: total,
      });
    };
    recorder.onerror = () => {
      cleanup();
      reject(new Error("The recorder failed"));
    };

    const syncBed = (
      track: AudioTrack | null | undefined,
      key: string,
      t: number,
      duck: number
    ) => {
      if (!track) return 0;
      const el = media.audios.get(track.clipId);
      const gain = gains.get(`bed:${track.clipId}`);
      if (!el || !gain) return 0;
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
            // not seekable
          }
        }
        if (el.paused) el.play().catch(() => undefined);
      } else if (!el.paused) {
        el.pause();
      }
      const g = trackGainAt(track, t, total) * duck;
      gain.gain.setTargetAtTime(g, actx.currentTime, 0.05);
      return g;
    };

    const frame = () => {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      const t = (performance.now() - start) / 1000;

      if (t >= total + 0.2) {
        cleanup();
        try {
          recorder.stop();
        } catch {
          // already stopped
        }
        return;
      }
      onProgress(Math.min(1, t / total), "Rendering");

      /* Audio beds with ducking */
      const voGain = doc.voiceover
        ? trackGainAt(doc.voiceover, t, total)
        : 0;
      syncBed(doc.music, "music", t, voGain > 0.02 ? MUSIC_DUCK : 1);
      syncBed(doc.voiceover, "voiceover", t, 1);

      /* Background */
      ctx.globalAlpha = 1;
      ctx.filter = "none";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      /* Segments */
      timed.forEach((entry, idx) => {
        const { seg, startSec, lenSec } = entry;
        const within = t >= startSec - 1.5 && t <= startSec + lenSec + 0.5;
        const asset = assets[seg.clipId];
        const vid = media.videos.get(seg.clipId);

        /* Per-clip audio gain + transport */
        if (vid) {
          const gain = gains.get(`clip:${seg.clipId}`);
          const playingNow = t >= startSec && t <= startSec + lenSec;
          if (within) {
            const target = mediaTimeAt(seg, Math.max(0, t - startSec));
            if (Math.abs(vid.currentTime - target) > 0.25) {
              try {
                vid.currentTime = target;
              } catch {
                // not seekable
              }
            }
            vid.playbackRate = segmentSpeed(seg);
            if (playingNow && vid.paused) vid.play().catch(() => undefined);
            if (!playingNow && !vid.paused) vid.pause();
          } else if (!vid.paused) {
            vid.pause();
          }
          if (gain) {
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
            gain.gain.setTargetAtTime(
              playingNow ? base * env : 0,
              actx.currentTime,
              0.04
            );
          }
        }

        const vis = transitionVisual(timed, idx, t);
        if (!vis.visible || vis.opacity <= 0.001 || !asset) return;

        ctx.save();
        ctx.globalAlpha = vis.opacity;

        if (vis.wipeP < 1) {
          ctx.beginPath();
          ctx.rect(0, 0, W * vis.wipeP, H);
          ctx.clip();
        }
        if (vis.slideX !== 0) ctx.translate(vis.slideX * W, 0);
        if (vis.scale !== 1) {
          ctx.translate(W / 2, H / 2);
          ctx.scale(vis.scale, vis.scale);
          ctx.translate(-W / 2, -H / 2);
        }
        // Ripple approximation: a gentle swell instead of displacement
        if (vis.rippleP > 0) {
          const s = 1 + vis.rippleP * 0.02;
          ctx.translate(W / 2, H / 2);
          ctx.scale(s, s);
          ctx.translate(-W / 2, -H / 2);
        }

        ctx.filter = filterToCss(seg.filter, vis.extraBlurPx);

        if (asset.is360) {
          const sourceEl =
            vid ?? media.images.get(seg.clipId) ?? null;
          if (sourceEl) {
            const pm = seg.panoMotion;
            const p = Math.min(
              1,
              Math.max(0, (t - startSec) / Math.max(0.01, lenSec))
            );
            const heading = pm
              ? pm.fromYawDeg + (pm.toYawDeg - pm.fromYawDeg) * p
              : 0;
            pano.render(
              sourceEl as HTMLVideoElement | HTMLImageElement,
              heading,
              pm?.pitchDeg ?? 0,
              pm?.fromYawDeg ?? 0
            );
            ctx.drawImage(pano.canvas, 0, 0, W, H);
          }
        } else if (vid) {
          drawCover(vid, vid.videoWidth || 16, vid.videoHeight || 9, entry, t);
        } else {
          const img = media.images.get(seg.clipId);
          if (img) {
            drawCover(
              img,
              img.naturalWidth || 16,
              img.naturalHeight || 9,
              entry,
              t
            );
          }
        }

        ctx.filter = "none";

        /* Stickers */
        for (const st of seg.stickers ?? []) {
          const local = t - startSec;
          if (local < st.startSec || local > st.endSec) continue;
          const stImg = media.images.get(st.assetId);
          if (!stImg) continue;
          const a = Math.min(
            1,
            (local - st.startSec) / 0.25,
            (st.endSec - local) / 0.25
          );
          const w = (st.widthPct / 100) * W;
          const h = w * ((stImg.naturalHeight || 1) / (stImg.naturalWidth || 1));
          ctx.save();
          ctx.globalAlpha = vis.opacity * Math.max(0, a) * st.opacity;
          ctx.translate((st.xPct / 100) * W, (st.yPct / 100) * H);
          if (st.rotateDeg) ctx.rotate((st.rotateDeg * Math.PI) / 180);
          ctx.drawImage(stImg, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        /* Overlays */
        for (const o of seg.overlays ?? []) {
          const local = t - startSec;
          if (local >= o.startSec && local <= o.endSec) {
            drawOverlay(ctx, o, local, W, H);
          }
        }

        ctx.restore();
      });

      /* Subtitles */
      const cue = (doc.subtitles ?? []).find(
        (c) => t >= c.startSec && t <= c.endSec
      );
      if (cue) {
        const px = Math.round(H * 0.038);
        ctx.save();
        ctx.font = `${px}px -apple-system, 'Helvetica Neue', Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const tw = ctx.measureText(cue.text).width;
        const y = H * 0.92;
        ctx.fillStyle = "rgba(26,26,26,0.75)";
        ctx.fillRect(W / 2 - tw / 2 - px * 0.6, y - px * 0.85, tw + px * 1.2, px * 1.7);
        ctx.fillStyle = "#F5F0E8";
        ctx.fillText(cue.text, W / 2, y);
        ctx.restore();
      }
    };

    recorder.start(1000);
    raf = requestAnimationFrame(frame);
  });

  return result;
}

export function pickExportSizes(aspect: SequenceDoc["aspect"]): {
  label: string;
  width: number;
  height: number;
}[] {
  switch (aspect ?? "16:9") {
    case "9:16":
      return [
        { label: "720 x 1280 (HD vertical)", width: 720, height: 1280 },
        { label: "1080 x 1920 (Full HD vertical)", width: 1080, height: 1920 },
      ];
    case "1:1":
      return [
        { label: "720 x 720 (square)", width: 720, height: 720 },
        { label: "1080 x 1080 (square)", width: 1080, height: 1080 },
      ];
    default:
      return [
        { label: "1280 x 720 (HD)", width: 1280, height: 720 },
        { label: "1920 x 1080 (Full HD)", width: 1920, height: 1080 },
      ];
  }
}
