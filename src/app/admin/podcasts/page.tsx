"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type { Podcast } from "@/lib/types/database";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface PodcastFormData {
  id?: string;
  title: string;
  description: string;
  embed_url: string;
  episode_number: number;
  publish_date: string;
  guests: string;
  published: boolean;
}

const emptyForm: PodcastFormData = {
  title: "",
  description: "",
  embed_url: "",
  episode_number: 1,
  publish_date: new Date().toISOString().split("T")[0],
  guests: "",
  published: false,
};

export default function PodcastsManager() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<PodcastFormData>(emptyForm);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("episode_number", { ascending: false });
      if (error) throw error;
      setPodcasts(data ?? []);
    } catch {
      toast.error("Failed to load podcasts");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    const nextEpisode =
      podcasts.length > 0
        ? Math.max(...podcasts.map((p) => p.episode_number)) + 1
        : 1;
    setForm({ ...emptyForm, episode_number: nextEpisode });
    setModalOpen(true);
  };

  const openEditModal = (podcast: Podcast) => {
    setForm({
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      embed_url: podcast.embed_url ?? "",
      episode_number: podcast.episode_number,
      publish_date: podcast.publish_date,
      guests: podcast.guests.join(", "),
      published: podcast.published,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        embed_url: form.embed_url.trim() || null,
        episode_number: form.episode_number,
        publish_date: form.publish_date,
        guests: form.guests
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        published: form.published,
      };

      if (form.id) {
        const { error } = await supabase
          .from("podcasts")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
        toast.success("Podcast updated");
      } else {
        const { error } = await supabase.from("podcasts").insert(payload);
        if (error) throw error;
        toast.success("Podcast created");
      }

      setModalOpen(false);
      fetchPodcasts();
    } catch {
      toast.error("Failed to save podcast");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Podcast deleted");
      setDeleteConfirm(null);
      fetchPodcasts();
    } catch {
      toast.error("Failed to delete podcast");
    }
  };

  const togglePublished = async (podcast: Podcast) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("podcasts")
        .update({ published: !podcast.published })
        .eq("id", podcast.id);
      if (error) throw error;
      toast.success(
        podcast.published ? "Podcast unpublished" : "Podcast published"
      );
      fetchPodcasts();
    } catch {
      toast.error("Failed to update published status");
    }
  };

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
            Podcasts
          </h1>
          <p className="text-sm text-warm-gray">
            Manage podcast episodes
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
        >
          <Plus className="h-4 w-4" />
          Add Episode
        </button>
      </div>

      {/* Podcast List */}
      {podcasts.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <p className="text-warm-gray">
            No podcasts yet. Add your first episode to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white/60 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-[80px_1fr_140px_100px_120px] gap-4 border-b border-border bg-cream-dark/50 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Ep #
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Title
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Publish Date
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Status
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray text-right">
              Actions
            </span>
          </div>

          {podcasts.map((podcast) => (
            <div
              key={podcast.id}
              className="flex flex-col sm:grid sm:grid-cols-[80px_1fr_140px_100px_120px] gap-2 sm:gap-4 items-start sm:items-center border-b border-border/40 px-6 py-4 last:border-b-0"
            >
              {/* Episode Number */}
              <div className="flex items-center gap-2 sm:gap-0">
                <span className="text-sm font-bold font-display text-forest">
                  #{podcast.episode_number}
                </span>
                <span className="text-sm font-medium text-ink sm:hidden">
                  {podcast.title}
                </span>
              </div>

              {/* Title */}
              <div className="hidden sm:block min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {podcast.title}
                </p>
                {podcast.guests.length > 0 && (
                  <p className="truncate text-xs text-warm-gray">
                    with {podcast.guests.join(", ")}
                  </p>
                )}
              </div>

              {/* Publish Date */}
              <span className="text-xs text-warm-gray sm:text-sm">
                {formatDate(podcast.publish_date)}
              </span>

              {/* Status */}
              <button
                onClick={() => togglePublished(podcast)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  podcast.published
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {podcast.published ? "Published" : "Draft"}
              </button>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 sm:justify-end">
                <button
                  onClick={() => openEditModal(podcast)}
                  className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(podcast.id)}
                  className="rounded-md p-2 text-warm-gray transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-cream p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-forest">
                {form.id ? "Edit Podcast" : "Add New Episode"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-warm-gray hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="Episode title"
                />
              </div>

              {/* Episode Number & Publish Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Episode Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.episode_number}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        episode_number: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={form.publish_date}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        publish_date: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="Describe this episode..."
                />
              </div>

              {/* Embed URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Embed URL{" "}
                  <span className="text-warm-gray">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.embed_url}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      embed_url: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="https://open.spotify.com/embed/..."
                />
              </div>

              {/* Guests */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Guests{" "}
                  <span className="text-warm-gray">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={form.guests}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, guests: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="Jane Doe, John Smith"
                />
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      published: !prev.published,
                    }))
                  }
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    form.published ? "bg-forest" : "bg-warm-gray-light"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      form.published && "translate-x-5"
                    )}
                  />
                </button>
                <span className="text-sm font-medium text-ink">
                  {form.published ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.id ? "Save Changes" : "Create Episode"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-cream p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-forest">
              Delete Podcast
            </h3>
            <p className="mt-2 text-sm text-ink-light">
              Are you sure you want to delete this podcast episode? This action
              cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
