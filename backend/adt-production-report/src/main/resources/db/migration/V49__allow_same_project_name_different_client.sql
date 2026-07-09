-- Drop the old global unique index on project name
DROP INDEX IF EXISTS idx_projects_name;

-- Create composite unique index per client
CREATE UNIQUE INDEX idx_projects_name_client
    ON projects(name, client_id)
    WHERE client_id IS NOT NULL AND deleted_at IS NULL;

-- Create unique index for projects with no client
CREATE UNIQUE INDEX idx_projects_name_null_client
    ON projects(name)
    WHERE client_id IS NULL AND deleted_at IS NULL;
