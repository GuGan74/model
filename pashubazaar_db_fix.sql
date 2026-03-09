-- ═══════════════════════════════════════════════════════════════
--  PASHUBAZAAR — CORRECTED DATABASE FIX
--  This fixes column names to match the React app
--  Paste in Supabase SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- Drop old listings table (it had wrong column names)
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ── 1. PROFILES TABLE ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY,
  full_name     TEXT,
  phone         TEXT,
  email         TEXT,
  role          TEXT DEFAULT 'animal-buyer',
  language      TEXT DEFAULT 'English',
  location      TEXT,
  avatar_url    TEXT,
  rating        NUMERIC(3,1) DEFAULT 0,
  total_listings INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. LISTINGS TABLE (columns match React SellPage exactly) ─────
CREATE TABLE IF NOT EXISTS listings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID,              -- seller's profile id
  title            TEXT,
  category         TEXT,              -- cow | buffalo | goat | sheep | poultry | dog | cat | bird
  breed            TEXT,
  age_years        NUMERIC,
  weight_kg        NUMERIC,
  milk_yield_liters NUMERIC,          -- litres per day (dairy animals)
  is_vaccinated    BOOLEAN DEFAULT false,
  is_pregnant      BOOLEAN DEFAULT false,
  is_verified      BOOLEAN DEFAULT false,
  is_promoted      BOOLEAN DEFAULT false,
  for_adoption     BOOLEAN DEFAULT false,
  price            INTEGER DEFAULT 0,
  location         TEXT,              -- city/village name
  state            TEXT,
  description      TEXT,
  image_url        TEXT,              -- primary photo URL
  status           TEXT DEFAULT 'active',  -- active | sold | expired
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days')
);

-- ── 3. INTERESTS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interests (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID,
  listing_id    TEXT,
  listing_title TEXT,
  contacted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- PROFILES: open read/write for now (demo mode users don't have auth.uid)
CREATE POLICY "profiles_open"
  ON profiles FOR ALL USING (true) WITH CHECK (true);

-- LISTINGS: open read for all, open write for all (demo friendly)
--   ⚡ When Supabase Phone OTP / Google Auth is live,
--   replace this with: WITH CHECK (auth.uid() = user_id)
CREATE POLICY "listings_read_all"
  ON listings FOR SELECT USING (true);

CREATE POLICY "listings_insert_all"
  ON listings FOR INSERT WITH CHECK (true);

CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE USING (true);

CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE USING (true);

-- INTERESTS: open insert
CREATE POLICY "interests_insert_all"
  ON interests FOR INSERT WITH CHECK (true);
CREATE POLICY "interests_select_all"
  ON interests FOR SELECT USING (true);

-- ── 5. INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_category  ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status    ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_user      ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_state     ON listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_price     ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created   ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_promoted  ON listings(is_promoted);

-- ── 6. Enable Realtime on listings ──────────────────────────────
-- Go to Supabase → Database → Replication → enable listings table
-- OR run:
ALTER PUBLICATION supabase_realtime ADD TABLE listings;

-- ═══════════════════════════════════════════════════════════════
--  ✓ profiles   — user accounts
--  ✓ listings   — animal/pet posts (columns match React code)
--  ✓ interests  — buyer contacts
--  RLS is open for demo mode. Tighten when real auth is live.
-- ═══════════════════════════════════════════════════════════════
