"use client";
/* ------------------------------------------------------------------ */
/*  R9 scene "advisory". The content advisory ahead of the bombing     */
/*  chapter, in the register of the R8 AdvisoryPlate. A quiet          */
/*  bordered plate, not a modal: no focus trap, no motion, no hover,   */
/*  one same-page link that passes over the chapter and moves focus    */
/*  to the next chapter head so keyboard and screen-reader visitors    */
/*  land where the page lands.                                        */
/* ------------------------------------------------------------------ */
import type { MouseEvent } from "react";
import type { SceneProps } from "./registry";
import SourceSup from "../../shared/SourceSup";

const SKIP_TO = "ch5";

export default function AdvisoryGround(_props: SceneProps) {
  const moveFocus = (_e: MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(SKIP_TO);
    if (!el) return;
    /* the native hash jump proceeds; focus follows it on the next frame */
    requestAnimationFrame(() => {
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
    });
  };

  return (
    <aside
      data-testid="scene-advisory"
      aria-label="Content advisory"
      className="max-w-[34rem] border border-exh-ink bg-exh-linen-deep/40 p-5 sm:p-6"
    >
      <p className="exh-plat text-xs font-semibold uppercase tracking-[0.25em] text-exh-ink-soft">
        Content advisory
      </p>
      <p className="mt-3 font-body text-base leading-relaxed text-exh-ink">
        The chapter ahead carries deadly violence as the record kept it,
        bombing by bombing, with addresses and dates. Two people were killed,
        one a child of{" "}
        <span className="whitespace-nowrap">
          six.
          <SourceSup factId="bombings.deaths_2" />
        </span>{" "}
        No images of victims appear.
      </p>
      <a
        href={`#${SKIP_TO}`}
        data-testid="advisory-skip"
        onClick={moveFocus}
        className="exh-plat mt-4 inline-flex min-h-12 items-center border border-exh-ink/40 bg-exh-linen px-5 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink"
      >
        Pass over this chapter
      </a>
    </aside>
  );
}
