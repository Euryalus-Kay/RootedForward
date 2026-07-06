"use client";
/* ------------------------------------------------------------------ */
/*  VoiceMedallions, A1 shell. A small chip counting the voices        */
/*  collected so far; tapping it opens a placeholder tray sheet that   */
/*  lists whatever ids state.voicesFound holds. The full medallion     */
/*  cards arrive with the voices content pass.                         */
/* ------------------------------------------------------------------ */
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useExhibitState } from "@/lib/exhibit/ExhibitProvider";

/** nine voices speak along the tour */
const TOTAL_VOICES = 9;

function PortraitIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="10" cy="10" r="8.5" />
      <circle cx="10" cy="8" r="2.6" fill="currentColor" stroke="none" />
      <path d="M4.8 15.6c1-2.4 2.9-3.6 5.2-3.6s4.2 1.2 5.2 3.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function VoiceMedallions() {
  const state = useExhibitState();
  const [open, setOpen] = useState(false);
  const found = state.voicesFound;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          data-testid="voices-chip"
          aria-haspopup="dialog"
          aria-label={`Voices, ${found.length} of ${TOTAL_VOICES} heard`}
          className="flex min-h-12 items-center gap-1.5 rounded-sm border border-exh-ink/15 bg-exh-linen-deep px-2.5 text-exh-ink shadow-[0_1px_3px_rgba(28,26,23,0.12)]"
        >
          <PortraitIcon />
          <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em]">
            Voices,
          </span>
          <span className="exh-plat text-[10px] font-semibold uppercase tracking-[0.18em]">
            <span className="exh-mono text-xs tracking-normal">{found.length}</span> of{" "}
            <span className="exh-mono text-xs tracking-normal">{TOTAL_VOICES}</span> heard
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-exh-ink/40" />
      <Dialog.Content
        aria-describedby={undefined}
        data-testid="voices-tray"
        className="exh-paper fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-md border-t border-exh-ink/20 shadow-[0_-4px_16px_rgba(28,26,23,0.2)] md:inset-x-auto md:right-3 md:top-20 md:bottom-auto md:w-80 md:rounded-sm md:border md:border-exh-ink/20"
      >
        <div className="flex items-center justify-between border-b border-exh-ink/15 py-1 pl-4 pr-1">
          <Dialog.Title className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
            Voices
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close the voices tray"
              className="flex h-12 w-12 items-center justify-center text-lg text-exh-ink"
            >
              ✕
            </button>
          </Dialog.Close>
        </div>
        <div className="overflow-y-auto p-4">
          <p className="text-xs leading-relaxed text-exh-ink-soft">
            Nine voices speak along the tour. Their cards gather here.
          </p>
          {found.length > 0 && (
            <ul className="mt-2 divide-y divide-exh-ink/10">
              {found.map((personId) => (
                <li key={personId} className="flex min-h-12 items-center gap-2 text-exh-ink">
                  <PortraitIcon />
                  <span className="exh-mono text-xs">{personId}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export default VoiceMedallions;
