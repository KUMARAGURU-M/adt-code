-- ================================================
-- V02: PERMISSIONS TABLE
-- Granular permission atoms for RBAC
-- ================================================

CREATE TABLE permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    resource VARCHAR(60) NOT NULL,
    action VARCHAR(40) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_permissions_code UNIQUE (code)
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_is_active ON permissions(is_active);

COMMENT ON TABLE permissions IS 'Granular permission atoms - resource.action format';
COMMENT ON COLUMN permissions.code IS 'Composite code e.g. employees.view, jobs.bulk_import';
COMMENT ON COLUMN permissions.resource IS 'Resource: employees, projects, jobs, tasks, timelogs, attendance, leaves, reports, invoices, roles, shifts, tools, activity_logs';
COMMENT ON COLUMN permissions.action IS 'Action: view, create, update, delete, approve, export, bulk_import, manage_roles, manage_types';