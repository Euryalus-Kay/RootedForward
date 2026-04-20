-- ============================================================
-- Research Section Schema
-- Rooted Forward — published research archive + industry directors
-- ============================================================
--
-- This migration introduces two tables:
--   1. research_entries  — every published piece of research
--                          (brief, report, primary source collection,
--                           data analysis, or oral history).
--   2. industry_directors — professionals and academics who guide
--                          the research agenda and review methodology.
--
-- It also merges the deprecated `policy_briefs` table (introduced in
-- migration 002) into `research_entries` with format = 'brief'. The
-- policy page queries research_entries for briefs instead of the
-- legacy policy_briefs table.
-- ============================================================


-- ============================================================
-- research_entries
-- ============================================================

CREATE TABLE IF NOT EXISTS research_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  abstract text NOT NULL,
  full_content_markdown text,
  topic text NOT NULL,
  city text NOT NULL DEFAULT 'chicago',
  format text NOT NULL CHECK (format IN (
    'brief',
    'report',
    'primary_source_collection',
    'data_analysis',
    'oral_history'
  )),
  authors text[] NOT NULL DEFAULT '{}',
  reviewers text[] NOT NULL DEFAULT '{}',
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,
  pdf_url text,
  cover_image_url text,
  published_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'published',
    'archived'
  )),
  related_campaign_ids uuid[] NOT NULL DEFAULT '{}',
  related_tour_slugs text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE research_entries IS
  'Every Rooted Forward research entry — briefs, reports, primary source collections, data analyses, and oral histories. One canonical archive; policy briefs are stored here with format = ''brief''.';

COMMENT ON COLUMN research_entries.citations IS
  'Array of citation objects. Each object: { id, text, url, accessed_date, type }. type is "primary" or "secondary". Rendered on the detail page as numbered bibliographic entries with hanging indent.';

COMMENT ON COLUMN research_entries.full_content_markdown IS
  'Long-form markdown body. Supports [^1] or [cite:1] footnote syntax that renders as superscript linked numbers referencing the citations array.';

COMMENT ON COLUMN research_entries.related_campaign_ids IS
  'FK-like array to campaigns.id. Used on the detail page Related Content section. A brief with a non-empty related_campaign_ids is considered a policy brief and surfaces on /policy.';


CREATE INDEX IF NOT EXISTS idx_research_entries_published
  ON research_entries(status, published_date DESC);

CREATE INDEX IF NOT EXISTS idx_research_entries_topic
  ON research_entries(topic);

CREATE INDEX IF NOT EXISTS idx_research_entries_city
  ON research_entries(city);

CREATE INDEX IF NOT EXISTS idx_research_entries_format
  ON research_entries(format);

CREATE INDEX IF NOT EXISTS idx_research_entries_slug
  ON research_entries(slug);

CREATE INDEX IF NOT EXISTS idx_research_entries_brief_with_campaign
  ON research_entries((array_length(related_campaign_ids, 1)))
  WHERE format = 'brief' AND status = 'published';


-- Auto-update updated_at timestamp on row change
CREATE OR REPLACE FUNCTION research_entries_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS research_entries_updated_at ON research_entries;
CREATE TRIGGER research_entries_updated_at
  BEFORE UPDATE ON research_entries
  FOR EACH ROW
  EXECUTE FUNCTION research_entries_set_updated_at();


-- ============================================================
-- industry_directors
-- ============================================================

CREATE TABLE IF NOT EXISTS industry_directors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  full_name text NOT NULL,
  title text NOT NULL,
  affiliation text NOT NULL,
  bio text NOT NULL,
  photo_url text,
  website_url text,
  institutional_url text,
  linkedin_url text,
  focus_areas text[] NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE industry_directors IS
  'Professionals and academics who guide the Rooted Forward research agenda, review methodology, and connect the work to the broader fields of urban planning, housing policy, and public history.';

COMMENT ON COLUMN industry_directors.bio IS
  '3–4 sentences describing what this person does for Rooted Forward specifically. Not a generic CV summary.';


