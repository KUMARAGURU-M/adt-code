-- ================================================
-- V13: USER ROLE ASSIGNMENTS TABLE
-- Junction: User <-> Role (M:M) - supports multi-role
-- ================================================

CREATE TABLE user_role_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role_assignments UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_role_user_id
    ON user_role_assignments(user_id);

COMMENT ON TABLE user_role_assignments IS 'Multi-role support - Team Leader can also be Employee';