-- ================================================
-- V11: USER SESSIONS TABLE
-- JWT refresh token store and session management
-- ================================================

CREATE TABLE user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    impersonated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_sessions_refresh_token UNIQUE (refresh_token)
);

CREATE INDEX idx_user_sessions_user_active
    ON user_sessions(user_id, is_active);

CREATE INDEX idx_user_sessions_expires
    ON user_sessions(expires_at)
    WHERE is_active = TRUE;

COMMENT ON TABLE user_sessions IS 'JWT refresh tokens stored as SHA-256 hash - never raw';