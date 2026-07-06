-- ================================================================
-- V47: ADD EXCLUDE FROM HOURLY GRAPH TO EMPLOYEE PROFILES
-- ================================================================

ALTER TABLE employee_profiles 
ADD COLUMN IF NOT EXISTS exclude_from_hourly_graph BOOLEAN NOT NULL DEFAULT FALSE;
