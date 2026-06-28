-- ================================================
-- V27: ATTENDANCE MODULE TABLES
-- Employees, daily attendance, salary details
-- These are HR staff (may not have system logins)
-- ================================================

-- ── Attendance Employees ─────────────────────────────────────────
-- Separate from users table — covers non-system-login staff
-- (Management, Operators, etc.)
CREATE TABLE attendance_employees (
    id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50)  NOT NULL
        CHECK (category IN (
            'Admin', 'Employee', 'Team Leader', 'Manager',
            'Senior Operator', 'Operator', 'Coordinator'
        )),
    gpay_number VARCHAR(20),
    base_salary NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_att_emp_category
    ON attendance_employees(category)
    WHERE is_active = TRUE;

COMMENT ON TABLE attendance_employees IS
    'HR attendance staff list — may not have system login accounts';
COMMENT ON COLUMN attendance_employees.sort_order IS
    'Display order in attendance grid';

-- ── Daily Attendance Records ─────────────────────────────────────
-- One row per employee per date
-- status: P=Present, A=Absent, H=Half Day, PH=Paid Holiday, WO=Week Off
CREATE TABLE attendance_records (
    id              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id     UUID NOT NULL
        REFERENCES attendance_employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status          VARCHAR(2) NOT NULL DEFAULT ''
        CHECK (status IN ('P', 'A', 'H', 'PH', 'WO', '')),
    marked_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_att_record UNIQUE (employee_id, attendance_date)
);

CREATE INDEX idx_att_records_emp_date
    ON attendance_records(employee_id, attendance_date);

CREATE INDEX idx_att_records_date
    ON attendance_records(attendance_date);

COMMENT ON TABLE attendance_records IS
    'One row per employee per date. Empty status = not yet marked';
COMMENT ON COLUMN attendance_records.status IS
    'P=Present A=Absent H=Half Day PH=Paid Holiday WO=Week Off empty=not marked';

-- ── Monthly Salary Details ───────────────────────────────────────
-- Per employee per month: incentive, advance, salary status
-- base_salary stored here overrides employee.base_salary for that month
CREATE TABLE attendance_salary_details (
    id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL
        REFERENCES attendance_employees(id) ON DELETE CASCADE,
    year        SMALLINT NOT NULL,
    month       SMALLINT NOT NULL CHECK (month BETWEEN 0 AND 11),
    base_salary NUMERIC(10,2),
    incentive   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    advance     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    -- credited | pending | wip
    salary_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (salary_status IN ('credited', 'pending', 'wip')),
    is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_salary_detail UNIQUE (employee_id, year, month)
);

CREATE INDEX idx_salary_emp_year_month
    ON attendance_salary_details(employee_id, year, month);

COMMENT ON TABLE attendance_salary_details IS
    'Per-employee per-month salary overrides, incentives, advance deductions';
COMMENT ON COLUMN attendance_salary_details.base_salary IS
    'NULL = use employee.base_salary; set to override for this month only';
COMMENT ON COLUMN attendance_salary_details.is_hidden IS
    'When true, salary columns show — in summary view';
