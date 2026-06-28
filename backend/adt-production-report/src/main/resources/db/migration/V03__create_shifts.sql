-- ================================================
-- V03: SHIFTS TABLE
-- Shift definitions - 1st, 2nd, Night, General
-- ================================================

CREATE TABLE shifts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    start_time TIME,
    end_time TIME,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shifts_name UNIQUE (name)
);

CREATE INDEX idx_shifts_is_active ON shifts(is_active);

COMMENT ON TABLE shifts IS 'Shift definitions - 1st Shift, 2nd Shift, Night Shift, General Shift';