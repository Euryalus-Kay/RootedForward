"use client";
/* ------------------------------------------------------------------ */
/*  VoiceCard, the voice medallion. A circular button (credited        */
/*  portrait when one exists, otherwise a monogram on deep linen,      */
/*  never a stand-in image) that opens an inline paper card with the   */
/*  person's name, years, role, and their words. The honesty rule is   */
/*  enforced here and only here: quotation marks appear on screen      */
/*  only when quoteStatus begins with "verbatim"; paraphrases render   */
/*  without quote marks behind an "in summary" chip.                   */
/* ------------------------------------------------------------------ */
import { useEffect, useId, useRef, useState } from "react";
import { isVerbatim, voiceOf } from "@/lib/exhibit/voices";
import { cn } from "@/lib/utils";
import PaperCard from "./PaperCard";
import SourceSup from "./SourceSup";

export interface VoiceCardProps {
  personId: string;
  size?: "sm" | "md";
}

/** monogram from the first and last meaningful name words */
function initialsOf(name: string): string {
  const words = name
    .replace(/,/g, "")
    .split(/\s+/)
    .filter((w) => w && !/^(jr\.?|sr\.?|i{2,3}|iv)$/i.test(w));
  if (!words.length) return "?";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

const MEDALLION_SIZE: Record<NonNullable<VoiceCardProps["size"]>, string> = {
  sm: "h-12 w-12 text-sm",
  md: "h-16 w-16 text-base",
};

export function VoiceCard({ personId, size = "md" }: VoiceCardProps) {
  const voice = voiceOf(personId);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cardId = useId();

  // Escape closes the card and returns focus to the medallion
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!voice) {
    // loud but survivable, same policy as FactValue
    return (
      <span data-voice-missing={personId} className="exh-mono text-xs text-exh-ink-soft">
        [voice {personId}]
      </span>
    );
  }

  const verbatim = isVerbatim(voice);
  const words = verbatim ? voice.quote : voice.paraphrase;
  const factRef = voice.factRef ?? undefined;

  const toggle = () => setOpen((o) => !o);

  return (
    <div className="inline-flex max-w-full flex-col items-center gap-2">
      <button
        ref={btnRef}
        type="button"
        data-testid={`voice-medallion-${voice.personId}`}
        aria-expanded={open}
        aria-controls={cardId}
        aria-label={`Voice, ${voice.name}`}
        onClick={toggle}
        className={cn(
          "relative shrink-0 cursor-pointer rounded-full border-2 bg-exh-linen-deep",
          "flex items-center justify-center overflow-visible",
          open ? "border-exh-blue" : "border-exh-ink/50 hover:border-exh-ink",
          MEDALLION_SIZE[size]
        )}
      >
        {voice.portrait ? (
          /* credited public-domain portrait from the media library */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={voice.portrait}
            alt=""
            className="h-full w-full rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <span aria-hidden="true" className="exh-plat font-semibold tracking-[0.08em] text-exh-ink">
            {initialsOf(voice.name)}
          </span>
        )}
      </button>

      <span className="exh-plat max-w-40 text-center text-[11px] md:text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-exh-ink-soft">
        {voice.name}
      </span>
      {!open && (
        <span className="exh-plat -mt-1 max-w-40 text-center text-[11px] md:text-[9px] uppercase leading-tight tracking-[0.14em] text-exh-ink/70">
          Select to read their words
        </span>
      )}

      {open && (
        <PaperCard
          id={cardId}
          data-testid={`voice-card-${voice.personId}`}
          role="region"
          aria-label={`${voice.name}, ${voice.role}`}
          className="exh-ledger-in w-full max-w-md p-4 text-left"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-lg leading-snug text-exh-ink">{voice.name}</p>
            <p className="exh-mono shrink-0 text-[11px] text-exh-ink-soft">{voice.years}</p>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-exh-ink-soft">{voice.role}</p>

          {words && (
            <div className="mt-3 border-l-2 border-exh-ink/30 pl-3">
              {!verbatim && (
                <span className="exh-plat mb-1 inline-block rounded-[2px] border border-exh-ink/40 px-1.5 py-0.5 text-[11px] md:text-[9px] font-semibold uppercase tracking-[0.18em] text-exh-ink-soft">
                  in summary
                </span>
              )}
              <p className="font-display text-base italic leading-relaxed text-exh-ink">
                {verbatim ? <>&ldquo;{words.text}&rdquo;</> : words.text}
                {factRef && <SourceSup factId={factRef} />}
              </p>
              <p className="exh-plat mt-2 text-[11px] md:text-[10px] uppercase leading-snug tracking-[0.08em] text-exh-ink-soft">
                {words.source}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              btnRef.current?.focus();
            }}
            className="exh-plat mt-3 min-h-12 cursor-pointer border border-exh-ink/35 px-4 text-[11px] md:text-[10px] font-semibold uppercase tracking-[0.2em] text-exh-ink hover:border-exh-ink"
          >
            Close
          </button>
        </PaperCard>
      )}
    </div>
  );
}

export default VoiceCard;
