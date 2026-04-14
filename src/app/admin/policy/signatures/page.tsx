"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface SignatureRow {
  id: string;
  campaign_id: string;
  is_public: boolean;
  delivered: boolean;
  created_at: string;
  users: { full_name: string | null } | null;
}

export default function AdminSignaturesPage() {
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("signatures")
          .select("id, campaign_id, is_public, delivered, created_at, users(full_name)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        setSignatures((data as unknown as SignatureRow[]) ?? []);
      } catch {
        toast.error("Failed to load signatures");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-forest">
          Signatures
        </h1>
        <button className="rounded-lg border border-border bg-cream px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark">
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="mt-8 font-body text-sm text-warm-gray">Loading&hellip;</p>
      ) : signatures.length === 0 ? (
        <p className="mt-8 font-body text-sm text-warm-gray">
          No signatures yet.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-cream-dark">
              <tr>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Name
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Public
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Delivered
                </th>
                <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {signatures.map((s) => (
                <tr key={s.id} className="hover:bg-cream-dark/50">
                  <td className="px-4 py-3 font-body text-sm text-ink">
                    {s.users?.full_name ?? "Anonymous"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-warm-gray">
                    {s.is_public ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-warm-gray">
                    {s.delivered ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-warm-gray">
                    {new Date(s.created_at).toLocaleDateString()}
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
