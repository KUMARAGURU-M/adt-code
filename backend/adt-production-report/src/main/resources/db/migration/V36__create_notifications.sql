-- ================================================
-- V36: NOTIFICATIONS TABLE
-- In-app notification system
-- ================================================

CREATE TABLE notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(40) NOT NULL
        CHECK (type IN ('TASK_ASSIGNED', 'LEAVE_APPROVED', 'LEAVE_REJECTED',
                        'SALARY_CREDITED', 'INVOICE_GENERATED', 'GENERAL')),
    entity_type VARCHAR(60),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index for fast unread count
CREATE INDEX idx_notifications_unread
    ON notifications(user_id, created_at DESC)
    WHERE is_read = FALSE;

COMMENT ON TABLE notifications IS 'Deliver via SSE endpoint. Badge count = COUNT WHERE is_read=FALSE';