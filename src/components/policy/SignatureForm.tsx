"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

interface SignatureFormProps {
  campaignId: string;
  campaignSlug: string;
}

export default function SignatureForm({ campaignId, campaignSlug }: SignatureFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [hasSigned, setHasSigned] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkExisting(session.user.id);
        fetchName(session.user.id);
      } else {
        setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkExisting(session.user.id);
        fetchName(session.user.id);
      } else {
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [campaignId]);

  async function fetchName(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .single<{ full_name: string | null }>();
    setUserName(data?.full_name ?? "");
  }

  async function checkExisting(userId: string) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("signatures")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("user_id", userId)
        .maybeSingle();
      setHasSigned(!!data);
    } catch {
      // Table may not exist yet
    } finally {
      setChecking(false);
    }
  }

  async function handleSign() {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/policy/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          is_public: isPublic,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to sign");
      }
      setHasSigned(true);
      toast.success("Your signature has been added.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign";
      if (message.includes("already")) {
        setHasSigned(true);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="border border-border bg-white/40 p-7">
        <p className="ledger text-warm-gray">Signature</p>
        <p className="mt-3 font-body text-sm text-warm-gray">Loading&hellip;</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border border-border bg-white/40 p-7">
        <p className="ledger text-warm-gray">Signature</p>
        <h3 className="mt-3 font-display text-xl text-forest">Add Your Signature</h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
          Sign in to add your name to this campaign.
        </p>
        <Link
          href={`/auth/login?redirect=/policy/campaigns/${campaignSlug}`}
          className="mt-5 inline-flex items-center rounded-sm bg-rust px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (hasSigned) {
    return (
      <div className="border border-border bg-white/40 p-7">
        <p className="ledger text-warm-gray">Signature</p>
        <h3 className="mt-3 font-display text-xl text-forest">Signed</h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
          You&rsquo;ve signed this campaign. Thank you.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border bg-white/40 p-7">
      <p className="ledger text-warm-gray">Signature</p>
      <h3 className="mt-3 font-display text-xl text-forest">Add Your Signature</h3>
      {userName && (
        <p className="mt-2 font-body text-sm text-ink/65">
          Signing as <span className="font-medium text-ink">{userName}</span>.{" "}
          <Link href="/account" className="text-rust underline decoration-rust/30 underline-offset-2 hover:decoration-rust">
            Edit profile
          </Link>
        </p>
      )}
      <label className="mt-5 flex items-center gap-2.5 border-t border-border pt-5 font-body text-sm text-ink/75">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
        />
        Display my name publicly on this campaign
      </label>
      <button
        onClick={handleSign}
        disabled={loading}
        className="mt-5 w-full rounded-sm bg-rust px-5 py-3 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
      >
        {loading ? "Signing\u2026" : "Sign This Campaign"}
      </button>
    </div>
  );
}
