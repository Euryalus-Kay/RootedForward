import type { Metadata } from "next";
import { getKioskStats, renderedNow } from "@/lib/kiosk-analytics";
import StaleGuard from "@/components/kiosk/StaleGuard";

/* ------------------------------------------------------------------ */
/*  /kiosk/data                                                        */
/*                                                                     */
/*  Usage figures for the museum map kiosk. Unlisted, like the kiosk    */
/*  itself. Disallowed in robots.txt and served with an X-Robots-Tag    */
/*  noindex header from vercel.json, so it stays out of search even     */
/*  though anyone holding the link can read it. There is nothing        */
/*  private on it, since the underlying rows describe a screen rather   */
/*  than any person.                                                    */
/*                                                                     */
/*  Numbers and labels only, by the owner's rule. What a session is,    */
/*  how uptime is counted and why nothing here is personal all live in  */
/*  the comments of kiosk-analytics.ts and migration 011, not on the    */
/*  page.                                                               */
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

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-sm border border-border bg-cream p-5">
      <div className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl leading-none text-forest">{value}</div>
      {note ? (
        <div className="mt-1.5 font-body text-xs leading-snug tabular-nums text-ink/55">{note}</div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl text-forest">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const top = Math.max(1, ...rows.map((r) => r.count));
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
            {r.count}
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
  const renderedAt = renderedNow();

  if (stats.migrationPending || !stats.available) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <StaleGuard renderedAt={renderedAt} />
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl text-forest">Kiosk data</h1>
          {stats.migrationPending ? (
            <p className="mt-4 font-body text-base leading-relaxed text-ink/75">
              Run{" "}
              <code className="rounded-sm bg-cream-dark px-1.5 py-0.5 text-sm">
                supabase/migrations/011_kiosk_analytics.sql
              </code>{" "}
              in the Supabase SQL editor, then reload.
            </p>
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
  const idleEnded = s.sessions.endReasons.find((r) => r.reason === "idle")?.count ?? 0;

  return (
    <main className="min-h-screen bg-cream px-6 py-14">
      <StaleGuard renderedAt={renderedAt} />
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl text-forest">Kiosk data</h1>
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
              <span className="font-body text-sm text-ink/55">{ago(s.status.lastSeenAgoMs)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            label="Sessions today"
            value={String(s.sessions.today)}
            note={`${s.sessions.week} in 7 days`}
          />
          <Stat
            label="Average session"
            value={ms(s.duration.meanMs)}
            note={`median ${ms(s.duration.medianMs)}`}
          />
          <Stat
            label="Uptime, 7 days"
            value={pct(s.uptime.week)}
            note={`${pct(s.uptime.month)} in 30 days`}
          />
          <Stat
            label="Sessions all time"
            value={String(s.sessions.total)}
            note={`${s.sessions.month} in 30 days`}
          />
        </div>

        <Section title="Sessions a day">
          <Columns
            rows={s.sessions.perDay.map((d) => ({
              key: d.day,
              label: d.day.slice(8),
              count: d.count,
            }))}
          />
        </Section>

        <Section title="Time per session">
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

        <Section title="Details opened">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat
              label="Per session"
              value={s.depth.meanDetails === null ? "–" : s.depth.meanDetails.toFixed(1)}
            />
            <Stat label="Opened at least one" value={pct(s.depth.openedSomething, 0)} />
            <Stat
              label="Ended by the timer"
              value={String(idleEnded)}
              note={`${s.sessions.month - idleEnded} started over`}
            />
          </div>
          <div className="mt-6">
            {s.depth.details.length ? (
              <Bars rows={s.depth.details} />
            ) : (
              <p className="font-body text-sm text-ink/55">None yet.</p>
            )}
          </div>
        </Section>

        <Section title="Sessions by hour">
          <Columns
            rows={s.sessions.byHour.map((h) => ({
              key: String(h.hour),
              label: hourLabel(h.hour),
              count: h.count,
            }))}
          />
        </Section>

        <Section title="Uptime">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="24 hours" value={pct(s.uptime.day)} />
            <Stat label="7 days" value={pct(s.uptime.week)} />
            <Stat label="30 days" value={pct(s.uptime.month)} />
          </div>
          <div className="mt-6 rounded-sm border border-border bg-cream p-5">
            <div className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
              Gaps, 7 days
            </div>
            {s.uptime.outages.length ? (
              <ul className="mt-3 space-y-2">
                {s.uptime.outages.map((o) => (
                  <li key={o.from} className="font-body text-sm tabular-nums text-ink/75">
                    <span className="font-semibold text-rust">{longMs(o.ms)}</span>{" "}
                    {clock(o.from)} to {clock(o.to)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 font-body text-sm text-ink/60">
                {s.uptime.trackingSince ? "None" : "Nothing reported yet"}
              </p>
            )}
          </div>
        </Section>

        <Section title="Machine">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Page starts" value={String(s.reliability.boots)} />
            <Stat label="Updates taken" value={String(s.reliability.updates)} />
            <Stat
              label="Build"
              value={s.status.build ?? "–"}
              note={`open ${longMs(s.status.pageUptimeMs)}`}
            />
            <Stat
              label="Screens"
              value={String(s.status.devices.length)}
              note={s.status.devices.join(", ") || undefined}
            />
          </div>
          {s.reliability.recentUpdates.length ? (
            <div className="mt-6 rounded-sm border border-border bg-cream p-5">
              <div className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
                Updates
              </div>
              <ul className="mt-3 space-y-1.5">
                {s.reliability.recentUpdates.map((u) => (
                  <li key={u.at} className="font-body text-sm tabular-nums text-ink/75">
                    {clock(u.at)}, {u.from ?? "unknown"} to{" "}
                    <span className="font-semibold text-forest">{u.to ?? "unknown"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        {s.uptime.trackingSince ? (
          <p className="mt-14 border-t border-border pt-5 font-body text-xs tabular-nums text-ink/50">
            Since {clock(s.uptime.trackingSince)}
          </p>
        ) : null}
      </div>
    </main>
  );
}
