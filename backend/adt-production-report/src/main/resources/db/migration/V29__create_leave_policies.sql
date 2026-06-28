CREATE TABLE leave_policies (
    id                    UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name                  VARCHAR(200) NOT NULL,
    description           TEXT,
    default_annual_days   INTEGER      NOT NULL DEFAULT 12,
    probation_days        INTEGER      NOT NULL DEFAULT 0,
    year_start_month      VARCHAR(20)  NOT NULL DEFAULT 'January',
    year_start_day        SMALLINT     NOT NULL DEFAULT 1,
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leave_policy_name UNIQUE (name)
);

COMMENT ON TABLE leave_policies IS 'Company leave policy definitions';