"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Inbox,
  MessageSquare,
  UserPlus,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type ActivityType = "submission" | "comment" | "user";

interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Relative time helper                                               */
/* ------------------------------------------------------------------ */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

/* ------------------------------------------------------------------ */
/*  Icon + color per type                                              */
/* ------------------------------------------------------------------ */
function typeConfig(type: ActivityType) {
  switch (type) {
    case "submission":
      return {
        icon: Inbox,
        dotColor: "bg-green-500",
        textColor: "text-green-700",
        bgColor: "bg-green-50",
      };
    case "comment":
      return {
        icon: MessageSquare,
        dotColor: "bg-orange-500",
        textColor: "text-orange-700",
        bgColor: "bg-orange-50",
      };
    case "user":
      return {
        icon: UserPlus,
        dotColor: "bg-blue-500",
        textColor: "text-blue-700",
        bgColor: "bg-blue-50",
      };
  }
}

/* ------------------------------------------------------------------ */
/*  View-all link per type                                             */
/* ------------------------------------------------------------------ */
function viewAllHref(type: ActivityType): string {
  switch (type) {
    case "submission":
      return "/admin/submissions";
    case "comment":
      return "/admin/comments";
    case "user":
      return "/admin/users";
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const supabase = createClient();

      const [subsRes, commentsRes, usersRes] = await Promise.all([
        supabase
          .from("submissions")
          .select("id, name, type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("comments")
          .select("id, approved, created_at, stop_id")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("users")
          .select("id, email, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const activities: ActivityItem[] = [];

      // Submissions
      if (subsRes.data) {
        for (const s of subsRes.data) {
          activities.push({
            id: `sub-${s.id}`,
            type: "submission",
            description: `New ${s.type} signup: ${s.name}`,
            created_at: s.created_at,
          });
        }
      }

      // Comments — fetch stop titles separately to avoid join issues
      if (commentsRes.data && commentsRes.data.length > 0) {
        const stopIds = [...new Set(commentsRes.data.map((c) => c.stop_id))];
        const { data: stopsData } = await supabase
          .from("tour_stops")
          .select("id, title")
          .in("id", stopIds);

        const stopTitleMap: Record<string, string> = {};
        if (stopsData) {
          for (const s of stopsData) {
            stopTitleMap[s.id] = s.title;
          }
        }

        for (const c of commentsRes.data) {
          const stopTitle = stopTitleMap[c.stop_id] ?? "Unknown stop";
          const status = c.approved ? "approved" : "pending";
          activities.push({
            id: `com-${c.id}`,
            type: "comment",
            description: `New comment on ${stopTitle} (${status})`,
            created_at: c.created_at,
          });
        }
      }

      // Users
      if (usersRes.data) {
        for (const u of usersRes.data) {
          activities.push({
            id: `usr-${u.id}`,
            type: "user",
            description: `New user registered: ${u.email}`,
            created_at: u.created_at,
          });
        }
      }

      // Sort by newest first, take 15
      activities.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(activities.slice(0, 15));
    } catch {
      toast.error("Failed to load recent activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-forest" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white/60 p-8 text-center shadow-sm">
        <Clock className="mx-auto h-8 w-8 text-warm-gray-light" />
        <p className="mt-3 text-sm text-warm-gray">No recent activity</p>
      </div>
    );
  }

  /* Unique activity types for "View All" links */
  const activeTypes = [...new Set(items.map((i) => i.type))];

  return (
    <div className="rounded-xl border border-border bg-white/60 p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-forest">
          Recent Activity
        </h3>
        <div className="flex items-center gap-3">
          {activeTypes.map((type) => {
            const cfg = typeConfig(type);
            return (
              <Link
                key={type}
                href={viewAllHref(type)}
                className="flex items-center gap-1 text-xs font-medium text-warm-gray transition-colors hover:text-ink"
              >
                View {type === "submission" ? "Submissions" : type === "comment" ? "Comments" : "Users"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

        <ul className="space-y-0">
          {items.map((item, i) => {
            const cfg = typeConfig(item.type);
            const Icon = cfg.icon;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="relative flex items-start gap-4 py-2.5 pl-8"
              >
                {/* Dot */}
                <span
                  className={`absolute left-1.5 top-3.5 h-3 w-3 rounded-full border-2 border-white ${cfg.dotColor}`}
                />

                {/* Icon */}
                <span className={`shrink-0 rounded-md p-1.5 ${cfg.bgColor}`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.textColor}`} />
                </span>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-light">{item.description}</p>
                  <p className="mt-0.5 text-xs text-warm-gray-light">
                    {relativeTime(item.created_at)}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
