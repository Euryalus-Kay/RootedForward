"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "Docket", the Empty Column. All 40 incidents the 1922     */
/*  commission appendix documents individually, as a real HTML table.  */
/*  Every outcome cell is bordered and visually blank; screen readers  */
/*  hear "No conviction recorded." on each. Dates render as filed:     */
/*  null dates say "Before 1919" (the passage's own precision),        */
/*  month-only dates stay month-only, computed dates say "About".      */
/*  No motion, no hover, no transitions anywhere in this scene; a      */
/*  full viewport of dark air sits before and after the table. The     */
/*  two dead are counted, not named, because the record names          */
/*  neither; that absence is part of the record.                       */
/* ------------------------------------------------------------------ */
import type { SceneProps } from "./registry";
import bombingsJson from "../../../../../public/exhibit-data/bombings.json";
import FactValue from "../../shared/FactValue";
import SourceSup, { SourceSupGroup } from "../../shared/SourceSup";

interface DocketIncident {
  id: string;
  date: string | null;
  dateApproximate?: boolean;
  address: string | null;
}

const INCIDENTS: DocketIncident[] = (
  bombingsJson as unknown as { incidents: DocketIncident[] }
).incidents;

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

const CELL = "border border-exh-ink/25 px-2 py-1.5 align-top text-left";

export default function Docket(_props: SceneProps) {
  return (
    <section
      data-testid="scene-docket"
      aria-label="The docket. Bombings recorded by the Chicago Commission on Race Relations, 1917 to 1921"
      className="pb-[80svh] pt-[80svh]"
    >
      <p className="max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        The commission recorded 58 bombings. Its appendix lists 40; 32 carry an
        address the map can place, some outside the square.
        <SourceSupGroup
          factIds={["bombings.total_58", "bombings.pins_located", "bombings.square_32"]}
        />
      </p>

      <table className="mt-10 w-full border-collapse">
        <caption className="sr-only">
          One row per incident in the commission&rsquo;s appendix. The outcome
          column is blank in every row.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className={`${CELL} exh-plat w-[7.5rem] text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft`}
            >
              Date
            </th>
            <th
              scope="col"
              className={`${CELL} exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft`}
            >
              Address
            </th>
            <th
              scope="col"
              className={`${CELL} exh-plat w-[5.5rem] text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft`}
            >
              Outcome
            </th>
          </tr>
        </thead>
        <tbody>
          {INCIDENTS.map((incident) => (
            <tr key={incident.id}>
              <td className={`${CELL} exh-mono text-xs text-exh-ink`}>
                {filedDate(incident.date, incident.dateApproximate)}
              </td>
              <td className={`${CELL} break-words text-sm text-exh-ink`}>
                {incident.address ?? (
                  <span className="text-exh-ink-soft">No address recorded</span>
                )}
              </td>
              <td className={CELL}>
                <span className="sr-only">No conviction recorded.</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={`${CELL} border-t-2 border-t-exh-ink/50`}>
              <FactValue id="bombings.total_58" size="sm" />
            </td>
            <td className={`${CELL} border-t-2 border-t-exh-ink/50`}>
              <FactValue id="bombings.deaths_2" size="sm" />
            </td>
            <td className={`${CELL} border-t-2 border-t-exh-ink/50`}>
              <FactValue id="bombings.convictions_0" size="sm" />
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-10 max-w-[34rem] font-display text-lg leading-relaxed text-exh-ink">
        The record counts the dead. It names neither; one was a child of six.
        <SourceSup factId="bombings.deaths_2" />
      </p>
    </section>
  );
}
