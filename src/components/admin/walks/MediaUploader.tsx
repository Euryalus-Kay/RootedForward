"use client";

/* ------------------------------------------------------------------ */
/*  Upload a photograph or an audio file and get back the path to      */
/*  paste into a stop.                                                 */
/*                                                                     */
/*  Files land in the walk-media bucket and come back as a path under  */
/*  the site's own origin, which is the whole point. The phone joins   */
/*  every media path onto mediaBase and caches what it downloads, so a */
/*  site-relative path is the only kind it can hold offline. Files     */
/*  already committed under public/media keep working untouched.       */
/* ------------------------------------------------------------------ */

import { useRef, useState } from "react";
import { Check, Copy, Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { uploadWalkMedia } from "./api";
import { btnGhost, eyebrowCls } from "./ui";

interface Uploaded {
  name: string;
  path: string;
  kind: "image" | "audio" | "file";
}

function kindOf(file: File): Uploaded["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

export default function MediaUploader({ disabled }: { disabled?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<Uploaded[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = await uploadWalkMedia(file);
        setUploads((prev) => [{ name: file.name, path, kind: kindOf(file) }, ...prev]);
      }
      toast.success(files.length === 1 ? "File uploaded" : `${files.length} files uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The upload failed");
    } finally {
      setUploading(false);
    }
  };

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Could not reach the clipboard, so select the path and copy it by hand");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          className={btnGhost}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload a file
        </button>
        <p className="font-body text-xs text-warm-gray">
          Photographs and mp3 narration. Upload here, then paste the path into an image
          source or an audio source below.
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <div className="mt-4">
          <p className={eyebrowCls}>Uploaded this session</p>
          <ul className="mt-2 space-y-1.5">
            {uploads.map((u) => (
              <li
                key={u.path}
                className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-cream px-3 py-2"
              >
                <span className="rounded-sm bg-forest/10 px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-widest text-forest">
                  {u.kind}
                </span>
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                  {u.path}
                </code>
                <button
                  type="button"
                  onClick={() => copy(u.path)}
                  className="flex items-center gap-1.5 font-body text-xs font-semibold uppercase tracking-widest text-forest transition-colors hover:text-rust"
                >
                  {copied === u.path ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied === u.path ? "Copied" : "Copy path"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
