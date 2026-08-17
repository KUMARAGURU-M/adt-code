-- ============================================================
-- V73: Add REVERT status options to check constraints in jobs table
-- ============================================================


ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY', 'REVERT'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_file_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_file_status_check 
    CHECK (file_status IN ('UPLOADED', 'RTU', 'QUERY', 'HOLD', 'REVERT'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_process_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_process_status_check 
    CHECK (process_status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY', 'REVERT'));

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_qc_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_qc_status_check 
    CHECK (qc_status IN ('FINISH', 'WIP', 'YTS', 'RTU', 'UPLOADED', 'PENDING', 'HOLD', 'QUERY', 'REVERT'));
