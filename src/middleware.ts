import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/* `go(?:/|$)` keeps scanned QR codes out of the Supabase session
   refresh. A redirect that has to wait on auth.getUser() first is a
   person standing at a market table watching a spinner. */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|go(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
