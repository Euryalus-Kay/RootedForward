"use client";

/* ------------------------------------------------------------------ */
/*  DatasetDownloadButton                                              */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Client component used on /research/data. Three render states:     */
/*    - loading:  while we resolve the Supabase session                */
/*    - signed-out:  shows "Sign in to download" linking to /auth/login*/
/*    - signed-in:   primary "Download archive" button that calls     */
/*      /api/research/data/download?slug=... and triggers a save dialog*/
/*                                                                     */
/*  The download API verifies the session server-side and writes an   */
/*  audit row before streaming the ZIP. This component does not       */
/*  trust its own state — the server is the source of truth.           */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Download, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  slug: string;
  paperTitle: string;
}

export default function DatasetDownloadButton({ slug, paperTitle }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/research/data/download?slug=${encodeURIComponent(slug)}`,
        { method: "GET", credentials: "include" }
      );
      if (!res.ok) {
        const text = await res.text();
        toast.error(`Download failed: ${text || res.status}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rooted-forward-${slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${paperTitle} archive downloaded`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Download failed unexpectedly"
      );
    } finally {
      setDownloading(false);
    }
  }

  if (authLoading) {
    return (
      <span className="inline-flex items-center gap-2 rounded-sm bg-cream-dark/40 px-4 py-2 font-body text-sm font-medium text-warm-gray">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking session
      </span>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`/research/data#${slug}`);
    return (
      <a
        href={`/auth/login?next=${next}`}
        className="inline-flex items-center gap-2 rounded-sm border border-rust bg-rust/5 px-4 py-2 font-body text-sm font-semibold text-rust transition-colors hover:bg-rust hover:text-cream"
      >
        <Lock className="h-4 w-4" /> Sign in to download
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-sm bg-forest px-4 py-2 font-body text-sm font-semibold text-cream transition-colors hover:bg-forest-dark disabled:cursor-wait disabled:opacity-70"
    >
      {downloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Preparing archive
        </>
      ) : (
        <>
          <Download className="h-4 w-4" /> Download archive
        </>
      )}
    </button>
  );
}
