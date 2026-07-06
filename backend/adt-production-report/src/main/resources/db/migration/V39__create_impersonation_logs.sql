-- ================================================
-- V39: IMPERSONATION LOGS TABLE
-- Admin impersonation session tracking
-- ================================================

CREATE TABLE impersonation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_impersonation_admin
    ON impersonation_logs(admin_id, started_at DESC);

COMMENT ON TABLE impersonation_logs IS 'All actions during impersonation also logged in activity_logs';
