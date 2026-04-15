"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type { Submission } from "@/lib/types/database";
import {
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Inbox,
  Trash2,
  Archive,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type TabFilter = "all" | "volunteer" | "contact";

export default function SubmissionsViewer() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSubmissions(data ?? []);
    } catch {
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions =
    activeTab === "all"
      ? submissions
      : submissions.filter((s) => s.type === activeTab);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredSubmissions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredSubmissions.map((s) => s.id)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} submission(s)? This cannot be undone.`)) return;

    try {
      const supabase = createClient();
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("submissions")
        .delete()
        .in("id", ids);
      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => !selected.has(s.id)));
      setSelected(new Set());
      toast.success(`Deleted ${ids.length} submission(s)`);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const deleteSingle = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("submissions").delete().eq("id", id);
      if (error) throw error;
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const clearAll = async () => {
    const target = activeTab === "all" ? "all" : activeTab;
    if (!confirm(`Delete ALL ${target} submissions? This cannot be undone.`)) return;

    try {
      const supabase = createClient();
      let query = supabase.from("submissions").delete();
      if (activeTab !== "all") {
        query = query.eq("type", activeTab);
      } else {
        query = query.gte("created_at", "2000-01-01");
      }
      const { error } = await query;
      if (error) throw error;
      if (activeTab === "all") {
        setSubmissions([]);
      } else {
        setSubmissions((prev) => prev.filter((s) => s.type !== activeTab));
      }
      setSelected(new Set());
      toast.success(`Cleared ${target} submissions`);
    } catch {
      toast.error("Failed to clear");
    }
  };

  const exportCSV = () => {
    if (filteredSubmissions.length === 0) {
      toast.error("No submissions to export");
      return;
    }

    const headers = ["Type", "Name", "Email", "Phone", "Chapter", "Message", "Date"];
    const escapeCSV = (value: string | null | undefined): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredSubmissions.map((sub) =>
      [
        escapeCSV(sub.type),
        escapeCSV(sub.name),
        escapeCSV(sub.email),
        escapeCSV(sub.phone),
        escapeCSV(sub.chapter),
        escapeCSV(sub.message),
        escapeCSV(sub.created_at),
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `submissions-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: submissions.length },
    { key: "volunteer", label: "Volunteer", count: submissions.filter((s) => s.type === "volunteer").length },
    { key: "contact", label: "Contact", count: submissions.filter((s) => s.type === "contact").length },
  ];

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
          <h1 className="font-display text-2xl font-bold text-forest">Submissions</h1>
          <p className="text-sm text-warm-gray">View volunteer sign-ups and contact messages</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 rounded-lg bg-rust/10 px-4 py-2.5 text-sm font-medium text-rust transition-colors hover:bg-rust/20"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-cream-dark p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelected(new Set()); }}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-white text-ink shadow-sm"
                : "text-warm-gray hover:text-ink"
            )}
          >
            {tab.label}
            <span className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              activeTab === tab.key ? "bg-forest/10 text-forest" : "bg-warm-gray-light/30 text-warm-gray"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-forest/5 px-4 py-3">
          <span className="font-body text-sm font-medium text-forest">
            {selected.size} selected
          </span>
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1 rounded bg-rust/10 px-3 py-1.5 font-body text-xs font-medium text-rust transition-colors hover:bg-rust/20"
          >
            <Trash2 className="h-3 w-3" />
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="font-body text-xs text-warm-gray hover:text-ink"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-warm-gray-light" />
          <p className="mt-3 text-warm-gray">
            No {activeTab === "all" ? "" : activeTab + " "}submissions found.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white/60 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[40px_90px_1fr_1fr_100px_120px_80px] gap-4 border-b border-border bg-cream-dark/50 px-4 py-3">
            <span>
              <input
                type="checkbox"
                checked={selected.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                onChange={selectAll}
                className="h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
              />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">Type</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">Name</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">Email</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">Chapter</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">Date</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">Actions</span>
          </div>

          {filteredSubmissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            return (
              <div key={sub.id} className="border-b border-border/40 last:border-b-0">
                <div className="flex w-full flex-col md:grid md:grid-cols-[40px_90px_1fr_1fr_100px_120px_80px] gap-2 md:gap-4 items-start md:items-center px-4 py-4">
                  {/* Checkbox */}
                  <span className="hidden md:block">
                    <input
                      type="checkbox"
                      checked={selected.has(sub.id)}
                      onChange={() => toggleSelect(sub.id)}
                      className="h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
                    />
                  </span>

                  {/* Type Badge */}
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    sub.type === "volunteer" ? "bg-forest/10 text-forest" : "bg-rust/10 text-rust"
                  )}>
                    {sub.type}
                  </span>

                  {/* Name */}
                  <button onClick={() => toggleExpand(sub.id)} className="text-sm font-medium text-ink truncate w-full text-left hover:text-forest">
                    {sub.name}
                  </button>

                  {/* Email */}
                  <span className="text-sm text-ink-light truncate w-full">{sub.email}</span>

                  {/* Chapter */}
                  <span className="text-sm text-warm-gray truncate">{sub.chapter || "-"}</span>

                  {/* Date */}
                  <span className="text-xs text-warm-gray">{formatDate(sub.created_at)}</span>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleExpand(sub.id)}
                      className="rounded p-1 text-warm-gray hover:bg-cream-dark hover:text-ink"
                      title="Expand"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteSingle(sub.id)}
                      className="rounded p-1 text-warm-gray hover:bg-rust/10 hover:text-rust"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Message */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-cream-dark/20 px-6 py-4">
                    <div className="space-y-2">
                      {sub.phone && (
                        <p className="text-sm text-ink-light">
                          <span className="font-medium text-ink">Phone:</span> {sub.phone}
                        </p>
                      )}
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-warm-gray">Message</p>
                        <p className="whitespace-pre-wrap text-sm text-ink-light leading-relaxed">
                          {sub.message || "No message provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
