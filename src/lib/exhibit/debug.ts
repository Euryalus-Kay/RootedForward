/* ------------------------------------------------------------------ */
/*  Debug/testability singleton behind ?debug=1. The verify harness    */
/*  drives the exhibit through window.__exhibit, and deterministic     */
/*  mode (seeded RNG, near-instant animation, silent audio stubs)      */
/*  keeps scenarios reproducible.                                      */
/* ------------------------------------------------------------------ */

export interface DebugFlags {
  enabled: boolean;
  audioStub: boolean;
  seed: number;
}

const flags: DebugFlags = { enabled: false, audioStub: false, seed: 1 };

export function initDebug(): DebugFlags {
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search);
    if (q.get("debug") === "1") {
      flags.enabled = true;
      flags.audioStub = true; // deterministic by default under debug
      const s = Number(q.get("seed"));
      if (Number.isFinite(s) && s > 0) flags.seed = s;
    }
  }
  return flags;
}

export const debugFlags = flags;

/** mulberry32, seeded from debugFlags.seed under debug, random otherwise */
export function makeRng(): () => number {
  let a = flags.enabled ? flags.seed : Math.floor(Math.random() * 2 ** 31) || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** duration scale: near-instant animations under debug so scenarios never wait */
export function motionMs(ms: number): number {
  return flags.enabled ? Math.min(ms, 1) : ms;
}
