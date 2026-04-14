-- ============================================================
-- NOC Key Tracker — Full Schema v4
-- Changes: supervisor role, company field, engineer_company on records
-- Safe to run on fresh DB or as upgrade from v1/v2/v3
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'engineer'
               CHECK (role IN ('admin', 'supervisor', 'noc', 'engineer')),
  company    TEXT NOT NULL DEFAULT 'Vodafone PNG',
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade: add new columns if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT 'Vodafone PNG';
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'supervisor', 'noc', 'engineer'));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read all profiles"    ON profiles;
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile insert"                     ON profiles;
DROP POLICY IF EXISTS "Users update own profile"                 ON profiles;
DROP POLICY IF EXISTS "Admins update any profile"                ON profiles;
DROP POLICY IF EXISTS "profiles_select"                          ON profiles;
DROP POLICY IF EXISTS "profiles_insert"                          ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"                      ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin"                    ON profiles;

CREATE POLICY "profiles_select"       ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert"       ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Auto-create profile on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────
-- 2. KEY RECORDS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS key_records (
  id                    BIGSERIAL PRIMARY KEY,
  site_id               TEXT NOT NULL,
  engineer_name         TEXT NOT NULL,
  engineer_company      TEXT,
  engineer_id           UUID REFERENCES profiles(id),
  checkout_confirmed_by UUID REFERENCES profiles(id),
  checkin_confirmed_by  UUID REFERENCES profiles(id),
  date_out              DATE NOT NULL,
  time_out              TIME NOT NULL,
  date_in               DATE,
  time_in               TIME,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade: add new columns if missing
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS engineer_company      TEXT;
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS engineer_id           UUID REFERENCES profiles(id);
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS checkout_confirmed_by UUID REFERENCES profiles(id);
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS checkin_confirmed_by  UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_kr_site_id       ON key_records(site_id);
CREATE INDEX IF NOT EXISTS idx_kr_engineer      ON key_records(engineer_name);
CREATE INDEX IF NOT EXISTS idx_kr_date_out      ON key_records(date_out DESC);
CREATE INDEX IF NOT EXISTS idx_kr_engineer_id   ON key_records(engineer_id);
CREATE INDEX IF NOT EXISTS idx_kr_company       ON key_records(engineer_company);

ALTER TABLE key_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Key records readable by all authenticated"    ON key_records;
DROP POLICY IF EXISTS "Authenticated users can insert key records"   ON key_records;
DROP POLICY IF EXISTS "Authenticated users can update key records"   ON key_records;

CREATE POLICY "kr_select" ON key_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "kr_insert" ON key_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "kr_update" ON key_records FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ─────────────────────────────────────────
-- 3. SEED DATA — only on empty table
-- ─────────────────────────────────────────
INSERT INTO key_records (site_id, engineer_name, engineer_company, date_out, time_out, date_in, time_in)
SELECT * FROM (VALUES
  ('P0132',  'DataCo',   'Vodafone PNG',   '2026-02-26'::date, '11:39'::time, '2026-02-26'::date, '14:32'::time),
  ('P0550',  'Ray',      'Vodafone PNG',   '2026-02-26'::date, '12:01'::time, NULL::date,          NULL::time),
  ('P0814',  'Billy M',  'Huawei',         '2026-02-27'::date, '09:26'::time, '2026-02-28'::date, '09:39'::time),
  ('VP0132', 'Eddie H',  'Ericsson',       '2026-03-02'::date, '07:34'::time, '2026-03-03'::date, '08:03'::time),
  ('VP0528', 'Eddie H',  'Ericsson',       '2026-03-02'::date, '07:34'::time, '2026-03-03'::date, '08:03'::time),
  ('GU1',    'Kevin G',  'Vodafone PNG',   '2026-03-02'::date, '10:14'::time, '2026-03-02'::date, '11:11'::time),
  ('P0015',  'Kevin G',  'Vodafone PNG',   '2026-03-02'::date, '10:14'::time, '2026-03-02'::date, '12:12'::time),
  ('VP0017', 'Eddie H',  'Ericsson',       '2026-03-03'::date, '08:05'::time, '2026-03-03'::date, '20:31'::time),
  ('VP0123', 'Homai U',  'Nokia',          '2026-03-03'::date, '09:12'::time, '2026-03-03'::date, '18:00'::time),
  ('P0101',  'MSA',      'Vodafone PNG',   '2026-03-03'::date, '11:59'::time, NULL::date,          NULL::time),
  ('P0110',  'Eddie N',  'Vodafone PNG',   '2026-04-06'::date, '07:21'::time, NULL::date,          NULL::time),
  ('P0030',  'Homai U',  'Nokia',          '2026-04-06'::date, '10:45'::time, '2026-04-06'::date, '12:26'::time)
) AS v(site_id, engineer_name, engineer_company, date_out, time_out, date_in, time_in)
WHERE NOT EXISTS (SELECT 1 FROM key_records LIMIT 1);


-- ─────────────────────────────────────────
-- 4. SET UP YOUR ADMIN ACCOUNT
-- After creating user in Supabase Auth dashboard, run:
--
--   UPDATE profiles
--   SET role = 'admin', full_name = 'Your Name', company = 'Vodafone PNG'
--   WHERE email = 'your-admin@example.com';
-- ─────────────────────────────────────────
