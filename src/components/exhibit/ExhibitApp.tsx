"use client";
/* ------------------------------------------------------------------ */
/*  Client root of the exhibit. One reader-paced document: the         */
/*  opening wall, every chapter in continuous flow, the about panel,   */
/*  the timeline rail, and the document rooms. Composition only.       */
/* ------------------------------------------------------------------ */
import { useEffect, useRef } from "react";
import {
  ExhibitProvider,
  scrollToAnchor,
  useExhibitDispatch,
  useExhibitState,
} from "@/lib/exhibit/ExhibitProvider";
import { EXHIBIT_FLOW } from "@/lib/exhibit/content";
import { CHAPTER_ORDER } from "@/lib/exhibit/types";
import ExhibitHeader from "./ExhibitHeader";
import ChapterSection from "./ChapterSection";
import AboutPanel from "./stations/AboutPanel";
import TimelineSpine from "./hud/TimelineSpine";
import RoomOverlay, { openRoomFromHash } from "./rooms/RoomOverlay";

function ExhibitRoot() {
  const dispatch = useExhibitDispatch();
  const { reducedMotion } = useExhibitState();
  const flowRef = useRef<HTMLDivElement | null>(null);

  // the exhibit is an immersive room; the site navbar/footer yield while
  // a visitor is inside (globals.css body.exhibit-immersive rules)
  useEffect(() => {
    document.body.classList.add("exhibit-immersive");
    return () => document.body.classList.remove("exhibit-immersive");
  }, []);

  // ?ch=ch5 deep links (QC, review digests, owner links) scroll straight
  // to the chapter; a #room-<id> hash opens that room over the page
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ch = q.get("ch");
    if (ch && CHAPTER_ORDER.includes(ch as (typeof CHAPTER_ORDER)[number])) {
      const idx = CHAPTER_ORDER.indexOf(ch as (typeof CHAPTER_ORDER)[number]);
      dispatch({ type: "SET_CHAPTER", chapterIndex: idx });
      // after paint, so the sections have laid out
      requestAnimationFrame(() => scrollToAnchor(ch, "auto"));
    }
    openRoomFromHash(dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // active chapter derives from scroll position; drives the rail highlight
  useEffect(() => {
    const root = flowRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-chapter-section]"));
    if (!sections.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.getAttribute("data-chapter-section");
          if (!id) continue;
          if (e.isIntersecting) visible.set(id, e.intersectionRatio);
          else visible.delete(id);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        if (best) {
          const idx = CHAPTER_ORDER.indexOf(best as (typeof CHAPTER_ORDER)[number]);
          if (idx >= 0) dispatch({ type: "SET_CHAPTER", chapterIndex: idx });
        }
      },
      { rootMargin: "-15% 0px -35% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    for (const s of sections) io.observe(s);
    return () => io.disconnect();
  }, [dispatch]);

  return (
    <div
      className="exhibit-root relative min-h-screen"
      data-testid="exhibit-root"
      /* the reduced-motion contract: state mirrors the media query, the
         root flag switches off every entrance animation exhibit-wide */
      data-motion={reducedMotion ? "off" : undefined}
    >
      {/* the one polite live region (room announcements, wall submissions) */}
      <div id="exh-live" aria-live="polite" className="sr-only" />

      <main ref={flowRef} className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-40 sm:px-8">
        <ExhibitHeader />
        {EXHIBIT_FLOW.map((id) => (
          <ChapterSection key={id} id={id} />
        ))}
        <AboutPanel />
      </main>

      <TimelineSpine />
      <RoomOverlay />
    </div>
  );
}

export default function ExhibitApp() {
  return (
    <ExhibitProvider>
      <ExhibitRoot />
    </ExhibitProvider>
  );
}