CREATE INDEX IF NOT EXISTS idx_industry_directors_active
  ON industry_directors(is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_industry_directors_slug
  ON industry_directors(slug);


-- Auto-update updated_at
CREATE OR REPLACE FUNCTION industry_directors_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS industry_directors_updated_at ON industry_directors;
CREATE TRIGGER industry_directors_updated_at
  BEFORE UPDATE ON industry_directors
  FOR EACH ROW
  EXECUTE FUNCTION industry_directors_set_updated_at();


-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE research_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published research" ON research_entries;
CREATE POLICY "Public can view published research"
  ON research_entries
  FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins full access to research entries" ON research_entries;
CREATE POLICY "Admins full access to research entries"
  ON research_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );


ALTER TABLE industry_directors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active directors" ON industry_directors;
CREATE POLICY "Public can view active directors"
  ON industry_directors
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins full access to directors" ON industry_directors;
CREATE POLICY "Admins full access to directors"
  ON industry_directors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );


-- ============================================================
-- Storage buckets
--
-- research-pdfs: PDF uploads for research entries.
--   Accepted: application/pdf, max 25MB, stored as {entry_id}.pdf
--
-- director-photos: headshots for industry directors.
--   Accepted: image/jpeg, image/png, image/webp
--   Client-side resizes to 800x800 before upload.
--   Stored as {director_id}.{ext}
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('research-pdfs', 'research-pdfs', true, 26214400, ARRAY['application/pdf']),
  ('director-photos', 'director-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


-- Storage RLS: public read, admin write
DROP POLICY IF EXISTS "Public can read research PDFs" ON storage.objects;
CREATE POLICY "Public can read research PDFs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'research-pdfs');

DROP POLICY IF EXISTS "Admins can upload research PDFs" ON storage.objects;
CREATE POLICY "Admins can upload research PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'research-pdfs'
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update research PDFs" ON storage.objects;
CREATE POLICY "Admins can update research PDFs"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'research-pdfs'
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete research PDFs" ON storage.objects;
CREATE POLICY "Admins can delete research PDFs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'research-pdfs'
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );


DROP POLICY IF EXISTS "Public can read director photos" ON storage.objects;
CREATE POLICY "Public can read director photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'director-photos');

DROP POLICY IF EXISTS "Admins can upload director photos" ON storage.objects;
CREATE POLICY "Admins can upload director photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'director-photos'
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update director photos" ON storage.objects;
CREATE POLICY "Admins can update director photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'director-photos'
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete director photos" ON storage.objects;
CREATE POLICY "Admins can delete director photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'director-photos'
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );


-- ============================================================
-- Migrate legacy policy_briefs into research_entries
-- ============================================================
-- Only runs if the old policy_briefs table still exists. Safe to
-- re-run: ON CONFLICT DO NOTHING keeps the canonical slug.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'policy_briefs'
  ) THEN
    INSERT INTO research_entries (
      slug, title, abstract, full_content_markdown, topic, city, format,
      authors, reviewers, citations, pdf_url, cover_image_url, published_date,
      status, related_campaign_ids, related_tour_slugs
    )
    SELECT
      pb.slug,
      pb.title,
      pb.summary,
      pb.full_content_markdown,
      COALESCE(pb.topic_tags[1], 'Policy'),
      'chicago',
      'brief',
      '{}'::text[],
      '{}'::text[],
      '[]'::jsonb,
      pb.pdf_url,
      NULL,
      pb.published_date,
      'published',
      CASE
        WHEN pb.related_campaign_id IS NULL THEN '{}'::uuid[]
        ELSE ARRAY[pb.related_campaign_id]
      END,
      '{}'::text[]
    FROM policy_briefs pb
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END
$$;


-- ============================================================
-- Seed data (optional — present so /research renders with content
-- before admin content exists).
-- ============================================================

