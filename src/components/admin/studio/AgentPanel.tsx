"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ORCHESTRATION_PRESETS } from "@/lib/immersive/types";
import type {
  AgentTraceEntry,
  StudioAgentAction,
  StudioChatMessage,
} from "@/lib/immersive/types";
import {
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  AgentPanel: the right-hand AI column of the editor workspace.      */
/*  Brief, pipeline status board (Analyst, Director, Critic), and the  */
/*  revision chat with the Director. Dark editor chrome.               */
/* ------------------------------------------------------------------ */

export type StageState = "idle" | "running" | "done" | "error";

export interface PipelineState {
  analyst: StageState;
  director: StageState;
  critic: StageState;
  detail: string;
  error: string | null;
}

interface AgentPanelProps {
  pipeline: PipelineState;
  traces: AgentTraceEntry[];
  chat: StudioChatMessage[];
  busy: boolean;
  hasSequence: boolean;
  brief: string;
  onBrief: (brief: string) => void;
  orchKey: string;
  onOrchKey: (key: string) => void;
  onGenerate: () => void;
  onChat: (instruction: string) => void;
  onScript: () => void;
  onVariations: () => void;
  onPolish: () => void;
  onTitles: () => void;
}

/** "claude-fable-5" renders as "fable-5" in the tight stage rows. */
function shortModel(model: string): string {
  return model.replace(/^claude-/, "");
}

const QUICK_ACTIONS: { label: string; instruction: string }[] = [
  {
    label: "Tighten pacing",
    instruction:
      "Tighten the pacing. Trim slack from every segment, keep the strongest material, aim for a noticeably shorter cut without losing the story.",
  },
  {
    label: "Underwater mood",
    instruction:
      "Give the whole cut an underwater mood. Apply a cool teal grade to the 2D segments, slow the calmest segment slightly, and use a ripple transition once where it lands best.",
  },
  {
    label: "Stronger titles",
    instruction:
      "Improve the text. Give the opening a large styled title with a slide-up animation, add one lower-third where context helps, and keep everything under 60 characters.",
  },
];

const STAGES: {
  key: keyof Omit<PipelineState, "detail" | "error">;
  action: StudioAgentAction;
  name: string;
  blurb: string;
}[] = [
  { key: "analyst", action: "analyze", name: "Analyst", blurb: "Watches every clip" },
  { key: "director", action: "direct", name: "Director", blurb: "Builds the cut" },
  { key: "critic", action: "critique", name: "Critic", blurb: "Checks pacing and continuity" },
];

function StageIcon({ state }: { state: StageState }) {
  switch (state) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-rust-light" />;
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Circle className="h-4 w-4 text-white/20" />;
  }
}

