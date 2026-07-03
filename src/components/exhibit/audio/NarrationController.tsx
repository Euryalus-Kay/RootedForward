"use client";
/* ------------------------------------------------------------------ */
/*  Headless guided-tour narrator. Mounted once inside the             */
/*  ExhibitProvider. Plays one mp3 per narration block on an A/B pair  */
/*  of audio elements (the idle element preloads the next block).      */
/*  Blocks with no generated audio, and every block under the debug    */
/*  audio stub, run on a silent words-per-minute timer instead, so     */
/*  the tour advances identically with or without voice files.         */
/*  Continuous time goes out on the playhead bus each animation        */
/*  frame; React only hears about block, pause, and chapter            */
/*  boundaries through the reducer.                                    */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { CHAPTER_ORDER, type InteractiveId, type NarrationBlockData } from "@/lib/exhibit/types";
import { useExhibitDispatch, useExhibitState, usePlayheadBus } from "@/lib/exhibit/ExhibitProvider";
import { CHAPTER_META, narrationChapter } from "@/lib/exhibit/content";
import { debugFlags } from "@/lib/exhibit/debug";
import cueDurationsJson from "@/lib/exhibit/content/cue-durations.json";

const CUE_DURATIONS = cueDurationsJson as Record<string, unknown>;

/* 20ms of silent 16-bit mono PCM. Played muted inside the Begin click
   so mobile browsers mark both elements user-activated. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

let sharedEls: [HTMLAudioElement, HTMLAudioElement] | null = null;

function ensureAudioElements(): [HTMLAudioElement, HTMLAudioElement] | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (!sharedEls) {
    const make = () => {
      const el = new Audio();
      el.preload = "auto";
      return el;
    };
    sharedEls = [make(), make()];
  }
  return sharedEls;
}

/**
 * Best-effort autoplay unlock. ModeGate calls this synchronously inside
 * the Begin click handler; each internal element plays a muted 20ms
 * silent wav so later programmatic play() calls are allowed.
 */
export function unlockAudio(): void {
  const pair = ensureAudioElements();
  if (!pair) return;
  for (const el of pair) {
    try {
      el.muted = true;
      el.src = SILENT_WAV;
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => undefined);
    } catch {
      /* unlock is a nicety, never an error */
    }
  }
}

const voSrcFor = (blockId: string) => `/media/hyde-park/vo/exhibit/vo-ex-${blockId}.mp3`;

function cueDurationMs(blockId: string): number | null {
  const v = CUE_DURATIONS[blockId];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v * 1000 : null;
}

/** words / 155 wpm, floored at 1200ms, then 16x faster under the debug stub */
function estimatedMsFor(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ms = Math.max(1200, (words / 155) * 60000);
  return debugFlags.audioStub ? ms / 16 : ms;
}

function blockAt(chapterIndex: number, blockIndex: number): NarrationBlockData | null {
  const chapterId = CHAPTER_ORDER[chapterIndex];
  if (!chapterId) return null;
  return narrationChapter(chapterId)?.blocks[blockIndex] ?? null;
}

/** the block that will narrate after (chapterIndex, blockIndex), across chapter boundaries */
function upcomingBlockId(chapterIndex: number, blockIndex: number): string | null {
  const chapter = narrationChapter(CHAPTER_ORDER[chapterIndex]);
  if (chapter && blockIndex + 1 < chapter.blocks.length) return chapter.blocks[blockIndex + 1].id;
  for (let i = chapterIndex + 1; i < CHAPTER_ORDER.length; i++) {
    const next = narrationChapter(CHAPTER_ORDER[i]);
    if (next && next.blocks.length > 0) return next.blocks[0].id;
  }
  return null;
}

interface Session {
  gen: number;
  blockId: string;
  kind: "audio" | "timer";
  durationMs: number;
  pausePointAfter?: InteractiveId;
  el: HTMLAudioElement | null;
  /** timer path: ms accumulated across previous runs (pauses) */
  elapsedMs: number;
  /** performance.now() when the current run started */
  runStartedAt: number;
  raf: number;
  done: boolean;
  detachEl?: () => void;
}

