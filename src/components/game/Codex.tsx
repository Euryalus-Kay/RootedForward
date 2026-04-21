"use client";

/**
 * Codex UI.
 *
 * The Codex is the in-game reference library. It shows biographies,
 * neighborhood histories, policy explainers, and event write-ups that
 * the cards and events reference. It is organized by category and
 * linked bi-directionally within itself.
 *
 * The codex is pure read-only and does not affect game state. It's
 * accessible from the Pause menu and from a standalone button on the
 * top of the HUD.
 */

import { useMemo, useState } from "react";
import {
  CODEX,
  CODEX_BY_ID,
  CODEX_CATEGORY_LABEL,
  codexByCategory,
  type CodexCategory,
  type CodexEntry,
} from "@/lib/game/codex";

export function Codex({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<CodexCategory | "all">("all");
  const [activeEntry, setActiveEntry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const grouped = useMemo(() => codexByCategory(), []);
  const categoryKeys: CodexCategory[] = [
    "people",
    "institutions",
    "neighborhoods",
    "policies",
    "events",
    "concepts",
  ];

  const entries = useMemo(() => {
    let list: CodexEntry[] =
      activeCategory === "all" ? CODEX : grouped[activeCategory] ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.teaser.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, grouped, searchQuery]);

  const selected = activeEntry ? CODEX_BY_ID.get(activeEntry) ?? null : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Codex"
    >
      <div className="flex h-full max-h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-border bg-cream shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-forest p-5 text-cream">
          <div>
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-cream/70">
              Codex
            </p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              The Parkhaven Reference
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close codex"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/15 font-display text-lg font-bold text-cream hover:bg-cream/25"
          >
            ×
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-cream-dark/40 p-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the Codex…"
            className="flex-1 min-w-[180px] rounded-sm border border-border bg-cream px-3 py-2 font-body text-sm text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
          />
          <div className="flex flex-wrap gap-1.5">
            <CategoryPill
              label="All"
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              count={CODEX.length}
            />
            {categoryKeys.map((c) => (
              <CategoryPill
                key={c}
                label={CODEX_CATEGORY_LABEL[c]}
                active={activeCategory === c}
                onClick={() => setActiveCategory(c)}
                count={grouped[c].length}
              />
            ))}
          </div>
        </div>

        {/* Body: TOC + detail */}
        <div className="flex flex-1 overflow-hidden">
          <aside className="w-60 border-r border-border bg-cream-dark/30 md:w-72">
            <div className="flex h-full flex-col overflow-y-auto">
              {entries.length === 0 ? (
                <p className="p-4 font-body text-sm italic text-warm-gray">
                  No entries match your search.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => setActiveEntry(e.id)}
                        className={`block w-full p-3 text-left transition-colors ${
                          activeEntry === e.id
                            ? "bg-rust/15"
                            : "hover:bg-cream-dark/60"
                        }`}
                      >
                        <p className="font-display text-sm font-semibold text-forest">
                          {e.title}
                        </p>
                        <p className="mt-1 font-body text-[11px] italic text-warm-gray">
                          {CODEX_CATEGORY_LABEL[e.category]}
                        </p>
                        <p className="mt-1 font-body text-[12px] text-ink/75 line-clamp-2">
                          {e.teaser}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-cream p-6 md:p-8">
            {selected ? (
              <CodexDetail entry={selected} onOpen={setActiveEntry} />
            ) : (
              <div className="mx-auto max-w-prose pt-8 text-center">
                <p className="font-display text-2xl text-forest">
                  Pick an entry.
                </p>
                <p className="mt-4 font-body text-base leading-relaxed text-ink/70">
                  The Codex is the reference library for the people,
                  institutions, neighborhoods, policies, and events that
                  shape Parkhaven. Every entry cites a real source you
                  can chase down. Reading the Codex does not affect play.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 text-left md:grid-cols-3">
                  {categoryKeys.map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className="rounded-md border border-border bg-cream-dark/30 p-4 transition-colors hover:bg-cream-dark/50"
                    >
                      <p className="font-display text-base font-semibold text-forest">
                        {CODEX_CATEGORY_LABEL[c]}
                      </p>
                      <p className="mt-1 font-body text-xs text-warm-gray">
                        {grouped[c].length} entries
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm px-3 py-1.5 font-body text-[11px] font-semibold uppercase tracking-widest transition-colors ${
        active
          ? "bg-forest text-cream"
          : "border border-border bg-cream text-forest hover:bg-cream-dark"
      }`}
    >
      {label}
      <span className={`ml-1.5 text-[10px] ${active ? "opacity-70" : "text-warm-gray"}`}>
        {count}
      </span>
    </button>
  );
}

function CodexDetail({
  entry,
  onOpen,
}: {
  entry: CodexEntry;
  onOpen: (id: string) => void;
}) {
  return (
    <article className="mx-auto max-w-prose">
      <p className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-rust">
        {CODEX_CATEGORY_LABEL[entry.category]}
        {entry.era ? ` · ${entry.era}` : ""}
      </p>
      <h3 className="mt-3 font-display text-3xl leading-tight text-forest md:text-4xl">
        {entry.title}
      </h3>
      <p className="mt-3 font-body text-base italic text-ink/70">
        {entry.teaser}
      </p>

      <div className="mt-8 space-y-4 font-body text-base leading-relaxed text-ink/80">
        {entry.body.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {entry.source && (
        <div className="mt-10 rounded-sm border-l-2 border-rust bg-rust/5 p-4">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-rust">
            Source
          </p>
          <p className="mt-1 font-body text-sm italic text-ink/80">
            {entry.source}
          </p>
        </div>
      )}

      {entry.related && entry.related.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-warm-gray">
            Related
          </p>
          <ul className="mt-3 space-y-1">
            {entry.related.map((rid) => {
              const r = CODEX_BY_ID.get(rid);
              if (!r) return null;
              return (
                <li key={rid}>
                  <button
                    onClick={() => onOpen(rid)}
                    className="font-body text-sm font-semibold text-rust underline underline-offset-2 hover:text-rust-dark"
                  >
                    {r.title}
                  </button>
                  <span className="ml-2 font-body text-xs text-warm-gray">
                    · {r.teaser}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}
