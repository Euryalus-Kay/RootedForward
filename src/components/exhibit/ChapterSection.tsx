"use client";
/* ------------------------------------------------------------------ */
/*  One chapter of the reader-paced document. Era eyebrow, title,      */
/*  context intro (slightly emphasized), wall-text sections with       */
/*  their extras (figures, stations, quotes, doors) interleaved per    */
/*  CHAPTER_LAYOUTS, and the quiet record block at the end. Chapters   */
/*  whose wall text has not landed yet render their scaffold (title,   */
/*  stations, figures) behind an honest pending note. The overture     */
/*  chapter (ch0_5) always carries the five-instruments panel.         */
/* ------------------------------------------------------------------ */
import type { ChapterId, FlowBlock, WallSection } from "@/lib/exhibit/types";
import { CHAPTER_LAYOUTS, displayEraOf, displayTitleOf, metaOf } from "@/lib/exhibit/content";
import { stationIntroOf, wallChapter } from "@/lib/exhibit/walltext";
import AdvisoryPlate from "./AdvisoryPlate";
import FigureBlock from "./FigureBlock";
import StationBlock, { StationIntro } from "./StationBlock";
import { LedgerTable, RecordLines } from "./RecordBlock";
import CasesPanel from "./stations/CasesPanel";
import MachinesPanel from "./stations/MachinesPanel";
import DoorCard from "./rooms/DoorCard";
import VoiceCard from "./shared/VoiceCard";
import SourceSup from "./shared/SourceSup";

/* wall text measure: ~65ch at 1.125rem/1.75 */
const SECTION_CLASS =
  "max-w-[65ch] font-display text-lg leading-[1.75] text-exh-ink";
const INTRO_CLASS =
  "max-w-[65ch] font-display text-xl leading-[1.65] text-exh-ink md:text-2xl md:leading-[1.6]";

function WallParagraph({ section, intro = false }: { section: WallSection; intro?: boolean }) {
  return (
    <p data-section-id={section.id} className={intro ? INTRO_CLASS : SECTION_CLASS}>
      {section.text}
      {section.factRefs.map((ref) => (
        <SourceSup key={ref} factId={ref} />
      ))}
    </p>
  );
}

function ExtraBlock({
  block,
  chapterId,
  noMotion,
}: {
  block: FlowBlock;
  chapterId: ChapterId;
  noMotion: boolean;
}) {
  switch (block.kind) {
    case "figure":
      return (
        <FigureBlock
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          creditKey={block.creditKey}
        />
      );
    case "station":
      return (
        <StationBlock
          id={block.station}
          intro={stationIntroOf(chapterId, block.station)}
          componentProps={block.props}
          chapterNoMotion={noMotion}
        />
      );
    case "quote":
      return (
        <div data-voice-id={block.voiceId} className="flex justify-center py-2">
          <VoiceCard personId={block.voiceId} size="md" />
        </div>
      );
    case "door":
      return <DoorCard roomId={block.roomId} label={block.label} />;
    case "cases": {
      const intro = stationIntroOf(chapterId, "case-documents");
      return (
        <div data-testid="case-documents">
          {intro && <StationIntro id="case-documents" intro={intro} />}
          <CasesPanel />
        </div>
      );
    }
    case "ledger-table":
      return <LedgerTable />;
    default:
      return null;
  }
}

export default function ChapterSection({ id }: { id: ChapterId }) {
  const meta = metaOf(id);
  const wall = wallChapter(id);
  const layout = CHAPTER_LAYOUTS[id] ?? {};
  const noMotion = meta.sensitivity === "no-motion";
  const overture = id === "ch0_5";

  const title = overture && !wall ? "Five instruments" : displayTitleOf(id);
  const era = displayEraOf(id);

  /* interleave: for each section, the paragraph then its extras; extras
     keyed past the section count land at the tail, so a layout never
     silently drops a station while wall text is still being written */
  const sections = wall?.sections ?? [];
  const after = layout.afterSection ?? {};
  const tail: FlowBlock[] = [...(layout.tail ?? [])];
  for (const [n, blocks] of Object.entries(after)) {
    if (Number(n) > sections.length) tail.push(...blocks);
  }

  return (
    <section
      id={id}
      data-chapter-section={id}
      data-era={era}
      data-motion={noMotion ? "off" : undefined}
      className="scroll-mt-8 border-t border-exh-ink/15 py-14 md:py-20"
    >
      <header className="mb-8 md:mb-10">
        <p className="exh-plat text-xs font-semibold uppercase tracking-[0.3em] text-exh-ink-soft">
          {era}
        </p>
        <h2 className="mt-3 font-display text-3xl text-exh-ink md:text-4xl">{title}</h2>
        <div className="mt-6 h-px w-16 bg-exh-ink/30" aria-hidden="true" />
      </header>

      {meta.advisoryBefore && <AdvisoryPlate skipToId="ch5" />}

      <div className="space-y-8 md:space-y-10">
        {wall ? (
          <WallParagraph section={wall.contextIntro} intro />
        ) : (
          <p
            data-testid={`chapter-pending-${id}`}
            className="exh-plat max-w-[65ch] border border-dashed border-exh-ink/35 bg-exh-linen-deep/30 px-4 py-3 text-[11px] uppercase leading-relaxed tracking-[0.18em] text-exh-ink-soft"
          >
            The wall text for this chapter is being written. The documents below are open.
          </p>
        )}

        {sections.map((s, i) => (
          <div key={s.id} className="space-y-8 md:space-y-10">
            <WallParagraph section={s} />
            {(after[i + 1] ?? []).map((block, j) => (
              <ExtraBlock key={`${s.id}-x${j}`} block={block} chapterId={id} noMotion={noMotion} />
            ))}
          </div>
        ))}

        {tail.map((block, j) => (
          <ExtraBlock key={`tail-${j}`} block={block} chapterId={id} noMotion={noMotion} />
        ))}

        {overture && <MachinesPanel />}

        {id !== "ch11" && <RecordLines chapterId={id} />}
      </div>
    </section>
  );
}
