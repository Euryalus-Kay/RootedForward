"use client";
/* ------------------------------------------------------------------ */
/*  The Machine Status Board overture, the CH0.5 pause point. Five     */
/*  dark brass lamps in a row, one per machine from                    */
/*  data/exhibit/machines.json. Tapping a lamp flips up a one-line     */
/*  definition card (plain name, definition, arming year, home         */
/*  chapter). All five tapped completes the beat. This is a local      */
/*  plaque rendering on purpose; the HUD's BrassLamp is built in       */
/*  parallel and is not imported here.                                 */
/* ------------------------------------------------------------------ */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChapterId, MachineDef, MachineId } from "@/lib/exhibit/types";
import { useInteractive } from "../InteractiveContext";
import machinesJson from "../../../../../data/exhibit/machines.json";

const MACHINES = (machinesJson as unknown as { machines: MachineDef[] }).machines;

const ALL_DONE_LINE = "The board now follows you through the tour.";

/** "ch6" reads as "chapter 6"; "ch0_5" would read as "chapter 0.5". */
function chapterNumber(id: ChapterId): string {
  return id.replace(/^ch/, "").replace("_", ".");
}

export default function MachineBoardIntro() {
  const api = useInteractive();
  const [tapped, setTapped] = useState<MachineId[]>([]);
  const [openId, setOpenId] = useState<MachineId | null>(null);

  const doneRef = useRef(false);
  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    api.onComplete();
  }, [api]);

  const allDone = MACHINES.length > 0 && tapped.length === MACHINES.length;

  useEffect(() => {
    if (allDone) complete();
  }, [allDone, complete]);

  const tap = (m: MachineDef) => {
    api.onInteraction();
    setOpenId(m.machineId);
    setTapped((prev) => (prev.includes(m.machineId) ? prev : [...prev, m.machineId]));
  };

  const open = openId ? MACHINES.find((m) => m.machineId === openId) : undefined;

  return (
    <div className="w-full">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {MACHINES.map((m) => {
          const visited = tapped.includes(m.machineId);
          const isOpen = openId === m.machineId;
          return (
            <button
              key={m.machineId}
              type="button"
              onClick={() => tap(m)}
              aria-pressed={visited}
              aria-label={`${m.name}, ${m.plainName}`}
              className={`flex min-h-12 flex-col items-center gap-1.5 rounded-sm border px-1 py-3 transition-colors motion-reduce:transition-none sm:gap-2 sm:px-2 ${
                isOpen
                  ? "border-exh-ink bg-exh-linen-deep"
                  : "border-exh-ink/25 bg-exh-linen-deep/40 hover:border-exh-ink/60"
              }`}
            >
              <span
                aria-hidden
                className={`block size-8 rounded-full border-2 sm:size-10 ${
                  visited ? "border-exh-ink/70" : "border-exh-ink/40"
                }`}
                style={{
                  background: "radial-gradient(circle at 35% 30%, #3B372F, var(--color-exh-ink) 72%)",
                }}
              />
              <span className="exh-plat text-center text-[9px] leading-tight font-semibold tracking-[0.14em] break-words text-exh-ink uppercase sm:text-[11px] sm:tracking-[0.2em]">
                {m.name}
              </span>
              <span
                aria-hidden
                className={`h-1 w-4 rounded-full ${visited ? "bg-exh-ink/60" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {open && (
          <div
            key={open.machineId}
            className="exh-ledger-in mt-3 rounded-sm border border-exh-ink/25 bg-exh-linen-deep/50 p-4"
          >
            <p className="exh-plat text-[11px] font-semibold tracking-[0.25em] text-exh-ink-soft uppercase">
              {open.name}
            </p>
            <p className="exh-serif mt-1 text-lg text-exh-ink">{open.plainName}</p>
            <p className="mt-1 text-sm leading-snug text-exh-ink-soft">{open.definition}</p>
            <p className="exh-mono mt-2 text-xs text-exh-ink/70">
              {`Arms in ${open.armedYear}. Watch for it as the story reaches chapter ${chapterNumber(open.homeChapter)}.`}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="exh-mono text-xs text-exh-ink/70">
          {tapped.length} of {MACHINES.length}
        </p>
        {allDone && <p className="text-xs text-exh-ink-soft">{ALL_DONE_LINE}</p>}
      </div>
    </div>
  );
}
