-- ================================================
-- V29: ATTENDANCE SUMMARY TABLE
-- Monthly salary computation snapshot
-- is_locked prevents modification after salary credited
-- ================================================

CREATE TABLE attendance_summary (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    working_days INTEGER NOT NULL DEFAULT 0,
    present_days INTEGER NOT NULL DEFAULT 0,
    absent_days INTEGER NOT NULL DEFAULT 0,
    half_days INTEGER NOT NULL DEFAULT 0,
    paid_holidays INTEGER NOT NULL DEFAULT 0,
    week_offs INTEGER NOT NULL DEFAULT 0,
    days_for_wages NUMERIC(5,2) NOT NULL DEFAULT 0,
    base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    per_day_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    loss_of_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    incentive NUMERIC(12,2) NOT NULL DEFAULT 0,
    advance NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    salary_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (salary_status IN ('Pending', 'WIP', 'Credited')),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_summary_user_month UNIQUE (user_id, month)
);

CREATE INDEX idx_att_summary_user_month
    ON attendance_summary(user_id, month DESC);

CREATE INDEX idx_att_summary_status
    ON attendance_summary(salary_status);

CREATE INDEX idx_att_summary_locked
    ON attendance_summary(is_locked)
    WHERE is_locked = FALSE;

COMMENT ON TABLE attendance_summary IS
    'Stored as snapshot - base_salary may change month to month, historical payroll is immutable';
COMMENT ON COLUMN attendance_summary.days_for_wages IS
    'Formula: present + (half_days x 0.5) + paid_holidays';
COMMENT ON COLUMN attendance_summary.month IS
    'First day of month e.g. 2026-05-01';
COMMENT ON COLUMN attendance_summary.is_locked IS
    'TRUE after salary_status = Credited. Service layer blocks all updates when locked';
