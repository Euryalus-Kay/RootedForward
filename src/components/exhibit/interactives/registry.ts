"use client";
/* ------------------------------------------------------------------ */
/*  Interactive registry: the code-splitting backbone. Each entry is   */
/*  a next/dynamic component (its own chunk) plus a preloader the      */
/*  chapter-boundary prefetch calls. Entries whose loader is null are  */
/*  not built yet; InteractiveSlot renders an honest in-production     */
/*  card for them, never a silent gap.                                 */
/* ------------------------------------------------------------------ */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { InteractiveId } from "@/lib/exhibit/types";

export interface RegistryEntry {
  title: string;
  /** one-line invitation shown on the slot chrome and in-production card */
  blurb: string;
  Component: ComponentType | null;
  preload: (() => void) | null;
}

function entry(
  title: string,
  blurb: string,
  loader?: () => Promise<{ default: ComponentType }>
): RegistryEntry {
  if (!loader) return { title, blurb, Component: null, preload: null };
  return {
    title,
    blurb,
    Component: dynamic(loader, { ssr: false }),
    preload: () => void loader(),
  };
}

export const INTERACTIVE_REGISTRY: Record<InteractiveId, RegistryEntry> = {
  "declined-map": entry(
    "Declined",
    "Tap any neighborhood on the 1940 map and file the application.",
    () => import("./DeclinedMap/DeclinedMap")
  ),
  "machine-board": entry(
    "The Machine Status Board",
    "Tap each lamp to learn the machine it stands for.",
    () => import("./MachineBoardIntro/MachineBoardIntro")
  ),
  "layer-slider": entry(
    "Four Claims, One Ground",
    "Drag between four claims on the same ground.",
    () => import("./LayerSlider/LayerSlider")
  ),
  "build-the-boom": entry(
    "Build the Boom",
    "Raise the fair and watch the neighborhood densify.",
    () => import("./BuildTheBoom/BuildTheBoom")
  ),
  "machinery-cards": entry(
    "The Machinery of Exclusion",
    "Flip the club's three documents.",
    () => import("./MachineryCards/MachineryCards")
  ),
  "bombing-map": entry(
    "The Bombing Map",
    "Evidence pins, one for each recorded attack.",
    () => import("./BombingMap/BombingMap")
  ),
  "invisible-line": entry(
    "The Invisible Line",
    "Trace the line in the water at Twenty-Ninth Street.",
    () => import("./InvisibleLine/InvisibleLine")
  ),
  "read-the-deed": entry(
    "Read the Deed",
    "Read a restrictive covenant the way a buyer did, clause by clause.",
    () => import("./ReadTheDeed/ReadTheDeed")
  ),
  "holc-lens": entry(
    "The Lens",
    "Drag the magnifier over the 1940 map and read the surveyors' words.",
    () => import("./HolcLens/HolcLens")
  ),
  "case-files": entry(
    "The Case Files",
    "Open four folders and stamp the outcomes.",
    () => import("./CaseFiles/CaseFiles")
  ),
  "kitchenette": entry(
    "The Kitchenette Splitter",
    "Drag walls into a six-flat and watch the count climb.",
    () => import("./Kitchenette/Kitchenette")
  ),
  "planners-table": entry(
    "The Planner's Table",
    "Work the renewal map the way the commission did.",
    () => import("./PlannersTable/PlannersTable")
  ),
  "two-buyers": entry(
    "Two Buyers, One House",
    "Slide the years and watch two families pay for the same house.",
    () => import("./TwoBuyers/TwoBuyers")
  ),
  "hold-the-line": entry(
    "Hold the Line",
    "Hold your payment in escrow. The strike holds as long as you do.",
    () => import("./HoldTheLine/HoldTheLine")
  ),
  "gap-at-scale": entry(
    "The Gap, at Scale",
    "Scroll the full height of the wealth gap.",
    () => import("./GapAtScale/GapAtScale")
  ),
  "answer-wall": entry("The Wall", "Leave your answer among everyone else's."),
};

/** chapter-boundary prefetch helper */
export function preloadInteractives(ids: InteractiveId[]) {
  for (const id of ids) INTERACTIVE_REGISTRY[id]?.preload?.();
}
