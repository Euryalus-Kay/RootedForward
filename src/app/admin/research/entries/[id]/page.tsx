"use client";

/* ------------------------------------------------------------------ */
/*  /admin/research/entries/[id]                                       */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Edit an existing research entry. Fetches the row, then hands it */
/*  to the shared EntryEditor component.                              */
/*                                                                     */
/*  Client component because the form is client-side (needs to call   */
/*  createClient() for Supabase updates).                              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import EntryEditor from "@/components/admin/research/EntryEditor";
import { normalizeCitations } from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";

export default function EditResearchEntryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<ResearchEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!params?.id) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("research_entries")
          .select("*")
          .eq("id", params.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          setNotFound(true);
          return;
        }
        setEntry({
          ...data,
          citations: normalizeCitations(data.citations),
        } as ResearchEntry);
      } catch {
        toast.error("Failed to load entry");
        router.push("/admin/research/entries");
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-forest" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/research/entries"
          className="inline-flex items-center gap-1.5 font-body text-sm text-warm-gray transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          All entries
        </Link>
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <h1 className="font-display text-xl text-forest">
            Entry not found
          </h1>
          <p className="mt-2 font-body text-sm text-warm-gray">
            This research entry does not exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  if (!entry) return null;

  return <EntryEditor initial={entry} />;
}
