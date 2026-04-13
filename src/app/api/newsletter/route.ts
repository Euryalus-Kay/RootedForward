import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NewsletterPayload {
  email: string;
}

/* ------------------------------------------------------------------ */
/*  In-memory rate limiting store                                      */
/*  TODO: Replace with Redis or Supabase-backed rate limiting for      */
/*  production. This in-memory store resets on server restart.          */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim();
  const lastSubmission = rateLimitMap.get(normalizedEmail);
  if (!lastSubmission) return false;
  return Date.now() - lastSubmission < RATE_LIMIT_MS;
}

function recordSubmission(email: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  rateLimitMap.set(normalizedEmail, Date.now());

  // Periodic cleanup: remove entries older than the rate limit window
  if (rateLimitMap.size > 1000) {
    const now = Date.now();
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > RATE_LIMIT_MS) {
        rateLimitMap.delete(key);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Email validation                                                   */
/* ------------------------------------------------------------------ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: NewsletterPayload;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limiting
    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { error: "You have already subscribed recently. Please try again later." },
        { status: 429 }
      );
    }

    // TODO: Integrate with real email service (Mailchimp, ConvertKit, etc.)
    // or save to a Supabase newsletter_subscribers table.
    //
    // Example Supabase integration:
    // const supabase = await createClient();
    // const { error } = await supabase
    //   .from("newsletter_subscribers")
    //   .upsert({ email: normalizedEmail, subscribed_at: new Date().toISOString() });
    // if (error) throw error;

    // For now: record the submission for rate limiting and return success
    recordSubmission(normalizedEmail);

    return NextResponse.json(
      {
        message: "Thank you for subscribing! You will receive our latest updates.",
        email: normalizedEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
