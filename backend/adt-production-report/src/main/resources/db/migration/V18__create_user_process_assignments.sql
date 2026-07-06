-- ================================================
-- V18: USER PROCESS ASSIGNMENTS TABLE
-- Junction: User <-> Process
-- Controls WorkWise process dropdown per employee
-- ================================================

CREATE TABLE user_process_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_process_assignments UNIQUE (user_id, process_id)
);

CREATE INDEX idx_upra_user_id
    ON user_process_assignments(user_id);

COMMENT ON TABLE user_process_assignments IS 'Controls which processes appear in employee WorkWise dropdown';
