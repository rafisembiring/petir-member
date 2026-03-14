-- ============================================================
-- Run this in Neon Console → SQL Editor
-- ============================================================

-- OPTION A: Fresh table (if you haven't created one yet)
CREATE TABLE IF NOT EXISTS members (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id    TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  jabatan      TEXT,
  tempat_lahir TEXT,
  tgl_lahir    DATE,
  jenis_kelamin TEXT,
  agama        TEXT,
  address      TEXT,
  photo_url    TEXT,
  status       TEXT DEFAULT 'aktif',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- OPTION B: Add new columns to existing table (run if table already exists)
ALTER TABLE members ADD COLUMN IF NOT EXISTS jabatan      TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tempat_lahir TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tgl_lahir    DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS agama        TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS address      TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'aktif';

-- Drop old sequence if it exists (no longer needed)
DROP SEQUENCE IF EXISTS member_seq;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
