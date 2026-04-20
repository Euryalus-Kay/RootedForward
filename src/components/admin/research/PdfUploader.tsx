"use client";

/* ------------------------------------------------------------------ */
/*  PdfUploader                                                        */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Drag-and-drop PDF uploader for research entries. Uploads to the  */
/*  `research-pdfs` Supabase Storage bucket. Filename stored as     */
/*  `{entryId}.pdf` when an entry id is provided, otherwise           */
/*  `draft-{timestamp}.pdf`.                                           */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useRef, useState } from "react";
import { FileText, Loader2, Replace, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface PdfUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  entryId?: string;
}

const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function PdfUploader({
  value,
  onChange,
  entryId,
}: PdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startProgress = () => {
    setProgress(0);
    let current = 0;
    const interval = window.setInterval(() => {
      current += Math.random() * 15;
      if (current >= 90) {
        window.clearInterval(interval);
        setProgress(90);
      } else {
        setProgress(Math.round(current));
      }
    }, 180);
    return interval;
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("PDFs only. Please pick a .pdf file.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`File too large. Max size is ${MAX_SIZE_MB}MB.`);
        return;
      }

      const supabase = createClient();
      const filename = entryId
        ? `${entryId}.pdf`
        : `draft-${Date.now()}.pdf`;

      setUploading(true);
      const interval = startProgress();

      try {
        const { error: uploadError } = await supabase.storage
          .from("research-pdfs")
          .upload(filename, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: "application/pdf",
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("research-pdfs").getPublicUrl(filename);

        setProgress(100);
        onChange(publicUrl);
        toast.success("PDF uploaded");
      } catch {
        toast.error(
          "Upload failed. Check that the research-pdfs bucket exists."
        );
      } finally {
        window.clearInterval(interval);
        setUploading(false);
      }
    },
    [entryId, onChange]
  );

  const handleClear = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value ? (
        <div className="flex items-center justify-between rounded-sm border border-border bg-cream px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 flex-shrink-0 text-forest" />
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-body text-sm text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
            >
              {value.split("/").pop()}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1 font-body text-xs font-medium text-ink transition-colors hover:bg-cream-dark"
            >
              <Replace className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={uploading}
              className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-rust/10 hover:text-rust"
              aria-label="Remove PDF"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-6 py-8 transition-colors ${
            dragOver
              ? "border-rust bg-rust/5"
              : "border-border hover:border-warm-gray hover:bg-cream-dark/50"
          }`}
        >
          <Upload className="h-5 w-5 text-warm-gray" />
          <p className="mt-2 font-body text-sm font-medium text-ink">
            Drag &amp; drop a PDF
          </p>
          <p className="mt-0.5 font-body text-xs text-warm-gray">
            or click to browse. Max {MAX_SIZE_MB} MB.
          </p>
        </div>
      )}

      {uploading && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full bg-forest transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="flex items-center gap-2 font-body text-xs text-warm-gray">
            <Loader2 className="h-3 w-3 animate-spin" />
            Uploading… {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
