-- ============================================================
-- 006: Immersive tours (2D/3D hybrid) + Studio editor projects
--
-- immersive_tours: narrative routes of mostly-2D stops where a
--   stop can carry 360 media (look-around) and/or a Studio-edited
--   hybrid sequence. Pages read this table first and fall back to
--   PLACEHOLDER_IMMERSIVE_TOURS in src/lib/immersive/constants.ts.
--
-- studio_projects: saved AI editor projects (media refs, sequence,
--   chat). Admin/editor only.
--
-- tour-media bucket: public bucket for 360 video/photo and studio
--   clips. Uploaded from /admin/immersive and /admin/studio.
-- ============================================================

CREATE TABLE IF NOT EXISTS immersive_tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  dek text NOT NULL DEFAULT '',
  medium text NOT NULL DEFAULT 'underwater'
    CHECK (medium IN ('underwater', 'street', 'aerial')),
  hero_note text,
  stops jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, slug)
);

CREATE TABLE IF NOT EXISTS studio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brief text NOT NULL DEFAULT '',
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  sequence jsonb,
  chat jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION immersive_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS immersive_tours_updated_at ON immersive_tours;
CREATE TRIGGER immersive_tours_updated_at
  BEFORE UPDATE ON immersive_tours
  FOR EACH ROW EXECUTE FUNCTION immersive_set_updated_at();

DROP TRIGGER IF EXISTS studio_projects_updated_at ON studio_projects;
CREATE TRIGGER studio_projects_updated_at
  BEFORE UPDATE ON studio_projects
  FOR EACH ROW EXECUTE FUNCTION immersive_set_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

ALTER TABLE immersive_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published immersive tours" ON immersive_tours;
CREATE POLICY "Public can read published immersive tours"
  ON immersive_tours
  FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Staff can manage immersive tours" ON immersive_tours;
CREATE POLICY "Staff can manage immersive tours"
  ON immersive_tours
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Staff can manage studio projects" ON studio_projects;
CREATE POLICY "Staff can manage studio projects"
  ON studio_projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ------------------------------------------------------------
