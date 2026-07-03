/* ------------------------------------------------------------------ */
/*  Non-React playhead bus. NarrationController publishes ms-into-     */
/*  block on a rAF loop; the Timeline Spine fill and CaptionBar        */
/*  subscribe and write straight to DOM refs, so continuous time       */
/*  never causes a React render.                                       */
/* ------------------------------------------------------------------ */

export interface PlayheadSnapshot {
  blockId: string | null;
  msIntoBlock: number;
  blockDurationMs: number;
}

export type PlayheadListener = (snap: PlayheadSnapshot) => void;

export interface PlayheadBus {
  publish(snap: PlayheadSnapshot): void;
  subscribe(cb: PlayheadListener): () => void;
  getSnapshot(): PlayheadSnapshot;
}

export function createPlayheadBus(): PlayheadBus {
  const subs = new Set<PlayheadListener>();
  let last: PlayheadSnapshot = { blockId: null, msIntoBlock: 0, blockDurationMs: 0 };
  return {
    publish(snap) {
      last = snap;
      for (const cb of subs) cb(snap);
    },
    subscribe(cb) {
      subs.add(cb);
      cb(last);
      return () => subs.delete(cb);
    },
    getSnapshot: () => last,
  };
}
