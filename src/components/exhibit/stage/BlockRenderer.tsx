"use client";
/* ------------------------------------------------------------------ */
/*  One stage block on the linen. Narration prose in the document      */
/*  serif, archival figures with their Commons credit lines, fact      */
/*  stats through FactValue, voice medallions through VoiceCard,       */
/*  interactive plinths, and doorway cards for the ship-later side     */
/*  rooms. The advisory kind renders nothing here; that gate is        */
/*  global.                                                            */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";
import type { StageBlock } from "@/lib/exhibit/types";
import { narrationBlock } from "@/lib/exhibit/content";
import FactValue from "../shared/FactValue";
import VoiceCard from "../shared/VoiceCard";
import InteractiveSlot from "./InteractiveSlot";

export interface BlockRendererProps {
  block: StageBlock;
  /** the chapter's first narration block gets the larger opening line */
  opening?: boolean;
  /** effective chapter-level no-motion (reduced motion or ch4 sensitivity) */
  noMotion?: boolean;
}

/* ---- credits: fetched once from the public folder, never bundled ---- */

interface CreditRecord {
  artist?: string;
  license?: string;
  date?: string;
  credit?: string;
}

let creditsCache: Record<string, CreditRecord> | null = null;
let creditsPromise: Promise<Record<string, CreditRecord>> | null = null;

function loadCredits(): Promise<Record<string, CreditRecord>> {
  if (creditsCache) return Promise.resolve(creditsCache);
  creditsPromise ??= fetch("/media/hyde-park/credits.json")
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, CreditRecord>>) : {}))
    .then((json) => {
      creditsCache = json;
      return json;
    })
    .catch(() => ({}) as Record<string, CreditRecord>);
  return creditsPromise;
}

function FigureBlock({
  src,
  alt,
  caption,
  creditKey,
}: {
  src: string;
  alt: string;
  caption?: string;
  creditKey?: string;
}) {
  const [credit, setCredit] = useState<CreditRecord | null>(null);

  useEffect(() => {
    if (!creditKey) return;
    let live = true;
    loadCredits().then((all) => {
      if (live) setCredit(all[creditKey] ?? null);
    });
    return () => {
      live = false;
    };
  }, [creditKey]);

  const creditLine = credit
    ? [credit.artist, credit.date, credit.license].filter(Boolean).join(", ")
    : null;

  return (
    <figure>
      <div className="border border-exh-ink/25 bg-exh-linen-deep/50 p-2">
        {/* Archival stills served from /public; plain img is intentional here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={1200} height={800} loading="lazy" className="h-auto w-full" />
      </div>
      {(caption || creditLine) && (
        <figcaption className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
          {caption ? <span className="font-display italic">{caption}</span> : null}
          {caption && creditLine ? <span aria-hidden="true"> </span> : null}
          {creditLine ? (
            <span className="exh-plat uppercase tracking-[0.08em]">{creditLine}</span>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}

/* ---- the switch ---- */

export default function BlockRenderer({ block, opening = false, noMotion = false }: BlockRendererProps) {
  switch (block.kind) {
    case "narration": {
      const data = narrationBlock(block.blockId);
      if (!data) return null;
      return (
        <div
          data-block-id={block.blockId}
          className={
            opening
              ? "font-display text-xl leading-relaxed text-exh-ink md:text-2xl"
              : "font-display text-lg leading-relaxed text-exh-ink md:text-xl"
          }
        >
          <p>{data.text}</p>
        </div>
      );
    }

    case "figure":
      return (
        <FigureBlock
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          creditKey={block.creditKey}
        />
      );

    case "stat":
      return (
        <div className="flex justify-center border-y border-exh-ink/15 py-6">
          <FactValue id={block.factId} label={block.label} size="lg" />
        </div>
      );

    case "quote":
      return (
        <div data-voice-id={block.voiceId} className="flex justify-center py-2">
          <VoiceCard personId={block.voiceId} size="md" />
        </div>
      );

    case "interactive":
      return (
        <InteractiveSlot
          id={block.interactive}
          componentProps={block.props}
          chapterNoMotion={noMotion}
        />
      );

    case "door":
      return (
        <div
          data-room-id={block.roomId}
          className="border border-dashed border-exh-ink/35 bg-exh-linen-deep/30 px-5 py-6"
        >
          <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
            Side room
          </p>
          <p className="mt-2 font-display text-lg text-exh-ink">{block.label}</p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="exh-plat mt-4 min-h-12 cursor-not-allowed border border-exh-ink/30 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink-soft"
          >
            Opening in the next phase
          </button>
        </div>
      );

    case "advisory":
      return null;

    default:
      return null;
  }
}
