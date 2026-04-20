"use client";

/* ------------------------------------------------------------------ */
/*  DirectorPhotoUploader                                              */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Uploads a director headshot to the `director-photos` bucket.     */
/*                                                                     */
/*  Client-side resizes the image to 800x800 (cover) before upload.  */
/*  Saves bandwidth and enforces a consistent dimension for the card */
/*  on /research.                                                      */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface DirectorPhotoUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  directorId?: string;
  slugHint?: string;
}

const TARGET_SIZE = 800;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Draws a centered, cropped, 800x800 thumbnail of `file` and returns
 * it as a JPEG blob. Falls back to the original file if canvas /
 * image loading isn't available.
 */
async function resizeImage(file: File): Promise<Blob> {
  if (typeof window === "undefined") return file;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_SIZE;
      canvas.height = TARGET_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // Center-crop then scale.
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.fillStyle = "#EDE6D8";
      ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
      ctx.drawImage(img, sx, sy, size, size, 0, 0, TARGET_SIZE, TARGET_SIZE);

      canvas.toBlob(
        (blob) => resolve(blob ?? file),
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export default function DirectorPhotoUploader({
  value,
  onChange,
  directorId,
  slugHint,
}: DirectorPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Only JPG, PNG, or WebP images.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error("Max file size is 5 MB.");
        return;
      }

      setUploading(true);
      try {
        const resized = await resizeImage(file);
        const supabase = createClient();
        const identifier = directorId ?? slugHint ?? `new-${Date.now()}`;
        const path = `${identifier}.jpg`;
        const { error } = await supabase.storage
          .from("director-photos")
          .upload(path, resized, {
            cacheControl: "3600",
            upsert: true,
            contentType: "image/jpeg",
          });
        if (error) throw error;
        const {
          data: { publicUrl },
        } = supabase.storage.from("director-photos").getPublicUrl(path);
        // cache-bust so the admin preview reflects the new image
        onChange(`${publicUrl}?v=${Date.now()}`);
        toast.success("Photo uploaded");
      } catch {
        toast.error("Upload failed. Check that director-photos bucket exists.");
      } finally {
        setUploading(false);
      }
    },
    [directorId, onChange, slugHint]
  );

  return (
    <div className="space-y-2">
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
        <div className="relative w-fit">
          <img
            src={value}
            alt="Director photo"
            className="h-28 w-28 rounded-sm border border-border object-cover"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center rounded-sm bg-ink/0 font-body text-xs font-medium text-cream opacity-0 transition hover:bg-ink/50 hover:opacity-100"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-cream text-rust shadow-sm transition-colors hover:bg-rust/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
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
          className={`flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed text-center transition-colors ${
            dragOver
              ? "border-rust bg-rust/5"
              : "border-border hover:border-warm-gray hover:bg-cream-dark/50"
          }`}
        >
          <Upload className="h-4 w-4 text-warm-gray" />
          <p className="mt-1 font-body text-[11px] font-medium text-ink">
            Photo
          </p>
        </div>
      )}

      {uploading && (
        <p className="flex items-center gap-2 font-body text-xs text-warm-gray">
          <Loader2 className="h-3 w-3 animate-spin" />
          Resizing &amp; uploading…
        </p>
      )}
    </div>
  );
}
