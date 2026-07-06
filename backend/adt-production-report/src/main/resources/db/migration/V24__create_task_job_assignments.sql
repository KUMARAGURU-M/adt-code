-- ================================================
-- V24: TASK JOB ASSIGNMENTS TABLE
-- Junction: Task <-> Job (multi-job per task)
-- Replaces old tasks.job_id single FK
-- ================================================

CREATE TABLE task_job_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    assigned_pages INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_task_job_assignments UNIQUE (task_id, job_id)
);

CREATE INDEX idx_tja_task_id
    ON task_job_assignments(task_id);

CREATE INDEX idx_tja_job_id
    ON task_job_assignments(job_id);

COMMENT ON TABLE task_job_assignments IS 'Multi-job per task support - enables Select All checkbox in Add Task modal';
