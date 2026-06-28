-- ================================================
-- V09: EMPLOYEE PROFILES TABLE
-- HR/People data - separate from auth for security
-- ================================================

CREATE TABLE employee_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    timezone VARCHAR(60) NOT NULL DEFAULT 'Asia/Kolkata',
    joining_date DATE,
    profile_photo_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    kyc_document_id UUID REFERENCES media_files(id) ON DELETE SET NULL,
    is_top_performer BOOLEAN NOT NULL DEFAULT FALSE,
    show_calendar_stats BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_employee_profiles_user_id UNIQUE (user_id)
);

CREATE INDEX idx_emp_profiles_user_id
    ON employee_profiles(user_id);

CREATE INDEX idx_emp_profiles_top_performer
    ON employee_profiles(is_top_performer)
    WHERE is_top_performer = TRUE;

COMMENT ON TABLE employee_profiles IS 'HR profile data separate from auth for security by design';
COMMENT ON COLUMN employee_profiles.is_top_performer IS 'Shows star badge - top performers displayed on login page';