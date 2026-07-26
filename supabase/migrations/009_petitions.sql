-- ============================================================
-- 009: Petitions
--
-- The policy section runs on petitions now. One petition equals
-- one real bill sitting in a real Chicago committee.
--
-- petitions:            the bill and the ask. Publicly readable.
-- petition_signatures:  one row per signer. No account needed, so
--                       the row carries the name and email itself.
--                       Anyone may insert. Nobody but an admin may
--                       read, because the rows hold email addresses.
--                       Public signature counts and the public name
--                       list are read server side with the service
--                       role and never leave the server as emails.
--
-- How to apply: open the Supabase SQL editor on the production
-- project and run this whole file, the same way 006 and 008 were
-- applied. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.petitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  bill_name text NOT NULL,
  record_number text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  one_liner text NOT NULL,
  where_it_stands text NOT NULL,
  addressed_to text NOT NULL,
  what_it_would_do text[] NOT NULL DEFAULT '{}',
  why_we_care text[] NOT NULL DEFAULT '{}',
  petition_statement text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.petition_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  petition_slug text NOT NULL,
  signer_name text NOT NULL CHECK (char_length(signer_name) BETWEEN 1 AND 80),
  email text NOT NULL CHECK (char_length(email) <= 254),
  zip text CHECK (char_length(zip) <= 10),
  -- signer chose to have their first name and zip shown on the page
  is_public boolean NOT NULL DEFAULT true,
  -- flipped once the signature list has been handed to the committee
  delivered boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (petition_slug, email)
);

CREATE INDEX IF NOT EXISTS idx_petitions_status
  ON public.petitions (status, sort_order);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_slug
  ON public.petition_signatures (petition_slug, created_at DESC);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read petitions" ON public.petitions;
CREATE POLICY "Anyone can read petitions"
  ON public.petitions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage petitions" ON public.petitions;
CREATE POLICY "Admins can manage petitions"
  ON public.petitions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Anyone may sign. Nobody may read the rows back, because they hold
-- email addresses. The API inserts with the service role, which
-- bypasses RLS, so this policy is the belt to that pair of braces.
DROP POLICY IF EXISTS "Anyone can sign a petition" ON public.petition_signatures;
CREATE POLICY "Anyone can sign a petition"
  ON public.petition_signatures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read signatures" ON public.petition_signatures;
CREATE POLICY "Admins can read signatures"
  ON public.petition_signatures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- Seed. Mirrors src/lib/petitions.ts exactly. Both sides stay in
-- sync by slug. Real bills only, every claim linked in `sources`.
-- ------------------------------------------------------------

