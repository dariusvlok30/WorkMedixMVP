-- ============================================================
-- WorkMedix OHS — Extended Schema (v2)
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  registration_number TEXT,
  industry_type       TEXT,
  contact_person      TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  address             TEXT NOT NULL,
  clerk_user_id       TEXT,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_clerk_user_id ON companies(clerk_user_id);

-- ============================================================
-- WORKERS TABLE (registered by SA ID or passport)
-- ============================================================
CREATE TABLE IF NOT EXISTS workers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_number      TEXT NOT NULL UNIQUE,
  id_type        TEXT NOT NULL DEFAULT 'sa_id'
                 CHECK (id_type IN ('sa_id', 'passport')),
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  date_of_birth  DATE,
  gender         TEXT CHECK (gender IN ('male', 'female', 'other')),
  race           TEXT CHECK (race IN ('african', 'coloured', 'indian', 'white', 'other')),
  phone          TEXT,
  email          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_id_number ON workers(id_number);
CREATE INDEX IF NOT EXISTS idx_workers_last_name ON workers(last_name);

-- ============================================================
-- COMPANY WORKERS (roster — links companies to workers)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_workers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  worker_id           UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  employee_number     TEXT,
  department          TEXT,
  job_title           TEXT,
  occupation_class    TEXT,
  date_of_employment  DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_company_workers_company_id ON company_workers(company_id);
CREATE INDEX IF NOT EXISTS idx_company_workers_worker_id ON company_workers(worker_id);

-- ============================================================
-- SCREENING PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS screening_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  price_cents     INTEGER NOT NULL DEFAULT 0,
  tests_included  TEXT[] NOT NULL DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default packages
INSERT INTO screening_packages (code, name, description, price_cents, tests_included) VALUES
  ('FULL',   'Full OHS Package',      'Complete occupational health screening including spirometry, audiometry, vision, blood pressure, height/weight and urine', 1750000, ARRAY['spirometry','audiometry','vision','blood_pressure','height_weight','urine']),
  ('AUDIO',  'Audiometry Only',       'Pure tone audiometry hearing assessment', 500000, ARRAY['audiometry']),
  ('VISION', 'Vision Screening',      'Keystone vision screening including acuity, colour and depth perception', 500000, ARRAY['vision']),
  ('SPIRO',  'Spirometry Only',       'Lung function / spirometry test', 250000, ARRAY['spirometry']),
  ('PRE',    'Pre-Employment Medical','Full pre-employment health assessment', 1750000, ARRAY['spirometry','audiometry','vision','blood_pressure','height_weight','urine','general']),
  ('ANNUAL', 'Annual Review',         'Annual occupational health review', 1750000, ARRAY['spirometry','audiometry','vision','blood_pressure','height_weight','urine'])
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SCREENING SESSIONS (group booking for a company)
-- ============================================================
CREATE TABLE IF NOT EXISTS screening_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  package_id      UUID NOT NULL REFERENCES screening_packages(id) ON DELETE RESTRICT,
  session_date    DATE NOT NULL,
  location        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_company_id ON screening_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON screening_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON screening_sessions(status);

-- ============================================================
-- WORKER APPOINTMENTS (individual worker in a session)
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES screening_sessions(id) ON DELETE CASCADE,
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  scheduled_time  TIME,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'no_show', 'cancelled')),
  clinician_id    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_appointments_session_id ON worker_appointments(session_id);
CREATE INDEX IF NOT EXISTS idx_appointments_worker_id ON worker_appointments(worker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON worker_appointments(status);

-- ============================================================
-- SCREENING RESULTS (per test per appointment)
-- ============================================================
CREATE TABLE IF NOT EXISTS screening_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id        UUID NOT NULL REFERENCES worker_appointments(id) ON DELETE CASCADE,
  worker_id             UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  test_type             TEXT NOT NULL
                        CHECK (test_type IN ('spirometry','audiometry','vision','blood_pressure','height_weight','urine','ecg','general')),
  result_data           JSONB NOT NULL DEFAULT '{}',
  result_status         TEXT NOT NULL DEFAULT 'normal'
                        CHECK (result_status IN ('normal','abnormal','borderline','refer')),
  measured_by           TEXT,
  device_serial_number  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_appointment_id ON screening_results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_results_worker_id ON screening_results(worker_id);
CREATE INDEX IF NOT EXISTS idx_results_test_type ON screening_results(test_type);

-- ============================================================
-- FITNESS CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS fitness_certificates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id     UUID NOT NULL REFERENCES worker_appointments(id) ON DELETE RESTRICT,
  worker_id          UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  certificate_number TEXT NOT NULL UNIQUE,
  fitness_status     TEXT NOT NULL
                     CHECK (fitness_status IN ('fit','fit_with_restrictions','temporarily_unfit','permanently_unfit')),
  valid_until        DATE,
  restrictions       TEXT[] DEFAULT '{}',
  remarks            TEXT,
  issued_by          TEXT NOT NULL,
  issued_by_name     TEXT NOT NULL,
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pdf_url            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certs_worker_id ON fitness_certificates(worker_id);
CREATE INDEX IF NOT EXISTS idx_certs_appointment_id ON fitness_certificates(appointment_id);
CREATE INDEX IF NOT EXISTS idx_certs_certificate_number ON fitness_certificates(certificate_number);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at_companies ON companies;
CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_workers ON workers;
CREATE TRIGGER set_updated_at_workers
  BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_packages ON screening_packages;
CREATE TRIGGER set_updated_at_packages
  BEFORE UPDATE ON screening_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_sessions ON screening_sessions;
CREATE TRIGGER set_updated_at_sessions
  BEFORE UPDATE ON screening_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_appointments ON worker_appointments;
CREATE TRIGGER set_updated_at_appointments
  BEFORE UPDATE ON worker_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_certificates ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all new tables
CREATE POLICY "service_role_all_companies" ON companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_workers" ON workers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_company_workers" ON company_workers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_packages" ON screening_packages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sessions" ON screening_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_appointments" ON worker_appointments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_results" ON screening_results FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_certs" ON fitness_certificates FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- CERTIFICATE NUMBER SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS cert_number_seq START WITH 1000;

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('cert_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
