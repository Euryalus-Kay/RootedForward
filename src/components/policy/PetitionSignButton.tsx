"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import PetitionForm from "@/components/policy/PetitionForm";

/* ------------------------------------------------------------------ */
/*  PetitionSignButton                                                 */
/*                                                                     */
/*  The form used to sit embedded near the bottom of the page, which   */
/*  put the actual ask below everything else (owner, July 2026). The   */
/*  page carries buttons instead and the form opens in a dialog.       */
/*                                                                     */
/*  Each button owns its own dialog. There is only ever one open, and  */
/*  a signature triggers router.refresh() so the server-rendered       */
/*  counts everywhere on the page catch up.                            */
/* ------------------------------------------------------------------ */

interface PetitionSignButtonProps {
  slug: string;
  city: string;
  addressedTo: string;
  statement: string;
  initialCount: number | null;
  /** "solid" is the rust CTA, "onDark" sits on the forest band. */
  variant?: "solid" | "onDark";
  label?: string;
  /** Shown under the button, e.g. "No account. About a minute." */
  note?: string;
  fullWidth?: boolean;
}

export default function PetitionSignButton({
  slug,
  city,
  addressedTo,
  statement,
  initialCount,
  variant = "solid",
  label = "Sign this petition",
  note,
  fullWidth = false,
}: PetitionSignButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const base =
    "inline-flex items-center justify-center rounded-sm px-9 py-4 font-body text-base font-semibold uppercase tracking-widest transition-colors";
  const skin =
    variant === "onDark"
      ? "bg-cream text-forest hover:bg-white"
      : "bg-rust text-white hover:bg-rust-dark";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${base} ${skin} ${fullWidth ? "w-full sm:w-auto" : ""}`}
      >
        {label}
      </button>
      {note && (
        <p
          className={`mt-3 font-body text-sm ${
            variant === "onDark" ? "text-cream/70" : "text-ink/60"
          }`}
        >
          {note}
        </p>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Sign this petition"
        size="xl"
      >
        {/* The form runs past the viewport on a short screen, so the
            dialog body scrolls rather than the card growing off it. */}
        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <PetitionForm
            slug={slug}
            city={city}
            addressedTo={addressedTo}
            statement={statement}
            initialCount={initialCount}
            inModal
            onDone={() => setOpen(false)}
            onSigned={() => router.refresh()}
          />
        </div>
      </Modal>
    </>
  );
}
