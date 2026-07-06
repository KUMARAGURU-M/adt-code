-- ================================================
-- V27: BREAK LOGS TABLE
-- Individual break sessions within a time log
-- ================================================

CREATE TABLE break_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    time_log_id UUID NOT NULL REFERENCES time_logs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    break_reason VARCHAR(50) NOT NULL
        CHECK (break_reason IN ('Tea Break', 'Lunch Break', 'Restroom', 'Other')),
    custom_reason TEXT,
    description TEXT,
    break_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    break_end TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_break_logs_time_log
    ON break_logs(time_log_id);

CREATE INDEX idx_break_logs_user
    ON break_logs(user_id, break_start);

COMMENT ON TABLE break_logs IS 'Individual break sessions - on break_end update time_logs.break_seconds = SUM(duration_seconds)';
COMMENT ON COLUMN break_logs.custom_reason IS 'Free text - only populated when break_reason = Other';
COMMENT ON COLUMN break_logs.duration_seconds IS 'Computed on break_end: EXTRACT(EPOCH FROM break_end - break_start)';
