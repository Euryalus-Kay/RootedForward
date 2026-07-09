"use client";
/* ------------------------------------------------------------------ */
/*  Machine nameplate helpers, shared by the document rooms and the    */
/*  doorway cards. The status-board HUD that once lived here was       */
/*  removed with the reader rebuild; the lamp disc and the state       */
/*  sentence survive because the rooms still print where each          */
/*  machine ended up.                                                  */
/* ------------------------------------------------------------------ */
import { Fragment, type ReactNode } from "react";
import type { LampState, MachineDef } from "@/lib/exhibit/types";
import { cn } from "@/lib/utils";

/** "THE DEED" from machines.json reads as "The Deed" in sentences. */
export function machineTitle(machine: MachineDef): string {
  return machine.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Wraps every digit run in exh-mono so prose from machines.json keeps
 *  the numbers-are-mono rule without hand-marking each sentence. */
export function MonoNumbers({ text }: { text: string }) {
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

export function LampDisc({ lampState }: { lampState: LampState }) {
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

export function stateSentence(machine: MachineDef, lampState: LampState): ReactNode {
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
