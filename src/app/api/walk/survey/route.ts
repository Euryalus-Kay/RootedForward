import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { loadWalkBundles } from "@/lib/tours/store";
import { WALK_SURVEY, cleanSurveyAnswers, type WalkSurveyPhase } from "@/lib/walk-survey";

/* ------------------------------------------------------------------ */
/*  POST /api/walk/survey                                              */
/*                                                                     */
/*  Where the app sends one card of the walk survey, the one before a */
/*  walk or the one after it (src/lib/walk-survey.ts). The phone keeps */
/*  what it could not send and tries again on the next launch, so this */
/*  has to be safe to call twice with the same card and cheap to fail. */
/*                                                                     */
/*  Nothing stored here identifies a person. No IP address, no user   */
/*  agent, no device identifier. The respondent is a random code the  */
/*  phone makes for one walk, and it exists only so the answers from  */
/*  the start and the end of that walk can be paired. The row carries */
/*  the answers, the walk, the app version and the time answered.     */
/*                                                                     */
/*  How the phone reads the answer:                                    */
/*    200 stored          done, forget the card                        */
/*    200 migrationPending keep it, the table is not there yet         */
/*    400                 drop it, it can never be accepted            */
/*    429 or 5xx          keep it and try later                        */
/*                                                                     */
/*  The endpoint is open, because an app cannot keep a secret. What    */
/*  protects the data is strict validation against the survey's own    */
/*  questions, one row per respondent and card, and a rate limit.      */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

const RESPONDENT_RE = /^[A-Za-z0-9]{16,40}$/;
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
/** "2.4 (33)", the marketing version and the build */
const APP_RE = /^[0-9]{1,3}(\.[0-9]{1,3}){0,2}( \([0-9]{1,6}\))?$/;
const PLATFORMS = new Set(["ios"]);

/* A phone sends a card once, and again only if the answer was lost.
   Ten in a minute from one respondent is not a phone. In-memory, so
   per serverless instance and best effort, the same bargain the
   kiosk endpoint makes. */
const seen = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (seen.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  seen.set(key, hits);
  if (seen.size > 2000) {
    for (const [k, times] of seen.entries()) {
      if (!times.some((t) => now - t < WINDOW_MS)) seen.delete(k);
    }
  }
  return hits.length > MAX_PER_WINDOW;
}

/** migration 012 not applied yet */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (msg.includes("walk_survey_responses") &&
      (msg.includes("does not exist") || msg.includes("schema cache")))
  );
}

/** A plausible time for a card answered on a phone. A phone that was
 *  offline for weeks sends late, and clocks drift a little. */
function cleanTime(value: unknown, now: number): string | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  if (ms < now - 365 * 24 * 60 * 60 * 1000) return null;
  if (ms > now + 5 * 60 * 1000) return null;
  return new Date(ms).toISOString();
}

function refuse(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse("bad json");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return refuse("bad body");
  }
  const card = body as Record<string, unknown>;

  // Answers to an older survey are refused rather than stored against
  // questions they were not given.
  if (card.survey !== WALK_SURVEY.id) return refuse("unknown survey");

  const phase = card.phase;
  if (phase !== "pre" && phase !== "post") return refuse("bad phase");

  const respondent = typeof card.respondent === "string" ? card.respondent : "";
  if (!RESPONDENT_RE.test(respondent)) return refuse("bad respondent");

  const tour = typeof card.tour === "string" ? card.tour : "";
  if (!SLUG_RE.test(tour)) return refuse("bad tour");

  const answers = cleanSurveyAnswers(phase as WalkSurveyPhase, card.answers);
  if (!answers) return refuse("bad answers");

  const platform =
    typeof card.platform === "string" && PLATFORMS.has(card.platform) ? card.platform : null;
  if (!platform) return refuse("bad platform");

  if (isRateLimited(respondent)) {
    return NextResponse.json({ ok: false, error: "slow down" }, { status: 429 });
  }

  // A walk the site has never had is not one a phone can have walked.
  // loadWalkBundles never throws and falls back to the compiled walks.
  const walks = await loadWalkBundles();
  if (!walks.some((w) => w.slug === tour)) return refuse("unknown tour");

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  }

  const now = Date.now();
  const row = {
    survey: WALK_SURVEY.id,
    tour,
    phase,
    respondent,
    answers,
    answered_at: cleanTime(card.answeredAt, now) ?? new Date(now).toISOString(),
    app_version:
      typeof card.app === "string" && APP_RE.test(card.app) ? card.app : null,
    platform,
  };

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // One row per respondent and card. A card sent twice, because the
  // phone never heard the first answer, lands once.
  const { error } = await supabase
    .from("walk_survey_responses")
    .upsert(row, { onConflict: "respondent,phase", ignoreDuplicates: true });

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json(
        { ok: true, stored: false, migrationPending: true },
        { status: 200 }
      );
    }
    console.error("[walk/survey] insert failed", error.message);
    return NextResponse.json({ ok: false, error: "write failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true }, { status: 200 });
}