INSERT INTO public.petitions (
  slug, title, bill_name, record_number, status, one_liner,
  where_it_stands, addressed_to, what_it_would_do, why_we_care,
  petition_statement, sources, sort_order
) VALUES
(
  'protecting-renters-ordinance',
  'Protect Chicago renters',
  'Protecting Renters Ordinance',
  NULL,
  'open',
  'Landlords would need a real reason to evict you or refuse to renew your lease.',
  'Mayor Brandon Johnson brought it straight to the Committee on Housing and Real Estate in June 2026. The committee has not voted. A full City Council vote is expected in the fall.',
  'The Chicago City Council Committee on Housing and Real Estate',
  ARRAY[
    'Right now a Chicago landlord can decline to renew your lease without giving any reason at all. This ordinance would change that. A landlord would need a valid cause to evict a tenant or end a lease.',
    'If you do have to move because the owner is moving in, or because the building is being sold, gutted, or torn down, the landlord would owe you relocation money. The amount is five months of rent or $5,000, whichever is larger.',
    'It also caps a security deposit at one month of rent, caps an application fee at $20, and bans the move-in charges that get added on top of rent.',
    'The rest of it is plumbing. Landlords would register their units with the city once a year, and a new Bureau of Rental Housing Services inside the Department of Housing would take complaints and enforce the rules.'
  ],
  ARRAY[
    'Chicago has not seriously rewritten its renter law since the mid-1980s.',
    'The neighborhoods our tours cover are the ones where this lands hardest. In East Woodlawn, a few blocks from the Obama Presidential Center, the median price of a single-family home went from roughly $220,000 in 2019 to roughly $440,000 in 2025. Renters who stayed through the decades when no bank would lend on those blocks are the ones being asked to leave now.',
    'A rule that makes a landlord say why is a small thing. It is also the difference between moving and not moving for a lot of families.'
  ],
  'I am asking the Committee on Housing and Real Estate to hold a vote on the Protecting Renters Ordinance and to advance it to the full City Council. Chicago renters should not lose their homes without a reason.',
  '[
    {"title":"Mayor Wants To Create A Tenant Bill Of Rights, Other Protections For Renters","publisher":"Block Club Chicago, June 29, 2026","url":"https://blockclubchicago.org/2026/06/29/mayor-wants-to-create-a-tenant-bill-of-rights-other-protections-for-renters/"},
    {"title":"Mayor Brandon Johnson, Department of Housing Introduce The Protecting Renters Ordinance","publisher":"City of Chicago","url":"https://www.chicago.gov/city/en/depts/mayor/press_room/press_releases/2026/may/protecting-renters-ordinance.html"},
    {"title":"Chicago''s Efforts to Keep Housing Affordable in Woodlawn Falls Short as Obama Center Nears Opening","publisher":"Illinois Answers Project, May 7, 2026","url":"https://illinoisanswers.org/2026/05/07/affordability-woodlawn-obama-center-housing-costs/"},
    {"title":"Chicago landlords spooked by expanded tenants'' rights ordinance","publisher":"The Real Deal, July 2, 2026","url":"https://therealdeal.com/chicago/2026/07/02/landlords-fight-chicago-tenant-protections/"}
  ]'::jsonb,
  1
),
(
  'hazel-johnson-cumulative-impacts-ordinance',
  'Stop stacking pollution on the same neighborhoods',
  'Hazel M. Johnson Cumulative Impacts Ordinance',
  'O2025-0016697',
  'open',
  'Before the city approves another polluting plant, it would have to count the pollution the neighborhood already carries.',
  'Introduced in April 2025 and sent to the Committee on Zoning, Landmarks and Building Standards in September 2025. It has been sitting there ever since with no vote scheduled.',
  'The Chicago City Council Committee on Zoning, Landmarks and Building Standards',
  ARRAY[
    'Chicago reviews industrial rezoning applications one at a time. A scrapyard is judged on its own, then an asphalt plant is judged on its own, and nobody adds up what a single neighborhood is breathing by the end.',
    'This ordinance would make the city add it up. A company asking for a heavy industrial rezoning would have to show how its pollution stacks on top of what is already there before the zoning is approved.',
    'It also puts an environmental justice project manager and an advisory board inside city government, and adds requirements for companies that relocate.',
    'It is named for Hazel M. Johnson, who organized against industrial pollution around the Altgeld Gardens public housing development on the Far South Side and is widely called the mother of the environmental justice movement.'
  ],
  ARRAY[
    'The city''s own cumulative impacts assessment found the heaviest pollution burdens sitting on Black and Latino neighborhoods on the South and West sides.',
    'Those are largely the same neighborhoods the federal government graded red in 1940, and the same ones the city later zoned for the industry nobody wanted next door. Our exhibit walks through how that map was drawn. This ordinance is one of the few live chances to stop the pattern from repeating.',
    'The bill has now been stuck in one committee for most of a year. A committee that never votes never has to go on record.'
  ],
  'I am asking the Committee on Zoning, Landmarks and Building Standards to schedule a vote on the Hazel M. Johnson Cumulative Impacts Ordinance. Chicago should count the pollution a neighborhood already carries before approving more of it.',
  '[
    {"title":"Mayor Brandon Johnson Introduces the Hazel Johnson Cumulative Impacts Ordinance","publisher":"City of Chicago, April 2025","url":"https://www.chicago.gov/city/en/depts/mayor/press_room/press_releases/2025/april/Hazel-Johnson-Cumulative-Impacts-Ordinance.html"},
    {"title":"Ordinance O2025-0016697","publisher":"Chicago Councilmatic","url":"https://chicago.councilmatic.org/legislation/o2025-0016697/"},
    {"title":"In Chicago, a Landmark Environmental Justice Bill Inches Toward Passage","publisher":"Inside Climate News, July 2, 2025","url":"https://insideclimatenews.org/news/02072025/chicago-landmark-environmental-justice-bill/"},
    {"title":"Ask your alderperson to act on the Hazel M. Johnson environmental health ordinance now","publisher":"The TRiiBE, June 2026","url":"https://thetriibe.com/2026/06/essay-ask-your-alderperson-to-act-on-the-hazel-m-johnson-environmental-health-ordinance-now/"}
  ]'::jsonb,
  2
)
ON CONFLICT (slug) DO NOTHING;
