-- V72: Add qc_employee_names column to jobs table for manual QC employee tracking
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS qc_employee_names TEXT;
