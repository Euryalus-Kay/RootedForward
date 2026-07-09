"use client";
/* ------------------------------------------------------------------ */
/*  One evidence station in the document flow. Its stationIntro panel  */
/*  (what / when / why it matters, from walltext.json) sits above the  */
/*  framed station body. No pause points, no completion dispatches,    */
/*  no Continue: the station is simply open. The InteractiveContext    */
/*  it provides is the minimal reader-paced contract.                  */
/* ------------------------------------------------------------------ */
import { useMemo, type ComponentType } from "react";
import type { StationId, StationIntroDef } from "@/lib/exhibit/types";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { STATION_REGISTRY } from "./interactives/registry";
import { InteractiveContext, type InteractiveApi } from "./interactives/InteractiveContext";
import SourceSup from "./shared/SourceSup";

const noop = () => undefined;

function IntroLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[5.5rem_1fr] sm:gap-3">
      <dt className="exh-plat text-[11px] md:text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-exh-ink-soft">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-exh-ink">{text}</dd>
    </div>
  );
}

/** The quiet what/when/why panel above a station or documents block. */
export function StationIntro({ id, intro }: { id: string; intro: StationIntroDef }) {
  return (
    <dl
      data-testid={`station-intro-${id}`}
      className="mb-3 space-y-1.5 border-l-2 border-exh-ink/25 py-1 pl-4"
    >
      <IntroLine label="What" text={intro.what} />
      <IntroLine label="When" text={intro.when} />
      <div className="grid gap-0.5 sm:grid-cols-[5.5rem_1fr] sm:gap-3">
        <dt className="exh-plat text-[11px] md:text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-exh-ink-soft">
          Why
        </dt>
        <dd className="text-sm leading-relaxed text-exh-ink">
          {intro.why}
          {(intro.factRefs ?? []).map((ref) => (
            <SourceSup key={ref} factId={ref} />
          ))}
        </dd>
      </div>
      {intro.tryIt && (
        <div className="grid gap-0.5 sm:grid-cols-[5.5rem_1fr] sm:gap-3">
          <dt className="exh-plat text-[11px] md:text-[10px] font-semibold uppercase leading-5 tracking-[0.22em] text-exh-ink">
            Try
          </dt>
          <dd
            data-testid="station-try"
            className="text-sm font-semibold leading-relaxed text-exh-ink"
          >
            {intro.tryIt}
          </dd>
        </div>
      )}
    </dl>
  );
}

export interface StationBlockProps {
  id: StationId;
  intro?: StationIntroDef;
  componentProps?: Record<string, unknown>;
  /** chapter-level no-motion (ch4 sensitivity), folded in by ChapterSection */
  chapterNoMotion?: boolean;
}

export default function StationBlock({
  id,
  intro,
  componentProps,
  chapterNoMotion = false,
}: StationBlockProps) {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();
  const entry = STATION_REGISTRY[id];

  const reducedMotion = state.reducedMotion || chapterNoMotion;
  const firedOnceList = state.firedOnce;

  const api = useMemo<InteractiveApi>(
    () => ({
      active: true,
      isPausePoint: false,
      reducedMotion,
      onInteraction: noop,
      onComplete: noop,
      firedOnce: (key: string) => firedOnceList.includes(key),
      markFired: (key: string) => dispatch({ type: "MARK_FIRED", key }),
    }),
    [reducedMotion, dispatch, firedOnceList]
  );

  if (!entry) return null;
  const Component = entry.Component as ComponentType<Record<string, unknown>>;

  return (
    <div data-station={id} data-testid={`station-${id}`} className="scroll-mt-10">
      {intro && <StationIntro id={id} intro={intro} />}
      <div className="border border-exh-ink/30 bg-exh-linen-deep/40">
        <div className="flex items-center gap-3 border-b border-exh-ink/20 px-4 py-3 sm:px-6">
          <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
          <h3 className="exh-plat min-w-0 text-center text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink">
            {entry.title}
          </h3>
          <span className="h-px min-w-4 flex-1 bg-exh-ink/25" aria-hidden="true" />
        </div>
        <div className="p-4 sm:p-6">
          <InteractiveContext.Provider value={api}>
            <div data-testid={`station-body-${id}`}>
              <Component {...(componentProps ?? {})} />
            </div>
          </InteractiveContext.Provider>
        </div>
      </div>
    </div>
  );
}
