-- Rooted Forward: Initial Database Schema
-- Run this in the Supabase SQL Editor to set up all tables and policies.

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- Users (extends Supabase Auth)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  saved_stops uuid[] default '{}',
  visited_stops uuid[] default '{}',
  created_at timestamptz default now() not null
);

-- Cities
create table public.cities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text not null default '',
  hero_image text,
  lat double precision not null,
  lng double precision not null,
  zoom double precision default 11
);

-- Tour Stops
create table public.tour_stops (
  id uuid default uuid_generate_v4() primary key,
  city text not null,
  slug text not null,
  title text not null,
  lat double precision not null,
  lng double precision not null,
  video_url text,
  description text not null default '',
  images text[] default '{}',
  sources text[] default '{}',
  published boolean default false,
  created_at timestamptz default now() not null,
  unique(city, slug)
);

-- Podcasts
create table public.podcasts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null default '',
  embed_url text,
  episode_number integer not null,
  publish_date date not null,
  guests text[] default '{}',
  published boolean default false,
  created_at timestamptz default now() not null
);

-- Site Content (key-value for editable copy)
create table public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz default now() not null
);

-- Submissions (volunteer signups and contact forms)
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('volunteer', 'contact')),
  name text not null,
  email text not null,
  message text,
  phone text,
  chapter text,
  created_at timestamptz default now() not null
);

-- Comments on tour stops
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  stop_id uuid references public.tour_stops(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  approved boolean default false,
  created_at timestamptz default now() not null
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index idx_tour_stops_city on public.tour_stops(city);
create index idx_tour_stops_slug on public.tour_stops(city, slug);
create index idx_tour_stops_published on public.tour_stops(published);
create index idx_podcasts_published on public.podcasts(published);
create index idx_podcasts_episode on public.podcasts(episode_number);
create index idx_comments_stop on public.comments(stop_id);
create index idx_comments_approved on public.comments(approved);
create index idx_submissions_type on public.submissions(type);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.users enable row level security;
alter table public.cities enable row level security;
alter table public.tour_stops enable row level security;
alter table public.podcasts enable row level security;
alter table public.site_content enable row level security;
alter table public.submissions enable row level security;
alter table public.comments enable row level security;

-- USERS policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.users where id = auth.uid())
  );

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Admins can view all users"
  on public.users for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update any user"
  on public.users for update
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- CITIES policies
create policy "Anyone can read cities"
  on public.cities for select
  using (true);

create policy "Admins can manage cities"
  on public.cities for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

-- TOUR STOPS policies
create policy "Anyone can read published stops"
  on public.tour_stops for select
  using (published = true);

create policy "Admins can read all stops"
  on public.tour_stops for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Admins can manage stops"
  on public.tour_stops for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

-- PODCASTS policies
create policy "Anyone can read published podcasts"
  on public.podcasts for select
  using (published = true);

create policy "Admins can read all podcasts"
  on public.podcasts for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Admins can manage podcasts"
  on public.podcasts for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

-- SITE CONTENT policies
create policy "Anyone can read site content"
  on public.site_content for select
  using (true);

create policy "Admins can manage site content"
  on public.site_content for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

-- SUBMISSIONS policies
create policy "Anyone can submit"
  on public.submissions for insert
  with check (true);

create policy "Admins can read submissions"
  on public.submissions for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- COMMENTS policies
create policy "Anyone can read approved comments"
  on public.comments for select
  using (approved = true);

create policy "Users can insert comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

create policy "Admins can manage all comments"
  on public.comments for all
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update site_content.updated_at
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_site_content_updated_at
  before update on public.site_content
  for each row execute procedure public.update_modified_column();

-- =============================================================================
-- STORAGE
-- =============================================================================

-- Create public storage bucket for images
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict do nothing;

-- Storage policies
create policy "Anyone can view media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Admins can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

create policy "Admins can delete media"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'editor'))
  );

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert cities
insert into public.cities (name, slug, description, lat, lng, zoom) values
  ('Chicago', 'chicago', 'From the redlined boundaries of Bronzeville to the gentrifying streets of Pilsen, Chicago''s grid tells the story of American segregation more clearly than almost any other city. Walk with us through neighborhoods where policy became geography and geography became destiny.', 41.8781, -87.6298, 11),
  ('New York', 'new-york', 'Across five boroughs, the echoes of redlining, blockbusting, and urban renewal still shape who lives where and what resources they can access. Our New York tours trace the invisible walls that highways, zoning laws, and real estate practices built through communities of color.', 40.7128, -74.006, 11),
  ('Dallas', 'dallas', 'In Dallas, the line between wealth and disinvestment often runs along a highway. Central Expressway wasn''t just a road—it was a racial barrier by design. Our Dallas tours uncover the buried history beneath the city''s rapid growth and gleaming skyline.', 32.7767, -96.797, 11),
  ('San Francisco', 'san-francisco', 'The Fillmore was once the Harlem of the West. Bayview-Hunters Point shouldered the environmental costs of wartime industry. San Francisco''s progressive reputation obscures a history of displacement that our tours bring into focus.', 37.7749, -122.4194, 12);

