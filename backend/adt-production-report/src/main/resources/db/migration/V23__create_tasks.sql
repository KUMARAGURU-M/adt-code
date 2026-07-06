-- ================================================
-- V23: TASKS TABLE
-- Work assignments created by Admin/Manager
-- ================================================

CREATE TABLE tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    process_id UUID NOT NULL REFERENCES processes(id) ON DELETE RESTRICT,
    task_title VARCHAR(300),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY')),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    assigned_pages INTEGER,
    total_pages INTEGER,
    complexity VARCHAR(30)
        CHECK (complexity IN ('Simple', 'Medium', 'Complex', 'Heavy Complex')),
    chapter_article_batch VARCHAR(200),
    estimate_hours NUMERIC(6,2),
    server_path TEXT,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_status
    ON tasks(project_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_process_id
    ON tasks(process_id);

CREATE INDEX idx_tasks_due_date
    ON tasks(due_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_assigned_by
    ON tasks(assigned_by);

COMMENT ON TABLE tasks IS 'Work assignments - job_id removed, use task_job_assignments for multi-job support';
COMMENT ON COLUMN tasks.chapter_article_batch IS 'Chapter/Article/Batch label shown in WorkWise running screen';
COMMENT ON COLUMN tasks.server_path IS 'File/folder server path e.g. \\server\share\file.pdf';
