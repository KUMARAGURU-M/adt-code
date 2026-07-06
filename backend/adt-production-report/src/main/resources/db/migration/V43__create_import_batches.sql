-- ================================================
-- V43: CREATE import_batches TABLE
-- Tracks every bulk import for rollback and audit
-- ================================================

CREATE TABLE import_batches (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    total_rows INTEGER NOT NULL DEFAULT 0,
    successful_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Processing'
        CHECK (status IN ('Processing', 'Completed', 'Failed', 'Rolled Back')),
    error_details JSONB,
    field_mapping_used JSONB,
    is_rolled_back BOOLEAN NOT NULL DEFAULT FALSE,
    rolled_back_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rolled_back_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_batches_project
    ON import_batches(project_id, created_at DESC);

CREATE INDEX idx_import_batches_status
    ON import_batches(status);

-- Add FK from jobs to import_batches now that table exists
ALTER TABLE jobs
    ADD CONSTRAINT fk_jobs_import_batch
    FOREIGN KEY (import_batch_id)
    REFERENCES import_batches(id)
    ON DELETE SET NULL;

-- Trigger must be here because table is created here
CREATE TRIGGER trg_import_batches
    BEFORE UPDATE ON import_batches
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

COMMENT ON TABLE import_batches IS
'Every bulk import creates one batch. Jobs link back via import_batch_id for rollback';
COMMENT ON COLUMN import_batches.field_mapping_used IS
'Snapshot of import_field_mappings.field_order at time of import';
COMMENT ON COLUMN import_batches.error_details IS
'Array of {row, field, error} objects for failed rows';
