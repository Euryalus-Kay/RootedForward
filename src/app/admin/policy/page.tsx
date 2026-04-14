"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminPolicyDashboard() {
  const [stats, setStats] = useState({
    campaigns: 0,
    signatures: 0,
    pendingComments: 0,
    proposals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();
        const [campaigns, signatures, comments, proposals] = await Promise.all([
          supabase.from("campaigns").select("id", { count: "exact", head: true }),
          supabase.from("signatures").select("id", { count: "exact", head: true }),
          supabase
            .from("public_comments")
            .select("id", { count: "exact", head: true })
            .eq("is_approved", false),
          supabase
            .from("proposal_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "new"),
        ]);
        setStats({
          campaigns: campaigns.count ?? 0,
          signatures: signatures.count ?? 0,
          pendingComments: comments.count ?? 0,
          proposals: proposals.count ?? 0,
        });
      } catch {
        // Tables may not exist
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Campaigns", count: stats.campaigns, href: "/admin/policy/campaigns" },
    { label: "Total Signatures", count: stats.signatures, href: "/admin/policy/signatures" },
    { label: "Pending Comments", count: stats.pendingComments, href: "/admin/policy/comments" },
    { label: "New Proposals", count: stats.proposals, href: "/admin/policy/proposals" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">
        Policy Dashboard
      </h1>

      {loading ? (
        <p className="mt-8 font-body text-sm text-warm-gray">Loading&hellip;</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-lg border border-border bg-cream p-6 transition-shadow hover:shadow-md"
            >
              <p className="font-display text-3xl text-forest">{card.count}</p>
              <p className="mt-1 font-body text-sm text-warm-gray">
                {card.label}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
