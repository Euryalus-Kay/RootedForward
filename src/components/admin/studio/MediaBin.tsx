"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DEMO_MEDIA } from "@/lib/immersive/demo";
import {
  looks360,
  probeMedia,
  uid,
  uploadTourMedia,
} from "@/lib/immersive/studio-client";
import type { StudioMediaItem } from "@/lib/immersive/types";
import {
  AudioLines,
  CheckCircle2,
  Film,
  ImageIcon,
  Loader2,
  Mic,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  MediaBin: the Studio's clip library. Local files become session    */
/*  object URLs immediately; "Save to library" pushes them to the      */
/*  tour-media bucket so they survive reloads and can ship in          */
/*  published sequences.                                               */
/* ------------------------------------------------------------------ */

interface MediaBinProps {
  media: StudioMediaItem[];
  onChange: (media: StudioMediaItem[]) => void;
  onAddToTimeline: (item: StudioMediaItem) => void;
  analyzingId: string | null;
}

export default function MediaBin({
  media,
  onChange,
  onAddToTimeline,
  analyzingId,
}: MediaBinProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const addFiles = async (files: FileList) => {
    const additions: StudioMediaItem[] = [];
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith("video/")
        ? ("video" as const)
        : file.type.startsWith("image/")
          ? ("image" as const)
          : file.type.startsWith("audio/")
            ? ("audio" as const)
            : null;
      if (!kind) {
        toast.error(`${file.name} is not a video, image, or audio file`);
        continue;
      }
      const url = URL.createObjectURL(file);
      try {
        const probe = await probeMedia(url, kind);
        additions.push({
          id: uid("clip"),
          name: file.name,
          kind,
          url,
          durationSec: probe.durationSec,
          width: probe.width,
          height: probe.height,
          is360: kind !== "audio" && looks360(probe.width, probe.height),
          persisted: false,
          analysis: null,
        });
      } catch {
        URL.revokeObjectURL(url);
        toast.error(`Could not read ${file.name}`);
      }
    }
    if (additions.length > 0) onChange([...media, ...additions]);
  };

  /* ----------------------- voiceover recording --------------------- */

  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        try {
          const probe = await probeMedia(url, "audio");
          const count =
            media.filter((m) => m.name.startsWith("voiceover-")).length + 1;
          onChange([
            ...media,
            {
              id: uid("clip"),
              name: `voiceover-${count}.webm`,
              kind: "audio",
              url,
              durationSec: probe.durationSec,
              width: 0,
              height: 0,
              is360: false,
              persisted: false,
              analysis: null,
            },
          ]);
          toast.success(
            "Voiceover recorded. Set it as the voiceover track in the timeline."
          );
        } catch {
          toast.error("The recording could not be read back");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      toast("Recording... press the mic again to stop", { icon: "🎙️" });
    } catch {
      toast.error("Microphone access was denied");
    }
  };

  const addDemoMedia = () => {
    const existing = new Set(media.map((m) => m.id));
    const fresh = DEMO_MEDIA.filter((m) => !existing.has(m.id));
    if (fresh.length === 0) {
      toast("The demo clips are already in the bin");
      return;
    }
    onChange([...media, ...fresh.map((m) => ({ ...m }))]);
  };

  const saveToLibrary = async (item: StudioMediaItem) => {
    setUploadingId(item.id);
    try {
      const blob = await fetch(item.url).then((r) => r.blob());
      const safeName = item.name.replace(/[^\w.\-]+/g, "_");
      const path = `studio/${Date.now()}-${safeName}`;
      const { publicUrl, path: storedPath } = await uploadTourMedia(
        blob,
        path
      );
      onChange(
        media.map((m) =>
          m.id === item.id
            ? { ...m, url: publicUrl, storagePath: storedPath, persisted: true }
            : m
        )
      );
      toast.success("Saved to the media library");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed. ${msg}`);
    } finally {
      setUploadingId(null);
    }
  };

  const remove = (item: StudioMediaItem) => {
    if (!item.persisted && item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
    onChange(media.filter((m) => m.id !== item.id));
  };

  const toggle360 = (item: StudioMediaItem) => {
    onChange(
      media.map((m) => (m.id === item.id ? { ...m, is360: !m.is360 } : m))
    );
  };

  return (
    <div className="rounded-xl border border-border bg-white/60 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="font-display text-base font-semibold text-forest">
            Media bin
          </h2>
          <p className="text-xs text-warm-gray">
            {media.length} clip{media.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addDemoMedia}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-cream-dark"
          >
            Add test clips
          </button>
          <button
            onClick={toggleRecording}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              recording
                ? "animate-pulse border-red-400 bg-red-50 text-red-600"
                : "border-border text-ink hover:bg-cream-dark"
            )}
            title="Record a voiceover with the microphone"
          >
            <Mic className="h-3.5 w-3.5" />
            {recording ? "Stop" : "Voiceover"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-forest-light"
          >
            <Upload className="h-3.5 w-3.5" />
            Add media
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="video/*,image/*,audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {media.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-warm-gray">
            Add your own footage or load the built-in test clips to try the
            pipeline.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {media.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              {/* Thumb */}
              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-ink">
                {item.kind === "video" ? (
                  <video
                    src={item.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : item.kind === "audio" ? (
                  <div className="flex h-full w-full items-center justify-center bg-forest">
                    <AudioLines className="h-5 w-5 text-cream/80" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute bottom-0.5 right-0.5 rounded-sm bg-ink/70 px-1 font-mono text-[9px] text-cream">
                  {item.durationSec
                    ? `${item.durationSec}s`
                    : item.kind === "image"
                      ? "img"
                      : ""}
                </span>
              </div>

              {/* Meta */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {item.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {item.kind === "audio" ? (
                    <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest">
                      audio
                    </span>
                  ) : (
                    <button
                      onClick={() => toggle360(item)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                        item.is360
                          ? "bg-rust/15 text-rust"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                      title="Toggle whether this clip is treated as equirectangular 360"
                    >
                      {item.is360 ? "360" : "2D"}
                    </button>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      item.persisted
                        ? "bg-forest/10 text-forest"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {item.persisted ? "library" : "this session only"}
                  </span>
                  {analyzingId === item.id ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-rust">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      analyzing
                    </span>
                  ) : item.analysis ? (
                    <span
                      className="flex items-center gap-1 text-[10px] font-medium text-forest"
                      title={item.analysis.summary}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      analyzed
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {item.kind !== "audio" && (
                  <button
                    onClick={() => onAddToTimeline(item)}
                    className="flex items-center gap-1 rounded-md bg-rust/10 px-2 py-1.5 text-[11px] font-semibold text-rust transition-colors hover:bg-rust/20"
                    title="Append to the timeline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Timeline
                  </button>
                )}
                {!item.persisted && (
                  <button
                    onClick={() => saveToLibrary(item)}
                    disabled={uploadingId === item.id}
                    className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-50"
                    title="Save to the media library (Supabase)"
                  >
                    {uploadingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => remove(item)}
                  className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Remove from the bin"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 border-t border-border px-5 py-2.5">
        <Film className="h-3.5 w-3.5 text-warm-gray" />
        <p className="text-[11px] leading-relaxed text-warm-gray">
          2:1 sources are auto-flagged 360. Audio files feed the music and
          voiceover tracks. Session-only clips play here but cannot ship in
          a published sequence until saved to the library.
        </p>
        <ImageIcon className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
}
