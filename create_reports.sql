-- ── REPORTS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_all"
  ON reports FOR INSERT WITH CHECK (true);

CREATE POLICY "reports_read_all"
  ON reports FOR SELECT USING (true);
