"use client";
/* ------------------------------------------------------------------ */
/*  Five instruments, the overture reference panel. The machines       */
/*  concept as content, not HUD: a quiet table from machines.json,     */
/*  plain name, definition, the years each instrument ran, and the     */
/*  record behind each row. Rendered once, between ch2 and ch3.        */
/* ------------------------------------------------------------------ */
import { allMachines } from "@/lib/exhibit/machines";
import SourceSup from "../shared/SourceSup";

export default function MachinesPanel() {
  return (
    <div data-testid="machines-panel">
      <p className="max-w-[65ch] text-sm leading-relaxed text-exh-ink-soft">
        The chapters ahead follow five instruments of exclusion. Each was paperwork, each had an
        operator, and each left a record. This table is the reference; the chapters show the
        documents.
      </p>
      <div className="mt-4 overflow-x-auto border border-exh-ink/25">
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
            {allMachines().map((m) => (
              <tr
                key={m.machineId}
                data-testid={`machine-row-${m.machineId}`}
                className="border-b border-exh-ink/15 align-top last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  <p className="font-display text-base text-exh-ink">{m.plainName}</p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-sm leading-snug text-exh-ink">
                    {m.definition}
                    {m.evidenceFactRefs.map((ref) => (
                      <SourceSup key={ref} factId={ref} />
                    ))}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <p className="exh-mono whitespace-nowrap text-xs text-exh-ink">
                    {m.onYear} to {m.offYear !== null ? m.offYear : "never off"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