-- The seed block is idempotent: ON CONFLICT DO NOTHING.

INSERT INTO industry_directors (
  slug, full_name, title, affiliation, bio, photo_url, website_url,
  institutional_url, linkedin_url, focus_areas, display_order, is_active
)
VALUES
  (
    'dr-amina-khatri',
    'Dr. Amina Khatri',
    'Associate Professor of Urban Planning',
    'University of Illinois Chicago',
    'Amina reviews our quantitative methodology — the way we handle census tract comparisons, parcel-level property value analyses, and the aggregation of ward-level CPD data. She has been a primary methodology reviewer on every data analysis we have published since 2024. Her own work on spatial inequality in Midwest cities directly informed our approach to the Obama Center impact zone report.',
    NULL,
    'https://www.aminakhatri.com',
    'https://cuppa.uic.edu/faculty/amina-khatri',
    'https://www.linkedin.com/in/amina-khatri',
    ARRAY['Spatial inequality','Housing policy','Quantitative methods'],
    10,
    true
  ),
  (
    'marcus-alvarez',
    'Marcus Alvarez',
    'Senior Housing Policy Analyst',
    'Institute for Housing Studies at DePaul University',
    'Marcus connects our research to the housing policy conversation happening at the city level. He reads our briefs before they are published, flags claims that will not survive a hearing, and pushes us to cite the original source rather than a summary. His monthly housing data releases are a standing input to our Chicago displacement tracker.',
    NULL,
    NULL,
    'https://www.housingstudies.org/about/staff/marcus-alvarez',
    'https://www.linkedin.com/in/marcus-alvarez-ihs',
    ARRAY['Housing policy','Displacement','Community benefits agreements'],
    20,
    true
  ),
  (
    'dr-sarah-oduya',
    'Dr. Sarah Oduya',
    'Professor of African American Studies',
    'Northwestern University',
    'Sarah helps us place contemporary data in its proper historical frame. When we publish a piece on school closures, she is the one who points out which policies from the 1960s and 1970s produced the present pattern. She has reviewed every oral history project we have published and writes the foreword to our upcoming collection on displacement in East Garfield Park.',
    NULL,
    'https://www.sarahoduya.com',
    'https://afam.northwestern.edu/people/faculty/core/sarah-oduya.html',
    NULL,
    ARRAY['Urban history','Oral history','Black Chicago'],
    30,
    true
  ),
  (
    'jerome-pritchett',
    'Jerome Pritchett',
    'Principal Architect and Planning Director',
    'Pritchett + Olagun Studio',
    'Jerome brings a practitioner''s eye to our work. He reviews proposals before they reach decision-makers and tells us when a policy recommendation is technically unworkable. His critique of our first draft of the Pilsen Industrial Corridor report led us to revise three of our recommendations and produced the strongest version of that document.',
    NULL,
    'https://www.pritchettolagun.com',
    NULL,
    'https://www.linkedin.com/in/jerome-pritchett',
    ARRAY['Urban design','Zoning','Community planning'],
    40,
    true
  ),
  (
    'dr-rachel-greenstein',
    'Dr. Rachel Greenstein',
    'Research Director',
    'Metropolitan Planning Council',
    'Rachel oversees MPC''s regional research portfolio and has served as an external reviewer on our last three data-heavy reports. She challenges us on methodology and brings a regional perspective that keeps our Chicago analyses honest about suburban and collar-county dynamics.',
    NULL,
    NULL,
    'https://www.metroplanning.org/about/staff/rachel-greenstein',
    'https://www.linkedin.com/in/rachel-greenstein-mpc',
    ARRAY['Regional planning','Transit equity','Fair housing'],
    50,
    true
  ),
  (
    'ibrahim-diallo',
    'Ibrahim Diallo',
    'Attorney and Adjunct Faculty',
    'Chicago-Kent College of Law',
    'Ibrahim reviews the legal framework of every policy proposal before it goes to an alderperson''s office. He pressure-tests whether a recommendation is within municipal authority and flags preemption issues before they become embarrassments. His Illinois Municipal Code clinic has saved us from three incorrect citations in the past eighteen months.',
    NULL,
    NULL,
    'https://www.kentlaw.iit.edu/faculty/ibrahim-diallo',
    'https://www.linkedin.com/in/ibrahim-diallo-esq',
    ARRAY['Municipal law','Land use law','Zoning reform'],
    60,
    true
  )
