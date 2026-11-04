-- ==============================================================================
-- BRUNCH DATABASE SCHEMA (PostgreSQL / Supabase)
-- Production DDL with Row Level Security (RLS), Triggers, Indexes & Seed Data
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Anonymous Maker',
  handle TEXT UNIQUE,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  support_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Launches Table
CREATE TABLE IF NOT EXISTS public.launches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('game', 'app', 'tool')),
  url TEXT NOT NULL,
  repo TEXT DEFAULT '',
  plats TEXT[] NOT NULL DEFAULT '{w}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  "desc" TEXT DEFAULT '',
  maker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  maker_name TEXT NOT NULL DEFAULT 'Maker',
  maker_bio TEXT DEFAULT '',
  maker_social TEXT DEFAULT '',
  glyph TEXT NOT NULL DEFAULT 'star',
  hue INTEGER NOT NULL DEFAULT 185,
  icon_url TEXT DEFAULT '',
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  views_count INTEGER NOT NULL DEFAULT 0,
  tries_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  about TEXT DEFAULT '',
  glyph TEXT NOT NULL DEFAULT 'bubble',
  hue INTEGER NOT NULL DEFAULT 185,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  link TEXT DEFAULT '',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Author',
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('launch', 'post')),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'User',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Launch Votes
CREATE TABLE IF NOT EXISTS public.votes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  launch_id TEXT NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, launch_id)
);

-- 8. Launch Bookmarks / Saves
CREATE TABLE IF NOT EXISTS public.saves (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  launch_id TEXT NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, launch_id)
);

