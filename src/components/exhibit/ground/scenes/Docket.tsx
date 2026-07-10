"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "Docket", the Empty Column. All 40 incidents the 1922     */
/*  commission appendix documents individually, as a real HTML table.  */
/*  The record's own targets lead each row (the commission names who   */
/*  it bombed even though it names no victim), the address sits under  */
/*  the name in the plat face, and repeat attacks at one location      */
/*  carry the count the data itself supports. Every conviction cell    */
/*  is bordered and visually blank; screen readers hear "No            */
/*  conviction recorded." on each. Dates render as filed: null dates   */
/*  say "Before 1919" (the passage's own precision), month-only        */
/*  dates stay month-only, computed dates say "About". The fatal row   */
/*  carries its one quiet sourced line so the closing sentence and     */
/*  the record meet in the same place. The header row stays sticky     */
/*  beneath the stage pane for the table's five screens, and the       */
/*  totals live in one colspan summary cell so assistive tech never    */
/*  hears a figure bound to the wrong column. No motion, no hover,     */
/*  no transitions anywhere in this scene; a full viewport of dark     */
/*  air sits before and after the table. The two dead are counted,     */
/*  not named, because the record names neither; that absence is       */
/*  part of the record.                                                */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";
import type { SceneProps } from "./registry";
import bombingsJson from "../../../../../public/exhibit-data/bombings.json";
import FactValue from "../../shared/FactValue";
import SourceSup, { SourceSupGroup } from "../../shared/SourceSup";

interface DocketIncident {
  id: string;
  date: string | null;
  dateApproximate?: boolean;
  address: string | null;
  target: string;
  precision: string;
  locator: string;
  deaths?: number;
  geo: { lat: number; lng: number } | null;
}

const INCIDENTS: DocketIncident[] = (
  bombingsJson as unknown as { incidents: DocketIncident[] }
).incidents;

/* computed from the rows themselves so the reconciling line can never
   drift from the table it describes */
const PLACED = INCIDENTS.filter((i) => i.geo != null);
const AT_ADDRESS = PLACED.filter((i) => i.precision === "address").length;
const AT_BLOCK = PLACED.filter((i) => i.precision === "block").length;

/* repeat attacks at one location, counted by identical address key in
   the data (the same counting the incident notes use, "Bombing 2 of 2
   at this location"); no ordinal appears that the data cannot support.
   Counted in render order so an ordinal never precedes its first. */
const ORDINAL_WORDS = ["second", "third", "fourth", "fifth", "sixth", "seventh"];
const REPEAT_NOTE = new Map<string, string>();

/* Render order follows the record's own chronology. Dated rows sort by
   their ISO date; the undated "Before 1919" rows sit as a cluster after
   the last 1918 date and before January 1919 (their true precision),
   keeping file order within the cluster. Without this, nine undated
   rows would open the table ahead of the July 1917 Motley bombing the
   record itself calls the earliest. Display only; no data changes. */