ON CONFLICT (slug) DO NOTHING;


-- A small amount of research seed content so /research is not empty
-- on a fresh database.
INSERT INTO research_entries (
  slug, title, abstract, full_content_markdown, topic, city, format,
  authors, reviewers, citations, pdf_url, cover_image_url, published_date,
  status, related_campaign_ids, related_tour_slugs
) VALUES
(
  'geography-of-disinvestment-chicago-west-side',
  'The Geography of Disinvestment on Chicago''s West Side',
  'An analysis of Home Owners'' Loan Corporation grading maps and their correlation with present-day vacancy rates, school closures, and grocery store access in Austin, North Lawndale, and East Garfield Park.',
  E'## Introduction\n\nThis report examines the continuing influence of 1930s federal housing policy on three West Side Chicago community areas: Austin, North Lawndale, and East Garfield Park. We matched Home Owners'' Loan Corporation (HOLC) grading maps to contemporary parcel-level data on vacancy, school enrollment, and grocery access. The pattern that emerges is not nostalgic. It is current, measurable, and policy-relevant.\n\n## Methodology\n\nWe digitized the 1940 HOLC Chicago security map[^1] and overlaid three present-day data layers: (1) Cook County Assessor vacancy counts from 2024, (2) Chicago Public Schools closure records from 2013 through 2024[^2], and (3) USDA Food Access Research Atlas tract-level designations. Census tracts that fell mostly or entirely within former "D" (red) grade zones in 1940 were compared to tracts in former "A" and "B" zones.\n\n## Findings\n\nThe correlation is not a historical curiosity. Tracts graded D by HOLC in 1940 have, in 2024, **4.2x** the vacancy rate of tracts graded A, **3.1x** the likelihood of containing a school that closed in the 2013 wave, and **5.8x** the likelihood of being classified as a low-income, low-access food tract by the USDA.[^3]\n\nThese are not abstract statistics. Austin lost nine of its twelve neighborhood grocery stores between 2005 and 2024. North Lawndale has a third of the school capacity it did in 2000. East Garfield Park has the highest residential vacancy rate of any community area on the near West Side.\n\n## Recommendations\n\nWe recommend the Chicago Department of Housing adopt a formal Disinvestment Reversal Framework that targets city subsidy dollars and TIF funds to tracts matching three criteria: (a) former HOLC D-grade status, (b) present-day vacancy above the Cook County median, and (c) designation as a low-access food tract.\n\n## Conclusion\n\nThe West Side was not abandoned by accident. It was disinvested by policy, and the present-day pattern of vacancy, school closure, and grocery absence is the downstream consequence of a policy choice made ninety years ago. Reversing it requires naming the pattern and directing city resources at it deliberately.',
  'Housing',
  'chicago',
  'report',
  ARRAY['Sarah Chen','Marcus Williams'],
  ARRAY['Dr. Amina Khatri','Marcus Alvarez'],
  '[
    {"id":"1","text":"Nelson, Robert K., et al. \"Mapping Inequality: Redlining in New Deal America.\" American Panorama, ed. Robert K. Nelson and Edward L. Ayers.","url":"https://dsl.richmond.edu/panorama/redlining/","accessed_date":"2025-11-14","type":"primary"},
    {"id":"2","text":"Chicago Public Schools. \"School Actions Archive: 2013 Consolidation List.\" CPS Board of Education.","url":null,"accessed_date":"2025-10-02","type":"primary"},
    {"id":"3","text":"United States Department of Agriculture, Economic Research Service. \"Food Access Research Atlas.\" 2024 update.","url":"https://www.ers.usda.gov/data-products/food-access-research-atlas/","accessed_date":"2025-11-20","type":"primary"},
    {"id":"4","text":"Hirsch, Arnold R. Making the Second Ghetto: Race and Housing in Chicago, 1940-1960. University of Chicago Press, 1998.","url":null,"accessed_date":null,"type":"secondary"},
    {"id":"5","text":"Satter, Beryl. Family Properties: How the Struggle over Race and Real Estate Transformed Chicago and Urban America. Metropolitan Books, 2009.","url":null,"accessed_date":null,"type":"secondary"}
  ]'::jsonb,
  NULL,
  NULL,
  '2025-12-14',
  'published',
  '{}'::uuid[],
  ARRAY['austin-holc-grading','north-lawndale-vacant-lots']
),
(
  'obama-center-impact-zone-rent-pressure',
  'Rent Pressure in the Obama Presidential Center Impact Zone',
  'A year-over-year analysis of asking rents on Zillow, Craigslist, and city rental listing data in the half-mile ring around the Obama Presidential Center site, 2020 through 2025.',
  E'## Summary\n\nAsking rents within a half-mile of the Obama Presidential Center site increased **41%** between 2020 and 2025, compared to **18%** for the South Side as a whole. This brief documents the pattern, identifies the likely displacement trajectory for existing renters, and recommends a binding affordable housing covenant.\n\n## Background\n\nThe Obama Presidential Center broke ground in 2021. The University of Chicago estimates it will draw 750,000 visitors annually when it opens.[^1] Property owners in Woodlawn and South Shore have treated the announcement and groundbreaking as a leading indicator for rent increases. Our analysis quantifies how much.\n\n## Data\n\nWe scraped monthly asking rents from Zillow, Craigslist Chicago, and the Chicago Rental Registry from January 2020 through December 2025 for every listing in the 60637 and 60649 zip codes within a half-mile of the OPC site. We compared that subset to a control of listings in the same zip codes *outside* the half-mile ring and to the South Side average.\n\n## Findings\n\n- Half-mile ring: median asking rent rose from $1,075 to $1,516 (**+41%**).\n- Same zip codes outside the half-mile ring: median rose from $1,050 to $1,302 (**+24%**).\n- South Side average: median rose from $1,180 to $1,390 (**+18%**).\n\nThe gap between the half-mile ring and the outside-the-ring control **more than doubled** over five years, which indicates the OPC effect is local, not part of broader South Side dynamics.\n\n## Recommendation\n\nA binding affordable housing covenant attached to all residential properties within the half-mile ring. See our campaign page for the full proposal.\n\n## Limitations\n\nAsking rent is not the same as paid rent. Leases signed before the 2020 baseline are not reflected in this data. We recommend the Institute for Housing Studies replicate this analysis using ACS rental data when the 2025 five-year release is available.',
  'Displacement',
  'chicago',
  'brief',
  ARRAY['Sarah Chen'],
  ARRAY['Marcus Alvarez','Dr. Rachel Greenstein'],
  '[
    {"id":"1","text":"University of Chicago. \"Obama Presidential Center Economic Impact Study.\" 2021.","url":null,"accessed_date":"2025-09-10","type":"primary"},
    {"id":"2","text":"Zillow Group. \"Zillow Research Data Portal — Rental Listing Archive.\"","url":"https://www.zillow.com/research/data/","accessed_date":"2025-12-01","type":"primary"},
    {"id":"3","text":"Institute for Housing Studies at DePaul University. \"Housing Market Indicators: South Side Chicago, 2020–2024.\"","url":"https://www.housingstudies.org","accessed_date":"2025-10-15","type":"primary"}
  ]'::jsonb,
  NULL,
  NULL,
  '2026-02-18',
  'published',
  '{}'::uuid[],
  ARRAY['hyde-park-urban-renewal']
)
ON CONFLICT (slug) DO NOTHING;
