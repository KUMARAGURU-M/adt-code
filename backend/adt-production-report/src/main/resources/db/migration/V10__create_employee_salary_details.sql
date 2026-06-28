-- ================================================
-- V10: EMPLOYEE SALARY DETAILS TABLE
-- Finance/Payroll - Admin access only
-- ================================================

CREATE TABLE employee_salary_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    base_salary NUMERIC(12,2),
    gpay_number VARCHAR(20),
    salary_type VARCHAR(20) NOT NULL DEFAULT 'Monthly'
        CHECK (salary_type IN ('Monthly', 'Daily', 'Hourly')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_salary_details_user_id UNIQUE (user_id)
);

COMMENT ON TABLE employee_salary_details IS 'Financial data - service layer enforces Admin-only access';
COMMENT ON COLUMN employee_salary_details.base_salary IS 'Monthly INR base salary. NULL until set by admin';