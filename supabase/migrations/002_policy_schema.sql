-- ============================================================
-- Policy Section Schema
-- ============================================================

-- Campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'past', 'drafting')),
  category text NOT NULL,
  city text NOT NULL DEFAULT 'chicago',
  summary text NOT NULL,
  full_brief_markdown text,
  deadline timestamptz,
  outcome text,
  hero_image_url text,
  target_body text,
  problem_markdown text,
  proposal_markdown text,
  comment_template text,
  decision_makers jsonb,
  evidence_links jsonb,
  related_tour_slugs text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Signatures
CREATE TABLE signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_public boolean DEFAULT true,
  digital_signature_svg text,
  delivered boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

-- Public Comments
CREATE TABLE public_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  comment_body text NOT NULL,
  is_approved boolean DEFAULT false,
  is_public boolean DEFAULT true,
  submitted_to_target boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

-- Policy Briefs
CREATE TABLE policy_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  published_date date NOT NULL,
  topic_tags text[] DEFAULT '{}',
  summary text NOT NULL,
  full_content_markdown text,
  pdf_url text,
  related_campaign_id uuid REFERENCES campaigns(id),
  created_at timestamptz DEFAULT now()
);

-- How-To Guides
CREATE TABLE guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  order_number int NOT NULL,
  read_time_minutes int NOT NULL,
  why_use text NOT NULL,
  content_markdown text NOT NULL,
  last_updated timestamptz DEFAULT now()
);

-- Community Proposal Submissions
CREATE TABLE proposal_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  submitter_name text,
  submitter_email text,
  neighborhood text,
  proposal_title text NOT NULL,
  problem_description text NOT NULL,
  proposed_solution text NOT NULL,
  evidence_sources text,
  wants_to_collaborate boolean DEFAULT false,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'developing', 'declined', 'became_campaign')),
  internal_notes text,
  related_campaign_id uuid REFERENCES campaigns(id),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_signatures_campaign ON signatures(campaign_id);
CREATE INDEX idx_public_comments_campaign ON public_comments(campaign_id);
CREATE INDEX idx_public_comments_approved ON public_comments(campaign_id, is_approved, is_public);
CREATE INDEX idx_guides_order ON guides(order_number);
CREATE INDEX idx_policy_briefs_slug ON policy_briefs(slug);
CREATE INDEX idx_proposals_status ON proposal_submissions(status);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view non-draft campaigns" ON campaigns
  FOR SELECT USING (status IN ('active', 'past'));
CREATE POLICY "Admins can do everything with campaigns" ON campaigns
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can sign" ON signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own signatures" ON signatures
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view public signatures" ON signatures
  FOR SELECT USING (is_public = true);
CREATE POLICY "Admins full access signatures" ON signatures
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE public_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can comment" ON public_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view and edit own comments" ON public_comments
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view approved public comments" ON public_comments
  FOR SELECT USING (is_approved = true AND is_public = true);
CREATE POLICY "Admins full access comments" ON public_comments
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE policy_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read briefs" ON policy_briefs FOR SELECT USING (true);
CREATE POLICY "Admin write briefs" ON policy_briefs FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read guides" ON guides FOR SELECT USING (true);
CREATE POLICY "Admin write guides" ON guides FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE proposal_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit proposals" ON proposal_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own proposals" ON proposal_submissions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins full access proposals" ON proposal_submissions
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
