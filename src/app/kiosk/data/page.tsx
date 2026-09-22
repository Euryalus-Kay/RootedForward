import type { Metadata } from "next";
import { getKioskStats, HEARTBEAT_MS } from "@/lib/kiosk-analytics";

/* ------------------------------------------------------------------ */
/*  /kiosk/data                                                        */
/*                                                                     */
/*  Usage figures for the museum map kiosk. Unlisted, like the kiosk    */
/*  itself. Disallowed in robots.txt and served with an X-Robots-Tag    */
/*  noindex header from vercel.json, so it stays out of search even     */
/*  though anyone holding the link can read it. There is nothing        */
/*  private on it, since the underlying rows describe a screen rather   */
/*  than any person.                                                    */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kiosk data",
  robots: { index: false, follow: false },
};

/* ---------------------------------- formatting ---------------------------------- */

function ms(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "–";
  const total = Math.round(value / 1000);
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m < 60) return s ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function longMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "–";
  const mins = Math.round(value / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ${h % 24}h`;
  return `${h}h ${mins % 60}m`;
}

function pct(value: number | null, places = 1): string {
  if (value === null || !Number.isFinite(value)) return "–";
  return `${value.toFixed(places)}%`;
}

function ago(value: number | null): string {
  if (value === null) return "never";
  const mins = Math.round(value / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function clock(iso: string | null): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function hourLabel(h: number): string {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

/* ---------------------------------- pieces ---------------------------------- */

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-cream p-5">
      <div className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl leading-none text-forest">{value}</div>
      {note ? (
        <div className="mt-1.5 font-body text-xs leading-snug text-ink/55">{note}</div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-forest">{title}</h2>
      {sub ? (
        <p className="mt-1 max-w-[70ch] font-body text-sm leading-relaxed text-ink/60">
          {sub}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bars({
  rows,
  max,
}: {
  rows: { label: string; count: number; hint?: string }[];
  max?: number;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <div className="w-44 shrink-0 truncate font-body text-sm text-ink/75" title={r.label}>
            {r.label}
          </div>
          <div className="h-5 flex-1 overflow-hidden rounded-sm bg-cream-dark">
            <div
              className="h-full bg-rust"
              style={{ width: `${Math.max(r.count > 0 ? 2 : 0, (r.count / top) * 100)}%` }}
            />
          </div>
          <div className="w-16 shrink-0 text-right font-body text-sm tabular-nums text-ink/70">
            {r.hint ?? r.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function Columns({
  rows,
}: {
  // The key is separate from the label on purpose. Thirty days labelled by
  // day of month repeat as soon as the window crosses a short February, and
  // React quietly drops or duplicates a bar when two keys match.
  rows: { key: string; label: string; count: number }[];
}) {
  const top = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex items-end gap-[3px] overflow-x-auto pb-1">
      {rows.map((r) => (
        <div key={r.key} className="flex min-w-[18px] flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-forest"
            style={{ height: `${Math.max(r.count > 0 ? 3 : 1, (r.count / top) * 110)}px` }}
            title={`${r.label}, ${r.count}`}
          />
          <div className="font-body text-[10px] leading-none text-ink/45">{r.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default async function KioskDataPage() {
  const stats = await getKioskStats();

  if (stats.migrationPending || !stats.available) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl text-forest">Kiosk data</h1>
          {stats.migrationPending ? (
            <>
              <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
                The kiosk is collecting nothing yet, because the two tables it
                writes to do not exist. The screen is not losing anything in the
                meantime. It queues its events in its own storage and will send
                them once the tables are there.
              </p>
              <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
                Open the Supabase SQL editor and run the contents of{" "}
                <code className="rounded-sm bg-cream-dark px-1.5 py-0.5 text-sm">
                  supabase/migrations/011_kiosk_analytics.sql
                </code>
                . Then reload this page.
              </p>
            </>
          ) : (
            <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
              Could not read the usage tables. {stats.error}
            </p>
          )}
        </div>
      </main>
    );
  }

  const s = stats;
  const beatMinutes = Math.round(HEARTBEAT_MS / 60000);

  return (
    <main className="min-h-screen bg-cream px-6 py-14">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-forest">Kiosk data</h1>
            <p className="mt-2 max-w-[60ch] font-body text-sm leading-relaxed text-ink/60">
              The museum map screen. A session is one visitor&rsquo;s turn, measured
              from the first touch until the exhibit returns to its attract
              screen. Times are Chicago time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/kiosk/data/playback"
              className="rounded-sm bg-rust px-5 py-2.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark"
            >
              Play back a day
            </a>
            <div className="flex items-center gap-2.5 rounded-sm border border-border bg-cream px-4 py-2.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  s.status.online ? "bg-forest" : "bg-rust"
                }`}
              />
              <span className="font-body text-sm font-semibold text-ink">
                {s.status.online ? "Online" : "Not reporting"}
              </span>
              <span className="font-body text-sm text-ink/55">
                {ago(s.status.lastSeenAgoMs)}
              </span>
            </div>
          </div>
        </div>

        {/* headline numbers */}
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Sessions today"
            value={String(s.sessions.today)}
            note={`${s.sessions.week} in the last 7 days`}
          />
          <Stat
            label="Average session"
            value={ms(s.duration.meanMs)}
            note={`median ${ms(s.duration.medianMs)}`}
          />
          <Stat
            label="Uptime, 7 days"
            value={pct(s.uptime.week)}
            note={`${pct(s.uptime.month)} over 30 days`}
          />
          <Stat
            label="Sessions all time"
            value={String(s.sessions.total)}
            note={`${s.sessions.month} in the last 30 days`}
          />
        </div>

        {/* sessions over time */}
        <Section
          title="Sessions a day"
          sub="The last thirty days. A day with no bar is a day nobody used it, or a day it was not running."
        >
          <Columns
            rows={s.sessions.perDay.map((d) => ({
              key: d.day,
              label: d.day.slice(8),
              count: d.count,
            }))}
          />
        </Section>

        {/* time per session */}
        <Section
          title="How long people stay"
          sub="Sessions shorter than a second are dropped as stray touches, and anything over two hours is treated as a stuck screen rather than a visitor."
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Mean" value={ms(s.duration.meanMs)} />
            <Stat label="Median" value={ms(s.duration.medianMs)} />
            <Stat label="90th percentile" value={ms(s.duration.p90Ms)} />
            <Stat label="Longest" value={ms(s.duration.longestMs)} />
          </div>
          <div className="mt-6">
            <Bars rows={s.duration.buckets} />
          </div>
        </Section>

        {/* depth */}
        <Section
          title="What people open"
          sub="Which of the twelve map details visitors actually tap, counted across the last thirty days."
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat
              label="Details per session"
              value={
                s.depth.meanDetails === null ? "–" : s.depth.meanDetails.toFixed(1)
              }
            />
            <Stat
              label="Opened at least one"
              value={pct(s.depth.openedSomething, 0)}
              note="the rest looked and walked away"
            />
            <Stat
              label="Ended by the timer"
              value={String(
                s.sessions.endReasons.find((r) => r.reason === "idle")?.count ?? 0
              )}
              note="rather than by someone starting over"
            />
          </div>
          <div className="mt-6">
            {s.depth.details.length ? (
              <Bars rows={s.depth.details} />
            ) : (
              <p className="font-body text-sm text-ink/55">
                No details opened yet.
              </p>
            )}
          </div>
        </Section>

        {/* when */}
        <Section
          title="When people visit"
          sub="Sessions by hour of the day, Chicago time, over the last thirty days."
        >
          <Columns
            rows={s.sessions.byHour.map((h) => ({
              key: String(h.hour),
              label: hourLabel(h.hour),
              count: h.count,
            }))}
          />
        </Section>

        {/* uptime */}
        <Section
          title="Uptime"
          sub={`The screen reports in every ${beatMinutes} minutes. Uptime is the share of those check-ins that arrived, counted from when it first reported rather than from the start of the window.`}
        >
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Last 24 hours" value={pct(s.uptime.day)} />
            <Stat label="Last 7 days" value={pct(s.uptime.week)} />
            <Stat label="Last 30 days" value={pct(s.uptime.month)} />
          </div>

          <div className="mt-6 rounded-sm border border-border bg-cream p-5">
            <div className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
              Gaps in the last 7 days
            </div>
            {s.uptime.outages.length ? (
              <ul className="mt-3 space-y-2">
                {s.uptime.outages.map((o) => (
                  <li key={o.from} className="font-body text-sm text-ink/75">
                    <span className="font-semibold text-rust">{longMs(o.ms)}</span>{" "}
                    from {clock(o.from)} to {clock(o.to)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 font-body text-sm text-ink/60">
                No gaps longer than {Math.round((HEARTBEAT_MS * 2.5) / 60000)}{" "}
                minutes. The screen has not missed a check-in.
              </p>
            )}
          </div>
        </Section>

        {/* reliability */}
        <Section
          title="The machine itself"
          sub="Counted over the last thirty days. A boot is the page starting up, which happens on a restart or after an update is applied."
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Page starts" value={String(s.reliability.boots)} />
            <Stat label="Updates taken" value={String(s.reliability.updates)} />
            <Stat
              label="Running build"
              value={s.status.build ?? "–"}
              note={`open ${longMs(s.status.pageUptimeMs)}`}
            />
            <Stat
              label="Screens reporting"
              value={String(s.status.devices.length)}
              note={s.status.devices.join(", ") || undefined}
            />
          </div>

          {s.reliability.recentUpdates.length ? (
            <div className="mt-6 rounded-sm border border-border bg-cream p-5">
              <div className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
                Recent updates
              </div>
              <ul className="mt-3 space-y-1.5">
                {s.reliability.recentUpdates.map((u) => (
                  <li key={u.at} className="font-body text-sm text-ink/75">
                    {clock(u.at)}, {u.from ?? "unknown"} to{" "}
                    <span className="font-semibold text-forest">{u.to ?? "unknown"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <p className="mt-14 border-t border-border pt-5 font-body text-xs leading-relaxed text-ink/50">
          Nothing on this page describes a person. The kiosk stores no IP
          address, no user agent and no cookie, and a visitor is never followed
          from one session to the next. Tracking began{" "}
          {s.uptime.trackingSince ? clock(s.uptime.trackingSince) : "when the first screen reported"}.
        </p>
      </div>
    </main>
  );
}
