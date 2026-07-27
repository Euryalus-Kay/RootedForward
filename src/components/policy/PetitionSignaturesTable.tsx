"use client";

import { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/*  PetitionSignaturesTable                                            */
/*                                                                     */
/*  Admin-only. Shows the whole signature list with emails, and can    */
/*  hand it over as a CSV for delivery to a committee.                 */
/* ------------------------------------------------------------------ */

export interface AdminSignature {
  name: string;
  email: string;
  zip: string | null;
  residency: string | null;
  isPublic: boolean;
  createdAt: string;
}

const RESIDENCY_LABEL: Record<string, string> = {
  resident: "Lives there",
  work_or_school: "Works or studies there",
  nearby: "Elsewhere in metro",
  supporter: "Supporter",
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function PetitionSignaturesTable({
  signatures,
  slug,
}: {
  signatures: AdminSignature[];
  slug: string;
}) {
  const [residentsOnly, setResidentsOnly] = useState(false);

  const rows = useMemo(
    () =>
      residentsOnly
        ? signatures.filter((s) => s.residency === "resident")
        : signatures,
    [signatures, residentsOnly]
  );

  function downloadCsv() {
    const header = ["Name", "Email", "ZIP", "Residency", "Public", "Signed at"];
    const body = rows.map((s) =>
      [
        s.name,
        s.email,
        s.zip ?? "",
        s.residency ?? "",
        s.isPublic ? "yes" : "no",
        s.createdAt,
      ]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-signatures.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (signatures.length === 0) {
    return (
      <p className="rounded-sm border border-border bg-cream-dark/40 p-5 font-body text-sm text-ink/60">
        No signatures yet.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-body text-sm text-ink/70">
          <input
            type="checkbox"
            checked={residentsOnly}
            onChange={(e) => setResidentsOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border text-rust focus:ring-rust/30"
          />
          Residents only ({signatures.filter((s) => s.residency === "resident").length})
        </label>
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-sm bg-forest px-4 py-2 font-body text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-forest/90"
        >
          Download CSV
        </button>
      </div>

      {/* The table is wider than a phone, so it scrolls inside itself
          rather than pushing the page sideways. */}
      <div className="mt-4 overflow-x-auto rounded-sm border border-border">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead className="bg-cream-dark/60">
            <tr>
              {["Name", "Email", "ZIP", "Residency", "Public", "Signed"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-body text-[11px] font-semibold uppercase tracking-widest text-ink/55"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr
                key={`${s.email}-${i}`}
                className="border-t border-border font-body text-sm text-ink/80"
              >
                <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                <td className="px-4 py-3">
                  <a
                    href={`mailto:${s.email}`}
                    className="text-forest underline decoration-border underline-offset-2"
                  >
                    {s.email}
                  </a>
                </td>
                <td className="px-4 py-3">{s.zip ?? "not given"}</td>
                <td className="px-4 py-3">
                  {s.residency
                    ? RESIDENCY_LABEL[s.residency] ?? s.residency
                    : "not given"}
                </td>
                <td className="px-4 py-3">{s.isPublic ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-ink/60">
                  {new Date(s.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
