-- ------------------------------------------------------------------
-- 012_walk_survey.sql
--
-- Answers to the walk survey in the iPhone app. One short card when a
-- walker leaves the opening page, one at the end of the walk, the two
-- scales repeated so the change between them can be measured. The
-- questions live in src/lib/walk-survey.ts.
--
-- One row per card sent. answers holds the card as it was answered,
-- scales as 1 to 5 and choices as the option's value, for example
--   {"knowledge": 2, "lasting_effect": 4, "opportunity": 3,
--    "involvement": 2, "role": "student"}
--
-- Nothing here identifies a person. No IP address, no user agent, no
-- device identifier. respondent is a random code the phone makes for
-- one walk, only so the card from the start and the card from the end
-- can be paired, and it is never sent with anything else.
--
-- Nothing reaches this table from a browser. Writes go through
-- /api/walk/survey on the service role. RLS is on with no policies,
-- which denies anon and authenticated outright while the service role
-- bypasses it.
-- ------------------------------------------------------------------

create table if not exists walk_survey_responses (
  id           uuid primary key default gen_random_uuid(),
  -- which version of the questions, so a reworded survey is never
  -- averaged together with the one before it
  survey       text not null,
  tour         text not null,
  phase        text not null check (phase in ('pre', 'post')),
  respondent   text not null check (respondent ~ '^[A-Za-z0-9]{16,40}$'),
  answers      jsonb not null,
  -- when the walker tapped Submit, which can be well before the row
  -- arrives if the phone had no signal
  answered_at  timestamptz not null,
  app_version  text,
  platform     text not null default 'ios',
  created_at   timestamptz not null default now(),
  -- a card sent twice lands once
  unique (respondent, phase)
);

create index if not exists walk_survey_tour_idx
  on walk_survey_responses (survey, tour, phase, answered_at desc);

alter table walk_survey_responses enable row level security;

-- No policies on purpose. See the header.

-- ------------------------------------------------------------------
-- Reading it
--
-- Before and after for walkers who answered both cards, per walk.
-- Paste into the SQL editor.
--
--   select pre.tour,
--          count(*)                                               as walkers,
--          round(avg((pre.answers->>'knowledge')::int), 2)        as knowledge_before,
--          round(avg((post.answers->>'knowledge')::int), 2)       as knowledge_after,
--          round(avg((pre.answers->>'lasting_effect')::int), 2)   as lasting_effect_before,
--          round(avg((post.answers->>'lasting_effect')::int), 2)  as lasting_effect_after,
--          round(avg((pre.answers->>'opportunity')::int), 2)      as opportunity_before,
--          round(avg((post.answers->>'opportunity')::int), 2)     as opportunity_after,
--          round(avg((pre.answers->>'involvement')::int), 2)      as involvement_before,
--          round(avg((post.answers->>'involvement')::int), 2)     as involvement_after,
--          round(100.0 * avg(((post.answers->>'knowledge')::int
--                > (pre.answers->>'knowledge')::int)::int), 1)    as pct_knowing_more
--     from walk_survey_responses pre
--     join walk_survey_responses post
--       on post.respondent = pre.respondent and post.phase = 'post'
--    where pre.phase = 'pre'
--    group by pre.tour;
--
-- Who is walking, from the card before:
--
--   select answers->>'role' as role, count(*)
--     from walk_survey_responses
--    where phase = 'pre'
--    group by 1 order by 2 desc;
-- ------------------------------------------------------------------
