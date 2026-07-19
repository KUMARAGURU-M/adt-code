-- Add employee_status column to employee_profiles table
-- Supports: Active, Inactive, Relieved, Long Leave, Abscond
ALTER TABLE employee_profiles
    ADD COLUMN IF NOT EXISTS employee_status VARCHAR(20) NOT NULL DEFAULT 'Active';

-- Backfill: set existing profiles based on user.is_active flag
UPDATE employee_profiles ep
SET employee_status = CASE
    WHEN u.is_active = true THEN 'Active'
    ELSE 'Inactive'
END
FROM users u
WHERE ep.user_id = u.id
  AND ep.employee_status = 'Active'
  AND u.is_active = false;
