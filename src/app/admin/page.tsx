"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type { Submission } from "@/lib/types/database";
import {
  MapPin,
  Headphones,
  Inbox,
  Users,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface Stats {
  stops: number;
  campaigns: number;
  submissions: number;
  users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    stops: 0,
    campaigns: 0,
    submissions: 0,
    users: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();

      const [stopsRes, podcastsRes, submissionsRes, usersRes, recentRes] =
        await Promise.all([
          supabase
            .from("tour_stops")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("submissions")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("users")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("submissions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setStats({
        stops: stopsRes.count ?? 0,
        campaigns: podcastsRes.count ?? 0,
        submissions: submissionsRes.count ?? 0,
        users: usersRes.count ?? 0,
      });

      if (recentRes.data) {
        setRecentSubmissions(recentRes.data);
      }
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Stops",
      value: stats.stops,
      icon: MapPin,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Campaigns",
      value: stats.campaigns,
      icon: Headphones,
      color: "text-rust",
      bg: "bg-rust/10",
    },
    {
      label: "Total Submissions",
      value: stats.submissions,
      icon: Inbox,
      color: "text-forest-light",
      bg: "bg-forest-light/10",
    },
    {
      label: "Total Users",
      value: stats.users,
      icon: Users,
      color: "text-warm-gray",
      bg: "bg-warm-gray/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-white/60 p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn("rounded-lg p-3", card.bg)}
                >
                  <Icon className={cn("h-6 w-6", card.color)} />
                </div>
                <div>
                  <p className="text-3xl font-bold font-display text-ink">
                    {card.value}
                  </p>
                  <p className="text-sm text-warm-gray">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Submissions */}
        <div className="rounded-xl border border-border bg-white/60 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-forest">
              Recent Submissions
            </h3>
            <Link
              href="/admin/submissions"
              className="flex items-center gap-1 text-sm text-rust hover:text-rust-light transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-warm-gray">No submissions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentSubmissions.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {sub.name}
                    </p>
                    <p className="text-xs text-warm-gray">{sub.email}</p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        sub.type === "volunteer"
                          ? "bg-forest/10 text-forest"
                          : "bg-rust/10 text-rust"
                      )}
                    >
                      {sub.type}
                    </span>
                    <span className="text-xs text-warm-gray-light">
                      {formatDate(sub.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-white/60 p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-forest">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/admin/tours"
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-cream-dark"
            >
              <div className="rounded-lg bg-forest/10 p-2">
                <Plus className="h-5 w-5 text-forest" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Add Tour Stop
                </p>
                <p className="text-xs text-warm-gray">
                  Create a new tour stop entry
                </p>
              </div>
            </Link>
            <Link
              href="/admin/podcasts"
              className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-cream-dark"
            >
              <div className="rounded-lg bg-rust/10 p-2">
                <Plus className="h-5 w-5 text-rust" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">
                  Add Podcast Episode
                </p>
                <p className="text-xs text-warm-gray">
                  Publish a new podcast episode
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
