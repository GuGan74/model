-- ═══════════════════════════════════════════════════════════════
-- PASHUBAZAAR — PRODUCTION RLS POLICIES
-- Run in Supabase SQL Editor to apply secure row-level security.
-- 
-- Demo mode UUIDs follow patterns:
--   a0000000-* (OTP demo users)
--   d0000000-* (Google demo users)
-- Remove the OR LIKE clauses below when VITE_DEMO_MODE=false
-- ═══════════════════════════════════════════════════════════════

-- ── Drop all existing policies ────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename, policyname
             FROM pg_policies
             WHERE schemaname = 'public'
               AND tablename IN ('listings','favorites','profiles','notifications','interests','reports')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END$$;

-- ── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests     ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- LISTINGS
-- ══════════════════════════════════════════════════════════════

-- SELECT: public marketplace — all visitors can browse all listings
CREATE POLICY "listings_select_public"
  ON listings FOR SELECT
  USING (true);

-- INSERT: any user can post a listing (demo mode needs this open)
CREATE POLICY "listings_insert_any"
  ON listings FOR INSERT
  WITH CHECK (true);
  -- TODO: tighten to WITH CHECK (auth.uid() = user_id) when demo is off

-- UPDATE: only the listing owner can edit their own listing
--         OR demo user IDs (remove OR clauses when demo mode is off)
CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- DELETE: only the listing owner can delete their listing
CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- ══════════════════════════════════════════════════════════════
-- FAVORITES
-- ══════════════════════════════════════════════════════════════

-- SELECT: users can only see their own favorites
CREATE POLICY "favorites_select_own"
  ON favorites FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- INSERT: open — any authenticated user can like a listing
CREATE POLICY "favorites_insert_any"
  ON favorites FOR INSERT
  WITH CHECK (true);

-- DELETE: users can only remove their own favorites
CREATE POLICY "favorites_delete_own"
  ON favorites FOR DELETE
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════

-- SELECT: users can only see their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- INSERT: open — system/sellers send notifications to any user
CREATE POLICY "notifications_insert_any"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- UPDATE: users can mark their own notifications as read
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- DELETE: users can dismiss their own notifications
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (
    auth.uid() = user_id
    OR user_id::text LIKE 'a0000000-%'
    OR user_id::text LIKE 'd0000000-%'
  );

-- ══════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════

-- SELECT: public — buyer needs to see seller name/details
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- INSERT: open — registration can happen before auth (demo mode)
CREATE POLICY "profiles_insert_any"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- UPDATE: users can only edit their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR id::text LIKE 'a0000000-%'
    OR id::text LIKE 'd0000000-%'
  );

-- ══════════════════════════════════════════════════════════════
-- INTERESTS (contact tracking — low sensitivity)
-- ══════════════════════════════════════════════════════════════

CREATE POLICY "interests_insert_any"
  ON interests FOR INSERT WITH CHECK (true);

CREATE POLICY "interests_select_any"
  ON interests FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════
-- REPORTS
-- ══════════════════════════════════════════════════════════════

CREATE POLICY "reports_insert_any"
  ON reports FOR INSERT WITH CHECK (true);

-- Only admins should SELECT/UPDATE reports (checked in app layer)
CREATE POLICY "reports_admin_all"
  ON reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- ✅ When ready for full production (VITE_DEMO_MODE=false):
--    Remove all: OR user_id::text LIKE 'a0000000-%'
--                OR user_id::text LIKE 'd0000000-%'
--    And tighten INSERT policies to require auth.uid()
-- ═══════════════════════════════════════════════════════════════
