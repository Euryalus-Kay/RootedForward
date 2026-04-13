"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SiteContent } from "@/lib/types/database";
import { Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

function formatKeyLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ContentField {
  key: string;
  value: string;
  original: string;
  saving: boolean;
}

export default function SiteContentManager() {
  const [fields, setFields] = useState<ContentField[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("key", { ascending: true });
      if (error) throw error;
      setFields(
        (data ?? []).map((item: SiteContent) => ({
          key: item.key,
          value: item.value,
          original: item.value,
          saving: false,
        }))
      );
    } catch {
      toast.error("Failed to load site content");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value } : f))
    );
  };

  const handleSaveField = async (key: string) => {
    const field = fields.find((f) => f.key === key);
    if (!field || field.value === field.original) return;

    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, saving: true } : f))
    );

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("site_content")
        .update({ value: field.value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;

      setFields((prev) =>
        prev.map((f) =>
          f.key === key ? { ...f, original: f.value, saving: false } : f
        )
      );
      toast.success(`"${formatKeyLabel(key)}" saved`);
    } catch {
      setFields((prev) =>
        prev.map((f) => (f.key === key ? { ...f, saving: false } : f))
      );
      toast.error(`Failed to save "${formatKeyLabel(key)}"`);
    }
  };

  const handleSaveAll = async () => {
    const changed = fields.filter((f) => f.value !== f.original);
    if (changed.length === 0) {
      toast("No changes to save");
      return;
    }

    setSavingAll(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const promises = changed.map((field) =>
        supabase
          .from("site_content")
          .update({ value: field.value, updated_at: now })
          .eq("key", field.key)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        toast.error(`Failed to save ${errors.length} field(s)`);
      } else {
        setFields((prev) =>
          prev.map((f) => ({ ...f, original: f.value }))
        );
        toast.success(`Saved ${changed.length} field(s)`);
      }
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSavingAll(false);
    }
  };

  const hasAnyChanges = fields.some((f) => f.value !== f.original);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            Site Content
          </h1>
          <p className="text-sm text-warm-gray">
            Edit site-wide text content and headlines
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={savingAll || !hasAnyChanges}
          className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
        >
          {savingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save All
        </button>
      </div>

      {/* Content Fields */}
      {fields.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <p className="text-warm-gray">
            No site content entries found in the database.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field) => {
            const changed = field.value !== field.original;
            return (
              <div
                key={field.key}
                className="rounded-xl border border-border bg-white/60 p-6 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-ink">
                      {formatKeyLabel(field.key)}
                    </label>
                    <p className="text-xs text-warm-gray-light font-mono">
                      {field.key}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSaveField(field.key)}
                    disabled={field.saving || !changed}
                    className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-1.5 text-xs font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-40"
                  >
                    {field.saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </button>
                </div>
                <textarea
                  value={field.value}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  rows={field.value.length > 200 ? 6 : 3}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                />
                {changed && (
                  <p className="mt-1 text-xs text-rust">Unsaved changes</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
