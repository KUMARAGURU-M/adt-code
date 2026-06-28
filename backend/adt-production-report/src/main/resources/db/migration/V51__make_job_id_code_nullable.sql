-- ================================================
-- V51: MAKE JOB ID CODE COLUMN NULLABLE
-- ================================================

ALTER TABLE jobs ALTER COLUMN job_id_code DROP NOT NULL;
