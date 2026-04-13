"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Upload, X, Image as ImageIcon, Replace, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  bucket?: string;
  folder?: string;
  existingUrl?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ImageUploader({
  onUpload,
  bucket = "media",
  folder = "uploads",
  existingUrl,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Invalid file type. Please upload a JPG, PNG, or WebP image.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (f: File) => {
      setError(null);
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(f);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        handleFileSelect(selected);
      }
    },
    [handleFileSelect]
  );

  const simulateProgress = useCallback(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 90) {
        clearInterval(interval);
        setProgress(90);
      } else {
        setProgress(Math.round(current));
      }
    }, 150);
    return interval;
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const progressInterval = simulateProgress();

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${folder}/${timestamp}_${safeName}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setProgress(100);

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      onUpload(publicUrl);
      toast.success("Image uploaded successfully");
      setFile(null);
    } catch (err) {
      clearInterval(progressInterval);
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(message);
      toast.error("Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(existingUrl ?? null);
    setError(null);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleReplace = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const showExisting = preview && !file;
  const showPreview = preview && file;

  return (
    <div className="w-full space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {showExisting ? (
          <motion.div
            key="existing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-lg border border-border"
          >
            <img
              src={preview}
              alt="Current image"
              className="h-48 w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all hover:bg-ink/40 hover:opacity-100">
              <button
                onClick={handleReplace}
                className="flex items-center gap-2 rounded-lg bg-cream px-4 py-2 text-sm font-medium text-ink shadow-md transition-colors hover:bg-cream-dark"
              >
                <Replace className="h-4 w-4" />
                Replace
              </button>
            </div>
          </motion.div>
        ) : showPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-lg border border-border"
          >
            <img
              src={preview}
              alt="Preview"
              className="h-48 w-full object-cover"
            />
            <button
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-ink/60 p-1.5 text-cream transition-colors hover:bg-ink/80"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="border-t border-border bg-cream-dark/80 px-4 py-2">
              <p className="truncate text-xs text-ink-light">{file?.name}</p>
              <p className="text-xs text-warm-gray">
                {((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
              dragOver
                ? "border-rust bg-rust/5"
                : "border-border hover:border-rust hover:bg-cream-dark/50"
            )}
          >
            <div className="rounded-full bg-cream-dark p-3">
              {dragOver ? (
                <Upload className="h-6 w-6 text-rust" />
              ) : (
                <ImageIcon className="h-6 w-6 text-warm-gray" />
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-ink">
              {dragOver ? "Drop image here" : "Drag & drop an image"}
            </p>
            <p className="mt-1 text-xs text-warm-gray">
              or click to browse files
            </p>
            <p className="mt-2 text-xs text-warm-gray-light">
              JPG, PNG, WebP up to {MAX_SIZE_MB}MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-cream-dark">
            <motion.div
              className="h-full rounded-full bg-forest"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-warm-gray">{progress}% uploaded</p>
        </div>
      )}

      {/* Upload button */}
      {file && !uploading && (
        <motion.button
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUpload}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
        >
          <Upload className="h-4 w-4" />
          Upload Image
        </motion.button>
      )}

      {uploading && (
        <button
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest/50 px-4 py-2.5 text-sm font-medium text-cream"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading...
        </button>
      )}
    </div>
  );
}
