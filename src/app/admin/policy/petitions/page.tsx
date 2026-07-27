import Link from "next/link";
import { PETITIONS } from "@/lib/petitions";
import { fallbackChapter } from "@/lib/petition-signatures";
import PetitionSignaturesTable, {
  type AdminSignature,
} from "@/components/policy/PetitionSignaturesTable";

/* ------------------------------------------------------------------ */
/*  /admin/policy/petitions                                            */
/*                                                                     */
/*  Every signature, per petition, with the emails visible because     */
/*  this is behind the admin gate. Read on the server with the         */
/*  service role, since petition_signatures blocks every non-admin     */
/*  read and the rows carry email addresses.                           */
/*                                                                     */
/*  Two sources on purpose. The real table once migration 009 is       */
/*  applied, and the submissions rows the API parks signatures in      */
/*  until then. Both are shown together and labelled, so the count     */
/*  here always matches the count on the public page.                  */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("petition") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

interface PetitionGroup {
  slug: string;
  title: string;
  billName: string;
  city: string;
  signatures: AdminSignature[];
  source: "table" | "fallback" | "none";
}

async function loadSignatures(): Promise<{
  groups: PetitionGroup[];
  migrationPending: boolean;
  configured: boolean;
}> {
  const { isSupabaseConfigured } = await import("@/lib/supabase/server");
  if (!isSupabaseConfigured()) {
    return {
      groups: PETITIONS.map((p) => ({
        slug: p.slug,
        title: p.title,
        billName: p.billName,
        city: p.city,
        signatures: [],
        source: "none" as const,
      })),
      migrationPending: true,
      configured: false,
    };
  }

  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();
  let migrationPending = false;

  const groups = await Promise.all(
    PETITIONS.map(async (p): Promise<PetitionGroup> => {
      const { data, error } = await supabase
        .from("petition_signatures")
        .select("signer_name, email, zip, residency, is_public, created_at")
        .eq("petition_slug", p.slug)
        .order("created_at", { ascending: false });

      if (!error) {
        return {
          slug: p.slug,
          title: p.title,
          billName: p.billName,
          city: p.city,
          source: "table",
          signatures: (data ?? []).map((r) => ({
            name: r.signer_name as string,
            email: r.email as string,
            zip: (r.zip as string | null) ?? null,
            residency: (r.residency as string | null) ?? null,
            isPublic: (r.is_public as boolean | null) ?? true,
            createdAt: r.created_at as string,
          })),
        };
      }

      if (!isMissingTable(error)) {
        console.error("[admin petitions] read failed:", error.message);
        return {
          slug: p.slug,
          title: p.title,
          billName: p.billName,
          city: p.city,
          source: "none",
          signatures: [],
        };
      }

      migrationPending = true;
      const { data: fb } = await supabase
        .from("submissions")
        .select("name, email, message, created_at")
        .eq("chapter", fallbackChapter(p.slug))
        .order("created_at", { ascending: false });

      return {
        slug: p.slug,
        title: p.title,
        billName: p.billName,
        city: p.city,
        source: "fallback",
        signatures: (fb ?? []).map((r) => {
          const body = String(r.message ?? "");
          const zip = body.match(/zip=(\d{5}(?:-\d{4})?)/);
          const res = body.match(/residency=(\w+)/);
          return {
            name: r.name as string,
            email: r.email as string,
            zip: zip ? zip[1] : null,
            residency: res ? res[1] : null,
            isPublic: !body.includes("public=no"),
            createdAt: r.created_at as string,
          };
        }),
      };
    })
  );

  return { groups, migrationPending, configured: true };
}

export default async function AdminPetitionsPage() {
  const { groups, migrationPending, configured } = await loadSignatures();
  const total = groups.reduce((n, g) => n + g.signatures.length, 0);

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-display text-3xl text-forest">Petition signatures</h1>
      <p className="mt-2 font-body text-sm text-ink/65">
        {total.toLocaleString()} {total === 1 ? "signature" : "signatures"} across{" "}
        {groups.length} {groups.length === 1 ? "petition" : "petitions"}.
      </p>

      {!configured && (
        <div className="mt-6 rounded-sm border border-rust/40 bg-rust/5 p-5">
          <p className="font-body text-sm leading-relaxed text-ink/80">
            Supabase is not configured in this environment, so nothing can be
            read here.
          </p>
        </div>
      )}

      {configured && migrationPending && (
        <div className="mt-6 rounded-sm border border-rust/40 bg-rust/5 p-5">
          <p className="font-body text-sm font-semibold text-rust">
            Migration 009 has not been applied yet
          </p>
          <p className="mt-2 max-w-[70ch] font-body text-sm leading-relaxed text-ink/75">
            Signatures are still being collected. Until the petition tables
            exist they are parked in the submissions table, and the rows below
            are read from there. To move to the real tables, open the Supabase
            SQL editor and run{" "}
            <code className="rounded bg-cream-dark px-1.5 py-0.5 font-mono text-xs">
              supabase/migrations/009_petitions.sql
            </code>
            , the same way 006 and 008 were applied. Nothing collected so far
            is lost when you do.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {groups.map((g) => (
          <section key={g.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="font-display text-xl text-forest">{g.title}</h2>
                <p className="mt-1 font-body text-xs uppercase tracking-widest text-ink/55">
                  {g.city} &middot; {g.billName} &middot;{" "}
                  {g.signatures.length}{" "}
                  {g.signatures.length === 1 ? "signature" : "signatures"}
                  {g.source === "fallback" && " (in submissions)"}
                </p>
              </div>
              <Link
                href={`/policy/petitions/${g.slug}`}
                className="font-body text-xs font-semibold uppercase tracking-widest text-rust hover:text-rust-dark"
              >
                View public page &rarr;
              </Link>
            </div>
            <div className="mt-4">
              <PetitionSignaturesTable
                signatures={g.signatures}
                slug={g.slug}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
