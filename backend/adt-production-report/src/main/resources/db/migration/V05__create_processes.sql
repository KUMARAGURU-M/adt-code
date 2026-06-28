-- ================================================
-- V05: PROCESSES TABLE
-- Production process types - EPUB-Tagging, XML-Tagging etc
-- ================================================

CREATE TABLE processes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_processes_name UNIQUE (name)
);

CREATE INDEX idx_processes_is_active ON processes(is_active);

COMMENT ON TABLE processes IS 'Global production process types used in tasks and workwise';