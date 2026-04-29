"use client";

/* ------------------------------------------------------------------ */
/*  /admin/research/data-usage                                         */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Surfaces dataset_downloads activity for admins. Three things on   */
/*  the page:                                                          */
/*    - Top-line totals (downloads, unique users, datasets touched)   */
/*    - Per-dataset rollup (download count + last-downloaded)         */
/*    - Most recent 100 download events with user email + IP + UA    */
/*                                                                     */
/*  RLS on dataset_downloads only lets admins SELECT all rows; we     */
/*  rely on that and call from the regular client.                    */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Loader2, Download, Users, Database, Activity } from "lucide-react";

interface DownloadRow {
  id: string;
  dataset_slug: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  downloaded_at: string;
}

interface DatasetRow {
  slug: string;
  download_count: number;
  last_downloaded_at: string | null;
}

interface Totals {
  total_downloads: number;
  unique_users: number;
  datasets_touched: number;
  last_24h: number;
}

export default function AdminDataUsagePage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [datasets, setDatasets] = useState<DatasetRow[]>([]);
  const [recent, setRecent] = useState<DownloadRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const oneDayAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000
        ).toISOString();

        const [allRes, recentRes, datasetsRes, last24Res] = await Promise.all([
          supabase
            .from("dataset_downloads")
            .select("user_id,dataset_slug", { count: "exact" }),
          supabase
            .from("dataset_downloads")
            .select(
              "id,dataset_slug,user_id,user_email,user_role,ip_address,user_agent,downloaded_at"
            )
            .order("downloaded_at", { ascending: false })
            .limit(100),
          supabase
            .from("research_datasets")
            .select("slug,download_count,last_downloaded_at")
            .order("download_count", { ascending: false }),
          supabase
            .from("dataset_downloads")
            .select("id", { count: "exact", head: true })
            .gte("downloaded_at", oneDayAgo),
        ]);

        const allRows = (allRes.data ?? []) as Array<{
          user_id: string | null;
          dataset_slug: string;
        }>;
        const uniqueUsers = new Set(
          allRows.filter((r) => r.user_id).map((r) => r.user_id as string)
        ).size;
        const datasetsTouched = new Set(allRows.map((r) => r.dataset_slug)).size;

        setTotals({
          total_downloads: allRes.count ?? 0,
          unique_users: uniqueUsers,
          datasets_touched: datasetsTouched,
          last_24h: last24Res.count ?? 0,
        });

        setRecent((recentRes.data ?? []) as DownloadRow[]);
        setDatasets((datasetsRes.data ?? []) as DatasetRow[]);
      } catch {
        setTotals({
          total_downloads: 0,
          unique_users: 0,
          datasets_touched: 0,
          last_24h: 0,
        });
        setRecent([]);
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">
          Research Data Usage
        </h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-warm-gray">
          Audit log of every replication-archive download. Each row is
          tied to a Supabase auth user; user_email is denormalized so
          deletions of the auth row do not blank out the audit history.
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={<Download className="h-5 w-5" />}
          label="Total downloads"
          value={totals?.total_downloads ?? 0}
        />
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Unique users"
          value={totals?.unique_users ?? 0}
        />
        <Stat
          icon={<Database className="h-5 w-5" />}
          label="Datasets touched"
          value={totals?.datasets_touched ?? 0}
        />
        <Stat
          icon={<Activity className="h-5 w-5" />}
          label="Last 24 hours"
          value={totals?.last_24h ?? 0}
          accent="rust"
        />
      </div>

      {/* Per-dataset rollup */}
      <div className="rounded-xl border border-border bg-white/60 p-5">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-forest">
          Downloads by Dataset
        </h2>
        {datasets.length === 0 ? (
          <p className="font-body text-sm text-warm-gray">
            No datasets have been registered yet. Run migration 005 to seed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    Dataset
                  </th>
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    Downloads
                  </th>
                  <th className="py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    Last downloaded
                  </th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((d) => (
                  <tr key={d.slug} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-[12.5px] text-ink/85">
                      {d.slug}
                    </td>
                    <td className="py-2 pr-4 font-body text-[14px] text-ink">
                      {d.download_count}
                    </td>
                    <td className="py-2 font-body text-[13px] text-warm-gray">
                      {d.last_downloaded_at
                        ? formatDate(d.last_downloaded_at)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent events */}
      <div className="rounded-xl border border-border bg-white/60 p-5">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-forest">
          Recent Downloads
        </h2>
        {recent.length === 0 ? (
          <p className="font-body text-sm text-warm-gray">
            No downloads yet. The first signed-in download will appear
            here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    When
                  </th>
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    User
                  </th>
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    Role
                  </th>
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    Dataset
                  </th>
                  <th className="py-2 pr-4 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    IP
                  </th>
                  <th className="py-2 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                    Agent
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-[11.5px] text-warm-gray">
                      {new Date(r.downloaded_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-body text-[13px] text-ink">
                      {r.user_email ?? (
                        <span className="text-warm-gray">anonymous</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 font-body text-[12px] text-warm-gray">
                      {r.user_role ?? "—"}
                    </td>
                    <td className="py-2 pr-4 font-mono text-[11.5px] text-ink/85">
                      {r.dataset_slug}
                    </td>
                    <td className="py-2 pr-4 font-mono text-[11.5px] text-warm-gray">
                      {r.ip_address ?? "—"}
                    </td>
                    <td className="py-2 max-w-[280px] truncate font-mono text-[11px] text-warm-gray">
                      {r.user_agent ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponent — stat tile                                           */
/* ------------------------------------------------------------------ */

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: "rust" | "forest";
}) {
  return (
    <div className="rounded-xl border border-border bg-white/60 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-9 w-9 place-items-center rounded-md ${
            accent === "rust"
              ? "bg-rust/10 text-rust"
              : accent === "forest"
                ? "bg-forest/10 text-forest"
                : "bg-warm-gray/10 text-warm-gray"
          }`}
        >
          {icon}
        </span>
        <div>
          <p className="font-display text-2xl font-bold text-ink">{value}</p>
          <p className="font-body text-[11.5px] uppercase tracking-widest text-warm-gray">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
