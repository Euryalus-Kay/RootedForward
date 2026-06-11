"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  exportSequence,
  pickExportSizes,
  supportedExportFormats,
} from "@/lib/immersive/exporter";
import type { SequenceAsset, SequenceDoc } from "@/lib/immersive/types";
import { Download, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  ExportModal: renders the sequence to a WebM video in the browser   */
/*  in real time and downloads it.                                     */
/* ------------------------------------------------------------------ */

export default function ExportModal({
  doc,
  assets,
  projectName,
  onClose,
}: {
  doc: SequenceDoc;
  assets: Record<string, SequenceAsset>;
  projectName: string;
  onClose: () => void;
}) {
  const sizes = pickExportSizes(doc.aspect);
  const formats = supportedExportFormats();
  const [sizeIdx, setSizeIdx] = useState(0);
  const [formatIdx, setFormatIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [note, setNote] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const start = async () => {
    const size = sizes[sizeIdx];
    const format = formats[formatIdx];
    setRunning(true);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await exportSequence(doc, assets, {
        width: size.width,
        height: size.height,
        fps: 30,
        mimeType: format?.mimeType,
        signal: controller.signal,
        onProgress: (p, n) => {
          setProgress(p);
          setNote(n);
        },
      });
      const ext = result.mimeType.includes("mp4") ? "mp4" : "webm";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(result.blob);
      a.download = `${projectName.replace(/[^\w\-]+/g, "-").toLowerCase()}-${size.height}p.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(
        `Exported ${result.durationSec.toFixed(1)}s of video`
      );
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/canceled/i.test(msg)) toast.error(msg);
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#1F1E1B] p-6 text-cream shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-cream">
            Export video
          </h2>
          <button
            onClick={() => {
              abortRef.current?.abort();
              onClose();
            }}
            className="rounded-md p-1 text-warm-gray hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!running ? (
          <>
            <p className="text-sm leading-relaxed text-cream/70">
              The cut renders in real time in this tab (a {""}
              {Math.round(
                doc.segments.reduce(
                  (acc, s) => acc + (s.outSec - s.inSec) / (s.speed ?? 1),
                  0
                )
              )}
              s sequence takes about that long). Keep the tab focused while
              it runs. Sound is mixed in, and 360 segments follow their
              scripted camera move. Pick the format below; MP4 plays
              everywhere, WebM is the leaner web format.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-cream">
                  Resolution
                </label>
                <select
                  value={sizeIdx}
                  onChange={(e) => setSizeIdx(parseInt(e.target.value, 10))}
                  className="w-full rounded-md border border-white/10 bg-[#141312] px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-rust"
                >
                  {sizes.map((s, i) => (
                    <option key={s.label} value={i}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-cream">
                  Format
                </label>
                <select
                  value={formatIdx}
                  onChange={(e) => setFormatIdx(parseInt(e.target.value, 10))}
                  className="w-full rounded-md border border-white/10 bg-[#141312] px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-rust"
                >
                  {formats.map((f, i) => (
                    <option key={f.label} value={i}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-cream hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={start}
                className="flex items-center gap-2 rounded-md bg-rust px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-rust-light"
              >
                <Download className="h-4 w-4" />
                Render and download
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-rust-light" />
              <p className="text-sm text-cream/80">
                {note || "Rendering"}... {Math.round(progress * 100)}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn("h-full bg-rust transition-all")}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  abortRef.current?.abort();
                  setRunning(false);
                }}
                className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-cream hover:bg-white/10"
              >
                Cancel render
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
