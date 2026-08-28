/* /go/[slug] — one printed code per slug. See src/lib/qr-links.ts for
   the table of where each one points and how to re-point it. */

import type { NextRequest } from "next/server";
import { qrRedirect } from "@/lib/qr-redirect";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return qrRedirect(slug, request.headers.get("user-agent") ?? "");
}
