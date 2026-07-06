-- ================================================
-- V21: SHIFT USER ASSIGNMENTS TABLE
-- Junction: Shift <-> User with full history
-- ================================================

CREATE TABLE shift_user_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shift_assignments_user
    ON shift_user_assignments(user_id, effective_to);

CREATE INDEX idx_shift_assignments_shift
    ON shift_user_assignments(shift_id);

COMMENT ON TABLE shift_user_assignments IS 'Shift history kept for audit. Current shift: WHERE user_id=:id AND effective_to IS NULL';
