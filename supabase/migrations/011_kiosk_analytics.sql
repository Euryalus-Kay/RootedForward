-- ------------------------------------------------------------------
-- 011_kiosk_analytics.sql
--
-- Usage data for the museum map kiosk, detailed enough to replay a day.
--
-- Two tables.
--
--   kiosk_events    every timestamped thing that happened, in order. This
--                   is the recording. Screen changes, taps with the point
--                   on the screen they landed on, details opened and
--                   closed, idle resets, heartbeats, boots and updates.
--
--   kiosk_sessions  one row per visitor's turn, rolled up as it ends. The
--                   same story the events tell, kept separately so the
--                   figures on /kiosk/data do not have to re-read a month
--                   of raw events to count anything.
--
-- Nothing here identifies a person. No IP address, no user agent, no
-- cookie. device_id is a random label the screen invents for itself so two
-- screens can be told apart, and session_id is a fresh random label for one
-- turn at the exhibit that is never reused or linked to another. The x and
-- y on a tap are a position on a museum wall, not a person.
--
-- Nothing reaches these from a browser. Writes go through
-- /api/kiosk/events and reads through /kiosk/data, both on the service
-- role. RLS is on with no policies, which denies anon and authenticated
-- outright while the service role bypasses it.
-- ------------------------------------------------------------------

create table if not exists kiosk_events (
  id          bigserial primary key,
  device_id   text not null,
  -- Null for events that belong to the machine rather than to a visitor,
  -- such as a heartbeat at four in the morning.
  session_id  text,
  build       text,
  surface     text not null default 'wall',
  at          timestamptz not null,
  -- Ordering within a session. Several events can land in the same
  -- millisecond, and a replay that shows them out of order is wrong.
  seq         integer not null default 0,
  type        text not null check (type in (
                'session_start', 'session_end', 'screen', 'tap',
                'detail_open', 'detail_close', 'idle_reset',
                'heartbeat', 'boot', 'update', 'error')),
  -- The screen name, the detail name, whatever the event is about.
  label       text,
  -- Where a tap landed, as a fraction of the screen, so a replay can put
  -- the dot in the right place whatever size it is drawn at.
  x           real check (x is null or (x >= 0 and x <= 1)),
  y           real check (y is null or (y >= 0 and y <= 1)),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists kiosk_events_at_idx      on kiosk_events (at desc);
create index if not exists kiosk_events_session_idx on kiosk_events (session_id, seq);
create index if not exists kiosk_events_type_at_idx on kiosk_events (type, at desc);

create table if not exists kiosk_sessions (
  id            uuid primary key default gen_random_uuid(),
  session_id    text unique,
  device_id     text not null,
  build         text,
  surface       text not null default 'wall',
  started_at    timestamptz not null,
  ended_at      timestamptz not null,
  -- Capped at two hours. A longer figure means a stuck timer rather than a
  -- visitor, and letting those in would quietly wreck every average.
  duration_ms   integer not null check (duration_ms >= 0 and duration_ms <= 7200000),
  detail_opens  integer not null default 0 check (detail_opens >= 0 and detail_opens <= 500),
  taps          integer not null default 0 check (taps >= 0),
  details       jsonb not null default '[]'::jsonb,
  end_reason    text not null default 'idle'
                  check (end_reason in ('idle', 'start_over', 'reload', 'hidden')),
  created_at    timestamptz not null default now()
);

create index if not exists kiosk_sessions_started_at_idx on kiosk_sessions (started_at desc);
create index if not exists kiosk_sessions_device_idx     on kiosk_sessions (device_id, started_at desc);

alter table kiosk_events   enable row level security;
alter table kiosk_sessions enable row level security;

-- No policies on purpose. See the header. A permissive policy here would
-- expose both tables to the anon key that runs in every browser.

-- ------------------------------------------------------------------
-- Housekeeping
--
-- A heartbeat every five minutes is 288 rows a day per screen, and a busy
-- day of visitors adds perhaps another twelve hundred. Postgres will not
-- notice, and every query the dashboard runs is windowed. Only worth doing
-- if the row count ever bothers you, and note that dropping old events
-- also drops the ability to replay those days.
--
--   delete from kiosk_events
--    where type = 'heartbeat'
--      and at < now() - interval '180 days';
-- ------------------------------------------------------------------
