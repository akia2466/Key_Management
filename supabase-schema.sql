-- ============================================================
-- NOC Key Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Key log records table
CREATE TABLE IF NOT EXISTS key_records (
  id            BIGSERIAL PRIMARY KEY,
  site_id       TEXT NOT NULL,
  engineer_name TEXT NOT NULL,
  date_out      DATE NOT NULL,
  time_out      TIME NOT NULL,
  date_in       DATE,
  time_in       TIME,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_key_records_site_id       ON key_records(site_id);
CREATE INDEX IF NOT EXISTS idx_key_records_engineer_name ON key_records(engineer_name);
CREATE INDEX IF NOT EXISTS idx_key_records_date_out      ON key_records(date_out DESC);
CREATE INDEX IF NOT EXISTS idx_key_records_date_in       ON key_records(date_in);

-- Enable Row Level Security (open for anon read/write — tighten later with auth)
ALTER TABLE key_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for anon" ON key_records
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Optional: seed with the sample records from the logbook photo
-- ============================================================
INSERT INTO key_records (site_id, engineer_name, date_out, time_out, date_in, time_in) VALUES
  ('P0132',  'DataCo',          '2026-02-26', '11:39', '2026-02-26', '14:32'),
  ('P0550',  'Ray',             '2026-02-26', '12:01', NULL,         NULL),
  ('P0814',  'Billy M',         '2026-02-27', '09:26', '2026-02-28', '09:39'),
  ('P0088',  'Billy M',         '2026-02-27', '09:26', '2026-02-28', '09:39'),
  ('P0526',  'Wildlife',        '2026-02-27', '11:34', NULL,         NULL),
  ('P0527',  'Wildlife',        '2026-02-27', '11:34', NULL,         NULL),
  ('P0532',  'Wildlife',        '2026-02-27', '11:34', NULL,         NULL),
  ('P0Y3',   'Kevin G',         '2026-02-28', '12:00', '2026-02-28', '16:21'),
  ('VP0132', 'Eddie H',         '2026-03-02', '07:34', '2026-03-03', '08:03'),
  ('VP0528', 'Eddie H',         '2026-03-02', '07:34', '2026-03-03', '08:03'),
  ('GU1',    'Kevin G',         '2026-03-02', '10:14', '2026-03-02', '11:11'),
  ('P0015',  'Kevin G',         '2026-03-02', '10:14', '2026-03-02', '12:12'),
  ('P0141',  'Kevin G',         '2026-03-02', '10:14', '2026-03-02', '12:12'),
  ('VP0017', 'Eddie H',         '2026-03-03', '08:05', '2026-03-03', '20:31'),
  ('VP0123', 'Homai U',         '2026-03-03', '09:12', '2026-03-03', '18:00'),
  ('1B129',  'Grville N',       '2026-03-03', '16:00', '2026-03-05', '16:21'),
  ('VP0114', 'Grville N',       '2026-03-03', '10:00', '2026-03-05', '16:21'),
  ('VPB132', 'Joe (Linkonet)',   '2026-03-02', '15:00', '2026-04-04', '17:00'),
  ('P0101',  'MSA',             '2026-03-03', '11:59', NULL,         NULL),
  ('VP0550', 'MSA',             '2026-03-03', '11:59', NULL,         NULL),
  ('P0141',  'Eddie H',         '2026-04-03', '09:08', '2026-04-03', '17:07'),
  ('P0123',  'Homai U',         '2026-04-04', '10:03', '2026-04-03', '17:07'),
  ('P0141',  'Eddie H',         '2026-04-05', '07:45', '2026-04-05', '20:12'),
  ('POU2',   'Homai U',         '2026-04-05', '11:59', '2026-04-05', '15:47'),
  ('P0124',  'Billy M',         '2026-04-05', '16:21', '2026-04-05', '19:30'),
  ('P0110',  'Eddie N',         '2026-04-06', '07:21', NULL,         NULL),
  ('P0030',  'Homai U',         '2026-04-06', '10:45', '2026-04-06', '12:26');
