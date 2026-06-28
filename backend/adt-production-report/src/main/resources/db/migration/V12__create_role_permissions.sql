-- ================================================
-- V12: ROLE PERMISSIONS TABLE
-- Junction: Role <-> Permission (M:M)
-- ================================================

CREATE TABLE role_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id
    ON role_permissions(role_id);

CREATE INDEX idx_role_permissions_permission_id
    ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Standard RBAC junction - maps permissions to roles';