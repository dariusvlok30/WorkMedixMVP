-- ============================================================
-- WorkMedix — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL,
  contact_person  TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  address         TEXT NOT NULL,
  employee_count  INTEGER NOT NULL CHECK (employee_count > 0),
  screening_type  TEXT NOT NULL,
  preferred_dates DATE[] NOT NULL,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,          -- Supabase Storage path (not public URL)
  file_type   TEXT NOT NULL,          -- e.g. "PDF", "PNG"
  file_size   INTEGER,                -- bytes
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast document lookups by booking
CREATE INDEX IF NOT EXISTS idx_documents_booking_id ON documents(booking_id);

-- Index for booking status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Index for booking date ordering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at ON bookings
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON bookings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Public (anon) can INSERT bookings — for the public booking form
CREATE POLICY "anon_insert_bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role (used by our API routes) has full access
-- NOTE: The service role key bypasses RLS automatically.
-- These policies are fallbacks for any direct client usage.
CREATE POLICY "service_role_all_bookings"
  ON bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_documents"
  ON documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SUPABASE STORAGE BUCKET
-- Run these manually in Supabase Dashboard → Storage → New Bucket
-- OR uncomment and run via SQL (requires storage extension):
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT DO NOTHING;

-- Storage RLS: only service role can read/write
-- INSERT INTO storage.policies (name, bucket_id, definition, check_expression, command)
-- VALUES
--   ('service_role_read', 'documents', 'true', null, 'SELECT'),
--   ('service_role_insert', 'documents', null, 'true', 'INSERT'),
--   ('service_role_delete', 'documents', 'true', null, 'DELETE');

-- ============================================================
-- SAMPLE DATA (optional — remove before production)
-- ============================================================
-- INSERT INTO bookings (company_name, contact_person, email, phone, address, employee_count, screening_type, preferred_dates, notes, status)
-- VALUES
--   ('Acme Mining Corp', 'John Dlamini', 'john@acmemining.co.za', '+27110001111', '1 Mine Rd, Rustenburg', 45, 'Occupational Health', ARRAY['2026-05-12', '2026-05-13']::DATE[], 'Shift workers — prefer early morning slots', 'pending'),
--   ('TechBuild SA', 'Sara Nkosi', 'sara@techbuild.co.za', '+27110002222', '45 Tech Park, Midrand', 12, 'Pre-Employment', ARRAY['2026-04-28']::DATE[], NULL, 'confirmed'),
--   ('LogiRoute Ltd', 'Mike van der Berg', 'mike@logiroute.co.za', '+27110003333', '88 Depot Ave, Durban', 200, 'Drug & Alcohol', ARRAY['2026-06-01', '2026-06-02']::DATE[], 'Random pool testing for drivers', 'pending');
