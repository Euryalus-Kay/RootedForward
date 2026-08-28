/* /go — the bare printed code. Behaves like the banner. */

import type { NextRequest } from "next/server";
import { qrRedirect } from "@/lib/qr-redirect";
import { DEFAULT_QR_SLUG } from "@/lib/qr-links";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return qrRedirect(DEFAULT_QR_SLUG, request.headers.get("user-agent") ?? "");
}
