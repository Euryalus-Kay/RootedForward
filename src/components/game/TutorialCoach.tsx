"use client";

import { useEffect, useState } from "react";

const TUTORIAL_STEPS = [
  {
    key: "score",
    title: "Your score",
    body: "This number rises and falls as you play. Higher is better. The leaderboard rank below shows where you stand.",
  },
  {
    key: "resources",
    title: "Resources",
    body: "Capital is money. Power is political muscle. Trust is community buy-in. Knowledge unlocks deeper cards. Spend these to play cards.",
  },
  {
    key: "score-tab",
    title: "Four hidden axes",
    body: "Every card shifts Equity, Heritage, Growth, or Sustainability. The final score weighs all four. There is no single winning axis.",
  },
  {
    key: "hand",
    title: "Your hand",
    body: "These are your policy cards. Click one to read it. Then click Play. Cards you cannot afford are dimmed.",
  },
  {
    key: "end-year",
    title: "Advance time",
    body: "When you are done with this year, click End year. Five years pass, an event may fire, and you draw new cards.",
  },
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;
export const TUTORIAL_DONE_KEY = "buildTheBlock:tutorialDone";

export function TutorialCoach({
  step,
  onNext,
  onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const current = TUTORIAL_STEPS[step];
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!current) return;
    const el = document.querySelector(`[data-tut="${current.key}"]`) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }

    // Snap immediately to the new target so the highlight, dim, and callout
    // reposition the moment the user clicks Next instead of waiting for the
    // smooth scroll to finish.
    setRect(el.getBoundingClientRect());

    // Only scroll if the target is partly off-screen. The scroll listener
    // below keeps the rect updated while the smooth scroll plays out.
    const initial = el.getBoundingClientRect();
    const fullyInView =
      initial.top >= 0 && initial.bottom <= window.innerHeight;
    if (!fullyInView) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    function refresh() {
      const fresh = el?.getBoundingClientRect();
      if (fresh) setRect(fresh);
    }
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, { passive: true });
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh);
    };
  }, [current]);

  if (!current) return null;

  const PAD = 8;
  const r = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : null;

  const margin = 16;
  const calloutMaxWidth = 380;
  const calloutHeight = 240;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  let calloutStyle: React.CSSProperties;
  if (!r) {
    calloutStyle = {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  } else {
    const fitBelow = r.top + r.height + margin + calloutHeight <= vh - margin;
    const fitAbove = r.top - margin - calloutHeight >= margin;
    const leftSpace = r.left - margin * 2;
    const rightSpace = vw - (r.left + r.width) - margin * 2;
    const canFitLeft = leftSpace >= calloutMaxWidth;
    const canFitRight = rightSpace >= calloutMaxWidth;
    const clampLeft = (x: number) =>
      Math.min(Math.max(margin, x), Math.max(margin, vw - calloutMaxWidth - margin));
    const clampTop = (y: number) =>
      Math.min(Math.max(margin, y), Math.max(margin, vh - calloutHeight - margin));

    if (fitBelow) {
      calloutStyle = { top: r.top + r.height + margin, left: clampLeft(r.left) };
    } else if (fitAbove) {
      calloutStyle = { top: r.top - margin - calloutHeight, left: clampLeft(r.left) };
    } else if (canFitLeft) {
      // Tall rect (e.g. the hand) on the right of the screen — place callout
      // in the left gutter, centered vertically with the rect.
      calloutStyle = {
        top: clampTop(r.top + (r.height - calloutHeight) / 2),
        left: r.left - calloutMaxWidth - margin,
      };
    } else if (canFitRight) {
      calloutStyle = {
        top: clampTop(r.top + (r.height - calloutHeight) / 2),
        left: r.left + r.width + margin,
      };
    } else {
      // No fit anywhere — pin to the bottom of the viewport, centered.
      calloutStyle = {
        bottom: margin,
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
  }

  const dim = "rgba(20, 24, 22, 0.55)";
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100]">
      {r ? (
        <>
          {/* Four-panel cutout backdrop. Clicks outside the highlighted area
              are caught here and do nothing, effectively disabling the rest
              of the UI. The highlighted area itself stays interactive because
              no overlay sits on top of it. */}
          <div
            className="fixed pointer-events-auto"
            style={{ top: 0, left: 0, right: 0, height: r.top, background: dim }}
          />
          <div
            className="fixed pointer-events-auto"
            style={{ top: r.top + r.height, left: 0, right: 0, bottom: 0, background: dim }}
          />
          <div
            className="fixed pointer-events-auto"
            style={{ top: r.top, left: 0, width: r.left, height: r.height, background: dim }}
          />
          <div
            className="fixed pointer-events-auto"
            style={{ top: r.top, left: r.left + r.width, right: 0, height: r.height, background: dim }}
          />

          {/* Highlight ring */}
          <div
            className="fixed pointer-events-none rounded-md transition-all duration-200"
            style={{
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
              boxShadow: "0 0 0 4px #C45D3E, 0 0 28px 8px rgba(196, 93, 62, 0.55)",
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 pointer-events-auto" style={{ background: dim }} />
      )}

      {/* Callout */}
      <div
        className="fixed pointer-events-auto rounded-md border-2 border-rust bg-cream p-5 shadow-2xl"
        style={{
          ...calloutStyle,
          maxWidth: calloutMaxWidth,
          width: `min(calc(100vw - ${margin * 2}px), ${calloutMaxWidth}px)`,
        }}
        role="dialog"
        aria-modal="false"
        aria-label="Tutorial step"
      >
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.25em] text-rust">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </p>
        <h3 className="mt-1 font-display text-xl text-forest">{current.title}</h3>
        <p className="mt-2 font-body text-[13px] leading-relaxed text-ink/80">{current.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={onSkip}
            className="font-body text-[11px] font-semibold uppercase tracking-widest text-warm-gray hover:text-rust"
          >
            Skip tour
          </button>
          <button
            onClick={onNext}
            className="rounded-sm bg-rust px-5 py-2 font-body text-xs font-semibold uppercase tracking-widest text-cream hover:bg-rust-dark"
            autoFocus
          >
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
