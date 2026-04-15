"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface ProposalRow {
  id: string;
  submitter_name: string | null;
  submitter_email: string | null;
  neighborhood: string | null;
  proposal_title: string;
  problem_description: string;
  proposed_solution: string;
  evidence_sources: string | null;
  wants_to_collaborate: boolean;
  status: string;
  internal_notes: string | null;
  created_at: string;
}

export default function AdminProposalsPage() {
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("proposal_submissions")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setProposals((data as ProposalRow[]) ?? []);
      } catch {
        toast.error("Failed to load proposals");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("proposal_submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function deleteProposal(id: string) {
    if (!confirm("Delete this proposal permanently?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("proposal_submissions").delete().eq("id", id);
      if (error) throw error;
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const statusOptions = ["new", "reviewing", "developing", "declined", "became_campaign"];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-forest">
        Policy Proposals
      </h1>

      {loading ? (
        <p className="mt-8 font-body text-sm text-warm-gray">Loading&hellip;</p>
      ) : proposals.length === 0 ? (
        <p className="mt-8 font-body text-sm text-warm-gray">
          No proposals submitted yet.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-cream"
            >
              {/* Header row */}
              <div
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() =>
                  setExpanded(expanded === p.id ? null : p.id)
                }
              >
                <div>
                  <p className="font-body text-sm font-medium text-ink">
                    {p.proposal_title}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-warm-gray">
                    {p.submitter_name ?? "Anonymous"} &middot;{" "}
                    {p.neighborhood ?? "No neighborhood"} &middot;{" "}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={p.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStatus(p.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border border-border bg-cream px-2 py-1 font-body text-xs text-ink focus:outline-none focus:ring-1 focus:ring-rust/30"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expanded detail */}
              {expanded === p.id && (
                <div className="border-t border-border px-5 py-4">
                  <div className="space-y-4">
                    <div>
                      <p className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                        Problem
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-ink/75">
                        {p.problem_description}
                      </p>
                    </div>
                    <div>
                      <p className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                        Proposed Solution
                      </p>
                      <p className="mt-1 font-body text-sm leading-relaxed text-ink/75">
                        {p.proposed_solution}
                      </p>
                    </div>
                    {p.evidence_sources && (
                      <div>
                        <p className="font-body text-xs font-semibold uppercase tracking-wider text-warm-gray">
                          Evidence / Sources
                        </p>
                        <p className="mt-1 font-body text-sm leading-relaxed text-ink/75">
                          {p.evidence_sources}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 font-body text-xs text-warm-gray">
                      {p.wants_to_collaborate && (
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-forest">
                          Wants to collaborate
                        </span>
                      )}
                      {p.submitter_email && (
                        <span>Contact: {p.submitter_email}</span>
                      )}
                      <button
                        onClick={() => deleteProposal(p.id)}
                        className="rounded bg-rust/10 px-2 py-0.5 text-rust hover:bg-rust/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
