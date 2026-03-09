-- 1. Create NOTIFICATIONS Table (Only if it doesn't exist)
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  message       TEXT,
  type          TEXT DEFAULT 'info', -- inquiry, like, promote, price_alert
  icon          TEXT,
  is_read       BOOLEAN DEFAULT false,
  metadata      JSONB,               -- storing { listing_id: '...' }
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create FAVORITES Table (Only if it doesn't exist)
CREATE TABLE IF NOT EXISTS favorites (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL, -- references profiles.id but kept loose for demo
  listing_id    UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 3. Create REPORTS Table (Only if it doesn't exist)
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS and Policies (Bypass for Demo Mode)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_favorites" ON favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reports" ON reports FOR ALL USING (true) WITH CHECK (true);

-- 5. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
