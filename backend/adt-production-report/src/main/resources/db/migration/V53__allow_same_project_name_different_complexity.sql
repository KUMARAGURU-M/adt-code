-- Drop the old unique indexes that only check name and client_id
DROP INDEX IF EXISTS idx_projects_name_client;
DROP INDEX IF EXISTS idx_projects_name_null_client;

-- Create new composite unique index per client & complexity level
CREATE UNIQUE INDEX idx_projects_name_client_complexity
    ON projects(name, client_id, complexity_level)
    WHERE client_id IS NOT NULL AND deleted_at IS NULL;

-- Create new composite unique index for projects with no client & complexity level
CREATE UNIQUE INDEX idx_projects_name_null_client_complexity
    ON projects(name, complexity_level)
    WHERE client_id IS NULL AND deleted_at IS NULL;
