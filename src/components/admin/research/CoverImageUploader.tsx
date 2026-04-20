"use client";

/* ------------------------------------------------------------------ */
/*  CoverImageUploader                                                 */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Image uploader for research entry cover images. Uploads to the  */
/*  `research-covers` folder in the shared `media` bucket (fallback   */
/*  for deployments without a dedicated bucket). Has a preview, can  */
/*  replace, and can clear.                                            */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useRef, useState } from "react";
import { Loader2, Replace, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface CoverImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function CoverImageUploader({
  value,
  onChange,
  bucket = "media",
  folder = "research-covers",
}: CoverImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Images only (JPG, PNG, WebP).");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error("File too large. Max 5 MB.");
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${folder}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);
        onChange(publicUrl);
        toast.success("Cover image uploaded");
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, onChange]
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Cover preview"
            className="aspect-[4/5] w-full rounded-sm border border-border object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-label="Replace image"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-cream/90 text-ink shadow-sm transition-colors hover:bg-cream"
            >
              <Replace className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Remove image"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-cream/90 text-rust shadow-sm transition-colors hover:bg-cream"
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
          className={`flex aspect-[4/5] cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed px-4 text-center transition-colors ${
            dragOver
              ? "border-rust bg-rust/5"
              : "border-border hover:border-warm-gray hover:bg-cream-dark/50"
          }`}
        >
          <Upload className="h-5 w-5 text-warm-gray" />
          <p className="mt-2 font-body text-xs font-medium text-ink">
            Cover image
          </p>
          <p className="mt-0.5 font-body text-[11px] text-warm-gray">
            Optional. Skipped entries render a typographic cover.
          </p>
        </div>
      )}

      {uploading && (
        <p className="mt-2 flex items-center gap-2 font-body text-xs text-warm-gray">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading…
        </p>
      )}
    </div>
  );
}
