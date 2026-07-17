-- V57: Create user_permissions table for direct user-level permission grants
-- These supplement role-based permissions (union logic at login)

CREATE TABLE user_permissions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID      NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_permissions UNIQUE (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
