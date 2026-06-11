/* ------------------------------------------------------------------ */
/*  CitationsList                                                      */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Renders the bibliography at the bottom of a research detail page. */
/*                                                                     */
/*  Behaviour:                                                         */
/*  - Splits into Primary Sources and Secondary Sources if both types */
/*    are present in the citations array.                              */
/*  - Numbering is continuous across the two sections.                 */
/*  - Each entry has a hanging indent: first line flush, subsequent    */
/*    lines indented ~2em (standard academic format).                  */
/*  - If a citation has a url, the whole text links to that URL.       */
/*  - If a citation has an accessed_date, "Accessed {date}" is         */
/*    appended.                                                        */
/*  - Each entry gets id="citation-{id}" so in-body superscript        */
/*    references can anchor-link to it.                                */
/*  - A subtle back arrow next to each citation scrolls the reader     */
/*    back to where the citation was invoked in the body.              */
/*                                                                     */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import type { Citation } from "@/lib/types/database";

interface CitationsListProps {
  citations: Citation[];
}

function formatAccessedDate(raw: string | null): string | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function Entry({
  citation,
  number,
}: {
  citation: Citation;
  number: number;
}) {
  const accessed = formatAccessedDate(citation.accessed_date);
  const body = citation.text.trim();
  const fullText = accessed ? `${body} Accessed ${accessed}.` : body;

  return (
    <li
      id={`citation-${citation.id}`}
      className="grid grid-cols-[2.25rem_1fr] gap-x-2 scroll-mt-24 font-body text-[15px] leading-[1.7] text-ink/85"
    >
      <span className="font-mono text-[13px] text-warm-gray tabular-nums">
        {number}.
      </span>
      <div>
        {citation.url ? (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-transparent underline-offset-2 transition-colors hover:decoration-forest/50"
          >
            {fullText}
          </a>
        ) : (
          <span>{fullText}</span>
        )}

        {/* Back link — subtle, returns to the point in the body  */}
        <Link
          href={`#cite-ref-${citation.id}`}
          aria-label={`Jump back to the point in the article where citation ${citation.id} is used`}
          className="ml-1.5 inline-flex items-center align-middle text-warm-gray transition-colors hover:text-forest"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            />
          </svg>
        </Link>
      </div>
    </li>
  );
}

export default function CitationsList({ citations }: CitationsListProps) {
  if (!citations || citations.length === 0) return null;

  const primary = citations.filter((c) => c.type !== "secondary");
  const secondary = citations.filter((c) => c.type === "secondary");

  const hasBoth = primary.length > 0 && secondary.length > 0;
  let runningNumber = 0;

  return (
    <section
      id="citations"
      aria-labelledby="citations-heading"
      className="mt-16 border-t border-border pt-12"
    >
      <h2
        id="citations-heading"
        className="scroll-mt-24 font-display text-[28px] leading-tight text-forest md:text-[32px]"
      >
        Citations
      </h2>
      <p className="mt-3 font-body text-sm text-warm-gray">
        {citations.length} source{citations.length === 1 ? "" : "s"} cited.
      </p>

      {primary.length > 0 && (
        <div className="mt-8">
          {hasBoth && (
            <h3 className="font-display text-[18px] font-medium text-forest">
              Primary Sources
            </h3>
          )}
          <ol
            className={`flex flex-col gap-3 ${hasBoth ? "mt-4" : "mt-2"}`}
          >
            {primary.map((c) => {
              runningNumber += 1;
              return (
                <Entry key={c.id} citation={c} number={runningNumber} />
              );
            })}
          </ol>
        </div>
      )}

      {secondary.length > 0 && (
        <div className="mt-10">
          {hasBoth && (
            <h3 className="font-display text-[18px] font-medium text-forest">
              Secondary Sources
            </h3>
          )}
          <ol className={`flex flex-col gap-3 ${hasBoth ? "mt-4" : "mt-2"}`}>
            {secondary.map((c) => {
              runningNumber += 1;
              return (
                <Entry key={c.id} citation={c} number={runningNumber} />
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}
