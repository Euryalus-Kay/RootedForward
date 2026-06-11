"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  SequenceAsset,
  SequenceDoc,
  StudioAgentRequest,
  StudioMediaItem,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Client-side helpers for the Studio: media probing, frame           */
/*  extraction for the vision Analyst, and agent API calls.            */
/* ------------------------------------------------------------------ */

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** Read duration and dimensions from a media URL. */
export function probeMedia(
  url: string,
  kind: "video" | "image" | "audio"
): Promise<{ durationSec?: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (kind === "image") {
      const img = new Image();
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Could not read the image"));
      img.src = url;
      return;
    }
    if (kind === "audio") {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () =>
        resolve({
          durationSec: Number.isFinite(audio.duration)
            ? Math.round(audio.duration * 10) / 10
            : undefined,
          width: 0,
          height: 0,
        });
      audio.onerror = () => reject(new Error("Could not read the audio"));
      audio.src = url;
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      resolve({
        durationSec: Number.isFinite(video.duration)
          ? Math.round(video.duration * 10) / 10
          : undefined,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      video.removeAttribute("src");
      video.load();
    };
    video.onerror = () => reject(new Error("Could not read the video"));
    video.src = url;
  });
}

/** Equirectangular sources are 2:1; treat near-2:1 as likely 360. */
export function looks360(width: number, height: number): boolean {
  if (!width || !height) return false;
  const ratio = width / height;
  return Math.abs(ratio - 2) < 0.08;
}

/** Sample frames evenly across a clip as JPEG data URLs. */
export async function extractFrames(
  item: StudioMediaItem,
  count = 4,
  frameWidth = 640,
  quality = 0.72
): Promise<string[]> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");

  if (item.kind === "image") {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load the image"));
      el.src = item.url;
    });
    const scale = frameWidth / img.naturalWidth;
    canvas.width = frameWidth;
    canvas.height = Math.round(img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return [canvas.toDataURL("image/jpeg", quality)];
  }

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.preload = "auto";
  video.src = item.url;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not load the video"));
  });

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const scale = frameWidth / (video.videoWidth || frameWidth);
  canvas.width = frameWidth;
  canvas.height = Math.round((video.videoHeight || 360) * scale);

  const frames: string[] = [];
  const n = Math.max(1, Math.min(count, 8));
  for (let i = 0; i < n; i++) {
    // Evenly spaced, skipping the exact first/last frame
    const t = duration > 0 ? (duration * (i + 0.5)) / n : 0;
    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      video.onerror = () => reject(new Error("Seek failed"));
      video.currentTime = Math.min(t, Math.max(0, duration - 0.05));
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg", quality));
  }

  video.removeAttribute("src");
  video.load();
  return frames;
}

/** Small filmstrip thumbnail for timeline blocks and the bin. */
export async function makeThumb(
  item: StudioMediaItem
): Promise<string | undefined> {
  if (item.kind === "audio") return undefined;
  try {
    const [thumb] = await extractFrames(item, 1, 220, 0.6);
    return thumb;
  } catch {
    return undefined;
  }
}

/* ------------------------- storage upload ------------------------ */

/**
 * Upload media to the tour-media bucket via a server-signed URL, so
 * large files go straight to storage and no RLS policy is required.
 */
export async function uploadTourMedia(
  file: Blob,
  path: string
): Promise<{ publicUrl: string; path: string }> {
  const res = await fetch("/api/studio/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    path?: string;
    token?: string;
    publicUrl?: string;
    message?: string;
    error?: string;
  };
  if (!res.ok || !data.token || !data.path || !data.publicUrl) {
    throw new Error(
      data.message ?? data.error ?? `Upload signing failed (${res.status})`
    );
  }
  const supabase = createClient();
  const { error } = await supabase.storage
    .from("tour-media")
    .uploadToSignedUrl(data.path, data.token, file, {
      contentType: file.type || undefined,
    });
  if (error) throw new Error(error.message);
  return { publicUrl: data.publicUrl, path: data.path };
}

/* --------------------------- agent calls ------------------------- */

export class AgentError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function callAgent<T>(
  payload: StudioAgentRequest,
  sessionKey?: string | null
): Promise<{ result: T; trace: { agent: string; model: string; ms: number } }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (sessionKey) headers["x-anthropic-key"] = sessionKey;
  const res = await fetch("/api/studio/agent", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AgentError(
      (data as { error?: string }).error ?? `http-${res.status}`,
      (data as { message?: string }).message ??
        `The agent call failed with status ${res.status}`
    );
  }
  return data as {
    result: T;
    trace: { agent: string; model: string; ms: number };
  };
}

export async function agentHealth(): Promise<{
  model: string;
  keyConfigured: boolean;
} | null> {
  try {
    const res = await fetch("/api/studio/agent");
    if (!res.ok) return null;
    return (await res.json()) as { model: string; keyConfigured: boolean };
  } catch {
    return null;
  }
}

/* ----------------------- sequence utilities ---------------------- */

export function buildAssets(
  media: StudioMediaItem[],
  opts: { persistedOnly?: boolean } = {}
): Record<string, SequenceAsset> {
  const entries = media
    .filter((m) => !opts.persistedOnly || m.persisted)
    .map((m) => [
      m.id,
      {
        url: m.url,
        kind: m.kind,
        is360: m.is360,
        poster: null,
      } satisfies SequenceAsset,
    ]);
  return Object.fromEntries(entries);
}

export function sequenceDuration(doc: SequenceDoc): number {
  let cursor = 0;
  doc.segments.forEach((seg, i) => {
    const len = Math.max(0.2, seg.outSec - seg.inSec);
    const t = seg.transitionIn;
    const overlap =
      i === 0 || !t || t.type === "cut" || t.type === "dip-black"
        ? 0
        : Math.min(t.durationSec, 3);
    cursor = Math.max(0, cursor - overlap) + len;
  });
  return Math.round(cursor * 10) / 10;
}
