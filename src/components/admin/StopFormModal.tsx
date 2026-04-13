"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, slugify } from "@/lib/utils";
import type { TourStop } from "@/lib/types/database";
import ImageUploader from "@/components/admin/ImageUploader";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import {
  X,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  FileText,
  Image as ImageIcon,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Props & Types                                                      */
/* ------------------------------------------------------------------ */
interface StopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop?: TourStop | null;
  onSave: () => void;
}

type TabKey = "details" | "media" | "sources";

const CITIES = ["Chicago", "New York", "Dallas", "San Francisco"];

interface FormState {
  city: string;
  title: string;
  slug: string;
  lat: string;
  lng: string;
  description: string;
  published: boolean;
  video_url: string;
  images: string[];
  sources: string[];
}

const emptyForm: FormState = {
  city: CITIES[0],
  title: "",
  slug: "",
  lat: "",
  lng: "",
  description: "",
  published: false,
  video_url: "",
  images: [],
  sources: [""],
};

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */
interface ValidationErrors {
  title?: string;
  city?: string;
  lat?: string;
  lng?: string;
}

function validate(form: FormState): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.city) errors.city = "City is required";
  if (form.lat && isNaN(parseFloat(form.lat))) errors.lat = "Must be a number";
  if (form.lng && isNaN(parseFloat(form.lng))) errors.lng = "Must be a number";
  return errors;
}

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */
const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "sources", label: "Sources", icon: BookOpen },
];

