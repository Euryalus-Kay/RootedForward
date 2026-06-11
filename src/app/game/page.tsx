import { notFound } from "next/navigation";

/* The game is hidden from the site. The code under src/components/game
   and src/lib/game stays in place so it can be restored later, but the
   route serves a 404 and nothing on the site links here. Rendered
   dynamically so the response carries a real 404 status. */

export const dynamic = "force-dynamic";

export default function GamePage() {
  notFound();
}
