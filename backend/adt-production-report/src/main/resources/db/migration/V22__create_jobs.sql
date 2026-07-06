-- ================================================
-- V22: JOBS TABLE
-- Books/Jobs received from clients (core unit)
-- ================================================

CREATE TABLE jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    job_id_code VARCHAR(60) NOT NULL,
    xml_isbn VARCHAR(50),
    title_name VARCHAR(500) NOT NULL,
    page_count INTEGER,
    language VARCHAR(50),
    employee_names TEXT,
    number_of_chapters INTEGER,
    pdf_input_type VARCHAR(50),
    complexity VARCHAR(30)
        CHECK (complexity IN ('Simple', 'Medium', 'Complex', 'Heavy Complex')),
    reference_type VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY')),
    file_status VARCHAR(30)
        CHECK (file_status IN ('UPLOADED', 'RTU', 'QUERY', 'HOLD')),
    upload_date DATE,
    billing_status VARCHAR(30) DEFAULT 'PENDING'
        CHECK (billing_status IN ('CREDITED', 'PENDING', 'INVOICED')),
    receive_date DATE,
    start_month DATE,
    end_month DATE,
    process_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (process_status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY')),
    qc_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (qc_status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY')),
    end_date DATE,
    import_batch_id UUID,
    import_metadata JSONB,
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL

    -- THE FIX: The hard UNIQUE constraint has been removed from here
);

-- THE FIX: Replaced with a Partial Unique Index that ignores soft-deleted rows
CREATE UNIQUE INDEX uq_active_jobs_project_code
    ON jobs (project_id, job_id_code)
    WHERE deleted_at IS NULL;

-- Standard Indexes
CREATE INDEX idx_jobs_project_status
    ON jobs(project_id, status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_jobs_billing_status
    ON jobs(billing_status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_jobs_receive_date
    ON jobs(receive_date);

CREATE INDEX idx_jobs_import_batch
    ON jobs(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- Table and Column Comments
COMMENT ON TABLE jobs IS 'Books/Jobs received from clients - core production unit';
COMMENT ON COLUMN jobs.import_batch_id IS 'Groups all rows from single bulk import - used for rollback';
COMMENT ON COLUMN jobs.import_metadata IS 'Custom field data from bulk import not mapping to standard columns';
