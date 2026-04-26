"use client";

/* ------------------------------------------------------------------ */
/*  DatasetSpreadsheet                                                 */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  In-site spreadsheet viewer for hosted real datasets. Fetches a    */
/*  CSV from /api/research/data/file?slug=...&file=..., parses it,    */
/*  and renders a sortable, filterable, paginated table.              */
/*                                                                     */
/*  Toolbar offers an "Export current view" dropdown that saves the   */
/*  filtered + sorted state in CSV, TSV, or JSON. The full-file       */
/*  download lives outside this component on the dataset row.         */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState, useRef } from "react";
import {
  Loader2,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Table as TableIcon,
} from "lucide-react";

interface Props {
  /** Paper slug — used to address the file route. */
  slug: string;
  /** Filename inside public/data/<slug>/ to load. */
  fileName: string;
  /** Optional human-friendly title shown above the table. */
  title?: string;
}

interface ParsedCsv {
  columns: string[];
  rows: string[][];
}

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250];

export default function DatasetSpreadsheet({ slug, fileName, title }: Props) {
  const [data, setData] = useState<ParsedCsv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close the export dropdown on click-outside.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(e.target as Node)
      ) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* ---- Fetch + parse ---- */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/research/data/file?slug=${encodeURIComponent(
        slug
      )}&file=${encodeURIComponent(fileName)}&preview=1`
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        const parsed = parseCsv(text);
        setData(parsed);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, fileName]);

  /* ---- Filter + sort ---- */
  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    let rows = data.rows;
    if (q) {
      rows = rows.filter((row) =>
        row.some((cell) => cell.toLowerCase().includes(q))
      );
    }
    if (sortCol !== null) {
      const sorted = [...rows].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const an = parseFloat(av);
        const bn = parseFloat(bv);
        let cmp: number;
        if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== "" && bv !== "") {
          cmp = an - bn;
        } else {
          cmp = av.localeCompare(bv);
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
      rows = sorted;
    }
    return rows;
  }, [data, search, sortCol, sortDir]);

  const totalPages = data
    ? Math.max(1, Math.ceil(filteredRows.length / pageSize))
    : 1;
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = filteredRows.slice(
    safePage * pageSize,
    (safePage + 1) * pageSize
  );

  function toggleSort(idx: number) {
    if (sortCol === idx) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(idx);
      setSortDir("asc");
    }
  }

  function exportView(format: "csv" | "tsv" | "json") {
    if (!data) return;
    const stem = fileName.replace(/\.[^.]+$/, "");
    let body: string;
    let mime: string;
    let ext: string;

    if (format === "json") {
      const objects = filteredRows.map((row) => {
        const obj: Record<string, string> = {};
        data.columns.forEach((c, i) => {
          obj[c] = row[i] ?? "";
        });
        return obj;
      });
      body = JSON.stringify(objects, null, 2);
      mime = "application/json;charset=utf-8";
      ext = "json";
    } else {
      const sep = format === "tsv" ? "\t" : ",";
      const escape =
        format === "tsv"
          ? (c: string) => c.replace(/\t/g, " ").replace(/\n/g, " ")
          : escapeCsvCell;
      body = [
        data.columns.map(escape).join(sep),
        ...filteredRows.map((row) => row.map(escape).join(sep)),
      ].join("\n");
      mime =
        format === "tsv"
          ? "text/tab-separated-values;charset=utf-8"
          : "text/csv;charset=utf-8";
      ext = format;
    }

    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stem}-view.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }

  /* ---- Render ---- */
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-border bg-cream-dark/30 p-6 font-body text-sm text-warm-gray">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading {fileName}...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-sm border border-rust/30 bg-rust/5 p-6 font-body text-sm text-rust">
        Could not load {fileName}: {error ?? "no data"}.
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-border bg-cream-dark/30 p-4 md:p-5">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
          <TableIcon className="h-3.5 w-3.5" />
          {title ?? fileName}
        </p>
        <p className="font-mono text-[11.5px] text-warm-gray">
          {data.columns.length} columns · {data.rows.length.toLocaleString()}{" "}
          rows
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-warm-gray" />
          <input
            type="search"
            placeholder="Filter rows..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-56 rounded-sm border border-border bg-cream py-1.5 pl-8 pr-3 font-body text-[13px] text-ink placeholder:text-warm-gray focus:border-forest focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 font-body text-[12px] text-warm-gray">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded-sm border border-border bg-cream px-2 py-1 font-body text-[12px] text-ink"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div ref={exportRef} className="relative ml-auto">
          <button
            type="button"
            onClick={() => setExportOpen((v) => !v)}
            title={
              search
                ? `Save the ${filteredRows.length.toLocaleString()} filtered rows`
                : `Save the ${data.rows.length.toLocaleString()} rows shown here`
            }
            className="inline-flex items-center gap-1.5 rounded-sm border border-forest/50 bg-cream px-3 py-1.5 font-body text-[12.5px] font-semibold text-forest transition-colors hover:bg-forest hover:text-cream"
          >
            <Download className="h-3.5 w-3.5" />
            Export current view
            <ChevronDown className="h-3 w-3 opacity-70" />
          </button>
          {exportOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-1 w-72 rounded-sm border border-border bg-cream p-1.5 shadow-md"
            >
              <p className="px-2 py-1 font-body text-[10.5px] uppercase tracking-widest text-warm-gray">
                Save current filtered view as
              </p>
              <button
                type="button"
                onClick={() => exportView("csv")}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left font-body text-[12.5px] text-ink transition-colors hover:bg-cream-dark"
              >
                <span className="font-mono text-[11px] text-forest">.csv</span>
                <span>
                  <span className="font-semibold">CSV</span>
                  <span className="ml-1 text-warm-gray">
                    spreadsheet-friendly, comma-separated
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => exportView("tsv")}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left font-body text-[12.5px] text-ink transition-colors hover:bg-cream-dark"
              >
                <span className="font-mono text-[11px] text-forest">.tsv</span>
                <span>
                  <span className="font-semibold">TSV</span>
                  <span className="ml-1 text-warm-gray">
                    tab-separated, safer for fields with commas
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => exportView("json")}
                className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left font-body text-[12.5px] text-ink transition-colors hover:bg-cream-dark"
              >
                <span className="font-mono text-[11px] text-forest">
                  .json
                </span>
                <span>
                  <span className="font-semibold">JSON</span>
                  <span className="ml-1 text-warm-gray">
                    array of records, code-friendly
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-sm border border-border bg-cream">
        <table className="w-full border-collapse text-left">
          <thead className="bg-cream-dark/40">
            <tr>
              {data.columns.map((col, idx) => {
                const active = sortCol === idx;
                const Icon = active
                  ? sortDir === "asc"
                    ? ChevronUp
                    : ChevronDown
                  : ChevronsUpDown;
                return (
                  <th
                    key={`${col}-${idx}`}
                    onClick={() => toggleSort(idx)}
                    className="cursor-pointer select-none border-b border-border px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-warm-gray hover:text-forest"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col}
                      <Icon
                        className={`h-3 w-3 ${
                          active ? "text-forest" : "text-warm-gray/60"
                        }`}
                      />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={data.columns.length}
                  className="px-3 py-6 text-center font-body text-[13px] text-warm-gray"
                >
                  No rows match this filter.
                </td>
              </tr>
            ) : (
              pagedRows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-border/50 transition-colors hover:bg-cream-dark/30"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-1.5 align-top font-mono text-[11.5px] text-ink/85"
                    >
                      {cell || (
                        <span className="text-warm-gray/60">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between font-body text-[12px] text-warm-gray">
        <span>
          Showing{" "}
          {filteredRows.length === 0
            ? 0
            : (safePage * pageSize + 1).toLocaleString()}
          –
          {Math.min(
            (safePage + 1) * pageSize,
            filteredRows.length
          ).toLocaleString()}{" "}
          of {filteredRows.length.toLocaleString()}
          {search ? ` (filtered from ${data.rows.length.toLocaleString()})` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
            className="rounded-sm border border-border bg-cream px-2.5 py-1 font-body text-[12px] text-ink transition-colors hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="font-mono">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(safePage + 1)}
            className="rounded-sm border border-border bg-cream px-2.5 py-1 font-body text-[12px] text-ink transition-colors hover:bg-cream-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSV parser                                                         */
/*  Handles RFC 4180-style quoted fields with double-quote escapes    */
/*  and embedded commas. Multiline quoted fields not supported.       */
/* ------------------------------------------------------------------ */

export function parseCsv(text: string): ParsedCsv {
  const lines: string[] = [];
  // Normalize newlines and split, but preserve quoted multiline cells
  // by walking character-by-character.
  let buf = "";
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuote && text[i + 1] === '"') {
        buf += '""';
        i++;
      } else {
        inQuote = !inQuote;
        buf += c;
      }
    } else if (c === "\n" && !inQuote) {
      lines.push(buf);
      buf = "";
    } else if (c === "\r" && text[i + 1] === "\n" && !inQuote) {
      lines.push(buf);
      buf = "";
      i++;
    } else {
      buf += c;
    }
  }
  if (buf.length > 0) lines.push(buf);

  const rows = lines
    .filter((l) => l.trim() !== "")
    .map((line) => parseCsvLine(line));

  if (rows.length === 0) return { columns: [], rows: [] };
  const columns = rows[0];
  return { columns, rows: rows.slice(1) };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === "," && !inQuote) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function escapeCsvCell(cell: string): string {
  if (/[",\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}
