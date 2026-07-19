"use client";
/* ------------------------------------------------------------------ */
/*  Act 6, the grade receipt. Reprises the Act 0 lookup from           */
/*  sessionStorage; nothing was ever sent anywhere, so the reprise     */
/*  needs no second permission prompt. If no lookup was made the       */
/*  offer returns once more with the same privacy line. The share-     */
/*  able unit is the AREA's sheet permalink, never the visitor's       */
/*  position. The area's own record (area number, filing date, the     */
/*  surveyors' justification) loads lazily from the same file the      */
/*  reading room reads.                                                */
/* ------------------------------------------------------------------ */
import { useEffect, useState } from "react";
import type { SceneProps } from "./registry";
import {
  locateGround,
  storedGround,
  type GroundHit,
  type LocateResult,
} from "@/lib/exhibit/ground/locate";
import { sheetHash } from "@/lib/exhibit/files-room";
import { SourceSup, SourceSupGroup } from "../../shared/SourceSup";
import { PaperCard } from "../../shared/PaperCard";
import { useGround } from "../engine/GroundProvider";

const GRADE_WORD: Record<string, string> = {
  A: "A, called best",
  B: "B, still desirable",
  C: "C, definitely declining",
  D: "D, hazardous",
};

/* ---- the area's own record, fetched at receipt time ---------------- */

interface SheetMeta {
  areaNumber?: string;
  filed?: string;
  excerpt?: string;
}

interface DescriptionsFile {
  areas: Array<{
    areaId: number | string;
    excerpt?: string | null;
    security_grade_fields?: { area_number?: string; date?: string } | null;
  }>;
}

let descriptionsPromise: Promise<DescriptionsFile | null> | null = null;
function loadDescriptions(): Promise<DescriptionsFile | null> {
  if (!descriptionsPromise) {
    descriptionsPromise = fetch("/exhibit-data/holc-descriptions.json")
      .then((r) => (r.ok ? (r.json() as Promise<DescriptionsFile>) : null))
      .catch(() => null);
  }
  return descriptionsPromise;
}

/* first sentence of the sheet's justification, kept short enough to
   read as a receipt line; the full sheet is one tap away */
function firstSentence(text: string): string {
  const m = text.trim().match(/^[^.!?]{10,220}[.!?]/);
  return m ? m[0].trim() : text.trim().slice(0, 180);
}

function useSheetMeta(areaId: string): SheetMeta | null {
  const [meta, setMeta] = useState<SheetMeta | null>(null);
  useEffect(() => {
    let live = true;
    loadDescriptions().then((file) => {
      if (!live || !file) return;
      const area = file.areas.find((a) => String(a.areaId) === areaId);
      if (!area) return;
      setMeta({
        areaNumber: area.security_grade_fields?.area_number || undefined,
        filed: area.security_grade_fields?.date || undefined,
        excerpt: area.excerpt ? firstSentence(area.excerpt) : undefined,
      });
    });
    return () => {
      live = false;
    };
  }, [areaId]);
  return meta;
}

function CopySheetLink({ areaId }: { areaId: string }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}${sheetHash(areaId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      /* clipboard unavailable; say so instead of failing silently,
         the visible permalink above still works */
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 4000);
    }
  };
  return (
    <button
      type="button"
      data-testid="receipt-copy-link"
      onClick={copy}
      className="exh-plat mt-2 inline-flex min-h-10 items-center border border-exh-ink/40 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-exh-ink hover:border-exh-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-exh-blue"
    >
      <span aria-live="polite">
        {copyState === "copied"
          ? "Link copied"
          : copyState === "failed"
            ? "Copy failed, use the link above"
            : "Copy the sheet link"}
      </span>
    </button>
  );
}

