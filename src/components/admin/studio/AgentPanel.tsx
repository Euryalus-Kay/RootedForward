"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  AgentTraceEntry,
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
/*  AgentPanel: the pipeline status board (Analyst, Director, Critic)  */
/*  plus the revision chat with the Director.                          */
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
  onGenerate: () => void;
  onChat: (instruction: string) => void;
  onScript: () => void;
  onVariations: () => void;
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

const STAGES: { key: keyof Omit<PipelineState, "detail" | "error">; name: string; blurb: string }[] = [
  { key: "analyst", name: "Analyst", blurb: "Watches every clip" },
  { key: "director", name: "Director", blurb: "Builds the cut" },
  { key: "critic", name: "Critic", blurb: "Checks pacing and continuity" },
];

function StageIcon({ state }: { state: StageState }) {
  switch (state) {
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-rust" />;
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-forest" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Circle className="h-4 w-4 text-warm-gray-light" />;
  }
}

export default function AgentPanel({
  pipeline,
  traces,
  chat,
  busy,
  hasSequence,
  onGenerate,
  onChat,
  onScript,
  onVariations,
}: AgentPanelProps) {
  const [draft, setDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex h-full flex-col rounded-xl border border-border bg-white/60 shadow-sm">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-forest">
          <Bot className="h-4 w-4 text-rust" />
          Agent pipeline
        </h2>
        <p className="text-xs text-warm-gray">claude-fable-5, three roles</p>
      </div>

      {/* Stage board */}
      <div className="border-b border-border px-5 py-3">
        <ol className="space-y-2">
          {STAGES.map((stage) => (
            <li key={stage.key} className="flex items-center gap-2.5">
              <StageIcon state={pipeline[stage.key]} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink">{stage.name}</p>
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
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rust">
            {busy && <Loader2 className="h-3 w-3 animate-spin" />}
            {pipeline.detail}
          </p>
        )}
        {pipeline.error && (
          <p className="mt-2 rounded-md bg-red-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-red-700">
            {pipeline.error}
          </p>
        )}

        <button
          onClick={onGenerate}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-rust px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {hasSequence ? "Regenerate the cut" : "Generate the cut"}
        </button>
        <button
          onClick={onVariations}
          disabled={busy}
          className="mt-1.5 w-full rounded-md border border-rust/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-rust transition-colors hover:bg-rust/5 disabled:opacity-50"
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
                className="rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold text-ink/70 transition-colors hover:border-rust/50 hover:text-rust disabled:opacity-50"
              >
                {qa.label}
              </button>
            ))}
            <button
              onClick={onScript}
              disabled={busy}
              className="rounded-full border border-forest/40 bg-forest/5 px-2.5 py-1 text-[10px] font-semibold text-forest transition-colors hover:bg-forest/10 disabled:opacity-50"
            >
              Write narration + subtitles
            </button>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {chat.length === 0 ? (
            <p className="text-xs leading-relaxed text-warm-gray">
              After a cut exists, direct revisions here. Try &ldquo;tighten
              the opening&rdquo;, &ldquo;add a ripple into the 360
              scene&rdquo;, or &ldquo;retitle it Beneath Bubbly Creek&rdquo;.
            </p>
          ) : (
            chat.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-forest text-cream"
                    : "bg-cream-dark text-ink"
                )}
              >
                {msg.text}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-border p-3">
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
                  ? "Tell the Director what to change..."
                  : "Generate a cut first, then direct changes here"
              }
              disabled={!hasSequence || busy}
              className="flex-1 resize-none rounded-md border border-border bg-white px-3 py-2 text-xs text-ink placeholder:text-warm-gray-light focus:outline-none focus:ring-1 focus:ring-rust disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!hasSequence || busy || !draft.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest text-cream transition-colors hover:bg-forest-light disabled:opacity-50"
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
