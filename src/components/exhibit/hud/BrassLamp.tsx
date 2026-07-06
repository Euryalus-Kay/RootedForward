"use client";
/* ------------------------------------------------------------------ */
/*  BrassLamp, one plaque on the Machine Status Board. The disc reads  */
/*  the machine's lamp state: dark (unarmed), armed (gold at 60%,      */
/*  pulsing), on (solid gold, soft glow), off_residue (dark with a     */
/*  gold ember, because none of these machines really retired), and    */
/*  renamed (still lit, nameplate flips to the new name). Tapping the  */
/*  plaque opens a card with the plain name, the definition, the       */
/*  current-state sentence, and a guarded jump to the machine's home   */
/*  chapter.                                                           */
/* ------------------------------------------------------------------ */
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CHAPTER_ORDER, type LampState, type MachineDef } from "@/lib/exhibit/types";
import { CHAPTER_META } from "@/lib/exhibit/content";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { motionMs } from "@/lib/exhibit/debug";
import { cn } from "@/lib/utils";
import { PaperCard } from "../shared/PaperCard";

/** "THE DEED" from machines.json reads as "The Deed" in sentences. */
export function machineTitle(machine: MachineDef): string {
  return machine.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Wraps every digit run in exh-mono so prose from machines.json keeps
 *  the numbers-are-mono rule without hand-marking each sentence. */
function MonoNumbers({ text }: { text: string }) {
  const parts = text.split(/(\d[\d,.]*)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\d/.test(part) ? (
          <span key={i} className="exh-mono">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

function LampDisc({ lampState }: { lampState: LampState }) {
  const base = "relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full";
  if (lampState === "dark") {
    return <span aria-hidden="true" className={cn(base, "ring-2 ring-inset ring-exh-ink/20")} />;
  }
  if (lampState === "armed") {
    return (
      <span
        aria-hidden="true"
        className={cn(base, "exh-lamp-armed bg-exh-gold/60 ring-1 ring-inset ring-exh-ink/20")}
      />
    );
  }
  if (lampState === "off_residue") {
    return (
      <span aria-hidden="true" className={cn(base, "bg-exh-ink/20 ring-1 ring-inset ring-exh-ink/30")}>
        <span className="h-1 w-1 rounded-full bg-exh-gold/40" />
      </span>
    );
  }
  // on, and renamed (the lamp stays lit)
  return (
    <span
      aria-hidden="true"
      className={cn(
        base,
        "bg-exh-gold ring-1 ring-inset ring-exh-ink/25 shadow-[0_0_10px_2px_rgba(201,162,39,0.55)]"
      )}
    />
  );
}

function stateSentence(machine: MachineDef, lampState: LampState): ReactNode {
  switch (lampState) {
    case "dark":
      return (
        <>
          Not yet running. Arms in <span className="exh-mono">{machine.armedYear}</span>.
        </>
      );
    case "armed":
      return <MonoNumbers text={machine.armedBy} />;
    case "on":
      return <MonoNumbers text={machine.onBy} />;
    case "off_residue":
      return <MonoNumbers text={[machine.offBy, machine.residue].filter(Boolean).join(" ")} />;
    case "renamed":
      return <MonoNumbers text={[machine.renamedNote, machine.residue].filter(Boolean).join(" ")} />;
  }
}

export interface BrassLampProps {
  machine: MachineDef;
  lampState: LampState;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function BrassLamp({ machine, lampState, open, onToggle, onClose }: BrassLampProps) {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const [confirmJump, setConfirmJump] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* confirm sub-state resets in the handlers that close or reopen the
     card, never in an effect */
  const closeCard = useCallback(() => {
    setConfirmJump(false);
    onClose();
  }, [onClose]);

  const toggleCard = () => {
    setConfirmJump(false);
    onToggle();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCard();
    };
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && e.target instanceof Node && !wrapRef.current.contains(e.target)) closeCard();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, closeCard]);

  const title = machineTitle(machine);
  const displayName = lampState === "renamed" && machine.renamedTo ? machine.renamedTo : machine.name;
  const instant = state.reducedMotion || state.silentEffects;
  const chapterIndex = CHAPTER_ORDER.indexOf(machine.homeChapter);
  const chapterTitle = CHAPTER_META[chapterIndex]?.title ?? "";

  const jump = () => {
    if (chapterIndex >= 0) dispatch({ type: "JUMP_TO_CHAPTER", chapterIndex });
    closeCard();
  };

  return (
    <div ref={wrapRef} className="relative md:w-full">
      <PaperCard tone={open ? "deep" : "linen"} className="overflow-hidden md:w-full">
        <button
          type="button"
          data-testid={`lamp-${machine.machineId}`}
          data-lamp-state={lampState}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`${title}, ${machine.plainName}`}
          onClick={toggleCard}
          className="flex h-12 w-12 items-center justify-center md:w-full md:justify-start md:gap-2.5 md:px-2.5"
        >
          <LampDisc lampState={lampState} />
          <span className="exh-plat hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink md:inline-block">
            {/* nameplate flips when the machine is renamed; initial={false}
                on AnimatePresence keeps the first mount still, so only a
                live rename plays the 400ms rotateX flip (out 200, in 200) */}
            <AnimatePresence initial={false} mode="wait">
              <motion.span
                key={displayName}
                initial={{ rotateX: -90 }}
                animate={{ rotateX: 0 }}
                exit={{ rotateX: 90 }}
                transition={{ duration: instant ? 0 : motionMs(200) / 1000, ease: "easeOut" }}
                style={{ display: "inline-block", transformPerspective: 400 }}
              >
                {displayName}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>
      </PaperCard>

      {open && (
        <PaperCard
          role="dialog"
          aria-label={`${title}, ${machine.plainName}`}
          data-testid={`lamp-popover-${machine.machineId}`}
          className="fixed inset-x-2 top-[calc(env(safe-area-inset-top,0px)+7.75rem)] z-50 p-3 md:absolute md:inset-x-auto md:left-full md:top-0 md:ml-2 md:w-64"
        >
          <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
            {title}
          </p>
          <p className="text-[11px] text-exh-ink-soft">{machine.plainName}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-exh-ink">{machine.definition}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-exh-ink-soft">
            {stateSentence(machine, lampState)}
          </p>

          {!confirmJump ? (
            <button
              type="button"
              onClick={() => setConfirmJump(true)}
              className="mt-1.5 flex min-h-12 w-full items-center text-left text-xs text-exh-blue underline underline-offset-2"
            >
              Watch it switch on in {chapterTitle}.
            </button>
          ) : (
            <div className="mt-2">
              <p className="exh-plat text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink">
                Jump to {chapterTitle}?
              </p>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={jump}
                  className="exh-plat min-h-12 flex-1 rounded-sm bg-exh-ink px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-linen"
                >
                  Jump
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmJump(false)}
                  className="exh-plat min-h-12 flex-1 rounded-sm border border-exh-ink/40 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink"
                >
                  Stay
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={closeCard}
            className="exh-plat mt-2 flex min-h-12 w-full items-center justify-center rounded-sm border border-exh-ink/25 text-[11px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft"
          >
            Close
          </button>
        </PaperCard>
      )}
    </div>
  );
}

export default BrassLamp;
