"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createClient,
  isSupabaseConfiguredClient,
} from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import TimelinePlayer from "@/components/immersive/TimelinePlayer";
import MediaBin from "@/components/admin/studio/MediaBin";
import TimelineEditor from "@/components/admin/studio/TimelineEditor";
import AgentPanel, {
  type PipelineState,
} from "@/components/admin/studio/AgentPanel";
import { DEMO_SEQUENCE } from "@/lib/immersive/demo";
import {
  agentHealth,
  buildAssets,
  callAgent,
  extractFrames,
  uid,
} from "@/lib/immersive/studio-client";
import type {
  AgentTraceEntry,
  CritiqueResult,
  ImmersiveStop,
  SequenceDoc,
  StudioChatMessage,
  StudioClipAnalysis,
  StudioMediaItem,
} from "@/lib/immersive/types";
import {
  Clapperboard,
  Download,
  KeyRound,
  Link2,
  Loader2,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Studio: the AI editor. Media bin on the left, player + timeline    */
/*  in the middle, agent pipeline and chat on the right.               */
/*                                                                     */
/*  The deliverable is a SequenceDoc the hybrid player runs live on    */
/*  the site, attachable to any immersive tour stop.                   */
/* ------------------------------------------------------------------ */

const AUTOSAVE_KEY = "rf-studio-project-v1";

interface ProjectSnapshot {
  id: string;
  name: string;
  brief: string;
  media: StudioMediaItem[];
  sequence: SequenceDoc | null;
  chat: StudioChatMessage[];
}

const IDLE_PIPELINE: PipelineState = {
  analyst: "idle",
  director: "idle",
  critic: "idle",
  detail: "",
  error: null,
};

export default function StudioPage() {
  const [projectId, setProjectId] = useState(() => uid("proj"));
  const [projectName, setProjectName] = useState("Untitled sequence");
  const [brief, setBrief] = useState(
    "A short hybrid teaser for the underwater Chicago tour. Open with a title, descend, give one 360 look-around moment, end calm."
  );
  const [media, setMedia] = useState<StudioMediaItem[]>([]);
  const [sequence, setSequence] = useState<SequenceDoc | null>(null);
  const [chat, setChat] = useState<StudioChatMessage[]>([]);
  const [pipeline, setPipeline] = useState<PipelineState>(IDLE_PIPELINE);
  const [traces, setTraces] = useState<AgentTraceEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [health, setHealth] = useState<{
    model: string;
    keyConfigured: boolean;
  } | null>(null);
  const [sessionKey, setSessionKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const hydrated = useRef(false);

  /* ------------------------- persistence ------------------------- */

  useEffect(() => {
    agentHealth().then(setHealth);
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const snap = JSON.parse(raw) as ProjectSnapshot;
        const usable = snap.media.filter((m) => !m.url.startsWith("blob:"));
        const dropped = snap.media.length - usable.length;
        setProjectId(snap.id ?? uid("proj"));
        setProjectName(snap.name ?? "Untitled sequence");
        setBrief(snap.brief ?? "");
        setMedia(usable);
        setSequence(snap.sequence ?? null);
        setChat(snap.chat ?? []);
        if (dropped > 0) {
          toast(
            `${dropped} session-only clip${dropped === 1 ? "" : "s"} did not survive the reload. Save clips to the library to keep them.`,
            { icon: "⚠️" }
          );
        }
      }
    } catch {
      // Ignore a corrupt autosave
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const snap: ProjectSnapshot = {
      id: projectId,
      name: projectName,
      brief,
      media,
      sequence,
      chat,
    };
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snap));
    } catch {
      // Storage full; autosave is best-effort
    }
  }, [projectId, projectName, brief, media, sequence, chat]);

  const saveToSupabase = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: projectName,
        brief,
        media: media.filter((m) => m.persisted) as unknown,
        sequence: sequence as unknown,
        chat: chat as unknown,
      };
      // Try update first; insert when the row does not exist yet.
      const { data: updated, error: updateError } = await supabase
        .from("studio_projects")
        .update(payload)
        .eq("id", projectId)
        .select("id");
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        const { data: inserted, error: insertError } = await supabase
          .from("studio_projects")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        if (inserted) setProjectId(inserted.id as string);
      }
      toast.success("Project saved");
    } catch {
      toast.error(
        "Could not save to Supabase. Run migration 006 and sign in as an admin. The local autosave still has your work."
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------- pipeline --------------------------- */

  const key = sessionKey.trim() || null;

  const ensureAnalyses = useCallback(
    async (items: StudioMediaItem[]): Promise<StudioMediaItem[]> => {
      const out = [...items];
      for (let i = 0; i < out.length; i++) {
        const item = out[i];
        if (item.analysis) continue;
        setAnalyzingId(item.id);
        setPipeline((p) => ({
          ...p,
          analyst: "running",
          detail: `Analyst is watching ${item.name}`,
        }));
        const frames = await extractFrames(item, item.kind === "video" ? 4 : 1);
        const { result, trace } = await callAgent<StudioClipAnalysis>(
          {
            action: "analyze",
            clipName: item.name,
            durationSec: item.durationSec ?? 0,
            width: item.width ?? 0,
            height: item.height ?? 0,
            frames,
          },
          key
        );
        out[i] = {
          ...item,
          analysis: result,
          is360: item.is360 || result.looksEquirect,
        };
        setTraces((t) => [...t, trace as AgentTraceEntry]);
        setMedia((prev) =>
          prev.map((m) => (m.id === out[i].id ? out[i] : m))
        );
      }
      setAnalyzingId(null);
      return out;
    },
    [key]
  );

  const clipsPayload = (items: StudioMediaItem[]) =>
    items.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      durationSec: m.durationSec,
      is360: m.is360,
      analysis: m.analysis,
    }));

  const runPipeline = async () => {
    if (media.length === 0) {
      toast.error("Add clips to the media bin first");
      return;
    }
    setBusy(true);
    setTraces([]);
    setPipeline({ ...IDLE_PIPELINE, detail: "Starting" });
    try {
      // 1. Analyst
      const analyzed = await ensureAnalyses(media);
      setPipeline((p) => ({ ...p, analyst: "done" }));

      // 2. Director
      setPipeline((p) => ({
        ...p,
        director: "running",
        detail: "The Director is building the cut",
      }));
      const directed = await callAgent<SequenceDoc>(
        { action: "direct", brief, clips: clipsPayload(analyzed) },
        key
      );
      setTraces((t) => [...t, directed.trace as AgentTraceEntry]);
      let doc = directed.result;
      setPipeline((p) => ({ ...p, director: "done" }));

      // 3. Critic
      setPipeline((p) => ({
        ...p,
        critic: "running",
        detail: "The Critic is reviewing pacing and continuity",
      }));
      const critiqued = await callAgent<CritiqueResult>(
        {
          action: "critique",
          brief,
          sequence: doc,
          clips: clipsPayload(analyzed),
        },
        key
      );
      setTraces((t) => [...t, critiqued.trace as AgentTraceEntry]);
      const verdict = critiqued.result;
      if (verdict.verdict === "revise" && verdict.revisedSequence) {
        doc = verdict.revisedSequence;
      }
      setPipeline((p) => ({ ...p, critic: "done", detail: "" }));

      setSequence(doc);
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `Cut ready, "${doc.title}". ${doc.notes ?? ""}${
            verdict.verdict === "revise"
              ? ` The Critic adjusted it. ${verdict.issues.slice(0, 3).join(" ")}`
              : " The Critic approved it as cut."
          }`,
          at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({
        analyst: p.analyst === "running" ? "error" : p.analyst,
        director: p.director === "running" ? "error" : p.director,
        critic: p.critic === "running" ? "error" : p.critic,
        detail: "",
        error: message,
      }));
    } finally {
      setAnalyzingId(null);
      setBusy(false);
    }
  };

  const handleChat = async (instruction: string) => {
    if (!sequence) return;
    setBusy(true);
    setChat((c) => [
      ...c,
      { role: "user", text: instruction, at: new Date().toISOString() },
    ]);
    setPipeline((p) => ({
      ...p,
      director: "running",
      detail: "The Director is applying your note",
      error: null,
    }));
    try {
      const { result, trace } = await callAgent<{
        reply: string;
        changelog: string[];
        sequence: SequenceDoc;
      }>(
        {
          action: "revise",
          instruction,
          brief,
          sequence,
          clips: clipsPayload(media),
        },
        key
      );
      setTraces((t) => [...t, trace as AgentTraceEntry]);
      setSequence(result.sequence);
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text:
            result.reply +
            (result.changelog.length > 0
              ? ` (${result.changelog.join("; ")})`
              : ""),
          at: new Date().toISOString(),
        },
      ]);
      setPipeline((p) => ({ ...p, director: "done", detail: "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({ ...p, director: "error", detail: "", error: message }));
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------ export / attach ----------------------- */

  const assets = useMemo(() => buildAssets(media), [media]);

  const addToTimeline = (item: StudioMediaItem) => {
    const base: SequenceDoc = sequence ?? {
      version: 1,
      title: projectName,
      segments: [],
    };
    const len = Math.min(6, item.durationSec ?? 6);
    setSequence({
      ...base,
      segments: [
        ...base.segments,
        {
          id: uid("seg"),
          clipId: item.id,
          mode: item.is360 ? "pano360" : "2d",
          inSec: 0,
          outSec: Math.max(1, len),
          transitionIn:
            base.segments.length === 0
              ? { type: "cut", durationSec: 0 }
              : { type: "crossfade", durationSec: 0.9 },
          kenBurns: null,
          panoMotion: item.is360
            ? { fromYawDeg: 0, toYawDeg: 80, pitchDeg: 0 }
            : null,
          overlays: [],
          muted: true,
        },
      ],
    });
  };

  const exportJson = () => {
    if (!sequence) return;
    const sessionOnly = sequence.segments.filter(
      (s) => !media.find((m) => m.id === s.clipId)?.persisted
    );
    const doc: SequenceDoc = {
      ...sequence,
      assets: buildAssets(media, { persistedOnly: false }),
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${projectName.replace(/[^\w\-]+/g, "-").toLowerCase()}.sequence.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (sessionOnly.length > 0) {
      toast(
        "Some segments use session-only clips whose URLs will not work outside this browser session.",
        { icon: "⚠️" }
      );
    }
  };

  const loadDemoProject = () => {
    const demoMedia = media.length === 0;
    if (demoMedia) {
      // MediaBin's demo button adds clips; here we load the full project.
      import("@/lib/immersive/demo").then(({ DEMO_MEDIA }) => {
        setMedia(DEMO_MEDIA.map((m) => ({ ...m })));
        setSequence({ ...DEMO_SEQUENCE });
        setProjectName("Hybrid player test sequence");
        toast.success("Demo project loaded");
      });
    } else {
      setSequence({ ...DEMO_SEQUENCE });
      toast.success("Demo sequence loaded");
    }
  };

  /* ------------------------------ UI ------------------------------ */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-forest">
            <Clapperboard className="h-6 w-6 text-rust" />
            Studio
          </h1>
          <p className="text-sm text-warm-gray">
            AI-assisted 2D/360 hybrid editing. The cut plays live on the
            site, no render step.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadDemoProject}
            className="rounded-md border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-cream-dark"
          >
            Load demo project
          </button>
          <button
            onClick={exportJson}
            disabled={!sequence}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-cream-dark disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
          <button
            onClick={() => setAttachOpen(true)}
            disabled={!sequence}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-cream-dark disabled:opacity-50"
          >
            <Link2 className="h-3.5 w-3.5" />
            Attach to stop
          </button>
          <button
            onClick={saveToSupabase}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save project
          </button>
        </div>
      </div>

      {/* Key banner */}
      {health && !health.keyConfigured && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <KeyRound className="h-4 w-4 shrink-0 text-amber-700" />
          <p className="text-xs leading-relaxed text-amber-800">
            No ANTHROPIC_API_KEY on the server. Paste a key to use for this
            tab only, or add the variable to the environment and redeploy.
          </p>
          <input
            type="password"
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            placeholder="sk-ant-..."
            className="min-w-56 flex-1 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Project meta */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-white/60 p-4 shadow-sm md:grid-cols-[240px_1fr]">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
            Project
          </label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-ink focus:outline-none focus:ring-1 focus:ring-rust"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
            Brief for the Director
          </label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-rust"
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          {/* Player */}
          <div className="rounded-xl border border-border bg-white/60 p-4 shadow-sm">
            {sequence && sequence.segments.length > 0 ? (
              <TimelinePlayer key={projectId} doc={sequence} assets={assets} />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-sm border border-dashed border-border bg-cream">
                <p className="max-w-sm px-6 text-center text-sm text-warm-gray">
                  No cut yet. Add clips and press Generate, load the demo
                  project, or build the timeline by hand.
                </p>
              </div>
            )}
          </div>

          {sequence && (
            <TimelineEditor doc={sequence} media={media} onChange={setSequence} />
          )}

          <MediaBin
            media={media}
            onChange={setMedia}
            onAddToTimeline={addToTimeline}
            analyzingId={analyzingId}
          />
        </div>

        <div className="min-h-[540px]">
          <AgentPanel
            pipeline={pipeline}
            traces={traces}
            chat={chat}
            busy={busy}
            hasSequence={Boolean(sequence)}
            onGenerate={runPipeline}
            onChat={handleChat}
          />
        </div>
      </div>

      {attachOpen && sequence && (
        <AttachModal
          sequence={sequence}
          media={media}
          onClose={() => setAttachOpen(false)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Attach-to-stop modal                                               */
/* ================================================================== */

function AttachModal({
  sequence,
  media,
  onClose,
}: {
  sequence: SequenceDoc;
  media: StudioMediaItem[];
  onClose: () => void;
}) {
  const [tours, setTours] = useState<
    { id: string; title: string; city: string; slug: string; stops: ImmersiveStop[] }[]
  >([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">(
    "loading"
  );
  const [tourIdx, setTourIdx] = useState(0);
  const [stopIdx, setStopIdx] = useState(0);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!isSupabaseConfiguredClient()) throw new Error("unconfigured");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("immersive_tours")
          .select("id, title, city, slug, stops");
        if (error) throw error;
        setTours(
          (data ?? []).map((r) => ({
            id: r.id as string,
            title: r.title as string,
            city: r.city as string,
            slug: r.slug as string,
            stops: (r.stops as ImmersiveStop[]) ?? [],
          }))
        );
        setState("ready");
      } catch {
        setState("unavailable");
      }
    })();
  }, []);

  const sessionOnly = sequence.segments.some(
    (s) => !media.find((m) => m.id === s.clipId)?.persisted
  );

  const attach = async () => {
    const tour = tours[tourIdx];
    if (!tour) return;
    setAttaching(true);
    try {
      const doc: SequenceDoc = {
        ...sequence,
        assets: buildAssets(media, { persistedOnly: true }),
      };
      const stops = tour.stops.map((s, i) =>
        i === stopIdx ? { ...s, sequence: doc } : s
      );
      const supabase = createClient();
      const { error } = await supabase
        .from("immersive_tours")
        .update({ stops: stops as unknown })
        .eq("id", tour.id);
      if (error) throw error;
      toast.success(
        `Attached to ${tour.title}, stop ${stopIdx + 1}. It plays on the public tour page now.`
      );
      onClose();
    } catch {
      toast.error("Could not attach. Check that you are signed in as admin.");
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-cream p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-forest">
            Attach the sequence to a tour stop
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-warm-gray hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state === "loading" ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-forest" />
          </div>
        ) : state === "unavailable" ? (
          <p className="text-sm leading-relaxed text-ink/70">
            The immersive_tours table is not reachable, so attaching is
            disabled here. Run migration 006 in Supabase, or use Export JSON
            and add the sequence to the tour constants by hand.
          </p>
        ) : (
          <>
            {sessionOnly && (
              <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                Some segments use session-only clips. Save them to the
                library first or those segments will not play for visitors.
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Tour
                </label>
                <select
                  value={tourIdx}
                  onChange={(e) => {
                    setTourIdx(parseInt(e.target.value, 10));
                    setStopIdx(0);
                  }}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                >
                  {tours.map((t, i) => (
                    <option key={t.id} value={i}>
                      {t.title} ({t.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">
                  Stop
                </label>
                <select
                  value={stopIdx}
                  onChange={(e) => setStopIdx(parseInt(e.target.value, 10))}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
                >
                  {(tours[tourIdx]?.stops ?? []).map((s, i) => (
                    <option key={s.id} value={i}>
                      {String(i + 1).padStart(2, "0")} {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-cream-dark"
              >
                Cancel
              </button>
              <button
                onClick={attach}
                disabled={attaching || tours.length === 0}
                className={cn(
                  "flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
                )}
              >
                {attaching && <Loader2 className="h-4 w-4 animate-spin" />}
                Attach
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
