"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth-helpers";
import type { UserProfile, TourStop } from "@/lib/types/database";
import toast from "react-hot-toast";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [savedStops, setSavedStops] = useState<TourStop[]>([]);
  const [visitedStops, setVisitedStops] = useState<TourStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(true);

  const fetchStopDetails = useCallback(
    async (stopIds: string[]): Promise<TourStop[]> => {
      if (!stopIds || stopIds.length === 0) return [];
      const { data, error } = await supabase
        .from("tour_stops" as never)
        .select("*")
        .in("id" as never, stopIds);
      if (error) {
        console.error("Error fetching stops:", error);
        return [];
      }
      return (data as unknown as TourStop[]) ?? [];
    },
    [supabase]
  );

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        const { data: userProfile, error } = await supabase
          .from("users" as never)
          .select("*")
          .eq("id" as never, user.id)
          .single();

        const profile = userProfile as unknown as UserProfile | null;

        if (error || !profile) {
          // Profile might not exist yet -- build from auth data
          setProfile({
            id: user.id,
            email: user.email ?? "",
            full_name: user.user_metadata?.full_name ?? null,
            role: "user",
            saved_stops: [],
            visited_stops: [],
            created_at: user.created_at,
          });
          setFullName(user.user_metadata?.full_name ?? "");
        } else {
          setProfile(profile);
          setFullName(profile.full_name ?? "");
        }
      } catch {
        toast.error("Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  useEffect(() => {
    async function loadStops() {
      if (!profile) return;

      setStopsLoading(true);
      try {
        const [saved, visited] = await Promise.all([
          fetchStopDetails(profile.saved_stops),
          fetchStopDetails(profile.visited_stops),
        ]);
        setSavedStops(saved);
        setVisitedStops(visited);
      } catch {
        console.error("Error loading stops");
      } finally {
        setStopsLoading(false);
      }
    }

    loadStops();
  }, [profile, fetchStopDetails]);

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("users" as never)
        .update({ full_name: fullName } as never)
        .eq("id" as never, profile.id);

      if (error) {
        toast.error("Failed to update profile.");
        return;
      }

      setProfile({ ...profile, full_name: fullName });
      toast.success("Profile updated!");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveStop(
    stopId: string,
    list: "saved_stops" | "visited_stops"
  ) {
    if (!profile) return;

    const updatedIds = profile[list].filter((id) => id !== stopId);

    try {
      const { error } = await supabase
        .from("users" as never)
        .update({ [list]: updatedIds } as never)
        .eq("id" as never, profile.id);

      if (error) {
        toast.error("Failed to remove stop.");
        return;
      }

      setProfile({ ...profile, [list]: updatedIds });

      if (list === "saved_stops") {
        setSavedStops((prev) => prev.filter((s) => s.id !== stopId));
      } else {
        setVisitedStops((prev) => prev.filter((s) => s.id !== stopId));
      }

      toast.success("Stop removed.");
    } catch {
      toast.error("An unexpected error occurred.");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out.");
      setSigningOut(false);
    }
  }

  // --- Skeleton Placeholders ---
  function SkeletonField() {
    return (
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-border" />
        <div className="h-10 w-full animate-pulse rounded-md bg-border" />
      </div>
    );
  }

  function SkeletonStopCard() {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-cream px-4 py-3">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-border" />
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded bg-border" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <div className="h-9 w-48 animate-pulse rounded bg-border" />
        <div className="mt-10 space-y-6">
          <SkeletonField />
          <SkeletonField />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-border" />
        </div>
        <div className="mt-12">
          <div className="h-7 w-32 animate-pulse rounded bg-border" />
          <div className="mt-4 space-y-3">
            <SkeletonStopCard />
            <SkeletonStopCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
      {/* Page heading */}
      <h1 className="font-display text-3xl font-semibold text-forest md:text-4xl">
        Your Account
      </h1>

      {/* Profile section */}
      <section className="mt-10">
        <div className="rounded-xl border border-border bg-cream-dark/40 px-6 py-8 shadow-sm">
          <h2 className="font-display text-xl font-semibold text-forest">
            Profile
          </h2>

          <div className="mt-6 space-y-5">
            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Email
              </label>
              <input
                type="email"
                readOnly
                value={profile?.email ?? ""}
                className="h-10 w-full rounded-md border border-border bg-cream/60 px-3 text-sm text-warm-gray cursor-not-allowed"
              />
            </div>

            {/* Full Name (editable) */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="h-10 w-full rounded-md border border-border bg-cream px-3 text-sm text-ink placeholder:text-warm-gray-light focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveProfile}
              disabled={saving || fullName === (profile?.full_name ?? "")}
              className="flex h-10 items-center justify-center rounded-lg bg-rust px-6 text-sm font-medium text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
            >
              {saving ? (
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Saved Stops */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-forest">
          Saved Stops
        </h2>

        {stopsLoading ? (
          <div className="mt-4 space-y-3">
            <SkeletonStopCard />
            <SkeletonStopCard />
          </div>
        ) : savedStops.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-cream-dark/30 px-6 py-8 text-center">
            <p className="text-sm text-warm-gray">
              You haven&apos;t saved any stops yet. Explore our{" "}
              <Link
                href="/tours"
                className="font-medium text-forest transition-colors hover:text-forest-light"
              >
                walking tours
              </Link>{" "}
              and save stops to revisit later.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {savedStops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center justify-between rounded-lg border border-border bg-cream px-4 py-3 transition-colors hover:bg-cream-dark/40"
              >
                <div>
                  <Link
                    href={`/tours/${stop.city}#${stop.slug}`}
                    className="text-sm font-medium text-ink transition-colors hover:text-forest"
                  >
                    {stop.title}
                  </Link>
                  <p className="mt-0.5 text-xs capitalize text-warm-gray">
                    {stop.city.replace("-", " ")}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveStop(stop.id, "saved_stops")}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-rust transition-colors hover:bg-rust/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Visited Stops */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-forest">
          Visited Stops
        </h2>

        {stopsLoading ? (
          <div className="mt-4 space-y-3">
            <SkeletonStopCard />
            <SkeletonStopCard />
          </div>
        ) : visitedStops.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-cream-dark/30 px-6 py-8 text-center">
            <p className="text-sm text-warm-gray">
              You haven&apos;t marked any stops as visited yet. Visit a{" "}
              <Link
                href="/tours"
                className="font-medium text-forest transition-colors hover:text-forest-light"
              >
                tour stop
              </Link>{" "}
              and mark it complete to track your progress.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visitedStops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center justify-between rounded-lg border border-border bg-cream px-4 py-3 transition-colors hover:bg-cream-dark/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-forest/10">
                    <svg
                      className="h-3 w-3 text-forest"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <Link
                      href={`/tours/${stop.city}#${stop.slug}`}
                      className="text-sm font-medium text-ink transition-colors hover:text-forest"
                    >
                      {stop.title}
                    </Link>
                    <p className="mt-0.5 text-xs capitalize text-warm-gray">
                      {stop.city.replace("-", " ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStop(stop.id, "visited_stops")}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-rust transition-colors hover:bg-rust/10"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sign Out */}
      <section className="mt-12 border-t border-border pt-8">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex h-10 items-center justify-center rounded-lg border border-border bg-cream px-6 text-sm font-medium text-ink transition-colors hover:bg-cream-dark disabled:opacity-50"
        >
          {signingOut ? (
            <svg
              className="h-5 w-5 animate-spin text-ink"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            "Sign Out"
          )}
        </button>
      </section>
    </div>
  );
}
