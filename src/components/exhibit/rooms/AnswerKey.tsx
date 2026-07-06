"use client";
/* ------------------------------------------------------------------ */
/*  THE ANSWER KEY, the counter-machine room's matching board. Five    */
/*  machine cards on the left, five counter-move cards on the right    */
/*  in a fixed scrambled order. Tap a machine, then a counter-move;    */
/*  the pairing data (passed in from the content module) checks the    */
/*  match. Right pairings ink a row into the key below with the        */
/*  registered facts behind the counter-move. The bulldozer accepts    */
/*  its card but returns STILL CONTESTED, because that machine has no  */
/*  off year to point at. Wrong pairings get one quiet line, no        */
/*  shake, no score, no lockout.                                       */
/* ------------------------------------------------------------------ */
import { useState } from "react";
import type { MachineId } from "@/lib/exhibit/types";
import { machineOf } from "@/lib/exhibit/machines";
import { announce } from "@/lib/exhibit/focus";
import { machineTitle } from "../hud/BrassLamp";
import FactValue from "../shared/FactValue";
import PaperCard from "../shared/PaperCard";

export interface CounterMoveDef {
  machineId: MachineId;
  /** short name on the counter-move card, e.g. "Litigation" */
  counterName: string;
  /** one quiet line under the counter name */
  counterLine: string;
  /** registered facts shown once the pairing lands */
  factIds: string[];
  /** true for the machine that never got a full stop */
  contested?: boolean;
}

export interface AnswerKeyProps {
  /** pairing data, in left-column (machine) order */
  pairs: CounterMoveDef[];
  /** fixed scramble for the right column, by machineId */
  counterOrder: MachineId[];
  /** the board caption, always on the wall under the key */
  caption: string;
}

const WRONG_NOTE = "The record says otherwise.";
const PICK_NOTE = "Pick a machine card on the left first.";

export default function AnswerKey({ pairs, counterOrder, caption }: AnswerKeyProps) {
  const [selected, setSelected] = useState<MachineId | null>(null);
  const [matched, setMatched] = useState<MachineId[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const byMachine = new Map(pairs.map((p) => [p.machineId, p]));
  const counters = counterOrder
    .map((id) => byMachine.get(id))
    .filter((p): p is CounterMoveDef => !!p);
  const complete = matched.length === pairs.length;

  const pickMachine = (id: MachineId) => {
    if (matched.includes(id)) return;
    setNote(null);
    setSelected((cur) => (cur === id ? null : id));
  };

  const pickCounter = (move: CounterMoveDef) => {
    if (matched.includes(move.machineId)) return;
    if (!selected) {
      setNote(PICK_NOTE);
      announce(PICK_NOTE);
      return;
    }
    if (selected === move.machineId) {
      setMatched((m) => [...m, move.machineId]);
      setSelected(null);
      setNote(null);
      const m = machineOf(move.machineId);
      announce(
        move.contested
          ? `${m ? machineTitle(m) : move.machineId} matched. Still contested.`
          : `${m ? machineTitle(m) : move.machineId} matched. ${move.counterName}.`
      );
    } else {
      setNote(WRONG_NOTE);
      announce(WRONG_NOTE);
    }
  };

  return (
    <div data-testid="answer-key" data-matched={matched.length} data-complete={String(complete)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* ---- the machines ---- */}
        <div role="group" aria-label="The machines">
          <p className="exh-plat mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
            The machines
          </p>
          <div className="flex flex-col gap-2">
            {pairs.map((p) => {
              const m = machineOf(p.machineId);
              if (!m) return null;
              const done = matched.includes(p.machineId);
              const active = selected === p.machineId;
              return (
                <button
                  key={p.machineId}
                  type="button"
                  data-testid={`answer-machine-${p.machineId}`}
                  aria-pressed={active}
                  aria-disabled={done}
                  onClick={() => pickMachine(p.machineId)}
                  className={[
                    "exh-paper min-h-12 cursor-pointer rounded-sm border px-4 py-2.5 text-left transition-colors duration-150 [[data-motion=off]_&]:transition-none",
                    done
                      ? "cursor-default border-exh-ink/20 opacity-60"
                      : active
                        ? "border-exh-ink bg-exh-ink text-exh-linen"
                        : "border-exh-ink/40 bg-exh-linen hover:border-exh-ink",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-base leading-snug">{machineTitle(m)}</span>
                    {done ? (
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-exh-gold" />
                    ) : null}
                  </span>
                  <span
                    className={[
                      "exh-plat mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.18em]",
                      active && !done ? "text-exh-linen/80" : "text-exh-ink-soft",
                    ].join(" ")}
                  >
                    {m.plainName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- the counter-moves ---- */}
        <div role="group" aria-label="The counter-moves">
          <p className="exh-plat mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
            The counter-moves
          </p>
          <div className="flex flex-col gap-2">
            {counters.map((move) => {
              const done = matched.includes(move.machineId);
              return (
                <button
                  key={move.machineId}
                  type="button"
                  data-testid={`answer-counter-${move.machineId}`}
                  aria-disabled={done}
                  onClick={() => pickCounter(move)}
                  className={[
                    "exh-paper min-h-12 cursor-pointer rounded-sm border px-4 py-2.5 text-left transition-colors duration-150 [[data-motion=off]_&]:transition-none",
                    done
                      ? "cursor-default border-exh-ink/20 opacity-60"
                      : "border-exh-ink/40 bg-exh-linen hover:border-exh-ink",
                  ].join(" ")}
                >
                  <span className="font-display text-base leading-snug text-exh-ink">
                    {move.counterName}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-exh-ink-soft">
                    {move.counterLine}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* one quiet line; never a shake */}
      <p
        data-testid="answer-key-note"
        aria-live="polite"
        className="exh-plat mt-3 min-h-5 text-center text-[11px] uppercase tracking-[0.2em] text-exh-ink-soft"
      >
        {note ?? (complete ? "The key is filled in." : selected ? "Now pick its counter-move." : "")}
      </p>

      {/* ---- the key, as it fills in ---- */}
      {matched.length > 0 ? (
        <div className="mt-5 space-y-3">
          {pairs
            .filter((p) => matched.includes(p.machineId))
            .map((p) => {
              const m = machineOf(p.machineId);
              if (!m) return null;
              return (
                <PaperCard
                  key={p.machineId}
                  tone="deep"
                  data-testid={`answer-matched-${p.machineId}`}
                  className="p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.22em] text-exh-ink-soft">
                      {machineTitle(m)} <span aria-hidden="true">&rarr;</span> {p.counterName}
                    </p>
                    {p.contested ? (
                      <span
                        data-testid="answer-still-contested"
                        className="exh-plat rounded-[2px] border border-exh-gold bg-exh-gold/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-exh-ink"
                      >
                        Still contested
                      </span>
                    ) : (
                      <span className="exh-plat rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-exh-ink-soft">
                        Stopped{" "}
                        {m.offYear !== null ? <span className="exh-mono">{m.offYear}</span> : null}
                      </span>
                    )}
                  </div>
                  {p.contested ? (
                    <p className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
                      No off year to record. The counter-move here is two dated lines, not a full
                      stop.
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-col gap-1.5">
                    {p.factIds.map((id) => (
                      <FactValue key={id} id={id} size="sm" />
                    ))}
                  </div>
                </PaperCard>
              );
            })}
        </div>
      ) : null}

      <p className="mx-auto mt-6 max-w-xl text-center font-display text-base italic leading-relaxed text-exh-ink">
        {caption}
      </p>
    </div>
  );
}