-- Storage: tour-media bucket (public read, staff write)
-- Paths: 360/<file> for tour 360 media, studio/<project>/<file>
-- ------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tour-media',
  'tour-media',
  true,
  52428800, -- 50MB, the current plan's per-object ceiling
  ARRAY['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read tour media" ON storage.objects;
CREATE POLICY "Public can read tour media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tour-media');

DROP POLICY IF EXISTS "Staff can upload tour media" ON storage.objects;
CREATE POLICY "Staff can upload tour media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tour-media'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Staff can update tour media" ON storage.objects;
CREATE POLICY "Staff can update tour media"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'tour-media'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

DROP POLICY IF EXISTS "Staff can delete tour media" ON storage.objects;
CREATE POLICY "Staff can delete tour media"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tour-media'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ------------------------------------------------------------
-- Seed: Beneath the Water Line (Chicago, underwater)
-- Mirrors PLACEHOLDER_IMMERSIVE_TOURS. Keep both in sync by slug.
-- ------------------------------------------------------------

INSERT INTO immersive_tours (city, slug, title, dek, medium, hero_note, published, stops)
VALUES (
  'chicago',
  'beneath-the-water-line',
  'Beneath the Water Line',
  'An underwater route through the Chicago River and the lakefront. The same policy history the walking tours trace on the street is written into the water, in reversed currents, buried tunnels, industrial sediment, and a shipwreck you can see from the shore.',
  'underwater',
  'The look-around scenes on this tour are labeled test captures while real underwater footage is gathered.',
  true,
  '[
    {
      "id": "main-stem-reversal",
      "title": "The River That Flows Backward",
      "kicker": "Main Stem / Michigan Avenue",
      "depthLabel": "Surface to 20 ft",
      "lat": 41.8887,
      "lng": -87.6233,
      "body": "In 1900 the Sanitary District of Chicago finished the canal that reversed the Chicago River, pulling it away from Lake Michigan and sending it toward the Mississippi watershed instead. The point was blunt. The city drank from the lake and dumped its waste into the river, and the river carried that waste to the drinking water intakes. Rather than stop polluting the river, Chicago re-engineered which way it ran. Under the Michigan Avenue bridge the current still obeys that decision. Every drop moving past the bridge piers is evidence of how far the city would go to protect some neighborhoods from what it was willing to leave in the water near others.",
      "facts": [
        "Reversed in 1900 by the Sanitary District of Chicago",
        "The canal sent the river toward the Mississippi watershed",
        "Built to keep sewage away from the lake drinking water intakes"
      ],
      "sources": [
        "Encyclopedia of Chicago, Chicago River entry",
        "Metropolitan Water Reclamation District of Greater Chicago, district history",
        "Libby Hill, The Chicago River, a Natural and Unnatural History, 2000"
      ],
      "media": {
        "kind": "video360",
        "src": "/media/360/test-pano.mp4",
        "poster": "/media/360/test-pano-poster.jpg",
        "initialYawDeg": 0,
        "note": "Test capture. A labeled synthetic panorama stands in until real footage is uploaded."
      }
    },
    {
      "id": "bubbly-creek",
      "title": "Bubbly Creek Still Bubbles",
      "kicker": "South Fork / Back of the Yards",
      "depthLabel": "0 to 12 ft",
      "lat": 41.8398,
      "lng": -87.6566,
      "body": "The South Fork of the South Branch served for decades as the open drain of the Union Stock Yards. So much packinghouse waste settled into the channel that gases from the decomposing sediment rose to the surface in a constant simmer, which is how the creek got its name. Upton Sinclair described it in The Jungle in 1906. The yards closed in 1971. The bubbles did not. The creek bed still holds a thick organic layer from the stockyard era, and federal and local agencies have studied dredging and restoration for years. It is the clearest place in the city to see how industrial harm outlives the industry, and whose neighborhoods were asked to absorb it.",
      "facts": [
        "Named for gases rising from stockyard waste in the sediment",
        "Described by Upton Sinclair in The Jungle, 1906",
        "Subject of U.S. Army Corps of Engineers restoration studies"
      ],
      "sources": [
        "Upton Sinclair, The Jungle, 1906",
        "U.S. Army Corps of Engineers, Bubbly Creek ecosystem restoration study",
        "Encyclopedia of Chicago, Bubbly Creek entry"
      ],
      "media": null
    },
    {
      "id": "water-cribs",
      "title": "The Cribs Miles Offshore",
      "kicker": "Lake Michigan / Drinking water intakes",
      "depthLabel": "30 to 35 ft",
      "lat": 41.7825,
      "lng": -87.5302,
      "body": "The round structures on the horizon off the lakefront are intake cribs, the mouths of the city''s drinking water system. Engineer Ellis Chesbrough sent the first tunnel two miles out under the lakebed in the 1860s because the water at the shoreline was already fouled. Later tunnels were dug by hand under the lake, dangerous work that killed dozens of laborers, including in a fire at a crib construction site in 1909. The water that reaches every tap in Chicago and many suburbs still enters here, far enough from shore to stay ahead of what the city put in the water closer in.",
      "facts": [
        "Intake cribs sit miles offshore over tunnels under the lakebed",
        "The first two mile lake tunnel opened in 1867",
        "A 1909 fire at a crib construction site killed dozens of workers"
      ],
      "sources": [
        "Encyclopedia of Chicago, Water Supply entry",
        "Chicago Department of Water Management, system history",
        "Chicago Tribune archive coverage of the 1909 crib fire"
      ],
      "media": {
        "kind": "photo360",
        "src": "/media/360/test-pano.jpg",
        "poster": "/media/360/test-pano-poster.jpg",
        "initialYawDeg": 90,
        "note": "Test capture. A labeled synthetic panorama stands in until real footage is uploaded."
      }
    },
    {
      "id": "morgan-shoal-silver-spray",
      "title": "A Shipwreck in Sight of Hyde Park",
      "kicker": "Morgan Shoal / 49th Street",
      "depthLabel": "5 to 25 ft",
      "lat": 41.8047,
      "lng": -87.5722,
      "body": "Morgan Shoal is a limestone reef lying just off the shoreline between roughly 45th and 51st Streets, one of the few places where the lake bottom rises close enough to the surface to be dangerous. In 1914 the steamer Silver Spray grounded on the shoal, and on calm days its boiler still breaks the surface within sight of the same Hyde Park blocks the walking tour covers. The shoal also shaped the shore itself. This stretch resisted the landfill expansion that manufactured most of Chicago''s lakefront, which is why the revetment here looks rougher and older than the parkland north of it.",
      "facts": [
        "A limestone reef close offshore between about 45th and 51st Streets",
        "The steamer Silver Spray grounded on the shoal in 1914",
        "The wreck''s boiler is still visible above calm water"
      ],
      "sources": [
        "Chicago Park District, Morgan Shoal framework planning documents",
        "Chicago Tribune archive coverage of the Silver Spray grounding, 1914",
        "Hyde Park Historical Society accounts"
      ],
      "media": {
        "kind": "video360",
        "src": "/media/360/test-pano.mp4",
        "poster": "/media/360/test-pano-poster.jpg",
        "initialYawDeg": 270,
        "note": "Test capture. A labeled synthetic panorama stands in until real footage is uploaded."
      }
    },
    {
      "id": "deep-tunnel",
      "title": "The Tunnel Hundreds of Feet Down",
      "kicker": "Deep Tunnel / South Branch",
      "depthLabel": "150 to 300 ft below grade",
      "lat": 41.829,
      "lng": -87.647,
      "body": "Reversing the river did not finish the job. In heavy storms the combined sewers still overflowed into the river and sometimes back into the lake and into basements, and the flooding fell hardest on low lying working class neighborhoods. The answer, begun in the 1970s and still under construction, is the Tunnel and Reservoir Plan, better known as the Deep Tunnel. More than 100 miles of tunnels bored through bedrock far beneath the river system catch the overflow and hold it for treatment in reservoirs like McCook. It is one of the largest public works projects in the country, and almost nobody who lives above it has ever seen it.",
      "facts": [
        "Construction began in the 1970s and continues today",
        "More than 100 miles of tunnels bored through bedrock",
        "Storm overflow is held in reservoirs like McCook for treatment"
      ],
      "sources": [
        "Metropolitan Water Reclamation District, Tunnel and Reservoir Plan",
        "U.S. EPA materials on combined sewer overflows",
        "Encyclopedia of Chicago, Flood Control and Drainage entry"
      ],
      "media": null
    }
  ]'::jsonb
)
ON CONFLICT (city, slug) DO NOTHING;
