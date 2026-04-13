"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Headphones,
  Users,
  Inbox,
  MessageSquare,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Animated counter that counts up when it enters the viewport        */
/* ------------------------------------------------------------------ */
function AnimatedNumber({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: "easeOut",
    });
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, rounded]);

  return <span>{display}</span>;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface AnalyticsData {
  totalStops: number;
  publishedStops: number;
  totalPodcasts: number;
  publishedPodcasts: number;
  totalUsers: number;
  adminUsers: number;
  totalSubmissions: number;
  weekSubmissions: number;
  totalComments: number;
  pendingComments: number;
  stopsPerCity: { city: string; count: number }[];
}

const emptyData: AnalyticsData = {
  totalStops: 0,
  publishedStops: 0,
  totalPodcasts: 0,
  publishedPodcasts: 0,
  totalUsers: 0,
  adminUsers: 0,
  totalSubmissions: 0,
  weekSubmissions: 0,
  totalComments: 0,
  pendingComments: 0,
  stopsPerCity: [],
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function AnalyticsCards() {
  const [data, setData] = useState<AnalyticsData>(emptyData);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const supabase = createClient();

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekStr = oneWeekAgo.toISOString();

      const [
        stopsRes,
        publishedStopsRes,
        podcastsRes,
        publishedPodcastsRes,
        usersRes,
        adminUsersRes,
        submissionsRes,
        weekSubsRes,
        commentsRes,
        pendingCommentsRes,
        allStopsRes,
      ] = await Promise.all([
        supabase.from("tour_stops").select("id", { count: "exact", head: true }),
        supabase.from("tour_stops").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("podcasts").select("id", { count: "exact", head: true }),
        supabase.from("podcasts").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "admin"),
        supabase.from("submissions").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }).gte("created_at", weekStr),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("tour_stops").select("city"),
      ]);

      // Build stops-per-city counts
      const cityMap: Record<string, number> = {};
      if (allStopsRes.data) {
        for (const stop of allStopsRes.data) {
          const city = stop.city || "Unknown";
          cityMap[city] = (cityMap[city] || 0) + 1;
        }
      }
      const stopsPerCity = Object.entries(cityMap)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      setData({
        totalStops: stopsRes.count ?? 0,
        publishedStops: publishedStopsRes.count ?? 0,
        totalPodcasts: podcastsRes.count ?? 0,
        publishedPodcasts: publishedPodcastsRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
        adminUsers: adminUsersRes.count ?? 0,
        totalSubmissions: submissionsRes.count ?? 0,
        weekSubmissions: weekSubsRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
        pendingComments: pendingCommentsRes.count ?? 0,
        stopsPerCity,
      });
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  const maxCityCount = Math.max(...data.stopsPerCity.map((c) => c.count), 1);

  /* Card definitions */
  const cards = [
    {
      label: "Tour Stops",
      value: data.totalStops,
      sub: `Published: ${data.publishedStops}`,
      icon: MapPin,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Podcasts",
      value: data.totalPodcasts,
      sub: `Published: ${data.publishedPodcasts}`,
      icon: Headphones,
      color: "text-rust",
      bg: "bg-rust/10",
    },
    {
      label: "Users",
      value: data.totalUsers,
      sub: `Admins: ${data.adminUsers}`,
      icon: Users,
      color: "text-forest-light",
      bg: "bg-forest-light/10",
    },
    {
      label: "Submissions",
      value: data.totalSubmissions,
      sub: `This week: ${data.weekSubmissions}`,
      icon: Inbox,
      color: "text-warm-gray",
      bg: "bg-warm-gray/10",
    },
    {
      label: "Comments",
      value: data.totalComments,
      sub: `Pending: ${data.pendingComments}`,
      icon: MessageSquare,
      color: "text-rust-light",
      bg: "bg-rust-light/10",
    },
  ];

  /* Stagger container */
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <div className="space-y-8">
      {/* Metric cards */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              variants={cardVariants}
              className="rounded-xl border border-border bg-white/60 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className={cn("rounded-lg p-2.5", card.bg)}>
                  <Icon className={cn("h-5 w-5", card.color)} />
                </div>
                <TrendingUp className="h-4 w-4 text-warm-gray-light" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-ink">
                <AnimatedNumber value={card.value} />
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink-light">
                {card.label}
              </p>
              {card.sub && (
                <p className="mt-1 text-xs text-warm-gray">{card.sub}</p>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Stops per city bar chart */}
      {data.stopsPerCity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-xl border border-border bg-white/60 p-6 shadow-sm"
        >
          <h3 className="mb-5 font-display text-lg font-semibold text-forest">
            Stops by City
          </h3>
          <div className="space-y-3">
            {data.stopsPerCity.map((item, i) => {
              const pct = Math.round((item.count / maxCityCount) * 100);
              return (
                <div key={item.city} className="flex items-center gap-4">
                  <span className="w-32 shrink-0 truncate text-sm font-medium text-ink">
                    {item.city}
                  </span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-cream-dark">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-md bg-forest"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        delay: 0.5 + i * 0.1,
                        duration: 0.6,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-ink">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
