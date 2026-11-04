# Brunch 🍳

> A discoverability board for indie games, tools, and side projects with a brutalist retro design, vibrant typography, and community discussion boards.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Supabase (PostgreSQL + Auth + Storage)**.

---

## ✨ Features

- **For You Feed & Daily Drops**: Curated algorithm considering hot scores, fresh launches, and platform tags.
- **Top Charts**: 7-day, 30-day, and all-time leaderboards with filters by platform (Web, Android, iOS, Desktop) and open-source GitHub flags.
- **Creator Leaderboard & Podiums**: Top makers ranked by score, upvotes, or total followers, complete with custom support links and UPI copy.
- **Interactive Creator Dashboard**: 7/30/90-day SVG performance bar charts with hover tooltips, trend indicators, and accessible fallback data tables.
- **Community Boards (`b/{slug}`)**: Discussion feeds, nested comment threads, karma upvoting/downvoting, and community creation.
- **Instant Search**: Debounced search with recent searches and trending tags.
- **Dual-Mode Backend**:
  - **Local Persistence Mode (Offline)**: Works out of the box with `localStorage` and seed data without requiring database credentials.
  - **Cloud Supabase Mode (Production)**: Real-time PostgreSQL database, multi-user authentication (Email, GitHub, Google OAuth), atomic metric increments, and cloud media storage.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Setting Up Supabase (PostgreSQL Backend)

To connect Brunch to a live PostgreSQL database and enable real multi-user synchronization:

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Note your **Project URL** and **anon public API Key** under `Project Settings > API`.

### 2. Run Database Migration
1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Click **New Query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
3. This creates:
   - Tables (`profiles`, `launches`, `communities`, `posts`, `comments`, `votes`, `saves`, `post_votes`, `community_members`, `follows`).
   - Row Level Security (RLS) policies for guest read access and authenticated writes.
   - Triggers for automatic user profile generation upon sign-up.
   - Public storage bucket `brunch-media` for icons and screenshots.
   - Pre-seeded communities, launches, and forum posts.

### 3. Add Environment Variables
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Restart your dev server (`npm run dev`). The header badge will automatically flip from **Local DB** to **PostgreSQL**!

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**.

---

## 📦 Project Architecture

```
src/
├── app/                  # Next.js App Router (layout, globals.css, route dispatcher)
├── components/
│   ├── auth/            # AuthModal (Sign In, Sign Up, OAuth, Database Status)
│   ├── common/          # LaunchRow, LaunchCard, Avatars, CollectionView
│   ├── community/       # CommunityFeed, CommunityDetail, PostDetail, Forum forms
│   ├── creator/         # MakerView (Creator profile, support badges, launches)
│   ├── dashboard/       # CreatorDashboard (KPI cards, SVG performance charts)
│   ├── feed/            # FeedView, ChartsView, CategoriesView, CreatorsView
│   ├── icons/           # SVG Sprite registry, Icons, Glyphs, BrunchLogo
│   ├── launch/          # LaunchDetail, LaunchForm (with cloud storage upload)
│   ├── layout/          # Header, BottomNav, Rail (desktop sidebar)
│   ├── modals/          # BrunchSheets (Profile, Edit Profile, Support, Rank info)
│   ├── saved/           # SavedView (Bookmarks, My Launches, Following)
│   ├── search/          # SearchView (Instant debounced search)
│   └── ui/              # Toast notification system
├── context/
│   └── BrunchContext.tsx # Central state manager with hybrid local/cloud persistence
├── data/
│   └── seed.ts          # Seed datasets, rating formulas, and link parsers
├── lib/
│   └── supabase/        # Browser/server clients, media storage uploaders
└── types/
    ├── brunch.ts        # Domain models (Launch, Community, Post, Maker, etc.)
    └── database.ts      # Supabase PostgreSQL schema definitions
supabase/
└── schema.sql           # Production PostgreSQL DDL + RLS + Triggers + Seed
```
