/* ------------------------------------------------------------------ */
/*  The response a scanned QR code gets.                               */
/*                                                                     */
/*  Shared by /go and /go/[slug]. Kept out of the route files so the   */
/*  caching rules are written down once, since getting them wrong is   */
/*  the one mistake that cannot be undone after the banner is printed. */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { resolveQrLink } from "@/lib/qr-links";

/** Apple's own user-agent tokens. iPadOS reports as Macintosh with a
 *  touch screen, but a Mac cannot open the App Store app either way,
 *  so the simple test is the right one here. */
function isIosUserAgent(ua: string): boolean {
  return /iPhone|iPad|iPod/i.test(ua);
}

export function qrRedirect(slug: string, userAgent: string) {
  const target = resolveQrLink(slug, isIosUserAgent(userAgent));

  /* 307, never 308. A permanent redirect is cached by the phone and by
     every proxy in between, so re-pointing this code later would not
     reach anyone who had already scanned it. no-store says the same
     thing to anything that ignores the status code. */
  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}
