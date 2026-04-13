"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface StopRatingProps {
  stopId: string;
}

interface RatingData {
  average: number;
  count: number;
  userRating: number | null;
}

const STORAGE_KEY_PREFIX = "rf_rating_";

function getLocalRatings(stopId: string): { ratings: number[]; userRating: number | null } {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${stopId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore parse errors
  }
  return { ratings: [], userRating: null };
}

function saveLocalRating(stopId: string, rating: number) {
  try {
    const data = getLocalRatings(stopId);
    if (data.userRating !== null) {
      // Replace the old user rating
      const idx = data.ratings.indexOf(data.userRating);
      if (idx !== -1) data.ratings.splice(idx, 1);
    }
    data.ratings.push(rating);
    data.userRating = rating;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${stopId}`, JSON.stringify(data));
    return data;
  } catch {
    return { ratings: [rating], userRating: rating };
  }
}

export default function StopRating({ stopId }: StopRatingProps) {
  const [ratingData, setRatingData] = useState<RatingData>({
    average: 0,
    count: 0,
    userRating: null,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadRating() {
      try {
        if (!supabase) throw new Error("not configured");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setIsLoggedIn(true);

        // Try to load from Supabase ratings JSONB or fall back to localStorage
        const { data: stop } = await supabase
          .from("tour_stops")
          .select("*")
          .eq("id", stopId)
          .single();

        const stopData = stop as Record<string, unknown> | null;
        if (stopData && typeof stopData === "object" && "ratings" in stopData && stopData.ratings) {
          const ratings = stopData.ratings as { user_id: string; rating: number }[];
          const avg =
            ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;
          const userRating = user
            ? ratings.find((r) => r.user_id === user.id)?.rating ?? null
            : null;
          setRatingData({ average: avg, count: ratings.length, userRating });
        } else {
          // Fall back to localStorage
          const local = getLocalRatings(stopId);
          const avg =
            local.ratings.length > 0
              ? local.ratings.reduce((s, r) => s + r, 0) / local.ratings.length
              : 0;
          setRatingData({
            average: avg,
            count: local.ratings.length,
            userRating: local.userRating,
          });
        }
      } catch {
        // Fall back to localStorage
        const local = getLocalRatings(stopId);
        const avg =
          local.ratings.length > 0
            ? local.ratings.reduce((s, r) => s + r, 0) / local.ratings.length
            : 0;
        setRatingData({
          average: avg,
          count: local.ratings.length,
          userRating: local.userRating,
        });
      } finally {
        setLoading(false);
      }
    }
    loadRating();
  }, [stopId]);

  const handleRate = useCallback(
    async (rating: number) => {
      if (!isLoggedIn || !supabase) return;

      try {
        // Try Supabase first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: stop } = await supabase
          .from("tour_stops")
          .select("*")
          .eq("id", stopId)
          .single();

        const stopData = stop as Record<string, unknown> | null;
        if (stopData && typeof stopData === "object" && "ratings" in stopData) {
          const ratings = (stopData.ratings as { user_id: string; rating: number }[]) ?? [];
          const existingIdx = ratings.findIndex((r) => r.user_id === user.id);
          if (existingIdx !== -1) {
            ratings[existingIdx].rating = rating;
          } else {
            ratings.push({ user_id: user.id, rating });
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("tour_stops") as any)
            .update({ ratings })
            .eq("id", stopId);

          const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
          setRatingData({ average: avg, count: ratings.length, userRating: rating });
          toast.success("Rating saved!");
          return;
        }
      } catch {
        // Fall through to localStorage
      }

      // localStorage fallback
      const updated = saveLocalRating(stopId, rating);
      const avg =
        updated.ratings.length > 0
          ? updated.ratings.reduce((s, r) => s + r, 0) / updated.ratings.length
          : 0;
      setRatingData({ average: avg, count: updated.ratings.length, userRating: rating });
      toast.success("Rating saved!");
    },
    [isLoggedIn, stopId, supabase]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-6 animate-pulse rounded bg-cream-dark" />
        ))}
      </div>
    );
  }

  const displayRating = hoverRating || ratingData.userRating || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            whileTap={isLoggedIn ? { scale: 0.85 } : undefined}
            whileHover={isLoggedIn ? { scale: 1.15 } : undefined}
            onMouseEnter={() => isLoggedIn && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => handleRate(star)}
            disabled={!isLoggedIn}
            className={cn(
              "transition-colors",
              !isLoggedIn && "cursor-default"
            )}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              size={24}
              className={cn(
                "transition-colors",
                star <= displayRating
                  ? "fill-rust text-rust"
                  : star <= Math.round(ratingData.average)
                    ? "fill-rust/30 text-rust/30"
                    : "fill-transparent text-warm-gray-light"
              )}
            />
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {ratingData.count > 0 ? (
          <p className="font-body text-sm text-warm-gray">
            <span className="font-semibold text-ink-light">
              {ratingData.average.toFixed(1)}
            </span>
            {" "}({ratingData.count} rating{ratingData.count !== 1 ? "s" : ""})
          </p>
        ) : (
          <p className="font-body text-sm text-warm-gray">No ratings yet</p>
        )}
        {!isLoggedIn && (
          <p className="font-body text-xs text-warm-gray-light">
            Sign in to rate
          </p>
        )}
      </div>
    </div>
  );
}
