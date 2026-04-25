-- ============================================================
-- Research Data Distribution Schema
-- Rooted Forward — auth-gated dataset downloads with audit trail
-- ============================================================
--
-- This migration replaces the email-based replication-archive
-- distribution model with a logged-in download flow. Every
-- download is recorded, surfaced in the admin dashboard, and
-- attributed to a Supabase auth user.
--
-- Tables:
--   1. research_datasets   — one row per published replication
--                            archive, mirrors research_entries by slug.
--   2. dataset_downloads   — one row per download event.
--
-- A storage bucket `research-datasets` is created for the actual
-- archive ZIPs. Public read is OFF; reads happen via signed URLs
-- minted by the /api/research/data/download route after the
-- session check passes.
-- ============================================================


-- ============================================================
-- research_datasets
-- ============================================================

CREATE TABLE IF NOT EXISTS research_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  storage_path text,
  file_size_bytes bigint,
  file_count int,
  license text,
  source text,
  contents text,
  notes text,
  preview jsonb NOT NULL DEFAULT '{}'::jsonb,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  download_count int NOT NULL DEFAULT 0,
  last_downloaded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE research_datasets IS
  'One row per published replication archive. Slug matches research_entries.slug. The archive file itself lives in storage bucket research-datasets at storage_path. preview is a JSON object with sample rows / schema description; files is an array of {name, bytes, description}.';

COMMENT ON COLUMN research_datasets.preview IS
  'JSON blob of preview content the data page renders before the download button. Typical shape: { columns: [{name, type, description}], sample_rows: [...], summary_stats: {} }.';

COMMENT ON COLUMN research_datasets.is_public IS
  'When true, signed-in users can request downloads. When false, the dataset is in preparation and the page shows a placeholder.';


CREATE INDEX IF NOT EXISTS idx_research_datasets_slug
  ON research_datasets(slug);


CREATE OR REPLACE FUNCTION research_datasets_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS research_datasets_updated_at ON research_datasets;
CREATE TRIGGER research_datasets_updated_at
  BEFORE UPDATE ON research_datasets
  FOR EACH ROW
  EXECUTE FUNCTION research_datasets_set_updated_at();


-- ============================================================
-- dataset_downloads
-- ============================================================

CREATE TABLE IF NOT EXISTS dataset_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_slug text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  ip_address inet,
  user_agent text,
  affiliation text,
  planned_use text,
  downloaded_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE dataset_downloads IS
  'Audit trail of every research dataset download. One row per download event. user_id is nullable so deletions of the auth user do not erase the audit record; user_email is denormalized for admin search after a deletion.';


