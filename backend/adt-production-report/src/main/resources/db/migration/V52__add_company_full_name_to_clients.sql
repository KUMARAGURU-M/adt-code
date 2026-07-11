-- ================================================
-- V52: ADD COMPANY FULL NAME TO CLIENTS
-- ================================================

ALTER TABLE clients ADD COLUMN company_full_name VARCHAR(300);
UPDATE clients SET company_full_name = company_name;
