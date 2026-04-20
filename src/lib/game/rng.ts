/**
 * Seedable pseudo-random number generator (mulberry32).
 *
 * Each playthrough has a seed. Same seed = same starting conditions, same
 * event order, same shuffles. This makes runs reproducible (a teacher can
 * give a class the same seed) and lets us deterministically generate the
 * starting parcel layout.
 */

export class RNG {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === "string" ? hashString(seed) : seed >>> 0;
    if (this.state === 0) this.state = 1;
  }

  /** Next float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] */
  intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Pick one item uniformly */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Weighted pick. items must have a `weight` property. */
  pickWeighted<T extends { weight?: number }>(arr: readonly T[]): T | null {
    if (arr.length === 0) return null;
    const totalWeight = arr.reduce((sum, item) => sum + (item.weight ?? 1), 0);
    let target = this.next() * totalWeight;
    for (const item of arr) {
      target -= item.weight ?? 1;
      if (target <= 0) return item;
    }
    return arr[arr.length - 1];
  }

  /** Fisher-Yates shuffle (returns a new array) */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Pick N distinct items from arr */
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n);
  }

  /** Returns true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Deterministic hash from a string seed */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Generate a friendly random seed for a new game */
export function generateSeed(): string {
  const adjectives = [
    "lake", "river", "iron", "brick", "wind", "elm", "maple",
    "rust", "ember", "amber", "slate", "moss", "cedar",
    "willow", "stone", "linen", "ivory", "ash", "ruby",
    "amber", "jade", "garnet", "copper", "bronze", "silver",
    "northbound", "southbound", "eastward", "westward",
  ];
  const nouns = [
    "boulevard", "crossing", "block", "alley", "porch", "bridge",
    "viaduct", "platform", "junction", "mural", "garden", "library",
    "schoolyard", "courtyard", "marquee", "bakery", "bookshop",
    "clocktower", "promenade", "trolley", "elevated", "boulevard",
  ];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const b = nouns[Math.floor(Math.random() * nouns.length)];
  const n = Math.floor(Math.random() * 99) + 1;
  return `${a}-${b}-${n}`;
}
