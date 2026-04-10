-- ============================================================
-- NOC Key Tracker — Full Schema v3
-- Adds: admin role, is_active flag, invite-only registration
-- Safe to run on fresh DB or as upgrade from v1/v2
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'engineer'
               CHECK (role IN ('admin', 'noc', 'engineer')),
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade from v2: add missing columns if needed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'noc', 'engineer'));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON profiles;
CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin full access to profiles" ON profiles;
CREATE POLICY "Admin full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer'),
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

-- Upgrade from v1/v2: safely add new columns
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS engineer_id           UUID REFERENCES profiles(id);
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS checkout_confirmed_by UUID REFERENCES profiles(id);
ALTER TABLE key_records ADD COLUMN IF NOT EXISTS checkin_confirmed_by  UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_kr_site_id     ON key_records(site_id);
CREATE INDEX IF NOT EXISTS idx_kr_engineer    ON key_records(engineer_name);
CREATE INDEX IF NOT EXISTS idx_kr_date_out    ON key_records(date_out DESC);
CREATE INDEX IF NOT EXISTS idx_kr_engineer_id ON key_records(engineer_id);

ALTER TABLE key_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Key records readable by all authenticated" ON key_records;
CREATE POLICY "Key records readable by all authenticated"
  ON key_records FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert key records" ON key_records;
CREATE POLICY "Authenticated users can insert key records"
  ON key_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update key records" ON key_records;
CREATE POLICY "Authenticated users can update key records"
  ON key_records FOR UPDATE USING (auth.role() = 'authenticated');


-- ─────────────────────────────────────────
-- 3. SEED DATA — only on empty table
-- ─────────────────────────────────────────
INSERT INTO key_records (site_id, engineer_name, date_out, time_out, date_in, time_in)
SELECT * FROM (VALUES
  ('P0132',  'DataCo',   '2026-02-26'::date, '11:39'::time, '2026-02-26'::date, '14:32'::time),
  ('P0550',  'Ray',      '2026-02-26'::date, '12:01'::time, NULL::date,          NULL::time),
  ('P0814',  'Billy M',  '2026-02-27'::date, '09:26'::time, '2026-02-28'::date, '09:39'::time),
  ('VP0132', 'Eddie H',  '2026-03-02'::date, '07:34'::time, '2026-03-03'::date, '08:03'::time),
  ('VP0528', 'Eddie H',  '2026-03-02'::date, '07:34'::time, '2026-03-03'::date, '08:03'::time),
  ('GU1',    'Kevin G',  '2026-03-02'::date, '10:14'::time, '2026-03-02'::date, '11:11'::time),
  ('P0015',  'Kevin G',  '2026-03-02'::date, '10:14'::time, '2026-03-02'::date, '12:12'::time),
  ('VP0017', 'Eddie H',  '2026-03-03'::date, '08:05'::time, '2026-03-03'::date, '20:31'::time),
  ('VP0123', 'Homai U',  '2026-03-03'::date, '09:12'::time, '2026-03-03'::date, '18:00'::time),
  ('P0101',  'MSA',      '2026-03-03'::date, '11:59'::time, NULL::date,          NULL::time),
  ('P0110',  'Eddie N',  '2026-04-06'::date, '07:21'::time, NULL::date,          NULL::time),
  ('P0030',  'Homai U',  '2026-04-06'::date, '10:45'::time, '2026-04-06'::date, '12:26'::time)
) AS v(site_id, engineer_name, date_out, time_out, date_in, time_in)
WHERE NOT EXISTS (SELECT 1 FROM key_records LIMIT 1);


-- ─────────────────────────────────────────
-- 4. CREATE YOUR ADMIN ACCOUNT
-- ─────────────────────────────────────────
-- Step 1: Go to Supabase → Authentication → Users → "Add User"
--         Enter your admin email + password, click "Create User"
--
-- Step 2: Run THIS query (replace the email with yours):
--
--   UPDATE profiles
--   SET role = 'admin', full_name = 'System Admin'
--   WHERE email = 'your-admin@example.com';
--
-- That's it — you can now log in and manage all users from /admin
-- ─────────────────────────────────────────