-- 9. Post Votes (+1 / -1)
CREATE TABLE IF NOT EXISTS public.post_votes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  direction SMALLINT NOT NULL DEFAULT 1 CHECK (direction IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- 10. Community Memberships
CREATE TABLE IF NOT EXISTS public.community_members (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- 11. Maker Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_maker TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_maker)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_launches_type ON public.launches(type);
CREATE INDEX IF NOT EXISTS idx_launches_created ON public.launches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_launches_maker ON public.launches(maker_name);
CREATE INDEX IF NOT EXISTS idx_posts_comm ON public.posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_target ON public.comments(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_votes_launch ON public.votes(launch_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post ON public.post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_comm_members_user ON public.community_members(user_id);

-- ==============================================================================
-- ATOMIC METRIC INCREMENT RPC
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.increment_launch_metric(launch_id TEXT, metric_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF metric_type = 'views' THEN
    UPDATE public.launches SET views_count = views_count + 1 WHERE id = launch_id;
  ELSIF metric_type = 'tries' THEN
    UPDATE public.launches SET tries_count = tries_count + 1 WHERE id = launch_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, handle, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1),
      'Maker'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'handle',
      'maker_' || SUBSTR(NEW.id::TEXT, 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles, owners can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Launches: Anyone can view, authenticated users can insert, makers can update/delete
CREATE POLICY "Launches are viewable by everyone" ON public.launches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create launches" ON public.launches FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Makers can update their own launches" ON public.launches FOR UPDATE USING (auth.uid() = maker_id);
CREATE POLICY "Makers can delete their own launches" ON public.launches FOR DELETE USING (auth.uid() = maker_id);

-- Communities: Anyone can view, authenticated users can create
CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Posts: Anyone can view, authenticated users can create, authors can delete
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- Comments: Anyone can view, authenticated users can comment, authors can delete
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post comments" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authors can delete their comments" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- Votes: Anyone can view, authenticated users can manage their own votes
CREATE POLICY "Votes are viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users can toggle their own votes" ON public.votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saves: Users can view and manage their own saves
CREATE POLICY "Users can view their own saves" ON public.saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own saves" ON public.saves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Post Votes: Anyone can view, users manage their own
CREATE POLICY "Post votes viewable by everyone" ON public.post_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote on posts" ON public.post_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Community Memberships: Anyone can view, users manage their own
CREATE POLICY "Community members viewable by everyone" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join/leave communities" ON public.community_members FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Follows: Anyone can view, users manage their own follows
CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow makers" ON public.follows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (for launch icons and screenshots)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('brunch-media', 'brunch-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Media bucket is publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'brunch-media');

CREATE POLICY "Authenticated users can upload to media bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brunch-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update/delete their uploaded media"
ON storage.objects FOR DELETE
USING (bucket_id = 'brunch-media' AND auth.uid() = owner);

-- ==============================================================================
-- SEED DATA (Populating 5 Communities, 18 Launches, and 10 Posts)
-- ==============================================================================

-- 1. Communities
INSERT INTO public.communities (id, slug, title, about, glyph, hue, sample)
VALUES
  ('s_gamedev', 'gamedev', 'Game makers', 'Builds, jam results and the thing that broke at 2am.', 'gamepad', 280, true),
  ('s_cozygames', 'cozygames', 'Cozy corner', 'Gentle games, soft music and no timers.', 'leaf', 130, true),
  ('s_tinytools', 'tinytools', 'Tiny tools', 'Small utilities that people actually keep using.', 'hex', 215, true),
  ('s_feedbackswap', 'feedbackswap', 'Feedback swap', 'Try mine and I will try yours.', 'chat', 25, true),
  ('s_opensource', 'opensource', 'Open source for fun', 'Repos, patches and weekend forks.', 'rocket', 205, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Launches
INSERT INTO public.launches (id, name, tag, type, url, repo, plats, tags, "desc", maker_name, maker_bio, maker_social, glyph, hue, sample, views_count, tries_count, created_at)
VALUES
  ('s_tidepool', 'Tidepool', 'Grow a reef and run a tiny harbour', 'game', 'https://example.com/tidepool', '', '{w,a}', '{cozy,solo-dev}', 'Plant coral, trade with the next harbour over and watch the tides change what grows. Built over one winter and still getting small updates.', 'Mara Okafor', 'Makes small cozy things after work. Mostly boats.', '', 'droplet', 195, true, 610, 214, NOW() - INTERVAL '2 days'),
  ('s_rift', 'Rift Runner', 'An endless runner where the level collapses behind you', 'game', 'https://example.com/rift', '', '{w}', '{jam entry,daily}', 'Made in 72 hours for a game jam and kept because people kept asking. One button, no menus, and a ghost of your best run.', 'Kenji & Ayo', 'Two friends, one game jam a month.', '', 'bolt', 280, true, 520, 168, NOW() - INTERVAL '1 day'),
  ('s_pocketdungeon', 'Pocket Dungeon', 'A roguelike that fits in one coffee break', 'game', 'https://example.com/pocketdungeon', '', '{a,d}', '{offline,solo-dev}', 'Hand-built rooms, forty relics and a new run every time. Works offline, no ads, no timers.', 'Devon Hale', 'Solo dev. Roguelikes and spreadsheets.', '', 'flame', 20, true, 340, 131, NOW() - INTERVAL '4 days'),
  ('s_wordorchard', 'Word Orchard', 'A daily word grid with no timers and no streak guilt', 'game', 'https://example.com/wordorchard', '', '{w,i}', '{daily,puzzle}', 'One new grid every morning. Connect letters to grow your orchard. Skip a day and nothing bad happens.', 'Inez Ortega', 'Word nerd. Daily puzzles, no ads.', '', 'leaf', 130, true, 720, 189, NOW() - INTERVAL '3 days'),
  ('s_lumen', 'Lumen', 'Bend light with mirrors until the beam hits the goal', 'game', 'https://example.com/lumen', 'https://github.com/example/lumen', '{w}', '{puzzle,open source}', 'Three hundred handmade rooms, from a first mirror to a prism that splits three ways. The source is on GitHub.', 'Lee Tran', 'Maths teacher who makes puzzles.', '', 'target', 55, true, 260, 97, NOW() - INTERVAL '6 days'),
  ('s_quietchess', 'Quiet Chess', 'Chess against twelve calm opponents, offline', 'game', 'https://example.com/quietchess', 'https://github.com/example/quiet-chess', '{w,d}', '{offline,puzzle}', 'No ratings and no clocks unless you want one. Daily puzzles and a game review that explains mistakes in plain words.', 'Devon Hale', 'Solo dev. Roguelikes and spreadsheets.', '', 'dice', 60, true, 180, 76, NOW() - INTERVAL '9 days'),
  ('s_cosmocats', 'Cosmo Cats', 'Merge cats until you reach the galaxy cat', 'game', 'https://example.com/cosmocats', '', '{w}', '{cozy,for fun}', 'Drop, match, merge. There are a hundred and twelve cats and every one has a one-line backstory.', 'Kenji & Ayo', 'Two friends, one game jam a month.', '', 'star', 310, true, 500, 142, NOW() - INTERVAL '4 days'),
  ('s_noisebox', 'Noise Box', 'Ten oddly satisfying sounds on one screen', 'game', 'https://example.com/noisebox', '', '{w}', '{music,for fun}', 'Pop, click, squish, repeat. No goal and no score, just ten sounds and a very small screen.', 'Lee Tran', 'Maths teacher who makes puzzles.', '', 'headphones', 285, true, 120, 49, NOW() - INTERVAL '13 days'),
  ('s_sprout', 'Sprout', 'A tiny habit tracker that grows a garden', 'app', 'https://example.com/sprout', '', '{a,i}', '{no signup,productivity}', 'Tick a habit, watch a plant grow. Weekly review and gentle reminders, with nothing to sign into.', 'Jo Whitfield', 'Habit nerd. Android and a lot of tea.', '', 'leaf', 125, true, 410, 143, NOW() - INTERVAL '3 days'),
  ('s_fieldnotes', 'Fieldnotes', 'Plain-text notes that open instantly', 'app', 'https://example.com/fieldnotes', 'https://github.com/example/fieldnotes', '{a,d}', '{open source,offline,productivity}', 'Notes, checklists and tags in plain files you own. Opens in under a second and exports to anything.', 'Sam Patel', 'Builds tools for problems he had last week.', '', 'note', 45, true, 300, 122, NOW() - INTERVAL '7 days'),
  ('s_lingoloop', 'Lingo Loop', 'Ten-minute language drills with voice practice', 'app', 'https://example.com/lingoloop', '', '{w,a,i}', '{learning,daily}', 'Short lessons with speaking practice and spaced repetition for thirty languages. Free while it is a side project.', 'Noor Haddad', 'Designer who codes on weekends.', '', 'globe', 175, true, 230, 88, NOW() - INTERVAL '5 days'),
  ('s_brewfinder', 'Brew Finder', 'Independent coffee near you, added by regulars', 'app', 'https://example.com/brewfinder', '', '{w,a}', '{community}', 'A map of independent cafes and roasters where every pin was added by someone who drinks there.', 'Jo Whitfield', 'Habit nerd. Android and a lot of tea.', '', 'coffee', 25, true, 150, 64, NOW() - INTERVAL '11 days'),
  ('s_weathergarden', 'Weather Garden', 'A garden that grows from today’s forecast', 'app', 'https://example.com/weathergarden', '', '{w}', '{cozy,for fun,design}', 'Sunny days bring sunflowers and drizzle brings ferns. Open it each morning to see what grew overnight.', 'Mara Okafor', 'Makes small cozy things after work. Mostly boats.', '', 'sun', 45, true, 200, 71, NOW() - INTERVAL '6 days'),
  ('s_palettepal', 'Palette Pal', 'Pull a clean colour palette from any photo', 'tool', 'https://example.com/palettepal', '', '{w}', '{design,no signup}', 'Drop in a photo and get five colours with names and contrast checks. Runs in the browser, nothing is uploaded.', 'Noor Haddad', 'Designer who codes on weekends.', '', 'image', 330, true, 880, 201, NOW() - INTERVAL '2 days'),
  ('s_quietalerts', 'Quiet Alerts', 'Get a ping when a price or page changes', 'tool', 'https://example.com/quietalerts', '', '{w,o}', '{productivity,privacy}', 'Point it at a page and pick what to watch. Alerts arrive as one calm digest instead of a stream of pings.', 'Sam Patel', 'Builds tools for problems he had last week.', '', 'bell', 10, true, 310, 119, NOW() - INTERVAL '8 days'),
  ('s_papercalc', 'Paper Calc', 'A calculator with a scrolling paper tape', 'tool', 'https://example.com/papercalc', '', '{w,a}', '{no signup}', 'Big keys, a history tape you can scroll back through and unit conversion that stays out of the way.', 'Sam Patel', 'Builds tools for problems he had last week.', '', 'hex', 160, true, 190, 83, NOW() - INTERVAL '12 days'),
  ('s_tick', 'Tick', 'Tap-tempo metronome that works with the screen off', 'tool', 'https://example.com/tick', '', '{a}', '{music,offline}', 'Tap a tempo, set odd time signatures and keep practising with the screen off.', 'Devon Hale', 'Solo dev. Roguelikes and spreadsheets.', '', 'music', 265, true, 140, 58, NOW() - INTERVAL '15 days'),
  ('s_cutout', 'Cutout', 'Remove a photo background without uploading it', 'tool', 'https://example.com/cutout', 'https://github.com/example/cutout', '{w}', '{privacy,no signup,design}', 'Runs entirely in your browser, so photos never leave your device. Export a transparent PNG in two clicks.', 'Noor Haddad', 'Designer who codes on weekends.', '', 'camera', 335, true, 640, 176, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 3. Posts
INSERT INTO public.posts (id, community_id, title, body, author_name, sample, created_at)
VALUES
  ('sp_0', 's_gamedev', 'What did you cut from your jam game at the last minute?', 'I cut the second boss and a whole settings menu. Nobody noticed. What did you cut, and do you miss it?', 'Priya S.', true, NOW() - INTERVAL '1 day'),
  ('sp_1', 's_gamedev', 'Weekly thread: show us what you are working on', 'Screenshots, links, half-finished ideas. All welcome. Say what kind of feedback you want and people will aim for that.', 'Marcus L.', true, NOW() - INTERVAL '3 days'),
  ('sp_2', 's_cozygames', 'Games that feel like a quiet evening?', 'Looking for things with no timers, no streaks and no pressure. Browser or mobile is fine.', 'Aiko T.', true, NOW() - INTERVAL '2 days'),
  ('sp_3', 's_cozygames', 'Is a daily puzzle better with or without a streak?', 'I built one without streaks and retention is fine, but I wonder if I am missing something.', 'Inez Ortega', true, NOW() - INTERVAL '6 days'),
  ('sp_4', 's_tinytools', 'Small utilities you use every single day', 'Mine is a tape calculator. What is the humblest tool you would hate to lose?', 'Daniel O.', true, NOW() - INTERVAL '4 days'),
  ('sp_5', 's_tinytools', 'Offline-first: worth the extra work?', 'Thinking about making my notes tool work fully offline. Is it worth it for a free side project?', 'Sam Patel', true, NOW() - INTERVAL '9 days'),
  ('sp_6', 's_feedbackswap', 'Try my reef game, I will try yours', 'It is a small cozy harbour sim. Looking for honest first impressions from the first five minutes.', 'Mara Okafor', true, NOW() - INTERVAL '1 day'),
  ('sp_7', 's_feedbackswap', 'What makes you click through to a launch?', 'Genuinely curious: the icon, the one-liner, the screenshots or the maker? What gets you to tap Try it?', 'Fatima R.', true, NOW() - INTERVAL '5 days'),
  ('sp_8', 's_opensource', 'Showing a repo next to a live demo: yes or no?', 'I link both. The demo is for people who just want to play and the repo is for people who want to poke around.', 'Devon Hale', true, NOW() - INTERVAL '2 days'),
  ('sp_9', 's_opensource', 'Good first issues for a puzzle engine', 'Tagged ten small issues in my mirror puzzle repo. Happy to review pull requests from first-timers.', 'Lee Tran', true, NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;
