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

/* ------------------------------------------------------------------ */
/*  Fallback store                                                     */
/*                                                                     */
/*  Migration 009 has to be pasted into the Supabase SQL editor by     */
/*  hand, the same as 006 and 008, and until somebody does that the    */
/*  petition tables do not exist. Rather than lose signatures in the   */
/*  meantime they go into the `submissions` table, which is already    */
/*  there and already has an admin view.                               */
/*                                                                     */
/*  `submissions.type` is constrained to volunteer or contact, so a    */
/*  signature is a contact row tagged in `chapter`. Curriculum         */
/*  requests already use this exact trick, so it is the house pattern  */
/*  rather than a new one.                                             */
/*                                                                     */
/*  Once 009 is applied the real table wins and these rows stay put    */
/*  as history. Nothing has to be migrated.                            */
/* ------------------------------------------------------------------ */
export const FALLBACK_CHAPTER_PREFIX = "petition:";

export function fallbackChapter(slug: string): string {
  return `${FALLBACK_CHAPTER_PREFIX}${slug}`;
}

export interface SignatureCount {
  /** null means we genuinely do not know, not zero. */
  count: number | null;
  /** true when the count came from the fallback store. */
  fallback?: true;
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

    // head:true means the 404 for a missing table comes back with no
    // body, so supabase-js has nothing to read PGRST205 out of and
    // hands back count null with error null. Treat a null count as a
    // failed read rather than as zero signatures.
    if (error || count === null) {
      if (!error || isMissingTable(error)) return countFallback(slug);
      console.error("[petitions] count failed:", error.message);
      return { count: null };
    }
    return { count };
  } catch (err) {
    console.error("[petitions] count exception:", err);
    return { count: null };
  }
}

/** Signatures parked in `submissions` because 009 is not applied yet. */
async function countFallback(slug: string): Promise<SignatureCount> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { count, error } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("chapter", fallbackChapter(slug));

    if (error) {
      console.error("[petitions] fallback count failed:", error.message);
      return { count: null, migrationPending: true };
    }
    return { count: count ?? 0, fallback: true, migrationPending: true };
  } catch (err) {
    console.error("[petitions] fallback count exception:", err);
    return { count: null, migrationPending: true };
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
      if (isMissingTable(error)) return listPublicSignersFallback(slug, limit);
      console.error("[petitions] signer list failed:", error.message);
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

/* The fallback rows keep their flags inside the message body, so the
   public list only shows the ones that opted in. */
async function listPublicSignersFallback(
  slug: string,
  limit: number
): Promise<PublicSigner[]> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("name, message")
      .eq("chapter", fallbackChapter(slug))
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[petitions] fallback signer list failed:", error.message);
      return [];
    }

    return (data ?? [])
      .filter((row) => !String(row.message ?? "").includes("public=no"))
      .map((row) => {
        const zip = String(row.message ?? "").match(/zip=(\d{5}(?:-\d{4})?)/);
        return { name: shorten(row.name as string), zip: zip ? zip[1] : null };
      });
  } catch (err) {
    console.error("[petitions] fallback signer list exception:", err);
    return [];
  }
}
