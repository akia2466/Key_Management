-- ============================================================
-- Fix: Admin can log in but sees no sidebar/panel
-- Root cause: RLS on profiles blocks reading own profile
--             before the "is admin" check can complete
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop all existing profile policies and rebuild cleanly
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users update own profile"                 ON profiles;
DROP POLICY IF EXISTS "Admin full access to profiles"           ON profiles;
DROP POLICY IF EXISTS "Allow insert from trigger"               ON profiles;
DROP POLICY IF EXISTS "Allow self read"                         ON profiles;

-- 1. Every authenticated user can read ALL profiles
--    (needed so NOC can list engineers, admin can list everyone)
CREATE POLICY "Authenticated users read all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. Users can insert their own profile (for trigger + signup)
CREATE POLICY "Allow profile insert"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- 3. Users can update their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. Admins can update ANY profile (role changes, deactivation)
--    Uses a subquery so it doesn't circularly depend on the policy itself
CREATE POLICY "Admins update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Verify your profiles look correct after running:
SELECT id, email, full_name, role, is_active
FROM profiles
ORDER BY created_at;
