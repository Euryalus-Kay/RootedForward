/* ------------------------------------------------------------------ */
/*  notify.ts                                                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  Admin email notifications via Resend. Functions here are          */
/*  best effort: if RESEND_API_KEY is not configured, they log and    */
/*  return {ok: false} rather than throwing. Callers should treat    */
/*  a false return as a soft failure and continue.                     */
/*                                                                     */
/* ------------------------------------------------------------------ */

const ADMIN_EMAIL = "contact@rooted-forward.org";
const FROM_ADDRESS = "Rooted Forward <notifications@rooted-forward.org>";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rooted-forward.org";

export interface NotificationPayload {
  subject: string;
  body: string;
  /** Optional link shown at the bottom of the email, relative to the site URL. */
  link?: string;
  /**
   * When a form submission comes from a user, set replyTo so the admin
   * can reply directly to the user from their inbox.
   */
  replyTo?: string;
  /** Optional explicit recipient override. Defaults to ADMIN_EMAIL. */
  to?: string;
}

export interface NotificationResult {
  ok: boolean;
  /** Error detail for logs. Never surfaced to end users. */
  error?: string;
}

/**
 * Send an admin notification email via Resend.
 *
 * Returns {ok:true} on HTTP 200 from Resend, {ok:false} otherwise.
 * Never throws. Callers can log the error but should not fail the
 * request if the email can't be sent.
 */
export async function notifyAdmin({
  subject,
  body,
  link,
  replyTo,
  to,
}: NotificationPayload): Promise<NotificationResult> {
  const fullBody = link
    ? `${body}\n\nView in admin dashboard: ${SITE_URL}${link}`
    : body;

  // Always log the notification to server logs so there's a record even
  // when the email provider isn't configured.
  console.log(`[ADMIN NOTIFICATION] ${subject}\n${fullBody}`);

  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY not configured. Set the env var to enable email notifications.",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      from: FROM_ADDRESS,
      to: to ?? ADMIN_EMAIL,
      subject: `[Rooted Forward] ${subject}`,
      text: fullBody,
    };
    if (replyTo) payload.reply_to = replyTo;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Resend error:", res.status, text);
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to send notification:", message);
    return { ok: false, error: message };
  }
}

/**
 * True when at least one of the admin notification channels is
 * configured (Resend in this version). Used by form routes to decide
 * whether to surface a "sent" message to the user when the database is
 * unavailable.
 */
export function notificationsConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
