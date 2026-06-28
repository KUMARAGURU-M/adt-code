-- ================================================
-- V04: LEAVE TYPES TABLE
-- Leave type definitions - AL, SL, CL etc
-- ================================================
CREATE TABLE leave_types (
    id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code              VARCHAR(10) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    max_days_per_year INTEGER,
    carry_forward     BOOLEAN     NOT NULL DEFAULT FALSE,
    requires_approval BOOLEAN     NOT NULL DEFAULT TRUE,
    is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leave_type_code UNIQUE (code)
);

CREATE INDEX idx_leave_types_active ON leave_types(is_active);

COMMENT ON TABLE leave_types IS 'AL=Annual Leave, SL=Sick Leave, CL=Casual Leave etc.';
