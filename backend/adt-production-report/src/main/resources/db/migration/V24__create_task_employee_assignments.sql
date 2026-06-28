-- ================================================
-- V24: TASK EMPLOYEE ASSIGNMENTS TABLE
-- Junction: Task <-> Employee
-- Individual page allocation and completion tracking
-- ================================================

CREATE TABLE task_employee_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_pages INTEGER,
    pages_completed INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_task_employee_assignments UNIQUE (task_id, user_id)
);

CREATE INDEX idx_tea_user_id
    ON task_employee_assignments(user_id);

CREATE INDEX idx_tea_task_id
    ON task_employee_assignments(task_id);

CREATE INDEX idx_tea_user_status
    ON task_employee_assignments(user_id, status);

COMMENT ON TABLE task_employee_assignments IS
    'Employee list in Add Task modal maps directly to rows in this table';

COMMENT ON COLUMN task_employee_assignments.pages_completed IS
    'Running total - updated on each Stop Timer';

COMMENT ON COLUMN task_employee_assignments.status IS
    'Valid values: Pending | In Progress | Completed';