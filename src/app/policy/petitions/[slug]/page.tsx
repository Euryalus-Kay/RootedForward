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
/*  Rebuilt July 2026. The first version explained in paragraphs and   */
/*  read as written-by-a-machine. The page runs in one order now.      */
/*  Where the bill stands, what it would do as a plain list, a link    */
/*  box to read the bill on a city site, why we are asking as another  */
/*  plain list, then the form. Every line in a list is one short       */
/*  sentence a person could say out loud.                              */
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

/* A checkmark for the "what it would do" list and a dot for the
   "why this matters" list, so the two read as different kinds of
   claim rather than one long undifferentiated set of bullets. */
function CheckMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="mt-1 h-5 w-5 flex-shrink-0 text-forest"
    >
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
          THE BILL AND WHERE IT STANDS
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-12 pt-12 md:pb-16 md:pt-16">
        <div className="mx-auto max-w-3xl px-6">
          {/* Own line. These two used to collide on narrow screens. */}
          <div>
            <Link
              href="/policy"
              className="font-body text-xs font-semibold uppercase tracking-widest text-rust transition-colors hover:text-rust-dark"
            >
              &larr; All petitions
            </Link>
          </div>

          <span className="mt-7 inline-block rounded-sm bg-forest px-4 py-2 font-body text-base font-bold uppercase tracking-[0.2em] text-cream">
            {petition.city}
          </span>

          <h1 className="mt-6 font-display text-4xl leading-[1.08] text-ink md:text-5xl">
            {petition.title}
          </h1>
          <p className="mt-5 font-body text-lg leading-relaxed text-ink/80">
            {petition.oneLiner}
          </p>

          <div className="mt-9 rounded-sm border border-border bg-cream-dark p-6 md:p-7">
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
              The bill
            </p>
            <p className="mt-2 font-body text-base font-medium text-ink">
              {petition.billName}
              {petition.recordNumber && (
                <span className="font-normal text-ink/55"> ({petition.recordNumber})</span>
              )}
            </p>
            <p className="mt-5 font-body text-xs font-semibold uppercase tracking-widest text-ink/55">
              Where it stands
            </p>
            <p className="mt-2 font-body text-base leading-relaxed text-ink/75">
              {petition.whereItStands}
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT IT WOULD DO. A list, not an essay.
          ============================================================ */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-display text-3xl text-forest md:text-4xl">
            What it would do
          </h2>
          <ul className="mt-7 flex flex-col gap-4">
            {petition.whatItWouldDo.map((line) => (
              <li key={line} className="flex gap-3.5">
                <CheckMark />
                <span className="font-body text-base leading-relaxed text-ink/85 md:text-lg">
                  {line}
                </span>
              </li>
            ))}
          </ul>

          {/* Read it yourself, on the city's own site. */}
          {petition.readTheBill.length > 0 && (
            <div className="mt-10 rounded-sm border-2 border-forest/25 bg-cream-dark p-6 md:p-7">
              <h3 className="font-display text-xl text-forest">
                Read the proposal yourself
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                Do not take our word for any of this.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {petition.readTheBill.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="font-body text-base font-medium text-forest transition-colors group-hover:text-rust">
                      {link.label}{" "}
                      <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                        &rarr;
                      </span>
                    </span>
                    <span className="flex-shrink-0 font-body text-xs text-ink/50">
                      {link.publisher}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          WHY WE ARE ASKING. Attributed on its face, so a reader can
          tell our argument apart from the bill's contents.
          ============================================================ */}
      <section className="bg-forest py-14 md:py-18">
        <div className="mx-auto max-w-3xl px-6">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust-light">
            From Rooted Forward
          </p>
          <h2 className="mt-3 font-display text-3xl text-cream md:text-4xl">
            Why this matters
          </h2>
          <ul className="mt-7 flex flex-col gap-4">
            {petition.whyWeCareAboutIt.map((line) => (
              <li key={line} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-[0.6rem] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rust-light"
                />
                <span className="font-body text-base leading-relaxed text-cream/85 md:text-lg">
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================
          THE FORM
          ============================================================ */}
      <section className="bg-cream py-14 md:py-18">
        <div className="mx-auto max-w-3xl px-6">
          <PetitionForm
            slug={petition.slug}
            city={petition.city}
            addressedTo={petition.addressedTo}
            statement={petition.petitionStatement}
            initialCount={count}
          />

          {signers.length > 0 && (
            <div className="mt-10 border-t border-border pt-8">
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
        <div className="mx-auto max-w-3xl px-6">
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
