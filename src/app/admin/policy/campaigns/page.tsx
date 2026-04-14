"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface CampaignRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  deadline: string | null;
  created_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, title, slug, status, category, deadline, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns((data as CampaignRow[]) ?? []);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, string> = {
    active: "bg-rust/15 text-rust",
    past: "bg-warm-gray/15 text-warm-gray",
    drafting: "bg-forest/15 text-forest",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest">
          Campaigns
        </h1>
        <button className="rounded-lg bg-rust px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-rust-dark">
          New Campaign
        </button>
      </div>

      {loading ? (
        <p className="mt-8 font-body text-sm text-warm-gray">Loading&hellip;</p>
      ) : campaigns.length === 0 ? (
        <p className="mt-8 font-body text-sm text-warm-gray">
          No campaigns yet. Create your first campaign.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-cream-dark">
              <tr>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Title
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Status
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Category
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-cream-dark/50">
                  <td className="px-4 py-3 font-body text-sm text-ink">
                    {c.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-wider ${statusColor[c.status] ?? ""}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-warm-gray">
                    {c.category}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-warm-gray">
                    {c.deadline
                      ? new Date(c.deadline).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
