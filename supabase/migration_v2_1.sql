-- WorkMedix OHS — Migration v2.1
-- Run this in Supabase SQL editor after schema_v2.sql

-- 1. Add device_source column to screening_results (tracks which hardware produced the data)
ALTER TABLE screening_results
  ADD COLUMN IF NOT EXISTS device_source TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Add unique constraint so device bridge can upsert (one result per test per appointment)
ALTER TABLE screening_results
  DROP CONSTRAINT IF EXISTS uq_result_appt_test;

ALTER TABLE screening_results
  ADD CONSTRAINT uq_result_appt_test UNIQUE (appointment_id, test_type);

-- 3. Add middle_name, occupation, department, division to workers (used by Annexure 3)
ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS middle_name        TEXT,
  ADD COLUMN IF NOT EXISTS occupation         TEXT,
  ADD COLUMN IF NOT EXISTS department         TEXT,
  ADD COLUMN IF NOT EXISTS division           TEXT,
  ADD COLUMN IF NOT EXISTS noise_exposure     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS next_exam_date     DATE;

-- 4. Add portal_notes to companies (admin can add notes visible to the client)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS portal_notes TEXT;

-- 5. Admins table (if not already created)
CREATE TABLE IF NOT EXISTS admins (
  email       TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'service_role_all_admins'
  ) THEN
    CREATE POLICY "service_role_all_admins" ON admins FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insert your admin email
INSERT INTO admins (email) VALUES ('dariusvlok10@gmail.com') ON CONFLICT DO NOTHING;
