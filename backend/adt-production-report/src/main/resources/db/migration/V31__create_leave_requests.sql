-- ================================================
-- V31: LEAVE REQUESTS TABLE
-- ================================================
CREATE TABLE leave_requests (
    id              UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id   UUID        NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    approver_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    start_date      DATE        NOT NULL,
    end_date        DATE        NOT NULL,
    days            NUMERIC(4,1) NOT NULL DEFAULT 1,
    reason          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending','Approved','Rejected','Cancelled')),
    admin_note      TEXT,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lr_user_id     ON leave_requests(user_id);
CREATE INDEX idx_lr_status      ON leave_requests(status);
CREATE INDEX idx_lr_start_date  ON leave_requests(start_date);
CREATE INDEX idx_lr_leave_type  ON leave_requests(leave_type_id);

COMMENT ON TABLE leave_requests IS
    'Employee leave applications — status: Pending/Approved/Rejected/Cancelled';
