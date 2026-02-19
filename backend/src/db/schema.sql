-- ============================================================
-- SwissDevMap — PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies: core entity
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  uid         TEXT,                      -- Swiss company UID (CHE-xxx.xxx.xxx)
  website     TEXT,
  city        TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tech tags per company
CREATE TABLE IF NOT EXISTS tech_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,             -- e.g. 'React', 'AWS', 'Rust'
  category    TEXT,                      -- 'frontend' | 'backend' | 'cloud' | 'devops'
  source      TEXT,                      -- 'scraper' | 'fingerprint' | 'seed'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, tag)
);

-- Raw job postings (stored for re-analysis)
CREATE TABLE IF NOT EXISTS job_postings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  source      TEXT NOT NULL,             -- 'swissdevjobs' | 'jobsch'
  source_url  TEXT,
  title       TEXT,
  raw_text    TEXT,
  scraped_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for geo queries and tag lookups
CREATE INDEX IF NOT EXISTS idx_companies_lat_lng   ON companies(lat, lng);
CREATE INDEX IF NOT EXISTS idx_tech_tags_tag        ON tech_tags(tag);
CREATE INDEX IF NOT EXISTS idx_tech_tags_company    ON tech_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_tech_tags_category   ON tech_tags(category);