CREATE INDEX IF NOT EXISTS idx_dataset_downloads_slug_time
  ON dataset_downloads(dataset_slug, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_dataset_downloads_user_time
  ON dataset_downloads(user_id, downloaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_dataset_downloads_time
  ON dataset_downloads(downloaded_at DESC);


-- Auto-bump research_datasets.download_count on each download
CREATE OR REPLACE FUNCTION dataset_downloads_bump_count()
RETURNS trigger AS $$
BEGIN
  UPDATE research_datasets
  SET download_count = download_count + 1,
      last_downloaded_at = NEW.downloaded_at
  WHERE slug = NEW.dataset_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dataset_downloads_count_bump ON dataset_downloads;
CREATE TRIGGER dataset_downloads_count_bump
  AFTER INSERT ON dataset_downloads
  FOR EACH ROW
  EXECUTE FUNCTION dataset_downloads_bump_count();


-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE research_datasets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view dataset metadata" ON research_datasets;
CREATE POLICY "Public can view dataset metadata"
  ON research_datasets
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage research_datasets" ON research_datasets;
CREATE POLICY "Admins manage research_datasets"
  ON research_datasets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own downloads" ON dataset_downloads;
CREATE POLICY "Users see their own downloads"
  ON dataset_downloads
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see all downloads" ON dataset_downloads;
CREATE POLICY "Admins see all downloads"
  ON dataset_downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- The download API uses the service-role key to insert, so no
-- INSERT policy is needed for end users. Direct client inserts
-- are not allowed.


-- ============================================================
-- Storage bucket — research-datasets
--
-- Private. Reads happen via signed URLs minted by the API after
-- session verification. Admins write through the admin UI.
-- 200 MB limit per archive.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('research-datasets', 'research-datasets', false, 209715200,
   ARRAY['application/zip','application/x-zip-compressed','application/octet-stream'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;


DROP POLICY IF EXISTS "Admins read research datasets" ON storage.objects;
CREATE POLICY "Admins read research datasets"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'research-datasets'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins upload research datasets" ON storage.objects;
CREATE POLICY "Admins upload research datasets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'research-datasets'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins update research datasets" ON storage.objects;
CREATE POLICY "Admins update research datasets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'research-datasets'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins delete research datasets" ON storage.objects;
CREATE POLICY "Admins delete research datasets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'research-datasets'
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- Seed dataset metadata for the 13 published papers.
-- Idempotent: ON CONFLICT (slug) DO UPDATE refreshes the row
-- without zeroing the download counter.
-- ============================================================

INSERT INTO research_datasets (
  slug, license, source, contents, notes, files, preview, is_public
) VALUES
  (
    'geography-of-disinvestment-chicago-west-side',
    'Code under MIT. Derived data under CC BY 4.0. 1938 zone polygons redistributed under Mapping Inequality CC BY-NC-SA 4.0 (Nelson et al. 2016).',
    'Mapping Inequality (Nelson et al. 2016), Cook County Assessor 2024 administrative file, US Census ACS 2023 5-year estimates.',
    'HOLC-to-2020-tract crosswalk for Austin, East Garfield Park, and North Lawndale, paired with six quantitative outcome indicators and the Cook County Assessor 2024 residential-vacancy panel at the tract level.',
    NULL,
    '[{"name":"holc-west-side-tract-crosswalk.geojson","bytes":2300000,"description":"Polygon geometry with HOLC grade and 2020 tract GEOIDs."},{"name":"holc-west-side-outcomes.csv","bytes":48000,"description":"104 D-graded tracts plus 37 comparison tracts with 6 outcome columns."},{"name":"holc-west-side-analysis.R","bytes":12000,"description":"Replication code for all tables and figures in the paper."}]'::jsonb,
    '{"columns":[{"name":"geoid_2020","type":"text","description":"2020 census tract GEOID"},{"name":"holc_grade","type":"text","description":"A, B, C, or D"},{"name":"vacancy_rate_2024","type":"numeric","description":"Cook County Assessor residential-vacancy rate, percent"},{"name":"closed_school_2013","type":"boolean","description":"True if a tract contained a school closed in the 2013 wave"},{"name":"food_access_low","type":"boolean","description":"USDA low-income low-access designation, 2024"}],"sample_rows":[{"geoid_2020":"17031250100","holc_grade":"D","vacancy_rate_2024":8.4,"closed_school_2013":true,"food_access_low":true},{"geoid_2020":"17031070200","holc_grade":"A","vacancy_rate_2024":1.9,"closed_school_2013":false,"food_access_low":false}]}'::jsonb,
    true
  ),
  (
    'obama-center-impact-zone-rent-pressure',
    'Data under CC BY 4.0. Code under MIT.',
    'Zillow Research, Craigslist scrapes, Chicago Rental Registry. Listings de-identified beyond header fields.',
    'Cleaned 9,612-listing panel from Zillow ZORI, Craigslist scrapes, and the Chicago Rental Registry covering January 2020 through December 2025.',
    'Zillow ZORI values redistributed under Zillow Research''s public terms.',
    '[{"name":"opc-rent-panel-2020-2025.csv","bytes":18400000,"description":"9,612 listings with monthly observations across six years."},{"name":"opc-impact-zone-tracts.geojson","bytes":740000,"description":"Eleven-tract half-mile-ring boundary."},{"name":"opc-did-analysis.R","bytes":18000,"description":"Difference-in-differences specification."},{"name":"opc-synthetic-control.R","bytes":14500,"description":"Synthetic-control robustness check."}]'::jsonb,
    '{"columns":[{"name":"listing_id","type":"text","description":"Anonymized listing identifier"},{"name":"month","type":"date","description":"First of month"},{"name":"in_ring","type":"boolean","description":"True if within the half-mile impact zone"},{"name":"bedrooms","type":"int","description":"Bedroom count"},{"name":"asking_rent_usd","type":"numeric","description":"Posted asking rent in dollars"}],"sample_rows":[{"listing_id":"L8842","month":"2020-01-01","in_ring":true,"bedrooms":2,"asking_rent_usd":1075},{"listing_id":"L8842","month":"2025-12-01","in_ring":true,"bedrooms":2,"asking_rent_usd":1516}]}'::jsonb,
    true
  ),
  (
    'pilsen-industrial-corridor-rezoning-review',
    'CC BY 4.0.',
    'City of Chicago Office of the Clerk legislative-information system. Comment records are public under Illinois FOIA.',
    'Coded 351-comment public record for Application ZC-2025-0074, hearing transcript excerpts, and the coalition steering-committee log.',
    NULL,
    '[{"name":"pilsen-zc-2025-0074-comments.csv","bytes":410000,"description":"351 written comments coded along seven dimensions."},{"name":"pilsen-coding-schema.md","bytes":8000,"description":"Coding rubric used by the analysts."},{"name":"pilsen-hearing-timeline.csv","bytes":3500,"description":"Hearing-day events and witness order."}]'::jsonb,
    '{"columns":[{"name":"comment_id","type":"int"},{"name":"position","type":"text","description":"oppose | support"},{"name":"affiliation_type","type":"text"},{"name":"primary_concern","type":"text"}],"sample_rows":[{"comment_id":1,"position":"oppose","affiliation_type":"resident","primary_concern":"displacement"},{"comment_id":2,"position":"support","affiliation_type":"developer_associated","primary_concern":"economic_growth"}]}'::jsonb,
    true
  ),
  (
    'cpd-traffic-stop-data-2024',
    'Data under CC BY 4.0. Code under MIT.',
    'Chicago Police Department, 2024 Traffic Stop Data Transparency Act release.',
    'Cleaned 2024 stop-level panel of 287,412 records, district-level demographic crosswalk, and outcome-test replication code.',
    'Officer badge numbers were withheld at source.',
    '[{"name":"cpd-stops-2024.csv","bytes":62500000,"description":"287,412 stops with 15 fields each."},{"name":"cpd-district-crosswalk.csv","bytes":18000,"description":"22 districts with 2023 ACS demographic composition."},{"name":"cpd-outcome-test.R","bytes":21000,"description":"Knowles-Persico-Todd outcome-test implementation."},{"name":"cpd-vod-check.R","bytes":15500,"description":"Veil-of-darkness robustness check."}]'::jsonb,
    '{"columns":[{"name":"stop_date","type":"date"},{"name":"district","type":"int"},{"name":"stop_reason","type":"text"},{"name":"driver_race","type":"text","description":"Officer-recorded"},{"name":"search_conducted","type":"boolean"},{"name":"contraband_recovered","type":"boolean"}],"sample_rows":[{"stop_date":"2024-03-15","district":7,"stop_reason":"investigatory","driver_race":"black","search_conducted":true,"contraband_recovered":false},{"stop_date":"2024-07-22","district":16,"stop_reason":"moving_violation","driver_race":"white","search_conducted":false,"contraband_recovered":null}]}'::jsonb,
    true
  ),
  (
    '1938-holc-chicago-map-annotated',
    'CC BY-NC-SA 4.0 to match Mapping Inequality source licensing. Code under MIT.',
    'Mapping Inequality (Nelson et al. 2016), National Archives Record Group 195, US Census 2020 TIGER/Line.',
    'Annotated edition of the 1938 HOLC Chicago Residential Security Map with all 239 graded zones, 82 Area Descriptions, GeoJSON polygons, a 2020-tract crosswalk, and six quantitative indicator files.',
    NULL,
    '[{"name":"holc-chicago-1938-zones.geojson","bytes":4200000,"description":"All 239 graded zones with grade and zone identifier."},{"name":"holc-chicago-1938-area-descriptions.csv","bytes":480000,"description":"Full text of all 82 Area Descriptions transcribed from the National Archives original."},{"name":"holc-chicago-2020-tract-crosswalk.csv","bytes":62000,"description":"Tract-to-zone match with overlap percentages."},{"name":"holc-chicago-indicators.parquet","bytes":1100000,"description":"Six tract-level outcome indicators 2020 to 2024."},{"name":"holc-chicago-map-tiles.zip","bytes":104000000,"description":"Vector tiles of the digitized map for self-hosting."}]'::jsonb,
    '{"columns":[{"name":"zone_id","type":"text"},{"name":"grade","type":"text"},{"name":"area_description_excerpt","type":"text"},{"name":"matched_2020_tracts","type":"int"}],"sample_rows":[{"zone_id":"D-12","grade":"D","area_description_excerpt":"Area is heavily deteriorated. Housing is substandard ...","matched_2020_tracts":4}]}'::jsonb,
    true
  ),
  (
    'school-closures-2013-and-after',
    'Code and tables under MIT. CPS tracking file subject to FOIA 2024-04311 redaction terms.',
    'Chicago Public Schools (FOIA 2024-04311), CPS Facilities Master Plan, Cook County Assessor, Chicago Public Library.',
    'CPS post-closure student-tracking panel de-identified at the tract level, the 2013 to 2024 Facilities Master Plan, the Cook County Assessor block-level vacancy panel, and CPL branch circulation records.',
    NULL,
    '[{"name":"cps-2013-closures-tracking.csv","bytes":2400000,"description":"11,729 displaced students aggregated to tract."},{"name":"cps-facilities-master-plan-2013-2024.csv","bytes":620000,"description":"Annual updates with disposition status per building."},{"name":"cps-block-vacancy-panel.csv","bytes":3100000,"description":"Quarter-mile buffer vacancy rates 2013 through 2024."},{"name":"cpl-circulation-2013-2024.csv","bytes":1400000,"description":"CPL branch monthly circulation totals."}]'::jsonb,
    '{"columns":[{"name":"closed_school","type":"text"},{"name":"community_area","type":"text"},{"name":"buffer_vacancy_2013","type":"numeric"},{"name":"buffer_vacancy_2024","type":"numeric"}],"sample_rows":[{"closed_school":"Henson Elementary","community_area":"North Lawndale","buffer_vacancy_2013":11.2,"buffer_vacancy_2024":17.8}]}'::jsonb,
    true
  ),
  (
    'cha-plan-for-transformation-retrospective',
    'Code under MIT. CHA tracking data subject to FOIA 2019-00924, 2022-00718, and 2025-01108 terms.',
    'Chicago Housing Authority resident-tracking records (Illinois FOIA), CHA Moving to Work Annual Reports 2000 through 2024, HUD HCV administrative file.',
    'De-identified CHA resident-tracking panel covering 17,000 families from 1999 through 2024, MTW reports aggregated to tract, HUD HCV records for Chicago-area voucher holders.',
    NULL,
    '[{"name":"cha-resident-tracking-1999-2024.csv","bytes":3800000,"description":"17,000 displaced families with year-end housing status."},{"name":"cha-mtw-tract-aggregates.csv","bytes":920000,"description":"Annual MTW unit counts by tract."},{"name":"hud-hcv-chicago-area.csv","bytes":2100000,"description":"HCV households with current tract."},{"name":"cha-unit-count-reconciliation.R","bytes":17000,"description":"Reproduces the 25,000-unit reconciliation table."}]'::jsonb,
    '{"columns":[{"name":"family_id","type":"text"},{"name":"baseline_property","type":"text"},{"name":"current_status","type":"text"},{"name":"current_tract","type":"text"}],"sample_rows":[{"family_id":"F00432","baseline_property":"Robert Taylor","current_status":"voucher","current_tract":"17031250100"},{"family_id":"F11892","baseline_property":"Cabrini","current_status":"return_mixed_income","current_tract":"17031081600"}]}'::jsonb,
    true
  ),
  (
    'austin-cba-playbook',
    'CC BY 4.0.',
    'Chicago Lawyers'' Committee for Civil Rights Under Law CBA Repository, Coalition for a Community Benefits Agreement archive at UIC Great Cities Institute.',
    'Coded eight-case Chicago CBA outcome table, the five-feature structural-coding schema, the Spearman implementation, and the Austin site evaluation framework.',
    NULL,
    '[{"name":"chicago-cba-eight-case-coding.csv","bytes":34000,"description":"Eight cases coded across five structural features and ten compliance categories."},{"name":"cba-structural-features.md","bytes":12000,"description":"Coding rubric."},{"name":"austin-site-evaluation.md","bytes":18000,"description":"Site-by-site evaluation against the structural features."}]'::jsonb,
    '{"columns":[{"name":"case_name","type":"text"},{"name":"signed","type":"date"},{"name":"three_party_structure","type":"boolean"},{"name":"monitoring_independence","type":"text"},{"name":"compliance_categories_full","type":"int"}],"sample_rows":[{"case_name":"Hyde Park","signed":"2008-04-12","three_party_structure":true,"monitoring_independence":"strong","compliance_categories_full":7}]}'::jsonb,
    true
  ),
  (
    'bronzeville-tif-expenditure-analysis',
    'Code under MIT. Derived data under CC BY 4.0. Sources are public under IL TIF Act.',
    'Cook County Clerk TIF Annual Reports 2002 through 2025, Chicago DOF Annual Financial Analysis, Chicago DPD project files.',
    'Reconciled twenty-three-year Bronzeville TIF revenue and expenditure accounting, 2002 through 2025.',
    NULL,
    '[{"name":"bronzeville-tif-revenue-2002-2025.csv","bytes":24000,"description":"Annual increment by overlapping taxing body."},{"name":"bronzeville-tif-expenditures-2002-2025.csv","bytes":42000,"description":"Project-level expenditure with category."},{"name":"bronzeville-tif-project-list.csv","bytes":31000,"description":"31 projects with description and within-district share."},{"name":"bronzeville-tif-comparison-districts.csv","bytes":18000,"description":"Comparison rates for adjacent districts."}]'::jsonb,
    '{"columns":[{"name":"year","type":"int"},{"name":"increment_usd","type":"numeric"},{"name":"category","type":"text","description":"within-district | adjacent-transfer | regionally-significant | balance"},{"name":"amount_usd","type":"numeric"}],"sample_rows":[{"year":2008,"increment_usd":18420000,"category":"within-district","amount_usd":7368000},{"year":2008,"increment_usd":18420000,"category":"regionally-significant","amount_usd":5347800}]}'::jsonb,
    true
  ),
  (
    'cook-county-property-tax-appeal-disparity',
    'Code under MIT. Derived data under CC BY 4.0.',
    'Cook County Assessor and Cook County Board of Review, released under Illinois FOIA.',
    'Ten-year Cook County appeal record (2015 through 2024), cleaned and matched to 2020 census tracts; tract-level demographics; specialized-firm concentration analysis.',
    NULL,
    '[{"name":"cook-appeals-2015-2024.csv","bytes":92000000,"description":"1.74 million appeal filings with outcome and filer-identity field."},{"name":"cook-appeals-tract-panel.csv","bytes":1400000,"description":"Tract-year panel of filing rate, success rate, reduction magnitude."},{"name":"cook-appeals-firm-concentration.csv","bytes":380000,"description":"Specialized firm activity by tract."},{"name":"cook-appeals-analysis.R","bytes":24000,"description":"Replication code for all tables."}]'::jsonb,
    '{"columns":[{"name":"tract_geoid","type":"text"},{"name":"year","type":"int"},{"name":"filings_per_1000","type":"numeric"},{"name":"success_rate","type":"numeric"},{"name":"median_reduction_pct","type":"numeric"}],"sample_rows":[{"tract_geoid":"17031250100","year":2024,"filings_per_1000":39.0,"success_rate":0.40,"median_reduction_pct":6.8},{"tract_geoid":"17031070200","year":2024,"filings_per_1000":93.0,"success_rate":0.72,"median_reduction_pct":9.2}]}'::jsonb,
    true
  ),
  (
    'cross-bronx-expressway-sixty-years-later',
    'Code under MIT. Derived data under CC BY 4.0. Source acquisition files are public at the NYC Municipal Archives RG 219.',
    'NYC Municipal Archives Record Group 219, IPUMS NHGIS (Manson et al. 2024), NY State DOH Environmental Public Health Tracking System.',
    'Digitized parcel-level acquisition records 1948 through 1955, NHGIS-harmonized 1960 through 1980 census panel, 2023 PM2.5, noise, and pediatric-asthma data.',
    NULL,
    '[{"name":"cross-bronx-acquisitions-1948-1955.csv","bytes":2900000,"description":"Parcel-level acquisitions with payment and original-occupant demographic field."},{"name":"cross-bronx-census-1960-1980.csv","bytes":680000,"description":"Quarter-mile buffer panel."},{"name":"cross-bronx-environmental-2023.csv","bytes":210000,"description":"Tract-level PM2.5 and noise."},{"name":"cross-bronx-asthma-2023.csv","bytes":190000,"description":"Pediatric asthma hospitalization rate."},{"name":"cross-bronx-quarter-mile-buffer.geojson","bytes":1200000,"description":"Buffer polygon."}]'::jsonb,
    '{"columns":[{"name":"tract_geoid","type":"text"},{"name":"in_buffer","type":"boolean"},{"name":"pm25_2023","type":"numeric"},{"name":"asthma_rate_per_1000","type":"numeric"}],"sample_rows":[{"tract_geoid":"36005002800","in_buffer":true,"pm25_2023":11.4,"asthma_rate_per_1000":18.2},{"tract_geoid":"36005014800","in_buffer":false,"pm25_2023":7.8,"asthma_rate_per_1000":6.8}]}'::jsonb,
    true
  ),
  (
    'fillmore-forty-years-after-redevelopment',
    'CC BY-NC 4.0.',
    'San Francisco Public Library History Center, San Francisco Mayor''s Office of Housing and Community Development.',
    'Coded archival-record abstracts from the SFRA Records (1948 through 2012) and OCII Certificates of Preference annual reports (2008 through 2024).',
    NULL,
    '[{"name":"sfra-archival-abstracts.csv","bytes":280000,"description":"Coded abstracts of SFRA case files."},{"name":"ocii-cop-2008-2024.csv","bytes":92000,"description":"Annual COP placement counts."}]'::jsonb,
    '{"columns":[{"name":"year","type":"int"},{"name":"placements","type":"int"},{"name":"cumulative","type":"int"}],"sample_rows":[{"year":2008,"placements":42,"cumulative":42},{"year":2024,"placements":118,"cumulative":2100}]}'::jsonb,
    true
  ),
  (
    'fair-park-and-the-neighborhoods-it-displaced',
    'CC BY 4.0.',
    'Dallas Historical Society 1930s condemnation records, Texas General Land Office 1966 through 1968 acquisition files, US Census ACS 2023, Fair Park First annual reports.',
    'Parcel-level records of the 1935 through 1936 and 1966 through 1968 expansions, the 2023 ACS South Dallas tract panel, and Fair Park First implementation data.',
    NULL,
    '[{"name":"fair-park-1936-acquisitions.csv","bytes":68000,"description":"3,800 displaced residents traced to forty-two blocks."},{"name":"fair-park-1966-1968-acquisitions.csv","bytes":34000,"description":"1,400 displaced residents on forty-two acres."},{"name":"fair-park-acs-2023-panel.csv","bytes":52000,"description":"South Dallas tracts with ACS 2023 indicators."},{"name":"fair-park-first-2020-2024.csv","bytes":24000,"description":"Annual Fair Park First implementation milestones."}]'::jsonb,
    '{"columns":[{"name":"tract_geoid","type":"text"},{"name":"median_household_income","type":"numeric"},{"name":"homeownership_rate","type":"numeric"},{"name":"adi_national_percentile","type":"numeric"}],"sample_rows":[{"tract_geoid":"48113008700","median_household_income":26400,"homeownership_rate":0.28,"adi_national_percentile":92}]}'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE
  SET license = EXCLUDED.license,
      source = EXCLUDED.source,
      contents = EXCLUDED.contents,
      notes = EXCLUDED.notes,
      files = EXCLUDED.files,
      preview = EXCLUDED.preview,
      is_public = EXCLUDED.is_public,
      updated_at = now();
