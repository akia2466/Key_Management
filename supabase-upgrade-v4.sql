-- ============================================================
-- NOC Key Tracker — Upgrade Script v4
-- Run this if you already have an existing database
-- ============================================================

-- 1. Add company column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT 'Vodafone PNG';

-- 2. Add engineer_company column to key_records
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS engineer_company TEXT;

-- 3. Add supervisor to role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'supervisor', 'noc', 'engineer'));

-- 4. Update trigger to handle company and supervisor
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, company, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'),
    COALESCE(NEW.raw_user_meta_data->>'company', 'Vodafone PNG'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Verify
SELECT id, email, full_name, role, company, is_active FROM profiles ORDER BY created_at;
