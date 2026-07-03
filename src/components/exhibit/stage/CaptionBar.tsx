"use client";
/* ------------------------------------------------------------------ */
/*  Playhead-driven captions. Until the Whisper cue pass lands, cues   */
/*  are derived by splitting each block's text into sentences and      */
/*  spreading them across the block duration by word count. Text is    */
/*  written through a ref on playhead ticks, never React state, and    */
/*  the bar is aria-hidden: the transcript is the accessible path.     */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef } from "react";
import { useExhibitState, usePlayheadBus } from "@/lib/exhibit/ExhibitProvider";
import { narrationBlock } from "@/lib/exhibit/content";

interface Cue {
  startFrac: number; // 0..1 of block duration
  text: string;
}

function deriveCues(text: string): Cue[] {
  // sentence split with initials/abbreviation tolerance kept simple; the
  // narration was written in plain declarative sentences
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text];
  const chunks: string[] = [];
  for (const s of sentences) {
    // keep caption cards to roughly 14 words; split long sentences at commas
    const words = s.split(/\s+/);
    if (words.length <= 16) {
      chunks.push(s);
      continue;
    }
    let current: string[] = [];
    for (const part of s.split(/(,)/)) {
      current.push(part);
      const joined = current.join("");
      if (joined.split(/\s+/).length >= 12 && part === ",") {
        chunks.push(joined.trim());
        current = [];
      }
    }
    if (current.join("").trim()) chunks.push(current.join("").trim());
  }
  const totalWords = chunks.reduce((n, c) => n + c.split(/\s+/).length, 0) || 1;
  let acc = 0;
  return chunks.map((c) => {
    const start = acc / totalWords;
    acc += c.split(/\s+/).length;
    return { startFrac: start, text: c };
  });
}

export default function CaptionBar() {
  const state = useExhibitState();
  const bus = usePlayheadBus();
  const textRef = useRef<HTMLDivElement>(null);
  const cuesRef = useRef<{ blockId: string; cues: Cue[] } | null>(null);

  const visible = state.captionsOn && state.mode === "guided" && state.playState === "playing";

  const cueFor = useMemo(
    () => (blockId: string) => {
      if (cuesRef.current?.blockId !== blockId) {
        const block = narrationBlock(blockId);
        cuesRef.current = { blockId, cues: block ? deriveCues(block.text) : [] };
      }
      return cuesRef.current.cues;
    },
    []
  );

  useEffect(() => {
    if (!visible) return;
    return bus.subscribe(({ blockId, msIntoBlock, blockDurationMs }) => {
      const el = textRef.current;
      if (!el || !blockId || blockDurationMs <= 0) return;
      const cues = cueFor(blockId);
      if (!cues.length) return;
      const frac = Math.min(1, msIntoBlock / blockDurationMs);
      let active = cues[0];
      for (const c of cues) {
        if (c.startFrac <= frac) active = c;
        else break;
      }
      if (el.textContent !== active.text) el.textContent = active.text;
    });
  }, [bus, cueFor, visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 md:bottom-[4.5rem]"
      data-testid="caption-bar"
    >
      <div
        ref={textRef}
        className="max-w-2xl rounded-sm bg-exh-linen/95 px-4 py-2 text-center font-display text-base leading-snug text-exh-ink shadow-[0_1px_6px_rgba(28,26,23,0.18)] md:text-lg"
      />
    </div>
  );
}
