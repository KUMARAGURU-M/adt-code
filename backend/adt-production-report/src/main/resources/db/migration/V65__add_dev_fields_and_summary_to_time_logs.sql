-- V65: ADD DEVELOPER FIELDS AND SUMMARY TO TIME LOGS
-- Allow storing developer task and project references, and work session summaries.
-- Uses IF NOT EXISTS so this migration is safe to re-run if columns were added manually.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name = 'dev_task_id') THEN
        ALTER TABLE time_logs ADD COLUMN dev_task_id UUID REFERENCES dev_tasks(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name = 'dev_project_id') THEN
        ALTER TABLE time_logs ADD COLUMN dev_project_id UUID REFERENCES dev_projects(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_logs' AND column_name = 'summary') THEN
        ALTER TABLE time_logs ADD COLUMN summary TEXT;
    END IF;
END $$;

COMMENT ON COLUMN time_logs.dev_task_id IS 'Reference to the developer task (dev_tasks table) if logged-in user is a developer';
COMMENT ON COLUMN time_logs.dev_project_id IS 'Reference to the developer project (dev_projects table) if logged-in user is a developer';
COMMENT ON COLUMN time_logs.summary IS 'Developer session notes/summary of completed work';