export default function AgentPanel({
  pipeline,
  traces,
  chat,
  busy,
  hasSequence,
  brief,
  onBrief,
  orchKey,
  onOrchKey,
  onGenerate,
  onChat,
  onScript,
  onVariations,
  onPolish,
  onTitles,
}: AgentPanelProps) {
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const orch =
    ORCHESTRATION_PRESETS.find((p) => p.key === orchKey) ??
    ORCHESTRATION_PRESETS[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, pipeline.detail]);

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onChat(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1B1A18]">
      <div className="shrink-0 border-b border-white/10 px-3 py-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-cream">
          <Bot className="h-4 w-4 text-rust" />
          Agent pipeline
        </h2>
        <div className="mt-1.5 flex items-center gap-2">
          <label
            htmlFor="studio-orchestration"
            className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray"
          >
            Models
          </label>
          <select
            id="studio-orchestration"
            value={orch.key}
            onChange={(e) => onOrchKey(e.target.value)}
            disabled={busy}
            title={orch.blurb}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-[#141312] px-2 py-1 text-[11px] font-medium text-cream focus:outline-none focus:ring-1 focus:ring-rust disabled:opacity-60"
          >
            {ORCHESTRATION_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Brief + stage board scroll when the panel is squeezed, so
          every control stays reachable at small viewport heights. */}
      <div className="min-h-0 shrink overflow-y-auto">
      {/* Brief */}
      <div className="border-b border-white/10 px-3 py-2.5">
        <label
          htmlFor="studio-brief"
          className="text-[10px] font-semibold uppercase tracking-wider text-warm-gray"
        >
          Brief for the Director
        </label>
        <textarea
          id="studio-brief"
          value={brief}
          onChange={(e) => onBrief(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-md border border-white/10 bg-[#141312] px-2.5 py-1.5 text-xs leading-relaxed text-cream placeholder:text-warm-gray focus:outline-none focus:ring-1 focus:ring-rust"
          placeholder="What should this cut be?"
        />
      </div>

      {/* Stage board */}
      <div className="border-b border-white/10 px-3 py-3">
        <ol className="space-y-2">
          {STAGES.map((stage) => (
            <li key={stage.key} className="flex items-center gap-2.5">
              <StageIcon state={pipeline[stage.key]} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-cream">
                  {stage.name}
                  <span className="ml-1.5 rounded-sm bg-white/10 px-1 py-px font-mono text-[9px] font-normal text-warm-gray-light">
                    {shortModel(orch.models[stage.action])}
                  </span>
                </p>
                <p className="truncate text-[11px] text-warm-gray">
                  {stage.blurb}
                </p>
              </div>
              {traces
                .filter((t) => t.agent === stage.key)
                .slice(-1)
                .map((t, i) => (
                  <span key={i} className="font-mono text-[10px] text-warm-gray">
                    {(t.ms / 1000).toFixed(1)}s
                  </span>
                ))}
            </li>
          ))}
        </ol>

        {pipeline.detail && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rust-light">
            {busy && <Loader2 className="h-3 w-3 animate-spin" />}
            {pipeline.detail}
          </p>
        )}
        {pipeline.error && (
          <p className="mt-2 rounded-md bg-red-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-red-300">
            {pipeline.error}
          </p>
        )}

        <button
          onClick={onGenerate}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-rust px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-rust-light disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {hasSequence ? "Regenerate the cut" : "Generate the cut"}
        </button>
        <button
          onClick={onVariations}
          disabled={busy}
          className="mt-1.5 w-full rounded-md border border-rust/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-rust-light transition-colors hover:bg-rust/10 disabled:opacity-50"
        >
          3 variations, pick one
        </button>

        {hasSequence && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                onClick={() => onChat(qa.instruction)}
                disabled={busy}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-cream/60 transition-colors hover:border-rust/60 hover:text-rust-light disabled:opacity-50"
              >
                {qa.label}
              </button>
            ))}
            <button
              onClick={onScript}
              disabled={busy}
              className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/10 disabled:opacity-50"
            >
              Write narration + subtitles
            </button>
            <button
              onClick={onTitles}
              disabled={busy}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-cream/60 transition-colors hover:border-rust/60 hover:text-rust-light disabled:opacity-50"
              title="A text-only AI pass: titles, lower-thirds, placement"
            >
              Design titles
            </button>
            <button
              onClick={onPolish}
              disabled={busy}
              className="rounded-full border border-rust/40 bg-rust/5 px-2.5 py-1 text-[10px] font-semibold text-rust-light transition-colors hover:bg-rust/10 disabled:opacity-50"
              title="Run the Critic on the current cut and apply its fixes"
            >
              Polish pass
            </button>
          </div>
        )}
      </div>

      </div>

      {/* Chat */}
      <div className="flex min-h-[150px] flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {chat.length === 0 ? (
            <p className="text-xs leading-relaxed text-warm-gray">
              After a cut exists, direct changes or ask questions here. Try
              &ldquo;tighten the opening&rdquo;, &ldquo;add a ripple into
              the 360 scene&rdquo;, or &ldquo;why did you order it this
              way?&rdquo;. The Director sees the whole timeline, subtitles
              and audio included.
            </p>
          ) : (
            chat.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-rust/90 text-cream"
                    : "bg-[#26241F] text-cream/90"
                )}
              >
                {msg.text}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder={
                hasSequence
                  ? "Direct a change or ask a question..."
                  : "Generate a cut first, then direct changes here"
              }
              disabled={!hasSequence || busy}
              className="flex-1 resize-none rounded-md border border-white/10 bg-[#141312] px-3 py-2 text-xs text-cream placeholder:text-warm-gray focus:outline-none focus:ring-1 focus:ring-rust disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!hasSequence || busy || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rust text-cream transition-colors hover:bg-rust-light disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
