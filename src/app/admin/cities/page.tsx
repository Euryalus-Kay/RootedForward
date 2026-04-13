"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/types/database";
import { Save, Loader2, MapPin, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface CityFormState {
  description: string;
  hero_image: string;
  saving: boolean;
}

export default function CitiesManager() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<Record<string, CityFormState>>({});

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      const cityData = data ?? [];
      setCities(cityData);

      const initialForms: Record<string, CityFormState> = {};
      for (const city of cityData) {
        initialForms[city.id] = {
          description: city.description,
          hero_image: city.hero_image ?? "",
          saving: false,
        };
      }
      setForms(initialForms);
    } catch {
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (
    cityId: string,
    field: "description" | "hero_image",
    value: string
  ) => {
    setForms((prev) => ({
      ...prev,
      [cityId]: { ...prev[cityId], [field]: value },
    }));
  };

  const handleSave = async (city: City) => {
    const cityForm = forms[city.id];
    if (!cityForm) return;

    setForms((prev) => ({
      ...prev,
      [city.id]: { ...prev[city.id], saving: true },
    }));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("cities")
        .update({
          description: cityForm.description.trim(),
          hero_image: cityForm.hero_image.trim() || null,
        })
        .eq("id", city.id);
      if (error) throw error;
      toast.success(`${city.name} updated`);
    } catch {
      toast.error(`Failed to update ${city.name}`);
    } finally {
      setForms((prev) => ({
        ...prev,
        [city.id]: { ...prev[city.id], saving: false },
      }));
    }
  };

  const hasChanges = (city: City): boolean => {
    const cityForm = forms[city.id];
    if (!cityForm) return false;
    return (
      cityForm.description !== city.description ||
      cityForm.hero_image !== (city.hero_image ?? "")
    );
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
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">
          Cities
        </h1>
        <p className="text-sm text-warm-gray">
          Manage city descriptions and hero images
        </p>
      </div>

      {/* City Cards */}
      {cities.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <p className="text-warm-gray">No cities found in the database.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {cities.map((city) => {
            const cityForm = forms[city.id];
            if (!cityForm) return null;
            const changed = hasChanges(city);

            return (
              <div
                key={city.id}
                className="rounded-xl border border-border bg-white/60 shadow-sm overflow-hidden"
              >
                {/* City Header */}
                <div className="flex items-center gap-3 border-b border-border/60 bg-cream-dark/30 px-6 py-4">
                  <div className="rounded-lg bg-forest/10 p-2">
                    <MapPin className="h-5 w-5 text-forest" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-forest">
                      {city.name}
                    </h3>
                    <p className="text-xs text-warm-gray">
                      Slug: {city.slug} &middot; Lat: {city.lat}, Lng:{" "}
                      {city.lng}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4 p-6">
                  {/* Description */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink">
                      Description
                    </label>
                    <textarea
                      value={cityForm.description}
                      onChange={(e) =>
                        updateForm(city.id, "description", e.target.value)
                      }
                      rows={4}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                      placeholder="Describe this city..."
                    />
                  </div>

                  {/* Hero Image URL */}
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
                      <ImageIcon className="h-4 w-4 text-warm-gray" />
                      Hero Image URL
                    </label>
                    <input
                      type="text"
                      value={cityForm.hero_image}
                      onChange={(e) =>
                        updateForm(city.id, "hero_image", e.target.value)
                      }
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                      placeholder="https://example.com/city-hero.jpg"
                    />
                    {cityForm.hero_image && (
                      <div className="mt-2 overflow-hidden rounded-md border border-border">
                        <img
                          src={cityForm.hero_image}
                          alt={`${city.name} hero preview`}
                          className="h-32 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave(city)}
                      disabled={cityForm.saving || !changed}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                        changed
                          ? "bg-forest text-cream hover:bg-forest-light"
                          : "bg-warm-gray-light/30 text-warm-gray"
                      )}
                    >
                      {cityForm.saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
