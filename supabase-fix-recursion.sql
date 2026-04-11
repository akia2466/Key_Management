-- ============================================================
-- CRITICAL FIX: Infinite recursion in profiles RLS policy
-- The "Admin" policy was querying the profiles table to check
-- if the user is admin — which triggers the policy again → loop
--
-- Solution: use auth.jwt() to read the role from the JWT token
-- instead of querying the profiles table inside the policy.
--
-- Run ALL of this in one go in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop ALL existing policies on profiles (clean slate)
DROP POLICY IF EXISTS "Authenticated users read all profiles"  ON profiles;
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow self read"                        ON profiles;
DROP POLICY IF EXISTS "Allow profile insert"                   ON profiles;
DROP POLICY IF EXISTS "Allow insert from trigger"              ON profiles;
DROP POLICY IF EXISTS "Users update own profile"               ON profiles;
DROP POLICY IF EXISTS "Admins update any profile"              ON profiles;
DROP POLICY IF EXISTS "Admin full access to profiles"          ON profiles;

-- Step 2: Simple, non-recursive policies

-- Any logged-in user can read all profiles (no self-referencing check)
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- The signup trigger (service role) and users can insert
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own row
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any row — reads role from JWT, NOT from profiles table
-- This avoids the recursive query entirely
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Step 3: Also fix the trigger function to be explicit about schema
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

-- Step 4: Verify — this should return your profile without error
SELECT id, email, full_name, role, is_active FROM profiles;
