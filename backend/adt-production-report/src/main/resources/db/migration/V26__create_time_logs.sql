-- ================================================
-- V26: TIME LOGS TABLE
-- Every work session Start Task -> Stop Task
-- Most queried table in the system
-- ================================================

CREATE TABLE time_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    process_id UUID REFERENCES processes(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    elapsed_seconds INTEGER NOT NULL DEFAULT 0,
    working_seconds INTEGER NOT NULL DEFAULT 0,
    break_seconds INTEGER NOT NULL DEFAULT 0,
    pages_completed INTEGER NOT NULL DEFAULT 0,
    mark_task_completed BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Running'
        CHECK (status IN ('Running', 'On Break', 'FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY')),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tl_user_date
    ON time_logs(user_id, log_date DESC);

CREATE INDEX idx_tl_project
    ON time_logs(project_id);

CREATE INDEX idx_tl_task
    ON time_logs(task_id);

-- Partial index for detecting active sessions
CREATE INDEX idx_tl_running
    ON time_logs(status)
    WHERE status = 'Running';

-- BRIN for date range scans in reports - much cheaper than BTREE
CREATE INDEX idx_tl_date_brin
    ON time_logs USING BRIN(log_date);

COMMENT ON TABLE time_logs IS 'Every work session - most queried table. Denormalised FKs are intentional for performance';
COMMENT ON COLUMN time_logs.working_seconds IS 'Actual productive seconds = elapsed_seconds - break_seconds';
COMMENT ON COLUMN time_logs.mark_task_completed IS 'If TRUE: sets task.status = Completed on stop';
