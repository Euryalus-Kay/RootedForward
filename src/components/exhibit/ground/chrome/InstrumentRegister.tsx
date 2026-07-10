"use client";
/* ------------------------------------------------------------------ */
/*  The Instrument Register, the exhibit's thesis graphic. Five bars   */
/*  on one 1900 to 2026 axis with true dates from machines.json.       */
/*  Docked mode is the 24px strip riding under the Stage with a date   */
/*  cursor; wall mode is the full-size annotated version the overture  */
/*  scene mounts once. Bars are anchor links to their chapters. Court  */
/*  defeats end bars with dated annotations; the strip itself runs to  */
/*  2026 because the ground is still moving.                           */
/* ------------------------------------------------------------------ */
import { allMachines } from "@/lib/exhibit/machines";
import { machineTitle } from "../legacy";
import { useGround } from "../engine/GroundProvider";
import { SourceSupGroup } from "../../shared/SourceSup";

const AXIS_START = 1900;
const AXIS_END = 2026;
const SPAN = AXIS_END - AXIS_START;

/** which chapter anchor each instrument's story lives at */
const CHAPTER_OF: Record<string, string> = {
  code: "ch5",
  deed: "ch5",
  map: "ch6",
  bulldozer: "ch8",
  contract: "ch9",
};
/** the order the bars stack, first written to last */
const ORDER = ["code", "deed", "map", "bulldozer", "contract"];
/** dated end annotations where a court or a repeal stopped an instrument */
const END_NOTES: Record<string, { text: string; at: number }> = {
  deed: { text: "unenforceable 1948", at: 1948 },
  code: { text: "written out 1950", at: 1950 },
  map: { text: "outlawed 1968", at: 1968 },
  contract: { text: "returned after 2008", at: 2008 },
};

function pct(year: number): number {
  return ((year - AXIS_START) / SPAN) * 100;
}

export function useOrderedMachines() {
  const rank = (id: string) => {
    const i = ORDER.indexOf(id);
    return i === -1 ? ORDER.length : i;
  };
  return [...allMachines()].sort((a, b) => rank(a.machineId) - rank(b.machineId));
}

export default function InstrumentRegister({ mode }: { mode: "docked" | "wall" }) {
  const { cursorYear } = useGround();
  const machines = useOrderedMachines();

  if (mode === "docked") {
    return (
      <div
        className="ground-register-docked"
        data-testid="ground-register"
        aria-label={`Five instruments, 1921 to 1970 with no gap. The story is at ${cursorYear}.`}
        role="img"
      >
        <div className="gr-track">
          {machines.map((m, i) => (
            <span
              key={m.machineId}
              className="gr-bar"
              data-live={cursorYear >= m.onYear && cursorYear <= (m.offYear ?? AXIS_END) ? "on" : "off"}
              style={{
                left: `${pct(m.onYear)}%`,
                width: `${pct(m.offYear ?? AXIS_END) - pct(m.onYear)}%`,
                top: `${3 + i * 4}px`,
              }}
            />
          ))}
          <span className="gr-cursor" style={{ left: `${pct(Math.max(AXIS_START, Math.min(AXIS_END, cursorYear)))}%` }} />
        </div>
      </div>
    );
  }

  return (
    <figure className="ground-register-wall" data-testid="ground-register-wall">
      <figcaption className="gr-wall-title exh-plat">
        Five instruments, one relay
      </figcaption>
      <div className="gr-wall-axis exh-mono" aria-hidden="true">
        {[1900, 1920, 1940, 1960, 1980, 2000, 2026].map((y) => (
          <span key={y} style={{ left: `${pct(y)}%` }}>
            {y}
          </span>
        ))}
      </div>
      <ul className="gr-wall-rows">
        {machines.map((m) => (
          <li key={m.machineId} className="gr-wall-row">
            <a href={`#${CHAPTER_OF[m.machineId] ?? "ch0"}`} className="gr-wall-label">
              <span className="gr-wall-name">{m.plainName}</span>
              <span className="gr-wall-alias exh-mono">{machineTitle(m).toLowerCase()}</span>
            </a>
            <div className="gr-wall-track">
              <span
                className="gr-wall-bar"
                data-instrument={m.machineId}
                style={{
                  left: `${pct(m.onYear)}%`,
                  width: `${pct(m.offYear ?? AXIS_END) - pct(m.onYear)}%`,
                }}
              />
              <span className="gr-wall-years exh-mono" style={{ left: `${pct(m.onYear)}%` }}>
                {m.onYear} to {m.offYear ?? "now"}
              </span>
              {END_NOTES[m.machineId] ? (
                <span
                  className="gr-wall-endnote exh-mono"
                  style={
                    END_NOTES[m.machineId].at >= 1985
                      ? { right: `${100 - pct(END_NOTES[m.machineId].at)}%` }
                      : { left: `${pct(END_NOTES[m.machineId].at)}%` }
                  }
                >
                  {END_NOTES[m.machineId].text}
                </span>
              ) : null}
            </div>
            <span className="sr-only">
              <SourceSupGroup factIds={m.evidenceFactRefs} />
            </span>
          </li>
        ))}
      </ul>
      <p className="gr-wall-note">
        From 1921 to 1970 there was <strong>no year the machinery was off</strong>. When a court
        closed one instrument, another was already running.
      </p>
    </figure>
  );
}
