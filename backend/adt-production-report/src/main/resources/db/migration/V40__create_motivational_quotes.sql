-- ================================================
-- V40: MOTIVATIONAL QUOTES TABLE
-- Login page rotating quotes
-- ================================================

CREATE TABLE motivational_quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_text TEXT NOT NULL,
    author VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_motivational_quotes_active
    ON motivational_quotes(is_active, sort_order)
    WHERE is_active = TRUE;

COMMENT ON TABLE motivational_quotes IS 'Admin manages via Settings -> Manage Quotes';