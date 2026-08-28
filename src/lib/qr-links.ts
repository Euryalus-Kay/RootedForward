/* ------------------------------------------------------------------ */
/*  Printed QR codes, and where each one currently points.             */
/*                                                                     */
/*  THIS IS THE ONLY FILE TO EDIT WHEN A PRINTED QR CODE NEEDS TO GO   */
/*  SOMEWHERE ELSE. The code itself never changes. It encodes a URL    */
/*  on our own domain, and the table below decides what that URL       */
/*  resolves to today.                                                 */
/*                                                                     */
/*    https://rooted-forward.org/go/banner   ->  whatever is in QR_LINKS */
/*                                                                     */
/*  So a banner printed once can be re-pointed at a new tour, a new    */
/*  petition, or a donation page years later, without reprinting it.   */
/*                                                                     */
/*  Two ways to re-point a code, in order of how fast they take        */
/*  effect:                                                            */
/*                                                                     */
/*    1. Set an environment variable in Vercel and redeploy. No code   */
/*       change at all. The name is QR_TARGET_ plus the slug in caps,  */
/*       with dashes as underscores, so the banner is                  */
/*       QR_TARGET_BANNER=https://example.org/somewhere-new            */
/*                                                                     */
/*    2. Edit the `to` line below and push.                            */
/*                                                                     */
/*  The redirect is deliberately temporary (307) and uncacheable. A    */
/*  permanent redirect would be cached on people's phones forever and  */
/*  would defeat the whole point of the system.                        */
/* ------------------------------------------------------------------ */

import { APP_STORE_URL } from "@/lib/app-store";

export const SITE = "https://rooted-forward.org";

/** Where non-iPhone scanners land. The App Store link is useless on an
 *  Android phone or a laptop, and a dead end at a market table is worse
 *  than a slower path, so those scans get the page that explains the
 *  tours and links the in-browser version. */
const TOURS = `${SITE}/tours`;

export type QrLink = {
  /** Where an iPhone goes. */
  to: string;
  /** Where everything else goes. Defaults to `to` when left off. */
  otherwise?: string;
  /** What this code is printed on, so nobody re-points the wrong one. */
  printedOn: string;
};

export const QR_LINKS: Record<string, QrLink> = {
  /* The 6ft by 2ft outreach banner. Built by print/build-banner.mjs. */
  banner: {
    to: APP_STORE_URL ?? TOURS,
    otherwise: TOURS,
    printedOn: "6ft x 2ft vinyl outreach banner, first printed August 2026",
  },
};

/** `/go` with no slug behaves like the banner code. */
export const DEFAULT_QR_SLUG = "banner";

/** Scans of a slug we do not recognise, which means a typo or a code we
 *  have since removed. Send them somewhere real rather than a 404. */
export const QR_FALLBACK = TOURS;

/** Read the Vercel override for a slug, if one is set. */
function envOverride(slug: string): string | undefined {
  const key = `QR_TARGET_${slug.toUpperCase().replace(/-/g, "_")}`;
  const value = process.env[key];
  return value && value.trim() ? value.trim() : undefined;
}

/**
 * Resolve a printed code to the URL it should open right now.
 *
 * @param slug  the path segment after /go
 * @param isIos whether the scan came from an iPhone or iPad
 */
export function resolveQrLink(slug: string, isIos: boolean): string {
  const override = envOverride(slug);
  if (override) return override;

  const link = QR_LINKS[slug];
  if (!link) return QR_FALLBACK;

  if (isIos) return link.to;
  return link.otherwise ?? link.to;
}

/** The URL that actually gets printed into a QR code for a slug. */
export function qrUrlFor(slug: string): string {
  return `${SITE}/go/${slug}`;
}
