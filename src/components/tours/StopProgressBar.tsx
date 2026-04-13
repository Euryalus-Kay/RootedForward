"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface StopProgressBarProps {
  city: string;
  totalStops: number;
}

export default function StopProgressBar({ city, totalStops }: StopProgressBarProps) {
  const [visitedCount, setVisitedCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadProgress() {
      try {
        if (!supabase) { setLoading(false); return; }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setIsLoggedIn(true);

        const { data: profile } = await supabase
          .from("users")
          .select("visited_stops")
          .eq("id", user.id)
          .single();

        if (profile?.visited_stops) {
          // Fetch stops in this city to match against visited_stops
          const { data: cityStops } = await supabase
            .from("tour_stops")
            .select("id")
            .eq("city", city)
            .eq("published", true);

          if (cityStops) {
            const cityStopIds = new Set(cityStops.map((s) => s.id));
            const visited = profile.visited_stops.filter((id) => cityStopIds.has(id));
            setVisitedCount(visited.length);
          }
        }
      } catch {
        // Gracefully handle errors
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, [city]);

  const percentage = totalStops > 0 ? (visitedCount / totalStops) * 100 : 0;
  const isComplete = visitedCount === totalStops && totalStops > 0;

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-cream p-4">
        <div className="h-4 w-48 animate-pulse rounded bg-cream-dark" />
        <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-cream-dark" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-cream p-4 text-center">
        <p className="font-body text-sm text-warm-gray">
          Sign in to track your progress
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-cream p-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-light">
          <span className="font-semibold text-forest">{visitedCount}</span>
          {" "}of{" "}
          <span className="font-semibold">{totalStops}</span>
          {" "}stops visited in{" "}
          <span className="capitalize">{city.replace(/-/g, " ")}</span>
        </p>
        {isComplete && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-full bg-forest px-2.5 py-0.5 font-body text-xs font-semibold text-cream"
          >
            Complete!
          </motion.span>
        )}
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-cream-dark">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isComplete ? "bg-forest" : "bg-forest-light"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {isComplete && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-2 font-body text-xs text-forest"
        >
          Congratulations! You have completed this tour.
        </motion.p>
      )}
    </div>
  );
}
