-- ================================================
-- V06: TOOLS TABLE
-- External tool definitions - Digital Converter, OCR
-- ================================================

CREATE TABLE tools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    description TEXT,
    tool_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tools_name UNIQUE (name)
);

COMMENT ON TABLE tools IS 'External tools - Digital Converter, OCR';