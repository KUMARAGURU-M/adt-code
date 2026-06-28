-- ================================================
-- V18: IMPORT FIELD MAPPINGS TABLE
-- Per-project bulk import column config
-- Each client sends Excel in different column order
-- ================================================

CREATE TABLE import_field_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    field_order JSONB NOT NULL DEFAULT '[]',
    required_fields JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_import_field_mappings_project UNIQUE (project_id)
);

COMMENT ON TABLE import_field_mappings IS 'Per-project bulk import column config - admin configures once via Settings button';
COMMENT ON COLUMN import_field_mappings.field_order IS 'Array of field names in client Excel column order e.g. ["receive_date","job_id_code","title_name"]';