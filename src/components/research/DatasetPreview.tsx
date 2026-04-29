/* ------------------------------------------------------------------ */
/*  DatasetPreview                                                     */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Renders a compact column-schema and sample-rows table inside a    */
/*  dataset card on /research/data. Intentionally small — the goal is */
/*  to show the user what the data looks like, not to ship a full     */
/*  data explorer. If the user wants more, they download the archive. */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { Table } from "lucide-react";

export interface DatasetColumn {
  name: string;
  type: string;
  description?: string;
}

export interface DatasetPreviewData {
  columns: DatasetColumn[];
  sample_rows: Record<string, string | number | boolean | null>[];
}

interface Props {
  preview: DatasetPreviewData;
}

export default function DatasetPreview({ preview }: Props) {
  if (
    !preview ||
    !Array.isArray(preview.columns) ||
    preview.columns.length === 0
  ) {
    return null;
  }

  const rows = Array.isArray(preview.sample_rows) ? preview.sample_rows : [];

  return (
    <div className="rounded-sm border border-border bg-cream-dark/30 p-4">
      <p className="mb-3 inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
        <Table className="h-3.5 w-3.5" />
        Schema · {preview.columns.length} columns
        {rows.length > 0
          ? ` · ${rows.length} sample row${rows.length === 1 ? "" : "s"}`
          : " · no sample rows"}
      </p>

      {/* Schema */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="border-b border-border pb-1.5 pr-4 text-left font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                Column
              </th>
              <th className="border-b border-border pb-1.5 pr-4 text-left font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                Type
              </th>
              <th className="border-b border-border pb-1.5 text-left font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.columns.map((c) => (
              <tr key={c.name}>
                <td className="border-b border-border/60 py-1.5 pr-4 align-top font-mono text-[12px] text-ink/85">
                  {c.name}
                </td>
                <td className="border-b border-border/60 py-1.5 pr-4 align-top font-mono text-[11.5px] uppercase text-warm-gray">
                  {c.type}
                </td>
                <td className="border-b border-border/60 py-1.5 align-top font-body text-[12.5px] text-ink/75">
                  {c.description ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sample rows */}
      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray">
            Sample Rows
          </p>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {preview.columns.map((c) => (
                  <th
                    key={c.name}
                    className="border-b border-border pb-1.5 pr-3 text-left font-mono text-[10.5px] uppercase tracking-wide text-warm-gray"
                  >
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {preview.columns.map((c) => (
                    <td
                      key={c.name}
                      className="border-b border-border/40 py-1.5 pr-3 align-top font-mono text-[11.5px] text-ink/80"
                    >
                      {formatCell(row[c.name])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}
