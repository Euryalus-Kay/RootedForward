"use client";

/* ------------------------------------------------------------------ */
/*  CitationsEditor                                                    */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Dynamic, drag-and-drop citations editor used inside the research */
/*  entry admin form.                                                  */
/*                                                                     */
/*  Each row has:                                                      */
/*    - Citation number (auto-incremented, reorderable via drag).     */
/*    - Type (dropdown: primary / secondary).                          */
/*    - Citation text (textarea for the full bibliographic entry).    */
/*    - URL (optional).                                                */
/*    - Accessed date (optional).                                      */
/*    - Remove button.                                                 */
/*                                                                     */
/*  "Add citation" button at the bottom. Drag-to-reorder via native   */
/*  HTML5 drag events — deliberately dependency-free.                 */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { useCallback, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Citation, CitationType } from "@/lib/types/database";

interface CitationsEditorProps {
  citations: Citation[];
  onChange: (next: Citation[]) => void;
}

function freshId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export default function CitationsEditor({
  citations,
  onChange,
}: CitationsEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const updateAt = useCallback(
    (index: number, patch: Partial<Citation>) => {
      const next = citations.map((c, i) =>
        i === index ? { ...c, ...patch } : c
      );
      onChange(next);
    },
    [citations, onChange]
  );

  const addCitation = useCallback(() => {
    const nextId = String(citations.length + 1);
    const next: Citation[] = [
      ...citations,
      {
        id: nextId,
        text: "",
        url: null,
        accessed_date: null,
        type: "primary",
      },
    ];
    onChange(next);
  }, [citations, onChange]);

  const removeAt = useCallback(
    (index: number) => {
      const next = citations.filter((_, i) => i !== index);
      // Re-key ids to keep the numbering simple for admins.
      const rekeyed = next.map((c, i) => ({ ...c, id: String(i + 1) }));
      onChange(rekeyed);
    },
    [citations, onChange]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const next = [...citations];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const rekeyed = next.map((c, i) => ({ ...c, id: String(i + 1) }));
      onChange(rekeyed);
    },
    [citations, onChange]
  );

  const primary = citations.filter((c) => c.type === "primary").length;
  const secondary = citations.length - primary;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-[18px] font-medium text-forest">
            Citations ({citations.length})
          </h3>
          <p className="mt-0.5 font-body text-[12.5px] text-warm-gray">
            Drag to reorder. {primary} primary, {secondary} secondary.
          </p>
        </div>
        <button
          type="button"
          onClick={addCitation}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-cream px-3 py-1.5 font-body text-[13px] font-medium text-ink transition-colors hover:bg-cream-dark"
        >
          <Plus className="h-4 w-4" />
          Add citation
        </button>
      </div>

      {citations.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border bg-cream/60 px-4 py-6 text-center font-body text-[13.5px] text-warm-gray">
          No citations yet. Add one to start the bibliography. Use{" "}
          <code className="rounded bg-cream-dark px-1 py-0.5 font-mono text-[12px] text-ink">
            [^1]
          </code>{" "}
          in the body markdown to reference citation 1.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {citations.map((citation, idx) => {
            const isDragging = dragIndex === idx;
            const isOver = overIndex === idx && dragIndex !== null;
            return (
              <li
                key={`${citation.id}-${idx}`}
                draggable
                onDragStart={(e) => {
                  setDragIndex(idx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnter={() => setOverIndex(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) {
                    moveItem(dragIndex, idx);
                  }
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`rounded-sm border bg-cream p-3 transition-all ${
                  isDragging
                    ? "border-rust/60 opacity-40"
                    : isOver
                      ? "border-forest"
                      : "border-border"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    className="mt-1 cursor-grab rounded-md p-1 text-warm-gray transition-colors hover:bg-cream-dark hover:text-ink active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cream-dark font-mono text-[12px] font-semibold text-forest">
                    {idx + 1}
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-[110px_1fr_140px]">
                    {/* Type */}
                    <div>
                      <label className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                        Type
                      </label>
                      <select
                        value={citation.type}
                        onChange={(e) =>
                          updateAt(idx, {
                            type: e.target.value as CitationType,
                          })
                        }
                        className="mt-1 w-full rounded border border-border bg-white px-2 py-1.5 font-body text-[13px] text-ink focus:border-forest focus:outline-none"
                      >
                        <option value="primary">Primary</option>
                        <option value="secondary">Secondary</option>
                      </select>
                    </div>

                    {/* Citation text */}
                    <div className="md:col-span-1 md:row-span-2">
                      <label className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                        Citation text
                      </label>
                      <textarea
                        value={citation.text}
                        onChange={(e) =>
                          updateAt(idx, { text: e.target.value })
                        }
                        rows={3}
                        placeholder='Author, Title, Publisher, Year.'
                        className="mt-1 w-full rounded border border-border bg-white px-2.5 py-1.5 font-body text-[13.5px] leading-snug text-ink focus:border-forest focus:outline-none"
                      />
                    </div>

                    {/* Remove */}
                    <div className="flex items-start md:justify-end">
                      <button
                        type="button"
                        onClick={() => removeAt(idx)}
                        aria-label="Remove citation"
                        className="mt-5 inline-flex items-center gap-1 rounded-md px-2 py-1 font-body text-[12px] font-medium text-rust transition-colors hover:bg-rust/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>

                    {/* URL */}
                    <div>
                      <label className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                        URL
                      </label>
                      <input
                        type="url"
                        value={citation.url ?? ""}
                        onChange={(e) =>
                          updateAt(idx, {
                            url: e.target.value.trim() || null,
                          })
                        }
                        placeholder="https://"
                        className="mt-1 w-full rounded border border-border bg-white px-2 py-1.5 font-body text-[13px] text-ink focus:border-forest focus:outline-none"
                      />
                    </div>

                    {/* Accessed */}
                    <div>
                      <label className="font-body text-[11px] font-semibold uppercase tracking-wider text-warm-gray">
                        Accessed
                      </label>
                      <input
                        type="date"
                        value={citation.accessed_date ?? ""}
                        onChange={(e) =>
                          updateAt(idx, {
                            accessed_date: e.target.value || null,
                          })
                        }
                        className="mt-1 w-full rounded border border-border bg-white px-2 py-1.5 font-body text-[13px] text-ink focus:border-forest focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
