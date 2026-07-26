/* ------------------------------------------------------------------ */
/*  petition-signatures.ts                                             */
/*                                                                     */
/*  Server-only reads over the petition_signatures table. Import this  */
/*  from server components and route handlers only. The rows hold      */
/*  email addresses, so nothing here returns an email, and the         */
/*  service-role client it reaches for is server-side by construction  */
/*  (createAdminClient reads next/headers cookies and the service key, */
/*  neither of which exists in the browser). The service role is used  */
/*  on purpose, because the table's RLS blocks every read that is not  */
/*  an admin.                                                          */
/*                                                                     */
/*  Every function degrades quietly. If Supabase is not configured or  */
/*  migration 009 has not been applied, the count comes back null and  */
/*  the page renders without a number rather than failing.             */
/* ------------------------------------------------------------------ */

export interface SignatureCount {
  /** null means we genuinely do not know, not zero. */
  count: number | null;
  migrationPending?: true;
}

export interface PublicSigner {
  /** First name plus last initial. The full name never leaves here. */
  name: string;
  zip: string | null;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("petition") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

/** Shorten "Ada Lovelace" to "Ada L." so the wall of names is not a mailing list. */
function shorten(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? "";
  const last = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(" ")} ${last.charAt(0).toUpperCase()}.`;
}

export async function countSignatures(slug: string): Promise<SignatureCount> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) return { count: null, migrationPending: true };

  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { count, error } = await supabase
      .from("petition_signatures")
      .select("id", { count: "exact", head: true })
      .eq("petition_slug", slug);

    if (error) {
      if (isMissingTable(error)) return { count: null, migrationPending: true };
      console.error("[petitions] count failed:", error.message);
      return { count: null };
    }
    return { count: count ?? 0 };
  } catch (err) {
    console.error("[petitions] count exception:", err);
    return { count: null };
  }
}

/** Counts for several petitions at once, keyed by slug. */
export async function countSignaturesFor(
  slugs: string[]
): Promise<Record<string, number | null>> {
  const entries = await Promise.all(
    slugs.map(async (slug) => [slug, (await countSignatures(slug)).count] as const)
  );
  return Object.fromEntries(entries);
}

/** Signers who asked to be shown, newest first. Names are shortened. */
export async function listPublicSigners(
  slug: string,
  limit = 60
): Promise<PublicSigner[]> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) return [];

  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("petition_signatures")
      .select("signer_name, zip")
      .eq("petition_slug", slug)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (!isMissingTable(error)) {
        console.error("[petitions] signer list failed:", error.message);
      }
      return [];
    }

    return (data ?? []).map((row) => ({
      name: shorten(row.signer_name as string),
      zip: (row.zip as string | null) ?? null,
    }));
  } catch (err) {
    console.error("[petitions] signer list exception:", err);
    return [];
  }
}
