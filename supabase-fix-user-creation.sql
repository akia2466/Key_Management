-- ============================================================
-- NOC Key Tracker — User Creation Fix
-- Run each STEP separately in Supabase SQL Editor
-- Check for errors after each one before proceeding
-- ============================================================


-- ─────────────────────────────────────────
-- STEP 1: Fix the role constraint
-- (v1 schema only allowed 'noc' and 'engineer', not 'admin')
-- ─────────────────────────────────────────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'noc', 'engineer'));


-- ─────────────────────────────────────────
-- STEP 2: Add is_active column if missing
-- ─────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;


-- ─────────────────────────────────────────
-- STEP 3: Replace the trigger function
-- (fixes any bugs in previous version)
-- ─────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────
-- STEP 4: Fix RLS — allow the trigger to insert profiles
-- The trigger runs as SECURITY DEFINER so it bypasses RLS,
-- but we also need an INSERT policy for direct inserts
-- ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users update own profile"                 ON profiles;
DROP POLICY IF EXISTS "Admin full access to profiles"           ON profiles;
DROP POLICY IF EXISTS "Allow insert from trigger"               ON profiles;

-- Anyone authenticated can read all profiles
CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role (trigger) can insert
CREATE POLICY "Allow insert from trigger"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admin full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ─────────────────────────────────────────
-- STEP 5: Verify — check your profiles table looks correct
-- ─────────────────────────────────────────
SELECT id, email, full_name, role, is_active, created_at
FROM profiles
ORDER BY created_at DESC;


-- ─────────────────────────────────────────
-- STEP 6: After creating a user via Supabase Dashboard,
-- run this to make them admin (replace the email):
-- ─────────────────────────────────────────
-- UPDATE profiles
-- SET role = 'admin', full_name = 'Your Full Name'
-- WHERE email = 'your-admin@example.com';
