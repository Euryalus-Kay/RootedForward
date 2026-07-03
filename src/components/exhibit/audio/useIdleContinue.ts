"use client";
/* ------------------------------------------------------------------ */
/*  Museum idle-continue timer. While a pause point is open the tour   */
/*  waits, then walks on by itself, the way a gallery audio guide      */
/*  does. Any pointer, key, or touch inside the scope (or document)    */
/*  resets the window; subscribers get the remaining seconds through   */
/*  a callback so the countdown ring never causes a React render.      */
/* ------------------------------------------------------------------ */
import { useEffect, useMemo, useRef, type RefObject } from "react";

export interface IdleContinueHandle {
  /** subscribe to countdown updates; called immediately and roughly 5x per second */
  subscribe(cb: (secondsRemaining: number) => void): () => void;
  /** restart the countdown window (a meaningful in-station action happened) */
  reset(): void;
  getRemaining(): number;
}

const TICK_MS = 200;

export function useIdleContinue(
  activeWhen: boolean,
  seconds: number = 20,
  onFire?: () => void,
  scopeRef?: RefObject<HTMLElement | null>
): IdleContinueHandle {
  const subsRef = useRef<Set<(s: number) => void>>(new Set());
  const deadlineRef = useRef(0);
  const remainingRef = useRef(seconds);
  const firedRef = useRef(false);
  const activeRef = useRef(activeWhen);
  const secondsRef = useRef(seconds);
  const onFireRef = useRef(onFire);

  /* keep the latest props readable from timer and event callbacks */
  useEffect(() => {
    activeRef.current = activeWhen;
    secondsRef.current = seconds;
    onFireRef.current = onFire;
  }, [activeWhen, seconds, onFire]);

  const handle = useMemo<IdleContinueHandle>(() => {
    const notify = () => {
      for (const cb of subsRef.current) cb(remainingRef.current);
    };
    return {
      subscribe(cb) {
        subsRef.current.add(cb);
        cb(remainingRef.current);
        return () => {
          subsRef.current.delete(cb);
        };
      },
      reset() {
        if (!activeRef.current || firedRef.current) return;
        deadlineRef.current = performance.now() + secondsRef.current * 1000;
        remainingRef.current = secondsRef.current;
        notify();
      },
      getRemaining() {
        return remainingRef.current;
      },
    };
  }, []);

  useEffect(() => {
    if (!activeWhen) return;

    firedRef.current = false;
    deadlineRef.current = performance.now() + seconds * 1000;
    remainingRef.current = seconds;
    for (const cb of subsRef.current) cb(remainingRef.current);

    const target: EventTarget = scopeRef?.current ?? document;
    const onActivity = () => handle.reset();
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    for (const ev of events) {
      target.addEventListener(ev, onActivity, { capture: true, passive: true });
    }

    const interval = window.setInterval(() => {
      if (firedRef.current) return;
      const remaining = Math.max(0, (deadlineRef.current - performance.now()) / 1000);
      remainingRef.current = remaining;
      for (const cb of subsRef.current) cb(remaining);
      if (remaining <= 0) {
        firedRef.current = true;
        window.clearInterval(interval);
        onFireRef.current?.();
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(interval);
      for (const ev of events) {
        target.removeEventListener(ev, onActivity, { capture: true } as EventListenerOptions);
      }
    };
  }, [activeWhen, seconds, scopeRef, handle]);

  return handle;
}
