-- ── NOTIFICATIONS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  message       TEXT,
  type          TEXT DEFAULT 'info', -- info, success, warning, promote, inquiry, like
  icon          TEXT,
  is_read       BOOLEAN DEFAULT false,
  metadata      JSONB,               -- for storing IDs like listing_id
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "notifications_read_own"
  ON notifications FOR SELECT USING (auth.uid() = user_id OR true); -- OR true for demo mode

CREATE POLICY "notifications_insert_all"
  ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE USING (auth.uid() = user_id OR true);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
