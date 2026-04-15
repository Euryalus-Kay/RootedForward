/**
 * Send admin notification email via Supabase Edge Function or fallback.
 *
 * For now, this logs to the submissions table with a notification flag.
 * When you connect a mail service (Resend, SendGrid, etc.), replace
 * the body of this function with an API call.
 *
 * To set up real email notifications later:
 * 1. Sign up at https://resend.com (free tier: 3000 emails/month)
 * 2. Add RESEND_API_KEY to your .env.local and Vercel env vars
 * 3. Uncomment the fetch call below and remove the console.log
 */

const ADMIN_EMAIL = "contact@rooted-forward.org";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rooted-forward.vercel.app";

interface NotificationPayload {
  subject: string;
  body: string;
  link?: string;
}

export async function notifyAdmin({ subject, body, link }: NotificationPayload) {
  const fullBody = link
    ? `${body}\n\nView in admin dashboard: ${SITE_URL}${link}`
    : body;

  // Log notification (always works)
  console.log(`[ADMIN NOTIFICATION] To: ${ADMIN_EMAIL}\nSubject: ${subject}\n${fullBody}`);

  // Uncomment when you add Resend API key:
  // try {
  //   await fetch("https://api.resend.com/emails", {
  //     method: "POST",
  //     headers: {
  //       "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       from: "Rooted Forward <notifications@rooted-forward.org>",
  //       to: ADMIN_EMAIL,
  //       subject: `[Rooted Forward] ${subject}`,
  //       text: fullBody,
  //     }),
  //   });
  // } catch (err) {
  //   console.error("Failed to send notification email:", err);
  // }
}
