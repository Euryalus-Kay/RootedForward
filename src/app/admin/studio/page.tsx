"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  createClient,
  isSupabaseConfiguredClient,
} from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import TimelinePlayer, {
  type PlayerControls,
} from "@/components/immersive/TimelinePlayer";
import MediaBin from "@/components/admin/studio/MediaBin";
import TimelineEditor from "@/components/admin/studio/TimelineEditor";
import ExportModal from "@/components/admin/studio/ExportModal";
import AgentPanel, {
  type PipelineState,
} from "@/components/admin/studio/AgentPanel";
import { DEMO_SEQUENCE } from "@/lib/immersive/demo";
import {
  layoutDoc,
  segmentSpeed,
} from "@/lib/immersive/timeline";
import {
  agentHealth,
  buildAssets,
  callAgent,
  extractFrames,
  makeThumb,
  persistMediaItem,
  uid,
} from "@/lib/immersive/studio-client";
import { ORCHESTRATION_PRESETS } from "@/lib/immersive/types";
import type {
  AgentTraceEntry,
  CritiqueResult,
  OverlaysResult,
  ImmersiveStop,
  ScriptResult,
  SequenceAspect,
  SequenceDoc,
  SequenceSegment,
  StudioAgentAction,
  StudioChatMessage,
  StudioClipAnalysis,
  StudioMediaItem,
} from "@/lib/immersive/types";
import {
  ArrowLeft,
  Clapperboard,
  FlaskConical,
  Download,
  Film,
  FolderOpen,
  KeyRound,
  Link2,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Studio: the AI editor. Media bin on the left, player + timeline    */
/*  in the middle, agent pipeline and chat on the right. Undo/redo     */
/*  wraps every change, including the AI's.                            */
/* ------------------------------------------------------------------ */

const LEGACY_AUTOSAVE_KEY = "rf-studio-project-v1";
const INDEX_KEY = "rf-studio-projects-index";
const ACTIVE_KEY = "rf-studio-active-project";
const ORCH_KEY = "rf-studio-orchestration";
const projKey = (id: string) => `rf-studio-project:${id}`;
const HISTORY_CAP = 60;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProjectSnapshot {
  id: string;
  name: string;
  brief: string;
  media: StudioMediaItem[];
  sequence: SequenceDoc | null;
  chat: StudioChatMessage[];
}

interface ProjectIndexEntry {
  id: string;
  name: string;
  updatedAt: string;
}

function readIndex(): ProjectIndexEntry[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeIndex(entries: ProjectIndexEntry[]) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries.slice(0, 40)));
  } catch {
    // best effort
  }
}

/* Shared dark-chrome classes for the editor workspace */
const topBtn =
  "flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-medium text-cream/80 transition-colors hover:bg-white/10 hover:text-cream disabled:opacity-40";
const modalShell =
  "w-full rounded-xl border border-white/10 bg-[#1F1E1B] p-6 text-cream shadow-2xl";
const modalSelect =
  "w-full rounded-md border border-white/10 bg-[#141312] px-3 py-2 text-sm text-cream focus:outline-none focus:ring-1 focus:ring-rust";

