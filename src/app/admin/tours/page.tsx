"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify, formatDate } from "@/lib/utils";
import type { TourStop } from "@/lib/types/database";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const CITIES = ["Chicago", "New York", "Dallas", "San Francisco"];

interface StopFormData {
  id?: string;
  city: string;
  title: string;
  slug: string;
  lat: number;
  lng: number;
  video_url: string;
  description: string;
  sources: string;
  published: boolean;
}

const emptyForm: StopFormData = {
  city: CITIES[0],
  title: "",
  slug: "",
  lat: 0,
  lng: 0,
  video_url: "",
  description: "",
  sources: "",
  published: false,
};

export default function ToursManager() {
  const [stops, setStops] = useState<TourStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<StopFormData>(emptyForm);
  const [collapsedCities, setCollapsedCities] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tour_stops")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStops(data ?? []);
    } catch {
      toast.error("Failed to load tour stops");
    } finally {
      setLoading(false);
    }
  };

  const groupedStops = useMemo(() => {
    const groups: Record<string, TourStop[]> = {};
    for (const stop of stops) {
      const city = stop.city || "Unknown";
      if (!groups[city]) groups[city] = [];
      groups[city].push(stop);
    }
    return groups;
  }, [stops]);

  const toggleCity = (city: string) => {
    setCollapsedCities((prev) => {
      const next = new Set(prev);
      if (next.has(city)) next.delete(city);
      else next.add(city);
      return next;
    });
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (stop: TourStop) => {
    setForm({
      id: stop.id,
      city: stop.city,
      title: stop.title,
      slug: stop.slug,
      lat: stop.lat,
      lng: stop.lng,
      video_url: stop.video_url ?? "",
      description: stop.description,
      sources: stop.sources.join("\n"),
      published: stop.published,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.id ? prev.slug : slugify(title),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.description.trim()) {
      toast.error("Title, slug, and description are required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        city: form.city,
        title: form.title.trim(),
        slug: form.slug.trim(),
        lat: form.lat,
        lng: form.lng,
        video_url: form.video_url.trim() || null,
        description: form.description.trim(),
        sources: form.sources
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        published: form.published,
      };

      if (form.id) {
        const { error } = await supabase
          .from("tour_stops")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
        toast.success("Tour stop updated");
      } else {
        const { error } = await supabase.from("tour_stops").insert(payload);
        if (error) throw error;
        toast.success("Tour stop created");
      }

      setModalOpen(false);
      fetchStops();
    } catch {
      toast.error("Failed to save tour stop");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tour_stops")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Tour stop deleted");
      setDeleteConfirm(null);
      fetchStops();
    } catch {
      toast.error("Failed to delete tour stop");
    }
  };

  const togglePublished = async (stop: TourStop) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tour_stops")
        .update({ published: !stop.published })
        .eq("id", stop.id);
      if (error) throw error;
      toast.success(
        stop.published ? "Stop unpublished" : "Stop published"
      );
      fetchStops();
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
            Tour Stops
          </h1>
          <p className="text-sm text-warm-gray">
            Manage walking tour stops across all cities
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-forest-light"
        >
          <Plus className="h-4 w-4" />
          Add New Stop
        </button>
      </div>

      {/* Grouped Stops */}
      {Object.keys(groupedStops).length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <p className="text-warm-gray">
            No tour stops yet. Add your first stop to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedStops).map(([city, cityStops]) => {
            const isCollapsed = collapsedCities.has(city);
            return (
              <div
                key={city}
                className="rounded-xl border border-border bg-white/60 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleCity(city)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-cream-dark"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="h-5 w-5 text-warm-gray" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-warm-gray" />
                    )}
                    <h3 className="font-display text-lg font-semibold text-forest">
                      {city}
                    </h3>
                    <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                      {cityStops.length} stop{cityStops.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-border/60">
                    {cityStops.map((stop) => (
                      <div
                        key={stop.id}
                        className="flex items-center justify-between border-b border-border/40 px-6 py-3 last:border-b-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              stop.published
                                ? "bg-green-500"
                                : "bg-warm-gray-light"
                            )}
                            title={
                              stop.published ? "Published" : "Unpublished"
                            }
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {stop.title}
                            </p>
                            <p className="text-xs text-warm-gray">
                              {formatDate(stop.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => togglePublished(stop)}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                              stop.published
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {stop.published ? "Published" : "Draft"}
                          </button>
                          <button
                            onClick={() => openEditModal(stop)}
                            className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <a
                            href={`/tours/${stop.city.toLowerCase().replace(/\s+/g, "-")}/${stop.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
                            title="Preview"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => setDeleteConfirm(stop.id)}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-cream p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-forest">
                {form.id ? "Edit Tour Stop" : "Add New Tour Stop"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-warm-gray hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* City */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  City
                </label>
                <select
                  value={form.city}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="e.g., Bronzeville Heritage Walk"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="bronzeville-heritage-walk"
                />
              </div>

              {/* Lat/Lng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lat: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        lng: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  />
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Video URL{" "}
                  <span className="text-warm-gray">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      video_url: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="https://youtube.com/..."
                />
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
                  rows={6}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="Describe this tour stop..."
                />
              </div>

              {/* Sources */}
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Sources{" "}
                  <span className="text-warm-gray">(one per line)</span>
                </label>
                <textarea
                  value={form.sources}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sources: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                  placeholder="https://example.com/source1&#10;https://example.com/source2"
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
                {form.id ? "Save Changes" : "Create Stop"}
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
              Delete Tour Stop
            </h3>
            <p className="mt-2 text-sm text-ink-light">
              Are you sure you want to delete this tour stop? This action cannot
              be undone.
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
