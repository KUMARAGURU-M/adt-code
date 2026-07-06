-- ================================================
-- V38: ACTIVITY LOGS TABLE
-- Full audit trail - append only, never update/delete
-- ================================================

CREATE TABLE activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL
        CHECK (action IN ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE',
                          'APPROVE', 'REJECT', 'IMPERSONATE', 'EXPORT',
                          'BULK_IMPORT', 'BREAK_START', 'BREAK_END',
                          'PASSWORD_RESET', 'TASK_START', 'TASK_STOP')),
    entity_type VARCHAR(60),
    entity_id UUID,
    entity_label VARCHAR(200),
    changes TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_date
    ON activity_logs(user_id, created_at DESC);

-- BRIN for date range audit queries
CREATE INDEX idx_activity_logs_date_brin
    ON activity_logs USING BRIN(created_at);

COMMENT ON TABLE activity_logs IS 'Append-only audit trail - no UPDATE or DELETE ever';
COMMENT ON COLUMN activity_logs.changes IS 'JSON diff: {field: {old: ..., new: ...}} for UPDATE events';
