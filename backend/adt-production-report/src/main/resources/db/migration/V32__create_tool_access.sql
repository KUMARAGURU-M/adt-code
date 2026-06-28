-- ================================================
-- V32: TOOL ACCESS TABLE
-- Junction: User <-> Tool with access control
-- Default state is Denied - explicit grant required
-- ================================================

CREATE TABLE tool_access (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access VARCHAR(20) NOT NULL DEFAULT 'Denied'
        CHECK (access IN ('Granted', 'Denied')),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tool_access UNIQUE (tool_id, user_id)
);

CREATE INDEX idx_tool_access_user
    ON tool_access(user_id);

COMMENT ON TABLE tool_access IS 'Default state is Denied. Admin must explicitly Grant access';