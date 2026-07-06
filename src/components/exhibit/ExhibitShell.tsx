import Link from "next/link";
import ExhibitApp from "./ExhibitApp";

/* ------------------------------------------------------------------ */
/*  Server shell for The Ground Keeps Moving. Renders the crawlable    */
/*  breadcrumb, title, and dek, then mounts the client exhibit. This   */
/*  page intentionally skips PageTransition; QC screenshots must       */
/*  capture real frames.                                               */
/* ------------------------------------------------------------------ */

export const EXHIBIT_TITLE = "The Ground Keeps Moving";
export const EXHIBIT_KICKER = "Hyde Park, 1832 to 2026";
export const EXHIBIT_DEK =
  "A guided, interactive history of one Chicago neighborhood and the five machines that built the racial wealth gap. Redlining, urban renewal, land contracts, restrictive covenants, and the realtors' code, told on the ground where they ran, with the people who fought back.";

export default function ExhibitShell() {
  return (
    <div className="exhibit-root min-h-screen">
      <section className="pt-20 md:pt-24">
        <div className="mx-auto max-w-6xl px-6">
          <nav aria-label="Breadcrumb">
            <ol className="exh-plat flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-exh-ink-soft">
              {/* py-1.5 with the negative margin keeps the visual line
                  height while lifting the links past the 24px target
                  minimum (A4 accessibility) */}
              <li>
                <Link
                  href="/tours"
                  className="-my-1.5 inline-flex min-h-6 items-center py-1.5 transition-colors hover:text-exh-ink"
                >
                  Tours
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li>
                <Link
                  href="/tours/chicago"
                  className="-my-1.5 inline-flex min-h-6 items-center py-1.5 transition-colors hover:text-exh-ink"
                >
                  Chicago
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li className="font-semibold text-exh-ink">{EXHIBIT_TITLE}</li>
            </ol>
          </nav>
          {/* Crawlable summary; the client app repeats the title inside the mode gate */}
          <header className="sr-only">
            <p>{EXHIBIT_KICKER}</p>
            <h1>{EXHIBIT_TITLE}</h1>
            <p>{EXHIBIT_DEK}</p>
            <p>
              This exhibit documents racial terrorism, including bombings and the killing of a
              teenager. No graphic imagery is shown. A full text transcript is available inside
              the exhibit.
            </p>
          </header>
        </div>
      </section>
      <ExhibitApp />
    </div>
  );
}
