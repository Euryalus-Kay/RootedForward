-- ============================================================
-- 008: Exhibit visitor submissions (The Ground Keeps Moving)
--
-- exhibit_submissions: visitor-written entries from the exhibit's
--   participation stations (the ch11 answer wall now; memorial and
--   oral-history stations later). Every row lands as 'pending' or
--   'flagged' and nothing is publicly readable until an admin marks
--   it 'approved' at /admin/exhibit. The table carries the 280-char
--   ceiling shared by all kinds; the API additionally enforces the
--   answer wall's tighter 140-char cap.
--
-- Also retitles the chicago/hyde-park immersive tour row to the
-- exhibit's name now that the exhibit replaces the film page.
--
-- How to apply: open the Supabase SQL editor on the production
-- project and run this whole file, the same way migration 006 was
-- applied. Safe to re-run (creates are guarded, policies dropped
-- before re-create, the UPDATE is idempotent).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.exhibit_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibit_slug text NOT NULL DEFAULT 'hyde-park',
  kind text NOT NULL CHECK (kind IN ('answer_wall', 'memorial', 'oral_history')),
  prompt_id text NOT NULL,
  body text NOT NULL CHECK (char_length(body) <= 280),
  display_name text CHECK (char_length(display_name) <= 40),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'flagged', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_exhibit_submissions_wall
  ON public.exhibit_submissions (exhibit_slug, kind, status, created_at DESC);

-- ------------------------------------------------------------
-- RLS. Same shape as the submissions/comments pattern in 001:
-- anyone can write into the review queue, only approved rows are
-- publicly readable, and admins moderate via the users.role
-- subquery.
-- ------------------------------------------------------------

ALTER TABLE public.exhibit_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit exhibit entries" ON public.exhibit_submissions;
CREATE POLICY "Anyone can submit exhibit entries"
  ON public.exhibit_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status IN ('pending', 'flagged'));

DROP POLICY IF EXISTS "Anyone can read approved exhibit entries" ON public.exhibit_submissions;
CREATE POLICY "Anyone can read approved exhibit entries"
  ON public.exhibit_submissions
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can manage exhibit entries" ON public.exhibit_submissions;
CREATE POLICY "Admins can manage exhibit entries"
  ON public.exhibit_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- The exhibit replaces the film page for the Hyde Park tour, so
-- the live tour row takes the exhibit's title and dek. The 006
-- trigger keeps updated_at current.
-- ------------------------------------------------------------

UPDATE public.immersive_tours
SET
  title = 'Hyde Park, The Ground Keeps Moving',
  dek = 'A walk-through exhibit of the machinery that kept moving the ground under one South Side neighborhood, from the first taking to the question of who the city is built for.'
WHERE city = 'chicago' AND slug = 'hyde-park';