function ReceiptCard({ hit, via }: { hit: GroundHit; via: "stored" | "fresh" }) {
  const word = hit.grade ? GRADE_WORD[hit.grade] : undefined;
  const meta = useSheetMeta(hit.areaId);
  return (
    <PaperCard data-testid="receipt-card" className="mt-5 max-w-[26rem] p-5">
      <p className="exh-plat text-[10px] font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        Grade receipt · the 1940 survey
      </p>
      {word ? (
        <p className="mt-3 font-display text-2xl leading-snug text-exh-ink">
          <span
            aria-hidden="true"
            className="mr-2 inline-block h-3.5 w-3.5 border border-exh-ink/40 align-baseline"
            style={{ backgroundColor: `var(--g-${hit.grade!.toLowerCase()})` }}
          />
          {word}
        </p>
      ) : (
        <p className="mt-3 font-display text-xl leading-snug text-exh-ink">
          Inside the surveyed city, no grade recorded on this ground.
        </p>
      )}
      {(meta?.areaNumber || meta?.filed) && (
        <p data-testid="receipt-area-line" className="exh-mono mt-2 text-sm text-exh-ink">
          {meta.areaNumber ? `Area ${meta.areaNumber}` : null}
          {meta.areaNumber && meta.filed ? " · " : null}
          {meta.filed ? `filed ${meta.filed}` : null}
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-exh-ink-soft">
        {via === "stored"
          ? "The grade the surveyors filed on the ground under you, kept from your earlier lookup."
          : "The grade the surveyors filed on the ground under you."}
      </p>
      {meta?.excerpt && (
        <p data-testid="receipt-excerpt" className="mt-3 border-l-2 border-exh-ink/25 pl-3 text-sm italic leading-relaxed text-exh-ink">
          &ldquo;{meta.excerpt}&rdquo;
          <span className="exh-plat mt-1 block not-italic text-[10px] uppercase tracking-[0.14em] text-exh-ink-soft">
            From the sheet the surveyors filed
          </span>
        </p>
      )}
      {/* the detachable stub, same dashed rule as the Act 5 stub */}
      <div className="mt-4 border border-dashed border-exh-ink/40 bg-exh-linen-deep/40 px-3 pb-3 pt-2.5">
        <a
          href={sheetHash(hit.areaId)}
          data-testid="receipt-sheet-link"
          className="inline-flex min-h-10 items-center text-sm text-exh-blue underline underline-offset-2"
        >
          Read the sheet the surveyors filed on this area
        </a>
        <br />
        <CopySheetLink areaId={hit.areaId} />
      </div>
      <div className="mt-2 text-xs leading-relaxed text-exh-ink-soft">
        Home Owners&rsquo; Loan Corporation survey of Chicago, 1939 to 1940.
        <SourceSupGroup factIds={["redlining.holc_survey_chicago"]} />
      </div>
      <p className="mt-4 border-t border-exh-ink/25 pt-2.5 text-xs text-exh-ink-soft">
        Kept on this device only.
      </p>
    </PaperCard>
  );
}

type State =
  | { s: "offer" }
  | { s: "working" }
  | { s: "hit"; hit: GroundHit; via: "stored" | "fresh" }
  | { s: "miss" }
  | { s: "denied" };

export default function Receipt(_props: SceneProps) {
  const { activeIndex } = useGround();
  const [state, setState] = useState<State>({ s: "offer" });

  // sessionStorage is client-only, and a visitor who ran the Act 0
  // lookup DURING this visit stored it long after this scene mounted,
  // so re-read whenever the active step moves while the offer stands
  // (covers reloads, deep links, and the continuous walk alike);
  // the re-read is deferred a frame so it never sets state
  // synchronously inside the effect
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setState((prev) => {
        if (prev.s !== "offer") return prev;
        const stored = storedGround();
        return stored ? { s: "hit", hit: stored, via: "stored" } : prev;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeIndex]);

  const run = async () => {
    setState({ s: "working" });
    const r: LocateResult = await locateGround();
    if (r.state === "hit") setState({ s: "hit", hit: r.hit, via: "fresh" });
    else setState({ s: r.state });
  };

  return (
    <section data-testid="scene-receipt" className="max-w-[34rem]">
      {state.s === "hit" ? (
        <>
          <p className="font-display text-xl leading-relaxed text-exh-ink">
            The walk ends where it started, on the ground under you.
          </p>
          <ReceiptCard hit={state.hit} via={state.via} />
        </>
      ) : state.s === "miss" ? (
        <p className="font-display text-lg leading-relaxed text-exh-ink" data-testid="receipt-miss">
          This survey never reached the ground under you. The 1940 survey
          graded metropolitan Chicago; 238 other cities got maps of their own.
          <SourceSupGroup
            factIds={["redlining.holc_survey_chicago", "redlining.holc_239_cities"]}
          />
        </p>
      ) : state.s === "denied" ? (
        <p className="font-display text-lg leading-relaxed text-exh-ink" data-testid="receipt-denied">
          No position was shared, and nothing was recorded. The account above
          stands either way.
        </p>
      ) : (
        <>
          <p className="font-display text-xl leading-relaxed text-exh-ink">
            One question is still open, the one the surveyors answered about
            every block on this map.
          </p>
          <button
            type="button"
            data-testid="receipt-locate-button"
            onClick={run}
            disabled={state.s === "working"}
            className="mt-5 inline-flex min-h-12 items-center justify-center px-5 py-3 text-left text-xs font-semibold uppercase leading-relaxed tracking-[0.2em] text-exh-linen focus-visible:outline focus-visible:outline-2 focus-visible:outline-exh-blue disabled:cursor-wait disabled:opacity-65"
            style={{ backgroundColor: "var(--exh-rust, #A8502F)" }}
          >
            {state.s === "working"
              ? "Reading the 1940 boundaries"
              : "What grade is the ground under you?"}
          </button>
          <p className="mt-2.5 text-[0.8rem] text-exh-ink-soft">
            Uses your device location once, with your permission. Nothing
            leaves this page.
          </p>
        </>
      )}
    </section>
  );
}
