-- ================================================
-- V07: USERS TABLE
-- Core authentication table - self-referential FK
-- role column intentionally removed - RBAC handled
-- exclusively via user_role_assignments (V13)
-- ================================================

CREATE TABLE users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_code VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_email
    ON users(email)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_users_user_code
    ON users(user_code);

CREATE INDEX idx_users_is_active
    ON users(is_active)
    WHERE deleted_at IS NULL;

COMMENT ON TABLE users IS 'Auth table only. Role determined exclusively via user_role_assignments';
COMMENT ON COLUMN users.user_code IS 'Human-readable ID shown in Add User form e.g. 6';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash cost 12. Never returned in API responses';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete - NULL means active record';