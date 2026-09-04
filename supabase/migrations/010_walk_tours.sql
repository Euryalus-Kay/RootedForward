-- ============================================================
-- 010: Walking tours in the database
--
-- The walking tours have lived in compiled TypeScript since the
-- first one shipped (src/lib/tours/registry.ts). That was fine
-- while a tour changed once a year and only with a deploy. It is
-- not fine now, because every fix to a stop's text, a video link
-- or a photograph costs a code change, and the iOS app already
-- refetches /api/walk on launch and on every foreground. The app
-- never needed a release for content. The site did.
--
-- walk_tours: one row per walk, holding a whole WalkTourBundle in
--   `bundle`. Same shape the registry exports, so the API, the
--   tour pages and the app payload keep reading one type. Pages
--   read this table first and fall back to WALK_TOURS in
--   src/lib/tours/registry.ts, the same Supabase-first pattern the
--   rest of the site uses.
--
-- walk-media bucket: public bucket for the plates, audio and
--   posters uploaded from the admin editor. Files are served back
--   under the site's own origin, so payload paths stay
--   site-relative and a shipped app needs no change.
--
-- No tour rows are seeded here on purpose. The compiled constants
-- are still the fallback, and seeding copies of them would give
-- every walk two sources of truth that drift apart.
--
-- How to apply: open the Supabase SQL editor on the production
-- project, paste this whole file, run it. Safe to re-run, since the
-- creates are guarded, the policies are dropped before re-create and
-- the bucket upserts. Nothing here reaches the site until it has been
-- run by hand. Check 009 while you are in there, the project notes
-- say it is still pending.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.walk_tours (
  slug text PRIMARY KEY,
  -- off until the owner is finished editing. An unfinished walk is
  -- invisible to the site, to /api/walk and to the app.
  live boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  -- a whole WalkTourBundle: slug, path, mediaDir, tour, intro,
  -- geometry, map, page. Kept as one document rather than split
  -- into tables because the app reads it as one document too, and
  -- a half-written walk is worse than a slow one.
  bundle jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- the public read is always "live rows in order", so index exactly that
CREATE INDEX IF NOT EXISTS idx_walk_tours_live
  ON public.walk_tours (live, sort_order);

-- A bundle whose slug disagrees with its row would be served under
-- one name while identifying itself as another, and the app keys its
-- offline cache by slug. Refuse the row rather than debug that on a
-- phone later.
ALTER TABLE public.walk_tours
  DROP CONSTRAINT IF EXISTS walk_tours_bundle_slug_matches;
ALTER TABLE public.walk_tours
  ADD CONSTRAINT walk_tours_bundle_slug_matches
  CHECK (bundle ? 'slug' AND bundle->>'slug' = slug);

-- The three things /api/walk and the app cannot survive without. A
-- bundle missing any of them would decode to an empty walk on a
-- phone standing on a street corner, so it is refused at write time.
ALTER TABLE public.walk_tours
  DROP CONSTRAINT IF EXISTS walk_tours_bundle_shape;
ALTER TABLE public.walk_tours
  ADD CONSTRAINT walk_tours_bundle_shape
  CHECK (
    jsonb_typeof(bundle->'tour') = 'object'
    AND jsonb_typeof(bundle->'tour'->'stops') = 'array'
    AND jsonb_typeof(bundle->'intro') = 'object'
  );

CREATE OR REPLACE FUNCTION public.walk_tours_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS walk_tours_updated_at ON public.walk_tours;
CREATE TRIGGER walk_tours_updated_at
  BEFORE UPDATE ON public.walk_tours
  FOR EACH ROW EXECUTE FUNCTION public.walk_tours_set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
--
-- Same shape as immersive_tours in 006. Anonymous readers see the
-- live rows and nothing else, and the staff role set matches the
-- one that already manages tour media, so the person editing a
-- walk can upload its plates without a second grant.
-- ------------------------------------------------------------

ALTER TABLE public.walk_tours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read live walk tours" ON public.walk_tours;
CREATE POLICY "Public can read live walk tours"
  ON public.walk_tours
  FOR SELECT
  USING (live = true);

DROP POLICY IF EXISTS "Staff can manage walk tours" ON public.walk_tours;
CREATE POLICY "Staff can manage walk tours"
  ON public.walk_tours
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ------------------------------------------------------------
-- Storage: walk-media bucket (public read, staff write)
--
-- Holds what a walk is made of, namely stop audio, archival
-- plates, now photographs and video posters. The existing files
-- under public/media are untouched and still served statically.
-- The mime list is wide because a phone or a scanner labels the
-- same file half a dozen ways, and a blocked upload with no
-- explanation is the worst thing this bucket could do.
-- ------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'walk-media',
  'walk-media',
  true,
  52428800, -- 50MB, the current plan's per-object ceiling
  ARRAY[
    'audio/mpeg','audio/mp3','audio/mp4','audio/m4a','audio/x-m4a',
    'audio/aac','audio/wav','audio/x-wav',
    'image/jpeg','image/png','image/webp','image/avif','image/heic',
    'video/mp4','video/webm','video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read walk media" ON storage.objects;
CREATE POLICY "Public can read walk media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'walk-media');

DROP POLICY IF EXISTS "Staff can upload walk media" ON storage.objects;
CREATE POLICY "Staff can upload walk media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'walk-media'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Staff can update walk media" ON storage.objects;
CREATE POLICY "Staff can update walk media"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'walk-media'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Staff can delete walk media" ON storage.objects;
CREATE POLICY "Staff can delete walk media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'walk-media'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );
