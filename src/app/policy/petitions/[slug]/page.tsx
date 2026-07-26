import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageTransition from "@/components/layout/PageTransition";
import PetitionForm from "@/components/policy/PetitionForm";
import { getPetition } from "@/lib/petitions";
import { countSignatures, listPublicSigners } from "@/lib/petition-signatures";

/* ------------------------------------------------------------------ */
/*  Petition detail                                                    */
/*                                                                     */
/*  One page per bill. It answers four questions in order. What is     */
/*  this bill, what would it do, where does it sit, and what am I      */
/*  signing. The form needs no account.                                */
/* ------------------------------------------------------------------ */

/* Signature counts are read at request time, so this page never
   caches. PETITIONS still gates which slugs resolve at all. */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const petition = getPetition(slug);
  if (!petition) return { title: "Petition | Rooted Forward" };
  return {
    title: `${petition.title} | Rooted Forward`,
    description: petition.oneLiner,
  };
}

export default async function PetitionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const petition = getPetition(slug);
  if (!petition) notFound();

  const [{ count }, signers] = await Promise.all([
    countSignatures(slug),
    listPublicSigners(slug),
  ]);

  return (
    <PageTransition>
      {/* ============================================================
          WHAT THIS IS
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-12 pt-14 md:pb-16 md:pt-20">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            href="/policy"
            className="font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
          >
            &larr; All petitions
          </Link>
          <h1 className="mt-6 font-display text-4xl leading-[1.08] text-ink md:text-5xl">
            {petition.title}
          </h1>
          <p className="mt-5 font-body text-lg leading-relaxed text-ink/80">
            {petition.oneLiner}
          </p>

          <div className="mt-8 border-t border-border pt-6">
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
              The bill
            </p>
            <p className="mt-2 font-body text-base text-ink">
              {petition.billName}
              {petition.recordNumber && (
                <span className="text-ink/55"> ({petition.recordNumber})</span>
              )}
            </p>
            <p className="mt-4 font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
              Where it stands
            </p>
            <p className="mt-2 max-w-[62ch] font-body text-base leading-relaxed text-ink/75">
              {petition.whereItStands}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT IT WOULD DO
          ============================================================ */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            What it would do
          </h2>
          <div className="mt-6 flex flex-col gap-5">
            {petition.whatItWouldDo.map((para, i) => (
              <p
                key={i}
                className="max-w-[66ch] font-body text-base leading-relaxed text-ink/80 md:text-lg"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY WE ARE ASKING
          ============================================================ */}
      <section className="bg-forest py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl text-cream md:text-4xl">
            Why we are asking
          </h2>
          <div className="mt-6 flex flex-col gap-5">
            {petition.whyWeCareAboutIt.map((para, i) => (
              <p
                key={i}
                className="max-w-[66ch] font-body text-base leading-relaxed text-cream/80 md:text-lg"
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          THE FORM
          ============================================================ */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
            Addressed to
          </p>
          <p className="mt-2 font-body text-base text-ink">
            {petition.addressedTo}
          </p>

          <div className="mt-8">
            <PetitionForm
              slug={petition.slug}
              statement={petition.petitionStatement}
              initialCount={count}
            />
          </div>

          {signers.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <h2 className="font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
                Signed by
              </h2>
              <p className="mt-4 font-body text-sm leading-relaxed text-ink/70">
                {signers
                  .map((s) => (s.zip ? `${s.name} (${s.zip})` : s.name))
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          SOURCES. Every claim above is checkable here.
          ============================================================ */}
      <section className="border-t border-border bg-cream pb-20 pt-10">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
            Where our facts come from
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {petition.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-sm leading-relaxed text-forest underline decoration-border underline-offset-2 transition-colors hover:decoration-forest"
                >
                  {source.title}
                </a>
                <span className="font-body text-sm text-ink/55">
                  {" "}
                  {source.publisher}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageTransition>
  );
}
