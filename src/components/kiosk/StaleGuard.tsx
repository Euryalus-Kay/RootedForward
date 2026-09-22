"use client";

import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  StaleGuard                                                         */
/*                                                                     */
/*  The kiosk's service worker is scoped to /kiosk/, and an earlier     */
/*  version of it cached the dashboard pages cache-first. A browser     */
/*  that opened the dashboard while that worker was in charge can keep  */
/*  getting that first copy back, whatever the server says now, until   */
/*  the fixed worker has finished installing. This page knows when the  */
/*  server rendered it, so it can tell. A copy that is minutes old on   */
/*  arrival did not come from the server. In that one case it drops     */
/*  the worker and loads once more, straight from the network.          */
/*                                                                     */
/*  Guarded twice. It never fires on a page the server just rendered,   */
/*  and it fires at most once per tab, so a clock that is badly wrong   */
/*  costs one extra load and nothing loops.                             */
/* ------------------------------------------------------------------ */

const STALE_AFTER_MS = 5 * 60 * 1000;

export default function StaleGuard({ renderedAt }: { renderedAt: number }) {
  useEffect(() => {
    if (Date.now() - renderedAt < STALE_AFTER_MS) return;
    if (!("serviceWorker" in navigator)) return;
    let already = false;
    try {
      already = sessionStorage.getItem("rf-stale-fix") === "1";
      sessionStorage.setItem("rf-stale-fix", "1");
    } catch {}
    if (already) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {})
      .then(() => location.reload());
  }, [renderedAt]);
  return null;
}