-- Insert tour stops
insert into public.tour_stops (city, slug, title, lat, lng, video_url, description, images, sources, published) values
  ('chicago', 'redlining-boundary-bronzeville', 'The Redlining Boundary at Bronzeville', 41.8236, -87.6186, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'In the 1930s, the Home Owners'' Loan Corporation drew red lines around Bronzeville, labeling it ''hazardous'' for investment. This single bureaucratic act locked generations of Black families out of homeownership and wealth-building. The boundary ran along Cottage Grove Avenue, a line still visible today in the contrast between maintained infrastructure to the east and decades of disinvestment to the west.', '{}', '{"Mapping Inequality Project, University of Richmond","The Color of Law by Richard Rothstein, 2017","Chicago History Museum Archives"}', true),
  ('chicago', 'pilsen-anti-displacement-murals', 'Pilsen''s Anti-Displacement Murals', 41.8565, -87.6553, null, 'The murals along 16th Street in Pilsen are more than public art—they''re declarations of resistance. As gentrification pressures mount in this historically Mexican-American neighborhood, local artists have painted building-sized responses documenting the community''s history and its refusal to be erased. Each mural tells a story: of immigration, of labor, of belonging to a place that developers now see primarily as an investment opportunity.', '{}', '{"Pilsen Alliance Community Archive","National Museum of Mexican Art exhibition records"}', true),
  ('chicago', 'hyde-park-urban-renewal', 'Hyde Park Urban Renewal and Displacement', 41.7943, -87.5907, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'In the 1950s and 1960s, the University of Chicago led one of the nation''s most aggressive urban renewal campaigns, demolishing hundreds of buildings and displacing thousands of Black residents from Hyde Park and neighboring Kenwood. Framed as ''slum clearance,'' the program remade the neighborhood''s demographics and built physical barriers—including the Midway Plaisance—between the university community and surrounding Black neighborhoods.', '{}', '{"Arnold Hirsch, Making the Second Ghetto, 1983","University of Chicago Library Special Collections"}', true),
  ('new-york', 'cross-bronx-expressway', 'The Cross Bronx Expressway', 40.8448, -73.8648, null, 'Robert Moses'' Cross Bronx Expressway, completed in 1963, carved a seven-mile trench through densely populated neighborhoods, displacing over 60,000 residents—predominantly Black and Puerto Rican families. The highway didn''t just demolish buildings; it severed communities, creating a physical wall that accelerated white flight and disinvestment in the South Bronx. Decades later, asthma rates along the expressway corridor remain among the highest in the nation.', '{}', '{"Robert Caro, The Power Broker, 1974","South Bronx Community Health Assessment, 2019"}', true),
  ('new-york', 'harlem-blockbusting-corridor', 'Harlem''s Blockbusting Corridor', 40.8116, -73.9465, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Along 125th Street and the surrounding blocks, real estate speculators in the mid-20th century practiced ''blockbusting''—deliberately stoking racial fears among white homeowners to buy properties cheaply, then selling them at inflated prices to Black families desperate for housing. This predatory cycle extracted wealth from both communities while reshaping Harlem''s demographics and economics for generations.', '{}', '{"Satter, Family Properties, 2009","Harlem Historical Society Archives"}', true),
  ('dallas', 'central-expressway-wall', 'Central Expressway: The Wall Through Dallas', 32.8023, -96.7847, null, 'When Central Expressway (US 75) was built through Dallas, it wasn''t just a highway—it was a racial barrier by design. The route deliberately reinforced the segregation line between white North Dallas and Black South Dallas, destroying homes and businesses in the State-Thomas neighborhood, once a thriving Black community. Today, the wealth gap between neighborhoods on either side of the expressway remains one of the starkest in any American city.', '{}', '{"Dallas Morning News historical investigation, 2021","Texas State Historical Association"}', true),
  ('dallas', 'freedmans-cemetery', 'Freedman''s Cemetery', 32.7942, -96.7951, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Freedman''s Cemetery served as the primary burial ground for formerly enslaved people in Dallas from 1869 to 1907. Over 1,500 individuals were buried here. The site was paved over for Central Expressway construction in the 1940s, quite literally burying Black history under asphalt. Rediscovered during highway expansion in 1990, the cemetery is now a memorial—but the erasure it represents continues in how Dallas develops over historically Black land.', '{}', '{"Freedman''s Cemetery Memorial Archives","Dallas African American Museum"}', true),
  ('san-francisco', 'fillmore-urban-renewal', 'The Fillmore: Urban Renewal as Negro Removal', 37.7842, -122.4324, 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'The Fillmore District was once called the ''Harlem of the West''—a vibrant Black cultural center with jazz clubs, businesses, and churches. In the 1960s and 70s, San Francisco''s Redevelopment Agency razed 883 buildings and displaced over 10,000 Black residents under the banner of ''urban renewal.'' The community called it what it was: Negro removal. Today, less than 5% of the Fillmore''s residents are Black, down from over 40% before redevelopment.', '{}', '{"San Francisco Redevelopment Agency records","Western Addition Community Organization Archive"}', true),
  ('san-francisco', 'bayview-hunters-point-shipyard', 'Bayview-Hunters Point and the Shipyard', 37.7296, -122.3826, null, 'Bayview-Hunters Point became a predominantly Black neighborhood during WWII when workers migrated to staff the naval shipyard. After the war, the Navy left behind toxic contamination while the city left behind disinvestment. For decades, residents have faced elevated cancer rates linked to radiological contamination from the shipyard. Current redevelopment plans promise cleanup and new housing, but community members fear displacement will finish what environmental racism started.', '{}', '{"Bayview Hunters Point Community Advocates","EPA Superfund Site Records, Hunters Point Naval Shipyard"}', true);

-- Insert podcasts
insert into public.podcasts (title, description, embed_url, episode_number, publish_date, guests, published) values
  ('The Lines They Drew: How Redlining Shaped Chicago', 'In our pilot episode, we walk the literal boundary lines that HOLC maps drew around Bronzeville in the 1930s. We talk to residents who grew up on either side of Cottage Grove Avenue and hear how a line on a map became a wall in real life.', 'https://open.spotify.com/embed/episode/placeholder1', 1, '2025-09-15', '{"Dr. LaShonda Hicks","Marcus Williams"}', true),
  ('Concrete Walls: The Expressways That Divided Us', 'From the Cross Bronx Expressway to Central Expressway in Dallas, we examine how highways were weaponized against Black communities. Urban planner Dr. Kenji Watanabe explains the deliberate routing decisions.', 'https://open.spotify.com/embed/episode/placeholder2', 2, '2025-10-01', '{"Dr. Kenji Watanabe"}', true),
  ('Renewal or Removal? The Fillmore''s Lost Generation', 'San Francisco''s Fillmore District was once the cultural heart of Black life on the West Coast. Urban renewal demolished it. We speak with former residents and visit the jazz clubs that survived.', 'https://open.spotify.com/embed/episode/placeholder3', 3, '2025-10-15', '{"Dorothy Pitts","James Baldwin Jr."}', true),
  ('Who Owns the Block? Gentrification in Pilsen', 'Pilsen''s murals tell the story of a community fighting to stay. We walk 16th Street with local artists, talk to families facing eviction, and investigate how tax incentives meant to help neighborhoods end up pushing residents out.', 'https://open.spotify.com/embed/episode/placeholder4', 4, '2025-11-01', '{"Maria Elena Gutierrez","Carlos Ramirez-Rosa"}', true);

-- Insert default site content
insert into public.site_content (key, value) values
  ('hero_headline', 'Every Street Has a Story. Most Go Untold.'),
  ('hero_subheadline', 'Rooted Forward is a youth-led nonprofit documenting racial inequity in American cities through walking tours and podcasts. We believe that understanding where injustice lives—literally, in the streets and structures around us—is the first step toward building something better.'),
  ('mission_statement', 'We are young people who believe the built environment tells the truth about American racism when textbooks won''t. Through walking tours, podcasts, and community storytelling, we document how redlining, urban renewal, highway construction, and gentrification have shaped the cities we live in. Our work is rooted in research, grounded in community, and pointed toward justice.'),
  ('about_story', 'Rooted Forward started in 2024 when a group of high school students in Chicago noticed that the neighborhood boundaries on a 1930s redlining map matched almost exactly with the boundaries of disinvestment they saw every day on their commutes. That observation became a walking tour. That walking tour became a podcast. That podcast became a nonprofit with chapters in four cities. We are students, researchers, storytellers, and organizers. We are not waiting for someone else to tell these stories.'),
  ('about_structure', 'Each Rooted Forward chapter is led by young people ages 16–24 who research, script, and lead walking tours in their cities. Adult advisors provide mentorship, but the work belongs to the youth. Chapter leads meet monthly to share research, coordinate podcast episodes, and plan cross-city programming. Our structure is intentionally flat: every voice matters, and leadership rotates.'),
  ('footer_tagline', 'Documenting inequity. Building understanding. Walking forward.');
