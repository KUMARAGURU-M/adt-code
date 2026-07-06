-- ================================================
-- V17: USER PROJECT ASSIGNMENTS TABLE
-- Junction: User <-> Project
-- Controls WorkWise project dropdown per employee
-- ================================================

CREATE TABLE user_project_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_project_assignments UNIQUE (user_id, project_id)
);

CREATE INDEX idx_upa_user_id
    ON user_project_assignments(user_id);

CREATE INDEX idx_upa_project_id
    ON user_project_assignments(project_id);

COMMENT ON TABLE user_project_assignments IS 'Controls which projects appear in employee WorkWise dropdown';
