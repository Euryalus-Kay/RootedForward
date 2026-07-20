// ------------------------------------------------------------------
// Tiny client-side registry connecting the per-stop audio elements to
// the mobile mini-player. Each AudioPlayer registers its element by
// stop id; the mini-player toggles and mirrors playback state through
// the subscribe callback. No context providers, no re-render storms.
// ------------------------------------------------------------------

type StateListener = (id: string, playing: boolean) => void;

const registry = new Map<string, HTMLAudioElement>();
const listeners = new Set<StateListener>();

export function registerAudio(id: string, el: HTMLAudioElement) {
  registry.set(id, el);
}

export function unregisterAudio(id: string) {
  registry.delete(id);
}

export function isAudioPlaying(id: string): boolean {
  const el = registry.get(id);
  return !!el && !el.paused;
}

/** live playback numbers for a stop's audio, if mounted */
export function getAudioState(
  id: string
): { playing: boolean; currentTime: number; duration: number } | null {
  const el = registry.get(id);
  if (!el) return null;
  return {
    playing: !el.paused,
    currentTime: el.currentTime,
    duration: Number.isFinite(el.duration) ? el.duration : 0,
  };
}

/** play/pause the audio for a stop; returns false if not mounted */
export function toggleAudio(id: string): boolean {
  const el = registry.get(id);
  if (!el) return false;
  if (el.paused) void el.play();
  else el.pause();
  return true;
}

export function emitAudioState(id: string, playing: boolean) {
  listeners.forEach((cb) => cb(id, playing));
}

export function subscribeAudioState(cb: StateListener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
