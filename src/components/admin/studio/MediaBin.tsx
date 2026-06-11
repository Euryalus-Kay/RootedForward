"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DEMO_MEDIA } from "@/lib/immersive/demo";
import {
  looks360,
  makeThumb,
  persistMediaItem,
  probeMedia,
  uid,
} from "@/lib/immersive/studio-client";
import type { StudioMediaItem } from "@/lib/immersive/types";
import {
  AudioLines,
  CheckCircle2,
  CloudUpload,
  FlaskConical,
  Loader2,
  Mic,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  MediaBin: the left media rail of the editor workspace. Local       */
/*  files become session object URLs immediately (drop them anywhere   */
/*  on the rail); "Save to library" pushes them to the tour-media      */
/*  bucket so they survive reloads and can ship in published           */
/*  sequences. Dark editor chrome.                                     */
/* ------------------------------------------------------------------ */

interface MediaBinProps {
  media: StudioMediaItem[];
  onChange: (media: StudioMediaItem[]) => void;
  onAddToTimeline: (item: StudioMediaItem) => void;
  analyzingId: string | null;
  /** Clips the current sequence references; deleting them is blocked */
  usedClipIds: Set<string>;
}

const railBtn =
  "flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-cream/70 transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-40";

export default function MediaBin({
  media,
  onChange,
  onAddToTimeline,
  analyzingId,
  usedClipIds,
}: MediaBinProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);

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
        const item: StudioMediaItem = {
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
        };
        item.thumb = await makeThumb(item);
        additions.push(item);
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
      const durable = await persistMediaItem(item);
      onChange(media.map((m) => (m.id === item.id ? durable : m)));
      toast.success("Saved to the media library");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed. ${msg}`);
    } finally {
      setUploadingId(null);
    }
  };

  const [savingAll, setSavingAll] = useState(false);

  const saveAll = async () => {
    setSavingAll(true);
    // Track the array locally; the media prop is stale inside the loop.
    let current = [...media];
    let failed = 0;
    for (const item of media.filter((m) => !m.persisted)) {
      setUploadingId(item.id);
      try {
        const durable = await persistMediaItem(item);
        current = current.map((m) => (m.id === item.id ? durable : m));
        onChange(current);
      } catch {
        failed++;
      }
    }
    setUploadingId(null);
    setSavingAll(false);
    if (failed > 0) {
      toast.error(
        `${failed} upload${failed === 1 ? "" : "s"} failed. Those clips stay session-only.`
      );
    } else {
      toast.success("Every clip is in the library now");
    }
  };

  const remove = (item: StudioMediaItem) => {
    if (usedClipIds.has(item.id)) {
      toast.error(
        `${item.name} is in use on the timeline. Remove it from the cut first.`
      );
      return;
    }
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
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-[#1B1A18] transition-colors",
        dropping && "bg-rust/10"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropping(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
      }}
    >
      {/* Rail header */}
      <div className="shrink-0 border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-cream">
            Media
          </h2>
          <span className="font-mono text-[10px] text-warm-gray">
            {media.length} clip{media.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-rust text-xs font-semibold text-cream transition-colors hover:bg-rust-light"
            title="Add video, image, or audio files (or drop them here)"
          >
            <Upload className="h-3.5 w-3.5" />
            Add media
          </button>
          <button
            onClick={toggleRecording}
            className={cn(
              railBtn,
              recording &&
                "animate-pulse border-red-400/50 bg-red-500/15 text-red-300"
            )}
            title="Record a voiceover with the microphone"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={addDemoMedia}
            className={railBtn}
            title="Add the built-in labeled test clips"
          >
            <FlaskConical className="h-4 w-4" />
          </button>
          {media.some((m) => !m.persisted) && (
            <button
              onClick={saveAll}
              disabled={savingAll}
              className={cn(railBtn, "text-emerald-300/80 hover:text-emerald-300")}
              title="Upload every session-only clip to the media library"
            >
              {savingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CloudUpload className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
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

      {/* Clip list */}
      {media.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <p className="text-center text-xs leading-relaxed text-warm-gray">
            Drop footage here, or add the built-in test clips to try the
            pipeline.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto">
          {media.map((item) => (
            <li key={item.id} className="group px-3 py-2">
              <div className="flex items-center gap-2.5">
                {/* Thumb */}
                <div className="relative h-10 w-[68px] shrink-0 overflow-hidden rounded-sm border border-white/10 bg-black">
                  {item.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : item.kind === "video" ? (
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : item.kind === "audio" ? (
                    <div className="flex h-full w-full items-center justify-center bg-white/10">
                      <AudioLines className="h-4 w-4 text-cream/80" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute bottom-0.5 right-0.5 rounded-sm bg-black/75 px-1 font-mono text-[8px] text-cream">
                    {item.durationSec
                      ? `${item.durationSec}s`
                      : item.kind === "image"
                        ? "img"
                        : ""}
                  </span>
                </div>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-medium text-cream"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {item.kind === "audio" ? (
                      <span className="rounded-full bg-emerald-400/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                        audio
                      </span>
                    ) : (
                      <button
                        onClick={() => toggle360(item)}
                        className={cn(
                          "rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider transition-colors",
                          item.is360
                            ? "bg-rust/25 text-rust-light"
                            : "bg-white/10 text-warm-gray-light hover:bg-white/20"
                        )}
                        title="Toggle whether this clip is treated as equirectangular 360"
                      >
                        {item.is360 ? "360" : "2D"}
                      </button>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-px text-[9px] font-medium",
                        item.persisted
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-amber-400/15 text-amber-300"
                      )}
                    >
                      {item.persisted ? "library" : "session"}
                    </span>
                    {analyzingId === item.id ? (
                      <span className="flex items-center gap-1 text-[9px] font-medium text-rust-light">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        analyzing
                      </span>
                    ) : item.analysis ? (
                      <span
                        className="flex items-center gap-0.5 text-[9px] font-medium text-emerald-300"
                        title={item.analysis.summary}
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        analyzed
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-1.5 flex items-center gap-1">
                {item.kind !== "audio" && (
                  <button
                    onClick={() => onAddToTimeline(item)}
                    className="flex items-center gap-1 rounded-md bg-rust/15 px-2 py-1 text-[10px] font-semibold text-rust-light transition-colors hover:bg-rust/25"
                    title="Append to the timeline"
                  >
                    <Plus className="h-3 w-3" />
                    Timeline
                  </button>
                )}
                {!item.persisted && (
                  <button
                    onClick={() => saveToLibrary(item)}
                    disabled={uploadingId === item.id}
                    className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium text-cream/60 transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-50"
                    title="Save to the media library (Supabase)"
                  >
                    {uploadingId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CloudUpload className="h-3 w-3" />
                    )}
                    Save
                  </button>
                )}
                <button
                  onClick={() => remove(item)}
                  className="ml-auto rounded-md p-1 text-warm-gray transition-colors hover:bg-red-500/10 hover:text-red-400"
                  title="Remove from the bin"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="shrink-0 border-t border-white/10 px-3 py-2">
        <p className="text-[10px] leading-relaxed text-warm-gray">
          2:1 sources auto-flag as 360. Audio feeds the music and voiceover
          tracks. Session clips need a library save to ship.
        </p>
      </div>
    </div>
  );
}
