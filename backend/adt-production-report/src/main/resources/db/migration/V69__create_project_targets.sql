-- ================================================
-- V69: PROJECT TARGETS TABLE & PERMISSIONS
-- Targets to monitor monthly and weekly book output
-- ================================================

CREATE TABLE project_targets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    monthly_target_books INT NOT NULL DEFAULT 0,
    weekly_target_books INT NOT NULL DEFAULT 0,
    week1_target_books INT NOT NULL DEFAULT 0,
    week2_target_books INT NOT NULL DEFAULT 0,
    week3_target_books INT NOT NULL DEFAULT 0,
    week4_target_books INT NOT NULL DEFAULT 0,
    week5_target_books INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_project_year_month UNIQUE (project_id, year, month)
);

-- Register permissions
INSERT INTO permissions (resource, action, code, description)
VALUES
    ('monthly_targets', 'view', 'monthly_targets.view', 'View the Monthly Target page'),
    ('monthly_targets', 'manage', 'monthly_targets.manage', 'Manage Project Targets')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
  AND p.code IN ('monthly_targets.view', 'monthly_targets.manage')
ON CONFLICT DO NOTHING;
