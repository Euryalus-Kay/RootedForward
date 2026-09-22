import type { Metadata } from "next";
import Link from "next/link";
import Playback from "@/components/kiosk/Playback";
import {
  getKioskDay,
  getKioskDays,
  isValidDay,
  shiftDay,
  todayInChicago,
} from "@/lib/kiosk-analytics";

/* ------------------------------------------------------------------ */
/*  /kiosk/data/playback?day=YYYY-MM-DD                                */
/*                                                                     */
/*  One day of the museum screen, played back. Unlisted like the rest  */
/*  of /kiosk, and held out of search by the X-Robots-Tag header in     */
/*  vercel.json. Days are Chicago calendar days.                        */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kiosk playback",
  robots: { index: false, follow: false },
};

function niceDay(day: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${day}T12:00:00Z`));
}

export default async function KioskPlaybackPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const params = await searchParams;
  const today = todayInChicago();
  const day = params.day && isValidDay(params.day) ? params.day : today;

  const [data, days] = await Promise.all([getKioskDay(day), getKioskDays()]);

  const prev = shiftDay(day, -1);
  const next = shiftDay(day, 1);
  const canGoForward = day < today;

  return (
    <main className="min-h-screen bg-cream px-6 py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/kiosk/data"
              className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-rust hover:underline"
            >
              &larr; Kiosk data
            </Link>
            <h1 className="mt-2 font-display text-4xl text-forest">Playback</h1>
            <p className="mt-2 max-w-[60ch] font-body text-sm leading-relaxed text-ink/60">
              The museum screen, played back from what it recorded. Every screen
              change and every tap, at the moment it happened.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/kiosk/data/playback?day=${prev}`}
              className="rounded-sm border border-border bg-cream px-3 py-2 font-body text-sm text-ink/70 hover:bg-cream-dark"
            >
              &larr;
            </Link>
            <form action="/kiosk/data/playback" className="contents">
              <input
                type="date"
                name="day"
                defaultValue={day}
                max={today}
                className="rounded-sm border border-border bg-cream px-3 py-2 font-body text-sm text-ink"
              />
              <button
                type="submit"
                className="rounded-sm border border-border bg-cream px-3 py-2 font-body text-sm text-ink/70 hover:bg-cream-dark"
              >
                Go
              </button>
            </form>
            {canGoForward ? (
              <Link
                href={`/kiosk/data/playback?day=${next}`}
                className="rounded-sm border border-border bg-cream px-3 py-2 font-body text-sm text-ink/70 hover:bg-cream-dark"
              >
                &rarr;
              </Link>
            ) : (
              <span className="rounded-sm border border-border bg-cream px-3 py-2 font-body text-sm text-ink/25">
                &rarr;
              </span>
            )}
          </div>
        </div>

        <h2 className="mt-8 font-display text-2xl text-forest">{niceDay(day)}</h2>

        {data.migrationPending ? (
          <p className="mt-4 max-w-[70ch] font-body text-base leading-relaxed text-ink/75">
            Nothing to play back yet, because the tables the screen writes to do
            not exist. Run{" "}
            <code className="rounded-sm bg-cream-dark px-1.5 py-0.5 text-sm">
              supabase/migrations/011_kiosk_analytics.sql
            </code>{" "}
            in the Supabase SQL editor. The screen is holding what it has
            recorded in the meantime and will send it once the tables are there.
          </p>
        ) : data.error ? (
          <p className="mt-4 font-body text-base text-ink/75">Could not read the recording. {data.error}</p>
        ) : (
          <>
            {data.truncated ? (
              <p className="mt-3 font-body text-sm text-rust">
                This day has more events than the replay loads at once, so it
                stops partway through.
              </p>
            ) : null}
            <Playback
              key={day}
              dayStart={data.start}
              dayEnd={data.end}
              events={data.events}
              sessions={data.sessions}
            />
          </>
        )}

        {days.length ? (
          <div className="mt-12">
            <h3 className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">
              Days with something on them
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {days.slice(0, 40).map((d) => (
                <Link
                  key={d.day}
                  href={`/kiosk/data/playback?day=${d.day}`}
                  className={`rounded-sm border px-3 py-1.5 font-body text-sm ${
                    d.day === day
                      ? "border-forest bg-forest text-cream"
                      : "border-border bg-cream text-ink/70 hover:bg-cream-dark"
                  }`}
                >
                  {d.day.slice(5)}{" "}
                  <span className={d.day === day ? "text-cream/70" : "text-ink/40"}>
                    {d.sessions}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