/* ------------------------------------------------------------------ */
/*  Modal overlay animation                                            */
/* ------------------------------------------------------------------ */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, duration: 0.4, bounce: 0.15 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function StopFormModal({
  isOpen,
  onClose,
  stop,
  onSave,
}: StopFormModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);

  /* ---- Populate form when editing ---- */
  useEffect(() => {
    if (stop) {
      setForm({
        city: stop.city,
        title: stop.title,
        slug: stop.slug,
        lat: String(stop.lat),
        lng: String(stop.lng),
        description: stop.description,
        published: stop.published,
        video_url: stop.video_url ?? "",
        images: stop.images ?? [],
        sources: stop.sources.length > 0 ? stop.sources : [""],
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
    setActiveTab("details");
  }, [stop, isOpen]);

  /* ---- Helpers ---- */
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      setForm((prev) => ({
        ...prev,
        title,
        slug: stop ? prev.slug : slugify(title),
      }));
      setErrors((prev) => ({ ...prev, title: undefined }));
    },
    [stop]
  );

  /* ---- Source list management ---- */
  const addSource = () => {
    setForm((prev) => ({ ...prev, sources: [...prev.sources, ""] }));
  };

  const removeSource = (index: number) => {
    setForm((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index),
    }));
  };

  const updateSource = (index: number, value: string) => {
    setForm((prev) => {
      const sources = [...prev.sources];
      sources[index] = value;
      return { ...prev, sources };
    });
  };

  /* ---- Image management ---- */
  const handleImageUpload = (url: string) => {
    setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const moveImage = (from: number, direction: "up" | "down") => {
    setForm((prev) => {
      const images = [...prev.images];
      const to = direction === "up" ? from - 1 : from + 1;
      if (to < 0 || to >= images.length) return prev;
      [images[from], images[to]] = [images[to], images[from]];
      return { ...prev, images };
    });
  };

  /* ---- Save ---- */
  const handleSave = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setActiveTab("details");
      toast.error("Please fix the form errors");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        city: form.city,
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        lat: parseFloat(form.lat) || 0,
        lng: parseFloat(form.lng) || 0,
        description: form.description.trim(),
        published: form.published,
        video_url: form.video_url.trim() || null,
        images: form.images,
        sources: form.sources.map((s) => s.trim()).filter(Boolean),
      };

      if (stop) {
        const { error } = await supabase
          .from("tour_stops")
          .update(payload)
          .eq("id", stop.id);
        if (error) throw error;
        toast.success("Tour stop updated");
      } else {
        const { error } = await supabase.from("tour_stops").insert(payload);
        if (error) throw error;
        toast.success("Tour stop created");
      }

      onSave();
      onClose();
    } catch {
      toast.error("Failed to save tour stop");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Input class helper ---- */
  const inputClass = (hasError?: string) =>
    cn(
      "w-full rounded-md border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust transition-colors",
      hasError ? "border-red-400" : "border-border"
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-ink/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-cream shadow-xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-xl font-bold text-forest">
                {stop ? "Edit Tour Stop" : "Add New Tour Stop"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "border-forest text-forest"
                        : "border-transparent text-warm-gray hover:text-ink"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* ===== DETAILS TAB ===== */}
              {activeTab === "details" && (
                <div className="space-y-4">
                  {/* City */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      City <span className="text-rust">*</span>
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className={inputClass(errors.city)}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Title <span className="text-rust">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className={inputClass(errors.title)}
                      placeholder="e.g., Bronzeville Heritage Walk"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => updateField("slug", e.target.value)}
                      className={inputClass()}
                      placeholder="auto-generated-from-title"
                    />
                    <p className="mt-1 text-xs text-warm-gray">
                      Auto-generated from title. Edit if needed.
                    </p>
                  </div>

                  {/* Lat / Lng */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Latitude
                      </label>
                      <input
                        type="text"
                        value={form.lat}
                        onChange={(e) => updateField("lat", e.target.value)}
                        className={inputClass(errors.lat)}
                        placeholder="41.8781"
                      />
                      {errors.lat && (
                        <p className="mt-1 text-xs text-red-500">{errors.lat}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-ink">
                        Longitude
                      </label>
                      <input
                        type="text"
                        value={form.lng}
                        onChange={(e) => updateField("lng", e.target.value)}
                        className={inputClass(errors.lng)}
                        placeholder="-87.6298"
                      />
                      {errors.lng && (
                        <p className="mt-1 text-xs text-red-500">{errors.lng}</p>
                      )}
                    </div>
                  </div>

                  {/* Description (Markdown) */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Description
                    </label>
                    <MarkdownEditor
                      value={form.description}
                      onChange={(val) => updateField("description", val)}
                      placeholder="Describe this tour stop using markdown..."
                    />
                  </div>

                  {/* Published toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => updateField("published", !form.published)}
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
              )}

              {/* ===== MEDIA TAB ===== */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  {/* Video URL */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Video URL{" "}
                      <span className="text-warm-gray">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.video_url}
                      onChange={(e) => updateField("video_url", e.target.value)}
                      className={inputClass()}
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                    <p className="mt-1 text-xs text-warm-gray">
                      Paste any YouTube or Vimeo URL — it will be converted to an embed automatically.
                      Supports: youtube.com/watch?v=..., youtu.be/..., vimeo.com/...
                    </p>
                  </div>

                  {/* Image uploader */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink">
                      Images
                    </label>
                    <ImageUploader
                      onUpload={handleImageUpload}
                      bucket="media"
                      folder="stops"
                    />
                  </div>

                  {/* Image gallery preview */}
                  {form.images.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-ink">
                        Uploaded Images ({form.images.length})
                      </p>
                      <div className="space-y-2">
                        {form.images.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="flex items-center gap-3 rounded-lg border border-border bg-white p-2"
                          >
                            <GripVertical className="h-4 w-4 shrink-0 text-warm-gray-light" />
                            <img
                              src={url}
                              alt={`Image ${i + 1}`}
                              className="h-14 w-20 shrink-0 rounded object-cover"
                            />
                            <p className="min-w-0 flex-1 truncate text-xs text-warm-gray">
                              {url}
                            </p>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() => moveImage(i, "up")}
                                disabled={i === 0}
                                className="rounded p-1 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-30"
                                title="Move up"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => moveImage(i, "down")}
                                disabled={i === form.images.length - 1}
                                className="rounded p-1 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink disabled:opacity-30"
                                title="Move down"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeImage(i)}
                                className="rounded p-1 text-warm-gray transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Remove"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== SOURCES TAB ===== */}
              {activeTab === "sources" && (
                <div className="space-y-4">
                  <p className="text-sm text-warm-gray">
                    Add references, citations, or links that support this tour
                    stop&apos;s content.
                  </p>

                  <div className="space-y-3">
                    {form.sources.map((source, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-center text-xs font-medium text-warm-gray-light">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={source}
                          onChange={(e) => updateSource(i, e.target.value)}
                          className={inputClass()}
                          placeholder="Source title or URL..."
                        />
                        <button
                          onClick={() => removeSource(i)}
                          disabled={form.sources.length <= 1}
                          className="shrink-0 rounded-md p-2 text-warm-gray transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                          title="Remove source"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addSource}
                    className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-warm-gray transition-colors hover:border-forest hover:text-forest"
                  >
                    <Plus className="h-4 w-4" />
                    Add Source
                  </button>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-forest px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {stop ? "Save Changes" : "Create Stop"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
