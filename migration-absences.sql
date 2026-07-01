-- ============================================================
-- MIGRATION: Absences (Cuti / Sakit / Izin)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create absence type enum & table
CREATE TYPE absence_type AS ENUM ('cuti', 'sakit', 'izin');

CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type absence_type NOT NULL DEFAULT 'izin',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_absences_user_date ON absences(user_id, date);

-- 2. RLS
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRUD own absences" ON absences
  FOR ALL USING (auth.uid() = user_id);

-- 3. Function: get user absences for guest view (bypass RLS)
CREATE OR REPLACE FUNCTION get_public_absences(
  target_username TEXT,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.date, a.type::TEXT
  FROM absences a
  JOIN users u ON a.user_id = u.id
  WHERE u.username = target_username
    AND (start_date IS NULL OR a.date >= start_date)
    AND (end_date IS NULL OR a.date <= end_date);
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_absences(TEXT, DATE, DATE) TO anon, authenticated;
