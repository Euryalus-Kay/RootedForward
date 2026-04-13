# Rooted Forward

A youth-led nonprofit documenting racial inequity in American cities through walking tours and podcasts. Chapters in Chicago, New York, Dallas, and San Francisco.

Built with Next.js, Supabase, Mapbox GL JS, Tailwind CSS, and Framer Motion.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project (free tier)
- A [Mapbox](https://mapbox.com) account for map tokens (free tier)

### 1. Clone and Install

```bash
git clone https://github.com/euryalus-kay/rootedforward.git
cd rootedforward
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration — this creates all tables, indexes, RLS policies, storage buckets, and seeds initial data (cities, tour stops, podcasts, site content)
4. Go to **Settings > API** to find your project URL and keys

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-public-token
NEXT_PUBLIC_SITE_URL=https://rootedforward.org
```

**Never commit `.env.local` to the repo.** It is already in `.gitignore`.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set Up Admin Account

1. Sign up through the site at `/auth/signup`
2. In Supabase **Table Editor**, find your user in the `users` table
3. Change the `role` column from `user` to `admin`
4. You now have access to the admin dashboard at `/admin`

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page
│   ├── about/                # About page
│   ├── tours/                # Tours landing + city + stop pages
│   │   ├── [city]/
│   │   │   └── [slug]/       # Individual stop pages
│   ├── podcasts/             # Podcast episodes
│   ├── get-involved/         # Volunteer signup
│   ├── contact/              # Contact form
│   ├── account/              # User account (saved/visited stops)
│   ├── auth/                 # Login, signup, OAuth callback
│   ├── admin/                # Admin dashboard
│   │   ├── tours/            # Tour stop manager
│   │   ├── podcasts/         # Podcast manager
│   │   ├── cities/           # City info manager
│   │   ├── content/          # Site copy manager
│   │   ├── submissions/      # Form submissions viewer
│   │   └── users/            # User role manager
│   ├── sitemap.ts            # Auto-generated sitemap
│   └── robots.ts             # robots.txt
├── components/
│   ├── layout/               # Navbar, Footer, PageTransition
│   ├── maps/                 # CityMap (Mapbox GL)
│   ├── tours/                # CityTourView, StopListView
│   ├── forms/                # VolunteerForm, ContactForm
│   └── ui/                   # Button and shared components
├── lib/
│   ├── supabase/             # Supabase client, server, middleware, auth helpers
│   ├── types/                # TypeScript database types
│   ├── constants.ts          # Fallback data for cities, stops, podcasts
│   └── utils.ts              # cn(), slugify(), formatDate()
└── middleware.ts              # Auth + admin route protection
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in **Settings > Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_SITE_URL`
4. Deploy — Vercel auto-detects Next.js
5. Connect a custom domain in **Settings > Domains**

## Adding Content

All content management happens through the admin dashboard at `/admin`:

- **Tour stops**: Add new stops with coordinates, descriptions, video embeds, and source citations. Stops appear on the interactive map immediately.
- **Podcasts**: Add episodes with embed URLs, guest names, and descriptions.
- **City info**: Edit descriptions and hero images for each chapter city.
- **Site content**: Update homepage headline, mission statement, about page text, and footer tagline.

No code changes needed to add or edit content.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database and Auth | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Maps | Mapbox GL JS with custom dark style |
| Animation | Framer Motion |
| Icons | Lucide React |
| Hosting | Vercel |

## Design System

- **Display font**: Fraunces (serif) for headings, titles, editorial elements
- **Body font**: DM Sans (grotesque) for body text, UI elements
- **Colors**: Deep forest green `#1B3A2D`, warm cream `#F5F0E8`, ink black `#1A1A1A`, rust accent `#C45D3E`
- **Aesthetic**: Editorial magazine meets civic archive with generous whitespace, asymmetric layouts, paper texture, strong typographic hierarchy

## License

MIT
