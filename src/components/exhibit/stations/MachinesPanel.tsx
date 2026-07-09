"use client";
/* ------------------------------------------------------------------ */
/*  Five instruments, the overture reference panel. The machines       */
/*  concept as content, not HUD: a quiet table from machines.json,     */
/*  plain name, definition, the years each instrument ran, and the     */
/*  record behind each row. Rendered once, between ch2 and ch3.        */
/*  Rows follow the order the overture's prose introduces them, the    */
/*  realtors' rule and the covenant first, then the three that ran     */
/*  on public money. Below md the table becomes stacked cards so the   */
/*  reference never starts off-screen on a phone.                      */
/* ------------------------------------------------------------------ */
import { allMachines } from "@/lib/exhibit/machines";
import type { MachineDef } from "@/lib/exhibit/types";
import SourceSup from "../shared/SourceSup";

/* the order ch0_5's wall text names the instruments */
const PROSE_ORDER = ["code", "deed", "map", "bulldozer", "contract"];

function orderedMachines(): MachineDef[] {
  const all = allMachines();
  const rank = (m: MachineDef) => {
    const i = PROSE_ORDER.indexOf(m.machineId);
    return i === -1 ? PROSE_ORDER.length : i;
  };
  return [...all].sort((a, b) => rank(a) - rank(b));
}

/** the years an instrument ran; a null offYear is still running */
function ranLabel(m: MachineDef): string {
  return m.offYear !== null ? `${m.onYear} to ${m.offYear}` : `${m.onYear}, never switched off`;
}

function Definition({ m }: { m: MachineDef }) {
  return (
    <p className="text-sm leading-snug text-exh-ink">
      {m.definition}
      {m.evidenceFactRefs.map((ref) => (
        <SourceSup key={ref} factId={ref} />
      ))}
    </p>
  );
}

export default function MachinesPanel() {
  const machines = orderedMachines();
  return (
    <div data-testid="machines-panel">
      <p className="max-w-[65ch] text-sm leading-relaxed text-exh-ink-soft">
        The chapters ahead follow five instruments of exclusion. Each was paperwork, each had an
        operator, and each left a record. This table is the reference; the chapters show the
        documents.
      </p>

      {/* below md, the same reference as stacked cards, no side scroll */}
      <ul className="mt-4 space-y-3 md:hidden">
        {machines.map((m) => (
          <li
            key={m.machineId}
            data-testid={`machine-card-${m.machineId}`}
            className="border border-exh-ink/25 bg-exh-linen-deep/30 p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="font-display text-base text-exh-ink">{m.plainName}</p>
              <p className="exh-mono text-xs text-exh-ink">{ranLabel(m)}</p>
            </div>
            <div className="mt-1.5">
              <Definition m={m} />
            </div>
          </li>
        ))}
      </ul>

      {/* md and up, the reference table */}
      <div className="mt-4 hidden overflow-x-auto border border-exh-ink/25 md:block">
        <table className="w-full min-w-[38rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-exh-ink/25 bg-exh-linen-deep/50">
              <th className="exh-plat px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                Instrument
              </th>
              <th className="exh-plat px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                What it did
              </th>
              <th className="exh-plat px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink-soft">
                Ran
              </th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr
                key={m.machineId}
                data-testid={`machine-row-${m.machineId}`}
                className="border-b border-exh-ink/15 align-top last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  <p className="font-display text-base text-exh-ink">{m.plainName}</p>
                </td>
                <td className="px-3 py-2.5">
                  <Definition m={m} />
                </td>
                <td className="px-3 py-2.5">
                  <p className="exh-mono whitespace-nowrap text-xs text-exh-ink">{ranLabel(m)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
