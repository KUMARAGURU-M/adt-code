-- ================================================
-- V46: ADD PRODUCTION COLUMNS TO JOBS TABLE
-- ================================================

ALTER TABLE jobs ADD COLUMN process_status VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE jobs ADD COLUMN qc_status VARCHAR(30) NOT NULL DEFAULT 'PENDING';
ALTER TABLE jobs ADD COLUMN end_date DATE;

-- Add check constraints for process_status and qc_status values
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_process_status
    CHECK (process_status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY'));

ALTER TABLE jobs ADD CONSTRAINT chk_jobs_qc_status
    CHECK (qc_status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY'));
