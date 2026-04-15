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

  console.log(`[ADMIN NOTIFICATION] ${subject}`);

  if (!process.env.RESEND_API_KEY) {
    console.log("No RESEND_API_KEY, skipping email");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Rooted Forward <notifications@rooted-forward.org>",
        to: ADMIN_EMAIL,
        subject: `[Rooted Forward] ${subject}`,
        text: fullBody,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
    }
  } catch (err) {
    console.error("Failed to send notification:", err);
  }
}
