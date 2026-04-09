-- ============================================================
-- NOC Key Tracker — Full Schema (v2 with Auth + QR Confirmation)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- If upgrading from v1, run the ALTER TABLE section at the bottom.
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES TABLE (linked to auth.users)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'engineer' CHECK (role IN ('noc', 'engineer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed to look up engineers)
CREATE POLICY "Profiles readable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'engineer')
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
  id                       BIGSERIAL PRIMARY KEY,
  site_id                  TEXT NOT NULL,
  engineer_name            TEXT NOT NULL,
  engineer_id              UUID REFERENCES profiles(id),
  checkout_confirmed_by    UUID REFERENCES profiles(id),
  checkin_confirmed_by     UUID REFERENCES profiles(id),
  date_out                 DATE NOT NULL,
  time_out                 TIME NOT NULL,
  date_in                  DATE,
  time_in                  TIME,
  notes                    TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kr_site_id    ON key_records(site_id);
CREATE INDEX IF NOT EXISTS idx_kr_engineer   ON key_records(engineer_name);
CREATE INDEX IF NOT EXISTS idx_kr_date_out   ON key_records(date_out DESC);
CREATE INDEX IF NOT EXISTS idx_kr_engineer_id ON key_records(engineer_id);

ALTER TABLE key_records ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all records
CREATE POLICY "Key records readable by all authenticated"
  ON key_records FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert key records"
  ON key_records FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update (for check-in)
CREATE POLICY "Authenticated users can update key records"
  ON key_records FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────
-- 3. UPGRADE FROM V1 (run if table already exists)
-- ─────────────────────────────────────────
-- ALTER TABLE key_records ADD COLUMN IF NOT EXISTS engineer_id UUID REFERENCES profiles(id);
-- ALTER TABLE key_records ADD COLUMN IF NOT EXISTS checkout_confirmed_by UUID REFERENCES profiles(id);
-- ALTER TABLE key_records ADD COLUMN IF NOT EXISTS checkin_confirmed_by UUID REFERENCES profiles(id);

-- ─────────────────────────────────────────
-- 4. SEED DATA (sample records — optional)
-- ─────────────────────────────────────────
INSERT INTO key_records (site_id, engineer_name, date_out, time_out, date_in, time_in) VALUES
  ('P0132',  'DataCo',         '2026-02-26', '11:39', '2026-02-26', '14:32'),
  ('P0550',  'Ray',            '2026-02-26', '12:01', NULL,         NULL),
  ('P0814',  'Billy M',        '2026-02-27', '09:26', '2026-02-28', '09:39'),
  ('VP0132', 'Eddie H',        '2026-03-02', '07:34', '2026-03-03', '08:03'),
  ('VP0528', 'Eddie H',        '2026-03-02', '07:34', '2026-03-03', '08:03'),
  ('GU1',    'Kevin G',        '2026-03-02', '10:14', '2026-03-02', '11:11'),
  ('P0015',  'Kevin G',        '2026-03-02', '10:14', '2026-03-02', '12:12'),
  ('VP0017', 'Eddie H',        '2026-03-03', '08:05', '2026-03-03', '20:31'),
  ('VP0123', 'Homai U',        '2026-03-03', '09:12', '2026-03-03', '18:00'),
  ('P0101',  'MSA',            '2026-03-03', '11:59', NULL,         NULL),
  ('P0110',  'Eddie N',        '2026-04-06', '07:21', NULL,         NULL),
  ('P0030',  'Homai U',        '2026-04-06', '10:45', '2026-04-06', '12:26')
ON CONFLICT DO NOTHING;
