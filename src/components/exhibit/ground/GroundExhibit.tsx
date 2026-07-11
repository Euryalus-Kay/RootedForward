"use client";
/* ------------------------------------------------------------------ */
/*  R9 client root. Provider, Spine, the sticky Stage pane with the    */
/*  docked Register, the step column, and the Ledger Rail. The         */
/*  server-rendered StageBase arrives as a prop so geometry.json       */
/*  never enters the client bundle.                                    */
/* ------------------------------------------------------------------ */
import { useEffect, type ReactNode } from "react";
import GroundProvider from "./engine/GroundProvider";
import StageController, { type StageClientProps } from "./StageController";
import InstrumentRegister from "./chrome/InstrumentRegister";
import LedgerRail from "./chrome/LedgerRail";
import Spine from "./chrome/Spine";
import GroundFlow from "./GroundFlow";
import { GROUND_COPY } from "@/lib/exhibit/ground/copy";
import { SourceSupGroup } from "../shared/SourceSup";

function GroundIntro() {
  const o = GROUND_COPY.opening;
  return (
    <header className="ground-intro" data-testid="ground-intro">
      <p className="gi-kicker exh-plat">{o.kicker}</p>
      <h1 className="gi-title">{o.title}</h1>
      <p className="gi-caption">
        {o.mapCaption}
        <SourceSupGroup factIds={o.mapCaptionFactRefs} />
      </p>
      <p className="gi-howto">{o.howTo}</p>
    </header>
  );
}

export default function GroundExhibit({
  stageBase,
  clientProps,
}: {
  stageBase: ReactNode;
  clientProps: StageClientProps;
}) {
  /* the exhibit is a full room; the site chrome yields while inside */
  useEffect(() => {
    document.body.classList.add("exhibit-immersive");
    return () => document.body.classList.remove("exhibit-immersive");
  }, []);

  return (
    <GroundProvider anchorsPct={clientProps.anchorsPct}>
      <Spine />
      <div className="ground-layout">
        <div className="ground-stage-pane" data-testid="ground-stage-pane">
          <StageController stageBase={stageBase} clientProps={clientProps} />
          <InstrumentRegister mode="docked" />
        </div>
        <div className="ground-steps-pane">
          <GroundIntro />
          <GroundFlow />
        </div>
      </div>
      <LedgerRail />
    </GroundProvider>
  );
}