export default function NarrationController() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const bus = usePlayheadBus();

  const sessionRef = useRef<Session | null>(null);
  const genRef = useRef(0);
  const activeIdxRef = useRef(0);
  const mutedRef = useRef(state.muted);

  const { mode, playState, chapterIndex, blockIndex, muted } = state;

  /* mute follows state; the clock keeps running */
  useEffect(() => {
    mutedRef.current = muted;
    const pair = ensureAudioElements();
    if (!pair) return;
    for (const el of pair) el.muted = muted;
  }, [muted]);

  /* lock-screen metadata follows the chapter */
  useEffect(() => {
    if (mode !== "guided") return;
    try {
      if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
        const meta = CHAPTER_META[chapterIndex];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: meta?.title ?? "The Ground Keeps Moving",
          artist: "The Ground Keeps Moving",
          album: "Rooted Forward",
        });
      }
    } catch {
      /* MediaSession is progressive enhancement */
    }
  }, [mode, chapterIndex]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => dispatch({ type: "RESUME" }));
      navigator.mediaSession.setActionHandler("pause", () => dispatch({ type: "PAUSE" }));
    } catch {
      /* noop */
    }
    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      } catch {
        /* noop */
      }
    };
  }, [dispatch]);

  /* the playback reconciler */
  useEffect(() => {
    const now = () => performance.now();

    const publish = (s: Session, ms: number) => {
      bus.publish({
        blockId: s.blockId,
        msIntoBlock: Math.max(0, Math.min(ms, s.durationMs)),
        blockDurationMs: s.durationMs,
      });
    };

    const stopRaf = (s: Session) => {
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
    };

    const finish = (s: Session) => {
      if (s.done || s.gen !== genRef.current) return;
      s.done = true;
      stopRaf(s);
      publish(s, s.durationMs);
      if (s.pausePointAfter) {
        dispatch({ type: "ENTER_PAUSE_POINT", interactiveId: s.pausePointAfter });
      } else {
        dispatch({ type: "BLOCK_ENDED" });
      }
    };

    const degradeToTimer = (s: Session, positionMs: number) => {
      if (s.done || s.gen !== genRef.current) return;
      s.detachEl?.();
      s.detachEl = undefined;
      try {
        s.el?.pause();
      } catch {
        /* noop */
      }
      s.el = null;
      s.kind = "timer";
      s.elapsedMs = Math.max(0, Math.min(positionMs, s.durationMs));
      s.runStartedAt = now();
    };

    const safePlay = (s: Session) => {
      const el = s.el;
      if (!el) return;
      try {
        const p = el.play();
        if (p && typeof p.catch === "function") {
          p.catch((err: unknown) => {
            // pause() during a pending play() aborts it; that is not a failure
            if ((err as DOMException | null)?.name === "AbortError") return;
            degradeToTimer(s, (el.currentTime || 0) * 1000);
          });
        }
      } catch {
        degradeToTimer(s, 0);
      }
    };

    const tick = (s: Session) => {
      if (s.done || s.gen !== genRef.current) return;
      if (s.kind === "audio" && s.el) {
        publish(s, s.el.currentTime * 1000);
      } else {
        const elapsed = s.elapsedMs + (now() - s.runStartedAt);
        if (elapsed >= s.durationMs) {
          finish(s);
          return;
        }
        publish(s, elapsed);
      }
      s.raf = requestAnimationFrame(() => tick(s));
    };

    const destroySession = () => {
      const s = sessionRef.current;
      if (!s) return;
      genRef.current++;
      stopRaf(s);
      s.detachEl?.();
      try {
        s.el?.pause();
      } catch {
        /* noop */
      }
      sessionRef.current = null;
    };

    const startSession = (block: NarrationBlockData) => {
      const gen = ++genRef.current;
      const cue = cueDurationMs(block.id);
      const pair = ensureAudioElements();
      const useAudio = cue !== null && !debugFlags.audioStub && !!pair;

      const s: Session = {
        gen,
        blockId: block.id,
        kind: useAudio ? "audio" : "timer",
        durationMs: useAudio ? (cue as number) : estimatedMsFor(block.text),
        pausePointAfter: block.pausePointAfter,
        el: null,
        elapsedMs: 0,
        runStartedAt: now(),
        raf: 0,
        done: false,
      };
      sessionRef.current = s;

      if (useAudio && pair) {
        const target = voSrcFor(block.id);
        const other = pair[1 - activeIdxRef.current];
        let el = pair[activeIdxRef.current];
        if (other.src && other.src.endsWith(target)) {
          // B was preloaded with this block while A played the last one; swap
          activeIdxRef.current = 1 - activeIdxRef.current;
          el = other;
        } else if (!el.src || !el.src.endsWith(target)) {
          el.src = target;
        }
        el.muted = mutedRef.current;
        try {
          el.currentTime = 0;
        } catch {
          /* not seekable yet; it starts at 0 anyway */
        }
        s.el = el;

        const onEnded = () => finish(s);
        const onError = () => degradeToTimer(s, (el.currentTime || 0) * 1000);
        const onMeta = () => {
          if (Number.isFinite(el.duration) && el.duration > 0) s.durationMs = el.duration * 1000;
        };
        el.addEventListener("ended", onEnded);
        el.addEventListener("error", onError);
        el.addEventListener("loadedmetadata", onMeta);
        s.detachEl = () => {
          el.removeEventListener("ended", onEnded);
          el.removeEventListener("error", onError);
          el.removeEventListener("loadedmetadata", onMeta);
        };
        safePlay(s);

        // preload the next narrated block on the idle element
        const nextId = upcomingBlockId(chapterIndex, blockIndex);
        if (nextId && cueDurationMs(nextId) !== null) {
          const idle = pair[1 - activeIdxRef.current];
          if (idle !== el) {
            const nextSrc = voSrcFor(nextId);
            if (!idle.src || !idle.src.endsWith(nextSrc)) {
              idle.src = nextSrc;
              try {
                idle.load();
              } catch {
                /* noop */
              }
            }
          }
        }
      }

      publish(s, 0);
      s.raf = requestAnimationFrame(() => tick(s));
    };

    const setMediaPlaybackState = (v: "playing" | "paused" | "none") => {
      try {
        if ("mediaSession" in navigator) navigator.mediaSession.playbackState = v;
      } catch {
        /* noop */
      }
    };

    const currentBlock = blockAt(chapterIndex, blockIndex);
    const s = sessionRef.current;

    if (mode !== "guided" || !currentBlock) {
      destroySession();
      setMediaPlaybackState("none");
      return;
    }

    if (playState === "playing") {
      if (s && !s.done && s.blockId === currentBlock.id) {
        // resume a frozen session in place
        if (!s.raf) {
          if (s.kind === "audio") safePlay(s);
          else s.runStartedAt = now();
          s.raf = requestAnimationFrame(() => tick(s));
        }
      } else {
        destroySession();
        startSession(currentBlock);
      }
      setMediaPlaybackState("playing");
      return;
    }

    if (playState === "paused") {
      if (s && !s.done && s.blockId === currentBlock.id) {
        if (s.raf) {
          if (s.kind === "audio") {
            try {
              s.el?.pause();
            } catch {
              /* noop */
            }
          } else {
            s.elapsedMs += now() - s.runStartedAt;
          }
          stopRaf(s);
        }
      } else {
        destroySession();
      }
      setMediaPlaybackState("paused");
      return;
    }

    // gate, pause_point, advisory, ended: narration is halted
    destroySession();
    setMediaPlaybackState("none");
  }, [mode, playState, chapterIndex, blockIndex, bus, dispatch]);

  /* unmount teardown only; effect re-runs above must not kill a paused session */
  useEffect(() => {
    const session = sessionRef;
    const gen = genRef;
    return () => {
      const s = session.current;
      if (!s) return;
      gen.current++;
      if (s.raf) cancelAnimationFrame(s.raf);
      s.detachEl?.();
      try {
        s.el?.pause();
      } catch {
        /* noop */
      }
      session.current = null;
    };
  }, []);

  return null;
}
