"use client";

/* ------------------------------------------------------------------ */
/*  Admin / Walks.                                                     */
/*                                                                     */
/*  The walking tours used to be compiled TypeScript, so changing one  */
/*  sentence meant a commit, a deploy and, for the phone, an App Store */
/*  release that took a week and Apple's permission. They live in the  */
/*  walk_tours table now, and this screen is the whole editing surface */
/*  for them. Everything it saves is on the site at once and on phones */
/*  at their next launch.                                              */
/*                                                                     */
/*  The list names the walks that still exist only in the build too.   */
/*  The public store reads a row first and falls back to the compiled  */
/*  constant, so one of those is live on the site and simply not yet   */
/*  editable. Opening it and saving it once is what changes that.      */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useState } from "react";
import { Footprints, Loader2, Plus, RefreshCw, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import { cn, slugify } from "@/lib/utils";
import WalkEditor from "@/components/admin/walks/WalkEditor";
import {
  WalkApiError,
  emptyBundle,
  listWalks,
  loadWalk,
  patchWalk,
  type AdminWalkRecord,
  type WalkSummary,
} from "@/components/admin/walks/api";
import {
  Field,
  btnGhost,
  btnPrimary,
  btnQuiet,
  eyebrowCls,
} from "@/components/admin/walks/ui";

type Load = "loading" | "ready" | "missing-table" | "failed";

/** Last changed, read the way a person reads it. */
function changed(iso: string | null): string {
  if (!iso) return "never saved here";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminWalksPage() {
  const [walks, setWalks] = useState<WalkSummary[]>([]);
  const [defaultSlug, setDefaultSlug] = useState("");
  const [compiledSlugs, setCompiledSlugs] = useState<string[]>([]);
  const [load, setLoad] = useState<Load>("loading");
  const [failure, setFailure] = useState("");
  const [editing, setEditing] = useState<{
    record: AdminWalkRecord;
    isNew: boolean;
  } | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const fetchWalks = useCallback(async () => {
    setLoad("loading");
    try {
      const index = await listWalks();
      setWalks(index.walks);
      setDefaultSlug(index.defaultSlug);
      setCompiledSlugs(index.compiledSlugs);
      setLoad("ready");
    } catch (err) {
      if (err instanceof WalkApiError && err.migrationPending) {
        setLoad("missing-table");
        return;
      }
      setFailure(err instanceof Error ? err.message : "The walks did not load");
      setLoad("failed");
    }
  }, []);

  useEffect(() => {
    fetchWalks();
  }, [fetchWalks]);

  /* ---- opening one ---- */

  /** The list carries a summary and no bundle, on purpose, so the walk
   *  is read whole here. A walk that only exists in the build comes
   *  back the same way, marked as coming from the code. */
  const openWalk = async (summary: WalkSummary) => {
    setBusy(summary.slug);
    try {
      setEditing({ record: await loadWalk(summary.slug), isNew: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "That walk did not open");
    } finally {
      setBusy(null);
    }
  };

  /* ---- flipping a walk live from the list ---- */

  const toggleLive = async (walk: WalkSummary) => {
    setBusy(walk.slug);
    try {
      const saved = await patchWalk(walk.slug, { live: !walk.live });
      setWalks((prev) =>
        prev.map((w) =>
          w.slug === walk.slug
            ? { ...w, live: saved.live, updatedAt: saved.updatedAt }
            : w
        )
      );
      toast.success(
        saved.live
          ? "Live now, and on phones at their next launch"
          : "Off the site, and off phones at their next launch"
      );
    } catch (err) {
      if (err instanceof WalkApiError && err.problems.length > 0) {
        toast.error(
          `${err.message} Open the walk to see what is missing.`,
          { duration: 6000 }
        );
      } else {
        toast.error(err instanceof Error ? err.message : "That did not save");
      }
    } finally {
      setBusy(null);
    }
  };

  /* ---- starting a new walk ---- */

  const startNew = () => {
    const slug = slugify(newSlug || newTitle);
    if (!slug) {
      toast.error("Give the walk a name first");
      return;
    }
    if (walks.some((w) => w.slug === slug)) {
      toast.error("There is already a walk with that slug");
      return;
    }
    const bundle = emptyBundle(slug);
    bundle.tour.title = newTitle.trim();
    setEditing({
      record: {
        slug,
        live: false,
        sortOrder: walks.length,
        updatedAt: null,
        source: "database",
        bundle,
      },
      isNew: true,
    });
    setAdding(false);
    setNewTitle("");
    setNewSlug("");
  };

  /* ---- the editor takes the whole screen ---- */

  if (editing) {
    return (
      <WalkEditor
        record={editing.record}
        isNew={editing.isNew}
        isDefault={editing.record.slug === defaultSlug}
        canRestoreFromCode={compiledSlugs.includes(editing.record.slug)}
        onBack={() => {
          setEditing(null);
          fetchWalks();
        }}
        onSaved={(saved) => setEditing({ record: saved, isNew: false })}
        onDeleted={() => {
          setEditing(null);
          fetchWalks();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={eyebrowCls}>Walking tours</p>
          <h1 className="mt-1 flex items-center gap-3 font-display text-3xl text-forest md:text-4xl">
            <Footprints className="h-7 w-7 text-rust" />
            Walks
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-warm-gray">
            The self guided audio tours, the ones on the site and the ones in the iPhone
            app. Everything about them is edited here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={fetchWalks} className={btnGhost}>
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
          <button type="button" onClick={() => setAdding((a) => !a)} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Add a walk
          </button>
        </div>
      </div>

      {/* ---- The promise this page is built on ---- */}
      <div className="flex items-start gap-3 rounded-sm border border-forest/30 bg-forest/5 px-5 py-4">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
        <div>
          <p className={eyebrowCls}>Changes reach phones on the next launch</p>
          <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-ink">
            The app asks the site for its walks every time it opens and every time it
            comes back to the front, then downloads any photograph or audio file it does
            not already hold. Anything you save is on the site at once and on phones at
            their next launch. No App Store release is involved, so nothing here has to
            wait for Apple.
          </p>
        </div>
      </div>

      {/* ---- Starting a new walk ---- */}
      {adding && (
        <div className="rounded-sm border border-border bg-white/60 px-5 py-5">
          <p className={eyebrowCls}>A new walk</p>
          <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-warm-gray">
            It starts empty and not live. Nothing is filled in for you. A new walk cannot
            draw its map until its geometry is generated with scripts/walk-prep-map.mjs
            and pasted into the drawn parts at the bottom of the editor.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Working title"
              value={newTitle}
              onChange={(v) => {
                setNewTitle(v);
                if (!newSlug) setNewSlug(slugify(v));
              }}
              placeholder="Walk Bronzeville"
            />
            <Field
              label="Slug"
              value={newSlug}
              onChange={(v) => setNewSlug(slugify(v))}
              hint="The key the app asks for, so keep it short and permanent"
            />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={startNew} className={btnPrimary}>
              Start writing it
            </button>
            <button type="button" onClick={() => setAdding(false)} className={btnGhost}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---- States ---- */}
      {load === "loading" && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-forest" />
        </div>
      )}

      {load === "missing-table" && (
        <div className="rounded-sm border border-border bg-white/60 px-6 py-10 text-center">
          <Footprints className="mx-auto h-10 w-10 text-warm-gray-light" />
          <h2 className="mt-4 font-display text-2xl text-forest">
            The walks table is not installed yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-body text-sm leading-relaxed text-warm-gray">
            Until the table exists the site serves the walks compiled into the code, which
            still works and is what visitors and the app see today. Run the migration
            below in the Supabase SQL editor, the same way migration 006 was applied, then
            reload this page.
          </p>
          <code className="mt-4 inline-block rounded-sm bg-cream-dark px-3 py-1.5 font-mono text-xs text-ink">
            supabase/migrations/010_walk_tours.sql
          </code>
        </div>
      )}

      {load === "failed" && (
        <div className="rounded-sm border border-rust/40 bg-rust/5 px-6 py-8">
          <p className={eyebrowCls}>The walks did not load</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-ink">{failure}</p>
          <button type="button" onClick={fetchWalks} className={`${btnQuiet} mt-3`}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )}

      {/* ---- The list ---- */}
      {load === "ready" &&
        (walks.length === 0 ? (
          <div className="rounded-sm border border-border bg-white/60 px-6 py-12 text-center">
            <Footprints className="mx-auto h-10 w-10 text-warm-gray-light" />
            <p className="mt-3 font-body text-sm text-warm-gray">
              No walks yet. Add one and it appears here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full min-w-[52rem] text-left">
              <thead className="border-b border-border bg-cream-dark">
                <tr>
                  {["Walk", "Where it lives", "Stops", "Last changed", "On the site", ""].map(
                    (heading, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.25em] text-warm-gray"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white/60">
                {walks.map((walk) => {
                  const working = busy === walk.slug;
                  const inCode = walk.source === "code";
                  // Hyde Park is what a shipped iPhone asks for by name,
                  // so the route refuses to unpublish it. Saying so up
                  // front beats a rejected click.
                  const locked = walk.isDefault && walk.live;
                  return (
                    <tr key={walk.slug} className="align-top hover:bg-cream-dark/40">
                      <td className="px-4 py-4">
                        <p className="font-body text-sm font-semibold text-ink">
                          {walk.title || "Untitled walk"}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-warm-gray">
                          {walk.slug}
                          {walk.isDefault && " · what the app asks for by name"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "rounded-sm px-2 py-0.5 font-body text-xs font-semibold uppercase tracking-widest",
                            inCode
                              ? "bg-cream-dark text-warm-gray"
                              : "bg-forest/10 text-forest"
                          )}
                        >
                          {inCode ? "In code" : "Database"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-ink">
                        {walk.stopCount}
                      </td>
                      <td className="px-4 py-4 font-body text-sm text-warm-gray">
                        {changed(walk.updatedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => toggleLive(walk)}
                          disabled={working || inCode || locked}
                          title={
                            inCode
                              ? "Served from the code. Open it and save it once to manage it here."
                              : locked
                                ? "This walk stays on the site. Every iPhone that already has the app asks for it by name."
                                : undefined
                          }
                          className={cn(
                            "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 font-body text-xs font-semibold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                            walk.live
                              ? "border-forest bg-forest text-cream hover:bg-forest-light"
                              : "border-border bg-white text-warm-gray hover:bg-cream-dark"
                          )}
                        >
                          {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {walk.live ? "Live" : "Not live"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openWalk(walk)}
                          disabled={working}
                          className={btnQuiet}
                        >
                          {working && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {load === "ready" && walks.some((w) => w.source === "code") && (
        <p className="max-w-3xl font-body text-xs leading-relaxed text-warm-gray">
          A walk marked In code is still being served from src/lib/tours/registry.ts and
          has never been saved here. Open it and save it once to copy it into the
          database. From then on the saved version is the one the site and the app read,
          and the code stays as the fallback if the database is ever unreachable.
        </p>
      )}
    </div>
  );
}
