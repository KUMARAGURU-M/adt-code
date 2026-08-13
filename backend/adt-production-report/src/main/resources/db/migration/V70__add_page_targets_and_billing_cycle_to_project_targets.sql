-- V70__add_page_targets_and_billing_cycle_to_project_targets.sql
ALTER TABLE project_targets
ADD COLUMN billing_cycle_start_date DATE,
ADD COLUMN billing_cycle_end_date DATE,
ADD COLUMN target_pages_simple INT DEFAULT 0,
ADD COLUMN target_pages_medium INT DEFAULT 0,
ADD COLUMN target_pages_complex INT DEFAULT 0,
ADD COLUMN target_pages_heavy_complex INT DEFAULT 0,
ADD COLUMN target_pages_total INT DEFAULT 0;
