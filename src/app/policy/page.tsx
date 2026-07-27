import Link from "next/link";
import type { Metadata } from "next";
import PageTransition from "@/components/layout/PageTransition";
import { PETITIONS } from "@/lib/petitions";
import { countSignaturesFor } from "@/lib/petition-signatures";

/* ------------------------------------------------------------------ */
/*  Policy                                                             */
/*                                                                     */
/*  This page used to carry four mechanisms, a campaign system, a      */
/*  grid of eight learning cards, a nine-link reference dump, and a    */
/*  proposal pitch. A visitor could not tell what they were meant to   */
/*  do. It was cut back to one job (owner, July 2026). Sign a          */
/*  petition on a bill that is live in a Chicago committee right now.  */
/*                                                                     */
/*  Everything that was removed still exists at its own route. The     */
/*  guides live under /policy/guides/<slug>, the campaign system       */
/*  under /policy/campaigns/<slug>, and proposals at                   */
/*  /policy/submit-proposal. Nothing was deleted, only unlinked from   */
/*  the front door, so any of it can come back as a section here.      */
/* ------------------------------------------------------------------ */

/* Signature counts are read at request time. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policy | Rooted Forward",
  description:
    "Sign a petition on a Chicago housing or environmental bill that is sitting in committee right now, and learn how to send the city a public comment yourself.",
};

/* The comment tools, trimmed to the four a first-timer actually needs.
   The full set of guides is still at /policy/guides/<slug>. */
const COMMENT_TOOLS = [
  {
    title: "Write a comment to City Council",
    line: "What to say, how long it should be, and where to send it.",
    href: "/policy/guides/submit-public-comment-city-council",
    external: false,
  },
  {
    title: "File an Illinois witness slip",
    line: "Register where you stand on a state bill. It takes two minutes.",
    href: "/policy/guides/written-testimony-illinois-general-assembly",
    external: false,
  },
  {
    title: "Comment on a zoning change near you",
    line: "For when someone applies to build something your block did not ask for.",
    href: "/policy/guides/submit-comment-zoning-change",
    external: false,
  },
  {
    title: "Find your alderperson",
    line: "Look up your ward and who represents it, by address.",
    href: "https://www.chicago.gov/city/en/depts/mayor/iframe/lookup_ward_and_alderman.html",
    external: true,
  },
];

