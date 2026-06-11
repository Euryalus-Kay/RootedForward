"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MapPinCheck, MessageCircle, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TourStop } from "@/lib/types/database";

interface ActivityItem {
  id: string;
  type: "saved" | "visited" | "comment";
  stopTitle: string;
  stopSlug: string;
  city: string;
  timestamp: Date;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "saved":
      return <Bookmark size={16} className="text-rust" />;
    case "visited":
      return <MapPinCheck size={16} className="text-forest" />;
    case "comment":
      return <MessageCircle size={16} className="text-ink-light" />;
  }
}

function getActivityText(item: ActivityItem): string {
  const cityLabel = item.city.replace(/-/g, " ");
  switch (item.type) {
    case "saved":
      return `Saved "${item.stopTitle}" in ${cityLabel}`;
    case "visited":
      return `Visited "${item.stopTitle}" in ${cityLabel}`;
    case "comment":
      return `Commented on "${item.stopTitle}" in ${cityLabel}`;
  }
}

function getIconBgColor(type: ActivityItem["type"]): string {
  switch (type) {
    case "saved":
      return "bg-rust/10";
    case "visited":
      return "bg-forest/10";
    case "comment":
      return "bg-ink/10";
  }
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadActivity() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setIsLoggedIn(true);

        const { data: profile } = await supabase
          .from("users")
          .select("saved_stops, visited_stops")
          .eq("id", user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        // Gather all unique stop IDs from saved and visited
        const allStopIds = [
          ...(profile.saved_stops ?? []),
          ...(profile.visited_stops ?? []),
        ];
        const uniqueIds = [...new Set(allStopIds)];

        if (uniqueIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch stop details for title/slug/city
        const { data: stops } = await supabase
          .from("tour_stops")
          .select("id, title, slug, city")
          .in("id", uniqueIds);

        const stopMap = new Map<string, Pick<TourStop, "title" | "slug" | "city">>();
        (stops ?? []).forEach((s) => stopMap.set(s.id, s));

        // Fetch comments by this user
        const { data: comments } = await supabase
          .from("comments")
          .select("id, stop_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const items: ActivityItem[] = [];
        const now = Date.now();

        // Build activity items from saved_stops
        (profile.saved_stops ?? []).forEach((stopId, index) => {
          const stop = stopMap.get(stopId);
          if (!stop) return;
          items.push({
            id: `saved-${stopId}`,
            type: "saved",
            stopTitle: stop.title,
            stopSlug: stop.slug,
            city: stop.city,
            // Distribute timestamps since we lack actual dates
            timestamp: new Date(now - index * 3600000),
          });
        });

        // Build activity items from visited_stops
        (profile.visited_stops ?? []).forEach((stopId, index) => {
          const stop = stopMap.get(stopId);
          if (!stop) return;
          items.push({
            id: `visited-${stopId}`,
            type: "visited",
            stopTitle: stop.title,
            stopSlug: stop.slug,
            city: stop.city,
            timestamp: new Date(now - index * 3600000 - 1800000),
          });
        });

        // Build activity items from comments
        (comments ?? []).forEach((comment) => {
          const stop = stopMap.get(comment.stop_id);
          if (!stop) return;
          items.push({
            id: `comment-${comment.id}`,
            type: "comment",
            stopTitle: stop.title,
            stopSlug: stop.slug,
            city: stop.city,
            timestamp: new Date(comment.created_at),
          });
        });

        // Sort by timestamp descending and limit to 20
        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(items.slice(0, 20));
      } catch {
        // Gracefully handle errors
      } finally {
        setLoading(false);
      }
    }
    loadActivity();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-cream p-6">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-cream-dark" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-4 flex items-start gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-cream-dark" />
            <div className="flex-1">
              <div className="h-4 w-3/4 animate-pulse rounded bg-cream-dark" />
              <div className="mt-1 h-3 w-20 animate-pulse rounded bg-cream-dark" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-cream p-6 text-center">
        <MapPin size={32} className="mx-auto text-warm-gray-light" />
        <p className="mt-3 font-body text-sm text-warm-gray">
          Sign in to see your activity
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-cream p-6 text-center">
        <MapPin size={32} className="mx-auto text-warm-gray-light" />
        <p className="mt-3 font-body text-sm text-warm-gray">
          Start exploring tours to see your activity here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-cream p-6">
      <h3 className="mb-5 font-display text-lg text-forest">Recent Activity</h3>

      <div className="relative ml-4 border-l-2 border-border pl-6">
        <AnimatePresence>
          {activities.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="relative mb-5 last:mb-0"
            >
              {/* Timeline dot */}
              <div
                className={`absolute -left-[calc(1.5rem+5px)] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-cream ${getIconBgColor(item.type)}`}
              >
                {getActivityIcon(item.type)}
              </div>

              {/* Content */}
              <div>
                <a
                  href={`/tours/${item.city}/${item.stopSlug}`}
                  className="font-body text-sm text-ink-light transition-colors hover:text-forest"
                >
                  {getActivityText(item)}
                </a>
                <p className="mt-0.5 font-body text-xs text-warm-gray">
                  {formatRelativeTime(item.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
