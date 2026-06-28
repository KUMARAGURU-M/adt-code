-- ================================================
-- V01: ROLES TABLE
-- Foundation table - no foreign keys
-- ================================================

CREATE TABLE roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE INDEX idx_roles_is_active ON roles(is_active);

COMMENT ON TABLE roles IS 'RBAC role definitions - Admin, Manager, Employee, Viewer, Team Leader';
COMMENT ON COLUMN roles.name IS 'Unique role name used throughout the system';