export default async function PolicyPage() {
  const open = PETITIONS.filter((p) => p.status === "open");
  const counts = await countSignaturesFor(open.map((p) => p.slug));

  return (
    <PageTransition>
      {/* ============================================================
          WHAT THIS PAGE IS FOR
          ============================================================ */}
      <section className="border-b border-border bg-cream pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="max-w-[18ch] font-display text-4xl font-semibold leading-[1.03] tracking-tight text-forest md:text-6xl">
            Sign a petition
          </h1>
          <p className="mt-6 max-w-[56ch] font-body text-lg leading-relaxed text-ink/80">
            These are petitions for bills aldermen have already proposed.
            Signing one shows support from residents of the area. We give the
            signatures to the committee reviewing the bill, along with a public
            comment from Rooted Forward.
          </p>
          <p className="mt-4 font-body text-base text-ink/60">
            No account. About a minute.
          </p>
        </div>
      </section>

      {/* ============================================================
          THE PETITIONS
          ============================================================ */}
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          {open.length === 0 ? (
            <p className="max-w-[56ch] font-body text-lg leading-relaxed text-ink/75">
              Nothing is open for signatures right now. Check back, or write to
              us at{" "}
              <a
                href="mailto:contact@rooted-forward.org"
                className="text-forest underline decoration-border underline-offset-2 transition-colors hover:decoration-forest"
              >
                contact@rooted-forward.org
              </a>{" "}
              if there is a bill you think we should be on.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              {open.map((petition) => {
                const count = counts[petition.slug] ?? null;
                return (
                  <Link
                    key={petition.slug}
                    href={`/policy/petitions/${petition.slug}`}
                    className="group block rounded-sm border-2 border-border bg-cream p-7 transition-colors hover:border-forest md:p-10"
                  >
                    {/* The city a bill actually affects, stated first and
                        stated loudly, so nobody signs the wrong city's
                        petition (owner, July 2026). */}
                    <span className="inline-block rounded-sm bg-forest px-4 py-2 font-body text-base font-bold uppercase tracking-[0.2em] text-cream">
                      {petition.city}
                    </span>
                    <p className="mt-4 font-body text-xs font-semibold uppercase tracking-widest text-rust">
                      {petition.billName}
                      {petition.recordNumber && ` · ${petition.recordNumber}`}
                    </p>
                    <h2 className="mt-3 max-w-[24ch] font-display text-3xl leading-tight text-forest transition-colors group-hover:text-rust md:text-4xl">
                      {petition.title}
                    </h2>
                    <p className="mt-4 max-w-[62ch] font-body text-lg leading-relaxed text-ink/80">
                      {petition.oneLiner}
                    </p>
                    <p className="mt-5 max-w-[62ch] font-body text-sm leading-relaxed text-ink/60">
                      {petition.whereItStands}
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <span className="inline-flex items-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors group-hover:bg-rust-dark">
                        Read it and sign
                      </span>
                      {count !== null && count > 0 && (
                        <span className="font-body text-sm font-semibold uppercase tracking-widest text-ink/60">
                          {count.toLocaleString()}{" "}
                          {count === 1 ? "signature" : "signatures"}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          DOING IT YOURSELF. Four rows, one line each. The old
          version of this block had eight icon cards and nine
          reference links, which nobody read.
          ============================================================ */}
      <section className="bg-forest py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="max-w-[20ch] font-display text-3xl leading-tight text-cream md:text-5xl">
            How to send the city a comment
          </h2>
          <p className="mt-5 max-w-[56ch] font-body text-base leading-relaxed text-cream/75 md:text-lg">
            A comment goes into the public record and gets read by the people
            voting. These four guides are written for someone doing it for the
            first time.
          </p>

          <div className="mt-10 border-t border-cream/20">
            {COMMENT_TOOLS.map((tool) => {
              const inner = (
                <>
                  <div className="md:col-span-7">
                    <h3 className="font-display text-xl text-cream transition-colors group-hover:text-rust-light md:text-2xl">
                      {tool.title}
                    </h3>
                  </div>
                  <div className="md:col-span-5">
                    <p className="font-body text-base leading-relaxed text-cream/70">
                      {tool.line}
                    </p>
                  </div>
                </>
              );
              const cls =
                "group grid grid-cols-1 items-baseline gap-y-2 border-b border-cream/20 py-6 md:grid-cols-12 md:gap-x-10";
              return tool.external ? (
                <a
                  key={tool.href}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <Link key={tool.href} href={tool.href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          SUGGEST A BILL
          This was a grey line of small print at the bottom and
          nobody would have seen it (owner, July 2026). It is a
          section with a button now.
          ============================================================ */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-sm border-2 border-border bg-cream-dark p-8 md:p-12">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-7">
                <h2 className="font-display text-3xl leading-tight text-forest md:text-4xl">
                  Know a bill we should be on?
                </h2>
                <p className="mt-4 max-w-[52ch] font-body text-base leading-relaxed text-ink/75 md:text-lg">
                  Tell us about it. It can be a bill sitting in a committee, or
                  a problem on your block that nobody has written a bill for
                  yet. We read every one that comes in.
                </p>
              </div>
              <div className="md:col-span-5 md:text-right">
                <Link
                  href="/policy/submit-proposal"
                  className="inline-flex items-center rounded-sm bg-rust px-8 py-4 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
                >
                  Send it to us
                </Link>
                <p className="mt-4 font-body text-sm text-ink/60">
                  Or write to{" "}
                  <a
                    href="mailto:contact@rooted-forward.org"
                    className="text-forest underline decoration-border underline-offset-2 transition-colors hover:decoration-forest"
                  >
                    contact@rooted-forward.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