const ORDERED_INCIDENTS: DocketIncident[] = [...INCIDENTS].sort((a, b) => {
  const key = (i: DocketIncident) => (i.date ? i.date : "1918-12-31");
  const ka = key(a);
  const kb = key(b);
  if (ka !== kb) return ka < kb ? -1 : 1;
  return INCIDENTS.indexOf(a) - INCIDENTS.indexOf(b);
});
{
  const seen = new Map<string, number>();
  for (const incident of ORDERED_INCIDENTS) {
    if (!incident.address) continue;
    const n = (seen.get(incident.address) ?? 0) + 1;
    seen.set(incident.address, n);
    if (n >= 2 && n <= ORDINAL_WORDS.length + 1) {
      REPEAT_NOTE.set(incident.id, `${ORDINAL_WORDS[n - 2]} attack here`);
    }
  }
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** the date as the record supports it, never more precise */
function filedDate(date: string | null, approximate?: boolean): string {
  if (!date) return "Before 1919";
  const [y, m, d] = date.split("-");
  if (!m) return y;
  const month = MONTHS[parseInt(m, 10) - 1] ?? "";
  if (!d) return `${month} ${y}`;
  const day = parseInt(d, 10);
  return `${approximate ? "About " : ""}${month} ${day}, ${y}`;
}

/** the record's target, cleaned of editorial apparatus for the cell;
 *  the detail stays reachable through the row's source tap. Returned
 *  in two pieces so the citation dagger can ride the last word and
 *  never wrap onto a line of its own. */
function targetLine(target: string): { head: string; last: string } {
  const main = target.split(" (")[0].split(";")[0].trim();
  const cased = main.charAt(0).toUpperCase() + main.slice(1);
  const cut = cased.lastIndexOf(" ");
  if (cut < 0) return { head: "", last: cased };
  return { head: cased.slice(0, cut + 1), last: cased.slice(cut + 1) };
}

/** addresses print without parenthetical apparatus; the fatal row's
 *  address conflict moves into its source note below */
function addressLine(address: string | null): string | null {
  if (!address) return null;
  return address.split(" (")[0].trim();
}

/** per-row citation. Same report, the row's own locator; the fatal
 *  row's note carries the commission's internal address conflict. */
function rowSource(incident: DocketIncident) {
  const conflict =
    incident.id === "b-indiana-3365-child-killed"
      ? " The commission's press chapter dates this bombing May 1, 1919 and gives the address as 3401 Indiana Ave, one block north; its illustration caption gives 3365 Indiana Ave. Treated as one event."
      : "";
  return {
    title: "The Negro in Chicago",
    author: "Chicago Commission on Race Relations",
    year: 1922,
    url: "https://www.gutenberg.org/ebooks/57343",
    locator: `${incident.locator}${conflict}`,
  };
}

/* border-separate scheme so the sticky header keeps its rules while
   the rows scroll under it (collapsed borders travel with the table) */
const CELL = "border-b border-r border-exh-ink/25 px-2 py-1.5 align-top text-left";
const HEAD =
  "exh-plat border-t bg-exh-linen text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft";

export default function Docket(_props: SceneProps) {
  /* the header row parks beneath the sticky stage pane on phones; on
     the split desktop layout the steps column starts at the top edge */
  const [theadTop, setTheadTop] = useState(0);
  useEffect(() => {
    const measure = () => {
      const pane = document.querySelector<HTMLElement>('[data-testid="ground-stage-pane"]');
      const split = window.matchMedia("(min-width: 1024px)").matches;
      setTheadTop(!split && pane ? Math.ceil(pane.getBoundingClientRect().height) : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section
      data-testid="scene-docket"
      aria-label="The docket. Bombings recorded by the Chicago Commission on Race Relations, 1917 to 1921"
      className="pb-[80svh] pt-[80svh]"
    >
      <p className="max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        From July 1917 to March 1921 the commission recorded 58 bombings. Its
        report documents 40 of them one by one, and this table holds all 40. The
        map can place {PLACED.length}, {AT_ADDRESS} at a street address and{" "}
        {AT_BLOCK} at a block. Across all 58 the record shows 2 arrests. No
        convictions.
        <SourceSupGroup
          factIds={[
            "bombings.total_58",
            "bombings.pins_located",
            "bombings.arrests_2",
            "bombings.convictions_0",
          ]}
        />
      </p>

      <p className="mt-6 max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        The commission measured the pace itself, an average of one race bombing
        every twenty days for three years and eight months.
        <SourceSup factId="bombings.pace_20_days" />
      </p>

      <p className="exh-plat mt-6 max-w-[34rem] text-[11px] uppercase leading-snug tracking-[0.14em] text-exh-ink-soft">
        The dashed square on the map is the commission&rsquo;s own. Thirty-two
        of the fifty-eight bombs fell within the square bounded by Forty-first
        and Sixtieth streets, Cottage Grove Avenue and State Street.
        <SourceSup factId="bombings.square_32" />
      </p>

      <table className="mt-10 w-full border-separate border-spacing-0">
        <caption className="sr-only">
          One row per incident the commission&rsquo;s report documents, target
          and address as the record gives them. The conviction column is blank
          in every row.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              style={{ top: theadTop }}
              className={`${CELL} ${HEAD} sticky z-[5] w-[7rem] border-l`}
            >
              Date
            </th>
            <th scope="col" style={{ top: theadTop }} className={`${CELL} ${HEAD} sticky z-[5]`}>
              Target
            </th>
            <th
              scope="col"
              style={{ top: theadTop }}
              className={`${CELL} ${HEAD} sticky z-[5] w-[5.5rem]`}
            >
              Conviction
            </th>
          </tr>
        </thead>
        <tbody>
          {ORDERED_INCIDENTS.map((incident) => {
            const address = addressLine(incident.address);
            const repeat = REPEAT_NOTE.get(incident.id);
            const target = targetLine(incident.target);
            return (
              <tr key={incident.id}>
                <td className={`${CELL} exh-mono border-l text-xs text-exh-ink`}>
                  {filedDate(incident.date, incident.dateApproximate)}
                </td>
                <td className={`${CELL} break-words`}>
                  <span className="text-sm text-exh-ink">
                    {target.head}
                    <span className="whitespace-nowrap">
                      {target.last}
                      <SourceSup source={rowSource(incident)} />
                    </span>
                  </span>
                  {address && !incident.target.includes(address) && (
                    <span className="exh-mono mt-0.5 block text-xs text-exh-ink-soft">
                      {address}
                    </span>
                  )}
                  {!address && (
                    <span className="exh-mono mt-0.5 block text-xs text-exh-ink-soft">
                      No address recorded
                    </span>
                  )}
                  {repeat && (
                    <span className="exh-mono mt-0.5 block text-[11px] text-exh-ink-soft">
                      {repeat}
                    </span>
                  )}
                  {(incident.deaths ?? 0) > 0 && (
                    <span className="mt-1 block text-sm text-exh-ink">
                      A six-year-old child was killed here.
                      <SourceSup factId="bombings.deaths_2" />
                    </span>
                  )}
                </td>
                <td className={CELL}>
                  <span className="sr-only">No conviction recorded.</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={3}
              className={`${CELL} border-l border-t-2 border-t-exh-ink/50`}
            >
              <span className="sr-only">Totals for the full survey period.</span>
              <span className="flex flex-wrap gap-x-6 gap-y-1">
                <FactValue id="bombings.total_58" size="sm" />
                <FactValue id="bombings.deaths_2" size="sm" />
                <FactValue id="bombings.convictions_0" size="sm" />
              </span>
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-10 max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        The record counts the dead. It names neither; one was a child of six.
        <SourceSup factId="bombings.deaths_2" />
      </p>

      {/* the record's own line of refusal closes the chapter */}
      <p className="mt-6 max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        The commission recorded the answer the bombing years got.{" "}
        <span lang="en">
          &ldquo;Only two of the forty Negro families bombed have moved; the
          others have made repairs, secured private watchmen or themselves kept
          vigil for night bombers, and still occupy the properties.&rdquo;
        </span>
        <SourceSup factId="bombings.families_stayed" />
      </p>
    </section>
  );
}
