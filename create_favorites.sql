CREATE TABLE IF NOT EXISTS favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (demo mode) or read
CREATE POLICY "favorites_insert_all" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "favorites_select_all" ON favorites FOR SELECT USING (true);
CREATE POLICY "favorites_delete_all" ON favorites FOR DELETE USING (true);
