-- ================================================
-- V32: LEAVE BALANCES TABLE
-- ================================================
CREATE TABLE leave_balances (
    id               UUID    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id          UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type_id    UUID    NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year             SMALLINT NOT NULL,
    total_allocated  NUMERIC(5,1) NOT NULL DEFAULT 0,
    used             NUMERIC(5,1) NOT NULL DEFAULT 0,
    pending          NUMERIC(5,1) NOT NULL DEFAULT 0,
    carried_forward  NUMERIC(5,1) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leave_balance UNIQUE (user_id, leave_type_id, year)
);

CREATE INDEX idx_lb_user_year ON leave_balances(user_id, year);

COMMENT ON TABLE leave_balances IS
    'Leave balance per user per leave type per year. available = total_allocated + carried_forward - used - pending';

