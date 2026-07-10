"use client";
/* ------------------------------------------------------------------ */
/*  Scene registry for the R9 page. ground-copy.json steps with role   */
/*  "scene" mount the component registered under their scene key.      */
/*  Unregistered keys render nothing, so acts can land in build waves  */
/*  without placeholders ever appearing on the page. Heavy scenes      */
/*  join through next/dynamic so the initial route bundle stays lean.  */
/* ------------------------------------------------------------------ */
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import LocateScene from "./LocateScene";
import InstrumentRegister from "../chrome/InstrumentRegister";

export interface SceneProps {
  stepId: string;
}

function RegisterWall() {
  return <InstrumentRegister mode="wall" />;
}

/** code-split loader so heavy scenes stay out of the initial bundle */
function lazyScene(loader: () => Promise<{ default: ComponentType<SceneProps> }>) {
  return dynamic(loader, { ssr: true });
}

export const GROUND_SCENES: Record<string, ComponentType<SceneProps>> = {
  locate: LocateScene,
  registerExpand: RegisterWall,
  platDoc: lazyScene(() => import("./PlatDoc")),
  fairFigure: lazyScene(() => import("./FairFigure")),
  docket: lazyScene(() => import("./Docket")),
  wellsClose: lazyScene(() => import("./WellsClose")),
  article34: lazyScene(() => import("./Article34")),
  deedFacsimile: lazyScene(() => import("./DeedFacsimile")),
  gradeFlood: lazyScene(() => import("./GradeFlood")),
  casesReroute: lazyScene(() => import("./CasesReroute")),
  hansberryVoice: lazyScene(() => import("./HansberryVoice")),
  clearance: lazyScene(() => import("./Clearance")),
  baldwinBench: lazyScene(() => import("./BaldwinBench")),
  twoBuyers: lazyScene(() => import("./TwoBuyersGround")),
  basement: lazyScene(() => import("./Basement")),
  bridge: lazyScene(() => import("./Bridge")),
  ledgerColumn: lazyScene(() => import("./LedgerColumn")),
  climb: lazyScene(() => import("./Climb")),
  receipt: lazyScene(() => import("./Receipt")),
  answerWall: lazyScene(() => import("./AnswerWallGround")),
  colophon: lazyScene(() => import("./Colophon")),
};
