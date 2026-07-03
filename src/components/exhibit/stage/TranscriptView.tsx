"use client";
/* ------------------------------------------------------------------ */
/*  Full-transcript overlay. Every chapter title and every narration   */
/*  block's text in one readable scroll, for screen-reader visitors    */
/*  and anyone who wants the words on paper. Opens from                */
/*  state.transcriptOpen, closes through TOGGLE_TRANSCRIPT, traps      */
/*  focus while open.                                                  */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { CHAPTER_META, NARRATION, narrationChapter } from "@/lib/exhibit/content";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function TranscriptView() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const open = state.transcriptOpen;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_TRANSCRIPT" });
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !panel.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !panel.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, dispatch]);

  if (!open) return null;

  const close = () => dispatch({ type: "TOGGLE_TRANSCRIPT" });

  return (
    <div
      className="fixed inset-0 z-[70]"
      data-testid="transcript"
      role="dialog"
      aria-modal="true"
      aria-label="Full transcript"
    >
      <div className="absolute inset-0 bg-exh-ink/50" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        className="exh-paper absolute inset-0 mx-auto flex w-full max-w-3xl flex-col overflow-hidden bg-exh-linen shadow-2xl md:inset-y-6 md:border md:border-exh-ink/30"
      >
        <header className="flex items-center justify-between gap-4 border-b border-exh-ink/20 px-6 py-4">
          <div>
            <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
              {NARRATION.kicker}
            </p>
            <h2 className="mt-1 font-display text-2xl text-exh-ink">Transcript</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close the transcript"
            className="flex h-12 w-12 shrink-0 items-center justify-center border border-exh-ink/30 text-exh-ink transition-colors duration-200 hover:bg-exh-ink hover:text-exh-linen"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
          {CHAPTER_META.map((meta) => {
            const chapter = narrationChapter(meta.id);
            if (!chapter || chapter.blocks.length === 0) return null;
            return (
              <section key={meta.id} className="mb-10 last:mb-0">
                <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
                  {meta.era}
                </p>
                <h3 className="mt-1 font-display text-xl text-exh-ink">{chapter.title}</h3>
                {chapter.blocks.map((block) => (
                  <p
                    key={block.id}
                    className="mt-4 font-body text-sm leading-relaxed text-exh-ink md:text-base"
                  >
                    {block.text}
                  </p>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
