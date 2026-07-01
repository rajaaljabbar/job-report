-- ============================================================
-- MIGRATION: Guest View Feature
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Auto-generate username from email prefix for existing users
UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;

-- 2. Function: get public profile (bypass RLS — SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_public_profile(target_username TEXT)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  "position" VARCHAR,
  avatar_url TEXT,
  username VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.position, u.avatar_url, u.username
  FROM users u
  WHERE u.username = target_username;
END;
$$;

-- 3. Function: get public reports (bypass RLS)
CREATE OR REPLACE FUNCTION get_public_reports(
  target_username TEXT,
  filter_category TEXT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  date_worked DATE,
  title VARCHAR,
  description TEXT,
  user_name VARCHAR,
  created_at TIMESTAMPTZ,
  jobdesc_text TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id, 
    r.category::TEXT, 
    r.date_worked, 
    r.title, 
    r.description, 
    r.user_name, 
    r.created_at,
    j.text AS jobdesc_text
  FROM reports r
  JOIN users u ON r.user_id = u.id
  LEFT JOIN jobdescs j ON r.jobdesc_id = j.id
  WHERE u.username = target_username
    AND (filter_category IS NULL OR r.category::TEXT = filter_category)
    AND (start_date IS NULL OR r.date_worked >= start_date)
    AND (end_date IS NULL OR r.date_worked <= end_date)
  ORDER BY r.date_worked DESC
  LIMIT 200;
END;
$$;

-- 4. Function: get public monthly stats (bypass RLS, with year/month params)
CREATE OR REPLACE FUNCTION get_public_monthly_stats(
  target_username TEXT,
  target_year INT DEFAULT NULL,
  target_month INT DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  date_worked DATE
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _year INT;
  _month INT;
BEGIN
  _year := COALESCE(target_year, EXTRACT(YEAR FROM NOW())::INT);
  _month := COALESCE(target_month, EXTRACT(MONTH FROM NOW())::INT);
  
  RETURN QUERY
  SELECT r.category::TEXT, r.date_worked
  FROM reports r
  JOIN users u ON r.user_id = u.id
  WHERE u.username = target_username
    AND r.date_worked >= make_date(_year, _month, 1)
    AND r.date_worked <= (make_date(_year, _month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
END;
$$;

-- 5. Function: get public report evidence (bypass RLS)
CREATE OR REPLACE FUNCTION get_public_evidence(report_ids UUID[])
RETURNS TABLE (
  id UUID,
  report_id UUID,
  file_url TEXT,
  file_name VARCHAR,
  file_size INT,
  mime_type VARCHAR
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.report_id, e.file_url, e.file_name, e.file_size, e.mime_type
  FROM report_evidence e
  WHERE e.report_id = ANY(report_ids);
END;
$$;

-- 6. Ensure all functions are accessible to anon role
GRANT EXECUTE ON FUNCTION get_public_profile(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_reports(TEXT, TEXT, DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_monthly_stats(TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_public_evidence(UUID[]) TO anon, authenticated;