const VARIATION_HINTS = [
  {
    name: "Calm",
    hint: "Calm and contemplative. Longer holds, slow Ken Burns, gentle crossfades and one dip to black, restrained text.",
  },
  {
    name: "Energetic",
    hint: "Energetic and quick. Shorter segments, harder cuts with one zoom and one wipe, a faster open, punchier titles.",
  },
  {
    name: "Documentary",
    hint: "Classic documentary rhythm. Measured pacing, lower-thirds for context, a unifying grade across the cut, the 360 moment as a clear centerpiece.",
  },
];

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
  const [sequence, setSequenceRaw] = useState<SequenceDoc | null>(null);
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
  const [orchKey, setOrchKey] = useState(ORCHESTRATION_PRESETS[0].key);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveIssue, setSaveIssue] = useState(false);
  const [cloudSavedAt, setCloudSavedAt] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [variations, setVariations] = useState<SequenceDoc[] | null>(null);
  const [loop, setLoop] = useState(false);
  const [monitorMuted, setMonitorMuted] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const hydrated = useRef(false);
  const controlsRef = useRef<PlayerControls | null>(null);
  const lastTimeSet = useRef(0);

  /* ------------------------- undo / redo -------------------------- */

  const pastRef = useRef<SequenceDoc[]>([]);
  const futureRef = useRef<SequenceDoc[]>([]);
  const [historyTick, setHistoryTick] = useState(0);

  const lastPushAt = useRef(0);

  const applySequence = useCallback(
    (next: SequenceDoc | null) => {
      setSequenceRaw((prev) => {
        if (prev) {
          futureRef.current = [];
          // Coalesce rapid-fire updates (trim drags, slider moves)
          // into roughly one undo entry per gesture instead of one
          // per pointer event.
          const now = performance.now();
          if (now - lastPushAt.current > 500) {
            pastRef.current = [...pastRef.current.slice(-HISTORY_CAP), prev];
          }
          lastPushAt.current = now;
        }
        return next;
      });
      setHistoryTick((v) => v + 1);
    },
    []
  );

  const undo = useCallback(() => {
    setSequenceRaw((current) => {
      const prev = pastRef.current.pop();
      if (!prev) return current;
      if (current) futureRef.current.push(current);
      setHistoryTick((v) => v + 1);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setSequenceRaw((current) => {
      const next = futureRef.current.pop();
      if (!next) return current;
      if (current) pastRef.current.push(current);
      setHistoryTick((v) => v + 1);
      return next;
    });
  }, []);

  void historyTick;
  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  /* ------------------------- persistence ------------------------- */

  const loadSnapshot = useCallback((snap: ProjectSnapshot) => {
    const usable = snap.media.filter((m) => !m.url.startsWith("blob:"));
    const dropped = snap.media.length - usable.length;
    setProjectId(snap.id ?? uid("proj"));
    setProjectName(snap.name ?? "Untitled sequence");
    setBrief(snap.brief ?? "");
    setMedia(usable);
    setSequenceRaw(snap.sequence ?? null);
    setChat(snap.chat ?? []);
    pastRef.current = [];
    futureRef.current = [];
    setHistoryTick((v) => v + 1);
    if (dropped > 0) {
      toast(
        `${dropped} session-only clip${dropped === 1 ? "" : "s"} did not survive the reload. Save clips to the library to keep them.`,
        { icon: "⚠️" }
      );
    }
  }, []);

  useEffect(() => {
    agentHealth().then(setHealth);
    try {
      // One-time migration of the old single-slot autosave
      const legacy = localStorage.getItem(LEGACY_AUTOSAVE_KEY);
      if (legacy) {
        const snap = JSON.parse(legacy) as ProjectSnapshot;
        if (snap.id) {
          localStorage.setItem(projKey(snap.id), legacy);
          const idx = readIndex();
          if (!idx.some((e) => e.id === snap.id)) {
            writeIndex([
              {
                id: snap.id,
                name: snap.name ?? "Untitled sequence",
                updatedAt: new Date().toISOString(),
              },
              ...idx,
            ]);
          }
          localStorage.setItem(ACTIVE_KEY, snap.id);
        }
        localStorage.removeItem(LEGACY_AUTOSAVE_KEY);
      }

      const activeId = localStorage.getItem(ACTIVE_KEY);
      const raw = activeId ? localStorage.getItem(projKey(activeId)) : null;
      if (raw) {
        loadSnapshot(JSON.parse(raw) as ProjectSnapshot);
      }

      const storedOrch = localStorage.getItem(ORCH_KEY);
      if (
        storedOrch &&
        ORCHESTRATION_PRESETS.some((p) => p.key === storedOrch)
      ) {
        setOrchKey(storedOrch);
      }
    } catch {
      // Ignore a corrupt autosave
    }
    hydrated.current = true;
  }, [loadSnapshot]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(ORCH_KEY, orchKey);
    } catch {
      // best effort
    }
  }, [orchKey]);

  const modelFor = useCallback(
    (action: StudioAgentAction) =>
      (
        ORCHESTRATION_PRESETS.find((p) => p.key === orchKey) ??
        ORCHESTRATION_PRESETS[0]
      ).models[action],
    [orchKey]
  );

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
    const writeMeta = () => {
      localStorage.setItem(ACTIVE_KEY, projectId);
      const idx = readIndex().filter((e) => e.id !== projectId);
      writeIndex([
        { id: projectId, name: projectName, updatedAt: new Date().toISOString() },
        ...idx,
      ]);
    };
    try {
      localStorage.setItem(projKey(projectId), JSON.stringify(snap));
      writeMeta();
      setSavedAt(new Date().toLocaleTimeString());
      setSaveIssue(false);
    } catch {
      // Storage is full. Thumbnails are the heavy part of a snapshot;
      // retry without them so the cut itself still survives.
      try {
        const lite: ProjectSnapshot = {
          ...snap,
          media: media.map((m) => ({ ...m, thumb: undefined })),
        };
        localStorage.setItem(projKey(projectId), JSON.stringify(lite));
        writeMeta();
        setSavedAt(new Date().toLocaleTimeString());
        setSaveIssue(false);
      } catch {
        setSaveIssue(true);
      }
    }
  }, [projectId, projectName, brief, media, sequence, chat]);

  /* ------------------------ thumbnail backfill -------------------- */

  useEffect(() => {
    const missing = media.filter((m) => m.kind !== "audio" && !m.thumb);
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const item of missing) {
        const thumb = await makeThumb(item);
        if (cancelled || !thumb) continue;
        setMedia((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, thumb } : m))
        );
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.length]);

  const saveToSupabase = async () => {
    setSaving(true);
    const note = toast.loading("Saving the project...");
    try {
      // Make every clip durable first, so the cloud copy actually
      // plays when it is opened in another browser. Failures are
      // counted, not fatal; those clips stay session-only.
      let mediaNow = media;
      let failedUploads = 0;
      for (const item of mediaNow.filter((m) => !m.persisted)) {
        toast.loading(`Uploading ${item.name} to the library...`, {
          id: note,
        });
        try {
          const durable = await persistMediaItem(item);
          mediaNow = mediaNow.map((m) => (m.id === item.id ? durable : m));
          setMedia(mediaNow);
        } catch {
          failedUploads++;
        }
      }

      toast.loading("Writing the project record...", { id: note });
      const supabase = createClient();
      const payload = {
        name: projectName,
        brief,
        media: mediaNow.filter((m) => m.persisted) as unknown,
        sequence: sequence as unknown,
        chat: chat as unknown,
      };
      // Locally minted ids are not uuids; only a project that has been
      // to Supabase before can be updated in place.
      let needsInsert = true;
      if (UUID_RE.test(projectId)) {
        const { data: updated, error: updateError } = await supabase
          .from("studio_projects")
          .update(payload)
          .eq("id", projectId)
          .select("id");
        if (updateError) throw updateError;
        needsInsert = !updated || updated.length === 0;
      }
      if (needsInsert) {
        const { data: inserted, error: insertError } = await supabase
          .from("studio_projects")
          .insert(payload)
          .select("id")
          .single();
        if (insertError) throw insertError;
        if (inserted) {
          // Move the local autosave under the id Supabase assigned so
          // the browser copy and the cloud copy stay one project.
          const newId = inserted.id as string;
          try {
            localStorage.removeItem(projKey(projectId));
            writeIndex(readIndex().filter((e) => e.id !== projectId));
          } catch {
            // best effort
          }
          setProjectId(newId);
        }
      }
      setCloudSavedAt(new Date().toLocaleTimeString());
      if (failedUploads > 0) {
        toast.error(
          `Project saved, but ${failedUploads} clip upload${failedUploads === 1 ? "" : "s"} failed. Those clips stay session-only.`,
          { id: note }
        );
      } else {
        toast.success("Project and media saved to the cloud", { id: note });
      }
    } catch {
      toast.error(
        "Could not save to Supabase. Run migration 006 and sign in as an admin. The local autosave still has your work.",
        { id: note }
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------ player wiring ------------------------ */

  const onTimeUpdate = useCallback((t: number) => {
    const now = performance.now();
    if (now - lastTimeSet.current > 90) {
      lastTimeSet.current = now;
      setPlayerTime(t);
      setPlaying(controlsRef.current?.isPlaying() ?? false);
    }
  }, []);

  /* ------------------------ split at playhead --------------------- */

  const splitAtPlayhead = useCallback(() => {
    if (!sequence) return;
    const t = controlsRef.current?.getTime() ?? playerTime;
    const { timed } = layoutDoc(sequence);
    const entry = timed.find(
      ({ startSec, lenSec }) =>
        t > startSec + 0.15 && t < startSec + lenSec - 0.15
    );
    if (!entry) {
      toast("Park the playhead inside a segment to split it");
      return;
    }
    const { seg, startSec } = entry;
    const localTimeline = t - startSec;
    const mediaSplit = seg.inSec + localTimeline * segmentSpeed(seg);
    const first: SequenceSegment = {
      ...seg,
      outSec: Math.round(mediaSplit * 100) / 100,
      overlays: (seg.overlays ?? []).filter((o) => o.startSec < localTimeline),
      stickers: (seg.stickers ?? []).filter(
        (st) => st.startSec < localTimeline
      ),
    };
    const second: SequenceSegment = {
      ...(JSON.parse(JSON.stringify(seg)) as SequenceSegment),
      id: uid("seg"),
      inSec: Math.round(mediaSplit * 100) / 100,
      transitionIn: { type: "cut", durationSec: 0 },
      overlays: (seg.overlays ?? [])
        .filter((o) => o.endSec > localTimeline)
        .map((o) => ({
          ...o,
          startSec: Math.max(0, o.startSec - localTimeline),
          endSec: o.endSec - localTimeline,
        })),
      stickers: (seg.stickers ?? [])
        .filter((st) => st.endSec > localTimeline)
        .map((st) => ({
          ...st,
          id: uid("st"),
          startSec: Math.max(0, st.startSec - localTimeline),
          endSec: st.endSec - localTimeline,
        })),
    };
    const idx = sequence.segments.findIndex((s) => s.id === seg.id);
    const next = [...sequence.segments];
    next.splice(idx, 1, first, second);
    applySequence({ ...sequence, segments: next });
  }, [sequence, playerTime, applySequence]);

  /* ----------------------- keyboard shortcuts --------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }
      const c = controlsRef.current;
      if (e.key === " ") {
        e.preventDefault();
        c?.toggle();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        c?.seek((c?.getTime() ?? 0) + (e.shiftKey ? 5 : 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        c?.seek(Math.max(0, (c?.getTime() ?? 0) - (e.shiftKey ? 5 : 1)));
      } else if (e.key === "," || e.key === ".") {
        e.preventDefault();
        const step = 1 / 30;
        c?.seek(
          Math.max(0, (c?.getTime() ?? 0) + (e.key === "." ? step : -step))
        );
      } else if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        splitAtPlayhead();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        undo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [splitAtPlayhead, undo, redo]);

  /* --------------------------- pipeline --------------------------- */

  const key = sessionKey.trim() || null;

  const ensureAnalyses = useCallback(
    async (items: StudioMediaItem[]): Promise<StudioMediaItem[]> => {
      const out = [...items];
      for (let i = 0; i < out.length; i++) {
        const item = out[i];
        if (item.analysis || item.kind === "audio") continue;
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
            model: modelFor("analyze"),
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
        setMedia((prev) => prev.map((m) => (m.id === out[i].id ? out[i] : m)));
      }
      setAnalyzingId(null);
      return out;
    },
    [key, modelFor]
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
    if (media.filter((m) => m.kind !== "audio").length === 0) {
      toast.error("Add clips to the media bin first");
      return;
    }
    setBusy(true);
    setTraces([]);
    setPipeline({ ...IDLE_PIPELINE, detail: "Starting" });
    try {
      const analyzed = await ensureAnalyses(media);
      setPipeline((p) => ({ ...p, analyst: "done" }));

      setPipeline((p) => ({
        ...p,
        director: "running",
        detail: "The Director is building the cut",
      }));
      const directed = await callAgent<SequenceDoc>(
        {
          action: "direct",
          model: modelFor("direct"),
          brief,
          clips: clipsPayload(analyzed),
        },
        key
      );
      setTraces((t) => [...t, directed.trace as AgentTraceEntry]);
      let docNext = directed.result;
      setPipeline((p) => ({ ...p, director: "done" }));

      setPipeline((p) => ({
        ...p,
        critic: "running",
        detail: "The Critic is reviewing pacing and continuity",
      }));
      const critiqued = await callAgent<CritiqueResult>(
        {
          action: "critique",
          model: modelFor("critique"),
          brief,
          sequence: docNext,
          clips: clipsPayload(analyzed),
        },
        key
      );
      setTraces((t) => [...t, critiqued.trace as AgentTraceEntry]);
      const verdict = critiqued.result;
      if (verdict.verdict === "revise" && verdict.revisedSequence) {
        docNext = verdict.revisedSequence;
      }
      setPipeline((p) => ({ ...p, critic: "done", detail: "" }));

      applySequence(docNext);
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `Cut ready, "${docNext.title}". ${docNext.notes ?? ""}${
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
        sequence: SequenceDoc | null;
      }>(
        {
          action: "revise",
          model: modelFor("revise"),
          instruction,
          brief,
          sequence,
          clips: clipsPayload(media),
          chatContext: chat.slice(-8).map((m) => ({
            role: m.role,
            text: m.text.slice(0, 400),
          })),
        },
        key
      );
      setTraces((t) => [...t, trace as AgentTraceEntry]);
      // A null sequence means the Director answered a question and
      // left the cut alone.
      if (result.sequence) {
        const next = result.sequence;
        // A revision that was not about subtitles or narration must
        // not lose them, even if the model dropped them.
        const keepSubs =
          (next.subtitles?.length ?? 0) === 0 &&
          (sequence.subtitles?.length ?? 0) > 0 &&
          !/subtitle|caption|cue/i.test(instruction);
        const keepVo =
          !next.voiceover &&
          Boolean(sequence.voiceover) &&
          !/voiceover|narration|voice/i.test(instruction);
        applySequence({
          ...next,
          subtitles: keepSubs ? sequence.subtitles : next.subtitles,
          voiceover: keepVo ? sequence.voiceover : next.voiceover,
        });
      }
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
      setPipeline((p) => ({
        ...p,
        director: "error",
        detail: "",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleSegmentAI = async (segmentId: string, instruction: string) => {
    if (!sequence) return;
    setBusy(true);
    setPipeline((p) => ({
      ...p,
      director: "running",
      detail: "The Director is editing the selected segment",
      error: null,
    }));
    try {
      const { result, trace } = await callAgent<{
        reply: string;
        segment: SequenceSegment;
      }>(
        {
          action: "revise-segment",
          model: modelFor("revise-segment"),
          instruction,
          brief,
          segmentId,
          sequence,
          clips: clipsPayload(media),
        },
        key
      );
      setTraces((t) => [...t, trace as AgentTraceEntry]);
      applySequence({
        ...sequence,
        segments: sequence.segments.map((s) =>
          s.id === segmentId ? result.segment : s
        ),
      });
      setChat((c) => [
        ...c,
        {
          role: "user",
          text: `(segment) ${instruction}`,
          at: new Date().toISOString(),
        },
        { role: "assistant", text: result.reply, at: new Date().toISOString() },
      ]);
      setPipeline((p) => ({ ...p, director: "done", detail: "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({
        ...p,
        director: "error",
        detail: "",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  };

  const runVariations = async () => {
    if (media.filter((m) => m.kind !== "audio").length === 0) {
      toast.error("Add clips to the media bin first");
      return;
    }
    setBusy(true);
    setPipeline({ ...IDLE_PIPELINE, detail: "Starting" });
    try {
      const analyzed = await ensureAnalyses(media);
      setPipeline((p) => ({
        ...p,
        analyst: "done",
        director: "running",
        detail: "Three Directors are cutting in parallel",
      }));
      const results = await Promise.all(
        VARIATION_HINTS.map((v) =>
          callAgent<SequenceDoc>(
            {
              action: "direct",
              model: modelFor("direct"),
              brief,
              styleHint: v.hint,
              clips: clipsPayload(analyzed),
            },
            key
          ).then((r) => {
            setTraces((t) => [...t, r.trace as AgentTraceEntry]);
            return { ...r.result, notes: `${v.name}. ${r.result.notes ?? ""}` };
          })
        )
      );
      setPipeline((p) => ({ ...p, director: "done", detail: "" }));
      setVariations(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({
        ...p,
        analyst: p.analyst === "running" ? "error" : "done",
        director: "error",
        detail: "",
        error: message,
      }));
    } finally {
      setAnalyzingId(null);
      setBusy(false);
    }
  };

  const handleScript = async () => {
    if (!sequence) return;
    setBusy(true);
    setPipeline((p) => ({
      ...p,
      director: "running",
      detail: "The Director is writing narration and subtitles",
      error: null,
    }));
    try {
      const { result, trace } = await callAgent<ScriptResult>(
        {
          action: "script",
          model: modelFor("script"),
          brief,
          sequence,
          clips: clipsPayload(media),
        },
        key
      );
      setTraces((t) => [...t, trace as AgentTraceEntry]);
      applySequence({ ...sequence, subtitles: result.subtitles });
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `Narration script (record it with the mic in the media bin, then set it as the voiceover track):\n\n${result.narration}\n\n${result.subtitles.length} subtitle cues were added to the timeline. ${result.notes}`,
          at: new Date().toISOString(),
        },
      ]);
      setPipeline((p) => ({ ...p, director: "done", detail: "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({
        ...p,
        director: "error",
        detail: "",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleOverlayMove = useCallback(
    (segmentId: string, overlayIndex: number, xPct: number, yPct: number) => {
      if (!sequence) return;
      applySequence({
        ...sequence,
        segments: sequence.segments.map((s) =>
          s.id !== segmentId
            ? s
            : {
                ...s,
                overlays: (s.overlays ?? []).map((o, i) =>
                  i === overlayIndex ? { ...o, xPct, yPct } : o
                ),
              }
        ),
      });
    },
    [sequence, applySequence]
  );

  const handleTitles = async () => {
    if (!sequence) return;
    setBusy(true);
    setPipeline((p) => ({
      ...p,
      director: "running",
      detail: "The Director is designing the text layer",
      error: null,
    }));
    try {
      const { result, trace } = await callAgent<OverlaysResult>(
        {
          action: "overlays",
          model: modelFor("direct"),
          brief,
          sequence,
          clips: clipsPayload(media),
        },
        key
      );
      setTraces((t) => [...t, trace as AgentTraceEntry]);
      const byId = new Map(result.items.map((it) => [it.segmentId, it.overlays]));
      applySequence({
        ...sequence,
        segments: sequence.segments.map((s) =>
          byId.has(s.id) ? { ...s, overlays: byId.get(s.id)! } : s
        ),
      });
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          text: `Text pass done. ${result.reply}`,
          at: new Date().toISOString(),
        },
      ]);
      setPipeline((p) => ({ ...p, director: "done", detail: "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({
        ...p,
        director: "error",
        detail: "",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  };

  const handlePolish = async () => {
    if (!sequence) return;
    setBusy(true);
    setPipeline((p) => ({
      ...p,
      critic: "running",
      detail: "The Critic is reviewing the current cut",
      error: null,
    }));
    try {
      const { result, trace } = await callAgent<CritiqueResult>(
        {
          action: "critique",
          model: modelFor("critique"),
          brief,
          sequence,
          clips: clipsPayload(media),
        },
        key
      );
      setTraces((t) => [...t, trace as AgentTraceEntry]);
      if (result.verdict === "revise" && result.revisedSequence) {
        applySequence(result.revisedSequence);
        setChat((c) => [
          ...c,
          {
            role: "assistant",
            text: `Polish pass applied. ${result.issues.slice(0, 4).join(" ")} ${result.pacingNotes}`,
            at: new Date().toISOString(),
          },
        ]);
      } else {
        setChat((c) => [
          ...c,
          {
            role: "assistant",
            text: `The Critic approved the cut as it stands. ${result.pacingNotes}`,
            at: new Date().toISOString(),
          },
        ]);
      }
      setPipeline((p) => ({ ...p, critic: "done", detail: "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPipeline((p) => ({
        ...p,
        critic: "error",
        detail: "",
        error: message,
      }));
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------ export / attach ----------------------- */

  const assets = useMemo(() => buildAssets(media), [media]);

  const usedClipIds = useMemo(() => {
    const ids = new Set<string>();
    if (sequence) {
      for (const s of sequence.segments) {
        ids.add(s.clipId);
        for (const st of s.stickers ?? []) ids.add(st.assetId);
      }
      if (sequence.music) ids.add(sequence.music.clipId);
      if (sequence.voiceover) ids.add(sequence.voiceover.clipId);
    }
    return ids;
  }, [sequence]);

  const insertClipAt = useCallback(
    (clipId: string, index: number) => {
      const item = media.find((m) => m.id === clipId);
      if (!item || item.kind === "audio") return;
      const base: SequenceDoc = sequence ?? {
        version: 1,
        title: projectName,
        segments: [],
      };
      const len = Math.min(6, item.durationSec ?? 6);
      const at = Math.max(0, Math.min(index, base.segments.length));
      const seg: SequenceSegment = {
        id: uid("seg"),
        clipId: item.id,
        mode: item.is360 ? "pano360" : "2d",
        inSec: 0,
        outSec: Math.max(1, len),
        transitionIn:
          at === 0
            ? { type: "cut", durationSec: 0 }
            : { type: "crossfade", durationSec: 0.9 },
        kenBurns: null,
        panoMotion: item.is360
          ? { fromYawDeg: 0, toYawDeg: 80, pitchDeg: 0 }
          : null,
        overlays: [],
        muted: true,
      };
      const next = [...base.segments];
      next.splice(at, 0, seg);
      applySequence({ ...base, segments: next });
    },
    [media, sequence, projectName, applySequence]
  );

  const addToTimeline = (item: StudioMediaItem) => {
    insertClipAt(item.id, sequence?.segments.length ?? 0);
  };

  const exportJson = () => {
    if (!sequence) return;
    const sessionOnly = sequence.segments.filter(
      (s) => !media.find((m) => m.id === s.clipId)?.persisted
    );
    const docOut: SequenceDoc = {
      ...sequence,
      assets: buildAssets(media, { persistedOnly: false }),
    };
    const blob = new Blob([JSON.stringify(docOut, null, 2)], {
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
    if (media.length === 0) {
      import("@/lib/immersive/demo").then(({ DEMO_MEDIA }) => {
        setMedia(DEMO_MEDIA.map((m) => ({ ...m })));
        applySequence(JSON.parse(JSON.stringify(DEMO_SEQUENCE)));
        setProjectName("Hybrid player test sequence");
        toast.success("Demo project loaded");
      });
    } else {
      applySequence(JSON.parse(JSON.stringify(DEMO_SEQUENCE)));
      toast.success("Demo sequence loaded");
    }
  };

  const setAspect = (aspect: SequenceAspect) => {
    if (!sequence) return;
    applySequence({ ...sequence, aspect });
  };

  /* --------------------- workspace measurements -------------------- */

  const monitorRef = useRef<HTMLDivElement>(null);
  const [monitorSize, setMonitorSize] = useState({ w: 0, h: 0 });
  const [dockH, setDockH] = useState(330);

  // Size the dock to the window once on mount so short laptop
  // viewports keep the whole AI panel visible without scrolling.
  useEffect(() => {
    setDockH(Math.max(200, Math.min(330, window.innerHeight - 502)));
  }, []);

  useEffect(() => {
    const el = monitorRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setMonitorSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onDockResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const orig = dockH;
    // Never let the dock starve the workspace row of its ~230px floor.
    const maxH = Math.max(240, window.innerHeight - 280);
    const move = (ev: PointerEvent) =>
      setDockH(Math.min(maxH, Math.max(200, orig + (startY - ev.clientY))));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Fit the player inside the monitor area. The player is a width-
  // driven aspect box with roughly 92px of controls under it.
  const aspectNow = sequence?.aspect ?? "16:9";
  const [aspectW, aspectH] =
    aspectNow === "9:16" ? [9, 16] : aspectNow === "1:1" ? [1, 1] : [16, 9];
  const playerW = Math.max(
    200,
    Math.min(
      (monitorSize.w || 880) - 48,
      ((monitorSize.h || 520) - 124) * (aspectW / aspectH)
    )
  );

  /* ------------------------------ UI ------------------------------ */

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#141312] text-cream"
      style={{ colorScheme: "dark" }}
    >
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 bg-[#1B1A18] px-3">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-warm-gray transition-colors hover:bg-white/10 hover:text-cream"
          title="Back to the admin dashboard"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Exit
        </Link>
        <span className="h-5 w-px shrink-0 bg-white/10" />
        <Clapperboard className="h-4 w-4 shrink-0 text-rust" />
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-44 min-w-0 shrink rounded-md border border-transparent bg-transparent px-1.5 py-1 font-display text-sm font-semibold text-cream focus:border-white/15 focus:outline-none"
          title="Project name"
        />
        <p className="hidden min-w-0 truncate text-[10px] text-warm-gray lg:block">
          {saveIssue ? (
            <span className="font-medium text-amber-400">
              Autosave could not write (storage full). Use Save to cloud.
            </span>
          ) : savedAt ? (
            <>Autosaved in this browser {savedAt}</>
          ) : (
            <>Autosave is on</>
          )}
          {cloudSavedAt ? <> &middot; cloud {cloudSavedAt}</> : null}
        </p>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="mr-1 hidden rounded-md border border-white/10 p-0.5 md:flex">
            {(["16:9", "9:16", "1:1"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAspect(a)}
                disabled={!sequence}
                className={cn(
                  "rounded px-2 py-1 text-[10px] font-semibold transition-colors disabled:opacity-40",
                  (sequence?.aspect ?? "16:9") === a
                    ? "bg-rust text-cream"
                    : "text-cream/50 hover:text-cream"
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <button
            onClick={() => setProjectsOpen(true)}
            className={topBtn}
            title="Projects"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Projects</span>
          </button>
          <button
            onClick={loadDemoProject}
            className={topBtn}
            title="Load demo project"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Load demo project</span>
          </button>
          <button
            onClick={exportJson}
            disabled={!sequence}
            className={topBtn}
            title="Download the sequence as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">JSON</span>
          </button>
          <button
            onClick={() => setAttachOpen(true)}
            disabled={!sequence}
            className={topBtn}
            title="Attach the sequence to a tour stop"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Attach</span>
          </button>
          <button
            onClick={() => setExportOpen(true)}
            disabled={!sequence || sequence.segments.length === 0}
            className="flex items-center gap-1.5 rounded-md border border-rust/50 px-2.5 py-1.5 text-xs font-medium text-rust-light transition-colors hover:bg-rust/10 disabled:opacity-40"
          >
            <Film className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Export video</span>
          </button>
          <button
            onClick={saveToSupabase}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-rust px-2.5 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-rust-light disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save to cloud
          </button>
        </div>
      </header>

      {/* Key banner */}
      {health && !health.keyConfigured && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-amber-400/20 bg-amber-400/10 px-4 py-2">
          <KeyRound className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-amber-200">
            No ANTHROPIC_API_KEY on the server. Paste a key to use for this
            tab only, or add the variable to the environment and redeploy.
          </p>
          <input
            type="password"
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            placeholder="sk-ant-..."
            className="min-w-56 flex-1 rounded-md border border-amber-400/30 bg-[#141312] px-3 py-1.5 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      )}

      {/* Workspace: media rail, monitor, AI panel */}
      <div className="flex min-h-0 flex-1 max-lg:flex-col max-lg:overflow-y-auto">
        <aside className="w-[272px] shrink-0 overflow-hidden border-r border-white/10 max-lg:h-80 max-lg:w-full max-lg:border-b max-lg:border-r-0">
          <MediaBin
            media={media}
            onChange={setMedia}
            onAddToTimeline={addToTimeline}
            analyzingId={analyzingId}
            usedClipIds={usedClipIds}
          />
        </aside>

        <main
          ref={monitorRef}
          className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[#0E0D0C] p-4 max-lg:min-h-[340px]"
        >
          {sequence && sequence.segments.length > 0 ? (
            <div style={{ width: playerW }} className="max-w-full">
              <TimelinePlayer
                key={projectId}
                doc={sequence}
                assets={assets}
                loop={loop}
                onTimeUpdate={onTimeUpdate}
                controlsRef={controlsRef}
                defaultMuted={false}
                onMutedChange={setMonitorMuted}
                editable
                onOverlayMove={handleOverlayMove}
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full max-w-xl items-center justify-center rounded-md border border-dashed border-white/15">
              <p className="max-w-sm px-6 text-center text-sm text-warm-gray">
                No cut yet. Add clips and press Generate, load the demo
                project, or build the timeline by hand.
              </p>
            </div>
          )}
        </main>

        <aside className="w-[340px] shrink-0 overflow-hidden border-l border-white/10 max-lg:h-[520px] max-lg:w-full max-lg:border-l-0 max-lg:border-t">
          <AgentPanel
            pipeline={pipeline}
            traces={traces}
            chat={chat}
            busy={busy}
            hasSequence={Boolean(sequence)}
            brief={brief}
            onBrief={setBrief}
            orchKey={orchKey}
            onOrchKey={setOrchKey}
            onGenerate={runPipeline}
            onChat={handleChat}
            onScript={handleScript}
            onVariations={runVariations}
            onPolish={handlePolish}
            onTitles={handleTitles}
          />
        </aside>
      </div>

      {/* Timeline dock */}
      {sequence && (
        <>
          <div
            onPointerDown={onDockResize}
            onDoubleClick={() => setDockH(330)}
            className="h-1.5 shrink-0 cursor-row-resize bg-white/10 transition-colors hover:bg-rust/50 max-lg:hidden"
            title="Drag to resize the timeline. Double-click to reset."
          />
          <div
            className="relative z-10 shrink-0 bg-[#1B1A18]"
            style={{ height: dockH }}
          >
            <TimelineEditor
              doc={sequence}
              media={media}
              onChange={applySequence}
              playerTime={playerTime}
              controls={controlsRef}
              playing={playing}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              loop={loop}
              onToggleLoop={() => setLoop((v) => !v)}
              muted={monitorMuted}
              onToggleMute={() =>
                controlsRef.current?.setMuted(!monitorMuted)
              }
              onSplit={splitAtPlayhead}
              onInsertClip={insertClipAt}
              onSegmentAI={handleSegmentAI}
              aiBusy={busy}
            />
          </div>
        </>
      )}

      {attachOpen && sequence && (
        <AttachModal
          sequence={sequence}
          media={media}
          onClose={() => setAttachOpen(false)}
        />
      )}

      {exportOpen && sequence && (
        <ExportModal
          doc={sequence}
          assets={assets}
          projectName={projectName}
          onClose={() => setExportOpen(false)}
        />
      )}

      {variations && (
        <VariationsModal
          variations={variations}
          onAdopt={(doc) => {
            applySequence(doc);
            setVariations(null);
            setChat((c) => [
              ...c,
              {
                role: "assistant",
                text: `Adopted "${doc.title}". ${doc.notes ?? ""}`,
                at: new Date().toISOString(),
              },
            ]);
          }}
          onClose={() => setVariations(null)}
        />
      )}

      {projectsOpen && (
        <ProjectsModal
          activeId={projectId}
          onNew={() => {
            loadSnapshot({
              id: uid("proj"),
              name: "Untitled sequence",
              brief:
                "A short hybrid teaser for the underwater Chicago tour. Open with a title, descend, give one 360 look-around moment, end calm.",
              media: [],
              sequence: null,
              chat: [],
            });
            setProjectsOpen(false);
          }}
          onOpen={(snap) => {
            loadSnapshot(snap);
            setProjectsOpen(false);
          }}
          onClose={() => setProjectsOpen(false)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Variations picker                                                  */
/* ================================================================== */

function VariationsModal({
  variations,
  onAdopt,
  onClose,
}: {
  variations: SequenceDoc[];
  onAdopt: (doc: SequenceDoc) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={cn(modalShell, "max-w-3xl")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-cream">
            Three directions on the same material
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-warm-gray hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {variations.map((doc, i) => {
            const { total } = layoutDoc(doc);
            const pano = doc.segments.filter(
              (s) => s.mode === "pano360"
            ).length;
            return (
              <div
                key={i}
                className="flex flex-col rounded-lg border border-white/10 bg-[#26241F] p-4"
              >
                <p className="font-display text-base font-semibold leading-snug text-cream">
                  {doc.title}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-warm-gray">
                  {total.toFixed(0)}s &middot; {doc.segments.length} segments
                  {pano > 0 ? ` · ${pano} in 360` : ""}
                </p>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full">
                  {doc.segments.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "h-full",
                        s.mode === "pano360" ? "bg-rust" : "bg-cream/25"
                      )}
                      style={{
                        flexGrow: Math.max(
                          0.2,
                          (s.outSec - s.inSec) / (s.speed ?? 1)
                        ),
                      }}
                    />
                  ))}
                </div>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-cream/70">
                  {doc.notes}
                </p>
                <button
                  onClick={() => onAdopt(doc)}
                  className="mt-4 rounded-md bg-rust px-3 py-2 text-xs font-semibold text-cream transition-colors hover:bg-rust-light"
                >
                  Use this cut
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-warm-gray">
          Adopting a cut replaces the current timeline. Undo brings the old
          one back.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Projects drawer                                                    */
/* ================================================================== */

function ProjectsModal({
  activeId,
  onNew,
  onOpen,
  onClose,
}: {
  activeId: string;
  onNew: () => void;
  onOpen: (snap: ProjectSnapshot) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ProjectIndexEntry[]>([]);
  const [remote, setRemote] = useState<
    { id: string; name: string; updated_at: string }[] | null
  >(null);

  useEffect(() => {
    setLocal(readIndex());
    (async () => {
      try {
        if (!isSupabaseConfiguredClient()) throw new Error("unconfigured");
        const supabase = createClient();
        const { data, error } = await supabase
          .from("studio_projects")
          .select("id, name, updated_at")
          .order("updated_at", { ascending: false })
          .limit(25);
        if (error) throw error;
        setRemote(
          (data ?? []) as { id: string; name: string; updated_at: string }[]
        );
      } catch {
        setRemote(null);
      }
    })();
  }, []);

  const openLocal = (id: string) => {
    try {
      const raw = localStorage.getItem(projKey(id));
      if (!raw) throw new Error("missing");
      onOpen(JSON.parse(raw) as ProjectSnapshot);
    } catch {
      toast.error("That project could not be read from this browser");
    }
  };

  const deleteLocal = (id: string) => {
    localStorage.removeItem(projKey(id));
    const next = readIndex().filter((e) => e.id !== id);
    writeIndex(next);
    setLocal(next);
  };

  const openRemote = async (id: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("studio_projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) throw error ?? new Error("missing");
      onOpen({
        id: data.id as string,
        name: (data.name as string) ?? "Untitled sequence",
        brief: (data.brief as string) ?? "",
        media: (data.media as StudioMediaItem[]) ?? [],
        sequence: (data.sequence as SequenceDoc | null) ?? null,
        chat: (data.chat as StudioChatMessage[]) ?? [],
      });
    } catch {
      toast.error("Could not load that project from Supabase");
    }
  };

  const deleteRemote = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("studio_projects")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setRemote((r) => (r ? r.filter((e) => e.id !== id) : r));
    } catch {
      toast.error("Could not delete that project");
    }
  };

  const row =
    "flex items-center justify-between gap-2 rounded-md border border-white/10 bg-[#26241F] px-3 py-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={cn(modalShell, "max-h-[85vh] max-w-lg overflow-y-auto")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-cream">
            Projects
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onNew}
              className="rounded-md bg-rust px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-rust-light"
            >
              New project
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-warm-gray hover:text-cream"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
          In this browser
        </p>
        {local.length === 0 ? (
          <p className="mt-1 text-xs text-warm-gray">None yet.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {local.map((e) => (
              <li key={e.id} className={row}>
                <button
                  onClick={() => openLocal(e.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-cream hover:text-rust-light"
                >
                  {e.name}
                  {e.id === activeId && (
                    <span className="ml-2 rounded-full bg-rust/15 px-2 py-0.5 text-[9px] font-semibold uppercase text-rust-light">
                      open
                    </span>
                  )}
                </button>
                <span className="shrink-0 font-mono text-[10px] text-warm-gray">
                  {new Date(e.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteLocal(e.id)}
                  disabled={e.id === activeId}
                  className="rounded-md p-1 text-warm-gray hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                  title="Remove from this browser"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
          Saved to Supabase
        </p>
        {remote === null ? (
          <p className="mt-1 text-xs text-warm-gray">
            Not reachable here. Run migration 006 and sign in as admin to
            save projects across devices.
          </p>
        ) : remote.length === 0 ? (
          <p className="mt-1 text-xs text-warm-gray">
            None yet. Use Save project to put this one there.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {remote.map((e) => (
              <li key={e.id} className={row}>
                <button
                  onClick={() => openRemote(e.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-cream hover:text-rust-light"
                >
                  {e.name}
                </button>
                <span className="shrink-0 font-mono text-[10px] text-warm-gray">
                  {new Date(e.updated_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteRemote(e.id)}
                  className="rounded-md p-1 text-warm-gray hover:bg-red-500/10 hover:text-red-400"
                  title="Delete from Supabase"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
    {
      id: string;
      title: string;
      city: string;
      slug: string;
      stops: ImmersiveStop[];
    }[]
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={cn(modalShell, "max-w-lg")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-cream">
            Attach the sequence to a tour stop
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-warm-gray hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state === "loading" ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-rust" />
          </div>
        ) : state === "unavailable" ? (
          <p className="text-sm leading-relaxed text-cream/70">
            The immersive_tours table is not reachable, so attaching is
            disabled here. Run migration 006 in Supabase, or use Export JSON
            and add the sequence to the tour constants by hand.
          </p>
        ) : (
          <>
            {sessionOnly && (
              <p className="mb-3 rounded-md bg-amber-400/10 px-3 py-2 text-xs leading-relaxed text-amber-200">
                Some segments use session-only clips. Save them to the
                library first or those segments will not play for visitors.
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-cream">
                  Tour
                </label>
                <select
                  value={tourIdx}
                  onChange={(e) => {
                    setTourIdx(parseInt(e.target.value, 10));
                    setStopIdx(0);
                  }}
                  className={modalSelect}
                >
                  {tours.map((t, i) => (
                    <option key={t.id} value={i}>
                      {t.title} ({t.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-cream">
                  Stop
                </label>
                <select
                  value={stopIdx}
                  onChange={(e) => setStopIdx(parseInt(e.target.value, 10))}
                  className={modalSelect}
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
                className="rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-cream hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={attach}
                disabled={attaching || tours.length === 0}
                className="flex items-center gap-2 rounded-md bg-rust px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-rust-light disabled:opacity-50"
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
