-- ============================================================================
-- 003 — Build the Block: leaderboard, run history, achievement tracking
-- ============================================================================

create table if not exists public.game_runs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null,
  display_name text not null,
  seed text not null,
  ended_year integer not null,
  total_score integer not null,
  equity_score integer not null,
  heritage_score integer not null,
  growth_score integer not null,
  sustainability_score integer not null,
  archetype text not null,
  decisions_made integer not null,
  events_survived integer not null,
  notes_read integer not null default 0,
  achievements jsonb not null default '[]'::jsonb,
  final_state jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index if not exists idx_game_runs_score on public.game_runs(total_score desc);
create index if not exists idx_game_runs_user on public.game_runs(user_id);
create index if not exists idx_game_runs_created on public.game_runs(created_at desc);

alter table public.game_runs enable row level security;

-- Policies: drop and recreate so the migration is idempotent across
-- Postgres versions (CREATE POLICY IF NOT EXISTS only works in PG 15+).
drop policy if exists "Anyone can read game runs" on public.game_runs;
create policy "Anyone can read game runs"
  on public.game_runs for select
  using (true);

drop policy if exists "Anyone can submit a game run" on public.game_runs;
create policy "Anyone can submit a game run"
  on public.game_runs for insert
  with check (true);

drop policy if exists "Admins can delete game runs" on public.game_runs;
create policy "Admins can delete game runs"
  on public.game_runs for delete
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'admin'
    )
  );
