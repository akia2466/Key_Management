-- ============================================================
-- Backfill engineer_company on existing key_records
-- from the profiles table
-- Run once in Supabase SQL Editor
-- ============================================================

UPDATE key_records kr
SET engineer_company = p.company
FROM profiles p
WHERE kr.engineer_name = p.full_name
  AND (kr.engineer_company IS NULL OR kr.engineer_company = '');

-- Verify how many rows were updated:
SELECT engineer_name, engineer_company, COUNT(*) as records
FROM key_records
GROUP BY engineer_name, engineer_company
ORDER BY engineer_name;
